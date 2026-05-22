import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/supabase-admin';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.memberId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const currentUserId = session.memberId;

    // 使用 Promise.all 並行執行個人帳本與下線名單的查詢
    const [
      { data: txData, error: txError },
      { data: downlineMembers }
    ] = await Promise.all([
      // 1. Fetch ledger history
      supabaseAdmin
        .from('wallet_transactions')
        .select('*')
        .eq('member_id', currentUserId)
        .order('created_at', { ascending: false }),
        
      // 2. Fetch pending B2B commissions (downline members)
      supabaseAdmin
        .from('members')
        .select('id, name')
        .eq('upline_id', currentUserId)
    ]);

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    let pendingCommissions: any[] = [];

    if (downlineMembers && downlineMembers.length > 0) {
      const downlineIds = downlineMembers.map(m => m.id);
      const downlineNameMap = new Map(downlineMembers.map(m => [m.id, m.name]));

      // Fetch completed orders of these downlines that have b2b_commission > 0
      const { data: orders } = await supabaseAdmin
        .from('orders')
        .select('id, member_id, total_amount, b2b_commission, custom_logo_url, created_at, status, fulfillment_status')
        .in('member_id', downlineIds)
        .eq('status', 'completed')
        .gt('b2b_commission', 0);

      if (orders && orders.length > 0) {
        // Fetch existing settled commissions for these orders
        const orderIds = orders.map(o => o.id);
        const { data: existingTx } = await supabaseAdmin
          .from('wallet_transactions')
          .select('order_id')
          .eq('transaction_type', 'commission_refund')
          .in('order_id', orderIds);

        const settledOrderIds = new Set(existingTx?.map(tx => tx.order_id) || []);

        // Filter out orders that are already settled
        pendingCommissions = orders
          .filter(o => !settledOrderIds.has(o.id))
          .map(o => {
            // Parse delivered_at or shipped_at from custom_logo_url fallback JSON
            let refTime = null;
            if (o.custom_logo_url && o.custom_logo_url.startsWith('FALLBACK_JSON:')) {
              try {
                const parsed = JSON.parse(o.custom_logo_url.substring('FALLBACK_JSON:'.length));
                refTime = parsed.delivered_at || parsed.shipped_at;
              } catch (e) {}
            }
            if (!refTime) {
              refTime = o.created_at;
            }

            // Calculate countdown relative to 30 days cooling period
            let countdownText = "待發送";
            let daysRemaining = 30;
            if (refTime) {
              const diffTime = new Date().getTime() - new Date(refTime).getTime();
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              daysRemaining = Math.max(0, 30 - diffDays);
              if (daysRemaining > 0) {
                countdownText = `約剩餘 ${daysRemaining} 天撥發`;
              } else {
                countdownText = "將於下次對帳撥發";
              }
            }

            return {
              orderId: o.id,
              buyerName: downlineNameMap.get(o.member_id) || '下線夥伴',
              orderAmount: Number(o.total_amount),
              commissionAmount: Number(o.b2b_commission),
              refTime: refTime,
              daysRemaining: daysRemaining,
              countdownText: countdownText,
              status: o.fulfillment_status
            };
          })
          // Sort so the ones closest to settlement show first
          .sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0));
      }
    }

    return NextResponse.json({
      transactions: txData || [],
      pendingCommissions
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
