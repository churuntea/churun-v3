import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/supabase-admin";
import * as crypto from "crypto";

// 取得環境變數（支援本機設定與 Vercel 後台，附帶萬用測試用備用金鑰）
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || "GCb9cTmbIB3N+ZxXPZCNCZSFxOfDT1L7151VIH0+FHAtHkgH00bds9IBGjwsxBF1kHFNg+o4p4r6I4EMAk29GaecSbE3MbdV55CB9VeWaQSapfCG8P9an2pSYgKwGrBJdEPsGTsrGvNRwQXagSmEuQdB04t89/1O/w1cDnyilFU=";
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || "3fc8a4b8b0d5d87e512e2fe6fa90dc8f";

/**
 * LINE Webhook 進入點
 */
export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get("x-line-signature") || "";

    console.log("[LINE Webhook] 收到請求長度:", bodyText.length);

    // 1. 安全簽章驗證（若設定了 LINE_CHANNEL_SECRET 則進行嚴格檢查）
    if (LINE_CHANNEL_SECRET) {
      const hash = crypto
        .createHmac("sha256", LINE_CHANNEL_SECRET)
        .update(bodyText)
        .digest("base64");
      
      if (hash !== signature) {
        console.warn("[LINE Webhook] 簽章驗證失敗！拒絕請求。");
        return new NextResponse("Invalid Signature", { status: 401 });
      }
    } else {
      console.log("[LINE Webhook] 未設定 LINE_CHANNEL_SECRET，跳過簽章安全性檢查（開發測試模式）");
    }

    const payload = JSON.parse(bodyText);
    const events = payload.events || [];

    // 遍歷所有 LINE 伺服器傳入的事件
    for (const event of events) {
      if (event.type === "message" && event.message.type === "text") {
        const replyToken = event.replyToken;
        const userId = event.source.userId;
        const userText = event.message.text.trim();

        console.log(`[LINE Bot] 收到來自使用者 [${userId}] 的訊息: "${userText}"`);

        // 2. 查詢 Supabase 判定使用者是否已綁定此 LINE 帳號
        const { data: member, error } = await supabaseAdmin
          .from("members")
          .select("*")
          .eq("line_id", userId)
          .maybeSingle();

        if (member) {
          // ==========================================
          // A. 方案：已綁定會員的交談邏輯 (1-9 選單回覆)
          // ==========================================
          await handleLinkedUserFlow(replyToken, userId, member, userText);
        } else {
          // ==========================================
          // B. 方案：未綁定會員的交談邏輯 (引導綁定流程)
          // ==========================================
          await handleUnlinkedUserFlow(replyToken, userId, userText);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[LINE Webhook] 執行中出錯:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * 處理「已綁定會員」的回覆邏輯
 */
async function handleLinkedUserFlow(replyToken: string, userId: string, member: any, input: string) {
  let replyMsg = "";

  switch (input) {
    case "1": {
      // 我的會員帳號資訊
      replyMsg = `👤 我的會員帳號資訊
━━━━━━━━━━━━━━━━━━
● 姓名：${member.name}
● 會員代碼：${member.member_code || "尚無系統代碼"}
● 職級階級：${member.tier} 👑
● 推薦代碼：${member.referral_code}
● 身分屬性：${member.is_b2b ? "創業夥伴 (B2B) 👔" : "一般茶友 (B2C) 🍵"}
● 綁定狀態：已安全綁定 LINE 帳號 ✅
━━━━━━━━━━━━━━━━━━
💡 提示：輸入「查詢」回到主選單`;
      break;
    }

    case "2": {
      // 預收款與點數餘額
      const vBal = Number(member.virtual_balance || 0).toLocaleString();
      const pBal = Number(member.points_balance || 0).toLocaleString();
      const lifeSpend = Number(member.lifetime_spend || 0).toLocaleString();
      
      replyMsg = `💰 預收款與點數餘額
━━━━━━━━━━━━━━━━━━
● 可用預收款：$${vBal} 元
● 消費積分餘額：${pBal} 點 🪙
● 累計消費總額：$${lifeSpend} 元
● 初始首儲儲值：$${Number(member.initial_deposit || 0).toLocaleString()} 元
━━━━━━━━━━━━━━━━━━
💡 提示：輸入「查詢」回到主選單`;
      break;
    }

    case "3": {
      // 最新採購訂單狀態
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("member_id", member.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (order) {
        const orderDate = new Date(order.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
        const statusMap: { [key: string]: string } = {
          pending: "處理中 ⏳",
          paid: "已付款待出貨 💳",
          shipping: "配送中 🚚",
          completed: "已完成交付 ✅",
          cancelled: "已取消 ✕",
        };
        const orderStatus = statusMap[order.status] || order.status;

        replyMsg = `📦 最新採購訂單狀態
━━━━━━━━━━━━━━━━━━
● 訂單編號：${order.id.slice(0, 8)}...
● 採購總金額：$${Number(order.total_amount).toLocaleString()} 元
● 訂單狀態：${orderStatus}
● 下單時間：${orderDate}
● 運送備註：${order.custom_logo_url || "無"}
━━━━━━━━━━━━━━━━━━
💡 提示：輸入「查詢」回到主選單`;
      } else {
        replyMsg = `📦 最新採購訂單狀態
━━━━━━━━━━━━━━━━━━
您目前在「初潤」尚無任何採購訂單紀錄。
歡迎您至官方網站挑選喜愛的精品好茶！
━━━━━━━━━━━━━━━━━━
💡 提示：輸入「查詢」回到主選單`;
      }
      break;
    }

    case "4": {
      // 我的未折抵優惠券
      const { data: mCoupons } = await supabaseAdmin
        .from("member_coupons")
        .select(`
          id,
          coupons (
            code,
            name,
            discount_type,
            value,
            min_spend,
            description
          )
        `)
        .eq("member_id", member.id)
        .eq("is_used", false)
        .limit(3);

      if (mCoupons && mCoupons.length > 0) {
        let listStr = "";
        mCoupons.forEach((mc: any, index: number) => {
          const cp = mc.coupons;
          if (cp) {
            const discount = cp.discount_type === "fixed" ? `$${cp.value}` : `${100 - cp.value}折`;
            listStr += `\n[${index + 1}] ${cp.name}\n代碼：${cp.code}\n折抵：${discount} (滿 ${cp.min_spend} 可用)\n`;
          }
        });

        replyMsg = `🎟️ 我的未折抵優惠券
━━━━━━━━━━━━━━━━━━
您的專屬券夾中尚有以下可用優惠券：
${listStr}━━━━━━━━━━━━━━━━━━
💡 提示：輸入「查詢」回到主選單`;
      } else {
        replyMsg = `🎟️ 我的未折抵優惠券
━━━━━━━━━━━━━━━━━━
您的券夾目前空空如也，有新活動時總部會自動發送專屬優惠券給您喔！
━━━━━━━━━━━━━━━━━━
💡 提示：輸入「查詢」回到主選單`;
      }
      break;
    }

    case "5": {
      // 組織夥伴統計
      const { count } = await supabaseAdmin
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("upline_id", member.id);

      replyMsg = `👥 組織夥伴統計
━━━━━━━━━━━━━━━━━━
● 您的直推合夥人數：${count || 0} 人
● 有效推薦人數：${member.referral_count || 0} 人
● 創業推廣狀態：${member.is_b2b ? "合夥創辦人 (B2B專屬)" : "特選品茶官"}
━━━━━━━━━━━━━━━━━━
💡 提示：輸入「查詢」回到主選單`;
      break;
    }

    case "6": {
      // 帳本最新明細
      const { data: tx } = await supabaseAdmin
        .from("wallet_transactions")
        .select("*")
        .eq("member_id", member.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (tx) {
        const txDate = new Date(tx.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
        const typeMap: { [key: string]: string } = {
          deposit: "帳戶儲值 📥",
          order_deduction: "採購扣款 📤",
          commission_refund: "直推退傭/分紅 💰",
          withdrawal: "預收款提領 💸",
        };
        const txType = typeMap[tx.transaction_type] || tx.transaction_type;

        replyMsg = `📋 帳本最新明細 (B2B)
━━━━━━━━━━━━━━━━━━
● 交易類型：${txType}
● 異動金額：${tx.amount >= 0 ? "+" : ""}$${Number(tx.amount).toLocaleString()} 元
● 交易狀態：${tx.status === "completed" ? "已入帳 ✅" : "審核中 ⏳"}
● 明細時間：${txDate}
━━━━━━━━━━━━━━━━━━
💡 提示：輸入「查詢」回到主選單`;
      } else {
        replyMsg = `📋 帳本最新明細
━━━━━━━━━━━━━━━━━━
您目前尚未有虛擬錢包/退傭金的資金流動明細。
━━━━━━━━━━━━━━━━━━
💡 提示：輸入「查詢」回到主選單`;
      }
      break;
    }

    case "7": {
      // 熱銷茶葉精品推薦
      const { data: products } = await supabaseAdmin
        .from("products")
        .select("name, price, category")
        .eq("status", "active")
        .limit(3);

      let prodStr = "";
      if (products && products.length > 0) {
        products.forEach((p, idx) => {
          prodStr += `\n🍵 [熱銷推薦 ${idx + 1}] ${p.name}\n💰 獨家價：$${p.price} 元 (${p.category})\n`;
        });
      } else {
        prodStr = "\n極萃金萱紅茶、大禹嶺雪片茶...\n";
      }

      replyMsg = `🍵 熱銷茶葉精品推薦
━━━━━━━━━━━━━━━━━━
初潤製茶所經典茶款口碑力薦：
${prodStr}
🔗 點擊立刻線上採購：https://churun-tea.vercel.app/wholesale
━━━━━━━━━━━━━━━━━━
💡 提示：輸入「查詢」回到主選單`;
      break;
    }

    case "8": {
      // 總部品牌公告
      const { data: ann } = await supabaseAdmin
        .from("announcements")
        .select("*")
        .not("title", "eq", "[SYSTEM_CATEGORIES]")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ann) {
        replyMsg = `📢 總部品牌公告
━━━━━━━━━━━━━━━━━━
● 主題：${ann.title}
● 分類：${ann.tag || "品牌活動"}
● 摘要：${ann.content ? ann.content.slice(0, 120) + "..." : "歡迎查看最新茶葉活動"}
━━━━━━━━━━━━━━━━━━
💡 提示：輸入「查詢」回到主選單`;
      } else {
        replyMsg = `📢 總部品牌公告
━━━━━━━━━━━━━━━━━━
● 主題：初潤製茶所 V3.0 正式上線！
● 內容：以初心、致潤澤。精品茶葉數位連鎖平台全新體驗！
━━━━━━━━━━━━━━━━━━
💡 提示：輸入「查詢」回到主選單`;
      }
      break;
    }

    case "9": {
      // 聯絡總部與客服
      replyMsg = `📞 聯絡總部與客服
━━━━━━━━━━━━━━━━━━
● 初潤客服專線：04-23456789
● 服務時間：週一至週五 09:00 - 18:00
● 官方網站：https://churun-tea.vercel.app/
● 企業總部：台中市西屯區初潤大道一號

💡 您有任何問題，可以直接在此 LINE 聊天室留言，客服人員看見後會立刻為您解答！
━━━━━━━━━━━━━━━━━━
💡 提示：輸入「查詢」回到主選單`;
      break;
    }

    default: {
      // 回覆 1-9 選單首頁
      replyMsg = `🍵 初潤製茶所 - 會員專屬快速服務選單 🍵
━━━━━━━━━━━━━━━━━━
您好【${member.name}】！您的專屬帳號已安全綁定，請直接回覆數字 1 - 9 進行即時系統查詢：

【1】 👤 我的會員帳號資訊 (階級基本資料)
【2】 💰 預收款與點數餘額 (錢包與回饋積分)
【3】 📦 最新採購訂單狀態 (出貨進度與明細)
【4】 🎟️ 我的未折抵優惠券 (專屬折價券)
【5】 👥 組織夥伴統計 (直推團隊人數)
【6】 📋 帳本最新明細 (財務與分傭異動)
【7】 🍵 熱銷茶葉精品推薦 (探索精品茶)
【8】 📢 總部品牌公告 (最新活動資訊)
【9】 📞 聯絡總部與客服 (線上諮詢與地址)
━━━━━━━━━━━━━━━━━━
💡 提示：任何時候直接在對話框輸入數字即可立刻讀取即時數據！`;
      break;
    }
  }

  await sendLineReply(replyToken, replyMsg);
}

/**
 * 處理「未綁定會員」的回覆邏輯 (引導綁定)
 */
async function handleUnlinkedUserFlow(replyToken: string, userId: string, input: string) {
  const isPhone = /^09\d{8}$/.test(input);
  const isMemberCode = /^CR\d+.*$/i.test(input) || (input.startsWith("CR") && input.length >= 8);

  if (isPhone || isMemberCode) {
    const searchCol = isMemberCode ? "member_code" : "phone";
    
    // 尋找符合此手機或代碼的會員
    const { data: matchedMember } = await supabaseAdmin
      .from("members")
      .select("*")
      .eq(searchCol, input)
      .maybeSingle();

    if (matchedMember) {
      if (matchedMember.line_id) {
        // 已經被其他 line_id 綁定了
        const maskedLine = matchedMember.line_id.slice(0, 5) + "..." + matchedMember.line_id.slice(-4);
        await sendLineReply(
          replyToken,
          `⚠️ 綁定失敗：此帳號已綁定過其他 LINE 帳號 (${maskedLine})。如有疑問，請聯繫總部客服解除綁定。`
        );
        return;
      }

      // 更新 line_id 完成綁定
      const { error: updateErr } = await supabaseAdmin
        .from("members")
        .update({ line_id: userId })
        .eq("id", matchedMember.id);

      if (updateErr) {
        await sendLineReply(replyToken, `❌ 資料庫寫入失敗：${updateErr.message}`);
      } else {
        const welcomeMsg = `🎉 恭喜您！帳號綁定成功！

🍵 歡迎【${matchedMember.name}】加入初潤製茶所數位會員！
● 您的職級：${matchedMember.tier} 👑
● 會員代碼：${matchedMember.member_code || "系統自動建檔"}

現在，您已解鎖完整權限！請直接在對話框中回覆「查詢」或輸入數字 1 - 9，即可即時查詢您的餘額、訂單與分傭狀態囉！`;
        await sendLineReply(replyToken, welcomeMsg);
      }
    } else {
      await sendLineReply(
        replyToken,
        `❌ 找不到符合此資訊的會員帳號。
        
請確認您輸入的手機號碼 (例如 0912345678) 或會員代碼 (例如 CR26M040001) 是否正確，或先前往初潤官方網站註冊後再進行綁定！`
      );
    }
    return;
  }

  // 針對公開資訊 (7, 8, 9) 提供免綁定直接查詢支援
  if (input === "7") {
    const { data: products } = await supabaseAdmin
      .from("products")
      .select("name, price, category")
      .eq("status", "active")
      .limit(3);

    let prodStr = "";
    if (products && products.length > 0) {
      products.forEach((p, idx) => {
        prodStr += `\n🍵 [熱銷推薦 ${idx + 1}] ${p.name}\n💰 獨家價：$${p.price} 元 (${p.category})\n`;
      });
    } else {
      prodStr = "\n極萃金萱紅茶、大禹嶺雪片茶...\n";
    }

    await sendLineReply(
      replyToken,
      `🍵 熱銷茶葉精品推薦 (公開資訊)
━━━━━━━━━━━━━━━━━━
初潤製茶所經典茶款口碑力薦：
${prodStr}
🔗 點擊立刻線上註冊與採購：https://churun-tea.vercel.app/
━━━━━━━━━━━━━━━━━━
💡 提示：回覆您的「手機號碼」即可秒速綁定您的會員中心！`
    );
    return;
  }

  if (input === "8") {
    const { data: ann } = await supabaseAdmin
      .from("announcements")
      .select("*")
      .not("title", "eq", "[SYSTEM_CATEGORIES]")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const title = ann ? ann.title : "初潤製茶所 V3.0 正式上線！";
    const tag = ann ? (ann.tag || "品牌活動") : "品牌快訊";
    const content = ann ? (ann.content ? ann.content.slice(0, 120) + "..." : "熱銷茶葉活動") : "以初心、致潤澤。精品茶葉數位連鎖平台全新體驗！";

    await sendLineReply(
      replyToken,
      `📢 總部品牌公告 (公開資訊)
━━━━━━━━━━━━━━━━━━
● 主題：${title}
● 分類：${tag}
● 摘要：${content}
━━━━━━━━━━━━━━━━━━
💡 提示：回覆您的「手機號碼」即可秒速綁定您的會員中心！`
    );
    return;
  }

  if (input === "9") {
    await sendLineReply(
      replyToken,
      `📞 聯絡總部與客服 (公開資訊)
━━━━━━━━━━━━━━━━━━
● 初潤客服專線：04-23456789
● 服務時間：週一至週五 09:00 - 18:00
● 官方網站：https://churun-tea.vercel.app/

💡 任何時候您可以直接在此對話框與我們對話留言，小幫手看見後將有專人盡快為您解答！
━━━━━━━━━━━━━━━━━━
💡 提示：回覆您的「手機號碼」即可秒速綁定您的會員中心！`
    );
    return;
  }

  // 預設未綁定導引訊息
  const welcomeStr = `🍵 歡迎來到【初潤製茶所】官方 LINE 帳號！ 🍵
━━━━━━━━━━━━━━━━━━
您目前尚未綁定您的初潤數位會員帳號。

👉 請在對話框「直接回覆」您的：
● 【手機號碼】（例：0912345678）
或
● 【會員代碼】（例：CR26M040001）
即可在一秒內完成安全綁定！

綁定後即可解鎖：
💰 預收款查詢、📦 訂單出貨狀態、🎟️ 領取折價券、👥 組織統計等超值尊榮功能！

您也可以輸入數字 7、8、9 先行體驗公開查詢：
【7】 🍵 熱銷茶葉精品推薦
【8】 📢 總部品牌公告
【9】 📞 聯絡總部與客服`;

  await sendLineReply(replyToken, welcomeStr);
}

/**
 * 呼叫 LINE Reply API 回覆訊息
 */
async function sendLineReply(replyToken: string, text: string) {
  if (LINE_CHANNEL_ACCESS_TOKEN === "DEFAULT_ACCESS_TOKEN") {
    console.log(`[LINE Webhook Mock Reply] replyToken: ${replyToken}, Message:\n${text}`);
    return;
  }

  try {
    const res = await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        replyToken: replyToken,
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
      console.error(`[LINE API Error] status: ${res.status}, details:`, errText);
    } else {
      console.log(`[LINE Reply Success] replyToken: ${replyToken}`);
    }
  } catch (err) {
    console.error("[LINE API Network Error] 發送回覆失敗:", err);
  }
}
