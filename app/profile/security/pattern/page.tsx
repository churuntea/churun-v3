"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  RefreshCw
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../supabase";
import PatternLock from "@/components/PatternLock";

export default function PatternSetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [step, setStep] = useState<'set' | 'confirm' | 'success'>('set');
  const [firstPattern, setFirstPattern] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    setCurrentUserId(savedId);
  }, [router]);

  const handlePatternComplete = async (pattern: string) => {
    if (pattern.length < 4) {
      setError("圖形長度至少需要連接 4 個點");
      return;
    }
    setError(null);

    if (step === 'set') {
      setFirstPattern(pattern);
      setStep('confirm');
    } else {
      if (pattern !== firstPattern) {
        setError("圖形與第一次不符，請重新輸入");
        setStep('set');
        setFirstPattern(null);
        return;
      }

      // Save to database
      setIsLoading(true);
      try {
        const { error: updateError } = await supabase
          .from("members")
          .update({ pattern_code: pattern })
          .eq("id", currentUserId);

        // Improved simulation check for missing column
        const isSchemaError = updateError && (
          updateError.message?.includes("column") ||
          updateError.message?.includes("COULD NOT FIND") ||
          updateError.message?.includes("SCHEMA CACHE") ||
          updateError.code === '42703'
        );

        if (isSchemaError) {
          console.warn("Database schema not updated, saving pattern to localStorage fallback");
          localStorage.setItem(`churun_local_pattern_${currentUserId}`, pattern);
        } else if (updateError) {
          throw updateError;
        }

        setStep('success');
      } catch (err: any) {
        setError(err.message || "設定失敗");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-20">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 max-w-lg mx-auto flex justify-between items-center bg-[#FDFBF7]/80 backdrop-blur-xl border-b border-slate-100">
         <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50">
            <ArrowLeft className="w-4 h-4 text-slate-400" />
         </button>
         <h1 className="text-xs font-black tracking-[0.3em] text-slate-800 uppercase">設定圖形鎖</h1>
         <div className="w-10"></div>
      </nav>

      <main className="max-w-lg mx-auto px-6 pt-32 space-y-12">
         <AnimatePresence mode="wait">
            {step !== 'success' && (
              <motion.div 
                key="setup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-12"
              >
                 <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-amber-50 rounded-[1.5rem] flex items-center justify-center mx-auto text-amber-600 shadow-inner">
                       <Lock className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">
                       {step === 'set' ? '繪製登入圖形' : '再次繪製以確認'}
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">請連接至少 4 個點位，<br/>這將作為您往後快速登入的憑據。</p>
                 </div>

                 <div className="bg-white rounded-[4rem] p-10 shadow-2xl shadow-slate-900/5 border border-slate-50 relative">
                    <PatternLock 
                      onComplete={handlePatternComplete} 
                      error={!!error}
                    />
                    
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -bottom-8 left-0 right-0 text-center"
                      >
                         <div className="inline-flex items-center gap-2 text-rose-500 bg-rose-50 px-4 py-2 rounded-full border border-rose-100">
                            <AlertCircle className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
                         </div>
                      </motion.div>
                    )}
                 </div>

                 <div className="text-center">
                    <button 
                      onClick={() => { setStep('set'); setFirstPattern(null); setError(null); }}
                      className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 mx-auto hover:text-slate-500 transition"
                    >
                       <RefreshCw className="w-3 h-3" /> 重置繪製
                    </button>
                 </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-10"
              >
                 <div className="bg-slate-900 rounded-[4rem] p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-slate-900/40">
                    <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10 flex flex-col items-center gap-8">
                       <motion.div 
                         initial={{ scale: 0 }}
                         animate={{ scale: 1 }}
                         transition={{ type: "spring", delay: 0.2 }}
                         className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center shadow-lg shadow-emerald-500/20"
                       >
                          <CheckCircle2 className="w-12 h-12 text-white" />
                       </motion.div>
                       <div className="space-y-4">
                          <h2 className="text-3xl font-black tracking-tight">圖形鎖設定完成！</h2>
                          <p className="text-sm text-white/40 font-medium leading-relaxed">您現在可以在登入頁面切換<br/>使用圖形連線進行快速登入。</p>
                       </div>
                    </div>
                 </div>

                 <motion.button
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => router.back()}
                   className="w-full bg-emerald-600 text-white p-6 rounded-[2rem] font-black text-sm tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-emerald-600/20 transition-all"
                 >
                    回到安全中心
                 </motion.button>
              </motion.div>
            )}
         </AnimatePresence>

         {isLoading && (
           <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[100] flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-900" />
           </div>
         )}
      </main>
    </div>
  );
}
