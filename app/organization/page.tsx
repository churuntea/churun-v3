"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  ChevronRight, 
  LayoutDashboard, 
  ShoppingBag, 
  Plus, 
  Zap, 
  User, 
  Loader2,
  TrendingUp,
  Award,
  Share2,
  Activity,
  Target,
  Sparkles,
  Trophy,
  Heart,
  UserPlus,
  BarChart3,
  X
} from "lucide-react";
import ReferralCard from "@/components/ReferralCard";
import TeamTree from "@/components/TeamTree";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

// 階級配置 (依照 2026/05/04 更新之職級榮耀殿堂表)
const TIERS = [
  { name: '初潤靈魂伴侶', upgradeAmount: 50000 },
  { name: '初潤知己', upgradeAmount: 25000 },
  { name: '初潤閨蜜', upgradeAmount: 12000 },
  { name: '初潤好朋友', upgradeAmount: 6000 },
  { name: '初潤青少年', upgradeAmount: 3000 },
  { name: '初潤小朋友', upgradeAmount: 1500 },
  { name: '初潤幼兒園', upgradeAmount: 1 },
  { name: '初潤寶寶', upgradeAmount: 0 }
];

const TIER_SORT_ORDER: Record<string, number> = {
  '初潤靈魂伴侶': 0,
  '靈魂伴侶': 0,
  '初潤知己': 1,
  '知己': 1,
  '初潤閨蜜': 2,
  '閨蜜': 2,
  '初潤好朋友': 3,
  '好朋友': 3,
  '初潤青少年': 4,
  '青少年': 4,
  '初潤小朋友': 5,
  '小朋友': 5,
  '初潤幼兒園': 6,
  '幼兒園': 6,
  '初潤寶寶': 7,
  '寶寶': 7
};

function TeamPerformanceChart({ data }: { data: any[] }) {
  const chartData = data.slice(0, 5).map(m => ({
    name: m.name.length > 4 ? m.name.substring(0, 4) + '...' : m.name,
    amount: Number(m.lifetime_spend) || 0
  }));

  if (chartData.length === 0) return null;

  return (
    <div className="h-64 w-full bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm">
       <div className="flex items-center justify-between mb-6">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <BarChart3 className="w-4 h-4 text-emerald-500" /> 核心夥伴表現
          </h4>
          <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">TOP 5 PERFORMANCE</span>
       </div>
       <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
             <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="0%" stopColor="#064e3b" stopOpacity={1}/>
                   <stop offset="100%" stopColor="#059669" stopOpacity={0.8}/>
                </linearGradient>
             </defs>
             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
             <XAxis 
               dataKey="name" 
               axisLine={false} 
               tickLine={false} 
               tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
             />
             <Tooltip 
               cursor={{ fill: '#f8fafc' }}
               contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: '10px', fontWeight: '900' }}
             />
             <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={24}>
                {chartData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill="url(#barGradient)" />
                ))}
             </Bar>
          </BarChart>
       </ResponsiveContainer>
    </div>
  );
}

