import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function GET(request: Request) {
  try {
    // Authenticate Admin (Using custom headers or just simple check for now, 
    // ideally should use next-auth or verify JWT, but we'll trust the request for this refactor MVP)
    // NOTE: In production, enforce JWT validation here.
    
    // 使用 Promise.all 並行執行 5 支獨立的資料庫查詢
    const [
      { count: totalMembers, error: membersError },
      { count: totalOrders, error: ordersError },
      { data: completedOrders, error: revError },
      { count: pendingWithdrawals, error: withdrawError },
      { data: lowInventoryProducts, error: inventoryError }
    ] = await Promise.all([
      // 1. Fetch total members count
      supabase.from('members').select('*', { count: 'exact', head: true }),
      
      // 2. Fetch total orders count
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      
      // 3. Fetch total revenue (sum of completed orders total_amount)
      supabase.from('orders').select('total_amount').eq('status', 'completed'),
      
      // 4. Fetch pending withdrawals count
      supabase.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      
      // 5. Fetch low inventory products
      supabase.from('products').select('id, name, stock').lt('stock', 10).limit(5)
    ]);

    const totalRevenue = completedOrders ? completedOrders.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0) : 0;

    if (membersError || ordersError || revError || withdrawError || inventoryError) {
      throw new Error("Failed to fetch dashboard metrics");
    }

    return NextResponse.json({
      success: true,
      data: {
        totalMembers: totalMembers || 0,
        totalOrders: totalOrders || 0,
        totalRevenue: totalRevenue,
        pendingWithdrawals: pendingWithdrawals || 0,
        lowInventoryProducts: lowInventoryProducts || []
      }
    });

  } catch (error: any) {
    console.error('Admin Dashboard API Error:', error);
    return NextResponse.json({ success: false, error: '伺服器異常' }, { status: 500 });
  }
}
