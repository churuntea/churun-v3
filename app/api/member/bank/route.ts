import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { memberId, bank_account_name, bank_branch, bank_code, bank_account } = body;

    if (!memberId) {
      return NextResponse.json({ success: false, error: '缺少會員 ID' }, { status: 400 });
    }

    // 更新資料庫
    const { error: dbError } = await supabase
      .from('members')
      .update({
        bank_account_name,
        bank_branch,
        bank_code,
        bank_account,
        beneficiary: bank_branch ? `${bank_branch} | ${bank_account_name}` : bank_account_name
      })
      .eq('id', memberId);

    if (dbError) {
      console.error('DB Update Error:', dbError);
      return NextResponse.json({ success: false, error: `資料庫更新失敗: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
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
