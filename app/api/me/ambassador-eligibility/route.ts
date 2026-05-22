import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/supabase-admin';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.memberId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const currentUserId = session.memberId;

    // 1. Fetch personal lifetime spend
    const { data: member, error: memberError } = await supabaseAdmin
      .from('members')
      .select('lifetime_spend')
      .eq('id', currentUserId)
      .single();

    if (memberError) throw memberError;

    const personalSpend = Number(member?.lifetime_spend || 0);
    let teamSpend = 0;

    // 2. Fetch downlines lifetime spend
    const { data: downlines } = await supabaseAdmin
      .from('members')
      .select('lifetime_spend')
      .eq('upline_id', currentUserId);

    if (downlines && downlines.length > 0) {
      teamSpend = downlines.reduce((sum, d) => sum + Number(d.lifetime_spend || 0), 0);
    }

    // 3. Calculate score: (Personal / 2) + (Team / 2)
    const score = (personalSpend / 2) + (teamSpend / 2);

    return NextResponse.json({ score });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
