import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';
import { createSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { access_token } = await request.json();
    if (!access_token) {
      return NextResponse.json({ success: false, error: '缺少 access_token' }, { status: 400 });
    }

    const { data: { user }, error } = await supabase.auth.getUser(access_token);
    
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Google 驗證失效，請重新登入' }, { status: 401 });
    }
    
    const email = user.email;
    const providerId = user.id;

    const { data: member, error: dbError } = await supabase
      .from("members")
      .select("id, name, avatar_url")
      .or(`email.eq."${email}",google_id.eq."${providerId}"`)
      .maybeSingle();

    if (dbError) {
      console.error('Google 登入查詢錯誤:', dbError);
      return NextResponse.json({ success: false, error: '資料庫讀取異常' }, { status: 500 });
    }

    if (member) {
      // 順便補齊 / 更新頭像
      const pictureUrl = user.user_metadata?.avatar_url;
      if (!member.avatar_url && pictureUrl) {
        await supabase
          .from('members')
          .update({ avatar_url: pictureUrl })
          .eq('id', member.id);
      }

      await createSession({ memberId: member.id, memberName: member.name });
      return NextResponse.json({ success: true, status: 'success', memberId: member.id, memberName: member.name });
    }
    
    // 會員不存在，回傳以利前端引導至綁定畫面
    return NextResponse.json({ 
      success: true, 
      status: 'new_user', 
      user: {
        id: providerId,
        email: email,
        user_metadata: user.user_metadata
      }
    });
  } catch (err: any) {
    console.error('Google 驗證異常:', err);
    return NextResponse.json({ success: false, error: err.message || '系統內部驗證錯誤' }, { status: 500 });
  }
}
