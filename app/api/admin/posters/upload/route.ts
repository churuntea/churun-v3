import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageBase64 } = body;

    if (!imageBase64 || !imageBase64.startsWith('data:image')) {
      return NextResponse.json({ success: false, error: '缺少圖片資料或格式不正確' }, { status: 400 });
    }

    const mimeType = imageBase64.match(/data:([^;]+);base64/)?.[1] || 'image/png';
    const base64Data = imageBase64.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    const ext = mimeType.split('/')[1] || 'png';
    const fileName = `poster_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
    const filePath = `posters/${fileName}`;

    // 使用 avatars bucket (因為目前已知 avatars 為公開且可用的 bucket)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true
      });

    if (uploadError) {
      console.error('Storage Upload Error:', uploadError);
      return NextResponse.json({ 
          success: false, 
          error: `圖片上傳失敗: ${uploadError.message}` 
      }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return NextResponse.json({ 
      success: true, 
      imageUrl: publicUrl
    });

  } catch (error: any) {
    console.error('API ERROR:', error);
    return NextResponse.json({ 
      success: false, 
      error: `伺服器異常: ${error.message}` 
    }, { status: 500 });
  }
}
