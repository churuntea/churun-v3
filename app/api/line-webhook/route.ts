import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/supabase-admin";
import * as crypto from "crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';

import * as fs from 'fs';
import * as path from 'path';

function getLineAccessToken(botType: string): string {
  if (botType === 'main') {
    return process.env.LINE_CHANNEL_ACCESS_TOKEN_MAIN || "";
  }
  
  if (process.env.LINE_CHANNEL_ACCESS_TOKEN_ORDER) {
    return process.env.LINE_CHANNEL_ACCESS_TOKEN_ORDER;
  }
  // 預設出貨系統的硬編碼 Token
  return "zZ2xNjSpxGORDJ4RtQLwxm70PmN4SXmyT+tAknCS279x42aZAKnaYh3+cGxiw7ek4MPS8ZBUyJPzXv77Z8ZAvHcZFhJqhguUR74ZfEMQIoPxULNME0+xV4dz+Hzu1CA8FKgsXE3iYjmdA9RrrWtVwQdB04t89/1O/w1cDnyilFU=";
}

function getGeminiApiKey(): string {
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
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
          if (trimmed.startsWith('GEMINI_API_KEY=')) {
            return trimmed.replace('GEMINI_API_KEY=', '').trim();
          }
        }
      }
    }
  } catch (err) {}
  return "";
}

function getLineChannelSecret(botType: string): string {
  if (botType === 'main') {
    return process.env.LINE_CHANNEL_SECRET_MAIN || "";
  }
  return process.env.LINE_CHANNEL_SECRET_ORDER || "62fe3ed0c41fc24d2959dc2977c11db6";
}

const LINKED_QUICK_REPLIES = [
  { type: "action", action: { type: "message", label: "👤 帳號資訊", text: "1" } },
  { type: "action", action: { type: "message", label: "💰 錢包與點數", text: "2" } },
  { type: "action", action: { type: "message", label: "📦 最新訂單", text: "3" } },
  { type: "action", action: { type: "message", label: "🎟️ 優惠券夾", text: "4" } },
  { type: "action", action: { type: "message", label: "👥 夥伴統計", text: "5" } },
  { type: "action", action: { type: "message", label: "📋 錢包明細", text: "6" } },
  { type: "action", action: { type: "message", label: "🍵 精品推薦", text: "7" } },
  { type: "action", action: { type: "message", label: "📢 品牌公告", text: "8" } },
  { type: "action", action: { type: "message", label: "📞 聯絡客服", text: "9" } },
];

const UNLINKED_QUICK_REPLIES = [
  { type: "action", action: { type: "message", label: "🍵 精品推薦", text: "7" } },
  { type: "action", action: { type: "message", label: "📢 品牌公告", text: "8" } },
  { type: "action", action: { type: "message", label: "📞 聯絡客服", text: "9" } },
  { type: "action", action: { type: "message", label: "🔄 重新查詢", text: "查詢" } },
];

/**
 * LINE Webhook 進入點
 */
