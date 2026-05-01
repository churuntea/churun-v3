import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { buyer_id, items } = await request.json(); // items: [{ id, quantity }]

    if (!buyer_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: '缺少必要參數' }, { status: 400 });
    }

    // 1. 取得買家資料
    const { data: buyer, error: buyerError } = await supabase
      .from('members')
      .select('*')
      .eq('id', buyer_id)
      .single();

    if (buyerError || !buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
    }

    // 2. 取得所有商品資料進行計算
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
      
      // 計算該品項回饋 (基於 % 數)
      totalB2CPoints += Math.floor(itemSubtotal * (product.b2c_reward_percent / 100));
      totalB2BCommission += Math.floor(itemSubtotal * (product.b2b_commission_percent / 100));
    }

    // 3. 建立訂單
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

    let message = `結帳成功！總計 $${totalAmount.toLocaleString()}。`;

    // 4. 處理支付與回饋
    if (buyer.is_b2b) {
      // B2B 夥伴：從虛擬帳戶扣款
      if (buyer.virtual_balance < totalAmount) {
        return NextResponse.json({ error: '虛擬帳戶餘額不足' }, { status: 400 });
      }

      await supabase.from('wallet_transactions').insert({
        member_id: buyer.id,
        order_id: order.id,
        amount: -totalAmount,
        transaction_type: 'order_deduction',
        status: 'completed'
      });

      await supabase.from('members').update({ virtual_balance: buyer.virtual_balance - totalAmount }).eq('id', buyer.id);
      message += ' 已從虛擬帳戶扣除。';
    } else {
      // B2C 會員：增加積分
      if (totalB2CPoints > 0) {
        await supabase.from('point_transactions').insert({
          member_id: buyer.id,
          order_id: order.id,
          amount: totalB2CPoints,
          transaction_type: 'earned_from_order'
        });

        await supabase.from('members').update({ 
          points_balance: buyer.points_balance + totalB2CPoints,
          lifetime_spend: buyer.lifetime_spend + totalAmount
        }).eq('id', buyer.id);
        
        message += ` 獲得 ${totalB2CPoints} 點回饋。`;
      }

      // 處理上線退傭
      if (buyer.upline_id && totalB2BCommission > 0) {
        const { data: upline } = await supabase.from('members').select('*').eq('id', buyer.upline_id).single();
        if (upline && upline.is_b2b) {
          await supabase.from('wallet_transactions').insert({
            member_id: upline.id,
            order_id: order.id,
            amount: totalB2BCommission,
            transaction_type: 'commission_refund',
            status: 'completed'
          });
          await supabase.from('members').update({ virtual_balance: upline.virtual_balance + totalB2BCommission }).eq('id', upline.id);
          message += ` 上線獲得 $${totalB2BCommission} 退傭。`;
        }
      }
    }

    return NextResponse.json({ success: true, message });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
