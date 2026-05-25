import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/supabase-admin';

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

async function sendLinePushNotification(toUserId: string, text: string) {
  if (!LINE_CHANNEL_ACCESS_TOKEN || !toUserId) {
    console.warn("Missing LINE credentials or target User ID for Push Message.");
    return false;
  }
  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        to: toUserId,
        messages: [{ type: "text", text: text }]
      })
    });
    if (!res.ok) {
      const errTxt = await res.text();
      console.error(`LINE Push API Error (to: ${toUserId}):`, errTxt);
      return errTxt;
    }
    return "OK";
  } catch (error) {
    console.error("sendLinePushNotification Error:", error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { items, adminName = "系統管理員" } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "沒有收到任何採購項目" }, { status: 400 });
    }

    const orderId = `PO-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Math.floor(Math.random()*9000+1000)}`;
    const nowStr = new Date().toISOString();

    // 1. 建立草稿狀態的進貨單 (inventory_logs)
    const logPromises = items.map((item: any) => {
      return supabaseAdmin.from("inventory_logs").insert({
        product_name: item.name,
        category: item.category || "極萃系列",
        quantity: item.suggested_qty,
        unit_cost: item.cost_price || 0,
        supplier: item.supplier || "未指定",
        type: "inbound", // 代表進貨單
        notes: `一鍵智慧採購單 (${orderId}) - 草稿待入庫`,
        status: "待入庫"
      });
    });

    await Promise.all(logPromises);

    // 2. 準備 LINE 推播內容
    let itemsList = "";
    items.forEach((item: any) => {
      itemsList += `• ${item.name}\n  (建議採購量: ${item.suggested_qty} 件)\n`;
    });

    const adminPushText = `📢 【947 庫存指揮站】智慧採購申請單 📦
━━━━━━━━━━━━━━━━━━
報告採購總管，系統已透過「一鍵訂貨系統」自動發出低庫存補貨申請！
● 採購單號：${orderId}
● 申請人員：${adminName}
● 申請時間：${nowStr.slice(0, 19).replace('T', ' ')}
━━━━━━━━━━━━━━━━━━
🍵 建議採購品項清單：
${itemsList}━━━━━━━━━━━━━━━━━━
⚡ 系統提示：以上進貨草稿單已建立，請廠商到貨後進入 ERP 系統確認入庫！`;

    // 3. 推播給系統管理員 (Option C)
    let adminIds = process.env.ADMIN_LINE_IDS ? process.env.ADMIN_LINE_IDS.split(',') : ["U8881a77ac132ebe336d41182ddd370ae", "Uc3cd7b2d60c48866bc20bb5077c66b35"];
    
    // 動態去資料庫抓取 0939734771 的 line_id 並加入推播名單
    const { data: member } = await supabaseAdmin.from('members').select('line_id').eq('phone', '0939734771').maybeSingle();
    if (member && member.line_id && !adminIds.includes(member.line_id)) {
      adminIds.push(member.line_id);
    }

    let debugInfo = {
      lineTokenExists: !!LINE_CHANNEL_ACCESS_TOKEN,
      adminIdsChecked: adminIds,
      memberLineIdFound: member?.line_id || null,
      pushResults: [] as any[]
    };

    for (const adminId of adminIds) {
      if (adminId && adminId.trim()) {
        const success = await sendLinePushNotification(adminId.trim(), adminPushText);
        debugInfo.pushResults.push({ id: adminId, success });
      }
    }

    return NextResponse.json({ success: true, orderId, debugInfo });
  } catch (error: any) {
    console.error("Smart Order Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
