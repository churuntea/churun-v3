import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { memberId, avatarBase64, avatarSettings, motto } = body;

    if (!memberId) {
      return NextResponse.json({ success: false, error: '缺少會員 ID' }, { status: 400 });
    }

    let avatarUrl = null;

    // 1. 處理頭像上傳 (包在獨立的 try-catch 中，不讓 Storage 報錯搞死整支 API)
    if (avatarBase64 && avatarBase64.startsWith('data:image')) {
      try {
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
           console.error('Storage error:', uploadError);
           // 這裡報錯我們不 throw，只是不更新頭像網址，讓後續的資料庫更新能繼續
           console.warn('Continuing without avatar update due to storage error');
        } else {
           const { data: { publicUrl } } = supabase.storage
             .from('avatars')
             .getPublicUrl(filePath);
           avatarUrl = publicUrl;
        }
      } catch (storageErr) {
        console.error('Storage system crash:', storageErr);
      }
    }

    // 2. 更新會員資料 (使用逐個更新策略，增加對欄位缺失的容忍度)
    const updateData: any = {};
    if (avatarUrl) updateData.avatar_url = avatarUrl;
    if (avatarSettings) updateData.avatar_settings = avatarSettings;
    if (motto !== undefined) updateData.motto = motto;

    if (Object.keys(updateData).length > 0) {
      // 第一次嘗試：完整更新
      const { error: fullUpdateError } = await supabase
        .from('members')
        .update(updateData)
        .eq('id', memberId);

      if (fullUpdateError) {
        console.warn('Full update failed, trying fallback update...', fullUpdateError.message);
        
        // 第二次嘗試：退而求其次，只更新基本頭像資訊 (避開可能缺失的 motto 欄位)
        const fallbackData: any = {};
        if (avatarUrl) fallbackData.avatar_url = avatarUrl;
        if (avatarSettings) fallbackData.avatar_settings = avatarSettings;
        
        if (Object.keys(fallbackData).length > 0) {
           const { error: fallbackError } = await supabase
             .from('members')
             .update(fallbackData)
             .eq('id', memberId);
           
           if (fallbackError) throw fallbackError;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      avatarUrl: avatarUrl || undefined,
      message: '個人化設定已成功更新' 
    });

  } catch (error: any) {
    console.error('FINAL API ERROR:', error);
    return NextResponse.json({ 
      success: false, 
      error: `儲存核心失敗: ${error.message || '未知資料庫錯誤'}` 
    }, { status: 500 });
  }
}
