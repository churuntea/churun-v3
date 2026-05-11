import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/supabase-admin';

// Memory seed fallback list for HR staff in case DB table is not set up
const fallbackStaffList = [
  {
    id: "st-001",
    staff_id: "CR_ST001",
    name: "陳總經理",
    phone: "0912345678",
    department: "總經理室",
    title: "總經理",
    password: "admin123",
    status: "active",
    permissions: { coupons: true, posters: true, members: true, evaluation: true, orders: true, settlement: true, products: true, backup: true, withdrawals: true }
  },
  {
    id: "st-002",
    staff_id: "CR_ST002",
    name: "王副總",
    phone: "0987654321",
    department: "營運部",
    title: "副總經理",
    password: "admin123",
    status: "active",
    permissions: { coupons: true, posters: true, members: true, evaluation: true, orders: true, settlement: false, products: true, backup: false, withdrawals: true }
  },
  {
    id: "st-003",
    staff_id: "CR_ST003",
    name: "張會計",
    phone: "0911222333",
    department: "財務部",
    title: "財務主管",
    password: "admin123",
    status: "active",
    permissions: { coupons: false, posters: false, members: true, evaluation: false, orders: false, settlement: true, products: false, backup: false, withdrawals: true }
  }
];

// Shareable in-memory fallback logs in Next.js Serverless runtime cache
// Declared globally so audit routes can share and access it!
if (!(global as any).globalFallbackAuditLogs) {
  (global as any).globalFallbackAuditLogs = [];
}
const fallbackAuditLogs = (global as any).globalFallbackAuditLogs;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { account, password } = body;

    if (!account || !password) {
      return NextResponse.json({ success: false, error: '請輸入帳號與密碼' }, { status: 400 });
    }

    let staffUser: any = null;
    let isFallback = false;

    // 1. Query database for staff profile
    try {
      const { data, error } = await supabaseAdmin
        .from('hr_profiles')
        .select('*')
        .or(`staff_id.eq.${account},phone.eq.${account}`)
        .single();

      if (error) {
        if (error.message.includes('relation "public.hr_profiles" does not exist') || error.code === '42P01') {
          isFallback = true;
        } else {
          // If simply not found
          return NextResponse.json({ success: false, error: '帳號或密碼錯誤' }, { status: 401 });
        }
      } else {
        staffUser = data;
      }
    } catch (e) {
      isFallback = true;
    }

    // 2. Fallback check if DB not exist/not synced
    if (isFallback) {
      const matched = fallbackStaffList.find(s => s.staff_id === account || s.phone === account);
      if (matched) {
        staffUser = matched;
      } else {
        return NextResponse.json({ success: false, error: '帳號或密碼錯誤 (備援模式)' }, { status: 401 });
      }
    }

    if (!staffUser) {
      return NextResponse.json({ success: false, error: '此管理帳號不存在' }, { status: 401 });
    }

    // 3. Verify Password (plain-text for extremely straightforward enterprise custom password setting)
    if (staffUser.password !== password) {
      return NextResponse.json({ success: false, error: '密碼錯誤' }, { status: 401 });
    }

    if (staffUser.status !== 'active') {
      return NextResponse.json({ success: false, error: '此帳號已被停權或註銷，請洽系統管理員' }, { status: 403 });
    }

    // 4. Create Audit Log Session
    const logEntry = {
      staff_id: staffUser.staff_id,
      name: staffUser.name,
      department: staffUser.department,
      title: staffUser.title,
      login_time: new Date().toISOString(),
      last_active: new Date().toISOString(),
      duration: 0,
      features_accessed: []
    };

    let logId = `log-local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      const { data: insertedLog, error: logError } = await supabaseAdmin
        .from('admin_audit_logs')
        .insert(logEntry)
        .select()
        .single();

      if (!logError && insertedLog) {
        logId = insertedLog.id;
      } else {
        console.warn("Audit log insert failed or table doesn't exist. Logging in fallback memory.");
        const fallbackEntry = { id: logId, ...logEntry };
        fallbackAuditLogs.push(fallbackEntry);
      }
    } catch (e) {
      console.warn("Audit log catch insert fail, using memory:", e);
      const fallbackEntry = { id: logId, ...logEntry };
      fallbackAuditLogs.push(fallbackEntry);
    }

    // Return profile & session ID
    return NextResponse.json({
      success: true,
      message: '登入成功',
      user: {
        id: staffUser.id,
        staff_id: staffUser.staff_id,
        name: staffUser.name,
        phone: staffUser.phone,
        department: staffUser.department,
        title: staffUser.title,
        permissions: staffUser.permissions
      },
      logId,
      fallback: isFallback
    });

  } catch (error: any) {
    console.error("Login API Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
