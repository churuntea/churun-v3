import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

async function evaluateTiers() {
  try {
    // Fetch all members
    const { data: members, error: fetchError } = await supabase
      .from('members')
      .select('id, lifetime_spend, tier');

    if (fetchError) throw fetchError;

    // Fetch dynamic rules from database
    const { data: dbRules } = await supabase.from('bonus_rules').select('tier_name, min_spend').order('display_order', { ascending: true });
    
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
          // Optional: Add a notification for tier upgrade
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

async function performSettlement() {
  try {
    // 1. Settle pending wallet transactions
    const { data: pendingTx, error: fetchError } = await supabase
      .from('wallet_transactions')
      .select('id')
      .eq('status', 'pending');

    if (fetchError) throw fetchError;

    if (pendingTx && pendingTx.length > 0) {
      const txIds = pendingTx.map(tx => tx.id);
      await supabase.from('wallet_transactions').update({ status: 'completed' }).in('id', txIds);
    }

    // 2. Evaluate tiers
    const tierResult = await evaluateTiers();

    // 3. 自動發放已出貨滿 30 天之訂單的紅利點數
    let pointsIssuedCount = 0;
    let pointsOrdersCount = 0;
    try {
      const { data: shippedOrders } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          custom_logo_url,
          shipped_at,
          status,
          fulfillment_status,
          members (
            id,
            name,
            tier,
            is_b2b,
            points_balance
          )
        `)
        .eq('status', 'completed')
        .eq('fulfillment_status', 'shipped');

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
          const buyer: any = order.members;
          if (!buyer || buyer.is_b2b) continue;

          // 獲取 shipped_at 時間
          let shippedAt = order.shipped_at;
          if (!shippedAt && order.custom_logo_url && order.custom_logo_url.startsWith('FALLBACK_JSON:')) {
            try {
              const parsed = JSON.parse(order.custom_logo_url.substring('FALLBACK_JSON:'.length));
              shippedAt = parsed.shipped_at;
            } catch (e) {}
          }

          if (!shippedAt) continue;

          // 計算出貨至今的時間天數
          const diffTime = Math.abs(new Date().getTime() - new Date(shippedAt).getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // 判斷是否大於等於 30 天
          if (diffDays >= 30) {
            // 檢查該訂單是否已經發過紅利點數
            const { data: existingPts } = await supabase
              .from('point_transactions')
              .select('id')
              .eq('order_id', order.id)
              .eq('transaction_type', 'earned_from_order');

            if (existingPts && existingPts.length > 0) {
              continue; // 已經發過了，跳過
            }

            // 計算紅利點數
            const rate = rateMapping[buyer.tier] || 100;
            const rewardPoints = Math.floor(Number(order.total_amount) / rate);

            if (rewardPoints > 0) {
              // 1. 寫入積分流水
              await supabase.from('point_transactions').insert({
                member_id: buyer.id,
                order_id: order.id,
                amount: rewardPoints,
                transaction_type: 'earned_from_order'
              });

              // 2. 更新會員餘額
              await supabase.from('members').update({
                points_balance: (buyer.points_balance || 0) + rewardPoints
              }).eq('id', buyer.id);

              // 3. 發送系統通知
              await supabase.from('notifications').insert({
                member_id: buyer.id,
                title: '🎁 紅利點數已自動入帳！',
                content: `您好！您的訂單編號已出貨滿 30 天，系統已自動為您存入消費回饋之紅利點數 ${rewardPoints} 點！`,
                type: 'system'
              });

              pointsIssuedCount += rewardPoints;
              pointsOrdersCount++;
            }
          }
        }
      }
    } catch (ptsErr: any) {
      console.error('[Settlement Cron] Points issuance failed:', ptsErr);
    }
    
    return { 
      success: true, 
      message: `業績結算與職級考核完成！ ${tierResult.message} 📅 依據品牌新制營運規章，消費回饋之紅利點數已改為【出貨後滿 30 天自動發送】。本次共完成 ${pointsOrdersCount} 筆出貨達標訂單對帳，累計發放 ${pointsIssuedCount} 點紅利點數。` 
    };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await performSettlement();
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await performSettlement();
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json(result);
}
