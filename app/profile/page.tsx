"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import { 
  Package,
  User, 
  Settings, 
  CreditCard, 
  Shield, 
  LogOut, 
  ChevronRight, 
  LayoutDashboard, 
  ShoppingBag, 
  Zap, 
  Plus, 
  Loader2,
  QrCode,
  ArrowUpRight,
  Fingerprint,
  AlertCircle,
  Award,
  Star,
  Target,
  Trophy,
  Users,
  Sparkles,
  CheckCircle2,
  X,
  Camera,
  Download,
  IdCard
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

const isVideoUrl = (url: string) => {
  if (!url) return false;
  return url.startsWith("data:video/") || 
         url.toLowerCase().endsWith(".mp4") || 
         url.toLowerCase().endsWith(".mov") || 
         url.toLowerCase().endsWith(".webm") || 
         (url.includes("/materials/material_") && (url.toLowerCase().endsWith(".mp4") || url.toLowerCase().endsWith(".mov") || url.toLowerCase().endsWith(".webm")));
};


const CR_LOGO = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjMwIiBmaWxsPSIjMDY0ZTMiLz48dGV4dCB4PSI1MCIgeT0iNjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI0NSIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5DUjwvdGV4dD48L3N2Zz4=";

function ProfileContent() {
  const router = useRouter();
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  // 特權全數整合於卡片內直觀呈現，無需彈出與切換狀態
  const [maleDefault, setMaleDefault] = useState("https://i.ibb.co/6R2M5X1/churun-baby.png");
  const [showWalletDetailModal, setShowWalletDetailModal] = useState(false);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [isFetchingWalletTx, setIsFetchingWalletTx] = useState(false);
  const [activeWalletTab, setActiveWalletTab] = useState<'pending' | 'history'>('pending');
  const [pendingCommissions, setPendingCommissions] = useState<any[]>([]);
  const [isFetchingPending, setIsFetchingPending] = useState(false);

  const handleOpenWalletDetails = async () => {
    setShowWalletDetailModal(true);
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) return;
    setIsFetchingWalletTx(true);
    setIsFetchingPending(true);
    try {
      // 1. Fetch ledger history
      const { data: txData, error: txError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('member_id', savedId)
        .order('created_at', { ascending: false });
      if (!txError && txData) {
        setWalletTransactions(txData);
      }

      // 2. Fetch pending B2B commissions (downline orders not yet settled)
      const { data: downlineMembers } = await supabase
        .from('members')
        .select('id, name')
        .eq('upline_id', savedId);

      if (downlineMembers && downlineMembers.length > 0) {
        const downlineIds = downlineMembers.map(m => m.id);
        const downlineNameMap = new Map(downlineMembers.map(m => [m.id, m.name]));

        // Fetch completed orders of these downlines that have b2b_commission > 0
        const { data: orders } = await supabase
          .from('orders')
          .select('id, member_id, total_amount, b2b_commission, custom_logo_url, created_at, status, fulfillment_status')
          .in('member_id', downlineIds)
          .eq('status', 'completed')
          .gt('b2b_commission', 0);

        if (orders && orders.length > 0) {
          // Fetch existing settled commissions for these orders
          const orderIds = orders.map(o => o.id);
          const { data: existingTx } = await supabase
            .from('wallet_transactions')
            .select('order_id')
            .eq('transaction_type', 'commission_refund')
            .in('order_id', orderIds);

          const settledOrderIds = new Set(existingTx?.map(tx => tx.order_id) || []);

          // Filter out orders that are already settled
          const pending = orders
            .filter(o => !settledOrderIds.has(o.id))
            .map(o => {
              // Parse delivered_at or shipped_at from custom_logo_url fallback JSON
              let refTime = null;
              if (o.custom_logo_url && o.custom_logo_url.startsWith('FALLBACK_JSON:')) {
                try {
                  const parsed = JSON.parse(o.custom_logo_url.substring('FALLBACK_JSON:'.length));
                  refTime = parsed.delivered_at || parsed.shipped_at;
                } catch (e) {}
              }
              if (!refTime) {
                refTime = o.created_at;
              }

              // Calculate countdown relative to 30 days cooling period
              let countdownText = "待發送";
              let daysRemaining = 30;
              if (refTime) {
                const diffTime = new Date().getTime() - new Date(refTime).getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                daysRemaining = Math.max(0, 30 - diffDays);
                if (daysRemaining > 0) {
                  countdownText = `約剩餘 ${daysRemaining} 天撥發`;
                } else {
                  countdownText = "將於下次對帳撥發";
                }
              }

              return {
                orderId: o.id,
                buyerName: downlineNameMap.get(o.member_id) || '下線夥伴',
                orderAmount: Number(o.total_amount),
                commissionAmount: Number(o.b2b_commission),
                refTime: refTime,
                daysRemaining: daysRemaining,
                countdownText: countdownText,
                status: o.fulfillment_status
              };
            })
            // Sort so the ones closest to settlement show first
            .sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0));

          setPendingCommissions(pending);
        } else {
          setPendingCommissions([]);
        }
      } else {
        setPendingCommissions([]);
      }
    } catch (err) {
      console.error("Fetch pending commissions failed:", err);
    } finally {
      setIsFetchingWalletTx(false);
      setIsFetchingPending(false);
    }
  };
  const [femaleDefault, setFemaleDefault] = useState("https://i.ibb.co/6R2M5X1/churun-baby.png");

  useEffect(() => {
    const currentVersion = "3.0.12";
    const savedVersion = localStorage.getItem("churun_profile_version");
    if (savedVersion !== currentVersion) {
      localStorage.setItem("churun_profile_version", currentVersion);
      window.location.reload();
      return;
    }

    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) { router.replace("/login"); return; }
    fetchData(savedId);
  }, [router]);

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/me/dashboard");
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      
      const maleUrl = data.defaultAvatars?.find((m: any) => m.title === "預設頭像 - 男生潤寶")?.url || "https://i.ibb.co/6R2M5X1/churun-baby.png";
      const femaleUrl = data.defaultAvatars?.find((m: any) => m.title === "預設頭像 - 女生潤寶")?.url || "https://i.ibb.co/6R2M5X1/churun-baby.png";
      setMaleDefault(maleUrl);
      setFemaleDefault(femaleUrl);

      setMemberInfo(data.member);
    } catch (err) {
      console.error(err);
      setMemberInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {}
    await supabase.auth.signOut();
    localStorage.removeItem("churun_member_id");
    router.replace("/login");
  };

  const getTierBenefits = (tierName: string) => {
    if (!tierName) tierName = '初潤寶寶';
    const cleanTier = tierName.startsWith('初潤') ? tierName : `初潤${tierName}`;
    
    const BENEFITS_MAP: Record<string, string[]> = {
      '初潤靈魂伴侶': [
        '累積消費滿 $50,000 晉升', 
        '每月保級：消費 $1,000 或 直推 3 人', 
        '季度特權與專屬行銷海報'
      ],
      '初潤知己': [
        '累積消費滿 $25,000 晉升', 
        '每月保級：消費 $600 或 直推 2 人', 
        '組織管理與分潤特權'
      ],
      '初潤閨蜜': [
        '累積滿 $12,000 (或儲值 1 萬直升)', 
        '每季保級：消費 $1,200 或 直推 2 人', 
        '消費點數回饋'
      ],
      '初潤好朋友': [
        '累積消費滿 $6,000 晉升', 
        '每季保級：消費 $600 或 直推 1 人'
      ],
      '初潤青少年': [
        '累積消費滿 $3,000 晉升', 
        '無保級壓力'
      ],
      '初潤小朋友': [
        '累積消費滿 $1,500 晉升', 
        '無保級壓力'
      ],
      '初潤幼兒園': [
        '完成首次消費即可晉升', 
        '無保級壓力'
      ],
      '初潤寶寶': [
        '加入 LINE@ 註冊即可獲得', 
        '無保級壓力'
      ]
    };

    const defaultBenefits = ["專屬客服支援", "電子會員名片", "最新產品資訊"];
    const matched = BENEFITS_MAP[tierName] || BENEFITS_MAP[cleanTier];
    return matched || defaultBenefits;
  };

  const getTierPerks = (tier: string) => {
    const t = tier || "初潤寶寶";
    switch (t) {
      case "初潤寶寶":
        return { percent: "0%", desc: "一般購物返點及代理佣金基礎版", fee: "無", badge: "基礎級" };
      case "初潤青少年":
        return { percent: "1.0%", desc: "享零售額外回饋", fee: "無", badge: "新星級" };
      case "初潤好朋友":
        return { percent: "1.2%", desc: "享二級經銷合夥 1.2% 加碼回饋", fee: "無", badge: "好朋友級" };
      case "初潤中產階級":
        return { percent: "1.5%", desc: "享有下線組織儲值 1.5% 額外回饋", fee: "無", badge: "中堅級" };
      case "初潤社會支柱":
        return { percent: "2.0%", desc: "享有下線組織儲值 2.0% 額外回饋", fee: "無", badge: "支柱級" };
      case "初潤中流砥柱":
        return { percent: "2.5%", desc: "享下線儲值回饋，尊榮提領服務", fee: "無", badge: "中流砥柱" };
      case "初潤意見領袖":
        return { percent: "3.0%", desc: "享下線儲值 3.0% 額外佣金，提領服務", fee: "無", badge: "意見領袖" };
      case "初潤靈魂伴侶":
        return { percent: "5.0%", desc: "終身最頂級 5.0% 佣金加成，提領服務", fee: "無", badge: "靈魂伴侶 (終身)" };
      default:
        return { percent: "0%", desc: "基礎會員特權", fee: "無", badge: "一般會員" };
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>;
  }

  if (!memberInfo) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mb-6">
          <X className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">載入會員資料失敗</h2>
        <p className="text-sm text-slate-500 mb-6">可能連線逾時或認證失效，請重新登入</p>
        <button 
          onClick={() => {
            localStorage.removeItem("churun_member_id");
            router.replace("/login");
          }}
          className="bg-emerald-900 text-white px-6 py-3 rounded-full font-bold text-sm"
        >
          重新登入
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 max-w-lg mx-auto flex justify-between items-center bg-[#FDFBF7]/80 backdrop-blur-xl border-b border-slate-100">
         <button onClick={() => router.push("/")} className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50">
            <LayoutDashboard className="w-4 h-4 text-slate-400" />
         </button>
         <h1 className="text-xs font-black tracking-[0.3em] text-slate-800 uppercase leading-none">會員中心</h1>
         <Link href="/profile/security" className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50">
            <Settings className="w-4 h-4 text-slate-400" />
         </Link>
      </nav>

      <main className="max-w-lg mx-auto px-6 pt-24 space-y-8">
         {/* Interactive VIP Card */}
         <div className="relative w-full perspective-1000 group cursor-pointer h-[420px]" onClick={() => setIsFlipped(!isFlipped)}>
            <motion.div 
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="relative w-full h-full preserve-3d shadow-2xl shadow-emerald-900/10 rounded-[3.5rem]"
            >
               {/* Card Front */}
               <div className="absolute inset-0 backface-hidden bg-mesh-emerald rounded-[3.5rem] p-8 sm:p-10 text-white flex flex-col justify-between overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
                  
                  {/* 頂部：頭像與名稱 */}
                  <div className="relative z-10 flex justify-between items-start">
                     <div className="flex items-center gap-4">
                         {(() => {
                             const hasCustomAvatar = memberInfo.avatar_url && memberInfo.avatar_url !== "https://i.ibb.co/6R2M5X1/churun-baby.png";
                             const resolvedSrc = hasCustomAvatar 
                                ? `${memberInfo.avatar_url}?t=${Date.now()}`
                                : (memberInfo.avatar_settings?.gender === "女" ? femaleDefault : maleDefault);
                             const isVid = isVideoUrl(resolvedSrc);
                             return (
                                <div className="rounded-2xl overflow-hidden border-2 border-white/20 shadow-lg flex-shrink-0 bg-slate-100 relative" style={{ width: '56px', height: '56px', minWidth: '56px', minHeight: '56px' }}>
                                   {isVid ? (
                                      <video src={resolvedSrc} autoPlay loop muted playsInline className="w-full h-full object-cover" style={{ objectFit: 'cover', ...(memberInfo.avatar_settings ? { transform: `scale(${memberInfo.avatar_settings.zoom || 1}) translateY(${memberInfo.avatar_settings.offset || 0}px)` } : {}) }} />
                                   ) : (
                                      <img src={resolvedSrc} className="w-full h-full object-cover" style={memberInfo.avatar_settings ? { transform: `scale(${memberInfo.avatar_settings.zoom || 1}) translateY(${memberInfo.avatar_settings.offset || 0}px)` } : undefined} alt="Avatar" />
                                   )}
                                </div>
                             );
                          })()}
                        <div>
                           <p className="text-[10px] font-black tracking-[0.4em] uppercase text-emerald-300/80 mb-0.5">Member Account</p>
                           <h2 className="text-2xl font-black tracking-tight">{memberInfo.name || '初潤會員'}</h2>
                        </div>
                     </div>
                     <span className="text-[9px] font-black text-emerald-300 bg-white/10 px-3 py-1.5 rounded-full uppercase tracking-widest font-mono border border-white/10 backdrop-blur-md">
                        {memberInfo.tier || '初潤寶寶'}
                     </span>
                  </div>

                  {/* 中間：直觀特權指標與權益說明 */}
                  <div className="relative z-10 space-y-2 my-auto py-3">
                     <div className="grid grid-cols-1 gap-3">
                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col justify-center text-left">
                           <span className="text-[8px] font-black text-white/60 block uppercase tracking-wider mb-0.5">專屬福利</span>
                           <span className="text-base font-black text-amber-300">{getTierBenefits(memberInfo.tier)[0]}</span>
                        </div>
                     </div>

                     {/* 權益說明區塊 (保級標準下行且完整呈現) */}
                     <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 text-left space-y-2.5">
                        {/* 特權直顯 */}
                        <div>
                           <span className="text-[8px] font-black text-amber-300 block uppercase tracking-wider mb-1">🎯 尊榮特權與權益：</span>
                           <div className="space-y-0.5">
                              <p className="text-[11px] font-black text-white flex items-center gap-1.5">
                                 <span className="text-amber-400">★</span> 新品上市嚐鮮價點數加倍送
                              </p>
                              <p className="text-[11px] font-black text-white flex items-center gap-1.5">
                                 <span className="text-amber-400">★</span> 每年生日禮券買一送一
                              </p>
                           </div>
                        </div>

                        {/* 保級標準下行，且完整展開說明 */}
                        <div className="pt-1.5 border-t border-white/5 space-y-0.5">
                           <span className="text-[9px] font-black text-emerald-300 block">🛡️ 保級與晉升標準：</span>
                           <p className="text-[9px] font-bold text-white/80 leading-relaxed whitespace-normal break-words">
                              {getTierBenefits(memberInfo.tier).slice(1).join(" / ")}
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* 底部：提示 */}
                  <div className="flex justify-end items-end relative z-10">
                     <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">TAP TO REVEAL QR</p>
                  </div>
               </div>

               {/* Card Back */}
               <div className="absolute inset-0 backface-hidden rounded-[3.5rem] p-8 bg-white text-slate-800 flex flex-col items-center justify-center gap-3 shadow-2xl rotate-y-180 border border-slate-100">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                     <QRCodeCanvas
                       value={`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${memberInfo.member_code}`}
                       size={110}
                       level="H"
                     />
                  </div>
                  <div className="text-center space-y-1">
                     <p className="text-base font-black tracking-widest text-emerald-900">{memberInfo.member_code}</p>
                     <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">掃碼加入初潤</p>
                  </div>
               </div>
            </motion.div>
        </div>

        {/* Wallet & Points Hub */}
        <div className="grid grid-cols-2 gap-4">
           {/* Wallet Cash Balance */}
           <div onClick={handleOpenWalletDetails} className="bg-white rounded-[2.5rem] p-6 border border-slate-50 shadow-sm flex flex-col justify-between h-36 cursor-pointer hover:shadow-md active:scale-[0.98] transition-all duration-300 group">
              <div className="flex justify-between items-start" onClick={(e) => e.stopPropagation()}>
                 <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                 </div>
                 {memberInfo.is_b2b && (
                    <button onClick={() => router.push("/withdraw")} className="text-[9px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1 hover:opacity-80 transition">
                       提領 <ArrowUpRight className="w-3 h-3" />
                    </button>
                 )}
              </div>
              <div className="space-y-1">
                 <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                    {memberInfo.is_b2b ? "可用餘額 💡 點選明細" : "可用儲值金"}
                 </p>
                 <h3 className="text-xl font-black text-slate-800 tracking-tight">
                    NT$ {Number(memberInfo.virtual_balance || 0).toLocaleString()}
                 </h3>
              </div>
           </div>

           {/* Points Balance */}
           <div className="bg-white rounded-[2.5rem] p-6 border border-slate-50 shadow-sm flex flex-col justify-between h-36">
              <div className="flex justify-between items-start">
                 <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                    <Star className="w-5 h-5" />
                 </div>
                 <button onClick={() => router.push("/rewards")} className="text-[9px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-1 hover:opacity-80 transition">
                    明細 <ArrowUpRight className="w-3 h-3" />
                 </button>
              </div>
              <div className="space-y-1">
                 <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">累積會員點數</p>
                 <h3 className="text-xl font-black text-slate-800 tracking-tight">
                    {Number(memberInfo.points_balance || 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">P</span>
                 </h3>
              </div>
           </div>
         </div>

         {/* 舊版彈出視窗已移除，全數整合於上方綠色VIP卡片內部 */}

        {/* Action Menu */}
        <div className="grid grid-cols-1 gap-4">
           {[
             { label: "資料與安全設定", desc: "變更資料、密碼與匯款帳戶", icon: Shield, href: "/profile/security", color: "bg-emerald-50 text-emerald-600" },
             { label: "我的組織團隊", desc: "查看您的下線成員與業績", icon: Users, href: "/organization", color: "bg-indigo-50 text-indigo-600" },
             { label: "獎勵特權細項", desc: "職級晉升與紅利分潤規則", icon: Award, href: "/rewards", color: "bg-amber-50 text-amber-600" },
             { label: "數位帳本明細", desc: "點數與貨款進出紀錄", icon: CreditCard, href: "/transactions", color: "bg-slate-50 text-slate-600" }
           ].map((item, i) => (
             <Link href={item.href} key={i} className="flex items-center justify-between p-6 bg-white rounded-[2.5rem] border border-slate-50 shadow-sm active:scale-[0.98] transition group">
                <div className="flex items-center gap-5">
                   <div className={`w-14 h-14 ${item.color} rounded-[1.5rem] flex items-center justify-center`}>
                      <item.icon className="w-6 h-6" />
                   </div>
                   <div className="text-left">
                      <p className="font-black text-sm text-slate-800">{item.label}</p>
                      <p className="text-[10px] font-bold text-slate-300 mt-1 uppercase tracking-tight">{item.desc}</p>
                   </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-100 group-hover:text-slate-300 transition" />
             </Link>
           ))}

           <button 
             onClick={handleLogout}
             className="flex items-center justify-between p-6 bg-rose-50/50 rounded-[2.5rem] border border-rose-100/50 active:scale-[0.98] transition group"
           >
              <div className="flex items-center gap-5">
                 <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-[1.5rem] flex items-center justify-center">
                    <LogOut className="w-6 h-6" />
                 </div>
                 <div className="text-left">
                    <p className="font-black text-sm text-rose-600">登出系統</p>
                    <p className="text-[10px] font-bold text-rose-300 mt-1 uppercase tracking-tight">Logout from your account</p>
                 </div>
              </div>
           </button>
        </div>
      {/* Wallet Details Modal */}
      <AnimatePresence>
        {showWalletDetailModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWalletDetailModal(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] p-8 w-full max-w-md shadow-2xl relative z-10 max-h-[85vh] flex flex-col"
            >
              <button 
                onClick={() => setShowWalletDetailModal(false)}
                className="absolute top-6 right-6 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center pb-4 border-b border-slate-100">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">交易明細</h3>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">Virtual Ledger & Referral Rewards</p>
              </div>

              {/* Tab Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-2xl my-4">
                <button
                  onClick={() => setActiveWalletTab('pending')}
                  className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                    activeWalletTab === 'pending'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  ⏱️ 預估撥發明細
                </button>
                <button
                  onClick={() => setActiveWalletTab('history')}
                  className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                    activeWalletTab === 'history'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  📜 帳務歷史明細
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar py-2 space-y-4">
                {activeWalletTab === 'pending' ? (
                  <div className="space-y-4">
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50">
                      💡 <strong>預估撥發說明：</strong><br />
                      依據初潤品牌營運規章，下線夥伴消費所產生的推廣回饋，均需在該筆訂單<strong>【簽收取貨滿 30 天】</strong>後，且無退換貨等異常時，由系統自動考核並撥發至您的可用餘額中。
                    </p>

                    {isFetchingPending ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                      </div>
                    ) : pendingCommissions.length === 0 ? (
                      <div className="text-center py-10 bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl">
                        <span className="text-2xl">🍃</span>
                        <p className="text-xs font-black text-slate-400 mt-2">目前尚無預估撥發中的回饋</p>
                        <p className="text-[9px] text-slate-400/80 mt-1 px-6">當您的下線團隊夥伴完成消費後，將在此顯示倒數明細。</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">⏳ 預計發放項目 (${pendingCommissions.length})：</h4>
                        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                          {pendingCommissions.map((item, idx) => (
                            <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center text-left hover:scale-[1.01] transition-all duration-300">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-slate-800">${item.buyerName}</span>
                                  <span className="text-[8px] bg-slate-200/50 px-2 py-0.5 rounded text-slate-500 font-bold">下線消費</span>
                                </div>
                                <p className="text-[9px] text-slate-400 font-bold">訂單金額: ${item.orderAmount.toLocaleString()} · 訂單狀態: ${item.status === 'delivered' ? '已簽收' : '已出貨'}</p>
                                <span className={`inline-flex items-center gap-1 text-[8px] font-black px-2 py-0.5 rounded-full ${
                                  item.daysRemaining > 7 
                                    ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                }`}>
                                  ⏱️ ${item.countdownText}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-mono font-black text-emerald-600">
                                  +${item.commissionAmount.toLocaleString()}
                                </span>
                                <p className="text-[7px] text-slate-400 font-black mt-0.5">預估回饋</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      💡 <strong>可用餘額說明：</strong><br />
                      此處顯示您已正式入帳的可用預收貨款與歷史紀錄，您可用於批貨消費扣款、儲值充值或申請提領。
                    </p>

                    {isFetchingWalletTx ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                      </div>
                    ) : walletTransactions.length === 0 ? (
                      <div className="text-center py-10 bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl">
                        <span className="text-2xl">📜</span>
                        <p className="text-xs font-black text-slate-400 mt-2">暫無帳務異動明細紀錄</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">📜 歷史異動明細：</h4>
                        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                          {walletTransactions.map((tx: any) => {
                            const dateStr = new Date(tx.created_at).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                            const isPos = Number(tx.amount) > 0;
                            
                            let txLabel = "交易明細";
                            let txDesc = tx.description || "";
                            if (tx.transaction_type === 'deposit') {
                              txLabel = "📥 儲值預收金";
                              txDesc = txDesc || "加盟儲值款";
                            } else if (tx.transaction_type === 'commission_refund') {
                              txLabel = "🎁 推薦回饋獎金";
                              txDesc = txDesc || `下線訂單對帳 (滿30天自動撥發)`;
                            } else if (tx.transaction_type === 'order_deduction') {
                              txLabel = "💸 批貨消費扣款";
                              txDesc = txDesc || "自主下單支出";
                            } else if (tx.transaction_type === 'withdrawal') {
                              txLabel = "📤 帳戶餘額提領";
                              txDesc = txDesc || "提款出帳";
                            }

                            return (
                              <div key={tx.id} className="p-3.5 bg-white border border-slate-100 rounded-2xl flex justify-between items-center text-left hover:border-slate-200 transition-all duration-300">
                                <div>
                                  <p className="text-[10px] font-black text-slate-800">{txLabel}</p>
                                  <p className="text-[8px] font-medium text-slate-400 mt-0.5">{txDesc} · {dateStr}</p>
                                </div>
                                <span className={`text-xs font-mono font-black ${isPos ? 'text-emerald-600' : 'text-rose-500'}`}>
                                  +${tx.amount}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button 
                  onClick={() => setShowWalletDetailModal(false)}
                  className="flex-1 bg-slate-900 text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 active:scale-95 transition"
                >
                  關閉視窗
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-8 left-4 right-4 z-50 mx-auto max-w-sm">
         <div className="bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] p-3 flex justify-between items-center shadow-2xl border border-white/5">
            <Link href="/" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition"><LayoutDashboard className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-[0.2em]">Home</span></Link>
            <Link href="/store" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition"><ShoppingBag className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-[0.2em]">Shop</span></Link>
            <div onClick={() => router.push("/")} className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg -mt-8 border-4 border-[#FDFBF7] cursor-pointer"><Plus className="w-6 h-6 text-white" /></div>
            <Link href="/organization" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition"><Zap className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-[0.2em]">Team</span></Link>
            <Link href="/profile" className="flex-1 flex flex-col items-center gap-1 text-white transition"><User className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-[0.2em]">Me</span></Link>
         </div>
      </div>
    </div>
  );
}

export default function Profile() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>}>
      <ProfileContent />
    </Suspense>
  );
}
