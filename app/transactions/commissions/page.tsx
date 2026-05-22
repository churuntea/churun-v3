"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../supabase";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Coins, 
  Award, 
  Sparkles, 
  TrendingUp, 
  ArrowUpRight,
  Loader2,
  HelpCircle
} from "lucide-react";

export default function CommissionHistory() {
  const router = useRouter();
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedId = null /* removed */;
    if (!savedId) {
      router.replace("/");
      return;
    }
    fetchData(savedId);
  }, []);

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    // 1. Fetch member info
    const { data: mData } = await supabase.from("members").select("*").eq("id", userId).single();
    if (!mData || !mData.is_b2b) {
      router.replace("/");
      return;
    }
    setMemberInfo(mData);

    // 2. Fetch commission transactions
    const { data: txData } = await supabase
      .from("wallet_transactions")
      .select("*, orders(total_amount, member:members(name))")
      .eq("member_id", userId)
      .eq("transaction_type", "commission_refund")
      .order("created_at", { ascending: false });

    setCommissions(txData || []);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-24">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 max-w-lg mx-auto flex justify-between items-center bg-[#FDFBF7]/80 backdrop-blur-xl border-b border-slate-100">
         <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50">
            <ArrowLeft className="w-4 h-4 text-slate-400" />
         </button>
         <h1 className="text-xs font-black tracking-[0.3em] text-slate-800 uppercase leading-none">推廣獎金明細</h1>
         <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50">
            <HelpCircle className="w-4 h-4 text-slate-300" />
         </div>
      </nav>

      <main className="max-w-lg mx-auto px-6 pt-24 space-y-8">
        {memberInfo && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-slate-900 p-10 rounded-[3rem] shadow-2xl shadow-emerald-900/10 text-white overflow-hidden"
          >
             <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
             <div className="relative z-10 flex justify-between items-start mb-6">
                <div className="space-y-1">
                   <p className="text-[10px] font-black tracking-[0.3em] uppercase text-emerald-400">Available Commission</p>
                   <p className="text-sm font-bold text-white/50">目前累積可提領餘額</p>
                </div>
                <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-1.5">
                   <Sparkles className="w-3 h-3 text-amber-300" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-white">創業夥伴專屬</span>
                </div>
             </div>
             
             <h2 className="text-4xl font-black tracking-tighter leading-none relative z-10">
                NT$ {Number(memberInfo.virtual_balance).toLocaleString()}
             </h2>
             
             <div className="mt-8 flex justify-between items-center relative z-10 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2">
                   <Coins className="w-4 h-4 text-emerald-400" />
                   <span className="text-xs font-black text-slate-300">提領帳戶</span>
                </div>
                <button onClick={() => router.push("/withdraw")} className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1 hover:opacity-80 transition">
                   申請提領 <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
             </div>
          </motion.section>
        )}

        <section className="space-y-6">
           <div className="px-4 flex justify-between items-center">
              <h3 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase">獎金發放動態</h3>
              <TrendingUp className="w-4 h-4 text-slate-300" />
           </div>
          
          {isLoading ? (
             <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
          ) : commissions.length === 0 ? (
            <div className="bg-white p-16 rounded-[2.5rem] text-center border border-slate-50 shadow-sm">
               <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <Coins className="w-6 h-6" />
               </div>
               <p className="text-xs font-bold text-slate-300">目前尚未有推廣獎勵發放紀錄</p>
            </div>
          ) : (
            <div className="space-y-3">
              {commissions.map((tx, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={tx.id} 
                  className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm flex justify-between items-center hover:scale-[1.01] transition duration-200"
                >
                  <div className="flex items-center gap-4 min-w-0">
                     <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-[1.25rem] flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5" />
                     </div>
                     <div className="text-left min-w-0">
                        <p className="text-sm font-black text-slate-800">推廣佣金折讓</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight truncate">
                           下線: <span className="text-slate-600">{tx.orders?.member?.name || "合夥成員"}</span> | 訂單額: NT$ {Number(tx.orders?.total_amount || 0).toLocaleString()}
                        </p>
                     </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                     <p className="text-base font-black tracking-tighter text-emerald-600">+NT$ {Number(tx.amount).toLocaleString()}</p>
                     <p className="text-[8px] font-mono font-bold text-slate-300 mt-0.5 tracking-wider">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
