import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/supabase-admin';

// Initialize global server-side backup lists
if (!(global as any).globalFallbackAuditLogs) {
  (global as any).globalFallbackAuditLogs = [];
}
const fallbackAuditLogs = (global as any).globalFallbackAuditLogs;

// GET: Load all audit logs. Only accessible by GM (General Manager) title.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requesterTitle = searchParams.get('title') || '';
    const requesterName = searchParams.get('name') || '';

    // General Manager Permission verification
    if (!requesterTitle.includes('總經理')) {
      return NextResponse.json({ 
        success: false, 
        error: '權限不足！此系統使用軌跡與安全審計功能僅開放予「總經理 / 創辦人」進行監督查閱。' 
      }, { status: 403 });
    }

    // 1. Fetch from Database
    try {
      const { data, error } = await supabaseAdmin
        .from('admin_audit_logs')
        .select('*')
        .order('login_time', { ascending: false });

      if (error) {
        if (error.message.includes('relation "public.admin_audit_logs" does not exist') || error.code === '42P01') {
          console.warn("Database audit log table not found. Returning in-memory logs.");
          return NextResponse.json({ success: true, logs: fallbackAuditLogs, fallback: true });
        }
        throw error;
      }

      // Merge local in-memory logs for complete robustness if desired, or return DB directly
      return NextResponse.json({ success: true, logs: data, fallback: false });

    } catch (e: any) {
      console.warn("Catch audit query failure, returning memory fallback:", e.message);
      return NextResponse.json({ success: true, logs: fallbackAuditLogs, fallback: true });
    }

  } catch (error: any) {
    console.error("GET Audit Logs Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Heartbeat / Activity logger update
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { logId, feature } = body;

    if (!logId) {
      return NextResponse.json({ success: false, error: '缺少軌跡 ID (logId)' }, { status: 400 });
    }

    const now = new Date();
    const nowIso = now.toISOString();

    // 1. Check if log is in local memory cache
    const memLogIndex = fallbackAuditLogs.findIndex((log: any) => log.id === logId);
    let logUpdatedInMemory = false;

    if (memLogIndex !== -1) {
      const logObj = fallbackAuditLogs[memLogIndex];
      const start = new Date(logObj.login_time);
      const diffSeconds = Math.round((now.getTime() - start.getTime()) / 1000);

      logObj.last_active = nowIso;
      logObj.duration = diffSeconds;

      if (feature && !logObj.features_accessed.includes(feature)) {
        logObj.features_accessed.push(feature);
      }
      logUpdatedInMemory = true;
    }

    // 2. Also try updating database log
    try {
      // First fetch current record to compute total duration correctly based on original login time
      const { data: dbLog, error: fetchErr } = await supabaseAdmin
        .from('admin_audit_logs')
        .select('login_time, features_accessed')
        .eq('id', logId)
        .single();

      if (!fetchErr && dbLog) {
        const start = new Date(dbLog.login_time);
        const diffSeconds = Math.round((now.getTime() - start.getTime()) / 1000);

        let currentFeatures = dbLog.features_accessed || [];
        if (!Array.isArray(currentFeatures)) {
          currentFeatures = [];
        }
        if (feature && !currentFeatures.includes(feature)) {
          currentFeatures.push(feature);
        }

        const { error: updateErr } = await supabaseAdmin
          .from('admin_audit_logs')
          .update({
            last_active: nowIso,
            duration: diffSeconds,
            features_accessed: currentFeatures
          })
          .eq('id', logId);

        if (updateErr) {
          console.warn("DB Audit heartbeat update failed:", updateErr.message);
        } else {
          return NextResponse.json({ success: true, updated: 'database' });
        }
      }
    } catch (e: any) {
      console.warn("Catch heartbeat update failure, DB table might not exist:", e.message);
    }

    // If it fell back to memory or succeeded in memory
    if (logUpdatedInMemory) {
      return NextResponse.json({ success: true, updated: 'memory' });
    }

    // If we couldn't find it in either, create on the fly as safety fallback
    return NextResponse.json({ success: false, error: '找不到該登入 Session' }, { status: 404 });

  } catch (error: any) {
    console.error("PUT Audit heartbeats error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
