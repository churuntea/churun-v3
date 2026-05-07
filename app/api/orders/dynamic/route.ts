import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function POST(request: Request) {
  try {
    const { buyer_id, memberId, items, discountAmount = 0, shippingInfo } = await request.json();
    const effectiveBuyerId = buyer_id || memberId;

    if (!effectiveBuyerId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: '缺少必要參數' }, { status: 400 });
    }

    // 1. 取得買家資料
    const { data: buyer, error: buyerError } = await supabase
      .from('members')
      .select('*')
      .eq('id', effectiveBuyerId)
      .single();

    const TIER_RATES: Record<string, number> = {
      '初潤靈魂伴侶': 30,
      '初潤知己': 40,
      '初潤閨蜜': 50,
      '初潤好朋友': 60,
      '初潤青少年': 70,
      '初潤小朋友': 80,
      '初潤幼兒園': 90,
      '初潤寶寶': 100
    };

    if (buyerError || !buyer) {
      return NextResponse.json({ error: '找不到買家資料' }, { status: 404 });
    }

    // 2. 取得商品資料並計算總計
    const productIds = items.map(i => i.id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (productsError) throw productsError;

    let totalAmount = 0;
    let totalB2CPoints = 0;
    let totalB2BCommission = 0;

    for (const item of items) {
      const product = products.find(p => p.id === item.id);
      if (!product) continue;
      
      const itemSubtotal = product.price * item.quantity;
      totalAmount += itemSubtotal;
      
      // B2B 退傭仍依照商品設定 (不變)
      totalB2BCommission += Math.floor(itemSubtotal * (product.b2b_commission_percent / 100));
    }

    // B2C 點數回饋改為依據「會員階級匯率」計算
    const tierRate = TIER_RATES[buyer.tier] || 100;
    totalB2CPoints = Math.floor(totalAmount / tierRate);

    // 3. 建立訂單 (狀態改為 pending，待管理者確認)
    const finalAmount = Math.max(0, totalAmount - discountAmount);
    
    const orderData: any = {
      member_id: buyer.id,
      total_amount: finalAmount,
      original_amount: totalAmount,
      status: 'pending',
      reward_points: totalB2CPoints,
      b2b_commission: totalB2BCommission
    };

    if (shippingInfo) {
      orderData.shipping_info = {
        name: shippingInfo.name,
        phone: shippingInfo.phone,
        address: shippingInfo.address,
        method: shippingInfo.method || '宅配到府',
        sender_name: shippingInfo.senderName || '',
        sender_phone: shippingInfo.senderPhone || '',
        sender_address: shippingInfo.senderAddress || ''
      };
      if (shippingInfo.notes) {
        orderData.notes = shippingInfo.notes;
      }
    }

    let orderDataToInsert = { ...orderData };
    let order = null;
    let orderError = null;

    // 定義可能缺失的自訂擴充欄位，當發生 DB 欄位不存在錯誤時會自動排除並進行備份
    const schemaSensitiveColumns = ['shipping_info', 'notes', 'reward_points', 'b2b_commission', 'bank_last_five'];
    let serializedBackup: any = {};

    // 智慧漸進式欄位排除寫入迴圈 (最高重試 6 次以應對多個潛在缺失欄位)
    for (let attempts = 0; attempts < 6; attempts++) {
      const { data, error } = await supabase
        .from('orders')
        .insert(orderDataToInsert)
        .select()
        .single();
      
      if (!error) {
        order = data;
        orderError = null;
        break;
      }

      console.warn(`[Order Retry Loop] Insertion attempt ${attempts + 1} failed:`, error.message);
      orderError = error;

      let columnRemoved = false;
      for (const col of schemaSensitiveColumns) {
        if (orderDataToInsert[col] !== undefined && (
          error.message.includes(`column "${col}"`) || 
          error.message.includes(`'${col}' column`) || 
          error.message.includes(`"${col}" column`) ||
          error.message.includes(`find the '${col}' column`) ||
          error.message.includes(`find the "${col}" column`)
        )) {
          // 備份遭排除的欄位值，以便最後寫入 custom_logo_url 做防遺失保險
          serializedBackup[col] = orderDataToInsert[col];
          delete orderDataToInsert[col];
          columnRemoved = true;
          console.warn(`[Order Retry Loop] Pruned missing DB column "${col}" from write schema`);
          break;
        }
      }

      if (!columnRemoved) {
        // 如果無法明確辨識特定欄位名稱，將所有尚未排除的敏感欄位一次性移除，以求交易順利完成
        let hasKeys = false;
        for (const col of schemaSensitiveColumns) {
          if (orderDataToInsert[col] !== undefined) {
            serializedBackup[col] = orderDataToInsert[col];
            delete orderDataToInsert[col];
            hasKeys = true;
          }
        }
        if (!hasKeys) {
          break;
        }
      }

      // 備份所有被排除的欄位為 JSON 字串存入 custom_logo_url
      orderDataToInsert.custom_logo_url = `FALLBACK_JSON:${JSON.stringify(serializedBackup)}`;
    }

    if (orderError) throw orderError;

    // 3.5 建立訂單明細
    const orderItemsData = items.map(item => {
      const product = products.find(p => p.id === item.id);
      return {
        order_id: order.id,
        product_id: item.id,
        name: product?.name || '未知商品',
        quantity: item.quantity,
        price: product?.price || 0
      };
    });

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData);

    if (itemsError) {
      console.error('Order Items Error:', itemsError);
    }

    // 3.6 扣除庫存 (預扣)
    for (const item of items) {
      const product = products.find(p => p.id === item.id);
      if (product) {
        await supabase.from('products')
          .update({ stock_count: Math.max(0, (product.stock_count || 0) - item.quantity) })
          .eq('id', item.id);
      }
    }

    let message = `訂單建立成功！待管理員確認匯款後，系統將發放點數。`;

    // 4. 處理不同身份的結算邏輯 (此處暫停，移至管理員審核階段)
    // 只有通知買家
    await supabase.from('notifications').insert({
      member_id: buyer.id,
      title: '訂單已建立，待審核',
      content: `您的訂單 $${finalAmount.toLocaleString()} 已建立成功，請完成匯款。管理員將在 1-2 個工作天內核對入帳。`,
      type: 'order'
    });

    return NextResponse.json({ success: true, message, orderId: order.id });

  } catch (error: any) {
    console.error('Order Error:', error);
    return NextResponse.json({ success: false, error: '系統錯誤，請稍後再試' }, { status: 500 });
  }
}
