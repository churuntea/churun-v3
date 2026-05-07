import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function POST(request: Request) {
  try {
    const { order_id, action } = await request.json(); // action: 'approve' or 'cancel'

    if (!order_id || !action) {
      return NextResponse.json({ success: false, error: '缺少必要參數' }, { status: 400 });
    }

    // 1. 取得訂單資料
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, members(*)')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ success: false, error: '找不到訂單' }, { status: 404 });
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ success: false, error: '訂單狀態不符，無法處理' }, { status: 400 });
    }

    if (action === 'cancel') {
      // 取消訂單：返還庫存
      const { data: items } = await supabase.from('order_items').select('*').eq('order_id', order.id);
      for (const item of items || []) {
        const { data: prod } = await supabase.from('products').select('stock_count').eq('id', item.product_id).single();
        if (prod) {
          await supabase.from('products').update({ stock_count: (prod.stock_count || 0) + item.quantity }).eq('id', item.product_id);
        }
      }
      
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
      return NextResponse.json({ success: true, message: '訂單已取消' });
    }

    if (action === 'approve') {
      const buyer = order.members;
      const totalAmount = order.total_amount;
      
      // 如果訂單內沒存到點數資訊，動態計算
      let rewardPoints = order.reward_points || 0;
      let b2bCommission = order.b2b_commission || 0;

      if (!rewardPoints && !b2bCommission) {
        console.log('Recalculating rewards for older order format...');
        const { data: items } = await supabase.from('order_items').select('*, products(*)').eq('order_id', order.id);
        
        let calculatedCommission = 0;
        for (const item of items || []) {
          const comm = (item.price * item.quantity) * (item.products?.b2b_commission_percent / 100);
          calculatedCommission += Math.floor(comm);
        }
        b2bCommission = calculatedCommission;

        const TIER_RATES: Record<string, number> = {
          '初潤靈魂伴侶': 30, '初潤知己': 40, '初潤閨蜜': 50, '初潤好朋友': 60,
          '初潤青少年': 70, '初潤小朋友': 80, '初潤幼兒園': 90, '初潤寶寶': 100
        };
        const tierRate = TIER_RATES[buyer.tier] || 100;
        rewardPoints = Math.floor(totalAmount / tierRate);
      }

      // 2. 執行點數/餘額更新
      const newLifetimeSpend = (Number(buyer.lifetime_spend) || 0) + totalAmount;
      const newQuarterlySpend = (Number(buyer.quarterly_spend) || 0) + totalAmount;

      const TIERS = [
        { name: '初潤靈魂伴侶', upgradeAmount: 50000 },
        { name: '初潤知己', upgradeAmount: 25000 },
        { name: '初潤閨蜜', upgradeAmount: 12000 },
        { name: '初潤好朋友', upgradeAmount: 6000 },
        { name: '初潤青少年', upgradeAmount: 3000 },
        { name: '初潤小朋友', upgradeAmount: 1500 },
        { name: '初潤幼兒園', upgradeAmount: 1 },
        { name: '初潤寶寶', upgradeAmount: 0 }
      ];

      let currentTierIdx = TIERS.findIndex(t => t.name === buyer.tier);
      if (currentTierIdx === -1) currentTierIdx = TIERS.length - 1; // Default to baby

      let newTier = buyer.tier;
      let isUpgraded = false;

      for (let i = 0; i < TIERS.length; i++) {
        const tier = TIERS[i];
        const isEligibleBySpend = newLifetimeSpend >= tier.upgradeAmount;
        const isEligibleByDeposit = (tier.name === '初潤閨蜜' || i > 2) && Number(buyer.initial_deposit) >= 10000;

        if (isEligibleBySpend || isEligibleByDeposit) {
          if (i < currentTierIdx) {
            newTier = tier.name;
            isUpgraded = true;
          }
          break;
        }
      }

      let updatedAvatarSettings = buyer.avatar_settings || {};
      if (typeof updatedAvatarSettings === 'string') {
        try {
          updatedAvatarSettings = JSON.parse(updatedAvatarSettings);
        } catch (e) {
          updatedAvatarSettings = {};
        }
      }

      if (isUpgraded) {
        updatedAvatarSettings.tier_updated_at = new Date().toISOString();
      }

      if (buyer.is_b2b) {
        // B2B: update spend & tier & avatar_settings
        await supabase.from('members').update({ 
          lifetime_spend: newLifetimeSpend,
          quarterly_spend: newQuarterlySpend,
          tier: newTier,
          avatar_settings: updatedAvatarSettings
        }).eq('id', buyer.id);

      } else {
        // B2C: update spend & points & tier & avatar_settings
        if (rewardPoints > 0) {
          await supabase.from('point_transactions').insert({
            member_id: buyer.id,
            order_id: order.id,
            amount: rewardPoints,
            transaction_type: 'earned_from_order'
          });
        }

        await supabase.from('members').update({ 
          points_balance: (buyer.points_balance || 0) + rewardPoints,
          lifetime_spend: newLifetimeSpend,
          quarterly_spend: newQuarterlySpend,
          tier: newTier,
          avatar_settings: updatedAvatarSettings
        }).eq('id', buyer.id);
      }

      if (isUpgraded) {
        await supabase.from('notifications').insert({
          member_id: buyer.id,
          title: '會員等級即時晉升！',
          content: `恭喜您！您的累積消費已達標，會員等級已即時晉升為「${newTier}」。`,
          type: 'system'
        });
      }

      // 3. 處理上線退傭
      if (buyer.upline_id && b2bCommission > 0) {
          const { data: upline } = await supabase.from('members').select('*').eq('id', buyer.upline_id).single();
          if (upline && upline.is_b2b) {
            await supabase.from('wallet_transactions').insert({
              member_id: upline.id,
              order_id: order.id,
              amount: b2bCommission,
              transaction_type: 'commission_refund',
              status: 'completed'
            });
            
            await supabase.from('members').update({ 
              virtual_balance: (Number(upline.virtual_balance) || 0) + b2bCommission 
            }).eq('id', upline.id);

            await supabase.from('notifications').insert({
              member_id: upline.id,
              title: '獲得推薦獎金！',
              content: `您的下線夥伴 ${buyer.name} 的訂單已確認，您獲得 $${b2bCommission.toLocaleString()} 推薦獎金。`,
              type: 'referral'
            });
        }
      }

      // 4. 更新訂單狀態
      await supabase.from('orders').update({ 
        status: 'completed',
        paid_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      }).eq('id', order.id);

      // 5. 通知買家
      await supabase.from('notifications').insert({
        member_id: buyer.id,
        title: '訂單已確認出貨',
        content: `您的訂單 $${totalAmount.toLocaleString()} 已核對匯款成功，紅利點數已發放。`,
        type: 'order'
      });

      return NextResponse.json({ success: true, message: '訂單審核通過' });
    }

    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });

  } catch (error: any) {
    console.error('Approve Error:', error);
    return NextResponse.json({ success: false, error: '系統錯誤' }, { status: 500 });
  }
}
