import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/supabase-admin';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.memberId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: member, error } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('id', session.memberId)
      .single();

    if (error || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ member });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
