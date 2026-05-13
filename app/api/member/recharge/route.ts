import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function POST(request: Request) {
  try {
    const { member_id, amount } = await request.json();

    if (!member_id || !amount || amount <= 0) {
      return NextResponse.json({ error: '儲值金額必須大於 0' }, { status: 400 });
    }

    // 1. 抓取會員
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('virtual_balance')
      .eq('id', member_id)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: '找不到會員資料' }, { status: 404 });
    }

    const currentBalance = Number(member.virtual_balance) || 0;
    const targetBalance = currentBalance + Number(amount);

    // 2. 更新會員預收資金餘額
    const { error: updateError } = await supabase
      .from('members')
      .update({ virtual_balance: targetBalance })
      .eq('id', member_id);

    if (updateError) throw updateError;

    // 3. 建立儲值交易流水紀錄 (deposit)
    const { error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        member_id,
        amount: Number(amount),
        transaction_type: 'deposit',
        status: 'completed'
      });

    if (txError) throw txError;

    // 4. 新增即時通知
    const { error: notifyError } = await supabase
      .from('notifications')
      .insert({
        member_id,
        title: '線上匯款儲值成功',
        content: `您已成功存入合夥預收款資金 NT$ ${Number(amount).toLocaleString()} 元！帳戶餘額已即時更新。`,
        type: 'system'
      });

    if (notifyError) {
      console.error("發送通知失敗但繼續:", notifyError);
    }

    return NextResponse.json({ success: true, new_balance: targetBalance });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
