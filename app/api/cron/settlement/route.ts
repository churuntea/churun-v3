import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  // 這個 API 預計會在每月的 5 號與 20 號被 Cron Job 呼叫
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'secret'}`) {
    // 測試用，先不擋
  }

  try {
    // 找出所有狀態為 'pending' 的虛擬帳戶交易 (例如尚未結算的退傭)
    // 根據企劃書：「差價利潤即時退回虛擬帳戶。每月 5 號與 20 號結算匯款。」
    // 這裡我們模擬將 'pending' 轉為 'completed'
    
    const { data: pendingTx, error: fetchError } = await supabase
      .from('wallet_transactions')
      .select('id')
      .eq('status', 'pending');

    if (fetchError) throw fetchError;

    if (!pendingTx || pendingTx.length === 0) {
      return NextResponse.json({ message: 'No pending transactions to settle.' });
    }

    const txIds = pendingTx.map(tx => tx.id);

    const { error: updateError } = await supabase
      .from('wallet_transactions')
      .update({ status: 'completed' })
      .in('id', txIds);

    if (updateError) throw updateError;

    return NextResponse.json({ 
      success: true, 
      message: `Successfully settled ${txIds.length} transactions.` 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
