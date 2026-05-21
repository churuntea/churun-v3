import { supabaseAdmin } from "@/app/supabase-admin";
import * as fs from 'fs';
import * as path from 'path';
import nodemailer from 'nodemailer';

// ─── LINE Access Token (同 notify-helper.ts 模式) ───
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

// ─── Email Transporter (同 notify-helper.ts 模式) ───
function createEmailTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: {
      user: process.env.SMTP_USER || 'churun.tea@gmail.com',
      pass: process.env.SMTP_PASS || 'nshm vxow lqxz fgyr',
    },
  });
}

// ─── 申請類型中文名稱對照 ───
function getApplicationTypeName(type: string): string {
  switch (type) {
    case 'paid': return '付費品牌大使';
    case 'free': return '績效品牌大使';
    case 'partner': return '合夥人';
    default: return '品牌大使';
  }
}

// ═══════════════════════════════════════════════════════════════
// 1. 申請已收到通知
// ═══════════════════════════════════════════════════════════════
export async function sendAmbassadorApplicationNotify(
  memberId: string,
  applicationType: 'paid' | 'free' | 'partner'
) {
  try {
    // 1. 查詢會員詳細資料
    const { data: member } = await supabaseAdmin
      .from("members")
      .select("*")
      .eq("id", memberId)
      .maybeSingle();

    if (!member) {
      console.warn("[AmbassadorNotify] 找不到會員，無法發送通知:", memberId);
      return;
    }

    const memberName = member.name || "會員";
    const memberEmail = member.email || "churun.tea@gmail.com";
    const timestamp = new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
    const typeName = getApplicationTypeName(applicationType);

    // 2. 寫入站內通知 (notifications)
    await supabaseAdmin.from("notifications").insert({
      member_id: memberId,
      title: `🎉 ${typeName}申請已收到`,
      content: `${memberName} 您好，您的【${typeName}】申請已於 ${timestamp} 成功送出。\n\n我們將在 3-5 個工作日內完成審核，審核結果將以 LINE 推播及 Email 通知您。\n\n感謝您對初潤製茶所的支持與信任！`,
      type: "ambassador"
    });

    // 3. 發送 LINE 推播 (若綁定 line_id)
    if (member.line_id) {
      const lineToken = getLineAccessToken();
      const lineMsg = `🎉 【品牌大使/合夥人申請已收到】 🎉
━━━━━━━━━━━━━━━━━━
親愛的【${memberName}】您好：

您的申請已成功送出，以下是申請摘要：

● 申請類型：${typeName}
● 申請時間：${timestamp}
● 預計審核：3-5 個工作日
━━━━━━━━━━━━━━━━━━
📋 審核完成後，系統將立即通知您結果。
💡 如有任何疑問，歡迎聯繫官方帳號 @332lujot

初潤製茶所 敬上`;

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
          console.error("[LINE Push Error] 發送大使申請通知失敗:", errText);
        } else {
          console.log(`[LINE Push Success] 成功推播大使申請通知給會員: ${memberId}`);
        }
      } catch (lineErr) {
        console.error("[LINE Push Exception]", lineErr);
      }
    }

    // 4. 發送 Email 通知信
    try {
      const transporter = createEmailTransporter();

      const mailHtml = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #fcfbf7; border-radius: 16px; border: 1px solid #eee;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #064e3b; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 2px;">初潤製茶所 CHURUN</h1>
            <p style="color: #64748b; font-size: 12px; margin-top: 5px;">數位連鎖加盟平台 · 品牌大使中心</p>
          </div>
          <div style="background-color: #ffffff; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #059669, #d4af37); color: white; padding: 12px 30px; border-radius: 50px; font-size: 18px; font-weight: 700;">🎉 申請已收到</div>
            </div>
            <h2 style="color: #0f172a; font-size: 18px; border-bottom: 2px solid #059669; padding-bottom: 10px; margin-top: 0;">您的${typeName}申請已成功送出</h2>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">親愛的 <strong>${memberName}</strong> 您好：</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">感謝您申請成為初潤製茶所的<strong style="color: #059669;">${typeName}</strong>！我們已收到您的申請，以下是申請摘要：</p>
            <div style="background: linear-gradient(135deg, #f0fdf4, #fefce8); padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #d4af37;">
              <p style="margin: 8px 0; font-size: 14px; color: #1e293b;"><strong>📌 申請類型：</strong>${typeName}</p>
              <p style="margin: 8px 0; font-size: 14px; color: #1e293b;"><strong>🕐 申請時間：</strong>${timestamp}</p>
              <p style="margin: 8px 0; font-size: 14px; color: #1e293b;"><strong>⏳ 預計審核：</strong>3-5 個工作日</p>
            </div>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.6;">
                💡 <strong>溫馨提醒：</strong>審核完成後，我們將透過 LINE 推播及 Email 第一時間通知您審核結果。在審核期間，您可以隨時透過系統查詢申請進度。
              </p>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
            <p>初潤製茶所 V3.0 系統自動發送，請勿直接回覆此信件。</p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: '"初潤製茶所" <churun.tea@gmail.com>',
        to: memberEmail,
        cc: memberEmail !== 'churun.tea@gmail.com' ? 'churun.tea@gmail.com' : undefined,
        subject: `[初潤製茶所] 您的${typeName}申請已收到`,
        html: mailHtml,
      });

      console.log(`[Email Success] 成功發送大使申請通知信至: ${memberEmail}`);
    } catch (mailErr) {
      console.error("[Email Exception] 發送郵件通知失敗:", mailErr);
    }

  } catch (err) {
    console.error("[AmbassadorNotify] 執行申請通知過程中出錯:", err);
  }
}

