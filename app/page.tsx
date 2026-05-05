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
  CheckCircle2
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
  const [products, setProducts] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [downlines, setDownlines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const currentVersion = "2.0.0";
    const savedVersion = localStorage.getItem("churun_home_version");
    if (savedVersion !== currentVersion) {
      localStorage.setItem("churun_home_version", currentVersion);
      window.location.reload();
      return;
    }

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

      // 載入頭像與設定
      if (mData?.avatar_url) {
        setMemberAvatar(mData.avatar_url);
      }
      if (mData?.avatar_settings) {
        setAvatarZoom(mData.avatar_settings.zoom || 1);
        setAvatarOffset(mData.avatar_settings.offset || 0);
      }
      if (mData?.motto) {
        setMemberMotto(mData.motto);
      }

      const { data: dData } = await supabase.from("members").select("id").eq("upline_id", currentUserId);
      setDownlines(dData || []);

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

  const handleLineShare = () => {
    const link = `${window.location.origin}/register?ref=${memberInfo?.member_code}`;
    const text = `加入初潤製茶所！使用我的推薦代碼 ${memberInfo?.member_code} 領取專屬優惠：`;
    window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const [memberAvatar, setMemberAvatar] = useState<string | null>(null);
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarOffset, setAvatarOffset] = useState(0); // Vertical offset
  const [memberMotto, setMemberMotto] = useState("以初心、致潤澤");
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'card' | 'poster'>('card');
  const [selectedPosterIndex, setSelectedPosterIndex] = useState(0);

  useEffect(() => {
    if (toolParam === 'poster') {
       setShowShare(true);
       setSelectedTemplate('poster');
    }
  }, [toolParam]);


  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMemberAvatar(reader.result as string);
        setAvatarZoom(1.2); 
        setAvatarOffset(0);
        setIsEditingAvatar(true); // Open adjustment view immediately
      };
      reader.readAsDataURL(file);
    }
  };

  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const handleSaveAvatarSettings = async () => {
    if (!currentUserId) return;
    setIsSavingAvatar(true);
    
    try {
      const isNewUpload = memberAvatar?.startsWith('data:image');
      const response = await fetch('/api/member/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: currentUserId,
          avatarBase64: isNewUpload ? memberAvatar : null,
          avatarSettings: {
            zoom: avatarZoom,
            offset: avatarOffset
          },
          motto: memberMotto
        })
      });
      
      const result = await response.json().catch(() => ({ success: false, error: '伺服器回應格式錯誤 (可能是資料庫欄位尚未建立)' }));
      
      if (result.success) {
        if (result.avatarUrl) setMemberAvatar(result.avatarUrl);
        setMemberInfo((prev: any) => ({ 
          ...prev, 
          avatar_url: result.avatarUrl || prev.avatar_url,
          avatar_settings: { zoom: avatarZoom, offset: avatarOffset },
          motto: memberMotto
        }));
        alert('個人化設定已成功儲存！');
        setIsEditingAvatar(false);
      } else {
        console.error('Save failed:', result.error);
        alert('儲存失敗: ' + (result.error || '原因不明'));
      }
    } catch (err: any) {
      console.error('System error:', err);
      alert('系統發生異常: ' + (err.message || '請檢查網路連線或聯絡管理員'));
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handleDownloadBusinessCard = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Card Dimensions (High Res for Print Quality)
    canvas.width = 1200;
    canvas.height = 700;

    // 1. Background (Deep Emerald Luxury Gradient)
    const gradient = ctx.createLinearGradient(0, 0, 1200, 700);
    gradient.addColorStop(0, '#064e3b');
    gradient.addColorStop(0.5, '#065f46');
    gradient.addColorStop(1, '#022c22');
    ctx.fillStyle = gradient;
    
    // Draw rounded card body
    const radius = 80;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(0, 0, 1200, 700, radius) : ctx.rect(0, 0, 1200, 700);
    ctx.fill();

    // 2. Artistic Background Elements (Subtle Tea leaf pattern simulation)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 2;
    for(let i = 0; i < 1200; i += 60) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.bezierCurveTo(i + 100, 200, i - 100, 500, i + 50, 700);
      ctx.stroke();
    }

    // 3. Branding Header
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = 'bold 24px "Inter", sans-serif';
    ctx.letterSpacing = "8px";
    ctx.fillText('CHURUN TEA HOUSE | OFFICIAL IDENTITY', 80, 80);
    ctx.letterSpacing = "0px";

    // 4. Main Identity Info (Left Side)
    // Name
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 110px "Inter", sans-serif';
    ctx.fillText(memberInfo.name, 80, 340);
    ctx.shadowBlur = 0;

    // Member Code with Accent
    ctx.fillStyle = '#10b981';
    ctx.font = '800 52px monospace';
    ctx.letterSpacing = "4px";
    ctx.fillText(memberInfo.member_code, 80, 430);
    ctx.letterSpacing = "0px";

    // Tier Badge Label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(80, 470, 180, 40, 10) : ctx.rect(80, 470, 180, 40);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(memberInfo.tier.toUpperCase(), 100, 497);

    // 5. Right Side: Identity Box (Photo + QR)
    const boxX = 700, boxY = 80, boxW = 420, boxH = 540;
    
    // Glassmorphism effect for the box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(boxX, boxY, boxW, boxH, 60) : ctx.rect(boxX, boxY, boxW, boxH);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const finishIdentityCard = () => {
       // Draw QR Code below Avatar
       const qSize = 180;
       const qX = boxX + (boxW - qSize) / 2;
       const qY = boxY + 310;
       
       // White QR Background
       ctx.fillStyle = '#ffffff';
       ctx.beginPath();
       ctx.roundRect ? ctx.roundRect(qX - 15, qY - 15, qSize + 30, qSize + 30, 30) : ctx.rect(qX - 15, qY - 15, qSize + 30, qSize + 30);
       ctx.fill();

       const hiddenQr = document.querySelector("#hidden-qr-canvas canvas") as HTMLCanvasElement;
       if (hiddenQr) {
         ctx.drawImage(hiddenQr, qX, qY, qSize, qSize);
       }

       ctx.fillStyle = '#ffffff';
       ctx.font = 'bold 22px sans-serif';
       ctx.textAlign = 'center';
       ctx.fillText('掃描加入初潤', boxX + boxW/2, qY + qSize + 55);
       
       // Signature Line
       ctx.textAlign = 'left';
       ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
       ctx.font = 'italic 20px serif';
       ctx.fillText('Digital Authenticated Member', 80, 620);

       // Final Download
       const dataUrl = canvas.toDataURL('image/png');
       const link = document.createElement('a');
       link.download = `churun-identity-${memberInfo.member_code}.png`;
       link.href = dataUrl;
       link.click();
    };

    if (memberAvatar) {
       const img = new Image();
       img.crossOrigin = "anonymous";
       img.src = memberAvatar;
       img.onload = () => {
          ctx.save();
          const avatarSize = 340;
          const avatarX = boxX + (boxW - avatarSize) / 2;
          const avatarY = boxY + 40;
          
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 45) : ctx.rect(avatarX, avatarY, avatarSize, avatarSize);
          ctx.clip();
          
          const sW = img.width, sH = img.height, aspect = sW / sH;
          let targetW = avatarSize, targetH = avatarSize;
          
          if (aspect > 1) {
            targetW = avatarSize * aspect * avatarZoom;
            targetH = avatarSize * avatarZoom;
          } else {
            targetH = (avatarSize / aspect) * avatarZoom;
            targetW = avatarSize * avatarZoom;
          }
          
          ctx.drawImage(img, avatarX - (targetW - avatarSize) / 2, avatarY - (targetH - avatarSize) / 2 + avatarOffset, targetW, targetH);
          ctx.restore();
          
          // Border for avatar
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 4;
          ctx.stroke();

          finishIdentityCard();
       };
    } else {
       finishIdentityCard();
    }
  };

  // Removed drawQRAndFinish as it's now integrated into the specific download handlers for better control

  const posterTemplates = [
    { 
      id: 1, 
      name: '尊榮禮盒系列', 
      url: 'https://i.ibb.co/Vp8nF6Y/dm-template.jpg',
      config: {
        qr: { x: 800, y: 1100, size: 160 },
        name: { x: 380, y: 1120, size: 28, color: '#ffffff' },
        phone: { x: 380, y: 1155, size: 24, color: '#ffffff' }
      }
    },
    { 
      id: 2, 
      name: '品牌故事海報', 
      url: 'https://images.unsplash.com/photo-1594631252845-29fc458631b6?w=1200&q=80',
      config: {
        qr: { x: 50, y: 50, size: 120, overlay: true },
        name: { x: 50, y: 200, size: 30, color: '#064e3b', overlay: true },
        phone: { x: 50, y: 240, size: 24, color: '#064e3b', overlay: true }
      }
    }
  ];

  const handleDownloadBrandPoster = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const template = posterTemplates[selectedPosterIndex];
    const config = template.config;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = template.url;
    
    img.onload = () => {
       canvas.width = img.width;
       canvas.height = img.height;
       
       // 1. 繪製樣板底圖
       ctx.drawImage(img, 0, 0);
       
       // 2. 如果樣板需要下方的黑條遮罩（針對非特定設計的圖片）
       if (config.name.overlay) {
          const overlayH = canvas.height * 0.15;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillRect(0, canvas.height - overlayH, canvas.width, overlayH);
       }

       // 3. 繪製會員專屬 QR Code
       const hiddenQr = document.querySelector("#hidden-qr-canvas canvas") as HTMLCanvasElement;
       if (hiddenQr) {
          const { x, y, size } = config.qr;
          // QR 背景白底（確保掃描率）
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(x - 5, y - 5, size + 10, size + 10, 10) : ctx.rect(x - 5, y - 5, size + 10, size + 10);
          ctx.fill();
          ctx.drawImage(hiddenQr, x, y, size, size);
       }

       // 4. 繪製會員資訊
       ctx.textAlign = 'left';
       
       // 姓名
       ctx.fillStyle = config.name.color;
       ctx.font = `bold ${config.name.size}px sans-serif`;
       const nameY = config.name.overlay ? canvas.height - 80 : config.name.y;
       ctx.fillText(`推廣顧問：${memberInfo.name}`, config.name.x, nameY);
       
       // 電話
       ctx.fillStyle = config.phone.color;
       ctx.font = `bold ${config.phone.size}px sans-serif`;
       const phoneY = config.phone.overlay ? canvas.height - 40 : config.phone.y;
       ctx.fillText(`服務專線：${memberInfo.phone || '0900-000-000'}`, config.phone.x, phoneY);

       // 5. 下載
       const dataUrl = canvas.toDataURL('image/png');
       const link = document.createElement('a');
       link.download = `churun-marketing-${memberInfo.member_code}.png`;
       link.href = dataUrl;
       link.click();
    };
  };

  const handleDownloadVCard = () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:初潤夥伴 ${memberInfo?.name}
