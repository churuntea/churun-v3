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
  { val: "‰∏Ä?¨Ê???, label: "‰∏Ä?¨Ê???(?êË®≠)" },
  { val: "?ùÊΩ§ÂØ∂ÂØ∂", label: "?ùÊΩ§ÂØ∂ÂØ∂" },
  { val: "?ùÊΩ§ÂπºÂ???, label: "?ùÊΩ§ÂπºÂ??? },
  { val: "?ùÊΩ§Â∞èÊ???, label: "?ùÊΩ§Â∞èÊ??? },
  { val: "?ùÊΩ§?íÂ?Âπ?, label: "?ùÊΩ§?íÂ?Âπ? },
  { val: "?ùÊΩ§Â•ΩÊ???, label: "?ùÊΩ§Â•ΩÊ???(?àÂ§•?∑Á?)" },
  { val: "?ùÊΩ§?®Ë?", label: "?ùÊΩ§?®Ë? (?àÂ§•?∑Á?)" },
  { val: "?ùÊΩ§?•Â∑±", label: "?ùÊΩ§?•Â∑± (?ÅÁ?Â§ß‰Ωø?∑Á?)" },
  { val: "?ùÊΩ§?àÈ?‰º¥‰æ∂", label: "?ùÊΩ§?àÈ?‰º¥‰æ∂ (?ÅÁ?Â§ß‰Ωø?∑Á?)" },
  { val: "invited_team", label: "?ùÊΩ§?πÈ???(invited_team)" },
  { val: "partner", label: "?µÊ•≠Â§•‰º¥?àÂ§•‰∫?(partner)" },
  { val: "ambassador", label: "?ÅÁ??®Âª£Â§ß‰Ωø (ambassador)" }
];

function AdminAmbassadorListContent() {
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
    tier: "‰∏Ä?¨Ê???,
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
        .select("*, upline:upline_id(id, name, member_code, phone), downlines:members!upline_id(id)")
        .in('tier', ['ambassador', '?ùÊΩ§?ÅÁ?Â§ß‰Ωø', '?ùÊΩ§?•Â∑±', '?ùÊΩ§?àÈ?‰º¥‰æ∂'])
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
      'Ë®ªÂ??•Ê?': new Date(m.created_at).toLocaleString(),
      '?ÉÂì°Á∑®Ë?': m.member_code || '',
      '?®Ëñ¶‰∫∫Â???: m.upline?.name || '??,
      '?®Ëñ¶‰∫∫‰ª£Á¢?: m.upline?.member_code || '??,
      'ÂßìÂ?': m.name,
      '?ªË©±': m.phone,
      '‰ø°ÁÆ±': m.email || '',
      '?∑Á?': m.tier === 'partner' || m.tier === '?ùÊΩ§Â•ΩÊ??? || m.tier === '?ùÊΩ§?®Ë?' ? '?àÂ§•‰∫? :
             m.tier === 'ambassador' || m.tier === '?ùÊΩ§?ÅÁ?Â§ß‰Ωø' || m.tier === '?ùÊΩ§?•Â∑±' || m.tier === '?ùÊΩ§?àÈ?‰º¥‰æ∂' ? '?ÅÁ?Â§ß‰Ωø' :
             m.tier === 'invited_team' || m.tier === '?ùÊΩ§?πÈ??? ? '?ùÊΩ§?πÈ??? : '‰∏Ä?¨Ê???,
      'ÂØ¶È??∑Á?': m.tier || '‰∏Ä?¨Ê???,
      '?ØÁî®È§òÈ?': m.virtual_balance || 0,
      '?ØÁî®Á¥ÖÂà©ÈªûÊï∏': m.points_balance || 0,
      '?¥Êé®‰∫∫Êï∏': m.downlines ? m.downlines.length : 0,
      '?òÈ?Á¥ØÁ?Ê•≠Á∏æ': m.team_total_sales || 0,
      '?¥Êé®Á¥ØÁ?Ê•≠Á∏æ': m.direct_total_sales || 0
    }));

    exportToCsv(`?ùÊΩ§_?ÅÁ?Â§ß‰Ωø?çÂñÆ_${new Date().toISOString().split('T')[0]}.csv`, exportData);
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

      // ‰∏≤Êé• API ?≤Ë?ÂæåÁ´Ø?πÊ??∞Â??áÊó•Ë™åÂØ´??
      const res = await fetch("/api/admin/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        alert("?? Â∏≥Êà∂?∞Â?ÂÆåÂÖ®?êÂ?ÔºÅÁï∞?ïË??ÑË?Â∞çÂ∏≥?ÆÂ∑≤ÂØ´ÂÖ•?≤Á´Ø?∏Ê???);
        fetchMembers();
      } else {
        setErrorMessage(data.error || "?≤Â?ËÆäÊõ¥Â§±Ê?");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Á∂≤Ë∑ØË´ãÊ??ØË™§Ôº? + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember || !adminUser) return;
    if (adminUser.title !== 'Á∏ΩÁ??? && adminUser.title !== 'Ë∂ÖÁ?ÁÆ°Á???) {
      alert("?? Ê¨äÈ?‰∏çË∂≥ÔºÅÂè™?âÊ?È´òÁÆ°?ÜÂì°ÔºàÁ∏ΩÁ∂ìÁ?/Ë∂ÖÁ?ÁÆ°Á??°Ô??âÊ??∑Ë??™Èô§Á®ãÂ???);
      return;
    }

    const firstConfirm = confirm(`?ö® Ë≠¶Â?ÔºöÊÇ®?≥Â?Ê∞∏‰??™Èô§?ÉÂì°??{selectedMember.name}?çÁ?Â∏≥Êà∂ÔºÅ\nÊ≠§Ê?‰ΩúÊ?Â∞áË©≤?ÉÂì°?ÑÈå¢?ÖÈ?È°ç„ÄÅÁ??©È??∏„ÄÅË??ÆÊ?Á¥∞„ÄÅ‰∫§?ìÁ??ÑÁ??åÊ??âÁõ∏?úË??ô„ÄçÂú®Ë≥áÊ?Â∫´‰∏≠ÂÆâÂÖ®Ê∞∏‰??πÈô§Ôºå‰??°Ê??ûÂæ©ÔºÅ\n\n?®Á¢∫ÂÆöË?ÁπºÁ??éÔ?`);
    if (!firstConfirm) return;

    const secondConfirm = prompt(`??Ë´ãËº∏?•Ê??°Á?ÂßìÂ???{selectedMember.name}?ç‰ª•Á¢∫Ë??àÊ??™Èô§Ôºö`);
    if (secondConfirm !== selectedMember.name) {
      alert("??È©óË?ÂßìÂ?‰∏çÁ¨¶ÔºåÂ∑≤?ñÊ??™Èô§Á®ãÂ???);
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
        alert("?? ?ÉÂì°?? + selectedMember.name + "?çÊ??âÁõ∏?úË??ôÂ∑≤?êÂ?ÂæûÈõ≤Á´ØË??ôÂ∫´ÂÆâÂÖ®Ê∞∏‰??πÈô§Ôº?);
        fetchMembers();
      } else {
        setErrorMessage(data.error || "?™Èô§?ÉÂì°Â§±Ê?");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Á∂≤Ë∑Ø?ØË™§Ôº? + err.message);
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
            
            <div>
               <h1 className="text-xl font-black tracking-tight flex items-center gap-2"><Crown className="w-6 h-6 text-amber-500" /> ?ÅÁ?Â§ß‰ΩøÁ∏ΩË¶Ω?áÂ∏≥?∂ÁÆ°??/h1>
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Brand Ambassadors Directory</p>
            </div>
         </div>
         <div className="flex gap-3">
               <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Â∑≤Âà™?§Â??ÆÁ∏ΩË¶?
            
            <button onClick={handleExport} className="flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-[1.5rem] hover:bg-indigo-600 transition shadow-lg shadow-indigo-500/20 text-[10px] font-black uppercase tracking-widest active:scale-95 cursor-pointer">
               <Download className="w-4 h-4" /> ?ØÂá∫?çÂñÆ (CSV)
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
                placeholder="?úÂ?ÂßìÂ??ÅÈõªË©±Ê??ÉÂì°‰ª?¢º..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-100 p-6 pl-16 rounded-[2rem] text-sm font-bold focus:ring-2 focus:ring-indigo-500/5 transition shadow-sm"
              />
           </div>
           <div className="bg-white px-8 py-3 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center shrink-0">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Á∏ΩÊï∏</span>
             <span className="text-xl font-black text-indigo-600">{members.length}</span>
           </div>
        </div>

        {/* Members Table */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden overflow-x-auto relative z-10">
           <div className="absolute inset-0 bg-gradient-to-b from-amber-50/50 to-transparent pointer-events-none" />
           <table className="w-full min-w-[1100px] text-left border-collapse relative">
              <thead>
<tr className="border-b border-slate-100/50 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white/50 backdrop-blur-md">
                    <th className="p-6 pl-8">?ÉÂì°Ë≥áË?</th>
                    <th className="p-6">Ë∫´‰ªΩ?∑Á?</th>
                    <th className="p-6">?ÉÂì°Á∑®Ë??áÊé®?¶‰∫∫</th>
                    <th className="p-6 text-right">?ØÁî®È§òÈ?</th>
                    <th className="p-6 text-right">Á¥ÖÂà©ÈªûÊï∏</th>
                    <th className="p-6 text-center">?¥Êé®‰∫∫Êï∏</th>
                    <th className="p-6 text-right">?òÈ?Á¥ØÁ?Ê•≠Á∏æ</th>
                    <th className="p-6 pr-8 text-right">ÁÆ°Á??ç‰?</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {isLoading ? (
                    <tr>
                       <td colSpan={8} className="p-20 text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                       </td>
                    </tr>
                 ) : filteredMembers.length === 0 ? (
                    <tr>
                       <td colSpan={8} className="p-20 text-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                             <Users className="w-8 h-8 text-slate-200" />
                          </div>
                          <p className="text-sm font-bold text-slate-400">?ÆÂ?Ê≤íÊ?Á¨¶Â?Ê¢ù‰ª∂?ÑÊ???/p>
                       </td>
                    </tr>
                 ) : (
                    filteredMembers.map((m) => (
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
                                  <div className="flex items-center gap-2">
                                     <p className="text-sm font-black text-slate-800">{m.name}</p>
                                     {m.status === 'warning' && (
                                        <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded-md text-[8px] font-black tracking-widest uppercase flex items-center gap-0.5 border border-rose-200 shrink-0">
                                           ?†Ô? Ë≠¶Á§∫Â∏≥Êà∂
                                        </span>
                                     )}
                                     {m.status === 'exited' && (
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[8px] font-black tracking-widest uppercase flex items-center gap-0.5 border border-slate-200 shrink-0">
                                           ?î¥ Â∑≤ÈÄÄ??
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
                               (m.tier === 'partner' || m.tier === '?ùÊΩ§Â•ΩÊ??? || m.tier === '?ùÊΩ§?®Ë?') ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                               (m.tier === 'ambassador' || m.tier === '?ùÊΩ§?•Â∑±' || m.tier === '?ùÊΩ§?àÈ?‰º¥‰æ∂') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                               (m.tier === 'invited_team' || m.tier === '?ùÊΩ§?πÈ???) ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                               'bg-slate-100 text-slate-500'
                            }`}>
                               {(m.tier === 'partner' || m.tier === '?ùÊΩ§Â•ΩÊ??? || m.tier === '?ùÊΩ§?®Ë?') && <Crown className="w-3 h-3" />}
                               {
                                 (m.tier === 'partner' || m.tier === '?ùÊΩ§Â•ΩÊ??? || m.tier === '?ùÊΩ§?®Ë?') ? '?àÂ§•‰∫? :
                                 (m.tier === 'ambassador' || m.tier === '?ùÊΩ§?ÅÁ?Â§ß‰Ωø' || m.tier === '?ùÊΩ§?•Â∑±' || m.tier === '?ùÊΩ§?àÈ?‰º¥‰æ∂') ? '?ÅÁ?Â§ß‰Ωø' :
                                 (m.tier === 'invited_team' || m.tier === '?ùÊΩ§?πÈ???) ? '?ùÊΩ§?πÈ??? : '‰∏Ä?¨Ê???
                               }
                            </span>
                            <span className="text-[8px] font-mono font-bold block text-slate-400 mt-1 opacity-60">[{m.tier || "‰∏Ä?¨Ê???}]</span>
                         </td>
                         <td className="p-6">
                            <div className="space-y-1">
                               <p className="text-xs font-mono font-bold text-indigo-600">{m.member_code}</p>
                               <p className="text-[9px] font-bold text-slate-400">
                                 ?®Ëñ¶‰∫? {m.upline ? `${m.upline.name} (${m.upline.member_code || '?°‰ª£Á¢?})` : '??}
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
     <div className="inline-flex items-center gap-1.5 bg-indigo-50/80 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-100/50">
        <Users className="w-3.5 h-3.5" />
        <span className="text-xs font-black">{m.downlines ? m.downlines.length : 0}</span>
     </div>
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
                                  tier: m.tier || "‰∏Ä?¨Ê???,
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
                               Á∑®ËºØÂ∏≥Êà∂ ?ôÔ?
                            </button>
                            {canApplyForAmbassador(m) && m.tier !== 'ambassador' && (
                              <button
                                onClick={() => {
                                  setSelectedAmbassadorMember(m);
                                  setShowAmbassadorModal(true);
                                }}
                                className="ml-2 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold"
                              >
                                ?≥Ë??ÅÁ?Â§ß‰Ωø
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
                        <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">?ÉÂì°Â∏≥Êà∂Á∏ΩÈÉ®?ßÂà∂?¢Êùø</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Admin Member Control Desk</p>
                     </div>
                  </div>
                  <button 
                    disabled={isSaving} 
                    onClick={() => setShowEditModal(false)} 
                    className="w-8 h-8 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 transition text-sm font-bold"
                  >
                    ??
                  </button>
               </div>

               {errorMessage && (
                  <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-xs font-bold text-rose-600">
                     ?†Ô? {errorMessage}
                  </div>
               )}

               <form onSubmit={handleSaveChanges} className="space-y-6">
                  {/* Basic Profile Editing Grid */}
                  <div className="space-y-4">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">?? ?∫Êú¨?ã‰∫∫Ë≥áÊ?Ë®≠Â?</span>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 ml-1">?ÉÂì°ÂßìÂ?</label>
                           <input 
                             type="text" 
                             value={editForm.name} 
                             onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                             className="w-full bg-slate-50 border-none p-4 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none"
                             required
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 ml-1">?ØÁµ°?ªË©±</label>
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
                           <label className="text-[9px] font-black text-slate-400 ml-1">?ªÂ?‰ø°ÁÆ± (?∏Â°´)</label>
                           <input 
                             type="email" 
                             value={editForm.email} 
                             onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                             className="w-full bg-slate-50 border-none p-4 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none"
                             placeholder="?™Ë®≠ÂÆö‰ø°ÁÆ?
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 ml-1">?ÉÂì°Á∑®Ë? {adminUser?.title !== 'Á∏ΩÁ??? && adminUser?.title !== 'Ë∂ÖÁ?ÁÆ°Á??? && "(?ÖÈ??ÄÈ´òÁÆ°?ÜÂì°‰øÆÊîπ)"}</label>
                           <input 
                             type="text" 
                             value={editForm.member_code} 
                             onChange={e => setEditForm(prev => ({ ...prev, member_code: e.target.value }))}
                             disabled={adminUser?.title !== 'Á∏ΩÁ??? && adminUser?.title !== 'Ë∂ÖÁ?ÁÆ°Á???}
                             className={`w-full border-none p-4 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none ${adminUser?.title !== 'Á∏ΩÁ??? && adminUser?.title !== 'Ë∂ÖÁ?ÁÆ°Á??? ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-amber-50 text-amber-900'}`}
                             placeholder="‰æãÂ?ÔºöCR24M0101123"
                             required
                           />
                        </div>
                     </div>
                  </div>

                  {/* Tier & B2B Partner Selector */}
                  <div className="space-y-4 pt-2">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">?? ?éÁ??∑Â?Ë™øÂ?</span>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 ml-1">?∂Â??ùÊΩ§?∑Á?</label>
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
                              <span className="text-xs font-bold text-slate-700">?üÁî® B2B ?àÂ§•?òÈ?Ë≥áÊ†º</span>
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

                  {/* ?ë• ?®Ëñ¶?ú‰?Ë®≠Â? */}
                  <div className="space-y-4 pt-2">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">?ë• ?®Ëñ¶?ú‰?Ë®≠Â?</span>
                     <div className="bg-slate-50 p-5 rounded-2xl space-y-4 border border-slate-100/50">
                        <div className="flex items-center justify-between">
                           <div className="space-y-1">
                              <span className="text-[8px] font-black text-slate-400 block uppercase">?∂Â??®Ëñ¶‰∫?/span>
                              <p className="text-xs font-bold text-slate-700">
                                 {selectedUplineId ? (
                                    uplineSearchResult && uplineSearchResult.id === selectedUplineId ? (
                                       `${uplineSearchResult.name} (${uplineSearchResult.member_code || uplineSearchResult.phone || '?°‰ª£Á¢?})`
                                    ) : (
                                       "Â∑≤ÈÅ∏?áÊñ∞?®Ëñ¶‰∫?(Ë¶ã‰???"
                                    )
                                 ) : (
                                    <span className="text-slate-400 font-bold">?°Êé®?¶‰∫∫ (Á≥ªÁµ±?êË®≠)</span>
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
                                 ??Ê∏ÖÈô§?®Ëñ¶‰∫?
                              </button>
                           )}
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-slate-200/50 relative">
                           <label className="text-[9px] font-black text-slate-400 ml-1">?úÂ?‰∏¶Ë??¥Êé®?¶‰∫∫ (Ëº∏ÂÖ•‰ª?¢º?ñÊ?Ê©üË?Á¢?</label>
                           <div className="relative">
                              <input
                                 type="text"
                                 value={uplineSearch}
                                 onChange={e => {
                                    const val = e.target.value;
                                    setUplineSearch(val);
                                 }}
                                 placeholder="‰æ? CR26M311991 ??0912345678"
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
                                       ???æ‰??∞Ë©≤?®Ëñ¶‰∫∫Ô?Ë´ãÁ¢∫Ë™ç‰ª£Á¢ºÊ??ãÊ??üÁ¢º?ØÂê¶Ê≠?¢∫
                                    </p>
                                 )}
                                 {uplineSearchResult && uplineSearchResult.error === "self" && (
                                    <p className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                                       ?†Ô? ‰∏çËÉΩÂ∞áÊ??°Ëá™Â∑±Ë®≠?∫Ëá™Â∑±Á??®Ëñ¶‰∫∫Ô?
                                    </p>
                                 )}
                                 {uplineSearchResult && !uplineSearchResult.error && uplineSearchResult.id && (
                                    <div className="flex items-center justify-between bg-emerald-50/50 border border-emerald-100/50 p-2.5 rounded-xl mt-2">
                                       <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                          ???æÂà∞?®Ëñ¶‰∫∫Ô?{uplineSearchResult.name} ({uplineSearchResult.member_code || '?°‰ª£Á¢?})
                                       </p>
                                       {selectedUplineId !== uplineSearchResult.id && (
                                          <button
                                             type="button"
                                             onClick={() => {
                                                setSelectedUplineId(uplineSearchResult.id);
                                             }}
                                             className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[8px] font-black tracking-widest uppercase transition"
                                          >
                                             Â•óÁî®ËÆäÊõ¥ ??
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
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">?í∞ Ë≥áÈ??áÈ??∏Ë™øÂ∫?(?ôÁ©∫‰ª?°®‰∏çÁï∞??</span>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 ml-1">?ØÁî®?êÊî∂Ê¨æÂÑ≤????ô§?ëÈ? (NT$)</label>
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
                             placeholder="‰æ? 5000 ??-1000"
                           />
                           <span className="text-[8px] font-bold text-slate-400 block ml-1">?æÊ?È§òÈ?: ${Number(selectedMember.virtual_balance || 0).toLocaleString()}</span>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 ml-1">Á¥ÖÂà©ÈªûÊï∏Ë™øÊï¥ (Points)</label>
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
                             placeholder="‰æ? 200 ??-50"
                           />
                           <span className="text-[8px] font-bold text-slate-400 block ml-1">?æÊ?ÈªûÊï∏: {Number(selectedMember.points_balance || 0).toLocaleString()} pt</span>
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 ml-1">Ë≥áÈ??∞Â??üÂ?/?ôË®ª (?•Ê??∞Â?ÔºåÊ≠§Ê¨ÑÁÇ∫ÂøÖÂ°´)</label>
                        <input 
                          type="text" 
                          value={editForm.adjustmentReason} 
                          onChange={e => setEditForm(prev => ({ ...prev, adjustmentReason: e.target.value }))}
                          className="w-full bg-slate-50 border-none p-4 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none"
                          placeholder="‰æãÂ?ÔºöÊ??ïÂ?È°ç„ÄÅÂÖ•?ÉË??ëÊ??µ„ÄÅÊ∏¨Ë©¶Â∏≥?∂Ë™ø??
                          required={!!editForm.balanceAdjustment || !!editForm.pointsAdjustment}
                        />
                     </div>
                  </div>

                  {/* ?õ°Ô∏??ÄÈ´òÁÆ°?ÜÊ??êÂ??Ä (?êÁ∏ΩÁ∂ìÁ?/Ë∂ÖÁ?ÁÆ°Á??? */}
                  {(adminUser?.title === 'Á∏ΩÁ??? || adminUser?.title === 'Ë∂ÖÁ?ÁÆ°Á???) && (
                     <div className="space-y-4 pt-4 border-t border-rose-100/50">
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block ml-1">?õ°Ô∏??ÄÈ´òÁÆ°?ÜÊ??êÂ??Ä (?êÁ∏ΩÁ∂ìÁ?/Ë∂ÖÁ?ÁÆ°Á???</span>
                        <div className="bg-rose-50/20 p-5 rounded-[2rem] space-y-4 border border-rose-100/30">
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Status Selector */}
                              <div className="space-y-1.5">
                                 <label className="text-[9px] font-black text-slate-500 ml-1">Â∏≥Êà∂?ã‰??Ä??/label>
                                 <select 
                                   value={editForm.status || "active"} 
                                   onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                                   className="w-full bg-white border border-rose-100 p-4 rounded-xl text-xs font-bold focus:ring-2 focus:ring-rose-500/10 outline-none cursor-pointer text-slate-800"
                                 >
                                    <option value="active">?ü¢ Ê≠?∏∏?ã‰? (Active)</option>
                                    <option value="warning">?†Ô? Ë≠¶Á§∫Â∏≥Êà∂ (Warning)</option>
                                    <option value="exited">?î¥ Â∑≤ÈÄÄ??(Exited)</option>
                                 </select>
                              </div>

                              {/* Permanent Delete Button */}
                              <div className="space-y-1.5 flex flex-col justify-end">
                                 <button
                                    type="button"
                                    onClick={handleDeleteMember}
                                    className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black tracking-widest uppercase transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/10 active:scale-95 cursor-pointer"
                                 >
                                    ?ö® Ê∞∏‰??™Èô§Ë©≤Ê??°Ë???
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
                        ?ñÊ?ËøîÂ?
                     </button>
                     <button 
                       type="submit"
                       disabled={isSaving}
                       className="flex-1 py-4 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-black text-[10px] uppercase tracking-widest transition shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
                     >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Á¢∫Ë??≤Â?‰øÆÊîπ ??}
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
                  alert('?? ?ÅÁ?Â§ß‰Ωø?≥Ë??êÂ?ÔºÅÂ∑≤?¥Êñ∞?ÉÂì°?∑Á???);
                }}
              />
            )}
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
