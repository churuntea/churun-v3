"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  Award,
  Users
} from "lucide-react";

function UpgradeContent() {
  const router = useRouter();
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

  const handleUpgrade = async () => {
    setIsSubmitting(true);
    
    // 這裡實作升級邏輯：修改 is_b2b 為 true 並更新等級
    const { error } = await supabase
      .from("members")
      .update({ 
        is_b2b: true,
        tier: "初潤夥伴" // 升級後的起始等級
      })
      .eq("id", memberInfo.id);

    if (error) {
      alert("申請失敗: " + error.message);
      setIsSubmitting(false);
    } else {
      setIsSuccess(true);
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center space-y-12">
         <motion.div 
           initial={{ scale: 0 }}
           animate={{ scale: 1 }}
           className="w-32 h-32 bg-indigo-600 rounded-[3rem] flex items-center justify-center shadow-2xl shadow-indigo-600/20"
         >
            <Zap className="w-16 h-16 text-white" />
         </motion.div>
         <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">恭喜！身分已升級</h2>
            <p className="text-sm text-slate-400 font-medium leading-relaxed px-10">
               您現在已正式成為「初潤創業夥伴」。即刻起，您將擁有專屬推薦權限與獎金結算功能。
            </p>
         </div>
         <button 
           onClick={() => router.push("/")}
           className="bg-indigo-600 text-white px-12 py-6 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20"
         >
            進入夥伴控制台
         </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-50 px-8 py-6 flex items-center gap-6 max-w-lg mx-auto">
         <Link href="/profile" className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition">
            <ArrowLeft className="w-5 h-5" />
         </Link>
         <h1 className="text-sm font-black tracking-[0.3em] text-slate-800 uppercase">身分升級計畫</h1>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-12 mt-4">
        
        {/* Hero Banner */}
        <section className="bg-indigo-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/30">
           <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-[100px]"></div>
           <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                 <TrendingUp className="w-8 h-8 text-indigo-300" />
              </div>
              <h2 className="text-3xl font-black tracking-tight leading-tight">
                 從消費者<br/>
                 變身為品牌主
              </h2>
              <p className="text-sm text-white/40 leading-relaxed">
                 加入「初潤 B2B 創業計畫」，將您的影響力轉化為實質收入，開啟數位茶飲事業。
              </p>
           </div>
        </section>

        {/* Benefits Grid */}
        <div className="space-y-6">
           <h3 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase px-2">夥伴專屬權益</h3>
           <div className="grid grid-cols-1 gap-4">
              {[
                { title: "專屬推薦分潤", desc: "每一筆經由您推薦產生的訂單，皆可獲得高額退傭。", icon: Zap },
                { title: "團隊管理權限", icon: Users, desc: "查看下線團隊發展，領取組織培育獎金。" },
                { title: "季度業績分紅", icon: Award, desc: "達成指定門檻，參與總部年度紅利分配。" }
              ].map((b, i) => (
                <div key={i} className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm flex items-start gap-6">
                   <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <b.icon className="w-6 h-6 text-indigo-600" />
                   </div>
                   <div className="space-y-1">
                      <h4 className="font-bold text-slate-800">{b.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{b.desc}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Requirements */}
        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-50 shadow-sm space-y-6">
           <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">升級條件檢查</h4>
           <div className="flex items-center justify-between">
              <div className="space-y-1">
                 <p className="text-sm font-bold text-slate-800">當季累積消費</p>
                 <p className="text-[10px] text-slate-400 uppercase tracking-widest">${Number(memberInfo?.quarterly_spend).toLocaleString()} / $5,000</p>
              </div>
              {Number(memberInfo?.quarterly_spend) >= 5000 ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              ) : (
                <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest">尚不符合</div>
              )}
           </div>
           <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((Number(memberInfo?.quarterly_spend) / 5000) * 100, 100)}%` }}
                className="h-full bg-indigo-600"
              />
           </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={handleUpgrade}
          disabled={isSubmitting || Number(memberInfo?.quarterly_spend) < 5000}
          className="w-full bg-slate-900 text-white py-8 rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-4 active:scale-95 transition disabled:opacity-50"
        >
           {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
             <>正式申請成為夥伴 <ArrowRight className="w-5 h-5" /></>
           )}
        </button>

        <div className="flex items-center justify-center gap-3 text-slate-300">
           <ShieldCheck className="w-4 h-4" />
           <span className="text-[8px] font-black uppercase tracking-widest">Brand Official Partner Application</span>
        </div>

      </main>

    </div>
  );
}

export default function Upgrade() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>}>
      <UpgradeContent />
    </Suspense>
  );
}
