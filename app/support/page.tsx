"use client";

import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  MessageCircle, 
  Phone, 
  Mail, 
  ChevronRight, 
  Sparkles,
  ShieldCheck,
  Clock,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SupportPage() {
  const router = useRouter();

  const supportOptions = [
    {
      title: "官方 LINE 客服",
      desc: "即時解決您的席次預約與訂單問題",
      icon: MessageCircle,
      color: "bg-emerald-500",
      action: "立即加入",
      href: "https://line.me"
    },
    {
      title: "電話專線服務",
      desc: "週一至週五 09:00 - 18:00",
      icon: Phone,
      color: "bg-indigo-600",
      action: "撥打電話",
      href: "tel:0800000000"
    },
    {
      title: "電子郵件回報",
      desc: "商務合作與大型活動諮詢",
      icon: Mail,
      color: "bg-slate-900",
      action: "發送郵件",
      href: "mailto:support@churun.com"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-20">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 max-w-lg mx-auto flex justify-between items-center bg-[#FDFBF7]/80 backdrop-blur-xl border-b border-slate-100">
         <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50">
            <ArrowLeft className="w-4 h-4 text-slate-400" />
         </button>
         <h1 className="text-xs font-black tracking-[0.3em] text-slate-800 uppercase">品牌客服中心</h1>
         <div className="w-10"></div>
      </nav>

      <main className="max-w-lg mx-auto px-6 pt-32 space-y-10">
         {/* Welcome Section */}
         <section className="space-y-4">
            <div className="w-12 h-12 bg-emerald-900 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-900/20 mb-6">
               <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">您好，<br />需要什麼協助嗎？</h2>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">無論是 5/20 台北場席次預約，或是對產品、獎金制度有任何疑問，初潤專業團隊隨時為您提供服務。</p>
         </section>

         {/* Support Options List */}
         <div className="space-y-6">
            {supportOptions.map((opt, i) => (
              <motion.a 
                key={i}
                href={opt.href}
                target={opt.href.startsWith('http') ? "_blank" : undefined}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="block bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-[0_15px_40px_rgba(0,0,0,0.03)] group hover:border-emerald-200 transition-all active:scale-[0.98]"
              >
                 <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 ${opt.color} rounded-3xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition duration-500`}>
                       <opt.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 space-y-1">
                       <h4 className="font-black text-slate-800 tracking-tight">{opt.title}</h4>
                       <p className="text-[10px] font-medium text-slate-400">{opt.desc}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl group-hover:bg-emerald-50 transition">
                       <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-emerald-500" />
                    </div>
                 </div>
              </motion.a>
            ))}
         </div>

         {/* Trust Badges */}
         <div className="grid grid-cols-2 gap-4 pt-10">
            <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100/50 flex flex-col items-center text-center gap-3">
               <ShieldCheck className="w-6 h-6 text-emerald-600" />
               <span className="text-[8px] font-black text-emerald-900 uppercase tracking-widest">隱私資料保護</span>
            </div>
            <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100/50 flex flex-col items-center text-center gap-3">
               <Clock className="w-6 h-6 text-indigo-600" />
               <span className="text-[8px] font-black text-indigo-900 uppercase tracking-widest">24H 內快速回覆</span>
            </div>
         </div>

         {/* FAQ Link */}
         <footer className="text-center pt-10">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Churun Premium Support Center</p>
         </footer>
      </main>
    </div>
  );
}
