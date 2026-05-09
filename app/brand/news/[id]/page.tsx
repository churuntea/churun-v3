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
  Check
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
  const [isLiked, setIsLiked] = useState(false);
  const [copied, setCopied] = useState(false);

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
           className="w-10 h-10 bg-white hover:bg-slate-50 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 active:scale-95 transition text-slate-500"
         >
            <ArrowLeft className="w-4 h-4" />
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
        <div className="relative aspect-[1.8/1] sm:aspect-[2.1/1] w-full overflow-hidden rounded-[2.5rem] shadow-lg border border-slate-100 group">
           {news.image ? (
              <img 
                 src={news.image} 
                 className="w-full h-full object-cover group-hover:scale-102 transition-all duration-700"
                 alt={news.title}
                 onError={(e) => {
                   // If image breaks, fallback elegantly to null to display the premium brand gradient
                   setNews((prev: any) => ({ ...prev, image: null }));
                 }}
              />
           ) : (
              /* High-End Brand Gradient Fallback with minimalist watermark */
              <div className="w-full h-full bg-gradient-to-tr from-emerald-950 via-emerald-900 to-amber-700 flex flex-col justify-between p-8 relative">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.08),transparent)]"></div>
                 <div className="flex justify-between items-start relative z-10">
                    <span className="text-[8px] font-black text-amber-400 border border-amber-400/30 px-2.5 py-1 rounded-full uppercase tracking-widest">
                       Official Announcement
                    </span>
                    <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                 </div>
                 <div className="relative z-10 text-left">
                    <p className="text-[10px] font-black tracking-[0.4em] text-white/50 uppercase">Churun Tea House</p>
                    <p className="text-[13px] font-bold text-amber-100 tracking-wider mt-1">{news.title}</p>
                 </div>
                 {/* Minimalist Watermark LOGO */}
                 <div className="absolute right-6 bottom-4 text-white/5 font-black text-6xl tracking-tighter select-none">
                    CR
                 </div>
              </div>
           )}
        </div>

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

        {/* Interactive mock engagement stats to maintain social premium touch */}
        <div className="flex items-center justify-between py-6 border-y border-slate-100/80 text-left">
           <div className="flex items-center gap-6">
              <button 
                onClick={() => {
                  setIsLiked(!isLiked);
                  triggerToast(isLiked ? "💔 已取消按讚" : "💖 感謝您的認同與喜愛！");
                }} 
                className="flex items-center gap-2 group"
              >
                 <Heart className={`w-5 h-5 transition ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-300 group-hover:text-rose-500'}`} />
                 <span className="text-[11px] font-bold text-slate-400">1,248</span>
              </button>
              <div className="flex items-center gap-2 group">
                 <MessageCircle className="w-5 h-5 text-slate-300" />
                 <span className="text-[11px] font-bold text-slate-400">86</span>
              </div>
           </div>
           <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                 {[1,2,3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm shrink-0">
                       <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
                    </div>
                 ))}
              </div>
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">已有 48 位夥伴轉發</span>
           </div>
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
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-5 rounded-2xl font-black text-xs tracking-[0.2em] flex items-center justify-center gap-2 transition"
              >
                 <ArrowLeft className="w-4 h-4 text-slate-400" />
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
