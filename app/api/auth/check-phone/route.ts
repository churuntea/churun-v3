import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/supabase-admin';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Missing phone' }, { status: 400 });
    }

    const { data: member, error } = await supabaseAdmin
      .from('members')
      .select('id, name')
      .eq('phone', phone)
      .maybeSingle();

    if (error) throw error;

    if (member) {
      return NextResponse.json({ exists: true, member_id: member.id });
    } else {
      return NextResponse.json({ exists: false });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
