import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/supabase-admin';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, products: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, original_price, price, image_url, b2c_reward_percent, b2b_commission_percent, creator, category } = await request.json();

    if (!name || price === undefined) {
      return NextResponse.json({ success: false, error: '品名與嘗鮮價為必填' }, { status: 400 });
    }

    // Try to insert with category
    let { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        name,
        original_price: original_price || null,
        price,
        image_url: image_url || null,
        creator: creator || '未設定',
        b2c_reward_percent: b2c_reward_percent || 0,
        b2b_commission_percent: b2b_commission_percent || 0,
        category: category || '全部商品',
        status: 'active'
      })
      .select()
      .single();

    // Fallback if category column doesn't exist
    if (error && (error.message.includes('column "category"') || error.message.includes("'category' column") || error.message.includes("schema cache"))) {
      const { data: retryData, error: retryError } = await supabaseAdmin
        .from('products')
        .insert({
          name: `[${category || '全部商品'}] ${name}`, // Prefix category to name
          original_price: original_price || null,
          price,
          image_url: image_url || null,
          creator: creator || '未設定',
          b2c_reward_percent: b2c_reward_percent || 0,
          b2b_commission_percent: b2b_commission_percent || 0,
          status: 'active'
        })
        .select()
        .single();
      
      data = retryData;
      error = retryError;
    }

    if (error) throw error;
    return NextResponse.json({ success: true, product: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name, original_price, price, image_url, b2c_reward_percent, b2b_commission_percent, creator, category } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: '缺少 ID' }, { status: 400 });

    const updateData: any = {
      name,
      original_price: original_price || null,
      price,
      image_url: image_url || null,
      creator: creator || '未設定',
      b2c_reward_percent: b2c_reward_percent || 0,
      b2b_commission_percent: b2b_commission_percent || 0,
      category: category || '全部商品',
      status: 'active'
    };

    // Try update with category
    let { data, error } = await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    // Fallback if category column missing
    if (error && (error.message.includes('column "category"') || error.message.includes("'category' column") || error.message.includes("schema cache"))) {
      delete updateData.category;
      updateData.name = `[${category || '全部商品'}] ${name}`;
      
      const { data: retryData, error: retryError } = await supabaseAdmin
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      data = retryData;
      error = retryError;
    }

    if (error) throw error;
    return NextResponse.json({ success: true, product: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: '缺少 ID' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
