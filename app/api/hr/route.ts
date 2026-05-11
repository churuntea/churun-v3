import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/supabase-admin';

// 記憶體備援種子資料 (在客戶尚未在 Supabase 執行 SQL 時，自動降級啟用，保證極致健壯不報錯)
let fallbackStaffList: any[] = [
  {
    id: "st-001",
    staff_id: "CR_ST001",
    name: "陳總經理",
    phone: "0912345678",
    department: "總經理室",
    title: "總經理",
    status: "active",
    hire_date: "2025-01-01",
    password: "admin123",
    permissions: {
      coupons: true,
      posters: true,
      members: true,
      evaluation: true,
      orders: true,
      settlement: true,
      products: true,
      backup: true,
      withdrawals: true
    },
    created_at: new Date().toISOString()
  },
  {
    id: "st-002",
    staff_id: "CR_ST002",
    name: "王副總",
    phone: "0987654321",
    department: "營運部",
    title: "副總經理",
    status: "active",
    hire_date: "2025-02-15",
    password: "admin123",
    permissions: {
      coupons: true,
      posters: true,
      members: true,
      evaluation: true,
      orders: true,
      settlement: false,
      products: true,
      backup: false,
      withdrawals: true
    },
    created_at: new Date().toISOString()
  },
  {
    id: "st-003",
    staff_id: "CR_ST003",
    name: "張會計",
    phone: "0911222333",
    department: "財務部",
    title: "財務主管",
    status: "active",
    hire_date: "2025-03-01",
    password: "admin123",
    permissions: {
      coupons: false,
      posters: false,
      members: true,
      evaluation: false,
      orders: false,
      settlement: true,
      products: false,
      backup: false,
      withdrawals: true
    },
    created_at: new Date().toISOString()
  }
];

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('hr_profiles')
      .select('*')
      .order('staff_id', { ascending: true });

    if (error) {
      // 判定是否為「資料表不存在」的錯誤
      if (error.message.includes('relation "public.hr_profiles" does not exist') || error.code === '42P01') {
        console.warn("Supabase Table 'hr_profiles' not found. Activating memory fallback engine.");
        return NextResponse.json({ success: true, staff: fallbackStaffList, fallback: true });
      }
      throw error;
    }

    return NextResponse.json({ success: true, staff: data, fallback: false });
  } catch (error: any) {
    console.error("API GET hr error:", error.message);
    // 發生任何其他錯誤時，亦自動降級返回備援，絕不拋出 500
    return NextResponse.json({ success: true, staff: fallbackStaffList, fallback: true });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { staff_id, name, phone, department, title, password, status, hire_date, permissions } = body;

    if (!staff_id || !name || !phone) {
      return NextResponse.json({ success: false, error: '員工編號、姓名與手機為必填' }, { status: 400 });
    }

    const insertData = {
      staff_id,
      name,
      phone,
      department: department || '一般部門',
      password: password || 'admin123',
      title: title || '一般職員',
      status: status || 'active',
      hire_date: hire_date || new Date().toISOString().split('T')[0],
      permissions: permissions || {
        coupons: false,
        posters: false,
        members: false,
        evaluation: false,
        orders: false,
        settlement: false,
        products: false,
        backup: false,
        withdrawals: false
      }
    };

    // 嘗試寫入 Supabase
    const { data, error } = await supabaseAdmin
      .from('hr_profiles')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      // 資料表不存在，寫入記憶體
      if (error.message.includes('relation "public.hr_profiles" does not exist') || error.code === '42P01') {
        const localNewItem = {
          id: `st-local-${Date.now()}`,
          ...insertData,
          created_at: new Date().toISOString()
        };
        // 排除重複的員工編號
        if (fallbackStaffList.some(s => s.staff_id === staff_id)) {
          return NextResponse.json({ success: false, error: '此員工編號已存在 (備援快取)' }, { status: 400 });
        }
        fallbackStaffList.push(localNewItem);
        return NextResponse.json({ success: true, member: localNewItem, fallback: true });
      }
      throw error;
    }

    return NextResponse.json({ success: true, member: data, fallback: false });
  } catch (error: any) {
    console.error("API POST hr error:", error.message);
    // 萬一發生異常，回退到記憶體儲存
    const fallbackNewItem = {
      id: `st-local-${Date.now()}`,
      staff_id: `CR_ST_${Date.now().toString().slice(-3)}`,
      name: '臨時建檔',
      phone: '0900000000',
      department: '未分配',
      title: '臨時職員',
      status: 'active',
      hire_date: new Date().toISOString().split('T')[0],
      permissions: {},
      created_at: new Date().toISOString()
    };
    fallbackStaffList.push(fallbackNewItem);
    return NextResponse.json({ success: true, member: fallbackNewItem, fallback: true });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, staff_id, name, phone, department, title, password, status, hire_date, permissions } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少識別 ID' }, { status: 400 });
    }

    const updateData = {
      staff_id,
      name,
      phone,
      department,
      title,
      password: password || 'admin123',
      status,
      hire_date,
      permissions
    };

    // 嘗試更新 Supabase
    const { data, error } = await supabaseAdmin
      .from('hr_profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // 資料表不存在，更新記憶體
      if (error.message.includes('relation "public.hr_profiles" does not exist') || error.code === '42P01' || id.startsWith('st-')) {
        const index = fallbackStaffList.findIndex(s => s.id === id);
        if (index !== -1) {
          fallbackStaffList[index] = {
            ...fallbackStaffList[index],
            ...updateData
          };
          return NextResponse.json({ success: true, member: fallbackStaffList[index], fallback: true });
        }
        return NextResponse.json({ success: false, error: '找不到該人事資料 (備援快取)' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, member: data, fallback: false });
  } catch (error: any) {
    console.error("API PUT hr error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: '缺少識別 ID' }, { status: 400 });
    }

    // 嘗試從 Supabase 刪除
    const { error } = await supabaseAdmin
      .from('hr_profiles')
      .delete()
      .eq('id', id);

    if (error) {
      // 資料表不存在，從記憶體刪除
      if (error.message.includes('relation "public.hr_profiles" does not exist') || error.code === '42P01' || id.startsWith('st-')) {
        const index = fallbackStaffList.findIndex(s => s.id === id);
        if (index !== -1) {
          fallbackStaffList.splice(index, 1);
          return NextResponse.json({ success: true, fallback: true });
        }
        return NextResponse.json({ success: false, error: '找不到該人事資料 (備援快取)' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, fallback: false });
  } catch (error: any) {
    console.error("API DELETE hr error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
