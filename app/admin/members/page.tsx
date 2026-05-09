"use client";

import { useEffect, useState, Suspense } from "react";
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
  Award
} from "lucide-react";
import Link from "next/link";
import { exportToCsv } from "@/utils/exportCsv";

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    tier: "一般會員",
    is_b2b: false,
    balanceAdjustment: "",
    pointsAdjustment: "",
    adjustmentReason: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const auth = sessionStorage.getItem("churun_admin_auth");
    if (auth !== "true") {
      router.replace("/admin");
      return;
    }
    setIsAdmin(true);
    fetchMembers();
  }, [router]);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (members.length === 0) return;
    
    const exportData = members.map(m => ({
      '註冊日期': new Date(m.created_at).toLocaleString(),
      '會員代碼': m.member_code,
      '推薦人代碼': m.inviter_code || '無',
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
        tier: editForm.tier,
        is_b2b: editForm.is_b2b,
        balanceAdjustment: editForm.balanceAdjustment ? Number(editForm.balanceAdjustment) : 0,
        pointsAdjustment: editForm.pointsAdjustment ? Number(editForm.pointsAdjustment) : 0,
        adjustmentReason: editForm.adjustmentReason
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
         <button onClick={handleExport} className="flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-[1.5rem] hover:bg-indigo-600 transition shadow-lg shadow-indigo-500/20 text-[10px] font-black uppercase tracking-widest">
            <Download className="w-4 h-4" /> 匯出名單 (CSV)
         </button>
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
                    <th className="p-6">代碼與推薦人</th>
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
                                  <p className="text-sm font-black text-slate-800">{m.name}</p>
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
                               <p className="text-[9px] font-bold text-slate-400">推薦人: {m.inviter_code || '無'}</p>
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
                                  tier: m.tier || "一般會員",
                                  is_b2b: !!m.is_b2b,
                                  balanceAdjustment: "",
                                  pointsAdjustment: "",
                                  adjustmentReason: ""
                                });
                                setErrorMessage("");
                                setShowEditModal(true);
                              }}
                              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition shadow-md shadow-slate-900/10 active:scale-95"
                            >
                               編輯帳戶 ⚙️
                            </button>
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
