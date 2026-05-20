import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

async function rollbackOrderCommissionsAndPoints(orderId: string, supabase: any) {
  try {
    // 1. 取得訂單完整資料與買家資料
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

    // =========================================================================
    // A. 回滾已發放的 B2C 點數 (購物積分)
    // =========================================================================
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

    // =========================================================================
    // B. 回滾已發放的 B2B 上線推薦分紅
    // =========================================================================
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

    // =========================================================================
    // C. 退還結帳時折抵的 B2C 紅利點數
    // =========================================================================
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

    // =========================================================================
    // D. 退還結帳時支付的儲值金 (B2B 或 B2C)
    // =========================================================================
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

export async function POST(request: Request) {
  try {
    const { order_id, action, auditor } = await request.json(); // action: 'approve', 'cancel', or 'delete'

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

    if (action === 'approve' && order.status !== 'pending') {
      return NextResponse.json({ success: false, error: '訂單狀態不符，無法處理' }, { status: 400 });
    }

    if (action === 'cancel') {
      // 1. 執行點數/餘額回滾與退還
      await rollbackOrderCommissionsAndPoints(order.id, supabase);

      // 2. 取消訂單：返還庫存
      const { data: items } = await supabase.from('order_items').select('*').eq('order_id', order.id);
      for (const item of items || []) {
        const { data: prod } = await supabase.from('products').select('stock_count').eq('id', item.product_id).single();
        if (prod) {
          await supabase.from('products').update({ stock_count: (prod.stock_count || 0) + item.quantity }).eq('id', item.product_id);
        }
      }
      
      const updateData: any = { status: 'cancelled' };
      if (auditor) {
        let fallbackJson: any = {};
        if (order.custom_logo_url && order.custom_logo_url.startsWith('FALLBACK_JSON:')) {
          try {
            fallbackJson = JSON.parse(order.custom_logo_url.substring('FALLBACK_JSON:'.length));
          } catch (e) {
            console.error(e);
          }
        }
        fallbackJson.auditor = auditor;
        fallbackJson.audited_at = new Date().toISOString();
        updateData.custom_logo_url = 'FALLBACK_JSON:' + JSON.stringify(fallbackJson);
      }

      await supabase.from('orders').update(updateData).eq('id', order.id);
      return NextResponse.json({ success: true, message: '訂單已取消，相關紅利已扣回/退還' });
    }

    if (action === 'delete') {
      // 1. 執行點數/餘額回滾與退還
      await rollbackOrderCommissionsAndPoints(order.id, supabase);

      // 2. 返還庫存
      const { data: items } = await supabase.from('order_items').select('*').eq('order_id', order.id);
      for (const item of items || []) {
        const { data: prod } = await supabase.from('products').select('stock_count').eq('id', item.product_id).single();
        if (prod) {
          await supabase.from('products').update({ stock_count: (prod.stock_count || 0) + item.quantity }).eq('id', item.product_id);
        }
      }

      // 3. 在物理刪除前，備份訂單完整資料至 announcements 作為歷史刪除查詢
      const backupData = {
        order_id: order.id,
        member_id: order.member_id,
        total_amount: order.total_amount,
        original_amount: order.original_amount,
        status: order.status,
        fulfillment_status: order.fulfillment_status,
        custom_logo_url: order.custom_logo_url,
        reward_points: order.reward_points,
        b2b_commission: order.b2b_commission,
        bank_last_five: order.bank_last_five,
        remitter_name: order.remitter_name,
        remitter_bank: order.remitter_bank,
        payment_last_five: order.payment_last_five,
        order_number: order.order_number,
        created_at: order.created_at,
        deleted_at: new Date().toISOString(),
        member: order.members ? {
          name: order.members.name,
          phone: order.members.phone,
          email: order.members.email,
          member_code: order.members.member_code,
          is_b2b: order.members.is_b2b,
          tier: order.members.tier
        } : null,
        order_items: (items || []).map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        shipping_info: order.shipping_info
      };

      await supabase.from('announcements').insert({
        title: `[DELETED_ORDER]: ${order.order_number || order.id.slice(-8).toUpperCase()}`,
        tag: 'DELETED',
        content: JSON.stringify(backupData),
        color: 'bg-red-900'
      });

      // 4. 物理刪除明細與訂單
      await supabase.from('order_items').delete().eq('order_id', order.id);
      await supabase.from('orders').delete().eq('id', order.id);

      return NextResponse.json({ success: true, message: '訂單已物理刪除，備份已存檔，相關紅利已扣回/退還' });
    }

    if (action === 'approve') {
      const buyer = order.members;
      const totalAmount = order.total_amount;
      
      // Fetch dynamic rules always as they are needed for TIERS and potentially TIER_RATES
      const { data: dbRules } = await supabase.from('bonus_rules').select('tier_name, reward_rate, min_spend');

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

        const TIER_RATES: Record<string, number> = (dbRules || []).reduce((acc: any, curr: any) => {
          acc[curr.tier_name] = curr.reward_rate;
          return acc;
        }, {
          '初潤靈魂伴侶': 30, '初潤知己': 40, '初潤閨蜜': 50, '初潤好朋友': 60,
          '初潤青少年': 70, '初潤小朋友': 80, '初潤幼兒園': 90, '初潤寶寶': 100
        });

        const tierRate = TIER_RATES[buyer.tier] || 100;
        rewardPoints = Math.floor(totalAmount / tierRate);
      }

      // 2. 執行點數/餘額更新
      const newLifetimeSpend = (Number(buyer.lifetime_spend) || 0) + totalAmount;
      const newQuarterlySpend = (Number(buyer.quarterly_spend) || 0) + totalAmount;

      const TIERS = dbRules && dbRules.length > 0 
        ? dbRules.map(r => ({ name: r.tier_name, upgradeAmount: r.min_spend }))
        : [
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
        // B2C: update spend & tier & avatar_settings (Do NOT issue points immediately; points are now scheduled to issue 30 days after shipment!)
        await supabase.from('members').update({ 
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

      // 3. 處理上線退傭 (紅利新制：改由 Settlement Cron 於出貨 30 天後自動審核撥發，此處不再即時發放)

      // 4. 更新訂單狀態
      const updateData: any = { 
        status: 'completed',
        paid_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      };
      if (auditor) {
        let fallbackJson: any = {};
        if (order.custom_logo_url && order.custom_logo_url.startsWith('FALLBACK_JSON:')) {
          try {
            fallbackJson = JSON.parse(order.custom_logo_url.substring('FALLBACK_JSON:'.length));
          } catch (e) {
            console.error(e);
          }
        }
        fallbackJson.auditor = auditor;
        fallbackJson.audited_at = new Date().toISOString();
        updateData.custom_logo_url = 'FALLBACK_JSON:' + JSON.stringify(fallbackJson);
      }
      await supabase.from('orders').update(updateData).eq('id', order.id);

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
