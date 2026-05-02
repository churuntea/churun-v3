"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { 
  ChevronLeft, 
  Wallet, 
  Star, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  LayoutDashboard, 
  ShoppingBag, 
  Plus, 
  Zap, 
  User, 
  Loader2,
  Filter
} from "lucide-react";

function TransactionsContent() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState<'wallet' | 'points'>('wallet');
  const [walletTx, setWalletTx] = useState<any[]>([]);
  const [pointTx, setPointTx] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    setCurrentUserId(savedId);
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUserId) return;
      setIsLoading(true);
      
      const { data: mData } = await supabase.from("members").select("*").eq("id", currentUserId).single();
      setMemberInfo(mData);
      
      if (mData && !mData.is_b2b) {
        setActiveTab('points');
      }

      if (mData?.is_b2b) {
        const { data: wTx } = await supabase.from("wallet_transactions").select("*").eq("member_id", currentUserId).order("created_at", { ascending: false });
        setWalletTx(wTx || []);
      }

      const { data: pTx } = await supabase.from("point_transactions").select("*").eq("member_id", currentUserId).order("created_at", { ascending: false });
      setPointTx(pTx || []);

      setIsLoading(false);
    };
    fetchData();
  }, [currentUserId]);

  if (isLoading || !memberInfo) return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-900" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-50 px-6 py-4 flex items-center gap-4 max-w-lg mx-auto">
        <button onClick={() => router.push("/")} className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">帳務明細</h1>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-8 mt-2">
        
        {/* Tabs */}
        <div className="flex bg-slate-100 p-2 rounded-[2rem] gap-2">
          {memberInfo.is_b2b && (
            <button 
              onClick={() => setActiveTab('wallet')}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition ${activeTab === 'wallet' ? 'bg-indigo-900 text-white shadow-xl shadow-indigo-900/20' : 'text-slate-400'}`}
            >
              虛擬帳戶
            </button>
          )}
          <button 
            onClick={() => setActiveTab('points')}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition ${activeTab === 'points' ? 'bg-emerald-900 text-white shadow-xl shadow-emerald-900/20' : 'text-slate-400'}`}
          >
            紅利點數
          </button>
        </div>

        {/* Summary Card */}
        <section className={`${activeTab === 'wallet' ? 'bg-indigo-900' : 'bg-emerald-900'} rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl transition-colors duration-500`}>
           <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/5 blur-2xl"></div>
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">
             目前可用{activeTab === 'wallet' ? '餘額' : '點數'}
           </p>
           <h3 className="text-4xl font-black tracking-tight">
             {activeTab === 'wallet' ? `$${Number(memberInfo.virtual_balance).toLocaleString()}` : `${memberInfo.points_balance.toLocaleString()} PTS`}
           </h3>
        </section>

        {/* Transaction List */}
        <div className="space-y-4">
           <div className="flex justify-between items-center px-2">
              <h3 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase">交易歷史</h3>
              <Filter className="w-4 h-4 text-slate-300" />
           </div>

           <div className="space-y-4">
             {(activeTab === 'wallet' ? walletTx : pointTx).length === 0 ? (
               <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-50">
                  <Clock className="w-10 h-10 text-slate-100 mx-auto mb-4" />
                  <p className="text-xs font-bold text-slate-300">尚無交易紀錄</p>
               </div>
             ) : (
               (activeTab === 'wallet' ? walletTx : pointTx).map((tx) => (
                 <div key={tx.id} className="bg-white rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-slate-50 flex items-center gap-5 transition hover:border-slate-100">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${Number(tx.amount) > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                       {Number(tx.amount) > 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                       <h4 className="font-bold text-slate-800 text-sm">
                          {activeTab === 'wallet' ? (
                            tx.transaction_type === 'deposit' ? '儲值預收款' : 
                            tx.transaction_type === 'order_deduction' ? '下單扣款' :
                            tx.transaction_type === 'commission_refund' ? '直推獎金入帳' : 
                            tx.transaction_type === 'withdrawal' ? '提領結算' : tx.transaction_type
                          ) : (
                            tx.transaction_type === 'earned_from_order' ? '購物回饋' : 
                            tx.transaction_type === 'redeemed' ? '商城兌換扣點' : tx.transaction_type
                          )}
                       </h4>
                       <p className="text-[10px] font-medium text-slate-400 mt-1">{new Date(tx.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                       <p className={`font-black text-sm ${Number(tx.amount) > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {Number(tx.amount) > 0 ? '+' : ''}{Number(tx.amount).toLocaleString()}
                       </p>
                       {tx.status === 'pending' && <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">審核中</span>}
                    </div>
                 </div>
               ))
             )}
           </div>
        </div>

      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 z-50">
         <div className="bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] p-3 flex justify-between items-center shadow-2xl shadow-slate-900/30 border border-white/5">
            <Link href="/" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <LayoutDashboard className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">首頁</span>
            </Link>
            <Link href="/store" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <ShoppingBag className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">商城</span>
            </Link>
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 -mt-8 border-4 border-[#FDFBF7]">
               <Plus className="w-6 h-6 text-white" />
            </div>
            <Link href="/organization" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <Zap className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">組織</span>
            </Link>
            <Link href="/profile" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <User className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">我的</span>
            </Link>
         </div>
      </div>
    </div>
  );
}

export default function Transactions() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-900" /></div>}>
      <TransactionsContent />
    </Suspense>
  );
}
