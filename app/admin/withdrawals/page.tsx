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
  Filter,
  Download,
  ShieldCheck,
  Lock,
  ArrowRight,
  User as UserIcon,
  CreditCard,
  CircleDollarSign,
  Search,
  Activity
} from "lucide-react";

import { exportToCsv } from "@/utils/exportCsv";
import Toast, { ToastType } from "../../../components/Toast";

function AdminWithdrawalsContent() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sectionFilter, setSectionFilter] = useState<'withdrawal' | 'deposit'>('withdrawal');
  const [filter, setFilter] = useState('pending');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Authentication states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [authError, setAuthError] = useState("");

  // Toast States
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");
  const [showToast, setShowToast] = useState(false);

  // Custom Confirm Modal States
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  const triggerToast = (msg: string, type: ToastType = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
  };

  const triggerConfirm = (title: string, description: string, onConfirm: () => void) => {
    setConfirmModal({ title, description, onConfirm });
  };

  useEffect(() => {
    const isAdmin = sessionStorage.getItem("churun_admin_auth");
    if (isAdmin !== "true") {
      setIsAuthModalOpen(true);
    } else {
      fetchRequests();
    }
  }, []);

  const handleAdminAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (adminPass === "admin123") {
      sessionStorage.setItem("churun_admin_auth", "true");
      setIsAuthModalOpen(false);
      fetchRequests();
    } else {
      setAuthError("管理密碼錯誤，請重新輸入");
    }
  };

  const fetchRequests = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("wallet_transactions")
      .select(`
        *,
        members (name, phone, member_code)
      `)
      .in("transaction_type", ["withdrawal_request", "withdrawal", "deposit"])
      .order("created_at", { ascending: false });
    
    if (error) console.error(error);
    setRequests(data || []);
    setIsLoading(false);
  };

  const handleAction = (id: string, status: string, memberId: string, amount: number, type: string) => {
    const isDeposit = type === 'deposit';
    const actionName = status === 'completed' ? (isDeposit ? '核准到帳' : '核准提領') : '已駁回';
    
    triggerConfirm(
      `確定執行 ${actionName}？`,
      `您即將將此筆 NT$ ${Math.abs(amount).toLocaleString()} 的${isDeposit ? '儲值' : '提領'}申請標記為【${actionName}】。確認後系統將自動異動該會員之預收帳戶餘額。`,
      async () => {
        setIsLoading(true);
        try {
          // 1. 更新交易狀態
          const { error: updateError } = await supabase
            .from("wallet_transactions")
            .update({ status })
            .eq("id", id);

          if (updateError) throw updateError;

          // 2. 如果是核准，則異動會員預收款餘額
          if (status === 'completed') {
            const { data: member, error: mErr } = await supabase.from("members").select("virtual_balance").eq("id", memberId).single();
            if (mErr) throw mErr;

            const currentBalance = Number(member?.virtual_balance || 0);
            
            // 提領 amount 為負數，儲值 amount 為正數。直接相加即為 100% 正確扣款或加值！
            const { error: balError } = await supabase.from("members").update({
              virtual_balance: currentBalance + amount
            }).eq("id", memberId);

            if (balError) throw balError;
          }

          // 3. 發送系統通知
          let notifyTitle = "";
          let notifyContent = "";

          if (isDeposit) {
            if (status === 'completed') {
              notifyTitle = "預收儲值核發成功！ 🎉";
              notifyContent = `您申請的預收儲值 NT$ ${Number(amount).toLocaleString()} 元已成功核對並到帳，感謝您的進貨與支持！`;
            } else {
              notifyTitle = "儲值審核未通過 ❌";
              notifyContent = `您申請的預收儲值 NT$ ${Number(amount).toLocaleString()} 元因帳款對帳不符已被駁回，請確認匯款金額與帳號末五碼並重新提交。`;
            }
          } else {
            if (status === 'completed') {
              notifyTitle = "提領審核通過並已發款 💸";
              notifyContent = `您申請提領的 NT$ ${Math.abs(amount).toLocaleString()} 元已通過審核並成功發放至您的指定銀行帳戶。`;
            } else {
              notifyTitle = "提領審核未通過 ❌";
              notifyContent = `您申請提領的 NT$ ${Math.abs(amount).toLocaleString()} 元因審核資格未符已被駁回，資金已全數退回。`;
            }
          }

          await supabase.from('notifications').insert({
            member_id: memberId,
            title: notifyTitle,
            content: notifyContent,
            type: 'system'
          });

          triggerToast(`🎉 申請已成功標記為【${actionName}】！`);
          fetchRequests();
        } catch (err: any) {
          console.error(err);
          triggerToast(`操作失敗: ${err.message}`, "error");
        } finally {
          setIsLoading(false);
        }
      }
    );
  };

  const handleBatchAction = (status: 'completed' | 'failed') => {
    if (selectedIds.length === 0) return;
    const isDeposit = sectionFilter === 'deposit';
    const actionName = status === 'completed' ? (isDeposit ? '核准到帳' : '核准提領') : '已駁回';
    
    triggerConfirm(
      `確定批次標記為 ${actionName}？`,
      `您即將將選取的 ${selectedIds.length} 筆${isDeposit ? '儲值' : '提領'}申請批次變更為【${actionName}】。此操作將影響多筆資金餘額，請確認核對無誤。`,
      async () => {
        setIsProcessingBatch(true);
        try {
          for (const id of selectedIds) {
            const req = requests.find(r => r.id === id);
            if (!req || req.status !== 'pending') continue;

            const { error: updateError } = await supabase
              .from("wallet_transactions")
              .update({ status })
              .eq("id", id);

            if (updateError) continue;

            if (status === 'completed') {
              const { data: member } = await supabase.from("members").select("virtual_balance").eq("id", req.member_id).single();
              const currentBalance = Number(member?.virtual_balance || 0);
              
              await supabase.from("members").update({
                virtual_balance: currentBalance + req.amount
              }).eq("id", req.member_id);
            }

            // 發送通知
            let notifyTitle = "";
            let notifyContent = "";
            if (isDeposit) {
              if (status === 'completed') {
                notifyTitle = "預收儲值核發成功！ 🎉";
                notifyContent = `您申請的預收儲值 NT$ ${Number(req.amount).toLocaleString()} 元已成功核對並到帳！`;
              } else {
                notifyTitle = "儲值審核未通過 ❌";
                notifyContent = `您申請的預收儲值 NT$ ${Number(req.amount).toLocaleString()} 元已被駁回。`;
              }
            } else {
              if (status === 'completed') {
                notifyTitle = "提領審核通過並已發款 💸";
                notifyContent = `您申請提領的 NT$ ${Math.abs(req.amount).toLocaleString()} 元已通過審核並成功發放！`;
              } else {
                notifyTitle = "提領審核未通過 ❌";
                notifyContent = `您申請提領的 NT$ ${Math.abs(req.amount).toLocaleString()} 元已被駁回。`;
              }
            }

            await supabase.from('notifications').insert({
              member_id: req.member_id,
              title: notifyTitle,
              content: notifyContent,
              type: 'system'
            });
          }
          
          triggerToast(`🎉 ${selectedIds.length} 筆申請已成功批次變更為【${actionName}】！`);
          setSelectedIds([]);
          await fetchRequests();
        } catch (err) {
          console.error(err);
          triggerToast("批次處理時發生錯誤", "error");
        } finally {
          setIsProcessingBatch(false);
        }
      }
    );
  };

  const handleExport = () => {
    if (finalFilteredRequests.length === 0) return;
    
    const isDeposit = sectionFilter === 'deposit';
    const exportData = finalFilteredRequests.map(req => {
      if (isDeposit) {
        return {
          '申請單號': req.id,
          '會員姓名': req.members?.name,
          '會員代碼': req.members?.member_code,
          '儲值金額': req.amount,
          '對帳末五碼': req.metadata?.payment_last_five || '無',
          '狀態': req.status === 'pending' ? '待對帳' : req.status === 'completed' ? '已入帳' : '已駁回',
          '申請時間': new Date(req.created_at).toLocaleString()
        };
      } else {
        return {
          '申請單號': req.id,
          '會員姓名': req.members?.name,
          '會員代碼': req.members?.member_code,
          '銀行代碼': req.metadata?.bank?.bankCode || '',
          '銀行帳號': req.metadata?.bank?.account || '',
          '戶名': req.metadata?.bank?.name || '',
          '提領金額': Math.abs(req.amount),
          '狀態': req.status === 'pending' ? '待處理' : req.status === 'completed' ? '已發款' : '已駁回',
          '申請時間': new Date(req.created_at).toLocaleString()
        };
      }
    });

    const filename = isDeposit 
      ? `初潤_預收儲值審核報表_${new Date().toISOString().split('T')[0]}.csv`
      : `初潤_提領申請報表_${new Date().toISOString().split('T')[0]}.csv`;

    exportToCsv(filename, exportData);
    triggerToast("🎉 報表匯出成功！");
  };

  // Step 1: Filter by section (withdrawal or deposit)
  const sectionRequests = requests.filter(r => {
    if (sectionFilter === 'withdrawal') {
      return r.transaction_type === 'withdrawal_request' || r.transaction_type === 'withdrawal';
    } else {
      return r.transaction_type === 'deposit';
    }
  });

  // Step 2: Filter by status tab
  const statusFilteredRequests = sectionRequests.filter(r => filter === 'all' ? true : r.status === filter);

  // Step 3: Filter by search keyword
  const finalFilteredRequests = statusFilteredRequests.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const nameMatch = r.members?.name?.toLowerCase().includes(term);
    const codeMatch = r.members?.member_code?.toLowerCase().includes(term);
    const phoneMatch = r.members?.phone?.includes(term);
    const fiveMatch = r.metadata?.payment_last_five?.includes(term);
    return nameMatch || codeMatch || phoneMatch || fiveMatch;
  });

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    const pendingIds = finalFilteredRequests.filter(r => r.status === 'pending').map(r => r.id);
    if (selectedIds.length === pendingIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingIds);
    }
  };

  // Change sections and clear selected
  const handleSectionChange = (section: 'withdrawal' | 'deposit') => {
    setSectionFilter(section);
    setSelectedIds([]);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      
      {/* Admin Nav */}
      <nav className="bg-slate-900 text-white sticky top-0 z-50 px-8 py-6 flex items-center justify-between border-b border-white/5 shadow-xl">
         <div className="flex items-center gap-6">
            <Link href="/admin" className="p-2 -ml-2 text-white/40 hover:text-white transition">
               <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-sm font-black tracking-[0.3em] uppercase">預收資金與提領審核指揮中心</h1>
              <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">Funds & Withdrawals Operations Hub</p>
            </div>
         </div>
         <div className="flex gap-2">
            <button onClick={handleExport} className="flex items-center gap-2 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition text-sm font-bold text-white shadow-sm">
               <Download className="w-4 h-4 text-white/60" /> 匯出 {sectionFilter === 'deposit' ? '儲值' : '提領'} CSV
            </button>
         </div>
      </nav>

      <main className="max-w-4xl mx-auto p-8 space-y-8">
        
        {/* Section Segment Picker */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-3xl border border-slate-200">
           <button
             onClick={() => handleSectionChange('withdrawal')}
             className={`flex items-center justify-center gap-2.5 py-4 rounded-2xl text-xs font-black tracking-widest transition-all ${sectionFilter === 'withdrawal' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' : 'text-slate-400 hover:text-slate-700'}`}
           >
              <CircleDollarSign className="w-4 h-4" />
              💸 預付款提領審核
           </button>
           <button
             onClick={() => handleSectionChange('deposit')}
             className={`flex items-center justify-center gap-2.5 py-4 rounded-2xl text-xs font-black tracking-widest transition-all ${sectionFilter === 'deposit' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' : 'text-slate-400 hover:text-slate-700'}`}
           >
              <CreditCard className="w-4 h-4" />
              💳 預收款儲值對帳
           </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { 
               label: sectionFilter === 'deposit' ? "待審核儲值" : "待處理提領", 
               val: sectionRequests.filter(r => r.status === 'pending').length, 
               color: "text-amber-500", 
               icon: Clock 
             },
             { 
               label: sectionFilter === 'deposit' ? "本月已儲值總額" : "本月已提領總額", 
               val: `NT$ ${Math.abs(sectionRequests.filter(r => r.status === 'completed').reduce((acc, curr) => acc + curr.amount, 0)).toLocaleString()}`, 
               color: "text-emerald-500", 
               icon: CheckCircle2 
             },
             { 
               label: "申請總件數", 
               val: sectionRequests.length, 
               color: "text-slate-400", 
               icon: Filter 
             }
           ].map((stat, i) => (
             <div key={i} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                   <stat.icon className={`w-5 h-5 ${stat.color}`} />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                </div>
                <h4 className={`text-2xl font-black ${stat.color}`}>{stat.val}</h4>
             </div>
           ))}
        </div>

        {/* Controls block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Status Tabs */}
          <div className="flex gap-2 p-1.5 bg-slate-100/50 backdrop-blur-sm rounded-2xl w-fit border border-slate-100">
             {['pending', 'completed', 'failed', 'all'].map((t) => (
               <button 
                 key={t}
                 onClick={() => setFilter(t)}
                 className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${filter === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                  {t === 'pending' ? (sectionFilter === 'deposit' ? '待對帳' : '待處理') : t === 'completed' ? '已核准' : t === 'failed' ? '已駁回' : '全部'}
               </button>
             ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input
               type="text"
               placeholder="搜尋姓名、代碼、末五碼..."
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="w-full bg-white border border-slate-100 pl-11 pr-4 py-3.5 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 shadow-sm"
             />
          </div>
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
                     <button onClick={() => setSelectedIds([])} className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest underline animate-pulse">取消選取</button>
                  </div>
                  <div className="flex items-center gap-3">
                     <button 
                       onClick={() => handleBatchAction('completed')}
                       disabled={isProcessingBatch}
                       className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 disabled:opacity-50"
                     >
                        {isProcessingBatch && <Loader2 className="w-3 h-3 animate-spin" />}
                        批次確認到帳
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

          {filter === 'pending' && finalFilteredRequests.length > 0 && (
             <div className="flex items-center gap-3 px-8 py-2">
                <input 
                  type="checkbox" 
                  checked={selectedIds.length > 0 && selectedIds.length === finalFilteredRequests.filter(r => r.status === 'pending').length}
                  onChange={toggleAll}
                  className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer" onClick={toggleAll}>全選待對帳申請</span>
             </div>
          )}

          {isLoading ? (
             <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-slate-200" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">正在載入申請數據...</p>
             </div>
          ) : finalFilteredRequests.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-4">
                <Filter className="w-12 h-12 text-slate-200 animate-pulse" />
                <p className="text-xs font-bold text-slate-300">目前尚無符合的對帳與審核項目</p>
             </div>
          ) : finalFilteredRequests.map((req, i) => (
            <motion.div 
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-[2.5rem] p-8 border shadow-sm flex flex-col md:flex-row md:items-center gap-8 group transition ${selectedIds.includes(req.id) ? 'border-slate-800 shadow-slate-900/5' : 'border-slate-100'}`}
            >
               {req.status === 'pending' && (
                 <div className="flex items-center">
                   <input 
                     type="checkbox" 
                     checked={selectedIds.includes(req.id)}
                     onChange={() => toggleSelection(req.id)}
                     className="w-6 h-6 rounded-md border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
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
                     {sectionFilter === 'withdrawal' ? (
                       <>
                         <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-500">{req.metadata?.bank?.bankCode} - {req.metadata?.bank?.account}</span>
                         </div>
                         <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                            <UserIcon className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-500">{req.metadata?.bank?.name}</span>
                         </div>
                       </>
                     ) : (
                       <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100/50">
                          <Activity className="w-3 h-3 text-emerald-500" />
                          <span className="text-[10px] font-black">匯款帳號末五碼: <span className="font-mono text-xs">{req.metadata?.payment_last_five || '無'}</span></span>
                       </div>
                     )}
                  </div>
               </div>

               <div className="flex flex-col items-end gap-4 min-w-[200px]">
                  <div className="text-right">
                     <p className={`text-2xl font-black tracking-tighter ${sectionFilter === 'deposit' ? 'text-emerald-600' : 'text-slate-900'}`}>
                       {sectionFilter === 'deposit' ? '+' : '-'} NT$ {Math.abs(req.amount).toLocaleString()}
                     </p>
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">申請日期: {new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                  
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                       <button 
                         onClick={() => handleAction(req.id, 'completed', req.member_id, req.amount, req.transaction_type)}
                         className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/15"
                       >
                          {sectionFilter === 'deposit' ? '確認到帳核發' : '核准發款'}
                       </button>
                       <button 
                         onClick={() => handleAction(req.id, 'failed', req.member_id, req.amount, req.transaction_type)}
                         className="px-6 py-3 bg-white text-rose-500 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition"
                       >
                          駁回
                       </button>
                    </div>
                  )}

                  {req.status !== 'pending' && (
                    <div className={`flex items-center gap-2 px-6 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest ${req.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                       {req.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                       {req.status === 'completed' ? (sectionFilter === 'deposit' ? '已入帳' : '已發款') : '已駁回'}
                    </div>
                  )}
               </div>
            </motion.div>
          ))}
       </div>

      </main>

      {/* Admin Authorization Screen (Glassmorphic) */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-2xl">
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              className="bg-white rounded-[4rem] p-12 w-full max-w-md shadow-2xl text-center space-y-10 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-amber-50 rounded-full blur-3xl opacity-50"></div>
              
              <div className="space-y-4">
                <div className="w-20 h-20 bg-emerald-900 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-900/20">
                  <ShieldCheck className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">安全中心驗證</h3>
                <p className="text-xs text-slate-400 font-bold max-w-xs mx-auto leading-relaxed">
                  本審核面板包含高度敏感資金調動數據，請輸入管理密碼以授權存取。
                </p>
              </div>

              <form onSubmit={handleAdminAuthSubmit} className="space-y-6">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-slate-400 ml-6 uppercase tracking-[0.2em]">請輸入管理密碼</label>
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input 
                      type="password" 
                      value={adminPass} 
                      onChange={(e) => setAdminPass(e.target.value)} 
                      placeholder="••••••••" 
                      className="w-full bg-slate-50/50 border-2 border-transparent p-6 pl-16 rounded-[2rem] text-sm font-bold focus:outline-none focus:bg-white focus:border-emerald-900/5 transition-all shadow-inner"
                      required
                    />
                  </div>
                  {authError && (
                    <p className="text-[10px] font-black text-rose-500 ml-6 uppercase tracking-widest">{authError}</p>
                  )}
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    className="w-full bg-slate-900 text-white p-6 rounded-[2rem] font-black text-sm tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/20 group"
                  >
                    驗證權限並登入 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-2xl">
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="bg-white rounded-[3rem] p-10 w-full max-w-sm shadow-2xl text-center relative overflow-hidden"
            >
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">{confirmModal.title}</h3>
              <p className="text-xs text-slate-400 font-bold leading-relaxed mb-8">{confirmModal.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setConfirmModal(null)} 
                  className="py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition"
                >
                  取消返回
                </button>
                <button 
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(null);
                  }} 
                  className="py-4 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest transition shadow-lg shadow-slate-900/10"
                >
                  確定執行 ✓
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Toast notification feedback */}
      <Toast 
        message={toastMsg}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

    </div>
  );
}

export default function AdminWithdrawals() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-900" /></div>}>
      <AdminWithdrawalsContent />
    </Suspense>
  );
}
