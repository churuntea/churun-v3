import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, announcements: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, tag, content, color } = await request.json();

    if (!title || !tag) {
      return NextResponse.json({ success: false, error: '缺少必要參數' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title,
        tag,
        content,
        color: color || 'bg-emerald-900'
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, announcement: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: '缺少 ID' }, { status: 400 });

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
