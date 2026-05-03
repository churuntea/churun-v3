import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get('memberId');

  if (!memberId) {
    return NextResponse.json({ success: false, error: '缺少 memberId' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ success: true, notifications: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, memberId, markAllAsRead } = await request.json();

    if (markAllAsRead && memberId) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('member_id', memberId)
        .eq('is_read', false);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (id) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: '缺少必要參數' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { memberId, title, content, type } = await request.json();

    if (!memberId || !title || !content || !type) {
      return NextResponse.json({ success: false, error: '缺少必要參數' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        member_id: memberId,
        title,
        content,
        type
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, notification: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
