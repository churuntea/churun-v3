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
  Crown
} from "lucide-react";
import Link from "next/link";
import { exportToCsv } from "@/utils/exportCsv";

function AdminMembersContent() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
      '可用餘額': m.virtual_balance || 0,
      '團隊累積業績': m.team_total_sales || 0,
      '直推累積業績': m.direct_total_sales || 0
    }));

    exportToCsv(`初潤_會員名單_${new Date().toISOString().split('T')[0]}.csv`, exportData);
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
               <h1 className="text-xl font-black tracking-tight">會員總覽名單</h1>
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Members Directory</p>
            </div>
         </div>
         <button onClick={handleExport} className="flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-[1.5rem] hover:bg-indigo-600 transition shadow-lg shadow-indigo-500/20 text-[10px] font-black uppercase tracking-widest">
            <Download className="w-4 h-4" /> 匯出名單 (CSV)
         </button>
      </nav>

      <main className="max-w-7xl mx-auto p-10 space-y-10">
        
        {/* Search Bar */}
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
           <div className="bg-white px-8 py-3 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">總數</span>
             <span className="text-xl font-black text-indigo-600">{members.length}</span>
           </div>
        </div>

        {/* Members Table */}
        <div className="bg-white rounded-[3rem] border border-slate-50 shadow-sm overflow-hidden overflow-x-auto">
           <table className="w-full min-w-[800px] text-left border-collapse">
              <thead>
                 <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-6 pl-8">會員資訊</th>
                    <th className="p-6">身分職級</th>
                    <th className="p-6">代碼與推薦人</th>
                    <th className="p-6 text-right">可用餘額</th>
                    <th className="p-6 text-right">團隊業績</th>
                    <th className="p-6 pr-8 text-right">註冊時間</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {isLoading ? (
                   <tr>
                      <td colSpan={6} className="p-20 text-center">
                         <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                      </td>
                   </tr>
                 ) : filteredMembers.length === 0 ? (
                   <tr>
                      <td colSpan={6} className="p-20 text-center">
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
                           <p className="text-sm font-black text-slate-800">${Number(m.team_total_sales || 0).toLocaleString()}</p>
                        </td>
                        <td className="p-6 pr-8 text-right">
                           <p className="text-[10px] font-bold text-slate-400">{new Date(m.created_at).toLocaleDateString()}</p>
                        </td>
                     </motion.tr>
                   ))
                 )}
              </tbody>
           </table>
        </div>
      </main>
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
