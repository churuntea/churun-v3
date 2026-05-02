"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Phone, 
  ChevronRight, 
  ArrowRight, 
  Loader2, 
  Sparkles,
  ShieldCheck,
  Zap
} from "lucide-react";
import Link from "next/link";

function LoginContent() {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { data, error } = await supabase
      .from("members")
      .select("id, name")
      .eq("phone", phone)
      .single();

    if (error || !data) {
      alert("查無此會員，請確認手機號碼是否正確");
    } else {
      localStorage.setItem("churun_member_id", data.id);
      localStorage.setItem("churun_member_name", data.name);
      router.push("/");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none">
         <motion.div 
           animate={{ 
             scale: [1, 1.2, 1],
             rotate: [0, 90, 0],
           }}
           transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
           className="absolute -top-1/4 -left-1/4 w-full h-full bg-emerald-50 rounded-full blur-[120px] opacity-60"
         />
         <motion.div 
           animate={{ 
             scale: [1, 1.3, 1],
             rotate: [0, -90, 0],
           }}
           transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
           className="absolute -bottom-1/4 -right-1/4 w-full h-full bg-amber-50 rounded-full blur-[120px] opacity-40"
         />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/70 backdrop-blur-3xl rounded-[4rem] p-12 shadow-[0_32px_64px_-16px_rgba(6,78,59,0.1)] border border-white">
           
           <div className="text-center mb-12">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                className="w-20 h-20 bg-emerald-900 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-900/20"
              >
                 <span className="text-white font-black text-2xl tracking-tighter">CR</span>
              </motion.div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">歡迎回來</h1>
              <p className="text-sm text-slate-400 font-medium">開啟您的初潤數位之旅</p>
           </div>

           <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-6">手機號碼登入</label>
                 <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors">
                       <Phone className="w-5 h-5" />
                    </div>
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="請輸入手機號碼" 
                      className="w-full bg-slate-50/50 border-2 border-transparent p-6 pl-16 rounded-[2rem] text-sm font-bold focus:outline-none focus:bg-white focus:border-emerald-900/5 transition-all shadow-inner"
                      required
                    />
                 </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
                type="submit" 
                className="w-full bg-emerald-900 text-white p-6 rounded-[2rem] font-black text-sm tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-emerald-900/30 group disabled:opacity-50"
              >
                 {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                   <>
                     登入系統 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                   </>
                 )}
              </motion.button>
           </form>

           <div className="mt-12 pt-8 border-t border-slate-50 flex flex-col items-center gap-6">
              <p className="text-xs text-slate-400 font-bold">
                 還沒有帳號？ 
                 <Link href="/register" className="text-emerald-600 ml-2 hover:underline">立即加入</Link>
              </p>
              
              <div className="flex gap-4">
                 <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">安全加密</span>
                 </div>
                 <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">快速存取</span>
                 </div>
              </div>
           </div>
        </div>
        
        <p className="text-center mt-12 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
           © 2026 CHURUN TEA HOUSE DIGITAL SYSTEM
        </p>
      </motion.div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
