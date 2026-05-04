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
  Mail,
  MapPin
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
    email: "",
    address: "",
    referral_code: "",
    password: ""
  });
  const [uplineName, setUplineName] = useState<string | null>(null);
  const [isValidatingRef, setIsValidatingRef] = useState(false);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setFormData(prev => ({ ...prev, referral_code: ref.trim().toUpperCase() }));
  }, [searchParams]);

  // Real-time Referral Code Validation
  useEffect(() => {
    const checkUpline = async () => {
      const refCode = formData.referral_code?.trim().toUpperCase();
      if (!refCode || refCode.length < 3) {
        setUplineName(null);
        return;
      }

      setIsValidatingRef(true);
      const { data, error } = await supabase
        .from("members")
        .select("name")
        .or(`referral_code.eq.${refCode},member_code.eq.${refCode}`)
        .single();
      
      if (data && !error) {
        setUplineName(data.name);
      } else {
        setUplineName(null);
      }
      setIsValidatingRef(false);
    };

    const timer = setTimeout(checkUpline, 500);
    return () => clearTimeout(timer);
  }, [formData.referral_code]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const memberCode = `CR26M${Math.floor(100000 + Math.random() * 900000)}`;
    const myReferralCode = memberCode;

    try {
      let uplineId = null;
      const refCode = formData.referral_code?.trim().toUpperCase();

      if (refCode) {
        const { data: upline, error: uplineErr } = await supabase
          .from("members")
          .select("id")
          .or(`referral_code.eq.${refCode},member_code.eq.${refCode}`)
          .single();
        
        if (uplineErr || !upline) {
          setErrorMsg("找不到該推薦人代碼，請確認後再試一次。");
          setIsLoading(false);
          return;
        }
        uplineId = upline.id;
      }

      const insertData: any = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        password: formData.password,
        referral_code: myReferralCode,
        member_code: memberCode,
        tier: "初潤寶寶",
        is_b2b: false,
        lifetime_spend: 0,
        quarterly_spend: 0,
        points_balance: 0,
        virtual_balance: 0
      };

      if (uplineId) insertData.upline_id = uplineId;

      const { data, error } = await supabase
        .from("members")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        if (error.message.includes("unique_phone") || error.code === "23505") {
          setErrorMsg("此手機號碼已被註冊過，請直接登入或更換號碼。");
        } else {
          setErrorMsg(`註冊失敗: ${error.message}`);
        }
      } else {
        localStorage.setItem("churun_member_id", data.id);
        localStorage.setItem("churun_member_name", data.name);
        
        // 新增上線通知
        if (uplineId) {
          await supabase.from("notifications").insert({
            member_id: uplineId,
            title: "新夥伴加入！",
            content: `您的團隊有新夥伴 ${formData.name} 透過您的代碼加入了。`,
            type: "referral"
          });
        }

        router.push("/");
      }
    } catch (err: any) {
      setErrorMsg("網路連線異常，請稍後再試。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-6 relative overflow-hidden">
      
      
      <div className="absolute inset-0 pointer-events-none">
         <motion.div 
           animate={{ y: [0, -50, 0], x: [0, 30, 0] }}
           transition={{ duration: 15, repeat: Infinity }}
           className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-50/50 rounded-full blur-[120px]"
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
                 <h1 className="text-4xl font-black text-slate-900 tracking-tight">建立帳號</h1>
                 <p className="text-sm text-slate-400 font-medium">填寫資料，開始您的初潤之旅</p>
              </div>
           </div>

           <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-6">真實姓名</label>
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

              <div className="md:col-span-2 space-y-2">
                 <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-6">電子郵件 (選填)</label>
                 <div className="relative">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
                    <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="your@email.com" className="w-full bg-slate-50/50 border-none p-6 pl-16 rounded-[2rem] text-sm font-bold focus:ring-2 focus:ring-emerald-900/5 transition shadow-inner" />
                 </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                 <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-6">收件地址 (選填)</label>
                 <div className="relative">
                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
                    <input name="address" type="text" value={formData.address} onChange={handleChange} placeholder="請輸入收件地址" className="w-full bg-slate-50/50 border-none p-6 pl-16 rounded-[2rem] text-sm font-bold focus:ring-2 focus:ring-emerald-900/5 transition shadow-inner" />
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
                 <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-6">推薦代碼</label>
                 <div className="relative">
                    <Hash className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
                    <input name="referral_code" type="text" value={formData.referral_code} onChange={handleChange} placeholder="REFCODE" className="w-full bg-slate-50/50 border-none p-6 pl-16 rounded-[2rem] text-sm font-bold focus:ring-2 focus:ring-emerald-900/5 transition shadow-inner" />
                    <AnimatePresence>
                      {isValidatingRef && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute right-6 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>
                 <AnimatePresence>
                    {uplineName && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-[10px] font-bold text-emerald-600 ml-6 mt-2 flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" /> 推薦人：{uplineName} ✨
                      </motion.p>
                    )}
                 </AnimatePresence>
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
        </div>
      </motion.div>

      <AnimatePresence>
        {errorMsg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-2xl flex items-center justify-center p-6">
             <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3rem] p-12 w-full max-w-sm text-center shadow-2xl">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-6" />
                <h3 className="text-xl font-black mb-4">註冊失敗</h3>
                <p className="text-sm text-slate-500 mb-10">{errorMsg}</p>
                <button onClick={() => setErrorMsg(null)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">返回修改</button>
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
