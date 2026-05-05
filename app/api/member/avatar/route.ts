import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function POST(request: Request) {
  try {
    // 0. 檢查環境變數
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase Environment Variables');
      return NextResponse.json({ 
        success: false, 
        error: '伺服器配置錯誤：缺少 Supabase 金鑰 (SERVICE_ROLE_KEY)' 
      }, { status: 500 });
    }

    const body = await request.json();
    console.log('Avatar API Request received for member:', body.memberId);
    const { memberId, avatarBase64, avatarSettings, motto } = body;

    if (!memberId) {
      return NextResponse.json({ success: false, error: '缺少會員 ID' }, { status: 400 });
    }

    let avatarUrl = null;

    // 1. 如果有新的頭像圖片
    if (avatarBase64 && avatarBase64.startsWith('data:image')) {
      console.log('Detected new avatar upload, preparing storage...');
      const base64Data = avatarBase64.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const fileName = `${memberId}_${Date.now()}.png`;
      const filePath = `avatars/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, buffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.error('Storage Upload Error:', uploadError);
        return NextResponse.json({ 
          success: false, 
          error: `圖片上傳失敗: ${uploadError.message}。請確認 Supabase Storage 中是否已建立 "avatars" Bucket 並設為 Public。` 
        }, { status: 500 });
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      avatarUrl = publicUrl;
      console.log('Avatar uploaded successfully:', avatarUrl);
    }

    // 2. 更新會員資料
    const updateData: any = {};
    if (avatarUrl) updateData.avatar_url = avatarUrl;
    if (avatarSettings) updateData.avatar_settings = avatarSettings;
    if (motto !== undefined) updateData.motto = motto;

    if (Object.keys(updateData).length > 0) {
      console.log('Updating member data in database...');
      const { error: updateError } = await supabase
        .from('members')
        .update(updateData)
        .eq('id', memberId);

      if (updateError) {
        console.error('Database Update Error:', updateError);
        return NextResponse.json({ 
          success: false, 
          error: `資料庫更新失敗: ${updateError.message}` 
        }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      avatarUrl: avatarUrl || undefined,
      message: '個人化設定已更新' 
    });

  } catch (error: any) {
    console.error('Critical API Crash:', error);
    return NextResponse.json({ 
      success: false, 
      error: `伺服器內部崩潰: ${error.message || '未知原因'}` 
    }, { status: 500 });
  }
}
