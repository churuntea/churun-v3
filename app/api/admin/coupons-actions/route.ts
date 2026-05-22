import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    if (action === 'fetch_data') {
      const { data: couponsData, error: couponsError } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (couponsError) throw couponsError;

      const { data: membersData, error: membersError } = await supabase
        .from("members")
        .select("id, name, phone, tier, is_b2b")
        .order("name");
      if (membersError) throw membersError;

      return NextResponse.json({ success: true, data: { coupons: couponsData, members: membersData } });
    }

    if (action === 'create_coupon') {
      const { code, name, discount_type, value, min_spend, description } = payload;
      const { data, error } = await supabase
        .from("coupons")
        .insert({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          discount_type,
          value: Number(value),
          min_spend: Number(min_spend),
          description
        })
        .select();
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === 'deliver_coupon') {
      const { insertRows, notificationRows } = payload;
      const { error: insertError } = await supabase.from("member_coupons").insert(insertRows);
      if (insertError) throw insertError;

      await supabase.from("notifications").insert(notificationRows);
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_coupon') {
      const { id } = payload;
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'update_coupon_description') {
      const { id, description } = payload;
      const { error } = await supabase.from("coupons").update({ description }).eq("id", id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'update_coupon') {
      const { id, name, discount_type, value, min_spend, description } = payload;
      const { error } = await supabase
        .from("coupons")
        .update({
          name: name.trim(),
          discount_type,
          value: Number(value),
          min_spend: Number(min_spend),
          description: description?.trim() || ""
        })
        .eq("id", id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });

  } catch (error: any) {
    console.error('Coupons Actions API error:', error);
    return NextResponse.json({ success: false, error: error.message || '伺服器異常' }, { status: 500 });
  }
}
