import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

import * as fs from 'fs';
import * as path from 'path';

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

export async function POST(request: Request) {
  try {
    const { buyer_id, memberId, items, discountAmount = 0, pointsRedeemed = 0, shippingInfo } = await request.json();
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
      
      // 只有當買家具備 B2B 創業合夥人身分時，才計算 B2B 專屬退傭
      if (buyer.is_b2b) {
        totalB2BCommission += Math.floor(itemSubtotal * (product.b2b_commission_percent / 100));
      }
    }

    // B2C 點數回饋改為依據「會員階級匯率」計算
    const tierRate = TIER_RATES[buyer.tier] || 100;
    totalB2CPoints = Math.floor(totalAmount / tierRate);

    // 3. 建立訂單 (狀態改為 pending，待管理者確認)
    const finalAmount = Math.max(0, totalAmount - discountAmount - pointsRedeemed);
    
    // 計算運費邏輯：自取為 $0，超商取貨或宅配到府若金額 999 內收 $70，1000 以上免運
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
    const date = new Date();
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
    const yy = String(tzDate.getFullYear()).slice(-2);
    const mm = String(tzDate.getMonth() + 1).padStart(2, '0');
    const dd = String(tzDate.getDate()).padStart(2, '0');
    const dateString = `${yy}${mm}${dd}`;

    const startOfDay = new Date(tzDate.getFullYear(), tzDate.getMonth(), tzDate.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(tzDate.getFullYear(), tzDate.getMonth(), tzDate.getDate(), 23, 59, 59, 999);
    const startOfDayUTC = new Date(startOfDay.getTime() - (8 * 60 * 60 * 1000));
    const endOfDayUTC = new Date(endOfDay.getTime() - (8 * 60 * 60 * 1000));

    const { count, error: countError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfDayUTC.toISOString())
      .lte('created_at', endOfDayUTC.toISOString());

    const seqStr = String((count || 0) + 1).padStart(4, '0');
    const orderNumber = `${buyerPrefix}${dateString}A${seqStr}`;
    
    const orderData: any = {
      member_id: buyer.id,
      total_amount: orderTotalAmount, // 儲存包含運費後的總計金額
      original_amount: totalAmount,
      status: 'pending',
      reward_points: totalB2CPoints,
      b2b_commission: totalB2BCommission,
      order_number: orderNumber,
      notes: pointsRedeemed > 0 ? `紅利點數折抵 ${pointsRedeemed} 點 ($${pointsRedeemed} 元)` : ''
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

    // 3.7 扣減買家紅利點數與建立點數明細
    if (pointsRedeemed > 0) {
      await supabase
        .from('members')
        .update({ points_balance: Math.max(0, (buyer.points_balance || 0) - pointsRedeemed) })
        .eq('id', buyer.id);

      await supabase
        .from('point_transactions')
        .insert({
          member_id: buyer.id,
          order_id: order.id,
          amount: -pointsRedeemed,
          transaction_type: 'redeemed'
        });
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

    // ⚡ 發送 LINE 推播通知給買家 (若買家已綁定 LINE)
    if (buyer.line_id) {
      let itemsList = "";
      items.forEach((item, idx) => {
        const product = products.find(p => p.id === item.id);
        if (product) {
          itemsList += `• ${product.name} x ${item.quantity} ($${(product.price * item.quantity).toLocaleString()} 元)\n`;
        }
      });

      const pushText = `📦 【初潤製茶所】下單成功通知 📦
━━━━━━━━━━━━━━━━━━
親愛的茶友 ${buyer.name} 您好：

您的特選精品採購訂單已成功建立！
● 訂單編號：${orderNumber}
● 商品小計：$${totalAmount.toLocaleString()} 元
● 優惠折抵：-$${discountAmount.toLocaleString()} 元
● 紅利折抵：-$${pointsRedeemed.toLocaleString()} 點 ($${pointsRedeemed.toLocaleString()} 元)
● 運費金額：$${shippingFee.toLocaleString()} 元
● 採購總額：$${orderTotalAmount.toLocaleString()} 元
● 物流方式：${shippingInfo?.method || '宅配到府'}
● 配送收件人：${shippingInfo?.name || buyer.name}
━━━━━━━━━━━━━━━━━━
🍵 採購商品明細：
${itemsList}━━━━━━━━━━━━━━━━━━
💡 提示：本訂單出貨將由【初潤出貨物流中心】專屬處理。請加入下方出貨客服 LINE 帳號，由專員快速為您對接安排：
👉 https://line.me/R/ti/p/@947vpgjp (LINE ID: @947vpgjp)`;

      await sendLinePushNotification(buyer.line_id, pushText);
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
