import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('member_id');

    // ── 參數驗證 ──
    if (!memberId) {
      return NextResponse.json(
        { success: false, message: '缺少必要參數：member_id' },
        { status: 400 }
      );
    }

    // ── 查詢最新申請記錄 ──
    const { data: application, error: appErr } = await supabaseAdmin
      .from('ambassador_applications')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (appErr) {
      console.error('[Ambassador Status] 查詢申請記錄失敗:', appErr);
      return NextResponse.json(
        { success: false, message: '查詢申請記錄失敗', error: appErr.message },
        { status: 500 }
      );
    }

    // ── 查詢會員的大使狀態 ──
    const { data: member, error: memberErr } = await supabaseAdmin
      .from('members')
      .select('ambassador_status, ambassador_type, ambassador_expires_at')
      .eq('id', memberId)
      .maybeSingle();

    if (memberErr) {
      console.error('[Ambassador Status] 查詢會員資料失敗:', memberErr);
      return NextResponse.json(
        { success: false, message: '查詢會員資料失敗', error: memberErr.message },
        { status: 500 }
      );
    }

    if (!member) {
      return NextResponse.json(
        { success: false, message: '找不到此會員' },
        { status: 404 }
      );
    }

    // ── 回傳結果 ──
    return NextResponse.json({
      success: true,
      data: {
        application: application || null,
        memberStatus: {
          ambassador_status: member.ambassador_status,
          ambassador_type: member.ambassador_type,
          ambassador_expires_at: member.ambassador_expires_at,
        },
      },
    });

  } catch (err) {
    console.error('[Ambassador Status] 查詢狀態時發生錯誤:', err);
    return NextResponse.json(
      { success: false, message: '系統錯誤，請稍後再試' },
      { status: 500 }
    );
  }
}