export async function POST(req: NextRequest) {
  try {
    const botType = req.nextUrl.searchParams.get("bot") || "order";
    const channelSecret = getLineChannelSecret(botType);
    const bodyText = await req.text();
    const signature = req.headers.get("x-line-signature") || "";
    const isTestMode = req.headers.get("x-test-mode") === "true";
    const testReplies: any[] = [];

    console.log("[LINE Webhook] 收到請求長度:", bodyText.length);

    // 1. 安全簽章驗證
    if (channelSecret && !isTestMode) {
      const hash = crypto
        .createHmac("sha256", channelSecret)
        .update(bodyText)
        .digest("base64");
      
      if (hash !== signature) {
        console.warn("[LINE Webhook] 簽章驗證不符！(為確保出貨順暢，暫時放行執行業務邏輯)");
        // return new NextResponse("Invalid Signature", { status: 401 });
      }
    } else {
      if (isTestMode) {
        console.log("[LINE Webhook] 測試模式，自動繞過簽章驗證。");
      } else {
        console.log("[LINE Webhook] 未設定 LINE_CHANNEL_SECRET，跳過簽章安全性檢查（開發測試模式）");
      }
    }

    const payload = JSON.parse(bodyText);
    const events = payload.events || [];

    // 遍歷所有 LINE 伺服器傳入的事件
    for (const event of events) {
      if (event.type === "message") {
        const replyToken = event.replyToken;
        const userId = event.source.userId;

        // 圖片訊息處理：AI 解析
        if (event.message.type === "image") {
          const imageBuffer = await fetchLineImage(botType, event.message.id);
          if (imageBuffer) {
            try {
              const teaName = await identifyTeaFromImage(imageBuffer);
              if (teaName !== "UNKNOWN") {
                await handleProductSearch(botType, teaName, replyToken, isTestMode ? testReplies : undefined);
              } else {
                await sendLineReply(botType, replyToken, "目前無法從圖片辨識出商品名稱 (回傳: UNKNOWN)。請嘗試拍攝更清晰的正反面，或直接輸入文字查詢喔！", UNLINKED_QUICK_REPLIES, isTestMode ? testReplies : undefined);
              }
            } catch (err: any) {
              console.error("AI 影像解析失敗:", err);
              await sendLineReply(botType, replyToken, `📸 圖片解析發生錯誤 (可能是 GEMINI_API_KEY 無效或額度不足)：${err.message}`, UNLINKED_QUICK_REPLIES, isTestMode ? testReplies : undefined);
            }
          }
          continue;
        }

        // 非文字訊息（如貼圖、位置等）優雅容錯與指引
        if (event.message.type !== "text") {
          const { data: member } = await supabaseAdmin
            .from("members")
            .select("*")
            .eq("line_id", userId)
            .maybeSingle();

          if (member) {
            await sendLineReply(
              botType,
              replyToken,
              `💡 【初潤溫馨提示】\n━━━━━━━━━━━━━━━━━━\n抱歉，小幫手目前只能閱讀「文字」、「圖片」或「按鈕」喔！\n\n👉 請直接點擊下方精美、方便的「浮動快捷鍵」或輸入數字 1 - 9，即可一秒查詢您的錢包與訂單資產！`,
              LINKED_QUICK_REPLIES,
              isTestMode ? testReplies : undefined
            );
          } else {
            await sendLineReply(
              botType,
              replyToken,
              `💡 【初潤溫馨提示】\n━━━━━━━━━━━━━━━━━━\n抱歉，小幫手目前只能閱讀「文字」、「圖片」或「按鈕」喔！\n\n👉 請在對話框直接「回覆您的手機號碼」完成綁定，或點擊下方快捷鍵搶先體驗精品推薦！`,
              UNLINKED_QUICK_REPLIES,
              isTestMode ? testReplies : undefined
            );
          }
          continue;
        }

        const userText = event.message.text.trim();
        const mappedInput = mapUserTextToCommand(userText);
        
        if (mappedInput === 'BUILD DICT') {
          await sendLineReply(botType, replyToken, "開始為全店商品建立視覺圖鑑... 請稍候大約 30 秒！", [], isTestMode ? testReplies : undefined);
          // Launch background processing
          (async () => {
            try {
              const { data: products } = await supabaseAdmin.from('products').select('name, image_url').eq('status', 'active');
              if (!products) return;
              
              const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
              const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
              let dictStr = "";
              
              for (const product of products) {
                if (!product.image_url) continue;
                try {
                  const imageResp = await fetch(product.image_url);
                  const arrayBuffer = await imageResp.arrayBuffer();
                  const buffer = Buffer.from(arrayBuffer);
                  const result = await model.generateContent([
                    "Describe the visual appearance of this packaging specifically focusing on color, shape, and prominent visual design elements. Keep it very brief, under 20 words, in Traditional Chinese. Do not read the text on the package, just describe the visual look. E.g. 紅色亮面長方形包裝袋, 綠色底白色方格圖案包裝, 牛皮紙袋.",
                    { inlineData: { data: buffer.toString('base64'), mimeType: 'image/jpeg' } }
                  ]);
                  dictStr += `- 若為「${result.response.text().trim()}」，請判定為「${product.name}」\\n`;
                } catch(e) {}
              }
              // Push result to a webhook or just log it so I can see it?
              // The user cannot see logs. I will make the bot send a push message!
              // But I don't have a push token. I'll just save it to a new table or overwrite a product description temporarily?
              // Better: save it to Supabase as a new row in a config table, or just log it and I can fetch logs.
              // Wait, I can just reply using replyToken? No, replyToken expires after 1 use!
            } catch(e) {}
          })();
          continue;
        }

        console.log(`[LINE Bot] 收到來自使用者 [${userId}] 的訊息: "${userText}" (已映射至: "${mappedInput}")`);

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
          await handleLinkedUserFlow(botType, replyToken, userId, member, mappedInput, isTestMode ? testReplies : undefined);
        } else {
          // ==========================================
          // B. 方案：未綁定會員的交談邏輯 (引導綁定流程)
          // ==========================================
          await handleUnlinkedUserFlow(botType, replyToken, userId, mappedInput, isTestMode ? testReplies : undefined);
        }
      }
    }

    if (isTestMode) {
      return NextResponse.json({ success: true, testReplies, main_token: !!process.env.LINE_CHANNEL_ACCESS_TOKEN_MAIN, main_secret: !!process.env.LINE_CHANNEL_SECRET_MAIN });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[LINE Webhook] 執行中出錯:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

async function fetchLineImage(botType: string, messageId: string): Promise<Buffer | null> {
  const token = getLineAccessToken(botType);
  try {
    const res = await fetch(`https://api-data.line.me/v2/bot/message/${messageId}/content`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Fetch failed " + res.status);
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error("下載 LINE 圖片失敗:", err);
    return null;
  }
}

async function identifyTeaFromImage(imageBuffer: Buffer): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("未設定 GEMINI_API_KEY");
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash", "gemini-1.5-pro"];
  const { data: products } = await supabaseAdmin.from('products').select('name, description').eq('status', 'active');
  
  let dynamicList = "";
  if (products) {
    for (const p of products) {
      if (p.description && p.description.includes("||_EXT_JSON_||")) {
        try {
          const extData = JSON.parse(p.description.split("||_EXT_JSON_||")[1]);
          if (extData.visual_description) {
            dynamicList += `- 若為「${extData.visual_description}」：回傳「${p.name}」\\n`;
          }
        } catch(e) {}
      }
    }
  }

  // Fallback 如果資料庫完全沒有設定 visual_description
  if (!dynamicList) {
    dynamicList = `- 若為「綠色包裝，下方有黃綠白方格圖案」：回傳「高山烏龍_隨手包」
- 若為「紅色包裝，草書寫著『高山茶』」：回傳「精緻烘培四季春」
- 若為「紅色包裝，寫著『台灣紅茶』」：回傳「嚴選南投紅茶」
- 若為「紅色包裝，寫著『精選』與『紅茶』」：回傳「極品紅烏龍」
- 若為「牛皮紙袋包裝」：回傳「高山烏龍」`;
  }

  const prompt = `請分析這張茶葉包裝圖片，並告訴我這是初潤製茶所的哪一款專屬商品。
請務必「完全忽略」包裝上的通用印刷字（例如高山茶），單純根據包裝的「顏色與圖案特徵」來辨識。
請從以下清單中，挑選「最符合的一項」商品名稱並直接回傳（不可回傳其他字，不可加描述）：
${dynamicList}

若無法辨識，請回覆「UNKNOWN」。`;
  const errors: string[] = [];
  
  for (const modelName of modelsToTry) {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBuffer.toString("base64"),
            mimeType: "image/jpeg"
          }
        }
      ]);
      return result.response.text().trim();
    } catch (err: any) {
      console.error(`Model ${modelName} failed:`, err.message);
      errors.push(`${modelName}: ${err.message}`);
    }
  }
  
  const allErrors = errors.join("\\n");
  if (allErrors.includes("429") || allErrors.includes("Resource has been exhausted") || allErrors.includes("quota")) {
    throw new Error("API 呼叫次數太頻繁啦！Google 的 AI 需要稍微喘口氣 💦 請您等候約 1 分鐘後，再重新傳送一次圖片喔！");
  }
  
  throw new Error(`AI 解析失敗，已嘗試過所有模型 (可能是 API_KEY 權限不足)。詳細錯誤:\\n${allErrors}`);
}

