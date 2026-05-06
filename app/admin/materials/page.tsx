"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ImageIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  X,
  Eye,
  Video,
  FileText,
  Copy,
  Save,
  Link as LinkIcon
} from "lucide-react";

function AdminMaterialsContent() {
  const router = useRouter();
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState<any>({
    title: "",
    category: "品牌主視覺",
    url: "",
    file_type: "image",
    description: ""
  });

  useEffect(() => {
    const isAdmin = sessionStorage.getItem("churun_admin_auth");
    if (!isAdmin) {
      router.replace("/admin");
      return;
    }
    fetchMaterials();
  }, [router]);

  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/materials");
      const data = await res.json();
      if (data.success) {
        setMaterials(data.materials);
      }
    } catch (err) { console.error(err); }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!currentMaterial.title || !currentMaterial.url) return alert("請輸入標題與連結");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentMaterial)
      });
      const data = await res.json();
      if (data.success) {
        alert("素材已儲存！");
        setIsEditing(false);
        setCurrentMaterial({ title: "", category: "品牌主視覺", url: "", file_type: "image", description: "" });
        fetchMaterials();
      } else {
        alert("儲存失敗: " + data.error);
      }
    } catch (err: any) { alert("系統錯誤: " + err.message); }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除此素材嗎？")) return;
    try {
      const res = await fetch("/api/materials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) fetchMaterials();
    } catch (err: any) { alert("系統錯誤: " + err.message); }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="w-5 h-5" />;
      case "text": return <FileText className="w-5 h-5" />;
      default: return <ImageIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      
      <nav className="bg-emerald-900 text-white sticky top-0 z-50 px-8 py-6 flex items-center justify-between shadow-xl">
         <div className="flex items-center gap-6">
            <button onClick={() => router.push("/admin")} className="p-2 -ml-2 text-white/40 hover:text-white transition">
               <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-black tracking-[0.3em] uppercase">品牌素材管理中心</h1>
         </div>
         <button 
           onClick={() => {
             setCurrentMaterial({ title: "", category: "品牌主視覺", url: "", file_type: "image", description: "" });
             setIsEditing(true);
           }}
           className="bg-white text-emerald-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg active:scale-95 transition"
         >
            <Plus className="w-4 h-4" /> 上傳新素材
         </button>
      </nav>

      <main className="max-w-5xl mx-auto p-10 space-y-10">
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
             <Loader2 className="w-10 h-10 animate-spin text-slate-200" />
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">載入素材中...</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-50 shadow-sm">
             <ImageIcon className="w-16 h-16 text-slate-100 mx-auto mb-4" />
             <p className="text-sm font-bold text-slate-300">目前尚無素材，請點擊上方按鈕新增</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {materials.map((item, i) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-[2.5rem] p-6 border border-slate-50 shadow-sm flex flex-col group hover:shadow-xl transition-all duration-500"
              >
                 <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.file_type === 'image' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                          {getIcon(item.file_type)}
                       </div>
                       <div>
                          <h4 className="font-black text-slate-800 tracking-tight">{item.title}</h4>
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">{item.category}</p>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => { setCurrentMaterial(item); setIsEditing(true); }} className="p-3 text-slate-300 hover:text-emerald-600 transition"><Edit3 className="w-4 h-4" /></button>
                       <button onClick={() => handleDelete(item.id)} className="p-3 text-slate-300 hover:text-rose-500 transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                 </div>

                 {item.file_type === 'image' && (
                    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-50 mb-4 border border-slate-100">
                       <img src={item.url} className="w-full h-full object-cover" alt="" />
                    </div>
                 )}

                 {item.description && (
                    <p className="text-xs text-slate-400 font-medium mb-4 line-clamp-2 italic">「 {item.description} 」</p>
                 )}

                 <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{new Date(item.created_at).toLocaleDateString()}</span>
                    <a href={item.url} target="_blank" className="text-[8px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1 hover:underline">
                       <LinkIcon className="w-3 h-3" /> 查看原始檔案
                    </a>
                 </div>
              </motion.div>
            ))}
          </div>
        )}

      </main>

      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditing(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" />
             <motion.div 
               initial={{ scale: 0.9, y: 20, opacity: 0 }}
               animate={{ scale: 1, y: 0, opacity: 1 }}
               exit={{ scale: 0.9, y: 20, opacity: 0 }}
               className="bg-white rounded-[3rem] p-10 w-full max-w-xl shadow-2xl space-y-8 relative overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar"
             >
                <div className="flex justify-between items-center">
                   <h3 className="text-2xl font-black text-slate-900">編輯素材內容</h3>
                   <button onClick={() => setIsEditing(false)} className="p-2 bg-slate-50 rounded-xl"><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">素材名稱</label>
                      <input type="text" value={currentMaterial.title} onChange={e => setCurrentMaterial({...currentMaterial, title: e.target.value})} className="w-full bg-slate-50 border-none p-5 rounded-2xl text-sm font-bold" />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">分類類別</label>
                         <select value={currentMaterial.category} onChange={e => setCurrentMaterial({...currentMaterial, category: e.target.value})} className="w-full bg-slate-50 border-none p-5 rounded-2xl text-sm font-bold">
                            <option>品牌主視覺</option>
                            <option>商品宣傳圖</option>
                            <option>社群分享文案</option>
                            <option>教育訓練影片</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">檔案類型</label>
                         <select value={currentMaterial.file_type} onChange={e => setCurrentMaterial({...currentMaterial, file_type: e.target.value})} className="w-full bg-slate-50 border-none p-5 rounded-2xl text-sm font-bold">
                            <option value="image">圖片 (Image)</option>
                            <option value="video">影片 (Video)</option>
                            <option value="text">文案 (Text)</option>
                            <option value="pdf">文件 (PDF)</option>
                         </select>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">檔案連結 (URL)</label>
                      <input type="text" value={currentMaterial.url} onChange={e => setCurrentMaterial({...currentMaterial, url: e.target.value})} className="w-full bg-slate-50 border-none p-5 rounded-2xl text-sm font-bold" placeholder="https://..." />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">描述 / 文案內容</label>
                      <textarea rows={4} value={currentMaterial.description} onChange={e => setCurrentMaterial({...currentMaterial, description: e.target.value})} className="w-full bg-slate-50 border-none p-5 rounded-2xl text-sm font-bold" placeholder="輸入素材描述或直接貼入社群文案..." />
                   </div>
                </div>

                <button 
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="w-full bg-emerald-900 text-white py-6 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition flex items-center justify-center gap-3"
                >
                   {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 儲存素材資訊
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function AdminMaterials() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-900" /></div>}>
      <AdminMaterialsContent />
    </Suspense>
  );
}
