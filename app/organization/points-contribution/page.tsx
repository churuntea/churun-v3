"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from '@/app/supabase';
import { 
  ChevronLeft, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  Users, 
  Loader2,
  Trophy,
  Activity,
  Award
} from "lucide-react";

// 取得該階級專屬點數匯率
const getPointRate = (tierName: string) => {
  const cleanTier = tierName?.startsWith('初潤') ? tierName : `初潤${tierName || '寶寶'}`;
  const RATES: Record<string, number> = {
    '初潤靈魂伴侶': 30,
    '初潤知己': 40,
    '初潤閨蜜': 50,
    '初潤好朋友': 60, '超級小幫手': 60,
    '初潤青少年': 70,
    '初潤小朋友': 80,
    '初潤幼兒園': 90,
    '初潤寶寶': 100,
    '初潤最高階合夥人': 30
  };
  return RATES[cleanTier] || 100;
};

// 階級排序權重
const TIER_SORT_ORDER: Record<string, number> = {
  '初潤靈魂伴侶': 0,
  '靈魂伴侶': 0,
  '初潤知己': 1,
  '知己': 1,
  '初潤閨蜜': 2,
  '閨蜜': 2,
  '初潤好朋友': 3, '超級小幫手': 3,
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

export default function TeamPointsContributionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [downlines, setDownlines] = useState<any[]>([]);
  const [expandedTiers, setExpandedTiers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/me/profile").then(res => res.json()).then(data => {
      if (data.member?.id) {
        fetchData(data.member.id);
      } else {
        router.replace("/login");
      }
    }).catch(() => router.replace("/login"));
  }, [router]);

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data: mData } = await supabase.from("members").select("*").eq("id", userId).single();
      setMemberInfo(mData);

      const { data } = await supabase
        .from("members")
        .select("*")
        .eq("upline_id", userId)
        .order("created_at", { ascending: false });

      setDownlines(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTier = (tier: string) => {
    setExpandedTiers(prev => ({
      ...prev,
      [tier]: !prev[tier]
    }));
  };

  if (isLoading || !memberInfo) return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-900" />
    </div>
  );

  const myPointRate = getPointRate(memberInfo.tier);

  // 計算每個下線貢獻的點數，並加上 point 屬性
  const processedDownlines = downlines.map(d => {
    const spend = Number(d.lifetime_spend) || 0;
    const points = Math.floor(spend / myPointRate);
    return { ...d, points };
  });

  // 計算團隊總累積貢獻點數
  const totalTeamPoints = processedDownlines.reduce((sum, d) => sum + d.points, 0);

  // 依據職級分組
  const tierGroups: Record<string, typeof processedDownlines> = {};
  processedDownlines.forEach(d => {
    const t = d.tier || "初潤寶寶";
    if (!tierGroups[t]) tierGroups[t] = [];
    tierGroups[t].push(d);
  });

  // 整理成陣列並依據職級高低排序
  const groupedList = Object.entries(tierGroups).map(([tierName, members]) => {
    const totalTierPoints = members.reduce((sum, m) => sum + m.points, 0);
    // 依據點數貢獻降冪排序，取出前五名
    const top5 = [...members].sort((a, b) => b.points - a.points).slice(0, 5);
    return {
      tierName,
      members,
      totalTierPoints,
      top5
    };
  }).sort((a, b) => {
    const orderA = TIER_SORT_ORDER[a.tierName] ?? 99;
    const orderB = TIER_SORT_ORDER[b.tierName] ?? 99;
    return orderA - orderB;
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-50 px-6 py-4 flex items-center max-w-lg mx-auto">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50 text-slate-600 hover:bg-slate-50 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 text-center pr-10">
          <h1 className="text-sm font-black tracking-[0.3em] text-slate-800 uppercase">團隊組織貢獻</h1>
        </div>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-8">
        
        {/* 團隊總累積看板 */}
        <section className="bg-emerald-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-emerald-900/20">
           <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-amber-400 rounded-full blur-[80px] opacity-20"></div>
           <div className="relative z-10 text-center space-y-4">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto border border-white/10">
                 <Trophy className="w-7 h-7 text-amber-300" />
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black tracking-[0.4em] uppercase text-emerald-300/80">團隊總累積貢獻</p>
                 <h2 className="text-5xl font-black tracking-tight text-white flex items-baseline justify-center gap-2">
                    {totalTeamPoints.toLocaleString()} <span className="text-xl text-amber-400">P</span>
                 </h2>
              </div>
              <p className="text-[10px] font-medium text-emerald-200/80 tracking-widest pt-4 border-t border-white/10">
                以您的專屬特權 ({myPointRate}元=1點) 換算
              </p>
           </div>
        </section>

        {/* 各職級貢獻統計與排行榜 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            <h3 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">各職級累積回饋</h3>
          </div>

          <div className="space-y-4">
            {groupedList.length === 0 ? (
              <div className="text-center p-10 bg-white rounded-[2rem] border border-dashed border-slate-200">
                 <p className="text-xs font-bold text-slate-400 tracking-widest">目前暫無團隊貢獻資料</p>
              </div>
            ) : (
              groupedList.map((group) => {
                const isExpanded = !!expandedTiers[group.tierName];
                
                return (
                  <motion.div 
                    key={group.tierName}
                    layout
                    className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden"
                  >
                    {/* 卡片標題區 */}
                    <div 
                      className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
                      onClick={() => toggleTier(group.tierName)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                          <Award className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{group.tierName}</p>
                          <h4 className="text-xl font-black text-slate-800 tracking-tight flex items-baseline gap-1">
                            {group.totalTierPoints.toLocaleString()} <span className="text-xs font-bold text-slate-400">P</span>
                          </h4>
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>

                    {/* 下拉展開區：前五名 */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-slate-50 bg-slate-50/50"
                        >
                          <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black tracking-widest text-indigo-500 uppercase">Top 5 貢獻排行榜</span>
                              <span className="text-[10px] font-bold text-slate-400">共 {group.members.length} 人</span>
                            </div>
                            
                            <div className="space-y-3">
                              {group.top5.map((member, idx) => (
                                <div key={member.id} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                  <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                                      idx === 0 ? 'bg-amber-400 text-amber-900' : 
                                      idx === 1 ? 'bg-slate-200 text-slate-600' :
                                      idx === 2 ? 'bg-orange-200 text-orange-800' :
                                      'bg-slate-100 text-slate-400'
                                    }`}>
                                      {idx + 1}
                                    </span>
                                    <span className="text-xs font-black text-slate-700">{member.name}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-sm font-black text-slate-900 font-mono">
                                      {member.points.toLocaleString()} <span className="text-[10px] text-slate-400">P</span>
                                    </span>
                                  </div>
                                </div>
                              ))}
                              
                              {group.top5.length === 0 && (
                                <p className="text-xs text-center text-slate-400 py-4">無資料</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
