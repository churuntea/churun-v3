import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'month';

    const now = new Date();
    let startDate = null;

    if (timeframe === 'day') {
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    } else if (timeframe === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (timeframe === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (timeframe === 'quarter') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    } else if (timeframe === 'half-year') {
      startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString();
    } else if (timeframe === 'year') {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
    }

    // 1. 查詢該時間區間內的所有訂單 (含會員資訊)
    let ordersQuery = supabase
      .from('orders')
      .select(`
        id,
        member_id,
        total_amount,
        status,
        created_at,
        members (
          id,
          name,
          phone,
          tier
        )
      `);
    
    if (startDate) {
      ordersQuery = ordersQuery.gte('created_at', startDate);
    }
    
    const { data: orders, error: ordersError } = await ordersQuery;
    if (ordersError) throw ordersError;

    const safeOrders = orders || [];

    // 2. 查詢對應的所有訂單明細
    const orderIds = safeOrders.map(o => o.id);
    let orderItems: any[] = [];
    if (orderIds.length > 0) {
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          product_id,
          name,
          quantity,
          price
        `)
        .in('order_id', orderIds);
      if (itemsError) throw itemsError;
      orderItems = itemsData || [];
    }

    // 3. 查詢所有商品清單以取得所屬大分類 (支援 category 欄位不存在之相容模式)
    let products: any[] = [];
    const { data: catProducts, error: catError } = await supabase
      .from('products')
      .select('id, name, category');

    if (catError) {
      console.warn("Category column missing in products table, falling back to name bracket prefix parsing:", catError.message);
      const { data: fallbackProds, error: fallbackError } = await supabase
        .from('products')
        .select('id, name');
      if (fallbackError) throw fallbackError;

      // 解析名稱前綴中的 [分類]
      products = (fallbackProds || []).map(p => {
        let category = "極萃系列"; // 預設值
        let name = p.name || "";
        if (name.startsWith('[')) {
          const match = name.match(/^\[(.*?)\]\s*(.*)$/);
          if (match) {
            category = match[1];
            name = match[2];
          }
        }
        return { id: p.id, name, category };
      });
    } else {
      products = (catProducts || []).map(p => ({
        id: p.id,
        name: p.name,
        category: p.category || "極萃系列"
      }));
    }

    const productsMap = new Map(products.map(p => [p.id, p]));

    // --- 開始進行業務統計計算 ---

    // 篩選出有效成交訂單 (非已取消或已退款之訂單，包含已完成 completed、已出貨 shipped、已付款 paid、處理中 pending 等皆列入業績)
    const activeOrders = safeOrders.filter(o => o.status !== 'cancelled' && o.status !== 'refunded');
    const activeOrderIds = new Set(activeOrders.map(o => o.id));
    const activeItems = orderItems.filter(item => activeOrderIds.has(item.order_id));

    // A. 銷量及金額總體統計 (Summary Stats)
    const totalRevenue = activeOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const totalVolume = activeItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const orderCount = safeOrders.length;
    const activeOrderCount = activeOrders.length;

    // B. 各大分類統計 (Major Categories)
    const categoryStatsMap = new Map<string, { quantity: number; revenue: number }>();
    
    // 初始化分類清單
    for (const prod of products || []) {
      const cat = prod.category || '未分類';
      if (!categoryStatsMap.has(cat)) {
        categoryStatsMap.set(cat, { quantity: 0, revenue: 0 });
      }
    }

    for (const item of activeItems) {
      const prod = productsMap.get(item.product_id);
      const cat = prod?.category || '未分類';
      const current = categoryStatsMap.get(cat) || { quantity: 0, revenue: 0 };
      current.quantity += Number(item.quantity || 0);
      current.revenue += Number(item.quantity || 0) * Number(item.price || 0);
      categoryStatsMap.set(cat, current);
    }

    const categoriesList = Array.from(categoryStatsMap.entries()).map(([name, stats]) => ({
      category_name: name,
      total_quantity: stats.quantity,
      total_revenue: stats.revenue,
      revenue_percentage: totalRevenue > 0 ? Number(((stats.revenue / totalRevenue) * 100).toFixed(2)) : 0
    })).sort((a, b) => b.total_revenue - a.total_revenue);

    // C. 各細項統計 (Detailed Product Items)
    const productStatsMap = new Map<string, { name: string; category: string; quantity: number; revenue: number }>();

    for (const item of activeItems) {
      const prodId = item.product_id || 'unknown';
      const prod = productsMap.get(prodId);
      const category = prod?.category || '未分類';
      const current = productStatsMap.get(prodId) || { name: item.name || '未知商品', category, quantity: 0, revenue: 0 };
      current.quantity += Number(item.quantity || 0);
      current.revenue += Number(item.quantity || 0) * Number(item.price || 0);
      productStatsMap.set(prodId, current);
    }

    const productsList = Array.from(productStatsMap.entries()).map(([id, stats]) => ({
      product_id: id,
      product_name: stats.name,
      category_name: stats.category,
      total_quantity: stats.quantity,
      total_revenue: stats.revenue,
      revenue_percentage: totalRevenue > 0 ? Number(((stats.revenue / totalRevenue) * 100).toFixed(2)) : 0
    })).sort((a, b) => b.total_revenue - a.total_revenue);

    // D. 各職級的業績統計 (Membership Tier Stats)
    const tierStatsMap = new Map<string, { orders_count: number; revenue: number; unique_members: Set<string> }>();
    
    // 初始化系統所有職級，確保每個職級均會出現在統計中
    const ALL_TIERS = [
      '初潤寶寶', '初潤幼兒園', '初潤小朋友', '初潤青少年', '初潤好朋友',
      '初潤特邀團', '初潤閨蜜', '初潤知己', '初潤靈魂伴侶'
    ];
    for (const tier of ALL_TIERS) {
      tierStatsMap.set(tier, { orders_count: 0, revenue: 0, unique_members: new Set<string>() });
    }

    for (const order of activeOrders) {
      const member = order.members as any;
      const tier = member?.tier || '初潤寶寶'; // 預設歸類為初潤寶寶
      const current = tierStatsMap.get(tier) || { orders_count: 0, revenue: 0, unique_members: new Set<string>() };
      current.orders_count += 1;
      current.revenue += Number(order.total_amount || 0);
      if (order.member_id) {
        current.unique_members.add(order.member_id);
      }
      tierStatsMap.set(tier, current);
    }

    const tiersList = Array.from(tierStatsMap.entries()).map(([name, stats]) => ({
      tier_name: name,
      active_members_count: stats.unique_members.size,
      orders_count: stats.orders_count,
      total_revenue: stats.revenue,
      revenue_percentage: totalRevenue > 0 ? Number(((stats.revenue / totalRevenue) * 100).toFixed(2)) : 0
    })).sort((a, b) => b.total_revenue - a.total_revenue);

    // E. 格式化生成一個精緻的數據庫備份報告 (純文字報表，方便後台一鍵預覽與存檔)
    const dateStr = now.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
    let textReport = `=========================================================
初潤製茶所數位管理系統 - 營業數據統計與資料備份
=========================================================
備份時間: ${dateStr}
統計區間: ${timeframe.toUpperCase()} (${startDate ? `自 ${new Date(startDate).toLocaleDateString()} 起` : '歷史所有'})
---------------------------------------------------------

[1. 營運總體統計 (SUMMARY)]
- 總訂單筆數: ${orderCount} 筆 (其中有效訂單: ${activeOrderCount} 筆)
- 總銷售件數: ${totalVolume} 件
- 總營業金額: $${totalRevenue.toLocaleString()} 元

---------------------------------------------------------

[2. 各大分類統計 (MAJOR CATEGORIES)]
${categoriesList.map((cat, idx) => `  ${idx + 1}. 【${cat.category_name}】
     - 總銷量: ${cat.total_quantity} 件
     - 總業績: $${cat.total_revenue.toLocaleString()} 元 (佔比 ${cat.revenue_percentage}%)`).join('\n\n')}

---------------------------------------------------------

[3. 商品細項銷售排名 (DETAILED ITEMS)]
${productsList.map((prod, idx) => `  ${idx + 1}. ${prod.product_name} (分類: ${prod.category_name})
     - 總銷量: ${prod.total_quantity} 件
     - 總業績: $${prod.total_revenue.toLocaleString()} 元 (佔比 ${prod.revenue_percentage}%)`).join('\n\n')}

---------------------------------------------------------

[4. 各職級組織業績統計 (MEMBERSHIP TIERS)]
${tiersList.map((tier, idx) => `  ${idx + 1}. 【${tier.tier_name}】
     - 消費總人數: ${tier.active_members_count} 人
     - 總訂單筆數: ${tier.orders_count} 筆
     - 組織業績總計: $${tier.total_revenue.toLocaleString()} 元 (佔比 ${tier.revenue_percentage}%)`).join('\n\n')}

=========================================================
備份報告生成完畢 - 守護初潤茶香與信任
=========================================================`;

    return NextResponse.json({
      success: true,
      timeframe,
      generated_at: dateStr,
      summary: {
        total_revenue: totalRevenue,
        total_volume: totalVolume,
        total_orders: orderCount,
        active_orders: activeOrderCount
      },
      categories: categoriesList,
      products: productsList,
      tiers: tiersList,
      text_report: textReport
    });

  } catch (error: any) {
    console.error('Backup API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
