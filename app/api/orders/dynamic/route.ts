import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '../../../supabase-admin';
import { getSession } from '@/lib/auth';

import * as fs from 'fs';
import * as path from 'path';

function calculateDueDate(startDateStr: string | null): string {
  const startDate = startDateStr ? new Date(startDateStr) : new Date();
  let count = 0;
  let currentDate = new Date(startDate);
  currentDate.setDate(currentDate.getDate() + 1);

  while (count < 3) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    if (count < 3) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const date = currentDate.getDate();

  return `${year}年${month}月${date}號`;
}

function getLineAccessToken(): string {
  if (process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    return process.env.LINE_CHANNEL_ACCESS_TOKEN;
  }
  try {
    const possiblePaths = [
      path.join(process.cwd(), '.env.local'),
      'd:/0_事業體/初潤製茶所_Gemini/churun-frontend/.env.local',
      path.resolve(process.cwd(), '../.env.local')
    ];
    for (const envPath of possiblePaths) {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('LINE_CHANNEL_ACCESS_TOKEN=')) {
            return trimmed.replace('LINE_CHANNEL_ACCESS_TOKEN=', '').trim();
          }
        }
      }
    }
  } catch (err) {
    console.warn('讀取 .env.local 失敗:', err);
  }
  return "zZ2xNjSpxGORDJ4RtQLwxm70PmN4SXmyT+tAknCS279x42aZAKnaYh3+cGxiw7ek4MPS8ZBUyJPzXv77Z8ZAvHcZFhJqhguUR74ZfEMQIoPxULNME0+xV4dz+Hzu1CA8FKgsXE3iYjmdA9RrrWtVwQdB04t89/1O/w1cDnyilFU=";
}

