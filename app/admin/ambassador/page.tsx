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
  X,
} from "lucide-react";

// ───────── Types ─────────
interface ApplicationRow {
  id: string;
  member_id: string;
  application_type: string; // 'paid_upgrade' | 'free_performance' | 'partner'
  status: string; // 'pending' | 'approved' | 'rejected'
  remittance_last_five: string | null;
  remittance_photo: string | null;
  free_performance_total: number | null;
  notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  members: {
    name: string;
    phone: string;
    email: string | null;
    member_code: string;
    tier: string;
    avatar_url: string | null;
  };
}

type TabKey = "all" | "pending" | "ambassador" | "partner" | "rejected";

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
export default function AmbassadorAdminPage() {
  const router = useRouter();

  // Auth
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Data
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [searchTerm, setSearchTerm] = useState("");

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
      const { data, error } = await supabase
        .from("ambassador_applications")
        .select("*, members!inner(name, phone, email, member_code, tier, avatar_url)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications((data as unknown as ApplicationRow[]) || []);
    } catch (err) {
      console.error("Fetch ambassador applications error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ───────── Stats ─────────
  const stats = {
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter(
      (a) => a.status === "approved" && a.application_type !== "partner"
    ).length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    partner: applications.filter(
      (a) => a.application_type === "partner" && a.status === "approved"
    ).length,
  };

  // ───────── Filter ─────────
  const filtered = applications.filter((app) => {
    // Tab filter
    if (activeTab === "pending" && app.status !== "pending") return false;
    if (activeTab === "ambassador" && (app.application_type === "partner" || app.status !== "approved"))
      return false;
    if (activeTab === "partner" && (app.application_type !== "partner" || app.status !== "approved"))
      return false;
    if (activeTab === "rejected" && app.status !== "rejected") return false;

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const m = app.members;
      return (
        m.name?.toLowerCase().includes(q) ||
        m.phone?.includes(q) ||
        m.member_code?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ───────── Review handler ─────────
  const handleReview = async () => {
    if (!confirmDialog) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/ambassador/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: confirmDialog.appId,
          action: confirmDialog.action,
          notes: reviewNotes[confirmDialog.appId] || "",
          reviewed_by: adminUser?.name || "管理員",
        }),
      });
      const result = await res.json();
      if (result.success) {
        showToast(`已成功${confirmDialog.action === "approved" ? "核准" : "駁回"}「${confirmDialog.memberName}」的申請！`, "success");
        fetchApplications();
      } else {
        showToast(result.error || "操作失敗，請稍後再試", "error");
      }
    } catch (err: any) {
      showToast("網路錯誤：" + err.message, "error");
    } finally {
      setIsSubmitting(false);
      setConfirmDialog(null);
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
      case "rejected":
        return { label: "已駁回", color: "bg-rose-100 text-rose-800", icon: <XCircle className="w-3 h-3" /> };
      default:
        return { label: status, color: "bg-slate-100 text-slate-600", icon: null };
    }
  };

  // ───────── Tab config ─────────
  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "all", label: "全部", count: applications.length },
    { key: "pending", label: "待審核", count: stats.pending },
    { key: "ambassador", label: "品牌大使", count: stats.approved },
    { key: "partner", label: "合夥人", count: stats.partner },
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
                品牌大使與合夥人專區
              </h1>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-0.5">
                Ambassador &amp; Partner Management
              </p>
            </div>
          </div>
          <button
            onClick={fetchApplications}
            disabled={isLoading}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-700"
          >
            <Loader2 className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* ═══════════ Stats Dashboard ═══════════ */}
        <div className="grid grid-cols-2 gap-4">
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

          {/* Partners */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-500" />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">合夥人</span>
            </div>
            <p className="text-3xl font-black text-indigo-600">{stats.partner}</p>
          </motion.div>
        </div>

        {/* ═══════════ Search Bar ═══════════ */}
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input
            type="text"
            placeholder="搜尋姓名、電話或會員代碼..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-100 py-4 pl-12 pr-5 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/10 transition shadow-sm outline-none"
          />
        </div>

        {/* ═══════════ Tab Filter ═══════════ */}
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

        {/* ═══════════ Application List ═══════════ */}
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
            {filtered.map((app) => {
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
                        <p className="text-sm font-black text-slate-800">{member.name}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-slate-400">{member.phone}</span>
                          {member.email && (
                            <span className="text-[10px] font-bold text-slate-300">· {member.email}</span>
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

                    {/* Status Badge */}
                    <div
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusBadge.color}`}
                    >
                      {statusBadge.icon}
                      {statusBadge.label}
                    </div>
                  </div>

                  {/* ── Type & Date ── */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border ${typeBadge.color}`}
                    >
                      {typeBadge.label}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300">
                      申請時間：{formatDate(app.created_at)}
                    </span>
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

                  {/* ── Action Buttons (Pending Only) ── */}
                  {app.status === "pending" && (
                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      {/* Notes input */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          審核備註 (選填)
                        </label>
                        <textarea
                          value={reviewNotes[app.id] || ""}
                          onChange={(e) =>
                            setReviewNotes((prev) => ({ ...prev, [app.id]: e.target.value }))
                          }
                          placeholder="輸入審核備註或補充說明..."
                          rows={2}
                          className="w-full bg-slate-50 border-none p-3 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/10 outline-none resize-none"
                        />
                      </div>

                      {/* Buttons */}
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
                    </div>
                  )}
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
