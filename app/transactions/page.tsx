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

  useEffect(() => {
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
    setMemberInfo(mData);

    if (activeTab === "wallet") {
      const { data } = await supabase.from("wallet_transactions").select("*").eq("member_id", userId).order("created_at", { ascending: false });
      setTransactions(data || []);
    } else {
      const { data } = await supabase.from("point_transactions").select("*").eq("member_id", userId).order("created_at", { ascending: false });
      setTransactions(data || []);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-50 px-8 py-6 flex justify-between items-center max-w-lg mx-auto">
        <h1 className="text-sm font-black tracking-[0.3em] text-slate-800 uppercase">精品數位帳本</h1>
        <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
           <Filter className="w-4 h-4" />
        </div>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-10 mt-4">
        
        {/* Swippable Asset Cards */}
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
           <motion.div 
             whileTap={{ scale: 0.95 }}
             onClick={() => setActiveTab("wallet")}
             className={`min-w-[280px] p-10 rounded-[3rem] transition-all duration-500 relative overflow-hidden cursor-pointer ${activeTab === 'wallet' ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/30' : 'bg-white text-slate-400 border border-slate-100'}`}
           >
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              <p className="text-[8px] font-black uppercase tracking-[0.3em] mb-2 opacity-60">虛擬預收餘額</p>
              <h2 className="text-3xl font-black tracking-tighter">${Number(memberInfo?.virtual_balance || 0).toLocaleString()}</h2>
              <div className="mt-8 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">數位錢包</span>
                 </div>
                 {activeTab === 'wallet' && memberInfo?.is_b2b && (
                   <Link href="/withdraw" className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl text-[8px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/20 transition">
                      申請提領
                   </Link>
                 )}
              </div>
           </motion.div>

           <motion.div 
             whileTap={{ scale: 0.95 }}
             onClick={() => setActiveTab("points")}
             className={`min-w-[280px] p-10 rounded-[3rem] transition-all duration-500 relative overflow-hidden cursor-pointer ${activeTab === 'points' ? 'bg-emerald-900 text-white shadow-2xl shadow-emerald-900/30' : 'bg-white text-slate-400 border border-slate-100'}`}
           >
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              <p className="text-[8px] font-black uppercase tracking-[0.3em] mb-2 opacity-60">紅利點數</p>
              <h2 className="text-3xl font-black tracking-tighter">{memberInfo?.points_balance?.toLocaleString() || 0} <span className="text-xs font-medium ml-1">pts</span></h2>
              <div className="mt-8 flex items-center gap-2">
                 <Gift className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest">獎勵計畫</span>
              </div>
           </motion.div>
        </div>

         {/* Transaction Feed */}
         <section className="space-y-6">
            <div className="flex justify-between items-center px-4">
               <h3 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase">交易動態回報</h3>
               <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">近期</span>
            </div>

            <div className="space-y-3">
               {isLoading ? (
                 <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-200" /></div>
               ) : transactions.length === 0 ? (
                 <div className="bg-white rounded-[2.5rem] p-16 text-center border border-slate-50 shadow-sm">
                    <History className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                    <p className="text-xs text-slate-300 font-bold">目前尚無交易紀錄</p>
                 </div>
               ) : (
                 transactions.map((tx, i) => {
                   const isIncome = tx.amount > 0 || tx.transaction_type?.includes("獎金") || tx.transaction_type?.includes("儲值");
                   return (
                     <motion.div 
                       key={tx.id}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: i * 0.05 }}
                       className="bg-white rounded-[2rem] p-6 border border-slate-50 shadow-sm flex items-center gap-5 group hover:border-slate-200 transition"
                     >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${isIncome ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                           {isIncome ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                        </div>
                        <div className="flex-1">
                           <h4 className="font-bold text-slate-800 text-sm">{tx.transaction_type}</h4>
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">
                              {new Date(tx.created_at).toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                           </p>
                        </div>
                        <div className="text-right">
                           <p className={`text-lg font-black tracking-tighter ${isIncome ? 'text-emerald-600' : 'text-slate-800'}`}>
                              {isIncome ? '+' : '-'}{Math.abs(Number(tx.amount)).toLocaleString()}
                           </p>
                           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-0.5">Completed</p>
                        </div>
                     </motion.div>
                   );
                 })
               )}
            </div>
         </section>

         {/* Bank Account Settings */}
         <section className="space-y-6">
            <div className="flex justify-between items-center px-4">
               <h3 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase">提領帳戶設定</h3>
               <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Secure Link</span>
               </div>
            </div>

            <div className="bg-white rounded-[3rem] p-10 border border-slate-50 shadow-[0_20px_50px_rgba(0,0,0,0.02)] space-y-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
               
               <div className="space-y-6 relative z-10">
                  <div className="grid grid-cols-1 gap-6">
                     <div className="space-y-2">
                        <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-2">帳戶名稱 (戶名)</label>
                        <input 
                           type="text" 
                           defaultValue={memberInfo?.beneficiary || memberInfo?.name}
                           id="bank_account_name"
                           className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-black text-slate-800 focus:ring-2 focus:ring-emerald-500/20 transition"
                           placeholder="請輸入銀行戶名"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-2">銀行代碼 (預設國泰世華)</label>
                        <div className="flex gap-4">
                           <input 
                              type="text" 
                              defaultValue={memberInfo?.bank_code || "013"}
                              id="bank_code"
                              className="w-24 bg-slate-50 border-none rounded-2xl p-5 text-sm font-black text-slate-800 focus:ring-2 focus:ring-emerald-500/20 transition text-center"
                              placeholder="013"
                           />
                           <div className="flex-1 bg-slate-100 rounded-2xl p-5 text-xs font-black text-slate-400 flex items-center px-6">
                              國泰世華商業銀行
                           </div>
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-2">銀行帳號</label>
                        <input 
                           type="text" 
                           defaultValue={memberInfo?.bank_account}
                           id="bank_account"
                           className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-black text-slate-800 focus:ring-2 focus:ring-emerald-500/20 transition"
                           placeholder="請輸入匯款帳號"
                        />
                     </div>
                  </div>

                  <button 
                    onClick={async () => {
                      const nameInput = document.getElementById('bank_account_name') as HTMLInputElement;
                      const codeInput = document.getElementById('bank_code') as HTMLInputElement;
                      const accountInput = document.getElementById('bank_account') as HTMLInputElement;
                      
                      setIsLoading(true);
                      const { error } = await supabase.from('members').update({
                        beneficiary: nameInput.value,
                        bank_code: codeInput.value,
                        bank_account: accountInput.value
                      }).eq('id', memberInfo.id);
                      
                      if (!error) {
                        alert('帳戶資訊已成功加密儲存！');
                        // Refresh data locally
                        const { data: updated } = await supabase.from("members").select("*").eq("id", memberInfo.id).single();
                        setMemberInfo(updated);
                      } else {
                        alert('更新失敗，請檢查網路連線。');
                      }
                      setIsLoading(false);
                    }}
                    className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 active:scale-95 transition"
                  >
                     更新匯款帳戶資訊
                  </button>
               </div>
            </div>
         </section>

      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 z-50">
         <div className="bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] p-3 flex justify-between items-center shadow-2xl shadow-slate-900/30 border border-white/5">
            <Link href="/" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <LayoutDashboard className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Dashboard</span>
            </Link>
            <Link href="/store" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <ShoppingBag className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Shop</span>
            </Link>
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 -mt-8 border-4 border-[#FDFBF7]">
               <Plus className="w-6 h-6 text-white" />
            </div>
            <Link href="/organization" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <Zap className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Team</span>
            </Link>
            <Link href="/profile" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <User className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Me</span>
            </Link>
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
