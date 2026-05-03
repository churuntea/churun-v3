"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseAdmin as supabase } from "@/app/supabase-admin";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowLeft, 
  Loader2, 
  Building2, 
  Search,
  Filter,
  ArrowUpRight,
  Download
} from "lucide-react";

function AdminWithdrawalsContent() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    // 簡單的 Admin 驗證 (延用之前的邏輯)
    const isAdmin = sessionStorage.getItem("is_admin");
    if (!isAdmin) {
      const pass = prompt("請輸入管理密碼:");
      if (pass === "admin123") {
        sessionStorage.setItem("is_admin", "true");
      } else {
        router.push("/");
        return;
      }
    }
    fetchRequests();
  }, [router]);

  const fetchRequests = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("wallet_transactions")
      .select(`
        *,
        members (name, phone, member_code)
      `)
      .eq("transaction_type", "withdrawal_request")
      .order("created_at", { ascending: false });
    
    if (error) console.error(error);
    setRequests(data || []);
    setIsLoading(false);
  };

  const handleAction = async (id: string, status: string, memberId: string, amount: number) => {
    if (!confirm(`確定要將此提領申請標記為 ${status === 'completed' ? '已核准' : '已駁回'} 嗎？`)) return;
    
    setIsLoading(true);
    // 1. 更新交易狀態
    const { error: updateError } = await supabase
      .from("wallet_transactions")
      .update({ status })
      .eq("id", id);

    // 2. 如果是核准，則正式從會員餘額扣除 (或標記為已發放)
    // 註：在我們之前的邏輯中，提領申請時餘額還沒真正扣除，這裡才扣。
    if (status === 'completed' && !updateError) {
      const { data: member } = await supabase.from("members").select("virtual_balance").eq("id", memberId).single();
      const currentBalance = Number(member?.virtual_balance || 0);
      
      await supabase.from("members").update({
        virtual_balance: currentBalance + amount // amount 這裡已經是負數
      }).eq("id", memberId);
    }

    fetchRequests();
  };

  const filteredRequests = requests.filter(r => filter === 'all' ? true : r.status === filter);

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      
      {/* Admin Nav */}
      <nav className="bg-slate-900 text-white sticky top-0 z-50 px-8 py-6 flex items-center justify-between border-b border-white/5">
         <div className="flex items-center gap-6">
            <Link href="/admin" className="p-2 -ml-2 text-white/40 hover:text-white transition">
               <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-sm font-black tracking-[0.3em] uppercase">獎金提領審核中心</h1>
         </div>
         <div className="flex gap-2">
            <button className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition"><Download className="w-4 h-4 text-white/60" /></button>
         </div>
      </nav>

      <main className="max-w-4xl mx-auto p-8 space-y-8">
        
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { label: "待處理申請", val: requests.filter(r => r.status === 'pending').length, color: "text-amber-500", icon: Clock },
             { label: "本月已核准", val: `$${Math.abs(requests.filter(r => r.status === 'completed').reduce((acc, curr) => acc + curr.amount, 0)).toLocaleString()}`, color: "text-emerald-500", icon: CheckCircle2 },
             { label: "總申請件數", val: requests.length, color: "text-slate-400", icon: Filter }
           ].map((stat, i) => (
             <div key={i} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                   <stat.icon className={`w-5 h-5 ${stat.color}`} />
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{stat.label}</span>
                </div>
                <h4 className={`text-2xl font-black ${stat.color}`}>{stat.val}</h4>
             </div>
           ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
           {['pending', 'completed', 'failed', 'all'].map((t) => (
             <button 
               key={t}
               onClick={() => setFilter(t)}
               className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${filter === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
             >
                {t === 'pending' ? '待處理' : t === 'completed' ? '已核准' : t === 'failed' ? '已駁回' : '全部'}
             </button>
           ))}
        </div>

        {/* Request List */}
        <div className="space-y-4">
           {isLoading ? (
             <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-200" /></div>
           ) : filteredRequests.map((req, i) => (
             <motion.div 
               key={req.id}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-8 group"
             >
                <div className="flex-1 space-y-3">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xs">
                         {req.members?.name.slice(0, 1)}
                      </div>
                      <div>
                         <h4 className="font-black text-slate-800">{req.members?.name}</h4>
                         <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{req.members?.member_code}</p>
                      </div>
                   </div>
                   <div className="flex flex-wrap gap-4 pt-2">
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl">
                         <Building2 className="w-3 h-3 text-slate-400" />
                         <span className="text-[10px] font-bold text-slate-500">{req.metadata?.bank?.bankCode} - {req.metadata?.bank?.account}</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl">
                         <User className="w-3 h-3 text-slate-400" />
                         <span className="text-[10px] font-bold text-slate-500">{req.metadata?.bank?.name}</span>
                      </div>
                   </div>
                </div>

                <div className="flex flex-col items-end gap-4 min-w-[200px]">
                   <div className="text-right">
                      <p className="text-2xl font-black text-slate-900 tracking-tighter">${Math.abs(req.amount).toLocaleString()}</p>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">申請日期: {new Date(req.created_at).toLocaleDateString()}</p>
                   </div>
                   
                   {req.status === 'pending' && (
                     <div className="flex gap-2">
                        <button 
                          onClick={() => handleAction(req.id, 'completed', req.member_id, req.amount)}
                          className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20"
                        >
                           核准發款
                        </button>
                        <button 
                          onClick={() => handleAction(req.id, 'failed', req.member_id, req.amount)}
                          className="px-6 py-3 bg-white text-rose-500 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition"
                        >
                           駁回
                        </button>
                     </div>
                   )}

                   {req.status !== 'pending' && (
                     <div className={`flex items-center gap-2 px-6 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest ${req.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                        {req.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {req.status === 'completed' ? '已發款' : '已駁回'}
                     </div>
                   )}
                </div>
             </motion.div>
           ))}
        </div>

      </main>

    </div>
  );
}

// Mock User component for the icon
const User = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;

export default function AdminWithdrawals() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-900" /></div>}>
      <AdminWithdrawalsContent />
    </Suspense>
  );
}
