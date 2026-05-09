"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import { 
  Image as ImageIcon, 
  ChevronRight, 
  LayoutDashboard, 
  ShoppingBag, 
  Plus, 
  Zap, 
  User, 
  Loader2,
  Download,
  ExternalLink,
  Star,
  ArrowLeft,
  Copy,
  Sparkles,
  X,
  Share2,
  IdCard,
  QrCode,
  UserPlus
} from "lucide-react";

function MaterialsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("全部");
  const [activeTab, setActiveTab] = useState<"visual" | "copy">("visual");

  // Poster states
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [posterTemplates, setPosterTemplates] = useState<any[]>([]);
  const [showPosterSelector, setShowPosterSelector] = useState(false);
  const [showPosterPreview, setShowPosterPreview] = useState(false);
  const [selectedPoster, setSelectedPoster] = useState<any>(null);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [posterDataUrl, setPosterDataUrl] = useState<string | null>(null);
  const [selectedPosterCategory, setSelectedPosterCategory] = useState("茶葉");

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    setCurrentUserId(savedId);
    fetchMaterials();
    fetchPosterData(savedId);
  }, [router]);

  useEffect(() => {
    if (searchParams && searchParams.get("tool") === "poster") {
      setShowPosterSelector(true);
    }
  }, [searchParams]);

  const fetchMaterials = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("materials").select("*").order("created_at", { ascending: false });
    if (data) {
      setMaterials(data);
    }
    setIsLoading(false);
  };

  const fetchPosterData = async (memberId: string) => {
    try {
      const { data: mData } = await supabase.from("members").select("*").eq("id", memberId).single();
      if (mData) setMemberInfo(mData);

      const { data: pData } = await supabase.from("poster_templates").select("*").eq("is_active", true).order("created_at", { ascending: false });
      if (pData) setPosterTemplates(pData);
    } catch (err) {
      console.error("Error fetching poster data:", err);
    }
  };

  const categories = ["全部", ...Array.from(new Set(materials.map(m => m.category)))];

  const filteredMaterials = materials.filter(m => {
    const matchesCategory = activeCategory === "全部" || m.category === activeCategory;
    const matchesTab = activeTab === "visual" 
      ? m.file_type === "image" || m.file_type === "video"
      : m.file_type === "text";
    return matchesCategory && matchesTab;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("文案已複製到剪貼簿！");
  };

  // Poster Generation Logic
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
        phone: { x: 380, y: 1155, size: 24, color: "#ffffff" },
        address: { x: 380, y: 1190, size: 20, color: "#ffffff" }
      };
      const hiddenQr = document.querySelector("#hidden-qr-canvas canvas") as HTMLCanvasElement;
      if (hiddenQr) ctx.drawImage(hiddenQr, config.qr?.x || 800, config.qr?.y || 1100, config.qr?.size || 160, config.qr?.size || 160);
      
      ctx.fillStyle = config.name?.color || '#ffffff';
      ctx.font = `${config.name?.size || 40}px "PMingLiU", "MingLiU", "Noto Serif TC", serif`;
      ctx.textAlign = 'left';
      ctx.fillText("聯絡人：" + (memberInfo?.name || ''), config.name?.x || 380, config.name?.y || 1120);
      
      ctx.fillStyle = config.phone?.color || config.name?.color || '#ffffff';
      ctx.font = `${config.phone?.size || 40}px "PMingLiU", "MingLiU", "Noto Serif TC", serif`;
      ctx.fillText("電話：" + (memberInfo?.phone || ''), config.phone?.x || 380, config.phone?.y || 1155);
      
      if (config.address) {
        ctx.fillStyle = config.address.color || config.name?.color || '#ffffff';
        ctx.font = `${config.address.size || 36}px "PMingLiU", "MingLiU", "Noto Serif TC", serif`;
        ctx.fillText("地址：" + (memberInfo?.address || ''), config.address.x || 380, config.address.y || 1190);
      }

      setPosterDataUrl(canvas.toDataURL('image/png'));
      setIsGeneratingPoster(false);
    };
  };

  const downloadGeneratedPoster = () => {
    if (!posterDataUrl || !memberInfo) return;
    const link = document.createElement('a');
    link.download = `churun-poster-${memberInfo.member_code}.png`;
    link.href = posterDataUrl;
    link.click();
    setShowPosterPreview(false);
  };

  const handleSharePoster = async () => {
    if (!posterDataUrl || !memberInfo) return;
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
      console.error('Error sharing poster:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      <nav className="bg-white/90 backdrop-blur-3xl sticky top-0 z-50 border-b border-slate-100 px-8 py-6 flex justify-between items-center max-w-lg mx-auto">
         <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-slate-50 rounded-full transition">
               <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div>
               <h1 className="text-sm font-black tracking-[0.3em] text-slate-800 uppercase">品牌素材中心</h1>
               <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Marketing Hub</p>
            </div>
         </div>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-8 mt-2">
        
        {/* Content Type Tabs */}
        <div className="flex p-2 bg-slate-100 rounded-3xl gap-2">
           <button 
             onClick={() => setActiveTab("visual")}
             className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'visual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
           >
              視覺素材
           </button>
           <button 
             onClick={() => setActiveTab("copy")}
             className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'copy' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
           >
              社群文案
           </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar px-2">
            <button 
               onClick={() => setShowPosterSelector(true)}
               className="px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-2"
            >
               <Sparkles className="w-3 h-3" /> 專屬海報生成器
            </button>
            {categories.map(cat => (
             <button 
               key={cat}
               onClick={() => setActiveCategory(cat)}
               className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition ${
                 activeCategory === cat ? 'bg-emerald-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'
               }`}
             >
                {cat}
             </button>
           ))}
        </div>

        {/* Dynamic Materials Grid */}
        <div className="space-y-6">
           {isLoading ? (
             <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>
           ) : filteredMaterials.length === 0 ? (
             <div className="py-20 text-center bg-white rounded-[3.5rem] border border-slate-50 shadow-sm">
                <ImageIcon className="w-12 h-12 text-slate-100 mx-auto mb-6" />
                <p className="text-xs font-black text-slate-300 uppercase tracking-widest">目前尚無素材內容</p>
             </div>
           ) : activeTab === "visual" ? (
             <div className="grid grid-cols-1 gap-6">
                {filteredMaterials.map((mat) => (
                  <motion.div 
                    key={mat.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[3.5rem] overflow-hidden shadow-sm border border-slate-50 group hover:border-emerald-200 transition-all duration-500"
                  >
                     <div className="aspect-[4/3] w-full bg-slate-50 relative overflow-hidden">
                        <img 
                          src={mat.thumbnail_url || mat.url} 
                          alt={mat.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" 
                        />
                        <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl text-[8px] font-black text-emerald-900 uppercase tracking-widest shadow-xl">
                           {mat.category}
                        </div>
                     </div>
                     <div className="p-8 flex justify-between items-center">
                        <div className="space-y-1">
                           <h4 className="font-black text-slate-800 text-lg tracking-tight">{mat.title}</h4>
                           <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Official Assets</p>
                        </div>
                        <a 
                          href={mat.url} 
                          download 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-14 h-14 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-slate-900/20 active:scale-90 transition"
                        >
                           <Download className="w-6 h-6" />
                        </a>
                     </div>
                  </motion.div>
                ))}
             </div>
           ) : (
             <div className="space-y-4">
                {filteredMaterials.map((mat) => (
                  <motion.div 
                    key={mat.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm space-y-6"
                  >
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                              <Star className="w-4 h-4" />
                           </div>
                           <h4 className="font-black text-slate-800 tracking-tight">{mat.title}</h4>
                        </div>
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{mat.category}</span>
                     </div>
                     <div className="bg-slate-50 rounded-2xl p-6 text-xs text-slate-500 leading-relaxed font-medium whitespace-pre-wrap italic">
                        {mat.description}
                     </div>
                     <button 
                       onClick={() => handleCopy(mat.description)}
                       className="w-full bg-slate-900 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 active:scale-95 transition"
                     >
                        <Copy className="w-4 h-4" /> 複製推廣文案
                     </button>
                  </motion.div>
                ))}
             </div>
           )}
        </div>

      </main>

      {/* Hidden QR Code Canvas (Must be rendered for drawing) */}
      <div className="opacity-0 pointer-events-none absolute -z-10" aria-hidden="true" id="hidden-qr-canvas">
        <QRCodeCanvas value={`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${memberInfo?.member_code}`} size={512} level="H" />
      </div>

      {/* Poster Template Selector Modal */}
      <AnimatePresence>
        {showPosterSelector && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8" onClick={() => setShowPosterSelector(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[3.5rem] p-6 sm:p-8 w-full max-w-md shadow-2xl relative flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
               <div className="w-full flex justify-between items-center mb-6 shrink-0">
                  <div>
                     <h4 className="text-lg font-black text-slate-900 text-left">選擇行銷海報</h4>
                     <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest text-left mt-0.5">Select Poster Template</p>
                  </div>
                  <button onClick={() => setShowPosterSelector(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400"><X className="w-5 h-5" /></button>
               </div>
               
               {/* Poster Categories */}
               <div className="flex gap-2 overflow-x-auto pb-4 shrink-0 no-scrollbar">
                  {["茶葉", "咖啡", "品牌"].map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => setSelectedPosterCategory(cat)} 
                      className={`px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition whitespace-nowrap ${
                        selectedPosterCategory === cat 
                          ? 'bg-emerald-900 text-white' 
                          : 'bg-slate-50 text-slate-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
               </div>

               <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-4">
                  {(() => {
                     const filtered = posterTemplates.filter(p => p.category === selectedPosterCategory);
                     if (filtered.length === 0) {
                        return (
                          <div className="text-center py-12 bg-slate-50 rounded-2xl">
                             <ImageIcon className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">目前尚無此分類樣板</p>
                          </div>
                        );
                     }
                     return (
                        <div className="grid grid-cols-2 gap-4">
                           {filtered.map(temp => (
                             <div key={temp.id} onClick={() => handleGeneratePoster(temp)} className="cursor-pointer group relative rounded-2xl overflow-hidden border border-slate-100 aspect-[3/4] bg-slate-50 flex items-center justify-center hover:border-emerald-500 transition duration-300">
                                <img src={temp.thumbnail_url || temp.url} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="" />
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                   <span className="text-[9px] font-black text-white uppercase tracking-widest bg-emerald-600 px-3 py-1.5 rounded-full shadow-lg">套用此模版</span>
                                </div>
                             </div>
                           ))}
                        </div>
                     );
                  })()}
               </div>
               <button onClick={() => setShowPosterSelector(false)} className="mt-6 w-full py-4 text-slate-300 font-black text-[10px] uppercase tracking-widest">取消</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Poster Preview Modal */}
      <AnimatePresence>
        {showPosterPreview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-3xl flex items-center justify-center p-4 sm:p-8">
             <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="bg-white rounded-[3.5rem] p-6 sm:p-8 w-full max-w-md shadow-2xl relative flex flex-col items-center max-h-[90vh] overflow-y-auto no-scrollbar">
                <div className="w-full flex justify-between items-center mb-6 shrink-0">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Poster Preview</span>
                   <button onClick={() => setShowPosterPreview(false)} className="text-slate-300 hover:text-slate-900"><X /></button>
                </div>
                <div className="w-full max-h-[48vh] flex items-center justify-center bg-slate-100 rounded-2xl overflow-hidden shadow-2xl relative mb-6 shrink-0">
                   {isGeneratingPoster ? <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/80"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div> : <img src={posterDataUrl || ''} className="max-w-full max-h-[48vh] object-contain" />}
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

      {/* Bottom Nav */}
      <div className="fixed bottom-8 left-4 right-4 z-50 mx-auto max-w-sm">
         <div className="bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] p-3 flex justify-between items-center shadow-2xl shadow-slate-900/30 border border-white/5">
            <Link href="/" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <LayoutDashboard className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">首頁</span>
            </Link>
            <Link href="/store" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <ShoppingBag className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">商城</span>
            </Link>
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 -mt-8 border-4 border-[#FDFBF7]">
               <Plus className="w-6 h-6 text-white" />
            </div>
            <Link href="/organization" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <Zap className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">組織</span>
            </Link>
            <Link href="/profile" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <User className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">我的</span>
            </Link>
         </div>
      </div>
    </div>
  );
}

export default function Materials() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-900" /></div>}>
      <SuspenseWrapper />
    </Suspense>
  );
}

function SuspenseWrapper() {
  return <MaterialsContent />;
}
