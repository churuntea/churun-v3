"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  ArrowRight, 
  ShoppingBag, 
  LayoutDashboard, 
  Sparkles,
  Gift,
  Loader2,
  FileText
} from "lucide-react";
import Link from "next/link";

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const amount = searchParams.get("amount");

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
      
      {/* Celebration Effects */}
      <div className="absolute inset-0 pointer-events-none">
         {[...Array(12)].map((_, i) => (
           <motion.div
             key={i}
             initial={{ opacity: 0, y: 100, x: Math.random() * 400 - 200 }}
             animate={{ opacity: [0, 1, 0], y: -500, x: Math.random() * 600 - 300 }}
             transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
             className="absolute bottom-0 left-1/2"
           >
              <Sparkles className={`w-${Math.floor(Math.random() * 4 + 4)} h-${Math.floor(Math.random() * 4 + 4)} text-amber-300`} />
           </motion.div>
         ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-sm text-center relative z-10 space-y-12"
      >
         {/* Success Icon */}
         <div className="relative inline-block">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-32 h-32 bg-emerald-500 rounded-[3rem] flex items-center justify-center shadow-2xl shadow-emerald-500/30"
            >
               <CheckCircle2 className="w-16 h-16 text-white" />
            </motion.div>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-4 border-2 border-dashed border-emerald-200 rounded-full opacity-50"
            ></motion.div>
         </div>

         <div className="space-y-4">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">訂單已圓滿完成</h1>
            <p className="text-sm text-slate-400 font-medium leading-relaxed px-6">
               感謝您對初潤的信任。您的支持是品牌不斷前進的動力，我們已開始為您處理。
            </p>
         </div>

         {/* Receipt Card */}
         <div className="bg-slate-50 rounded-[3rem] p-8 border border-slate-100 text-left space-y-6">
            <div className="flex justify-between items-center pb-6 border-b border-slate-200 border-dashed">
               <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-slate-300" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order Summary</span>
               </div>
               <span className="text-[10px] font-black text-slate-900 uppercase">#{orderId?.slice(-6).toUpperCase() || 'TX9921'}</span>
            </div>
            <div className="flex justify-between items-end">
               <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">結算金額</p>
               <h3 className="text-3xl font-black text-emerald-600 tracking-tighter">${Number(amount || 0).toLocaleString()}</h3>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-4">
            <Link href="/" className="bg-slate-900 text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20">
               <LayoutDashboard className="w-4 h-4" /> 返回儀表板
            </Link>
            <Link href="/store" className="bg-white border border-slate-100 text-slate-400 py-6 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transition">
               <ShoppingBag className="w-4 h-4" /> 繼續逛逛
            </Link>
         </div>

      </motion.div>

      <p className="absolute bottom-12 text-[8px] font-black uppercase tracking-[0.5em] text-slate-200">
         CHURUN TEA HOUSE DIGITAL RECEIPT
      </p>

    </div>
  );
}

export default function OrderSuccess() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
