"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, 
  ChevronRight, 
  ArrowLeft, 
  Loader2, 
  Clock, 
  CheckCircle2, 
  Truck,
  ShoppingBag,
  FileText
} from "lucide-react";

function OrdersContent() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    fetchOrders(savedId);
  }, [router]);

  const fetchOrders = async (userId: string) => {
    setIsLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("member_id", userId)
      .order("created_at", { ascending: false });
    
    setOrders(data || []);
    setIsLoading(false);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'processing': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'shipped': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-50 px-8 py-6 flex items-center gap-6 max-w-lg mx-auto">
         <Link href="/profile" className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition">
            <ArrowLeft className="w-5 h-5" />
         </Link>
         <h1 className="text-sm font-black tracking-[0.3em] text-slate-800 uppercase">我的訂單中心</h1>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-6 mt-4">
        
        {orders.length === 0 && !isLoading ? (
          <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-50 shadow-sm">
             <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-slate-100">
                <ShoppingBag className="w-12 h-12" />
             </div>
             <h3 className="text-xl font-black text-slate-800">尚未有採購紀錄</h3>
             <p className="text-xs text-slate-400 mt-3 leading-relaxed">去商城挑選一些優質的好茶吧！</p>
             <Link href="/store" className="mt-10 inline-block bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                前往商城
             </Link>
          </div>
        ) : (
          <div className="space-y-4">
             {isLoading ? (
               <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-200" /></div>
             ) : orders.map((order, i) => (
               <motion.div 
                 key={order.id}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.05 }}
                 className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm space-y-6 group hover:border-indigo-100 transition duration-500"
               >
                  <div className="flex justify-between items-start">
                     <div className="space-y-1">
                        <div className={`px-4 py-1.5 rounded-full border text-[8px] font-black uppercase tracking-[0.2em] inline-block ${getStatusStyle(order.status)}`}>
                           {order.status === 'completed' ? '已完成' : order.status === 'processing' ? '處理中' : '已發貨'}
                        </div>
                        <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest pt-2">Order #{order.id.slice(-6).toUpperCase()}</h4>
                     </div>
                     <p className="text-lg font-black text-slate-800 tracking-tighter">${Number(order.total_amount).toLocaleString()}</p>
                  </div>

                  <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                     <div className="flex-1 flex items-center gap-3">
                        <Clock className="w-4 h-4 text-slate-300" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           {new Date(order.created_at).toLocaleDateString('zh-TW')}
                        </span>
                     </div>
                     <button className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] group-hover:translate-x-1 transition-transform">
                        查看細節 <ChevronRight className="w-4 h-4" />
                     </button>
                  </div>
               </motion.div>
             ))}
          </div>
        )}

      </main>

    </div>
  );
}

export default function Orders() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>}>
      <OrdersContent />
    </Suspense>
  );
}
