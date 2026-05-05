import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function POST(request: Request) {
  try {
    const { memberId, avatarBase64, avatarSettings, motto } = await request.json();

    if (!memberId) {
      return NextResponse.json({ success: false, error: '缺少會員 ID' }, { status: 400 });
    }

    let avatarUrl = null;

    // 1. 如果有新的頭像圖片 (Base64)
    if (avatarBase64 && avatarBase64.startsWith('data:image')) {
      const base64Data = avatarBase64.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const fileName = `${memberId}_${Date.now()}.png`;
      const filePath = `avatars/${fileName}`;

      // 上傳到 Supabase Storage (假設 bucket 名稱為 'public')
      // 如果 bucket 不存在，這步可能會失敗，我們使用 try-catch
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, buffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload Error:', uploadError);
        // 如果是 Bucket 不存在，可以考慮返回友善提示
        if (uploadError.message.includes('bucket not found')) {
           return NextResponse.json({ 
             success: false, 
             error: 'Supabase Storage Bucket "avatars" 未建立，請先在後台建立此 Bucket 並設為 Public。' 
           }, { status: 500 });
        }
        throw uploadError;
      }

      // 取得公開連結
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      avatarUrl = publicUrl;
    }

    // 2. 更新會員資料
    const updateData: any = {};
    if (avatarUrl) updateData.avatar_url = avatarUrl;
    if (avatarSettings) updateData.avatar_settings = avatarSettings;
    if (motto !== undefined) updateData.motto = motto;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('members')
        .update(updateData)
        .eq('id', memberId);

      if (updateError) {
        console.error('Supabase Update Error Details:', updateError);
        // 如果錯誤訊息包含 column doesn't exist，提供具體提示
        if (updateError.message.includes('column') && updateError.message.includes('does not exist')) {
           return NextResponse.json({ 
             success: false, 
             error: `資料庫缺少欄位: ${updateError.message}。請執行 SQL ALTER TABLE 指令。` 
           }, { status: 500 });
        }
        throw updateError;
      }
    }

    return NextResponse.json({ 
      success: true, 
      avatarUrl: avatarUrl || undefined,
      message: '個人化設定已更新' 
    });

  } catch (error: any) {
    console.error('Avatar Update Critical Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || '伺服器內部錯誤' 
    }, { status: 500 });
  }
}
