"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../supabase";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [stats, setStats] = useState({
    totalMembers: 0,
    b2bMembers: 0,
    pendingCommissions: 0,
  });
  const [exitApps, setExitApps] = useState<any[]>([]);
  const [wholesaleOrders, setWholesaleOrders] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      sessionStorage.setItem("churun_admin_auth", "true");
      setIsAuthenticated(true);
      fetchStats();
    } else {
      alert("密碼錯誤");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      sessionStorage.setItem("churun_admin_auth", "true");
    }
  }, [isAuthenticated]);

  const fetchStats = async () => {
    try {
      const { count: totalMembers } = await supabase.from("members").select("*", { count: 'exact', head: true });
      const { count: b2bMembers } = await supabase.from("members").select("*", { count: 'exact', head: true }).eq('is_b2b', true);
      
      const { data: txData } = await supabase.from("wallet_transactions").select("amount").eq('status', 'pending');
      const pendingTotal = txData?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

      setStats({
        totalMembers: totalMembers || 0,
        b2bMembers: b2bMembers || 0,
        pendingCommissions: pendingTotal
      });

      // Fetch exit applications
      const { data: exits } = await supabase.from("members").select("*").eq('status', 'exit_pending');
      setExitApps(exits || []);

      // Fetch wholesale orders with custom logo
      const { data: orders } = await supabase.from("orders").select("*, member:members(name, phone)").not('custom_logo_url', 'is', null).order('created_at', { ascending: false });
      setWholesaleOrders(orders || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveExit = async (memberId: string) => {
    if (!confirm("確定核准該會員的退出申請並發放款項嗎？此操作無法還原。")) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/b2b/exit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId, action: 'approve' })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchStats();
      } else {
        alert("核准失敗: " + data.error);
      }
    } catch (err) {
      alert("系統錯誤");
    }
    setIsProcessing(false);
  };

  const runEvaluateTiers = async () => {
    const confirmed = confirm("即將掃描全體 B2C 會員並更新階級，確定執行？");
    if (!confirmed) return;
    
    setIsProcessing(true);
    try {
      const res = await fetch('/api/cron/evaluate-tiers');
      const data = await res.json();
      alert(data.message);
    } catch (err) {
      alert("執行失敗");
    }
    setIsProcessing(false);
  };

  const runSettlement = async () => {
    const confirmed = confirm("即將結算所有 pending 狀態的退傭，確定執行？");
    if (!confirmed) return;
    
    setIsProcessing(true);
    try {
      const res = await fetch('/api/cron/settlement');
      const data = await res.json();
      alert(data.message);
      fetchStats(); // 重新抓取數據
    } catch (err) {
      alert("執行失敗");
    }
    setIsProcessing(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-5 font-sans">
        <form onSubmit={handleLogin} className="bg-slate-800 p-8 rounded-3xl w-full max-w-sm text-center shadow-2xl border border-slate-700">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="text-xl font-medium text-white mb-6">總部大數據中控台</h2>
          <input 
            type="password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="請輸入管理員密碼"
            className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded-xl mb-4 focus:outline-none focus:border-blue-500"
          />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition">
            登入
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <header className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-light text-slate-900">總部中控台</h1>
            <p className="text-sm text-slate-500 mt-1">V2 全通路數位化營運中心</p>
          </div>
          <div className="flex gap-3 items-center">
            <Link href="/admin/products" className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-700 transition flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              商品與參數管理
            </Link>
            <button onClick={() => setIsAuthenticated(false)} className="text-sm text-slate-500 hover:text-slate-800 transition">安全登出</button>
          </div>
        </header>

        {/* 戰情室數據 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
            <p className="text-sm text-slate-500 mb-1">總註冊會員</p>
            <h3 className="text-4xl font-light text-blue-600">{stats.totalMembers} <span className="text-lg text-slate-400">人</span></h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
            <p className="text-sm text-slate-500 mb-1">B2B 創業夥伴</p>
            <h3 className="text-4xl font-light text-indigo-600">{stats.b2bMembers} <span className="text-lg text-slate-400">人</span></h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
            <p className="text-sm text-slate-500 mb-1">積壓待結算退傭</p>
            <h3 className="text-4xl font-light text-rose-500">${stats.pendingCommissions.toLocaleString()}</h3>
          </div>
        </section>

        {/* V2 排程自動化引擎控制 */}
        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mt-8">
          <h2 className="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            V2 排程手動控制中心
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <h4 className="font-medium text-slate-800">執行八階滾動考核 (B2C)</h4>
                <p className="text-xs text-slate-500 mt-1">系統將掃描全體 B2C 會員的直推人數與累積消費，並重新計算其所屬階級。</p>
              </div>
              <button 
                onClick={runEvaluateTiers}
                disabled={isProcessing}
                className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition disabled:opacity-50"
              >
                強制觸發
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <h4 className="font-medium text-slate-800">執行雙週結算 (B2B)</h4>
                <p className="text-xs text-slate-500 mt-1">將所有超過 14 天鑑賞期的 pending 獎金轉為 completed，正式發放至虛擬帳戶。</p>
              </div>
              <button 
                onClick={runSettlement}
                disabled={isProcessing}
                className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50"
              >
                強制觸發
              </button>
            </div>
          </div>
        </section>

        {/* 營運管理區塊 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* 無憂退出申請審核 */}
          <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              無憂退出申請 ({exitApps.length})
            </h2>
            <div className="space-y-3">
              {exitApps.length === 0 ? (
                <p className="text-sm text-slate-400">目前沒有待審核的退出申請。</p>
              ) : (
                exitApps.map(app => (
                  <div key={app.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-slate-800">{app.name} ({app.member_code || '舊會員'})</p>
                      <p className="text-xs text-slate-500 mt-0.5">預收款餘額: ${app.virtual_balance}</p>
                    </div>
                    <button 
                      onClick={() => handleApproveExit(app.id)}
                      disabled={isProcessing}
                      className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-800 transition disabled:opacity-50"
                    >
                      核准並結算
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* 大宗客製化訂單管理 */}
          <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              客製化大宗訂單 ({wholesaleOrders.length})
            </h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {wholesaleOrders.length === 0 ? (
                <p className="text-sm text-slate-400">目前沒有需要客製化處理的訂單。</p>
              ) : (
                wholesaleOrders.map(order => (
                  <div key={order.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-slate-800">{order.member?.name}</p>
                        <p className="text-xs text-slate-500">訂購 {order.quantity} 盒 | 總額 ${Number(order.total_amount).toLocaleString()}</p>
                      </div>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        客製化處理中
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 mt-2">
                      <p className="text-xs font-medium text-slate-500 mb-1">LOGO / 客製化需求：</p>
                      <p className="text-sm text-slate-800 break-words">{order.custom_logo_url}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
        
      </div>
    </div>
  );
}
