import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/supabase-admin';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('announcements')
      .select('content')
      .eq('title', '[SYSTEM_FEATURES]')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const features = data?.content ? JSON.parse(data.content) : {
      "商城模組": { "商品評論": true, "商品分享": true, "加入最愛": true },
      "會員模組": { "直銷推廣碼": true, "等級考核": true },
      "財務模組": { "線上儲值": true, "獎金提領": true }
    };

    return NextResponse.json({ success: true, features });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { features } = await request.json();
    
    // Check if record exists
    const { data: existing } = await supabaseAdmin
      .from('announcements')
      .select('id')
      .eq('title', '[SYSTEM_FEATURES]')
      .single();

    let res;
    if (existing) {
      res = await supabaseAdmin
        .from('announcements')
        .update({ content: JSON.stringify(features) })
        .eq('title', '[SYSTEM_FEATURES]');
    } else {
      res = await supabaseAdmin
        .from('announcements')
        .insert({
          title: '[SYSTEM_FEATURES]',
          content: JSON.stringify(features),
          status: 'active'
        });
    }

    if (res.error) throw res.error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