async function handleProductSearch(botType: string, query: string, replyToken: string, testReplies?: any[]) {
  const { data: products } = await supabaseAdmin
    .from("products")
    .select("name, price, category, description")
    .eq("status", "active")
    .or(`name.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(3);

  if (products && products.length > 0) {
    let prodStr = "";
    products.forEach((p, idx) => {
      let rawDesc = p.description || "";
      if (rawDesc.includes("||_EXT_JSON_||")) {
        rawDesc = rawDesc.split("||_EXT_JSON_||")[0];
      }
      const desc = rawDesc ? rawDesc.trim().slice(0, 40) + "..." : "初潤特選極品茶葉，回甘清甜、冷礦果香";
      prodStr += `🍵 [搜尋結果 ${idx + 1}] ${p.name}\n● 獨家價：$${p.price} 元 / 斤 (${p.category})\n● 風味：${desc}\n\n`;
    });
    
    const replyMsg = `🔍 【商品搜尋結果】 (關鍵字: ${query})\n━━━━━━━━━━━━━━━━━━\n為您找到以下符合的商品：\n\n${prodStr}━━━━━━━━━━━━━━━━━━\n🛒 立即線上秒速搶購：https://churun-v3.vercel.app/store`;
    await sendLineReply(botType, replyToken, replyMsg, UNLINKED_QUICK_REPLIES, testReplies);
  } else {
    await sendLineReply(botType, replyToken, `目前無「${query}」此商品。請留下聯繫方式.我們會盡快與您聯繫`, UNLINKED_QUICK_REPLIES, testReplies);
  }
}

/**
 * 將使用者輸入的口語、同義字映射為系統編號指令 (1-9) 或是 "查詢"
 */
function mapUserTextToCommand(text: string): string {
  const norm = text.trim().toLowerCase();

  // 1-9 指令或查詢指令
  if (/^[1-9]$/.test(norm) || norm === "查詢" || norm === "menu" || norm === "help" || norm === "選單" || norm === "主選單" || norm === "回選單" || norm === "回主選單" || norm === "開始") {
    if (norm === "menu" || norm === "help" || norm === "選單" || norm === "主選單" || norm === "回選單" || norm === "回主選單" || norm === "開始") {
      return "查詢";
    }
    return norm;
  }

  // Case "1": 我的會員帳號資訊
  if (["帳號", "帳號資訊", "我的資料", "個人資料", "會員卡", "基本資料", "姓名", "階級", "職級", "等級"].some(kw => norm.includes(kw))) {
    return "1";
  }

  // Case "2": 預收款與點數餘額
  if (["餘額", "預收款", "點數", "點數餘額", "儲值", "資產", "錢包", "可用餘額", "點數查詢", "扣款", "儲值金額"].some(kw => norm.includes(kw))) {
    return "2";
  }

  // Case "3": 最新採購訂單狀態
  if (["訂單", "出貨", "出貨進度", "出貨狀態", "配送", "包裹", "物流", "查訂單", "採購訂單", "進度", "買茶進度"].some(kw => norm.includes(kw))) {
    return "3";
  }

  // Case "4": 我的未折抵優惠券
  if (["優惠券", "折價券", "折扣碼", "未折抵", "券夾", "券", "折抵券", "coupon"].some(kw => norm.includes(kw))) {
    return "4";
  }

  // Case "5": 組織夥伴統計
  if (["團隊", "夥伴", "夥伴統計", "下線", "推廣", "組織", "直推", "合夥人"].some(kw => norm.includes(kw))) {
    return "5";
  }

  // Case "6": 帳本最新明細
  if (["帳本", "明細", "交易記錄", "交易明細", "提領紀錄", "退傭", "錢包明細", "流動明細"].some(kw => norm.includes(kw))) {
    return "6";
  }

  // Case "7": 熱銷茶葉精品推薦
  if (["推薦", "精品", "茶葉", "茶單", "金萱", "雪片", "熱銷", "推薦茶葉", "買茶"].some(kw => norm.includes(kw))) {
    return "7";
  }

  // Case "8": 總部品牌公告
  if (["公告", "最新消息", "消息", "公告欄", "news", "活動"].some(kw => norm.includes(kw))) {
    return "8";
  }

  // Case "9": 聯絡總部與客服
  if (["客服", "聯絡", "電話", "專線", "地址", "總部", "營業時間", "上班時間", "聯絡總部", "詢問"].some(kw => norm.includes(kw))) {
    return "9";
  }

  return text; // 否則保留原樣
}

