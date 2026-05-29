"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Crown,
  ChevronLeft,
  TrendingUp,
  Users,
  Award,
  BarChart3,
  CreditCard,
  Target,
  ChevronRight,
  ShieldCheck,
  Zap,
  Globe,
  Loader2,
  Gem
} from "lucide-react";
import { supabase } from "@/app/supabase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

function PartnerDashboardContent() {
  const router = useRouter();
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downlines, setDownlines] = useState<any[]>([]);
  const [chartData, setChartData] = useState<{name: string, amount: number}[]>([]);
  const [estimatedEarnings, setEstimatedEarnings] = useState(0);

  useEffect(() => {
    const fetchPartnerData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/me/dashboard");
        if (!res.ok) throw new Error("Fetch failed");
        const data = await res.json();
        
        if (!data.member || !data.member.tier?.includes("合夥人")) {
           alert("此專區僅限合夥人存取！");
           router.replace("/");
           return;
        }
        setMemberInfo(data.member);

        // Fetch direct downlines
        const { data: downlinesData } = await supabase
          .from("members")
          .select("*")
          .eq("upline_id", data.member.id);
          
        if (downlinesData) {
           setDownlines(downlinesData);
        }

        // Fetch wallet transactions for chart
        const { data: txData } = await supabase
          .from("wallet_transactions")
          .select("*")
          .eq("member_id", data.member.id)
          .eq("transaction_type", "commission_refund")
          .order("created_at", { ascending: true });
          
        if (txData) {
           const monthlyData: Record<string, number> = {};
           let currentMonthEarnings = 0;
           const now = new Date();
           
           txData.forEach((tx: any) => {
             const date = new Date(tx.created_at);
             const monthName = `${date.getMonth() + 1}月`;
             monthlyData[monthName] = (monthlyData[monthName] || 0) + Number(tx.amount);
             
             if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
               currentMonthEarnings += Number(tx.amount);
             }
           });
           
           const formattedChartData = [];
           for (let i = 4; i >= 0; i--) {
             const d = new Date();
             d.setMonth(now.getMonth() - i);
             const mName = `${d.getMonth() + 1}月`;
             formattedChartData.push({
               name: mName,
               amount: monthlyData[mName] || 0
             });
           }
           setChartData(formattedChartData);
           setEstimatedEarnings(currentMonthEarnings);
        } else {
           const formattedChartData = [];
           for (let i = 4; i >= 0; i--) {
             const d = new Date();
             d.setMonth(new Date().getMonth() - i);
             formattedChartData.push({ name: `${d.getMonth() + 1}月`, amount: 0 });
           }
           setChartData(formattedChartData);
        }
      } catch (err) {
        console.error(err);
        router.replace("/login");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPartnerData();
  }, [router]);

  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
    </div>
  );

  const teamTotalSpend = downlines.reduce((acc, curr) => acc + (Number(curr.lifetime_spend) || 0), 0);

  // Chart data is now fetched from Supabase

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 pb-32 font-sans selection:bg-amber-500/30">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-900/20 rounded-full blur-[150px] mix-blend-screen" />
      </div>

      {/* Header */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 px-6 py-6 flex items-center justify-between max-w-lg mx-auto">
        <button onClick={() => router.push("/")} className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 active:scale-90 transition">
          <ChevronLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div className="flex items-center gap-2">
          <Gem className="w-4 h-4 text-amber-400" />
          <h1 className="text-[11px] font-black tracking-[0.3em] text-white uppercase">合夥人尊榮專區</h1>
        </div>
      </nav>

      <main className="p-6 max-w-lg mx-auto space-y-8 relative z-10 mt-2">
        {/* Welcome VIP Card */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-black rounded-[3rem] p-10 border border-white/10 shadow-2xl overflow-hidden"
        >
           <div className="absolute top-0 right-0 p-8 opacity-20">
              <Crown className="w-32 h-32 text-amber-500" />
           </div>
           
           <div className="relative z-10 space-y-8">
              <div>
                 <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-[9px] font-black tracking-[0.2em] uppercase mb-4">
                    EXECUTIVE PARTNER
                 </span>
                 <h2 className="text-3xl font-black text-white tracking-tight mb-2">
                    您好，{memberInfo?.name}
                 </h2>
                 <p className="text-xs text-slate-400 font-bold tracking-wide">
                    專屬合夥人編號：{memberInfo?.member_code}
                 </p>
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">本月預估團隊收益</p>
                    <div className="flex items-baseline gap-2">
                       <span className="text-sm font-bold text-amber-500">NT$</span>
                       <span className="text-4xl font-black text-white tracking-tighter">{estimatedEarnings.toLocaleString()}</span>
                    </div>
                 </div>
                 <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1 border border-emerald-500/30">
                    <TrendingUp className="w-3 h-3" /> +15.2%
                 </div>
              </div>
           </div>
        </motion.section>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4">
           {[
             { icon: Users, title: "多代組織樹", desc: "深度檢視團隊", route: "/partner/organization", color: "text-indigo-400", bg: "bg-indigo-500/10" },
             { icon: CreditCard, title: "專屬對帳單", desc: "高階財務報表", route: "/partner/finance", color: "text-amber-400", bg: "bg-amber-500/10" },
             { icon: Award, title: "資源培訓", desc: "高階內部教材", route: "/partner/resources", color: "text-emerald-400", bg: "bg-emerald-500/10" },
             { icon: Globe, title: "B2B 大宗進貨", desc: "合夥人專屬批發", route: "/wholesale", color: "text-blue-400", bg: "bg-blue-500/10" }
           ].map((action, idx) => (
             <motion.div
               key={idx}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 * idx }}
               onClick={() => router.push(action.route)}
               className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 cursor-pointer hover:bg-slate-800/80 transition-all group"
             >
                <div className={`w-12 h-12 ${action.bg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                   <action.icon className={`w-6 h-6 ${action.color}`} />
                </div>
                <h3 className="text-sm font-black text-white mb-1">{action.title}</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{action.desc}</p>
             </motion.div>
           ))}
        </div>

        {/* Performance Chart */}
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/5"
        >
           <div className="flex justify-between items-center mb-8">
              <div>
                 <h3 className="text-sm font-black text-white tracking-widest uppercase flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-amber-500" /> 團隊成長趨勢
                 </h3>
                 <p className="text-[10px] text-slate-500 font-bold mt-1 tracking-widest">近 5 個月業績概況</p>
              </div>
           </div>
           
           <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData}>
                    <defs>
                       <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#d97706" stopOpacity={0.6}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
                      dy={10}
                    />
                    <Tooltip 
                      cursor={{ fill: '#1e293b', opacity: 0.5 }}
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '1rem', color: '#fff', fontSize: '10px' }}
                      itemStyle={{ color: '#fcd34d', fontWeight: '900' }}
                    />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={20}>
                       {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="url(#goldGradient)" />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </motion.section>

        {/* Real-time Team Summary */}
        <section className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/5 space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white tracking-widest uppercase flex items-center gap-2">
                 <Target className="w-4 h-4 text-emerald-400" /> 直屬團隊總覽
              </h3>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Real-time</span>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/50 rounded-2xl p-5 border border-white/5">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">直推人數</p>
                 <p className="text-2xl font-black text-white">{downlines.length} <span className="text-xs text-slate-400">人</span></p>
              </div>
              <div className="bg-slate-950/50 rounded-2xl p-5 border border-white/5">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">直推總業績</p>
                 <p className="text-xl font-black text-white truncate"><span className="text-xs text-slate-400">$</span>{teamTotalSpend.toLocaleString()}</p>
              </div>
           </div>

           <button 
             onClick={() => router.push("/organization")}
             className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 text-white p-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-colors border border-white/10"
           >
              進入詳細組織系統 <ChevronRight className="w-4 h-4 text-slate-400" />
           </button>
        </section>

      </main>
    </div>
  );
}

export default function PartnerDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-amber-500" /></div>}>
      <PartnerDashboardContent />
    </Suspense>
  );
}
