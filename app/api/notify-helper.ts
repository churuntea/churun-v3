import { supabaseAdmin } from "@/app/supabase-admin";
import * as fs from 'fs';
import * as path from 'path';
import nodemailer from 'nodemailer';

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

export interface SecurityNotifyOptions {
  memberId: string;
  actionName: string; // e.g. "銀行帳戶設定變更", "登入密碼修改"
  details: string;
}

export async function sendSecurityNotification({ memberId, actionName, details }: SecurityNotifyOptions) {
  try {
    // 1. 查詢會員詳細資料
    const { data: member } = await supabaseAdmin
      .from("members")
      .select("*")
      .eq("id", memberId)
      .maybeSingle();

    if (!member) {
      console.warn("[NotifyHelper] 找不到會員，無法發送通知:", memberId);
      return;
    }

    const memberName = member.name || "會員";
    const memberEmail = member.email || "churun.tea@gmail.com"; // 若會員無信箱則發送至總部備查
    const timestamp = new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });

    // 2. 寫入站內通知 (notifications)
    await supabaseAdmin.from("notifications").insert({
      member_id: memberId,
      title: `🔒 帳號安全異動通知：${actionName}`,
      content: `${memberName} 您好，系統已於 ${timestamp} 成功執行【${actionName}】。\n\n詳細資訊：${details}\n\n若非本人操作，請盡快聯繫客服。`,
      type: "security"
    });

    // 3. 發送 LINE 官方帳號推播 (若綁定 line_id)
    if (member.line_id) {
      const lineToken = getLineAccessToken();
      const lineMsg = `🔒 【初潤安全防護通知】 🔒
━━━━━━━━━━━━━━━━━━
親愛的【${memberName}】您好：
系統已偵測到您的帳號設定發生變更。

● 異動項目：${actionName}
● 異動時間：${timestamp}
● 異動內容：
${details}
━━━━━━━━━━━━━━━━━━
💡 安全提示：
若此變更為您本人操作，請忽略此訊息。若非您本人操作，請立即聯絡總部或客服進行帳號安全圈存！`;

      try {
        const res = await fetch("https://api.line.me/v2/bot/message/push", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${lineToken}`,
          },
          body: JSON.stringify({
            to: member.line_id,
            messages: [{ type: "text", text: lineMsg }],
          }),
        });
        if (!res.ok) {
          const errText = await res.text();
          console.error("[LINE Push Error] 發送安全通知失敗:", errText);
        } else {
          console.log(`[LINE Push Success] 成功推播安全通知給會員: ${memberId}`);
        }
      } catch (lineErr) {
        console.error("[LINE Push Exception]", lineErr);
      }
    }

    // 4. 發送 Email 通知信
    try {
      // 讀取 SMTP 設定，或使用預設 Gmail / SMTP
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || 465),
        secure: true,
        auth: {
          user: process.env.SMTP_USER || 'churun.tea@gmail.com',
          pass: process.env.SMTP_PASS || 'nshm vxow lqxz fgyr', // 預設應用程式密碼
        },
      });

      const mailHtml = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #fcfbf7; border-radius: 16px; border: 1px solid #eee;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #064e3b; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 2px;">初潤製茶所 CHURUN</h1>
            <p style="color: #64748b; font-size: 12px; margin-top: 5px;">數位連鎖加盟平台 · 安全防護中心</p>
          </div>
          <div style="background-color: #ffffff; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <h2 style="color: #0f172a; font-size: 18px; border-bottom: 2px solid #059669; padding-bottom: 10px; margin-top: 0;">🔒 帳號安全異動通知</h2>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">親愛的 <strong>${memberName}</strong> 您好：</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">系統已偵測到您的帳號設定於個人中心發生變更，特此發送防護通知信供您備查。</p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
              <p style="margin: 5px 0; font-size: 14px; color: #1e293b;"><strong>異動項目：</strong> ${actionName}</p>
              <p style="margin: 5px 0; font-size: 14px; color: #1e293b;"><strong>異動時間：</strong> ${timestamp}</p>
              <p style="margin: 5px 0; font-size: 14px; color: #1e293b;"><strong>異動明細：</strong> ${details}</p>
            </div>
            <p style="color: #dc2626; font-size: 13px; margin-top: 20px;">⚠️ <strong>安全警語：</strong> 這是系統自動發送的安全通知。若此操作為您本人執行，請忽略此信件。若您從未執行此項變更，您的帳號密碼可能已經外洩，請立刻登入系統修改密碼或與總部客服聯繫！</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
            <p>初潤製茶所 V3.0 系統自動發送，請勿直接回覆此信件。</p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: '"初潤製茶所" <churun.tea@gmail.com>',
        to: memberEmail,
        subject: `[初潤安全通知] 您的帳號已完成【${actionName}】設定異動`,
        html: mailHtml,
      });

      console.log(`[Email Success] 成功發送安全通知信至: ${memberEmail}`);
    } catch (mailErr) {
      console.error("[Email Exception] 發送郵件通知失敗:", mailErr);
    }

  } catch (err) {
    console.error("[NotifyHelper] 執行通知過程中出錯:", err);
  }
}
