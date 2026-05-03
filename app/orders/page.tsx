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

function OrderSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
       {[1,2,3].map(i => (
         <div key={i} className="bg-white rounded-[2.5rem] p-8 border border-slate-50 space-y-6">
            <div className="flex justify-between">
               <div className="w-20 h-4 bg-slate-100 rounded-full"></div>
               <div className="w-16 h-6 bg-slate-100 rounded-lg"></div>
            </div>
            <div className="w-full h-2 bg-slate-50 rounded-full"></div>
            <div className="flex justify-between">
               <div className="w-24 h-3 bg-slate-50 rounded"></div>
               <div className="w-12 h-3 bg-slate-50 rounded"></div>
            </div>
         </div>
       ))}
    </div>
  );
}

function OrdersContent() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

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

  const filteredOrders = orders.filter(order => {
    if (activeTab === "all") return true;
    return order.status === activeTab;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500 text-white shadow-emerald-500/20';
      case 'processing': return 'bg-amber-500 text-white shadow-amber-500/20';
      case 'shipped': return 'bg-indigo-500 text-white shadow-indigo-500/20';
      default: return 'bg-slate-400 text-white shadow-slate-400/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '訂單已完成';
      case 'processing': return '處理中';
      case 'shipped': return '商品已發貨';
      default: return '已取消';
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      
      {/* Header */}
      <nav className="bg-[#FDFBF7]/80 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-100 px-8 py-6 flex items-center gap-6 max-w-lg mx-auto">
         <Link href="/profile" className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition">
            <ArrowLeft className="w-5 h-5" />
         </Link>
         <h1 className="text-xs font-black tracking-[0.3em] text-slate-800 uppercase">我的訂單中心</h1>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-8 mt-4">
         
         {/* Status Tabs */}
         <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {[
              { id: "all", label: "全部" },
              { id: "processing", label: "待處理" },
              { id: "shipped", label: "運送中" },
              { id: "completed", label: "已完成" }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                  activeTab === tab.id ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'bg-white text-slate-400 border border-slate-50'
                }`}
              >
                 {tab.label}
              </button>
            ))}
         </div>
        
         {isLoading ? <OrderSkeleton /> : (
           filteredOrders.length === 0 ? (
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-white rounded-[3.5rem] p-20 text-center border border-slate-100 shadow-sm"
             >
                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-slate-200">
                   <Package className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">查無相關訂單</h3>
                <p className="text-xs text-slate-400 mt-4 leading-relaxed font-medium">看來您還沒有這個分類的訂單紀錄。<br />立即去商城逛逛吧！</p>
                <Link href="/store" className="mt-12 inline-block bg-emerald-900 text-white px-10 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-900/20 active:scale-95 transition">
                   前往精品商城
                </Link>
             </motion.div>
           ) : (
             <div className="space-y-6">
                {filteredOrders.map((order, i) => (
                  <motion.div 
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white rounded-[3rem] p-8 border border-slate-50 shadow-[0_15px_40px_rgba(0,0,0,0.02)] space-y-6 group hover:border-emerald-100 transition-all duration-500"
                  >
                     <div className="flex justify-between items-start">
                        <div className="space-y-3">
                           <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-lg ${getStatusStyle(order.status)}`}>
                              {getStatusLabel(order.status)}
                           </div>
                           <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">ID: {order.id.slice(-8).toUpperCase()}</h4>
                        </div>
                        <div className="text-right">
                           <p className="text-2xl font-black text-slate-800 tracking-tighter">${Number(order.total_amount).toLocaleString()}</p>
                           <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1 block">紅利已發放</span>
                        </div>
                     </div>

                     {/* Visual Timeline */}
                     <div className="space-y-3">
                        <div className="flex justify-between text-[8px] font-black text-slate-300 uppercase tracking-widest">
                           <span>下單成功</span>
                           <span>物流配送</span>
                           <span>簽收完成</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden flex gap-1">
                           <div className={`h-full rounded-full transition-all duration-1000 ${order.status ? 'bg-emerald-500 w-1/3' : 'bg-slate-100 w-1/3'}`}></div>
                           <div className={`h-full rounded-full transition-all duration-1000 ${['shipped', 'completed'].includes(order.status) ? 'bg-emerald-500 w-1/3' : 'bg-slate-100 w-1/3'}`}></div>
                           <div className={`h-full rounded-full transition-all duration-1000 ${order.status === 'completed' ? 'bg-emerald-500 w-1/3' : 'bg-slate-100 w-1/3'}`}></div>
                        </div>
                     </div>

                     <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                        <div className="flex items-center gap-3">
                           <Clock className="w-4 h-4 text-slate-300" />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {new Date(order.created_at).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                        <button className="bg-slate-50 text-slate-900 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-900 hover:text-white transition flex items-center gap-2">
                           訂單詳情 <ChevronRight className="w-4 h-4" />
                        </button>
                     </div>
                  </motion.div>
                ))}
             </div>
           )
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
