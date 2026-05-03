"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
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
  Activity
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

// 模擬趨勢數據
const data = [
  { name: 'Jan', members: 400, sales: 2400 },
  { name: 'Feb', members: 600, sales: 3200 },
  { name: 'Mar', members: 900, sales: 4800 },
  { name: 'Apr', members: 1200, sales: 5600 },
  { name: 'May', members: 1800, sales: 7200 },
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
             { label: "待核准提領", val: "12", icon: Wallet, color: "text-amber-500", href: "/admin/withdrawals" },
             { label: "待處理訂單", val: "08", icon: Package, color: "text-blue-500", href: "/admin/orders" },
             { label: "本月總業績", val: "$12.4M", icon: TrendingUp, color: "text-emerald-500", href: "/admin/products" },
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

        {/* Brand Voice & Marketing */}
        <section className="bg-slate-900 rounded-[4rem] p-12 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-emerald-500 rounded-full blur-[120px] opacity-20"></div>
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
              <div className="space-y-4 text-center md:text-left">
                 <h3 className="text-3xl font-black tracking-tight">掌控品牌脈動</h3>
                 <p className="text-white/40 text-sm max-w-md leading-relaxed">
                    透過即時快訊系統，將總部的最新政策、產品動向秒速傳遞給每一位合作夥伴。
                 </p>
                 <Link href="/admin/news" className="inline-flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition">
                    進入公告編輯器 <ArrowUpRight className="w-4 h-4" />
                 </Link>
              </div>
              <div className="flex gap-4">
                 <div className="w-32 h-40 bg-white/5 rounded-3xl border border-white/10 p-6 flex flex-col justify-end">
                    <p className="text-[8px] font-black uppercase text-white/30 mb-2">Live News</p>
                    <p className="text-xl font-black">24+</p>
                 </div>
                 <div className="w-32 h-40 bg-white/5 rounded-3xl border border-white/10 p-6 flex flex-col justify-end">
                    <p className="text-[8px] font-black uppercase text-white/30 mb-2">Reach</p>
                    <p className="text-xl font-black">1.2K</p>
                 </div>
              </div>
           </div>
        </section>

        {/* Analytics Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           
           <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center px-4">
                 <h3 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase flex items-center gap-2">
                    <Activity className="w-4 h-4" /> 業績與成長趨勢
                 </h3>
                 <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                       <span className="text-[10px] font-black text-slate-400 uppercase">Members</span>
                    </div>
                 </div>
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
                         animationDuration={2000}
                       />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           <div className="space-y-6">
              <h3 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase px-2">快捷管理操作</h3>
              <div className="bg-white rounded-[3rem] p-8 border border-slate-50 shadow-sm space-y-4">
                 {[
                   { label: "全體階級考核", icon: LayoutDashboard, action: "/api/cron/evaluate-tiers" },
                   { label: "獎金發放結算", icon: Wallet, action: "/api/cron/settlement" },
                   { label: "商品參數管理", icon: Settings, action: "/admin/products" },
                   { label: "數據庫備份", icon: Database, action: "#" }
                 ].map((act, i) => (
                   <button 
                     key={i}
                     onClick={async () => {
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
        </section>

        {/* Proactive Alerts */}
        <section className="space-y-6">
           <h3 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase px-2">智慧系統診斷</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-center gap-6 p-8 bg-rose-50 rounded-[2.5rem] border border-rose-100">
                 <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm">
                    <XCircle className="w-8 h-8 text-rose-500" />
                 </div>
                 <div className="flex-1">
                    <h4 className="font-black text-rose-900 tracking-tight">餘額風險警報</h4>
                    <p className="text-xs text-rose-700 mt-1">目前有 3 位 B2B 夥伴預收款不足，建議手動提醒。</p>
                 </div>
                 <ArrowUpRight className="w-5 h-5 text-rose-300" />
              </div>

              <div className="flex items-center gap-6 p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100">
                 <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                 </div>
                 <div className="flex-1">
                    <h4 className="font-black text-emerald-900 tracking-tight">伺服器健康度 100%</h4>
                    <p className="text-xs text-emerald-700 mt-1">自動考核任務已在 00:00 順利執行完畢。</p>
                 </div>
                 <TrendingUp className="w-5 h-5 text-emerald-300" />
              </div>
           </div>
        </section>

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
