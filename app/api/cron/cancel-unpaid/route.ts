import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';
import nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

// =========================================================================
// 1. 取得 LINE Bot Access Token
// =========================================================================
function getLineAccessToken(): string {
  if (process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    return process.env.LINE_CHANNEL_ACCESS_TOKEN;
  }
  try {
    const envPath = path.join(process.cwd(), '.env.local');
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
  } catch (err) {
    console.warn('[LineToken] 讀取 .env.local 失敗:', err);
  }
  return "zZ2xNjSpxGORDJ4RtQLwxm70PmN4SXmyT+tAknCS279x42aZAKnaYh3+cGxiw7ek4MPS8ZBUyJPzXv77Z8ZAvHcZFhJqhguUR74ZfEMQIoPxULNME0+xV4dz+Hzu1CA8FKgsXE3iYjmdA9RrrWtVwQdB04t89/1O/w1cDnyilFU=";
}

// =========================================================================
// 2. 精準排除週末的「三個工作天」計算
// =========================================================================
function getWorkingDaysDiff(startDateStr: string, endDate: Date): number {
  const startDate = new Date(startDateStr);
  if (isNaN(startDate.getTime())) return 0;
  
  let curDate = new Date(startDate.getTime());
  let count = 0;
  
  while (curDate < endDate) {
    curDate.setDate(curDate.getDate() + 1);
    
    const curYear = curDate.getFullYear();
    const curMonth = curDate.getMonth();
    const curDay = curDate.getDate();
    
    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth();
    const endDay = endDate.getDate();
    
    const isSameDay = curYear === endYear && curMonth === endMonth && curDay === endDay;
    
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0: Sunday, 6: Saturday
      count++;
    }
    
    if (isSameDay || curDate > endDate) {
      break;
    }
  }
  return count;
}

