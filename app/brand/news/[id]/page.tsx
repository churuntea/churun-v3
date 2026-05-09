"use client";

import { use, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Calendar, 
  Tag, 
  Share2, 
  Heart, 
  MessageCircle, 
  ChevronRight,
  Award,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/supabase";

export default function NewsDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  
  const [news, setNews] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      // Try to fetch from Supabase
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("id", id)
        .single();
      
      if (data) {
        setNews({
          title: data.title,
          date: new Date(data.created_at).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' }),
          tag: data.tag,
          color: data.color.includes('emerald') ? 'emerald' : data.color.includes('amber') ? 'amber' : 'indigo',
          image: data.image_url || "/spring_tea_premium_banner_1777786729443.png",
          content: data.content,
          action: { 
            label: data.action_label || "立即查看", 
            href: data.action_href || "/" 
          }
        });
      } else {
        // Fallback or Error
        console.error("News not found", error);
      }
      setIsLoading(false);
    };

    fetchNews();
  }, [id]);

  if (isLoading) return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>;
  
  if (!news) return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-8 text-center space-y-6">
       <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-inner border border-slate-50">
          <Tag className="w-10 h-10 text-slate-200" />
       </div>
       <h1 className="text-2xl font-black text-slate-800">找不到此快訊</h1>
       <button onClick={() => router.back()} className="text-emerald-600 font-bold">返回上一頁</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 pb-32">
      
      {/* Hero Header */}
      <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden">
         <motion.img 
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10 }}
            src={news.image} 
            className="w-full h-full object-cover"
            alt={news.title}
         />
         <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7]/20 to-transparent"></div>
         
         <nav className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-10">
            <button onClick={() => router.back()} className="w-12 h-12 bg-white/80 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-sm border border-white active:scale-95 transition">
               <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex gap-4">
               <button className="w-12 h-12 bg-white/80 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-sm border border-white active:scale-95 transition">
                  <Share2 className="w-5 h-5 text-slate-600" />
               </button>
            </div>
         </nav>

         <div className="absolute bottom-12 left-8 right-8 space-y-4">
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-lg ${
                news.color === 'emerald' ? 'bg-emerald-900' : 
                news.color === 'amber' ? 'bg-amber-600' : 'bg-indigo-600'
              }`}
            >
               {news.tag}
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-black text-slate-900 tracking-tighter leading-tight"
            >
               {news.title}
            </motion.h1>
            <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
               <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> {news.date}
               </div>
               <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" /> OFFICIAL NEWS
               </div>
            </div>
         </div>
      </div>

      <main className="max-w-2xl mx-auto px-8 pt-12 space-y-12">
        
        {/* Content Body */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="prose prose-slate max-w-none"
        >
           <div className="text-lg text-slate-600 leading-loose whitespace-pre-line font-medium">
              {news.content}
           </div>
        </motion.div>

        {/* Feature Cards in News */}
        <section className="grid grid-cols-1 gap-6 pt-12">
           <div className="bg-white rounded-[3rem] p-10 border border-slate-100 flex items-center gap-8 group shadow-sm hover:shadow-lg transition duration-500">
              <div className="w-20 h-20 bg-[#FDFBF7] rounded-[2rem] flex items-center justify-center shadow-inner border border-slate-50 group-hover:rotate-6 transition duration-500">
                 <Award className="w-10 h-10 text-emerald-600" />
              </div>
              <div className="space-y-1">
                 <h4 className="text-xl font-black text-slate-800 tracking-tight">精品保證</h4>
                 <p className="text-xs text-slate-400 font-medium">所有產品皆通過 SGS 最高規格安全檢驗。</p>
              </div>
           </div>
        </section>

        {/* Interactive Stats */}
        <div className="flex items-center justify-between py-12 border-y border-slate-100">
           <div className="flex items-center gap-10">
              <button onClick={() => setIsLiked(!isLiked)} className="flex items-center gap-2 group">
                 <Heart className={`w-6 h-6 transition ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-300 group-hover:text-rose-500'}`} />
                 <span className="text-xs font-bold text-slate-400">1.2k</span>
              </button>
              <div className="flex items-center gap-2 group">
                 <MessageCircle className="w-6 h-6 text-slate-300 group-hover:text-indigo-500 transition" />
                 <span className="text-xs font-bold text-slate-400">86</span>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                 {[1,2,3].map(i => (
                   <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                      <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
                   </div>
                 ))}
              </div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">已有 48 位夥伴轉發</span>
           </div>
        </div>

        {/* CTA Button */}
        <Link href={news.action.href}>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-emerald-900 text-white py-8 rounded-[2.5rem] font-black text-sm tracking-[0.2em] shadow-2xl shadow-emerald-900/30 flex items-center justify-center gap-4 group"
          >
             {news.action.label} <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </motion.button>
        </Link>

      </main>

      {/* Footer Branding */}
      <footer className="mt-20 py-20 text-center space-y-6">
         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto grayscale opacity-50 shadow-sm border border-slate-100">
            <span className="text-slate-400 font-black text-sm tracking-tighter">CR</span>
         </div>
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">
            CHURUN TEA HOUSE PHILOSOPHY
         </p>
      </footer>
    </div>
  );
}
