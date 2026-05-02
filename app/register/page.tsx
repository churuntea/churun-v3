"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Phone, 
  User, 
  UserPlus, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck, 
  Hash,
  Sparkles,
  AlertCircle,
  XCircle
} from "lucide-react";
import Link from "next/link";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    referral_code: "",
    password: ""
  });

  useEffect(() => {
    // 取得 URL 中的推薦碼並自動填入
    const ref = searchParams.get("ref");
    if (ref) setFormData(prev => ({ ...prev, referral_code: ref.trim().toUpperCase() }));
  }, [searchParams]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    // 隨機生成會員代碼與自己的推薦碼
    const memberCode = `CR26M${Math.floor(100000 + Math.random() * 900000)}`;
    const myReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      let uplineId = null;
      const refCode = formData.referral_code?.trim().toUpperCase();

      // 1. 處理推薦碼邏輯：確保只有當代碼非空時才去查詢
      if (refCode && refCode !== "") {
        const { data: upline, error: uplineErr } = await supabase
          .from("members")
          .select("id")
          .eq("referral_code", refCode)
          .single();
        
        if (uplineErr || !upline) {
          setErrorMsg("找不到該推薦人代碼，請確認後再試一次。");
          setIsLoading(false);
          return;
        }
        uplineId = upline.id;
      }

      // 2. 執行註冊：明確處理 upline_id，確保絕不傳入空字串 ""
      const { data, error } = await supabase
        .from("members")
        .insert({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
          referral_code: myReferralCode,
          member_code: memberCode,
          upline_id: uplineId || null, // 極重要：如果是空就強制給 null
          tier: "初潤寶寶",
          is_b2b: false,
          lifetime_spend: 0,
          quarterly_spend: 0,
          points_balance: 0,
          virtual_balance: 0
        })
        .select()
        .single();

      if (error) {
        // 處理資料庫拋出的錯誤
        if (error.message.includes("unique_phone") || error.code === "23505") {
          setErrorMsg("此手機號碼已被註冊過，請直接登入或更換號碼。");
        } else if (error.message.includes("uuid")) {
          setErrorMsg("系統參數格式異常 (UUID)，請聯繫客服。");
        } else {
          setErrorMsg(`註冊失敗: ${error.message}`);
        }
      } else {
        // 註冊成功，存入 LocalStorage
        localStorage.setItem("churun_member_id", data.id);
        localStorage.setItem("churun_member_name", data.name);
        router.push("/");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("網路連線異常，請稍後再試。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="absolute inset-0 pointer-events-none">
         <motion.div 
           animate={{ y: [0, -50, 0], x: [0, 30, 0] }}
           transition={{ duration: 15, repeat: Infinity }}
           className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-50/50 rounded-full blur-[120px]"
         />
         <motion.div 
           animate={{ y: [0, 40, 0], x: [0, -20, 0] }}
           transition={{ duration: 18, repeat: Infinity }}
           className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-50/30 rounded-full blur-[100px]"
         />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="bg-white/80 backdrop-blur-3xl rounded-[4rem] p-12 lg:p-16 shadow-[0_32px_64px_-16px_rgba(6,78,59,0.08)] border border-white">
           
           <div className="flex justify-between items-start mb-16">
              <div className="space-y-4">
                 <div className="w-16 h-16 bg-emerald-900 rounded-[2rem] flex items-center justify-center shadow-xl shadow-emerald-900/20">
                    <UserPlus className="w-8 h-8 text-white" />
                 </div>
                 <h1 className="text-4xl font-black text-slate-900 tracking-tight">加入初潤</h1>
                 <p className="text-sm text-slate-400 font-medium">成為初潤會員，開啟您的專屬權益</p>
              </div>
              <Link href="/login" className="px-6 py-3 bg-slate-50 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition">
                 已有帳號？
              </Link>
           </div>

           <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-6">姓名</label>
                 <div className="relative">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
                    <input name="name" type="text" value={formData.name} onChange={handleChange} placeholder="您的姓名" className="w-full bg-slate-50/50 border-none p-6 pl-16 rounded-[2rem] text-sm font-bold focus:ring-2 focus:ring-emerald-900/5 transition shadow-inner" required />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-6">手機號碼</label>
                 <div className="relative">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
                    <input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="0912345678" className="w-full bg-slate-50/50 border-none p-6 pl-16 rounded-[2rem] text-sm font-bold focus:ring-2 focus:ring-emerald-900/5 transition shadow-inner" required />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-6">自訂密碼</label>
                 <div className="relative">
                    <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
                    <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="請輸入密碼" className="w-full bg-slate-50/50 border-none p-6 pl-16 rounded-[2rem] text-sm font-bold focus:ring-2 focus:ring-emerald-900/5 transition shadow-inner" required />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-6">推薦代碼 (選填)</label>
                 <div className="relative">
                    <Hash className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
                    <input name="referral_code" type="text" value={formData.referral_code} onChange={handleChange} placeholder="REFCODE" className="w-full bg-slate-50/50 border-none p-6 pl-16 rounded-[2rem] text-sm font-bold focus:ring-2 focus:ring-emerald-900/5 transition shadow-inner" />
                 </div>
              </div>

              <div className="md:col-span-2 pt-6">
                 <motion.button 
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   disabled={isLoading}
                   type="submit" 
                   className="w-full bg-emerald-900 text-white p-7 rounded-[2.5rem] font-black text-sm tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl shadow-emerald-900/30 group disabled:opacity-50"
                 >
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                      <>
                        立即完成註冊 <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                      </>
                    )}
                 </motion.button>
              </div>
           </form>

           <div className="mt-12 flex justify-center gap-8">
              <div className="flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">隱私保護</span>
              </div>
              <div className="flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">條款同意</span>
              </div>
           </div>
        </div>
      </motion.div>

      {/* Premium Error Modal */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-2xl flex items-center justify-center p-6"
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               exit={{ scale: 0.9, y: 20 }}
               className="bg-white rounded-[3rem] p-12 w-full max-w-sm text-center shadow-2xl relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-rose-50 rounded-full blur-3xl opacity-50"></div>
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                   <AlertCircle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">註冊遇到問題</h3>
                <p className="text-sm text-slate-500 mb-10 leading-relaxed">{errorMsg}</p>
                <button 
                  onClick={() => setErrorMsg(null)}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition"
                >
                  返回修改
                </button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Register() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>}>
      <RegisterContent />
    </Suspense>
  );
}
