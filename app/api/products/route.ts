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
    const { 
      name, 
      original_price, 
      price, 
      image_url, 
      b2c_reward_percent, 
      b2b_commission_percent, 
      creator, 
      category,
      stock_count,
      sku,
      description
    } = await request.json();

    if (!name || price === undefined) {
      return NextResponse.json({ success: false, error: '品名與嘗鮮價為必填' }, { status: 400 });
    }

    const insertData: any = {
      name,
      original_price: original_price || null,
      price,
      image_url: image_url || null,
      creator: creator || '未設定',
      b2c_reward_percent: b2c_reward_percent || 0,
      b2b_commission_percent: b2b_commission_percent || 0,
      category: category || '全部商品',
      status: 'active',
      stock_count: stock_count || 0,
      sku: sku || null,
      description: description || null
    };

    // 第一步：嘗試完整寫入
    let { data, error } = await supabaseAdmin
      .from('products')
      .insert(insertData)
      .select()
      .single();

    // 如果因不支援 description 欄位報錯，降級移除 description 後重試
    if (error && (error.message.includes('column "description"') || error.message.includes("'description' column") || error.code === '42703')) {
      console.warn("Supabase products table lacks 'description' column. Stripping description and retrying.");
      delete insertData.description;
      const { data: retryData, error: retryError } = await supabaseAdmin
        .from('products')
        .insert(insertData)
        .select()
        .single();
      data = retryData;
      error = retryError;
    }

    // 如果還是因不支援 category 欄位報錯，繼續降級
    if (error && (error.message.includes('column "category"') || error.message.includes("'category' column") || error.code === '42703')) {
      console.warn("Supabase products table lacks 'category' column. Fallback to name prefix naming.");
      delete insertData.category;
      insertData.name = `[${category || '全部商品'}] ${name}`; // 將分類前綴到名稱中相容
      
      const { data: retryData, error: retryError } = await supabaseAdmin
        .from('products')
        .insert(insertData)
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
    const { 
      id, 
      name, 
      original_price, 
      price, 
      image_url, 
      b2c_reward_percent, 
      b2b_commission_percent, 
      creator, 
      category,
      stock_count,
      sku,
      description
    } = await request.json();

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
      status: 'active',
      stock_count: stock_count || 0,
      sku: sku || null,
      description: description || null
    };

    // 第一步：嘗試完整更新
    let { data, error } = await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    // 如果不支援 description 欄位，移除後重試
    if (error && (error.message.includes('column "description"') || error.message.includes("'description' column") || error.code === '42703')) {
      console.warn("Supabase products table lacks 'description' column on UPDATE. Stripping description.");
      delete updateData.description;
      const { data: retryData, error: retryError } = await supabaseAdmin
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      data = retryData;
      error = retryError;
    }

    // 如果不支援 category 欄位，移除後重試
    if (error && (error.message.includes('column "category"') || error.message.includes("'category' column") || error.code === '42703')) {
      console.warn("Supabase products table lacks 'category' column on UPDATE. Falling back to name prefix.");
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
