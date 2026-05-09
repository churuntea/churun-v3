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

  const getTransactionLabel = (type: string, isWallet: boolean) => {
    if (isWallet) {
      switch (type) {
        case "commission_refund": return { label: "B2B 分紅折讓", desc: "合夥人進貨折讓返還", color: "text-emerald-600 bg-emerald-50" };
        case "withdrawal": return { label: "帳戶資金提領", desc: "提款至綁定銀行帳戶", color: "text-rose-600 bg-rose-50" };
        case "purchase": return { label: "進貨/商品消費", desc: "商城進貨扣除貨款", color: "text-amber-600 bg-amber-50" };
        case "deposit": return { label: "錢包儲值進貨", desc: "匯款儲值至預收帳戶", color: "text-indigo-600 bg-indigo-50" };
        case "admin_adjustment": return { label: "總部手動調整", desc: "總部系統管理調整", color: "text-slate-600 bg-slate-50" };
        default: return { label: type || "其他異動", desc: "錢包帳務異動紀錄", color: "text-slate-600 bg-slate-50" };
      }
    } else {
      switch (type) {
        case "points_reward": return { label: "購物積分回饋", desc: "商城消費累積之點數", color: "text-amber-600 bg-amber-50" };
        case "redeem": return { label: "點數兌換商品", desc: "點數商城商品兌換", color: "text-rose-600 bg-rose-50" };
        case "admin_adjustment": return { label: "總部點數調整", desc: "總部系統點數調整", color: "text-slate-600 bg-slate-50" };
        default: return { label: type || "其他點數異動", desc: "點數異動明細紀錄", color: "text-slate-600 bg-slate-50" };
      }
    }
  };

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
        
        {/* Fixed Asset Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
           <motion.div 
             whileTap={{ scale: 0.95 }}
             onClick={() => { setActiveTab("wallet"); setShowHistory(!showHistory); }}
             className={`p-6 sm:p-8 rounded-[2.5rem] transition-all duration-500 relative overflow-hidden cursor-pointer w-full ${activeTab === 'wallet' ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/40' : 'bg-white text-slate-400 border border-slate-100'}`}
           >
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              <div className="flex justify-between items-start mb-2">
                 <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">虛擬預收餘額</p>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tighter leading-none">${Number(memberInfo?.virtual_balance || 0).toLocaleString()}</h2>
              <div className="mt-8 flex justify-between items-center">
                 <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                       <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest truncate">數位錢包</span>
                 </div>
                 <ChevronRight className={`w-4 h-4 shrink-0 transition-transform duration-500 ${showHistory && activeTab === 'wallet' ? 'rotate-90' : ''}`} />
              </div>
           </motion.div>

           <motion.div 
             whileTap={{ scale: 0.95 }}
             onClick={() => { setActiveTab("points"); setShowHistory(!showHistory); }}
             className={`p-6 sm:p-8 rounded-[2.5rem] transition-all duration-500 relative overflow-hidden cursor-pointer w-full ${activeTab === 'points' ? 'bg-emerald-900 text-white shadow-2xl shadow-emerald-900/40' : 'bg-white text-slate-400 border border-slate-100'}`}
           >
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              <div className="flex justify-between items-start mb-2">
                 <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">紅利點數</p>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tighter leading-none">{memberInfo?.points_balance?.toLocaleString() || 0} <span className="text-xs font-medium ml-1">pts</span></h2>
              <div className="mt-8 flex justify-between items-center">
                 <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                       <Gift className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest truncate">獎勵計畫</span>
                 </div>
                 <ChevronRight className={`w-4 h-4 shrink-0 transition-transform duration-500 ${showHistory && activeTab === 'points' ? 'rotate-90' : ''}`} />
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
                 transactions.slice(0, 20).map((tx) => {
                    const info = getTransactionLabel(tx.transaction_type, activeTab === "wallet");
                    const isPositive = Number(tx.amount) > 0;
                    return (
                       <div key={tx.id} className="bg-white rounded-[2.5rem] p-6 border border-slate-50 flex items-center justify-between shadow-sm hover:scale-[1.01] transition duration-200">
                          <div className="flex items-center gap-4 min-w-0">
                             <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center font-black text-sm shrink-0 ${info.color}`}>
                                {isPositive ? '+' : '-'}
                             </div>
                             <div className="text-left min-w-0">
                                <h4 className="font-black text-slate-800 text-sm truncate">{info.label}</h4>
                                <p className="text-[9px] font-bold text-slate-300 mt-1 uppercase tracking-tight truncate">{info.desc}</p>
                             </div>
                          </div>
                          <div className="text-right shrink-0 ml-4">
                             <p className={`text-base font-black tracking-tighter ${isPositive ? 'text-emerald-600' : 'text-slate-800'}`}>
                                {isPositive ? '+' : '-'}{Math.abs(Number(tx.amount)).toLocaleString()}
                             </p>
                             <p className="text-[8px] font-mono font-bold text-slate-300 mt-0.5 tracking-wider">{new Date(tx.created_at).toLocaleDateString()}</p>
                          </div>
                       </div>
                    );
                 })
              )}
           </div>
        </section>
      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-8 left-4 right-4 z-50 mx-auto max-w-sm">
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
