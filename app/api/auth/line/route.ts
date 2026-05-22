import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';
import { createSession } from '@/lib/auth';

const LINE_CHANNEL_ID = '2010007687';
const LINE_CHANNEL_SECRET = '38f880ec5930b4bf02fbb236878f1558';

export async function POST(request: Request) {
  try {
    const { code, redirectUri } = await request.json();

    if (!code || !redirectUri) {
      return NextResponse.json({ success: false, error: '缺少驗證碼 (code) 或回調網址 (redirectUri)' }, { status: 400 });
    }

    // 1. 向 LINE API 伺服器交換 Access Token
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: LINE_CHANNEL_ID,
        client_secret: LINE_CHANNEL_SECRET,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('LINE Token 交換失敗:', errorData);
      return NextResponse.json({ success: false, error: 'LINE 認證授權過期或失敗，請重新嘗試登入' }, { status: 401 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. 使用 Access Token 取得 LINE 用戶個人檔案資訊 (Profile)
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      console.error('LINE Profile 獲取失敗');
      return NextResponse.json({ success: false, error: '無法自 LINE 伺服器取得您的個人檔案資料' }, { status: 400 });
    }

    const profileData = await profileResponse.json();
    const lineUserId = profileData.userId; // 獨一無二的 LINE User ID (例如: U1234567...)
    const displayName = profileData.displayName;
    const pictureUrl = profileData.pictureUrl || 'https://i.ibb.co/6R2M5X1/churun-baby.png';

    // 3. 查詢 Supabase members 資料表中，是否已有綁定此 lineUserId 的會員
    const { data: member, error: dbError } = await supabase
      .from('members')
      .select('*')
      .eq('line_id', lineUserId)
      .maybeSingle();

    if (dbError) {
      console.error('資料庫查詢錯誤:', dbError);
      return NextResponse.json({ success: false, error: '資料庫讀取異常' }, { status: 500 });
    }

    if (member) {
      // 會員存在 ➔ 直接登入成功！
      // 順便補齊 / 更新頭像 avatar_url 保持同步
      if (!member.avatar_url && pictureUrl) {
        await supabase
          .from('members')
          .update({ avatar_url: pictureUrl })
          .eq('id', member.id);
      }

      await createSession({ memberId: member.id, memberName: member.name });

      return NextResponse.json({
        success: true,
        status: 'success',
        memberId: member.id,
        memberName: member.name,
        member: {
          id: member.id,
          name: member.name,
          phone: member.phone,
          tier: member.tier,
          member_code: member.member_code,
          is_b2b: member.is_b2b,
          avatar_url: member.avatar_url || pictureUrl
        }
      });
    } else {
      // 會員不存在 ➔ 返回 new_user 狀態，引導至前端填寫手機號碼完成最後綁定
      return NextResponse.json({
        success: true,
        status: 'new_user',
        lineUserId: lineUserId,
        displayName: displayName,
        pictureUrl: pictureUrl
      });
    }
  } catch (error: any) {
    console.error('LINE 驗證異常:', error);
    return NextResponse.json({ success: false, error: error.message || '系統內部驗證錯誤' }, { status: 500 });
  }
}
