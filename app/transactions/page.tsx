"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  LayoutDashboard, 
  ShoppingBag, 
  Zap, 
  User, 
  Plus, 
  Loader2,
  ChevronRight,
  Filter,
  CreditCard,
  Gift
} from "lucide-react";

function TransactionContent() {
  const router = useRouter();
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"wallet" | "points">("wallet");
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const currentVersion = "3.0.2";
    const savedVersion = localStorage.getItem("churun_trans_version");
    if (savedVersion !== currentVersion) {
      localStorage.setItem("churun_trans_version", currentVersion);
      window.location.reload();
      return;
    }

    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    fetchData(savedId);
  }, [router, activeTab]);

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    const { data: mData } = await supabase.from("members").select("*").eq("id", userId).single();
    if (mData) {
      setMemberInfo(mData);
    }

    if (activeTab === "wallet") {
      const { data } = await supabase.from("wallet_transactions").select("*").eq("member_id", userId).order("created_at", { ascending: false }).limit(20);
      setTransactions(data || []);
    } else {
      const { data } = await supabase.from("point_transactions").select("*").eq("member_id", userId).order("created_at", { ascending: false }).limit(20);
      setTransactions(data || []);
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-[#FDFBF7] min-h-screen">
      
      {/* Header */}
      <nav className="bg-white/90 backdrop-blur-3xl sticky top-0 z-50 border-b border-slate-100 px-8 py-6 flex justify-between items-center max-w-lg mx-auto">
        <h1 className="text-sm font-black tracking-[0.3em] text-emerald-600 uppercase flex items-center gap-2">
           精品數位帳本 <span className="text-[7px] bg-emerald-50 px-2 py-1 rounded-full text-emerald-600 border border-emerald-100 font-bold">V3.0.2</span>
        </h1>
        <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
           <Filter className="w-4 h-4" />
        </div>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-12 mt-4 pb-60">
        
        {/* Swippable Asset Cards */}
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
           <motion.div 
             whileTap={{ scale: 0.95 }}
             onClick={() => { setActiveTab("wallet"); setShowHistory(!showHistory); }}
             className={`min-w-[280px] p-8 rounded-[2.5rem] transition-all duration-500 relative overflow-hidden cursor-pointer flex-1 ${activeTab === 'wallet' ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/40' : 'bg-white text-slate-400 border border-slate-100'}`}
           >
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              <div className="flex justify-between items-start mb-2">
                 <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-60">虛擬預收餘額</p>
              </div>
              <h2 className="text-4xl font-black tracking-tighter leading-none">${Number(memberInfo?.virtual_balance || 0).toLocaleString()}</h2>
              <div className="mt-8 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                       <CreditCard className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">數位錢包</span>
                 </div>
                 <ChevronRight className={`w-4 h-4 transition-transform duration-500 ${showHistory && activeTab === 'wallet' ? 'rotate-90' : ''}`} />
              </div>
           </motion.div>

           <motion.div 
             whileTap={{ scale: 0.95 }}
             onClick={() => { setActiveTab("points"); setShowHistory(!showHistory); }}
             className={`min-w-[280px] p-8 rounded-[2.5rem] transition-all duration-500 relative overflow-hidden cursor-pointer flex-1 ${activeTab === 'points' ? 'bg-emerald-900 text-white shadow-2xl shadow-emerald-900/40' : 'bg-white text-slate-400 border border-slate-100'}`}
           >
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              <div className="flex justify-between items-start mb-2">
                 <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-60">紅利點數</p>
              </div>
              <h2 className="text-4xl font-black tracking-tighter leading-none">{memberInfo?.points_balance?.toLocaleString() || 0} <span className="text-xs font-medium ml-1">pts</span></h2>
              <div className="mt-8 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                       <Gift className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">獎勵計畫</span>
                 </div>
                 <ChevronRight className={`w-4 h-4 transition-transform duration-500 ${showHistory && activeTab === 'points' ? 'rotate-90' : ''}`} />
              </div>
           </motion.div>
        </div>

        {/* Transaction History Section */}
        <section className="space-y-6">
           <div className="px-4 flex justify-between items-center">
              <h3 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase">帳務異動動態</h3>
              <History className="w-4 h-4 text-slate-200" />
           </div>
           <div className="space-y-3">
              {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-200" /></div>
              ) : transactions.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-16 text-center border border-slate-50">
                   <p className="text-xs text-slate-300 font-bold">目前尚無異動紀錄</p>
                </div>
              ) : (
                transactions.slice(0, 10).map((tx) => (
                   <div key={tx.id} className="bg-white rounded-[2.5rem] p-6 border border-slate-50 flex items-center gap-5">
                      <div className="w-14 h-14 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-400 font-black text-xs">
                         {tx.amount > 0 ? '+' : '-'}
                      </div>
                      <div className="flex-1">
                         <h4 className="font-black text-slate-800 text-sm">{tx.transaction_type}</h4>
                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">{new Date(tx.created_at).toLocaleDateString()}</p>
                      </div>
                      <p className={`text-xl font-black tracking-tighter ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>{Math.abs(tx.amount).toLocaleString()}</p>
                   </div>
                ))
              )}
           </div>
        </section>
      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 z-50">
         <div className="bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] p-3 flex justify-between items-center border border-white/5 shadow-2xl">
            <Link href="/" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition"><LayoutDashboard className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-[0.2em]">主頁</span></Link>
            <Link href="/store" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition"><ShoppingBag className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-[0.2em]">商城</span></Link>
            <div onClick={() => router.push("/")} className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center -mt-8 border-4 border-[#FDFBF7] shadow-lg shadow-emerald-500/30 cursor-pointer"><Plus className="w-6 h-6 text-white" /></div>
            <Link href="/organization" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition"><Zap className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-[0.2em]">組織</span></Link>
            <Link href="/profile" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition"><User className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-[0.2em]">個人</span></Link>
         </div>
      </div>
    </div>
  );
}

export default function Transactions() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>}>
      <TransactionContent />
    </Suspense>
  );
}
