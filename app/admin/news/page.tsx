"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Loader2, 
  X,
  MegaphoneOff,
  Edit,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import Toast, { ToastType } from "../../../components/Toast";

function AdminNewsContent() {
  const router = useRouter();
  const [news, setNews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [currentNews, setCurrentNews] = useState({
    id: "",
    title: "",
    tag: "NEW",
    color: "bg-emerald-900",
    content: "",
    image_url: "",
    action_label: "立即查看",
    action_href: "/"
  });

  // Toast States
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");
  const [showToast, setShowToast] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const triggerToast = (msg: string, type: ToastType = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
  };

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
    } catch (err) { 
      console.error(err); 
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!currentNews.title) {
      triggerToast("請輸入公告標題", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const isEdit = !!currentNews.id;
      const res = await fetch("/api/announcements", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentNews)
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(isEdit ? "🎉 品牌脈動公告已成功修改！" : "🎉 品牌脈動公告已成功發布！", "success");
        setIsEditing(false);
        setCurrentNews({ id: "", title: "", tag: "NEW", color: "bg-emerald-900", content: "", image_url: "", action_label: "立即查看", action_href: "/" });
        fetchNews();
      } else {
        triggerToast((isEdit ? "修改失敗: " : "發布失敗: ") + data.error, "error");
      }
    } catch (err: any) { 
      triggerToast("系統錯誤: " + err.message, "error"); 
    }
    setIsSubmitting(false);
  };

  const executeDelete = async () => {
    if (!deleteTargetId) return;
    try {
      const res = await fetch("/api/announcements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTargetId })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("🎉 公告已成功刪除！", "success");
        fetchNews();
      } else {
        triggerToast("刪除失敗: " + data.error, "error");
      }
    } catch (err: any) { 
      triggerToast("系統錯誤: " + err.message, "error"); 
    }
    setDeleteTargetId(null);
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case "NEW": return "bg-emerald-900";
      case "INFO": return "bg-amber-600";
      case "EVENT": return "bg-indigo-600";
      default: return "bg-slate-400";
    }
  };

  // Drag and Drop files handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      triggerToast("請提供圖檔格式檔案 (jpg, png, webp...)", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCurrentNews(prev => ({ ...prev, image_url: event.target!.result as string }));
        triggerToast("📸 本地封面圖讀取完畢，送出時將自動編碼上傳！");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const isLocalBase64 = currentNews.image_url?.startsWith("data:image");

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      
      {/* Top Navbar */}
      <nav className="bg-slate-900 text-white sticky top-0 z-50 px-8 py-6 flex items-center justify-between shadow-xl">
         <div className="flex items-center gap-6">
            <button onClick={() => router.push("/admin")} className="p-2 -ml-2 text-white/40 hover:text-white transition">
               <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
               <h1 className="text-sm font-black tracking-[0.3em] uppercase">初潤品牌脈動管理中心</h1>
               <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Brand Pulse Announce Desk</p>
            </div>
         </div>
         <button 
           onClick={() => {
              setCurrentNews({ id: "", title: "", tag: "NEW", color: "bg-emerald-900", content: "", image_url: "", action_label: "立即查看", action_href: "/" });
              setIsEditing(true);
            }}
           className="bg-indigo-600 text-white hover:bg-indigo-500 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition"
         >
            <Plus className="w-4 h-4" /> 新增品牌脈動公告
         </button>
      </nav>

      <main className="max-w-3xl mx-auto p-10 space-y-10">
        
        <div className="space-y-4">
           {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                 <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">正在載入公告消息...</p>
              </div>
           ) : news.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-50 shadow-sm flex flex-col items-center justify-center space-y-4">
                 <MegaphoneOff className="w-16 h-16 text-slate-100 animate-bounce" />
                 <p className="text-xs font-bold text-slate-300">目前尚無品牌脈動公告，快點選右上角建立吧！</p>
              </div>
           ) : (
             news.map((item, i) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:shadow-xl hover:shadow-slate-200/20 transition-all duration-500"
              >
                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 flex-1">
                    {/* Thumbnail Image Preview */}
                    <div className="w-20 h-20 bg-slate-50 rounded-[1.8rem] overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-100 shadow-inner group-hover:scale-105 transition-all duration-500">
                       {item.image_url ? (
                          <img src={item.image_url} className="w-full h-full object-cover" alt="thumbnail" />
                       ) : (
                          <Megaphone className="w-6 h-6 text-slate-300" />
                       )}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                       <div className="flex items-center gap-3 flex-wrap">
                          <span className={`px-4 py-1.5 rounded-full text-[8px] font-black text-white uppercase tracking-widest ${getTagColor(item.tag)}`}>
                             {item.tag}
                          </span>
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                             {new Date(item.created_at).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                          {item.action_href && (
                             <span className="bg-slate-50 text-[8px] font-black text-slate-400 px-3 py-1 rounded-full uppercase tracking-widest border border-slate-100/50">
                                🔗 {item.action_label || '立即查看'} ({item.action_href})
                             </span>
                          )}
                       </div>
                       <h4 className="text-lg font-black text-slate-800 tracking-tight leading-snug truncate">{item.title}</h4>
                       {item.content && (
                          <p className="text-xs font-bold text-slate-400 line-clamp-2 leading-relaxed max-w-xl">
                             {item.content}
                          </p>
                       )}
                    </div>
                 </div>
                 
                 {/* Action Buttons */}
                 <div className="flex items-center gap-2 self-end md:self-auto shrink-0 border-t md:border-t-0 pt-4 md:pt-0 w-full md:w-auto justify-end">
                    <button 
                      onClick={() => {
                        setCurrentNews({
                          id: item.id,
                          title: item.title,
                          tag: item.tag || "NEW",
                          color: item.color || "bg-emerald-900",
                          content: item.content || "",
                          image_url: item.image_url || "",
                          action_label: item.action_label || "立即查看",
                          action_href: item.action_href || "/"
                        });
                        setIsEditing(true);
                      }}
                      className="p-4 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-2xl active:scale-95 transition flex items-center justify-center"
                      title="修改公告"
                    >
                       <Edit className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setDeleteTargetId(item.id)}
                      className="p-4 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-2xl active:scale-95 transition flex items-center justify-center"
                      title="刪除公告"
                    >
                       <Trash2 className="w-5 h-5" />
                    </button>
                 </div>
              </motion.div>
             ))
           )}
        </div>

      </main>

      {/* Editor Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => { if (!isSubmitting) setIsEditing(false); }}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
             />
             <motion.div 
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="bg-white rounded-[3.5rem] p-10 w-full max-w-lg shadow-2xl space-y-6 relative max-h-[92vh] overflow-y-auto no-scrollbar border border-slate-100"
                onClick={e => e.stopPropagation()}
              >
                 <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
                 
                 <div className="flex justify-between items-center relative">
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 tracking-tight">編輯品牌脈動消息</h3>
                       <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Publish Brand Pulse News</p>
                    </div>
                    <button 
                      disabled={isSubmitting} 
                      onClick={() => setIsEditing(false)} 
                      className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-300 hover:text-slate-900 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                 </div>

                 <div className="space-y-5 relative">
                    
                    {/* Title */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-[0.2em]">公告標題</label>
                       <input 
                         type="text" 
                         value={currentNews.title}
                         onChange={e => setCurrentNews({...currentNews, title: e.target.value})}
                         placeholder="例如：初潤最新概念大師店正式開幕！" 
                         className="w-full bg-slate-50 border-none p-5 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition shadow-inner"
                         required
                       />
                    </div>
                    
                    {/* Tag Type Selector */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-[0.2em]">公告標籤屬性</label>
                       <div className="grid grid-cols-3 gap-3">
                          {["NEW", "INFO", "EVENT"].map(tag => (
                             <button 
                               key={tag}
                               type="button"
                               onClick={() => setCurrentNews({...currentNews, tag})}
                               className={`py-3.5 rounded-2xl text-[10px] font-black tracking-widest transition-all ${currentNews.tag === tag ? getTagColor(tag) + ' text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                             >
                                {tag}
                             </button>
                          ))}
                       </div>
                    </div>

                    {/* DUAL-SOURCE COVER IMAGE PORTAL */}
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-[0.2em]">公告封面圖設定 (選填)</label>
                       
                       <div className="grid grid-cols-1 gap-4">
                          {/* File Drag and Drop box */}
                          <div 
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('news_file_upload')?.click()}
                            className={`border-2 border-dashed rounded-[2rem] p-6 text-center cursor-pointer transition relative flex flex-col items-center justify-center gap-3 ${
                              dragActive ? "border-indigo-500 bg-indigo-50/20" : "border-slate-200 bg-slate-50/40 hover:bg-slate-50"
                            }`}
                          >
                             <input 
                               type="file" 
                               id="news_file_upload"
                               onChange={handleFileSelection}
                               className="hidden" 
                               accept="image/*"
                             />
                             {currentNews.image_url ? (
                                <div className="space-y-3">
                                   <div className="w-32 h-20 bg-white rounded-2xl overflow-hidden mx-auto border border-slate-100 shadow-md">
                                      <img src={currentNews.image_url} className="w-full h-full object-cover" alt="cover preview" />
                                   </div>
                                   <div className="flex items-center justify-center gap-1.5 text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                                      {isLocalBase64 ? <CheckCircle className="w-4.5 h-4.5 text-emerald-500" /> : <LinkIcon className="w-4 h-4 text-indigo-500" />}
                                      <span>{isLocalBase64 ? "已就緒本地圖片" : "已匯入雲端連結"}</span>
                                   </div>
                                </div>
                             ) : (
                                <>
                                   <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                                      <Upload className="w-5 h-5 animate-bounce" />
                                   </div>
                                   <div>
                                      <p className="text-xs font-black text-slate-800">拖放圖片到此處，或點擊瀏覽電腦</p>
                                      <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Supports JPG, PNG, WEBP up to 5MB</p>
                                   </div>
                                </>
                             )}
                          </div>

                          {/* Direct image url input */}
                          <div className="relative">
                             <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
                                <LinkIcon className="w-4 h-4" />
                             </div>
                             <input 
                               type="text" 
                               value={isLocalBase64 ? "" : currentNews.image_url}
                               onChange={e => setCurrentNews({...currentNews, image_url: e.target.value})}
                               placeholder="或者，您也可以直接貼上網頁圖片連結..." 
                               disabled={isLocalBase64}
                               className="w-full bg-slate-50 border-none p-4.5 pl-12 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none shadow-inner disabled:opacity-50"
                             />
                             {isLocalBase64 && (
                                <button 
                                  type="button"
                                  onClick={() => setCurrentNews(prev => ({ ...prev, image_url: "" }))}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 rounded-xl text-[8px] font-black uppercase tracking-wider transition"
                                >
                                   清除本地圖片
                                </button>
                             )}
                          </div>
                       </div>
                    </div>

                    {/* News Content Markdown/Text Area */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-[0.2em]">公告詳細內文</label>
                       <textarea 
                         value={currentNews.content}
                         onChange={e => setCurrentNews({...currentNews, content: e.target.value})}
                         placeholder="請輸入公告詳細內文描述與具體消息內容..." 
                         rows={5}
                         className="w-full bg-slate-50 border-none p-5 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 transition shadow-inner resize-none leading-relaxed"
                       />
                    </div>

                    {/* Action button link redirection redirection redirections */}
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-[0.2em]">按鈕文字 (選填)</label>
                          <input 
                            type="text" 
                            value={currentNews.action_label}
                            onChange={e => setCurrentNews({...currentNews, action_label: e.target.value})}
                            placeholder="預設：立即查看" 
                            className="w-full bg-slate-50 border-none p-4 rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 transition shadow-inner"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-[0.2em]">按鈕連結網址 (選填)</label>
                          <input 
                            type="text" 
                            value={currentNews.action_href}
                            onChange={e => setCurrentNews({...currentNews, action_href: e.target.value})}
                            placeholder="例如：/store 或 /wholesale" 
                            className="w-full bg-slate-50 border-none p-4 rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 transition shadow-inner"
                          />
                       </div>
                    </div>
                 </div>

                 <div className="pt-4 border-t border-slate-100 flex gap-3">
                    <button 
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 rounded-xl font-black text-[10px] uppercase tracking-widest transition text-slate-500"
                    >
                       取消返回
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={isSubmitting}
                      className="flex-1 bg-slate-900 text-white hover:bg-slate-800 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-900/15 active:scale-[0.98] transition flex items-center justify-center gap-2"
                    >
                       {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "確認儲存發布 ✓"}
                    </button>
                 </div>
              </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTargetId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setDeleteTargetId(null)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
             />
             <motion.div 
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="bg-white rounded-[3rem] p-10 w-full max-w-sm shadow-2xl text-center relative overflow-hidden"
              >
                 <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trash2 className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-black text-slate-800 mb-2">確定刪除公告？</h3>
                 <p className="text-xs text-slate-400 font-bold leading-relaxed mb-8">此操作將永久移除此公告，團隊成員與貴賓將無法再看到此內容。</p>
                 <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setDeleteTargetId(null)} 
                      className="py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition"
                    >
                       取消返回
                    </button>
                    <button 
                      onClick={executeDelete} 
                      className="py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition shadow-lg shadow-rose-600/10"
                    >
                       確認刪除 ✕
                    </button>
                 </div>
              </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Feedback */}
      <Toast 
        message={toastMsg}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

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
