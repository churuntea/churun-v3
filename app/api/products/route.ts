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

    const correctedProducts = (data || []).map(p => {
      let desc = p.description || "";
      let extData = {};
      const separator = "||_EXT_JSON_||";
      if (desc.includes(separator)) {
        const parts = desc.split(separator);
        desc = parts[0];
        try {
          extData = JSON.parse(parts[1]);
        } catch(e) {}
      }

      return {
        ...p,
        description: desc,
        order_unit: extData.order_unit || '件',
        order_unit_size: extData.order_unit_size || 1,
        min_order_quantity: extData.min_order_quantity || 1,
        stock_count: Number(p.stock_count || 0)
      };
    });

    return NextResponse.json({ success: true, products: correctedProducts });
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
      ambassador_personal_reward,
      ambassador_direct_reward,
      partner_personal_reward,
      partner_direct_reward,
      creator, 
      category,
      stock_count,
      sku,
      description,
      order_unit,
      order_unit_size,
      min_order_quantity
    } = await request.json();

    if (!name || price === undefined) {
      return NextResponse.json({ success: false, error: '品名與嘗鮮價為必填' }, { status: 400 });
    }

    let finalImageUrl = image_url || null;

    if (image_url && image_url.startsWith('data:image')) {
      try {
        const mimeType = image_url.match(/data:([^;]+);base64/)?.[1] || 'image/png';
        const base64Data = image_url.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const ext = mimeType.split('/')[1] || 'png';
        const fileName = `product_${Date.now()}.${ext}`;
        const filePath = `products/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('avatars')
          .upload(filePath, buffer, {
            contentType: mimeType,
            upsert: true
          });

        if (!uploadError) {
          const { data: { publicUrl } } = supabaseAdmin.storage
            .from('avatars')
            .getPublicUrl(filePath);
          finalImageUrl = publicUrl;
        } else {
          console.error('Product Image Upload Error:', uploadError);
        }
      } catch (uploadErr) {
        console.error('Failed to parse or upload product image:', uploadErr);
      }
    }

    const extJson = JSON.stringify({
      order_unit: order_unit || '件',
      order_unit_size: order_unit_size || 1,
      min_order_quantity: min_order_quantity || 1
    });
    const finalDescription = (description || "") + "||_EXT_JSON_||" + extJson;

    const insertData: any = {
      name,
      original_price: original_price || null,
      price,
      image_url: finalImageUrl,
      creator: creator || '未設定',
      b2c_reward_percent: b2c_reward_percent || 0,
      b2b_commission_percent: b2b_commission_percent || 0,
      ambassador_personal_reward: ambassador_personal_reward || 0,
      ambassador_direct_reward: ambassador_direct_reward || 0,
      partner_personal_reward: partner_personal_reward || 0,
      partner_direct_reward: partner_direct_reward || 0,
      category: category || '全部商品',
      status: 'active',
      stock_count: stock_count || 0,
      sku: sku || null,
      description: finalDescription
    };

    // 採用動態自我修復迴圈：若因欄位缺失報錯，則自動從寫入資料中剃除該欄位並重試
    let attempts = 0;
    let data = null;
    let error = null;

    while (attempts < 15) {
      const res = await supabaseAdmin
        .from('products')
        .insert(insertData)
        .select()
        .single();
      
      data = res.data;
      error = res.error;

      if (!error) {
        break;
      }

      // 檢查是否為欄位不支援之錯誤 (PostgREST schema cache 或 PostgreSQL 錯誤)
      const errMsg = error.message || "";
      let missingColumn: string | null = null;

      // 匹配模式 1: "Could not find the 'xxx' column ..." (PostgREST schema cache mismatch)
      const match1 = errMsg.match(/Could not find the '([^']+)' column/i);
      // 匹配模式 2: column "xxx" does not exist (PostgreSQL column error)
      const match2 = errMsg.match(/column "([^"]+)"/i);

      if (match1) {
        missingColumn = match1[1];
      } else if (match2) {
        missingColumn = match2[1];
      }

      if (missingColumn && missingColumn in insertData) {
        console.warn(`[API Products POST Fallback] Table lacks column '${missingColumn}'. Stripping and retrying.`);
        
        // 分類欄位降級處理：若不支援 category，則將其附加到商品名稱前綴
        if (missingColumn === 'category') {
          const cat = insertData.category || category || '全部商品';
          if (!insertData.name.startsWith('[')) {
            insertData.name = `[${cat}] ${insertData.name}`;
          }
        }
        
        delete insertData[missingColumn];
        attempts++;
      } else {
        // 非欄位缺失引起之常規錯誤，停止重試
        break;
      }
    }

    if (error) throw error;

    // 新品新增成功時，自動發布新品上市公告
    try {
      if (data && data.name) {
        await supabaseAdmin.from('announcements').insert({
          title: `🎉 全新新品上市：${data.name}`,
          tag: 'NEW',
          content: `初潤製茶所推出全新新品【${data.name}】！特惠價僅需 ${data.price} 元。${data.description || ''}`,
          color: 'bg-emerald-900',
          action_label: '立即查看',
          action_href: '/store'
        });
      }
    } catch (anonErr) {
      console.error('Auto Announcement Failed:', anonErr);
    }

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
      ambassador_personal_reward,
      ambassador_direct_reward,
      partner_personal_reward,
      partner_direct_reward,
      creator, 
      category,
      stock_count,
      sku,
      description,
      order_unit,
      order_unit_size,
      min_order_quantity
    } = await request.json();

    if (!id) return NextResponse.json({ success: false, error: '缺少 ID' }, { status: 400 });

    let finalImageUrl = image_url || null;

    if (image_url && image_url.startsWith('data:image')) {
      try {
        const mimeType = image_url.match(/data:([^;]+);base64/)?.[1] || 'image/png';
        const base64Data = image_url.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const ext = mimeType.split('/')[1] || 'png';
        const fileName = `product_${Date.now()}.${ext}`;
        const filePath = `products/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('avatars')
          .upload(filePath, buffer, {
            contentType: mimeType,
            upsert: true
          });

        if (!uploadError) {
          const { data: { publicUrl } } = supabaseAdmin.storage
            .from('avatars')
            .getPublicUrl(filePath);
          finalImageUrl = publicUrl;
        } else {
          console.error('Product Image Update Error:', uploadError);
        }
      } catch (uploadErr) {
        console.error('Failed to parse or upload product image:', uploadErr);
      }
    }

    const extJson = JSON.stringify({
      order_unit: order_unit || '件',
      order_unit_size: order_unit_size || 1,
      min_order_quantity: min_order_quantity || 1
    });
    const finalDescription = (description || "") + "||_EXT_JSON_||" + extJson;

    const updateData: any = {
      name,
      original_price: original_price || null,
      price,
      image_url: finalImageUrl,
      creator: creator || '未設定',
      b2c_reward_percent: b2c_reward_percent || 0,
      b2b_commission_percent: b2b_commission_percent || 0,
      ambassador_personal_reward: ambassador_personal_reward || 0,
      ambassador_direct_reward: ambassador_direct_reward || 0,
      partner_personal_reward: partner_personal_reward || 0,
      partner_direct_reward: partner_direct_reward || 0,
      category: category || '全部商品',
      status: 'active',
      stock_count: stock_count || 0,
      sku: sku || null,
      description: finalDescription
    };

    // 採用動態自我修復迴圈：若因欄位缺失報錯，則自動從更新資料中剃除該欄位並重試
    let attempts = 0;
    let data = null;
    let error = null;

    while (attempts < 15) {
      const res = await supabaseAdmin
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      data = res.data;
      error = res.error;

      if (!error) {
        break;
      }

      // 檢查是否為欄位不支援之錯誤
      const errMsg = error.message || "";
      let missingColumn: string | null = null;

      // 匹配模式 1: "Could not find the 'xxx' column ..." (PostgREST schema cache mismatch)
      const match1 = errMsg.match(/Could not find the '([^']+)' column/i);
      // 匹配模式 2: column "xxx" does not exist (PostgreSQL column error)
      const match2 = errMsg.match(/column "([^"]+)"/i);

      if (match1) {
        missingColumn = match1[1];
      } else if (match2) {
        missingColumn = match2[1];
      }

      if (missingColumn && missingColumn in updateData) {
        console.warn(`[API Products PUT Fallback] Table lacks column '${missingColumn}'. Stripping and retrying.`);
        
        // 分類欄位降級處理
        if (missingColumn === 'category') {
          const cat = updateData.category || category || '全部商品';
          if (!updateData.name.startsWith('[')) {
            updateData.name = `[${cat}] ${updateData.name}`;
          }
        }
        
        delete updateData[missingColumn];
        attempts++;
      } else {
        break;
      }
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
