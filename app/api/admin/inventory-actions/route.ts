import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    if (action === 'get_order') {
      const { orderId } = payload;
      const { data: ord, error } = await supabase.from("orders").select("*").eq("id", orderId).single();
      if (error) throw error;
      return NextResponse.json({ success: true, data: ord });
    }
    
    if (action === 'delete_products') {
      const { ids } = payload;
      const { error } = await supabase.from('products').delete().in('id', ids);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'create_product') {
      const { name, price, category, stock, min_stock } = payload;
      const { data, error } = await supabase.from("products").insert({
        name, price, category, stock, min_stock
      }).select().single();
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === 'update_stock') {
      const { productId, warehouseId, qty, isNewProduct, type } = payload;
      // qty is the delta or absolute depending on isNewProduct/type
      
      const { data: currentInv } = await supabase
        .from("warehouse_inventory")
        .select("stock")
        .eq("product_id", productId)
        .eq("warehouse_id", warehouseId)
        .single();
        
      const currentStock = Number(currentInv?.stock || 0);
      let finalStock = 0;
      
      if (type === 'inbound' || isNewProduct) {
        finalStock = currentStock + qty;
      } else {
        // stock check
        finalStock = qty;
      }
      
      const { error: upsertErr } = await supabase
        .from("warehouse_inventory")
        .upsert({ 
          product_id: productId, 
          warehouse_id: warehouseId, 
          stock: finalStock 
        });
        
      if (upsertErr) throw upsertErr;
      
      return NextResponse.json({ success: true, finalStock });
    }

    if (action === 'log_inventory') {
      const { productName, category, quantity, unitCost, supplier, type, notes } = payload;
      const { error } = await supabase.from("inventory_logs").insert({
        product_name: productName,
        category,
        quantity,
        unit_cost: unitCost,
        supplier,
        type,
        notes
      });
      // Don't throw if log fails, just return success false for log
      if (error) return NextResponse.json({ success: false, error: error.message });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });

  } catch (error: any) {
    console.error('Inventory Actions API error:', error);
    return NextResponse.json({ success: false, error: error.message || '伺服器異常' }, { status: 500 });
  }
}
