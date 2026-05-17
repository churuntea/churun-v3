import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

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
      return false;
    }
    return true;
  } catch (error) {
    console.error("sendLinePushNotification Error:", error);
    return false;
  }
}

export async function GET(request: Request) {
  try {
    // 1. 篩選超過 3 個月未登入，且 (從未通知過 或 超過 3 個月未通知) 的會員
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const threeMonthsAgoStr = threeMonthsAgo.toISOString();

    // 獲取所有符合條件的會員
    const { data: inactiveMembers, error } = await supabase
      .from('members')
      .select('id, name, line_id, last_login, last_inactive_notified_at')
      .not('line_id', 'is', null) // 必須有 LINE ID 才能通知
      .lt('last_login', threeMonthsAgoStr);

    if (error) {
      console.error('查詢未登入會員失敗:', error);
      return NextResponse.json({ success: false, error: '查詢失敗' }, { status: 500 });
    }

    if (!inactiveMembers || inactiveMembers.length === 0) {
      return NextResponse.json({ success: true, message: '沒有符合條件的會員' });
    }

    // 過濾出 (從未通知過 或 超過 3 個月未通知) 的會員
    const filteredMembers = inactiveMembers.filter(member => {
      if (!member.last_inactive_notified_at) return true;
      const lastNotified = new Date(member.last_inactive_notified_at);
      return lastNotified < threeMonthsAgo;
    });

    if (filteredMembers.length === 0) {
      return NextResponse.json({ success: true, message: '有未登入會員，但最近 3 個月內已通知過' });
    }

    let successCount = 0;
    const nowStr = new Date().toISOString();

    // 2. 迴圈發送通知並更新時間
    for (const member of filteredMembers) {
      const message = `親愛的 ${member.name}，您好！
好久沒見到您了，初潤製茶所非常想念您！
我們為您準備了專屬的優惠，快回來看新商品吧！`;

      const sent = await sendLinePushNotification(member.line_id, message);
      
      if (sent) {
        successCount++;
        // 更新通知時間
        await supabase
          .from('members')
          .update({ last_inactive_notified_at: nowStr })
          .eq('id', member.id);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `成功發送通知給 ${successCount} 位會員`,
      totalFound: filteredMembers.length
    });
  } catch (error: any) {
    console.error('執行定時任務異常:', error);
    return NextResponse.json({ success: false, error: error.message || '系統內部錯誤' }, { status: 500 });
  }
}
