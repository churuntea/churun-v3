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
  Sparkles,
  Award,
  Zap,
  ShoppingBag
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const NEWS_DATA: any = {
  "spring-tea": {
    title: "春季極萃紅茶正式上市",
    date: "2026年5月02日",
    tag: "NEW",
    color: "emerald",
    image: "/spring_tea_premium_banner_1777786729443.png",
    content: `
      在春意盎然的五月，初潤製茶所為您獻上本年度最值得期待的精品 —— 「春季極萃紅茶」。

      我們走訪全台海拔 1200 公尺以上的秘密茶園，嚴選在晨露未乾時手採的嫩芽。透過初潤獨家的「低溫慢火極萃工藝」，完整保留了茶葉中的天然多酚與甘甜層次。

      **【品飲筆記】**
      - **前調**：清透的野薑花香。
      - **中調**：厚實的成熟果實甜味。
      - **尾韻**：如絲絨般的琥珀回甘，久久不散。

      即日起，所有會員皆可透過商城進行預購，菁英等級以上夥伴更可享有獨家折扣與優先出貨權。
    `,
    action: { label: "立即前往商城選購", href: "/store" }
  },
  "dividend-plan": {
    title: "年度分紅計畫已開啟審核",
    date: "2026年5月01日",
    tag: "INFO",
    color: "amber",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800",
    content: `
      初潤的成功，來自於每一位夥伴的辛勤耕耘。我們很高興宣布，2026年度的「全國分紅計畫」已正式啟動審核程序。

      本次分紅計畫將針對達到「初潤知己」以上職級的夥伴進行利潤分配。系統將自動計算您團隊的季度總業績，並根據職級權重進行紅利撥放。

      **【重要時程】**
      - **審核期**：5月1日 - 5月10日
      - **公告期**：5月12日
      - **撥放期**：5月15日自動轉入您的虛擬帳戶。

      請各位領導者務必在 5月10日前完成下線組織的最終確認，確保每一份努力都得到應有的回報。
    `,
    action: { label: "查看我的組織業績", href: "/organization" }
  },
  "taipei-event": {
    title: "全台夥伴大會 5/20 台北場",
    date: "2026年4月28日",
    tag: "EVENT",
    color: "indigo",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800",
    content: `
      這不只是一場大會，而是一次夢想的啟航。

      我們邀請全台灣的初潤夥伴匯聚台北，共同見證品牌下一階段的全球布局計畫。創辦人將親自分享年度戰略，並舉辦盛大的職級晉升儀式。

      **【活動資訊】**
      - **地點**：台北萬豪酒店 大宴會廳
      - **時間**：2026年5月20日 13:00 - 17:30
      - **報名方式**：請洽您的上線推薦人或點擊下方按鈕預約。

      現場將首度公開年度隱藏版產品，並有機會獲得高額團隊積分獎勵！
    `,
    action: { label: "立即預約席次", href: "/support" }
  }
};

export default function NewsDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const news = NEWS_DATA[id] || NEWS_DATA["spring-tea"];

  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-32">
      
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
         <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent"></div>
         
         <nav className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-10">
            <button onClick={() => router.back()} className="w-12 h-12 bg-white/80 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-sm border border-white">
               <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex gap-4">
               <button className="w-12 h-12 bg-white/80 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-sm border border-white">
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
           <div className="bg-slate-50 rounded-[3rem] p-10 border border-slate-100 flex items-center gap-8 group">
              <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-sm group-hover:rotate-6 transition">
                 <Award className="w-10 h-10 text-emerald-600" />
              </div>
              <div className="space-y-1">
                 <h4 className="text-xl font-black text-slate-800 tracking-tight">精品保證</h4>
                 <p className="text-xs text-slate-400 font-medium">所有產品皆通過 SGS 最高規格安全檢驗。</p>
              </div>
           </div>
        </section>

        {/* Interactive Stats */}
        <div className="flex items-center justify-between py-12 border-y border-slate-50">
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
                   <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
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
         <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto grayscale opacity-50">
            <span className="text-slate-400 font-black text-sm tracking-tighter">CR</span>
         </div>
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">
            CHURUN TEA HOUSE PHILOSOPHY
         </p>
      </footer>
    </div>
  );
}
