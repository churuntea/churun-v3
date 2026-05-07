"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, 
  Users, 
  Package, 
  ArrowUpRight, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Loader2,
  Zap,
  ShieldCheck,
  LayoutDashboard,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  Database,
  RefreshCcw,
  TrendingUp,
  Activity,
  AlertTriangle,
  Ticket,
  Image as ImageIcon
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const data = [
  { name: 'Jan', members: 400 },
  { name: 'Feb', members: 600 },
  { name: 'Mar', members: 900 },
  { name: 'Apr', members: 1200 },
  { name: 'May', members: 1800 },
];

function AdminDashboardContent() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState("");
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalB2B: 0,
    pendingSettlement: 0,
    activeOrders: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupTimeframe, setBackupTimeframe] = useState("month");
  const [isGeneratingBackup, setIsGeneratingBackup] = useState(false);
  const [backupData, setBackupData] = useState<any>(null);

  const handleGenerateBackup = async (timeframe: string) => {
    setIsGeneratingBackup(true);
    try {
      const res = await fetch(`/api/admin/backup-stats?timeframe=${timeframe}`);
      const result = await res.json();
      if (result.success) {
        setBackupData(result);
      } else {
        alert("分析失敗: " + result.error);
      }
    } catch (err: any) {
      alert("分析出錯: " + err.message);
    }
    setIsGeneratingBackup(false);
  };

  const downloadTextFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJsonFile = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const auth = sessionStorage.getItem("churun_admin_auth");
    if (auth === "true") {
      setIsAdmin(true);
      fetchStats();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const { count: mCount } = await supabase.from("members").select("*", { count: "exact", head: true });
      const { count: bCount } = await supabase.from("members").select("*", { count: "exact", head: true }).eq("is_b2b", true);
      const { data: wData } = await supabase.from("wallet_transactions").select("amount").eq("status", "pending");
      
      const pendingSum = wData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

      setStats({
        totalMembers: mCount || 0,
        totalB2B: bCount || 0,
        pendingSettlement: pendingSum,
        activeOrders: 12 
      });
    } catch (err) { console.error(err); }
    setIsLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      sessionStorage.setItem("churun_admin_auth", "true");
      setIsAdmin(true);
      fetchStats();
    } else {
      alert("密碼錯誤");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("churun_admin_auth");
    setIsAdmin(false);
  };

  if (isLoading && isAdmin) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#312e81,transparent)] opacity-50"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-slate-900/50 backdrop-blur-3xl p-12 rounded-[3rem] border border-slate-800 shadow-2xl text-center">
           <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-600/20">
              <ShieldCheck className="w-10 h-10 text-white" />
           </div>
           <h1 className="text-2xl font-black text-white tracking-tight mb-2">總部授權中心</h1>
           <p className="text-xs text-slate-500 uppercase tracking-[0.3em] mb-10">Restricted Area</p>
           
           <form onSubmit={handleLogin} className="space-y-6">
              <input 
                type="password" 
                placeholder="請輸入管理授權碼" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 p-5 rounded-2xl text-white text-center font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition"
              />
              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition shadow-xl shadow-indigo-600/20">
                 啟動指揮系統
              </button>
           </form>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 pb-20">
      
      <nav className="bg-slate-900 text-white sticky top-0 z-50 px-8 py-4 flex justify-between items-center shadow-2xl">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
               <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-sm font-black tracking-[0.2em] uppercase">HQ Command Center</h1>
         </div>
         <div className="flex items-center gap-6">
            <button onClick={fetchStats} className="p-2 text-slate-400 hover:text-white transition">
               <RefreshCcw className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-400 transition">
               Logout
            </button>
         </div>
      </nav>

      <main className="max-w-7xl mx-auto p-10 space-y-12">
        
        {/* HQ Stats Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 px-2">
           {[
             { label: "待核准提領", val: stats.pendingSettlement.toLocaleString(), icon: Wallet, color: "text-amber-500", href: "/admin/withdrawals" },
             { label: "待處理訂單", val: stats.activeOrders, icon: Package, color: "text-blue-500", href: "/admin/orders" },
             { label: "總會員數", val: stats.totalMembers, icon: Users, color: "text-emerald-500", href: "/admin/members" },
             { label: "異常警報", val: "0", icon: AlertTriangle, color: "text-rose-500", href: "#" }
           ].map((stat, i) => (
             <Link href={stat.href} key={i}>
                <motion.div 
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-4 cursor-pointer"
                >
                   <div className="flex justify-between items-center">
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                      <ChevronRight className="w-4 h-4 text-slate-200" />
                   </div>
                   <div className="space-y-1">
                      <h4 className="text-2xl font-black text-slate-800 tracking-tighter">{stat.val}</h4>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{stat.label}</p>
                   </div>
                </motion.div>
             </Link>
           ))}
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           {/* Left: 快捷管理操作 */}
           <div className="space-y-6 lg:col-span-1">
              <h3 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase px-2">快捷管理操作</h3>
              <div className="bg-white rounded-[3rem] p-8 border border-slate-50 shadow-sm space-y-4">
                 {[
                   { label: "優惠券與派發管理", icon: Ticket, action: "/admin/coupons" },
                   { label: "公版行銷海報管理", icon: ImageIcon, action: "/admin/posters" },
                   { label: "會員總覽與資料匯出", icon: Users, action: "/admin/members" },
                   { label: "全體階級考核", icon: LayoutDashboard, action: "/admin/evaluation" },
                   { label: "訂單與出貨管理", icon: Package, action: "/admin/orders" },
                   { label: "獎金發放結算", icon: Wallet, action: "/api/cron/settlement" },
                   { label: "商品參數管理", icon: Settings, action: "/admin/products" },
                   { label: "數據庫備份", icon: Database, action: "#" }
                 ].map((act, i) => (
                   <button 
                     key={i}
                     onClick={async () => {
                         if (act.label === "數據庫備份") {
                            setShowBackupModal(true);
                            handleGenerateBackup(backupTimeframe);
                            return;
                         }
                         if (act.action.startsWith('/')) {
                           if (act.action.includes('/api/')) {
                              const res = await fetch(act.action, { method: 'POST' });
                              const d = await res.json();
                              alert(d.message || d.error);
                           } else {
                              router.push(act.action);
                           }
                        }
                     }}
                     className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-2xl hover:bg-slate-900 hover:text-white transition group"
                   >
                      <div className="flex items-center gap-4">
                         <act.icon className="w-5 h-5 text-slate-400 group-hover:text-white" />
                         <span className="text-sm font-bold">{act.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
                   </button>
                 ))}
              </div>
           </div>

           {/* Right: 業績與成長趨勢 */}
           <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center px-4">
                 <h3 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase flex items-center gap-2">
                    <Activity className="w-4 h-4" /> 業績與成長趨勢
                 </h3>
              </div>
              <div className="bg-white rounded-[4rem] p-10 border border-slate-50 shadow-sm h-[400px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                       <defs>
                          <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                             <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#cbd5e1'}} dy={10} />
                       <YAxis hide />
                       <Tooltip 
                         contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '12px' }}
                         itemStyle={{ color: '#818cf8', fontWeight: 900 }}
                       />
                       <Area 
                         type="monotone" 
                         dataKey="members" 
                         stroke="#6366f1" 
                         strokeWidth={4} 
                         fillOpacity={1} 
                         fill="url(#colorMembers)" 
                       />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>

      
      {/* Backup & Analytics Statistics Modal */}
      <AnimatePresence>
        {showBackupModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBackupModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] p-8 sm:p-10 w-full max-w-2xl shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col gap-6"
              onClick={e => e.stopPropagation()}
            >
               <div className="flex items-center justify-between border-b border-slate-100 pb-6 shrink-0">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-md">
                        <Database className="w-6 h-6" />
                     </div>
                     <div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">數位指揮中心 - 數據備份與業務統計</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Database Backup & Sales Analytics</p>
                     </div>
                  </div>
                  <button onClick={() => setShowBackupModal(false)} className="text-slate-300 hover:text-slate-800 transition text-sm font-black uppercase">✕</button>
               </div>

               {/* 統計時間維度選擇器 */}
               <div className="space-y-3 shrink-0">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">選擇統計備份時間範圍 (Timeframe)</label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                     {[
                       { label: "今日", val: "day" },
                       { label: "本週", val: "week" },
                       { label: "本月", val: "month" },
                       { label: "本季", val: "quarter" },
                       { label: "半年", val: "half-year" },
                       { label: "一年", val: "year" },
                       { label: "歷史所有", val: "all" }
                     ].map(item => (
                       <button
                         key={item.val}
                         onClick={() => {
                           setBackupTimeframe(item.val);
                           handleGenerateBackup(item.val);
                         }}
                         className={`py-2 px-1 rounded-xl text-[10px] font-black transition-all text-center whitespace-nowrap ${backupTimeframe === item.val ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                       >
                         {item.label}
                       </button>
                     ))}
                  </div>
               </div>

               {isGeneratingBackup ? (
                  <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center gap-4 text-slate-400">
                     <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                     <p className="text-xs font-black uppercase tracking-widest">正在從資料庫撈取海量數據並進行業務計算...</p>
                  </div>
               ) : backupData ? (
                  <div className="flex-1 flex flex-col gap-6 overflow-hidden min-h-[350px]">
                     {/* 頂部數據亮點摘要 */}
                     <div className="grid grid-cols-3 gap-4 shrink-0">
                        <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/30 text-center">
                           <span className="text-[8px] font-black text-indigo-400 uppercase tracking-wider block mb-1">營業總額</span>
                           <h4 className="text-lg font-black text-indigo-900 tracking-tight">${backupData.summary.total_revenue.toLocaleString()}</h4>
                        </div>
                        <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/30 text-center">
                           <span className="text-[8px] font-black text-emerald-400 uppercase tracking-wider block mb-1">總銷售量</span>
                           <h4 className="text-lg font-black text-emerald-900 tracking-tight">{backupData.summary.total_volume} 件</h4>
                        </div>
                        <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100/30 text-center">
                           <span className="text-[8px] font-black text-amber-400 uppercase tracking-wider block mb-1">有效訂單</span>
                           <h4 className="text-lg font-black text-amber-900 tracking-tight">{backupData.summary.active_orders} 筆</h4>
                        </div>
                     </div>

                     {/* 預覽報告區 */}
                     <div className="flex-1 overflow-y-auto border border-slate-100 rounded-2xl p-5 bg-slate-900 text-slate-200 font-mono text-[10px] leading-relaxed no-scrollbar max-h-[250px] relative">
                        <pre className="whitespace-pre-wrap">{backupData.text_report}</pre>
                     </div>

                     {/* 導出按鈕區 */}
                     <div className="grid grid-cols-2 gap-4 shrink-0">
                        <button
                          onClick={() => downloadTextFile(backupData.text_report, `churun_backup_report_${backupTimeframe}_${new Date().toISOString().slice(0, 10)}.txt`)}
                          className="bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
                        >
                          📥 下載純文字備份 (.txt)
                        </button>
                        <button
                          onClick={() => downloadJsonFile(backupData, `churun_structured_backup_${backupTimeframe}_${new Date().toISOString().slice(0, 10)}.json`)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10"
                        >
                          📥 下載結構化數據 (.json)
                        </button>
                     </div>
                  </div>
               ) : (
                  <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center gap-2 text-slate-300">
                     <Database className="w-12 h-12 mb-2" />
                     <p className="text-xs font-black uppercase tracking-widest">請選取一個時間維度進行導出</p>
                  </div>
               )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Initializing HQ...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