// =========================================================================
// 3. 點數、儲值金與分紅推薦金安全回滾函數
// =========================================================================
async function rollbackOrderCommissionsAndPoints(orderId: string) {
  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, members(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error(`[Rollback] Order ${orderId} not found`);
      return;
    }

    const buyer = order.members;
    if (!buyer) return;

    const orderNumber = order.order_number || order.id.slice(-8).toUpperCase();

    // A. 回滾已發放的 B2C 點數 (購物積分)
    const { data: earnedPointsTxs } = await supabase
      .from('point_transactions')
      .select('*')
      .eq('order_id', orderId)
      .eq('transaction_type', 'earned_from_order');

    for (const tx of earnedPointsTxs || []) {
      if (tx.amount > 0) {
        const { data: rolledBackTxs } = await supabase
          .from('point_transactions')
          .select('id')
          .eq('order_id', orderId)
          .eq('transaction_type', 'order_cancelled_deduction')
          .eq('amount', -tx.amount);

        if (!rolledBackTxs || rolledBackTxs.length === 0) {
          const refundAmount = -tx.amount;
          await supabase.from('point_transactions').insert({
            member_id: tx.member_id,
            order_id: orderId,
            amount: refundAmount,
            transaction_type: 'order_cancelled_deduction'
          });

          const { data: m } = await supabase.from('members').select('points_balance').eq('id', tx.member_id).single();
          if (m) {
            await supabase.from('members')
              .update({ points_balance: Math.max(0, (m.points_balance || 0) + refundAmount) })
              .eq('id', tx.member_id);
          }

          await supabase.from('notifications').insert({
            member_id: tx.member_id,
            title: '⚠️ 購物紅利點數已扣回',
            content: `您的訂單 ${orderNumber} 已無效/刪除，系統已扣回原消費發放之紅利點數 ${tx.amount} 點。`,
            type: 'system'
          });
          console.log(`[Rollback] Deducted ${tx.amount} points from Member ${tx.member_id}`);
        }
      }
    }

    // B. 回滾已發放的 B2B 上線推薦分紅
    const { data: commissionTxs } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('order_id', orderId)
      .eq('transaction_type', 'commission_refund');

    for (const tx of commissionTxs || []) {
      if (tx.amount > 0) {
        const { data: rolledBackWts } = await supabase
          .from('wallet_transactions')
          .select('id')
          .eq('order_id', orderId)
          .eq('transaction_type', 'commission_rollback')
          .eq('amount', -tx.amount);

        if (!rolledBackWts || rolledBackWts.length === 0) {
          const refundAmount = -tx.amount;
          await supabase.from('wallet_transactions').insert({
            member_id: tx.member_id,
            order_id: orderId,
            amount: refundAmount,
            transaction_type: 'commission_rollback',
            status: 'completed'
          });

          const { data: m } = await supabase.from('members').select('virtual_balance').eq('id', tx.member_id).single();
          if (m) {
            await supabase.from('members')
              .update({ virtual_balance: (Number(m.virtual_balance) || 0) + Number(refundAmount) })
              .eq('id', tx.member_id);
          }

          await supabase.from('notifications').insert({
            member_id: tx.member_id,
            title: '⚠️ 推薦分紅獎金已扣回',
            content: `您的下線夥伴 ${buyer.name} 的訂單 ${orderNumber} 已無效/刪除，系統已扣回原撥發之推廣分紅 $${tx.amount} 元。`,
            type: 'referral'
          });
          console.log(`[Rollback] Deducted $${tx.amount} commission from Member ${tx.member_id}`);
        }
      }
    }

    // C. 退還結帳時折抵的 B2C 紅利點數
    const { data: redeemedTxs } = await supabase
      .from('point_transactions')
      .select('*')
      .eq('order_id', orderId)
      .eq('transaction_type', 'redeemed');

    for (const tx of redeemedTxs || []) {
      if (tx.amount < 0) {
        const { data: refundedTxs } = await supabase
          .from('point_transactions')
          .select('id')
          .eq('order_id', orderId)
          .eq('transaction_type', 'order_cancelled_refund')
          .eq('amount', Math.abs(tx.amount));

        if (!refundedTxs || refundedTxs.length === 0) {
          const refundAmount = Math.abs(tx.amount);
          await supabase.from('point_transactions').insert({
            member_id: tx.member_id,
            order_id: orderId,
            amount: refundAmount,
            transaction_type: 'order_cancelled_refund'
          });

          const { data: m } = await supabase.from('members').select('points_balance').eq('id', tx.member_id).single();
          if (m) {
            await supabase.from('members')
              .update({ points_balance: (m.points_balance || 0) + refundAmount })
              .eq('id', tx.member_id);
          }

          await supabase.from('notifications').insert({
            member_id: tx.member_id,
            title: '🎉 紅利點數已退還',
            content: `您的訂單 ${orderNumber} 已無效/刪除，系統已退還您於下單時折抵的紅利點數 ${refundAmount} 點。`,
            type: 'system'
          });
          console.log(`[Rollback] Refunded ${refundAmount} points to Member ${tx.member_id}`);
        }
      }
    }

    // D. 退還結帳時支付的儲值金 (B2B 或 B2C)
    const { data: payTxs } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('order_id', orderId)
      .in('transaction_type', ['payment', 'order_deduction']);

    for (const tx of payTxs || []) {
      if (tx.amount < 0) {
        const { data: refundedWts } = await supabase
          .from('wallet_transactions')
          .select('id')
          .eq('order_id', orderId)
          .eq('transaction_type', 'order_cancelled_refund')
          .eq('amount', Math.abs(Number(tx.amount)));

        if (!refundedWts || refundedWts.length === 0) {
          const refundAmount = Math.abs(Number(tx.amount));
          await supabase.from('wallet_transactions').insert({
            member_id: tx.member_id,
            order_id: orderId,
            amount: refundAmount,
            transaction_type: 'order_cancelled_refund',
            status: 'completed'
          });

          const { data: m } = await supabase.from('members').select('virtual_balance').eq('id', tx.member_id).single();
          if (m) {
            await supabase.from('members')
              .update({ virtual_balance: (Number(m.virtual_balance) || 0) + refundAmount })
              .eq('id', tx.member_id);
          }

          await supabase.from('notifications').insert({
            member_id: tx.member_id,
            title: '🎉 儲值支付已退還',
            content: `您的訂單 ${orderNumber} 已無效/刪除，系統已退還您於結帳時支付的儲值金 $${refundAmount.toLocaleString()} 元。`,
            type: 'system'
          });
          console.log(`[Rollback] Refunded $${refundAmount} wallet balance to Member ${tx.member_id}`);
        }
      }
    }

  } catch (err: any) {
    console.error(`[Rollback Error] Failed to rollback order ${orderId}:`, err.message);
  }
}

