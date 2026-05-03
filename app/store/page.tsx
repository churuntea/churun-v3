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
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState("全部商品");

  useEffect(() => {
    // Force cache break
    const currentVersion = "1.1.0";
    const savedVersion = localStorage.getItem("churun_store_version");
    if (savedVersion !== currentVersion) {
      localStorage.setItem("churun_store_version", currentVersion);
      window.location.reload();
      return;
    }

    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    fetchData(savedId);
  }, [router]);

  useEffect(() => {
    if (selectedCategory === "全部商品") {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => p.category === selectedCategory));
    }
  }, [selectedCategory, products]);

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    const { data: mData } = await supabase.from("members").select("*").eq("id", userId).single();
    setMemberInfo(mData);

    const { data: pData } = await supabase.from("products").select("*").eq("status", "active");
    setProducts(pData || []);
    setFilteredProducts(pData || []);
    setIsLoading(false);
  };

  const categories = ["全部商品", "極萃系列", "精品茶具", "典藏禮盒"];

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-50 px-8 py-6 flex justify-between items-center max-w-lg mx-auto">
        <h1 className="text-sm font-black tracking-[0.3em] text-slate-800 uppercase flex items-center gap-2">
           精品嚴選商城 <span className="text-[7px] bg-emerald-50 px-2 py-1 rounded-full text-emerald-600 border border-emerald-100 font-bold">V1.1.0</span>
        </h1>
        <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
           <Search className="w-4 h-4" />
        </div>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-10 mt-4">
        
        {/* Category Tabs */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
           {categories.map((cat) => (
             <button 
               key={cat}
               onClick={() => setSelectedCategory(cat)}
               className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                 selectedCategory === cat ? 'bg-emerald-900 text-white shadow-xl shadow-emerald-900/20 scale-105' : 'bg-white text-slate-400 border border-slate-50 hover:bg-slate-50'
               }`}
             >
                {cat}
             </button>
           ))}
        </div>

        {/* Point Balance Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-mesh-emerald rounded-[3rem] p-10 text-white shadow-2xl shadow-emerald-900/20 flex justify-between items-center relative overflow-hidden"
        >
           <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
           <div className="space-y-1 relative z-10">
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/40">可用紅利點數</p>
              <h2 className="text-3xl font-black">{memberInfo?.points_balance?.toLocaleString() || 0} <span className="text-xs font-medium ml-1">pts</span></h2>
           </div>
           <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/10 shadow-inner">
              <Star className="w-8 h-8 text-amber-300 fill-current" />
           </div>
        </motion.div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 gap-12">
           {isLoading ? (
             <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-slate-200" /></div>
           ) : filteredProducts.length === 0 ? (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="bg-white rounded-[3.5rem] p-20 text-center border border-slate-50"
             >
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                   <ShoppingBag className="w-8 h-8 text-slate-200" />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2">精品整備中</h3>
                <p className="text-xs text-slate-400 font-medium">該分類的嚴選商品即將上架，敬請期待。</p>
                <button 
                  onClick={() => setSelectedCategory("全部商品")}
                  className="mt-8 text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b-2 border-emerald-600 pb-1"
                >
                   查看所有商品
                </button>
             </motion.div>
           ) : (
             filteredProducts.map((product, i) => (
               <motion.div 
                 key={product.id}
                 layout
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: i * 0.05 }}
                 className="group relative"
               >
                <div className="bg-white rounded-[3.5rem] overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.05)] border border-slate-50 relative flex flex-col">
                   {/* Product Image Area */}
                   <div className="aspect-[4/4] w-full bg-slate-50 relative overflow-hidden">
                      <img 
                        src={product.image_url || "https://images.unsplash.com/photo-1544787210-2213d2427384?w=800&q=80"} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-1000"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>
                      
                      {/* Floating Badges */}
                      <div className="absolute top-8 left-8 flex flex-col gap-2">
                         <div className="bg-emerald-900/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-lg">
                            <span className="text-[9px] font-black tracking-widest text-white uppercase">Premium</span>
                         </div>
                         {product.b2c_reward_percent >= 10 && (
                           <div className="bg-amber-500/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-lg flex items-center gap-2">
                              <Zap className="w-3 h-3 text-white fill-current animate-pulse" />
                              <span className="text-[9px] font-black tracking-widest text-white uppercase">High Reward</span>
                           </div>
                         )}
                      </div>
                   </div>
                   
                   {/* Product Info Area */}
                   <div className="p-12 space-y-8">
                      <div className="flex justify-between items-start">
                         <div className="space-y-3">
                            <h3 className="text-3xl font-black text-slate-800 tracking-tighter leading-none">{product.name}</h3>
                            <div className="flex items-center gap-3">
                               <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">回饋 {product.b2c_reward_percent}%</span>
                               <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">SGS Certified</span>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-3xl font-black text-slate-900 tracking-tighter">${Number(product.price).toLocaleString()}</p>
                            {product.original_price && <p className="text-xs text-slate-300 line-through mt-1">${product.original_price}</p>}
                         </div>
                      </div>

                      <p className="text-sm text-slate-400 leading-relaxed font-medium line-clamp-2">
                         源自海拔 1200 公尺以上高山茶園，經由初潤極致工藝烘焙，保留茶葉最原始的清香與甘甜回韻。
                      </p>

                      <div className="pt-8 border-t border-slate-50 flex items-center justify-between gap-6">
                         <div className="flex -space-x-3">
                            {[1,2,3].map(j => (
                              <div key={j} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden">
                                 <img src={`https://i.pravatar.cc/100?u=${product.id}${j}`} alt="buyer" />
                              </div>
                            ))}
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-900 flex items-center justify-center">
                               <span className="text-[8px] font-black text-white">+12</span>
                            </div>
                         </div>
                         <button className="flex-1 bg-slate-900 text-white px-10 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:bg-emerald-900 transition-all flex items-center justify-center gap-3 active:scale-95 group">
                            加入購物車 <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
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
