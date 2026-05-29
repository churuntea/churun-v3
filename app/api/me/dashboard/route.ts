import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/supabase-admin';
import { getSession } from '@/lib/auth';

export async function GET() {
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
    const currentUserId = session.memberId;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // 並行執行所有的資料庫查詢
    const [
      { data: defaultAvatars },
      { data: member, error: memberError },
      { data: downlines },
      { data: announcements },
      { data: posterTemplates },
      { data: ambassadorStatusData },
      { data: ambassadorApp },
      { data: newProducts }
    ] = await Promise.all([
      // 0. 系統預設頭像載入
      supabaseAdmin.from("materials").select("title, url").eq("category", "系統預設頭像"),
      
      // 1. 會員個人資料
      supabaseAdmin.from("members").select("*").eq("id", currentUserId).single(),
      
      // 2. 直推夥伴 (僅需 ID)
      supabaseAdmin.from("members").select("id").eq("upline_id", currentUserId),
      
      // 3. 系統快訊公告
      supabaseAdmin.from("announcements")
        .select("*")
        .neq("tag", "SYSTEM")
        .neq("tag", "DELETED")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: false })
        .limit(5),
        
      // 4. 精美海報排版素材
      supabaseAdmin.from("poster_templates")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false }),

      // 5. 大使申請狀態
      supabaseAdmin.from("members").select("ambassador_status").eq("id", currentUserId).single(),

      // 6. 具體大使申請書
      supabaseAdmin.from("ambassador_applications").select("*").eq("member_id", currentUserId).order("created_at", { ascending: false }).limit(1).single(),

      // 7. 新品上市 (過去30天內建立的商品)
      supabaseAdmin.from("products")
        .select("id, name, created_at, price")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: false })
        .limit(5)
    ]);

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500, headers });
    }

    return NextResponse.json({
      member,
      defaultAvatars: defaultAvatars || [],
      downlines: downlines || [],
      announcements: announcements || [],
      posterTemplates: posterTemplates || [],
      ambassadorStatus: ambassadorStatusData?.ambassador_status || null,
      ambassadorApplication: ambassadorApp || null,
      newProducts: newProducts || []
    }, { headers });

  } catch (error: any) {
    const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', 'Pragma': 'no-cache', 'Expires': '0' };
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }
}

