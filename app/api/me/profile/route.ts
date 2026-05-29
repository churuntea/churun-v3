import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/supabase-admin';
import { getSession } from '@/lib/auth';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    if (!session || !session.memberId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    }

    const { data: member, error } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('id', session.memberId)
      .single();

    if (error || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404, headers });
    }

    return NextResponse.json({ member }, { headers });
  } catch (error: any) {
    const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', 'Pragma': 'no-cache', 'Expires': '0' };
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.memberId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const currentUserId = session.memberId;

    const body = await request.json();
    const { motto } = body;

    if (motto !== undefined) {
      const { error } = await supabaseAdmin
        .from('members')
        .update({ motto })
        .eq('id', currentUserId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // TODO: support updating other fields (address, birthday, etc.) later

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
