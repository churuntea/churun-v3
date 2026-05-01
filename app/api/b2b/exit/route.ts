import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key';
const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_FEE = 3000; // 預設行政數位設定成本

export async function POST(request: Request) {
  try {
    const { member_id, action = 'simulate' } = await request.json();

    if (!member_id) {
      return NextResponse.json({ success: false, error: 'Missing member_id' }, { status: 400 });
    }

    // 1. 抓取會員資料
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('id', member_id)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }

    if (!member.is_b2b && action !== 'approve') {
      return NextResponse.json({ success: false, error: 'Only active B2B partners can use this exit mechanism' }, { status: 403 });
    }

    // 2. 計算已提領商品之原價價差補償 (加總過去收到的退傭)
    const { data: refunds, error: txError } = await supabase
      .from('wallet_transactions')
      .select('amount')
      .eq('member_id', member_id)
      .eq('transaction_type', 'commission_refund');

    if (txError) throw txError;

    const totalRefunds = refunds.reduce((sum, tx) => sum + Number(tx.amount), 0);

    // 3. 計算應退金額
    // 結算公式：應退金額 = 剩餘預收款 - (已提領商品之原價價差補償) - 行政數位設定成本
    const refundAmount = Number(member.virtual_balance) - totalRefunds - ADMIN_FEE;

    // 如果計算結果為負數，應退金額為 0
    const finalRefund = Math.max(0, refundAmount);

    const details = {
      virtualBalance: member.virtual_balance,
      totalCommissionReceived: totalRefunds,
      adminFee: ADMIN_FEE,
      finalRefundAmount: finalRefund
    };

    if (action === 'simulate') {
      return NextResponse.json({ success: true, details });
    }

    if (action === 'apply') {
      if (member.status === 'exit_pending') {
         return NextResponse.json({ success: false, error: '您已申請過退出，請等候總部審核。' }, { status: 400 });
      }
      await supabase.from('members').update({ status: 'exit_pending' }).eq('id', member.id);
      return NextResponse.json({ success: true, message: '已成功送出退出申請！' });
    }

    if (action === 'approve') {
      // 4. 總部核准：寫入提領交易紀錄與標記退出
      await supabase.from('wallet_transactions').insert({
        member_id: member.id,
        amount: -Number(member.virtual_balance), // 扣除所有剩餘餘額
        transaction_type: 'withdrawal',
        status: 'completed'
      });

      await supabase.from('members').update({ 
        virtual_balance: 0,
        is_b2b: false, // 取消 B2B 身分
        tier: '一般會員(已退出)',
        status: 'exited'
      }).eq('id', member.id);

      return NextResponse.json({ 
        success: true, 
        details,
        message: `已成功核准退出申請。應退還金額結算為 $${finalRefund}`
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
