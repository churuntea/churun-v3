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
  if (!toUserId || token === "DEFAULT_ACCESS_TOKEN") return { success: false, reason: "No user ID or token" };
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
      return { success: false, reason: errText };
    } else {
      console.log(`[LINE Push Success] Pushed to User ${toUserId}`);
      return { success: true };
    }
  } catch (err: any) {
    console.error("[LINE Push Network Error] failed to push message:", err);
    return { success: false, reason: err.message };
  }
}

export async function POST(request: Request) {
  try {
    const { orders } = await request.json();
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json({ success: false, error: '缺少訂單資料' }, { status: 400 });
    }

    let pushStatusMessage = "";

    for (const item of orders) {
      const { orderId, status = 'shipped', trackingNumber } = item;
      
      // 獲取當前訂單以進行 JSON 備份寫入 (以防資料庫無 shipped_at 欄位)
      let customLogoVal = "";
      try {
        const { data: currOrd } = await supabase.from('orders').select('custom_logo_url').eq('id', orderId).single();
        if (currOrd) customLogoVal = currOrd.custom_logo_url || "";
      } catch (e) {}

      let shippedAtStr = new Date().toISOString();
      let updatedCustomLogo = customLogoVal;

      if (status === 'shipped') {
        if (customLogoVal.startsWith('FALLBACK_JSON:')) {
          try {
            const parsed = JSON.parse(customLogoVal.substring('FALLBACK_JSON:'.length));
            parsed.shipped_at = shippedAtStr;
            updatedCustomLogo = 'FALLBACK_JSON:' + JSON.stringify(parsed);
          } catch (e) {}
        } else {
          updatedCustomLogo = 'FALLBACK_JSON:' + JSON.stringify({
            original_logo_url: customLogoVal,
            shipped_at: shippedAtStr
          });
        }
      }

      const updatePayload: any = { 
        fulfillment_status: status,
        shipped_at: status === 'shipped' ? shippedAtStr : null,
        custom_logo_url: updatedCustomLogo
      };
      if (trackingNumber !== undefined) {
        updatePayload.tracking_number = trackingNumber;
      }

      // 1. 更新資料庫
      const { error: updateError } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId);

      if (updateError) {
        console.error(`[Order Ship Error] Failed to update order ${orderId}:`, updateError);
        continue;
      }

      // 2. 查詢該訂單與會員資料以便發送通知
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          members (
            id,
            name,
            line_id
          ),
          order_items (
            name,
            quantity,
            price
          )
        `)
        .eq('id', orderId)
        .single();

      if (!orderError && orderData && orderData.members) {
        const buyer = orderData.members;
        const trackingStr = trackingNumber || orderData.tracking_number || '無單號 / 專人配送';
        const shippingInfo = orderData.shipping_info || {};
        const methodStr = shippingInfo.method || '宅配到府';
        const addressStr = shippingInfo.address || '自取/無';

        let itemsList = "";
        if (orderData.order_items && Array.isArray(orderData.order_items)) {
          orderData.order_items.forEach((it: any) => {
            itemsList += `• ${it.name} x ${it.quantity}\n`;
          });
        }

        // 寫入站內通知
        if (status === 'shipped') {
          await supabase.from('notifications').insert({
            member_id: buyer.id,
            title: '訂單已出貨 🚚',
            content: `您的訂單 #${(orderData.order_number || orderData.id).slice(0, 8)} 已經出貨！物流方式: ${methodStr}, 單號: ${trackingStr}`,
            type: 'order'
          });

          // 若會員已綁定 LINE，連通官方帳號 947 發送推播
          if (buyer.line_id) {
            const pushText = `🚚 【初潤製茶所】出貨通知 🚚
━━━━━━━━━━━━━━━━━━
親愛的茶友 ${buyer.name} 您好：

您的特選精品好茶包裹已經為您寄出囉！
● 訂單編號：${orderData.order_number || orderData.id.slice(0, 8)}
● 採購總額：$${Number(orderData.total_amount || 0).toLocaleString()} 元
● 物流方式：${methodStr}
● 配送地址：${addressStr}
● 物流單號：${trackingStr}
━━━━━━━━━━━━━━━━━━
🍵 出貨商品明細：
${itemsList}━━━━━━━━━━━━━━━━━━
📦 配送進度追蹤與出貨諮詢，歡迎直接於此官方帳號 (@947vpgjp) 與出貨物流專員即時對接核對！`;

            const pushResult = await sendLinePushNotification(buyer.line_id, pushText);
            if (pushResult && pushResult.success) {
              pushStatusMessage = "出貨及 LINE 官方帳號推播成功！";
            } else {
              pushStatusMessage = `出貨成功！(註：LINE 推播失敗或設定錯誤 - ${pushResult?.reason})`;
            }
          } else {
            pushStatusMessage = "出貨狀態更新成功！(註：此會員尚未綁定 LINE 帳號，因此未發送推播)";
          }

          // ⚡ 同步推播出貨完成紀錄給 947 官方帳號管理團隊
          const adminPushText = `📢 【947 出貨指揮站】訂單出貨完成通知 🚚
━━━━━━━━━━━━━━━━━━
報告管理員，一筆訂單已成功標記出貨！
● 訂單編號：${orderData.order_number || orderData.id.slice(0, 8)}
● 收件會員：${buyer.name}
● 採購總額：$${Number(orderData.total_amount || 0).toLocaleString()} 元
● 物流方式：${methodStr}
● 配送單號：${trackingStr}
━━━━━━━━━━━━━━━━━━
🍵 出貨商品明細：
${itemsList}━━━━━━━━━━━━━━━━━━
⚡ 系統提示：出貨狀態已同步更新至 Supabase 資料庫與買家通知中心！`;

          const adminIds = process.env.ADMIN_LINE_IDS ? process.env.ADMIN_LINE_IDS.split(',') : ["U8881a77ac132ebe336d41182ddd370ae", "Uc3cd7b2d60c48866bc20bb5077c66b35"];
          for (const adminId of adminIds) {
            if (adminId && adminId.trim()) {
              await sendLinePushNotification(adminId.trim(), adminPushText);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: pushStatusMessage || '出貨處理成功！' });

  } catch (error: any) {
    console.error('Ship API Error:', error);
    return NextResponse.json({ success: false, error: '系統錯誤' }, { status: 500 });
  }
}
