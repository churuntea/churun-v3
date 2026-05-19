"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Search, 
  Calendar, 
  Loader2, 
  Info, 
  Trash2, 
  Copy, 
  Check, 
  FileText,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DeletedMembersOverview() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtering States
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Backup Drawer States
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem("churun_admin_auth");
    if (auth !== "true") {
      router.replace("/admin");
      return;
    }
    setIsAdmin(true);
    fetchLogs();
  }, [router]);

  const fetchLogs = async (searchVal = search, start = startDate, end = endDate) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchVal) params.append("search", searchVal);
      if (start) params.append("startDate", start);
      if (end) params.append("endDate", end);

      const res = await fetch(`/api/admin/deleted-members?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      } else {
        console.error("Failed to fetch logs:", data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    // Debounce/Trigger search instantly for premium feel
    fetchLogs(val, startDate, endDate);
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(search, startDate, endDate);
  };

  const clearFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    fetchLogs("", "", "");
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 pb-20">
      
      {/* Sticky Top Header */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 px-8 py-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/admin/members" className="p-2 hover:bg-slate-50 rounded-full transition">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-xl font-black tracking-tight flex items-center gap-3">
              <span>已刪除會員檔案備份日誌</span>
              <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-rose-100/50">
                🔒 安全封存
              </span>
            </h1>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">
              Archived Deleted Member Profiles and Logs
            </p>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-10 space-y-8">
        
        {/* Dynamic Warning Card */}
        <div className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-100/50 p-6 rounded-[2rem] flex items-start gap-5 shadow-sm">
          <div className="p-4 bg-rose-600 text-white rounded-2xl shadow-lg shadow-rose-600/10">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-rose-800 tracking-tight">🔒 最高管理權限檔案保管庫說明</h3>
            <p className="text-xs font-semibold text-rose-700/80 leading-relaxed">
              當您執行「永久刪除會員」時，系統會清除該會員的所有即時交易及組織結構，但為了防止人為失誤或日後核數需要，系統會**自動對該會員之完整歷史設定、餘額、紅利及聯絡資訊進行「加密快照封存」**並記錄於此。您可以隨時在此查詢或複製原始資料以便復原。
            </p>
          </div>
        </div>

        {/* Search and Date Filter Box */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm space-y-6">
          <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
            
            {/* Search Input */}
            <div className="space-y-2 lg:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">搜尋會員</label>
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type="text" 
                  placeholder="搜尋姓名、電話、代碼..."
                  value={search}
                  onChange={handleSearchChange}
                  className="w-full bg-slate-50 border-none p-4 pl-12 rounded-xl text-xs font-bold focus:ring-2 focus:ring-rose-500/10 outline-none"
                />
              </div>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">刪除起日</label>
              <div className="relative">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                <input 
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border-none p-4 pl-12 rounded-xl text-xs font-bold focus:ring-2 focus:ring-rose-500/10 outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">刪除迄日</label>
              <div className="relative">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                <input 
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 border-none p-4 pl-12 rounded-xl text-xs font-bold focus:ring-2 focus:ring-rose-500/10 outline-none cursor-pointer"
                />
              </div>
            </div>

          </form>

          {/* Filter Actions */}
          <div className="flex gap-3 justify-end">
            {(startDate || endDate) && (
              <button 
                type="button" 
                onClick={clearFilters}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition"
              >
                🗑️ 清除所有篩選
              </button>
            )}
            <button 
              type="button"
              onClick={() => fetchLogs(search, startDate, endDate)}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition shadow-lg shadow-slate-900/10"
            >
              🔍 執行區間篩選
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-[3rem] border border-slate-50 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-6 pl-8">被刪除會員</th>
                <th className="p-6">原推薦代碼/UID</th>
                <th className="p-6">原會員階級</th>
                <th className="p-6">刪除日期與時間</th>
                <th className="p-6">執行操作者</th>
                <th className="p-6 pr-8 text-right">備份操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-rose-500 mx-auto" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Trash2 className="w-8 h-8 text-slate-200" />
                    </div>
                    <p className="text-sm font-bold text-slate-400">目前尚無被永久刪除的會員封存記錄</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/30 transition">
                    <td className="p-6 pl-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-xs font-black">
                          {log.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">{log.name}</h4>
                          <span className="text-[10px] font-semibold text-slate-400 mt-1 block">{log.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div>
                        <code className="text-xs font-mono font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                          {log.referral_code || "無"}
                        </code>
                        {log.member_code && (
                          <span className="text-[9px] text-slate-400 font-bold block mt-1 ml-0.5">UID: {log.member_code}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600">
                        {log.tier}
                      </span>
                    </td>
                    <td className="p-6">
                      <span className="text-xs font-bold text-slate-600">{formatDate(log.deleted_at)}</span>
                    </td>
                    <td className="p-6">
                      <div>
                        <span className="text-xs font-black text-slate-800">{log.deleted_by_name}</span>
                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block mt-0.5">
                          {log.deleted_by_title}
                        </span>
                      </div>
                    </td>
                    <td className="p-6 pr-8 text-right">
                      <button 
                        onClick={() => {
                          setSelectedLog(log);
                          setShowDrawer(true);
                        }}
                        className="px-4 py-2 bg-slate-50 text-slate-700 border border-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-1.5 ml-auto cursor-pointer active:scale-95"
                      >
                        <FileText className="w-3.5 h-3.5" /> 檢視備份資料
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </main>

      {/* Slide-out Backup Detail Drawer */}
      <AnimatePresence>
        {showDrawer && selectedLog && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            />
            
            {/* Drawer */}
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              
              {/* Header */}
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-rose-50/10">
                <div>
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <span>📂 會員「{selectedLog.name}」檔案快照備份</span>
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                    Snapshot created at {formatDate(selectedLog.deleted_at)}
                  </p>
                </div>
                <button 
                  onClick={() => setShowDrawer(false)}
                  className="w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center transition border border-slate-100/50 cursor-pointer active:scale-95"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                
                {/* 1. Account Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/50">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">原可用資金餘額 (B2B)</span>
                    <span className="text-xl font-mono font-black text-slate-800 mt-1 block">
                      ${selectedLog.original_data?.virtual_balance || 0}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/50">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">原可用積分餘額 (B2C)</span>
                    <span className="text-xl font-mono font-black text-slate-800 mt-1 block">
                      {selectedLog.original_data?.points_balance || 0} pt
                    </span>
                  </div>
                </div>

                {/* 2. Structured Contact Details */}
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100/50 space-y-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">📞 基本與通訊資料</span>
                  
                  <div className="grid grid-cols-2 gap-y-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold">手機號碼</span>
                      <span className="font-bold text-slate-800">{selectedLog.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold">電子信箱</span>
                      <span className="font-bold text-slate-800">{selectedLog.original_data?.email || "未設定"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold">LINE ID</span>
                      <span className="font-bold text-slate-800">{selectedLog.original_data?.line_id || "未設定"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold">身分證字號 (B2B)</span>
                      <span className="font-bold text-slate-800">{selectedLog.original_data?.id_card_number || "未設定"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[9px] font-bold">收件地址</span>
                      <span className="font-bold text-slate-800">{selectedLog.original_data?.address || "未設定"}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Bank & Beneficiary Details */}
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100/50 space-y-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">🏦 提款銀行與繼承人</span>
                  
                  <div className="grid grid-cols-2 gap-y-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold">綁定銀行代碼</span>
                      <span className="font-bold text-slate-800">{selectedLog.original_data?.bank_code || "未綁定"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold">銀行帳號</span>
                      <span className="font-bold text-slate-800">{selectedLog.original_data?.bank_account || "未綁定"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[9px] font-bold">法定世襲受益人/繼承人</span>
                      <span className="font-bold text-slate-800">{selectedLog.original_data?.beneficiary || "未設定"}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Restoration Warning Card */}
                <div className="bg-amber-50/50 border border-amber-100 p-5 rounded-2xl space-y-2">
                  <h4 className="text-xs font-black text-amber-800 flex items-center gap-1.5">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>⚡ 如何利用此備份進行檔案復原？</span>
                  </h4>
                  <p className="text-[11px] text-amber-700/90 leading-relaxed font-medium">
                    若此刪除係屬誤操作，您只要在「會員資料管理」中，以原手機號碼重新為此會員註冊一個新帳戶，並點選編輯帳戶，將本頁顯示之可用餘額、紅利點數、銀行等設定手動修改補回，即可完成原樣復原！
                  </p>
                </div>

                {/* 5. Complete Raw JSON Backup */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">📋 完整資料庫加密原始檔 (JSON)</span>
                    <button 
                      onClick={() => copyToClipboard(JSON.stringify(selectedLog.original_data, null, 2))}
                      className="text-[10px] font-black text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500">複製成功 ✓</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>複製完整備份 (JSON)</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="bg-slate-900 text-slate-300 p-5 rounded-2xl text-[10px] font-mono overflow-x-auto max-h-[300px] border border-slate-800 shadow-inner">
                    {JSON.stringify(selectedLog.original_data, null, 2)}
                  </pre>
                </div>

              </div>

              {/* Footer */}
              <div className="p-8 border-t border-slate-100 bg-slate-50 flex gap-3">
                <button 
                  onClick={() => setShowDrawer(false)}
                  className="flex-1 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition cursor-pointer active:scale-95 text-center"
                >
                  關閉返回
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
