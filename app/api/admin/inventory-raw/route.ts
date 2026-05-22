import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDateStr') || '';

    // 1. Fetch products
    const { data: prods } = await supabase.from("products").select("*").order("created_at", { ascending: false });

    // 2. Fetch warehouses and inventory
    const { data: whs } = await supabase.from("warehouses").select("*");
    const { data: whInv } = await supabase.from("warehouse_inventory").select("*");

    // 3. Fetch suppliers
    const { data: sups } = await supabase.from("suppliers").select("name");

    // 4. Fetch inventory logs
    let inboundQuery = supabase.from("inventory_logs").select("*").order("created_at", { ascending: false });
    if (startDateStr) inboundQuery = inboundQuery.gte("created_at", startDateStr);
    
    // Catch table not found error for logs
    let realLogs: any = null;
    try {
       const { data: logsData, error: logError } = await inboundQuery;
       if (logError && logError.code === "42P01") {
           realLogs = { fallback: true };
       } else {
           realLogs = logsData;
       }
    } catch (e) {
       realLogs = { fallback: true };
    }

    // 5. Fetch sales
    let orderQuery = supabase.from("order_items").select("name, quantity, price, order_id");
    const { data: items } = await orderQuery;
    let filteredItems = items || [];

    if (startDateStr) {
       const { data: orders } = await supabase.from("orders").select("id, created_at").gte("created_at", startDateStr);
       const validOrderIds = new Set((orders || []).map(o => o.id));
       filteredItems = filteredItems.filter((it: any) => validOrderIds.has(it.order_id));
    }

    return NextResponse.json({
      success: true,
      data: {
        prods,
        whs,
        whInv,
        sups,
        realLogs,
        filteredItems
      }
    });

  } catch (error: any) {
    console.error('Inventory raw API error:', error);
    return NextResponse.json({ success: false, error: '伺服器異常' }, { status: 500 });
  }
}
