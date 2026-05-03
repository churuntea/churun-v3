"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentNews, setCurrentNews] = useState({
    title: "",
    tag: "NEW",
    color: "bg-emerald-900"
  });

  useEffect(() => {
    const isAdmin = sessionStorage.getItem("churun_admin_auth");
    if (!isAdmin) {
      router.replace("/admin");
      return;
    }
    fetchNews();
  }, [router]);

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/announcements");
      const data = await res.json();
      if (data.success) {
        setNews(data.announcements);
      }
    } catch (err) { console.error(err); }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!currentNews.title) return alert("請輸入標題");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentNews)
      });
      const data = await res.json();
      if (data.success) {
        alert("公告已成功發布！");
        setIsEditing(false);
        setCurrentNews({ title: "", tag: "NEW", color: "bg-emerald-900" });
        fetchNews();
      } else {
        alert("發布失敗: " + data.error);
      }
    } catch (err: any) { alert("系統錯誤: " + err.message); }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除此公告嗎？")) return;
    try {
      const res = await fetch("/api/announcements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) fetchNews();
    } catch (err: any) { alert("系統錯誤: " + err.message); }
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case "NEW": return "bg-emerald-900";
      case "INFO": return "bg-amber-600";
      case "EVENT": return "bg-indigo-600";
      default: return "bg-slate-400";
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      
      <nav className="bg-slate-900 text-white sticky top-0 z-50 px-8 py-6 flex items-center justify-between shadow-xl">
         <div className="flex items-center gap-6">
            <button onClick={() => router.push("/admin")} className="p-2 -ml-2 text-white/40 hover:text-white transition">
               <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-black tracking-[0.3em] uppercase">品牌快訊管理系統</h1>
         </div>
         <button 
           onClick={() => setIsEditing(true)}
           className="bg-white text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg active:scale-95 transition"
         >
            <Plus className="w-4 h-4" /> 發布新公告
         </button>
      </nav>

      <main className="max-w-3xl mx-auto p-10 space-y-10">
        
        <div className="space-y-4">
           {isLoading ? (
             <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-slate-200" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">正在載入公告資料...</p>
             </div>
           ) : news.length === 0 ? (
             <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-50 shadow-sm">
                <Megaphone className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                <p className="text-sm font-bold text-slate-300">目前尚無發布公告</p>
             </div>
           ) : news.map((item, i) => (
             <motion.div 
               key={item.id}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.05 }}
               className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm flex items-center justify-between group hover:shadow-xl hover:shadow-slate-200/20 transition-all duration-500"
             >
                <div className="flex items-center gap-8">
                   <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors duration-500">
                      <Megaphone className="w-6 h-6" />
                   </div>
                   <div className="space-y-2">
                      <div className="flex items-center gap-4">
                         <span className={`px-4 py-1.5 rounded-full text-[8px] font-black text-white uppercase tracking-widest ${getTagColor(item.tag)}`}>
                            {item.tag}
                         </span>
                         <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                            {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase()}
                         </span>
                      </div>
                      <h4 className="text-lg font-black text-slate-800 tracking-tight">{item.title}</h4>
                   </div>
                </div>
                
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition duration-300">
                   <button 
                     onClick={() => handleDelete(item.id)}
                     className="p-4 bg-slate-50 text-rose-300 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition"
                   >
                      <Trash2 className="w-5 h-5" />
                   </button>
                </div>
             </motion.div>
           ))}
        </div>

      </main>

      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsEditing(false)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
             />
             <motion.div 
               initial={{ scale: 0.9, y: 20, opacity: 0 }}
               animate={{ scale: 1, y: 0, opacity: 1 }}
               exit={{ scale: 0.9, y: 20, opacity: 0 }}
               className="bg-white rounded-[4rem] p-12 w-full max-w-lg shadow-2xl space-y-10 relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
                
                <div className="flex justify-between items-center relative">
                   <h3 className="text-3xl font-black text-slate-900 tracking-tighter">發布品牌動態</h3>
                   <button onClick={() => setIsEditing(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-300 hover:text-slate-900 transition"><X className="w-6 h-6" /></button>
                </div>

                <div className="space-y-8 relative">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-[0.2em]">公告標題</label>
                      <input 
                        type="text" 
                        value={currentNews.title}
                        onChange={e => setCurrentNews({...currentNews, title: e.target.value})}
                        placeholder="例如：春季新品上市..." 
                        className="w-full bg-slate-50 border-none p-6 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition shadow-inner"
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-[0.2em]">標籤類別</label>
                      <div className="grid grid-cols-3 gap-4">
                         {["NEW", "INFO", "EVENT"].map(tag => (
                            <button 
                              key={tag}
                              onClick={() => setCurrentNews({...currentNews, tag})}
                              className={`py-4 rounded-2xl text-[10px] font-black tracking-widest transition-all ${currentNews.tag === tag ? getTagColor(tag) + ' text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                            >
                               {tag}
                            </button>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="pt-6 relative">
                   <button 
                     onClick={handleSave}
                     disabled={isSubmitting}
                     className="w-full bg-slate-900 text-white py-7 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-slate-900/20 active:scale-[0.98] transition flex items-center justify-center gap-3"
                   >
                      {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "立即發布品牌快訊"}
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function AdminNews() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-900" /></div>}>
      <AdminNewsContent />
    </Suspense>
  );
}