function OrganizationContent() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [downlines, setDownlines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextTier, setNextTier] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    setCurrentUserId(savedId);
  }, [router]);

  const fetchOrganization = async (userId: string) => {
    setIsLoading(true);
    const { data: mData } = await supabase.from("members").select("*").eq("id", userId).single();
    setMemberInfo(mData);

    const { data } = await supabase
      .from("members")
      .select("*")
      .eq("upline_id", userId)
      .order("created_at", { ascending: false });

    const sorted = (data || []).sort((a, b) => {
      const orderA = TIER_SORT_ORDER[a.tier] ?? 99;
      const orderB = TIER_SORT_ORDER[b.tier] ?? 99;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    setDownlines(sorted);
    calculateProgress(mData, data || []);
    setIsLoading(false);
  };

  const filteredDownlines = downlines.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (d.member_code && d.member_code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const calculateProgress = (me: any, team: any[]) => {
    const currentTierIdx = TIERS.findIndex(t => t.name === me.tier);
    if (currentTierIdx > 0) {
      const target = TIERS[currentTierIdx - 1];
      setNextTier(target);
      
      // 升級進度依據「終身累積金額」
      const currentVal = Number(me.lifetime_spend) || 0;
      const p = Math.min(Math.round((currentVal / target.upgradeAmount) * 100), 100);
      setProgress(p);
    }
  };

  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [selectedLeaderboardTier, setSelectedLeaderboardTier] = useState<string | null>(null);

  const getTierCount = (tierName: string) => {
    return downlines.filter(d => d.tier === tierName).length;
  };

  const getTierMembers = (tierName: string) => {
    return downlines.filter(d => d.tier === tierName);
  };

  const getTop10Members = (tierName: string) => {
    return downlines
      .filter(d => d.tier === tierName)
      .sort((a, b) => (Number(b.lifetime_spend) || 0) - (Number(a.lifetime_spend) || 0))
      .slice(0, 10);
  };

  useEffect(() => {
    if (currentUserId) fetchOrganization(currentUserId);
  }, [currentUserId]);

  if (isLoading && !memberInfo) return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-50 px-8 py-6 flex justify-between items-center max-w-lg mx-auto">
        <h1 className="text-sm font-black tracking-[0.3em] text-slate-800 uppercase">我的組織系統</h1>
        <div className="bg-emerald-50 px-4 py-2 rounded-2xl flex items-center gap-2">
           <Trophy className="w-4 h-4 text-emerald-600" />
           <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">{downlines.length} 夥伴</span>
        </div>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-8 mt-4">
        
        {/* Tier Distribution Summary */}
        <section className="space-y-4">
           <div className="flex justify-between items-center px-2">
              <h3 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">直推夥伴職級分佈</h3>
              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic">點擊查看成員明細</span>
           </div>
           <div className="grid grid-cols-2 gap-4">
              {TIERS.filter(t => getTierCount(t.name) > 0).map((tier) => (
                <motion.div 
                  key={tier.name}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTier(tier.name)}
                  className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm flex justify-between items-center cursor-pointer group"
                >
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{tier.name}</p>
                      <h4 className="text-2xl font-black text-slate-800">{getTierCount(tier.name)}</h4>
                   </div>
                   <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                   </div>
                </motion.div>
              ))}
              {downlines.length === 0 && (
                <div className="col-span-2 py-10 bg-white rounded-[2.5rem] border border-dashed border-slate-200 text-center">
                   <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">目前暫無直推夥伴</p>
                </div>
              )}
           </div>
        </section>

        {/* Tier Progress Radar */}
        <section className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20">
           <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-emerald-500 rounded-full blur-[100px] opacity-20"></div>
           <div className="relative z-10 space-y-8">
              <div className="flex justify-between items-start">
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">Current Tier</p>
                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                       {memberInfo?.tier} <Sparkles className="w-6 h-6 text-amber-400" />
                    </h2>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase">晉升進度</p>
                    <p className="text-2xl font-black text-white">{progress}%</p>
                 </div>
              </div>

              {nextTier && (
                <div className="space-y-4">
                   <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300"
                      />
                   </div>
                    <p className="text-[10px] font-medium text-white/60 leading-relaxed italic">
                       目標：晉升至「{nextTier.name}」<br/>
                       達成條件：終身累積消費滿 ${nextTier.upgradeAmount.toLocaleString()} 元
                    </p>
                </div>
              )}
           </div>
        </section>

        {/* 職推購買力排行榜 - NEW & ENHANCED */}
        <section className="space-y-6">
           <div className="flex justify-between items-center px-4">
              <h3 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">職推購買力排行榜</h3>
              <div className="flex items-center gap-1">
                 <Trophy className="w-4 h-4 text-amber-500" />
                 <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Tier Leaders</span>
              </div>
           </div>
           
           <div className="space-y-4">
              {TIERS.map((tier) => {
                const tierMembers = downlines
                  .filter(d => d.tier === tier.name)
                  .sort((a, b) => (Number(b.lifetime_spend) || 0) - (Number(a.lifetime_spend) || 0));
                
                if (tierMembers.length === 0) return null;

                const top3 = tierMembers.slice(0, 3);

                return (
                  <motion.div 
                    key={tier.name}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      setSelectedLeaderboardTier(tier.name);
                    }}
                    className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-slate-50 rounded-full blur-2xl group-hover:bg-amber-50 transition-colors"></div>
                    
                    <div className="relative z-10 space-y-6">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tier.name}</p>
                          <h4 className="text-lg font-black text-slate-800 tracking-tight">
                            菁英排行榜 <span className="text-xs text-slate-300 ml-2">Total {tierMembers.length}</span>
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest group-hover:gap-4 transition-all">
                          查看 Top 10 <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {top3.map((m, idx) => (
                          <div key={m.id} className="flex justify-between items-center bg-slate-50/50 rounded-2xl px-5 py-3 group-hover:bg-white transition-colors">
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                                idx === 0 ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 text-slate-500'
                              }`}>
                                {idx + 1}
                              </span>
                              <span className="text-xs font-black text-slate-700">{m.name}</span>
                            </div>
                            <span className="text-xs font-black text-slate-900 font-mono">${Number(m.lifetime_spend || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
           </div>
        </section>

        {/* AI Performance Insights - Optimized */}
        <div className="grid grid-cols-2 gap-6">
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm space-y-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                      <Target className="w-4 h-4 text-amber-500" />
                   </div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">團隊業績</span>
                </div>
                <div className="space-y-1">
                   <p className="text-xl font-black text-slate-800 tracking-tighter">
                      ${downlines.filter(curr => curr.id !== memberInfo?.id).reduce((acc, curr) => acc + (Number(curr.lifetime_spend) || 0), 0).toLocaleString()}
                   </p>
                   <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-500" /> +12.5% 本月增長
                   </p>
                </div>
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm space-y-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                      <Activity className="w-4 h-4 text-indigo-500" />
                   </div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">團隊活力</span>
                </div>
                <div className="flex items-end gap-2">
                   <h4 className="text-2xl font-black text-slate-800">優良</h4>
                   <span className="text-[8px] font-black text-emerald-500 mb-1">STABLE</span>
                </div>
              </div>
           </div>
        </div>

         {/* Team Search & Performance Visualization */}
         <div className="space-y-6">
            <div className="relative group">
               <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors">
                  <Users className="w-5 h-5" />
               </div>
               <input 
                 type="text" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder="搜尋夥伴姓名或會員編號..." 
                 className="w-full bg-white border-2 border-transparent p-6 pl-16 rounded-[2rem] text-sm font-bold focus:outline-none focus:bg-white focus:border-emerald-900/5 transition-all shadow-sm"
               />
            </div>
         </div>
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
        {/* Team Stats Summary */}
        <section className="grid grid-cols-2 gap-6">
           <div className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm space-y-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                 <Users className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">團隊規模</p>
                 <h4 className="text-2xl font-black text-slate-800">{downlines.length} <span className="text-xs font-medium text-slate-400">人</span></h4>
              </div>
              <div className="flex gap-2">
                 <span className="text-[8px] font-black bg-indigo-50 text-indigo-500 px-2 py-1 rounded-full uppercase tracking-tighter">{downlines.filter(d => d.is_b2b).length} B2B</span>
                 <span className="text-[8px] font-black bg-slate-50 text-slate-400 px-2 py-1 rounded-full uppercase tracking-tighter">{downlines.filter(d => !d.is_b2b).length} B2C</span>
              </div>
           </div>
           
           <div className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm space-y-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                 <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">團隊總業績</p>
                 <h4 className="text-2xl font-black text-slate-800"><span className="text-sm font-medium text-slate-400">$</span>{downlines.filter(d => d.id !== memberInfo?.id).reduce((acc, d) => acc + (Number(d.lifetime_spend) || 0), 0).toLocaleString()}</h4>
              </div>
              <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1">
                 <Sparkles className="w-2 h-2 text-amber-400" /> Lifetime Performance
              </p>
           </div>
        </section>

        {/* Performance Chart */}
        <TeamPerformanceChart data={filteredDownlines} />
        </motion.section>

        {/* Team Tree Visualization */}
        <div className="pt-4">
           <TeamTree rootMember={memberInfo} />
        </div>

        {/* Invite CTA */}
        <motion.button 
           whileHover={{ scale: 1.02 }}
           whileTap={{ scale: 0.98 }}
           onClick={() => setIsCardOpen(true)}
           className="w-full bg-emerald-900 text-white py-8 rounded-[2.5rem] font-black text-sm tracking-[0.2em] hover:bg-emerald-800 transition shadow-2xl shadow-emerald-900/30 flex items-center justify-center gap-4 mt-8 group"
        >
           發送精品邀請函 <Share2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        </motion.button>

        <ReferralCard 
          isOpen={isCardOpen} 
          onClose={() => setIsCardOpen(false)} 
          memberInfo={memberInfo} 
        />

      </main>

      {/* Tier Details Modal */}
      <AnimatePresence>
        {selectedTier && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-2xl flex items-end justify-center"
            onClick={() => setSelectedTier(null)}
          >
             <motion.div 
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="bg-white w-full max-w-lg rounded-t-[3.5rem] p-10 shadow-2xl relative overflow-hidden"
               onClick={e => e.stopPropagation()}
             >
                <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-10"></div>
                
                <div className="flex justify-between items-center mb-8">
                   <div className="space-y-1">
                      <h3 className="text-2xl font-black text-slate-900">{selectedTier}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                         共有 {getTierMembers(selectedTier).length} 位核心夥伴
                      </p>
                   </div>
                   <button 
                     onClick={() => setSelectedTier(null)}
                     className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"
                   >
                      <X className="w-5 h-5" />
                   </button>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar pb-10">
                   {getTierMembers(selectedTier).map((m) => (
                     <div key={m.id} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-50 flex justify-between items-center group hover:bg-white hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                              <User className="w-5 h-5 text-slate-400" />
                           </div>
                           <div className="space-y-1">
                              <h4 className="font-bold text-slate-800">{m.name}</h4>
                              <p className="text-[10px] font-black text-emerald-600 tracking-widest">{m.member_code}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-black text-slate-900">${Number(m.lifetime_spend || 0).toLocaleString()}</p>
                           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">LIFETIME SPEND</p>
                        </div>
                     </div>
                   ))}
                </div>

                <button 
                  onClick={() => setSelectedTier(null)}
                  className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20"
                >
                   關閉明細
                </button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaderboard Top 10 Modal */}
      <AnimatePresence>
        {selectedLeaderboardTier && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-2xl flex items-end justify-center"
            onClick={() => setSelectedLeaderboardTier(null)}
          >
             <motion.div 
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="bg-white w-full max-w-lg rounded-t-[3.5rem] p-10 shadow-2xl relative overflow-hidden"
               onClick={e => e.stopPropagation()}
             >
                <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-10"></div>
                
                <div className="flex justify-between items-center mb-8">
                   <div className="space-y-1">
                      <h3 className="text-2xl font-black text-slate-900">{selectedLeaderboardTier}</h3>
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                         <Trophy className="w-3 h-3" /> 購買力排行榜 TOP 10
                      </p>
                   </div>
                   <button 
                     onClick={() => setSelectedLeaderboardTier(null)}
                     className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"
                   >
                      <X className="w-5 h-5" />
                   </button>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar pb-10 px-1">
                   {getTop10Members(selectedLeaderboardTier).map((m, idx) => (
                     <div key={m.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center group hover:bg-slate-50 transition-all">
                        <div className="flex items-center gap-5">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                             idx === 0 ? 'bg-amber-400 text-slate-900' : 
                             idx === 1 ? 'bg-slate-200 text-slate-600' :
                             idx === 2 ? 'bg-amber-100 text-amber-800' : 'bg-slate-50 text-slate-400'
                           }`}>
                              {idx + 1}
                           </div>
                           <div className="space-y-1">
                              <h4 className="font-black text-slate-800 text-sm">{m.name}</h4>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{m.member_code || 'Elite Member'}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-black text-slate-900 font-mono">${Number(m.lifetime_spend || 0).toLocaleString()}</p>
                           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">LIFETIME CONTRIBUTION</p>
                        </div>
                     </div>
                   ))}
                </div>

                <button 
                  onClick={() => setSelectedLeaderboardTier(null)}
                  className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20"
                >
                   返回組織中心
                </button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      <div className="fixed bottom-8 left-4 right-4 z-50 mx-auto max-w-sm">
         <div className="bg-slate-900/90 backdrop-blur-3xl rounded-[2.5rem] p-3 flex justify-between items-center shadow-2xl shadow-slate-900/40 border border-white/10">
            <Link href="/" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <LayoutDashboard className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">主頁</span>
            </Link>
            <Link href="/store" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <ShoppingBag className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">商城</span>
            </Link>
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 -mt-8 border-4 border-[#FDFBF7]">
               <Plus className="w-6 h-6 text-white" />
            </div>
            <Link href="/organization" className="flex-1 flex flex-col items-center gap-1 text-white">
               <Zap className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">組織</span>
            </Link>
            <Link href="/profile" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <User className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">個人</span>
            </Link>
         </div>
      </div>
    </div>
  );
}

export default function Organization() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>}>
      <OrganizationContent />
    </Suspense>
  );
}
