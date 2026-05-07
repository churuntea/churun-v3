import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function POST(request: Request) {
  try {
    const { fileName } = await request.json();
    const ext = fileName.split('.').pop() || 'png';
    const filePath = `posters/${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
    
    const { data, error } = await supabase.storage.from('avatars').createSignedUploadUrl(filePath);
    
    if (error) {
      console.error('Storage Signed URL Error:', error);
      return NextResponse.json({ success: false, error: `取得上傳權限失敗: ${error.message}` }, { status: 500 });
    }
    
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
    
    return NextResponse.json({ 
      success: true, 
      token: data.token,
      path: data.path, 
      publicUrl
    });

  } catch (error: any) {
    console.error('API ERROR:', error);
    return NextResponse.json({ 
      success: false, 
      error: `伺服器異常: ${error.message}` 
    }, { status: 500 });
  }
}
