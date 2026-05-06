"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";
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
  Star,
  ArrowLeft,
  Copy,
  Sparkles
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
  const [activeTab, setActiveTab] = useState<"visual" | "copy">("visual");

  const filteredMaterials = materials.filter(m => {
    const matchesCategory = activeCategory === "全部" || m.category === activeCategory;
    const matchesTab = activeTab === "visual" 
      ? m.file_type === "image" || m.file_type === "video"
      : m.file_type === "text";
    return matchesCategory && matchesTab;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("文案已複製到剪貼簿！");
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      <nav className="bg-white/90 backdrop-blur-3xl sticky top-0 z-50 border-b border-slate-100 px-8 py-6 flex justify-between items-center max-w-lg mx-auto">
         <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-slate-50 rounded-full transition">
               <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div>
               <h1 className="text-sm font-black tracking-[0.3em] text-slate-800 uppercase">品牌素材中心</h1>
               <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Marketing Hub</p>
            </div>
         </div>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-8 mt-2">
        
        {/* Content Type Tabs */}
        <div className="flex p-2 bg-slate-100 rounded-3xl gap-2">
           <button 
             onClick={() => setActiveTab("visual")}
             className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'visual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
           >
              視覺素材
           </button>
           <button 
             onClick={() => setActiveTab("copy")}
             className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'copy' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
           >
              社群文案
           </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar px-2">
           <Link 
              href="/?tool=poster"
              className="px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-2"
            >
               <Sparkles className="w-3 h-3" /> 專屬海報生成器
            </Link>
            {categories.map(cat => (
             <button 
               key={cat}
               onClick={() => setActiveCategory(cat)}
               className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition ${
                 activeCategory === cat ? 'bg-emerald-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'
               }`}
             >
                {cat}
             </button>
           ))}
        </div>

        {/* Dynamic Materials Grid */}
        <div className="space-y-6">
           {isLoading ? (
             <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>
           ) : filteredMaterials.length === 0 ? (
             <div className="py-20 text-center bg-white rounded-[3.5rem] border border-slate-50 shadow-sm">
                <ImageIcon className="w-12 h-12 text-slate-100 mx-auto mb-6" />
                <p className="text-xs font-black text-slate-300 uppercase tracking-widest">目前尚無素材內容</p>
             </div>
           ) : activeTab === "visual" ? (
             <div className="grid grid-cols-1 gap-6">
               {filteredMaterials.map((mat) => (
                 <motion.div 
                   key={mat.id} 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="bg-white rounded-[3.5rem] overflow-hidden shadow-sm border border-slate-50 group hover:border-emerald-200 transition-all duration-500"
                 >
                    <div className="aspect-[4/3] w-full bg-slate-50 relative overflow-hidden">
                       <img 
                         src={mat.thumbnail_url || mat.url} 
                         alt={mat.title} 
                         className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" 
                       />
                       <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl text-[8px] font-black text-emerald-900 uppercase tracking-widest shadow-xl">
                          {mat.category}
                       </div>
                    </div>
                    <div className="p-8 flex justify-between items-center">
                       <div className="space-y-1">
                          <h4 className="font-black text-slate-800 text-lg tracking-tight">{mat.title}</h4>
                          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Official Assets</p>
                       </div>
                       <a 
                         href={mat.url} 
                         download 
                         target="_blank"
                         rel="noopener noreferrer"
                         className="w-14 h-14 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-slate-900/20 active:scale-90 transition"
                       >
                          <Download className="w-6 h-6" />
                       </a>
                    </div>
                 </motion.div>
               ))}
             </div>
           ) : (
             <div className="space-y-4">
               {filteredMaterials.map((mat) => (
                 <motion.div 
                   key={mat.id}
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm space-y-6"
                 >
                    <div className="flex justify-between items-center">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                             <Star className="w-4 h-4" />
                          </div>
                          <h4 className="font-black text-slate-800 tracking-tight">{mat.title}</h4>
                       </div>
                       <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{mat.category}</span>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-6 text-xs text-slate-500 leading-relaxed font-medium whitespace-pre-wrap italic">
                       {mat.description}
                    </div>
                    <button 
                      onClick={() => handleCopy(mat.description)}
                      className="w-full bg-slate-900 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 active:scale-95 transition"
                    >
                       <Copy className="w-4 h-4" /> 複製推廣文案
                    </button>
                 </motion.div>
               ))}
             </div>
           )}
        </div>

      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-8 left-4 right-4 z-50 mx-auto max-w-sm">
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
