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
  AlertTriangle
} from "lucide-react";

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
             { label: "待核准提領", val: stats.pendingSettlement.toLocaleString(), icon: Wallet, color: "text-amber-500", href: "/admin/withdrawals" },
             { label: "待處理訂單", val: stats.activeOrders, icon: Package, color: "text-blue-500", href: "/admin/orders" },
             { label: "總會員數", val: stats.totalMembers, icon: Users, color: "text-emerald-500", href: "#" },
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

        <div className="bg-white rounded-[4rem] p-12 border border-slate-50 text-center">
           <Activity className="w-12 h-12 text-indigo-500 mx-auto mb-6" />
           <h3 className="text-xl font-black text-slate-900">核心系統監控中</h3>
           <p className="text-sm text-slate-400 mt-2">分析模組正在同步雲端數據...</p>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <Link href="/admin/news" className="bg-slate-900 rounded-[3rem] p-10 text-white group hover:scale-[1.02] transition duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
              <h3 className="text-2xl font-black mb-4">品牌快訊編輯器</h3>
              <p className="text-white/40 text-xs uppercase tracking-widest">Publish News & Pulse</p>
           </Link>
           <Link href="/admin/orders" className="bg-indigo-600 rounded-[3rem] p-10 text-white group hover:scale-[1.02] transition duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-white rounded-full blur-3xl opacity-10"></div>
              <h3 className="text-2xl font-black mb-4">訂單調度中心</h3>
              <p className="text-white/80 text-xs uppercase tracking-widest">Manage Global Orders</p>
           </Link>
        </div>

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
