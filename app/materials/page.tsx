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

function MaterialsContent() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("全部");

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    setCurrentUserId(savedId);
    fetchMaterials();
  }, [router]);

  const fetchMaterials = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("materials").select("*").order("created_at", { ascending: false });
    if (data) {
      setMaterials(data);
    }
    setIsLoading(false);
  };

  const categories = ["全部", ...Array.from(new Set(materials.map(m => m.category)))];
  const filteredMaterials = activeCategory === "全部" 
    ? materials 
    : materials.filter(m => m.category === activeCategory);

  const featuredMaterial = materials[0];

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-50 px-6 py-8 flex justify-between items-center max-w-lg mx-auto">
         <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
               <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <h1 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">宣傳素材庫</h1>
         </div>
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

        {/* Category Filter */}
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
           {categories.map(cat => (
             <button 
               key={cat}
               onClick={() => setActiveCategory(cat)}
               className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition ${
                 activeCategory === cat ? 'bg-emerald-900 text-white shadow-lg shadow-emerald-900/20' : 'bg-white text-slate-400 border border-slate-100'
               }`}
             >
                {cat}
             </button>
           ))}
        </div>

        {/* Materials List */}
        <div className="grid grid-cols-1 gap-6">
           {isLoading ? (
             <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>
           ) : filteredMaterials.length === 0 ? (
             <div className="py-20 text-center bg-white rounded-[3rem] border border-slate-50">
                <p className="text-xs font-bold text-slate-300">目前尚無此分類素材</p>
             </div>
           ) : filteredMaterials.map((mat) => (
             <div key={mat.id} className="bg-white rounded-[3rem] overflow-hidden shadow-sm border border-slate-50 group">
                <div className="aspect-video w-full bg-slate-100 relative overflow-hidden">
                   <img 
                     src={mat.thumbnail_url || mat.url} 
                     alt={mat.title} 
                     className="w-full h-full object-cover group-hover:scale-105 transition duration-700" 
                   />
                   <div className="absolute top-4 left-4 px-3 py-1 bg-white/80 backdrop-blur-md rounded-full text-[8px] font-black text-emerald-900 uppercase tracking-widest shadow-sm">
                      {mat.category}
                   </div>
                </div>
                <div className="p-8 flex justify-between items-center">
                   <div>
                      <h4 className="font-bold text-slate-800">{mat.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{mat.description || '官方授權推廣素材'}</p>
                   </div>
                   <a 
                     href={mat.url} 
                     download 
                     target="_blank"
                     rel="noopener noreferrer"
                     className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition"
                   >
                      <Download className="w-5 h-5" />
                   </a>
                </div>
             </div>
           ))}
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
