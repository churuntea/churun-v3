"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../supabase";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import {
  ArrowLeft,
  Download,
  IdCard,
  Loader2,
  X,
  Sparkles,
  Camera,
  Share2
} from "lucide-react";

const CR_LOGO = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjMwIiBmaWxsPSIjMDY0ZTMiLz48dGV4dCB4PSI1MCIgeT0iNjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI0NSIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5DUjwvdGV4dD48L3N2Zz4=";

export default function VCardPage() {
  const router = useRouter();
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) { router.replace("/login"); return; }
    currentUserIdRef.current = savedId;
    fetchData(savedId);
  }, [router]);

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    const { data } = await supabase.from("members").select("*").eq("id", userId).single();
    setMemberInfo(data);
    setIsLoading(false);
    if (data) {
       // Auto-generate after a short delay for data loading
       setTimeout(() => generateCard(data), 500);
    }
  };

  const generateCard = (info: any) => {
    if (!info) return;
    setIsGenerating(true);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = 1200; canvas.height = 700;

    // Background Gradient
    const gradient = ctx.createLinearGradient(0, 0, 1200, 700);
    gradient.addColorStop(0, "#064e3b");
    gradient.addColorStop(1, "#022c22");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 700);

    // Decorative "CR"
    ctx.save();
    ctx.globalAlpha = 0.03;
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 400px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CR", 600, 500);
    ctx.restore();

    const leftX = 100;
    // Name
    ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 20;
    ctx.fillStyle = "#ffffff";
    const nameFontSize = info.name.length > 10 ? 70 : 100;
    ctx.font = `900 ${nameFontSize}px "Inter", sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(info.name, leftX, 280);
    ctx.shadowBlur = 0;

    // Member Code
    ctx.fillStyle = "#10b981";
    ctx.font = "800 40px monospace";
    ctx.fillText(info.member_code, leftX, 360);

    // Tier Badge
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath();
    const tierText = info.tier?.toUpperCase() || "初潤夥伴";
    ctx.font = "bold 22px sans-serif";
    const tierWidth = ctx.measureText(tierText).width + 40;
    if (ctx.roundRect) ctx.roundRect(leftX, 395, tierWidth, 45, 12); else ctx.rect(leftX, 395, tierWidth, 45);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(tierText, leftX + 20, 426);

    // Phone
    if (info.phone) {
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText("SERVICE / " + info.phone, leftX, 500);
    }

    // Motto
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "italic bold 20px sans-serif";
    ctx.fillText(info.motto || "以初心、致潤澤 — 初潤製茶所", leftX, 580);

    // Profile Box
    const boxW = 420, boxH = 580;
    const boxX = 1200 - boxW - 100, boxY = (700 - boxH) / 2;
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(boxX, boxY, boxW, boxH, 60); else ctx.rect(boxX, boxY, boxW, boxH);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 2; ctx.stroke();

    const finishCard = () => {
      const qEl = document.getElementById("vcard-hidden-qr") as HTMLCanvasElement;
      if (qEl) {
        const qSize = 220, qX = boxX + (boxW - qSize) / 2, qY = boxY + 310;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(qX - 20, qY - 20, qSize + 40, qSize + 40, 30); else ctx.rect(qX - 20, qY - 20, qSize + 40, qSize + 40);
        ctx.fill();
        ctx.drawImage(qEl, qX, qY, qSize, qSize);
        ctx.fillStyle = "#ffffff"; ctx.font = "bold 24px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("掃碼加入初潤", boxX + boxW / 2, boxY + 545);
      }
      setCardDataUrl(canvas.toDataURL("image/png"));
      setIsGenerating(false);
    };

    const drawDefaultAvatar = () => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = "https://i.ibb.co/6R2M5X1/churun-baby.png";
      img.onload = () => {
        ctx.save();
        const aSize = 240, aX = boxX + (boxW - aSize) / 2, aY = boxY + 40;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(aX, aY, aSize, aSize, 50); else ctx.rect(aX, aY, aSize, aSize);
        ctx.clip();
        ctx.drawImage(img, aX, aY, aSize, aSize);
        ctx.restore();
        finishCard();
      };
      img.onerror = () => {
        // Absolute fallback to CR text if image fails
        ctx.save();
        const aSize = 240, aX = boxX + (boxW - aSize) / 2, aY = boxY + 40;
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(aX, aY, aSize, aSize, 50); else ctx.rect(aX, aY, aSize, aSize);
        ctx.fill();
        ctx.fillStyle = "#ffffff"; ctx.font = "900 100px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("CR", aX + aSize / 2, aY + aSize / 2 + 35);
        ctx.restore();
        finishCard();
      };
    };

    const avatarUrl = info.avatar_url;
    const settings = info.avatar_settings || { zoom: 1, offset: 0 };
    if (avatarUrl && !avatarUrl.includes("churun-baby")) {
      const img = new Image(); img.crossOrigin = "anonymous"; img.src = avatarUrl;
      img.onload = () => {
        try {
          ctx.save();
          const aSize = 240, aX = boxX + (boxW - aSize) / 2, aY = boxY + 40;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(aX, aY, aSize, aSize, 50); else ctx.rect(aX, aY, aSize, aSize);
          ctx.clip();
          const aspect = img.width / img.height;
          let tW = aSize, tH = aSize;
          if (aspect > 1) { tW = aSize * aspect * settings.zoom; tH = aSize * settings.zoom; }
          else { tH = (aSize / aspect) * settings.zoom; tW = aSize * settings.zoom; }
          ctx.drawImage(img, aX - (tW - aSize) / 2, aY - (tH - aSize) / 2 + settings.offset, tW, tH);
          ctx.restore();
          finishCard();
        } catch (e) { drawDefaultAvatar(); finishCard(); }
      };
      img.onerror = () => { drawDefaultAvatar(); finishCard(); };
    } else { drawDefaultAvatar(); finishCard(); }
  };

  const downloadCard = () => {
    if (!cardDataUrl) return;
    const link = document.createElement("a");
    link.download = `churun-vip-card-${memberInfo?.member_code}.png`;
    link.href = cardDataUrl;
    link.click();
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-900" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-20">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 max-w-lg mx-auto flex justify-between items-center bg-[#FDFBF7]/80 backdrop-blur-xl border-b border-slate-100">
        <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50">
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </button>
        <h1 className="text-xs font-black tracking-[0.3em] text-slate-800 uppercase">會員電子名片</h1>
        <button onClick={() => router.push("/profile/security/profile-settings")} className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50">
           <Camera className="w-4 h-4 text-emerald-600" />
        </button>
      </nav>

      <main className="max-w-lg mx-auto px-6 pt-32 space-y-8 flex flex-col items-center">
        <div className="text-center space-y-2">
           <h2 className="text-2xl font-black text-slate-900">VIP Identity Card</h2>
           <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">專屬您的品牌身份證明</p>
        </div>

        {/* Card Preview Container */}
        <div className="w-full aspect-[1.6/1] bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-50 relative group">
           {isGenerating ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-900" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Generating Digital Card...</p>
             </div>
           ) : cardDataUrl ? (
             <img src={cardDataUrl} className="w-full h-full object-contain" alt="VIP Card" />
           ) : null}
        </div>

        <div className="grid grid-cols-1 w-full gap-4">
           <motion.button 
             whileTap={{ scale: 0.95 }}
             onClick={downloadCard}
             disabled={isGenerating || !cardDataUrl}
             className="w-full bg-emerald-900 text-white py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3 disabled:opacity-50"
           >
              <Download className="w-5 h-5" />
              立即下載存入相簿
           </motion.button>

           <motion.button 
             whileTap={{ scale: 0.95 }}
             onClick={() => router.push("/profile/security/profile-settings")}
             className="w-full bg-white text-slate-900 py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest border border-slate-100 shadow-sm flex items-center justify-center gap-3"
           >
              <Camera className="w-5 h-5 text-emerald-600" />
              調整照片與座右銘
           </motion.button>
        </div>

        <div className="bg-emerald-50 rounded-[2.5rem] p-8 border border-emerald-100/50 w-full">
           <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                 <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <div className="space-y-2">
                 <p className="text-xs font-black text-emerald-900">使用提示</p>
                 <p className="text-[11px] text-emerald-700/70 font-medium leading-relaxed">
                   您可以將此名片分享至 LINE 群組或 Facebook，讓朋友透過掃描名片上的 QR Code 直接註冊並成為您的合作夥伴。
                 </p>
              </div>
           </div>
        </div>

        {/* Hidden QR Source */}
        <div className="opacity-0 pointer-events-none absolute -z-10" aria-hidden="true">
           <QRCodeCanvas
             id="vcard-hidden-qr"
             value={`${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${memberInfo?.member_code}`}
             size={512}
             level="H"
           />
        </div>
      </main>
    </div>
  );
}
