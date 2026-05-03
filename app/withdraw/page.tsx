"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, 
  ArrowLeft, 
  Loader2, 
  ChevronRight, 
  Building2, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  ArrowUpRight
} from "lucide-react";

function WithdrawContent() {
  const router = useRouter();
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankInfo, setBankInfo] = useState({
    bankCode: "",
    account: "",
    name: ""
  });

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

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = Number(amount);
    
    if (withdrawAmount <= 0 || withdrawAmount > memberInfo.virtual_balance) {
      alert("金額輸入錯誤或餘額不足");
      return;
    }

    setIsSubmitting(true);
    
    // 建立提領申請
    const { error } = await supabase.from("wallet_transactions").insert({
      member_id: memberInfo.id,
      amount: -withdrawAmount,
      transaction_type: "withdrawal_request",
      status: "pending",
      metadata: { bank: bankInfo }
    });

    if (error) {
      alert("提交失敗: " + error.message);
      setIsSubmitting(false);
    } else {
      // 扣除預收餘額 (這裡應該由後端審核後再扣，但為了即時反饋，我們先扣除或標記凍結)
      // 這裡採用正式流程：先不扣，由後端審核通過後才扣，或直接扣除並標記為 pending。
      // 為了安全，我們這裡只發送請求，不直接修改 balance，除非是 Server Action。
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
           className="w-32 h-32 bg-emerald-500 rounded-[3rem] flex items-center justify-center shadow-2xl shadow-emerald-500/20"
         >
            <CheckCircle2 className="w-16 h-16 text-white" />
         </motion.div>
         <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">提領申請已提交</h2>
            <p className="text-sm text-slate-400 font-medium leading-relaxed px-10">
               我們已收到您的提領請求。總部將於 3-5 個工作天內完成審核並匯入您的指定帳戶。
            </p>
         </div>
         <button 
           onClick={() => router.push("/transactions")}
           className="bg-slate-900 text-white px-12 py-6 rounded-2xl font-black text-[10px] uppercase tracking-widest"
         >
            查看交易明細
         </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-50 px-8 py-6 flex items-center gap-6 max-w-lg mx-auto">
         <Link href="/transactions" className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition">
            <ArrowLeft className="w-5 h-5" />
         </Link>
         <h1 className="text-sm font-black tracking-[0.3em] text-slate-800 uppercase">獎金提領申請</h1>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-10 mt-4">
        
        {/* Balance Card */}
        <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
           <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-emerald-500 rounded-full blur-[100px] opacity-20"></div>
           <div className="relative z-10 space-y-1">
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/40">可提領餘額</p>
              <h2 className="text-4xl font-black tracking-tighter">${Number(memberInfo?.virtual_balance || 0).toLocaleString()}</h2>
           </div>
        </div>

        {/* Withdrawal Form */}
        <form onSubmit={handleWithdraw} className="space-y-8">
           <div className="space-y-6">
              <h3 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase px-2">提領詳情</h3>
              
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm space-y-8">
                 <div className="space-y-3">
                    <label className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em] ml-4">提領金額</label>
                    <div className="relative">
                       <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg font-black text-slate-300">$</span>
                       <input 
                         type="number" 
                         value={amount}
                         onChange={e => setAmount(e.target.value)}
                         placeholder="請輸入金額"
                         className="w-full bg-slate-50 border-none p-6 pl-12 rounded-2xl text-xl font-black focus:ring-2 focus:ring-emerald-500/10 transition"
                         required
                       />
                    </div>
                 </div>

                 <div className="space-y-4 pt-4 border-t border-slate-50">
                    <div className="grid grid-cols-3 gap-4">
                       <div className="col-span-1 space-y-2">
                          <label className="text-[8px] font-black text-slate-300 uppercase ml-2">銀行代碼</label>
                          <input type="text" placeholder="822" className="w-full bg-slate-50 border-none p-4 rounded-xl text-xs font-bold" value={bankInfo.bankCode} onChange={e => setBankInfo({...bankInfo, bankCode: e.target.value})} required />
                       </div>
                       <div className="col-span-2 space-y-2">
                          <label className="text-[8px] font-black text-slate-300 uppercase ml-2">銀行帳號</label>
                          <input type="text" placeholder="0000000000" className="w-full bg-slate-50 border-none p-4 rounded-xl text-xs font-bold" value={bankInfo.account} onChange={e => setBankInfo({...bankInfo, account: e.target.value})} required />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[8px] font-black text-slate-300 uppercase ml-2">戶名</label>
                       <input type="text" placeholder="您的姓名" className="w-full bg-slate-50 border-none p-4 rounded-xl text-xs font-bold" value={bankInfo.name} onChange={e => setBankInfo({...bankInfo, name: e.target.value})} required />
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-amber-50 rounded-[2rem] p-6 border border-amber-100 flex items-center gap-4">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
                 單次提領手續費為 $30。提領申請一經提交，相對應的金額將會被暫時凍結直到審核完成。
              </p>
           </div>

           <button 
             type="submit"
             disabled={isSubmitting}
             className="w-full bg-slate-900 text-white py-8 rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-4 active:scale-95 transition disabled:opacity-50"
           >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>確認提交提領申請 <ArrowUpRight className="w-5 h-5" /></>
              )}
           </button>
        </form>

        <div className="flex items-center justify-center gap-3 text-slate-300">
           <ShieldCheck className="w-4 h-4" />
           <span className="text-[8px] font-black uppercase tracking-widest">Secure SSL Encrypted Transaction</span>
        </div>

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
