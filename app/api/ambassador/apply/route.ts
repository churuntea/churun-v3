import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/supabase-admin';
import { sendAmbassadorApplicationNotify } from '../ambassador-notify';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      member_id, application_type, last_five, remittance_photo, id_card_front, id_card_back,
      birthday, id_card_number, city, district, address, landline, company, company_phone, notes, email 
    } = body;

    // ── 參數驗證 ──
    if (!member_id || !application_type) {
      return NextResponse.json(
        { success: false, message: '缺少必要參數：member_id 和 application_type 為必填' },
        { status: 400 }
      );
    }
    
    if (!id_card_number || !birthday || !city || !district || !address) {
      return NextResponse.json(
        { success: false, message: '詳細個人資料（生日、身分證字號、地址）為必填項目' },
        { status: 400 }
      );
    }
    
    if (!id_card_front || !id_card_back) {
      return NextResponse.json(
        { success: false, message: '身分證正反面照片為必填項目' },
        { status: 400 }
      );
    }

    const validTypes = ['paid', 'free', 'partner'];
    if (!validTypes.includes(application_type)) {
      return NextResponse.json(
        { success: false, message: '無效的申請類型，僅支援 paid / free / partner' },
        { status: 400 }
      );
    }

    // ── 驗證會員存在 ──
    const { data: member, error: memberErr } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('id', member_id)
      .maybeSingle();

    if (memberErr || !member) {
      return NextResponse.json(
        { success: false, message: '找不到此會員，請確認 member_id 是否正確' },
        { status: 404 }
      );
    }

    // ── 檢查是否有待審核的申請 ──
    const { data: pendingApp } = await supabaseAdmin
      .from('ambassador_applications')
      .select('id')
      .eq('member_id', member_id)
      .eq('status', 'pending')
      .maybeSingle();

    if (pendingApp) {
      return NextResponse.json(
        { success: false, message: '您已有一筆待審核的申請，請耐心等候審核結果' },
        { status: 409 }
      );
    }

    // ── 計算費用與績效資格 ──
    let amount = 0;
    let freePerformanceTotal: number | null = null;

    if (application_type === 'paid') {
      amount = 98000;
    } else if (application_type === 'partner') {
      amount = 298000;
    } else if (application_type === 'free') {
      // 績效品牌大使：(本人累計消費 / 2) + (直推團隊累計消費 / 2) >= 300,000
      const memberSpend = member.lifetime_spend || 0;

      // 查詢直推團隊（upline_id = member_id）的累計消費總額
      const { data: referrals } = await supabaseAdmin
        .from('members')
        .select('lifetime_spend')
        .eq('upline_id', member_id);

      const referralTotal = (referrals || []).reduce(
        (sum: number, r: { lifetime_spend: number | null }) => sum + (r.lifetime_spend || 0),
        0
      );

      freePerformanceTotal = (memberSpend / 2) + (referralTotal / 2);

      if (freePerformanceTotal < 300000) {
        return NextResponse.json(
          {
            success: false,
            message: `績效品牌大使資格不足。目前績效總額：${freePerformanceTotal.toLocaleString()} 元（需達 300,000 元）`,
            details: {
              member_spend: memberSpend,
              referral_total: referralTotal,
              performance_total: freePerformanceTotal,
              required: 300000,
            }
          },
          { status: 400 }
        );
      }

      amount = 0; // 免費，無須付費
    }

    // ── 寫入申請記錄 ──
    const insertData: Record<string, unknown> = {
      member_id,
      application_type,
      amount,
      status: 'pending',
      last_five: last_five || null,
      remittance_photo: remittance_photo || null,
      id_card_front,
      id_card_back,
    };

    if (application_type === 'free') {
      insertData.free_performance_total = freePerformanceTotal;
    }

    const { data: application, error: insertErr } = await supabaseAdmin
      .from('ambassador_applications')
      .insert(insertData)
      .select()
      .single();

    if (insertErr) {
      console.error('[Ambassador Apply] 寫入申請記錄失敗:', insertErr);
      return NextResponse.json(
        { success: false, message: '申請送出失敗，請稍後再試', error: insertErr.message },
        { status: 500 }
      );
    }

    // ── 更新會員狀態為 pending 及最新個人資料 ──
    const { error: updateErr } = await supabaseAdmin
      .from('members')
      .update({ 
        ambassador_status: 'pending',
        birthday: birthday || null,
        id_card_number: id_card_number || null,
        email: email || null,
        city: city || null,
        district: district || null,
        address: address || null,
        landline: landline || null,
        company: company || null,
        company_phone: company_phone || null,
        notes: notes || null
      })
      .eq('id', member_id);

    if (updateErr) {
      console.error('[Ambassador Apply] 更新會員狀態失敗:', updateErr);
    }

    // ── 發送通知 ──
    await sendAmbassadorApplicationNotify(member_id, application_type);

    // ── 回傳成功 ──
    const typeNames: Record<string, string> = {
      paid: '付費品牌大使',
      free: '績效品牌大使',
      partner: '合夥人',
    };

    return NextResponse.json({
      success: true,
      message: `${typeNames[application_type]}申請已成功送出，我們將在 3-5 個工作日內完成審核`,
      data: application,
    });

  } catch (err) {
    console.error('[Ambassador Apply] 處理申請時發生錯誤:', err);
    return NextResponse.json(
      { success: false, message: '系統錯誤，請稍後再試' },
      { status: 500 }
    );
  }
}
