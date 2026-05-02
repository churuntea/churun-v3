"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
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

function ExitContent() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  
  const [simulation, setSimulation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        alert("無憂退出功能僅限 B2B 創業夥伴使用！");
        router.replace("/");
        return;
      }
      setMemberInfo(data);
      
      if (data.status === 'exit_pending' || data.status === 'exited') {
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

  const handleApplyExit = async () => {
    if (!currentUserId) return;
    if (!confirm("⚠️ 退出申請送出後，將無法再享有 B2B 專屬權益，且須等候總部審核。確定要送出申請嗎？")) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/b2b/exit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: currentUserId, action: 'apply' })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        router.push("/");
      } else {
        alert("申請失敗: " + data.error);
      }
    } catch (err) { alert("系統錯誤"); }
    setIsSubmitting(false);
  };

  if (isLoading || !memberInfo) return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-900" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-24">
      <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-50 px-6 py-4 flex items-center gap-4 max-w-lg mx-auto">
        <button onClick={() => router.push("/organization")} className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">無憂退出申請</h1>
      </nav>

      <main className="p-6 max-w-lg mx-auto space-y-8 mt-2">
        
        {memberInfo.status === 'exit_pending' ? (
          <div className="bg-amber-50 rounded-[3rem] p-12 text-center border border-amber-100/50 shadow-sm space-y-6">
             <div className="w-20 h-20 bg-amber-400 rounded-full flex items-center justify-center mx-auto text-white shadow-xl shadow-amber-400/20">
                <History className="w-10 h-10" />
             </div>
             <div>
                <h2 className="text-xl font-bold text-amber-900">審核程序中</h2>
                <p className="text-xs text-amber-700/60 mt-2 leading-relaxed">總部正在為您核算最終退款金額，<br/>請留意手機通知或客服訊息。</p>
             </div>
          </div>
        ) : memberInfo.status === 'exited' ? (
          <div className="bg-emerald-50 rounded-[3rem] p-12 text-center border border-emerald-100/50 shadow-sm space-y-6">
             <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-white shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
             </div>
             <div>
                <h2 className="text-xl font-bold text-emerald-900">已完成退出</h2>
                <p className="text-xs text-emerald-700/60 mt-2 leading-relaxed">感謝您過去的參與，您的夥伴帳號已正式結案。</p>
             </div>
          </div>
        ) : simulation ? (
          <>
            <section className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
               
               <div className="relative z-10 flex items-center gap-4 mb-10">
                  <FileText className="w-6 h-6 text-indigo-400" />
                  <h3 className="text-lg font-black tracking-tight">結算財務報告</h3>
               </div>

               <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-center opacity-80">
                     <span className="text-xs font-medium">預收款餘額</span>
                     <span className="font-mono font-bold">${Number(simulation.virtualBalance).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-rose-400">
                     <span className="text-xs font-medium">需扣回之獎金總額</span>
                     <span className="font-mono font-bold">-${Number(simulation.totalCommissionReceived).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-rose-400">
                     <span className="text-xs font-medium">行政手續費</span>
                     <span className="font-mono font-bold">-${Number(simulation.adminFee).toLocaleString()}</span>
                  </div>
                  
                  <div className="pt-8 border-t border-white/10 flex justify-between items-end">
                     <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">預計退還總額</p>
                     <p className="text-4xl font-black tracking-tighter text-emerald-400">${Number(simulation.finalRefundAmount).toLocaleString()}</p>
                  </div>
               </div>
            </section>

            <div className="bg-rose-50 rounded-[2rem] p-6 border border-rose-100 flex items-start gap-4">
               <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
               <p className="text-[10px] text-rose-700 leading-relaxed font-bold">
                 退出申請送出後，您的 B2B 創業夥伴資格將立即暫停。總部核算後會將款項匯入您綁定的實體銀行帳戶，此動作無法復原。
               </p>
            </div>

            <button 
              onClick={handleApplyExit}
              disabled={isSubmitting}
              className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-sm hover:bg-slate-800 transition shadow-2xl shadow-slate-900/10 flex items-center justify-center gap-3"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>確認並送出申請 <ArrowRight className="w-4 h-4" /></>}
            </button>
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-50">
             <Loader2 className="w-8 h-8 animate-spin text-slate-200 mx-auto" />
          </div>
        )}

        <div className="flex items-center gap-2 justify-center px-6">
           <Info className="w-3 h-3 text-slate-300" />
           <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">如有疑問請聯繫夥伴專屬客服</p>
        </div>
      </main>
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
