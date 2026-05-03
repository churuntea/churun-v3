"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../supabase";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Loader2,
  DollarSign,
  History,
  Info
} from "lucide-react";

function WithdrawalHistoryContent() {
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [memberInfo, setMemberInfo] = useState<any>(null);

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
    const { data: mData } = await supabase.from("members").select("*").eq("id", userId).single();
    setMemberInfo(mData);

    const { data } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("member_id", userId)
      .eq("transaction_type", "withdrawal")
      .order("created_at", { ascending: false });
    
    setWithdrawals(data || []);
    setIsLoading(false);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '已撥款';
      case 'pending': return '審核中';
      case 'rejected': return '已駁回';
      default: return '未明';
    }
  };

  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'completed')
    .reduce((sum, w) => sum + Math.abs(Number(w.amount)), 0);

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-20">
      
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-50 px-8 py-8 flex items-center gap-6 max-w-lg mx-auto">
         <button onClick={() => router.back()} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
         </button>
         <div>
            <h1 className="text-xl font-black tracking-tight text-slate-800">提領紀錄明細</h1>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Withdrawal History</p>
         </div>
      </nav>

      <main className="max-w-lg mx-auto p-8 space-y-10">
        
        {/* Summary Card */}
        <div className="bg-emerald-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-emerald-900/20">
           <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
           <div className="flex justify-between items-start">
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">累計已撥款金額</p>
                 <h2 className="text-4xl font-black tracking-tighter">${totalWithdrawn.toLocaleString()}</h2>
              </div>
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/10">
                 <History className="w-8 h-8 text-emerald-300" />
              </div>
           </div>
           <div className="mt-8 pt-8 border-t border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                   {withdrawals.filter(w => w.status === 'pending').length} 筆審核中
                 </span>
              </div>
              <Link href="/withdraw" className="text-[10px] font-black uppercase tracking-widest bg-white text-emerald-900 px-4 py-2 rounded-full">
                 我要提領
              </Link>
           </div>
        </div>

        {/* List */}
        <div className="space-y-6">
           {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-slate-200" /></div>
           ) : withdrawals.length === 0 ? (
              <div className="bg-white rounded-[3.5rem] p-24 text-center border border-slate-50 shadow-sm">
                 <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <DollarSign className="w-8 h-8 text-slate-200" />
                 </div>
                 <h3 className="text-lg font-black text-slate-800 mb-2">尚無提領紀錄</h3>
                 <p className="text-xs text-slate-400 font-medium leading-relaxed">當您有獎金退傭後，<br/>即可申請提領至綁定帳戶。</p>
              </div>
           ) : (
              withdrawals.map((w, i) => (
                <motion.div 
                  key={w.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm space-y-6 relative group"
                >
                   <div className="flex justify-between items-start">
                      <div className="space-y-3">
                         <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border ${getStatusStyle(w.status)}`}>
                            {getStatusLabel(w.status)}
                         </div>
                         <h4 className="text-2xl font-black text-slate-800 tracking-tighter">
                            ${Math.abs(Number(w.amount)).toLocaleString()}
                         </h4>
                      </div>
                      <div className="text-right space-y-1">
                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                            {new Date(w.created_at).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                         </p>
                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                            {new Date(w.created_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                         </p>
                      </div>
                   </div>

                   <div className="pt-6 border-t border-slate-50 flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <CreditCard className="w-4 h-4 text-indigo-500" />
                         </div>
                         <div className="flex-1">
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">提領至帳戶</p>
                            <p className="text-xs font-black text-slate-600 mt-0.5">
                               {memberInfo?.bank_code} **** {memberInfo?.bank_account?.slice(-4)}
                            </p>
                         </div>
                      </div>
                      
                      {w.status === 'pending' && (
                        <div className="bg-amber-50 rounded-2xl p-4 flex items-start gap-3 border border-amber-100">
                           <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                           <p className="text-[10px] font-medium text-amber-700 leading-relaxed">
                              預計 3-5 個工作天內完成撥款。
                           </p>
                        </div>
                      )}
                      
                      {w.status === 'completed' && (
                        <div className="bg-emerald-50 rounded-2xl p-4 flex items-start gap-3 border border-emerald-100">
                           <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                           <p className="text-[10px] font-medium text-emerald-700 leading-relaxed">
                              款項已匯入您的指定帳號。
                           </p>
                        </div>
                      )}
                   </div>
                </motion.div>
              ))
           )}
        </div>

        {/* Support Info */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-50 flex items-start gap-5">
           <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0">
              <Info className="w-6 h-6 text-slate-300" />
           </div>
           <div className="space-y-2">
              <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest">提領須知</h5>
              <p className="text-[10px] font-medium text-slate-400 leading-relaxed">
                 提領手續費為每筆 15 元。若對提領紀錄有異議，請聯繫您的上線輔導員或品牌官方客服。
              </p>
           </div>
        </div>

      </main>
    </div>
  );
}

export default function WithdrawalHistory() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>}>
      <WithdrawalHistoryContent />
    </Suspense>
  );
}
