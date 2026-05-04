"use client";
// Build: 2026-05-04 19:30


import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Download
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { QRCodeCanvas } from "qrcode.react";


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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    setCurrentUserId(savedId);
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUserId) return;
      setIsLoading(true);
      
      const { data: mData } = await supabase.from("members").select("*").eq("id", currentUserId).single();
      setMemberInfo(mData);

      const { data: pData } = await supabase.from("products").select("*").eq("status", "active").limit(4);
      setProducts(pData || []);

      const { data: aData } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(5);
      setAnnouncements(aData || []);

      setIsLoading(false);
    };
    fetchData();
  }, [currentUserId]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleDownloadQR = () => {
    const canvas = document.querySelector("#share-qr-canvas") as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `churun-referral-${memberInfo?.member_code}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleNativeShare = async () => {
    const link = `${window.location.origin}/register?ref=${memberInfo?.member_code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: '加入初潤製茶所',
          text: `使用我的推薦代碼 ${memberInfo?.member_code} 加入初潤，開啟您的數位茶飲之旅！`,
          url: link,
        });
      } catch (err) {
        console.log('Share failed', err);
      }
    } else {
      navigator.clipboard.writeText(link);
      alert("推薦連結已複製！");
    }
  };

  if (isLoading || !memberInfo) return <DashboardSkeleton />;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8 } }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32 overflow-x-hidden">
      
      {/* Premium Header - Refactored for better click stability */}
      <div className="fixed top-0 left-0 right-0 z-[60] pointer-events-none">
        <nav className="max-w-lg mx-auto px-6 py-4 flex justify-between items-center bg-[#FDFBF7]/90 backdrop-blur-xl border-b border-slate-100 pointer-events-auto">
           <motion.div 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             className="flex items-center gap-3"
           >
              <div className="w-10 h-10 bg-emerald-900 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-900/20">
                 <span className="text-white font-black text-sm tracking-tighter">CR</span>
              </div>
              <div>
                 <h1 className="text-xs font-black tracking-[0.2em] text-slate-800 uppercase leading-none">Churun Tea</h1>
                 <p className="text-[8px] font-bold text-slate-400 tracking-widest mt-1 uppercase">Digital Member HQ</p>
              </div>
           </motion.div>
           <div className="flex items-center gap-4">
              {currentUserId && <NotificationBell memberId={currentUserId} />}
           </div>
        </nav>
      </div>

      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-lg mx-auto px-6 pt-24 space-y-10"
      >
        
        {/* Profile Card */}
        <motion.section 
          variants={itemVariants} 
          className="relative group"
          onMouseMove={handleMouseMove}
        >
           <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-[3rem] blur-3xl opacity-20 group-hover:opacity-40 transition duration-500"></div>
           <motion.div 
             whileHover={{ rotateX: (mousePos.y - 100) / 10, rotateY: -(mousePos.x - 150) / 15 }}
             style={{ perspective: 1000 }}
             className="relative bg-mesh-emerald rounded-[3rem] p-10 text-white shadow-2xl shadow-emerald-900/20 overflow-hidden"
           >
              {/* Holographic Shine Effect */}
              <motion.div 
                className="absolute inset-0 z-0 pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.4), transparent 60%)`
                }}
              />
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex justify-between items-start mb-12">
                   <div className="space-y-4">
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 w-fit"
                      >
                         <Sparkles className="w-3 h-3 text-amber-300" />
                         <span className="text-[10px] font-black tracking-widest uppercase">{memberInfo.tier}</span>
                      </motion.div>
                      <h2 className="text-4xl font-black tracking-tight">{memberInfo.name}</h2>
                   </div>
                   <motion.button 
                     whileHover={{ scale: 1.1, rotate: 5 }}
                     whileTap={{ scale: 0.9 }}
                     onClick={() => setShowShare(true)}
                     className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/10 shadow-inner"
                   >
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
  
                {/* Tier Progress Bar */}
                <Link href="/rewards" className="mt-12 space-y-3 block group/prog cursor-pointer relative z-10">
                   <div className="flex justify-between items-end">
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/60">升級進度 (本季累積)</p>
                      <div className="flex items-center gap-2">
                         <p className="text-[10px] font-black text-amber-300">${Number(memberInfo.quarterly_spend).toLocaleString()} / $50,000</p>
                         <ChevronRight className="w-3 h-3 text-white/40 group-hover/prog:translate-x-1 transition-transform" />
                      </div>
                   </div>
                   <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((Number(memberInfo.quarterly_spend) / 50000) * 100, 100)}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className="h-full bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 relative"
                      >
                         <motion.div 
                           animate={{ x: ["-100%", "100%"] }}
                           transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                           className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/2"
                         />
                      </motion.div>
                   </div>
                   <p className="text-[8px] text-white/40 text-right italic group-hover/prog:text-white/60 transition">點擊查看下一階分潤特權</p>
                </Link>
              </div>
           </motion.div>
        </motion.section>

        {/* Quick Actions */}
        <motion.section variants={itemVariants} className="grid grid-cols-4 gap-4 px-2">
           {[
             { label: "大宗批發", icon: ShoppingBag, href: "/wholesale", color: "bg-indigo-50 text-indigo-600" },
             { label: "點數商城", icon: Gift, href: "/store", color: "bg-emerald-50 text-emerald-600" },
             { label: "組織管理", icon: Users, href: "/organization", color: "bg-amber-50 text-amber-600" },
             { label: "帳本明細", icon: Wallet, href: "/transactions", color: "bg-slate-50 text-slate-600" }
           ].map((act, i) => (
             <Link href={act.href} key={i} className="flex flex-col items-center gap-3">
                <motion.div 
                  whileHover={{ y: -5, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-16 h-16 ${act.color} rounded-[2rem] flex items-center justify-center shadow-sm border border-white transition-all`}
                >
                   <act.icon className="w-6 h-6" />
                </motion.div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{act.label}</span>
             </Link>
           ))}
        </motion.section>

        {/* Brand Pulse Announcements */}
        <section className="space-y-6 relative z-10">
           <div className="flex justify-between items-center px-2">
              <h3 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">初潤品牌脈動</h3>
              <div className="flex gap-1 items-center">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Live Updates</span>
              </div>
           </div>
           
           <div className="flex gap-6 overflow-x-auto pb-10 -mx-6 px-6 relative no-scrollbar">
               {announcements.length === 0 ? (
                 <div className="w-full py-20 text-center bg-white rounded-[3rem] border border-slate-50">
                    <Megaphone className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                    <p className="text-xs font-bold text-slate-300">目前尚無品牌快訊</p>
                 </div>
               ) : announcements.map((news, i) => (
                 <Link 
                   key={news.id}
                   href={`/brand/news/${news.id}`}
                   className="min-w-[300px] flex-shrink-0 block relative group"
                 >
                   <div className="bg-white rounded-[3rem] p-0 border border-slate-50 shadow-xl relative overflow-hidden transition-all duration-500 hover:border-emerald-200 active:scale-[0.98]">
                      <div className="h-44 w-full relative overflow-hidden">
                         <img 
                           src={news.image_url || `https://images.unsplash.com/photo-1594631252845-29fc458631b6?w=400&q=80&sig=${news.id}`} 
                           alt={news.title} 
                           className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" 
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60"></div>
                         <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[8px] font-black text-white uppercase tracking-widest ${news.color || 'bg-emerald-900'}`}>
                            {news.tag}
                         </div>
                      </div>
                      <div className="p-8 space-y-4">
                         <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                               {new Date(news.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase()}
                            </span>
                            <ArrowUpRight className="w-4 h-4 text-slate-200 group-hover:text-emerald-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                         </div>
                         <h4 className="font-bold text-slate-800 leading-tight text-lg">{news.title}</h4>
                      </div>
                   </div>
                   <div className="absolute inset-0 z-20 cursor-pointer"></div>
                 </Link>
               ))}
           </div>
        </section>

        {/* Featured Store */}
        <motion.section variants={itemVariants} className="space-y-6">
           <div className="flex justify-between items-center px-2">
              <h3 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">精品嚴選商城</h3>
              <Link href="/store" className="text-[10px] font-black text-emerald-600 flex items-center gap-1 hover:gap-2 transition-all">
                 VIEW ALL <ChevronRight className="w-3 h-3" />
              </Link>
           </div>
           
           <div className="grid grid-cols-2 gap-6">
              {products.map((p, i) => (
                <motion.div 
                  key={p.id}
                  whileHover={{ y: -8 }}
                  className="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col group"
                >
                   <div className="aspect-[4/5] w-full bg-slate-50 relative overflow-hidden">
                      <img src={p.image_url || "https://images.unsplash.com/photo-1544787210-2213d2427384?w=400"} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" />
                      <div className="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur-md rounded-xl flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition">
                         <Plus className="w-4 h-4 text-emerald-900" />
                      </div>
                   </div>
                   <div className="p-6 space-y-2">
                      <h4 className="font-bold text-slate-800 text-sm truncate">{p.name}</h4>
                      <div className="flex justify-between items-center">
                         <span className="text-emerald-600 font-black text-sm">${p.price}</span>
                         <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Buy Now</span>
                      </div>
                   </div>
                </motion.div>
              ))}
           </div>
        </motion.section>

      </motion.main>

      {/* Share Modal */}
      <AnimatePresence>
        {showShare && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-2xl flex items-center justify-center p-8"
            onClick={() => setShowShare(false)}
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               exit={{ scale: 0.9, y: 20 }}
               className="bg-white rounded-[3rem] p-12 w-full max-w-sm text-center shadow-2xl relative overflow-hidden"
               onClick={e => e.stopPropagation()}
             >
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-emerald-50 rounded-full blur-3xl opacity-50"></div>
                 
                 <div className="w-20 h-20 bg-emerald-900 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-900/20 rotate-3">
                    <QrCode className="w-10 h-10 text-white" />
                 </div>
                 
                 <h3 className="text-2xl font-black text-slate-900 mb-2">專屬推薦代碼</h3>
                 <p className="text-sm text-slate-400 mb-8">分享您的代碼，與夥伴一同開啟數位茶飲之旅。</p>
                 
                 <AnimatePresence mode="wait">
                    {!showQR ? (
                      <motion.div 
                        key="id-box"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={() => setShowQR(true)}
                        className="bg-slate-50 p-8 rounded-[2rem] mb-6 border border-slate-100 cursor-pointer hover:bg-slate-100 transition relative group"
                      >
                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">您的會員編號 (點擊切換 QR)</p>
                         <span className="text-3xl font-black tracking-[0.3em] text-emerald-900 uppercase">{memberInfo.member_code}</span>
                         <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 rounded-[2rem] transition flex items-center justify-center">
                            <QrCode className="w-6 h-6 text-emerald-900/20" />
                         </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="qr-box"
                        initial={{ opacity: 0, scale: 0.9, rotateY: 180 }}
                        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                        exit={{ opacity: 0, scale: 0.9, rotateY: 180 }}
                        onClick={() => setShowQR(false)}
                        className="bg-white p-6 rounded-[2.5rem] mb-6 shadow-[0_15px_40px_rgba(0,0,0,0.05)] border border-slate-50 flex items-center justify-center relative group mx-auto w-fit cursor-pointer"
                      >
                         <QRCodeCanvas 
                           id="share-qr-canvas"
                           value={`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${memberInfo.member_code}`}
                           size={180}
                           level={"H"}
                           includeMargin={true}
                         />
                         <div className="absolute top-2 right-2 text-[8px] font-black text-slate-200 uppercase tracking-widest">點擊返回代碼</div>
                      </motion.div>
                    )}
                 </AnimatePresence>

                 <div className="mb-10">
                    <Link 
                      href={`/qrcode?url=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${memberInfo.member_code}`)}`}
                      className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline flex items-center justify-center gap-2"
                    >
                       <Sparkles className="w-3 h-3" /> 開啟全螢幕掃描頁面
                    </Link>
                 </div>

                 <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        setShowShare(false);
                        setShowQR(false);
                      }} 
                      className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition"
                    >
                       關閉視窗
                    </button>
                    <button 
                      onClick={handleNativeShare}
                      className="flex-1 py-5 bg-emerald-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-800 transition shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2"
                    >
                       <Share2 className="w-4 h-4" /> 分享連結
                    </button>
                 </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 z-50">
         <motion.div 
           initial={{ y: 100 }}
           animate={{ y: 0 }}
           className="bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] p-3 flex justify-between items-center shadow-2xl shadow-slate-900/30 border border-white/5"
         >
            <Link href="/" className="flex-1 flex flex-col items-center gap-1 text-white transition">
               <LayoutDashboard className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Dashboard</span>
            </Link>
            <Link href="/store" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <ShoppingBag className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Shop</span>
            </Link>
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 90 }}
              onClick={() => setShowShare(true)}
              className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 -mt-8 border-4 border-[#FDFBF7] cursor-pointer"
            >
               <Plus className="w-6 h-6 text-white" />
            </motion.div>
            <Link href="/organization" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <Zap className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Team</span>
            </Link>
            <Link href="/profile" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <User className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Me</span>
            </Link>
         </motion.div>
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