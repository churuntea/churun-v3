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
  Trash2
} from "lucide-react";
import { canApplyForAmbassador, autoUpgradeEligibility } from '@/utils/eligibility';

import BrandAmbassadorCard from '@/components/BrandAmbassadorCard';


const MEMBER_TIERS_OPTIONS = [
  { val: "一般會員", label: "一般會員 (預設)" },
  { val: "初潤寶寶", label: "初潤寶寶" },
  { val: "初潤幼兒園", label: "初潤幼兒園" },
  { val: "初潤小朋友", label: "初潤小朋友" },
  { val: "初潤青少年", label: "初潤青少年" },
  { val: "初潤好朋友", label: "初潤好朋友 (合夥職級)" },
  { val: "初潤閨蜜", label: "初潤閨蜜 (合夥職級)" },
  { val: "初潤知己", label: "初潤知己 (品牌大使職級)" },
  { val: "初潤靈魂伴侶", label: "初潤靈魂伴侶 (品牌大使職級)" },
  { val: "invited_team", label: "初潤特邀團 (invited_team)" },
  { val: "partner", label: "創業夥伴合夥人 (partner)" },
  { val: "ambassador", label: "品牌推廣大使 (ambassador)" }
];

function AdminMembersContent() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal States
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [showAmbassadorModal, setShowAmbassadorModal] = useState(false);
  const [selectedAmbassadorMember, setSelectedAmbassadorMember] = useState<any | null>(null);
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
  }, [router]);

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
        .select("*, upline:upline_id(id, name, member_code, phone)")
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
      '職級': m.tier === 'partner' || m.tier === '初潤好朋友' || m.tier === '初潤閨蜜' ? '合夥人' :
             m.tier === 'ambassador' || m.tier === '初潤知己' || m.tier === '初潤靈魂伴侶' ? '品牌大使' :
             m.tier === 'invited_team' || m.tier === '初潤特邀團' ? '初潤特邀團' : '一般會員',
      '實際職級': m.tier || '一般會員',
      '可用餘額': m.virtual_balance || 0,
      '可用紅利點數': m.points_balance || 0,
      '團隊累積業績': m.team_total_sales || 0,
      '直推累積業績': m.direct_total_sales || 0
    }));

    exportToCsv(`初潤_會員名單_${new Date().toISOString().split('T')[0]}.csv`, exportData);
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
    return (
      m.name?.toLowerCase().includes(term) ||
      m.phone?.includes(term) ||
      m.member_code?.toLowerCase().includes(term)
    );
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
               <h1 className="text-xl font-black tracking-tight">會員資料與帳戶管理</h1>
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Members Override Directory</p>
            </div>
         </div>
         <div className="flex gap-3">
            <Link href="/admin/deleted-members" className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 border border-rose-100/50 rounded-[1.5rem] hover:bg-rose-100 transition text-[10px] font-black uppercase tracking-widest active:scale-95">
               <Trash2 className="w-3.5 h-3.5 text-rose-500" /> 已刪除名單總覽
            </Link>
            <button onClick={handleExport} className="flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-[1.5rem] hover:bg-indigo-600 transition shadow-lg shadow-indigo-500/20 text-[10px] font-black uppercase tracking-widest active:scale-95 cursor-pointer">
               <Download className="w-4 h-4" /> 匯出名單 (CSV)
            </button>
         </div>
      </nav>

      <main className="max-w-7xl mx-auto p-10 space-y-10">
        
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
        <div className="bg-white rounded-[3rem] border border-slate-50 shadow-sm overflow-hidden overflow-x-auto">
           <table className="w-full min-w-[1000px] text-left border-collapse">
              <thead>
                 <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-6 pl-8">會員資訊</th>
                    <th className="p-6">身份職級</th>
                    <th className="p-6">會員編號與推薦人</th>
                    <th className="p-6 text-right">可用餘額</th>
                    <th className="p-6 text-right">紅利點數</th>
                    <th className="p-6 text-right">團隊累積業績</th>
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
                 ) : filteredMembers.length === 0 ? (
                    <tr>
                       <td colSpan={7} className="p-20 text-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                             <Users className="w-8 h-8 text-slate-200" />
                          </div>
                          <p className="text-sm font-bold text-slate-400">目前沒有符合條件的會員</p>
                       </td>
                    </tr>
                 ) : (
                    filteredMembers.map((m) => (
                      <motion.tr 
                        key={m.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-slate-50/50 transition group"
                      >
                         <td className="p-6 pl-8">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-slate-900 rounded-[1rem] flex items-center justify-center text-white font-black">
                                  {m.name?.slice(0, 1)}
                               </div>
                               <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                     <p className="text-sm font-black text-slate-800">{m.name}</p>
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
                               (m.tier === 'partner' || m.tier === '初潤好朋友' || m.tier === '初潤閨蜜') ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                               (m.tier === 'ambassador' || m.tier === '初潤知己' || m.tier === '初潤靈魂伴侶') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                               (m.tier === 'invited_team' || m.tier === '初潤特邀團') ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                               'bg-slate-100 text-slate-500'
                            }`}>
                               {(m.tier === 'partner' || m.tier === '初潤好朋友' || m.tier === '初潤閨蜜') && <Crown className="w-3 h-3" />}
                               {
                                 (m.tier === 'partner' || m.tier === '初潤好朋友' || m.tier === '初潤閨蜜') ? '合夥人' :
                                 (m.tier === 'ambassador' || m.tier === '初潤知己' || m.tier === '初潤靈魂伴侶') ? '品牌大使' :
                                 (m.tier === 'invited_team' || m.tier === '初潤特邀團') ? '初潤特邀團' : '一般會員'
                               }
                            </span>
                            <span className="text-[8px] font-mono font-bold block text-slate-400 mt-1 opacity-60">[{m.tier || "一般會員"}]</span>
                         </td>
                         <td className="p-6">
                            <div className="space-y-1">
                               <p className="text-xs font-mono font-bold text-indigo-600">{m.member_code}</p>
                               <p className="text-[9px] font-bold text-slate-400">
                                 推薦人: {m.upline ? `${m.upline.name} (${m.upline.member_code || '無代碼'})` : '無'}
                               </p>
                            </div>
                         </td>
                         <td className="p-6 text-right">
                            <p className="text-sm font-black text-slate-800">${Number(m.virtual_balance || 0).toLocaleString()}</p>
                         </td>
                         <td className="p-6 text-right">
                            <p className="text-sm font-black text-slate-800">{Number(m.points_balance || 0).toLocaleString()} pt</p>
                         </td>
                         <td className="p-6 text-right">
                            <p className="text-sm font-black text-slate-800">${Number(m.team_total_sales || 0).toLocaleString()}</p>
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
                                  setSelectedAmbassadorMember(m);
                                  setShowAmbassadorModal(true);
                                }}
                                className="ml-2 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold"
                              >
                                申請品牌大使
                              </button>
                            )}
                         </td>
                      </motion.tr>
                    ))
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
              className="bg-white rounded-[3rem] p-6 sm:p-10 w-full max-w-xl shadow-2xl relative z-10 max-h-[92vh] overflow-y-auto no-scrollbar flex flex-col gap-6 border border-slate-100"
              onClick={e => e.stopPropagation()}
            >
               {/* Modal Header */}
               <div className="flex items-center justify-between border-b border-slate-100 pb-5 shrink-0">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-md">
                        <Users className="w-6 h-6 animate-pulse" />
                     </div>
                     <div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">會員帳戶總部控制面板</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Admin Member Control Desk</p>
                     </div>
                  </div>
                  <button 
                    disabled={isSaving} 
                    onClick={() => setShowEditModal(false)} 
                    className="w-8 h-8 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 transition text-sm font-bold"
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
                             className="w-full bg-slate-50 border-none p-4 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none"
                             required
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 ml-1">聯絡電話</label>
                           <input 
                             type="text" 
                             value={editForm.phone} 
                             onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                             className="w-full bg-slate-50 border-none p-4 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none"
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
                             className="w-full bg-slate-50 border-none p-4 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none"
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
                             className="w-full bg-slate-50 border-none p-4 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none cursor-pointer"
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
                          className="w-full bg-slate-50 border-none p-4 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none"
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
            {/* Brand Ambassador Application Modal */}
            {showAmbassadorModal && selectedAmbassadorMember && (
              <BrandAmbassadorCard
                member={selectedAmbassadorMember}
                onClose={() => {
                  setShowAmbassadorModal(false);
                  setSelectedAmbassadorMember(null);
                }}
                onSuccess={() => {
                  // Refresh members list to reflect new tier
                  fetchMembers();
                  setShowAmbassadorModal(false);
                  setSelectedAmbassadorMember(null);
                  alert('🎉 品牌大使申請成功！已更新會員職級。');
                }}
              />
            )}
    </div>
  );
}

export default function AdminMembers() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>}>
      <AdminMembersContent />
    </Suspense>
  );
}
