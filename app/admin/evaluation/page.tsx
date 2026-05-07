"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft,
  Users, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  Wallet, 
  Calendar, 
  Search, 
  Zap, 
  Award, 
  Heart,
  Phone
} from "lucide-react";

interface Member {
  id: string;
  name: string;
  phone: string;
  tier: string;
  lifetime_spend: number;
  virtual_balance: number;
  points_balance: number;
  created_at: string;
}

const ZONES = [
  {
    id: "members",
    name: "初潤會員專區",
    desc: "B2C 一般客戶 & 行銷會員階層",
    color: "from-blue-600 to-indigo-600",
    bgLight: "bg-blue-50/50",
    borderLight: "border-blue-100",
    textDark: "text-blue-900",
    ranks: [
      { name: "初潤寶寶", criteria: "完成註冊登入即可加入", target: "$0" },
      { name: "初潤幼兒園", criteria: "只要進行任意一次消費即可晉升", target: "消費 $1 起" },
      { name: "初潤小朋友", criteria: "累積消費金額達 $1,500 元", target: "$1,500" },
      { name: "初潤青少年", criteria: "累積消費金額達 $3,000 元", target: "$3,000" }
    ]
  },
  {
    id: "partners",
    name: "合夥人專區",
    desc: "B2B 個人商業合夥夥伴階層",
    color: "from-emerald-600 to-teal-600",
    bgLight: "bg-emerald-50/50",
    borderLight: "border-emerald-100",
    textDark: "text-emerald-900",
    ranks: [
      { name: "初潤好朋友", criteria: "累積消費金額達 $6,000 元", target: "$6,000" },
      { name: "初潤閨蜜", criteria: "累積消費金額達 $12,000 元", target: "$12,000" }
    ]
  },
  {
    id: "ambassadors",
    name: "品牌大使專區",
    desc: "B2B 頂級品牌核心經營階層",
    color: "from-amber-500 to-orange-600",
    bgLight: "bg-amber-50/50",
    borderLight: "border-amber-100",
    textDark: "text-amber-900",
    ranks: [
      { name: "初潤知己", criteria: "累積消費金額達 $25,000 元", target: "$25,000" },
      { name: "初潤靈魂伴侶", criteria: "累積消費金額達 $50,000 元", target: "$50,000" }
    ]
  }
];

