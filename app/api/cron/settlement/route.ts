import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '../../../supabase-admin';
import { enforceCronSecret } from '../../route-auth';

async function evaluateTiers() {
  try {
    const { data: members, error: fetchError } = await supabase
      .from('members')
      .select('id, lifetime_spend, tier');

    if (fetchError) throw fetchError;

    const { data: dbRules } = await supabase
      .from('bonus_rules')
      .select('tier_name, min_spend')
      .order('display_order', { ascending: true });

    const tierRules = dbRules && dbRules.length > 0
      ? dbRules.map(r => ({ name: r.tier_name, minSpend: r.min_spend }))
      : [
          { name: '初潤靈魂伴侶', minSpend: 50000 },
          { name: '初潤知己', minSpend: 25000 },
          { name: '初潤閨蜜', minSpend: 12000 },
          { name: '初潤好朋友', minSpend: 6000 },
          { name: '初潤青少年', minSpend: 3000 },
          { name: '初潤小朋友', minSpend: 1500 },
          { name: '初潤幼兒園', minSpend: 1 },
          { name: '初潤寶寶', minSpend: 0 }
        ];

    let updatedCount = 0;

    for (const member of members || []) {
      const spend = Number(member.lifetime_spend);
      let targetTier = '初潤寶寶';

      for (const rule of tierRules) {
        if (spend >= rule.minSpend) {
          targetTier = rule.name;
          break;
        }
      }

      if (targetTier !== member.tier) {
        const { error: updateError } = await supabase
          .from('members')
          .update({ tier: targetTier })
          .eq('id', member.id);

        if (!updateError) {
          updatedCount++;
          await supabase.from('notifications').insert({
            member_id: member.id,
            title: '職級晉升通知',
            content: `恭喜！您的職級已正式晉升為「${targetTier}」。`,
            type: 'system'
          });
        }
      }
    }

    return { success: true, message: `Evaluated ${members?.length} members, updated ${updatedCount} tiers.` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function extractSettlementReferenceTime(order: any): string | null {
  if (!order) return null;
  if (order.delivered_at) return order.delivered_at;
  if (order.shipped_at) return order.shipped_at;

  if (order.custom_logo_url && order.custom_logo_url.startsWith('FALLBACK_JSON:')) {
    try {
      const parsed = JSON.parse(order.custom_logo_url.substring('FALLBACK_JSON:'.length));
      return parsed.delivered_at || parsed.shipped_at || parsed.completed_at || parsed.paid_at || null;
    } catch (e) {
      console.warn('[Settlement Cron] Invalid FALLBACK_JSON for order', order.id);
    }
  }

  return order.completed_at || order.paid_at || order.created_at || null;
}

async function settlePendingWalletTransactions() {
  const { data: pendingTx, error: fetchError } = await supabase
    .from('wallet_transactions')
    .select('id')
    .eq('status', 'pending');

  if (fetchError) throw fetchError;
  if (!pendingTx || pendingTx.length === 0) return 0;

  const txIds = pendingTx.map((tx: any) => tx.id);
  const { error: updateError } = await supabase
    .from('wallet_transactions')
    .update({ status: 'completed' })
    .in('id', txIds);

  if (updateError) throw updateError;
  return txIds.length;
}

async function performSettlement() {
  try {
    const settledCount = await settlePendingWalletTransactions();
    const tierResult = await evaluateTiers();

    let pointsIssuedCount = 0;
    let pointsOrdersCount = 0;
    let commissionsIssuedCount = 0;
    let commissionsOrdersCount = 0;

    try {
      const { data: shippedOrders } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          custom_logo_url,
          status,
          fulfillment_status,
          b2b_commission,
          created_at,
          shipped_at,
          delivered_at,
          paid_at,
          completed_at,
          members (
            id,
            name,
            tier,
            is_b2b,
            upline_id,
            points_balance
          )
        `)
        .eq('status', 'completed')
        .in('fulfillment_status', ['shipped', 'delivered']);

      if (shippedOrders && shippedOrders.length > 0) {
        const rateMapping: Record<string, number> = {
          '初潤寶寶': 100,
          '初潤幼兒園': 90,
          '初潤小朋友': 80,
          '初潤青少年': 70,
          '初潤好朋友': 60,
          '初潤閨蜜': 50,
          '初潤知己': 40,
          '初潤靈魂伴侶': 30,
        };

        for (const order of shippedOrders) {
          const referenceTime = extractSettlementReferenceTime(order);
          if (!referenceTime) {
            console.warn('[Settlement Cron] 無法取得訂單結算基準時間', order.id);
            continue;
          }

          const diffTime = new Date().getTime() - new Date(referenceTime).getTime();
          if (diffTime < 0) {
            console.warn('[Settlement Cron] 訂單基準時間在未來，略過', order.id, referenceTime);
            continue;
          }

          if (diffTime < 30 * 24 * 60 * 60 * 1000) {
            continue;
          }

          const buyer: any = order.members;
          if (!buyer) continue;

          if (!buyer.is_b2b) {
            const { data: existingPts } = await supabase
              .from('point_transactions')
              .select('id')
              .eq('order_id', order.id)
              .eq('transaction_type', 'earned_from_order');

            if (!existingPts || existingPts.length === 0) {
              const rate = rateMapping[buyer.tier] || 100;
              const rewardPoints = Math.floor(Number(order.total_amount) / rate);

              if (rewardPoints > 0) {
                await supabase.from('point_transactions').insert({
                  member_id: buyer.id,
                  order_id: order.id,
                  amount: rewardPoints,
                  transaction_type: 'earned_from_order'
                });

                await supabase.from('members').update({
                  points_balance: (buyer.points_balance || 0) + rewardPoints
                }).eq('id', buyer.id);

                await supabase.from('notifications').insert({
                  member_id: buyer.id,
                  title: '🎁 紅利點數已自動入帳！',
                  content: `您好！您的訂單已簽收取貨滿 30 天，系統已自動為您存入消費回饋之紅利點數 ${rewardPoints} 點！`,
                  type: 'system'
                });

                pointsIssuedCount += rewardPoints;
                pointsOrdersCount++;

                // 🌟 新增：靈魂伴侶專屬 B2C 推薦紅利機制
                if (buyer.tier === '初潤靈魂伴侶' && buyer.upline_id) {
                  const { data: upline } = await supabase
                    .from('members')
                    .select('id, name, is_b2b, tier, points_balance')
                    .eq('id', buyer.upline_id)
                    .single();

                  if (upline && !upline.is_b2b && upline.tier === '初潤靈魂伴侶') {
                    // Check if the upline already got the points for this order
                    const { data: existingRefPts } = await supabase
                      .from('point_transactions')
                      .select('id')
                      .eq('order_id', order.id)
                      .eq('member_id', upline.id)
                      .eq('transaction_type', 'earned_from_order');

                    if (!existingRefPts || existingRefPts.length === 0) {
                      await supabase.from('point_transactions').insert({
                        member_id: upline.id,
                        order_id: order.id,
                        amount: rewardPoints,
                        transaction_type: 'earned_from_order'
                      });

                      await supabase.from('members').update({
                        points_balance: (upline.points_balance || 0) + rewardPoints
                      }).eq('id', upline.id);

                      await supabase.from('notifications').insert({
                        member_id: upline.id,
                        title: '🎁 專屬推薦紅利點數已自動入帳！',
                        content: `您的下線夥伴 ${buyer.name} 的消費已滿 30 天，由於您與夥伴皆為最高會員「初潤靈魂伴侶」，系統已自動為您存入等比例的推薦紅利點數 ${rewardPoints} 點！`,
                        type: 'system'
                      });

                      pointsIssuedCount += rewardPoints;
                    }
                  }
                }
              }
            }
          }

          if (buyer.upline_id && Number(order.b2b_commission) > 0) {
            const { data: existingTx } = await supabase
              .from('wallet_transactions')
              .select('id')
              .eq('order_id', order.id)
              .eq('transaction_type', 'commission_refund');

            if (!existingTx || existingTx.length === 0) {
              const { data: upline } = await supabase
                .from('members')
                .select('id, name, is_b2b, virtual_balance')
                .eq('id', buyer.upline_id)
                .single();

              if (upline && upline.is_b2b) {
                const commAmount = Number(order.b2b_commission);

                await supabase.from('wallet_transactions').insert({
                  member_id: upline.id,
                  order_id: order.id,
                  amount: commAmount,
                  transaction_type: 'commission_refund',
                  status: 'completed'
                });

                await supabase.from('members').update({
                  virtual_balance: (Number(upline.virtual_balance) || 0) + commAmount
                }).eq('id', upline.id);

                await supabase.from('notifications').insert({
                  member_id: upline.id,
                  title: '🎁 推薦推廣回饋已自動撥發入帳！',
                  content: `您的下線夥伴 ${buyer.name} 的訂單已簽收取貨滿 30 天，您獲得的 $${commAmount.toLocaleString()} 推廣獎金已自動存入您的帳本！`,
                  type: 'referral'
                });

                commissionsIssuedCount += commAmount;
                commissionsOrdersCount++;
              }
            }
          }
        }
      }
    } catch (ptsErr: any) {
      console.error('[Settlement Cron] Points/Commission issuance failed:', ptsErr);
    }

    return {
      success: true,
      message: `業績結算與職級考核完成！ ${tierResult.message}。本次共完成 ${pointsOrdersCount} 筆簽收點數發放（共 ${pointsIssuedCount} 點）、${commissionsOrdersCount} 筆推薦退傭獎金撥點（共 $${commissionsIssuedCount.toLocaleString()} 元），並處理 ${settledCount} 筆待結算錢包異動。`
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function GET(request: Request) {
  const authError = enforceCronSecret(request);
  if (authError) return authError;

  const result = await performSettlement();
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const authError = enforceCronSecret(request);
  if (authError) return authError;

  const result = await performSettlement();
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json(result);
}
