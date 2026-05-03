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
    // Force cache break
    const currentVersion = "1.0.5";
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
    setMemberInfo(mData);

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
           精品數位帳本 <span className="text-[7px] bg-emerald-50 px-2 py-1 rounded-full text-emerald-600 border border-emerald-100 font-bold">V1.0.5</span>
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
             onClick={() => {
               setActiveTab("wallet");
               setShowHistory(!showHistory);
             }}
             className={`min-w-[310px] p-10 rounded-[3rem] transition-all duration-500 relative overflow-hidden cursor-pointer ${activeTab === 'wallet' ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/40' : 'bg-white text-slate-400 border border-slate-100'}`}
           >
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              <div className="flex justify-between items-start mb-2">
                 <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-60">虛擬預收餘額</p>
                 <motion.div 
                   animate={{ opacity: [0.4, 1, 0.4] }} 
                   transition={{ duration: 2, repeat: Infinity }}
                   className="flex items-center gap-1 bg-emerald-500/20 px-2 py-1 rounded-full"
                 >
                    <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
                    <span className="text-[6px] font-black text-emerald-400 uppercase tracking-widest">TAP FOR HISTORY</span>
                 </motion.div>
              </div>
              <h2 className="text-5xl font-black tracking-tighter leading-none">${Number(memberInfo?.virtual_balance || 0).toLocaleString()}</h2>
              <div className="mt-8 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                       <CreditCard className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">數位錢包</span>
                 </div>
                 <motion.div
                   animate={{ x: showHistory && activeTab === 'wallet' ? 0 : [0, 5, 0] }}
                   transition={{ repeat: Infinity, duration: 1.5 }}
                 >
                    <ChevronRight className={`w-5 h-5 transition-transform duration-500 ${showHistory && activeTab === 'wallet' ? 'rotate-90' : ''}`} />
                 </motion.div>
              </div>
           </motion.div>

           <motion.div 
             whileTap={{ scale: 0.95 }}
             onClick={() => {
               setActiveTab("points");
               setShowHistory(!showHistory);
             }}
             className={`min-w-[310px] p-10 rounded-[3rem] transition-all duration-500 relative overflow-hidden cursor-pointer ${activeTab === 'points' ? 'bg-emerald-900 text-white shadow-2xl shadow-emerald-900/40' : 'bg-white text-slate-400 border border-slate-100'}`}
           >
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              <div className="flex justify-between items-start mb-2">
                 <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-60">紅利點數</p>
                 <div className="flex items-center gap-1 bg-amber-500/20 px-2 py-1 rounded-full">
                    <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                    <span className="text-[6px] font-black text-amber-400 uppercase tracking-widest">LOYALTY PROGRAM</span>
                 </div>
              </div>
              <h2 className="text-5xl font-black tracking-tighter leading-none">{memberInfo?.points_balance?.toLocaleString() || 0} <span className="text-xs font-medium ml-1">pts</span></h2>
              <div className="mt-8 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                       <Gift className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">獎勵計畫</span>
                 </div>
                 <ChevronRight className={`w-5 h-5 transition-transform duration-500 ${showHistory && activeTab === 'points' ? 'rotate-90' : ''}`} />
              </div>
           </motion.div>
        </div>

        {/* Expandable History Section */}
        <AnimatePresence>
          {showHistory && (
            <motion.section 
              initial={{ height: 0, opacity: 0, scale: 0.95 }}
              animate={{ height: "auto", opacity: 1, scale: 1 }}
              exit={{ height: 0, opacity: 0, scale: 0.95 }}
              className="overflow-hidden bg-white rounded-[3rem] border border-slate-50 shadow-xl shadow-slate-200/20"
            >
               <div className="p-10 space-y-6">
                  <div className="flex justify-between items-center">
                     <div className="space-y-1">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">資產變動明細</h3>
                        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Recent 10 Activities</p>
                     </div>
                     <History className="w-5 h-5 text-slate-200" />
                  </div>
                  <div className="space-y-2">
                    {transactions.slice(0, 10).map((tx, idx) => (
                      <div key={tx.id} className="flex justify-between items-center p-5 bg-slate-50/50 rounded-2xl group hover:bg-slate-50 transition">
                         <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-600">{tx.transaction_type}</p>
                            <p className="text-[8px] font-bold text-slate-300">{new Date(tx.created_at).toLocaleDateString()}</p>
                         </div>
                         <p className={`text-sm font-black tracking-tighter ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {tx.amount > 0 ? '+' : ''}{Number(tx.amount).toLocaleString()}
                         </p>
                      </div>
                    ))}
                  </div>
               </div>
            </motion.section>
          )}
        </AnimatePresence>

         {/* Transaction Feed */}
         <section className="space-y-6">
            <div className="flex justify-between items-center px-4">
               <h3 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase">交易動態回報</h3>
               <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Updates</span>
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
                 transactions.slice(0, 10).map((tx, i) => {
                   const isIncome = tx.amount > 0 || tx.transaction_type?.includes("獎金") || tx.transaction_type?.includes("儲值");
                   const isBonus = tx.transaction_type?.includes("獎金");
                   const isWholesale = tx.transaction_type?.includes("貨款");

                   return (
                     <motion.div 
                       key={tx.id}
                       initial={{ opacity: 0, x: -10 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: i * 0.05 }}
                       className="bg-white rounded-[2.5rem] p-6 border border-slate-50 shadow-sm flex items-center gap-5 group hover:border-slate-200 transition relative overflow-hidden"
                     >
                        <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center shadow-inner relative z-10 
                          ${isBonus ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600' : 
                            isWholesale ? 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400' :
                            isIncome ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600' : 'bg-gradient-to-br from-rose-50 to-rose-100 text-rose-500'}`}>
                           {isIncome ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                        </div>
                        <div className="flex-1 relative z-10">
                           <div className="flex items-center gap-2">
                              <h4 className="font-black text-slate-800 text-sm tracking-tight">{tx.transaction_type}</h4>
                              {isBonus && <span className="text-[6px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-black uppercase">Bonus</span>}
                           </div>
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">
                              {new Date(tx.created_at).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                           </p>
                        </div>
                        <div className="text-right relative z-10">
                           <p className={`text-xl font-black tracking-tighter ${isIncome ? 'text-emerald-600' : 'text-slate-800'}`}>
                              {isIncome ? '+' : '-'}{Math.abs(Number(tx.amount)).toLocaleString()}
                           </p>
                           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-0.5">Verified</p>
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
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Identity Verified</span>
               </div>
            </div>

            <div className="bg-white rounded-[3rem] p-10 border border-slate-50 shadow-[0_20px_50px_rgba(0,0,0,0.02)] space-y-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
               
               <div className="space-y-6 relative z-10">
                  <div className="grid grid-cols-1 gap-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-2">帳戶姓名 (戶名)</label>
                           <input 
                              type="text" 
                              defaultValue={memberInfo?.bank_account_name}
                              id="bank_account_name"
                              className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-black text-slate-800 focus:ring-2 focus:ring-emerald-500/20 transition"
                              placeholder="請輸入姓名"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-2">分行名稱 (選填)</label>
                           <input 
                              type="text" 
                              defaultValue={memberInfo?.bank_branch}
                              id="bank_branch"
                              className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-black text-slate-800 focus:ring-2 focus:ring-emerald-500/20 transition"
                              placeholder="例: 信義分行"
                           />
                        </div>
                     </div>
                     
                     <div className="space-y-2">
                        <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-2">銀行代碼 (國泰預設 013)</label>
                        <div className="flex gap-4">
                           <input 
                              type="text" 
                              defaultValue={memberInfo?.bank_code || "013"}
                              id="bank_code"
                              maxLength={3}
                              className="w-24 bg-slate-50 border-none rounded-2xl p-5 text-sm font-black text-slate-800 focus:ring-2 focus:ring-emerald-500/20 transition text-center"
                              placeholder="013"
                           />
                           <div className="flex-1 bg-slate-100 rounded-2xl p-5 text-[10px] font-black text-slate-400 flex items-center px-6">
                              國泰世華商業銀行
                           </div>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-2">銀行帳號 (10-14 碼數字)</label>
                        <input 
                           type="tel" 
                           defaultValue={memberInfo?.bank_account}
                           id="bank_account"
                           onChange={(e) => {
                             const val = e.target.value.replace(/\D/g, '');
                             e.target.value = val;
                             const label = document.getElementById('account-status');
                             if (label) {
                               if (val.length >= 10 && val.length <= 14) {
                                 label.innerText = "格式正確";
                                 label.className = "text-[8px] font-black text-emerald-500 uppercase tracking-widest ml-2";
                               } else {
                                 label.innerText = "長度需為 10-14 碼";
                                 label.className = "text-[8px] font-black text-rose-400 uppercase tracking-widest ml-2";
                               }
                             }
                           }}
                           className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-black text-slate-800 focus:ring-2 focus:ring-emerald-500/20 transition"
                           placeholder="請輸入匯款帳號"
                        />
                        <div id="account-status" className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-2">請輸入純數字帳號</div>
                     </div>
                  </div>

                  <button 
                    onClick={async () => {
                      const nameInput = document.getElementById('bank_account_name') as HTMLInputElement;
                      const branchInput = document.getElementById('bank_branch') as HTMLInputElement;
                      const codeInput = document.getElementById('bank_code') as HTMLInputElement;
                      const accountInput = document.getElementById('bank_account') as HTMLInputElement;
                      
                      if (accountInput.value.length < 10) {
                        alert('銀行帳號格式似乎不正確，請檢查長度。');
                        return;
                      }

                      setIsLoading(true);
                      const { error } = await supabase.from('members').update({
                        bank_account_name: nameInput.value,
                        bank_branch: branchInput.value,
                        bank_code: codeInput.value,
                        bank_account: accountInput.value,
                        beneficiary: branchInput.value ? `${branchInput.value} | ${nameInput.value}` : nameInput.value // Keep for backward compat
                      }).eq('id', memberInfo.id);
                      
                      if (!error) {
                        alert('帳戶資訊已成功同步至資料庫！');
                        const { data: updated } = await supabase.from("members").select("*").eq("id", memberInfo.id).single();
                        setMemberInfo(updated);
                      } else {
                        alert('更新失敗。');
                      }
                      setIsLoading(false);
                    }}
                    className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 active:scale-95 transition"
                  >
                     確認儲存匯款資訊
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
