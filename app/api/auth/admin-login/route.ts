import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { supabaseAdmin } from "@/app/supabase-admin";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Missing credentials" }, { status: 400 });
    }

    // In a real app, this should query an admins table.
    // Since the original app just checked if the user typed "admin", 
    // we'll implement a basic secure check for now.
    // The admin credentials should ideally be in env vars or DB.
    // For this example, let's allow a hardcoded admin if it matches,
    // OR we can query the members table if they are designated as admins.

    const adminEmail = process.env.ADMIN_EMAIL || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'churun888';

    if (email === adminEmail && password === adminPass) {
      await createSession({
        memberId: "admin",
        memberName: "最高權限管理員",
        isAdmin: true,
        role: "admin"
      });

      return NextResponse.json({ success: true, user: { id: "admin", name: "最高權限管理員", permissions: { all: true } } });
    }

    return NextResponse.json({ success: false, error: "帳號或密碼錯誤" }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
