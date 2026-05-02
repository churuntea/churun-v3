"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { 
  ChevronLeft, 
  Zap, 
  Star, 
  CheckCircle2, 
  ArrowRight, 
  Loader2,
  Gem,
  Award,
  Sparkles,
  ShieldCheck
} from "lucide-react";

function UpgradeContent() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
      if (data && data.is_b2b) {
        alert("您已經是創業夥伴，無須再次升級！");
        router.replace("/");
        return;
      }
      setMemberInfo(data);
    };
    fetchUser();
  }, [currentUserId, router]);

  const handleUpgrade = async (plan: string, amount: number, tierName: string) => {
    if (!currentUserId) return;
    if (!confirm(`✨ 即將進行模擬升級測試。\n確定要模擬支付 $${amount.toLocaleString()} 升級為【${tierName}】嗎？`)) return;

    setIsProcessing(true);
    try {
      const { error: updateError } = await supabase
        .from("members")
        .update({
          is_b2b: true,
          tier: tierName,
          virtual_balance: amount,
          initial_deposit: amount
        })
        .eq("id", currentUserId);

      if (updateError) throw updateError;

      await supabase.from("wallet_transactions").insert({
        member_id: currentUserId,
        amount: amount,
        transaction_type: "deposit",
        status: "completed"
      });

      alert(`🎉 恭喜！您已成功升級為【${tierName}】！\n系統已配發 $${amount.toLocaleString()} 預收款，現在就開始您的創業之旅吧！`);
      router.push("/");
    } catch (err: any) {
      alert("升級失敗: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!memberInfo) return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-900" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-24 relative overflow-hidden font-sans">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-40 left-0 -ml-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl opacity-30"></div>
      
      <nav className="relative z-10 p-6 max-w-lg mx-auto flex items-center gap-4">
        <button onClick={() => router.push("/")} className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-white/60 hover:text-white transition backdrop-blur-md border border-white/5">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xs font-black tracking-[0.2em] text-white/40 uppercase">夥伴計畫升級</h1>
      </nav>

      <main className="p-6 max-w-lg mx-auto space-y-10 relative z-10">
        
        <div className="text-center space-y-4">
           <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-full">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Digital Transformation</span>
           </div>
           <h2 className="text-4xl font-black tracking-tight leading-tight">翻轉您的<br/>數位創業視野</h2>
           <p className="text-sm text-white/40 max-w-[280px] mx-auto leading-relaxed font-medium">解鎖大宗批發特權與組織裂變獎金，開啟被動收入的第一步。</p>
        </div>

        <div className="space-y-8">
           {/* Plan A: Premium */}
           <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative bg-slate-800/40 backdrop-blur-xl rounded-[3rem] p-10 border border-white/10 shadow-2xl transition duration-500 hover:border-indigo-500/30 overflow-hidden">
                 
                 <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>

                 <div className="flex justify-between items-start mb-10">
                    <div className="w-16 h-16 bg-indigo-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                       <Gem className="w-8 h-8 text-white" />
                    </div>
                    <div className="bg-amber-400 text-amber-900 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                       Most Popular
                    </div>
                 </div>

                 <h3 className="text-2xl font-black tracking-tight text-white mb-2">初潤品牌大使</h3>
                 <div className="flex items-baseline gap-2 mb-8">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">$</span>
                    <span className="text-4xl font-black tracking-tighter">198,000</span>
                 </div>

                 <ul className="space-y-4 mb-10">
                    {[
                      "享最高批發折扣與退傭比例",
                      "300盒免費專屬品牌客製輸出",
                      "獨享 30% 預收款安全鎖機制",
                      "全數位宣傳素材無限下載"
                    ].map((feat, i) => (
                      <li key={i} className="flex items-center gap-3">
                         <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                         <span className="text-sm text-white/60 font-medium">{feat}</span>
                      </li>
                    ))}
                 </ul>

                 <button 
                   onClick={() => handleUpgrade('ambassador', 198000, '初潤品牌大使')}
                   disabled={isProcessing}
                   className="w-full bg-white text-slate-900 py-6 rounded-3xl font-black text-sm hover:bg-slate-100 transition shadow-2xl shadow-white/5 flex items-center justify-center gap-3"
                 >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <>模擬升級 <ArrowRight className="w-4 h-4" /></>}
                 </button>
              </div>
           </div>

           {/* Plan B: Partner */}
           <div className="relative bg-white/5 backdrop-blur-xl rounded-[3rem] p-10 border border-white/5 shadow-2xl transition duration-500 hover:border-emerald-500/20">
              <div className="flex justify-between items-start mb-8">
                 <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-3xl flex items-center justify-center border border-emerald-500/20">
                    <Award className="w-7 h-7" />
                 </div>
              </div>

              <h3 className="text-xl font-black tracking-tight text-white mb-2">創業合夥人</h3>
              <div className="flex items-baseline gap-2 mb-8">
                 <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">$</span>
                 <span className="text-3xl font-black tracking-tighter">98,000</span>
              </div>

              <ul className="space-y-4 mb-10">
                 {[
                   "享進階批發折扣與退傭比例",
                   "無憂退出機制全額保障",
                   "基礎數位宣傳素材下載"
                 ].map((feat, i) => (
                   <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400/60" />
                      <span className="text-sm text-white/40 font-medium">{feat}</span>
                   </li>
                 ))}
              </ul>

              <button 
                onClick={() => handleUpgrade('partner', 98000, '初潤創業合夥人')}
                disabled={isProcessing}
                className="w-full bg-white/5 text-white py-6 rounded-3xl font-black text-sm hover:bg-white/10 transition border border-white/10 flex items-center justify-center gap-3"
              >
                 {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <>模擬升級 <ArrowRight className="w-4 h-4" /></>}
              </button>
           </div>
        </div>

        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 flex items-start gap-5">
           <ShieldCheck className="w-6 h-6 text-indigo-400 shrink-0" />
           <p className="text-[10px] text-white/40 leading-relaxed font-medium">
             升級即代表您同意初潤製茶所 V2 加盟規範。系統將扣除 3,000 元作為數位系統終身設定維護費，退出時不予退還。如有任何疑問請聯繫線上客服。
           </p>
        </div>

      </main>
    </div>
  );
}

export default function Upgrade() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>}>
      <UpgradeContent />
    </Suspense>
  );
}
