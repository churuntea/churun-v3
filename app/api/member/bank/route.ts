import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';
import { sendSecurityNotification } from '@/app/api/notify-helper';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      memberId, 
      bank_account_name, 
      bank_branch, 
      bank_code, 
      bank_account, 
      bank_card_photo_base64,
      bank_card_photo_url 
    } = body;

    if (!memberId) {
      return NextResponse.json({ success: false, error: '缺少會員 ID' }, { status: 400 });
    }

    let bankCardPhotoUrl = bank_card_photo_url || '';

    // 1. Process bank card/passbook photo upload if provided
    if (bank_card_photo_base64 && bank_card_photo_base64.startsWith('data:image')) {
      const mimeType = bank_card_photo_base64.match(/data:([^;]+);base64/)?.[1] || 'image/png';
      const base64Data = bank_card_photo_base64.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const ext = mimeType.split('/')[1] || 'png';
      const fileName = `bankcard_${memberId}_${Date.now()}.${ext}`;
      const filePath = `avatars/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, buffer, {
          contentType: mimeType,
          upsert: true
        });

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        bankCardPhotoUrl = publicUrl;
      } else {
        console.error('Bank Card Photo Upload Error:', uploadError);
        return NextResponse.json({ 
          success: false, 
          error: `照片上傳儲存空間失敗: ${uploadError.message}` 
        }, { status: 500 });
      }
    }

    // Combine values into beneficiary column to be backwards compatible and avoid missing columns
    // Format: bank_account_name|bank_branch|bank_card_photo_url
    const combinedBeneficiary = [
      bank_account_name || '', 
      bank_branch || '', 
      bankCardPhotoUrl || ''
    ].join('|');

    // Update members table (using both individual columns and combined beneficiary for compatibility)
    const { error: dbError } = await supabase
      .from('members')
      .update({
        bank_code,
        bank_account,
        bank_account_name: bank_account_name || '',
        bank_branch: bank_branch || '',
        beneficiary: combinedBeneficiary
      })
      .eq('id', memberId);

    if (dbError) {
      console.error('DB Update Error:', dbError);
      return NextResponse.json({ success: false, error: `資料庫更新失敗: ${dbError.message}` }, { status: 500 });
    }

    // 發送帳號安全異動通知 (LINE 推播 + Email)
    await sendSecurityNotification({
      memberId,
      actionName: "銀行帳戶設定變更",
      details: `您已將提領收款帳戶更新為：${bank_code} - ${bank_account} (${bank_account_name || '未填寫戶名'})`,
    });

    return NextResponse.json({ 
      success: true, 
      bankCardPhotoUrl: bankCardPhotoUrl || undefined,
      message: '銀行帳戶資訊已成功更新' 
    });

  } catch (error: any) {
    console.error('API ERROR:', error);
    return NextResponse.json({ 
      success: false, 
      error: `伺服器異常: ${error.message}` 
    }, { status: 500 });
  }
}
