"use client";

import { useEffect, useState, Suspense } from "react";
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
import { ExternalLink, Truck, Download } from "lucide-react";
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

  useEffect(() => {
    const auth = sessionStorage.getItem("churun_admin_auth");
    if (auth !== "true") {
      router.replace("/admin");
      return;
    }
    setIsAdmin(true);
    fetchOrders();
  }, [router]);

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
                           <td colSpan={7} className="p-8">
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
                                   <div className="space-y-2">
                                     <p className="text-sm"><span className="text-slate-400 mr-2 text-[10px] uppercase font-bold tracking-widest">收件人</span> <span className="font-black text-slate-800">{order.shipping_info.name}</span></p>
                                     <p className="text-sm"><span className="text-slate-400 mr-2 text-[10px] uppercase font-bold tracking-widest">聯絡電話</span> <span className="font-black text-slate-800">{order.shipping_info.phone}</span></p>
                                     <p className="text-sm"><span className="text-slate-400 mr-2 text-[10px] uppercase font-bold tracking-widest">寄送地址</span> <span className="font-black text-slate-800">{order.shipping_info.address}</span></p>
                                   </div>
                                 ) : (
                                   <p className="text-xs text-slate-400">無收件資訊 (由會員中心帶入)</p>
                                 )}
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
