import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    if (action === 'fetch_applications') {
      const { data, error } = await supabase
        .from("ambassador_applications")
        .select("*, members!inner(name, phone, email, member_code, tier, avatar_url)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === 'open_member_detail') {
      const { memberId } = payload;
      const [memberRes, downlinesRes] = await Promise.all([
        supabase.from("members").select("*, upline:upline_id(name, member_code)").eq("id", memberId).single(),
        supabase.from("members").select("id, name, member_code, tier, created_at, lifetime_spend").eq("upline_id", memberId).order("created_at", { ascending: false })
      ]);
      return NextResponse.json({ 
        success: true, 
        data: memberRes.data, 
        downlines: downlinesRes.data || [] 
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });

  } catch (error: any) {
    console.error('Ambassador Raw API error:', error);
    return NextResponse.json({ success: false, error: error.message || '伺服器異常' }, { status: 500 });
  }
}
