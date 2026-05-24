import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/supabase-admin';

export async function POST(req: Request) {
  try {
    const { updatedPoints } = await req.json();

    if (!Array.isArray(updatedPoints)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("announcements")
      .update({ content: JSON.stringify(updatedPoints) })
      .eq("title", "[SYSTEM_PICKUP_POINTS]");

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Pickup points update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
