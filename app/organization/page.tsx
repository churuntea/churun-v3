"use client";

import { useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from '@/app/supabase';
import { sendAmbassadorApplicationNotify } from '../api/ambassador/ambassador-notify';
import { TAIWAN_CITIES } from './taiwan-cities';
import { 
  Users, 
  ChevronRight, 
  LayoutDashboard, 
  ShoppingBag, 
  Plus, 
  Zap, 
  User, 
  XCircle,
  Loader2,
  TrendingUp,
  Award,
  Share2,
  Activity,
  Target,
  Sparkles,
  Trophy,
  Heart,
  UserPlus,
  BarChart3,
  X,
  Crown,
  Star,
  ArrowRight,
  CheckCircle2,
  Camera,
  Shield,
  Eye
} from "lucide-react";
import ReferralCard from "@/components/ReferralCard";
import TeamTree from "@/components/TeamTree";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

// 階級配置 (依照 2026/05/04 更新之職級榮耀殿堂表)
const TIERS = [
  { name: '初潤靈魂伴侶', upgradeAmount: 50000 },
  { name: '初潤知己', upgradeAmount: 25000 },
  { name: '初潤閨蜜', upgradeAmount: 12000 },
  { name: '初潤好朋友', upgradeAmount: 6000 },
  { name: '初潤青少年', upgradeAmount: 3000 },
  { name: '初潤小朋友', upgradeAmount: 1500 },
  { name: '初潤幼兒園', upgradeAmount: 1 },
  { name: '初潤最高階合夥人', upgradeAmount: 298000 }
];

const applyWatermark = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(e.target?.result as string);
        
        ctx.drawImage(img, 0, 0);
        
        const text = "僅供初潤申請資料使用";
        const fontSize = Math.max(36, Math.floor(canvas.width / 12));
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)"; 
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((-15 * Math.PI) / 180);
        
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
        ctx.strokeText(text, 0, 0);
        ctx.fillText(text, 0, 0);
        
        ctx.restore();
        
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
};

const TIER_SORT_ORDER: Record<string, number> = {
  '初潤靈魂伴侶': 0,
  '靈魂伴侶': 0,
  '初潤知己': 1,
  '知己': 1,
  '初潤閨蜜': 2,
  '閨蜜': 2,
  '初潤好朋友': 3,
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

function TeamPerformanceChart({ data }: { data: any[] }) {
  const chartData = data.slice(0, 5).map(m => ({
    name: m.name.length > 4 ? m.name.substring(0, 4) + '...' : m.name,
    amount: Number(m.lifetime_spend) || 0
  }));

  if (chartData.length === 0) return null;

  return (
    <div className="h-64 w-full bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm">
       <div className="flex items-center justify-between mb-6">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <BarChart3 className="w-4 h-4 text-emerald-500" /> 核心夥伴表現
          </h4>
          <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">TOP 5 PERFORMANCE</span>
       </div>
       <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
             <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="0%" stopColor="#064e3b" stopOpacity={1}/>
                   <stop offset="100%" stopColor="#059669" stopOpacity={0.8}/>
                </linearGradient>
             </defs>
             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
             <XAxis 
               dataKey="name" 
               axisLine={false} 
               tickLine={false} 
               tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
             />
             <Tooltip 
               cursor={{ fill: '#f8fafc' }}
               contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: '10px', fontWeight: '900' }}
             />
             <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={24}>
                {chartData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill="url(#barGradient)" />
                ))}
             </Bar>
          </BarChart>
       </ResponsiveContainer>
    </div>
  );
}

// 可申請品牌大使的職級門檻（初潤知己以上）
const AMBASSADOR_ELIGIBLE_TIERS = new Set([
  '初潤靈魂伴侶', '靈魂伴侶',
  '初潤知己', '知己'
]);

