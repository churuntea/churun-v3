"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { 
  Image as ImageIcon, 
  ChevronRight, 
  LayoutDashboard, 
  ShoppingBag, 
  Plus, 
  Zap, 
  User, 
  Loader2,
  Download,
  ExternalLink,
  Star
} from "lucide-react";

const MATERIAL_CATEGORIES = [
  { id: 1, name: "品牌主視覺", count: 12, icon: Star, color: "bg-amber-100 text-amber-600" },
  { id: 2, name: "商品宣傳圖", count: 45, icon: ShoppingBag, color: "bg-emerald-100 text-emerald-600" },
  { id: 3, name: "社群分享文案", count: 28, icon: Zap, color: "bg-indigo-100 text-indigo-600" },
];

function MaterialsContent() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    setCurrentUserId(savedId);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-50 px-6 py-4 flex justify-between items-center max-w-lg mx-auto">
        <h1 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">宣傳素材庫</h1>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-8 mt-2">
        
        {/* Banner */}
        <section className="bg-emerald-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-900/20">
           <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/5 blur-2xl"></div>
           <div className="relative z-10 flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md">
                 <ImageIcon className="w-8 h-8 text-emerald-200" />
              </div>
              <div>
                 <h2 className="text-xl font-bold tracking-tight">數位素材中心</h2>
                 <p className="text-xs text-white/40 mt-1">下載官方圖檔與文案，輕鬆分享初潤美學。</p>
              </div>
           </div>
        </section>

        {/* Categories */}
        <div className="space-y-4">
           {MATERIAL_CATEGORIES.map((cat) => (
             <div key={cat.id} className="bg-white rounded-[2.5rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-slate-50 flex items-center gap-5 group hover:border-emerald-100 transition duration-500 cursor-pointer">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${cat.color}`}>
                   <cat.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                   <h4 className="font-bold text-slate-800">{cat.name}</h4>
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">{cat.count} 個資源</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-emerald-500 transition" />
             </div>
           ))}
        </div>

        {/* Featured Material */}
        <div className="space-y-4 pt-4">
           <h3 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase px-2">本週推薦素材</h3>
           <div className="bg-white rounded-[3rem] overflow-hidden shadow-sm border border-slate-50">
              <div className="aspect-video w-full bg-slate-100 relative">
                 <img src="https://images.unsplash.com/photo-1544787210-2213d2427384?w=800&q=80" alt="Featured" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
              </div>
              <div className="p-8 flex justify-between items-center">
                 <div>
                    <h4 className="font-bold text-slate-800">2026 春季形象主圖</h4>
                    <p className="text-xs text-slate-400 mt-1">適合用於 IG / FB 貼文分享</p>
                 </div>
                 <button className="w-12 h-12 bg-emerald-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/20 active:scale-90 transition">
                    <Download className="w-5 h-5" />
                 </button>
              </div>
           </div>
        </div>

      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 z-50">
         <div className="bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] p-3 flex justify-between items-center shadow-2xl shadow-slate-900/30 border border-white/5">
            <Link href="/" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <LayoutDashboard className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">首頁</span>
            </Link>
            <Link href="/store" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <ShoppingBag className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">商城</span>
            </Link>
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 -mt-8 border-4 border-[#FDFBF7]">
               <Plus className="w-6 h-6 text-white" />
            </div>
            <Link href="/organization" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <Zap className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">組織</span>
            </Link>
            <Link href="/profile" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <User className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">我的</span>
            </Link>
         </div>
      </div>
    </div>
  );
}

export default function Materials() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-900" /></div>}>
      <MaterialsContent />
    </Suspense>
  );
}
