import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

const DEFAULT_UPLINE_NAME = '洪召安';

export async function POST(request: Request) {
  try {
    const { lineUserId, displayName, pictureUrl, phone, referralCode } = await request.json();

    if (!lineUserId || !phone) {
      return NextResponse.json({ success: false, error: '缺少必要參數 (lineUserId 或 phone)' }, { status: 400 });
    }

    const trimmedPhone = phone.trim();

    // 1. 檢查手機號碼是否已被其他會員註冊過
    const { data: existingMember, error: findError } = await supabase
      .from('members')
      .select('*')
      .eq('phone', trimmedPhone)
      .maybeSingle();

    if (findError) {
      console.error('查詢已存在會員出錯:', findError);
      return NextResponse.json({ success: false, error: '資料庫讀取異常' }, { status: 500 });
    }

    if (existingMember) {
      // ======= 情況 A：手機已被註冊過 ➔ 直接「綁定 LINE 帳號」並完成登入！ =======
      const { error: updateError } = await supabase
        .from('members')
        .update({
          line_id: lineUserId,
          avatar_url: existingMember.avatar_url || pictureUrl
        })
        .eq('id', existingMember.id);

      if (updateError) {
        console.error('更新 LINE ID 失敗:', updateError);
        return NextResponse.json({ success: false, error: '綁定 LINE 帳戶失敗' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        status: 'linked',
        memberId: existingMember.id,
        memberName: existingMember.name,
        member: {
          id: existingMember.id,
          name: existingMember.name,
          phone: existingMember.phone,
          tier: existingMember.tier,
          member_code: existingMember.member_code,
          is_b2b: existingMember.is_b2b,
          avatar_url: existingMember.avatar_url || pictureUrl
        }
      });
    }

    // ======= 情況 B：新手機號碼 ➔ 建立全新 B2C 會員 ➔ 自動綁定 LINE！ =======
    const memberCode = `CR26M${Math.floor(100000 + Math.random() * 900000)}`;
    const myReferralCode = memberCode;

    let uplineId = null;
    const refCode = referralCode?.trim().toUpperCase();

    if (refCode) {
      // 尋找指定的推薦人
      const { data: upline } = await supabase
        .from('members')
        .select('id')
        .or(`referral_code.eq.${refCode},member_code.eq.${refCode}`)
        .maybeSingle();

      if (upline) {
        uplineId = upline.id;
      }
    }

    // 若未填推薦碼或找不到，自動歸入預設推薦人
    if (!uplineId) {
      const { data: defaultUpline } = await supabase
        .from('members')
        .select('id')
        .eq('name', DEFAULT_UPLINE_NAME)
        .maybeSingle();

      if (defaultUpline) {
        uplineId = defaultUpline.id;
      }
    }

    const insertData: any = {
      name: displayName || '初潤會員',
      phone: trimmedPhone,
      line_id: lineUserId,
      avatar_url: pictureUrl || 'https://i.ibb.co/6R2M5X1/churun-baby.png',
      referral_code: myReferralCode,
      member_code: memberCode,
      tier: '初潤寶寶',
      is_b2b: false,
      lifetime_spend: 0,
      quarterly_spend: 0,
      points_balance: 0,
      virtual_balance: 0
    };

    if (uplineId) insertData.upline_id = uplineId;

    const { data: newMember, error: insertError } = await supabase
      .from('members')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('建立新會員失敗:', insertError);
      return NextResponse.json({ success: false, error: `建立會員帳戶失敗: ${insertError.message}` }, { status: 500 });
    }

    // 🎁 自動發放 WELCOME100 迎新折價券到其庫存 (比照原本註冊)
    try {
      // 查詢所有以 NEW_ 開頭的優惠券，以及舊有的 WELCOME100
      const { data: welcomeCoupons } = await supabase
        .from('coupons')
        .select('id, name')
        .or('code.ilike.NEW_%,code.eq.WELCOME100');

      if (welcomeCoupons && welcomeCoupons.length > 0) {
        const insertRows = welcomeCoupons.map(c => ({
          member_id: newMember.id,
          coupon_id: c.id,
          is_used: false
        }));

        await supabase.from('member_coupons').insert(insertRows);

        // 發送獲得優惠券的通知
        const namesList = welcomeCoupons.map(c => `【${c.name}】`).join('、');
        await supabase.from('notifications').insert({
          member_id: newMember.id,
          title: '🎁 獲得新會員專屬迎新禮包！',
          content: `恭喜您獲得 ${namesList}！已存入您的個人券包，快到商城體驗吧！`,
          type: 'system'
        });
      }
    } catch (couponErr) {
      console.error('自動發送迎新券失敗:', couponErr);
    }

    return NextResponse.json({
      success: true,
      status: 'created',
      memberId: newMember.id,
      memberName: newMember.name,
      member: {
        id: newMember.id,
        name: newMember.name,
        phone: newMember.phone,
        tier: newMember.tier,
        member_code: newMember.member_code,
        is_b2b: newMember.is_b2b,
        avatar_url: newMember.avatar_url
      }
    });
  } catch (error: any) {
    console.error('LINE 註冊綁定異常:', error);
    return NextResponse.json({ success: false, error: error.message || '內部處理錯誤' }, { status: 500 });
  }
}