// ═══════════════════════════════════════════════════════════════
// 2. 審核結果通知 (核准 / 駁回)
// ═══════════════════════════════════════════════════════════════
export async function sendAmbassadorReviewNotify(
  memberId: string,
  approved: boolean,
  notes?: string,
  applicationType?: string
) {
  try {
    // 1. 查詢會員詳細資料
    const { data: member } = await supabaseAdmin
      .from("members")
      .select("*")
      .eq("id", memberId)
      .maybeSingle();

    if (!member) {
      console.warn("[AmbassadorNotify] 找不到會員，無法發送審核通知:", memberId);
      return;
    }

    const memberName = member.name || "會員";
    const memberEmail = member.email || "churun.tea@gmail.com";
    const timestamp = new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
    const typeName = getApplicationTypeName(applicationType || 'paid');

    // ── 核准 ──
    if (approved) {
      const effectiveDate = new Date().toLocaleDateString("zh-TW", { timeZone: "Asia/Taipei" });

      // 站內通知
      await supabaseAdmin.from("notifications").insert({
        member_id: memberId,
        title: `🎊 恭喜！您的${typeName}申請已通過`,
        content: `${memberName} 您好，恭喜您！您的【${typeName}】申請已於 ${timestamp} 審核通過。\n\n🗓 生效日期：${effectiveDate}\n\n歡迎加入初潤製茶所品牌大使行列！期待與您攜手共創佳績！`,
        type: "ambassador"
      });

      // LINE 推播
      if (member.line_id) {
        const lineToken = getLineAccessToken();
        const lineMsg = `🎊 【恭喜！審核通過】 🎊
━━━━━━━━━━━━━━━━━━
親愛的【${memberName}】您好：

🎉 您的【${typeName}】申請已審核通過！

● 生效日期：${effectiveDate}
● 審核時間：${timestamp}
━━━━━━━━━━━━━━━━━━
🌟 歡迎加入初潤製茶所品牌大使行列！
期待與您攜手共創佳績！

初潤製茶所 敬上`;

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
            console.error("[LINE Push Error] 發送審核通過通知失敗:", errText);
          } else {
            console.log(`[LINE Push Success] 成功推播審核通過通知給會員: ${memberId}`);
          }
        } catch (lineErr) {
          console.error("[LINE Push Exception]", lineErr);
        }
      }

      // Email
      try {
        const transporter = createEmailTransporter();

        const mailHtml = `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #fcfbf7; border-radius: 16px; border: 1px solid #eee;">
            <div style="text-align: center; margin-bottom: 25px;">
              <h1 style="color: #064e3b; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 2px;">初潤製茶所 CHURUN</h1>
              <p style="color: #64748b; font-size: 12px; margin-top: 5px;">數位連鎖加盟平台 · 品牌大使中心</p>
            </div>
            <div style="background-color: #ffffff; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <div style="text-align: center; margin-bottom: 20px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #059669, #d4af37); color: white; padding: 15px 35px; border-radius: 50px; font-size: 20px; font-weight: 700;">🎊 審核通過</div>
              </div>
              <h2 style="color: #0f172a; font-size: 18px; border-bottom: 2px solid #d4af37; padding-bottom: 10px; margin-top: 15px;">恭喜您成為初潤${typeName}！</h2>
              <p style="color: #334155; font-size: 15px; line-height: 1.6;">親愛的 <strong>${memberName}</strong> 您好：</p>
              <p style="color: #334155; font-size: 15px; line-height: 1.6;">我們很高興地通知您，您的 <strong style="color: #059669;">${typeName}</strong> 申請已正式審核通過！🎉</p>
              <div style="background: linear-gradient(135deg, #f0fdf4, #fefce8); padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #d4af37;">
                <p style="margin: 8px 0; font-size: 14px; color: #1e293b;"><strong>🏅 身份：</strong>${typeName}</p>
                <p style="margin: 8px 0; font-size: 14px; color: #1e293b;"><strong>🗓 生效日期：</strong>${effectiveDate}</p>
                <p style="margin: 8px 0; font-size: 14px; color: #1e293b;"><strong>✅ 審核時間：</strong>${timestamp}</p>
              </div>
              <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
                <p style="margin: 0; font-size: 13px; color: #166534; line-height: 1.6;">
                  🌟 <strong>歡迎加入初潤品牌大使行列！</strong>期待與您攜手共創佳績，共同為消費者帶來最優質的茶飲體驗。
                </p>
              </div>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
              <p>初潤製茶所 V3.0 系統自動發送，請勿直接回覆此信件。</p>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: '"初潤製茶所" <churun.tea@gmail.com>',
          to: memberEmail,
          cc: memberEmail !== 'churun.tea@gmail.com' ? 'churun.tea@gmail.com' : undefined,
          subject: `[初潤製茶所] 🎊 恭喜！您的${typeName}申請已通過`,
          html: mailHtml,
        });

        console.log(`[Email Success] 成功發送審核通過通知信至: ${memberEmail}`);
      } catch (mailErr) {
        console.error("[Email Exception] 發送郵件通知失敗:", mailErr);
      }

    // ── 駁回 ──
    } else {
      const reviewNotes = notes || "未達申請條件，歡迎日後重新申請。";

      // 站內通知
      await supabaseAdmin.from("notifications").insert({
        member_id: memberId,
        title: `📋 ${typeName}申請審核結果通知`,
        content: `${memberName} 您好，很遺憾通知您，您的【${typeName}】申請未能通過審核。\n\n審核說明：${reviewNotes}\n\n如有任何疑問，歡迎隨時與我們聯繫。感謝您對初潤製茶所的支持！`,
        type: "ambassador"
      });

      // LINE 推播
      if (member.line_id) {
        const lineToken = getLineAccessToken();
        const lineMsg = `📋 【申請審核結果通知】
━━━━━━━━━━━━━━━━━━
親愛的【${memberName}】您好：

很遺憾通知您，您的【${typeName}】申請未能通過本次審核。

● 審核說明：${reviewNotes}
● 審核時間：${timestamp}
━━━━━━━━━━━━━━━━━━
💡 您可以重新提交申請，我們期待您的再次參與。
如有任何疑問，歡迎聯繫官方帳號 @332lujot

初潤製茶所 敬上`;

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
            console.error("[LINE Push Error] 發送審核駁回通知失敗:", errText);
          } else {
            console.log(`[LINE Push Success] 成功推播審核駁回通知給會員: ${memberId}`);
          }
        } catch (lineErr) {
          console.error("[LINE Push Exception]", lineErr);
        }
      }

      // Email
      try {
        const transporter = createEmailTransporter();

        const mailHtml = `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #fcfbf7; border-radius: 16px; border: 1px solid #eee;">
            <div style="text-align: center; margin-bottom: 25px;">
              <h1 style="color: #064e3b; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 2px;">初潤製茶所 CHURUN</h1>
              <p style="color: #64748b; font-size: 12px; margin-top: 5px;">數位連鎖加盟平台 · 品牌大使中心</p>
            </div>
            <div style="background-color: #ffffff; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <h2 style="color: #0f172a; font-size: 18px; border-bottom: 2px solid #94a3b8; padding-bottom: 10px; margin-top: 0;">📋 申請審核結果通知</h2>
              <p style="color: #334155; font-size: 15px; line-height: 1.6;">親愛的 <strong>${memberName}</strong> 您好：</p>
              <p style="color: #334155; font-size: 15px; line-height: 1.6;">感謝您對初潤製茶所的關注與支持。經過審慎評估，很遺憾您的 <strong>${typeName}</strong> 申請未能通過本次審核。</p>
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #94a3b8;">
                <p style="margin: 8px 0; font-size: 14px; color: #1e293b;"><strong>📌 申請類型：</strong>${typeName}</p>
                <p style="margin: 8px 0; font-size: 14px; color: #1e293b;"><strong>🕐 審核時間：</strong>${timestamp}</p>
                <p style="margin: 8px 0; font-size: 14px; color: #1e293b;"><strong>📝 審核說明：</strong>${reviewNotes}</p>
              </div>
              <div style="background-color: #fefce8; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fde68a;">
                <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.6;">
                  💡 <strong>溫馨提醒：</strong>您可以隨時重新提交申請，我們非常期待您的再次參與。如有任何疑問，歡迎與我們聯繫。
                </p>
              </div>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
              <p>初潤製茶所 V3.0 系統自動發送，請勿直接回覆此信件。</p>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: '"初潤製茶所" <churun.tea@gmail.com>',
          to: memberEmail,
          cc: memberEmail !== 'churun.tea@gmail.com' ? 'churun.tea@gmail.com' : undefined,
          subject: `[初潤製茶所] 您的${typeName}申請審核結果通知`,
          html: mailHtml,
        });

        console.log(`[Email Success] 成功發送審核結果通知信至: ${memberEmail}`);
      } catch (mailErr) {
        console.error("[Email Exception] 發送郵件通知失敗:", mailErr);
      }
    }

  } catch (err) {
    console.error("[AmbassadorNotify] 執行審核通知過程中出錯:", err);
  }
}