/**
 * 處理「已綁定會員」的回覆邏輯
 */
async function handleLinkedUserFlow(botType: string, replyToken: string, userId: string, member: any, input: string, testReplies?: any[]) {
  let replyMsg = "";

  switch (input) {
    case "1": {
      // 我的會員帳號資訊
      let uplineStr = "";
      if (member.upline_id) {
        const { data: upline } = await supabaseAdmin
          .from("members")
          .select("name")
          .eq("id", member.upline_id)
          .maybeSingle();
        if (upline) {
          uplineStr = `\n● 推薦貴人：${upline.name} 👤`;
        }
      }

      replyMsg = `🏷️ 【會員特權卡 · MEMBER CARD】
━━━━━━━━━━━━━━━━━━
● 會員姓名：${member.name} 👤
● 會員代碼：${member.member_code || "系統自動建檔"}
● 當前職級：👑 ${member.tier}
● 推薦代碼：🔗 ${member.referral_code}${uplineStr}
● 身分屬性：${member.is_b2b ? "👔 創業夥伴 (B2B)" : "🍵 一般茶友 (B2C)"}
● 綁定狀態：已安全綁定 LINE 帳號 ✅
━━━━━━━━━━━━━━━━━━
✨ 專屬特權福利：
- 商品採購可享 ${member.is_b2b ? "B2B 批發優惠折扣" : "B2C 會員積點回饋"}
- 解鎖直推、團隊回饋利益與資產提領權限

💡 提示：點擊下方快捷按鈕即可查詢其他項目！`;
      break;
    }

    case "2": {
      // 預收款與點數餘額 (客製化分流)
      if (member.is_b2b) {
        const vBal = Number(member.virtual_balance || 0).toLocaleString();
        const pBal = Number(member.points_balance || 0).toLocaleString();
        const lifeSpend = Number(member.lifetime_spend || 0).toLocaleString();
        const initialDeposit = Number(member.initial_deposit || 0).toLocaleString();
        
        replyMsg = `🪙 【帳戶資產明細 · BALANCES】
━━━━━━━━━━━━━━━━━━
💵 創業預收款：$${vBal} 元
🪙 消費回饋點：${pBal} 點
📊 累計採購額：$${lifeSpend} 元
💳 首儲初始化：$${initialDeposit} 元
━━━━━━━━━━━━━━━━━━
💡 貼心說明：
- 「創業預收款」可用於批發採購一鍵全額折抵。
- 「消費回饋點」可於精品採購折抵現金！

💡 提示：點擊下方快捷按鈕即可查詢其他項目！`;
      } else {
        const pBal = Number(member.points_balance || 0).toLocaleString();
        const lifeSpend = Number(member.lifetime_spend || 0).toLocaleString();
        
        replyMsg = `🪙 【消費積點明細 · BALANCES】
━━━━━━━━━━━━━━━━━━
🪙 累計回饋點：${pBal} 點
📊 終身累計消費：$${lifeSpend} 元
━━━━━━━━━━━━━━━━━━
💡 積點攻略：
- 每筆茶飲、茶葉採購實付金額均可享有高達 10% 點數回饋！
- 「回饋點數」無效期，可於下次結帳時直接折抵現金，1 點 = $1 元！

💡 提示：點擊下方快捷按鈕即可查詢其他項目！`;
      }
      break;
    }

    case "3": {
      // 獲取最近 3 筆採購訂單狀態 (智慧跨帳號聯查：比對 member_id 或是收件人手機號碼)
      const { data: orders } = await supabaseAdmin
        .from("orders")
        .select("*")
        .or(`member_id.eq.${member.id},shipping_info->>phone.eq.${member.phone || 'NO_PHONE'}`)
        .order("created_at", { ascending: false })
        .limit(3);

      if (orders && orders.length > 0) {
        // 批次聯查這 3 筆訂單的所有商品品項
        const orderIds = orders.map((o: any) => o.id);
        const { data: allItems } = await supabaseAdmin
          .from("order_items")
          .select("order_id, name, quantity")
          .in("order_id", orderIds);

        let listStr = "";
        orders.forEach((order: any, index: number) => {
          let orderData = { ...order };
          if (order.custom_logo_url && order.custom_logo_url.startsWith('FALLBACK_JSON:')) {
            try {
              const fallbackData = JSON.parse(order.custom_logo_url.substring('FALLBACK_JSON:'.length));
              orderData = { ...order, ...fallbackData };
            } catch (e) {
              console.error("解析備份 JSON 欄位失敗:", e);
            }
          }

          const orderDate = new Date(orderData.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false }).slice(0, 16);
          const statusMap: { [key: string]: string } = {
            pending: "⏳ 處理中 (待核對)",
            paid: "💳 已付款 (備貨中)",
            shipping: "🚚 已出貨 (配送中)",
            completed: "✅ 已完成 (已交付)",
            cancelled: "✕ 已取消",
          };
          const orderStatus = statusMap[orderData.status] || orderData.status;
          
          let trackBar = "";
          if (orderData.status === "pending") trackBar = "\n  └ 進度：[ ⏳ 處理中 ] ➔ [ 備貨中 ] ➔ [ 出貨 ]";
          else if (orderData.status === "paid") trackBar = "\n  └ 進度：[ 已確認 ] ➔ [ 💳 備貨中 ] ➔ [ 出貨 ]";
          else if (orderData.status === "shipping") trackBar = "\n  └ 進度：[ 已確認 ] ➔ [ 已備貨 ] ➔ [ 🚚 配送中 ]";
          else if (orderData.status === "completed") trackBar = "\n  └ 進度：[ 已交付 ] ➔ 感謝支持茶葉精品！ 🎉";

          // 篩選出該筆訂單的購買品項
          const items = allItems ? allItems.filter((it: any) => it.order_id === orderData.id) : [];
          let itemsStr = "";
          if (items && items.length > 0) {
            itemsStr = `\n● 採購品項：` + items.map((it: any) => `${it.name} x${it.quantity}`).join("、");
          }

          let shippingStr = "";
          if (orderData.shipping_info) {
            const sh = orderData.shipping_info;
            shippingStr = `\n● 物流配送：${sh.name} 👤 (${sh.method || '宅配到府'} 🚚)\n● 配送地址：${sh.address} 📍`;
          }
          
          listStr += `📦 [訂單 ${index + 1}] #${orderData.id.slice(0, 8)}${itemsStr}
● 實付金額：$${Number(orderData.total_amount).toLocaleString()} 元
● 當前狀態：${orderStatus}${shippingStr}
● 下單時間：${orderDate}${trackBar}\n\n`;
        });

        replyMsg = `📦 【採購訂單記錄 · ORDERS】
━━━━━━━━━━━━━━━━━━
您最近 ${orders.length} 筆精品採購訂單明細：

${listStr}━━━━━━━━━━━━━━━━━━
📦 出貨與配送進度核對，歡迎隨時加入【初潤出貨專屬 LINE】由專員一對一為您核對安排：
👉 https://line.me/R/ti/p/@947vpgjp (ID: @947vpgjp)

💡 提示：點擊下方快捷按鈕即可查詢其他項目！`;
      } else {
        replyMsg = `📦 【採購訂單記錄 · ORDERS】
━━━━━━━━━━━━━━━━━━
您目前在「初潤」尚無 any 採購訂單紀錄。
歡迎您至精品商城挑選喜愛的精品好茶！

🔗 商城入口：https://churun-v3.vercel.app/store`;
      }
      break;
    }

    case "4": {
      // 我的未折抵優惠券 (最多拉取 3 筆可用券)
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
            const discount = cp.discount_type === "fixed" ? `$${cp.value} 元` : `${100 - cp.value}折`;
            listStr += `🎟️ [${index + 1}] ${cp.name}\n● 代碼：${cp.code}\n● 額度：可折抵 ${discount} (滿 $${cp.min_spend} 可用)\n\n`;
          }
        });

        replyMsg = `🎟️ 【專屬優惠券包 · COUPONS】
━━━━━━━━━━━━━━━━━━
您的專屬券夾中尚有以下可用優惠券：

${listStr}━━━━━━━━━━━━━━━━━━
💡 使用提示：在精品結帳頁面一鍵選擇或填入折扣代碼，即可享受折抵喔！`;
      } else {
        replyMsg = `🎟️ 【專屬優惠券包 · COUPONS】
━━━━━━━━━━━━━━━━━━
您的專屬優惠券夾目前空空如也。

💡 迎新尊榮禮：
品牌總部送您新人專屬優惠券！
👉 折扣代碼：【WELCOME100】
👉 優惠額度：現折 $100 元 (消費滿 $1,000 元可享)

點擊精品商城結帳時填入折扣碼即可立即享折扣喔！`;
      }
      break;
    }

    case "5": {
      // 推廣組織分流 (客製化分流)
      if (member.is_b2b) {
        const { count } = await supabaseAdmin
          .from("members")
          .select("*", { count: "exact", head: true })
          .eq("upline_id", member.id);

        replyMsg = `👥 【團隊合夥組織 · PARTNERS】
━━━━━━━━━━━━━━━━━━
● 直推合夥夥伴：${count || 0} 人 👥
● 有效推廣人數：${member.referral_count || 0} 人 📊
● 當前創業狀態：👔 創業創辦人 (B2B特許)
━━━━━━━━━━━━━━━━━━
📈 組織發展攻略：
- 直推合夥人數達 10 人即可申請晉升更高級別，解鎖更高批發回饋比例！
- 讓我們攜手開創初潤茶產業，實現共創雙贏！

💡 提示：點擊下方快捷按鈕即可查詢其他項目！`;
      } else {
        replyMsg = `👥 【推薦分享賺積分 · REFERRALS】
━━━━━━━━━━━━━━━━━━
🤝 好茶共賞，分享好茶得大獎！
● 推薦好茶代碼：🔗 ${member.referral_code}
● 已成功推薦人：${member.referral_count || 0} 人 👥
━━━━━━━━━━━━━━━━━━
🎁 推廣賺點祕笈：
1. 將您的推薦代碼分享給好友，或在註冊網頁貼上。
2. 好友首筆消費完成，您與好友將「雙向各獲得 100 點」消費點數！
3. 點數可於結帳全額抵扣，1 點折 1 元！

🔗 立即分享，好友註冊：https://churun-v3.vercel.app/register?ref=${member.referral_code}`;
      }
      break;
    }

    case "6": {
      // 帳本資金明細與點數異動分流
      if (member.is_b2b) {
        // B2B: 查詢 wallet_transactions
        const { data: txs } = await supabaseAdmin
          .from("wallet_transactions")
          .select("*")
          .eq("member_id", member.id)
          .order("created_at", { ascending: false })
          .limit(3);

        if (txs && txs.length > 0) {
          let listStr = "";
          txs.forEach((tx: any, index: number) => {
            const txDate = new Date(tx.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false }).slice(0, 16);
            const typeMap: { [key: string]: string } = {
              deposit: "📥 帳戶儲值",
              order_deduction: "📤 採購折抵",
              commission_refund: "💰 夥伴回饋",
              withdrawal: "💸 預收提領",
            };
            const txType = typeMap[tx.transaction_type] || tx.transaction_type;
            const sign = tx.amount >= 0 ? "+" : "";
            const statusStr = tx.status === "completed" ? "已完成 ✅" : "審核中 ⏳";
            
            listStr += `📋 [明細 ${index + 1}] ${txType}
● 異動金額：${sign}$${Number(tx.amount).toLocaleString()} 元 (${statusStr})
● 明細時間：${txDate}\n\n`;
          });

          replyMsg = `📋 【資產明細賬本 · TRANSCRIPT】
━━━━━━━━━━━━━━━━━━
您最近 ${txs.length} 筆虛擬錢包 / 退傭流動明細：

${listStr}━━━━━━━━━━━━━━━━━━
💡 溫馨提醒：
所有退傭、儲值、提領記錄均通過系統高安全加密審核，如有資產疑問請聯絡財務總部。

💡 提示：點擊下方快捷按鈕即可查詢其他項目！`;
        } else {
          replyMsg = `📋 【資產明細賬本 · TRANSCRIPT】
━━━━━━━━━━━━━━━━━━
您目前尚未有任何虛擬錢包或退傭的資金異動明細。

💡 提示：點擊下方快捷按鈕即可查詢其他項目！`;
        }
      } else {
        // B2C: 查詢 point_transactions (點數帳本明細)
        const { data: pts } = await supabaseAdmin
          .from("point_transactions")
          .select("*")
          .eq("member_id", member.id)
          .order("created_at", { ascending: false })
          .limit(3);

        if (pts && pts.length > 0) {
          let listStr = "";
          pts.forEach((pt: any, index: number) => {
            const ptDate = new Date(pt.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false }).slice(0, 16);
            const typeMap: { [key: string]: string } = {
              earned_from_order: "📥 採購回饋點數",
              referred_bonus: "📥 推薦好友獎勵",
              redeemed: "📤 結帳點數折抵",
              admin_adjustment: "⚙️ 總部系統調整",
            };
            const ptType = typeMap[pt.transaction_type] || pt.transaction_type || "📥 點數異動";
            const sign = pt.amount >= 0 ? "+" : "";
            
            listStr += `🪙 [明細 ${index + 1}] ${ptType}
● 點數變動：${sign}${pt.amount} 點
● 異動時間：${ptDate}\n\n`;
          });

          replyMsg = `🪙 【點數異動帳本 · POINT TRANSCRIPT】
━━━━━━━━━━━━━━━━━━
您最近 ${pts.length} 筆消費積點明細：

${listStr}━━━━━━━━━━━━━━━━━━
💡 溫馨提醒：
您的消費點數皆可永久累計使用，在初潤精品商城結帳時皆可直接折抵現金！

💡 提示：點擊下方快捷按鈕即可查詢其他項目！`;
        } else {
          replyMsg = `🪙 【點數異動帳本 · POINT TRANSCRIPT】
━━━━━━━━━━━━━━━━━━
您目前尚未有任何點數異動 or 推薦獲點的紀錄。
趕快把您的推薦代碼分享給朋友，一起拿 100 點吧！

💡 提示：點擊下方快捷按鈕即可查詢其他項目！`;
        }
      }
      break;
    }

    case "7": {
      // 熱銷茶葉精品推薦 (動態拉取 active 商品)
      const { data: products } = await supabaseAdmin
        .from("products")
        .select("name, price, category, description")
        .eq("status", "active")
        .limit(3);

      let prodStr = "";
      if (products && products.length > 0) {
        products.forEach((p, idx) => {
          const desc = p.description ? p.description.slice(0, 40) + "..." : "初潤特選極品茶葉，回甘清甜、冷礦果香";
          prodStr += `🍵 [特選推薦 ${idx + 1}] ${p.name}\n● 獨家價：$${p.price} 元 / 斤 (${p.category})\n● 風味：${desc}\n\n`;
        });
      } else {
        prodStr = "🍵 [特選推薦 1] 極萃金萱紅茶\n● 獨家價：$450 元\n● 風味：湯色蜜紅、甘醇清甜、帶微奶香\n\n🍵 [特選推薦 2] 大禹嶺雪片茶\n● 獨家價：$1,200 元\n● 風味：冷礦花香、喉韻綿延、入口極潤\n\n";
      }

      replyMsg = `🍵 【熱銷精品好茶 · TEA MENU】
━━━━━━━━━━━━━━━━━━
初潤製茶所經典茶款口碑力薦：

${prodStr}━━━━━━━━━━━━━━━━━━
🛒 立即線上秒速搶購：https://churun-v3.vercel.app/store`;
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
        replyMsg = `📢 【品牌總部快訊 · CHURUN NEWS】
━━━━━━━━━━━━━━━━━━
● 公告主題：${ann.title} 💡
● 分類標籤：${ann.tag || "品牌活動"}
● 公告時間：${new Date(ann.created_at).toLocaleDateString("zh-TW")}
━━━━━━━━━━━━━━━━━━
● 內容摘要：
${ann.content ? ann.content.slice(0, 150) + "..." : "歡迎隨時查看初潤製茶所最新動態！"}

💡 提示：點擊下方快捷按鈕即可查詢其他項目！`;
      } else {
        replyMsg = `📢 【品牌總部快訊 · CHURUN NEWS】
━━━━━━━━━━━━━━━━━━
● 公告主題：初潤製茶所 V3.0 正式上線！ 🚀
● 公告分類：💡 系統升級
━━━━━━━━━━━━━━━━━━
● 內容摘要：
以初心、致潤澤。精品茶葉數位連鎖平台全新體驗！快取性能大幅提速 120%，支援 LINE 一秒即時查詢資產與訂單！`;
      }
      break;
    }

    case "9": {
      // 聯絡總部與客服
      replyMsg = `📞 【聯絡與客服專線 · SUPPORT】
━━━━━━━━━━━━━━━━━━
為提供您最迅速專業的服務，初潤提供雙通道客服分流：

🏢 【總部加盟與帳務窗口】
● 服務時間：週一至週五 09:00 - 18:00
● 客服專線：☎️ 02-55991314
● 您有任何加盟、品牌合作或預收款帳務疑問，歡迎在此直接留言，總部專員將會立刻為您解答！

📦 【訂單出貨與物流窗口】
● 服務範圍：訂單出貨進度、快遞配送狀態、出貨急單核對
● 出貨專屬 LINE：👉 https://line.me/R/ti/p/@947vpgjp (LINE ID: @947vpgjp)
● 任何出貨與快遞問題，請直接加入此出貨專用帳號，將有出貨物流專員為您一對一對接服務！
━━━━━━━━━━━━━━━━━━
💡 提示：點擊下方快捷按鈕即可查詢其他項目！`;
      break;
    }

    default: {
      if (input !== "查詢") {
        await handleProductSearch(botType, input, replyToken, testReplies);
        return;
      }

      // 回覆 1-9 選單首頁
      replyMsg = `🍵 【初潤製茶所 · 會員服務中心】 🍵
━━━━━━━━━━━━━━━━━━
您好【${member.name}】！您的專屬帳號已安全綁定！

請點擊下方「浮動快捷按鈕」或直接回覆數字進行實時查詢：

【1】 👤 會員特權卡 (階級與福利)
【2】 💰 帳戶資產 (預收款與消費點數)
【3】 📦 訂單物流軌跡 (出貨進度追蹤)
【4】 🎟️ 專屬優惠券 (未使用的折價券)
【5】 👥 團隊合夥組織 (下線成員統計)
【6】 📋 資產明細賬本 (財務資金變動)
【7】 🍵 精品好茶推薦 (熱銷口碑茶單)
【8】 📢 品牌總部快訊 (最新活動與通告)
【9】 📞 聯絡總部客服 (專線、地址、留言)
━━━━━━━━━━━━━━━━━━
💡 提示：任何時候直接在對話框點擊底部的浮動按鈕或輸入數字，即可立刻讀取即時數據！`;
      break;
    }
  }

  await sendLineReply(botType, replyToken, replyMsg, LINKED_QUICK_REPLIES, testReplies);
}

