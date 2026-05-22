"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  Loader2,
  CheckCircle2,
  Sparkles,
  MapPin,
  User
} from "lucide-react";
import Toast, { ToastType } from "@/components/Toast";

const isVideoUrl = (url: string) => {
  if (!url) return false;
  return url.startsWith("data:video/") || 
         url.toLowerCase().endsWith(".mp4") || 
         url.toLowerCase().endsWith(".mov") || 
         url.toLowerCase().endsWith(".webm") || 
         (url.includes("/materials/material_") && (url.toLowerCase().endsWith(".mp4") || url.toLowerCase().endsWith(".mov") || url.toLowerCase().endsWith(".webm")));
};

const TAIWAN_CITIES: Record<string, string[]> = {
  "台北市": ["中正區", "萬華區", "大同區", "中山區", "松山區", "大安區", "信義區", "內湖區", "南港區", "士林區", "北投區", "文山區"],
  "新北市": ["板橋區", "三重區", "中和區", "永和區", "新莊區", "新店區", "土城區", "蘆洲區", "汐止區", "樹林區", "淡水區", "五股區", "泰山區", "林口區", "三峽區", "鶯歌區", "八里區", "瑞芳區"],
  "桃園市": ["桃園區", "中壢區", "平鎮區", "八德區", "楊梅區", "蘆竹區", "大溪區", "龍潭區", "龜山區", "大園區"],
  "台中市": ["中區", "東區", "南區", "西區", "北區", "北屯區", "西屯區", "南屯區", "太平區", "大里區", "霧峰區", "烏日區", "豐原區", "后里區", "潭子區", "大雅區", "沙鹿區", "清水區", "大甲區"],
  "台南市": ["中西區", "東區", "南區", "北區", "安平區", "安南區", "永康區", "歸仁區", "新化區", "麻豆區", "佳里區", "新營區", "白河區", "善化區"],
  "高雄市": ["新興區", "前金區", "苓雅區", "鹽埕區", "鼓山區", "前鎮區", "三民區", "楠梓區", "小港區", "左營區", "鳳山區", "大寮區", "林園區", "岡山區", "路竹區", "旗山區", "美濃區"],
  "基隆市": ["仁愛區", "信義區", "中正區", "中山區", "安樂區", "暖暖區", "七堵區"],
  "新竹市": ["東區", "北區", "香山區"],
  "新竹縣": ["竹北市", "竹東鎮", "新埔鎮", "關西鎮", "湖口鄉", "新豐鄉", "芎林鄉", "寶山鄉"],
  "苗栗縣": ["苗栗市", "頭份市", "竹南鎮", "後龍鎮", "通霄鎮", "苑裡鎮", "公館鄉", "三義鄉"],
  "彰化縣": ["彰化市", "鹿港鎮", "和美鎮", "員林市", "溪湖鎮", "田中鎮", "二林鎮", "北斗鎮", "花壇鄉", "大村鄉"],
  "南投縣": ["南投市", "埔里鎮", "草屯鎮", "竹山鎮", "集集鎮", "名間鄉", "鹿谷鄉", "魚池鄉", "國姓鄉"],
  "雲林縣": ["斗六市", "斗南鎮", "虎尾鎮", "西螺鎮", "土庫鎮", "北港鎮", "麥寮鄉", "古坑鄉"],
  "嘉義市": ["東區", "西區"],
  "嘉義縣": ["太保市", "朴子市", "民雄鄉", "新港鄉", "水上鄉", "中埔鄉", "竹崎鄉", "梅山鄉", "阿里山鄉"],
  "屏東縣": ["屏東市", "潮州鎮", "東港鎮", "恆春鎮", "萬丹鄉", "長治鄉", "內埔鄉", "枋寮鄉", "琉球鄉"],
  "宜蘭縣": ["宜蘭市", "羅東鎮", "蘇澳鎮", "頭城鎮", "礁溪鄉", "冬山鄉", "五結鄉", "三星鄉"],
  "花蓮縣": ["花蓮市", "鳳林鎮", "玉里鎮", "新城鄉", "吉安鄉", "壽豐鄉", "光復鄉", "瑞穗鄉"],
  "台東縣": ["台東市", "成功鎮", "關山鎮", "卑南鄉", "太麻里鄉", "鹿野鄉", "池上鄉", "綠島鄉", "蘭嶼鄉"],
  "澎湖縣": ["馬公市", "湖西鄉", "白沙鄉", "西嶼鄉"],
  "金門縣": ["金城鎮", "金湖鎮", "金沙鎮", "金寧鄉"],
  "連江縣": ["南竿鄉", "北竿鄉", "莒光鄉", "東引鄉"]
};

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [memberAvatar, setMemberAvatar] = useState<string | null>(null);
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarOffset, setAvatarOffset] = useState(0);
  const [memberGender, setMemberGender] = useState("男");
  const [maleDefault, setMaleDefault] = useState("https://i.ibb.co/6R2M5X1/churun-baby.png");
  const [femaleDefault, setFemaleDefault] = useState("https://i.ibb.co/6R2M5X1/churun-baby.png");
  const [memberMotto, setMemberMotto] = useState("以初心、致潤澤");
  const [memberBirthday, setMemberBirthday] = useState("");
  const [memberCity, setMemberCity] = useState("台北市");
  const [memberDistrict, setMemberDistrict] = useState("中正區");
  const [memberAddress, setMemberAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const currentUserIdRef = useRef<string | null>(null);

  // Toast notifications state
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string, type: ToastType = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
  };

  useEffect(() => {
    const savedId = null /* removed */;
    if (!savedId) { router.replace("/login"); return; }
    currentUserIdRef.current = savedId;
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
    if (data?.avatar_url) setMemberAvatar(data.avatar_url);
    if (data?.avatar_settings) {
      setAvatarZoom(data.avatar_settings.zoom || 1);
      setAvatarOffset(data.avatar_settings.offset || 0);
      setMemberGender(data.avatar_settings.gender || "男");
    }
    if (data?.motto) setMemberMotto(data.motto);
    if (data?.birthday) setMemberBirthday(data.birthday);
    if (data?.city) setMemberCity(data.city);
    if (data?.district) setMemberDistrict(data.district);
    if (data?.address) setMemberAddress(data.address);
    setIsLoading(false);
  };

  const compressImage = (base64Str: string): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > 800) { h = (800 / w) * h; w = 800; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
    });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const compressed = await compressImage(ev.target?.result as string);
      setMemberAvatar(compressed);
      setAvatarZoom(1.2);
      setAvatarOffset(0);
      triggerToast("📸 相片載入成功！請使用下方滑桿微調對齊。");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const userId = currentUserIdRef.current;
    if (!userId) return;
    setIsSaving(true);
    try {
      const isNewUpload = memberAvatar?.startsWith("data:image");
      const res = await fetch("/api/member/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: userId,
          avatarBase64: isNewUpload ? memberAvatar : null,
          avatarSettings: { zoom: avatarZoom, offset: avatarOffset, gender: memberGender },
          motto: memberMotto,
          birthday: memberBirthday,
          city: memberCity,
          district: memberDistrict,
          address: memberAddress,
        }),
      });
      const result = await res.json();
      if (result.success) {
        if (result.avatarUrl) setMemberAvatar(result.avatarUrl);
        setMemberInfo((prev: any) => ({
          ...prev,
          avatar_url: result.avatarUrl || prev.avatar_url,
          avatar_settings: { zoom: avatarZoom, offset: avatarOffset, gender: memberGender },
          motto: memberMotto,
          birthday: memberBirthday,
          city: memberCity,
          district: memberDistrict,
          address: memberAddress,
        }));
        setSaved(true);
        triggerToast("🎉 個人精緻設定已成功儲存！");
        setTimeout(() => setSaved(false), 2500);
      } else {
        triggerToast("❌ 儲存失敗: " + (result.error || "原因不明"), "error");
      }
    } catch (err: any) {
      triggerToast("⚠️ 系統異常: " + err.message, "error");
    } finally {
      setIsSaving(false);
    }
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
        <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50 active:scale-90 transition">
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </button>
        <h1 className="text-xs font-black tracking-[0.3em] text-slate-800 uppercase">個人資料設定</h1>
        <div className="w-10"></div>
      </nav>

      <main className="max-w-lg mx-auto px-6 pt-32 space-y-6">
        {/* Avatar Preview */}
        <div className="bg-white rounded-[3rem] p-8 border border-slate-50 shadow-sm space-y-6">
          <div className="flex justify-between items-center px-2">
            <div>
              <h2 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">頭像設定</h2>
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Avatar & Photo</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100">
              <Camera className="w-4 h-4" />
            </div>
          </div>

          {/* Avatar Display with Spring Motion */}
          <div className="flex flex-col items-center gap-5 bg-slate-50 rounded-[2rem] p-6">
            <div className="rounded-[2rem] overflow-hidden border-4 border-white shadow-xl bg-slate-100 relative" style={{ width: '112px', height: '112px', minWidth: '112px', minHeight: '112px' }}>
              {(() => {
                const avatarSrc = (memberAvatar && memberAvatar !== "https://i.ibb.co/6R2M5X1/churun-baby.png") ? memberAvatar : (memberGender === "女" ? femaleDefault : maleDefault);
                const isVid = isVideoUrl(avatarSrc);
                if (isVid) {
                  return (
                    <motion.video
                      src={avatarSrc}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                      style={{ objectFit: 'cover' }}
                      animate={{ 
                        scale: avatarZoom, 
                        y: avatarOffset 
                      }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 120, 
                        damping: 18 
                      }}
                    />
                  );
                }
                return (
                  <motion.img 
                    src={avatarSrc} 
                    className="w-full h-full object-cover" 
                    animate={{ 
                      scale: avatarZoom, 
                      y: avatarOffset 
                    }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 120, 
                      damping: 18 
                    }}
                    alt="Avatar" 
                  />
                );
              })()}
            </div>
            <label className="bg-emerald-900 text-white px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] cursor-pointer active:scale-95 transition shadow-lg shadow-emerald-900/20 hover:bg-emerald-800">
              更換照片
              <input type="file" className="hidden" accept="image/*,video/*" onChange={handleAvatarUpload} />
            </label>
          </div>

          {/* Zoom & Offset with Premium Sliders */}
          <div className="space-y-6 px-1">
            <div className="space-y-2">
              <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                <span>縮放比例</span>
                <span className="text-emerald-700 font-extrabold">{Math.round(avatarZoom * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="3" 
                step="0.01" 
                value={avatarZoom}
                onChange={e => setAvatarZoom(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-900 outline-none" 
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                <span>垂直偏移</span>
                <span className="text-emerald-700 font-extrabold">{avatarOffset}px</span>
              </div>
              <input 
                type="range" 
                min="-100" 
                max="100" 
                step="1" 
                value={avatarOffset}
                onChange={e => setAvatarOffset(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-900 outline-none" 
              />
            </div>
          </div>
        </div>

        {/* Gender Settings */}
        <div className="bg-white rounded-[3rem] p-8 border border-slate-50 shadow-sm space-y-4">
          <div className="flex justify-between items-center px-2 mb-2">
            <div>
              <h2 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">您的性別</h2>
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Gender</p>
            </div>
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100">
               <User className="w-4 h-4" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <button 
                type="button"
                onClick={() => setMemberGender("男")}
                className={`py-5 rounded-2xl font-black text-xs tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 border ${memberGender === "男" ? 'bg-emerald-900 text-white border-emerald-900 shadow-lg shadow-emerald-900/10 scale-[1.02]' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100/50'}`}
             >
                男 (Male)
             </button>
             <button 
                type="button"
                onClick={() => setMemberGender("女")}
                className={`py-5 rounded-2xl font-black text-xs tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 border ${memberGender === "女" ? 'bg-emerald-900 text-white border-emerald-900 shadow-lg shadow-emerald-900/10 scale-[1.02]' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100/50'}`}
             >
                女 (Female)
             </button>
          </div>
        </div>

        {/* Motto */}
        <div className="bg-white rounded-[3rem] p-8 border border-slate-50 shadow-sm space-y-4">
          <div className="flex justify-between items-center px-2 mb-2">
            <div>
              <h2 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">個人座右銘</h2>
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Personal Motto</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <input
            type="text"
            value={memberMotto}
            onChange={e => setMemberMotto(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-900/15 focus:bg-white transition-all duration-300"
            placeholder="輸入座右銘..."
            maxLength={40}
          />
          <p className="text-[8px] text-slate-300 font-bold text-right tracking-widest">{memberMotto.length}/40</p>
        </div>

        {/* Birthday */}
        <div className="bg-white rounded-[3rem] p-8 border border-slate-50 shadow-sm space-y-4">
          <div className="flex justify-between items-center px-2 mb-2">
            <div>
              <h2 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">個人生日設定</h2>
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Birthday</p>
            </div>
            <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center border border-rose-100">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <input
            type="date"
            value={memberBirthday}
            onChange={e => setMemberBirthday(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-900/15 focus:bg-white transition-all duration-300"
          />
        </div>

        {/* Address */}
        <div className="bg-white rounded-[3rem] p-8 border border-slate-50 shadow-sm space-y-4">
          <div className="flex justify-between items-center px-2 mb-2">
            <div>
              <h2 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">會員通訊地址</h2>
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Mailing Address</p>
            </div>
            <div className="w-10 h-10 bg-[#EEF2FF] text-[#4F46E5] rounded-2xl flex items-center justify-center border border-[#E0E7FF]">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select
              value={memberCity}
              onChange={(e) => {
                setMemberCity(e.target.value);
                setMemberDistrict(TAIWAN_CITIES[e.target.value]?.[0] || "");
              }}
              className="w-full bg-slate-50 border border-slate-100 px-4 py-4 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-900/15 focus:bg-white transition-all duration-300"
            >
              {Object.keys(TAIWAN_CITIES).map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <select
              value={memberDistrict}
              onChange={(e) => setMemberDistrict(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 px-4 py-4 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-900/15 focus:bg-white transition-all duration-300"
            >
              {(TAIWAN_CITIES[memberCity] || []).map(dist => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={memberAddress}
            onChange={e => setMemberAddress(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-900/15 focus:bg-white transition-all duration-300"
            placeholder="請輸入詳細街道與門牌號碼..."
          />
        </div>

        {/* Save Button with Spring Damped Loading Transition */}
        <motion.button
          onClick={handleSave}
          disabled={isSaving}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-emerald-900 text-white py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/20 disabled:opacity-50 flex items-center justify-center gap-3 overflow-hidden relative min-h-[64px]"
        >
          <AnimatePresence mode="wait">
            {isSaving ? (
              <motion.div
                key="saving"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="flex items-center gap-3"
              >
                <Loader2 className="w-4 h-4 animate-spin text-white/80" />
                <span>正在儲存精品設定...</span>
              </motion.div>
            ) : saved ? (
              <motion.div
                key="saved"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="flex items-center gap-3 text-amber-300"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>設定已成功儲存 ✓</span>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="flex items-center gap-3"
              >
                <span>儲存個人設定</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

      </main>

      {/* Luxury Toast Container */}
      <Toast 
        message={toastMsg}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

    </div>
  );
}
