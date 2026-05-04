import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function POST(request: Request) {
  try {
    const { buyer_id, items } = await request.json();

    if (!buyer_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: '缺少必要參數' }, { status: 400 });
    }

    // 1. 取得買家資料
    const { data: buyer, error: buyerError } = await supabase
      .from('members')
      .select('*')
      .eq('id', buyer_id)
      .single();

    const TIER_RATES: Record<string, number> = {
      '初潤靈魂伴侶': 30,
      '初潤知己': 40,
      '初潤閨蜜': 50,
      '初潤好朋友': 60,
      '初潤青少年': 70,
      '初潤小朋友': 80,
      '初潤幼兒園': 90,
      '初潤寶寶': 100
    };

    if (buyerError || !buyer) {
      return NextResponse.json({ error: '找不到買家資料' }, { status: 404 });
    }

    // 2. 取得商品資料並計算總計
    const productIds = items.map(i => i.id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (productsError) throw productsError;

    let totalAmount = 0;
    let totalB2CPoints = 0;
    let totalB2BCommission = 0;

    for (const item of items) {
      const product = products.find(p => p.id === item.id);
      if (!product) continue;
      
      const itemSubtotal = product.price * item.quantity;
      totalAmount += itemSubtotal;
      
      // B2B 退傭仍依照商品設定 (不變)
      totalB2BCommission += Math.floor(itemSubtotal * (product.b2b_commission_percent / 100));
    }

    // B2C 點數回饋改為依據「會員階級匯率」計算
    const tierRate = TIER_RATES[buyer.tier] || 100;
    totalB2CPoints = Math.floor(totalAmount / tierRate);

    // 3. 建立訂單 (使用 Transaction 概念)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        member_id: buyer.id,
        total_amount: totalAmount,
        original_amount: totalAmount,
        status: 'completed',
        paid_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 3.5 建立訂單明細
    const orderItemsData = items.map(item => {
      const product = products.find(p => p.id === item.id);
      return {
        order_id: order.id,
        product_id: item.id,
        name: product?.name || '未知商品',
        quantity: item.quantity,
        price: product?.price || 0
      };
    });

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData);

    if (itemsError) {
      console.error('Order Items Error:', itemsError);
    }

    // 3.6 扣除庫存
    for (const item of items) {
      const product = products.find(p => p.id === item.id);
      if (product) {
        await supabase.from('products')
          .update({ stock_count: Math.max(0, (product.stock_count || 0) - item.quantity) })
          .eq('id', item.id);
      }
    }

    let message = `結帳成功！總計 $${totalAmount.toLocaleString()}。`;

    // 4. 處理不同身份的結算邏輯
    if (buyer.is_b2b) {
      // B2B 創業夥伴：使用虛擬帳戶扣款
      if (Number(buyer.virtual_balance) < totalAmount) {
        return NextResponse.json({ success: false, error: '虛擬帳戶餘額不足，請先儲值' }, { status: 400 });
      }

      // 扣款紀錄
      await supabase.from('wallet_transactions').insert({
        member_id: buyer.id,
        order_id: order.id,
        amount: -totalAmount,
        transaction_type: 'order_deduction',
        status: 'completed'
      });

      // 更新買家餘額與累積消費
      await supabase.from('members').update({ 
        virtual_balance: Number(buyer.virtual_balance) - totalAmount,
        lifetime_spend: (Number(buyer.lifetime_spend) || 0) + totalAmount,
        quarterly_spend: (Number(buyer.quarterly_spend) || 0) + totalAmount
      }).eq('id', buyer.id);
      
      message += ' 已從您的虛擬帳戶扣除。';
    } else {
      // B2C 會員：增加點數並處理上線退傭
      if (totalB2CPoints > 0) {
        await supabase.from('point_transactions').insert({
          member_id: buyer.id,
          order_id: order.id,
          amount: totalB2CPoints,
          transaction_type: 'earned_from_order'
        });

        await supabase.from('members').update({ 
          points_balance: (buyer.points_balance || 0) + totalB2CPoints,
          lifetime_spend: (Number(buyer.lifetime_spend) || 0) + totalAmount,
          quarterly_spend: (Number(buyer.quarterly_spend) || 0) + totalAmount
        }).eq('id', buyer.id);
        
        message += ` 獲得 ${totalB2CPoints} 點紅利回饋。`;
      }

      // 5. 處理上線退傭 (MLM 核心)
      if (buyer.upline_id && totalB2BCommission > 0) {
        const { data: upline } = await supabase.from('members').select('*').eq('id', buyer.upline_id).single();
        
        // 只有 B2B 身份的上線可以領取現金退傭
        if (upline && upline.is_b2b) {
          await supabase.from('wallet_transactions').insert({
            member_id: upline.id,
            order_id: order.id,
            amount: totalB2BCommission,
            transaction_type: 'commission_refund',
            status: 'completed'
          });
          
          await supabase.from('members').update({ 
            virtual_balance: (Number(upline.virtual_balance) || 0) + totalB2BCommission 
          }).eq('id', upline.id);
          
          // 新增推薦獎金通知
          await supabase.from('notifications').insert({
            member_id: upline.id,
            title: '獲得推薦獎金！',
            content: `您的下線夥伴 ${buyer.name} 完成了訂單，您獲得 $${totalB2BCommission.toLocaleString()} 推薦獎金。`,
            type: 'referral'
          });
          
          // message += ` (上線獎金已發放)`;
        }
      }
    }

    // 新增買家結帳通知
    await supabase.from('notifications').insert({
      member_id: buyer.id,
      title: '訂單結帳成功',
      content: `您的訂單總計 $${totalAmount.toLocaleString()} 已結帳成功。`,
      type: 'order'
    });

    return NextResponse.json({ success: true, message });

  } catch (error: any) {
    console.error('Order Error:', error);
    return NextResponse.json({ success: false, error: '系統錯誤，請稍後再試' }, { status: 500 });
  }
}
