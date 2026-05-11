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

const CR_LOGO = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjMwIiBmaWxsPSIjMDY0ZTMiLz48dGV4dCB4PSI1MCIgeT0iNjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI0NSIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5DUjwvdGV4dD48L3N2Zz4=";

function ProfileContent() {
  const router = useRouter();
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showTierBenefits, setShowTierBenefits] = useState(false);
  const [maleDefault, setMaleDefault] = useState("https://i.ibb.co/6R2M5X1/churun-baby.png");
  const [femaleDefault, setFemaleDefault] = useState("https://i.ibb.co/6R2M5X1/churun-baby.png");

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) { router.replace("/login"); return; }
    fetchData(savedId);
  }, [router]);

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    // Load default avatars
    const { data: defaultAvatars } = await supabase.from("materials").select("title, url").eq("category", "系統預設頭像");
    const maleUrl = defaultAvatars?.find(m => m.title === "預設頭像 - 男生潤寶")?.url || "https://i.ibb.co/6R2M5X1/churun-baby.png";
    const femaleUrl = defaultAvatars?.find(m => m.title === "預設頭像 - 女生潤寶")?.url || "https://i.ibb.co/6R2M5X1/churun-baby.png";
    setMaleDefault(maleUrl);
    setFemaleDefault(femaleUrl);

    const { data } = await supabase.from("members").select("*").eq("id", userId).single();
    setMemberInfo(data);
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("churun_member_id");
    router.replace("/login");
  };

  const getTierBenefits = (tierName: string) => {
    const cleanTier = tierName.startsWith('初潤') ? tierName : `初潤${tierName}`;
    
    const BENEFITS_MAP: Record<string, string[]> = {
      '初潤靈魂伴侶': [
        '專屬匯率：30元 = 1點', 
        '累積消費滿 $50,000 晉升', 
        '每月保級：消費 $1,000 或 直推 3 人', 
        '季度分紅特權與專屬行銷海報'
      ],
      '初潤知己': [
        '專屬匯率：40元 = 1點', 
        '累積消費滿 $25,000 晉升', 
        '每月保級：消費 $600 或 直推 2 人', 
        '組織管理與分潤特權'
      ],
      '初潤閨蜜': [
        '專屬匯率：50元 = 1點', 
        '累積滿 $12,000 (或儲值 1 萬直升)', 
        '每季保級：消費 $1,200 或 直推 2 人', 
        '消費點數回饋'
      ],
      '初潤好朋友': [
        '專屬匯率：60元 = 1點', 
        '累積消費滿 $6,000 晉升', 
        '每季保級：消費 $600 或 直推 1 人'
      ],
      '初潤青少年': [
        '專屬匯率：70元 = 1點', 
        '累積消費滿 $3,000 晉升', 
        '無保級壓力'
      ],
      '初潤小朋友': [
        '專屬匯率：80元 = 1點', 
        '累積消費滿 $1,500 晉升', 
        '無保級壓力'
      ],
      '初潤幼兒園': [
        '專屬匯率：90元 = 1點', 
        '完成首次消費即可晉升', 
        '無保級壓力'
      ],
      '初潤寶寶': [
        '專屬匯率：100元 = 1點', 
        '加入 LINE@ 註冊即可獲得', 
        '無保級壓力'
      ]
    };

    const defaultBenefits = ["專屬客服支援", "電子會員名片", "最新產品資訊"];
    const matched = BENEFITS_MAP[tierName] || BENEFITS_MAP[cleanTier];
    return matched || defaultBenefits;
  };

  if (isLoading || !memberInfo) return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>;

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
         <div className="relative h-80 w-full perspective-1000 group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
            <motion.div 
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="relative w-full h-full preserve-3d shadow-2xl shadow-emerald-900/10 rounded-[3.5rem]"
            >
               {/* Card Front */}
               <div className="absolute inset-0 backface-hidden bg-mesh-emerald rounded-[3.5rem] p-10 text-white flex flex-col justify-between overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
                  <div className="relative z-10 flex justify-between items-start">
                     <div className="flex items-center gap-4">
                         {(() => {
                            const hasCustomAvatar = memberInfo.avatar_url && memberInfo.avatar_url !== "https://i.ibb.co/6R2M5X1/churun-baby.png";
                            const resolvedSrc = hasCustomAvatar 
                               ? memberInfo.avatar_url 
                               : (memberInfo.avatar_settings?.gender === "女" ? femaleDefault : maleDefault);
                            return (
                               <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/20 shadow-lg flex-shrink-0 bg-slate-100">
                                  <img 
                                     src={resolvedSrc} 
                                     className="w-full h-full object-cover" 
                                     style={memberInfo.avatar_settings ? { 
                                        transform: `scale(${memberInfo.avatar_settings.zoom || 1}) translateY(${memberInfo.avatar_settings.offset || 0}px)` 
                                     } : undefined}
                                     alt="Avatar" 
                                  />
                               </div>
                            );
                         })()}
                        <div>
                           <p className="text-[10px] font-black tracking-[0.4em] uppercase text-emerald-300/80 mb-1">Member Account</p>
                           <h2 className="text-2xl font-black tracking-tight">{memberInfo.name}</h2>
                        </div>
                     </div>
                     <div onClick={(e) => { e.stopPropagation(); setShowTierBenefits(true); }} className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2 hover:bg-white/20 transition">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span className="text-[10px] font-black uppercase tracking-widest">查看特權</span>
                     </div>
                  </div>
                  <div className="flex justify-between items-end relative z-10">
                     <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30">Membership Tier</p>
                        <span className="text-2xl font-black tracking-tighter uppercase text-emerald-400">{memberInfo.tier}</span>
                     </div>
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
           <div className="bg-white rounded-[2.5rem] p-6 border border-slate-50 shadow-sm flex flex-col justify-between h-36">
              <div className="flex justify-between items-start">
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
                    {memberInfo.is_b2b ? "預收貨款與分紅" : "可用儲值金"}
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

        {/* Benefits Modal */}
        <AnimatePresence>
           {showTierBenefits && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTierBenefits(false)} className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-2xl flex items-end sm:items-center justify-center">
                <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} onClick={e => e.stopPropagation()} className="bg-white rounded-t-[3.5rem] sm:rounded-[3.5rem] w-full max-w-sm p-10 pb-20 shadow-2xl space-y-6">
                   <h3 className="text-2xl font-black text-slate-900">{memberInfo.tier} 特權</h3>
                   <div className="space-y-4">
                      {getTierBenefits(memberInfo.tier).map((benefit, i) => (
                        <div key={i} className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-50">
                           <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                           <span className="text-xs font-black text-slate-700">{benefit}</span>
                        </div>
                      ))}
                   </div>
                   <button onClick={() => setShowTierBenefits(false)} className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-widest">我知道了</button>
                </motion.div>
             </motion.div>
           )}
        </AnimatePresence>

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
