import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function GET(request: Request) {
  try {
    // 1. Members count
    const { count: mCount } = await supabase.from("members").select("*", { count: "exact", head: true });
    const { count: bCount } = await supabase.from("members").select("*", { count: "exact", head: true }).eq("is_b2b", true);
    
    // 2. Pending wallet transactions
    const { data: wData } = await supabase.from("wallet_transactions").select("amount").eq("status", "pending");

    // 3. Recent 6 months orders
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const { data: recentOrders } = await supabase
      .from("orders")
      .select("id, member_id, total_amount, status, created_at, shipping_info, custom_logo_url")
      .gte("created_at", sixMonthsAgo.toISOString())
      .order("created_at", { ascending: true });

    // 4. Top partners
    const { data: topB2B } = await supabase
      .from("members")
      .select("name, member_code, tier, team_total_sales")
      .eq("is_b2b", true)
      .order("team_total_sales", { ascending: false })
      .limit(3);

    // 5. Order items for top products
    const { data: itemsData } = await supabase
      .from("order_items")
      .select("product_id, name, quantity, price");

    return NextResponse.json({
      success: true,
      data: {
        mCount,
        bCount,
        wData,
        recentOrders,
        topB2B,
        itemsData
      }
    });

  } catch (error: any) {
    console.error('Dashboard raw API error:', error);
    return NextResponse.json({ success: false, error: '伺服器異常' }, { status: 500 });
  }
}
