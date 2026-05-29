"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  Search,
  Filter,
  Shield,
  Loader2,
  Star,
  UserPlus,
  Eye,
  DollarSign,
  Award,
  User,
  Download,
  Calendar,
  MoreVertical,
  X,
  Phone,
  Copy,
  ShieldAlert,
  PauseCircle
} from "lucide-react";

// ───────── Types ─────────
interface ApplicationRow {
  id: string;
  member_id: string;
  application_type: string; // 'paid_upgrade' | 'free_performance' | 'partner'
  status: string; // 'pending' | 'approved' | 'rejected'
  remittance_last_five: string | null;
  remittance_photo: string | null;
  id_card_front: string | null;
  id_card_back: string | null;
  free_performance_total: number | null;
  notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  snapshot_data: any;
  members: {
    name: string;
    phone: string;
    email: string | null;
    member_code: string;
    tier: string;
    avatar_url: string | null;
    lifetime_spend: number | null;
  };
}

type TabKey = "all" | "pending" | "ambassador" | "suspended" | "rejected";
type SortKey = "newest" | "lifetime_spend";

// ───────── Helpers ─────────
function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isBase64Image(str: string | null | undefined): boolean {
  if (!str) return false;
  return str.startsWith("data:image") || /^[A-Za-z0-9+/=]{100,}/.test(str);
}

