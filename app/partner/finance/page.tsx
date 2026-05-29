"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, CreditCard, Download, Loader2, ArrowUpRight, Banknote } from "lucide-react";

function PartnerFinanceContent() {
  const router = useRouter();
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statements, setStatements] = useState<{month: string, amount: number}[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/me/dashboard");
        if (!res.ok) throw new Error("Fetch failed");
        const data = await res.json();
        
        if (!data.member || !data.member.tier?.includes("合夥人")) {
           router.replace("/");
           return;
        }
        setMemberInfo(data.member);

        // Fetch wallet transactions for statements
        const { data: txData } = await supabase
          .from("wallet_transactions")
          .select("*")
          .eq("member_id", data.member.id)
          .eq("transaction_type", "commission_refund")
          .order("created_at", { ascending: false });

        if (txData) {
           const monthlyData: Record<string, number> = {};
           txData.forEach((tx: any) => {
             const date = new Date(tx.created_at);
             const monthKey = `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
             monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Number(tx.amount);
           });
           
           const formattedStatements = Object.keys(monthlyData).map(key => ({
             month: key,
             amount: monthlyData[key]
           }));
           setStatements(formattedStatements);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (isLoading) return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 pb-32 font-sans">
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 px-6 py-6 flex items-center justify-between max-w-lg mx-auto">
        <button onClick={() => router.push("/partner")} className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 active:scale-90 transition">
          <ChevronLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-emerald-400" />
          <h1 className="text-[11px] font-black tracking-[0.3em] text-white uppercase">專屬對帳單</h1>
        </div>
      </nav>

      <main className="p-6 max-w-lg mx-auto space-y-8">
         <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 p-8 rounded-[2.5rem] border border-emerald-500/20 shadow-2xl relative overflow-hidden"
         >
            <div className="absolute top-0 right-0 p-6 opacity-10">
               <Banknote className="w-24 h-24 text-white" />
            </div>
            <div className="relative z-10 space-y-6">
               <div>
                  <p className="text-[10px] font-black text-emerald-300 tracking-widest uppercase mb-1">可提領餘額</p>
                  <h2 className="text-4xl font-black text-white flex items-baseline gap-2">
                     <span className="text-sm">NT$</span> {Number(memberInfo?.virtual_balance || 0).toLocaleString()}
                  </h2>
               </div>
               <div className="flex gap-4">
                  <button className="flex-1 bg-white text-emerald-900 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-50 transition-colors shadow-lg">
                     申請提領
                  </button>
                  <button className="flex-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500/30 transition-colors">
                     綁定銀行
                  </button>
               </div>
            </div>
         </motion.div>

         <section className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 tracking-widest uppercase">財務報表下載</h3>
            <div className="space-y-3">
               {statements.length > 0 ? statements.map((record, i) => (
                 <div key={i} className="flex items-center justify-between bg-slate-900/50 p-5 rounded-2xl border border-white/5 hover:bg-slate-800 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-white/10 group-hover:bg-slate-700 transition-colors">
                          <Download className="w-4 h-4 text-emerald-400" />
                       </div>
                       <div>
                          <p className="text-sm font-black text-white">{record.month} 結算報表</p>
                          <p className="text-[10px] font-bold text-slate-500">PDF 格式</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-emerald-400 font-mono">+${record.amount.toLocaleString()}</p>
                    </div>
                 </div>
               )) : (
                 <div className="text-center py-8 bg-slate-900/30 rounded-2xl border border-dashed border-white/5">
                    <p className="text-xs font-bold text-slate-500">目前尚無歷史報表</p>
                 </div>
               )}
            </div>
         </section>
      </main>
    </div>
  );
}

export default function PartnerFinance() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0F172A] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-amber-500" /></div>}>
      <PartnerFinanceContent />
    </Suspense>
  );
}
