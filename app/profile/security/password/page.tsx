"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../supabase";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    setCurrentUserId(savedId);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: '新密碼與確認密碼不符' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // 1. Verify current password
      const { data: member, error: fetchError } = await supabase
        .from("members")
        .select("password")
        .eq("id", currentUserId)
        .single();

      if (fetchError || !member) throw new Error("無法驗證目前帳號狀態");

      if (member.password !== formData.currentPassword) {
        throw new Error("目前密碼不正確");
      }

      // 2. Update password
      const { error: updateError } = await supabase
        .from("members")
        .update({ password: formData.newPassword })
        .eq("id", currentUserId);

      if (updateError) throw updateError;

      setMessage({ type: 'success', text: '密碼修改成功！' });
      setTimeout(() => {
        router.back();
      }, 2000);

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "修改失敗，請稍後再試" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-20">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 max-w-lg mx-auto flex justify-between items-center bg-[#FDFBF7]/80 backdrop-blur-xl border-b border-slate-100">
         <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50">
            <ArrowLeft className="w-4 h-4 text-slate-400" />
         </button>
         <h1 className="text-xs font-black tracking-[0.3em] text-slate-800 uppercase">修改登入密碼</h1>
         <div className="w-10"></div>
      </nav>

      <main className="max-w-lg mx-auto px-6 pt-32 space-y-10">
         <div className="text-center space-y-4 px-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center mx-auto text-emerald-600">
               <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-800">變更您的密碼</h2>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">為了確保帳號安全，建議您定期更換密碼。<br/>請勿與其他平台使用相同的密碼。</p>
         </div>

         <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
               {message && (
                 <motion.div 
                   initial={{ opacity: 0, y: -10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   className={`p-4 rounded-2xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}
                 >
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="text-xs font-bold">{message.text}</span>
                 </motion.div>
               )}
            </AnimatePresence>

            <div className="space-y-6 bg-white rounded-[3rem] p-10 shadow-sm border border-slate-50">
               {/* Current Password */}
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-4">目前密碼</label>
                  <div className="relative group">
                     <input 
                       type={showCurrent ? "text" : "password"}
                       value={formData.currentPassword}
                       onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                       placeholder="請輸入目前密碼"
                       className="w-full bg-slate-50/50 border-2 border-transparent p-5 pr-14 rounded-2xl text-sm font-bold focus:outline-none focus:bg-white focus:border-emerald-500/10 transition-all"
                       required
                     />
                     <button 
                       type="button" 
                       onClick={() => setShowCurrent(!showCurrent)}
                       className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition"
                     >
                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                     </button>
                  </div>
               </div>

               {/* New Password */}
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-4">新密碼</label>
                  <div className="relative group">
                     <input 
                       type={showNew ? "text" : "password"}
                       value={formData.newPassword}
                       onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                       placeholder="請輸入新密碼"
                       className="w-full bg-slate-50/50 border-2 border-transparent p-5 pr-14 rounded-2xl text-sm font-bold focus:outline-none focus:bg-white focus:border-emerald-500/10 transition-all"
                       required
                     />
                     <button 
                       type="button" 
                       onClick={() => setShowNew(!showNew)}
                       className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition"
                     >
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                     </button>
                  </div>
               </div>

               {/* Confirm Password */}
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-4">確認新密碼</label>
                  <div className="relative group">
                     <input 
                       type={showConfirm ? "text" : "password"}
                       value={formData.confirmPassword}
                       onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                       placeholder="請再次輸入新密碼"
                       className="w-full bg-slate-50/50 border-2 border-transparent p-5 pr-14 rounded-2xl text-sm font-bold focus:outline-none focus:bg-white focus:border-emerald-500/10 transition-all"
                       required
                     />
                     <button 
                       type="button" 
                       onClick={() => setShowConfirm(!showConfirm)}
                       className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition"
                     >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                     </button>
                  </div>
               </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              type="submit"
              className="w-full bg-slate-900 text-white p-6 rounded-[2rem] font-black text-sm tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/20 disabled:opacity-50 transition-all"
            >
               {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "確認修改密碼"}
            </motion.button>
         </form>
      </main>
    </div>
  );
}
