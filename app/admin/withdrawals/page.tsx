"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/app/supabase";
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
  Activity,
  Copy,
  Check
} from "lucide-react";

import { exportToCsv } from "@/utils/exportCsv";
import Toast, { ToastType } from "../../../components/Toast";

function AdminWithdrawalsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sectionFilter, setSectionFilter] = useState<'withdrawal' | 'deposit'>('withdrawal');
  const [filter, setFilter] = useState('pending');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const getAuditorName = () => {
    try {
      const adminStr = sessionStorage.getItem("churun_admin_user");
      if (adminStr) {
        const u = JSON.parse(adminStr);
        return u.name || "系統管理專員";
      }
    } catch (e) {
      console.error(e);
    }
    return "系統管理專員";
  };

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "deposit" || tab === "withdrawal") {
      setSectionFilter(tab);
    }
  }, [searchParams]);

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
          const res = await fetch('/api/admin/wallet-actions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transactionId: id,
              status,
              memberId,
              amount,
              auditorName: getAuditorName()
            })
          });
          const d = await res.json();
          if (!d.success) throw new Error(d.error);

          triggerToast(`${actionName}處理成功！`);
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
    const actionName = status === 'completed' ? '批次核准' : '批次駁回';
    triggerConfirm(
      `確定執行 ${selectedIds.length} 筆${actionName}？`,
      `此動作將大量異動會員資金，請務必確認已完成帳款對帳。`,
      async () => {
        setIsProcessingBatch(true);
        setIsLoading(true);
        try {
          let successCount = 0;
          for (const id of selectedIds) {
            const req = requests.find(r => r.id === id);
            if (!req || req.status !== 'pending') continue;

            const res = await fetch('/api/admin/wallet-actions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                transactionId: id,
                status,
                memberId: req.member_id,
                amount: req.amount,
                auditorName: getAuditorName()
              })
            });
            const d = await res.json();
            if (d.success) successCount++;
          }
          
          triggerToast(`🎉 成功處理 ${successCount} 筆申請！`);
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
          '狀態': req.status,
          '申請時間': new Date(req.created_at).toLocaleString()
        };
      } else {
        return {
          '申請單號': req.id,
          '會員姓名': req.members?.name,
          '銀行代碼': req.metadata?.bank?.bankCode || '',
          '銀行帳號': req.metadata?.bank?.account || '',
          '戶名': req.metadata?.bank?.name || '',
          '提領金額': Math.abs(req.amount),
          '狀態': req.status,
          '申請時間': new Date(req.created_at).toLocaleString()
        };
      }
    });
    exportToCsv(`初潤_財務報表_${new Date().toISOString().split('T')[0]}.csv`, exportData);
    triggerToast("🎉 報表匯出成功！");
  };

  const sectionRequests = requests.filter(r => {
    if (sectionFilter === 'withdrawal') {
      return r.transaction_type === 'withdrawal_request' || r.transaction_type === 'withdrawal';
    } else {
      return r.transaction_type === 'deposit';
    }
  });

  const statusFilteredRequests = sectionRequests.filter(r => filter === 'all' ? true : r.status === filter);

  const finalFilteredRequests = statusFilteredRequests.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const nameMatch = r.members?.name?.toLowerCase().includes(term);
    const codeMatch = r.members?.member_code?.toLowerCase().includes(term);
    const fiveMatch = r.metadata?.payment_last_five?.includes(term);
    return nameMatch || codeMatch || fiveMatch;
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

  const handleSectionChange = (section: 'withdrawal' | 'deposit') => {
    setSectionFilter(section);
    setSelectedIds([]);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
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
         <div className="flex items-center gap-4">
            <button onClick={fetchRequests} className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition">
               <Activity className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
         </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 pt-10 space-y-8">
        
        {/* 指揮中心戰情概況 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-[3.5rem] p-10 text-white border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <div className="relative z-10 flex flex-col sm:flex-row justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 bg-indigo-500/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-indigo-500/20 w-fit">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span className="text-[9px] font-black tracking-widest uppercase">總部出納指令層級</span>
                </div>
                <h2 className="text-4xl font-black tracking-tight">
                  {sectionFilter === 'withdrawal' ? "提領發款工作站" : "入帳對帳工作站"}
                </h2>
                <p className="text-sm text-slate-400 max-w-lg leading-relaxed font-medium">
                  {sectionFilter === 'withdrawal' 
                    ? "負責全體夥伴的提領審核與發款作業，確保每一筆出金皆有職級餘額支撐。"
                    : "負責對應銀行帳戶之入帳對帳作業，通過後系統將自動異動預收帳戶餘額。"
                  }
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-center items-center gap-1 min-w-[220px]">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">當前待處理總額</span>
                <div className="text-3xl font-black text-white font-mono">
                  NT$ {finalFilteredRequests.filter(r => r.status === 'pending').reduce((sum, r) => sum + Math.abs(r.amount), 0).toLocaleString()}
                </div>
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                   {finalFilteredRequests.filter(r => r.status === 'pending').length} 筆案件 Pending
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-sm flex flex-col justify-between items-center text-center group">
             <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-inner">
               <TrendingUp className="w-8 h-8" />
             </div>
             <div className="space-y-1">
               <h3 className="text-sm font-black text-slate-800">全自動流水追蹤</h3>
               <p className="text-[10px] text-slate-400 font-bold leading-relaxed px-4">所有變動皆自動寫入系統 Ledger 並留存審核人軌跡。</p>
             </div>
             <Link href="/admin/finance" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all">
               前往財務稽核中心 <ArrowRight className="w-4 h-4" />
             </Link>
          </div>
        </div>

        {/* 控制列 */}
        <div className="bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex bg-slate-50 p-2 rounded-[2rem] border border-slate-100 w-full md:w-auto shadow-inner">
            <button
              onClick={() => handleSectionChange('withdrawal')}
              className={`flex-1 md:flex-none px-12 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${sectionFilter === 'withdrawal' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-800'}`}
            >
              提領發款
            </button>
            <button
              onClick={() => handleSectionChange('deposit')}
              className={`flex-1 md:flex-none px-12 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${sectionFilter === 'deposit' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-800'}`}
            >
              入帳對帳
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 w-full md:w-auto">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-800 transition-colors" />
              <input
                type="text"
                placeholder="搜尋姓名、手機、代碼..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 pr-8 py-4 bg-slate-50 border border-slate-100 rounded-full text-[11px] font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 min-w-[300px] shadow-inner"
              />
            </div>
            
            <button onClick={handleExport} className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
               <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 狀態切換標籤 */}
        <div className="flex justify-center">
          <div className="flex gap-2 p-1.5 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
            {['pending', 'completed', 'failed', 'all'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${filter === s ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {s === 'pending' ? '待處理' : s === 'completed' ? '已完成' : s === 'failed' ? '已駁回' : '全部'}
              </button>
            ))}
          </div>
        </div>

        {/* 申請列表 */}
        <div className="space-y-6">
          {/* 批次操作 */}
          <AnimatePresence>
            {selectedIds.length > 0 && filter === 'pending' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 text-white rounded-[2.5rem] p-6 flex items-center justify-between shadow-2xl sticky top-24 z-40"
              >
                <div className="flex items-center gap-6 px-6">
                  <span className="text-sm font-black tracking-tight">已選取 {selectedIds.length} 筆待對帳項目</span>
                  <button onClick={() => setSelectedIds([])} className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest underline underline-offset-4">取消選取</button>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleBatchAction('completed')}
                    disabled={isProcessingBatch}
                    className="px-10 py-4 bg-emerald-500 hover:bg-emerald-400 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.1em] transition flex items-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {isProcessingBatch && <Loader2 className="w-4 h-4 animate-spin" />}
                    一鍵批次確認
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading ? (
             <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-slate-200" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">正在極速載入帳務數據...</p>
             </div>
          ) : finalFilteredRequests.length === 0 ? (
             <div className="text-center py-32 bg-white rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-6">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200">
                  <Filter className="w-10 h-10" />
                </div>
                <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">目前無符合篩選條件之案件</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filter === 'pending' && (
                <div className="flex items-center gap-3 px-10 py-2">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length > 0 && selectedIds.length === finalFilteredRequests.filter(r => r.status === 'pending').length}
                    onChange={toggleAll}
                    className="w-5 h-5 rounded-md border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                  />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] cursor-pointer" onClick={toggleAll}>全選所有待處理案件</span>
                </div>
              )}
              
              {finalFilteredRequests.map((req) => (
                <motion.div 
                  key={req.id}
                  layout
                  className={`bg-white rounded-[3rem] p-10 border transition-all duration-500 flex flex-col lg:flex-row lg:items-center gap-8 group ${selectedIds.includes(req.id) ? 'border-slate-900 shadow-2xl scale-[1.01]' : 'border-slate-50 shadow-sm hover:shadow-xl hover:border-slate-100'}`}
                >
                  {req.status === 'pending' && (
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(req.id)}
                        onChange={() => toggleSelection(req.id)}
                        className="w-8 h-8 rounded-xl border-slate-200 text-slate-900 focus:ring-slate-900 cursor-pointer transition-all active:scale-75"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white font-black text-xl shadow-xl shadow-slate-900/10">
                        {req.members?.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-black text-slate-800 tracking-tight">{req.members?.name}</h4>
                          <span className="text-[10px] font-black bg-slate-100 text-slate-400 px-3 py-1 rounded-full uppercase tracking-widest">{req.members?.member_code}</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 mt-1 flex items-center gap-2">
                           <Activity className="w-3.5 h-3.5" /> 手機：{req.members?.phone || '未綁定'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {sectionFilter === 'withdrawal' ? (
                        <>
                          <div className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3 flex items-center gap-3">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <div className="flex flex-col">
                              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">銀行帳戶</span>
                              <span className="text-[11px] font-black text-slate-700 tracking-wider">
                                {req.metadata?.bank?.bankCode} - {req.metadata?.bank?.account}
                                <button onClick={() => handleCopy(req.metadata?.bank?.account, `${req.id}-acc`)} className="ml-2 text-slate-300 hover:text-slate-900 transition">
                                  {copiedField === `${req.id}-acc` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </span>
                            </div>
                          </div>
                          <div className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3 flex items-center gap-3">
                            <UserIcon className="w-4 h-4 text-slate-400" />
                            <div className="flex flex-col">
                              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">戶名</span>
                              <span className="text-[11px] font-black text-slate-700 tracking-wider">
                                {req.metadata?.bank?.name}
                                <button onClick={() => handleCopy(req.metadata?.bank?.name, `${req.id}-name`)} className="ml-2 text-slate-300 hover:text-slate-900 transition">
                                  {copiedField === `${req.id}-name` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="bg-emerald-50 border border-emerald-100/50 rounded-2xl px-6 py-4 flex items-center gap-4">
                           <CreditCard className="w-5 h-5 text-emerald-500" />
                           <div className="flex flex-col">
                              <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">匯款對帳末五碼</span>
                              <span className="text-sm font-black text-emerald-900 tracking-[0.2em] flex items-center gap-3">
                                {req.metadata?.payment_last_five || '無'}
                                <button onClick={() => handleCopy(req.metadata?.payment_last_five, `${req.id}-5`)} className="text-emerald-400 hover:text-emerald-900 transition">
                                  {copiedField === `${req.id}-5` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                              </span>
                           </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-6 min-w-[240px]">
                    <div className="text-right space-y-1">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Transaction Amount</p>
                      <h3 className={`text-4xl font-black font-mono tracking-tighter ${sectionFilter === 'deposit' ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {sectionFilter === 'deposit' ? '+' : '-'} {Math.abs(req.amount).toLocaleString()}
                      </h3>
                      <p className="text-[9px] font-bold text-slate-400 flex items-center justify-end gap-1.5 uppercase tracking-widest">
                        <Clock className="w-3 h-3" /> {new Date(req.created_at).toLocaleString('zh-TW', { hour12: false })}
                      </p>
                    </div>

                    {req.status === 'pending' ? (
                      <div className="flex gap-3 w-full">
                        <button 
                          onClick={() => handleAction(req.id, 'completed', req.member_id, req.amount, req.transaction_type)}
                          className="flex-1 px-8 py-5 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition shadow-xl shadow-slate-900/10 active:scale-95"
                        >
                          核准執行 ✓
                        </button>
                        <button 
                          onClick={() => handleAction(req.id, 'failed', req.member_id, req.amount, req.transaction_type)}
                          className="px-8 py-5 bg-rose-50 text-rose-500 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition border border-rose-100 active:scale-95"
                        >
                          駁回
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-2 w-full">
                        <div className={`px-8 py-4 rounded-[1.5rem] border text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 w-full justify-center ${req.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                          {req.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          {req.status === 'completed' ? (sectionFilter === 'deposit' ? '已入帳' : '已發款') : '審核駁回'}
                        </div>
                        {req.metadata?.auditor && (
                          <div className="text-[9px] font-black text-slate-400 flex items-center gap-2 pr-4">
                            <ShieldCheck className="w-3 h-3" /> 核核人員：{req.metadata.auditor}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Admin Authorization Screen */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-3xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[4rem] p-16 w-full max-w-lg shadow-2xl text-center space-y-12"
            >
              <div className="space-y-6">
                <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl">
                  <Lock className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-black text-slate-900">出納指揮權限驗證</h3>
                <p className="text-xs text-slate-400 font-bold max-w-xs mx-auto leading-relaxed">
                  本審核面板包含敏感資金調動權限，請輸入最高管理中心授權密碼。
                </p>
              </div>

              <form onSubmit={handleAdminAuthSubmit} className="space-y-8">
                <div className="space-y-3">
                  <input 
                    type="password" 
                    value={adminPass} 
                    onChange={(e) => setAdminPass(e.target.value)} 
                    placeholder="授權密碼" 
                    className="w-full bg-slate-50 border-2 border-slate-100 p-8 rounded-[2rem] text-center text-lg font-bold focus:outline-none focus:border-slate-900 transition-all"
                    required
                  />
                  {authError && <p className="text-xs font-black text-rose-500 uppercase tracking-widest">{authError}</p>}
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white p-8 rounded-[2rem] font-black text-sm tracking-[0.3em] uppercase shadow-2xl active:scale-95 transition-all">
                  驗證並進入指揮中心
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[3.5rem] p-12 w-full max-w-md shadow-2xl text-center space-y-8"
            >
              <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">{confirmModal.title}</h3>
                <p className="text-sm text-slate-400 font-bold leading-relaxed">{confirmModal.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button onClick={() => setConfirmModal(null)} className="py-5 bg-slate-50 text-slate-400 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition">
                  取消
                </button>
                <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} className="py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition shadow-xl shadow-slate-900/10">
                  確定核准執行
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-slate-900" /></div>}>
      <AdminWithdrawalsContent />
    </Suspense>
  );
}
