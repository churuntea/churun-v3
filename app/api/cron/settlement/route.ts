import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

async function performSettlement() {
  try {
    // 找出所有狀態為 'pending' 的虛擬帳戶交易 (例如尚未結算的退傭)
    const { data: pendingTx, error: fetchError } = await supabase
      .from('wallet_transactions')
      .select('id')
      .eq('status', 'pending');

    if (fetchError) throw fetchError;

    if (!pendingTx || pendingTx.length === 0) {
      return { success: true, message: 'No pending transactions to settle.' };
    }

    const txIds = pendingTx.map(tx => tx.id);

    const { error: updateError } = await supabase
      .from('wallet_transactions')
      .update({ status: 'completed' })
      .in('id', txIds);

    if (updateError) throw updateError;

    return { 
      success: true, 
      message: `Successfully settled ${txIds.length} transactions.` 
    };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function POST(request: Request) {
  const result = await performSettlement();
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json(result);
}

export async function GET() {
  const result = await performSettlement();
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json(result);
}