function OrganizationContent() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [downlines, setDownlines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextTier, setNextTier] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAmbassadorModal, setShowAmbassadorModal] = useState(false);
  const [selectedApplyType, setSelectedApplyType] = useState<'free' | 'paid' | 'partner' | null>(null);
  const [ambassadorFormData, setAmbassadorFormData] = useState({ 
    name: '', phone: '', email: '', 
    birthday: '', id_card_number: '', 
    city: '', district: '', address: '', 
    landline: '', company: '', company_phone: '', notes: '',
    last_five: '', remittance_photo: '', id_card_front: '', id_card_back: '' 
  });
  const [isSubmittingAmbassador, setIsSubmittingAmbassador] = useState(false);
  const [pendingApplication, setPendingApplication] = useState<any | null>(null);
  const [rejectedApplication, setRejectedApplication] = useState<any | null>(null);
  const [ambassadorError, setAmbassadorError] = useState("");
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    setCurrentUserId(savedId);
  }, [router]);

  const fetchOrganization = async (userId: string) => {
    setIsLoading(true);
    const { data: mData } = await supabase.from("members").select("*").eq("id", userId).single();
    setMemberInfo(mData);

    if (mData?.ambassador_status === 'pending') {
      const { data: appData } = await supabase.from("ambassador_applications").select("*").eq("member_id", userId).eq("status", "pending").order("created_at", { ascending: false }).limit(1).single();
      setPendingApplication(appData);
    }

    const { data } = await supabase
      .from("members")
      .select("*")
      .eq("upline_id", userId)
      .order("created_at", { ascending: false });

    const sorted = (data || []).sort((a, b) => {
      const orderA = TIER_SORT_ORDER[a.tier] ?? 99;
      const orderB = TIER_SORT_ORDER[b.tier] ?? 99;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    setDownlines(sorted);
    calculateProgress(mData, data || []);
    setIsLoading(false);
  };

  const filteredDownlines = downlines.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (d.member_code && d.member_code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const calculateProgress = (me: any, team: any[]) => {
    const currentTierIdx = TIERS.findIndex(t => t.name === me.tier);
    if (currentTierIdx > 0) {
      const target = TIERS[currentTierIdx - 1];
      setNextTier(target);
      
      // 升級進度依據「終身累積金額」
      const currentVal = Number(me.lifetime_spend) || 0;
      const p = Math.min(Math.round((currentVal / target.upgradeAmount) * 100), 100);
      setProgress(p);
    }
  };

  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [selectedLeaderboardTier, setSelectedLeaderboardTier] = useState<string | null>(null);

  const getTierCount = (tierName: string) => {
    return downlines.filter(d => d.tier === tierName).length;
  };

  const getTierMembers = (tierName: string) => {
    return downlines.filter(d => d.tier === tierName);
  };

  const getTop10Members = (tierName: string) => {
    return downlines
      .filter(d => d.tier === tierName)
      .sort((a, b) => (Number(b.lifetime_spend) || 0) - (Number(a.lifetime_spend) || 0))
      .slice(0, 10);
  };

  useEffect(() => {
    if (currentUserId) fetchOrganization(currentUserId);
  }, [currentUserId]);

  const openAmbassadorModal = () => {
    if (memberInfo) {
      setAmbassadorFormData({
        name: memberInfo.name || '',
        phone: memberInfo.phone || '',
        email: memberInfo.email || '',
        birthday: memberInfo.birthday || '',
        id_card_number: memberInfo.id_card_number || '',
        city: memberInfo.city || '',
        district: memberInfo.district || '',
        address: memberInfo.address || '',
        landline: memberInfo.landline || '',
        company: memberInfo.company || '',
        company_phone: memberInfo.company_phone || '',
        notes: memberInfo.notes || '',
        last_five: '',
        remittance_photo: '',
        id_card_front: '',
        id_card_back: ''
      });
    }
    setSelectedApplyType(null);
    setAmbassadorError("");
    setShowAmbassadorModal(true);
  };

  const checkAndSubmitAmbassador = async () => {
    if (!selectedApplyType) {
      setAmbassadorError("請選擇申請方案");
      return;
    }
    if (!ambassadorFormData.birthday || !ambassadorFormData.id_card_number || !ambassadorFormData.city || !ambassadorFormData.district || !ambassadorFormData.address) {
      setAmbassadorError("請填寫所有必填的詳細個人資料（包含生日、身分證字號與地址）");
      return;
    }
    if (!ambassadorFormData.id_card_front || !ambassadorFormData.id_card_back) {
      setAmbassadorError("請上傳身分證正反面照片");
      return;
    }
    if (selectedApplyType === 'paid' || selectedApplyType === 'partner') {
      if (!ambassadorFormData.last_five) {
        setAmbassadorError("請填寫匯款帳號後五碼");
        return;
      }
      if (!ambassadorFormData.remittance_photo) {
        setAmbassadorError("請上傳匯款水單照片");
        return;
      }
    }
    
    // Check if user changed info
    if (
      memberInfo && 
      (ambassadorFormData.name !== memberInfo.name || 
       ambassadorFormData.phone !== memberInfo.phone || 
       ambassadorFormData.email !== memberInfo.email)
    ) {
      setShowSyncConfirm(true);
      return;
    }

    await submitAmbassadorForm(false);
  };

  const submitAmbassadorForm = async (syncProfile: boolean) => {
    setIsSubmittingAmbassador(true);
    setAmbassadorError("");
    try {
      if (syncProfile) {
        // 先同步更新個人資料
        const resSync = await fetch('/api/member/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: currentUserId,
            name: ambassadorFormData.name,
            phone: ambassadorFormData.phone,
            email: ambassadorFormData.email
          })
        });
        if (!resSync.ok) {
           console.warn("同步個人資料失敗", await resSync.text());
        } else {
           // update local memberInfo
           setMemberInfo((prev: any) => ({
             ...prev,
             name: ambassadorFormData.name,
             phone: ambassadorFormData.phone,
             email: ambassadorFormData.email
           }));
        }
      }

      const res = await fetch('/api/ambassador/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: currentUserId,
          application_type: selectedApplyType,
          last_five: ambassadorFormData.last_five,
          remittance_photo: ambassadorFormData.remittance_photo,
          id_card_front: ambassadorFormData.id_card_front,
          id_card_back: ambassadorFormData.id_card_back
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || '申請失敗');
      
      // Update member status to show timeline
      setMemberInfo((prev: any) => ({ ...prev, ambassador_status: 'pending' }));
      
      setShowSyncConfirm(false);
      // keep modal open to show timeline, or we can close it, but since we have a timeline we shouldn't close it, wait... the original code closed it. Let's just alert and then user can see it next time, or we stay. 
      // Actually we will render the timeline IN the modal or in the page. The user says "這邊點選的連結要失效". Let's close modal and let the page update.
      setShowAmbassadorModal(false);
      alert('✅ 申請已送出！');
    } catch (e: any) {
      setAmbassadorError(e.message);
    } finally {
      setIsSubmittingAmbassador(false);
    }
  };

  if (isLoading && !memberInfo) return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-50 px-8 py-6 flex justify-between items-center max-w-lg mx-auto">
        <h1 className="text-sm font-black tracking-[0.3em] text-slate-800 uppercase">我的組織系統</h1>
        <div className="bg-emerald-50 px-4 py-2 rounded-2xl flex items-center gap-2">
           <Trophy className="w-4 h-4 text-emerald-600" />
           <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">{downlines.length} 夥伴</span>
        </div>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-8 mt-4">
        
        {/* Tier Distribution Summary */}
        <section className="space-y-4">
           <div className="flex justify-between items-center px-2">
              <h3 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">直推夥伴職級分佈</h3>
              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic">點擊查看成員明細</span>
           </div>
           <div className="grid grid-cols-2 gap-4">
              {TIERS.filter(t => getTierCount(t.name) > 0).map((tier) => (
                <motion.div 
                  key={tier.name}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTier(tier.name)}
                  className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm flex justify-between items-center cursor-pointer group"
                >
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{tier.name}</p>
                      <h4 className="text-2xl font-black text-slate-800">{getTierCount(tier.name)}</h4>
                   </div>
                   <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                   </div>
                </motion.div>
              ))}
              {downlines.length === 0 && (
                <div className="col-span-2 py-10 bg-white rounded-[2.5rem] border border-dashed border-slate-200 text-center">
                   <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">目前暫無直推夥伴</p>
                </div>
              )}
           </div>
        </section>

        {/* Tier Progress Radar */}
        <section className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20">
           <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-emerald-500 rounded-full blur-[100px] opacity-20"></div>
           <div className="relative z-10 space-y-8">
              <div className="flex justify-between items-start">
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">Current Tier</p>
                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                       {memberInfo?.tier} <Sparkles className="w-6 h-6 text-amber-400" />
                    </h2>
                 </div>
                 <div className="text-right space-y-2">
                    <div>
                       <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase">晉升進度</p>
                       <p className="text-2xl font-black text-white">{progress}%</p>
                    </div>
                    {/* 品牌大使申請按鈕：初潤知己(含)以上才顯示，且狀態不能是待審核 */}
                    {memberInfo && AMBASSADOR_ELIGIBLE_TIERS.has(memberInfo.tier) && memberInfo.ambassador_status !== 'pending' && (
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={openAmbassadorModal}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-amber-500/40 hover:shadow-amber-500/60 transition-all"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        申請品牌大使
                      </motion.button>
                    )}
                    {memberInfo?.ambassador_status === 'pending' && (
                      <div className="flex items-center justify-end gap-1.5 mt-2">
                        <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                        <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">申請審核中</span>
                      </div>
                    )}
                 </div>
              </div>

              {nextTier && (
                <div className="space-y-4">
                   <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300"
                      />
                   </div>
                    <p className="text-[10px] font-medium text-white/60 leading-relaxed italic">
                       目標：晉升至「{nextTier.name}」<br/>
                       達成條件：終身累積消費滿 ${nextTier.upgradeAmount.toLocaleString()} 元
                    </p>
                </div>
              )}
           </div>
        </section>

         {/* 申請進度追蹤器 */}
         {memberInfo?.ambassador_status === 'pending' && pendingApplication && (
           <section className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
             <div className="flex justify-between items-center mb-8 relative z-10">
               <div>
                 <h3 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase flex items-center gap-2">
                   <Activity className="w-4 h-4 text-emerald-500" /> 申請進度追蹤
                 </h3>
                 <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                   {pendingApplication.application_type === 'paid' ? '付費品牌大使' : pendingApplication.application_type === 'partner' ? '合夥人' : '績效品牌大使'}
                 </p>
               </div>
             </div>

             <div className="relative z-10 pl-4 border-l-2 border-emerald-100 space-y-6">
               <div className="relative">
                 <div className="absolute -left-[21px] top-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm ring-4 ring-emerald-50"></div>
                 <p className="text-xs font-black text-slate-800 mb-0.5">✅ 送出申請</p>
                 <p className="text-[10px] font-bold text-slate-400">{new Date(pendingApplication.created_at).toLocaleString()}</p>
               </div>

               {pendingApplication.application_type !== 'free' && (
                 <div className="relative">
                   <div className="absolute -left-[21px] top-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm ring-4 ring-emerald-50"></div>
                   <p className="text-xs font-black text-slate-800 mb-0.5">✅ 匯款資料已上傳</p>
                   <p className="text-[10px] font-bold text-slate-400">後五碼: {pendingApplication.last_five}</p>
                 </div>
               )}

               <div className="relative">
                 <div className="absolute -left-[21px] top-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white shadow-sm ring-4 ring-amber-50 animate-pulse"></div>
                 <p className="text-xs font-black text-amber-600 mb-0.5">⏳ 總部審核中</p>
                 <p className="text-[10px] font-bold text-amber-500/70">預計需要 3-5 個工作天，請留意 LINE 通知</p>
               </div>

               <div className="relative">
                 <div className="absolute -left-[21px] top-1 w-3 h-3 bg-slate-200 rounded-full border-2 border-white shadow-sm ring-4 ring-slate-50"></div>
                 <p className="text-xs font-black text-slate-400 mb-0.5">⚪ 核准生效</p>
                 <p className="text-[10px] font-bold text-slate-300">等待審核結果</p>
               </div>
             </div>
           </section>
         )}

         {/* 駁回通知 */}
         {rejectedApplication && memberInfo?.ambassador_status !== 'pending' && (
           <section className="bg-rose-50 border border-rose-100 rounded-[3rem] p-8 shadow-sm relative overflow-hidden">
             <div className="flex items-start gap-4 relative z-10">
               <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
                 <XCircle className="w-6 h-6 text-rose-500" />
               </div>
               <div>
                 <h3 className="text-sm font-black text-rose-800 uppercase tracking-widest">您的申請已被駁回</h3>
                 <p className="text-[10px] font-bold text-rose-400 mt-1 uppercase tracking-widest">
                   {rejectedApplication.application_type === 'paid' ? '付費品牌大使' : rejectedApplication.application_type === 'partner' ? '合夥人' : '績效品牌大使'}
                 </p>
                 <div className="mt-4 bg-white rounded-2xl p-4 border border-rose-100 shadow-sm">
                   <p className="text-xs font-black text-slate-800 mb-1">駁回理由與建議：</p>
                   <p className="text-xs font-medium text-slate-600 whitespace-pre-line">{rejectedApplication.notes || "未提供詳細理由，請聯繫客服了解詳情。"}</p>
                 </div>
                 <p className="text-[10px] font-bold text-rose-500 mt-4">請參考上述原因進行改善後，點擊上方「申請品牌大使」重新提交資料。</p>
               </div>
             </div>
           </section>
         )}

        {/* 職推購買力排行榜 - NEW & ENHANCED */}
        <section className="space-y-6">
           <div className="flex justify-between items-center px-4">
              <h3 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">職推購買力排行榜</h3>
              <div className="flex items-center gap-1">
                 <Trophy className="w-4 h-4 text-amber-500" />
                 <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Tier Leaders</span>
              </div>
           </div>
           
           <div className="space-y-4">
              {TIERS.map((tier) => {
                const tierMembers = downlines
                  .filter(d => d.tier === tier.name)
                  .sort((a, b) => (Number(b.lifetime_spend) || 0) - (Number(a.lifetime_spend) || 0));
                
                if (tierMembers.length === 0) return null;

                const top3 = tierMembers.slice(0, 3);

                return (
                  <motion.div 
                    key={tier.name}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      setSelectedLeaderboardTier(tier.name);
                    }}
                    className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-slate-50 rounded-full blur-2xl group-hover:bg-amber-50 transition-colors"></div>
                    
                    <div className="relative z-10 space-y-6">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tier.name}</p>
                          <h4 className="text-lg font-black text-slate-800 tracking-tight">
                            菁英排行榜 <span className="text-xs text-slate-300 ml-2">Total {tierMembers.length}</span>
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest group-hover:gap-4 transition-all">
                          查看 Top 10 <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {top3.map((m, idx) => (
                          <div key={m.id} className="flex justify-between items-center bg-slate-50/50 rounded-2xl px-5 py-3 group-hover:bg-white transition-colors">
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                                idx === 0 ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 text-slate-500'
                              }`}>
                                {idx + 1}
                              </span>
                              <span className="text-xs font-black text-slate-700">{m.name}</span>
                            </div>
                            <span className="text-xs font-black text-slate-900 font-mono">${Number(m.lifetime_spend || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
           </div>
        </section>

        {/* AI Performance Insights - Optimized */}
        <div className="grid grid-cols-2 gap-6">
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm space-y-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                      <Target className="w-4 h-4 text-amber-500" />
                   </div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">團隊業績</span>
                </div>
                <div className="space-y-1">
                   <p className="text-xl font-black text-slate-800 tracking-tighter">
                      ${downlines.filter(curr => curr.id !== memberInfo?.id).reduce((acc, curr) => acc + (Number(curr.lifetime_spend) || 0), 0).toLocaleString()}
                   </p>
                   <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-500" /> +12.5% 本月增長
                   </p>
                </div>
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm space-y-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                      <Activity className="w-4 h-4 text-indigo-500" />
                   </div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">團隊活力</span>
                </div>
                <div className="flex items-end gap-2">
                   <h4 className="text-2xl font-black text-slate-800">優良</h4>
                   <span className="text-[8px] font-black text-emerald-500 mb-1">STABLE</span>
                </div>
              </div>
           </div>
        </div>

         {/* Team Search & Performance Visualization */}
         <div className="space-y-6">
            <div className="relative group">
               <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors">
                  <Users className="w-5 h-5" />
               </div>
               <input 
                 type="text" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder="搜尋夥伴姓名或會員編號..." 
                 className="w-full bg-white border-2 border-transparent p-6 pl-16 rounded-[2rem] text-sm font-bold focus:outline-none focus:bg-white focus:border-emerald-900/5 transition-all shadow-sm"
               />
            </div>
         </div>
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
        {/* Team Stats Summary */}
        <section className="grid grid-cols-2 gap-6">
           <div className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm space-y-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                 <Users className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">團隊規模</p>
                 <h4 className="text-2xl font-black text-slate-800">{downlines.length} <span className="text-xs font-medium text-slate-400">人</span></h4>
              </div>
              <div className="flex gap-2">
                 <span className="text-[8px] font-black bg-indigo-50 text-indigo-500 px-2 py-1 rounded-full uppercase tracking-tighter">{downlines.filter(d => d.is_b2b).length} B2B</span>
                 <span className="text-[8px] font-black bg-slate-50 text-slate-400 px-2 py-1 rounded-full uppercase tracking-tighter">{downlines.filter(d => !d.is_b2b).length} B2C</span>
              </div>
           </div>
           
           <div className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm space-y-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                 <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">團隊總業績</p>
                 <h4 className="text-2xl font-black text-slate-800"><span className="text-sm font-medium text-slate-400">$</span>{downlines.filter(d => d.id !== memberInfo?.id).reduce((acc, d) => acc + (Number(d.lifetime_spend) || 0), 0).toLocaleString()}</h4>
              </div>
              <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1">
                 <Sparkles className="w-2 h-2 text-amber-400" /> Lifetime Performance
              </p>
           </div>
        </section>

        {/* Performance Chart */}
        <TeamPerformanceChart data={filteredDownlines} />
        </motion.section>

        {/* Team Tree Visualization */}
        <div className="pt-4">
           <TeamTree rootMember={memberInfo} />
        </div>

        {/* Invite CTA */}
        <motion.button 
           whileHover={{ scale: 1.02 }}
           whileTap={{ scale: 0.98 }}
           onClick={() => setIsCardOpen(true)}
           className="w-full bg-emerald-900 text-white py-8 rounded-[2.5rem] font-black text-sm tracking-[0.2em] hover:bg-emerald-800 transition shadow-2xl shadow-emerald-900/30 flex items-center justify-center gap-4 mt-8 group"
        >
           發送精品邀請函 <Share2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        </motion.button>

        <ReferralCard 
          isOpen={isCardOpen} 
          onClose={() => setIsCardOpen(false)} 
          memberInfo={memberInfo} 
        />

      </main>

      {/* Tier Details Modal */}
      <AnimatePresence>
        {selectedTier && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-2xl flex items-end justify-center"
            onClick={() => setSelectedTier(null)}
          >
             <motion.div 
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="bg-white w-full max-w-lg rounded-t-[3.5rem] p-10 shadow-2xl relative overflow-hidden"
               onClick={e => e.stopPropagation()}
             >
                <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-10"></div>
                
                <div className="flex justify-between items-center mb-8">
                   <div className="space-y-1">
                      <h3 className="text-2xl font-black text-slate-900">{selectedTier}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                         共有 {getTierMembers(selectedTier).length} 位核心夥伴
                      </p>
                   </div>
                   <button 
                     onClick={() => setSelectedTier(null)}
                     className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"
                   >
                      <X className="w-5 h-5" />
                   </button>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar pb-10">
                   {getTierMembers(selectedTier).map((m) => (
                     <div key={m.id} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-50 flex justify-between items-center group hover:bg-white hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                              <User className="w-5 h-5 text-slate-400" />
                           </div>
                           <div className="space-y-1">
                              <h4 className="font-bold text-slate-800">{m.name}</h4>
                              <p className="text-[10px] font-black text-emerald-600 tracking-widest">{m.member_code}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-black text-slate-900">${Number(m.lifetime_spend || 0).toLocaleString()}</p>
                           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">LIFETIME SPEND</p>
                        </div>
                     </div>
                   ))}
                </div>

                <button 
                  onClick={() => setSelectedTier(null)}
                  className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20"
                >
                   關閉明細
                </button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaderboard Top 10 Modal */}
      <AnimatePresence>
        {selectedLeaderboardTier && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-2xl flex items-end justify-center"
            onClick={() => setSelectedLeaderboardTier(null)}
          >
             <motion.div 
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="bg-white w-full max-w-lg rounded-t-[3.5rem] p-10 shadow-2xl relative overflow-hidden"
               onClick={e => e.stopPropagation()}
             >
                <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-10"></div>
                
                <div className="flex justify-between items-center mb-8">
                   <div className="space-y-1">
                      <h3 className="text-2xl font-black text-slate-900">{selectedLeaderboardTier}</h3>
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                         <Trophy className="w-3 h-3" /> 購買力排行榜 TOP 10
                      </p>
                   </div>
                   <button 
                     onClick={() => setSelectedLeaderboardTier(null)}
                     className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"
                   >
                      <X className="w-5 h-5" />
                   </button>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar pb-10 px-1">
                   {getTop10Members(selectedLeaderboardTier).map((m, idx) => (
                     <div key={m.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center group hover:bg-slate-50 transition-all">
                        <div className="flex items-center gap-5">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                             idx === 0 ? 'bg-amber-400 text-slate-900' : 
                             idx === 1 ? 'bg-slate-200 text-slate-600' :
                             idx === 2 ? 'bg-amber-100 text-amber-800' : 'bg-slate-50 text-slate-400'
                           }`}>
                              {idx + 1}
                           </div>
                           <div className="space-y-1">
                              <h4 className="font-black text-slate-800 text-sm">{m.name}</h4>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{m.member_code || 'Elite Member'}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-black text-slate-900 font-mono">${Number(m.lifetime_spend || 0).toLocaleString()}</p>
                           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">LIFETIME CONTRIBUTION</p>
                        </div>
                     </div>
                   ))}
                </div>

                <button 
                  onClick={() => setSelectedLeaderboardTier(null)}
                  className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20"
                >
                   返回組織中心
                </button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 品牌大使申請 Modal */}
      <AnimatePresence>
        {showAmbassadorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-slate-900/70 backdrop-blur-2xl flex items-end justify-center"
            onClick={() => setShowAmbassadorModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-lg rounded-t-[3.5rem] p-10 shadow-2xl relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* 金色光暈背景 */}
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-amber-400/15 rounded-full blur-3xl pointer-events-none"></div>
              <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8"></div>

              <div className="relative z-10">
                {/* 標題 */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-amber-500/30 flex-shrink-0">
                    <Crown className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-slate-900">申請品牌大使</h3>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Brand Ambassador Application</p>
                  </div>
                  <button
                    onClick={() => setShowAmbassadorModal(false)}
                    className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 申請資格確認 */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5 mb-6 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-emerald-800">申請資格確認</p>
                    <p className="text-[10px] font-bold text-emerald-600 mt-1 leading-relaxed">
                      您的現有職級「{memberInfo?.tier}」已達申請門檻（初潤知己以上）✨
                    </p>
                  </div>
                </div>

                {/* 申請方式選擇 */}
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">選擇申請方式</p>
                
                <div className="space-y-4 mb-8">
                  {/* 方式一：付費申請 */}
                  <div 
                    onClick={() => setSelectedApplyType('paid')}
                    className={`cursor-pointer rounded-3xl p-6 space-y-3 border-2 transition-all ${selectedApplyType === 'paid' ? 'bg-amber-50 border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-white border-slate-100 hover:border-amber-200'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedApplyType === 'paid' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-500'}`}>
                        <Star className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-slate-800 text-sm">付費升級（兩年資格）</p>
                        <p className={`text-[9px] font-bold uppercase tracking-widest ${selectedApplyType === 'paid' ? 'text-amber-600' : 'text-slate-400'}`}>Paid Upgrade</p>
                      </div>
                      <span className="text-lg font-black text-amber-600 flex-shrink-0">$98,000</span>
                    </div>
                  </div>

                  {/* 方式二：合夥人 */}
                  <div 
                    onClick={() => setSelectedApplyType('partner')}
                    className={`cursor-pointer rounded-3xl p-6 space-y-3 border-2 transition-all ${selectedApplyType === 'partner' ? 'bg-indigo-50 border-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedApplyType === 'partner' ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-500'}`}>
                        <Shield className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-slate-800 text-sm">申請成為合夥人（兩年資格）</p>
                        <p className={`text-[9px] font-bold uppercase tracking-widest ${selectedApplyType === 'partner' ? 'text-indigo-600' : 'text-slate-400'}`}>Partner Upgrade</p>
                      </div>
                      <span className="text-lg font-black text-indigo-600 flex-shrink-0">$298,000</span>
                    </div>
                  </div>

                  {/* 方式三：滾動式免費升級 */}
                  <div 
                    onClick={() => {
                      const score = ((Number(memberInfo?.lifetime_spend) || 0) / 2) + (downlines.reduce((acc, d) => acc + (Number(d.lifetime_spend) || 0), 0) / 2);
                      if (score >= 300000) {
                        setSelectedApplyType('free');
                      }
                    }}
                    className={`rounded-3xl p-6 space-y-3 border-2 transition-all ${selectedApplyType === 'free' ? 'bg-emerald-50 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-white border-slate-100'} ${(((Number(memberInfo?.lifetime_spend) || 0) / 2) + (downlines.reduce((acc, d) => acc + (Number(d.lifetime_spend) || 0), 0) / 2)) >= 300000 ? 'cursor-pointer hover:border-emerald-200' : 'opacity-60 cursor-not-allowed'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedApplyType === 'free' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-500'}`}>
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-slate-800 text-sm">累積業績免費升級（一年資格）</p>
                        <p className={`text-[9px] font-bold uppercase tracking-widest ${selectedApplyType === 'free' ? 'text-emerald-600' : 'text-slate-400'}`}>Performance Upgrade</p>
                      </div>
                      <span className="text-lg font-black text-emerald-600 flex-shrink-0">30萬積分</span>
                    </div>
                    <div className="pl-11">
                      <div className="bg-slate-50 rounded-xl px-4 py-3 text-[9px] font-black">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-slate-500">目前累積積分</span>
                          <span className="text-emerald-600">
                            {(((Number(memberInfo?.lifetime_spend) || 0) / 2) + (downlines.reduce((acc, d) => acc + (Number(d.lifetime_spend) || 0), 0) / 2)).toLocaleString()} / 300,000
                          </span>
                        </div>
                        <p className="text-[8px] text-slate-400 font-bold mb-2">積分計算 = (個人總消費/2) + (直推總消費/2)</p>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all"
                            style={{ width: `${Math.min((((Number(memberInfo?.lifetime_spend) || 0) / 2) + (downlines.reduce((acc, d) => acc + (Number(d.lifetime_spend) || 0), 0) / 2)) / 300000 * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 填寫表單區塊 */}
                {selectedApplyType && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 mb-8 overflow-hidden">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2 border-t border-slate-100">填寫申請資料</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400">會員姓名</label>
                        <input type="text" value={ambassadorFormData.name} onChange={e => setAmbassadorFormData({...ambassadorFormData, name: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold border border-slate-100 focus:border-emerald-500 outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400">聯絡電話</label>
                        <input type="text" value={ambassadorFormData.phone} onChange={e => setAmbassadorFormData({...ambassadorFormData, phone: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold border border-slate-100 focus:border-emerald-500 outline-none" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400">電子信箱</label>
                      <input type="email" value={ambassadorFormData.email} onChange={e => setAmbassadorFormData({...ambassadorFormData, email: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold border border-slate-100 focus:border-emerald-500 outline-none" />
                    </div>

                    <div className="space-y-1.5 mt-3">
                      <label className="text-[10px] font-black text-slate-400">出生年月日 <span className="text-rose-500">*</span></label>
                      <input type="date" value={ambassadorFormData.birthday} onChange={e => setAmbassadorFormData({...ambassadorFormData, birthday: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold border border-slate-100 focus:border-emerald-500 outline-none" />
                    </div>

                    <div className="space-y-1.5 mt-3">
                      <label className="text-[10px] font-black text-slate-400">身分證字號 <span className="text-rose-500">*</span></label>
                      <input type="text" placeholder="例如: A123456789" value={ambassadorFormData.id_card_number} onChange={e => setAmbassadorFormData({...ambassadorFormData, id_card_number: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold border border-slate-100 focus:border-emerald-500 outline-none uppercase" />
                    </div>

                    <div className="space-y-1.5 mt-3">
                      <label className="text-[10px] font-black text-slate-400">聯絡地址 <span className="text-rose-500">*</span></label>
                      <div className="grid grid-cols-2 gap-3 mb-2">
                        <select 
                          value={ambassadorFormData.city}
                          onChange={e => setAmbassadorFormData({...ambassadorFormData, city: e.target.value, district: ''})}
                          className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold border border-slate-100 focus:border-emerald-500 outline-none appearance-none"
                        >
                          <option value="">選擇縣市</option>
                          {Object.keys(TAIWAN_CITIES).map(city => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                        <select 
                          value={ambassadorFormData.district}
                          onChange={e => setAmbassadorFormData({...ambassadorFormData, district: e.target.value})}
                          disabled={!ambassadorFormData.city}
                          className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold border border-slate-100 focus:border-emerald-500 outline-none appearance-none disabled:opacity-50"
                        >
                          <option value="">選擇鄉鎮市區</option>
                          {ambassadorFormData.city && TAIWAN_CITIES[ambassadorFormData.city]?.map(dist => (
                            <option key={dist} value={dist}>{dist}</option>
                          ))}
                        </select>
                      </div>
                      <input type="text" placeholder="請填寫詳細地址 (不能空白)" value={ambassadorFormData.address} onChange={e => setAmbassadorFormData({...ambassadorFormData, address: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold border border-slate-100 focus:border-emerald-500 outline-none" />
                    </div>

                    {/* 非必填區塊 */}
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-4 mt-4 border-t border-slate-100">其他資訊 (非必填)</p>
                    
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400">市內電話</label>
                        <input type="text" value={ambassadorFormData.landline} onChange={e => setAmbassadorFormData({...ambassadorFormData, landline: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold border border-slate-100 focus:border-emerald-500 outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400">公司電話</label>
                        <input type="text" value={ambassadorFormData.company_phone} onChange={e => setAmbassadorFormData({...ambassadorFormData, company_phone: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold border border-slate-100 focus:border-emerald-500 outline-none" />
                      </div>
                    </div>

                    <div className="space-y-1.5 mt-3">
                      <label className="text-[10px] font-black text-slate-400">服務公司</label>
                      <input type="text" value={ambassadorFormData.company} onChange={e => setAmbassadorFormData({...ambassadorFormData, company: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold border border-slate-100 focus:border-emerald-500 outline-none" />
                    </div>

                    <div className="space-y-1.5 mt-3 mb-6">
                      <label className="text-[10px] font-black text-slate-400">備註</label>
                      <textarea rows={2} value={ambassadorFormData.notes} onChange={e => setAmbassadorFormData({...ambassadorFormData, notes: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold border border-slate-100 focus:border-emerald-500 outline-none resize-none" />
                    </div>

                    <div className="space-y-1.5 mt-6 border-t border-slate-100 pt-6">
                      <label className="text-[10px] font-black text-slate-400">身分證正面相片 <span className="text-rose-500">*</span></label>
                      {ambassadorFormData.id_card_front ? (
                        <div className="space-y-3">
                          <button type="button" onClick={() => setPreviewImage(ambassadorFormData.id_card_front)} className="group relative w-full h-28 block">
                            <img src={ambassadorFormData.id_card_front} alt="preview" className="w-full h-full object-cover rounded-2xl border-2 border-emerald-500 shadow-sm" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-2xl transition-all flex items-center justify-center">
                              <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                            </div>
                          </button>
                          <label className="flex items-center justify-center gap-2 w-full py-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer transition text-sm font-bold">
                            <Camera className="w-4 h-4" /> 重新選擇正面相片
                            <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const w = await applyWatermark(file);
                                setAmbassadorFormData({...ambassadorFormData, id_card_front: w});
                              }
                            }} />
                          </label>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-2 bg-slate-50 border-2 border-dashed border-slate-200 text-slate-400 rounded-2xl p-8 text-sm font-bold cursor-pointer hover:border-emerald-400 hover:text-emerald-500 transition-all">
                          <Camera className="w-6 h-6 mb-1" />
                          <span>點擊上傳身分證正面</span>
                          <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const w = await applyWatermark(file);
                              setAmbassadorFormData({...ambassadorFormData, id_card_front: w});
                            }
                          }} />
                        </label>
                      )}
                    </div>

                    <div className="space-y-1.5 mt-4">
                      <label className="text-[10px] font-black text-slate-400">身分證反面相片 <span className="text-rose-500">*</span></label>
                      {ambassadorFormData.id_card_back ? (
                        <div className="space-y-3">
                          <button type="button" onClick={() => setPreviewImage(ambassadorFormData.id_card_back)} className="group relative w-full h-28 block">
                            <img src={ambassadorFormData.id_card_back} alt="preview" className="w-full h-full object-cover rounded-2xl border-2 border-emerald-500 shadow-sm" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-2xl transition-all flex items-center justify-center">
                              <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                            </div>
                          </button>
                          <label className="flex items-center justify-center gap-2 w-full py-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer transition text-sm font-bold">
                            <Camera className="w-4 h-4" /> 重新選擇反面相片
                            <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const w = await applyWatermark(file);
                                setAmbassadorFormData({...ambassadorFormData, id_card_back: w});
                              }
                            }} />
                          </label>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-2 bg-slate-50 border-2 border-dashed border-slate-200 text-slate-400 rounded-2xl p-8 text-sm font-bold cursor-pointer hover:border-emerald-400 hover:text-emerald-500 transition-all">
                          <Camera className="w-6 h-6 mb-1" />
                          <span>點擊上傳身分證反面</span>
                          <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const w = await applyWatermark(file);
                              setAmbassadorFormData({...ambassadorFormData, id_card_back: w});
                            }
                          }} />
                        </label>
                      )}
                    </div>

                    {(selectedApplyType === 'paid' || selectedApplyType === 'partner') && (
                      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 space-y-4 mt-2">
                         <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-amber-700">匯款帳號後五碼 <span className="text-rose-500">*</span></label>
                           <input type="text" maxLength={5} placeholder="例如: 12345" value={ambassadorFormData.last_five} onChange={e => setAmbassadorFormData({...ambassadorFormData, last_five: e.target.value.replace(/\D/g, '')})} className="w-full bg-white p-3 rounded-xl text-sm font-bold border border-amber-200 focus:border-amber-500 outline-none" />
                         </div>
                         <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-amber-700">匯款水單照片 <span className="text-rose-500">*</span></label>
                           {ambassadorFormData.remittance_photo ? (
                             <div className="space-y-3">
                               <button type="button" onClick={() => setPreviewImage(ambassadorFormData.remittance_photo)} className="group relative w-full h-28 block">
                                 <img src={ambassadorFormData.remittance_photo} alt="preview" className="w-full h-full object-cover rounded-2xl border-2 border-amber-500 shadow-sm" />
                                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-2xl transition-all flex items-center justify-center">
                                   <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                                 </div>
                               </button>
                               <label className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-amber-200 text-amber-600 rounded-xl hover:bg-amber-50 cursor-pointer transition text-sm font-bold">
                                 <Camera className="w-4 h-4" /> 重新選擇水單照片
                                 <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                   const file = e.target.files?.[0];
                                   if (file) {
                                     const w = await applyWatermark(file);
                                     setAmbassadorFormData({...ambassadorFormData, remittance_photo: w});
                                   }
                                 }} />
                               </label>
                             </div>
                           ) : (
                             <label className="flex flex-col items-center justify-center gap-2 bg-white border-2 border-dashed border-amber-200 text-amber-400 rounded-2xl p-8 text-sm font-bold cursor-pointer hover:border-amber-400 hover:text-amber-500 transition-all">
                               <Camera className="w-6 h-6 mb-1" />
                               <span>點擊上傳匯款截圖或水單</span>
                               <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                 const file = e.target.files?.[0];
                                 if (file) {
                                   const w = await applyWatermark(file);
                                   setAmbassadorFormData({...ambassadorFormData, remittance_photo: w});
                                 }
                               }} />
                             </label>
                           )}
                         </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {ambassadorError && (
                  <p className="text-xs font-bold text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-100 mb-4">{ambassadorError}</p>
                )}

                {/* 申請按鈕 */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={checkAndSubmitAmbassador}
                  disabled={isSubmittingAmbassador || !selectedApplyType}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all disabled:opacity-50"
                >
                  {isSubmittingAmbassador ? <Loader2 className="w-4 h-4 animate-spin"/> : (
                    <>
                      <Crown className="w-4 h-4" />
                      {selectedApplyType ? '確認資料並送出' : '請先選擇申請方案'}
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ═══════════ Image Preview Modal ═══════════ */}
      <AnimatePresence>
        {previewImage && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewImage(null)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 max-w-2xl w-full"
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute -top-12 right-0 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition z-20"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={previewImage}
                alt="預覽圖片"
                className="w-full rounded-2xl shadow-2xl border border-white/10 object-contain max-h-[85vh]"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 同步確認 Modal */}
      <AnimatePresence>
        {showSyncConfirm && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-6">
            <motion.div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[3rem] p-8 w-full max-w-sm shadow-2xl relative z-10 text-center"
            >
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">更新個人資料確認</h3>
              <p className="text-xs text-slate-500 font-bold leading-relaxed mb-6">
                系統偵測到您修改了聯絡資料，請問是否要同步更新您的會員基本資料，並完成申請？
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowSyncConfirm(false)}
                  disabled={isSubmittingAmbassador}
                  className="py-3 rounded-xl bg-slate-100 text-slate-600 font-black text-xs hover:bg-slate-200 transition"
                >
                  上一步繼續修改
                </button>
                <button 
                  onClick={() => submitAmbassadorForm(true)}
                  disabled={isSubmittingAmbassador}
                  className="py-3 rounded-xl bg-slate-900 text-white font-black text-xs hover:bg-slate-800 transition shadow-lg shadow-slate-900/20"
                >
                  {isSubmittingAmbassador ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : '是，同步並送出'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      <div className="fixed bottom-8 left-4 right-4 z-50 mx-auto max-w-sm">
         <div className="bg-slate-900/90 backdrop-blur-3xl rounded-[2.5rem] p-3 flex justify-between items-center shadow-2xl shadow-slate-900/40 border border-white/10">
            <Link href="/" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <LayoutDashboard className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">主頁</span>
            </Link>
            <Link href="/store" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <ShoppingBag className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">商城</span>
            </Link>
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 -mt-8 border-4 border-[#FDFBF7]">
               <Plus className="w-6 h-6 text-white" />
            </div>
            <Link href="/organization" className="flex-1 flex flex-col items-center gap-1 text-white">
               <Zap className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">組織</span>
            </Link>
            <Link href="/profile" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <User className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">個人</span>
            </Link>
         </div>
      </div>
    </div>
  );
}

export default function Organization() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>}>
      <OrganizationContent />
    </Suspense>
  );
}
