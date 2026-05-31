import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDateStr') || '';

    const fetchLogs = async () => {
      let inboundQuery = supabase.from("inventory_logs").select("*").order("created_at", { ascending: false });
      if (startDateStr) inboundQuery = inboundQuery.gte("created_at", startDateStr);
      try {
        const { data: logsData, error: logError } = await inboundQuery;
        if (logError && logError.code === "42P01") {
          return { fallback: true };
        }
        return logsData;
      } catch (e) {
        return { fallback: true };
      }
    };

    const fetchSales = async () => {
      let orderQuery = supabase.from("order_items").select("name, quantity, price, order_id");
      
      const salesPromises: any[] = [orderQuery];
      if (startDateStr) {
        salesPromises.push(supabase.from("orders").select("id, created_at").gte("created_at", startDateStr));
      }
      
      const [itemsRes, ordersRes] = await Promise.all(salesPromises);
      let filteredItems = itemsRes.data || [];
      
      if (startDateStr && ordersRes) {
        const validOrderIds = new Set((ordersRes.data || []).map((o: any) => o.id));
        filteredItems = filteredItems.filter((it: any) => validOrderIds.has(it.order_id));
      }
      return filteredItems;
    };

    const [
      { data: prodsRaw },
      { data: whs },
      { data: whInv },
      { data: sups },
      realLogs,
      filteredItems
    ] = await Promise.all([
      // 1. Fetch products
      supabase.from("products").select("*").eq('status', 'active').order("created_at", { ascending: false }),
      // 2. Fetch warehouses
      supabase.from("warehouses").select("*"),
      // 3. Fetch warehouse inventory
      supabase.from("warehouse_inventory").select("*"),
      // 4. Fetch suppliers
      supabase.from("suppliers").select("name"),
      // 5. Fetch inventory logs
      fetchLogs(),
      // 6. Fetch sales
      fetchSales()
    ]);

    const separator = "||_EXT_JSON_||";
    const prods = (prodsRaw || []).map(p => {
      let desc = p.description || "";
      let extData: any = {};
      if (desc.includes(separator)) {
        const parts = desc.split(separator);
        desc = parts[0];
        try {
          extData = JSON.parse(parts[1]);
        } catch(e) {}
      }
      return {
        ...p,
        description: desc,
        order_unit: extData.order_unit || "數量",
        order_unit_size: extData.order_unit_size || 1,
        min_order_quantity: extData.min_order_quantity || 1
      };
    });

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
