"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, 
  Search, 
  Filter, 
  ChevronRight, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MoreVertical,
  Loader2,
  Calendar,
  DollarSign,
  User,
  ExternalLink,
  Truck,
  Download,
  Printer,
} from "lucide-react";
import Link from "next/link";
import { supabaseAdmin } from "@/app/supabase-admin";
import { exportToCsv } from "@/utils/exportCsv";

function AdminOrdersContent() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  useEffect(() => {
    const auth = sessionStorage.getItem("churun_admin_auth");
    if (auth !== "true") {
      router.replace("/admin");
      return;
    }
    setIsAdmin(true);
    fetchOrders();
  }, [router]);

  const handlePrintPackingSlip = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const itemsHtml = order.order_items ? order.order_items.map((item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">x${item.quantity}</td>
      </tr>
    `).join('') : '<tr><td colspan="2" style="padding: 12px; text-align: center;">無商品明細</td></tr>';

    const shipping = order.shipping_info || {};
    
    printWindow.document.write(`
      <html>
        <head>
          <title>初潤製茶所 - 出貨單/揀貨單</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #333; padding: 40px; }
            .header { text-align: center; margin-bottom: 40px; }
            .title { font-size: 24px; font-weight: 900; letter-spacing: 2px; }
            .subtitle { font-size: 12px; color: #666; margin-top: 5px; }
            .info-grid { display: grid; grid-cols: 2; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .info-box { border: 1px solid #eee; padding: 20px; border-radius: 12px; }
            .info-title { font-size: 10px; font-weight: 900; color: #999; text-transform: uppercase; margin-bottom: 10px; }
            .info-value { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f9f9f9; padding: 12px; text-align: left; font-size: 12px; color: #666; border-bottom: 2px solid #eee; }
            .notes { margin-top: 30px; border-left: 4px solid #f59e0b; padding-left: 15px; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <span style="font-weight: bold; font-size: 12px; color: #999;">訂單編號: ${order.id}</span>
            <button onclick="window.print()" style="background: #111827; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer;">列印此單</button>
          </div>
          <div class="header">
            <div class="title">初 潤 製 茶 所</div>
            <div class="subtitle">出 貨 單 & 揀 貨 明 細</div>
          </div>
          <div class="info-grid" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px;">
            <div class="info-box">
              <div class="info-title">收件人資訊</div>
              <div class="info-value">姓名: ${shipping.name || order.members?.name || '無'}</div>
              <div class="info-value">電話: ${shipping.phone || order.members?.phone || '無'}</div>
              <div class="info-value">方式: ${shipping.method || '宅配到府'}</div>
              <div class="info-value" style="margin-top: 10px;">地址: ${shipping.address || '自取/無'}</div>
            </div>
            <div class="info-box">
              <div class="info-title">寄件人資訊</div>
              <div class="info-value">姓名: ${shipping.sender_name || '初潤製茶所'}</div>
              <div class="info-value">電話: ${shipping.sender_phone || '0939734771'}</div>
              <div class="info-value" style="margin-top: 10px;">地址: ${shipping.sender_address || '南投縣草屯鎮自由街34號'}</div>
            </div>
            <div class="info-box">
              <div class="info-title">訂單資訊</div>
              <div class="info-value">訂單日期: ${new Date(order.created_at).toLocaleString()}</div>
              <div class="info-value">結帳金額: ${order.total_amount}</div>
              <div class="info-value">付款末五碼: ${order.payment_last_five || '無'}</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="text-align: left;">商品品名</th>
                <th style="width: 100px; text-align: center;">數量</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          ${order.notes ? `
            <div class="notes">
              <div class="info-title">備註說明</div>
              <div style="font-size: 13px; font-weight: bold;">${order.notes}</div>
            </div>
          ` : ''}
          
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleBatchApprove = async () => {
    if (selectedOrderIds.length === 0) return;
    if (!confirm(`確定要批量核對並同意這 ${selectedOrderIds.length} 筆訂單的付款嗎？`)) return;
    setIsLoading(true);
    try {
      for (const orderId of selectedOrderIds) {
        await fetch('/api/orders/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId })
        });
      }
      setSelectedOrderIds([]);
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("部分訂單核對失敗");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchShip = async () => {
    if (selectedOrderIds.length === 0) return;
    if (!confirm(`確定要把這 ${selectedOrderIds.length} 筆訂單標記為已出貨嗎？`)) return;
    setIsLoading(true);
    try {
      const { error } = await supabaseAdmin
        .from("orders")
        .update({ fulfillment_status: 'shipped' })
        .in("id", selectedOrderIds);
      if (error) throw error;
      setSelectedOrderIds([]);
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("批量出貨失敗");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintCombinedPickingList = () => {
    if (selectedOrderIds.length === 0) return;
    const selectedOrders = orders.filter(o => selectedOrderIds.includes(o.id));
    
    const totals: any = {};
    selectedOrders.forEach(o => {
      if (o.order_items) {
        o.order_items.forEach((item: any) => {
          totals[item.name] = (totals[item.name] || 0) + item.quantity;
        });
      }
    });
    
    const summaryHtml = Object.entries(totals).map(([name, qty]) => `
      <tr style="font-size: 16px; border-bottom: 2px solid #ddd;">
        <td style="padding: 15px 12px; font-weight: 900; color: #111;">${name}</td>
        <td style="padding: 15px 12px; text-align: center; font-weight: 900; color: #b45309; font-size: 20px;">${qty}</td>
      </tr>
    `).join('');
    
    const detailedHtml = selectedOrders.map(o => {
      const shipping = o.shipping_info || {};
      const items = o.order_items ? o.order_items.map((i: any) => `${i.name} x${i.quantity}`).join(', ') : '無';
      return `
        <tr style="font-size: 12px; border-bottom: 1px solid #eee;">
          <td style="padding: 10px 8px; font-weight: bold; font-family: monospace;">${o.id.substring(0,8)}</td>
          <td style="padding: 10px 8px;">
            <div style="font-weight: bold;">${shipping.name || o.members?.name || '無'}</div>
            ${shipping.sender_name ? `<div style="font-size: 10px; color: #d97706; margin-top: 4px; font-weight: 900;">指定寄件: ${shipping.sender_name}</div>` : ''}
          </td>
          <td style="padding: 10px 8px;">${shipping.phone || o.members?.phone || '無'}</td>
          <td style="padding: 10px 8px; font-weight: bold; color: #047857;">${shipping.method || '宅配到府'}</td>
          <td style="padding: 10px 8px; font-size: 11px; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${shipping.address || '自取'}</td>
          <td style="padding: 10px 8px; font-weight: bold;">${items}</td>
        </tr>
      `;
    }).join('');
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>初潤製茶所 - 總部合併揀貨出貨單</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #333; padding: 40px; }
            .header { text-align: center; margin-bottom: 40px; }
            .title { font-size: 26px; font-weight: 900; letter-spacing: 2px; }
            .subtitle { font-size: 12px; color: #666; margin-top: 5px; }
            .section-title { font-size: 14px; font-weight: 900; text-transform: uppercase; margin-top: 40px; margin-bottom: 15px; border-left: 5px solid #111827; padding-left: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #f3f4f6; padding: 12px; text-align: left; font-size: 12px; color: #4b5563; border-bottom: 2px solid #e5e7eb; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <span style="font-weight: bold; font-size: 12px; color: #999;">合併揀貨單 (共 ${selectedOrders.length} 筆訂單)</span>
            <button onclick="window.print()" style="background: #111827; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">立即列印</button>
          </div>
          <div class="header">
            <div class="title">初 潤 製 茶 所</div>
            <div class="subtitle">總 部 合 併 揀 貨 出 貨 單</div>
          </div>
          
          <div class="section-title">📦 第一步：倉庫總揀貨清單 (商品總計)</div>
          <table>
            <thead>
              <tr>
                <th style="text-align: left; font-size: 14px;">商品品名</th>
                <th style="width: 150px; text-align: center; font-size: 14px;">應揀貨總數量</th>
              </tr>
            </thead>
            <tbody>
              ${summaryHtml}
            </tbody>
          </table>
          
          <div class="section-title">🚚 第二步：分單配送明細</div>
          <table>
            <thead>
              <tr>
                <th style="width: 80px;">單號末碼</th>
                <th style="width: 80px;">收件人</th>
                <th style="width: 100px;">電話</th>
                <th style="width: 90px;">物流方式</th>
                <th>寄送地址 / 門市</th>
                <th>購買品項</th>
              </tr>
            </thead>
            <tbody>
              ${detailedHtml}
            </tbody>
          </table>
          
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          members (
            name,
            phone,
            member_code
          ),
          order_items (
            name,
            quantity,
            price
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, action: 'approve' | 'cancel') => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/orders/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, action })
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
      } else {
        alert(data.error || "操作失敗");
      }
    } catch (err) {
      console.error(err);
      alert("系統錯誤");
    } finally {
      setIsLoading(false);
    }
  };

  const updateFulfillment = async (orderId: string, status: string, trackingNum?: string) => {
    setIsLoading(true);
    try {
      const updates: any = { fulfillment_status: status };
      if (trackingNum !== undefined) {
        updates.tracking_number = trackingNum;
      }
      
      const { error } = await supabaseAdmin
        .from("orders")
        .update(updates)
        .eq("id", orderId);
        
      if (error) throw error;
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("更新出貨狀態失敗");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (filteredOrders.length === 0) return;
    
    const exportData = filteredOrders.map(order => {
      const itemsString = order.order_items ? order.order_items.map((i: any) => `${i.name}x${i.quantity}`).join('; ') : '';
      const shippingString = order.shipping_info ? `收件人:${order.shipping_info.name}, 電話:${order.shipping_info.phone}, 地址:${order.shipping_info.address}${order.shipping_info.notes ? ', 備註:'+order.shipping_info.notes : ''}` : '';
      
      return {
        '訂單日期': new Date(order.created_at).toLocaleDateString(),
        '訂單編號': order.id,
        '會員姓名': order.members?.name || '',
        '會員電話': order.members?.phone || '',
        '購買明細': itemsString,
        '結帳金額': order.total_amount,
        '預計回饋點數': order.reward_points || 0,
        '匯款末五碼': order.payment_last_five || '',
        '訂單狀態': order.status === 'completed' ? '已完成' : order.status === 'cancelled' ? '已取消' : '待確認',
        '出貨狀態': order.fulfillment_status === 'shipped' ? '已出貨' : '未出貨',
        '物流單號': order.tracking_number || '',
        '收件資訊': shippingString
      };
    });

    exportToCsv(`初潤_訂單總表_${new Date().toISOString().split('T')[0]}.csv`, exportData);
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    const matchesSearch = 
      order.members?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.members?.phone.includes(searchTerm) ||
      order.id.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 pb-20">
      {/* Top Header */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 px-8 py-6 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-6">
            <Link href="/admin" className="p-2 hover:bg-slate-50 rounded-full transition">
               <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div>
               <h1 className="text-xl font-black tracking-tight">訂單指揮中心</h1>
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Order Management Console</p>
            </div>
         </div>
         <div className="flex gap-2">
            <button onClick={handleExport} className="flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-[1.5rem] hover:bg-indigo-600 transition shadow-lg shadow-indigo-500/20 text-[10px] font-black uppercase tracking-widest">
               <Download className="w-4 h-4" /> 匯出訂單 (CSV)
            </button>
            <button onClick={fetchOrders} className="p-3 bg-slate-100 text-slate-400 rounded-[1.5rem] hover:text-indigo-600 hover:bg-indigo-50 transition">
               <Clock className="w-5 h-5" />
            </button>
         </div>
      </nav>

      <main className="max-w-7xl mx-auto p-10 space-y-10">
        
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-6">
           <div className="flex-1 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input 
                type="text" 
                placeholder="搜尋會員姓名、電話或訂單編號..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-100 p-6 pl-16 rounded-[2rem] text-sm font-bold focus:ring-2 focus:ring-indigo-500/5 transition shadow-sm"
              />
           </div>
           <div className="flex gap-2 p-2 bg-slate-100 rounded-[2rem]">
              {["all", "pending", "completed", "cancelled"].map((s) => (
                <button 
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition ${filterStatus === s ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                >
                   {s === "all" ? "全部" : s === "pending" ? "待處理" : s === "completed" ? "已完成" : "已取消"}
                </button>
              ))}
           </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-[3rem] border border-slate-50 shadow-sm overflow-hidden">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <th className="p-8 w-12 text-center">
                        <input 
                          type="checkbox"
                          checked={selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedOrderIds(filteredOrders.map(o => o.id));
                            } else {
                              setSelectedOrderIds([]);
                            }
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                     </th>
                    <th className="p-8">訂單日期 / 編號</th>
                    <th className="p-8">會員資訊</th>
                    <th className="p-8">匯款末五碼</th>
                    <th className="p-8 text-right">結帳金額</th>
                    <th className="p-8 text-right">預計回饋</th>
                    <th className="p-8 text-center">目前狀態</th>
                    <th className="p-8 text-right">操作管理</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {isLoading ? (
                   <tr>
                      <td colSpan={6} className="p-20 text-center">
                         <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                      </td>
                   </tr>
                 ) : filteredOrders.length === 0 ? (
                   <tr>
                      <td colSpan={5} className="p-20 text-center">
                         <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Package className="w-8 h-8 text-slate-200" />
                         </div>
                         <p className="text-sm font-bold text-slate-400">目前沒有符合條件的訂單</p>
                      </td>
                   </tr>
                 ) : (
                   filteredOrders.map((order) => (
                     <React.Fragment key={order.id}>
                       <motion.tr 
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         className="hover:bg-slate-50/50 transition group cursor-pointer"
                         onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                       >
                           <td className="p-8 text-center" onClick={e => e.stopPropagation()}>
                              <input 
                                type="checkbox"
                                checked={selectedOrderIds.includes(order.id)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedOrderIds([...selectedOrderIds, order.id]);
                                  } else {
                                    setSelectedOrderIds(selectedOrderIds.filter(id => id !== order.id));
                                  }
                                }}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                           </td>
                          <td className="p-8">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                 <Calendar className="w-5 h-5" />
                              </div>
                              <div className="space-y-1">
                                 <p className="text-sm font-black text-slate-800">{new Date(order.created_at).toLocaleDateString()}</p>
                                 <p className="text-[9px] font-mono text-slate-300">ID: {order.id.substring(0, 8)}...</p>
                              </div>
                           </div>
                        </td>
                        <td className="p-8">
                           <div className="space-y-1">
                              <p className="text-sm font-black text-slate-800">{order.members?.name}</p>
                              <p className="text-[10px] font-bold text-slate-400">{order.members?.phone}</p>
                           </div>
                        </td>
                        <td className="p-8">
                           {order.payment_last_five ? (
                             <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-black">{order.payment_last_five}</span>
                           ) : (
                             <span className="text-[10px] font-black text-slate-200">未回報</span>
                           )}
                        </td>
                        <td className="p-8 text-right">
                           <div className="space-y-1">
                              <p className="text-lg font-black text-slate-900 tracking-tighter">${Number(order.total_amount).toLocaleString()}</p>
                              <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">TWD</p>
                           </div>
                        </td>
                        <td className="p-8 text-right">
                           <div className="space-y-1">
                              {order.reward_points > 0 && <p className="text-sm font-black text-emerald-600">{order.reward_points} pts</p>}
                              {order.b2b_commission > 0 && <p className="text-sm font-black text-indigo-600">${Number(order.b2b_commission).toLocaleString()} 退傭</p>}
                              {(!order.reward_points && !order.b2b_commission) && <p className="text-sm text-slate-300">-</p>}
                           </div>
                        </td>
                        <td className="p-8 text-center">
                           <div className="flex flex-col items-center gap-2">
                             <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${
                               order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                               order.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                               'bg-rose-50 text-rose-600'
                             }`}>
                                {order.status === 'completed' ? '已付款' :
                                 order.status === 'pending' ? '待付款' : 'Cancelled'}
                             </span>
                             {order.status === 'completed' && (
                               <span className={`px-4 py-2 rounded-full text-[9px] font-black tracking-widest flex items-center gap-1 ${
                                 order.fulfillment_status === 'shipped' ? 'bg-blue-50 text-blue-600' :
                                 order.fulfillment_status === 'processing' ? 'bg-indigo-50 text-indigo-600' :
                                 'bg-slate-100 text-slate-500'
                               }`}>
                                 <Truck className="w-3 h-3" />
                                 {order.fulfillment_status === 'shipped' ? '已出貨' : order.fulfillment_status === 'processing' ? '備貨中' : '未出貨'}
                               </span>
                             )}
                             {order.tracking_number && (
                               <span className="text-[9px] font-mono font-bold text-slate-400">{order.tracking_number}</span>
                             )}
                           </div>
                        </td>
                        <td className="p-8 text-right">
                           <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                              {order.status === 'pending' && (
                                <>
                                  <button 
                                    onClick={() => updateOrderStatus(order.id, 'approve')}
                                    className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-110 transition"
                                    title="確認匯款並發放點數"
                                  >
                                     <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => updateOrderStatus(order.id, 'cancel')}
                                    className="p-3 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20 hover:scale-110 transition"
                                    title="取消訂單"
                                  >
                                     <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              
                              {order.status === 'completed' && order.fulfillment_status !== 'shipped' && (
                                <button 
                                  onClick={() => {
                                    const num = prompt("請輸入物流單號（留空則僅標記為已出貨）：");
                                    if (num !== null) updateFulfillment(order.id, 'shipped', num);
                                  }}
                                  className="p-3 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:scale-110 transition"
                                  title="標記為已出貨"
                                >
                                   <Truck className="w-4 h-4" />
                                </button>
                              )}
                              <button className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition">
                                 <MoreVertical className="w-4 h-4" />
                              </button>
                           </div>
                        </td>
                       </motion.tr>
                       {expandedOrderId === order.id && (
                         <tr className="bg-slate-50/30 border-b border-slate-50">
                           <td colSpan={8} className="p-8">
                             <div className="grid grid-cols-2 gap-8">
                               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">訂購明細</h4>
                                 <div className="space-y-3">
                                   {order.order_items && order.order_items.length > 0 ? order.order_items.map((item: any, idx: number) => (
                                     <div key={idx} className="flex justify-between items-center text-sm">
                                       <span className="font-bold text-slate-700">{item.name}</span>
                                       <div className="flex gap-4">
                                         <span className="text-slate-400">x{item.quantity}</span>
                                         <span className="font-black text-slate-800">${item.price}</span>
                                       </div>
                                     </div>
                                   )) : (
                                     <p className="text-xs text-slate-400">無商品明細</p>
                                   )}
                                   {order.notes && (
                                     <div className="mt-4 pt-4 border-t border-slate-50">
                                       <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">訂單備註</p>
                                       <p className="text-xs font-bold text-slate-600">{order.notes}</p>
                                     </div>
                                   )}
                                 </div>
                               </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">收件/寄送資訊</h4>
                                  {order.shipping_info ? (
                                    <div className="space-y-3">
                                      <p className="text-sm"><span className="text-slate-400 mr-2 text-[10px] uppercase font-bold tracking-widest">物流方式</span> <span className="font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">{order.shipping_info.method || '宅配到府'}</span></p>
                                      <p className="text-sm"><span className="text-slate-400 mr-2 text-[10px] uppercase font-bold tracking-widest">收件人</span> <span className="font-black text-slate-800">{order.shipping_info.name}</span></p>
                                      <p className="text-sm"><span className="text-slate-400 mr-2 text-[10px] uppercase font-bold tracking-widest">聯絡電話</span> <span className="font-black text-slate-800">{order.shipping_info.phone}</span></p>
                                      <p className="text-sm"><span className="text-slate-400 mr-2 text-[10px] uppercase font-bold tracking-widest">寄送地址</span> <span className="font-black text-slate-800">{order.shipping_info.address}</span></p>
                                      
                                      {/* 寄件人資訊 */}
                                      {order.shipping_info.sender_name && (
                                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">指定寄件人 (代發代寄)</p>
                                          <p className="text-sm"><span className="text-slate-400 mr-2 text-[10px] uppercase font-bold tracking-widest">寄件人</span> <span className="font-black text-slate-800">{order.shipping_info.sender_name}</span></p>
                                          <p className="text-sm"><span className="text-slate-400 mr-2 text-[10px] uppercase font-bold tracking-widest">聯絡電話</span> <span className="font-black text-slate-800">{order.shipping_info.sender_phone}</span></p>
                                          {order.shipping_info.sender_address && (
                                            <p className="text-sm"><span className="text-slate-400 mr-2 text-[10px] uppercase font-bold tracking-widest">寄送地址</span> <span className="font-black text-slate-800">{order.shipping_info.sender_address}</span></p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-400">無收件資訊 (由會員中心帶入)</p>
                                  )}
                                  
                                  {/* 物流出貨管理控鍵 */}
                                  <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">出貨控制台</h5>
                                    {order.status === 'completed' && (
                                      <div className="flex gap-2">
                                        <input 
                                          id={`tracking-input-${order.id}`}
                                          type="text" 
                                          defaultValue={order.tracking_number || ''}
                                          placeholder="請輸入物流單號"
                                          className="flex-1 bg-slate-50 border-none px-4 py-2.5 rounded-xl text-xs font-bold focus:ring-1 focus:ring-blue-500"
                                        />
                                        <button 
                                          onClick={() => {
                                            const input = document.getElementById(`tracking-input-${order.id}`) as HTMLInputElement;
                                            updateFulfillment(order.id, 'shipped', input?.value || '');
                                          }}
                                          className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-blue-600/10 hover:bg-blue-700 transition"
                                        >
                                          {order.fulfillment_status === 'shipped' ? '更新單號' : '確認出貨'}
                                        </button>
                                      </div>
                                    )}
                                    <div className="flex gap-2">
                                      <button 
                                        onClick={() => handlePrintPackingSlip(order)}
                                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition"
                                      >
                                        <Printer className="w-3.5 h-3.5" /> 列印出貨揀貨單
                                      </button>
                                    </div>
                                  </div>
                                </div>
                             </div>
                           </td>
                         </tr>
                       )}
                     </React.Fragment>
                   ))
                 )}
              </tbody>
           </table>
        </div>

        {/* 批量操作懸浮工具列 (Bulk Action Floating Toolbar) */}
        <AnimatePresence>
          {selectedOrderIds.length > 0 && (
            <motion.div 
              initial={{ y: 100, opacity: 0, x: "-50%" }}
              animate={{ y: 0, opacity: 1, x: "-50%" }}
              exit={{ y: 100, opacity: 0, x: "-50%" }}
              className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[150] w-full max-w-4xl px-6"
            >
               <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 text-white p-6 rounded-[2.5rem] shadow-2xl flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center font-black text-sm">
                        {selectedOrderIds.length}
                     </div>
                     <div>
                        <p className="text-xs font-black">已選取 {selectedOrderIds.length} 筆訂單</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Bulk Action Management</p>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <button 
                       onClick={handlePrintCombinedPickingList}
                       className="px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition"
                     >
                        <Printer className="w-4 h-4" /> 合併揀貨單
                     </button>
                     <button 
                       onClick={handleBatchApprove}
                       className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition"
                     >
                        <CheckCircle2 className="w-4 h-4" /> 批量核付款
                     </button>
                     <button 
                       onClick={handleBatchShip}
                       className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition"
                     >
                        <Truck className="w-4 h-4" /> 批量出貨
                     </button>
                     <button 
                       onClick={() => setSelectedOrderIds([])}
                       className="px-4 py-3.5 text-slate-400 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition"
                     >
                        取消
                     </button>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function AdminOrders() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-slate-400">Loading Orders...</div>}>
      <AdminOrdersContent />
    </Suspense>
  );
}
