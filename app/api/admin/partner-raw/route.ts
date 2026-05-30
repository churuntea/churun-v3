import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    if (action === 'fetch_applications') {
      const { data, error } = await supabase
        .from("ambassador_applications")
        .select("*, members!inner(name, phone, email, member_code, tier, avatar_url, lifetime_spend)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === 'revoke') {
      const { applicationId, memberId } = payload;
      
      // Update application status
      const { error: updateAppErr } = await supabase
        .from('ambassador_applications')
        .update({ status: 'rejected', notes: '總部手動撤銷資格' })
        .eq('id', applicationId);
        
      if (updateAppErr) throw updateAppErr;

      // Update member tier & status
      const { error: updateMemberErr } = await supabase
        .from('members')
        .update({
          is_b2b: false,
          ambassador_status: null,
          ambassador_type: null,
          ambassador_since: null,
          ambassador_expires_at: null,
          tier: '初潤知己' // Demote to a normal high tier
        })
        .eq('id', memberId);

      if (updateMemberErr) throw updateMemberErr;

      return NextResponse.json({ success: true });
    }

    if (action === 'suspend') {
      const { applicationId, memberId } = payload;
      
      const { error: updateAppErr } = await supabase
        .from('ambassador_applications')
        .update({ status: 'suspended' })
        .eq('id', applicationId);
      if (updateAppErr) throw updateAppErr;

      const { error: updateMemberErr } = await supabase
        .from('members')
        .update({
          is_b2b: false,
          ambassador_status: 'suspended'
        })
        .eq('id', memberId);
      if (updateMemberErr) throw updateMemberErr;

      return NextResponse.json({ success: true });
    }

    if (action === 'restore') {
      const { applicationId, memberId } = payload;
      
      const { error: updateAppErr } = await supabase
        .from('ambassador_applications')
        .update({ status: 'approved' })
        .eq('id', applicationId);
      if (updateAppErr) throw updateAppErr;

      const { error: updateMemberErr } = await supabase
        .from('members')
        .update({
          is_b2b: true,
          ambassador_status: 'active'
        })
        .eq('id', memberId);
      if (updateMemberErr) throw updateMemberErr;

      return NextResponse.json({ success: true });
    }

    if (action === 'manual_assign') {
      const { searchKey, adminName } = payload;
      
      const { data: member, error: findErr } = await supabase
        .from('members')
        .select('*')
        .or(`phone.eq.${searchKey},member_code.eq.${searchKey}`)
        .single();
        
      if (findErr || !member) {
        return NextResponse.json({ success: false, error: '找不到該會員，請確認手機號碼或會員代碼是否正確。' }, { status: 404 });
      }

      if (member.ambassador_status === 'active') {
        return NextResponse.json({ success: false, error: '該會員已經是有效大使。' }, { status: 400 });
      }

      // 1. Upgrade member
      const { error: updateMemberErr } = await supabase
        .from('members')
        .update({
          is_b2b: true,
          ambassador_status: 'active',
          ambassador_type: 'paid', // default type
          ambassador_since: new Date().toISOString()
        })
        .eq('id', member.id);

      if (updateMemberErr) throw updateMemberErr;

      // 2. Insert dummy application
      const { error: insertAppErr } = await supabase
        .from('ambassador_applications')
        .insert({
          member_id: member.id,
          application_type: 'manual_upgrade',
          status: 'approved',
          reviewed_by: adminName || 'Admin',
          reviewed_at: new Date().toISOString(),
          notes: '總部手動開通'
        });

      if (insertAppErr) throw insertAppErr;

      return NextResponse.json({ success: true, message: '已成功開通品牌大使資格！' });
    }

    if (action === 'update_admin_note') {
      const { applicationId, notes } = payload;
      const { error } = await supabase
        .from('ambassador_applications')
        .update({ notes })
        .eq('id', applicationId);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'open_member_detail') {
      const { memberId } = payload;
      const [memberRes, downlinesRes, txRes] = await Promise.all([
        supabase.from("members").select("*, upline:upline_id(name, member_code)").eq("id", memberId).single(),
        supabase.from("members").select("id, name, member_code, tier, created_at, lifetime_spend").eq("upline_id", memberId).order("created_at", { ascending: false }),
        supabase.from("wallet_transactions").select("id, amount, transaction_type, created_at, order_id").eq("member_id", memberId).order("created_at", { ascending: false })
      ]);
      
      const transactions = txRes.data || [];
      const commissions = transactions.filter(t => t.transaction_type === 'commission_refund');
      
      const commissionEarned = commissions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const commissionWithdrawn = transactions
        .filter(t => t.transaction_type === 'withdrawal' && t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
        
      // Enrich commission ledger with order and downline details
      const orderIds = commissions.map(t => t.order_id).filter(Boolean);
      let ordersData: any[] = [];
      let membersData: any[] = [];
      
      if (orderIds.length > 0) {
        const { data: orders } = await supabase.from("orders").select("id, total_amount, member_id").in("id", orderIds);
        ordersData = orders || [];
        
        const memberIds = ordersData.map(o => o.member_id).filter(Boolean);
        if (memberIds.length > 0) {
          const { data: mems } = await supabase.from("members").select("id, name, member_code").in("id", memberIds);
          membersData = mems || [];
        }
      }
      
      const commissionLedger = commissions.map(c => {
        const order = ordersData.find(o => o.id === c.order_id);
        const downline = order ? membersData.find(m => m.id === order.member_id) : null;
        return {
          id: c.id,
          created_at: c.created_at,
          amount: c.amount,
          order_amount: order ? order.total_amount : null,
          contributor_name: downline ? downline.name : (c.order_id ? '未知會員' : '總部手動調整'),
          contributor_code: downline ? downline.member_code : ''
        };
      });

      return NextResponse.json({ 
        success: true, 
        data: memberRes.data, 
        downlines: downlinesRes.data || [],
        commissionEarned,
        commissionWithdrawn,
        transactions: commissions,
        commissionLedger
      });
    }

    if (action === 'fetch_top_products') {
      // Get all partners
      const { data: partners } = await supabase
        .from('members')
        .select('id')
        .in('tier', ['partner', '初潤好朋友', '初潤閨蜜', '超級小幫手']);
      
      const partnerIds = partners?.map(a => a.id) || [];
      if (partnerIds.length === 0) return NextResponse.json({ success: true, data: [] });

      // Get their downlines
      const { data: downlines } = await supabase
        .from('members')
        .select('id')
        .in('upline_id', partnerIds);

      const networkIds = [...partnerIds, ...(downlines?.map(d => d.id) || [])];
      
      if (networkIds.length === 0) return NextResponse.json({ success: true, data: [] });

      // Fetch completed orders
      let ordersQuery = supabase
        .from('orders')
        .select('id')
        .in('member_id', networkIds)
        .neq('status', 'pending')
        .neq('status', 'cancelled');
        
      if (payload?.dateRange) {
        const now = new Date();
        if (payload.dateRange === 'this_month') {
          ordersQuery = ordersQuery.gte('created_at', new Date(now.getFullYear(), now.getMonth(), 1).toISOString());
        } else if (payload.dateRange === 'last_month') {
          ordersQuery = ordersQuery.gte('created_at', new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString())
                                   .lt('created_at', new Date(now.getFullYear(), now.getMonth(), 1).toISOString());
        } else if (payload.dateRange === 'last_3_months') {
          ordersQuery = ordersQuery.gte('created_at', new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString());
        }
      }

      const { data: orders } = await ordersQuery;
        
      const orderIds = orders?.map(o => o.id) || [];
      if (orderIds.length === 0) return NextResponse.json({ success: true, data: [] });

      // Fetch order items
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('name, quantity, price')
        .in('order_id', orderIds);

      // Aggregate
      const productMap: Record<string, { quantity: number, revenue: number }> = {};
      orderItems?.forEach((item: any) => {
        if (!productMap[item.name]) {
          productMap[item.name] = { quantity: 0, revenue: 0 };
        }
        productMap[item.name].quantity += item.quantity;
        productMap[item.name].revenue += item.quantity * Number(item.price);
      });

      // Convert to array and sort by revenue
      const sortedProducts = Object.entries(productMap)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      return NextResponse.json({ success: true, data: sortedProducts });
    }

    if (action === 'fetch_insights') {
      const { data: partners } = await supabase
        .from('members')
        .select('id, name, member_code, phone, tier, created_at, last_login_at')
        .in('tier', ['partner', '初潤好朋友', '初潤閨蜜', '超級小幫手']);
        
      const partnersList = partners || [];
      if (partnersList.length === 0) return NextResponse.json({ success: true, risingStars: [], atRisk: [] });

      const partnerIds = partnersList.map(a => a.id);
      
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

      const { data: downlines } = await supabase
        .from('members')
        .select('upline_id, created_at')
        .in('upline_id', partnerIds)
        .gte('created_at', ninetyDaysAgo);

      const { data: txs } = await supabase
        .from('wallet_transactions')
        .select('member_id, amount, created_at')
        .in('member_id', partnerIds)
        .eq('transaction_type', 'commission_refund')
        .gte('created_at', ninetyDaysAgo);

      const partnerStats = partnersList.map(p => {
        const recentTxs = txs?.filter(t => t.member_id === p.id) || [];
        const recentDownlines = downlines?.filter(d => d.upline_id === p.id) || [];
        
        const last30DaysCommission = recentTxs
          .filter(t => new Date(t.created_at) >= new Date(thirtyDaysAgo))
          .reduce((sum, t) => sum + Number(t.amount), 0);
          
        const last90DaysCommission = recentTxs.reduce((sum, t) => sum + Number(t.amount), 0);
        return {
           ...p,
           last30DaysCommission,
           last90DaysCommission,
           recentDownlinesCount: recentDownlines.length
        }
      });

      const risingStars = partnerStats
         .filter(p => p.last30DaysCommission > 0)
         .sort((a, b) => b.last30DaysCommission - a.last30DaysCommission)
         .slice(0, 3)
         .map(p => ({ ...p, reason: `近30天獲得獎金 $${p.last30DaysCommission.toLocaleString()}` }));

      const atRisk = partnerStats
         .filter(p => p.last90DaysCommission === 0 && p.recentDownlinesCount === 0)
         .slice(0, 3)
         .map(p => ({ ...p, reason: `近90天無任何新增業績與下線` }));
         
      return NextResponse.json({ success: true, risingStars, atRisk });
    }

    if (action === 'send_notification') {
      const { memberId, title, content } = payload;
      const { error } = await supabase
        .from('notifications')
        .insert({
          member_id: memberId,
          title,
          content,
          type: 'system',
          is_read: false
        });
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });

  } catch (error: any) {
    console.error('Ambassador Raw API error:', error);
    return NextResponse.json({ success: false, error: error.message || '伺服器異常' }, { status: 500 });
  }
}
