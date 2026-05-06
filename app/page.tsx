"use client";
// Build: 2026-05-04 19:30

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "./supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, 
  Star, 
  Users, 
  ShoppingBag, 
  ChevronRight, 
  LayoutDashboard, 
  Zap, 
  User, 
  Plus, 
  ArrowUpRight, 
  Share2, 
  QrCode,
  Bell,
  Sparkles,
  Loader2,
  Gift,
  Megaphone,
  Download,
  Copy,
  UserPlus,
  X,
  TrendingUp,
  Heart,
  CheckCircle2,
  IdCard
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { QRCodeCanvas } from "qrcode.react";

const CR_LOGO = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjMwIiBmaWxsPSIjMDY0ZTMiLz48dGV4dCB4PSI1MCIgeT0iNjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI0NSIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5DUjwvdGV4dD48L3N2Zz4=";

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32 animate-pulse">
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 max-w-lg mx-auto flex justify-between items-center bg-[#FDFBF7]/80 backdrop-blur-xl border-b border-slate-100">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-2xl"></div>
            <div className="space-y-2">
               <div className="w-20 h-2 bg-slate-200 rounded"></div>
               <div className="w-24 h-1.5 bg-slate-100 rounded"></div>
            </div>
         </div>
      </nav>
      <main className="max-w-lg mx-auto px-6 pt-24 space-y-10">
         <div className="w-full aspect-[1.6/1] bg-slate-200 rounded-[3rem]"></div>
         <div className="grid grid-cols-4 gap-4 px-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex flex-col items-center gap-3">
                 <div className="w-16 h-16 bg-slate-200 rounded-[2rem]"></div>
                 <div className="w-10 h-2 bg-slate-100 rounded"></div>
              </div>
            ))}
         </div>
         <div className="space-y-4">
            <div className="w-32 h-4 bg-slate-200 rounded ml-2"></div>
            <div className="flex gap-6 overflow-hidden">
               <div className="min-w-[300px] h-60 bg-slate-200 rounded-[3rem]"></div>
               <div className="min-w-[300px] h-60 bg-slate-100 rounded-[3rem]"></div>
            </div>
         </div>
      </main>
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toolParam = searchParams.get('tool');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [downlines, setDownlines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [memberAvatar, setMemberAvatar] = useState<string | null>(null);
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarOffset, setAvatarOffset] = useState(0);
  const [memberMotto, setMemberMotto] = useState("以初心、致潤澤");
  const [posterTemplates, setPosterTemplates] = useState<any[]>([]);
  const [showPosterSelector, setShowPosterSelector] = useState(false);
  const [showPosterPreview, setShowPosterPreview] = useState(false);
  const [selectedPoster, setSelectedPoster] = useState<any>(null);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [posterDataUrl, setPosterDataUrl] = useState<string | null>(null);
  const [showShareHub, setShowShareHub] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    const currentVersion = "3.0.0";
    const savedVersion = localStorage.getItem("churun_home_version");
    if (savedVersion !== currentVersion) {
      localStorage.setItem("churun_home_version", currentVersion);
      window.location.reload();
      return;
    }
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) { router.replace("/login"); return; }
    setCurrentUserId(savedId);
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUserId) return;
      setIsLoading(true);
      const { data: mData } = await supabase.from("members").select("*").eq("id", currentUserId).single();
      setMemberInfo(mData);
      if (mData?.avatar_url) {
        setMemberAvatar(`${mData.avatar_url}?t=${Date.now()}`);
      } else {
        setMemberAvatar("https://i.ibb.co/6R2M5X1/churun-baby.png");
      }
      if (mData?.avatar_settings) {
        setAvatarZoom(mData.avatar_settings.zoom || 1);
        setAvatarOffset(mData.avatar_settings.offset || 0);
      }
      setMemberMotto(mData?.motto || "以初心、致潤澤");

      const { data: dData } = await supabase.from("members").select("id").eq("upline_id", currentUserId);
      setDownlines(dData || []);

      const { data: aData } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(5);
      setAnnouncements(aData || []);

      const { data: pData } = await supabase.from("poster_templates").select("*").eq("is_active", true).order("created_at", { ascending: false });
      setPosterTemplates(pData || []);

      setIsLoading(false);
    };
    fetchData();
  }, [currentUserId]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleGeneratePoster = async (template: any) => {
    setSelectedPoster(template);
    setShowPosterSelector(false);
    setIsGeneratingPoster(true);
    setShowPosterPreview(true);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = template.url;
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const config = template.config || {
        qr: { x: 800, y: 1100, size: 160 },
        name: { x: 380, y: 1120, size: 28, color: "#ffffff" },
        phone: { x: 380, y: 1155, size: 24, color: "#ffffff" }
      };
      const hiddenQr = document.querySelector("#hidden-qr-canvas canvas") as HTMLCanvasElement;
      if (hiddenQr) ctx.drawImage(hiddenQr, config.qr.x, config.qr.y, config.qr.size, config.qr.size);
      ctx.fillStyle = config.name.color || '#ffffff';
      ctx.font = `black ${config.name.size}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(memberInfo.name, config.name.x, config.name.y);
      ctx.fillStyle = config.phone.color || config.name.color || '#ffffff';
      ctx.font = `bold ${config.phone.size}px sans-serif`;
      ctx.fillText(memberInfo.phone || '', config.phone.x, config.phone.y);
      setPosterDataUrl(canvas.toDataURL('image/png'));
      setIsGeneratingPoster(false);
    };
  };

  const downloadGeneratedPoster = () => {
    if (!posterDataUrl) return;
    const link = document.createElement('a');
    link.download = `churun-poster-${memberInfo.member_code}.png`;
    link.href = posterDataUrl;
    link.click();
    setShowPosterPreview(false);
  };

  if (isLoading || !memberInfo) return <DashboardSkeleton />;

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.8 } } };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32 overflow-x-hidden">
      {/* Premium Header */}
      <div className="fixed top-0 left-0 right-0 z-[60] pointer-events-none">
        <nav className="max-w-lg mx-auto px-6 py-4 flex justify-between items-center bg-[#FDFBF7]/90 backdrop-blur-xl border-b border-slate-100 pointer-events-auto">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-900 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-900/20">
                 <span className="text-white font-black text-sm tracking-tighter">CR</span>
              </div>
               <div>
                  <h1 className="text-xs font-black tracking-[0.2em] text-slate-800 uppercase leading-none flex items-center gap-2">
                     Churun Tea <span className="text-[7px] bg-emerald-50 px-2 py-1 rounded-full text-emerald-600 border border-emerald-100 font-bold">V3.0.0</span>
                  </h1>
                  <p className="text-[8px] font-bold text-slate-400 tracking-widest mt-1 uppercase">Digital Member HQ</p>
               </div>
           </div>
           <div className="flex items-center gap-4">
              {currentUserId && <NotificationBell memberId={currentUserId} />}
           </div>
        </nav>
      </div>

      <motion.main variants={containerVariants} initial="hidden" animate="show" className="max-w-lg mx-auto px-6 pt-24 space-y-10">
        {/* Profile Card */}
        <motion.section variants={itemVariants} className="relative group" onMouseMove={handleMouseMove}>
           <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-[3rem] blur-3xl opacity-20 group-hover:opacity-40 transition duration-500"></div>
           <motion.div style={{ perspective: 1000 }} className="relative bg-mesh-emerald rounded-[3rem] p-10 text-white shadow-2xl shadow-emerald-900/20 overflow-hidden">
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex justify-between items-start mb-12">
                   <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-[2rem] overflow-hidden border-2 border-white/20 shadow-2xl relative">
                         <img src={memberAvatar || "https://i.ibb.co/6R2M5X1/churun-baby.png"} className="w-full h-full object-cover" style={{ transform: `scale(${avatarZoom}) translateY(${avatarOffset}px)` }} alt="Avatar" />
                      </div>
                      <div className="space-y-3">
                         <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 w-fit">
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            <span className="text-[10px] font-black tracking-widest uppercase">{memberInfo.tier}</span>
                         </div>
                         <h2 className="text-4xl font-black tracking-tight">{memberInfo.name}</h2>
                         <div className="flex items-center gap-3 mt-3">
                            <div className="w-5 h-[1px] bg-white/20"></div>
                            <p className="text-[11px] font-bold text-white/80 tracking-[0.4em] uppercase italic">{memberMotto}</p>
                            <div className="w-5 h-[1px] bg-white/20"></div>
                         </div>
                      </div>
                   </div>
                   <motion.button whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }} onClick={() => setShowShareHub(true)} className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/10 shadow-inner">
                      <Share2 className="w-6 h-6" />
                   </motion.button>
                </div>
  
                <div className="grid grid-cols-2 gap-6 relative z-10">
                   <div className="space-y-1">
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">虛擬預收貨款</p>
                      <h3 className="text-2xl font-black tracking-tighter">${Number(memberInfo.virtual_balance).toLocaleString()}</h3>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">紅利點數餘額</p>
                      <h3 className="text-2xl font-black tracking-tighter">{memberInfo.points_balance.toLocaleString()} <span className="text-[10px] font-medium ml-1">pts</span></h3>
                   </div>
                </div>
  
                <Link href="/rewards" className="mt-12 space-y-3 block group/prog cursor-pointer relative z-10">
                   <div className="flex justify-between items-end">
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/60">升級進度 (本季累積)</p>
                      <div className="flex items-center gap-2">
                         <p className="text-[10px] font-black text-amber-300">${Number(memberInfo.quarterly_spend).toLocaleString()} / $50,000</p>
                         <ChevronRight className="w-3 h-3 text-white/40 group-hover/prog:translate-x-1 transition-transform" />
                      </div>
                   </div>
                   <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((Number(memberInfo.quarterly_spend) / 50000) * 100, 100)}%` }} transition={{ duration: 1.5, ease: "circOut" }} className="h-full bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 relative" />
                   </div>
                </Link>
              </div>
           </motion.div>
        </motion.section>

        {/* Honor Badges */}
        <section className="space-y-6">
           <div className="flex justify-between items-center px-4">
              <h3 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">榮譽成就勳章</h3>
           </div>
           <div className="flex gap-6 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
              {[
                { name: "初入江湖", desc: "完成首筆訂單", icon: Sparkles, color: "bg-indigo-50 text-indigo-500", earned: true },
                { name: "團隊領袖", desc: "直推夥伴滿 5 人", icon: Users, color: "bg-emerald-50 text-emerald-500", earned: Number(downlines?.length || 0) >= 5 },
                { name: "業績推手", desc: "累計業績破萬", icon: TrendingUp, color: "bg-amber-50 text-amber-500", earned: Number(memberInfo?.lifetime_spend || 0) >= 10000 },
              ].map((badge, i) => (
                <div key={i} className="min-w-[140px] p-6 rounded-[2.5rem] border bg-white border-slate-100 shadow-xl flex flex-col items-center gap-4">
                   <div className={`w-14 h-14 ${badge.color} rounded-[1.5rem] flex items-center justify-center shadow-inner`}>
                      <badge.icon className="w-7 h-7" />
                   </div>
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800 text-center">{badge.name}</h4>
                </div>
              ))}
           </div>
        </section>

        {/* Brand Insights Feed */}
        <section className="grid grid-cols-4 gap-4 px-2">
           {[
             { label: "大宗批發", icon: ShoppingBag, href: "/wholesale", color: "bg-indigo-50 text-indigo-600" },
             { label: "點數商城", icon: Gift, href: "/store", color: "bg-emerald-50 text-emerald-600" },
             { label: "組織管理", icon: Users, href: "/organization", color: "bg-amber-50 text-amber-600" },
             { label: "帳本明細", icon: Wallet, href: "/transactions", color: "bg-slate-50 text-slate-600" }
           ].map((act, i) => (
             <Link href={act.href} key={i} className="flex flex-col items-center gap-3">
                <div className={`w-16 h-16 ${act.color} rounded-[2rem] flex items-center justify-center shadow-sm border border-white`}>
                   <act.icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{act.label}</span>
             </Link>
           ))}
        </section>

        {/* Announcements */}
        <section className="space-y-6">
           <h3 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase px-2">初潤品牌脈動</h3>
           <div className="flex gap-6 overflow-x-auto pb-10 -mx-6 px-6 no-scrollbar">
               {announcements.length === 0 ? (
                 <div className="w-full py-20 text-center bg-white rounded-[3rem] border border-slate-50">
                    <Megaphone className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                    <p className="text-xs font-bold text-slate-300">目前尚無品牌快訊</p>
                 </div>
               ) : announcements.map((news) => (
                 <Link key={news.id} href={`/brand/news/${news.id}`} className="min-w-[300px] flex-shrink-0 block relative group">
                   <div className="bg-white rounded-[3rem] border border-slate-50 shadow-xl overflow-hidden">
                      <div className="h-44 w-full relative">
                         <img src={news.image_url || "https://images.unsplash.com/photo-1594631252845-29fc458631b6?w=400&q=80"} alt={news.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-8">
                         <h4 className="font-bold text-slate-800 text-lg">{news.title}</h4>
                      </div>
                   </div>
                 </Link>
               ))}
           </div>
        </section>
      </motion.main>

      {/* Share Hub Modal */}
      <AnimatePresence>
        {showShareHub && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-2xl flex items-end sm:items-center justify-center" onClick={() => setShowShareHub(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 220 }} onClick={e => e.stopPropagation()} className="bg-white rounded-t-[3.5rem] sm:rounded-[3.5rem] w-full max-w-sm p-8 pb-16 sm:pb-10 shadow-2xl space-y-5">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-xl font-black text-slate-900">分享中心</h3>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Share Hub</p>
                </div>
                <button onClick={() => setShowShareHub(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="bg-slate-50 rounded-[2rem] p-5 flex items-center gap-4 border border-slate-100">
                <div className="w-14 h-14 bg-emerald-900 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/20 flex-shrink-0"><QrCode className="w-7 h-7 text-white" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">我的推薦代碼</p>
                  <p className="text-2xl font-black text-slate-900 tracking-widest mt-0.5">{memberInfo?.member_code}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => {
                  const link = `${window.location.origin}/register?ref=${memberInfo?.member_code}`;
                  navigator.clipboard.writeText(link);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }} className="bg-emerald-900 text-white rounded-[2rem] p-5 flex flex-col items-center gap-3 shadow-xl shadow-emerald-900/20">
                  <UserPlus className="w-6 h-6" />
                  <span className="text-[9px] font-black uppercase tracking-widest">{copiedLink ? '已複製！' : '推薦註冊連結'}</span>
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => {
                  setShowShareHub(false);
                  setTimeout(() => setShowQrModal(true), 300);
                }} className="bg-slate-900 text-white rounded-[2rem] p-5 flex flex-col items-center gap-3 shadow-xl shadow-slate-900/20">
                  <QrCode className="w-6 h-6" />
                  <span className="text-[9px] font-black uppercase tracking-widest">顯示 QR 碼</span>
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => { setShowShareHub(false); router.push('/profile/security/vcard'); }} className="bg-amber-50 text-amber-700 border border-amber-100 rounded-[2rem] p-5 flex flex-col items-center gap-3">
                  <IdCard className="w-6 h-6" />
                  <span className="text-[9px] font-black uppercase tracking-widest">電子名片</span>
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => { setShowShareHub(false); setTimeout(() => setShowPosterSelector(true), 300); }} className="bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-[2rem] p-5 flex flex-col items-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  <span className="text-[9px] font-black uppercase tracking-widest">產生海報</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Poster Selector */}
      <AnimatePresence>
        {showPosterSelector && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8" onClick={() => setShowPosterSelector(false)}>
             <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[3.5rem] p-8 w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[95vh]" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-black text-slate-900 mb-6 text-center">選擇行銷海報</h3>
                <div className="overflow-y-auto no-scrollbar grid grid-cols-2 gap-4 pb-4">
                   {posterTemplates.map((temp) => (
                     <div key={temp.id} onClick={() => handleGeneratePoster(temp)} className="aspect-[1/1.4] rounded-2xl overflow-hidden border-4 border-white shadow-lg cursor-pointer relative group">
                        <img src={temp.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-emerald-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Sparkles className="w-8 h-8 text-white" /></div>
                     </div>
                   ))}
                </div>
                <button onClick={() => setShowPosterSelector(false)} className="mt-6 w-full py-4 text-slate-300 font-black text-[10px] uppercase tracking-widest">取消</button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Poster Preview */}
      <AnimatePresence>
        {showPosterPreview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-3xl flex items-center justify-center p-4 sm:p-8">
             <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="bg-white rounded-[3.5rem] p-8 w-full max-w-md shadow-2xl relative flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-6">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Poster Preview</span>
                   <button onClick={() => setShowPosterPreview(false)} className="text-slate-300 hover:text-slate-900"><X /></button>
                </div>
                <div className="w-full aspect-[1/1.4] bg-slate-100 rounded-2xl overflow-hidden shadow-2xl relative mb-8">
                   {isGeneratingPoster ? <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/80"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div> : <img src={posterDataUrl || ''} className="w-full h-full object-contain" />}
                </div>
                <button onClick={downloadGeneratedPoster} className="w-full bg-emerald-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-900/20 active:scale-95 transition flex items-center justify-center gap-3">
                   <Download className="w-4 h-4" /> 確認無誤，下載儲存
                </button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Display Modal */}
      <AnimatePresence>
        {showQrModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-2xl flex items-center justify-center p-4" onClick={() => setShowQrModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[3.5rem] p-8 w-full max-w-sm shadow-2xl relative flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
              <div className="w-full flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-lg font-black text-slate-900 text-left">推薦 QR 碼</h4>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest text-left mt-0.5">Sponsor QR Code</p>
                </div>
                <button onClick={() => setShowQrModal(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="bg-emerald-50/50 p-6 rounded-[2.5rem] border border-emerald-50/50 mb-6 flex justify-center items-center shadow-inner">
                <QRCodeCanvas value={`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${memberInfo?.member_code}`} size={200} level="H" className="rounded-2xl p-3 bg-white shadow-md border border-slate-100" />
              </div>

              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">我的推薦代碼</p>
              <h4 className="text-2xl font-black text-emerald-900 tracking-widest mt-1 mb-4">{memberInfo?.member_code}</h4>
              <p className="text-xs text-slate-500 font-bold px-4 leading-relaxed">
                新夥伴掃描此 QR 碼，系統將自動填入並鎖定您的推薦人代碼。
              </p>
              
              <button onClick={() => setShowQrModal(false)} className="mt-8 w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-900/10 active:scale-95 transition">關閉</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 z-50">
         <div className="bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] p-3 flex justify-between items-center shadow-2xl border border-white/5">
            <Link href="/" className="flex-1 flex flex-col items-center gap-1 text-white transition"><LayoutDashboard className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-[0.2em]">Home</span></Link>
            <Link href="/store" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition"><ShoppingBag className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-[0.2em]">Shop</span></Link>
            <div onClick={() => router.push("/profile")} className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg -mt-8 border-4 border-[#FDFBF7] cursor-pointer"><Plus className="w-6 h-6 text-white" /></div>
            <Link href="/organization" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition"><Zap className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-[0.2em]">Team</span></Link>
            <Link href="/profile" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition"><User className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-[0.2em]">Me</span></Link>
         </div>
      </div>

      <div className="opacity-0 pointer-events-none absolute -z-10" aria-hidden="true" id="hidden-qr-canvas">
        <QRCodeCanvas value={`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${memberInfo?.member_code}`} size={512} level="H" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}