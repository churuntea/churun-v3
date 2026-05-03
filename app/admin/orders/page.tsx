"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseAdmin as supabase } from "@/app/supabase-admin";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  ArrowLeft, 
  Loader2, 
  Search,
  ExternalLink,
  ShoppingBag,
  Clock
} from "lucide-react";

function AdminOrdersContent() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const isAdmin = sessionStorage.getItem("is_admin");
    if (!isAdmin) router.push("/admin");
    fetchOrders();
  }, [router]);

  const fetchOrders = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("orders")
      .select(`
        *,
        members (name, phone)
      `)
      .order("created_at", { ascending: false });
    
    setOrders(data || []);
    setIsLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status, completed_at: status === 'completed' ? new Date().toISOString() : null })
      .eq("id", id);
    
    if (!error) fetchOrders();
  };

  const filteredOrders = orders.filter(o => filter === 'all' ? true : o.status === filter);

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      
      {/* Admin Nav */}
      <nav className="bg-slate-900 text-white sticky top-0 z-50 px-8 py-6 flex items-center justify-between">
         <div className="flex items-center gap-6">
            <Link href="/admin" className="p-2 -ml-2 text-white/40 hover:text-white transition">
               <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-sm font-black tracking-[0.3em] uppercase">訂單總調度中心</h1>
         </div>
         <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Global Logistics</span>
         </div>
      </nav>

      <main className="max-w-5xl mx-auto p-8 space-y-8">
        
        {/* Filters */}
        <div className="flex overflow-x-auto gap-2 p-1 bg-slate-100 rounded-2xl w-fit no-scrollbar">
           {['all', 'processing', 'shipped', 'completed'].map((t) => (
             <button 
               key={t}
               onClick={() => setFilter(t)}
               className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition whitespace-nowrap ${filter === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
             >
                {t === 'all' ? '全部訂單' : t === 'processing' ? '處理中' : t === 'shipped' ? '已發貨' : '已完成'}
             </button>
           ))}
        </div>

        {/* Order Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {isLoading ? (
             <div className="col-span-2 flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-200" /></div>
           ) : filteredOrders.map((order, i) => (
             <motion.div 
               key={order.id}
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between group"
             >
                <div className="space-y-6">
                   <div className="flex justify-between items-start">
                      <div className="space-y-1">
                         <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-slate-900">Order #{order.id.slice(-6).toUpperCase()}</span>
                            <div className={`w-2 h-2 rounded-full ${order.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
                         </div>
                         <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{new Date(order.created_at).toLocaleString()}</p>
                      </div>
                      <h4 className="text-xl font-black text-slate-900 tracking-tighter">${Number(order.total_amount).toLocaleString()}</h4>
                   </div>

                   <div className="p-6 bg-slate-50 rounded-[2rem] space-y-3">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <User className="w-4 h-4 text-slate-400" />
                         </div>
                         <span className="text-sm font-bold text-slate-700">{order.members?.name}</span>
                         <span className="text-[10px] font-bold text-slate-300">({order.members?.phone})</span>
                      </div>
                   </div>
                </div>

                <div className="mt-8 flex gap-3">
                   {order.status === 'processing' && (
                     <button 
                       onClick={() => updateStatus(order.id, 'shipped')}
                       className="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2"
                     >
                        <Truck className="w-4 h-4" /> 標記為發貨
                     </button>
                   )}
                   {order.status === 'shipped' && (
                     <button 
                       onClick={() => updateStatus(order.id, 'completed')}
                       className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
                     >
                        <CheckCircle2 className="w-4 h-4" /> 完成訂單
                     </button>
                   )}
                   {order.status === 'completed' && (
                     <div className="flex-1 bg-emerald-50 text-emerald-600 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center">
                        ✓ 訂單已結案
                     </div>
                   )}
                   <button className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition">
                      <ExternalLink className="w-5 h-5" />
                   </button>
                </div>
             </motion.div>
           ))}
        </div>

      </main>

    </div>
  );
}

const User = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;

export default function AdminOrders() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-900" /></div>}>
      <AdminOrdersContent />
    </Suspense>
  );
}
