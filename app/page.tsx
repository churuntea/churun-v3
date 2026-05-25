"use client";
// Build: 2026-05-04 19:30

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from './supabase';
import { TAIWAN_CITIES } from './organization/taiwan-cities';

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
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, 
  CreditCard,
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
  IdCard,
  Image as ImageIcon,
  Crown,
  Shield,
  Camera
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { QRCodeCanvas } from "qrcode.react";
import { dbCache, fetchWithSWR } from "@/utils/dbCache";
import ImagePreviewModal from "@/components/ImagePreviewModal";

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
  const [newProducts, setNewProducts] = useState<any[]>([]);
  const [downlines, setDownlines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [memberAvatar, setMemberAvatar] = useState<string | null>(null);
  const [maleDefault, setMaleDefault] = useState("https://i.ibb.co/6R2M5X1/churun-baby.png");
  const [femaleDefault, setFemaleDefault] = useState("https://i.ibb.co/6R2M5X1/churun-baby.png");
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarOffset, setAvatarOffset] = useState(0);
  const [memberMotto, setMemberMotto] = useState("以初心、致潤澤");
  const [posterTemplates, setPosterTemplates] = useState<any[]>([]);
  const [selectedPosterCategory, setSelectedPosterCategory] = useState("茶葉");
  const [showPosterSelector, setShowPosterSelector] = useState(false);
  const [showPosterPreview, setShowPosterPreview] = useState(false);
  const [selectedPoster, setSelectedPoster] = useState<any>(null);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [posterDataUrl, setPosterDataUrl] = useState<string | null>(null);
  const [showShareHub, setShowShareHub] = useState(false);
  const [showTierModal, setShowTierModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLineLink, setCopiedLineLink] = useState(false);
  const [showOfficialQrModal, setShowOfficialQrModal] = useState(false);
  const [copiedFbLink, setCopiedFbLink] = useState(false);
  const [showFbQrModal, setShowFbQrModal] = useState(false);
  const [showWalletDetailModal, setShowWalletDetailModal] = useState(false);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [isFetchingWalletTx, setIsFetchingWalletTx] = useState(false);
  const [activeWalletTab, setActiveWalletTab] = useState<'pending' | 'history'>('pending');
  const [pendingCommissions, setPendingCommissions] = useState<any[]>([]);
  const [isFetchingPending, setIsFetchingPending] = useState(false);

  // ======== 品牌大使 / 合夥人申請系統 ========
  const [ambassadorStatus, setAmbassadorStatus] = useState<any>(null);
  const [ambassadorApplication, setAmbassadorApplication] = useState<any>(null);
  const [showAmbassadorOptions, setShowAmbassadorOptions] = useState(false);
  const [showAmbassadorConfirm, setShowAmbassadorConfirm] = useState(false);
  const [showAmbassadorForm, setShowAmbassadorForm] = useState(false);
  const [selectedAmbassadorType, setSelectedAmbassadorType] = useState<'paid' | 'free' | 'partner'>('paid');
  const [ambassadorFormData, setAmbassadorFormData] = useState({ 
    last_five: '', remittance_photo: '', 
    birthday: '', id_card_number: '', city: '', district: '', address: '', 
    id_card_front: '', id_card_back: '' 
  });
  const [isSubmittingAmbassador, setIsSubmittingAmbassador] = useState(false);
  const [ambassadorError, setAmbassadorError] = useState('');
  const [freeEligibilityScore, setFreeEligibilityScore] = useState(0);

  const handleOpenWalletDetails = async () => {
    setShowWalletDetailModal(true);
    if (!currentUserId) return;
    setIsFetchingWalletTx(true);
    setIsFetchingPending(true);
    try {
      const res = await fetch("/api/me/wallet-details");
      const data = await res.json();
      
      if (res.ok) {
        setWalletTransactions(data.transactions || []);
        setPendingCommissions(data.pendingCommissions || []);
      } else {
        console.error("Fetch wallet details failed:", data.error);
        setWalletTransactions([]);
        setPendingCommissions([]);
      }
    } catch (err) {
      console.error("Fetch pending commissions failed:", err);
    } finally {
      setIsFetchingWalletTx(false);
      setIsFetchingPending(false);
    }
  };

  useEffect(() => {
    const currentVersion = "3.0.0";
    const savedVersion = localStorage.getItem("churun_home_version");
    if (savedVersion !== currentVersion) {
      localStorage.setItem("churun_home_version", currentVersion);
      window.location.reload();
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/me/dashboard");
        if (!res.ok) {
          if (res.status === 401) {
            router.replace("/login");
            return;
          }
          throw new Error("Failed to fetch dashboard data");
        }
        const data = await res.json();

        if (data.member?.id) {
          setCurrentUserId(data.member.id);
        } else {
          router.replace("/login");
          return;
        }

        const maleUrl = data.defaultAvatars?.find((m: any) => m.title === "預設頭像 - 男生潤寶")?.url || "https://i.ibb.co/6R2M5X1/churun-baby.png";
        const femaleUrl = data.defaultAvatars?.find((m: any) => m.title === "預設頭像 - 女生潤寶")?.url || "https://i.ibb.co/6R2M5X1/churun-baby.png";
        setMaleDefault(maleUrl);
        setFemaleDefault(femaleUrl);
        
        setMemberInfo(data.member);
        if (data.member) {
          const resolved = (data.member.avatar_url && data.member.avatar_url !== "https://i.ibb.co/6R2M5X1/churun-baby.png")
            ? `${data.member.avatar_url}?t=${Date.now()}`
            : (data.member.avatar_settings?.gender === "女" ? femaleUrl : maleUrl);
          setMemberAvatar(resolved);
          if (data.member.avatar_settings) {
            setAvatarZoom(data.member.avatar_settings.zoom || 1);
            setAvatarOffset(data.member.avatar_settings.offset || 0);
          }
          setMemberMotto(data.member.motto || "以初心、致潤澤");
        }

        setDownlines(data.downlines || []);
        setAnnouncements(data.announcements || []);
        setNewProducts(data.newProducts || []);
        setPosterTemplates(data.posterTemplates || []);

        // 5. 獲取品牌大使申請狀態 (已整合在 dashboard API)
        setAmbassadorStatus(data.ambassadorStatus || null);
        setAmbassadorApplication(data.ambassadorApplication || null);

      } catch (err) {
        console.error("[SWR Home Data Sync Error]:", err);
        router.replace("/login");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const getUpgradeProgress = () => {
    if (!memberInfo) return { label: "升級進度", current: 0, target: 50000, percent: 0, nextTierName: "" };

    const UPGRADE_TIERS = [
      { name: '初潤寶寶', upgradeAmount: 0 },
      { name: '初潤幼兒園', upgradeAmount: 1 },
      { name: '初潤小朋友', upgradeAmount: 1500 },
      { name: '初潤青少年', upgradeAmount: 3000 },
      { name: '初潤好朋友', upgradeAmount: 6000 },
      { name: '初潤閨蜜', upgradeAmount: 12000 },
      { name: '初潤知己', upgradeAmount: 25000 },
      { name: '初潤靈魂伴侶', upgradeAmount: 50000 }
    ];

    const currentTierName = memberInfo.tier || '初潤寶寶';
    const currentTierIdx = UPGRADE_TIERS.findIndex(t => t.name === currentTierName);
    
    // If they are at the highest tier
    if (currentTierIdx === -1 || currentTierIdx === UPGRADE_TIERS.length - 1) {
      return {
        label: "已達最高職級 (初潤靈魂伴侶)",
        current: Number(memberInfo.lifetime_spend || 0),
        target: 50000,
        percent: 100,
        nextTierName: ""
      };
    }

    const nextTier = UPGRADE_TIERS[currentTierIdx + 1];
    const current = Number(memberInfo.lifetime_spend || 0);
    const target = nextTier.upgradeAmount;
    const percent = Math.min((current / target) * 100, 100);

    return {
      label: `升級進度 (下階段：${nextTier.name})`,
      current,
      target,
      percent,
      nextTierName: nextTier.name
    };
  };

  const handleGeneratePoster = async (template: any) => {
    if (template.config?.is_external) {
      setShowPosterSelector(false);
      window.open(template.url, '_blank');
      return;
    }

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
        phone: { x: 380, y: 1155, size: 24, color: "#ffffff" },
        address: { x: 380, y: 1190, size: 20, color: "#ffffff" }
      };
      const hiddenQr = document.querySelector("#hidden-qr-canvas canvas") as HTMLCanvasElement;
      if (hiddenQr) ctx.drawImage(hiddenQr, config.qr?.x || 800, config.qr?.y || 1100, config.qr?.size || 160, config.qr?.size || 160);
      
      ctx.fillStyle = config.name?.color || '#ffffff';
      ctx.font = `${config.name?.size || 40}px "PMingLiU", "MingLiU", "Noto Serif TC", serif`;
      ctx.textAlign = 'left';
      ctx.fillText("聯絡人：" + memberInfo.name, config.name?.x || 380, config.name?.y || 1120);
      
      ctx.fillStyle = config.phone?.color || config.name?.color || '#ffffff';
      ctx.font = `${config.phone?.size || 40}px "PMingLiU", "MingLiU", "Noto Serif TC", serif`;
      ctx.fillText("電話：" + (memberInfo.phone || ''), config.phone?.x || 380, config.phone?.y || 1155);
      
      if (config.address) {
        ctx.fillStyle = config.address.color || config.name?.color || '#ffffff';
        ctx.font = `${config.address.size || 36}px "PMingLiU", "MingLiU", "Noto Serif TC", serif`;
        ctx.fillText("地址：" + (memberInfo.address || ''), config.address.x || 380, config.address.y || 1190);
      }

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

  const handleSharePoster = async () => {
    if (!posterDataUrl) return;
    try {
      const res = await fetch(posterDataUrl);
      const blob = await res.blob();
      const file = new File([blob], `churun-poster-${memberInfo.member_code}.png`, { type: 'image/png' });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: '初潤製茶所 - 專屬推廣海報',
          text: '誠摯邀請您加入我們，這是我的專屬邀請海報！',
          files: [file]
        });
      } else {
        alert('您的裝置或瀏覽器不支援直接分享圖片，請點擊「下載儲存」後，再傳送給好友喔！');
      }
    } catch (err) {
      console.error(err);
      // alert('分享時發生錯誤，請直接點擊下載儲存。'); // User might cancel share, no need to alert error.
    }
  };

  const handleUpdateMotto = async (newMotto: string) => {
    try {
      setMemberMotto(newMotto);
      if (currentUserId) {
        await fetch("/api/me/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ motto: newMotto })
        });
        
        // Update local SWR cache smoothly so page transitions keep it intact
        const memberKey = `churun_cache:member:${currentUserId}`;
        const localCache = localStorage.getItem(memberKey);
        if (localCache) {
          try {
            const parsed = JSON.parse(localCache);
            if (parsed && parsed.data) {
              parsed.data.motto = newMotto;
              localStorage.setItem(memberKey, JSON.stringify(parsed));
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
    } catch (err) {
      console.error("更新座右銘失敗:", err);
    }
  };

  if (isLoading) return <DashboardSkeleton />;

  if (!memberInfo) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mb-6">
          <X className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">載入會員資料失敗</h2>
        <p className="text-sm text-slate-500 mb-6">找不到您的會員資料，可能已被刪除或系統異常。</p>
        <button 
          onClick={() => {
            localStorage.removeItem("churun_member_id");
            if (currentUserId) {
              localStorage.removeItem(`churun_cache:member:${currentUserId}`);
            }
            router.replace("/login");
          }}
          className="bg-emerald-900 text-white px-6 py-3 rounded-full font-bold text-sm"
        >
          重新登入
        </button>
      </div>
    );
  }

  const handleOpenAmbassadorOptions = async () => {
    try {
      const res = await fetch("/api/me/ambassador-eligibility");
      if (res.ok) {
        const data = await res.json();
        setFreeEligibilityScore(data.score || 0);
      }
    } catch (e) {
      console.error(e);
    }
    setShowAmbassadorOptions(true);
  };

  const handleSelectAmbassadorType = (type: 'paid' | 'free' | 'partner') => {
    setSelectedAmbassadorType(type);
    setShowAmbassadorOptions(false);
    setShowAmbassadorConfirm(true);
  };

  const handleSubmitAmbassador = async () => {
    if ((selectedAmbassadorType === 'paid' || selectedAmbassadorType === 'partner')) {
      if (!ambassadorFormData.last_five || ambassadorFormData.last_five.length !== 5) {
        setAmbassadorError('請填寫匯款帳號後五碼（需為完整的 5 位數字）');
        return;
      }
      if (!ambassadorFormData.remittance_photo) {
        setAmbassadorError('請上傳匯款水單照片');
        return;
      }
    }
    
    if (!ambassadorFormData.birthday || !ambassadorFormData.id_card_number || !ambassadorFormData.city || !ambassadorFormData.district || !ambassadorFormData.address) {
      setAmbassadorError('請填寫所有必填的詳細個人資料（包含生日、身分證字號與地址）');
      return;
    }
    
    if (!ambassadorFormData.id_card_front || !ambassadorFormData.id_card_back) {
      setAmbassadorError('請上傳身分證正反面照片');
      return;
    }
    setIsSubmittingAmbassador(true);
    setAmbassadorError('');
    try {
      const res = await fetch('/api/ambassador/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: currentUserId,
          application_type: selectedAmbassadorType,
          last_five: ambassadorFormData.last_five,
          remittance_photo: ambassadorFormData.remittance_photo,
          birthday: ambassadorFormData.birthday,
          id_card_number: ambassadorFormData.id_card_number,
          city: ambassadorFormData.city,
          district: ambassadorFormData.district,
          address: ambassadorFormData.address,
          id_card_front: ambassadorFormData.id_card_front,
          id_card_back: ambassadorFormData.id_card_back
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '申請失敗');
      
      setAmbassadorStatus('pending');
      setShowAmbassadorForm(false);
      alert('✅ 申請已送出！我們將盡快審核。');
    } catch (e: any) {
      setAmbassadorError(e.message);
    } finally {
      setIsSubmittingAmbassador(false);
    }
  };

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
                            <span className="text-[10px] font-black tracking-widest uppercase">{memberInfo.tier || '初潤寶寶'}</span>
                         </div>
                         <h2 className="text-4xl font-black tracking-tight">{memberInfo.name || '初潤會員'}</h2>
                          <div className="flex items-center gap-2 mt-3 overflow-hidden max-w-[200px] sm:max-w-none select-none">
                             <div className="w-3 h-[1px] bg-white/20 shrink-0"></div>
                             <p 
                               onClick={() => {
                                 const newMotto = prompt("✍️ 請輸入您的座右銘/初心格言 (限 15 字以內):", memberMotto);
                                 if (newMotto !== null) {
                                   const cleanMotto = newMotto.trim().slice(0, 15) || "以初心、致潤澤";
                                   handleUpdateMotto(cleanMotto);
                                 }
                               }}
                               className="text-[10px] sm:text-[11px] font-bold text-white/80 hover:text-amber-300 tracking-[0.15em] sm:tracking-[0.25em] uppercase italic whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer transition flex items-center gap-1"
                               title="點擊編輯座右銘"
                             >
                                <span>{memberMotto}</span>
                                <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-none stroke-current stroke-[2.5] opacity-50 shrink-0">
                                   <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                                </svg>
                             </p>
                             <div className="w-3 h-[1px] bg-white/20 shrink-0"></div>
                          </div>
                      </div>
                   </div>
                   <motion.button whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }} onClick={() => setShowShareHub(true)} className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/10 shadow-inner">
                      <Share2 className="w-6 h-6" />
                   </motion.button>
                </div>
  
                <div className="grid grid-cols-2 gap-6 relative z-10">
                    <div onClick={handleOpenWalletDetails} className="space-y-1 cursor-pointer hover:opacity-85 active:scale-95 transition-all duration-300">
                       <p className="text-[8px] font-black uppercase tracking-[0.2em] text-amber-300 flex items-center gap-1">
                          虛擬預收貨款 <span className="text-[9px]">💡 點選明細</span>
                       </p>
                       <h3 className="text-2xl font-black tracking-tighter text-white">${Number(memberInfo.virtual_balance).toLocaleString()}</h3>
                    </div>
                   <div className="space-y-1">
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">紅利點數餘額</p>
                      <h3 className="text-2xl font-black tracking-tighter">{memberInfo.points_balance.toLocaleString()} <span className="text-[10px] font-medium ml-1">pts</span></h3>
                   </div>
                </div>
  
                {(() => {
                   const UPGRADE_TIERS = [
                     { name: '初潤寶寶', upgradeAmount: 0, rate: 100 },
                     { name: '初潤幼兒園', upgradeAmount: 1, rate: 90 },
                     { name: '初潤小朋友', upgradeAmount: 1500, rate: 80 },
                     { name: '初潤青少年', upgradeAmount: 3000, rate: 70 },
                     { name: '初潤好朋友', upgradeAmount: 6000, rate: 60 },
                     { name: '初潤閨蜜', upgradeAmount: 12000, rate: 50 },
                     { name: '初潤知己', upgradeAmount: 25000, rate: 40 },
                     { name: '初潤靈魂伴侶', upgradeAmount: 50000, rate: 30 }
                   ];

                   const currentTierName = memberInfo?.tier || '初潤寶寶';
                   const currentTierIdx = UPGRADE_TIERS.findIndex(t => t.name === currentTierName);
                   
                   let displayPercent = 0;
                   let remainingAmount = 0;
                   let nextTier = null;
                   
                   if (currentTierIdx !== -1 && currentTierIdx < UPGRADE_TIERS.length - 1) {
                     nextTier = UPGRADE_TIERS[currentTierIdx + 1];
                     const currentTierObj = UPGRADE_TIERS[currentTierIdx];
                     const startRange = currentTierObj.upgradeAmount;
                     const targetRange = nextTier.upgradeAmount;
                     const userLifetime = Number(memberInfo?.lifetime_spend || 0);
                     
                     // RPG Math: Progress = (User - Start) / (Target - Start)
                     const rangeTotal = targetRange - startRange;
                     const userSpendInRange = Math.max(0, userLifetime - startRange);
                     displayPercent = Math.min((userSpendInRange / rangeTotal) * 100, 100);
                     remainingAmount = Math.max(0, targetRange - userLifetime);
                   } else {
                     displayPercent = 100;
                   }

                   return (
                      <>
                        <div onClick={() => setShowTierModal(true)} className="mt-10 block group/prog cursor-pointer relative z-10 space-y-4">
                           {/* Upper Info Row */}
                           <div className="flex justify-between items-end">
                              <div className="space-y-1">
                                 <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">晉級挑戰</span>
                                 <h4 className="text-xs font-black text-white group-hover/prog:text-amber-300 transition-colors flex items-center gap-1">
                                    {nextTier ? `LEVEL UP TO ${nextTier.name}` : '已達成滿級神話！'}
                                    <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover/prog:translate-x-1 transition-transform" />
                                 </h4>
                              </div>
                              <div className="text-right">
                                 <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">EXP PROGRESS</span>
                                 <p className="text-xs font-black text-amber-300 tracking-tighter">
                                    {nextTier 
                                      ? `$${Number(memberInfo?.lifetime_spend || 0).toLocaleString()} / $${nextTier.upgradeAmount.toLocaleString()}`
                                      : `$${Number(memberInfo?.lifetime_spend || 0).toLocaleString()} (LOCKED)`
                                    }
                                 </p>
                              </div>
                           </div>

                           {/* Gamified RPG Progress Bar */}
                           <div className="relative">
                              <div className="h-4 w-full bg-slate-950/60 rounded-full overflow-hidden border border-white/5 p-[2px] flex items-center relative shadow-inner">
                                 <motion.div 
                                   initial={{ width: 0 }} 
                                   animate={{ width: `${displayPercent}%` }} 
                                   transition={{ duration: 1.5, ease: "circOut" }} 
                                   className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded-full relative shadow-lg"
                                 >
                                    {/* Glowing Lead Light */}
                                    <div className="absolute right-0 top-0 bottom-0 w-3 bg-white blur-[2px] rounded-full animate-pulse"></div>
                                 </motion.div>
                              </div>
                              
                              {/* Left/Right Tier Markers */}
                              <div className="flex justify-between items-center mt-2 px-1">
                                 <span className="text-[9px] font-black text-white/50 tracking-widest">{currentTierName}</span>
                                 {nextTier && (
                                   <span className="text-[9px] font-black text-amber-400/90 tracking-widest flex items-center gap-1 animate-pulse">
                                      👑 {nextTier.name}
                                   </span>
                                 )}
                              </div>
                           </div>

                           {/* Motivation Text Banner */}
                           {nextTier && remainingAmount > 0 && (
                             <div className="bg-white/5 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/5 flex items-center gap-3.5 mt-2 shadow-inner">
                                <div className="w-7 h-7 bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/20 shrink-0">
                                   <span className="text-amber-400 font-black text-[10px] animate-bounce">🔥</span>
                                </div>
                                <p className="text-[10px] font-bold text-white/85 leading-relaxed">
                                   還差 <span className="text-amber-300 font-black">{remainingAmount.toLocaleString()}</span> 即可升級！解鎖專屬特權
                                </p>
                             </div>
                           )}
                        </div>

                        {/* Modal */}
                        <AnimatePresence>
                          {showTierModal && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                              <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowTierModal(false)}
                                className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
                              />
                              <motion.div 
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="bg-white rounded-[3rem] p-10 w-full max-w-lg shadow-2xl relative z-10 max-h-[80vh] overflow-y-auto no-scrollbar"
                              >
                                <button 
                                  onClick={() => setShowTierModal(false)}
                                  className="absolute top-8 right-8 w-10 h-10 bg-slate-100/80 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors z-20"
                                >
                                   <X className="w-5 h-5" />
                                </button>
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                   <Zap className="w-6 h-6" />
                                </div>
                                
                                <h3 className="text-xl font-black text-slate-900 text-center mb-6">職級榮耀殿堂權利與義務</h3>
                                
                                <div className="space-y-6">
                                   {[
                                     { name: '初潤靈魂伴侶', rate: '30元 = 1點', upgrade: '累積消費滿 $50,000', maintenance: '每月消費 $1,000 或 直推 3 人', penalty: '未達標降級至 初潤知己' },
                                     { name: '初潤知己', rate: '40元 = 1點', upgrade: '累積消費滿 $25,000', maintenance: '每月消費 $600 或 直推 2 人', penalty: '未達標降級至 初潤閨蜜' },
                                     { name: '初潤閨蜜', rate: '50元 = 1點', upgrade: '累積滿 $12,000 (或儲值 1 萬直升)', maintenance: '每季消費 $1,200 或 直推 2 人', penalty: '未達標降級至 初潤好朋友' },
                                     { name: '初潤好朋友', rate: '60元 = 1點', upgrade: '累積消費滿 $6,000', maintenance: '每季消費 $600 或 直推 1 人', penalty: '未達標降級至 初潤青少年' },
                                     { name: '初潤青少年', rate: '70元 = 1點', upgrade: '累積消費滿 $3,000', maintenance: '無保級壓力' },
                                     { name: '初潤小朋友', rate: '80元 = 1點', upgrade: '累積消費滿 $1,500', maintenance: '無保級壓力' },
                                     { name: '初潤幼兒園', rate: '90元 = 1點', upgrade: '完成首次消費', maintenance: '無保點壓力' },
                                     { name: '初潤寶寶', rate: '100元 = 1點', upgrade: '加入 LINE@ 註冊', maintenance: '無保點壓力' }
                                   ].map((t, idx) => (
                                     <div key={idx} className={`p-4 rounded-2xl border ${currentTierName === t.name ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-100 bg-slate-50/50'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                           <span className="text-sm font-black text-slate-800">{t.name}</span>
                                           <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{t.rate}</span>
                                        </div>
                                        <div className="text-[11px] text-slate-500 space-y-0.5">
                                           <p><span className="font-bold text-slate-700">晉升條件：</span>{t.upgrade}</p>
                                           <p><span className="font-bold text-slate-700">保級標準：</span>{t.maintenance}</p>
                                           {t.penalty && <p className="text-rose-500"><span className="font-bold">降級規則：</span>{t.penalty}</p>}
                                        </div>
                                     </div>
                                   ))}
                                </div>
                              </motion.div>
                            </div>
                          )}
                        </AnimatePresence>
                      </>
                   );
                })()}
              </div>
           </motion.div>
        </motion.section>

        {/* Honor Badges */}
        <section className="space-y-6">
           <div className="flex justify-between items-center px-4">
              <h3 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">榮譽成就勳章</h3>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100/50 px-2.5 py-1 rounded-full">
                 Elite Achievements
              </span>
           </div>
           
           {(() => {
              const badgeList = [
                { name: "初入江湖", desc: "完成首筆訂單", icon: Sparkles, color: "from-indigo-500 to-purple-600", earned: true },
                { name: "團隊領袖", desc: "直推夥伴滿 5 人", icon: Users, color: "from-emerald-500 to-teal-600", earned: Number(downlines?.length || 0) >= 5, link: "/organization" },
                { name: "業績推手", desc: "累計業績破萬", icon: TrendingUp, color: "from-amber-400 to-orange-500", earned: Number(memberInfo?.lifetime_spend || 0) >= 10000 },
              ];

              return (
                <div className="grid grid-cols-3 gap-3.5 pb-2 px-2">
                   {badgeList.map((badge, i) => {
                     const content = (
                       <div 
                         className={`p-4 sm:p-5 rounded-[2.2rem] border relative overflow-hidden transition-all duration-300 flex flex-col items-center gap-3.5 bg-white shadow-xl h-full ${
                           badge.earned 
                             ? 'border-emerald-100/40 shadow-emerald-950/5' 
                             : 'border-slate-100/60 opacity-60'
                         } ${badge.link ? 'cursor-pointer hover:shadow-2xl hover:shadow-slate-200/50' : ''}`}
                       >
                          {/* Unlocked / Locked Floating Indicator */}
                          <div className="absolute top-3.5 right-3.5 shrink-0">
                             {badge.earned ? (
                                <span className="flex h-1.5 w-1.5 relative">
                                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                   <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                </span>
                             ) : (
                                <span className="text-[8px] leading-none text-slate-300">🔒</span>
                             )}
                          </div>

                          {/* Badge Icon Circular Block */}
                          <div className={`w-12 h-12 rounded-[1.4rem] flex items-center justify-center shadow-md relative ${
                            badge.earned 
                              ? `bg-gradient-to-tr ${badge.color} text-white` 
                              : 'bg-slate-50 text-slate-300 border border-slate-100'
                          }`}>
                             <badge.icon className="w-5 h-5" />
                          </div>

                          {/* Badge Details */}
                          <div className="space-y-0.5 text-center">
                             <h4 className="text-[10px] font-black tracking-widest text-slate-800 whitespace-nowrap">
                                {badge.name}
                             </h4>
                             <p className="text-[8px] font-bold text-slate-400 whitespace-nowrap">
                                {badge.desc}
                             </p>
                          </div>
                       </div>
                     );

                     return badge.link ? (
                       <Link href={badge.link} key={i} className="block h-full">
                         {content}
                       </Link>
                     ) : (
                       <div key={i}>
                         {content}
                       </div>
                     );
                   })}
                </div>
              );
           })()}
        </section>

        {/* Brand Ambassador Section */}
        {ambassadorStatus !== 'active' && (
          <section className="space-y-6">
             <div className="flex justify-between items-center px-4">
                <h3 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">品牌大使申請</h3>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100/50 px-2.5 py-1 rounded-full">
                   Brand Ambassador
                </span>
             </div>
             <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                
                {ambassadorStatus === 'pending' ? (
                  <div className="relative z-10 flex flex-col items-center justify-center text-center py-6 space-y-4">
                     <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                        <Loader2 className="w-8 h-8 text-amber-300 animate-spin" />
                     </div>
                     <div>
                        <h4 className="text-xl font-black tracking-widest">申請審核中</h4>
                        <p className="text-[10px] text-emerald-200/80 mt-2">您的品牌大使申請已經送出，請耐心等候總部核准。</p>
                     </div>
                  </div>
                ) : (
                  <div className="relative z-10 space-y-6">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-tr from-amber-400 to-amber-300 rounded-[1.5rem] flex items-center justify-center shadow-lg">
                           <Crown className="w-7 h-7 text-emerald-950" />
                        </div>
                        <div>
                           <h4 className="text-lg font-black tracking-widest text-amber-300">申請成為品牌大使</h4>
                           <p className="text-[9px] text-emerald-200 mt-1 uppercase tracking-widest">Unlock Premium Benefits</p>
                        </div>
                     </div>
                     <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
                        尊享最高級別點數匯率、額外回饋加成與獨家行銷支援，現在就加入初潤品牌大使行列。
                     </p>
                     <button 
                       onClick={handleOpenAmbassadorOptions}
                       className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-emerald-950 font-black text-sm py-4 rounded-2xl shadow-xl hover:shadow-amber-500/30 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
                     >
                        立即申請 <ArrowUpRight className="w-4 h-4" />
                     </button>
                  </div>
                )}
             </div>
          </section>
        )}
      

        {/* New Product Announcements */}
        {newProducts.length > 0 && (
          <section className="space-y-6">
             <div className="flex justify-between items-center px-4">
                <h3 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  新品上市公告
                </h3>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100/50 px-2.5 py-1 rounded-full">
                   New Arrivals
                </span>
             </div>
             
             <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/40 border border-slate-100 mx-2">
                <ul className="space-y-2">
                   {newProducts.map((prod, idx) => (
                     <li key={prod.id}>
                        <Link href={`/store?productId=${prod.id}`} className="group flex items-center justify-between hover:bg-slate-50 p-3 -mx-3 rounded-2xl transition">
                           <div className="flex items-center gap-4">
                              <span className="text-xs font-black text-slate-300 w-4">{idx + 1}.</span>
                              <div>
                                 <h4 className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition">
                                    【新品上架】{prod.name}
                                 </h4>
                                 <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                    發布時間：{new Date(prod.created_at).toLocaleDateString('zh-TW')}
                                 </p>
                              </div>
                           </div>
                           <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 group-hover:scale-110 transition" />
                        </Link>
                     </li>
                   ))}
                </ul>
             </div>
          </section>
        )}

        {/* Announcements */}
        <section id="brand-news" className="space-y-6">
           <div className="flex justify-between items-center px-2">
              <h3 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">初潤品牌脈動</h3>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100/50 px-2.5 py-1 rounded-full">
                 Latest Brand Stories
              </span>
           </div>

           <div className="flex gap-6 overflow-x-auto pb-10 px-2 no-scrollbar">
               {announcements.length === 0 ? (
                 <div className="w-full py-20 text-center bg-white rounded-[3rem] border border-slate-50">
                    <Megaphone className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                    <p className="text-xs font-bold text-slate-300">目前尚無品牌快訊</p>
                 </div>
               ) : announcements.map((news) => (
                 <Link key={news.id} href={`/brand/news/${news.id}`} className="min-w-[290px] w-[290px] flex-shrink-0 block relative group">
                   <motion.div 
                     whileHover={{ y: -6 }}
                     className="bg-white rounded-[2.8rem] border border-slate-100 shadow-xl overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 text-left"
                   >
                      <div className="h-44 w-full relative overflow-hidden">
                         <img 
                           src={news.image_url || "https://images.unsplash.com/photo-1594631252845-29fc458631b6?w=400&q=80"} 
                           alt={news.title} 
                           onClick={(e) => {
                             e.preventDefault();
                             e.stopPropagation();
                             setPreviewImage(news.image_url || "https://images.unsplash.com/photo-1594631252845-29fc458631b6?w=400&q=80");
                           }}
                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out cursor-zoom-in relative z-20" 
                         />
                         {/* Floating Tag */}
                         <div className="absolute top-4 left-4 flex gap-1.5 z-10">
                            <span className={`px-2.5 py-1 rounded-full text-[8px] font-black text-white uppercase tracking-widest shadow-sm ${
                              news.tag === "NEW" ? 'bg-emerald-900' : news.tag === "EVENT" ? 'bg-indigo-600' : 'bg-amber-600'
                            }`}>
                               {news.tag || "NEWS"}
                            </span>
                         </div>
                      </div>
                      <div className="p-7 space-y-3">
                         <p className="text-[8px] font-bold text-slate-400 tracking-wider">
                            {new Date(news.created_at).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
                         </p>
                         <h4 className="font-bold text-slate-800 text-base leading-snug group-hover:text-emerald-900 transition-colors line-clamp-2">
                            {news.title}
                         </h4>
                         {news.content && (
                            <p className="text-[10px] font-bold text-slate-400 line-clamp-2 leading-relaxed">
                               {news.content}
                            </p>
                         )}
                      </div>
                   </motion.div>
                 </Link>
               ))}
           </div>
        </section>
      </motion.main>


      {/* Share Hub Modal */}
      <AnimatePresence>
        {showShareHub && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-2xl flex items-end sm:items-center justify-center p-4" onClick={() => setShowShareHub(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 220 }} onClick={e => e.stopPropagation()} className="bg-white rounded-[2.5rem] w-full max-w-sm p-6 pb-8 shadow-2xl space-y-5 mb-4 sm:mb-0">
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
              <div className="grid grid-cols-2 gap-3 mb-6">
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => {
                  const link = `${window.location.origin}/register?ref=${memberInfo?.member_code}`;
                  navigator.clipboard.writeText(link);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }} className="col-span-2 bg-emerald-900 text-white rounded-[2rem] p-5 flex flex-col items-center gap-3 shadow-xl shadow-emerald-900/20">
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

                <motion.button whileTap={{ scale: 0.96 }} onClick={() => { setShowShareHub(false); router.push('/materials?tool=poster'); }} className="bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-[2rem] p-5 flex flex-col items-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  <span className="text-[9px] font-black uppercase tracking-widest">產生海報</span>
                </motion.button>

                <motion.button whileTap={{ scale: 0.96 }} onClick={() => { setShowShareHub(false); router.push('/materials'); }} className="bg-cyan-50 text-cyan-700 border border-cyan-100 rounded-[2rem] p-5 flex flex-col items-center gap-3">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-[9px] font-black uppercase tracking-widest">品牌素材</span>
                </motion.button>
              </div>

              {/* Official Social Media section */}
              <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-100"></div>
                  <span className="flex-shrink mx-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">官方社群專區</span>
                  <div className="flex-grow border-t border-slate-100"></div>
              </div>

              {/* Grid 2x2 of LINE@ & Facebook */}
              <div className="grid grid-cols-2 gap-3">
                {/* 1. Copy LINE Link */}
                <motion.button 
                  whileTap={{ scale: 0.96 }} 
                  onClick={() => {
                    const link = "https://lin.ee/PB4ztiM";
                    navigator.clipboard.writeText(link);
                    setCopiedLineLink(true);
                    setTimeout(() => setCopiedLineLink(false), 2000);
                  }} 
                  className="bg-[#06C755]/10 hover:bg-[#06C755]/15 text-[#06C755] border border-[#06C755]/20 rounded-[2rem] p-5 flex flex-col items-center gap-3 transition"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#06C755]">
                    <path d="M12 2C6.48 2 2 5.48 2 9.76c0 2.5 1.56 4.71 4 5.96-.13.56-.47 2.02-.54 2.37-.1.45.16.4.34.28.98-.65 2.87-1.92 3.42-2.28.25.04.51.06.78.06 5.52 0 10-3.48 10-7.76S17.52 2 12 2z"/>
                  </svg>
                  <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                    {copiedLineLink ? '已複製！' : '複製官方 LINE'}
                  </span>
                </motion.button>

                {/* 2. Show LINE QR */}
                <motion.button 
                  whileTap={{ scale: 0.96 }} 
                  onClick={() => {
                    setShowShareHub(false);
                    setTimeout(() => setShowOfficialQrModal(true), 300);
                  }} 
                  className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-[2rem] p-5 flex flex-col items-center gap-3 transition"
                >
                  <QrCode className="w-6 h-6 text-emerald-600" />
                  <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                    官方 LINE QR
                  </span>
                </motion.button>

                {/* 3. Copy Facebook Link */}
                <motion.button 
                  whileTap={{ scale: 0.96 }} 
                  onClick={() => {
                    const link = "https://www.facebook.com/profile.php?id=61588161490453";
                    navigator.clipboard.writeText(link);
                    setCopiedFbLink(true);
                    setTimeout(() => setCopiedFbLink(false), 2000);
                  }} 
                  className="bg-sky-500/10 hover:bg-sky-500/15 text-sky-600 border border-sky-500/20 rounded-[2rem] p-5 flex flex-col items-center gap-3 transition"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-sky-600">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                    {copiedFbLink ? '已複製！' : '複製官方臉書'}
                  </span>
                </motion.button>

                {/* 4. Show Facebook QR */}
                <motion.button 
                  whileTap={{ scale: 0.96 }} 
                  onClick={() => {
                    setShowShareHub(false);
                    setTimeout(() => setShowFbQrModal(true), 300);
                  }} 
                  className="bg-sky-50 text-sky-700 border border-sky-100 rounded-[2rem] p-5 flex flex-col items-center gap-3 transition"
                >
                  <QrCode className="w-6 h-6 text-sky-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                    官方臉書 QR
                  </span>
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
                 
                 {/* 分類 Tabs */}
                 <div className="flex gap-2 mb-6 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shrink-0">
                    {['茶葉', '禮盒', '豬後製品'].map(cat => (
                       <button
                         key={cat}
                         onClick={() => setSelectedPosterCategory(cat)}
                         className={`flex-1 h-11 flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedPosterCategory === cat ? 'bg-emerald-900 text-white shadow-lg shadow-emerald-900/10' : 'text-slate-400 hover:text-slate-600'}`}
                       >
                          {cat}
                       </button>
                    ))}
                 </div>

                 <div className="overflow-y-auto no-scrollbar grid grid-cols-2 gap-4 pb-4 max-h-[50vh] auto-rows-max items-start content-start">
                    {posterTemplates.filter(temp => (temp.category || '茶葉') === selectedPosterCategory).map((temp) => (
                      <div key={temp.id} onClick={() => handleGeneratePoster(temp)} className="aspect-[1/1.4] w-full rounded-2xl overflow-hidden border-4 border-white shadow-lg cursor-pointer relative group flex flex-col bg-slate-50">
                         <img src={temp.url} className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-emerald-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Sparkles className="w-8 h-8 text-white" /></div>
                      </div>
                    ))}
                    {posterTemplates.filter(temp => (temp.category || '茶葉') === selectedPosterCategory).length === 0 && (
                       <div className="col-span-2 py-12 text-center text-slate-300">
                          <p className="text-[10px] font-black uppercase tracking-widest">目前此分類尚無海報樣板</p>
                       </div>
                    )}
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
             <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="bg-white rounded-[3.5rem] p-6 sm:p-8 w-full max-w-md shadow-2xl relative flex flex-col items-center max-h-[90vh] overflow-y-auto no-scrollbar">
                <div className="w-full flex justify-between items-center mb-6 shrink-0">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Poster Preview</span>
                   <button onClick={() => setShowPosterPreview(false)} className="text-slate-300 hover:text-slate-900"><X /></button>
                </div>
                <div className="w-full max-h-[55vh] flex items-center justify-center bg-slate-100 rounded-2xl overflow-hidden shadow-2xl relative mb-6 shrink-0">
                   {isGeneratingPoster ? <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/80"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div> : <img src={posterDataUrl || ''} className="max-w-full max-h-[55vh] object-contain" />}
                </div>

                {!isGeneratingPoster && (
                  <>
                    <p className="text-sm font-black text-slate-800 mb-4 text-center">請確認海報上的聯絡資訊是否有誤？</p>

                     {/* Sharing Member's Contact Info Card */}
                     <div className="w-full bg-slate-50/60 rounded-[2rem] p-5 border border-slate-100 mb-5 text-left space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">目前聯絡設定</span>
                           <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">動態同步中</span>
                        </div>
                        <div className="grid grid-cols-[65px_1fr] gap-x-2 gap-y-2 text-xs text-slate-600">
                           <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">聯 絡 人：</span>
                           <span className="font-black text-slate-800">{memberInfo?.name || "未填寫"}</span>
                           
                           <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">聯絡電話：</span>
                           <span className="font-black text-slate-800">{memberInfo?.phone || "未填寫"}</span>
                           
                           <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">聯絡地址：</span>
                           <span className="font-black text-slate-800 break-all leading-normal">{memberInfo?.address || "未填寫"}</span>
                        </div>
                     </div>
                    <div className="grid grid-cols-2 gap-3 w-full mb-3">
                      <button onClick={() => { setShowPosterPreview(false); router.push('/profile/security/profile-settings'); }} className="bg-slate-50 hover:bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition flex items-center justify-center gap-2 border border-slate-200 shadow-sm">
                        <User className="w-4 h-4" /> 修正資料
                      </button>
                      <button onClick={handleSharePoster} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition flex items-center justify-center gap-2 border border-indigo-100 shadow-sm">
                        <Share2 className="w-4 h-4" /> 立即分享
                      </button>
                    </div>
                    <button onClick={downloadGeneratedPoster} className="w-full bg-emerald-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-900/20 active:scale-95 transition flex items-center justify-center gap-3">
                       <Download className="w-4 h-4" /> 確認無誤，下載儲存
                    </button>
                  </>
                )}
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

      {/* Official LINE QR Code Display Modal */}
      <AnimatePresence>
        {showOfficialQrModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-2xl flex items-center justify-center p-4" onClick={() => setShowOfficialQrModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[3.5rem] p-8 w-full max-w-sm shadow-2xl relative flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
              <div className="w-full flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-lg font-black text-slate-900 text-left">官方 LINE@ QR 碼</h4>
                  <p className="text-[9px] font-black text-[#06C755] uppercase tracking-widest text-left mt-0.5">Official LINE@ QR Code</p>
                </div>
                <button onClick={() => setShowOfficialQrModal(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="bg-[#06C755]/5 p-6 rounded-[2.5rem] border border-[#06C755]/10 mb-6 flex justify-center items-center shadow-inner">
                <QRCodeCanvas value="https://lin.ee/PB4ztiM" size={200} level="H" className="rounded-2xl p-3 bg-white shadow-md border border-slate-100" />
              </div>

              <p className="text-[9px] font-black text-[#06C755] uppercase tracking-widest">官方客服與通知</p>
              <h4 className="text-xl font-black text-slate-800 tracking-wider mt-1 mb-4">💬 ＠churuntea</h4>
              <p className="text-xs text-slate-500 font-bold px-4 leading-relaxed">
                掃描此 QR 碼即可加入官方 LINE@，接收最新活動通知、營運公告與專屬一對一客服服務。
              </p>
              
              <button onClick={() => setShowOfficialQrModal(false)} className="mt-8 w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-900/10 active:scale-95 transition">關閉</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Official Facebook QR Code Display Modal */}
      <AnimatePresence>
        {showFbQrModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-2xl flex items-center justify-center p-4" onClick={() => setShowFbQrModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[3.5rem] p-8 w-full max-w-sm shadow-2xl relative flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
              <div className="w-full flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-lg font-black text-slate-900 text-left">官方臉書 QR 碼</h4>
                  <p className="text-[9px] font-black text-sky-600 uppercase tracking-widest text-left mt-0.5">Official Facebook QR Code</p>
                </div>
                <button onClick={() => setShowFbQrModal(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="bg-sky-500/5 p-6 rounded-[2.5rem] border border-sky-500/10 mb-6 flex justify-center items-center shadow-inner">
                <QRCodeCanvas value="https://www.facebook.com/profile.php?id=61588161490453" size={200} level="H" className="rounded-2xl p-3 bg-white shadow-md border border-slate-100" />
              </div>

              <p className="text-[9px] font-black text-sky-600 uppercase tracking-widest">官方粉絲專頁</p>
              <h4 className="text-xl font-black text-slate-800 tracking-wider mt-1 mb-4">📘 初潤製茶所 Churun</h4>
              <p className="text-xs text-slate-500 font-bold px-4 leading-relaxed">
                掃描此 QR 碼即可追蹤官方臉書粉絲專頁，獲取茶品故事、形象素材、品牌資訊與最新消息。
              </p>
              
              <button onClick={() => setShowFbQrModal(false)} className="mt-8 w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-900/10 active:scale-95 transition">關閉</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Glassmorphic LINE Contact Button */}
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
        className="fixed right-6 bottom-28 z-[70]"
      >
        <a 
          href="https://lin.ee/PB4ztiM" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-2 bg-[#06C755]/15 hover:bg-[#06C755]/25 backdrop-blur-xl border border-[#06C755]/30 p-2 pl-3 pr-4 rounded-full shadow-lg shadow-[#06C755]/10 active:scale-95 transition group"
        >
          {/* Pulsing ring around logo */}
          <div className="relative w-8 h-8 rounded-full bg-[#06C755] flex items-center justify-center shrink-0 shadow-md">
            <span className="absolute inset-0 rounded-full bg-[#06C755] animate-ping opacity-30"></span>
            {/* Crisp minimal official LINE-like logo representation */}
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M12 2C6.48 2 2 5.48 2 9.76c0 2.5 1.56 4.71 4 5.96-.13.56-.47 2.02-.54 2.37-.1.45.16.4.34.28.98-.65 2.87-1.92 3.42-2.28.25.04.51.06.78.06 5.52 0 10-3.48 10-7.76S17.52 2 12 2z"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black tracking-widest text-[#06C755] uppercase leading-none">LINE 聯絡</span>
            <span className="text-[7px] font-black tracking-wider text-slate-400 uppercase mt-0.5 whitespace-nowrap">Official Link</span>
          </div>
        </a>
      </motion.div>

      {/* Bottom Nav */}
      <div className="fixed bottom-8 left-4 right-4 z-50 mx-auto max-w-sm">
         <div className="bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] p-3 flex justify-between items-center shadow-2xl border border-white/5">
            <Link href="/" className="flex-1 flex flex-col items-center gap-1 text-white transition"><LayoutDashboard className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-[0.2em]">Home</span></Link>
            <Link href="/store" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition"><ShoppingBag className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-[0.2em]">Shop</span></Link>
            <div onClick={() => router.push("/profile")} className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg -mt-8 border-4 border-[#FDFBF7] cursor-pointer"><Plus className="w-6 h-6 text-white" /></div>
            <Link href="/organization" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition"><Zap className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-[0.2em]">Team</span></Link>
            <Link href="/profile" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition"><User className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-[0.2em]">Me</span></Link>
         </div>
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
                                  {isPos ? `+${tx.amount}` : tx.amount}
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

      {/* Ambassador Options Modal */}
      <AnimatePresence>
        {showAmbassadorOptions && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAmbassadorOptions(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] p-8 w-full max-w-md shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <button 
                onClick={() => setShowAmbassadorOptions(false)}
                className="absolute top-6 right-6 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center pb-6 border-b border-slate-100">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Crown className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">選擇申請方案</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Select Application Type</p>
              </div>

              <div className="py-6 space-y-4">
                {/* 方案 A: 業績免費升級 */}
                <div 
                  onClick={() => handleSelectAmbassadorType('free')}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                    freeEligibilityScore >= 300000 
                      ? 'border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50' 
                      : 'border-slate-100 bg-slate-50/50 opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">🏆 業績免費升級</h4>
                      <p className="text-[10px] text-slate-500 font-bold mt-1">個人及直推累計業績達標</p>
                    </div>
                    {freeEligibilityScore >= 300000 ? (
                      <span className="text-[9px] bg-emerald-100 text-emerald-700 font-black px-2 py-1 rounded">符合資格</span>
                    ) : (
                      <span className="text-[9px] bg-slate-200 text-slate-500 font-black px-2 py-1 rounded">未達標</span>
                    )}
                  </div>
                  <div className="mt-3 p-3 bg-white rounded-xl border border-slate-100 text-[10px] font-mono text-slate-600">
                    目前積分：{freeEligibilityScore.toLocaleString()} / 300,000
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2 leading-relaxed">
                    * 積分計算 = (個人歷史總消費 / 2) + (直推夥伴歷史總消費 / 2)
                  </p>
                </div>

                {/* 方案 B: 付費升級 */}
                <div 
                  onClick={() => handleSelectAmbassadorType('paid')}
                  className="p-5 rounded-2xl border-2 border-amber-500 bg-amber-50/50 hover:bg-amber-50 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">💰 付費升級方案</h4>
                      <p className="text-[10px] text-slate-500 font-bold mt-1">快速通關，即刻享有尊榮特權</p>
                    </div>
                  </div>
                  <div className="mt-3 text-lg font-black text-amber-600">
                    NT$ 98,000 <span className="text-[10px] text-slate-400 font-normal">/ 兩年效期</span>
                  </div>
                </div>

                {/* 方案 C: 合夥人 */}
                <div 
                  onClick={() => handleSelectAmbassadorType('partner')}
                  className="p-5 rounded-2xl border-2 border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">🤝 申請成為合夥人</h4>
                      <p className="text-[10px] text-slate-500 font-bold mt-1">最高等級，專屬賦能</p>
                    </div>
                  </div>
                  <div className="mt-3 text-lg font-black text-indigo-600">
                    NT$ 298,000 <span className="text-[10px] text-slate-400 font-normal">/ 兩年效期</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Modal */}
      <AnimatePresence>
        {showAmbassadorConfirm && (
          <div className="fixed inset-0 z-[125] flex items-center justify-center p-6">
            <motion.div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[3rem] p-8 w-full max-w-sm shadow-2xl relative z-10 text-center"
            >
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">確認申請方式</h3>
              <p className="text-xs text-slate-500 font-bold leading-relaxed mb-6">
                您選擇的是「{selectedAmbassadorType === 'free' ? '業績免費升級' : selectedAmbassadorType === 'paid' ? '付費升級方案' : '合夥人方案'}」，<br/>是否確定以此方式進行申請？
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowAmbassadorConfirm(false)}
                  className="py-3 rounded-xl bg-slate-100 text-slate-600 font-black text-xs hover:bg-slate-200 transition"
                >
                  取消
                </button>
                <button 
                  onClick={() => {
                    if (selectedAmbassadorType === 'free' && freeEligibilityScore < 300000) {
                      alert('您的積分尚未達標，無法申請免額升級。');
                      setShowAmbassadorConfirm(false);
                      return;
                    }
                    setShowAmbassadorConfirm(false);
                    setShowAmbassadorForm(true);
                  }}
                  className="py-3 rounded-xl bg-slate-900 text-white font-black text-xs hover:bg-slate-800 transition shadow-lg shadow-slate-900/20"
                >
                  確認並填寫表單
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Application Form Modal */}
      <AnimatePresence>
        {showAmbassadorForm && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-6">
            <motion.div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" />
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[3rem] p-8 w-full max-w-md shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-900">填寫申請資料</h3>
                <button onClick={() => setShowAmbassadorForm(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"><X className="w-4 h-4"/></button>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase">基本資料 (自動帶入)</p>
                  <p className="text-sm font-bold text-slate-800">姓名：{memberInfo?.name}</p>
                  <p className="text-sm font-bold text-slate-800">電話：{memberInfo?.phone}</p>
                  <p className="text-sm font-bold text-slate-800">編號：{memberInfo?.member_code}</p>
                </div>

                {selectedAmbassadorType !== 'free' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        匯款帳號後五碼 <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        maxLength={5}
                        placeholder="例如: 12345"
                        value={ambassadorFormData.last_five}
                        onChange={(e) => setAmbassadorFormData({...ambassadorFormData, last_five: e.target.value.replace(/\D/g, '')})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        匯款水單照片 (選填)
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="flex-1 flex items-center justify-center gap-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl px-4 py-8 text-sm font-bold text-slate-400 cursor-pointer hover:border-emerald-400 hover:text-emerald-500 transition-all">
                          <Camera className="w-5 h-5" />
                          <span>上傳截圖或照片</span>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => setAmbassadorFormData({...ambassadorFormData, remittance_photo: event.target?.result as string});
                              reader.readAsDataURL(file);
                            }
                          }} />
                        </label>
                      </div>
                      {ambassadorFormData.remittance_photo && (
                        <div className="mt-3 relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                          <img src={ambassadorFormData.remittance_photo} className="w-full h-full object-cover" />
                          <button 
                            onClick={() => setAmbassadorFormData({...ambassadorFormData, remittance_photo: ''})}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center"
                          ><X className="w-3 h-3"/></button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 填寫詳細個人資料 */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">詳細個人資料 (必填)</p>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400">出生年月日 <span className="text-rose-500">*</span></label>
                    <input type="date" value={ambassadorFormData.birthday} onChange={e => setAmbassadorFormData({...ambassadorFormData, birthday: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold border border-slate-100 focus:border-emerald-500 outline-none" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400">身分證字號 <span className="text-rose-500">*</span></label>
                    <input type="text" placeholder="例如: A123456789" value={ambassadorFormData.id_card_number} onChange={e => setAmbassadorFormData({...ambassadorFormData, id_card_number: e.target.value.toUpperCase()})} className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold border border-slate-100 focus:border-emerald-500 outline-none uppercase" />
                  </div>

                  <div className="space-y-1.5">
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
                        <option value="">選擇區域</option>
                        {ambassadorFormData.city && TAIWAN_CITIES[ambassadorFormData.city]?.map(dist => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>
                    <input type="text" placeholder="請填寫詳細地址" value={ambassadorFormData.address} onChange={e => setAmbassadorFormData({...ambassadorFormData, address: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold border border-slate-100 focus:border-emerald-500 outline-none" />
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-black text-slate-400">身分證正面相片 <span className="text-rose-500">*</span></label>
                    {ambassadorFormData.id_card_front ? (
                      <div className="space-y-3">
                        <img src={ambassadorFormData.id_card_front} className="w-full h-28 object-cover rounded-2xl border border-emerald-500" />
                        <label className="flex items-center justify-center gap-2 w-full py-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer text-sm font-bold">
                          <Camera className="w-4 h-4" /> 重選正面
                          <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) setAmbassadorFormData({...ambassadorFormData, id_card_front: await applyWatermark(file)});
                          }} />
                        </label>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-2 bg-slate-50 border-2 border-dashed border-slate-200 text-slate-400 rounded-2xl p-6 text-sm font-bold cursor-pointer hover:border-emerald-400">
                        <Camera className="w-5 h-5 mb-1" />
                        <span>上傳身分證正面</span>
                        <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) setAmbassadorFormData({...ambassadorFormData, id_card_front: await applyWatermark(file)});
                        }} />
                      </label>
                    )}
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-black text-slate-400">身分證反面相片 <span className="text-rose-500">*</span></label>
                    {ambassadorFormData.id_card_back ? (
                      <div className="space-y-3">
                        <img src={ambassadorFormData.id_card_back} className="w-full h-28 object-cover rounded-2xl border border-emerald-500" />
                        <label className="flex items-center justify-center gap-2 w-full py-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer text-sm font-bold">
                          <Camera className="w-4 h-4" /> 重選反面
                          <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) setAmbassadorFormData({...ambassadorFormData, id_card_back: await applyWatermark(file)});
                          }} />
                        </label>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-2 bg-slate-50 border-2 border-dashed border-slate-200 text-slate-400 rounded-2xl p-6 text-sm font-bold cursor-pointer hover:border-emerald-400">
                        <Camera className="w-5 h-5 mb-1" />
                        <span>上傳身分證反面</span>
                        <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) setAmbassadorFormData({...ambassadorFormData, id_card_back: await applyWatermark(file)});
                        }} />
                      </label>
                    )}
                  </div>
                </div>

                {ambassadorError && (
                  <p className="text-xs font-bold text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-100">{ambassadorError}</p>
                )}

                <button 
                  onClick={handleSubmitAmbassador}
                  disabled={isSubmittingAmbassador}
                  className="w-full py-4 rounded-xl bg-emerald-900 text-white font-black text-sm shadow-lg shadow-emerald-900/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 mt-4"
                >
                  {isSubmittingAmbassador ? <Loader2 className="w-5 h-5 animate-spin"/> : '送出申請'}
                </button>
                <div className="text-center text-slate-200 text-[10px] mt-6 pointer-events-none select-none font-bold uppercase tracking-widest">
                  初潤製茶所 Churun Tea House
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="opacity-0 pointer-events-none absolute -z-10" aria-hidden="true" id="hidden-qr-canvas">
        <QRCodeCanvas value={`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${memberInfo?.member_code}`} size={512} level="H" />
      </div>

      {/* Global Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
            onClick={() => { setPreviewImage(null); setAvatarZoom(1); }} // Reuse avatarZoom state for this locally or create a new one, but for simplicity let's use a local state. Wait, I can't use useState inside here easily without creating a new component. Let's just create an ImagePreview component or use a wrapper.
          >
            {/* Wrapper to handle state */}
            <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
          </motion.div>
        )}
      </AnimatePresence>
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