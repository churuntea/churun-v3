import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    if (action === 'fetch_templates') {
      const { data } = await supabase
        .from('poster_templates')
        .select('*')
        .order('created_at', { ascending: false });
      return NextResponse.json({ success: true, data: data || [] });
    }

    if (action === 'save_template') {
      const { id, savePayload } = payload;
      if (id) {
        const { error } = await supabase
          .from('poster_templates')
          .update(savePayload)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('poster_templates')
          .insert([savePayload]);
        if (error) throw error;
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_template') {
      const { id } = payload;
      const { error } = await supabase.from('poster_templates').delete().eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'toggle_active') {
      const { id, newStatus } = payload;
      const { error } = await supabase
        .from('poster_templates')
        .update({ is_active: newStatus })
        .eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });

  } catch (error: any) {
    console.error('Posters Actions API error:', error);
    return NextResponse.json({ success: false, error: error.message || '伺服器異常' }, { status: 500 });
  }
}
