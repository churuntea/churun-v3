import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

// 定價策略 (一元化控價 + 大宗批發)
function calculatePrice(quantity: number) {
  const originalAmount = quantity * 450;
  let totalAmount = 0;
  
  if (quantity >= 300) {
    // 300 組尊榮客製：約 66 折 (297元)
    totalAmount = quantity * 297;
  } else if (quantity >= 100) {
    // 100 組批發：約 73 折 (328元)
    totalAmount = quantity * 328;
  } else {
    // 999 破冰組合：任選 3 盒 NT$ 999
    const setsOfThree = Math.floor(quantity / 3);
    const remainder = quantity % 3;
    // 單盒嘗鮮價 349
    totalAmount = (setsOfThree * 999) + (remainder * 349);
  }
  
  return { originalAmount, totalAmount };
}

// B2C 積分回饋匯率 mapping (元/1點)
const pointsRateMapping: Record<string, number> = {
  '初潤寶寶': 100,
  '初潤幼兒園': 90,
  '初潤小朋友': 80,
  '初潤青少年': 70,
  '初潤好朋友': 60,
  '初潤閨蜜': 50,
  '初潤知己': 40,
  '初潤靈魂伴侶': 30,
};

export async function POST(request: Request) {
  try {
    const { buyer_id, quantity, custom_logo_url } = await request.json();

    if (!buyer_id || !quantity) {
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

    // 2. 計算金額
    const { originalAmount, totalAmount } = calculatePrice(quantity);

    // 3. 建立訂單
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        member_id: buyer.id,
        total_amount: totalAmount,
        original_amount: originalAmount,
        status: 'completed', // 模擬直接完成
        paid_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        custom_logo_url: custom_logo_url || null
      })
      .select()
      .single();

    if (orderError) throw orderError;

    let message = '訂單建立成功。';

    // 4. 判斷 B2B 或 B2C 處理邏輯
    if (buyer.is_b2b) {
      // 30% 鎖倉檢測
      if (buyer.initial_deposit > 0) {
        const lockThreshold = buyer.initial_deposit * 0.3;
        if (buyer.virtual_balance < lockThreshold) {
          return NextResponse.json({ 
            error: `預收款已低於初始儲值的 30% (門檻: ${lockThreshold})，觸發鎖倉機制。請先儲值以解鎖出貨權限。` 
          }, { status: 403 });
        }
      }

      // B2B 創業夥伴自己下單：從虛擬帳戶扣除
      if (buyer.virtual_balance < totalAmount) {
        // 實際應用中應該在建立訂單前檢查，此處為示範
        return NextResponse.json({ error: '虛擬帳戶餘額不足' }, { status: 400 });
      }

      await supabase.from('wallet_transactions').insert({
        member_id: buyer.id,
        order_id: order.id,
        amount: -totalAmount,
        transaction_type: 'order_deduction',
        status: 'completed'
      });

      // 更新餘額
      await supabase.rpc('decrement_virtual_balance', { x: totalAmount, row_id: buyer.id }); // 需在資料庫建 RPC，或者用 update
      // 為簡化，直接 update
      await supabase.from('members').update({ virtual_balance: buyer.virtual_balance - totalAmount }).eq('id', buyer.id);
      
      message += ' 已從虛擬帳戶扣款。';

    } else {
      // B2C 一般消費者下單：發放積分
      const rate = pointsRateMapping[buyer.tier] || 100;
      const earnedPoints = Math.floor(totalAmount / rate);

      if (earnedPoints > 0) {
        await supabase.from('point_transactions').insert({
          member_id: buyer.id,
          order_id: order.id,
          amount: earnedPoints,
          transaction_type: 'earned_from_order'
        });

        await supabase.from('members').update({ 
          points_balance: buyer.points_balance + earnedPoints,
          lifetime_spend: buyer.lifetime_spend + totalAmount // 累加消費金額
        }).eq('id', buyer.id);
        
        message += ` 獲得 ${earnedPoints} 點積分。`;
      }

      // 5. 處理上線退傭 (若上線為 B2B 夥伴)
      if (buyer.upline_id) {
        const { data: upline } = await supabase
          .from('members')
          .select('*')
          .eq('id', buyer.upline_id)
          .single();

        if (upline && upline.is_b2b) {
          // B2B 自動退傭：差價利潤 (原價 - 結帳價)
          // 或是 (結帳價 - 夥伴進貨價)，這裡先以 (原價 - 結帳價) 示範
          const commission = originalAmount - totalAmount; 
          
          if (commission > 0) {
            await supabase.from('wallet_transactions').insert({
              member_id: upline.id,
              order_id: order.id,
              amount: commission,
              transaction_type: 'commission_refund',
              status: 'completed'
            });

            await supabase.from('members').update({ 
              virtual_balance: upline.virtual_balance + commission 
            }).eq('id', upline.id);
            
            message += ` 上線(${upline.name})獲得退傭 $${commission}。`;
          }
        }
      }
    }

    return NextResponse.json({ success: true, order, message });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { orderId, lastFive } = await request.json();

    if (!orderId || !lastFive || lastFive.length !== 5) {
      return NextResponse.json({ success: false, error: '缺少必要參數或末五碼長度不正確' }, { status: 400 });
    }

    console.log(`[API PUT Orders] Received request to update remittance last five to ${lastFive} for Order ${orderId}`);

    // 1. 嘗試直接使用 admin 權限物理更新 payment_last_five 欄位
    let { error } = await supabase
      .from('orders')
      .update({ payment_last_five: lastFive })
      .eq('id', orderId);

    // 2. 若不支援，嘗試物理更新 bank_last_five 欄位
    if (error) {
      console.warn(`[API PUT Orders] Direct payment_last_five update failed (likely missing column). Trying bank_last_five...`);
      const res = await supabase
        .from('orders')
        .update({ bank_last_five: lastFive })
        .eq('id', orderId);
      error = res.error;
    }

    // 3. 若均失敗，啟動備份寫入機制（將欄位包裝寫入 custom_logo_url）
    if (error) {
      console.warn(`[API PUT Orders] Physical columns failed. Saving to custom_logo_url as FALLBACK_JSON.`);
      
      const { data: currentOrder, error: fetchErr } = await supabase
        .from('orders')
        .select('custom_logo_url')
        .eq('id', orderId)
        .single();

      if (!fetchErr && currentOrder) {
        let existingJSON: Record<string, any> = {};
        const logoUrlVal = currentOrder.custom_logo_url || '';

        if (logoUrlVal.startsWith('FALLBACK_JSON:')) {
          try {
            existingJSON = JSON.parse(logoUrlVal.substring('FALLBACK_JSON:'.length));
          } catch (e) {
            console.error('[API PUT Orders] Failed to parse existing fallback JSON:', e);
          }
        } else if (logoUrlVal) {
          existingJSON.original_logo_url = logoUrlVal;
        }

        existingJSON.payment_last_five = lastFive;
        existingJSON.bank_last_five = lastFive;

        const fallbackStr = 'FALLBACK_JSON:' + JSON.stringify(existingJSON);

        const { error: writeErr } = await supabase
          .from('orders')
          .update({ custom_logo_url: fallbackStr })
          .eq('id', orderId);

        error = writeErr;
      } else {
        error = fetchErr || new Error('Failed to fetch order for JSON fallback write');
      }
    }

    if (error) {
      console.error('[API PUT Orders] All write attempts failed:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: '匯款末五碼回報成功' });

  } catch (error: any) {
    console.error('[API PUT Orders] Server Exception:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
