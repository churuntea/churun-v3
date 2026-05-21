import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

const DEFAULT_UPLINE_NAME = '洪召安';

export async function POST(request: Request) {
  try {
    const { googleId, displayName, pictureUrl, phone, referralCode } = await request.json();

    if (!googleId || !phone) {
      return NextResponse.json({ success: false, error: '缺少必要參數 (googleId 或 phone)' }, { status: 400 });
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
      // ======= 情況 A：手機已被註冊過 ➔ 直接「綁定 Google 帳號」並完成登入！ =======
      if (existingMember.google_id && existingMember.google_id !== googleId) {
        return NextResponse.json({ success: false, error: '該手機號碼已綁定其他 Google 帳號，無法覆蓋。' }, { status: 403 });
      }

      const { error: updateError } = await supabase
        .from('members')
        .update({
          google_id: googleId,
          avatar_url: existingMember.avatar_url || pictureUrl
        })
        .eq('id', existingMember.id);

      if (updateError) {
        console.error('更新 Google ID 失敗:', updateError);
        return NextResponse.json({ success: false, error: '綁定 Google 帳戶失敗' }, { status: 500 });
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

    // ======= 情況 B：新手機號碼 ➔ 建立全新 B2C 會員 ➔ 自動綁定 Google！ =======
    const memberCode = `CR${String(new Date().getFullYear()).slice(-2)}M${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Math.floor(1000 + Math.random() * 9000)).padStart(4, '0')}`;
    const myReferralCode = memberCode;

    let uplineId = null;
    const refCode = referralCode?.trim().toUpperCase();

    if (refCode) {
      const { data: upline } = await supabase
        .from('members')
        .select('id')
        .or(`referral_code.eq.${refCode},member_code.eq.${refCode},phone.eq.${refCode}`)
        .maybeSingle();

      if (upline) {
        uplineId = upline.id;
      }
    }

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
      google_id: googleId,
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

    // 🎁 自動發放迎新折價券
    try {
      const { data: welcomeCoupons } = await supabase
        .from('coupons')
        .select('id, name, description')
        .or('code.ilike.NEW_%,code.ilike.WELCOME%,description.ilike.%迎新%,description.ilike.%新會員%');

      if (welcomeCoupons && welcomeCoupons.length > 0) {
        const activeWelcomeCoupons = welcomeCoupons.filter(c => !c.description?.startsWith('[UNPUBLISHED]'));
        
        if (activeWelcomeCoupons.length > 0) {
          const insertRows = activeWelcomeCoupons.map(c => ({
            member_id: newMember.id,
            coupon_id: c.id,
            is_used: false
          }));

          await supabase.from('member_coupons').insert(insertRows);

          const namesList = activeWelcomeCoupons.map(c => `【${c.name}】`).join('、');
          await supabase.from('notifications').insert({
            member_id: newMember.id,
            title: '🎁 獲得新會員專屬迎新禮包！',
            content: `恭喜您獲得 ${namesList}！已存入您的個人券包，快到商城體驗吧！`,
            type: 'system'
          });
        }
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
    console.error('Google 註冊綁定異常:', error);
    return NextResponse.json({ success: false, error: error.message || '內部處理錯誤' }, { status: 500 });
  }
}
