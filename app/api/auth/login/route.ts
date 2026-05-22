import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { supabaseAdmin } from "@/app/supabase-admin";

export async function POST(request: Request) {
  try {
    const { identifier, password, patternCode, loginMode } = await request.json();

    if (!identifier) {
      return NextResponse.json({ success: false, error: "缺少帳號參數" }, { status: 400 });
    }

    const cleanIdentifier = identifier.trim();

    const { data: member, error } = await supabaseAdmin
      .from("members")
      .select("*")
      .or(`phone.eq.${cleanIdentifier},member_code.eq.${cleanIdentifier}`)
      .single();

    if (error || !member) {
      return NextResponse.json({ success: false, error: "查無此會員" }, { status: 404 });
    }

    if (member.status && member.status !== 'active') {
      return NextResponse.json({ success: false, error: `帳號狀態異常: ${member.status}`, status: member.status }, { status: 403 });
    }

    if (loginMode === 'password') {
      const cleanPassword = password.trim();
      if (member.password !== cleanPassword) {
        return NextResponse.json({ success: false, error: "密碼錯誤" }, { status: 401 });
      }
    } else {
      if (!member.pattern_code || member.pattern_code !== patternCode) {
        return NextResponse.json({ success: false, error: "圖形解鎖失敗" }, { status: 401 });
      }
    }

    // Update last login
    await supabaseAdmin.from("members").update({ last_login: new Date().toISOString() }).eq("id", member.id);

    // Create HttpOnly Cookie Session
    await createSession({
      memberId: member.id,
      memberName: member.name
    });

    return NextResponse.json({ success: true, memberId: member.id, memberName: member.name });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
