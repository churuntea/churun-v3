"use client";

import { use, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Calendar, 
  Tag, 
  Share2, 
  Heart, 
  MessageCircle, 
  ChevronRight,
  Award,
  Loader2,
  Sparkles,
  Megaphone,
  Home,
  Check,
  X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/supabase";
import Toast, { ToastType } from "@/components/Toast";

export default function NewsDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  
  const [news, setNews] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(1248);
  const [copied, setCopied] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([
    { id: 1, user: "茶友阿明", text: "這款茶葉真的很讚！回甘強烈。", time: "2 小時前" },
    { id: 2, user: "林小姐", text: "包裝非常有質感，送禮很適合。", time: "5 小時前" }
  ]);

  // Toast States
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string, type: ToastType = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
  };

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("announcements")
          .select("*")
          .eq("id", id)
          .single();
        
        if (data) {
          // Safeguard color extraction from null values
          const colorStr = data.color || 'bg-emerald-900';
          const resolvedColor = colorStr.includes('emerald') ? 'emerald' : colorStr.includes('amber') ? 'amber' : 'indigo';

          setNews({
            title: data.title,
            date: new Date(data.created_at).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' }),
            tag: data.tag || "NEW",
            color: resolvedColor,
            image: data.image_url || null,
            content: data.content || "",
            action: { 
              label: data.action_label || "立即查看", 
              href: data.action_href || "/" 
            }
          });
        } else {
          console.error("News not found", error);
        }
      } catch (err) {
        console.error("Fetch news error", err);
      }
      setIsLoading(false);
    };

    fetchNews();
  }, [id]);

  useEffect(() => {
    if (isZoomed) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isZoomed]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      triggerToast("📋 連結已成功複製，快分享給合作夥伴與好友吧！", "success");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-900" />
      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">正在為您加載品牌脈動...</p>
    </div>
  );
  
  if (!news) return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-8 text-center space-y-6">
       <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-inner border border-slate-50">
          <Tag className="w-10 h-10 text-slate-200 animate-pulse" />
       </div>
       <div className="space-y-2">
          <h1 className="text-xl font-black text-slate-800">找不到此品牌脈動消息</h1>
          <p className="text-xs text-slate-400 font-bold">該公告可能已被總部移除或變更網址。</p>
       </div>
       <button 
         onClick={() => router.push("/")} 
         className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black tracking-widest transition"
       >
          返回首頁
       </button>
    </div>
  );

  const getTagBgColor = (tag: string) => {
    switch (tag) {
      case "NEW": return "bg-emerald-900";
      case "INFO": return "bg-amber-600";
      case "EVENT": return "bg-indigo-600";
      default: return "bg-slate-500";
    }
  };

  // Determine if this is a custom action or just a fallback redirect to homepage
  const isCustomAction = news.action.href && news.action.href !== "/";

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 pb-32">
      
      {/* Dynamic Header Sticky Navigation Bar */}
      <nav className="sticky top-0 z-[60] bg-[#FDFBF7]/90 backdrop-blur-xl border-b border-slate-100/80 px-6 py-4 flex justify-between items-center max-w-2xl mx-auto">
         <button 
           onClick={() => router.back()} 
           className="w-12 h-12 bg-white hover:bg-slate-900 hover:text-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 active:scale-90 transition-all duration-300 text-slate-500 group"
         >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
         </button>
         <div>
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-slate-800">初潤品牌脈動</span>
         </div>
         <button 
           onClick={handleShare}
           className="w-10 h-10 bg-white hover:bg-slate-50 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 active:scale-95 transition text-slate-500"
         >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
         </button>
      </nav>

      {/* Main Magazine Style Body */}
      <main className="max-w-xl mx-auto px-6 pt-10 space-y-8">
        
        {/* Article Metadata & Header Info */}
        <div className="space-y-4 text-left">
           <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-[8px] font-black text-white uppercase tracking-widest ${getTagBgColor(news.tag)}`}>
                 {news.tag}
              </span>
              <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 <Calendar className="w-3.5 h-3.5" /> {news.date}
              </div>
           </div>

           <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              {news.title}
           </h1>
        </div>

        {/* Article COVER IMAGE or premium BRAND FALLBACK GRADIENT */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="relative w-full overflow-hidden rounded-[3rem] shadow-2xl border border-slate-100 group bg-slate-50 cursor-zoom-in"
          onClick={() => news?.image && setIsZoomed(true)}
        >
           {news.image ? (
              <div className="relative group">
                <img 
                   src={news.image} 
                   className="w-full h-auto object-contain group-hover:brightness-105 transition-all duration-700"
                   alt={news.title}
                   onError={(e) => {
                     // If image breaks, fallback elegantly to null to display the premium brand gradient
                     setNews((prev: any) => ({ ...prev, image: null }));
                   }}
                />
                {isCustomAction && (
                  <Link href={news.action.href} className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-full text-[10px] font-black text-slate-900 uppercase tracking-widest shadow-xl flex items-center gap-2">
                       {news.action.label} <ChevronRight className="w-4 h-4" />
                    </span>
                  </Link>
                )}
              </div>
           ) : (
              /* High-End Brand Gradient Fallback with minimalist watermark */
              <div className="w-full h-64 bg-gradient-to-tr from-emerald-950 via-emerald-900 to-amber-700 flex flex-col justify-between p-10 relative">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.08),transparent)]"></div>
                 <div className="flex justify-between items-start relative z-10">
                    <span className="text-[10px] font-black text-amber-400 border border-amber-400/30 px-3 py-1.5 rounded-full uppercase tracking-widest">
                       Official Announcement
                    </span>
                    <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                 </div>
                 <div className="relative z-10 text-left">
                    <p className="text-[11px] font-black tracking-[0.4em] text-white/50 uppercase">Churun Tea House</p>
                    <p className="text-sm font-bold text-amber-100 tracking-wider mt-2">{news.title}</p>
                 </div>
                 {/* Minimalist Watermark LOGO */}
                 <div className="absolute right-8 bottom-6 text-white/5 font-black text-7xl tracking-tighter select-none">
                    CR
                 </div>
              </div>
           )}
           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 pointer-events-none" />
        </motion.div>

        {/* Article Body Content */}
        <div className="prose prose-slate max-w-none text-left">
           {news.content ? (
              <div className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line font-medium py-2">
                 {news.content}
              </div>
           ) : (
              <div className="text-xs text-slate-300 font-bold italic py-8 text-center border border-dashed border-slate-200 rounded-2xl">
                 （此快訊僅發布標題公告，暫無詳細內文描述）
              </div>
           )}
        </div>

        {/* Interactive engagement stats */}
        <div className="flex flex-col py-6 border-y border-slate-100/80 space-y-6 text-left">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <button 
                   onClick={() => {
                     if (!isLiked) {
                       setLikeCount(prev => prev + 1);
                       triggerToast("💖 感謝您的認同與喜愛！");
                     } else {
                       setLikeCount(prev => prev - 1);
                       triggerToast("💔 已取消按讚");
                     }
                     setIsLiked(!isLiked);
                   }} 
                   className="flex items-center gap-3 p-2 -m-2 group transition-all active:scale-90"
                 >
                    <Heart className={`w-5 h-5 transition-all duration-300 ${isLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-slate-300 group-hover:text-rose-500'}`} />
                    <span className={`text-[11px] font-bold ${isLiked ? 'text-rose-500' : 'text-slate-400'}`}>{likeCount.toLocaleString()}</span>
                 </button>
                 <button 
                   onClick={() => setShowCommentInput(!showCommentInput)}
                   className="flex items-center gap-3 p-2 -m-2 group transition-all active:scale-90"
                 >
                    <MessageCircle className={`w-5 h-5 transition-all ${showCommentInput ? 'text-emerald-600 fill-emerald-50' : 'text-slate-300 group-hover:text-emerald-600'}`} />
                    <span className={`text-[11px] font-bold ${showCommentInput ? 'text-emerald-600' : 'text-slate-400'}`}>{comments.length + 84}</span>
                 </button>
              </div>
              <div className="flex items-center gap-3">
                 <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                       <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm shrink-0">
                          <img src={`https://i.pravatar.cc/100?u=${i + 10}`} alt="user" />
                       </div>
                    ))}
                 </div>
                 <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">已有 48 位夥伴轉發</span>
              </div>
           </div>

           {/* Comment Input & List Area */}
           <AnimatePresence>
              {(showCommentInput || comments.length > 0) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 overflow-hidden"
                >
                   {/* Input Box */}
                   <div className="bg-slate-50 rounded-2xl p-4 flex gap-3 border border-slate-100">
                      <div className="w-8 h-8 rounded-full bg-emerald-900 flex items-center justify-center text-white text-[10px] font-black shrink-0">
                         ME
                      </div>
                      <div className="flex-1 space-y-3">
                         <textarea 
                           value={newComment}
                           onChange={(e) => setNewComment(e.target.value)}
                           placeholder="也分享您的看法與心得吧..."
                           rows={2}
                           className="w-full bg-transparent border-none text-sm font-bold focus:ring-0 resize-none p-0 placeholder:text-slate-300"
                         />
                         <div className="flex justify-end">
                            <button 
                              onClick={() => {
                                if (!newComment.trim()) return;
                                setComments(prev => [{
                                  id: Date.now(),
                                  user: "您",
                                  text: newComment,
                                  time: "剛剛"
                                }, ...prev]);
                                setNewComment("");
                                triggerToast("🚀 留言成功！");
                              }}
                              disabled={!newComment.trim()}
                              className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition active:scale-95"
                            >
                               送出留言
                            </button>
                         </div>
                      </div>
                   </div>

                   {/* Comments List */}
                   <div className="space-y-4">
                      {comments.map(comment => (
                        <div key={comment.id} className="flex gap-3">
                           <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0">
                              <img src={`https://i.pravatar.cc/100?u=${comment.id}`} alt="" />
                           </div>
                           <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                 <span className="text-xs font-black text-slate-800">{comment.user}</span>
                                 <span className="text-[9px] font-bold text-slate-300">{comment.time}</span>
                              </div>
                              <p className="text-xs text-slate-500 font-medium leading-relaxed bg-white/50 p-3 rounded-2xl border border-slate-50">
                                 {comment.text}
                              </p>
                           </div>
                        </div>
                      ))}
                   </div>
                </motion.div>
              )}
           </AnimatePresence>
        </div>

        {/* CTA Actions Redirect Panel */}
        <div className="pt-2">
           {isCustomAction ? (
              /* Primary Custom CTA (e.g. going to a business landing page like /wholesale or /store) */
              <div className="space-y-4">
                <Link href={news.action.href}>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-emerald-900 hover:bg-emerald-800 text-white py-5 rounded-[2rem] font-black text-xs tracking-[0.2em] shadow-xl shadow-emerald-900/15 flex items-center justify-center gap-2 group transition"
                  >
                     {news.action.label} 
                     <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
                <button 
                  onClick={() => router.back()} 
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-4.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition"
                >
                   返回上一頁
                </button>
              </div>
           ) : (
              /* Clean outlined Back button taking reader back to where they came from */
              <button 
                onClick={() => router.back()} 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-6 rounded-[2rem] font-black text-xs tracking-[0.3em] flex items-center justify-center gap-3 transition shadow-2xl shadow-slate-900/10 active:scale-98"
              >
                 <ArrowLeft className="w-5 h-5" />
                 返回上一頁
              </button>
           )}
        </div>

      </main>

      {/* Footer Branding */}
      <footer className="mt-16 py-12 text-center space-y-4 border-t border-slate-100/50 max-w-xl mx-auto">
         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto grayscale opacity-40 shadow-sm border border-slate-100">
            <span className="text-slate-400 font-black text-xs tracking-tighter">CR</span>
         </div>
         <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em] leading-relaxed">
            CHURUN TEA HOUSE PHILOSOPHY
         </p>
      </footer>

      {/* Lightbox for zooming image */}
      <AnimatePresence>
        {isZoomed && news?.image && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setIsZoomed(false)}
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={news.image}
              className="max-w-full max-h-full object-contain rounded-2xl"
              alt={news.title}
            />
            <button
              onClick={(e) => { e.stopPropagation(); setIsZoomed(false); }}
              className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium feedback toast notifications */}
      <Toast 
        message={toastMsg}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

    </div>
  );
}
