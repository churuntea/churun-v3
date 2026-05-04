"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Key, 
  Smartphone, 
  History, 
  ChevronRight,
  AlertCircle,
  Loader2,
  Lock
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../supabase";

export default function SecurityPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [memberInfo, setMemberInfo] = useState<any>(null);

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

  if (isLoading) return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>;

  const securityItems = [
    { 
      title: "修改登入密碼", 
      desc: "定期更換密碼以保護帳號安全", 
      icon: Key, 
      status: "已設定", 
      color: "text-emerald-500 bg-emerald-50",
      action: () => router.push("/profile/security/password")
    },
    { 
      title: "手機號碼驗證", 
      desc: memberInfo.phone || "尚未綁定", 
      icon: Smartphone, 
      status: memberInfo.phone_verified ? "已驗證" : "未驗證", 
      color: memberInfo.phone_verified ? "text-emerald-500 bg-emerald-50" : "text-blue-500 bg-blue-50",
      action: () => router.push("/profile/security/phone")
    },
    { 
      title: "圖形鎖設定", 
      desc: "設定 3x3 九宮格快速登入", 
      icon: Lock, 
      status: memberInfo.pattern_code ? "已設定" : "未設定", 
      color: memberInfo.pattern_code ? "text-amber-500 bg-amber-50" : "text-slate-500 bg-slate-50",
      action: () => router.push("/profile/security/pattern")
    },
    { 
      title: "登入紀錄查詢", 
      desc: "查看最近的登入地點與時間", 
      icon: History, 
      status: "正常", 
      color: "text-indigo-500 bg-indigo-50",
      action: () => alert("登入紀錄查詢功能開發中，敬請期待")
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-20">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 max-w-lg mx-auto flex justify-between items-center bg-[#FDFBF7]/80 backdrop-blur-xl border-b border-slate-100">
         <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50">
            <ArrowLeft className="w-4 h-4 text-slate-400" />
         </button>
         <h1 className="text-xs font-black tracking-[0.3em] text-slate-800 uppercase">帳號安全中心</h1>
         <div className="w-10"></div>
      </nav>

      <main className="max-w-lg mx-auto px-6 pt-32 space-y-10">
         {/* Security Status Header */}
         <section className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>
            <div className="relative z-10 flex flex-col items-center text-center gap-6">
               <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <ShieldCheck className="w-10 h-10 text-white" />
               </div>
               <div className="space-y-2">
                  <h2 className="text-2xl font-black tracking-tight">帳號安全等級：優良</h2>
                  <p className="text-xs text-white/40 font-medium">上次登入：2026/05/03 台北市</p>
               </div>
            </div>
         </section>

         {/* Security Checklist */}
         <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">安全功能設定</h3>
            {securityItems.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-[2.5rem] p-7 flex items-center gap-6 shadow-sm border border-slate-50 group hover:border-emerald-100 transition cursor-pointer"
                onClick={item.action}
              >
                 <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center shadow-inner`}>
                    <item.icon className="w-6 h-6" />
                 </div>
                 <div className="flex-1">
                    <h4 className="font-black text-slate-800">{item.title}</h4>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">{item.desc}</p>
                 </div>
                 <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{item.status}</span>
                    <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-emerald-500 transition" />
                 </div>
              </motion.div>
            ))}
         </div>

         {/* Privacy Notice */}
         <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-100/50 flex gap-6 items-start">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
               <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="space-y-2">
               <h4 className="text-sm font-black text-amber-900 tracking-tight">隱私保護提醒</h4>
               <p className="text-xs text-amber-700/70 leading-relaxed font-medium">初潤承諾保護您的個人隱私。我們絕對不會主動要求您提供密碼或透過非官方管道進行轉帳。</p>
            </div>
         </div>

         <footer className="text-center pt-10">
            <div className="flex justify-center gap-2 items-center mb-4">
               <Lock className="w-3 h-3 text-slate-300" />
               <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">End-to-End Encryption Enabled</p>
            </div>
         </footer>
      </main>
    </div>
  );
}
