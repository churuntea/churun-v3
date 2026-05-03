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
  ExternalLink
} from "lucide-react";
import Link from "next/link";

function AdminOrdersContent() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);
    
    if (error) {
      alert("更新失敗: " + error.message);
    } else {
      fetchOrders();
    }
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
         <button onClick={fetchOrders} className="p-2 text-slate-400 hover:text-indigo-600 transition">
            <Clock className="w-5 h-5" />
         </button>
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
                    <th className="p-8 text-right">結帳金額</th>
                    <th className="p-8 text-center">目前狀態</th>
                    <th className="p-8 text-right">操作管理</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {isLoading ? (
                   <tr>
                      <td colSpan={5} className="p-20 text-center">
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
                     <motion.tr 
                       key={order.id}
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       className="hover:bg-slate-50/50 transition group"
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
                        <td className="p-8 text-right">
                           <div className="space-y-1">
                              <p className="text-lg font-black text-slate-900 tracking-tighter">${Number(order.total_amount).toLocaleString()}</p>
                              <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">TWD</p>
                           </div>
                        </td>
                        <td className="p-8 text-center">
                           <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${
                             order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                             order.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                             'bg-rose-50 text-rose-600'
                           }`}>
                              {order.status === 'completed' ? 'Success' :
                               order.status === 'pending' ? 'Processing' : 'Cancelled'}
                           </span>
                        </td>
                        <td className="p-8 text-right">
                           <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                              {order.status === 'pending' && (
                                <>
                                  <button 
                                    onClick={() => updateOrderStatus(order.id, 'completed')}
                                    className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-110 transition"
                                    title="標記為已完成"
                                  >
                                     <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                    className="p-3 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20 hover:scale-110 transition"
                                    title="取消訂單"
                                  >
                                     <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition">
                                 <MoreVertical className="w-4 h-4" />
                              </button>
                           </div>
                        </td>
                     </motion.tr>
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
