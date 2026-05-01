import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { member_id, points, item_name } = await request.json();

    if (!member_id || !points) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. 抓取會員資料並確認餘額
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('points_balance, is_b2b')
      .eq('id', member_id)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (member.is_b2b) {
      return NextResponse.json({ error: 'B2B users cannot use points store' }, { status: 403 });
    }

    if (member.points_balance < points) {
      return NextResponse.json({ error: 'Insufficient points' }, { status: 400 });
    }

    // 2. 寫入積分交易紀錄 (消耗點數為負值)
    const { error: txError } = await supabase
      .from('point_transactions')
      .insert({
        member_id,
        amount: -points,
        transaction_type: 'redeemed'
      });

    if (txError) throw txError;

    // 3. 更新會員點數餘額
    const { error: updateError } = await supabase
      .from('members')
      .update({ points_balance: member.points_balance - points })
      .eq('id', member_id);

    if (updateError) throw updateError;

    // 這裡通常還會寫入一個 `redemptions` 資料表來記錄兌換商品，為了簡化先略過

    return NextResponse.json({ success: true, message: `Successfully redeemed ${item_name}` });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
