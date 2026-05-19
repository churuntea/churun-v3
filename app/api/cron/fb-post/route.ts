import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/supabase-admin';

// 臉書 API 版本
const FB_API_VERSION = 'v19.0';

export async function GET(request: Request) {
  try {
    // 1. 安全驗證：檢查 URL 中的 secret query param
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 檢查臉書 API 憑證
    const pageId = process.env.FB_PAGE_ID;
    const providedToken = process.env.FB_PAGE_ACCESS_TOKEN;

    if (!pageId || !providedToken) {
      return NextResponse.json({ error: 'Facebook credentials are not configured in environment variables.' }, { status: 500 });
    }

    let pageAccessToken = providedToken;

    // 3. 嘗試將 User Token 轉換為 Page Token (以防使用者填入的是 User Token)
    try {
      const accountsUrl = `https://graph.facebook.com/${FB_API_VERSION}/me/accounts?access_token=${providedToken}`;
      const accountsResponse = await fetch(accountsUrl);
      const accountsData = await accountsResponse.json();

      if (accountsResponse.ok && accountsData.data) {
        const targetPage = accountsData.data.find((p: any) => p.id === pageId);
        if (targetPage) {
          pageAccessToken = targetPage.access_token;
          console.log('成功從 User Token 取得 Page Access Token');
        }
      }
    } catch (e) {
      console.error('嘗試取得 Page Token 失敗，將直接使用原 Token:', e);
    }

    // 4. 從資料庫撈取最新的公告 (Announcements)
    const { data: announcement, error: dbError } = await supabaseAdmin
      .from('announcements')
      .select('title, content, tag')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbError) {
      console.error('Database error:', dbError);
    }

    // 5. 組合貼文內容
    let message = '';
    
    if (announcement) {
      message = `【${announcement.tag}】${announcement.title}\n\n${announcement.content || ''}\n\n---\n初潤製茶所 祝您週末愉快！`;
    } else {
      // 備用內容（如果資料庫沒公告）
      message = `初潤製茶所 祝大家週五愉快！\n\n今天也是充滿茶香的一天，別忘了來喝杯茶放鬆一下喔！🍵\n\n---\n(此為自動排程測試貼文)`;
    }

    // 6. 呼叫 Facebook Graph API 發文
    const fbUrl = `https://graph.facebook.com/${FB_API_VERSION}/${pageId}/feed`;
    
    const response = await fetch(fbUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        access_token: pageAccessToken,
      }),
    });

    const fbData = await response.json();

    if (!response.ok) {
      throw new Error(fbData.error?.message || 'Failed to post to Facebook');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully posted to Facebook', 
      postId: fbData.id 
    });

  } catch (error: any) {
    console.error('FB Auto Post Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
