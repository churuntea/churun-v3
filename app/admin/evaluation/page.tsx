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
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  Wallet, 
  Calendar, 
  Search, 
  Zap, 
  Award, 
  Heart,
  Phone,
  Plus,
  Copy,
  Check,
  FileText,
  X,
  AlertTriangle,
  Eye
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
  status?: string;
  initial_deposit?: number;
  bank_account?: string;
  beneficiary?: string;
  id_card_number?: string;
  bank_code?: string;
  address?: string;
  is_b2b?: boolean;
}

const ZONES = [
  {
    id: "members",
    name: "初潤會員專區",
    desc: "全體會員階層（包含一般會員、合夥人與品牌大使）",
    color: "from-blue-600 to-indigo-600",
    bgLight: "bg-blue-50/50",
    borderLight: "border-blue-100",
    textDark: "text-blue-900",
    ranks: [
      { name: "初潤寶寶", criteria: "完成註冊登入即可加入", target: "$0" },
      { name: "初潤幼兒園", criteria: "只要進行任意一次消費即可晉升", target: "消費 $1 起" },
      { name: "初潤小朋友", criteria: "累積消費金額達 $1,500 元", target: "$1,500" },
      { name: "初潤青少年", criteria: "累積消費金額達 $3,000 元", target: "$3,000" },
      { name: "初潤好朋友", criteria: "累積消費金額達 $98,000 元", target: "$98,000" },
      { name: "初潤閨蜜", criteria: "累積消費金額達 $12,000 元", target: "$12,000" },
      { name: "初潤知己", criteria: "累積消費金額達 $198,000 元", target: "$198,000" },
      { name: "初潤靈魂伴侶", criteria: "累積消費金額達 $500,000 元", target: "$500,000" }
    ]
  },
  {
    id: "partners",
    name: "合夥人專區",
    desc: "B2B 個人商業合夥夥伴階層（最低預收金額 $98,000 元）",
    color: "from-emerald-600 to-teal-600",
    bgLight: "bg-emerald-50/50",
    borderLight: "border-emerald-100",
    textDark: "text-emerald-900",
    ranks: [
      { name: "初潤好朋友", criteria: "累積消費金額達 $98,000 元", target: "$98,000" },
      { name: "初潤閨蜜", criteria: "累積消費金額達 $12,000 元", target: "$12,000" }
    ]
  },
  {
    id: "ambassadors",
    name: "品牌大使專區",
    desc: "B2B 頂級品牌核心經營階層（最低預收金額 $198,000 元）",
    color: "from-amber-500 to-orange-600",
    bgLight: "bg-amber-50/50",
    borderLight: "border-amber-100",
    textDark: "text-amber-900",
    ranks: [
      { name: "初潤知己", criteria: "累積消費金額達 $198,000 元", target: "$198,000" },
      { name: "初潤靈魂伴侶", criteria: "累積消費金額達 $500,000 元", target: "$500,000" }
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

  // Invite states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteType, setInviteType] = useState<"partner" | "ambassador">("partner");
  const [copied, setCopied] = useState(false);

  // Audits states
  const [pendingAccountingList, setPendingAccountingList] = useState<Member[]>([]);
  const [pendingManagerList, setPendingManagerList] = useState<Member[]>([]);
  const [pendingExitList, setPendingExitList] = useState<Member[]>([]);
  const [exitSimulations, setExitSimulations] = useState<Record<string, any>>({});
  const [loadingAudits, setLoadingAudits] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);

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

  useEffect(() => {
    if (activeZone === "audits" || activeZone === "exits") {
      fetchAudits();
    }
  }, [activeZone]);

  const fetchGlobalStats = async () => {
    try {
      const { data: mData, error } = await supabase
        .from("members")
        .select("tier")
        .eq("status", "active");
        
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

  const fetchAudits = async () => {
    setLoadingAudits(true);
    try {
      // 1. Fetch pending accounting applicants
      const { data: accountingData } = await supabase
        .from("members")
        .select("*")
        .eq("is_b2b", true)
        .eq("status", "pending_accounting")
        .order("created_at", { ascending: false });

      if (accountingData) {
        setPendingAccountingList(accountingData as Member[]);
      }

      // 2. Fetch pending manager applicants
      const { data: managerData } = await supabase
        .from("members")
        .select("*")
        .eq("is_b2b", true)
        .eq("status", "pending_manager")
        .order("created_at", { ascending: false });

      if (managerData) {
        setPendingManagerList(managerData as Member[]);
      }

      // 3. Fetch pending exit members
      const { data: exitData } = await supabase
        .from("members")
        .select("*")
        .eq("status", "exit_pending")
        .order("created_at", { ascending: false });

      if (exitData) {
        setPendingExitList(exitData as Member[]);
        
        // Fetch simulation calculations in parallel
        const simulatedMap: Record<string, any> = {};
        await Promise.all(exitData.map(async (candidate) => {
          try {
            const res = await fetch('/api/b2b/exit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ member_id: candidate.id, action: 'simulate' })
            });
            const result = await res.json();
            if (result.success) {
              simulatedMap[candidate.id] = result.details;
            }
          } catch (e) {
            console.error("Simulation error for member " + candidate.id, e);
          }
        }));
        setExitSimulations(simulatedMap);
      }
    } catch (err) {
      console.error("Error fetching B2B audits:", err);
    } finally {
      setLoadingAudits(false);
    }
  };

  const handleExitApprove = async (memberId: string) => {
    if (!confirm("⚠️ 確定要核准此 B2B 夥伴的「無憂退出申請」嗎？\n系統將自動扣除所有預收款餘額、標記為已退出並終止其 B2B 權益，此操作不可逆！")) return;

    try {
      const res = await fetch("/api/b2b/exit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: memberId, action: "approve" })
      });
      const result = await res.json();
      if (result.success) {
        alert(`✅ 退出核准成功！\n${result.message || "已成功終止該夥伴之 B2B 資格並完成退款結算。"}`);
        fetchAudits();
        fetchGlobalStats();
      } else {
        alert(`❌ 執行失敗: ${result.error || "伺服器無回應"}`);
      }
    } catch (err: any) {
      alert(`⚠️ 操作失敗: ${err.message}`);
    }
  };

  const handleExitReject = async (memberId: string) => {
    if (!confirm("確定要「駁回」此 B2B 夥伴的退出申請，並將其狀態恢復為活躍 B2B 資格嗎？")) return;

    try {
      const { error } = await supabase
        .from("members")
        .update({ status: "active" })
        .eq("id", memberId);

      if (error) throw error;
      alert("✅ 已駁回此退出申請，該夥伴狀態已恢復為活躍 B2B。");
      fetchAudits();
    } catch (err: any) {
      alert(`⚠️ 操作失敗: ${err.message}`);
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
        .eq("status", "active")
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

  // Accountant Audit Action
  const handleAccountantAudit = async (memberId: string, approve: boolean) => {
    if (!confirm(approve ? "確定要「核准金額無誤」並送交業務主管進行最後審查嗎？" : "確定要「駁回」此申請案嗎？")) return;

    try {
      if (approve) {
        const { error } = await supabase
          .from("members")
          .update({ status: "pending_manager" })
          .eq("id", memberId);

        if (error) throw error;
        alert("✅ 金額核對成功！已將此案件送交「業務主管」做最後審查。");
      } else {
        const { error } = await supabase
          .from("members")
          .update({ status: "rejected" })
          .eq("id", memberId);

        if (error) throw error;
        alert("❌ 已駁回此 B2B 加入申請案。");
      }
      fetchAudits();
    } catch (err: any) {
      alert(`⚠️ 操作失敗: ${err.message}`);
    }
  };

  // Manager Audit Action (Final approval)
  const handleManagerAudit = async (member: Member, approve: boolean) => {
    if (!confirm(approve ? `確定要「最終核准開通」此 B2B 帳號嗎？\n系統將自動設定職級為【${member.tier}】並儲值首筆預收款 $${Number(member.initial_deposit || 0).toLocaleString()} 元！` : "確定要「駁回」此申請案嗎？")) return;

    try {
      if (approve) {
        // 1. Update member record to active, set initial virtual wallet balance equal to initial deposit
        const { error: memberErr } = await supabase
          .from("members")
          .update({ 
            status: "active",
            virtual_balance: member.initial_deposit || 0,
            initial_deposit: member.initial_deposit || 0
          })
          .eq("id", member.id);

        if (memberErr) throw memberErr;

        // 2. Insert initial wallet transaction record
        const { error: txErr } = await supabase
          .from("wallet_transactions")
          .insert({
            member_id: member.id,
            amount: member.initial_deposit || 0,
            transaction_type: "deposit",
            status: "completed"
          });

        if (txErr) console.warn("Failed to create wallet transaction history record:", txErr);

        alert(`👑 審核開通成功！\n創業夥伴【${member.name}】已正式加入，首筆預收款已自動匯入。`);
      } else {
        const { error } = await supabase
          .from("members")
          .update({ status: "rejected" })
          .eq("id", member.id);

        if (error) throw error;
        alert("❌ 已駁回此 B2B 主管審查案件。");
      }
      fetchAudits();
      fetchGlobalStats();
    } catch (err: any) {
      alert(`⚠️ 操作失敗: ${err.message}`);
    }
  };

  const copyInviteLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://churun-v3.vercel.app";
    const link = `${origin}/register/apply?type=${inviteType}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // B2B applicant parsing utility
  const parseB2BMetadata = (member: Member) => {
    const beneficiaryStr = member.beneficiary || "";
    if (beneficiaryStr.startsWith("B2B_JSON_V1|")) {
      try {
        const jsonStr = beneficiaryStr.substring("B2B_JSON_V1|".length);
        return JSON.parse(jsonStr);
      } catch (e) {
        console.error("Failed to parse JSON payload", e);
      }
    } else if (beneficiaryStr.startsWith("B2B_APPLY|")) {
      const parts = beneficiaryStr.split('|');
      return {
        isB2BApply: true,
        lastFive: parts[1],
        remittancePhoto: parts[2],
        type: member.tier === "初潤知己" ? "ambassador" : "partner",
      };
    }
    return {
      isB2BApply: false,
      lastFive: member.bank_account || "",
      remittancePhoto: null,
    };
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (m.phone && m.phone.includes(searchTerm))
  );

  if (!isAdmin) return null;

  const isAuditTab = activeZone === "audits";
  const isExitTab = activeZone === "exits";
  const currentZoneObj = (!isAuditTab && !isExitTab) ? ZONES.find(z => z.id === activeZone)! : null;

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

        {/* Dynamic Zone Selectors (Tabs with 5 column grid for audits) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-white p-2.5 rounded-[2.5rem] border border-slate-100 shadow-sm">
          {[
            ...ZONES.map(z => ({ id: z.id, name: z.name, sub: z.id === "members" ? "Member" : z.id === "partners" ? "Partner" : "Ambassador" })),
            { id: "audits", name: "創業申請審核", sub: "B2B Onboarding" },
            { id: "exits", name: "無憂退出審核", sub: "B2B Offboarding" }
          ].map(tab => {
            const isActive = activeZone === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveZone(tab.id);
                  setExpandedRank(null);
                  setExpandedAuditId(null);
                  setMembers([]);
                }}
                className={`py-4 px-3 rounded-[2rem] text-center transition duration-500 relative flex flex-col items-center justify-center gap-1.5 ${
                  isActive 
                    ? "bg-slate-900 text-white shadow-xl" 
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <span className="text-[11px] font-black tracking-widest">{tab.name}</span>
                <span className={`text-[8px] font-bold uppercase tracking-wider ${isActive ? "text-slate-400" : "text-slate-300"}`}>
                  {tab.sub}
                </span>
              </button>
            );
          })}
        </div>

        {/* Audit Pipeline view vs Directory views */}
        {activeZone === "audits" ? (
          /* B2B AUDIT PIPELINE TAB CONTENT */
          <div className="space-y-8 animate-fadeIn">
            
            {/* Header info */}
            <div className="rounded-[2.5rem] p-6 border bg-amber-50/50 border-amber-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <FileText className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-widest text-amber-900">B2B 夥伴雙重審核管道</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">匯款金額由「會計」查實，通過後流向「業務主管」做最終加入開通。</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* STAGE 1: ACCOUNTING AUDIT */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-xs font-black tracking-widest text-slate-400 uppercase flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
                    第一階段：會計審核金額 ({pendingAccountingList.length})
                  </h4>
                </div>

                {loadingAudits ? (
                  <div className="py-12 bg-white rounded-[2.5rem] border border-slate-100 flex justify-center items-center">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                  </div>
                ) : pendingAccountingList.length === 0 ? (
                  <div className="py-16 bg-white rounded-[2.5rem] border border-slate-50 shadow-sm text-center flex flex-col items-center justify-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">目前無待核對款項</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingAccountingList.map(app => {
                      const b2bData = parseB2BMetadata(app);
                      const isB2BAmbassador = b2bData.type === "ambassador" || app.tier === "初潤知己";
                      const hasB2BDetails = b2bData.isB2BApply || !!b2bData.idCardNumber || b2bData.type === "partner" || app.tier === "初潤好朋友";

                      return (
                        <div key={app.id} className="bg-white rounded-[2rem] p-6 border border-slate-50 shadow-sm space-y-4">
                          <div 
                            onClick={() => setExpandedAuditId(expandedAuditId === app.id ? null : app.id)}
                            className="flex justify-between items-start cursor-pointer group select-none"
                          >
                            <div>
                              <h5 className="text-sm font-black text-slate-800 flex items-center gap-2">
                                {app.name}
                                <span className="text-[9px] text-slate-400 font-bold bg-slate-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 group-hover:bg-slate-100 transition">
                                  <Calendar className="w-3 h-3" /> {new Date(app.created_at).toLocaleDateString()}
                                </span>
                              </h5>
                              <p className="text-[10px] text-slate-400 font-bold mt-1">手機：{app.phone}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-[8px] font-black tracking-widest uppercase ${isB2BAmbassador ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600'}`}>
                                申請 {app.tier === "初潤知己" ? "品牌大使" : app.tier === "初潤好朋友" ? "合夥人" : app.tier}
                              </span>
                              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-100 transition">
                                {expandedAuditId === app.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </div>
                          </div>

                          <AnimatePresence>
                            {expandedAuditId === app.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-4 space-y-4 border-t border-slate-50 mt-4">
                                  <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-2 gap-4">
                                    <div>
                                      <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">匯款金額</span>
                                      <span className="text-xs font-black text-slate-700">${Number(app.initial_deposit || 0).toLocaleString()} 元</span>
                                    </div>
                                    <div>
                                      <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">帳號後五碼</span>
                                      <span className="text-xs font-black text-slate-700 tracking-wider">【 {b2bData.lastFive || app.bank_account || "無"} 】</span>
                                    </div>
                                  </div>

                                  {/* B2B Compliant Fields Display */}
                                  {hasB2BDetails && (
                                    <div className="space-y-3 bg-amber-50/20 rounded-2xl p-4 border border-amber-100/50 text-[10px] font-bold text-slate-500">
                                      <p className="text-[8px] font-black tracking-wider uppercase text-amber-600 flex items-center gap-1">
                                        <span>🛡️ {b2bData.type === "ambassador" || app.tier === "初潤知己" ? "品牌大使" : "合夥人"}專規檢實資料</span>
                                      </p>
                                      
                                      <div className="grid grid-cols-2 gap-2 pt-1">
                                        <div>
                                          <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">身分證字號</span>
                                          <span className="text-xs font-bold text-slate-700">{b2bData.idCardNumber || app.id_card_number || "未提供"}</span>
                                        </div>
                                        <div>
                                          <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">身分證影像</span>
                                          {b2bData.idCardPhoto ? (
                                            <button 
                                              onClick={() => setViewingReceipt(b2bData.idCardPhoto)}
                                              className="text-[9px] text-amber-600 font-black hover:underline flex items-center gap-1 mt-0.5"
                                            >
                                              <Eye className="w-3.5 h-3.5" /> 檢視身分證
                                            </button>
                                          ) : (
                                            <span className="text-rose-500 text-[9px] block mt-0.5">未上傳影像</span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="space-y-1 pt-1">
                                        <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">戶籍地址</span>
                                        <span className="text-[11px] font-bold text-slate-700 leading-tight block">{b2bData.householdAddress || "未提供"}</span>
                                      </div>

                                      <div className="space-y-1">
                                        <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">通訊收件地址</span>
                                        <span className="text-[11px] font-bold text-slate-700 leading-tight block">{app.address || "未提供"}</span>
                                      </div>

                                      <div className="border-t border-slate-100 my-2"></div>

                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">銀行代碼 / 分行</span>
                                          <span className="text-[11px] font-bold text-slate-700">{b2bData.bankCode || app.bank_code || "未提供"} {b2bData.bankBranch || ""}</span>
                                        </div>
                                        <div>
                                          <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">存摺影像</span>
                                          {b2bData.passbookPhoto ? (
                                            <button 
                                              onClick={() => setViewingReceipt(b2bData.passbookPhoto)}
                                              className="text-[9px] text-amber-600 font-black hover:underline flex items-center gap-1 mt-0.5"
                                            >
                                              <Eye className="w-3.5 h-3.5" /> 檢視存摺卡
                                            </button>
                                          ) : (
                                            <span className="text-rose-500 text-[9px] block mt-0.5">未上傳影像</span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="space-y-1 pt-1">
                                        <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">收退款銀行帳號</span>
                                        <span className="text-xs font-bold text-slate-700 tracking-widest block">{b2bData.bankAccount || app.bank_account || "未提供"}</span>
                                      </div>
                                    </div>
                                  )}

                                  {b2bData.remittancePhoto && (
                                    <button 
                                      onClick={() => setViewingReceipt(b2bData.remittancePhoto)}
                                      className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-center gap-2 transition"
                                    >
                                      <Eye className="w-3.5 h-3.5" /> 檢視匯款水單/憑證
                                    </button>
                                  )}

                                  <div className="grid grid-cols-2 gap-3 pt-2">
                                    <button 
                                      onClick={() => handleAccountantAudit(app.id, false)}
                                      className="py-3 bg-rose-50 hover:bg-rose-100 text-rose-500 font-black text-[9px] uppercase tracking-widest rounded-xl transition"
                                    >
                                      ❌ 駁回申請
                                    </button>
                                    <button 
                                      onClick={() => handleAccountantAudit(app.id, true)}
                                      className="py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-[9px] uppercase tracking-widest rounded-xl shadow-lg shadow-blue-600/20 transition"
                                    >
                                      ✅ 金額無誤
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* STAGE 2: EXECUTIVE MANAGER AUDIT */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-xs font-black tracking-widest text-slate-400 uppercase flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    第二階段：業務主管審核 ({pendingManagerList.length})
                  </h4>
                </div>

                {loadingAudits ? (
                  <div className="py-12 bg-white rounded-[2.5rem] border border-slate-100 flex justify-center items-center">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                  </div>
                ) : pendingManagerList.length === 0 ? (
                  <div className="py-16 bg-white rounded-[2.5rem] border border-slate-50 shadow-sm text-center flex flex-col items-center justify-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-slate-200" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">目前無待最終審核件</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingManagerList.map(app => {
                      const b2bData = parseB2BMetadata(app);
                      const isB2BAmbassador = b2bData.type === "ambassador" || app.tier === "初潤知己";
                      const hasB2BDetails = b2bData.isB2BApply || !!b2bData.idCardNumber || b2bData.type === "partner" || app.tier === "初潤好朋友";

                      return (
                        <div key={app.id} className="bg-white rounded-[2rem] p-6 border border-slate-50 shadow-sm space-y-4">
                          <div 
                            onClick={() => setExpandedAuditId(expandedAuditId === app.id ? null : app.id)}
                            className="flex justify-between items-start cursor-pointer group select-none"
                          >
                            <div>
                              <h5 className="text-sm font-black text-slate-800 flex items-center gap-2">
                                {app.name}
                                <span className="text-[9px] text-slate-400 font-bold bg-slate-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 group-hover:bg-slate-100 transition">
                                  <Calendar className="w-3 h-3" /> {new Date(app.created_at).toLocaleDateString()}
                                </span>
                              </h5>
                              <p className="text-[10px] text-slate-400 font-bold mt-1">手機：{app.phone}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-[8px] font-black tracking-widest uppercase ${isB2BAmbassador ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600'}`}>
                                申請 {app.tier === "初潤知己" ? "品牌大使" : app.tier === "初潤好朋友" ? "合夥人" : app.tier}
                              </span>
                              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-100 transition">
                                {expandedAuditId === app.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </div>
                          </div>

                          <AnimatePresence>
                            {expandedAuditId === app.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-4 space-y-4 border-t border-slate-50 mt-4">
                                  <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-2 gap-4">
                                    <div>
                                      <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">已稽核金額</span>
                                      <span className="text-xs font-black text-emerald-600">${Number(app.initial_deposit || 0).toLocaleString()} 元</span>
                                    </div>
                                    <div>
                                      <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">匯款狀態</span>
                                      <span className="text-xs font-black text-blue-600 flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> 會計已確認
                                      </span>
                                    </div>
                                  </div>

                                  {/* B2B Compliant Fields Display */}
                                  {hasB2BDetails && (
                                    <div className="space-y-3 bg-amber-50/20 rounded-2xl p-4 border border-amber-100/50 text-[10px] font-bold text-slate-500">
                                      <p className="text-[8px] font-black tracking-wider uppercase text-amber-600 flex items-center gap-1">
                                        <span>🛡️ {b2bData.type === "ambassador" || app.tier === "初潤知己" ? "品牌大使" : "合夥人"}專規檢實資料</span>
                                      </p>
                                      
                                      <div className="grid grid-cols-2 gap-2 pt-1">
                                        <div>
                                          <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">身分證字號</span>
                                          <span className="text-xs font-bold text-slate-700">{b2bData.idCardNumber || app.id_card_number || "未提供"}</span>
                                        </div>
                                        <div>
                                          <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">身分證影像</span>
                                          {b2bData.idCardPhoto ? (
                                            <button 
                                              onClick={() => setViewingReceipt(b2bData.idCardPhoto)}
                                              className="text-[9px] text-amber-600 font-black hover:underline flex items-center gap-1 mt-0.5"
                                            >
                                              <Eye className="w-3.5 h-3.5" /> 檢視身分證
                                            </button>
                                          ) : (
                                            <span className="text-rose-500 text-[9px] block mt-0.5">未上傳影像</span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="space-y-1 pt-1">
                                        <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">戶籍地址</span>
                                        <span className="text-[11px] font-bold text-slate-700 leading-tight block">{b2bData.householdAddress || "未提供"}</span>
                                      </div>

                                      <div className="space-y-1">
                                        <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">通訊收件地址</span>
                                        <span className="text-[11px] font-bold text-slate-700 leading-tight block">{app.address || "未提供"}</span>
                                      </div>

                                      <div className="border-t border-slate-100 my-2"></div>

                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">銀行代碼 / 分行</span>
                                          <span className="text-[11px] font-bold text-slate-700">{b2bData.bankCode || app.bank_code || "未提供"} {b2bData.bankBranch || ""}</span>
                                        </div>
                                        <div>
                                          <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">存摺影像</span>
                                          {b2bData.passbookPhoto ? (
                                            <button 
                                              onClick={() => setViewingReceipt(b2bData.passbookPhoto)}
                                              className="text-[9px] text-amber-600 font-black hover:underline flex items-center gap-1 mt-0.5"
                                            >
                                              <Eye className="w-3.5 h-3.5" /> 檢視存摺卡
                                            </button>
                                          ) : (
                                            <span className="text-rose-500 text-[9px] block mt-0.5">未上傳影像</span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="space-y-1 pt-1">
                                        <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">收退款銀行帳號</span>
                                        <span className="text-xs font-bold text-slate-700 tracking-widest block">{b2bData.bankAccount || app.bank_account || "未提供"}</span>
                                      </div>
                                    </div>
                                  )}

                                  {b2bData.remittancePhoto && (
                                    <button 
                                      onClick={() => setViewingReceipt(b2bData.remittancePhoto)}
                                      className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-center gap-2 transition"
                                    >
                                      <Eye className="w-3.5 h-3.5" /> 檢視匯款水單/憑證
                                    </button>
                                  )}

                                  <div className="grid grid-cols-2 gap-3 pt-2">
                                    <button 
                                      onClick={() => handleManagerAudit(app, false)}
                                      className="py-3 bg-rose-50 hover:bg-rose-100 text-rose-500 font-black text-[9px] uppercase tracking-widest rounded-xl transition"
                                    >
                                      ❌ 駁回申請
                                    </button>
                                    <button 
                                      onClick={() => handleManagerAudit(app, true)}
                                      className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-600/20 transition"
                                    >
                                      👑 最終核准加入
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        ) : activeZone === "exits" ? (
          /* B2B EXITS AUDIT CONTENT */
          <div className="space-y-8 animate-fadeIn">
            
            {/* Header info */}
            <div className="rounded-[2.5rem] p-6 border bg-rose-50/50 border-rose-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-widest text-rose-900">B2B 無憂退出審核中心</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    審查已提出「無憂退出」申請之 B2B 夥伴。系統已自動核算累積返傭與行政成本。
                  </p>
                </div>
              </div>
            </div>

            {loadingAudits ? (
              <div className="py-12 bg-white rounded-[2.5rem] border border-slate-100 flex justify-center items-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
              </div>
            ) : pendingExitList.length === 0 ? (
              <div className="py-16 bg-white rounded-[2.5rem] border border-slate-50 shadow-sm text-center flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-slate-200" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">目前無待審核之退出申請</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingExitList.map(app => {
                  const b2bData = parseB2BMetadata(app);
                  const sim = exitSimulations[app.id];

                  return (
                    <div key={app.id} className="bg-white rounded-[2rem] p-6 border border-slate-50 shadow-sm flex flex-col justify-between space-y-6">
                      
                      <div className="space-y-4">
                        {/* Member Header */}
                        <div 
                          onClick={() => setExpandedAuditId(expandedAuditId === app.id ? null : app.id)}
                          className="flex justify-between items-start cursor-pointer group select-none"
                        >
                          <div>
                            <h5 className="text-sm font-black text-slate-800 flex items-center gap-2">
                              {app.name}
                              <span className="text-[9px] text-slate-400 font-bold bg-slate-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 group-hover:bg-slate-100 transition">
                                <Calendar className="w-3 h-3" /> {new Date(app.created_at).toLocaleDateString()}
                              </span>
                            </h5>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">手機：{app.phone}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-full text-[8px] font-black tracking-widest bg-rose-50 text-rose-600 border border-rose-100 uppercase">
                              申請退出：{app.tier}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-100 transition">
                              {expandedAuditId === app.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedAuditId === app.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-4 space-y-4 border-t border-slate-50 mt-4">
                                {/* Financial Settlement Breakdown */}
                                <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-3 shadow-inner">
                                  <p className="text-[8px] font-black tracking-wider uppercase text-slate-400">財務結算明細</p>
                                  {sim ? (
                                    <div className="space-y-2 text-[11px]">
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">預收款餘額</span>
                                        <span className="font-bold font-mono">${Number(sim.virtualBalance || 0).toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between text-rose-400">
                                        <span className="text-rose-300">需扣回返傭</span>
                                        <span className="font-bold font-mono">-${Number(sim.totalCommissionReceived || 0).toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between text-rose-400">
                                        <span className="text-rose-300">行政設定成本</span>
                                        <span className="font-bold font-mono">-${Number(sim.adminFee || 0).toLocaleString()}</span>
                                      </div>
                                      <div className="border-t border-slate-800 my-1"></div>
                                      <div className="flex justify-between text-emerald-400 font-black">
                                        <span>預計退還總額</span>
                                        <span className="font-mono text-xs">${Number(sim.finalRefundAmount || 0).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      <span>正在讀取結算報告...</span>
                                    </div>
                                  )}
                                </div>

                                {/* Bank Details Card */}
                                <div className="bg-amber-50/20 rounded-2xl p-4 border border-amber-100/50 text-[10px] space-y-2.5">
                                  <p className="text-[8px] font-black tracking-wider uppercase text-amber-600">收款銀行帳戶資訊</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">銀行代碼 & 分行</span>
                                      <span className="text-xs font-bold text-slate-700">國泰世華 (013) {b2bData.bankBranch || "未填"}</span>
                                    </div>
                                    <div>
                                      <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">存摺影像佐證</span>
                                      {b2bData.passbookPhoto ? (
                                        <button 
                                          onClick={() => setViewingReceipt(b2bData.passbookPhoto)}
                                          className="text-[9px] text-amber-600 font-black hover:underline flex items-center gap-1 mt-0.5"
                                        >
                                          <Eye className="w-3.5 h-3.5" /> 放大核對存摺
                                        </button>
                                      ) : (
                                        <span className="text-rose-500 text-[9px] block mt-0.5">未上傳存摺</span>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">實體匯款帳號</span>
                                    <span className="text-xs font-mono font-bold text-slate-700 tracking-widest">{b2bData.bankAccount || app.bank_account || "未填"}</span>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                  <button 
                                    onClick={() => handleExitReject(app.id)}
                                    className="py-3 bg-rose-50 hover:bg-rose-100 text-rose-500 font-black text-[9px] uppercase tracking-widest rounded-xl transition"
                                  >
                                    ❌ 駁回申請
                                  </button>
                                  <button 
                                    onClick={() => handleExitApprove(app.id)}
                                    className="py-3 bg-slate-950 hover:bg-slate-800 text-white font-black text-[9px] uppercase tracking-widest rounded-xl shadow-lg shadow-slate-950/20 transition flex items-center justify-center gap-1.5"
                                  >
                                    ✅ 核准退出並退款
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* STANDARD DIRECTORIES VIEWS */
          <div className="space-y-8 animate-fadeIn">
            {/* Zone Description Card */}
            <div className={`rounded-[2.5rem] p-6 border ${currentZoneObj!.bgLight} ${currentZoneObj!.borderLight} flex flex-col md:flex-row justify-between items-start md:items-center gap-6`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Award className={`w-5 h-5 ${activeZone === 'members' ? 'text-blue-500' : activeZone === 'partners' ? 'text-emerald-500' : 'text-amber-500'}`} />
                </div>
                <div>
                  <h3 className={`text-xs font-black tracking-widest ${currentZoneObj!.textDark}`}>{currentZoneObj!.name}管轄範圍</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">{currentZoneObj!.desc}</p>
                </div>
              </div>

              {/* [新增] (Add/Invite) button for B2B zones */}
              {activeZone !== "members" && (
                <button
                  onClick={() => {
                    setInviteType(activeZone === "partners" ? "partner" : "ambassador");
                    setShowInviteModal(true);
                  }}
                  className={`bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 active:scale-95 transition`}
                >
                  <Plus className="w-4 h-4" />
                  新增 B2B 夥伴申請
                </button>
              )}
            </div>

            {/* Ranks Accordion (根目錄是個職級) */}
            <div className="space-y-4">
              {currentZoneObj!.ranks.map((rank, index) => {
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
                                {filteredMembers.map(member => {
                                  const b2bData = parseB2BMetadata(member);
                                  const hasB2BDetails = activeZone !== "members" && (b2bData.isB2BApply || !!b2bData.idCardNumber || member.is_b2b || member.tier === "初潤好朋友" || member.tier === "初潤知己");

                                  return (
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

                                    {/* B2B Compliant Fields Display */}
                                    {hasB2BDetails && (
                                      <div className="space-y-3 bg-amber-50/20 rounded-2xl p-4 border border-amber-100/50 text-[10px] font-bold text-slate-500 mt-2">
                                        <p className="text-[8px] font-black tracking-wider uppercase text-amber-600 flex items-center gap-1">
                                          <span>🛡️ {member.tier}專規檢實資料</span>
                                        </p>
                                        
                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                          <div>
                                            <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">身分證字號</span>
                                            <span className="text-xs font-bold text-slate-700">{b2bData.idCardNumber || member.id_card_number || "未提供"}</span>
                                          </div>
                                          <div>
                                            <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">身分證影像</span>
                                            {b2bData.idCardPhoto ? (
                                              <button 
                                                onClick={() => setViewingReceipt(b2bData.idCardPhoto)}
                                                className="text-[9px] text-amber-600 font-black hover:underline flex items-center gap-1 mt-0.5"
                                              >
                                                <Eye className="w-3.5 h-3.5" /> 檢視身分證
                                              </button>
                                            ) : (
                                              <span className="text-rose-500 text-[9px] block mt-0.5">未上傳影像</span>
                                            )}
                                          </div>
                                        </div>

                                        <div className="space-y-1 pt-1">
                                          <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">戶籍地址</span>
                                          <span className="text-[11px] font-bold text-slate-700 leading-tight block">{b2bData.householdAddress || "未提供"}</span>
                                        </div>

                                        <div className="space-y-1">
                                          <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">通訊收件地址</span>
                                          <span className="text-[11px] font-bold text-slate-700 leading-tight block">{member.address || "未提供"}</span>
                                        </div>

                                        <div className="border-t border-slate-100 my-2"></div>

                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">銀行代碼 / 分行</span>
                                            <span className="text-[11px] font-bold text-slate-700">{b2bData.bankCode || member.bank_code || "未提供"} {b2bData.bankBranch || ""}</span>
                                          </div>
                                          <div>
                                            <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">存摺影像</span>
                                            {b2bData.passbookPhoto ? (
                                              <button 
                                                onClick={() => setViewingReceipt(b2bData.passbookPhoto)}
                                                className="text-[9px] text-amber-600 font-black hover:underline flex items-center gap-1 mt-0.5"
                                              >
                                                <Eye className="w-3.5 h-3.5" /> 檢視存摺卡
                                              </button>
                                            ) : (
                                              <span className="text-rose-500 text-[9px] block mt-0.5">未上傳影像</span>
                                            )}
                                          </div>
                                        </div>

                                        <div className="space-y-1 pt-1">
                                          <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">收退款銀行帳號</span>
                                          <span className="text-xs font-bold text-slate-700 tracking-widest block">{b2bData.bankAccount || member.bank_account || "未提供"}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  );
                                })}
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
          </div>
        )}

      </main>

      {/* B2B PARTNER INVITATION LINK DRAWER MODAL */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[3rem] p-8 max-w-md w-full border border-slate-50 shadow-2xl relative space-y-6"
            >
              <button 
                onClick={() => setShowInviteModal(false)}
                className="absolute top-6 right-6 w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center transition"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>

              <div className="text-center space-y-2 pt-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${inviteType === "partner" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-500"}`}>
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-800">
                  新增 {inviteType === "partner" ? "合夥人" : "品牌大使"} 合作邀請
                </h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Invite B2B {inviteType === "partner" ? "Partner" : "Ambassador"}
                </p>
              </div>

              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-[10px] text-slate-400 font-bold leading-relaxed space-y-2">
                <div className="flex gap-2 text-slate-500 font-black">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-500" />
                  <span>使用說明及流程機制</span>
                </div>
                {inviteType === "ambassador" ? (
                  <>
                    <p className="text-amber-600 font-black">⚠️ 品牌大使規格已全面升級為 198,000 元，並強制遵守身分與銀行實體稽核規範：</p>
                    <p>1. 夥伴點開連結需上傳<strong>身分證正面拍照</strong>、<strong>戶籍地址</strong>、<strong>收退款銀行與分行、存摺正面拍照</strong>。</p>
                  </>
                ) : (
                  <>
                    <p className="text-emerald-600 font-black">⚠️ 合夥人規格已升級為 98,000 元，並強制遵守身分與銀行實體稽核規範：</p>
                    <p>1. 夥伴點開連結需上傳<strong>身分證正面拍照</strong>、<strong>戶籍地址</strong>、<strong>收退款銀行與分行、存摺正面拍照</strong>。</p>
                  </>
                )}
                <p>2. 對方完成線上拍照與水單、存摺等證明後送出。</p>
                <p>3. 案件會立即進入您的<strong>「創業申請審核」</strong>管道由會計和業務主管雙重審實，核准後一鍵全自動開通並存入款項！</p>
              </div>

              {/* The Link Box */}
              <div className="space-y-2">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-2">專屬創業加入連結</label>
                <div className="flex bg-slate-50 border border-slate-100 rounded-2xl p-3 items-center justify-between gap-4">
                  <span className="text-[10px] font-black text-slate-600 truncate flex-1 pl-2">
                    {typeof window !== "undefined" ? window.location.origin : "https://churun-v3.vercel.app"}/register/apply?type={inviteType}
                  </span>
                  <button 
                    onClick={copyInviteLink}
                    className="flex-shrink-0 w-10 h-10 bg-white hover:bg-slate-50 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 text-slate-400 hover:text-slate-700 transition"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button 
                onClick={copyInviteLink}
                className="w-full py-4.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" /> 已複製邀請連結！
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" /> 一鍵複製邀請連結
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PHOTO PREVIEW MODAL */}
      <AnimatePresence>
        {viewingReceipt && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[3rem] p-6 max-w-lg w-full border border-slate-50 shadow-2xl relative space-y-4"
            >
              <button 
                onClick={() => setViewingReceipt(null)}
                className="absolute top-6 right-6 w-10 h-10 bg-white hover:bg-slate-100 rounded-full flex items-center justify-center shadow-md border border-slate-50 transition text-slate-400 z-50"
              >
                <X className="w-4 h-4" />
              </button>

              <h4 className="text-xs font-black tracking-widest text-slate-700 uppercase pl-2">佐證影像資料 / 正本放大檢視</h4>
              
              <div className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 max-h-[70vh] flex items-center justify-center relative">
                <img 
                  src={viewingReceipt} 
                  alt="佐證影像" 
                  className="w-full h-auto max-h-[60vh] object-contain rounded-2xl"
                />
              </div>

              <button 
                onClick={() => setViewingReceipt(null)}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg transition"
              >
                關閉檢視
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
