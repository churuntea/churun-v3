"use client";

import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Sparkles, 
  Leaf, 
  Droplets, 
  Sun, 
  Zap,
  ChevronRight,
  ShieldCheck,
  Award
} from "lucide-react";
import Link from "next/link";

export default function BrandStory() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8 } }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 pb-32 selection:bg-emerald-100">
      
      {/* Dynamic Aura Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <motion.div 
           animate={{ 
             scale: [1, 1.2, 1],
             rotate: [0, 90, 0],
             opacity: [0.3, 0.5, 0.3]
           }}
           transition={{ duration: 20, repeat: Infinity }}
           className="absolute -top-1/4 -right-1/4 w-full h-full bg-emerald-50 rounded-full blur-[120px]"
         />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-8 flex justify-between items-center max-w-2xl mx-auto">
         <Link href="/" className="w-12 h-12 bg-white/70 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-sm border border-white">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
         </Link>
         <div className="bg-emerald-900 px-4 py-2 rounded-xl shadow-xl shadow-emerald-900/20">
            <span className="text-white font-black text-[10px] tracking-[0.3em] uppercase">Brand Legacy</span>
         </div>
      </nav>

      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-2xl mx-auto px-8 pt-40 relative z-10 space-y-40"
      >
        
        {/* Hero Section */}
        <motion.section variants={itemVariants} className="space-y-12 text-center">
           <div className="w-24 h-24 bg-emerald-900 rounded-[2.5rem] flex items-center justify-center mx-auto mb-16 shadow-2xl shadow-emerald-900/30">
              <span className="text-white font-black text-3xl tracking-tighter">CR</span>
           </div>
           <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-tight">
              茶與人的<br/>
              <span className="text-emerald-600">純粹對話</span>
           </h1>
           <p className="text-xl text-slate-400 font-medium max-w-lg mx-auto leading-relaxed">
              在快節奏的時代，我們選擇慢下來，用一盞茶的時間，尋找生活最初的潤澤。
           </p>
        </motion.section>

        {/* Three Pillars */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-12">
           {[
             { icon: Leaf, title: "極萃工藝", desc: "嚴選海拔 1200 公尺以上手採茶青，堅持低溫萃取。" },
             { icon: Droplets, title: "回甘之境", desc: "無添加人工香料，保留茶葉最原始的清甜與層次。" },
             { icon: Sun, title: "數位新生", desc: "將傳統茶藝注入數位靈魂，開創公平且優雅的分潤體系。" }
           ].map((p, i) => (
             <motion.div key={i} variants={itemVariants} className="space-y-6 text-center md:text-left">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm mx-auto md:mx-0">
                   <p.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-800">{p.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">{p.desc}</p>
             </motion.div>
           ))}
        </section>

        {/* Philosophy Card */}
        <motion.section variants={itemVariants} className="relative">
           <div className="absolute inset-0 bg-emerald-900 rounded-[4rem] rotate-2 scale-105 opacity-5"></div>
           <div className="relative bg-white rounded-[4rem] p-16 shadow-xl border border-slate-50 space-y-8">
              <Sparkles className="w-10 h-10 text-amber-400" />
              <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                 為什麼我們<br/>
                 打造這個系統？
              </h2>
              <div className="space-y-6">
                 <p className="text-lg text-slate-500 leading-relaxed">
                    初潤的數位系統不只是一個商城，它是為了 **「讓價值被看見」** 而生。我們相信每一位推廣者都應該像茶葉一樣，經過歲月的淬煉後，散發出最迷人的香氣。
                 </p>
                 <p className="text-lg text-slate-500 leading-relaxed">
                    透過公平透明的自動結算、精英等級的尊榮權益，我們讓喝茶變成一種優雅的事業。
                 </p>
              </div>
              <div className="pt-10 flex items-center gap-6">
                 <div className="flex items-center gap-3 bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Security Verified</span>
                 </div>
                 <div className="flex items-center gap-3 bg-amber-50 px-6 py-3 rounded-2xl border border-amber-100">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Quality Excellence</span>
                 </div>
              </div>
           </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section variants={itemVariants} className="text-center space-y-12 pb-20">
           <div className="w-16 h-1 w-16 bg-slate-100 mx-auto rounded-full"></div>
           <h3 className="text-2xl font-black text-slate-800 tracking-tight">準備好開啟您的初潤之旅了嗎？</h3>
           <Link href="/register" className="inline-flex items-center gap-4 bg-emerald-900 text-white px-12 py-7 rounded-[2.5rem] font-black text-sm tracking-[0.2em] shadow-2xl shadow-emerald-900/30 hover:scale-105 transition-transform active:scale-95 group">
              立即加入團隊 <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
           </Link>
        </motion.section>

      </motion.main>

      <footer className="text-center py-20 border-t border-slate-50">
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">
            © 2026 CHURUN TEA HOUSE PHILOSOPHY
         </p>
      </footer>
    </div>
  );
}