async function sendLinePushNotification(toUserId: string, text: string) {
  const token = getLineAccessToken();
  if (!toUserId || token === "DEFAULT_ACCESS_TOKEN") return;
  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: toUserId,
        messages: [
          {
            type: "text",
            text: text,
          },
        ],
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("[LINE Push Error] details:", errText);
    } else {
      console.log(`[LINE Push Success] Pushed to User ${toUserId}`);
    }
  } catch (err) {
    console.error("[LINE Push Network Error] failed to push message:", err);
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function logCompensation(event: any) {
  try {
    await supabase.from('compensation_logs').insert(event);
  } catch (err) {
    console.warn('[CompLog] compensation_logs insert failed, fallback to announcements', getErrorMessage(err));
    try {
      await supabase.from('announcements').insert({
        title: `[COMPENSATION] ${event.type || 'unknown'}`,
        tag: 'COMPENSATION',
        content: JSON.stringify(event),
        color: 'bg-yellow-800'
      });
    } catch (e) {
      console.error('[CompLog] fallback announcement failed', getErrorMessage(e));
    }
  }
}

async function orderNumberExists(orderNumber: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('id')
    .eq('order_number', orderNumber)
    .limit(1);
  return !error && Array.isArray(data) && data.length > 0;
}

async function generateUniqueOrderNumber() {
  const tzDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
  const yy = String(tzDate.getFullYear()).slice(-2);
  const mm = String(tzDate.getMonth() + 1).padStart(2, '0');
  const dd = String(tzDate.getDate()).padStart(2, '0');
  
  for (let attempt = 0; attempt < 10; attempt++) {
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .like('order_number', `O${yy}${mm}${dd}AA%`);

    const seqStr = String((count || 0) + 1 + attempt).padStart(2, '0');
    const orderNumber = `O${yy}${mm}${dd}AA${seqStr}`;

    if (!(await orderNumberExists(orderNumber))) {
      return orderNumber;
    }
  }

  return `O${yy}${mm}${dd}AA${String(Date.now() % 100).padStart(2, '0')}`;
}

async function cleanupIncompleteOrder(orderId: string) {
  try {
    await supabase.from('order_items').delete().eq('order_id', orderId);
    await supabase.from('orders').delete().eq('id', orderId);
  } catch (error: any) {
    console.error('[Cleanup] Failed to remove incomplete order', orderId, error.message);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const { buyer_id, memberId, items, discountAmount = 0, pointsRedeemed = 0, balanceRedeemed = 0, shippingInfo } = await request.json();
    const effectiveBuyerId = buyer_id || memberId || session?.memberId;

    if (!effectiveBuyerId) {
      console.error('[Order API] Missing effectiveBuyerId:', { buyer_id, memberId, sessionMemberId: session?.memberId });
      return NextResponse.json({ success: false, error: '缺少買家 ID，請重新登入' }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('[Order API] Missing or empty items:', { items });
      return NextResponse.json({ success: false, error: '您的購物車似乎沒有商品，請重新加入' }, { status: 400 });
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

    // 平階脫離邏輯與點數升級邏輯：先取得推廣者與購買者階級
    let canGiveCommission = false;
    let uplineLevel = 0;
    
    if (buyer.upline_id) {
      const { data: upline } = await supabase
        .from('members')
        .select('ambassador_type, ambassador_status, is_b2b')
        .eq('id', buyer.upline_id)
        .single();

      if (upline) {
        const getLevel = (m: any) => {
          if (m.ambassador_type === 'partner') return 2;
          if (m.ambassador_status === 'active' || m.ambassador_type === 'paid' || m.ambassador_type === 'free_performance') return 1;
          return 0;
        };

        const buyerLevel = getLevel(buyer);
        uplineLevel = getLevel(upline);
        canGiveCommission = uplineLevel > buyerLevel;
      }
    }

    for (const item of items) {
      const product = products.find(p => p.id === item.id);
      if (!product) continue;
      
      if ((product.stock_count || 0) < item.quantity) {
        return NextResponse.json({ success: false, error: `商品「${product.name}」庫存不足，剩餘數量：${product.stock_count || 0}` }, { status: 400 });
      }
      
      const itemSubtotal = product.price * item.quantity;
      totalAmount += itemSubtotal;
      
      if (buyer.is_b2b && canGiveCommission) {
        totalB2BCommission += Math.floor(itemSubtotal * (product.b2b_commission_percent / 100));
      }
    }

    // 3. 計算扣除折抵後的商品實付淨額
    const subtotalAfterDiscount = Math.max(0, totalAmount - discountAmount);
    const finalAmount = Math.max(0, subtotalAfterDiscount - balanceRedeemed - pointsRedeemed);

    // B2C 點數回饋改為依據「扣除折抵後的商品實付淨額」計算（運費絕對不計入回饋點數）
    // 若直推上線為品牌大使或以上 (uplineLevel >= 1)，則購買者的點數發放率直接升級為品牌大使超高趴數 (30元換1點)
    let tierRate = TIER_RATES[buyer.tier] || 100;
    if (uplineLevel >= 1) {
      tierRate = 30; // 強制升級比照初潤靈魂伴侶
    }
    
    const TIER_NEW_ARRIVAL_QUOTA: Record<string, number> = {
      '初潤靈魂伴侶': 8,
      '初潤知己': 7,
      '初潤閨蜜': 6,
      '初潤好朋友': 5,
      '初潤青少年': 4,
      '初潤小朋友': 3,
      '初潤幼兒園': 2,
      '初潤寶寶': 1
    };
    const newArrivalQuota = TIER_NEW_ARRIVAL_QUOTA[buyer.tier] || 1;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime();

    // 先取得該會員過去所有非取消的訂單ID，用於後續檢查購買次數
    const { data: userOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('member_id', buyer.id)
      .neq('status', 'cancelled');
    const userOrderIds = (userOrders || []).map((o: any) => o.id);

    totalB2CPoints = 0;
    for (const item of items) {
      const product = products.find(p => p.id === item.id);
      if (!product) continue;

      const itemSubtotal = product.price * item.quantity;
      const itemShare = totalAmount > 0 ? (itemSubtotal / totalAmount) : 0;
      const itemFinalAmount = finalAmount * itemShare;
      
      let itemPoints = itemFinalAmount / tierRate;

      const productCreatedAt = new Date(product.created_at).getTime();
      if (productCreatedAt >= thirtyDaysAgo) {
        let pastCount = 0;
        if (userOrderIds.length > 0) {
          const { data: userPastItems } = await supabase
            .from('order_items')
            .select('id')
            .eq('product_id', product.id)
            .in('order_id', userOrderIds);
          pastCount = userPastItems ? userPastItems.length : 0;
        }
        
        if (pastCount < newArrivalQuota) {
          itemPoints *= 2; // 該筆新品實付金額雙倍點數！
        }
      }

      totalB2CPoints += itemPoints;
    }

    totalB2CPoints = Math.floor(totalB2CPoints);
    
    // 計算運費邏輯：自取為 $0，超商取貨或宅配到府若金額 999 內收 $70，1000 以上免運
    // 運費免運門檻以扣除優惠券/套組折扣後的金額為準，不扣除紅利點數與儲值金
    let shippingFee = 0;
    if (shippingInfo && shippingInfo.method !== '自取') {
      shippingFee = finalAmount >= 1000 ? 0 : 70;
    }
    const orderTotalAmount = finalAmount + shippingFee;

    // 產生人性化訂單編號 (會員 B, 合夥人 P, 品牌大使 A)
    let buyerPrefix = 'B';
    if (buyer.is_b2b) {
      if (buyer.tier === 'ambassador' || buyer.tier === '初潤知己' || buyer.tier === '初潤靈魂伴侶' || buyer.type === 'ambassador') {
        buyerPrefix = 'A';
      } else {
        buyerPrefix = 'P';
      }
    }
    const orderNumber = await generateUniqueOrderNumber();
    
    const orderData: any = {
      member_id: buyer.id,
      total_amount: orderTotalAmount, // 儲存包含運費後的總計金額
      original_amount: totalAmount,
      status: 'pending',
      reward_points: totalB2CPoints,
      b2b_commission: totalB2BCommission,
      order_number: orderNumber,
      notes: [
        balanceRedeemed > 0 ? `儲值金折抵 $${balanceRedeemed} 元` : '',
        pointsRedeemed > 0 ? `紅利點數折抵 ${pointsRedeemed} 點 ($${pointsRedeemed} 元)` : ''
      ].filter(Boolean).join('；')
    };

    if (shippingInfo) {
      orderData.shipping_info = {
        name: shippingInfo.name,
        phone: shippingInfo.phone,
        address: shippingInfo.address,
        method: shippingInfo.method || '宅配到府',
        sender_name: shippingInfo.senderName || '',
        sender_phone: shippingInfo.senderPhone || '',
        sender_address: shippingInfo.senderAddress || '',
        sender_notes: shippingInfo.senderNotes || '',
        shipping_fee: shippingFee // 額外紀錄運費，方便前端與後台明細讀取
      };
      if (shippingInfo.notes) {
        orderData.notes = shippingInfo.notes;
      }
    }

    let orderDataToInsert = { ...orderData };
    let order = null;
    let orderError = null;

    // 定義可能缺失的自訂擴充欄位，當發生 DB 欄位不存在錯誤時會自動排除並進行備份
    const schemaSensitiveColumns = ['shipping_info', 'notes', 'reward_points', 'b2b_commission', 'bank_last_five', 'order_number'];
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

    // 3.5 建立訂單明細、扣庫存、扣點與扣儲值金 — 全步驟採追蹤式補償
    const createdPointTxIds: any[] = [];
    const createdWalletTxIds: any[] = [];
    const createdOrderItemIds: any[] = [];
    const productStockBackups: Array<{ id: any; original: number }> = [];
    const originalMemberPoints = buyer.points_balance || 0;
    const originalMemberVirtual = buyer.virtual_balance || 0;

    try {
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

      const { data: insertedItems, error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData)
        .select('id');

      if (itemsError) throw itemsError;
      for (const it of insertedItems || []) createdOrderItemIds.push(it.id);

      // 3.6 扣除庫存 (預扣) — 並記錄原始庫存
      for (const item of items) {
        const product = products.find(p => p.id === item.id);
        if (product) {
          const originalStock = product.stock_count || 0;
          const newStock = Math.max(0, originalStock - item.quantity);
          productStockBackups.push({ id: product.id, original: originalStock });
          
          const { error: updErr } = await supabase.from('products')
            .update({ stock_count: newStock })
            .eq('id', item.id);
          if (updErr) throw updErr;

          // 低庫存警告 (從 >=30 跌破 30 時觸發)
          if (originalStock >= 30 && newStock < 30) {
            const adminIds = process.env.ADMIN_LINE_IDS ? process.env.ADMIN_LINE_IDS.split(',') : ["U8881a77ac132ebe336d41182ddd370ae", "Uc3cd7b2d60c48866bc20bb5077c66b35"];
            const alertText = `⚠️ 【系統自動偵測】安全庫存警告 ⚠️\n━━━━━━━━━━━━━━━━━━\n商品名稱：${product.name}\n目前剩餘庫存：${newStock} 件\n\n此商品庫存已低於 30 件的安全水位，請盡速安排補貨！`;
            for (const adminId of adminIds) {
              if (adminId && adminId.trim()) {
                // 不 await blocking 主流程，背景執行即可，加上 catch 防範網路錯誤
                sendLinePushNotification(adminId.trim(), alertText).catch(e => console.error("Low stock alert push failed:", e));
              }
            }
          }
        }
      }

      // 3.7 扣減買家紅利點數與建立點數明細
      if (pointsRedeemed > 0) {
        const { error: pointsUpdateError } = await supabase
          .from('members')
          .update({ points_balance: Math.max(0, (buyer.points_balance || 0) - pointsRedeemed) })
          .eq('id', buyer.id);

        if (pointsUpdateError) throw pointsUpdateError;

        const { data: ptTxData, error: ptTxError } = await supabase
          .from('point_transactions')
          .insert({
            member_id: buyer.id,
            order_id: order.id,
            amount: -pointsRedeemed,
            transaction_type: 'redeemed'
          })
          .select('id');

        if (ptTxError) throw ptTxError;
        for (const tx of ptTxData || []) createdPointTxIds.push(tx.id);
      }

      // 3.8 扣減儲值金與建立錢包明細
      if (balanceRedeemed > 0) {
        const { error: balanceUpdateError } = await supabase
          .from('members')
          .update({ virtual_balance: Math.max(0, (buyer.virtual_balance || 0) - balanceRedeemed) })
          .eq('id', buyer.id);

        if (balanceUpdateError) throw balanceUpdateError;

        const { data: walletTxData, error: walletTxError } = await supabase
          .from('wallet_transactions')
          .insert({
            member_id: buyer.id,
            order_id: order.id,
            amount: -balanceRedeemed,
            transaction_type: 'payment',
            status: 'completed'
          })
          .select('id');

        if (walletTxError) throw walletTxError;
        for (const tx of walletTxData || []) createdWalletTxIds.push(tx.id);
      }

    } catch (stepErr: any) {
      console.error('[Order Compensation] Error during post-order steps:', stepErr.message || stepErr);
      await logCompensation({
        type: 'order_creation_failure',
        order_id: order?.id,
        order_number: orderNumber,
        error: (stepErr && stepErr.message) || String(stepErr),
        createdPointTxIds,
        createdWalletTxIds,
        createdOrderItemIds,
        productStockBackups,
        timestamp: new Date().toISOString()
      });
      // 補償：反向刪除已建立的交易與明細
      try {
        if (createdPointTxIds.length > 0) {
          await supabase.from('point_transactions').delete().in('id', createdPointTxIds);
        }
      } catch (e: any) {
        console.error('[Compensate] Failed to delete point txs:', e.message);
      }

      try {
        if (createdWalletTxIds.length > 0) {
          await supabase.from('wallet_transactions').delete().in('id', createdWalletTxIds);
        }
      } catch (e: any) {
        console.error('[Compensate] Failed to delete wallet txs:', e.message);
      }

      try {
        if (createdOrderItemIds.length > 0) {
          await supabase.from('order_items').delete().in('id', createdOrderItemIds);
        }
      } catch (e: any) {
        console.error('[Compensate] Failed to delete order items:', e.message);
      }

      try {
        // 還原會員點數與儲值金
        await supabase.from('members').update({ points_balance: originalMemberPoints }).eq('id', buyer.id);
        await supabase.from('members').update({ virtual_balance: originalMemberVirtual }).eq('id', buyer.id);
      } catch (e: any) {
        console.error('[Compensate] Failed to restore member balances:', e.message);
      }

      try {
        // 還原商品庫存
        for (const p of productStockBackups) {
          await supabase.from('products').update({ stock_count: p.original }).eq('id', p.id);
        }
      } catch (e: any) {
        console.error('[Compensate] Failed to restore product stocks:', e.message);
      }

      // 最後移除訂單
      try {
        await cleanupIncompleteOrder(order.id);
      } catch (e: any) {
        console.error('[Compensate] Failed to cleanup incomplete order:', e.message);
      }

      return NextResponse.json({ success: false, error: '訂單建立失敗，已回滾變更' }, { status: 500 });
    }

    let message = `訂單建立成功！待管理員確認匯款後，系統將發放點數。`;

    // 4. 處理不同身份的結算邏輯 (此處暫停，移至管理員審核階段)
    // 只有通知買家
    await supabase.from('notifications').insert({
      member_id: buyer.id,
      title: '訂單已建立，待審核',
      content: `您的訂單 $${orderTotalAmount.toLocaleString()} 已建立成功，請完成匯款。管理員將在 1-2 個工作天內核對入帳。`,
      type: 'order'
    });

    // ⚡ 發送 LINE 推播通知給買家 (跨帳號手機號碼智慧搜尋：比對 buyer.line_id 或是手機號碼相同之綁定帳戶)
    let targetLineId = buyer.line_id;
    const orderPhone = shippingInfo?.phone || buyer.phone;
    
    if (!targetLineId && orderPhone) {
      const { data: matchedMember } = await supabase
        .from('members')
        .select('line_id')
        .eq('phone', orderPhone)
        .not('line_id', 'is', null)
        .limit(1)
        .maybeSingle();

      if (matchedMember && matchedMember.line_id) {
        targetLineId = matchedMember.line_id;
        console.log(`[LINE Push Match] Found line_id via phone ${orderPhone}`);
      }
    }

    if (targetLineId) {
      let itemsList = "";
      items.forEach((item) => {
        const product = products.find(p => p.id === item.id);
        if (product) {
          itemsList += `• ${product.name} x ${item.quantity} ($${(product.price * item.quantity).toLocaleString()} 元)\n`;
        }
      });

      const pushText = `📦 【初潤製茶所】下單成功通知 📦
━━━━━━━━━━━━━━━━━━
親愛的茶友 ${shippingInfo?.name || buyer.name} 您好：

您的特選精品採購訂單已成功建立！
● 訂單編號：${orderNumber}
● 商品小計：$${totalAmount.toLocaleString()} 元
● 優惠折抵：-$${discountAmount.toLocaleString()} 元
● 儲值金折抵：-$${balanceRedeemed.toLocaleString()} 元
● 紅利折抵：-$${pointsRedeemed.toLocaleString()} 點 ($${pointsRedeemed.toLocaleString()} 元)
● 運費金額：$${shippingFee.toLocaleString()} 元
● 採購總額：$${orderTotalAmount.toLocaleString()} 元
● 匯款期限：${calculateDueDate(null)} 24點前
● 物流方式：${shippingInfo?.method || '宅配到府'}
● 配送收件人：${shippingInfo?.name || buyer.name}
━━━━━━━━━━━━━━━━━━
🍵 採購商品明細：
${itemsList}━━━━━━━━━━━━━━━━━━
💡 提示：本訂單出貨將由【初潤出貨物流中心】專屬處理。請隨時在官方 LINE 點擊快捷鍵查詢配送進度：
👉 https://line.me/R/ti/p/@947vpgjp (LINE ID: @947vpgjp)`;

      await sendLinePushNotification(targetLineId, pushText);
    }


    // ⚡ 同步推播給 947 官方帳號管理團隊 (洪召安、王守芳或設定的 ADMIN_LINE_IDS)
    let itemsListAdmin = "";
    items.forEach((item) => {
      const product = products.find(p => p.id === item.id);
      if (product) {
        itemsListAdmin += `• ${product.name} x ${item.quantity} ($${(product.price * item.quantity).toLocaleString()} 元)\n`;
      }
    });

    const adminPushText = `📢 【947 出貨指揮站】新訂單進件通知 📦
━━━━━━━━━━━━━━━━━━
報告管理員，收到一筆全新精品茶葉採購單！
● 訂單編號：${orderNumber}
● 下單會員：${buyer.name} (${buyer.phone || '無電話'})
● 會員階級：${buyer.tier}
● 商品小計：$${totalAmount.toLocaleString()} 元
● 優惠折抵：-$${discountAmount.toLocaleString()} 元
● 儲值金折抵：-$${balanceRedeemed.toLocaleString()} 元
● 紅利折抵：-$${pointsRedeemed.toLocaleString()} 點 ($${pointsRedeemed.toLocaleString()} 元)
● 採購總額：$${orderTotalAmount.toLocaleString()} 元
● 物流方式：${shippingInfo?.method || '宅配到府'}
● 配送收件人：${shippingInfo?.name || buyer.name}
● 配送地址：${shippingInfo?.address || '自取/無'}
━━━━━━━━━━━━━━━━━━
🍵 訂購商品明細：
${itemsListAdmin}━━━━━━━━━━━━━━━━━━
⚡ 系統提示：請登入出貨管理後台進行訂單核對與物流單號派發！`;

    const adminIds = process.env.ADMIN_LINE_IDS ? process.env.ADMIN_LINE_IDS.split(',') : ["U8881a77ac132ebe336d41182ddd370ae", "Uc3cd7b2d60c48866bc20bb5077c66b35"];
    for (const adminId of adminIds) {
      if (adminId && adminId.trim()) {
        await sendLinePushNotification(adminId.trim(), adminPushText);
      }
    }

    return NextResponse.json({ success: true, message, orderId: order.id, orderNumber: order.order_number });

  } catch (error: any) {
    console.error('Order Error:', error);
    return NextResponse.json({ success: false, error: '系統錯誤，請稍後再試' }, { status: 500 });
  }
}
