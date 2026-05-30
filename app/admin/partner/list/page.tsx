"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Search, 
  ArrowLeft, 
  Download,
  Loader2,
  Mail,
  Phone,
  Crown,
  Edit2,
  Lock,
  Coins,
  ShieldAlert,
  Sparkles,
  Award,
  Trash2,
  TrendingUp,
  MonitorSmartphone,
  PieChart,
  Star,
  Target,
  AlertTriangle,
  HeartPulse,
  Zap,
  Activity
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip 
} from "recharts";
import { canApplyForAmbassador, autoUpgradeEligibility } from '@/utils/eligibility';

import BrandPartnerCard from '@/components/BrandPartnerCard';


const MEMBER_TIERS_OPTIONS = [
  { val: "一般會員", label: "一般會員 (預設)" },
  { val: "初潤寶寶", label: "初潤寶寶" },
  { val: "初潤幼兒園", label: "初潤幼兒園" },
  { val: "初潤小朋友", label: "初潤小朋友" },
  { val: "初潤青少年", label: "初潤青少年" },
  { val: "初潤好朋友", label: "初潤好朋友 (合夥職級)" },
  { val: "初潤閨蜜", label: "初潤閨蜜 (合夥職級)" },
  { val: "初潤知己", label: "初潤知己 (合夥人職級)" },
  { val: "初潤靈魂伴侶", label: "初潤靈魂伴侶 (合夥人職級)" },
  { val: "invited_team", label: "初潤特邀團 (invited_team)" },
  { val: "partner", label: "創業夥伴合夥人 (partner)" },
  { val: "超級小幫手", label: "超級小幫手 (合夥人福利)" },
  { val: "ambassador", label: "品牌推廣大使 (ambassador)" }
];

