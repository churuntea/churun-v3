import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function POST(request: Request) {
  try {
    const { member_id, amount, payment_last_five } = await request.json();

    if (!member_id || !amount || amount <= 0) {
      return NextResponse.json({ error: '儲值金額必須大於 0' }, { status: 400 });
    }

    if (!payment_last_five || payment_last_five.trim().length === 0) {
      return NextResponse.json({ error: '請填寫匯款帳號末五碼' }, { status: 400 });
    }

    // 1. 抓取會員
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('name')
      .eq('id', member_id)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: '找不到會員資料' }, { status: 404 });
    }

    // 2. 建立儲值交易申請流水紀錄 (deposit 且狀態為 pending 待審核)
    // 植入智慧容錯機制：若資料庫缺少 metadata JSONB 欄位 (PGRST204)，自動降級不含 metadata 寫入
    let txInsertResult = await supabase
      .from('wallet_transactions')
      .insert({
        member_id,
        amount: Number(amount),
        transaction_type: 'deposit',
        status: 'pending',
        metadata: {
          payment_last_five: payment_last_five.trim()
        }
      });

    if (txInsertResult.error && (txInsertResult.error.code === 'PGRST204' || txInsertResult.error.message.includes('metadata'))) {
      console.warn("⚠️ 偵測到 wallet_transactions 缺少 metadata 欄位，自動降級容錯寫入...");
      txInsertResult = await supabase
        .from('wallet_transactions')
        .insert({
          member_id,
          amount: Number(amount),
          transaction_type: 'deposit',
          status: 'pending'
        });
    }

    if (txInsertResult.error) throw txInsertResult.error;

    // 3. 新增即時通知
    const { error: notifyError } = await supabase
      .from('notifications')
      .insert({
        member_id,
        title: '預收儲值申請已受理 ⏳',
        content: `您的預收儲值申請 NT$ ${Number(amount).toLocaleString()} 元已成功送出！會計核對匯款末五碼【${payment_last_five.trim()}】無誤後，系統將立即為您核發金額到帳。`,
        type: 'system'
      });

    if (notifyError) {
      console.error("發送通知失敗但繼續:", notifyError);
    }

    return NextResponse.json({ success: true, message: "儲值申請已成功送出，靜待會計審核核發！" });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
