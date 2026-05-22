"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ShieldAlert, 
  FileText, 
  AlertCircle, 
  ArrowRight, 
  Loader2,
  CheckCircle2,
  History,
  Info
} from "lucide-react";
import Toast, { ToastType } from "@/components/Toast";

function ExitContent() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  
  const [simulation, setSimulation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Toast Notifications State
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string, type: ToastType = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
  };

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    setCurrentUserId(savedId);
  }, [router]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!currentUserId) return;
      const { data } = await supabase.from("members").select("*").eq("id", currentUserId).single();
      if (data && !data.is_b2b) {
        triggerToast("⚠️ 無憂退出功能僅限 B2B 創業夥伴使用！", "error");
        setTimeout(() => {
          router.replace("/");
        }, 2000);
        return;
      }
      setMemberInfo(data);
      
      if (data && (data.status === 'exit_pending' || data.status === 'exited')) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/b2b/exit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_id: currentUserId, action: 'simulate' })
        });
        const result = await res.json();
        if (result.success) {
          setSimulation(result.details);
        }
      } catch (err) { console.error(err); }
      setIsLoading(false);
    };
    fetchUser();
  }, [currentUserId, router]);

  const handleApplyExitClick = () => {
    if (!currentUserId || !simulation) return;
    setShowConfirm(true);
  };

  const executeApplyExit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/b2b/exit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: currentUserId, action: 'apply' })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("🎉 " + data.message, "success");
        setTimeout(() => {
          router.push("/");
        }, 2500);
      } else {
        triggerToast("❌ 申請失敗: " + data.error, "error");
      }
    } catch (err) { 
      triggerToast("⚠️ 系統錯誤，請聯絡專屬客服", "error"); 
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !memberInfo) return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-900" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-24">
      <nav className="bg-[#FDFBF7]/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-100 px-6 py-6 flex items-center gap-4 max-w-lg mx-auto">
        <button onClick={() => router.push("/organization")} className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50 active:scale-90 transition">
          <ChevronLeft className="w-5 h-5 text-slate-400" />
        </button>
        <h1 className="text-xs font-black tracking-[0.2em] text-slate-800 uppercase">無憂退出申請</h1>
      </nav>

      <main className="p-6 max-w-lg mx-auto space-y-8 mt-2">
        
        {memberInfo.status === 'exit_pending' ? (
          <div className="bg-white rounded-[3rem] p-12 text-center border border-slate-50 shadow-sm space-y-6">
             <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-inner border border-amber-100/30">
                <History className="w-10 h-10" />
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">審核程序中</h2>
                <p className="text-xs text-slate-400 font-bold mt-2 leading-relaxed">總部正在為您核算最終退款金額，<br/>請留意手機通知或客服訊息。</p>
             </div>
          </div>
        ) : memberInfo.status === 'exited' ? (
          <div className="bg-white rounded-[3rem] p-12 text-center border border-slate-50 shadow-sm space-y-6">
             <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-100/30">
                <CheckCircle2 className="w-10 h-10" />
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">已完成退出</h2>
                <p className="text-xs text-slate-400 font-bold mt-2 leading-relaxed">感謝您過去的參與，您的夥伴帳號已正式結案。</p>
             </div>
          </div>
        ) : simulation ? (
          <>
            <motion.section 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden border border-white/5"
            >
               {/* Diagonal Brushed Metallic Light beam */}
               <motion.div 
                 animate={{ 
                   x: ["-100%", "100%"],
                 }}
                 transition={{ 
                   duration: 6, 
                   repeat: Infinity, 
                   repeatType: "loop", 
                   ease: "easeInOut" 
                 }}
                 className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent skew-x-12 pointer-events-none"
               />
               
               <div className="relative z-10 flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <FileText className="w-6 h-6 text-emerald-400" />
                    <h3 className="text-lg font-black tracking-tight">結算財務報告</h3>
                  </div>
                  <span className="text-[9px] font-black tracking-[0.2em] bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full border border-emerald-500/20">
                     OFFICIAL CONTRACT
                  </span>
               </div>

               {/* Transparent formulas with stagger list delay */}
               <div className="space-y-6 relative z-10">
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex justify-between items-center opacity-80"
                  >
                     <span className="text-xs font-bold text-slate-400">1. 預收款餘額 (A)</span>
                     <span className="font-mono font-bold text-slate-200">${Number(simulation.virtualBalance).toLocaleString()}</span>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex justify-between items-center text-rose-400"
                  >
                     <span className="text-xs font-bold text-slate-400">2. 需扣回之推廣回饋 (B)</span>
                     <span className="font-mono font-bold">-${Number(simulation.totalCommissionReceived).toLocaleString()}</span>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-between items-center text-rose-400"
                  >
                     <span className="text-xs font-bold text-slate-400">3. 創業解除行政費 (C)</span>
                     <span className="font-mono font-bold">-${Number(simulation.adminFee).toLocaleString()}</span>
                  </motion.div>
                  
                  <div className="pt-8 border-t border-white/10 flex justify-between items-end">
                     <div>
                       <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">預計退還總額 (A - B - C)</p>
                       <span className="text-[8px] text-amber-500/80 font-black tracking-widest uppercase">✦ SECURE LIQUIDATION</span>
                     </div>
                     <p className="text-4xl font-black tracking-tighter text-emerald-400">${Number(simulation.finalRefundAmount).toLocaleString()}</p>
                  </div>
               </div>
            </motion.section>

            <div className="bg-rose-50 rounded-[2rem] p-6 border border-rose-100 flex items-start gap-4">
               <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
               <p className="text-[11px] text-rose-800 leading-relaxed font-bold">
                 退出申請送出後，您的 B2B 創業夥伴資格將立即暫停。總部核算後會將款項匯入您綁定的實體銀行帳戶，此動作無法復原。
               </p>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleApplyExitClick}
              disabled={isSubmitting}
              className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-sm tracking-widest hover:bg-slate-800 transition shadow-2xl shadow-slate-900/10 flex items-center justify-center gap-3 active:scale-95 duration-300 disabled:opacity-50 min-h-[64px]"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>確認並送出申請 <ArrowRight className="w-4 h-4" /></>}
            </motion.button>
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-50 shadow-sm">
             <Loader2 className="w-8 h-8 animate-spin text-slate-200 mx-auto" />
          </div>
        )}

        <div className="flex items-center gap-2 justify-center px-6">
           <Info className="w-3 h-3 text-slate-300" />
           <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">如有疑問請聯繫夥伴專屬客服</p>
        </div>
      </main>

      {/* Premium Confirm Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-2xl">
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="bg-white rounded-[3rem] p-10 w-full max-w-sm shadow-2xl text-center relative overflow-hidden border border-slate-100"
            >
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-rose-50 rounded-full blur-2xl opacity-50"></div>
              
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-rose-100">
                <ShieldAlert className="w-8 h-8" />
              </div>
              
              <h3 className="text-xl font-black text-slate-800 mb-2">確認送出退出申請</h3>
              <p className="text-xs text-slate-400 font-bold leading-relaxed mb-6">
                退出後您將會失去所有 B2B 推廣特權，且此程序不可復原。系統預計退回款項為：
              </p>
              
              <div className="bg-slate-50 rounded-2xl py-4 px-6 mb-8 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">退還金額</p>
                <p className="text-2xl font-black text-rose-600 font-mono">NT$ {Number(simulation?.finalRefundAmount).toLocaleString()}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowConfirm(false)} 
                  className="py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition"
                >
                  取消返回
                </button>
                <button 
                  onClick={() => {
                    setShowConfirm(false);
                    executeApplyExit();
                  }} 
                  className="py-4 bg-rose-600 text-white hover:bg-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition shadow-lg shadow-rose-600/10"
                >
                  確認退出 ✓
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Luxury Toast Container */}
      <Toast 
        message={toastMsg}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

    </div>
  );
}

export default function Exit() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-900" /></div>}>
      <ExitContent />
    </Suspense>
  );
}