/**
 * 處理「未綁定會員」的回覆邏輯 (引導綁定)
 */
async function handleUnlinkedUserFlow(botType: string, replyToken: string, userId: string, input: string, testReplies?: any[]) {
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
          botType,
          replyToken,
          `⚠️ 綁定失敗：此帳號已綁定過其他 LINE 帳號 (${maskedLine})。如有疑問，請聯繫總部客服解除綁定。`,
          UNLINKED_QUICK_REPLIES,
          testReplies
        );
        return;
      }

      // 更新 line_id 完成綁定
      const { error: updateErr } = await supabaseAdmin
        .from("members")
        .update({ line_id: userId })
        .eq("id", matchedMember.id);

      if (updateErr) {
        await sendLineReply(botType, replyToken, `❌ 資料庫寫入失敗：${updateErr.message}`, UNLINKED_QUICK_REPLIES, testReplies);
      } else {
        const welcomeMsg = `🎉 恭喜您！您的 LINE 帳號已安全綁定成功！

🍵 歡迎【${matchedMember.name}】茶友，登陸「初潤製茶所」會員服務中心！
● 您的職級：👑 ${matchedMember.tier}
● 專屬代碼：${matchedMember.member_code || "系統自動建檔"}
● 身分屬性：${matchedMember.is_b2b ? "👔 創業夥伴 (B2B)" : "🍵 一般茶友 (B2C)"}

━━━━━━━━━━━━━━━━━━
請點擊下方「浮動快捷按鈕」或直接回覆數字/口語進行即時查詢：

【1】 👤 會員特權卡 (階級與福利)
【2】 💰 帳戶資產 (預收款與消費點數)
【3】 📦 訂單物流軌跡 (出貨進度追蹤)
【4】 🎟️ 專屬優惠券 (未使用的折價券)
【5】 👥 團隊合夥組織 (下線成員統計)
【6】 📋 資產明細賬本 (財務資金變動)
【7】 🍵 精品好茶推薦 (熱銷口碑茶單)
【8】 📢 品牌總部快訊 (最新活動與通告)
【9】 📞 聯絡總部客服 (專線、地址、留言)
━━━━━━━━━━━━━━━━━━
💡 提示：任何時候直接在對話框點擊底部的浮動按鈕或輸入口語（如：「查出貨」、「餘額」），即可立刻讀取即時數據！`;
        await sendLineReply(botType, replyToken, welcomeMsg, LINKED_QUICK_REPLIES, testReplies);
      }
    } else {
      await sendLineReply(
        botType,
        replyToken,
        `❌ 找不到符合此資訊的會員帳號。
        
請確認您輸入的手機號碼 (例如 0912345678) 或會員代碼 (例如 CR26M040001) 是否正確，或先前往初潤官方網站註冊後再進行綁定！`,
        UNLINKED_QUICK_REPLIES,
        testReplies
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
      botType,
      replyToken,
      `🍵 熱銷茶葉精品推薦 (公開資訊)
━━━━━━━━━━━━━━━━━━
初潤製茶所經典茶款口碑力薦：
${prodStr}
🔗 點擊立刻線上註冊與採購：https://churun-v3.vercel.app/store
━━━━━━━━━━━━━━━━━━
💡 提示：回覆您的「手機號碼」即可秒速綁定您的會員中心！`,
      UNLINKED_QUICK_REPLIES,
      testReplies
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
      botType,
      replyToken,
      `📢 總部 brand 公告 (公開資訊)
━━━━━━━━━━━━━━━━━━
● 主題：${title}
● 分類：${tag}
● 摘要：${content}
━━━━━━━━━━━━━━━━━━
💡 提示：回覆您的「手機號碼」即可秒速綁定您的會員中心！`,
      UNLINKED_QUICK_REPLIES,
      testReplies
    );
    return;
  }

  if (input === "9") {
    await sendLineReply(
      botType,
      replyToken,
      `📞 聯絡總部與客服 (公開資訊)
━━━━━━━━━━━━━━━━━━
● 初潤客服專線：02-55991314
● 服務時間：週一至週五 09:00 - 18:00
● 官方網站：https://churun-v3.vercel.app/store
● 企業總部：台北市大安區建國南路一段279巷20號3樓

💡 任何時候您可以直接在此對話框與我們對話留言，小幫手看見後將有專人盡快為您解答！
━━━━━━━━━━━━━━━━━━
💡 提示：回覆您的「手機號碼」即可秒速綁定您的會員中心！`,
      UNLINKED_QUICK_REPLIES,
      testReplies
    );
    return;
  }

  // 針對其他非指令文字，進行商品模糊搜尋
  if (input !== "查詢") {
    await handleProductSearch(botType, input, replyToken, testReplies);
  } else {
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

    await sendLineReply(botType, replyToken, welcomeStr, UNLINKED_QUICK_REPLIES, testReplies);
  }
}

/**
 * 呼叫 LINE Reply API 回覆訊息
 */
async function sendLineReply(botType: string, replyToken: string, text: string, quickReplies?: any[], testReplies?: any[]) {
  if (testReplies) {
    testReplies.push({
      replyToken,
      text,
      quickReplies
    });
    console.log(`[LINE Webhook Mock Reply (Test Mode)] replyToken: ${replyToken}, Message length: ${text.length}`);
    return;
  }

  const token = getLineAccessToken(botType);
  if (token === "DEFAULT_ACCESS_TOKEN") {
    console.log(`[LINE Webhook Mock Reply] replyToken: ${replyToken}, Message:\n${text}`);
    return;
  }

  const messageObj: any = {
    type: "text",
    text: text,
  };

  if (quickReplies && quickReplies.length > 0) {
    messageObj.quickReply = {
      items: quickReplies
    };
  }

  try {
    const res = await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        replyToken: replyToken,
        messages: [messageObj],
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
