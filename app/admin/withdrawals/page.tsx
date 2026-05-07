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

import { exportToCsv } from "@/utils/exportCsv";

function AdminWithdrawalsContent() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  useEffect(() => {
    // 統一的 Admin 驗證 (改用 churun_admin_auth)
    const isAdmin = sessionStorage.getItem("churun_admin_auth");
    if (isAdmin !== "true") {
      const pass = prompt("請輸入管理密碼:");
      if (pass === "admin123") {
        sessionStorage.setItem("churun_admin_auth", "true");
      } else {
        router.push("/admin");
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

  const handleBatchAction = async (status: 'completed' | 'failed') => {
    if (selectedIds.length === 0) return;
    if (!confirm(`確定要將選取的 ${selectedIds.length} 筆提領申請標記為 ${status === 'completed' ? '已核准' : '已駁回'} 嗎？`)) return;
    
    setIsProcessingBatch(true);
    try {
      // Process batch
      for (const id of selectedIds) {
        const req = requests.find(r => r.id === id);
        if (!req || req.status !== 'pending') continue;

        const { error: updateError } = await supabase
          .from("wallet_transactions")
          .update({ status })
          .eq("id", id);

        if (status === 'completed' && !updateError) {
          const { data: member } = await supabase.from("members").select("virtual_balance").eq("id", req.member_id).single();
          const currentBalance = Number(member?.virtual_balance || 0);
          
          await supabase.from("members").update({
            virtual_balance: currentBalance + req.amount
          }).eq("id", req.member_id);
        }
      }
      
      setSelectedIds([]);
      await fetchRequests();
    } catch (err) {
      console.error(err);
      alert("批次處理發生錯誤");
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const handleExport = () => {
    if (filteredRequests.length === 0) return;
    
    const exportData = filteredRequests.map(req => ({
      '申請單號': req.id,
      '會員姓名': req.members?.name,
      '會員代碼': req.members?.member_code,
      '銀行代碼': req.metadata?.bank?.bankCode || '',
      '銀行帳號': req.metadata?.bank?.account || '',
      '戶名': req.metadata?.bank?.name || '',
      '提款金額': Math.abs(req.amount),
      '狀態': req.status === 'pending' ? '待處理' : req.status === 'completed' ? '已核准' : '已駁回',
      '申請時間': new Date(req.created_at).toLocaleString()
    }));

    exportToCsv(`初潤_提領申請報表_${new Date().toISOString().split('T')[0]}.csv`, exportData);
  };

  const filteredRequests = requests.filter(r => filter === 'all' ? true : r.status === filter);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    const pendingIds = filteredRequests.filter(r => r.status === 'pending').map(r => r.id);
    if (selectedIds.length === pendingIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingIds);
    }
  };

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
            <button onClick={handleExport} className="flex items-center gap-2 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition text-sm font-bold text-white">
               <Download className="w-4 h-4 text-white/60" /> 匯出報表 (CSV)
            </button>
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
         {/* Batch Actions Bar */}
         <AnimatePresence>
            {selectedIds.length > 0 && filter === 'pending' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-xl shadow-slate-900/20 sticky top-24 z-40 mb-4"
              >
                 <div className="flex items-center gap-4 px-4">
                    <span className="text-sm font-black">已選取 {selectedIds.length} 筆申請</span>
                    <button onClick={() => setSelectedIds([])} className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest underline">取消選取</button>
                 </div>
                 <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleBatchAction('completed')}
                      disabled={isProcessingBatch}
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 disabled:opacity-50"
                    >
                       {isProcessingBatch && <Loader2 className="w-3 h-3 animate-spin" />}
                       批次核准發款
                    </button>
                    <button 
                      onClick={() => handleBatchAction('failed')}
                      disabled={isProcessingBatch}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition disabled:opacity-50 text-rose-400"
                    >
                       批次駁回
                    </button>
                 </div>
              </motion.div>
            )}
         </AnimatePresence>

            {filter === 'pending' && filteredRequests.length > 0 && (
               <div className="flex items-center gap-3 px-8 py-2">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length > 0 && selectedIds.length === filteredRequests.filter(r => r.status === 'pending').length}
                    onChange={toggleAll}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                  />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer" onClick={toggleAll}>全選待處理</span>
               </div>
            )}
            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-200" /></div>
           ) : filteredRequests.map((req, i) => (
             <motion.div 
               key={req.id}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className={`bg-white rounded-[2.5rem] p-8 border shadow-sm flex flex-col md:flex-row md:items-center gap-8 group transition ${selectedIds.includes(req.id) ? 'border-indigo-500 shadow-indigo-500/10' : 'border-slate-100'}`}
             >
                {req.status === 'pending' && (
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(req.id)}
                      onChange={() => toggleSelection(req.id)}
                      className="w-6 h-6 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                    />
                  </div>
                )}
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