// =========================================================================
// 4. 自動掃描並取消超過 3 個工作天未付款訂單的主邏輯
// =========================================================================
async function cancelUnpaidOrders() {
  const log: string[] = [];
  try {
    const now = new Date();
    log.push(`[Start] 執行時間: ${now.toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}`);

    // 1. 查詢所有狀態為 pending (未付款/待處理) 的訂單，並加載會員詳細資料
    const { data: pendingOrders, error: fetchError } = await supabase
      .from('orders')
      .select('*, members(*)')
      .eq('status', 'pending');

    if (fetchError) {
      throw new Error(`查詢未付款訂單失敗: ${fetchError.message}`);
    }

    log.push(`找到 ${pendingOrders?.length || 0} 筆未付款 (pending) 訂單。`);
    let cancelledCount = 0;

    for (const order of pendingOrders || []) {
      const workingDays = getWorkingDaysDiff(order.created_at, now);
      const orderNumber = order.order_number || order.id.slice(-8).toUpperCase();
      const member = order.members;

      if (!member) {
        log.push(`[Warning] 訂單 ${orderNumber} 無關聯會員，跳過`);
        continue;
      }

      // 如果未付款時間達到或超過 3 個工作天，則執行自動取消
      if (workingDays >= 3) {
        log.push(`訂單 ${orderNumber} (會員: ${member.name}) 成立於 ${new Date(order.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}，已過 ${workingDays} 個工作天，執行自動取消...`);

        // A. 點數/儲值金/佣金回滾
        await rollbackOrderCommissionsAndPoints(order.id);

        // B. 商品庫存還原
        const { data: items } = await supabase.from('order_items').select('*').eq('order_id', order.id);
        for (const item of items || []) {
          const { data: prod } = await supabase.from('products').select('stock_count').eq('id', item.product_id).single();
          if (prod) {
            await supabase
              .from('products')
              .update({ stock_count: (prod.stock_count || 0) + item.quantity })
              .eq('id', item.product_id);
            log.push(`  歸還商品 ${item.name} 庫存 +${item.quantity}`);
          }
        }

        // C. 變更訂單狀態為 cancelled
        let fallbackJson: any = {};
        if (order.custom_logo_url && order.custom_logo_url.startsWith('FALLBACK_JSON:')) {
          try {
            fallbackJson = JSON.parse(order.custom_logo_url.substring('FALLBACK_JSON:'.length));
          } catch (e) {
            console.error(e);
          }
        }
        fallbackJson.auditor = '系統自動判定';
        fallbackJson.audited_at = new Date().toISOString();
        fallbackJson.cancellation_reason = '逾期 3 個工作天未付款';

        await supabase
          .from('orders')
          .update({
            status: 'cancelled',
            custom_logo_url: 'FALLBACK_JSON:' + JSON.stringify(fallbackJson)
          })
          .eq('id', order.id);

        // D. 寫入站內通知
        const orderTimeStr = new Date(order.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
        await supabase.from('notifications').insert({
          member_id: member.id,
          title: '⚠️ 訂單逾期付款取消通知',
          content: `${member.name} 您好，您於 ${orderTimeStr} 成立的訂單 ${orderNumber}，因超過 3 個工作天未完成付款，系統已自動判定為「不成立/已取消」。所折抵之點數/儲值金已全數歸還，謝謝。`,
          type: 'order'
        });

        // E. LINE 官方帳號推播 (若綁定 line_id)
        if (member.line_id) {
          const lineToken = getLineAccessToken();
          const lineMsg = `⚠️ 【初潤製茶所 - 訂單自動取消通知】 ⚠️
━━━━━━━━━━━━━━━━━━
親愛的【${member.name}】您好：

您於 ${orderTimeStr} 成立的訂單，因超過 3 個工作天未完成付款，系統已自動將該筆訂單判定為「不成立/已取消」。

● 訂單編號：${orderNumber}
● 訂單金額：$${Number(order.total_amount).toLocaleString()} 元
● 取消原因：逾期未付款自動失效
━━━━━━━━━━━━━━━━━━
💡 溫馨提示：
所折抵之紅利點數或儲值金皆已全數歸還帳戶。若您仍需要購買商品，歡迎隨時前往商城重新下單。如有疑問請聯絡總部客服，謝謝！`;

          try {
            const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
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
            if (!lineRes.ok) {
              const errText = await lineRes.text();
              log.push(`  [LINE Push Error] 推播失敗: ${errText}`);
            } else {
              log.push(`  [LINE Push Success] 成功發送推播給會員 ${member.name}`);
            }
          } catch (lineErr: any) {
            log.push(`  [LINE Push Exception] 發生異常: ${lineErr.message}`);
          }
        }

        // F. Email 寄發通知
        if (member.email) {
          try {
            const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST || 'smtp.gmail.com',
              port: Number(process.env.SMTP_PORT || 465),
              secure: true,
              auth: {
                user: process.env.SMTP_USER || 'churun.tea@gmail.com',
                pass: process.env.SMTP_PASS || 'nshm vxow lqxz fgyr',
              },
            });

            const mailHtml = `
              <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #fcfbf7; border-radius: 16px; border: 1px solid #eee;">
                <div style="text-align: center; margin-bottom: 25px;">
                  <h1 style="color: #064e3b; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 2px;">初潤製茶所 CHURUN</h1>
                  <p style="color: #64748b; font-size: 12px; margin-top: 5px;">數位連鎖加盟平台 · 訂單管理中心</p>
                </div>
                <div style="background-color: #ffffff; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                  <h2 style="color: #991b1b; font-size: 18px; border-bottom: 2px solid #ef4444; padding-bottom: 10px; margin-top: 0;">⚠️ 訂單逾期未付款失效通知</h2>
                  <p style="color: #334155; font-size: 15px; line-height: 1.6;">親愛的 <strong>${member.name}</strong> 您好：</p>
                  <p style="color: #334155; font-size: 15px; line-height: 1.6;">您於 <strong>${orderTimeStr}</strong> 成立的訂單，因已超過 3 個工作天未完成付款，系統已自動將該筆訂單判定為<strong>「不成立/已取消」</strong>。</p>
                  <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                    <p style="margin: 5px 0; font-size: 14px; color: #1e293b;"><strong>訂單編號：</strong> ${orderNumber}</p>
                    <p style="margin: 5px 0; font-size: 14px; color: #1e293b;"><strong>訂單金額：</strong> $${Number(order.total_amount).toLocaleString()} 元</p>
                    <p style="margin: 5px 0; font-size: 14px; color: #1e293b;"><strong>失效原因：</strong> 逾期 3 個工作天未付款</p>
                    <p style="margin: 5px 0; font-size: 14px; color: #1e293b;"><strong>失效處理時間：</strong> ${now.toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}</p>
                  </div>
                  <p style="color: #475569; font-size: 13px; line-height: 1.6;">💡 <strong>溫馨提示：</strong><br>
                  • 本訂單下單時所折抵之紅利點數或錢包餘額，均已為您全數歸還。<br>
                  • 若您仍需要此筆訂單之商品，歡迎前往商城重新下單。如有任何疑問，請聯絡總部客服。</p>
                </div>
                <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
                  <p>初潤製茶所 V3.0 系統自動發送，請勿直接回覆此信件。</p>
                </div>
              </div>
            `;

            await transporter.sendMail({
              from: '"初潤製茶所" <churun.tea@gmail.com>',
              to: member.email,
              subject: `[初潤系統通知] 您的訂單 ${orderNumber} 因逾期未付款已自動取消失效`,
              html: mailHtml,
            });
            log.push(`  [Email Success] 成功寄發通知信至: ${member.email}`);
          } catch (mailErr: any) {
            log.push(`  [Email Error] 寄信失敗: ${mailErr.message}`);
          }
        }

        cancelledCount++;
      } else {
        log.push(`訂單 ${orderNumber} 成立約 ${workingDays} 個工作天，未滿 3 天，不予取消。`);
      }
    }

    log.push(`[Finish] 處理完畢。共自動取消並回滾 ${cancelledCount} 筆訂單。`);
    return { success: true, message: `Successfully auto-cancelled unpaid orders. Cancelled: ${cancelledCount}`, log };

  } catch (error: any) {
    log.push(`[Error] 異常中斷: ${error.message}`);
    return { success: false, error: error.message, log };
  }
}

// =========================================================================
// 5. API 接口入口
// =========================================================================
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await cancelUnpaidOrders();
  if (!result.success) return NextResponse.json({ error: result.error, log: result.log }, { status: 500 });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await cancelUnpaidOrders();
  if (!result.success) return NextResponse.json({ error: result.error, log: result.log }, { status: 500 });
  return NextResponse.json(result);
}
