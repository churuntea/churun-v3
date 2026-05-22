import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/supabase-admin';
import { sendAmbassadorReviewNotify } from '../ambassador-notify';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { application_id, action, notes, reviewed_by } = body;

    // ── 參數驗證 ──
    if (!application_id || !action) {
      return NextResponse.json(
        { success: false, message: '缺少必要參數：application_id 和 action 為必填' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, message: '無效的操作，僅支援 approve / reject' },
        { status: 400 }
      );
    }

    // ── 查詢申請記錄 ──
    const { data: application, error: appErr } = await supabaseAdmin
      .from('ambassador_applications')
      .select('*')
      .eq('id', application_id)
      .maybeSingle();

    if (appErr || !application) {
      return NextResponse.json(
        { success: false, message: '找不到此申請記錄' },
        { status: 404 }
      );
    }

    if (application.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: `此申請已被處理，目前狀態：${application.status}` },
        { status: 409 }
      );
    }

    const now = new Date();
    const reviewedAt = now.toISOString();

    let snapshotData = null;

    if (action === 'approve') {
      const { data: memberData } = await supabaseAdmin
        .from('members')
        .select('*')
        .eq('id', application.member_id)
        .maybeSingle();

      if (memberData) {
        snapshotData = {
          name: memberData.name,
          phone: memberData.phone,
          email: memberData.email,
          member_code: memberData.member_code,
          old_referral_code: memberData.referral_code,
          birthday: memberData.birthday,
          id_card_number: memberData.id_card_number,
          city: memberData.city,
          district: memberData.district,
          address: memberData.address,
          landline: memberData.landline,
          company: memberData.company,
          company_phone: memberData.company_phone,
          notes: memberData.notes,
          bank_code: memberData.bank_code,
          bank_account: memberData.bank_account,
          bank_account_name: memberData.bank_account_name,
          bank_branch: memberData.bank_branch,
          bank_card_photo_url: memberData.bank_card_photo_url,
          id_card_front: application.id_card_front, 
          id_card_back: application.id_card_back,
          remittance_photo: application.remittance_photo
        };
      }
    }

    // ── 更新申請記錄 ──
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const updatePayload: any = {
      status: newStatus,
      notes: notes || null,
      reviewed_by: reviewed_by || null,
      reviewed_at: reviewedAt,
    };

    if (snapshotData) {
      updatePayload.snapshot_data = snapshotData;
    }

    const { error: updateAppErr } = await supabaseAdmin
      .from('ambassador_applications')
      .update(updatePayload)
      .eq('id', application_id);

    if (updateAppErr) {
      console.error('[Ambassador Review] 更新申請記錄失敗:', updateAppErr);
      return NextResponse.json(
        { success: false, message: '更新申請記錄失敗，請稍後再試', error: updateAppErr.message },
        { status: 500 }
      );
    }

    // ── 根據審核結果更新會員資料 ──
    if (action === 'approve') {
      // 決定 ambassador_type
      let ambassadorType: string;
      if (application.application_type === 'partner') {
        ambassadorType = 'partner';
      } else {
        ambassadorType = application.application_type; // 'paid' or 'free'
      }

      // 計算到期日
      const expiresAt = new Date(now);
      if (application.application_type === 'paid' || application.application_type === 'partner') {
        // 付費品牌大使 / 合夥人：2 年
        expiresAt.setFullYear(expiresAt.getFullYear() + 2);
      } else {
        // 績效品牌大使：1 年
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      }

      // 產生新的經銷商編號
      const typeCode = application.application_type === 'partner' ? 'P' : 'A';
      const yearCode = String(new Date().getFullYear()).slice(-2);
      const monthCode = String(new Date().getMonth() + 1).padStart(2, '0');
      const prefix = `CR${yearCode}${typeCode}${monthCode}`;
      
      const { data: codeData, error: codeError } = await supabaseAdmin
        .from('members')
        .select('member_code')
        .like('member_code', `${prefix}%`);
      
      let nextSeq = 1;
      if (!codeError && codeData && codeData.length > 0) {
        let maxSeq = 0;
        for (const row of codeData) {
          const code = row.member_code || '';
          if (code.startsWith(prefix)) {
            const seqStr = code.slice(prefix.length);
            const seq = parseInt(seqStr, 10);
            if (!isNaN(seq) && seq > maxSeq) {
              maxSeq = seq;
            }
          }
        }
        nextSeq = maxSeq + 1;
      }
      
      const newMemberCode = `${prefix}${String(nextSeq).padStart(4, '0')}`;
      const newReferralCode = newMemberCode; // 通常 referral_code 同 member_code
      
      const { error: updateMemberErr } = await supabaseAdmin
        .from('members')
        .update({
          ambassador_status: 'active',
          ambassador_type: ambassadorType,
          ambassador_since: reviewedAt,
          ambassador_expires_at: expiresAt.toISOString(),
          tier: '初潤品牌大使',
          member_code: newMemberCode,
          referral_code: newReferralCode
        })
        .eq('id', application.member_id);

      if (updateMemberErr) {
        console.error('[Ambassador Review] 更新會員大使資料失敗:', updateMemberErr);
        return NextResponse.json(
          { success: false, message: '更新會員資料失敗，請稍後再試', error: updateMemberErr.message },
          { status: 500 }
        );
      }

      // 發送核准通知
      await sendAmbassadorReviewNotify(application.member_id, true, notes, application.application_type);

      return NextResponse.json({
        success: true,
        message: '申請已核准，會員品牌大使身份已生效',
        data: {
          application_id,
          status: 'approved',
          ambassador_type: ambassadorType,
          ambassador_since: reviewedAt,
          ambassador_expires_at: expiresAt.toISOString(),
        },
      });

    } else {
      // ── 駁回：清除 ambassador_status，允許重新申請 ──
      const { error: updateMemberErr } = await supabaseAdmin
        .from('members')
        .update({ ambassador_status: null })
        .eq('id', application.member_id);

      if (updateMemberErr) {
        console.error('[Ambassador Review] 清除會員大使狀態失敗:', updateMemberErr);
      }

      // 發送駁回通知
      await sendAmbassadorReviewNotify(application.member_id, false, notes, application.application_type);

      return NextResponse.json({
        success: true,
        message: '申請已駁回，會員可重新提交申請',
        data: {
          application_id,
          status: 'rejected',
          notes: notes || null,
        },
      });
    }

  } catch (err) {
    console.error('[Ambassador Review] 處理審核時發生錯誤:', err);
    return NextResponse.json(
      { success: false, message: '系統錯誤，請稍後再試' },
      { status: 500 }
    );
  }
}
