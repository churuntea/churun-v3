import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, materials: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, title, category, url, file_type, thumbnail_url, description } = body;

    let finalUrl = url;
    if (file_type === 'text' && !finalUrl) {
      finalUrl = 'text';
    }

    if (!title || !category || !finalUrl || !file_type) {
      return NextResponse.json({ success: false, error: '缺少必要參數' }, { status: 400 });
    }

    const materialData = {
      title,
      category,
      url: finalUrl,
      file_type,
      thumbnail_url,
      description
    };

    let result;
    if (id) {
      // Update
      result = await supabase
        .from('materials')
        .update(materialData)
        .eq('id', id)
        .select()
        .single();
    } else {
      // Create
      result = await supabase
        .from('materials')
        .insert([materialData])
        .select()
        .single();
    }

    if (result.error) throw result.error;
    return NextResponse.json({ success: true, material: result.data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: '缺少 ID' }, { status: 400 });

    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