// ───────── Component ─────────
export default function AmbassadorManagementPage() {
  const router = useRouter();

  // Auth
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Data
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [selectedApps, setSelectedApps] = useState<string[]>([]);

  // Review
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    appId: string;
    action: "approved" | "rejected";
    memberName: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  // Photo preview modal
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Archive modal
  const [archiveModal, setArchiveModal] = useState<ApplicationRow | null>(null);

  // Member Detail Modal
  const [memberDetail, setMemberDetail] = useState<{
    open: boolean;
    data: any | null;
    downlines: any[];
    commissionEarned: number;
    commissionWithdrawn: number;
    isLoading: boolean;
  }>({ open: false, data: null, downlines: [], commissionEarned: 0, commissionWithdrawn: 0, isLoading: false });

  // Manual Assign Modal
  const [manualAssignModal, setManualAssignModal] = useState(false);
  const [manualSearchKey, setManualSearchKey] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Advanced Filters
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // ───────── Auth check ─────────
  useEffect(() => {
    const userStr = sessionStorage.getItem("churun_admin_user");
    if (!userStr) {
      router.replace("/admin");
      return;
    }
    try {
      const parsed = JSON.parse(userStr);
      setAdminUser(parsed);
      setIsAdmin(true);
    } catch {
      sessionStorage.removeItem("churun_admin_user");
      router.replace("/admin");
    }
  }, [router]);

  // ───────── Fetch ─────────
  useEffect(() => {
    if (isAdmin) fetchApplications();
  }, [isAdmin]);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/ambassador-raw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fetch_applications", payload: {} })
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      const appData = (result.data as unknown as ApplicationRow[]) || [];
      setApplications(appData);
      const notesObj: Record<string, string> = {};
      appData.forEach(a => { if (a.notes) notesObj[a.id] = a.notes; });
      setReviewNotes(notesObj);
    } catch (err) {
      console.error("Fetch ambassador applications error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const openMemberDetail = async (memberId: string) => {
    setMemberDetail({ open: true, data: null, downlines: [], commissionEarned: 0, commissionWithdrawn: 0, isLoading: true });
    try {
      const res = await fetch("/api/admin/ambassador-raw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "open_member_detail", payload: { memberId } })
      });
      const result = await res.json();
      if (!result.success) throw new Error();
      const memberRes = { data: result.data };
      const downlinesRes = { data: result.downlines };
      setMemberDetail({
        open: true,
        data: memberRes.data,
        downlines: downlinesRes.data || [],
        commissionEarned: result.commissionEarned || 0,
        commissionWithdrawn: result.commissionWithdrawn || 0,
        isLoading: false
      });
    } catch (err) {
      console.error(err);
      setMemberDetail((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // ───────── Stats ─────────
  const stats = {
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved" && a.application_type !== "partner").length,
    suspended: applications.filter((a) => a.status === "suspended").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  // ───────── Filter ─────────
  const filtered = applications.filter((app) => {
    // Exclude partner applications from ambassador page
    if (app.application_type === "partner") return false;

    // Tab filter
    if (activeTab === "pending" && app.status !== "pending") return false;
    if (activeTab === "ambassador" && app.status !== "approved") return false;
    if (activeTab === "suspended" && app.status !== "suspended") return false;
    if (activeTab === "rejected" && app.status !== "rejected") return false;

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const m = app.members;
      if (!(
        m.name?.toLowerCase().includes(q) ||
        m.phone?.includes(q) ||
        m.member_code?.toLowerCase().includes(q)
      )) {
        return false;
      }
    }

    // Type filter
    if (typeFilter !== "all" && app.application_type !== typeFilter) return false;

    // Date filter
    if (dateRange.start && new Date(app.created_at) < new Date(dateRange.start)) return false;
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      if (new Date(app.created_at) > endDate) return false;
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "lifetime_spend") {
      return (b.members?.lifetime_spend || 0) - (a.members?.lifetime_spend || 0);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // ───────── Export CSV ─────────
  const handleExportCSV = () => {
    if (filtered.length === 0) {
      showToast("沒有資料可匯出", "error");
      return;
    }

    const headers = [
      "申請編號",
      "會員姓名",
      "會員代碼",
      "會員等級",
      "申請類型",
      "狀態",
      "累積消費金額",
      "申請時間",
      "匯款後五碼"
    ].join(",");

    const rows = sorted.map(app => {
      const m = app.members;
      const typeLabel = getTypeBadge(app.application_type).label;
      const statusLabel = getStatusBadge(app.status).label;
      return [
        app.id,
        m.name,
        m.member_code,
        m.tier || "一般會員",
        typeLabel,
        statusLabel,
        m.lifetime_spend || 0,
        new Date(app.created_at).toLocaleString(),
        app.remittance_last_five || "無"
      ].map(v => `"${v}"`).join(",");
    });

    const csvContent = "\uFEFF" + headers + "\n" + rows.join("\n"); // Add BOM for Excel
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `大使申請清單_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ───────── Manual Assign ─────────
  const handleManualAssign = async () => {
    if (!manualSearchKey.trim()) return showToast("請輸入手機號碼或會員代碼", "error");
    setIsAssigning(true);
    try {
      const res = await fetch("/api/admin/ambassador-raw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "manual_assign", payload: { searchKey: manualSearchKey.trim(), adminName: adminUser?.name } })
      });
      const result = await res.json();
      if (result.success) {
        showToast(result.message, "success");
        setManualAssignModal(false);
        setManualSearchKey("");
        fetchApplications();
      } else {
        showToast(result.error || "操作失敗", "error");
      }
    } catch (err: any) {
      showToast("網路錯誤：" + err.message, "error");
    } finally {
      setIsAssigning(false);
    }
  };

  // ───────── Update Admin Note ─────────
  const handleUpdateAdminNote = async (appId: string) => {
    try {
      const res = await fetch("/api/admin/ambassador-raw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_admin_note", payload: { applicationId: appId, notes: reviewNotes[appId] || "" } })
      });
      if ((await res.json()).success) {
        showToast("已儲存備註", "success");
        fetchApplications();
      }
    } catch (err: any) {
      showToast("網路錯誤", "error");
    }
  };

  // ───────── Suspend Action ─────────
  const handleSuspend = async (appId: string, memberId: string, memberName: string) => {
    if (!confirm(`確定要暫時停權「${memberName}」嗎？這會暫時凍結他的 B2B 推廣權限。`)) return;
    try {
      const res = await fetch("/api/admin/ambassador-raw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suspend", payload: { applicationId: appId, memberId } })
      });
      if ((await res.json()).success) {
        showToast(`已暫時停權「${memberName}」`, "success");
        fetchApplications();
      }
    } catch (err) {}
  };

  // ───────── Restore Action ─────────
  const handleRestore = async (appId: string, memberId: string, memberName: string) => {
    if (!confirm(`確定要恢復「${memberName}」的大使權限嗎？`)) return;
    try {
      const res = await fetch("/api/admin/ambassador-raw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", payload: { applicationId: appId, memberId } })
      });
      if ((await res.json()).success) {
        showToast(`已恢復「${memberName}」的權限`, "success");
        fetchApplications();
      }
    } catch (err) {}
  };

  // ───────── Revoke Action ─────────
  const handleRevoke = async (appId: string, memberId: string, memberName: string) => {
    if (!confirm(`確定要撤銷「${memberName}」的品牌大使資格嗎？此動作將會將其降級並拒絕此申請。`)) return;
    
    try {
      const res = await fetch("/api/admin/ambassador-raw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke", payload: { applicationId: appId, memberId } })
      });
      const result = await res.json();
      if (result.success) {
        showToast(`已成功撤銷「${memberName}」的品牌大使資格`, "success");
        fetchApplications();
      } else {
        showToast("操作失敗：" + result.error, "error");
      }
    } catch (err: any) {
      showToast("網路錯誤：" + err.message, "error");
    }
  };

  // ───────── Review handler ─────────
  const handleReview = async () => {
    if (!confirmDialog) return;
    if (confirmDialog.action === "rejected" && (!reviewNotes[confirmDialog.appId] || !reviewNotes[confirmDialog.appId].trim())) {
      showToast("請輸入駁回理由", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/ambassador/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: confirmDialog.appId,
          action: confirmDialog.action === "approved" ? "approve" : "reject",
          notes: reviewNotes[confirmDialog.appId] || "",
          reviewed_by: adminUser?.name || "管理員",
        }),
      });
      const result = await res.json();
      if (result.success) {
        showToast(`已成功${confirmDialog.action === "approved" ? "核准" : "駁回"}「${confirmDialog.memberName}」的申請！`, "success");
        fetchApplications();
      } else {
        showToast(result.message || result.error || "操作失敗，請稍後再試", "error");
      }
    } catch (err: any) {
      showToast("網路錯誤：" + err.message, "error");
    } finally {
      setIsSubmitting(false);
      setConfirmDialog(null);
    }
  };

  // ───────── Bulk Review ─────────
  const handleBulkReview = async (action: "approve" | "reject") => {
    if (selectedApps.length === 0) return;
    const actionName = action === "approve" ? "核准" : "駁回";
    if (!confirm(`確定要批次${actionName}這 ${selectedApps.length} 筆申請嗎？`)) return;
    setIsSubmitting(true);
    let successCount = 0;
    try {
      const promises = selectedApps.map(appId => 
        fetch("/api/ambassador/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            application_id: appId,
            action: action,
            notes: reviewNotes[appId] || (action === "approve" ? "批次核准" : "批次駁回"),
            reviewed_by: adminUser?.name || "管理員",
          }),
        }).then(r => r.json())
      );
      const results = await Promise.all(promises);
      successCount = results.filter(r => r.success).length;
      if (successCount > 0) {
        showToast(`已成功${actionName} ${successCount} 筆申請`, "success");
        setSelectedApps([]);
        fetchApplications();
      } else {
        showToast(`批次操作失敗`, "error");
      }
    } catch (err: any) {
      showToast("批次操作網路錯誤：" + err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  };

  // ───────── Application type helpers ─────────
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "paid_upgrade":
        return { label: "💰 付費升級 ($98,000)", color: "bg-amber-50 text-amber-700 border-amber-200" };
      case "free_performance":
        return { label: "🏆 業績免費", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "partner":
        return { label: "🤝 合夥人 ($298,000)", color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      default:
        return { label: type, color: "bg-slate-50 text-slate-600 border-slate-200" };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return { label: "待審核", color: "bg-amber-100 text-amber-800", icon: <Clock className="w-3 h-3" /> };
      case "approved":
        return { label: "已核准", color: "bg-emerald-100 text-emerald-800", icon: <CheckCircle2 className="w-3 h-3" /> };
      case "suspended":
        return { label: "已停權", color: "bg-slate-200 text-slate-700", icon: <ShieldAlert className="w-3 h-3" /> };
      case "rejected":
        return { label: "已駁回", color: "bg-rose-100 text-rose-800", icon: <XCircle className="w-3 h-3" /> };
      default:
        return { label: status, color: "bg-slate-100 text-slate-600", icon: null };
    }
  };

  // ───────── Tab config ─────────
  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "all", label: "全部", count: applications.filter(a => a.application_type !== "partner").length },
    { key: "pending", label: "待審核", count: stats.pending },
    { key: "ambassador", label: "已核准大使", count: stats.approved },
    { key: "suspended", label: "已停權", count: stats.suspended },
    { key: "rejected", label: "已駁回", count: stats.rejected },
  ];

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 pb-24">
      {/* ═══════════ Header ═══════════ */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 px-4 sm:px-8 py-5 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 hover:bg-slate-50 rounded-full transition">
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                品牌大使管理區
              </h1>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-0.5">
                Brand Ambassador Management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setManualAssignModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-lg shadow-emerald-600/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              手動指派
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              匯出 CSV
            </button>
            <button
              onClick={fetchApplications}
              disabled={isLoading}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-700"
            >
              <Loader2 className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* ═══════════ Stats Dashboard ═══════════ */}
        <div className="grid grid-cols-3 gap-4">
          {/* Pending */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">待審核申請</span>
            </div>
            <p className="text-3xl font-black text-amber-600">{stats.pending}</p>
          </motion.div>

          {/* Approved Ambassadors */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">已核准大使</span>
            </div>
            <p className="text-3xl font-black text-emerald-600">{stats.approved}</p>
          </motion.div>

          {/* Rejected */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                <XCircle className="w-5 h-5 text-rose-500" />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">已駁回申請</span>
            </div>
            <p className="text-3xl font-black text-rose-600">{stats.rejected}</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="relative md:col-span-5">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              type="text"
              placeholder="搜尋姓名、電話或會員代碼..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-full min-h-[52px] bg-white border border-slate-100 py-3 pl-12 pr-5 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/10 transition shadow-sm outline-none"
            />
          </div>
          <div className="md:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-full min-h-[52px] bg-white border border-slate-100 py-3 px-4 rounded-2xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-emerald-500/10 outline-none shadow-sm cursor-pointer"
            >
              <option value="all">所有方案類型</option>
              <option value="paid_upgrade">付費升級</option>
              <option value="free_performance">業績達標免費升級</option>
            </select>
          </div>
          <div className="md:col-span-4 flex items-center gap-2 bg-white border border-slate-100 p-1.5 rounded-2xl shadow-sm">
            <div className="flex items-center px-3 text-slate-400">
              <Calendar className="w-4 h-4" />
            </div>
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full text-xs font-bold text-slate-600 outline-none bg-transparent cursor-pointer"
            />
            <span className="text-slate-300 font-bold">-</span>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full text-xs font-bold text-slate-600 outline-none bg-transparent cursor-pointer"
            />
          </div>
        </div>

        {/* ═══════════ Tab Filter & Sort ═══════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.key
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                    : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[8px] ${
                      activeTab === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="shrink-0 bg-white border border-slate-100 py-2.5 px-4 rounded-xl text-[10px] font-black text-slate-600 focus:ring-2 focus:ring-emerald-500/10 outline-none shadow-sm cursor-pointer uppercase tracking-widest"
          >
            <option value="newest">最新申請排序</option>
            <option value="lifetime_spend">累積消費最高</option>
          </select>
        </div>

        {/* ═══════════ Application List ═══════════ */}
        {activeTab === "pending" && sorted.length > 0 && (
          <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-2xl p-4 shadow-sm mb-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedApps.length === sorted.length && sorted.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedApps(sorted.map(a => a.id));
                  } else {
                    setSelectedApps([]);
                  }
                }}
                className="w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-sm font-bold text-indigo-900">
                已選擇 {selectedApps.length} 筆待審核申請
              </span>
            </div>
            {selectedApps.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkReview("reject")}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-white text-rose-600 border border-rose-200 rounded-xl text-xs font-black hover:bg-rose-50 transition"
                >
                  批次駁回
                </button>
                <button
                  onClick={() => handleBulkReview("approve")}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition"
                >
                  批次核准
                </button>
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
            <p className="text-xs font-bold text-slate-400">正在載入申請資料...</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
              <Crown className="w-10 h-10 text-slate-200" />
            </div>
            <p className="text-sm font-bold text-slate-400 mb-1">目前沒有符合條件的申請</p>
            <p className="text-[10px] font-bold text-slate-300">
              {activeTab === "all"
                ? "尚無任何品牌大使或合夥人申請"
                : `「${tabs.find((t) => t.key === activeTab)?.label}」分類下暫無資料`}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.06 } },
            }}
            className="space-y-4"
          >
            {sorted.map((app) => {
              const typeBadge = getTypeBadge(app.application_type);
              const statusBadge = getStatusBadge(app.status);
              const member = app.members;

              return (
                <motion.div
                  key={app.id}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all"
                >
                  {/* ── Top: Member Info + Status ── */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {app.status === "pending" && (
                        <input
                          type="checkbox"
                          checked={selectedApps.includes(app.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedApps(prev => [...prev, app.id]);
                            else setSelectedApps(prev => prev.filter(id => id !== app.id));
                          }}
                          className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      )}
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-slate-900 rounded-[1rem] flex items-center justify-center text-white font-black text-base shrink-0">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.name}
                            className="w-12 h-12 rounded-[1rem] object-cover"
                          />
                        ) : (
                          member.name?.slice(0, 1)
                        )}
                      </div>
                      <div>
                        <button onClick={() => openMemberDetail(app.member_id)} className="text-sm font-black text-slate-800 hover:text-emerald-600 underline underline-offset-4 decoration-emerald-500/30 transition-colors text-left flex items-center gap-1.5">
                          {member.name}
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            {member.phone}
                            <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(member.phone); showToast("已複製電話號碼", "success"); }} className="p-0.5 hover:bg-slate-100 rounded text-slate-300 hover:text-emerald-600 transition"><Copy className="w-2.5 h-2.5" /></button>
                            <a href={`tel:${member.phone}`} className="p-0.5 hover:bg-slate-100 rounded text-slate-300 hover:text-indigo-600 transition"><Phone className="w-2.5 h-2.5" /></a>
                          </span>
                          {member.email && (
                            <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                              · {member.email}
                              <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(member.email || ""); showToast("已複製信箱", "success"); }} className="p-0.5 hover:bg-slate-100 rounded text-slate-300 hover:text-emerald-600 transition"><Copy className="w-2.5 h-2.5" /></button>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-mono font-bold text-indigo-500">
                            {member.member_code}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-md text-[8px] font-black text-slate-400 tracking-wider">
                            {member.tier || "一般會員"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge & Actions */}
                    <div className="flex flex-col items-end gap-2">
                      <div
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusBadge.color}`}
                      >
                        {statusBadge.icon}
                        {statusBadge.label}
                      </div>
                      
                      {app.status === "approved" && (
                        <div className="flex flex-col gap-1.5">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              navigator.clipboard.writeText(`${window.location.origin}/register?ref=${member.member_code}`); 
                              showToast("已複製專屬推廣連結", "success"); 
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-black text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                          >
                            <Copy className="w-3 h-3" />
                            專屬連結
                          </button>
                          <button 
                            onClick={() => handleSuspend(app.id, app.member_id, member.name)}
                            className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-black text-amber-600 hover:bg-amber-50 rounded-md transition"
                          >
                            <PauseCircle className="w-3 h-3" />
                            暫時停權
                          </button>
                          <button 
                            onClick={() => handleRevoke(app.id, app.member_id, member.name)}
                            className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-black text-rose-500 hover:bg-rose-50 rounded-md transition"
                          >
                            <XCircle className="w-3 h-3" />
                            撤銷資格
                          </button>
                        </div>
                      )}

                      {app.status === "suspended" && (
                        <div className="flex flex-col gap-1.5">
                          <button 
                            onClick={() => handleRestore(app.id, app.member_id, member.name)}
                            className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-black text-emerald-600 hover:bg-emerald-50 rounded-md transition"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            恢復權限
                          </button>
                          <button 
                            onClick={() => handleRevoke(app.id, app.member_id, member.name)}
                            className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-black text-rose-500 hover:bg-rose-50 rounded-md transition"
                          >
                            <XCircle className="w-3 h-3" />
                            撤銷資格
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Type, Date & Performance ── */}
                  <div className="flex flex-wrap items-center justify-between mb-4 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border ${typeBadge.color}`}
                      >
                        {typeBadge.label}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        申請時間：{formatDate(app.created_at)}
                      </span>
                    </div>
                    {/* Performance Tracking */}
                    <div className="text-right">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">累積歷史消費 / 業績</p>
                       <p className="text-sm font-black text-indigo-600">NT$ {(member.lifetime_spend || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* ── Remittance / Performance Info ── */}
                  {(app.application_type === "paid_upgrade" || app.application_type === "partner") && (
                    <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        💳 匯款資訊
                      </p>
                      {app.remittance_last_five && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-bold text-slate-700">
                            匯款末五碼：
                            <span className="text-indigo-600 font-black ml-1">{app.remittance_last_five}</span>
                          </span>
                        </div>
                      )}
                      {app.remittance_photo && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 mb-2">匯款截圖：</p>
                          {isBase64Image(app.remittance_photo) ? (
                            <button
                              onClick={() => setPreviewPhoto(app.remittance_photo)}
                              className="group relative"
                            >
                              <img
                                src={
                                  app.remittance_photo.startsWith("data:")
                                    ? app.remittance_photo
                                    : `data:image/jpeg;base64,${app.remittance_photo}`
                                }
                                alt="匯款截圖"
                                className="w-32 h-32 object-cover rounded-xl border border-slate-200 group-hover:border-indigo-300 transition"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition flex items-center justify-center">
                                <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition" />
                              </div>
                            </button>
                          ) : (
                            <p className="text-xs font-bold text-slate-500 bg-white p-3 rounded-lg border border-slate-100 break-all">
                              {app.remittance_photo}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── ID Card Photos ── */}
                  <div className="bg-slate-50 rounded-xl p-4 mb-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      🪪 身分證件
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {app.id_card_front ? (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 mb-2">正面照片：</p>
                          {isBase64Image(app.id_card_front) ? (
                            <button
                              onClick={() => setPreviewPhoto(app.id_card_front!)}
                              className="group relative w-full h-24"
                            >
                              <img
                                src={
                                  app.id_card_front.startsWith("data:")
                                    ? app.id_card_front
                                    : `data:image/jpeg;base64,${app.id_card_front}`
                                }
                                alt="身分證正面"
                                className="w-full h-full object-cover rounded-xl border border-slate-200 group-hover:border-emerald-300 transition"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition flex items-center justify-center">
                                <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition" />
                              </div>
                            </button>
                          ) : (
                            <p className="text-xs font-bold text-slate-500 bg-white p-3 rounded-lg border border-slate-100 break-all truncate">
                              {app.id_card_front}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 mb-2">正面照片：</p>
                          <div className="w-full h-24 bg-slate-100 rounded-xl flex items-center justify-center border border-dashed border-slate-200 text-[10px] text-slate-400">未上傳</div>
                        </div>
                      )}

                      {app.id_card_back ? (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 mb-2">反面照片：</p>
                          {isBase64Image(app.id_card_back) ? (
                            <button
                              onClick={() => setPreviewPhoto(app.id_card_back!)}
                              className="group relative w-full h-24"
                            >
                              <img
                                src={
                                  app.id_card_back.startsWith("data:")
                                    ? app.id_card_back
                                    : `data:image/jpeg;base64,${app.id_card_back}`
                                }
                                alt="身分證反面"
                                className="w-full h-full object-cover rounded-xl border border-slate-200 group-hover:border-emerald-300 transition"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition flex items-center justify-center">
                                <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition" />
                              </div>
                            </button>
                          ) : (
                            <p className="text-xs font-bold text-slate-500 bg-white p-3 rounded-lg border border-slate-100 break-all truncate">
                              {app.id_card_back}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 mb-2">反面照片：</p>
                          <div className="w-full h-24 bg-slate-100 rounded-xl flex items-center justify-center border border-dashed border-slate-200 text-[10px] text-slate-400">未上傳</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {app.application_type === "free_performance" && app.free_performance_total !== null && (
                    <div className="bg-emerald-50/50 rounded-xl p-4 mb-4">
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">
                        🏆 業績達標資訊
                      </p>
                      <p className="text-sm font-black text-emerald-700">
                        累積業績：NT$ {Number(app.free_performance_total).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* ── Reviewer Notes (for already reviewed) ── */}
                  {app.status !== "pending" && (app.notes || app.reviewed_by) && (
                    <div className="bg-slate-50 rounded-xl p-4 mb-4">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        📝 審核備註
                      </p>
                      {app.notes && <p className="text-xs font-bold text-slate-600 mb-1">{app.notes}</p>}
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        {app.reviewed_by && <span>審核者：{app.reviewed_by}</span>}
                        {app.reviewed_at && <span>· {formatDate(app.reviewed_at)}</span>}
                      </div>
                    </div>
                  )}

                  {app.status === "approved" && app.snapshot_data && (
                    <div className="mt-4">
                      <button
                        onClick={() => setArchiveModal(app)}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-black transition"
                      >
                        <Shield className="w-4 h-4" />
                        檢視備查資料
                      </button>
                    </div>
                  )}

                  {/* ── Action Buttons & Notes ── */}
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    {/* Notes input */}
                    <div className="space-y-1.5 relative">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                        總部專屬備註 (不公開)
                      </label>
                      <textarea
                        value={reviewNotes[app.id] || ""}
                        onChange={(e) =>
                          setReviewNotes((prev) => ({ ...prev, [app.id]: e.target.value }))
                        }
                        placeholder={app.status === "pending" ? "輸入審核備註..." : "輸入關於此大使的內部備註..."}
                        rows={2}
                        className="w-full bg-slate-50 border-none p-3 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/10 outline-none resize-none"
                      />
                      {app.status !== "pending" && reviewNotes[app.id] !== app.notes && (
                        <button
                          onClick={() => handleUpdateAdminNote(app.id)}
                          className="absolute bottom-2 right-2 px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition"
                        >
                          儲存備註
                        </button>
                      )}
                    </div>

                    {/* Buttons (Pending Only) */}
                    {app.status === "pending" && (
                      <div className="flex gap-3">
                        <button
                          onClick={() =>
                            setConfirmDialog({
                              open: true,
                              appId: app.id,
                              action: "approved",
                              memberName: member.name,
                            })
                          }
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition shadow-lg shadow-emerald-600/10 active:scale-95"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          ✅ 核准
                        </button>
                        <button
                          onClick={() =>
                            setConfirmDialog({
                              open: true,
                              appId: app.id,
                              action: "rejected",
                              memberName: member.name,
                            })
                          }
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition shadow-lg shadow-rose-500/10 active:scale-95"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          ❌ 駁回
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>

      {/* ═══════════ Floating Back Button ═══════════ */}
      <Link
        href="/admin"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-2xl shadow-slate-900/30 flex items-center justify-center transition-all active:scale-90"
      >
        <ChevronLeft className="w-5 h-5" />
      </Link>

      {/* ═══════════ Archive Modal ═══════════ */}
      <AnimatePresence>
        {archiveModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setArchiveModal(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] overflow-hidden shadow-2xl z-10 max-h-[85vh] flex flex-col"
            >
              <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-500">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">核准備查資料</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">申請編號：{archiveModal.id.substring(0,8)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setArchiveModal(null)}
                  className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-8 flex-1">
                {/* 1. 基本資料 */}
                <section>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-500" /> 基本資料
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 mb-1">姓名</p>
                      <p className="text-sm font-black text-slate-800">{archiveModal.snapshot_data?.name}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 mb-1">生日</p>
                      <p className="text-sm font-black text-slate-800">{archiveModal.snapshot_data?.birthday}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 mb-1">身分證字號</p>
                      <p className="text-sm font-black text-slate-800">{archiveModal.snapshot_data?.id_card_number}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 mb-1">電話 / 信箱</p>
                      <p className="text-xs font-bold text-slate-700">{archiveModal.snapshot_data?.phone}</p>
                      <p className="text-xs font-bold text-slate-500">{archiveModal.snapshot_data?.email}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl col-span-2">
                      <p className="text-[10px] font-bold text-slate-400 mb-1">通訊地址</p>
                      <p className="text-sm font-bold text-slate-800">
                        {archiveModal.snapshot_data?.city} {archiveModal.snapshot_data?.district} {archiveModal.snapshot_data?.address}
                      </p>
                    </div>
                  </div>
                </section>

                {/* 2. 證件照片 */}
                <section>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-500" /> 證件照片
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400">身分證正面</p>
                      {archiveModal.snapshot_data?.id_card_front ? (
                        <div className="aspect-[1.6/1] bg-slate-100 rounded-xl overflow-hidden cursor-pointer" onClick={() => setPreviewPhoto(archiveModal.snapshot_data.id_card_front)}>
                          <img src={archiveModal.snapshot_data.id_card_front} alt="身分證正面" className="w-full h-full object-cover hover:opacity-80 transition" />
                        </div>
                      ) : (
                        <div className="aspect-[1.6/1] bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs">無照片</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400">身分證反面</p>
                      {archiveModal.snapshot_data?.id_card_back ? (
                        <div className="aspect-[1.6/1] bg-slate-100 rounded-xl overflow-hidden cursor-pointer" onClick={() => setPreviewPhoto(archiveModal.snapshot_data.id_card_back)}>
                          <img src={archiveModal.snapshot_data.id_card_back} alt="身分證反面" className="w-full h-full object-cover hover:opacity-80 transition" />
                        </div>
                      ) : (
                        <div className="aspect-[1.6/1] bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs">無照片</div>
                      )}
                    </div>
                  </div>
                </section>

                {/* 3. 匯款帳號資料 */}
                <section>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-indigo-500" /> 提領帳號資訊
                  </h4>
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 mb-1">銀行代碼 / 名稱</p>
                        <p className="text-sm font-black text-slate-800">{archiveModal.snapshot_data?.bank_code || '未填寫'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 mb-1">分行</p>
                        <p className="text-sm font-black text-slate-800">{archiveModal.snapshot_data?.bank_branch || '未填寫'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 mb-1">戶名</p>
                        <p className="text-sm font-black text-slate-800">{archiveModal.snapshot_data?.bank_account_name || '未填寫'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 mb-1">帳號</p>
                        <p className="text-sm font-black text-slate-800 tracking-wider">{archiveModal.snapshot_data?.bank_account || '未填寫'}</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════ Confirmation Dialog ═══════════ */}
      <AnimatePresence>
        {confirmDialog?.open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setConfirmDialog(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl relative z-10 border border-slate-100"
            >
              <div className="text-center mb-6">
                <div
                  className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
                    confirmDialog.action === "approved"
                      ? "bg-emerald-50"
                      : "bg-rose-50"
                  }`}
                >
                  {confirmDialog.action === "approved" ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <XCircle className="w-8 h-8 text-rose-500" />
                  )}
                </div>
                <h3 className="text-base font-black text-slate-900 mb-2">
                  確認{confirmDialog.action === "approved" ? "核准" : "駁回"}申請？
                </h3>
                <p className="text-xs font-bold text-slate-400">
                  您即將{confirmDialog.action === "approved" ? "核准" : "駁回"}
                  「<span className="text-slate-700">{confirmDialog.memberName}</span>
                  」的品牌大使/合夥人申請。
                </p>
                <p className="text-[10px] font-bold text-slate-300 mt-1">此操作執行後將會立即生效</p>
              </div>

              {confirmDialog.action === "rejected" && (
                <div className="mb-6 text-left">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">駁回理由 (必填)</label>
                  <textarea 
                    value={reviewNotes[confirmDialog.appId] || ""}
                    onChange={(e) => setReviewNotes({ ...reviewNotes, [confirmDialog.appId]: e.target.value })}
                    placeholder="請說明駁回原因，讓會員知道需改善哪些東西再重新申請..."
                    className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold text-slate-700 resize-none h-24 focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  disabled={isSubmitting}
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 py-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl font-black text-[10px] uppercase tracking-widest transition text-slate-500"
                >
                  取消返回
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={handleReview}
                  className={`flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition shadow-lg text-white flex items-center justify-center gap-2 ${
                    confirmDialog.action === "approved"
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10"
                      : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/10"
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : confirmDialog.action === "approved" ? (
                    "確認核准 ✓"
                  ) : (
                    "確認駁回 ✕"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════ Photo Preview Modal ═══════════ */}
      <AnimatePresence>
        {previewPhoto && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewPhoto(null)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 max-w-lg w-full"
            >
              <button
                onClick={() => setPreviewPhoto(null)}
                className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center text-slate-500 hover:text-slate-800 transition z-20"
              >
                <X className="w-4 h-4" />
              </button>
              <img
                src={
                  previewPhoto.startsWith("data:")
                    ? previewPhoto
                    : `data:image/jpeg;base64,${previewPhoto}`
                }
                alt="匯款截圖預覽"
                className="w-full rounded-2xl shadow-2xl border border-white/10"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════ Member Detail Modal ═══════════ */}
      <AnimatePresence>
        {memberDetail.open && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMemberDetail((prev) => ({ ...prev, open: false }))}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl relative z-10 border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-500" /> 會員詳細資料
                </h2>
                <button
                  onClick={() => setMemberDetail((prev) => ({ ...prev, open: false }))}
                  className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-slate-400 hover:text-slate-800 shadow-sm border border-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto no-scrollbar space-y-6">
                {memberDetail.isLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    <p className="text-xs font-bold text-slate-400">正在讀取會員資料...</p>
                  </div>
                ) : memberDetail.data ? (
                  <>
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="w-16 h-16 bg-slate-900 rounded-[1.2rem] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-slate-900/10">
                          {memberDetail.data.avatar_url ? (
                            <img src={memberDetail.data.avatar_url} alt="avatar" className="w-16 h-16 rounded-[1.2rem] object-cover" />
                          ) : (
                            memberDetail.data.name?.slice(0, 1)
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-900">{memberDetail.data.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-black uppercase tracking-widest">{memberDetail.data.member_code}</span>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-black uppercase tracking-widest">{memberDetail.data.tier || '一般會員'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">聯絡電話</p>
                          <p className="text-sm font-black text-slate-700">{memberDetail.data.phone}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">身分證字號</p>
                          <p className="text-sm font-black text-slate-700 uppercase">{memberDetail.data.id_card_number || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">電子信箱</p>
                          <p className="text-sm font-black text-slate-700 truncate">{memberDetail.data.email || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">出生年月日</p>
                          <p className="text-sm font-black text-slate-700 truncate">{memberDetail.data.birthday || '-'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">聯絡地址</p>
                          <p className="text-sm font-black text-slate-700">{memberDetail.data.city ? `${memberDetail.data.city}${memberDetail.data.district}${memberDetail.data.address}` : '-'}</p>
                        </div>
                        <div className="col-span-2 grid grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">市內電話</p>
                            <p className="text-xs font-bold text-slate-700">{memberDetail.data.landline || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">公司/電話</p>
                            <p className="text-xs font-bold text-slate-700">
                              {memberDetail.data.company || '-'}{' '}
                              {memberDetail.data.company_phone && `(${memberDetail.data.company_phone})`}
                            </p>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">備註</p>
                          <p className="text-xs font-bold text-slate-700">{memberDetail.data.notes || '-'}</p>
                        </div>
                        <div className="col-span-2 border-t border-slate-200 pt-3 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">註冊時間</p>
                            <p className="text-xs font-bold text-slate-700">{formatDate(memberDetail.data.created_at)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">推薦人</p>
                            <p className="text-xs font-bold text-slate-700">{memberDetail.data.upline?.name ? `${memberDetail.data.upline.name} (${memberDetail.data.upline.member_code})` : '無 (直屬總部)'}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">歷史累積消費</p>
                            <p className="text-sm font-black text-emerald-600">NT$ {(memberDetail.data.lifetime_spend || 0).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Team & Commission Info */}
                    <div>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> 累計賺取獎金
                          </p>
                          <p className="text-base font-black text-indigo-700">NT$ {memberDetail.commissionEarned.toLocaleString()}</p>
                          <p className="text-[9px] font-bold text-indigo-400 mt-1">已提領: ${memberDetail.commissionWithdrawn.toLocaleString()}</p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <Award className="w-3 h-3" /> 團隊直推總額
                          </p>
                          <p className="text-base font-black text-emerald-700">NT$ {memberDetail.downlines.reduce((s, d) => s + (d.lifetime_spend || 0), 0).toLocaleString()}</p>
                          <p className="text-[9px] font-bold text-emerald-400 mt-1">直推人數: {memberDetail.downlines.length} 人</p>
                        </div>
                      </div>

                      <h4 className="text-sm font-black tracking-widest text-slate-800 uppercase flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-indigo-500" /> 團隊直推夥伴名單
                      </h4>
                      
                      {memberDetail.downlines.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                          {[...memberDetail.downlines]
                            .sort((a: any, b: any) => (b.lifetime_spend || 0) - (a.lifetime_spend || 0))
                            .map((d: any, index: number) => {
                              let rankIcon = null;
                              if (index === 0) rankIcon = <Crown className="w-5 h-5 text-amber-400 drop-shadow-sm" />;
                              else if (index === 1) rankIcon = <Award className="w-5 h-5 text-slate-300 drop-shadow-sm" />;
                              else if (index === 2) rankIcon = <Award className="w-5 h-5 text-amber-600 drop-shadow-sm" />;

                              return (
                                <div key={d.id} className="bg-white border border-slate-100 rounded-xl p-3 flex justify-between items-center hover:border-indigo-100 hover:shadow-sm transition">
                                  <div className="flex items-center gap-3">
                                    {rankIcon && <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">{rankIcon}</div>}
                                    <div>
                                      <p className="text-xs font-black text-slate-800">{d.name} <span className="text-[10px] font-bold text-slate-400 ml-1">({d.member_code})</span></p>
                                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">註冊：{new Date(d.created_at).toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 text-slate-500 rounded-md text-[9px] font-black tracking-wider">{d.tier || '一般會員'}</span>
                                    <p className="text-[10px] font-black text-emerald-600 mt-1">累積: ${d.lifetime_spend?.toLocaleString() || 0}</p>
                                  </div>
                                </div>
                              );
                          })}
                        </div>
                      ) : (
                        <div className="bg-slate-50 rounded-xl py-6 flex flex-col items-center justify-center border border-dashed border-slate-200">
                          <p className="text-xs font-bold text-slate-400">目前尚無直推夥伴</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-center text-sm font-bold text-rose-500 py-10">無法載入會員資料</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════ Manual Assign Modal ═══════════ */}
      <AnimatePresence>
        {manualAssignModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setManualAssignModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl relative z-10 border border-slate-100 flex flex-col p-6"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-emerald-500" /> 手動指派品牌大使
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">無需填寫表單，直接升級現有會員</p>
                </div>
                <button
                  onClick={() => setManualAssignModal(false)}
                  className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 hover:text-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">
                    會員手機號碼 或 會員代碼
                  </label>
                  <input
                    type="text"
                    value={manualSearchKey}
                    onChange={(e) => setManualSearchKey(e.target.value)}
                    placeholder="例如: 0912345678"
                    className="w-full bg-slate-50 border-none p-3.5 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 outline-none placeholder:text-slate-300"
                  />
                </div>

                <button
                  onClick={handleManualAssign}
                  disabled={isAssigning}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 mt-2"
                >
                  {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                  {isAssigning ? "處理中..." : "立即開通大使資格"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════ Toast Notification ═══════════ */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[110] px-6 py-4 rounded-2xl shadow-2xl text-xs font-black tracking-wider flex items-center gap-2 ${
              toast.type === "success"
                ? "bg-emerald-600 text-white shadow-emerald-600/30"
                : "bg-rose-500 text-white shadow-rose-500/30"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0" />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
