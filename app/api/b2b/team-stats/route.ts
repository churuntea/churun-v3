import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get('memberId');

  if (!memberId) {
    return NextResponse.json({ success: false, error: '缺少 memberId' }, { status: 400 });
  }

  try {
    // 1. 取得所有下線 (遞迴或扁平結構)
    // 這裡我們用簡單的邏輯：抓取 upline_id 為當前會員的所有成員
    // 之後可以擴展為全團隊遞迴
    const { data: downlines, error: downError } = await supabase
      .from('members')
      .select('id, name, tier, is_b2b, lifetime_spend, quarterly_spend')
      .eq('upline_id', memberId);

    if (downError) throw downError;

    const stats = {
      directCount: downlines.length,
      b2bCount: downlines.filter(d => d.is_b2b).length,
      b2cCount: downlines.filter(d => !d.is_b2b).length,
      totalTeamSales: downlines.reduce((acc, d) => acc + (Number(d.lifetime_spend) || 0), 0),
      quarterlyTeamSales: downlines.reduce((acc, d) => acc + (Number(d.quarterly_spend) || 0), 0),
      topPerformer: downlines.length > 0 ? downlines.sort((a, b) => (Number(b.lifetime_spend) || 0) - (Number(a.lifetime_spend) || 0))[0] : null
    };

    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