function AdminAmbassadorListContent() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>("all");

  // Modal States
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [selectedPartnerMember, setselectedPartnerMember] = useState<any | null>(null);
  const [showDownlineModal, setShowDownlineModal] = useState(false);
  const [downlineMember, setDownlineMember] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    member_code: "",
    tier: "一般會員",
    is_b2b: false,
    balanceAdjustment: "",
    pointsAdjustment: "",
    adjustmentReason: "",
    status: "active"
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [adminUser, setAdminUser] = useState<any>(null);

  // Dashboard Modal
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'ledger'>('overview');

  // Top Products Leaderboard
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [isTopProductsLoading, setIsTopProductsLoading] = useState(true);
  const [topProductsDateRange, setTopProductsDateRange] = useState("all");

  // Insights
  const [insights, setInsights] = useState<{risingStars: any[], atRisk: any[]}>({ risingStars: [], atRisk: [] });
  const [isInsightsLoading, setIsInsightsLoading] = useState(true);

  // Table Sorting
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Referrer State Variables
  const [selectedUplineId, setSelectedUplineId] = useState<string | null>(null);
  const [uplineSearch, setUplineSearch] = useState("");
  const [uplineSearchResult, setUplineSearchResult] = useState<any | null>(null);
  const [isSearchingUpline, setIsSearchingUpline] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem("churun_admin_auth");
    if (auth !== "true") {
      router.replace("/admin");
      return;
    }
    const userStr = sessionStorage.getItem("churun_admin_user");
    if (userStr) {
      try {
        setAdminUser(JSON.parse(userStr));
      } catch (e) {
        console.error(e);
      }
    }
    setIsAdmin(true);
    fetchMembers();
    fetchTopProducts("all");
    fetchInsights();
  }, [router]);

  const fetchInsights = async () => {
    try {
      const res = await fetch("/api/admin/partner-raw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fetch_insights", payload: {} })
      });
      const result = await res.json();
      if (result.success) {
        setInsights({ risingStars: result.risingStars || [], atRisk: result.atRisk || [] });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsInsightsLoading(false);
    }
  };

  const fetchTopProducts = async (dateRange: string) => {
    setIsTopProductsLoading(true);
    try {
      const res = await fetch("/api/admin/partner-raw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fetch_top_products", payload: { dateRange } })
      });
      const result = await res.json();
      if (result.success) setTopProducts(result.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTopProductsLoading(false);
    }
  };

  const handleOpenDashboard = async (member: any) => {
    setSelectedMember(member);
    setDashboardTab('overview');
    setShowDashboardModal(true);
    setIsDashboardLoading(true);
    try {
      const res = await fetch("/api/admin/partner-raw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "open_member_detail", payload: { memberId: member.id } })
      });
      const result = await res.json();
      if (result.success) {
        const chartData = [];
        if (result.transactions && result.transactions.length > 0) {
          const monthlyMap: Record<string, number> = {};
          result.transactions.forEach((t: any) => {
            const date = new Date(t.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!monthlyMap[monthKey]) monthlyMap[monthKey] = 0;
            monthlyMap[monthKey] += Number(t.amount);
          });
          Object.keys(monthlyMap).sort().forEach(key => {
            chartData.push({ name: key, amount: monthlyMap[key] });
          });
        } else {
           const today = new Date();
           for(let i=5; i>=0; i--) {
              const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
              chartData.push({ name: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, amount: 0 });
           }
        }
        setDashboardData({ ...result, chartData });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDashboardLoading(false);
    }
  };

  // Real-time lookup for debounced referrer search text
  useEffect(() => {
    if (!showEditModal || !selectedMember) return;
    const term = uplineSearch.trim().toUpperCase();
    if (!term) {
      // If search is empty, revert search result back to selectedUplineId details if they match
      if (selectedUplineId === (selectedMember.upline?.id || null)) {
        setUplineSearchResult(selectedMember.upline || null);
      } else {
        // Query current selectedUplineId if it changed
        if (selectedUplineId) {
          const fetchCurrentUpline = async () => {
            const { data } = await supabase
              .from("members")
              .select("id, name, member_code, phone")
              .eq("id", selectedUplineId)
              .maybeSingle();
            if (data) setUplineSearchResult(data);
          };
          fetchCurrentUpline();
        } else {
          setUplineSearchResult(null);
        }
      }
      return;
    }

    if (term === selectedMember.member_code?.toUpperCase() || term === selectedMember.phone) {
      setUplineSearchResult({ error: "self" });
      return;
    }

    const searchRef = async () => {
      setIsSearchingUpline(true);
      const { data, error } = await supabase
        .from("members")
        .select("id, name, member_code, phone")
        .or(`referral_code.eq.${term},member_code.eq.${term},phone.eq.${term}`)
        .maybeSingle();

      if (error) {
        console.error(error);
        setUplineSearchResult(null);
      } else if (data) {
        if (data.id === selectedMember.id) {
          setUplineSearchResult({ error: "self" });
        } else {
          setUplineSearchResult(data);
        }
      } else {
        setUplineSearchResult(null);
      }
      setIsSearchingUpline(false);
    };

    const timer = setTimeout(searchRef, 600);
    return () => clearTimeout(timer);
  }, [uplineSearch, selectedMember, showEditModal, selectedUplineId]);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("members")
        .select("*, upline:upline_id(id, name, member_code, phone), downlines:members!upline_id(id, name, member_code, phone, tier, created_at, team_total_sales, direct_total_sales)")
        .in('tier', ['ambassador', '初潤合夥人', '初潤知己', '初潤靈魂伴侶'])
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCsv = (filename: string, rows: Record<string, any>[]) => {
    if (!rows || rows.length === 0) return;
    const header = Object.keys(rows[0]);
    const csvContent = [
      header.join(','),
      ...rows.map(row => header.map(field => `"${String(row[field] ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    if (filteredMembers.length === 0) return;
    
    const exportData = filteredMembers.map(m => ({
      '註冊日期': new Date(m.created_at).toLocaleString(),
      '會員編號': m.member_code || '',
      '推薦人姓名': m.upline?.name || '無',
      '推薦人代碼': m.upline?.member_code || '無',
      '姓名': m.name,
      '電話': m.phone,
      '信箱': m.email || '',
      '職級': m.tier === 'partner' || m.tier === '初潤好朋友' || m.tier === '初潤閨蜜' || m.tier === '超級小幫手' ? '合夥人' :
             m.tier === 'ambassador' || m.tier === '初潤合夥人' || m.tier === '初潤知己' || m.tier === '初潤靈魂伴侶' ? '合夥人' :
             m.tier === 'invited_team' || m.tier === '初潤特邀團' ? '初潤特邀團' : '一般會員',
      '實際職級': m.tier || '一般會員',
      '可用餘額': m.virtual_balance || 0,
      '可用紅利點數': m.points_balance || 0,
      '直推人數': m.downlines ? m.downlines.length : 0,
      '團隊累積業績': m.team_total_sales || 0,
      '直推累積業績': m.direct_total_sales || 0
    }));

    exportToCsv(`初潤_合夥人名單_${new Date().toISOString().split('T')[0]}.csv`, exportData);
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSaving(true);

    try {
      const payload = {
        memberId: selectedMember.id,
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email,
        member_code: editForm.member_code,
        tier: editForm.tier,
        is_b2b: editForm.is_b2b,
        balanceAdjustment: editForm.balanceAdjustment ? Number(editForm.balanceAdjustment) : 0,
        pointsAdjustment: editForm.pointsAdjustment ? Number(editForm.pointsAdjustment) : 0,
        adjustmentReason: editForm.adjustmentReason,
        uplineId: selectedUplineId,
        status: editForm.status
      };

      // 串接 API 進行後端特權異動與日誌寫入
      const res = await fetch("/api/admin/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        alert("🎉 帳戶異動完全成功！異動記錄與對帳單已寫入雲端數據。");
        fetchMembers();
      } else {
        setErrorMessage(data.error || "儲存變更失敗");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("網路請求錯誤：" + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember || !adminUser) return;
    if (adminUser.title !== '總經理' && adminUser.title !== '超級管理員') {
      alert("🔒 權限不足！只有最高管理員（總經理/超級管理員）有權執行刪除程序。");
      return;
    }

    const firstConfirm = confirm(`🚨 警告：您即將永久刪除會員「${selectedMember.name}」的帳戶！\n此操作會將該會員的錢包餘額、紅利點數、訂單明細、交易紀錄等「所有相關資料」在資料庫中安全永久抹除，且無法回復！\n\n您確定要繼續嗎？`);
    if (!firstConfirm) return;

    const secondConfirm = prompt(`❗ 請輸入會員的姓名「${selectedMember.name}」以確認授權刪除：`);
    if (secondConfirm !== selectedMember.name) {
      alert("❌ 驗證姓名不符，已取消刪除程序。");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    try {
      const res = await fetch(`/api/admin/members?memberId=${selectedMember.id}&adminTitle=${encodeURIComponent(adminUser.title)}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        alert("🎉 會員「" + selectedMember.name + "」所有相關資料已成功從雲端資料庫安全永久抹除！");
        fetchMembers();
      } else {
        setErrorMessage(data.error || "刪除會員失敗");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("網路錯誤：" + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredMembers = members.filter(m => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      m.name?.toLowerCase().includes(term) ||
      m.phone?.includes(term) ||
      m.member_code?.toLowerCase().includes(term)
    );
    const matchesTier = selectedTierFilter === "all" || m.tier === selectedTierFilter;
    return matchesSearch && matchesTier;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (sortField === "downlines") {
      aVal = a.downlines?.length || 0;
      bVal = b.downlines?.length || 0;
    } else if (sortField === "virtual_balance" || sortField === "points_balance" || sortField === "direct_total_sales" || sortField === "team_total_sales") {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
    }
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 pb-20">
      {/* Top Header */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 px-8 py-6 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-6">
            <Link href="/admin" className="p-2 hover:bg-slate-50 rounded-full transition">
               <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div>
               <h1 className="text-xl font-black tracking-tight flex items-center gap-2"><Crown className="w-6 h-6 text-amber-500" /> 合夥人總覽與帳戶管理</h1>
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Brand Ambassadors Directory</p>
            </div>
         </div>
         <div className="flex gap-3">
            <button onClick={handleExport} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-[1.5rem] hover:from-amber-600 hover:to-orange-500 transition shadow-lg shadow-amber-500/20 text-[10px] font-black uppercase tracking-widest active:scale-95 cursor-pointer">
               <Download className="w-4 h-4" /> 匯出專屬報表 (CSV)
            </button>
         </div>
      </nav>

      <main className="max-w-7xl mx-auto p-10 space-y-10">
        
        
        {/* KPI Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
           <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-amber-500/20 transition-all" />
              <div className="relative z-10 flex flex-col gap-2">
                 <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 mb-2">
                    <Crown className="w-5 h-5 text-white" />
                 </div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">活躍大使總數</p>
                 <h3 className="text-3xl font-black text-slate-800">{members.length}</h3>
              </div>
           </div>
           
           <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-indigo-500/20 transition-all" />
              <div className="relative z-10 flex flex-col gap-2">
                 <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-2">
                    <Users className="w-5 h-5 text-white" />
                 </div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">大使體系總直推</p>
                 <div className="flex items-baseline gap-2">
                   <h3 className="text-3xl font-black text-slate-800">{members.reduce((sum, m) => sum + (m.downlines ? m.downlines.length : 0), 0)}</h3>
                   {(() => {
                      const newTotal = members.reduce((sum, m) => {
                         return sum + (m.downlines?.filter((d: any) => {
                            if (!d.created_at) return false;
                            const dDate = new Date(d.created_at);
                            return dDate.getMonth() === new Date().getMonth() && dDate.getFullYear() === new Date().getFullYear();
                         })?.length || 0);
                      }, 0);
                      if (newTotal > 0) return <span className="text-xs font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">本月新增 +{newTotal}</span>;
                      return null;
                   })()}
                 </div>
              </div>
           </div>
           
           <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-all" />
              <div className="relative z-10 flex flex-col gap-2">
                 <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-2">
                    <Award className="w-5 h-5 text-white" />
                 </div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">大使自身總業績</p>
                 <h3 className="text-3xl font-black text-slate-800">${members.reduce((sum, m) => sum + (Number(m.direct_total_sales) || 0), 0).toLocaleString()}</h3>
              </div>
           </div>

           <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-all" />
              <div className="relative z-10 flex flex-col gap-2">
                 <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-2">
                    <TrendingUp className="w-5 h-5 text-white" />
                 </div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">大使創造總業績</p>
                 <h3 className="text-3xl font-black text-slate-800">${members.reduce((sum, m) => sum + (Number(m.team_total_sales) || 0), 0).toLocaleString()}</h3>
              </div>
           </div>

           <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-rose-500/20 transition-all" />
              <div className="relative z-10 flex flex-col gap-2">
                 <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20 mb-2">
                    <Target className="w-5 h-5 text-white" />
                 </div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">平均大使產值</p>
                 <h3 className="text-3xl font-black text-slate-800">${Math.round(members.reduce((sum, m) => sum + (Number(m.team_total_sales) || 0), 0) / (members.length || 1)).toLocaleString()}</h3>
              </div>
           </div>

           <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-purple-500/20 transition-all" />
              <div className="relative z-10 flex flex-col gap-2">
                 <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 mb-2">
                    <PieChart className="w-5 h-5 text-white" />
                 </div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">高階大使佔比</p>
                 <div className="flex items-baseline gap-2">
                   <h3 className="text-3xl font-black text-slate-800">
                     {members.length > 0 ? Math.round((members.filter(m => m.tier === '初潤知己' || m.tier === '初潤靈魂伴侶').length / members.length) * 100) : 0}%
                   </h3>
                   <span className="text-xs font-bold text-slate-400">
                     ({members.filter(m => m.tier === '初潤知己' || m.tier === '初潤靈魂伴侶').length}人)
                   </span>
                 </div>
              </div>
           </div>
        </div>

        

        {/* --- 大使戰力榮譽榜 (Top 3 Leaderboard) --- */}
        {members.length > 0 && (
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 rounded-[3rem] border border-slate-700 shadow-2xl relative overflow-hidden">
             {/* Decorative Background Elements */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
             
             <div className="relative z-10 mb-8 flex justify-between items-end">
                <div>
                   <h2 className="text-xl font-black text-white flex items-center gap-3">
                      <Crown className="w-6 h-6 text-amber-400" /> 合夥人戰力排行榜
                   </h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Top Performing Ambassadors</p>
                </div>
                <div className="text-[10px] font-black text-slate-400 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
                   依團隊累積業績排名
                </div>
             </div>

             <div className="relative z-10 flex flex-col md:flex-row justify-center items-end gap-6 md:gap-12 mt-12">
                {(() => {
                   const sorted = [...members].sort((a, b) => (Number(b.team_total_sales) || 0) - (Number(a.team_total_sales) || 0));
                   const top3 = sorted.slice(0, 3);
                   
                   const PodiumCard = ({ member, rank, height, color, glow }: any) => {
                      if (!member) return null;
                      return (
                         <div className="flex flex-col items-center group relative">
                            {/* Floating Stats */}
                            <div className="absolute -top-24 w-48 text-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 z-20">
                               <div className="bg-white text-slate-900 p-3 rounded-2xl shadow-xl border border-slate-100">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">團隊總業績</p>
                                  <p className="text-base font-black font-mono text-indigo-600">NT$ {(Number(member.team_total_sales) || 0).toLocaleString()}</p>
                                  <div className="w-full h-px bg-slate-100 my-2"></div>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">直推人數</p>
                                  <p className="text-sm font-black font-mono text-emerald-600">{member.downlines?.length || 0} 人</p>
                               </div>
                               <div className="w-3 h-3 bg-white rotate-45 mx-auto -mt-1.5 border-r border-b border-slate-100"></div>
                            </div>
                            
                            {/* Avatar */}
                            <div className="relative mb-4 z-10">
                               <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-xl ${color}`}>
                                  {member.name?.slice(0, 1)}
                               </div>
                               <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-slate-900 rounded-xl border-2 border-slate-800 flex items-center justify-center text-sm font-black text-white shadow-lg">
                                  {rank}
                               </div>
                            </div>
                            
                            <h3 className="text-sm font-black text-white">{member.name}</h3>
                            <p className="text-[10px] font-bold text-slate-400 mt-1">{member.member_code}</p>
                            
                            {/* Podium Bar */}
                            <div className={`w-24 mt-6 rounded-t-3xl ${height} ${glow} bg-gradient-to-t border-t border-white/20 transition-all duration-500 group-hover:-translate-y-2 relative overflow-hidden`}>
                               <div className="absolute inset-0 bg-white/5 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_linear_infinite]" />
                            </div>
                         </div>
                      );
                   };

                   return (
                      <>
                         {/* Rank 2 (Left) */}
                         <div className="order-2 md:order-1 opacity-90 hover:opacity-100 transition-opacity">
                            <PodiumCard member={top3[1]} rank="2" height="h-24 md:h-32" color="bg-slate-500" glow="from-slate-600 to-slate-400 shadow-[0_0_30px_rgba(148,163,184,0.3)]" />
                         </div>
                         {/* Rank 1 (Center) */}
                         <div className="order-1 md:order-2 z-10 transform md:-translate-y-8">
                            <PodiumCard member={top3[0]} rank="1" height="h-32 md:h-48" color="bg-gradient-to-br from-amber-400 to-orange-500" glow="from-amber-600 to-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.5)]" />
                         </div>
                         {/* Rank 3 (Right) */}
                         <div className="order-3 md:order-3 opacity-90 hover:opacity-100 transition-opacity">
                            <PodiumCard member={top3[2]} rank="3" height="h-20 md:h-24" color="bg-orange-700" glow="from-orange-800 to-orange-600 shadow-[0_0_30px_rgba(194,65,12,0.3)]" />
                         </div>
                      </>
                   );
                })()}
             </div>
          </div>
        )}

        {/* --- 合夥人推廣暢銷商品排行 --- */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Target className="w-5 h-5 text-rose-500" /> 合夥人暢銷商品排行
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Top Selling Products by Ambassador Network</p>
            </div>
            <div className="flex items-center gap-2">
               <select 
                 value={topProductsDateRange}
                 onChange={(e) => {
                   setTopProductsDateRange(e.target.value);
                   fetchTopProducts(e.target.value);
                 }}
                 className="text-[10px] font-black text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 outline-none cursor-pointer hover:bg-slate-100 transition"
               >
                 <option value="all">全部時間</option>
                 <option value="this_month">本月</option>
                 <option value="last_month">上個月</option>
                 <option value="last_3_months">近三個月</option>
               </select>
               <div className="text-[10px] font-black text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                  依總銷售額排名
               </div>
            </div>
          </div>
          
          {isTopProductsLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
            </div>
          ) : topProducts.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs font-bold">目前無銷售數據</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topProducts.map((prod, index) => {
                const maxRevenue = topProducts[0].revenue || 1;
                const percentage = Math.max(5, Math.round((prod.revenue / maxRevenue) * 100));
                return (
                  <div key={index} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-rose-100 hover:bg-rose-50/50 transition-all">
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-xs font-black text-slate-400 shrink-0">
                      #{index + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-end">
                        <p className="text-xs font-black text-slate-800">{prod.name}</p>
                        <p className="text-xs font-black text-rose-600">${prod.revenue.toLocaleString()}</p>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div className="bg-gradient-to-r from-rose-400 to-pink-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }} />
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 text-right">已售出 {prod.quantity} 件</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* --- 管理施策洞察區 (Management Insights) --- */}
        {members.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" /> 管理施策洞察專區
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Management Insights & Actionables</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 職級分佈 */}
              <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100/50 flex flex-col">
                <h3 className="text-sm font-black text-slate-700 flex items-center gap-2 mb-4">
                  <PieChart className="w-4 h-4 text-slate-400" /> 職級分佈與健康度
                </h3>
                <div className="space-y-4 flex-1 justify-center flex flex-col">
                  {[
                    { label: '初潤靈魂伴侶', count: members.filter(m => m.tier === '初潤靈魂伴侶').length, color: 'bg-purple-500' },
                    { label: '初潤知己', count: members.filter(m => m.tier === '初潤知己').length, color: 'bg-indigo-500' },
                    { label: '初潤合夥人', count: members.filter(m => m.tier === '初潤合夥人' || m.tier === 'ambassador').length, color: 'bg-emerald-500' },
                  ].map(t => (
                    <div key={t.label}>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-600">{t.label}</span>
                        <span className="text-slate-800">{t.count} 人 ({members.length > 0 ? Math.round((t.count / members.length) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className={`${t.color} h-2 rounded-full transition-all`} style={{ width: `${members.length > 0 ? Math.round((t.count / members.length) * 100) : 0}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 潛力爆發大使 */}
              <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100/50 flex flex-col">
                <h3 className="text-sm font-black text-emerald-800 flex items-center gap-2 mb-4">
                  <Star className="w-4 h-4 text-emerald-500" /> 🚀 潛力爆發大使
                </h3>
                <p className="text-[9px] font-black text-emerald-600/70 mb-3">依據近 30 天實收獎金排名</p>
                <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {isInsightsLoading ? (
                    <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-emerald-500" /></div>
                  ) : insights.risingStars.length === 0 ? (
                    <p className="text-xs font-bold text-slate-400 py-4 text-center bg-white/50 rounded-xl border border-slate-100">近期尚無符合條件之新星</p>
                  ) : (
                    insights.risingStars.map((m: any) => (
                      <div key={m.id} className="bg-white p-3 rounded-xl shadow-sm border border-emerald-50 flex items-center justify-between hover:border-emerald-200 transition">
                        <div className="flex-1 pr-2">
                          <p className="text-xs font-black text-slate-800">{m.name} <span className="text-[9px] text-slate-400 font-normal">({m.member_code})</span></p>
                          <p className="text-[10px] font-bold text-emerald-600 mt-0.5">{m.reason}</p>
                        </div>
                        <button onClick={async () => {
                          if (confirm(`確定要對 ${m.name} 發送激勵推播嗎？`)) {
                            await fetch("/api/admin/partner-raw", {
                              method: "POST", headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ action: "send_notification", payload: { memberId: m.id, title: "總部表揚", content: "恭喜您近期推廣表現優異，請繼續保持！" } })
                            });
                            alert('已成功發送激勵推播！');
                          }
                        }} className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition shrink-0" title="發送激勵推播"><HeartPulse className="w-3.5 h-3.5" /></button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 沉睡流失風險 */}
              <div className="bg-amber-50/50 p-6 rounded-[2rem] border border-amber-100/50 flex flex-col">
                <h3 className="text-sm font-black text-amber-800 flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> ⚠️ 沉睡流失風險
                </h3>
                <p className="text-[9px] font-black text-amber-600/70 mb-3">近 90 天無任何新增獎金與下線</p>
                <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {isInsightsLoading ? (
                    <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-amber-500" /></div>
                  ) : insights.atRisk.length === 0 ? (
                    <p className="text-xs font-bold text-slate-400 py-4 text-center bg-white/50 rounded-xl border border-slate-100">目前團隊發展活躍，無沉睡名單</p>
                  ) : (
                    insights.atRisk.map((m: any) => (
                      <div key={m.id} className="bg-white p-3 rounded-xl shadow-sm border border-amber-50 flex items-center justify-between hover:border-amber-200 transition">
                        <div className="flex-1 pr-2">
                          <p className="text-xs font-black text-slate-800">{m.name} <span className="text-[9px] text-slate-400 font-normal">({m.member_code})</span></p>
                          <p className="text-[10px] font-bold text-amber-600 mt-0.5">{m.reason}</p>
                        </div>
                        <button onClick={async () => {
                          if (confirm(`確定要對 ${m.name} 發送關懷推播嗎？`)) {
                            await fetch("/api/admin/partner-raw", {
                              method: "POST", headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ action: "send_notification", payload: { memberId: m.id, title: "總部關懷", content: "近期未見您的推廣活動，有任何需要總部協助的地方嗎？" } })
                            });
                            alert('已成功發送關懷推播！');
                          }
                        }} className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg transition shrink-0" title="發送關懷推播"><AlertTriangle className="w-3.5 h-3.5" /></button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Filters */}
        <div className="bg-white rounded-[2rem] p-4 flex flex-wrap items-center gap-2 border border-slate-100 shadow-sm">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4 pr-2">篩選職級</span>
           {[
              { id: "all", label: "全部顯示", icon: "🌐" },
              { id: "初潤合夥人", label: "初潤合夥人", icon: "💎" },
              { id: "初潤知己", label: "初潤知己", icon: "🤝" },
              { id: "初潤靈魂伴侶", label: "初潤靈魂伴侶", icon: "🌟" },
              { id: "超級小幫手", label: "超級小幫手", icon: "👑" },
           ].map(t => (
              <button
                 key={t.id}
                 onClick={() => setSelectedTierFilter(t.id)}
                 className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all ${selectedTierFilter === t.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                 {t.icon} {t.label}
              </button>
           ))}
        </div>

        {/* Search Bar & Total Counter */}
        <div className="flex gap-6">
           <div className="flex-1 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input 
                type="text" 
                placeholder="搜尋姓名、電話或會員代碼..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-100 p-6 pl-16 rounded-[2rem] text-sm font-bold focus:ring-2 focus:ring-indigo-500/5 transition shadow-sm"
              />
           </div>
           <div className="bg-white px-8 py-3 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center shrink-0">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">總數</span>
             <span className="text-xl font-black text-indigo-600">{members.length}</span>
           </div>
        </div>

        {/* Members Table */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden overflow-x-auto relative z-10">
           <div className="absolute inset-0 bg-gradient-to-b from-amber-50/50 to-transparent pointer-events-none" />
           <table className="w-full min-w-[1100px] text-left border-collapse relative">
              <thead>
                 <tr className="border-b border-slate-100/50 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white/50 backdrop-blur-md">
                    <th className="p-6 pl-8">會員資訊</th>
                    <th className="p-6">身份職級</th>
                    <th className="p-6">會員編號與推薦人</th>
                    <th className="p-6 text-right cursor-pointer hover:text-indigo-500 transition group" onClick={() => handleSort('virtual_balance')}>
                      可用餘額 <span className="inline-block w-3">{sortField === 'virtual_balance' && (sortDirection === 'asc' ? '↑' : '↓')}</span>
                    </th>
                    <th className="p-6 text-right cursor-pointer hover:text-indigo-500 transition group" onClick={() => handleSort('points_balance')}>
                      紅利點數 <span className="inline-block w-3">{sortField === 'points_balance' && (sortDirection === 'asc' ? '↑' : '↓')}</span>
                    </th>
                    <th className="p-6 text-center cursor-pointer hover:text-indigo-500 transition group" onClick={() => handleSort('downlines')}>
                      直推人數 <span className="inline-block w-3">{sortField === 'downlines' && (sortDirection === 'asc' ? '↑' : '↓')}</span>
                    </th>
                    <th className="p-6 text-right cursor-pointer hover:text-indigo-500 transition group" onClick={() => handleSort('direct_total_sales')}>
                      個人累積業績 <span className="inline-block w-3">{sortField === 'direct_total_sales' && (sortDirection === 'asc' ? '↑' : '↓')}</span>
                    </th>
                    <th className="p-6 text-right cursor-pointer hover:text-indigo-500 transition group" onClick={() => handleSort('team_total_sales')}>
                      團隊累積業績 <span className="inline-block w-3">{sortField === 'team_total_sales' && (sortDirection === 'asc' ? '↑' : '↓')}</span>
                    </th>
                    <th className="p-6 pr-8 text-right">管理操作</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {isLoading ? (
                    <tr>
                       <td colSpan={7} className="p-20 text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                       </td>
                    </tr>
                 ) : sortedMembers.length === 0 ? (
                    <tr>
                       <td colSpan={9} className="p-20 text-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                             <Users className="w-8 h-8 text-slate-200" />
                          </div>
                          <p className="text-sm font-bold text-slate-400">目前沒有符合條件的會員</p>
                       </td>
                    </tr>
                 ) : (
                    sortedMembers.map((m) => {
                      const hasRecentActivity = new Date(m.last_login_at || m.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                      const newDownlines = (m.downlines || []).filter((d: any) => new Date(d.created_at) > new Date(new Date().getFullYear(), new Date().getMonth(), 1)).length;
                      return (
                      <motion.tr 
                        key={m.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-amber-50/30 transition-all group border-b border-slate-50/50 last:border-0"
                      >
                         <td className="p-6 pl-8">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-slate-900 rounded-[1rem] flex items-center justify-center text-white font-black">
                                  {m.name?.slice(0, 1)}
                               </div>
                               <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                     <p className="text-sm font-black text-slate-800">{m.name}</p>
                                     {m.downlines && m.downlines.length >= 10 && (
                                        <span className="px-2 py-0.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-md text-[9px] font-black tracking-widest flex items-center gap-1 shadow-md shadow-rose-500/20 shrink-0">
                                           👑 招募王
                                        </span>
                                     )}
                                     {hasRecentActivity && (
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-md text-[9px] font-black tracking-widest flex items-center gap-1 shrink-0">
                                           🔥 本月活躍
                                        </span>
                                     )}
                                     {Number(m.team_total_sales) >= 100000 && (
                                        <span className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-md text-[9px] font-black tracking-widest flex items-center gap-1 shadow-md shadow-amber-500/20 shrink-0">
                                           💎 業績王
                                        </span>
                                     )}
                                     {m.status === 'warning' && (
                                        <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded-md text-[8px] font-black tracking-widest uppercase flex items-center gap-0.5 border border-rose-200 shrink-0">
                                           ⚠️ 警示帳戶
                                        </span>
                                     )}
                                     {m.status === 'exited' && (
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[8px] font-black tracking-widest uppercase flex items-center gap-0.5 border border-slate-200 shrink-0">
                                           🔴 已退會
                                        </span>
                                     )}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                    <Phone className="w-3 h-3" /> {m.phone}
                                  </div>
                               </div>
                            </div>
                         </td>
                         <td className="p-6">
                            <span className={`px-4 py-2 rounded-full text-[9px] font-black tracking-widest inline-flex items-center gap-1 ${
                               (m.tier === 'partner' || m.tier === '初潤好朋友' || m.tier === '初潤閨蜜' || m.tier === '超級小幫手') ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                               (m.tier === 'ambassador' || m.tier === '初潤知己' || m.tier === '初潤靈魂伴侶') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                               (m.tier === 'invited_team' || m.tier === '初潤特邀團') ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                               'bg-slate-100 text-slate-500'
                            }`}>
                               {(m.tier === 'partner' || m.tier === '初潤好朋友' || m.tier === '初潤閨蜜' || m.tier === '超級小幫手') && <Crown className="w-3 h-3" />}
                               {
                                 (m.tier === 'partner' || m.tier === '初潤好朋友' || m.tier === '初潤閨蜜' || m.tier === '超級小幫手') ? '合夥人' :
                                 (m.tier === 'ambassador' || m.tier === '初潤合夥人' || m.tier === '初潤知己' || m.tier === '初潤靈魂伴侶') ? '合夥人' :
                                 (m.tier === 'invited_team' || m.tier === '初潤特邀團') ? '初潤特邀團' : '一般會員'
                               }
                            </span>
                            <span className="text-[8px] font-mono font-bold block text-slate-400 mt-1 opacity-60">[{m.tier || "一般會員"}]</span>
                         </td>
                         <td className="p-6">
                            <div className="space-y-1">
                               <div className="flex items-center gap-2">
                                  <p className="text-xs font-mono font-bold text-indigo-600">{m.member_code}</p>
                                  <button onClick={() => {
                                      navigator.clipboard.writeText(`${window.location.origin}/register?ref=${m.member_code}`);
                                      alert('已複製推廣連結！');
                                  }} className="text-[9px] font-black bg-indigo-50 hover:bg-indigo-100 text-indigo-500 px-2 py-0.5 rounded transition">
                                    複製連結
                                  </button>
                               </div>
                               <p className="text-[9px] font-bold text-slate-400">
                                 推薦人: {m.upline ? `${m.upline.name} (${m.upline.member_code || '無代碼'})` : '無'}
                               </p>
                            </div>
                         </td>
                         <td className="p-6 text-right">
     <p className="text-sm font-black text-slate-800 tracking-tight">${Number(m.virtual_balance || 0).toLocaleString()}</p>
  </td>
  <td className="p-6 text-right">
     <p className="text-sm font-black text-amber-600 tracking-tight">{Number(m.points_balance || 0).toLocaleString()} <span className="text-[10px] text-amber-400">pt</span></p>
  </td>
  <td className="p-6 text-center">
     <div className="flex flex-col items-center gap-1">
        <button 
           onClick={() => {
             setDownlineMember(m);
             setShowDownlineModal(true);
           }}
           className="inline-flex items-center gap-1.5 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-100/50 cursor-pointer transition active:scale-95"
           title="點擊檢視下線組織結構"
        >
           <Users className="w-3.5 h-3.5" />
           <span className="text-xs font-black">{m.downlines ? m.downlines.length : 0}</span>
        </button>
        {newDownlines > 0 && (
           <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              本月 +{newDownlines}
           </span>
        )}
     </div>
  </td>
  <td className="p-6 text-right">
     <p className="text-sm font-black text-slate-600 tracking-tight">${Number(m.direct_total_sales || 0).toLocaleString()}</p>
  </td>
  <td className="p-6 text-right">
     <p className="text-sm font-black text-emerald-600 tracking-tight">${Number(m.team_total_sales || 0).toLocaleString()}</p>
  </td>
                         <td className="p-6 pr-8 text-right">
                            <button
                              onClick={() => {
                                setSelectedMember(m);
                                setEditForm({
                                  name: m.name || "",
                                  phone: m.phone || "",
                                  email: m.email || "",
                                  member_code: m.member_code || "",
                                  tier: m.tier || "一般會員",
                                  is_b2b: !!m.is_b2b,
                                  balanceAdjustment: "",
                                  pointsAdjustment: "",
                                  adjustmentReason: "",
                                  status: m.status || "active"
                                });
                                // Initialize referrer states
                                setSelectedUplineId(m.upline?.id || null);
                                setUplineSearch("");
                                setUplineSearchResult(m.upline || null);
                                setErrorMessage("");
                                setShowEditModal(true);
                              }}
                              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition shadow-md shadow-slate-900/10 active:scale-95"
                            >
                               編輯帳戶 ⚙️
                            </button>
                            {canApplyForAmbassador(m) && m.tier !== 'ambassador' && (
                              <button
                                onClick={() => {
                                  setselectedPartnerMember(m);
                                  setShowPartnerModal(true);
                                }}
                                className="ml-2 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold"
                              >
                                申請合夥人
                              </button>
                            )}
                         </td>
                      </motion.tr>
                    )})
                 )}
              </tbody>
           </table>
        </div>
      </main>

      {/* Member Management Override Modal */}
      <AnimatePresence>
        {showEditModal && selectedMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!isSaving) setShowEditModal(false); }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
            />
            
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-900 rounded-[3rem] p-6 sm:p-10 w-full max-w-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10 max-h-[92vh] overflow-y-auto no-scrollbar flex flex-col gap-6 border border-slate-800"
              onClick={e => e.stopPropagation()}
            >
               {/* Modal Header */}
               <div className="flex items-center justify-between border-b border-slate-800 pb-5 shrink-0">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <MonitorSmartphone className="w-6 h-6 animate-pulse" />
                     </div>
                     <div>
                        <h3 className="text-base sm:text-lg font-black text-white tracking-tight">總部最高控制台</h3>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Admin Executive Console</p>
                     </div>
                  </div>
                  <button 
                    disabled={isSaving} 
                    onClick={() => setShowEditModal(false)} 
                    className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition text-sm font-bold"
                  >
                    ✕
                  </button>
               </div>

               {errorMessage && (
                  <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-xs font-bold text-rose-600">
                     ⚠️ {errorMessage}
                  </div>
               )}

               <form onSubmit={handleSaveChanges} className="space-y-6">
                  {/* Basic Profile Editing Grid */}
                  <div className="space-y-4">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">🔒 基本個人資料設定</span>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 ml-1">會員姓名</label>
                           <input 
                             type="text" 
                             value={editForm.name} 
                             onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                             className="w-full bg-slate-800/50 text-white border border-slate-700 p-4 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none"
                             required
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 ml-1">聯絡電話</label>
                           <input 
                             type="text" 
                             value={editForm.phone} 
                             onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                             className="w-full bg-slate-800/50 text-white border border-slate-700 p-4 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none"
                             required
                           />
                        </div>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 ml-1">電子信箱 (選填)</label>
                           <input 
                             type="email" 
                             value={editForm.email} 
                             onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                             className="w-full bg-slate-800/50 text-white border border-slate-700 p-4 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none"
                             placeholder="未設定信箱"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 ml-1">會員編號 {adminUser?.title !== '總經理' && adminUser?.title !== '超級管理員' && "(僅限最高管理員修改)"}</label>
                           <input 
                             type="text" 
                             value={editForm.member_code} 
                             onChange={e => setEditForm(prev => ({ ...prev, member_code: e.target.value }))}
                             disabled={adminUser?.title !== '總經理' && adminUser?.title !== '超級管理員'}
                             className={`w-full border-none p-4 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none ${adminUser?.title !== '總經理' && adminUser?.title !== '超級管理員' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-amber-50 text-amber-900'}`}
                             placeholder="例如：CR24M0101123"
                             required
                           />
                        </div>
                     </div>
                  </div>

                  {/* Tier & B2B Partner Selector */}
                  <div className="space-y-4 pt-2">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">👑 階級職務調動</span>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 ml-1">當前初潤職級</label>
                           <select 
                             value={editForm.tier} 
                             onChange={e => setEditForm(prev => ({ ...prev, tier: e.target.value }))}
                             className="w-full bg-slate-800/50 text-white border border-slate-700 p-4 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none cursor-pointer"
                           >
                              {MEMBER_TIERS_OPTIONS.map(opt => (
                                 <option key={opt.val} value={opt.val}>{opt.label}</option>
                              ))}
                           </select>
                        </div>
                        <div className="space-y-1.5 flex flex-col justify-end">
                           <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl">
                              <span className="text-xs font-bold text-slate-700">啟用 B2B 合夥團隊資格</span>
                              <input 
                                type="checkbox" 
                                checked={editForm.is_b2b}
                                onChange={e => setEditForm(prev => ({ ...prev, is_b2b: e.target.checked }))}
                                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* 👥 推薦關係設定 */}
                  <div className="space-y-4 pt-2">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">👥 推薦關係設定</span>
                     <div className="bg-slate-50 p-5 rounded-2xl space-y-4 border border-slate-100/50">
                        <div className="flex items-center justify-between">
                           <div className="space-y-1">
                              <span className="text-[8px] font-black text-slate-400 block uppercase">當前推薦人</span>
                              <p className="text-xs font-bold text-slate-700">
                                 {selectedUplineId ? (
                                    uplineSearchResult && uplineSearchResult.id === selectedUplineId ? (
                                       `${uplineSearchResult.name} (${uplineSearchResult.member_code || uplineSearchResult.phone || '無代碼'})`
                                    ) : (
                                       "已選擇新推薦人 (見下方)"
                                    )
                                 ) : (
                                    <span className="text-slate-400 font-bold">無推薦人 (系統預設)</span>
                                 )}
                              </p>
                           </div>
                           {selectedUplineId && (
                              <button
                                 type="button"
                                 onClick={() => {
                                    setSelectedUplineId(null);
                                    setUplineSearch("");
                                    setUplineSearchResult(null);
                                 }}
                                 className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[9px] font-black tracking-widest uppercase transition"
                              >
                                 ✕ 清除推薦人
                              </button>
                           )}
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-slate-200/50 relative">
                           <label className="text-[9px] font-black text-slate-400 ml-1">搜尋並變更推薦人 (輸入代碼或手機號碼)</label>
                           <div className="relative">
                              <input
                                 type="text"
                                 value={uplineSearch}
                                 onChange={e => {
                                    const val = e.target.value;
                                    setUplineSearch(val);
                                 }}
                                 placeholder="例: CR26M311991 或 0912345678"
                                 className="w-full bg-white border border-slate-100 p-4 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none"
                              />
                              {isSearchingUpline && (
                                 <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                                 </div>
                              )}
                           </div>

                           {uplineSearch.trim() && (
                              <div className="mt-2 ml-1">
                                 {uplineSearchResult === null && !isSearchingUpline && (
                                    <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                                       ❌ 找不到該推薦人，請確認代碼或手機號碼是否正確
                                    </p>
                                 )}
                                 {uplineSearchResult && uplineSearchResult.error === "self" && (
                                    <p className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                                       ⚠️ 不能將會員自己設為自己的推薦人！
                                    </p>
                                 )}
                                 {uplineSearchResult && !uplineSearchResult.error && uplineSearchResult.id && (
                                    <div className="flex items-center justify-between bg-emerald-50/50 border border-emerald-100/50 p-2.5 rounded-xl mt-2">
                                       <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                          ✨ 找到推薦人：{uplineSearchResult.name} ({uplineSearchResult.member_code || '無代碼'})
                                       </p>
                                       {selectedUplineId !== uplineSearchResult.id && (
                                          <button
                                             type="button"
                                             onClick={() => {
                                                setSelectedUplineId(uplineSearchResult.id);
                                             }}
                                             className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[8px] font-black tracking-widest uppercase transition"
                                          >
                                             套用變更 ✓
                                          </button>
                                       )}
                                    </div>
                                 )}
                              </div>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Account Balance and Points Adjustment Panel */}
                  <div className="space-y-4 pt-2">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">💰 資金與點數調度 (留空代表不異動)</span>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 ml-1">可用預收款儲值/扣除金額 (NT$)</label>
                           <input 
                             type="text" 
                             value={editForm.balanceAdjustment} 
                             onChange={e => {
                                const val = e.target.value;
                                if (val === "" || val === "-" || /^-?\d*$/.test(val)) {
                                  setEditForm(prev => ({ ...prev, balanceAdjustment: val }));
                                }
                             }}
                             className="w-full bg-indigo-50/30 border border-indigo-100/50 p-4 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none text-indigo-900"
                             placeholder="例: 5000 或 -1000"
                           />
                           <span className="text-[8px] font-bold text-slate-400 block ml-1">現有餘額: ${Number(selectedMember.virtual_balance || 0).toLocaleString()}</span>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 ml-1">紅利點數調整 (Points)</label>
                           <input 
                             type="text" 
                             value={editForm.pointsAdjustment} 
                             onChange={e => {
                                const val = e.target.value;
                                if (val === "" || val === "-" || /^-?\d*$/.test(val)) {
                                  setEditForm(prev => ({ ...prev, pointsAdjustment: val }));
                                }
                             }}
                             className="w-full bg-emerald-50/30 border border-emerald-100/50 p-4 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/10 outline-none text-emerald-900"
                             placeholder="例: 200 或 -50"
                           />
                           <span className="text-[8px] font-bold text-slate-400 block ml-1">現有點數: {Number(selectedMember.points_balance || 0).toLocaleString()} pt</span>
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 ml-1">資金異動原因/備註 (若有異動，此欄為必填)</label>
                        <input 
                          type="text" 
                          value={editForm.adjustmentReason} 
                          onChange={e => setEditForm(prev => ({ ...prev, adjustmentReason: e.target.value }))}
                          className="w-full bg-slate-800/50 text-white border border-slate-700 p-4 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none"
                          placeholder="例如：手動增額、入會訂金折抵、測試帳戶調整"
                          required={!!editForm.balanceAdjustment || !!editForm.pointsAdjustment}
                        />
                     </div>
                  </div>

                  {/* 🛡️ 最高管理權限專區 (限總經理/超級管理員) */}
                  {(adminUser?.title === '總經理' || adminUser?.title === '超級管理員') && (
                     <div className="space-y-4 pt-4 border-t border-rose-100/50">
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block ml-1">🛡️ 最高管理權限專區 (限總經理/超級管理員)</span>
                        <div className="bg-rose-50/20 p-5 rounded-[2rem] space-y-4 border border-rose-100/30">
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Status Selector */}
                              <div className="space-y-1.5">
                                 <label className="text-[9px] font-black text-slate-500 ml-1">帳戶運作狀態</label>
                                 <select 
                                   value={editForm.status || "active"} 
                                   onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                                   className="w-full bg-white border border-rose-100 p-4 rounded-xl text-xs font-bold focus:ring-2 focus:ring-rose-500/10 outline-none cursor-pointer text-slate-800"
                                 >
                                    <option value="active">🟢 正常運作 (Active)</option>
                                    <option value="warning">⚠️ 警示帳戶 (Warning)</option>
                                    <option value="exited">🔴 已退會 (Exited)</option>
                                 </select>
                              </div>

                              {/* Permanent Delete Button */}
                              <div className="space-y-1.5 flex flex-col justify-end">
                                 <button
                                    type="button"
                                    onClick={handleDeleteMember}
                                    className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black tracking-widest uppercase transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/10 active:scale-95 cursor-pointer"
                                 >
                                    🚨 永久刪除該會員資料
                                 </button>
                              </div>
                           </div>
                        </div>
                     </div>
                  )}

                  {/* Actions */}
                  <div className="pt-4 border-t border-slate-100 flex gap-3">
                     <button 
                       type="button"
                       disabled={isSaving}
                       onClick={() => setShowEditModal(false)}
                       className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 rounded-xl font-black text-[10px] uppercase tracking-widest transition text-slate-500"
                     >
                        取消返回
                     </button>
                     <button 
                       type="submit"
                       disabled={isSaving}
                       className="flex-1 py-4 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-black text-[10px] uppercase tracking-widest transition shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
                     >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "確認儲存修改 ✓"}
                     </button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
            {/* Partner Application Modal */}
            {showPartnerModal && selectedPartnerMember && (
              <BrandPartnerCard
                member={selectedPartnerMember}
                onClose={() => {
                  setShowPartnerModal(false);
                  setselectedPartnerMember(null);
                }}
                onSuccess={() => {
                  // Refresh members list to reflect new tier
                  fetchMembers();
                  setShowPartnerModal(false);
                  setselectedPartnerMember(null);
                  alert('🎉 合夥人申請成功！已更新會員職級。');
                }}
              />
            )}

            {/* Downline Structure Modal */}
            <AnimatePresence>
              {showDownlineModal && downlineMember && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowDownlineModal(false)}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
                  />
                  
                  <motion.div 
                    initial={{ scale: 0.95, y: 15 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 15 }}
                    className="bg-white rounded-[3rem] p-6 sm:p-10 w-full max-w-4xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10 max-h-[92vh] overflow-hidden flex flex-col gap-6"
                    onClick={e => e.stopPropagation()}
                  >
                     {/* Modal Header */}
                     <div className="flex items-center justify-between border-b border-slate-100 pb-5 shrink-0">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                              <Users className="w-6 h-6" />
                           </div>
                           <div>
                              <h3 className="text-base sm:text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                {downlineMember.name} 的直推組織結構 <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-xs font-black ml-2">{downlineMember.downlines?.length || 0} 人</span>
                              </h3>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Direct Downline Network ({downlineMember.member_code})</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => setShowDownlineModal(false)} 
                          className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition text-sm font-bold"
                        >
                          ✕
                        </button>
                     </div>

                     <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                       {!downlineMember.downlines || downlineMember.downlines.length === 0 ? (
                         <div className="py-20 text-center">
                           <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                             <Users className="w-8 h-8 text-slate-200" />
                           </div>
                           <p className="text-sm font-bold text-slate-400">尚無任何直推下線紀錄</p>
                         </div>
                       ) : (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {downlineMember.downlines.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((dl: any, idx: number) => (
                             <div key={dl.id || idx} className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-5 flex flex-col gap-4 relative overflow-hidden group hover:border-indigo-100 hover:bg-indigo-50/50 transition-all">
                               <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-xl group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-all" />
                               
                               <div className="flex justify-between items-start relative z-10">
                                 <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-white shadow-sm border border-slate-100 rounded-xl flex items-center justify-center text-slate-600 font-black text-sm">
                                     {dl.name?.slice(0, 1) || "?"}
                                   </div>
                                   <div>
                                     <p className="text-sm font-black text-slate-800">{dl.name || "未設定姓名"}</p>
                                     <p className="text-[10px] font-bold text-slate-400">{dl.member_code || "無代碼"} • {dl.phone || "無電話"}</p>
                                   </div>
                                 </div>
                                 <span className="text-[9px] font-black tracking-widest px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 shadow-sm">
                                   {dl.tier || "一般會員"}
                                 </span>
                               </div>
                               
                               <div className="grid grid-cols-2 gap-2 mt-2 pt-4 border-t border-slate-200/50 relative z-10">
                                 <div>
                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">個人消費</p>
                                   <p className="text-sm font-black text-indigo-600">${(Number(dl.direct_total_sales) || 0).toLocaleString()}</p>
                                 </div>
                                 <div>
                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">團隊業績</p>
                                   <p className="text-sm font-black text-emerald-600">${(Number(dl.team_total_sales) || 0).toLocaleString()}</p>
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>
                       )}
                     </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Detailed Stats Dashboard Modal */}
            <AnimatePresence>
              {showDashboardModal && selectedMember && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-8">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowDashboardModal(false)}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
                  />
                  
                  <motion.div 
                    initial={{ scale: 0.95, y: 15 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 15 }}
                    className="bg-[#FDFBF7] rounded-[3rem] p-6 sm:p-10 w-full max-w-5xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10 max-h-[92vh] overflow-hidden flex flex-col gap-6"
                    onClick={e => e.stopPropagation()}
                  >
                     {/* Modal Header */}
                     <div className="flex items-center justify-between border-b border-slate-200 pb-5 shrink-0">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                              <Activity className="w-6 h-6" />
                           </div>
                           <div>
                              <h3 className="text-base sm:text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                {selectedMember.name} 的個人數據儀表板
                              </h3>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Ambassador Performance Analytics ({selectedMember.member_code})</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => setShowDashboardModal(false)} 
                          className="w-8 h-8 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center text-slate-500 transition text-sm font-bold"
                        >
                          ✕
                        </button>
                     </div>

                     <div className="flex border-b border-slate-100 mb-4 gap-4 px-2 shrink-0">
                       <button
                         onClick={() => setDashboardTab('overview')}
                         className={`pb-3 text-sm font-black transition-all ${dashboardTab === 'overview' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                       >
                         📊 數據概覽
                       </button>
                       <button
                         onClick={() => setDashboardTab('ledger')}
                         className={`pb-3 text-sm font-black transition-all ${dashboardTab === 'ledger' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                       >
                         💰 獎金明細流水帳
                       </button>
                     </div>

                     <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                        {isDashboardLoading || !dashboardData ? (
                          <div className="py-32 flex flex-col items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
                            <p className="text-xs font-bold text-slate-400">正在獲取大使最新營運數據...</p>
                          </div>
                        ) : dashboardTab === 'overview' ? (
                          <>
                            {/* KPI Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">當前可用餘額</p>
                                <p className="text-2xl font-black text-slate-800">${Number(dashboardData.data?.virtual_balance || 0).toLocaleString()}</p>
                              </div>
                              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">累積總獎金</p>
                                <p className="text-2xl font-black text-emerald-600">${Number(dashboardData.commissionEarned || 0).toLocaleString()}</p>
                              </div>
                              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">已提領總額</p>
                                <p className="text-2xl font-black text-indigo-600">${Number(dashboardData.commissionWithdrawn || 0).toLocaleString()}</p>
                              </div>
                              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">直推總人數</p>
                                <p className="text-2xl font-black text-purple-600">{dashboardData.downlines?.length || 0} 人</p>
                              </div>
                            </div>

                            {/* Chart Area */}
                            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                               <h4 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
                                 <TrendingUp className="w-4 h-4 text-indigo-500" /> 每月獎金收益趨勢 (近半年)
                               </h4>
                               <div className="h-[250px] w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dashboardData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                      <defs>
                                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                                          <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                      <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 900 }} />
                                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 900 }} tickFormatter={(value) => `$${value}`} />
                                      <RechartsTooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold', fontSize: '12px' }}
                                        formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '獎金收益']}
                                        labelStyle={{ color: '#64748b', fontWeight: '900', marginBottom: '4px' }}
                                      />
                                      <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }} />
                                    </AreaChart>
                                  </ResponsiveContainer>
                               </div>
                            </div>

                            {/* Downlines List inside Dashboard */}
                            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                               <h4 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
                                 <Users className="w-4 h-4 text-emerald-500" /> 團隊成員概覽
                               </h4>
                               {(!dashboardData.downlines || dashboardData.downlines.length === 0) ? (
                                 <div className="py-10 text-center">
                                   <p className="text-xs font-bold text-slate-400">尚無直推紀錄</p>
                                 </div>
                               ) : (
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                   {dashboardData.downlines.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((dl: any) => (
                                     <div key={dl.id} className="p-3 border border-slate-100 rounded-xl flex items-center justify-between hover:bg-slate-50 transition">
                                        <div className="flex flex-col gap-0.5">
                                          <p className="text-xs font-black text-slate-800">{dl.name || '未設定'}</p>
                                          <p className="text-[9px] font-bold text-slate-400">{dl.member_code} • {dl.tier}</p>
                                        </div>
                                        <div className="text-right flex flex-col gap-0.5">
                                          <p className="text-[10px] font-black text-emerald-600">業績: ${(Number(dl.team_total_sales) || 0).toLocaleString()}</p>
                                          <p className="text-[8px] font-bold text-slate-400">{new Date(dl.created_at).toLocaleDateString()} 加入</p>
                                        </div>
                                     </div>
                                   ))}
                                 </div>
                               )}
                            </div>
                          </>
                        ) : (
                          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4">
                            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-2">
                              <Activity className="w-4 h-4 text-emerald-500" /> 獎金明細與貢獻者 (Commission Ledger)
                            </h4>
                            {(!dashboardData.commissionLedger || dashboardData.commissionLedger.length === 0) ? (
                              <div className="py-20 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                  <TrendingUp className="w-8 h-8 text-slate-200" />
                                </div>
                                <p className="text-xs font-bold text-slate-400">尚無任何獎金明細</p>
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                  <thead>
                                    <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                                      <th className="p-4 rounded-tl-xl">發放日期</th>
                                      <th className="p-4">貢獻者姓名 / 編號</th>
                                      <th className="p-4 text-right">原訂單金額</th>
                                      <th className="p-4 text-right rounded-tr-xl">實收獎金金額</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50 text-xs font-bold">
                                    {dashboardData.commissionLedger.map((item: any) => (
                                      <tr key={item.id} className="hover:bg-indigo-50/30 transition-all">
                                        <td className="p-4 text-slate-500">{new Date(item.created_at).toLocaleString()}</td>
                                        <td className="p-4 text-slate-800 flex items-center gap-2">
                                          {item.contributor_name}
                                          {item.contributor_code && <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">{item.contributor_code}</span>}
                                        </td>
                                        <td className="p-4 text-right text-slate-600">{item.order_amount ? `$${Number(item.order_amount).toLocaleString()}` : '-'}</td>
                                        <td className="p-4 text-right text-emerald-600 font-black">+${Number(item.amount).toLocaleString()}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                     </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

    </div>
  );
}

export default function AdminAmbassadorListPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" /></div>}>
      <AdminAmbassadorListContent />
    </Suspense>
  );
}
