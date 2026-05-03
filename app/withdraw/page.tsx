"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  CreditCard, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  DollarSign,
  ArrowRight,
  Info,
  History
} from "lucide-react";
import Link from "next/link";
import Toast from "@/components/Toast";

function WithdrawContent() {
  const router = useRouter();
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"input" | "success">("input");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" as "success" | "error" | "info" });

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

  const handleWithdraw = async () => {
    if (!amount || Number(amount) <= 0) {
      setToast({ show: true, message: "請輸入正確金額", type: "error" });
      return;
    }
    if (Number(amount) > Number(memberInfo.virtual_balance)) {
      setToast({ show: true, message: "餘額不足，請調整提領金額", type: "error" });
      return;
    }
    if (!memberInfo.bank_account) {
      setToast({ show: true, message: "請先設定銀行帳號以完成提領", type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const withdrawAmount = Number(amount);
      
      // 1. 扣除餘額
      const { error: updateError } = await supabase
        .from("members")
        .update({ virtual_balance: Number(memberInfo.virtual_balance) - withdrawAmount })
        .eq("id", memberInfo.id);
      
      if (updateError) throw updateError;

      // 2. 建立交易紀錄
      const { error: txError } = await supabase
        .from("wallet_transactions")
        .insert({
          member_id: memberInfo.id,
          amount: -withdrawAmount,
          transaction_type: "withdrawal",
          status: "pending"
        });

      if (txError) throw txError;

      // 3. 新增通知
      await supabase.from("notifications").insert({
        member_id: memberInfo.id,
        title: "提領申請已送出",
        content: `您的提領申請 $${withdrawAmount.toLocaleString()} 已進入審核階段，預計 1-3 個工作天撥款。`,
        type: "withdrawal"
      });

      setStep("success");
    } catch (err: any) {
      setToast({ show: true, message: "提領失敗: " + err.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !memberInfo) return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>
  );

  if (step === "success") return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center space-y-12">
       <motion.div 
         initial={{ scale: 0.5, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30"
       >
          <CheckCircle2 className="w-16 h-16 text-white" />
       </motion.div>
       <div className="space-y-4">
          <h2 className="text-3xl font-black text-slate-800">申請已提交</h2>
          <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed font-medium">
             您的提領申請已送出，我們將在 3-5 個工作天內完成審核並撥款至您的綁定帳戶。
          </p>
       </div>
       <button 
         onClick={() => router.push("/transactions/withdrawals")}
         className="w-full max-w-xs bg-slate-900 text-white py-6 rounded-[2rem] font-black text-sm tracking-[0.2em] shadow-xl"
       >
          查看提領明細
       </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-20">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-50 px-8 py-8 flex items-center gap-6 max-w-lg mx-auto">
         <button onClick={() => router.back()} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
         </button>
         <div>
            <h1 className="text-xl font-black tracking-tight text-slate-800">資產提領</h1>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Secure Withdrawal</p>
         </div>
         <button 
           onClick={() => router.push("/transactions/withdrawals")}
           className="ml-auto w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 text-slate-400 hover:text-emerald-600 transition"
         >
            <History className="w-5 h-5" />
         </button>
      </nav>

      <main className="max-w-lg mx-auto p-8 space-y-10">
        
        {/* Balance Display */}
        <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
           <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-500 rounded-full blur-[80px] opacity-20"></div>
           <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-3">可提領餘額</p>
           <h2 className="text-4xl font-black tracking-tighter text-emerald-400">${Number(memberInfo.virtual_balance).toLocaleString()}</h2>
        </div>

        {/* Input Area */}
        <div className="space-y-6">
           <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">提領金額</label>
              <div className="relative">
                 <DollarSign className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300" />
                 <input 
                   type="number" 
                   placeholder="0.00" 
                   value={amount}
                   onChange={e => setAmount(e.target.value)}
                   className="w-full bg-white border border-slate-100 p-8 pl-16 rounded-[2.5rem] text-3xl font-black tracking-tighter text-slate-800 focus:ring-4 focus:ring-emerald-500/5 transition shadow-sm outline-none"
                 />
              </div>
           </div>

           {/* Bank Info Mini-Card */}
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
                 <CreditCard className="w-6 h-6 text-indigo-500" />
              </div>
              <div className="flex-1 space-y-1">
                 <h4 className="text-sm font-black text-slate-800">
                    {memberInfo.bank_account ? `綁定帳號 (${memberInfo.bank_code})` : '尚未綁定帳號'}
                 </h4>
                 <p className="text-[10px] font-bold text-slate-300 tracking-widest uppercase">
                    {memberInfo.bank_account ? memberInfo.bank_account.replace(/(.{4})/g, '$1 ') : '請先前往個人中心設定'}
                 </p>
              </div>
              {!memberInfo.bank_account && (
                <Link href="/profile" className="text-emerald-600">
                   <ArrowRight className="w-5 h-5" />
                </Link>
              )}
           </div>
        </div>

        {/* Info Box */}
        <div className="bg-amber-50 rounded-[2rem] p-6 flex items-start gap-4 border border-amber-100">
           <Info className="w-5 h-5 text-amber-500 shrink-0 mt-1" />
           <p className="text-[10px] font-medium text-amber-700 leading-relaxed">
              * 提領手續費為 15 元，將從提領金額中扣除。<br/>
              * 每月 10 日及 25 日為統一撥款日，請耐心等候。
           </p>
        </div>

        {/* Action Button */}
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isSubmitting || !amount}
          onClick={handleWithdraw}
          className="w-full bg-emerald-900 text-white py-8 rounded-[2.5rem] font-black text-sm tracking-[0.2em] shadow-2xl shadow-emerald-900/30 flex items-center justify-center gap-4 transition disabled:opacity-50"
        >
           {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "確認申請提領"} 
           {!isSubmitting && <ShieldCheck className="w-5 h-5" />}
        </motion.button>

        <Toast 
          isVisible={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />

      </main>
    </div>
  );
}

export default function Withdraw() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>}>
      <WithdrawContent />
    </Suspense>
  );
}
