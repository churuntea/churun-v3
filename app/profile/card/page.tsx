"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../supabase";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Sparkles, 
  QrCode,
  Fingerprint,
  Loader2,
  Award,
  Zap
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import Link from "next/link";


function DigitalCardContent() {
  const router = useRouter();
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    fetchData(savedId);
  }, [router]);

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    const { data } = await supabase.from("members").select("*").eq("id", userId).single();
    setMemberInfo(data);
    setIsLoading(false);
  };

  const handleNativeShare = async () => {
    const link = `${window.location.origin}/register?ref=${memberInfo?.member_code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: '初潤製茶所 創業夥伴',
          text: `我是初潤製茶所的夥伴 ${memberInfo?.name}，邀請您一同開啟數位茶飲之旅！`,
          url: link,
        });
      } catch (err) {
        console.log('Share failed', err);
      }
    } else {
      navigator.clipboard.writeText(link);
      alert("推薦連結已複製！");
    }
  };

  if (isLoading || !memberInfo) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-500" /></div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
      
      {/* Dynamic Aura Background */}
      <div className="absolute inset-0 pointer-events-none">
         <motion.div 
           animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
           transition={{ duration: 10, repeat: Infinity }}
           className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-900/20 rounded-full blur-[120px]"
         />
      </div>

      <nav className="absolute top-12 left-8 right-8 flex justify-between items-center z-50">
         <Link href="/profile" className="w-12 h-12 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10">
            <ArrowLeft className="w-6 h-6" />
         </Link>
         <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Digital Business ID</h1>
         <div className="w-12 h-12" /> 
      </nav>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, rotateY: 30 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        whileHover={{ rotateY: 10, rotateX: -5, scale: 1.02 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        style={{ perspective: 2000 }}
        className="w-full max-w-sm aspect-[1/1.6] relative group cursor-pointer"
      >
         {/* 3D Card Effect Container */}
         <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 rounded-[3.5rem] blur-3xl opacity-30 group-hover:opacity-60 transition duration-1000"></div>
         
         <div className="relative h-full w-full bg-slate-900 rounded-[3.5rem] border border-white/10 shadow-2xl overflow-hidden p-12 flex flex-col justify-between">
            {/* Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
            
            <div className="relative z-10 flex justify-between items-start">
               <div className="w-16 h-16 bg-emerald-500 rounded-[2rem] flex items-center justify-center shadow-xl shadow-emerald-500/30">
                  <span className="text-white font-black text-xl tracking-tighter">CR</span>
               </div>
               <div className="text-right space-y-1">
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/40">Elite Partner</p>
                  <div className="flex items-center gap-2 justify-end text-emerald-400">
                     <Award className="w-3 h-3" />
                     <span className="text-[10px] font-black tracking-widest uppercase">{memberInfo.tier}</span>
                  </div>
               </div>
            </div>

            <div className="relative z-10 space-y-2">
               <h2 className="text-5xl font-black tracking-tighter leading-none">{memberInfo.name}</h2>
               <p className="text-xs font-medium text-slate-400 tracking-widest uppercase opacity-60">Churun Brand Ambassador</p>
            </div>

            <div className="relative z-10 space-y-10">
               <div className="bg-white p-4 rounded-[2.5rem] shadow-2xl shadow-emerald-900/50 flex items-center justify-center mx-auto w-48 h-48 rotate-3">
                  <QRCodeCanvas 
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${memberInfo.member_code}`}
                    size={160}
                    level={"H"}
                    includeMargin={false}
                  />
               </div>
               
               <div className="text-center space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Referral Access Code</p>
                  <p className="text-3xl font-black tracking-[0.4em] text-emerald-400 uppercase">{memberInfo.member_code}</p>
               </div>
            </div>

            <div className="relative z-10 flex justify-between items-center pt-8 border-t border-white/5">
               <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400 fill-current" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Active Since 2026</span>
               </div>
               <Fingerprint className="w-6 h-6 text-white/10" />
            </div>
         </div>
      </motion.div>

      <div className="mt-16 flex gap-6 z-50">
         <motion.button 
           whileHover={{ y: -5 }}
           whileTap={{ scale: 0.95 }}
           className="w-16 h-16 bg-white/5 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/10 group"
         >
            <Download className="w-6 h-6 text-slate-400 group-hover:text-white transition" />
         </motion.button>
         <motion.button 
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNativeShare}
            className="px-10 py-6 bg-emerald-500 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-emerald-500/30 flex items-center gap-4"
          >
             Share Identity <Share2 className="w-5 h-5" />
          </motion.button>
      </div>

      <p className="mt-12 text-[8px] font-black uppercase tracking-[0.5em] text-white/20">
         © 2026 CHURUN TEA HOUSE DIGITAL ID
      </p>

    </div>
  );
}

export default function DigitalCard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-500" /></div>}>
      <DigitalCardContent />
    </Suspense>
  );
}
