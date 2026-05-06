"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../supabase";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import {
  ArrowLeft,
  Camera,
  User,
  Download,
  IdCard,
  Loader2,
  X,
  CheckCircle2,
  Sparkles,
  MapPin
} from "lucide-react";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [memberAvatar, setMemberAvatar] = useState<string | null>(null);
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarOffset, setAvatarOffset] = useState(0);
  const [memberMotto, setMemberMotto] = useState("以初心、致潤澤");
  const [memberAddress, setMemberAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
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
    if (data?.avatar_url) setMemberAvatar(data.avatar_url);
    if (data?.avatar_settings) {
      setAvatarZoom(data.avatar_settings.zoom || 1);
      setAvatarOffset(data.avatar_settings.offset || 0);
    }
    if (data?.motto) setMemberMotto(data.motto);
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
          avatarSettings: { zoom: avatarZoom, offset: avatarOffset },
          motto: memberMotto,
          address: memberAddress,
        }),
      });
      const result = await res.json();
      if (result.success) {
        if (result.avatarUrl) setMemberAvatar(result.avatarUrl);
        setMemberInfo((prev: any) => ({
          ...prev,
          avatar_url: result.avatarUrl || prev.avatar_url,
          avatar_settings: { zoom: avatarZoom, offset: avatarOffset },
          motto: memberMotto,
          address: memberAddress,
        }));
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        alert("儲存失敗: " + (result.error || "原因不明"));
      }
    } catch (err: any) {
      alert("系統異常: " + err.message);
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
        <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50">
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

          {/* Avatar Display */}
          <div className="flex flex-col items-center gap-5 bg-slate-50 rounded-[2rem] p-6">
            {memberAvatar ? (
              <div className="w-28 h-28 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl">
                <img src={memberAvatar} className="w-full h-full object-cover" style={{ transform: `scale(${avatarZoom}) translateY(${avatarOffset}px)` }} alt="Avatar" />
              </div>
            ) : (
              <div className="w-28 h-28 bg-white rounded-[2rem] overflow-hidden border-4 border-white shadow-xl">
                <img src="https://i.ibb.co/6R2M5X1/churun-baby.png" className="w-full h-full object-cover" alt="Default" />
              </div>
            )}
            <label className="bg-emerald-900 text-white px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest cursor-pointer active:scale-95 transition shadow-lg shadow-emerald-900/20">
              更換照片
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            </label>
          </div>

          {/* Zoom & Offset */}
          {memberAvatar && (
            <div className="space-y-4 px-1">
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  <span>縮放比例</span><span>{Math.round(avatarZoom * 100)}%</span>
                </div>
                <input type="range" min="1" max="3" step="0.01" value={avatarZoom}
                  onChange={e => setAvatarZoom(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  <span>垂直偏移</span><span>{avatarOffset}px</span>
                </div>
                <input type="range" min="-100" max="100" step="1" value={avatarOffset}
                  onChange={e => setAvatarOffset(parseInt(e.target.value))}
                  className="w-full accent-emerald-600" />
              </div>
            </div>
          )}
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
            className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-900/10"
            placeholder="輸入座右銘..."
            maxLength={40}
          />
          <p className="text-[8px] text-slate-300 font-bold text-right tracking-widest">{memberMotto.length}/40</p>
        </div>

        {/* Address */}
        <div className="bg-white rounded-[3rem] p-8 border border-slate-50 shadow-sm space-y-4">
          <div className="flex justify-between items-center px-2 mb-2">
            <div>
              <h2 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">會員通訊地址</h2>
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Mailing Address</p>
            </div>
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <input
            type="text"
            value={memberAddress}
            onChange={e => setMemberAddress(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-900/10"
            placeholder="請輸入常用收件/通訊地址..."
          />
        </div>

        {/* Save Button */}
        <motion.button
          onClick={handleSave}
          disabled={isSaving}
          whileTap={{ scale: 0.97 }}
          className="w-full bg-emerald-900 text-white py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-900/20 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <CheckCircle2 className="w-5 h-5" /> : null}
          {isSaving ? "儲存中..." : saved ? "已成功儲存！" : "儲存個人設定"}
        </motion.button>

      </main>

    </div>
  );
}