TEL;TYPE=CELL:${memberInfo?.phone}
NOTE:會員編號: ${memberInfo?.member_code}
URL:${window.location.origin}/register?ref=${memberInfo?.member_code}
END:VCARD`;
    
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${memberInfo?.name}_電子名片.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                  <h1 className="text-xs font-black tracking-[0.2em] text-slate-800 uppercase leading-none flex items-center gap-2">
                     Churun Tea <span className="text-[7px] bg-emerald-50 px-2 py-1 rounded-full text-emerald-600 border border-emerald-100 font-bold">V2.0.0</span>
                  </h1>
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
                   <div className="flex items-center gap-6">
                      {memberAvatar ? (
                        <div className="w-20 h-20 rounded-[2rem] overflow-hidden border-2 border-white/20 shadow-2xl relative group/avatar">
                           <img 
                             src={memberAvatar} 
                             className="w-full h-full object-cover origin-center" 
                             style={{ transform: `scale(${avatarZoom}) translateY(${avatarOffset/4}px)` }}
                             alt="Avatar" 
                           />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                           <User className="w-8 h-8 text-white/40" />
                        </div>
                      )}
                      <div className="space-y-3">
                         <motion.div 
                           whileHover={{ scale: 1.05 }}
                           className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 w-fit"
                         >
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            <span className="text-[10px] font-black tracking-widest uppercase">{memberInfo.tier}</span>
                         </motion.div>
                         <h2 className="text-4xl font-black tracking-tight">{memberInfo.name}</h2>
                         <motion.div 
                           initial={{ opacity: 0, y: 5 }}
                           animate={{ opacity: 1, y: 0 }}
                           className="flex items-center gap-3 mt-3"
                         >
                            <div className="w-5 h-[1px] bg-white/20"></div>
                            <p className="text-[11px] font-bold text-white/80 tracking-[0.4em] uppercase italic">
                               {memberMotto || '以初心、致潤澤'}
                            </p>
                            <div className="w-5 h-[1px] bg-white/20"></div>
                         </motion.div>
                      </div>
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

        {/* Invite & Rewards Section */}
        <motion.section variants={itemVariants} className="space-y-6">
           <div className="flex justify-between items-center px-4">
              <h3 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">邀請夥伴・共享獎勵</h3>
              <div className="flex items-center gap-1">
                 <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Rewards</span>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-4">
              <div className="bg-white rounded-[3rem] p-8 border border-slate-50 shadow-sm relative overflow-hidden group">
                 <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50 group-hover:bg-emerald-50 transition-colors duration-700"></div>
                 
                 <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-slate-900/20 rotate-3">
                       <UserPlus className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                       <h4 className="text-lg font-black text-slate-800">分享您的推薦代碼</h4>
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">每成功邀請一位夥伴，解鎖專屬點數回饋</p>
                    </div>
                 </div>

                 <div className="mt-8 flex gap-3 relative z-10">
                    <button 
                      onClick={() => setShowShare(true)}
                      className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition flex items-center justify-center gap-2"
                    >
                       <QrCode className="w-4 h-4" /> 產生專屬海報
                    </button>
                    <button 
                      onClick={handleNativeShare}
                      className="flex-1 bg-white border border-slate-100 text-slate-800 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm active:scale-95 transition flex items-center justify-center gap-2"
                    >
                       <Share2 className="w-4 h-4" /> 快速分享
                    </button>
                 </div>
              </div>
           </div>
        </motion.section>

        {/* Honor Badges - NEW */}
        <section className="space-y-6">
           <div className="flex justify-between items-center px-4">
              <h3 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">榮譽成就勳章</h3>
              <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest animate-pulse">New Achievements</span>
           </div>
           
           <div className="flex gap-6 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
              {[
                { name: "初入江湖", desc: "完成首筆訂單", icon: Sparkles, color: "bg-indigo-50 text-indigo-500", earned: true },
                { name: "團隊領袖", desc: "直推夥伴滿 5 人", icon: Users, color: "bg-emerald-50 text-emerald-500", earned: Number(downlines?.length || 0) >= 5 },
                { name: "業績推手", desc: "累計業績破萬", icon: TrendingUp, color: "bg-amber-50 text-amber-500", earned: Number(memberInfo?.lifetime_spend || 0) >= 10000 },
                { name: "品牌大使", desc: "分享推薦碼 10 次", icon: Share2, color: "bg-rose-50 text-rose-500", earned: false },
                { name: "永續夥伴", desc: "維持職級 3 個月", icon: Heart, color: "bg-slate-50 text-slate-300", earned: false }
              ].map((badge, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -5, scale: 1.05 }}
                  className={`min-w-[140px] p-6 rounded-[2.5rem] border flex flex-col items-center gap-4 transition-all duration-500 ${
                    badge.earned ? 'bg-white border-slate-100 shadow-xl' : 'bg-slate-50/50 border-transparent grayscale opacity-40'
                  }`}
                >
                   <div className={`w-14 h-14 ${badge.earned ? badge.color : 'bg-slate-100 text-slate-300'} rounded-[1.5rem] flex items-center justify-center shadow-inner relative`}>
                      {badge.earned && <div className="absolute inset-0 bg-current opacity-20 blur-xl animate-pulse"></div>}
                      <badge.icon className="w-7 h-7 relative z-10" />
                   </div>
                   <div className="text-center space-y-1">
                      <h4 className={`text-[10px] font-black uppercase tracking-widest ${badge.earned ? 'text-slate-800' : 'text-slate-400'}`}>{badge.name}</h4>
                      <p className="text-[7px] font-bold text-slate-300 leading-tight uppercase">{badge.desc}</p>
                   </div>
                </motion.div>
              ))}
           </div>
        </section>

        {/* Brand Insights Feed */}
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
                  
                <h3 className="text-2xl font-black text-slate-900 mb-2">專屬行銷工具</h3>
                <p className="text-sm text-slate-400 mb-8">選擇您要生成的推廣形式</p>

                {/* Template Selection */}
                <div className="flex gap-4 mb-8 p-3 bg-slate-50 rounded-[2rem] border border-slate-100">
                   {[
                     { id: 'card', name: '尊榮會員卡', icon: LayoutDashboard },
                     { id: 'poster', name: '品牌精美DM', icon: Megaphone }
                   ].map((t) => (
                     <button
                       key={t.id}
                       onClick={() => setSelectedTemplate(t.id as any)}
                       className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-2 transition-all ${
                         selectedTemplate === t.id ? 'bg-emerald-900 text-white shadow-xl shadow-emerald-900/20' : 'bg-white text-slate-400'
                       }`}
                     >
                        <t.icon className="w-4 h-4" />
                        {t.name}
                     </button>
                   ))}
                </div>
                
                {/* Photo Identity Area */}
                <div className="mb-10 p-8 bg-gradient-to-br from-slate-50 to-white rounded-[3rem] border border-slate-100 shadow-inner flex flex-col items-center gap-6 relative">
                   <div className="absolute top-4 left-6 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Identity Photo</span>
                   </div>

                   {memberAvatar ? (
                     <div className="relative group w-32 h-32">
                        <div className="absolute -inset-2 bg-emerald-500/10 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative overflow-hidden w-full h-full rounded-[2rem] border-2 border-white shadow-2xl">
                           <img 
                             src={memberAvatar} 
                             className="w-full h-full object-cover origin-center" 
                             style={{ transform: `scale(${avatarZoom}) translateY(${avatarOffset/4}px)` }}
                             alt="Avatar" 
                           />
                           <button 
                             onClick={() => setIsEditingAvatar(true)}
                             className="absolute inset-0 bg-emerald-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center text-white gap-1"
                           >
                              <Sparkles className="w-4 h-4 text-amber-300" />
                              <span className="text-[8px] font-black uppercase tracking-widest">編輯調整</span>
                           </button>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setMemberAvatar(null);
                            setAvatarZoom(1);
                            setAvatarOffset(0);
                          }}
                          className="absolute -top-3 -right-3 bg-white text-rose-500 w-8 h-8 rounded-full shadow-xl z-10 flex items-center justify-center border border-rose-50 transition hover:bg-rose-50"
                        >
                           <X className="w-4 h-4" />
                        </button>
                     </div>
                   ) : (
                     <div className="w-24 h-24 bg-white rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200 text-slate-300 group hover:border-emerald-200 transition-colors">
                        <User className="w-8 h-8 opacity-10 group-hover:opacity-30 transition-opacity" />
                     </div>
                   )}
                   
                   <div className="flex flex-col gap-3 w-full">
                      <label className="bg-emerald-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-emerald-800 transition shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 group">
                         <Plus className="w-3 h-3 group-hover:rotate-90 transition" />
                         {memberAvatar ? '更換照片' : '上傳個人照'}
                         <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                      </label>

                       <div className="w-full space-y-3 pt-2">
                          <div className="flex justify-between items-center px-1">
                             <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">我的個人座右銘</span>
                          </div>
                          <div className="flex gap-2">
                             <input 
                                type="text"
                                value={memberMotto}
                                onChange={(e) => setMemberMotto(e.target.value)}
                                className="flex-1 bg-white border border-slate-100 px-4 py-3 rounded-xl text-[10px] font-bold text-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
                                placeholder="輸入您的座右銘..."
                             />
                             <button 
                                onClick={handleSaveAvatarSettings}
                                disabled={isSavingAvatar}
                                className="bg-emerald-50 px-4 rounded-xl text-[8px] font-black text-emerald-600 uppercase tracking-widest hover:bg-emerald-100 transition active:scale-95 disabled:opacity-50"
                             >
                                {isSavingAvatar ? <Loader2 className="w-3 h-3 animate-spin" /> : "儲存"}
                             </button>
                          </div>
                       </div>
                   </div>
                </div>

                {/* Photo Adjustment Pop-up overlay */}
                <AnimatePresence>
                   {isEditingAvatar && memberAvatar && (
                     <motion.div 
                       initial={{ opacity: 0, scale: 0.9 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0, scale: 0.9 }}
                       className="absolute inset-0 z-[110] bg-white p-8 flex flex-col items-center justify-center"
                     >
                        <h4 className="text-sm font-black text-slate-900 mb-6 uppercase tracking-widest">調整您的頭像</h4>
                        
                        <div className="w-48 h-48 rounded-[3rem] overflow-hidden border-4 border-emerald-500/20 shadow-2xl mb-8 relative">
                           <img 
                             src={memberAvatar} 
                             className="w-full h-full object-cover origin-center" 
                             style={{ transform: `scale(${avatarZoom}) translateY(${avatarOffset}px)` }}
                           />
                           <div className="absolute inset-0 border-2 border-white/50 rounded-[3rem] pointer-events-none"></div>
                        </div>

                        <div className="w-full space-y-6">
                           <div className="space-y-2">
                              <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                 <span>縮放調整</span>
                                 <span>{Math.round(avatarZoom * 100)}%</span>
                              </div>
                              <input 
                                type="range" min="1" max="3" step="0.01" value={avatarZoom} 
                                onChange={(e) => setAvatarZoom(parseFloat(e.target.value))}
                                className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                              />
                           </div>
                           <div className="space-y-2">
                              <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                 <span>位置偏移</span>
                                 <span>{avatarOffset}px</span>
                              </div>
                              <input 
                                type="range" min="-100" max="100" step="1" value={avatarOffset} 
                                onChange={(e) => setAvatarOffset(parseInt(e.target.value))}
                                className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                              />
                           </div>
                        </div>

                        <button 
                          onClick={handleSaveAvatarSettings}
                          disabled={isSavingAvatar}
                          className="mt-8 w-full bg-emerald-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                           {isSavingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} 儲存並套用
                        </button>
                     </motion.div>
                   )}
                </AnimatePresence>

                {selectedTemplate === 'poster' && (
                  <div className="mb-8 space-y-4">
                     <div className="flex justify-between items-center px-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">選擇海報模板</span>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{selectedPosterIndex + 1} / {posterTemplates.length}</span>
                     </div>
                     <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                        {posterTemplates.map((temp, idx) => (
                          <button
                            key={temp.id}
                            onClick={() => setSelectedPosterIndex(idx)}
                            className={`min-w-[100px] aspect-[1/1.4] rounded-2xl overflow-hidden border-4 transition-all ${
                              selectedPosterIndex === idx ? 'border-emerald-500 scale-105 shadow-xl' : 'border-white opacity-60'
                            }`}
                          >
                             <img src={temp.url} className="w-full h-full object-cover" alt={temp.name} />
                          </button>
                        ))}
                     </div>
                  </div>
                )}

                <AnimatePresence mode="wait">
                   {!showQR ? (
                     <motion.div 
                       key="id-box"
                       initial={{ opacity: 0, scale: 0.9 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0, scale: 0.9 }}
                       className="bg-gradient-to-br from-slate-50 to-white p-10 rounded-[2.5rem] mb-8 p-10 text-white relative overflow-hidden group/card shadow-2xl shadow-slate-900/20"
                      >
                         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                         <div className="absolute top-0 right-0 -mr-20 -mt-20 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl group-hover/card:bg-emerald-500/30 transition-colors"></div>
                         
                         <div className="relative z-10 flex flex-col items-center gap-6">
                            <div className="flex flex-col items-center gap-2">
                               <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em]">Official Member ID</span>
                               <span className="text-3xl font-black tracking-[0.2em] text-emerald-400 uppercase">
                                  {memberInfo.member_code}
                               </span>
                            </div>

                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(memberInfo.member_code);
                                alert("編號已複製！");
                              }}
                              className="text-[9px] font-black text-white/40 hover:text-white transition uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5 flex items-center gap-2"
                            >
                               <Copy className="w-3 h-3" /> 複製代碼
                            </button>
                         </div>
                      </motion.div>
                   ) : (
                     <motion.div 
                       key="qr-box"
                       initial={{ opacity: 0, scale: 0.9 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0, scale: 0.9 }}
                       className="bg-white p-10 rounded-[2.5rem] mb-6 border border-slate-50 shadow-inner flex flex-col items-center gap-4 mx-auto w-fit"
                     >
                        <QRCodeCanvas 
                          id="share-qr-canvas"
                          value={`${window.location.origin}/register?ref=${memberInfo.member_code}`}
                          size={180}
                          level="H"
                          includeMargin={false}
                          imageSettings={{
                              src: CR_LOGO,
                              x: undefined,
                              y: undefined,
                              height: 40,
                              width: 40,
                              excavate: true,
                          }}
                        />
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">掃描立即加入</p>
                     </motion.div>
                   )}
                </AnimatePresence>

                <div className="flex flex-col gap-3">
                   <button 
                     onClick={() => setShowQR(!showQR)}
                     className="w-full py-4 bg-slate-50 text-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-100"
                   >
                      {showQR ? "顯示編號" : "顯示 QR Code"}
                   </button>
                   <button 
                     onClick={selectedTemplate === 'card' ? handleDownloadBusinessCard : handleDownloadBrandPoster}
                     className="w-full bg-emerald-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-900/10 active:scale-95 transition flex items-center justify-center gap-3"
                   >
                      <Download className="w-4 h-4" />
                      下載我的專屬{selectedTemplate === 'card' ? '名片' : '海報'}
                   </button>
                   <button 
                     onClick={() => setShowShare(false)}
                     className="w-full py-4 text-slate-300 font-black text-[10px] uppercase tracking-widest hover:text-slate-500 transition"
                   >
                      關閉視窗
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden QR for Generator */}
      <div id="hidden-qr-canvas" className="hidden">
         <QRCodeCanvas 
           value={`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${memberInfo.member_code}`}
           size={512}
           level="H"
         />
      </div>

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