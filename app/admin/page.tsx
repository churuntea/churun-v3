"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { supabase } from "../supabase";
import { 
  ShieldCheck, 
  Users, 
  Wallet, 
  BarChart3, 
  Settings, 
  LogOut, 
  Package, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Zap,
  Loader2,
  Lock
} from "lucide-react";

function AdminDashboardContent() {
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

  useEffect(() => {
    const auth = sessionStorage.getItem("churun_admin_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
      fetchStats();
    }
  }, []);

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

      const { data: exits } = await supabase.from("members").select("*").eq('status', 'exit_pending');
      setExitApps(exits || []);

      const { data: orders } = await supabase.from("orders").select("*, member:members(name, phone)").not('custom_logo_url', 'is', null).order('created_at', { ascending: false });
      setWholesaleOrders(orders || []);
    } catch (err) { console.error(err); }
  };

  const handleApproveExit = async (memberId: string) => {
    if (!confirm("確定核准該會員的退出申請並發放款項嗎？")) return;
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
      } else { alert("核准失敗: " + data.error); }
    } catch (err) { alert("系統錯誤"); }
    setIsProcessing(false);
  };

  const runEvaluateTiers = async () => {
    if (!confirm("即將掃描全體會員並更新階級，確定執行？")) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/cron/evaluate-tiers', { method: 'POST' });
      const data = await res.json();
      alert(data.message || data.error);
    } catch (err) { alert("執行失敗"); }
    setIsProcessing(false);
  };

  const runSettlement = async () => {
    if (!confirm("即將結算所有獎金，確定執行？")) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/cron/settlement', { method: 'POST' });
      const data = await res.json();
      alert(data.message || data.error);
      fetchStats();
    } catch (err) { alert("執行失敗"); }
    setIsProcessing(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
        <form onSubmit={handleLogin} className="bg-white rounded-[3rem] p-12 w-full max-w-sm text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-slate-50 rounded-full blur-2xl"></div>
          
          <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-slate-900/20 rotate-3">
             <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">總部中控台</h2>
          <p className="text-sm text-slate-400 mb-10">請輸入管理員密碼以繼續</p>
          
          <input 
            type="password" 
            autoFocus
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-slate-50 border-none p-5 rounded-2xl mb-6 text-center text-lg font-bold tracking-widest focus:ring-2 focus:ring-slate-900/10 transition"
          />
          <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-sm hover:bg-slate-800 transition shadow-xl shadow-slate-900/10">
            授權進入
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 pb-20 font-sans">
      
      {/* Admin Nav */}
      <nav className="bg-slate-900 text-white sticky top-0 z-50 px-8 py-4 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
           </div>
           <div>
              <h1 className="text-xs font-black tracking-[0.2em] uppercase">CHURUN HQ</h1>
              <p className="text-[8px] font-bold text-white/40 tracking-widest uppercase">Admin Operations</p>
           </div>
        </div>
        <div className="flex items-center gap-6">
           <Link href="/admin/products" className="text-xs font-bold text-white/60 hover:text-white transition flex items-center gap-2">
              <Package className="w-4 h-4" /> 商品管理
           </Link>
           <button onClick={() => { sessionStorage.removeItem("churun_admin_auth"); setIsAuthenticated(false); }} className="text-white/40 hover:text-rose-400 transition">
              <LogOut className="w-5 h-5" />
           </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-10 space-y-10">
        
        {/* Real-time Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { label: "總註冊會員", value: stats.totalMembers, unit: "人", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
             { label: "B2B 夥伴", value: stats.b2bMembers, unit: "人", icon: Zap, color: "text-indigo-600", bg: "bg-indigo-50" },
             { label: "待結算獎金", value: stats.pendingCommissions.toLocaleString(), unit: "$", icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50" }
           ].map((stat, i) => (
             <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-center gap-6 group hover:border-slate-200 transition">
                <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center transition group-hover:scale-110`}>
                   <stat.icon className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                   <h3 className={`text-3xl font-black tracking-tight ${stat.color}`}>
                      {stat.unit === "$" && "$"} {stat.value} {stat.unit !== "$" && <span className="text-sm font-bold text-slate-300 ml-1">{stat.unit}</span>}
                   </h3>
                </div>
             </div>
           ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           
           {/* Controls */}
           <section className="lg:col-span-1 space-y-6">
              <div className="flex items-center gap-3 px-2">
                 <Settings className="w-5 h-5 text-slate-400" />
                 <h3 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">自動化控制</h3>
              </div>
              
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm space-y-4">
                 <div className="p-6 bg-slate-50 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                       <BarChart3 className="w-4 h-4 text-indigo-500" />
                       <h4 className="font-bold text-sm text-slate-800">全體階級考核</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">手動觸發系統掃描所有會員的消費與推薦紀錄，並重新評定階級。</p>
                    <button 
                      onClick={runEvaluateTiers}
                      disabled={isProcessing}
                      className="w-full bg-white border border-slate-200 text-slate-800 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition shadow-sm"
                    >
                      立即考核
                    </button>
                 </div>

                 <div className="p-6 bg-emerald-50 rounded-3xl space-y-4 border border-emerald-100/50">
                    <div className="flex items-center gap-3 mb-2">
                       <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                       <h4 className="font-bold text-sm text-emerald-900">推廣獎金結算</h4>
                    </div>
                    <p className="text-[10px] text-emerald-700/60 font-medium leading-relaxed">將所有待處理的退傭轉為已完成。建議於雙週五執行手動結算。</p>
                    <button 
                      onClick={runSettlement}
                      disabled={isProcessing}
                      className="w-full bg-emerald-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20"
                    >
                      執行結算
                    </button>
                 </div>
              </div>
           </section>

           {/* Exit Applications */}
           <section className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3 px-2">
                 <AlertCircle className="w-5 h-5 text-rose-500" />
                 <h3 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">待處理申請 ({exitApps.length})</h3>
              </div>
              
              <div className="bg-white rounded-[3rem] p-10 border border-slate-50 shadow-sm min-h-[400px]">
                 {exitApps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-200 space-y-4">
                       <CheckCircle2 className="w-12 h-12" />
                       <p className="text-sm font-bold uppercase tracking-widest">目前無待處理申請</p>
                    </div>
                 ) : (
                    <div className="space-y-4">
                       {exitApps.map(app => (
                         <div key={app.id} className="bg-slate-50 p-6 rounded-[2rem] flex justify-between items-center border border-slate-100 group transition hover:border-rose-200">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-slate-400">
                                  {app.name.charAt(0)}
                               </div>
                               <div>
                                  <p className="font-bold text-slate-800">{app.name}</p>
                                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">{app.member_code} | 餘額 ${app.virtual_balance}</p>
                               </div>
                            </div>
                            <button 
                              onClick={() => handleApproveExit(app.id)}
                              disabled={isProcessing}
                              className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition flex items-center gap-2"
                            >
                               核准並結算 <ArrowRight className="w-4 h-4" />
                            </button>
                         </div>
                       ))}
                    </div>
                 )}
              </div>
           </section>
        </div>

        {/* Custom Orders List */}
        <section className="space-y-6">
           <div className="flex items-center gap-3 px-2">
              <Package className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">客製化訂單管理 ({wholesaleOrders.length})</h3>
           </div>
           
           <div className="bg-white rounded-[3rem] p-10 border border-slate-50 shadow-sm overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {wholesaleOrders.map(order => (
                    <div key={order.id} className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 flex flex-col gap-6">
                       <div className="flex justify-between items-start">
                          <div>
                             <h4 className="font-black text-slate-800">{order.member?.name}</h4>
                             <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">訂購 {order.quantity} 盒 | ${Number(order.total_amount).toLocaleString()}</p>
                          </div>
                          <div className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                             In Progress
                          </div>
                       </div>
                       <div className="bg-white p-6 rounded-[2rem] border border-slate-200">
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2">客製化需求說明</p>
                          <p className="text-sm text-slate-800 font-medium break-words leading-relaxed">{order.custom_logo_url}</p>
                       </div>
                       <button className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition">
                          標記為已處理
                       </button>
                    </div>
                 ))}
              </div>
           </div>
        </section>

      </main>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans text-white">載入系統中...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
