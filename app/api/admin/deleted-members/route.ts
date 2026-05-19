import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    // Query SYSTEM announcements starting with '[DELETED_MEMBER]'
    const { data: rawLogs, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('tag', 'SYSTEM')
      .like('title', '[DELETED_MEMBER]%')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch deleted logs DB error:', error);
      return NextResponse.json({ success: false, error: '查詢刪除日誌失敗' }, { status: 500 });
    }

    // Parse and filter logs in memory for precise details
    const parsedLogs = (rawLogs || []).map(log => {
      try {
        const detail = JSON.parse(log.content || '{}');
        return {
          id: log.id,
          member_id: detail.id || '',
          name: detail.name || '',
          phone: detail.phone || '',
          referral_code: detail.referral_code || '',
          member_code: detail.member_code || '',
          tier: detail.tier || '一般會員',
          deleted_by_name: detail.deleted_by_name || '最高管理員',
          deleted_by_title: detail.deleted_by_title || '超級管理員',
          deleted_at: detail.deleted_at || log.created_at,
          original_data: detail.original_data || detail
        };
      } catch (e) {
        console.error('Failed to parse announcement content JSON:', e);
        return null;
      }
    }).filter(Boolean) as any[];

    // Apply filters
    let filteredLogs = parsedLogs;

    // Search filter (name, phone, referral code, member code)
    if (search) {
      filteredLogs = filteredLogs.filter(log => 
        log.name.toLowerCase().includes(search) ||
        log.phone.toLowerCase().includes(search) ||
        log.referral_code.toLowerCase().includes(search) ||
        log.member_code.toLowerCase().includes(search)
      );
    }

    // Date filters (using deletion date)
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filteredLogs = filteredLogs.filter(log => new Date(log.deleted_at) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filteredLogs = filteredLogs.filter(log => new Date(log.deleted_at) <= end);
    }

    return NextResponse.json({ success: true, logs: filteredLogs });
  } catch (error: any) {
    console.error('Deleted members logs API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
