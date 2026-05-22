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

    // 0. 系統預設頭像載入
    const { data: defaultAvatars } = await supabaseAdmin.from("materials").select("title, url").eq("category", "系統預設頭像");

    // 1. 會員個人資料
    const { data: member, error: memberError } = await supabaseAdmin
      .from("members")
      .select("*")
      .eq("id", currentUserId)
      .single();

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    // 2. 直推夥伴 (僅需 ID 用於計算業績與推廣人數)
    const { data: downlines } = await supabaseAdmin
      .from("members")
      .select("id")
      .eq("upline_id", currentUserId);

    // 3. 系統快訊公告
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: announcements } = await supabaseAdmin
      .from("announcements")
      .select("*")
      .neq("tag", "SYSTEM")
      .neq("tag", "DELETED")
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: false })
      .limit(5);

    // 4. 精美海報排版素材
    const { data: posterTemplates } = await supabaseAdmin
      .from("poster_templates")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      member,
      defaultAvatars: defaultAvatars || [],
      downlines: downlines || [],
      announcements: announcements || [],
      posterTemplates: posterTemplates || []
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
