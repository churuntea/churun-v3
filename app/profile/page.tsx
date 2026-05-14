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
  const [femaleDefault, setFemaleDefault] = useState("https://i.ibb.co/6R2M5X1/churun-baby.png");

  useEffect(() => {
    const currentVersion = "3.0.11";
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

  const getTierPerks = (tier: string) => {
    const t = tier || "初潤寶寶";
    switch (t) {
      case "初潤寶寶":
        return { percent: "0%", desc: "一般購物返點及代理佣金基礎版", fee: "15 元", badge: "基礎級" };
      case "初潤青少年":
        return { percent: "1.0%", desc: "享提領手續費減免與零售額外回饋", fee: "10 元", badge: "新星級" };
      case "初潤好朋友":
        return { percent: "1.2%", desc: "享二級經銷合夥 1.2% 加碼分紅", fee: "10 元", badge: "好朋友級" };
      case "初潤中產階級":
        return { percent: "1.5%", desc: "享有下線組織儲值 1.5% 額外分紅", fee: "10 元", badge: "中堅級" };
      case "初潤社會支柱":
        return { percent: "2.0%", desc: "享有下線組織儲值 2.0% 額外分紅", fee: "5 元", badge: "支柱級" };
      case "初潤中流砥柱":
        return { percent: "2.5%", desc: "享下線儲值 2.5% 分紅，尊榮提領免手續費", fee: "免手續費 (0元)", badge: "中流砥柱" };
      case "初潤意見領袖":
        return { percent: "3.0%", desc: "享下線儲值 3.0% 額外佣金，提領免手續費", fee: "免手續費 (0元)", badge: "意見領袖" };
      case "初潤靈魂伴侶":
        return { percent: "5.0%", desc: "終身最頂級 5.0% 佣金加成，提領免手續費", fee: "免手續費 (0元)", badge: "靈魂伴侶 (終身)" };
      default:
        return { percent: "0%", desc: "基礎會員特權", fee: "15 元", badge: "一般會員" };
    }
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
         <div className="relative w-full perspective-1000 group cursor-pointer" style={{ height: '350px' }} onClick={() => setIsFlipped(!isFlipped)}>
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
                                ? memberInfo.avatar_url 
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
                           <h2 className="text-2xl font-black tracking-tight">{memberInfo.name}</h2>
                        </div>
                     </div>
                     <span className="text-[9px] font-black text-emerald-300 bg-white/10 px-3 py-1.5 rounded-full uppercase tracking-widest font-mono border border-white/10 backdrop-blur-md">
                        {memberInfo.tier}
                     </span>
                  </div>

                  {/* 中間：直觀特權指標與權益說明 */}
                  <div className="relative z-10 space-y-2 my-auto py-2">
                     <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col justify-center text-left">
                           <span className="text-[8px] font-black text-white/60 block uppercase tracking-wider mb-0.5">進貨/返點分紅</span>
                           <span className="text-xl font-mono font-black text-amber-300">{getTierPerks(memberInfo.tier).percent}</span>
                        </div>
                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col justify-center text-left">
                           <span className="text-[8px] font-black text-white/60 block uppercase tracking-wider mb-0.5">提現手續費</span>
                           <span className="text-base font-mono font-black text-emerald-300">{getTierPerks(memberInfo.tier).fee}</span>
                        </div>
                     </div>
                     <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-left space-y-0.5">
                        <span className="text-[8px] font-black text-amber-300 block uppercase tracking-wider">🎯 保級與專屬權益：</span>
                        <p className="text-[10px] font-bold text-white/90 leading-snug line-clamp-2">
                           {getTierBenefits(memberInfo.tier).join(" / ")}
                        </p>
                     </div>
                  </div>

                  {/* 底部：等級與提示 */}
                  <div className="flex justify-between items-end relative z-10">
                     <div className="space-y-1 text-left">
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
