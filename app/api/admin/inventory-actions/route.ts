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
      
      // We sync this directly to products.stock_count to maintain a single source of truth
      const { data: prod } = await supabase
        .from("products")
        .select("stock_count")
        .eq("id", productId)
        .single();
        
      const currentStock = Number(prod?.stock_count || 0);
      let finalStock = 0;
      
      if (type === 'inbound' || isNewProduct) {
        finalStock = currentStock + qty;
      } else {
        // stock check
        finalStock = qty;
      }
      
      const { error: updateErr } = await supabase
        .from("products")
        .update({ stock_count: finalStock })
        .eq("id", productId);
        
      if (updateErr) throw updateErr;
      
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

    if (action === 'confirm_smart_order') {
      const { productId, productName, category, quantity, lossQuantity, warehouseId, logId } = payload;
      
      let dbOrderedQuantity = payload.orderedQuantity || 0;
      
      // Fetch original quantity directly from DB to prevent frontend state issues
      if (logId) {
        const { data: logData } = await supabase.from('inventory_logs').select('quantity').eq('id', logId).single();
        if (logData) {
          dbOrderedQuantity = Number(logData.quantity || 0);
        }
      } else {
        const { data: logsData } = await supabase.from('inventory_logs').select('quantity').eq('product_name', productName).like('notes', '%草稿待入庫%');
        if (logsData) {
          dbOrderedQuantity = logsData.reduce((sum, log) => sum + Number(log.quantity || 0), 0);
        }
      }

      const remainingQty = dbOrderedQuantity - quantity - (lossQuantity || 0);

      // 1. Delete or update pending drafts
      if (logId) {
        if (remainingQty > 0) {
          const { error: updErr } = await supabase.from('inventory_logs').update({ quantity: remainingQty }).eq('id', logId);
          if (updErr) throw updErr;
        } else {
          const { error: delErr } = await supabase.from('inventory_logs').delete().eq('id', logId);
          if (delErr) throw delErr;
        }
      } else {
        const { error: delErr } = await supabase
          .from('inventory_logs')
          .delete()
          .eq('product_name', productName)
          .like('notes', '%草稿待入庫%');
        if (delErr) throw delErr;

        if (remainingQty > 0) {
          const { error: draftErr } = await supabase.from('inventory_logs').insert({
            product_name: productName,
            category: category || "極萃系列",
            quantity: remainingQty,
            unit_cost: 0,
            supplier: "初潤南投茶園總廠",
            type: 'inbound',
            notes: "一鍵智慧採購單 (剩餘未到貨) - 草稿待入庫"
          });
          if (draftErr) throw draftErr;
        }
      }

      // 2. Create actual inbound log
      const notes = lossQuantity > 0 
        ? `智慧採購單確認到貨入庫 (原訂 ${quantity + lossQuantity} 件, 實際到貨 ${quantity} 件, 損失 ${lossQuantity} 件)` 
        : "智慧採購單確認到貨入庫";

      const { error: logErr } = await supabase.from('inventory_logs').insert({
        product_name: productName,
        category: category || "極萃系列",
        quantity: quantity,
        unit_cost: 0,
        supplier: "智慧採購單入庫",
        type: 'inbound',
        notes: notes
      });
      if (logErr) throw logErr;

      // 3. Update total stock_count
      const { data: prod } = await supabase.from("products").select("stock_count").eq("id", productId).single();
      const finalStock = Number(prod?.stock_count || 0) + quantity;
      
      const { error: updateErr } = await supabase.from("products").update({ stock_count: finalStock }).eq("id", productId);
      if (updateErr) throw updateErr;
      
      return NextResponse.json({ success: true, finalStock });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });

  } catch (error: any) {
    console.error('Inventory Actions API error:', error);
    return NextResponse.json({ success: false, error: error.message || '伺服器異常' }, { status: 500 });
  }
}
