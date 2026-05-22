import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';
import { sendSecurityNotification } from '@/app/api/notify-helper';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { memberId, avatarBase64, avatarSettings, motto, address, birthday, city, district } = body;

    if (!memberId) {
      return NextResponse.json({ success: false, error: '缺少會員 ID' }, { status: 400 });
    }

    let avatarUrl = null;

    // 1. 處理頭像上傳
    if (avatarBase64 && (avatarBase64.startsWith('data:image') || avatarBase64.startsWith('data:video'))) {
      const mimeType = avatarBase64.match(/data:([^;]+);base64/)?.[1] || (avatarBase64.startsWith('data:video') ? 'video/mp4' : 'image/png');
      const base64Data = avatarBase64.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      // 為了避免快取，我們可以用 memberId 當檔名，但在 URL 後面加 timestamp
      // 或者乾脆檔名就加 timestamp
      const ext = mimeType.split('/')[1] || (avatarBase64.startsWith('data:video') ? 'mp4' : 'png');
      const fileName = `${memberId}_${Date.now()}.${ext}`;
      const filePath = `avatars/${fileName}`;

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
            error: `圖片上傳失敗: ${uploadError.message}. 請確認 Storage Bucket 'avatars' 是否存在且設為 Public。` 
        }, { status: 500 });
      }

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
    if (address !== undefined) updateData.address = address;
    if (birthday !== undefined) updateData.birthday = birthday;
    if (city !== undefined) updateData.city = city;
    if (district !== undefined) updateData.district = district;

    if (Object.keys(updateData).length > 0) {
      const { error: dbError } = await supabase
        .from('members')
        .update(updateData)
        .eq('id', memberId);

      if (dbError) {
        console.error('DB Update Error:', dbError);
        return NextResponse.json({ success: false, error: `資料庫更新失敗: ${dbError.message}` }, { status: 500 });
      }

      // 發送個人檔案異動通知
      await sendSecurityNotification({
        memberId,
        actionName: "個人檔案與通訊地址變更",
        details: `您已更新個人檔案資訊。` + (address ? `\n新通訊聯絡地址：${address}` : ""),
      });
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
      error: `伺服器異常: ${error.message}` 
    }, { status: 500 });
  }
}
