import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function GET(request: Request) {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [
      { count: mCount },
      { count: bCount },
      { data: wData },
      { data: recentOrders },
      { data: topB2B },
      { data: itemsData }
    ] = await Promise.all([
      // 1. Members count
      supabase.from("members").select("*", { count: "exact", head: true }),
      // 2. B2B Members count
      supabase.from("members").select("*", { count: "exact", head: true }).eq("is_b2b", true),
      // 3. Pending wallet transactions
      supabase.from("wallet_transactions").select("amount").eq("status", "pending"),
      // 4. Recent 6 months orders
      supabase.from("orders").select("id, member_id, total_amount, status, created_at, shipping_info, custom_logo_url, members(is_b2b)").gte("created_at", sixMonthsAgo.toISOString()).order("created_at", { ascending: true }),
      // 5. Top partners
      supabase.from("members").select("name, member_code, tier, team_total_sales").eq("is_b2b", true).order("team_total_sales", { ascending: false }).limit(3),
      // 6. Order items for top products
      supabase.from("order_items").select("product_id, name, quantity, price")
    ]);

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