function EvaluationContent() {
  const router = useRouter();
  const [activeZone, setActiveZone] = useState("members");
  const [expandedRank, setExpandedRank] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [rankCounts, setRankCounts] = useState<Record<string, number>>({});
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Auth Check
    const auth = sessionStorage.getItem("churun_admin_auth");
    if (auth !== "true") {
      alert("⚠️ 請先登入管理中心授權");
      router.replace("/admin");
    } else {
      setIsAdmin(true);
      fetchGlobalStats();
    }
  }, [router]);

  const fetchGlobalStats = async () => {
    try {
      const { data: mData, error } = await supabase.from("members").select("tier");
      if (mData) {
        const counts: Record<string, number> = {};
        mData.forEach(m => {
          const t = m.tier || "初潤寶寶";
          counts[t] = (counts[t] || 0) + 1;
        });
        setRankCounts(counts);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleRank = async (rankName: string) => {
    if (expandedRank === rankName) {
      setExpandedRank(null);
      setMembers([]);
      return;
    }

    setExpandedRank(rankName);
    setLoadingMembers(true);
    setSearchTerm("");

    try {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("tier", rankName)
        .order("lifetime_spend", { ascending: false });

      if (data) {
        setMembers(data as Member[]);
      } else {
        setMembers([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleEvaluateAll = async () => {
    if (!confirm("⚠️ 您確定要立即啟動全體會員階級考核嗎？系統將比對所有人的累積消費額並重新分配正確職級！")) return;
    
    setIsEvaluating(true);
    try {
      const res = await fetch("/api/cron/evaluate-tiers", { method: "POST" });
      const result = await res.json();
      if (res.ok) {
        alert(`✅ 考核執行成功！\n${result.message || "全體會員階級已完成校正與連動！"}`);
        fetchGlobalStats();
        if (expandedRank) {
          // Refresh current list
          const currentRank = expandedRank;
          setExpandedRank(null);
          setTimeout(() => handleToggleRank(currentRank), 200);
        }
      } else {
        alert(`❌ 執行失敗: ${result.error || "伺服器無回應"}`);
      }
    } catch (err: any) {
      alert(`⚠️ 連線異常: ${err.message}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (m.phone && m.phone.includes(searchTerm))
  );

  if (!isAdmin) return null;

  const currentZoneObj = ZONES.find(z => z.id === activeZone)!;

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-24 text-slate-800">
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 max-w-5xl mx-auto flex justify-between items-center bg-[#FDFBF7]/80 backdrop-blur-xl border-b border-slate-100">
        <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50">
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </button>
        <div className="text-center">
          <h1 className="text-xs font-black tracking-[0.3em] text-slate-800 uppercase">全體職級考核中心</h1>
          <p className="text-[8px] font-bold text-slate-400 tracking-wider uppercase mt-1">Tier Evaluation Center</p>
        </div>
        <div className="w-10"></div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-32 space-y-8">
        
        {/* Banner with One-click Run */}
        <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="space-y-2 relative z-10 text-center md:text-left">
            <div className="flex items-center gap-2 bg-indigo-500/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-indigo-500/20 w-fit mx-auto md:mx-0">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span className="text-[9px] font-black tracking-widest uppercase">總部最高指揮系統</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">全自動職級晉升考核</h2>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed font-medium">
              系統將掃描全體客戶之累積有效消費額，並對應專屬晉級門檻進行無痛自動晉升。
            </p>
          </div>
          <button 
            onClick={handleEvaluateAll}
            disabled={isEvaluating}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white px-8 py-6 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/30 transition flex items-center gap-3 active:scale-95 flex-shrink-0 relative z-10"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                正在進行全體考核...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
                一鍵執行全體階級考核
              </>
            )}
          </button>
        </div>

        {/* Dynamic Zone Selectors (Tabs) */}
        <div className="grid grid-cols-3 gap-4 bg-white p-2.5 rounded-[2.5rem] border border-slate-100 shadow-sm">
          {ZONES.map(zone => {
            const isActive = activeZone === zone.id;
            return (
              <button
                key={zone.id}
                onClick={() => {
                  setActiveZone(zone.id);
                  setExpandedRank(null);
                  setMembers([]);
                }}
                className={`py-5 px-4 rounded-[2rem] text-center transition duration-500 relative flex flex-col items-center gap-1.5 ${
                  isActive 
                    ? "bg-slate-900 text-white shadow-xl" 
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <span className="text-xs font-black tracking-widest">{zone.name}</span>
                <span className={`text-[8px] font-bold uppercase tracking-wider ${isActive ? "text-slate-400" : "text-slate-300"}`}>
                  {zone.id === "members" ? "Member" : zone.id === "partners" ? "Partner" : "Ambassador"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Zone Description Card */}
        <div className={`rounded-[2.5rem] p-6 border ${currentZoneObj.bgLight} ${currentZoneObj.borderLight} flex items-center gap-4`}>
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <Award className={`w-5 h-5 ${activeZone === 'members' ? 'text-blue-500' : activeZone === 'partners' ? 'text-emerald-500' : 'text-amber-500'}`} />
          </div>
          <div>
            <h3 className={`text-xs font-black tracking-widest ${currentZoneObj.textDark}`}>{currentZoneObj.name}管轄範圍</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{currentZoneObj.desc}</p>
          </div>
        </div>

        {/* Ranks Accordion (根目錄是個職級) */}
        <div className="space-y-4">
          {currentZoneObj.ranks.map((rank, index) => {
            const isExpanded = expandedRank === rank.name;
            const currentRankCount = rankCounts[rank.name] || 0;

            return (
              <div 
                key={rank.name}
                className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm overflow-hidden transition-all duration-300"
              >
                {/* Header (根目錄) */}
                <div 
                  onClick={() => handleToggleRank(rank.name)}
                  className={`p-6 flex justify-between items-center cursor-pointer select-none transition-colors duration-300 ${
                    isExpanded ? "bg-slate-50/50" : "hover:bg-slate-50/30"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      activeZone === 'members' ? 'bg-blue-50 text-blue-600' : activeZone === 'partners' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                        {rank.name}
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black ${
                          activeZone === 'members' ? 'bg-blue-100/50 text-blue-600' : activeZone === 'partners' ? 'bg-emerald-100/50 text-emerald-600' : 'bg-amber-100/50 text-amber-600'
                        }`}>
                          {currentRankCount} 人
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5 flex items-center gap-1.5">
                        <span>門檻：{rank.criteria}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest block">考核金額</span>
                      <span className="text-xs font-black text-slate-700 tracking-tight">{rank.target}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Content (目錄下名冊) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="border-t border-slate-50/80 bg-slate-50/20 overflow-hidden"
                    >
                      <div className="p-6 space-y-6">
                        
                        {/* Inline Search Bar */}
                        <div className="relative">
                          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input 
                            type="text" 
                            placeholder={`搜尋目前 ${rank.name} 的會員姓名或手機...`}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-white border-none rounded-2xl py-4.5 pl-12 pr-6 text-xs font-black text-slate-800 shadow-sm focus:ring-2 focus:ring-slate-200 outline-none placeholder-slate-300"
                          />
                        </div>

                        {/* Loading Spinner */}
                        {loadingMembers ? (
                          <div className="py-20 text-center flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">正在加載目錄明細...</p>
                          </div>
                        ) : filteredMembers.length === 0 ? (
                          <div className="py-16 text-center bg-white rounded-3xl border border-slate-100 shadow-inner flex flex-col items-center justify-center gap-3">
                            <Users className="w-10 h-10 text-slate-200" />
                            <p className="text-xs font-bold text-slate-400">
                              {searchTerm ? "找不到符合條件的會員" : `目前尚無會員符合 ${rank.name} 職級`}
                            </p>
                          </div>
                        ) : (
                          /* Members Grid / List */
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredMembers.map(member => (
                              <div 
                                key={member.id}
                                className="bg-white border border-slate-50/50 p-6 rounded-3xl shadow-sm flex flex-col justify-between gap-4 hover:border-slate-100 transition duration-300 group"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="space-y-1">
                                    <h5 className="text-sm font-black text-slate-800">{member.name}</h5>
                                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                      <Phone className="w-3 h-3" /> {member.phone || "無電話"}
                                    </p>
                                  </div>
                                  <div className="bg-slate-50 px-2.5 py-1 rounded-full text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 group-hover:bg-slate-900 group-hover:text-white transition duration-300">
                                    <Calendar className="w-2.5 h-2.5" /> 
                                    {new Date(member.created_at).toLocaleDateString()}
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-50">
                                  <div className="space-y-0.5">
                                    <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">累積消費額</span>
                                    <span className="text-[11px] font-black text-slate-800 tracking-tight flex items-center gap-0.5">
                                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                      ${Number(member.lifetime_spend || 0).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">預收貨款</span>
                                    <span className="text-[11px] font-black text-slate-800 tracking-tight flex items-center gap-0.5">
                                      <Wallet className="w-3.5 h-3.5 text-indigo-500" />
                                      ${Number(member.virtual_balance || 0).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">點數餘額</span>
                                    <span className="text-[11px] font-black text-slate-800 tracking-tight flex items-center gap-0.5">
                                      <Heart className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                      {Number(member.points_balance || 0).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
}

export default function EvaluationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-slate-400">Initializing Tier Command...</div>}>
      <EvaluationContent />
    </Suspense>
  );
}
