"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { motion } from "framer-motion";
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  ChevronRight, 
  LayoutDashboard, 
  Zap, 
  User, 
  Plus, 
  Star,
  Loader2,
  ArrowUpRight
} from "lucide-react";

function StoreContent() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [memberInfo, setMemberInfo] = useState<any>(null);

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    fetchData(savedId);
  }, [router]);

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    const { data: mData } = await supabase.from("members").select("*").eq("id", userId).single();
    setMemberInfo(mData);

    const { data: pData } = await supabase.from("products").select("*").eq("status", "active");
    setProducts(pData || []);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-50 px-8 py-6 flex justify-between items-center max-w-lg mx-auto">
        <h1 className="text-sm font-black tracking-[0.3em] text-slate-800 uppercase">精品嚴選商城</h1>
        <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
           <Search className="w-4 h-4" />
        </div>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-10 mt-4">
        
        {/* Point Balance Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-slate-900/20 flex justify-between items-center relative overflow-hidden"
        >
           <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
           <div className="space-y-1 relative z-10">
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/40">您的紅利餘額</p>
              <h2 className="text-3xl font-black">{memberInfo?.points_balance?.toLocaleString() || 0} <span className="text-xs font-medium ml-1">pts</span></h2>
           </div>
           <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Star className="w-8 h-8 text-white fill-current" />
           </div>
        </motion.div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 gap-10">
           {isLoading ? (
             <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-slate-200" /></div>
           ) : products.map((product, i) => (
             <motion.div 
               key={product.id}
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               className="group"
             >
                <div className="bg-white rounded-[3.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-50 relative">
                   <div className="aspect-[4/5] w-full bg-slate-50 relative overflow-hidden">
                      <img 
                        src={product.image_url || "https://images.unsplash.com/photo-1544787210-2213d2427384?w=800&q=80"} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-1000"
                      />
                      <div className="absolute top-8 left-8">
                         <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                            <span className="text-[10px] font-black tracking-widest text-emerald-900 uppercase">Premium Selection</span>
                         </div>
                      </div>
                   </div>
                   
                   <div className="p-10 space-y-6">
                      <div className="flex justify-between items-start">
                         <div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{product.name}</h3>
                            <p className="text-xs text-slate-400 mt-2">點數回饋高達 {product.b2c_reward_percent}%</p>
                         </div>
                         <div className="text-right">
                            <p className="text-2xl font-black text-emerald-600">${product.price}</p>
                            {product.original_price && <p className="text-xs text-slate-300 line-through mt-1">${product.original_price}</p>}
                         </div>
                      </div>

                      <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                               <Zap className="w-4 h-4 text-amber-500 fill-current" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">限量供應</span>
                         </div>
                         <button className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 active:scale-95 transition">
                            立即購買 <ArrowUpRight className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                </div>
             </motion.div>
           ))}
        </div>

      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 z-50">
         <div className="bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] p-3 flex justify-between items-center shadow-2xl shadow-slate-900/30 border border-white/5">
            <Link href="/" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <LayoutDashboard className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Dashboard</span>
            </Link>
            <Link href="/store" className="flex-1 flex flex-col items-center gap-1 text-white transition">
               <ShoppingBag className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Shop</span>
            </Link>
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 -mt-8 border-4 border-[#FDFBF7]">
               <Plus className="w-6 h-6 text-white" />
            </div>
            <Link href="/organization" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <Zap className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Team</span>
            </Link>
            <Link href="/profile" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <User className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Me</span>
            </Link>
         </div>
      </div>
    </div>
  );
}

export default function Store() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>}>
      <StoreContent />
    </Suspense>
  );
}
