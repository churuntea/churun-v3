"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseAdmin as supabase } from "@/app/supabase-admin";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  X,
  Eye
} from "lucide-react";

function AdminNewsContent() {
  const router = useRouter();
  const [news, setNews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentNews, setCurrentNews] = useState({
    title: "",
    tag: "NEW",
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase()
  });

  useEffect(() => {
    const isAdmin = sessionStorage.getItem("is_admin");
    if (!isAdmin) router.push("/admin");
    fetchNews();
  }, [router]);

  const fetchNews = async () => {
    // 這裡我們先用模擬數據，之後可以對接資料庫表 'announcements'
    // 目前我們先實作介面與邏輯
    const mockNews = [
      { id: 1, title: "春季極萃紅茶正式上市", date: "MAY 02", tag: "NEW", color: "bg-emerald-900" },
      { id: 2, title: "年度分紅計畫已開啟審核", date: "MAY 01", tag: "INFO", color: "bg-amber-600" }
    ];
    setNews(mockNews);
    setIsLoading(false);
  };

  const handleSave = () => {
    // 實作保存邏輯
    setIsEditing(false);
    alert("公告已成功發布！");
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      
      {/* Admin Nav */}
      <nav className="bg-slate-900 text-white sticky top-0 z-50 px-8 py-6 flex items-center justify-between">
         <div className="flex items-center gap-6">
            <Link href="/admin" className="p-2 -ml-2 text-white/40 hover:text-white transition">
               <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-sm font-black tracking-[0.3em] uppercase">品牌快訊管理系統</h1>
         </div>
         <button 
           onClick={() => setIsEditing(true)}
           className="bg-emerald-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-500/20"
         >
            <Plus className="w-4 h-4" /> 發布新公告
         </button>
      </nav>

      <main className="max-w-3xl mx-auto p-8 space-y-8">
        
        {/* News List */}
        <div className="space-y-4">
           {isLoading ? (
             <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-200" /></div>
           ) : news.map((item, i) => (
             <motion.div 
               key={item.id}
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex items-center justify-between group"
             >
                <div className="flex items-center gap-6">
                   <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                      <Megaphone className="w-6 h-6" />
                   </div>
                   <div className="space-y-1">
                      <div className="flex items-center gap-3">
                         <span className={`px-3 py-1 rounded-full text-[8px] font-black text-white uppercase tracking-widest ${item.color}`}>
                            {item.tag}
                         </span>
                         <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{item.date}</span>
                      </div>
                      <h4 className="font-bold text-slate-800">{item.title}</h4>
                   </div>
                </div>
                
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                   <button className="p-4 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-900 transition"><Edit3 className="w-4 h-4" /></button>
                   <button className="p-4 bg-slate-50 text-rose-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition"><Trash2 className="w-4 h-4" /></button>
                </div>
             </motion.div>
           ))}
        </div>

      </main>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6"
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               exit={{ scale: 0.9, y: 20 }}
               className="bg-white rounded-[3rem] p-12 w-full max-w-lg shadow-2xl space-y-10"
             >
                <div className="flex justify-between items-center">
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight">發布品牌動態</h3>
                   <button onClick={() => setIsEditing(false)} className="p-2 text-slate-300 hover:text-slate-900 transition"><X className="w-6 h-6" /></button>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">公告標題</label>
                      <input 
                        type="text" 
                        value={currentNews.title}
                        onChange={e => setCurrentNews({...currentNews, title: e.target.value})}
                        placeholder="例如：春季新品上市..." 
                        className="w-full bg-slate-50 border-none p-6 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/10 transition"
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">標籤類別</label>
                         <select 
                           value={currentNews.tag}
                           onChange={e => setCurrentNews({...currentNews, tag: e.target.value})}
                           className="w-full bg-slate-50 border-none p-6 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/10 transition appearance-none"
                         >
                            <option value="NEW">NEW (最新)</option>
                            <option value="INFO">INFO (重要)</option>
                            <option value="EVENT">EVENT (活動)</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">顯示日期</label>
                         <input type="text" value={currentNews.date} className="w-full bg-slate-100 border-none p-6 rounded-2xl text-sm font-bold text-slate-400" disabled />
                      </div>
                   </div>
                </div>

                <div className="pt-6">
                   <button 
                     onClick={handleSave}
                     className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-xl shadow-slate-900/20 active:scale-95 transition"
                   >
                      立即發布快訊
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function AdminNews() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-900" /></div>}>
      <AdminNewsContent />
    </Suspense>
  );
}
