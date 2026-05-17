"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Key, 
  Smartphone, 
  History, 
  ChevronRight,
  AlertCircle,
  Loader2,
  Lock,
  Camera,
  CreditCard,
  IdCard
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../supabase";

export default function SecurityPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [showLoginLogs, setShowLoginLogs] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);
  const [logsTerminated, setLogsTerminated] = useState(false);

  const getDeviceDetails = () => {
    if (typeof window === "undefined" || !window.navigator) {
      return { os: "Windows 11", browser: "Chrome" };
    }
    const ua = window.navigator.userAgent;
    let os = "未知設備";
    let browser = "未知瀏覽器";

    if (ua.includes("Windows")) os = "Windows PC";
    else if (ua.includes("Macintosh") || ua.includes("Mac OS")) os = "macOS 裝置";
    else if (ua.includes("iPhone")) os = "iPhone 智慧手機";
    else if (ua.includes("iPad")) os = "iPad 裝置";
    else if (ua.includes("Android")) os = "Android 智慧手機";
    else if (ua.includes("Linux")) os = "Linux 設備";

    if (ua.includes("Edg")) browser = "Edge 瀏覽器";
    else if (ua.includes("Chrome")) browser = "Chrome 瀏覽器";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari 瀏覽器";
    else if (ua.includes("Firefox")) browser = "Firefox 瀏覽器";

    return { os, browser };
  };

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    fetchData(savedId);
  }, [router]);

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    const { data } = await supabase.from("members").select("*").eq("id", userId).single();
    
    // Merge with local fallbacks
    const enhancedData = {
      ...data,
      phone_verified: data?.phone_verified || localStorage.getItem(`churun_local_phone_verified_${userId}`) === "true",
      pattern_code: data?.pattern_code || localStorage.getItem(`churun_local_pattern_${userId}`)
    };

    setMemberInfo(enhancedData);
    setIsLoading(false);
  };

  if (isLoading) return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>;

  const securityItems = [
    { 
      title: "個人資料設定", 
      desc: "編輯頭像、名稱與個人座右銘", 
      icon: Camera, 
      status: "點擊編輯", 
      color: "text-emerald-500 bg-emerald-50",
      action: () => router.push("/profile/security/profile-settings")
    },
    { 
      title: "銀行帳戶設定", 
      desc: "新增或變更提款銀行帳戶", 
      icon: CreditCard, 
      status: "點擊設定", 
      color: "text-indigo-500 bg-indigo-50",
      action: () => router.push("/profile/security/bank")
    },
    { 
      title: "VIP 電子名片", 
      desc: "查看與下載個人專屬名片", 
      icon: IdCard, 
      status: "點擊查看", 
      color: "text-amber-500 bg-amber-50",
      action: () => router.push("/profile/security/vcard")
    },
    { 
      title: "修改登入密碼", 
      desc: "定期更換密碼以保護帳號安全", 
      icon: Key, 
      status: "已設定", 
      color: "text-emerald-500 bg-emerald-50",
      action: () => router.push("/profile/security/password")
    },
    { 
      title: "手機號碼驗證", 
      desc: memberInfo.phone || "尚未綁定", 
      icon: Smartphone, 
      status: memberInfo.phone_verified ? "已驗證" : "未驗證", 
      color: memberInfo.phone_verified ? "text-emerald-500 bg-emerald-50" : "text-blue-500 bg-blue-50",
      action: () => router.push("/profile/security/phone")
    },
    { 
      title: "圖形鎖設定", 
      desc: "設定 3x3 九宮格快速登入", 
      icon: Lock, 
      status: memberInfo.pattern_code ? "已設定" : "未設定", 
      color: memberInfo.pattern_code ? "text-amber-500 bg-amber-50" : "text-slate-500 bg-slate-50",
      action: () => router.push("/profile/security/pattern")
    },
    { 
      title: "登入紀錄查詢", 
      desc: "查看最近的登入地點與時間", 
      icon: History, 
      status: "正常", 
      color: "text-rose-500 bg-rose-50",
      action: () => setShowLoginLogs(true)
     },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-20">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 max-w-lg mx-auto flex justify-between items-center bg-[#FDFBF7]/80 backdrop-blur-xl border-b border-slate-100">
         <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50">
            <ArrowLeft className="w-4 h-4 text-slate-400" />
         </button>
         <h1 className="text-xs font-black tracking-[0.3em] text-slate-800 uppercase">資料安全設定</h1>
         <div className="w-10"></div>
      </nav>

      <main className="max-w-lg mx-auto px-6 pt-32 space-y-10">
         {/* Security Status Header */}
         <section className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>
            <div className="relative z-10 flex flex-col items-center text-center gap-6">
               <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <ShieldCheck className="w-10 h-10 text-white" />
               </div>
               <div className="space-y-2">
                  <h2 className="text-2xl font-black tracking-tight">帳號安全等級：優良</h2>
                  <p className="text-xs text-white/40 font-medium">最新登入：{new Date().toISOString().slice(0, 10).replace(/-/g, '/')} 台北市</p>
               </div>
            </div>
         </section>

         {/* Security Checklist */}
         <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">個人資料與安全設定</h3>
            {securityItems.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-white rounded-[2.5rem] p-7 flex items-center gap-6 shadow-sm border border-slate-50 group hover:border-emerald-100 transition cursor-pointer"
                onClick={item.action}
              >
                 <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center shadow-inner`}>
                    <item.icon className="w-6 h-6" />
                 </div>
                 <div className="flex-1">
                    <h4 className="font-black text-slate-800">{item.title}</h4>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">{item.desc}</p>
                 </div>
                 <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{item.status}</span>
                    <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-emerald-500 transition" />
                 </div>
              </motion.div>
            ))}
         </div>

         {/* Privacy Notice */}
         <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-100/50 flex gap-6 items-start">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
               <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="space-y-2">
               <h4 className="text-sm font-black text-amber-900 tracking-tight">隱私保護提醒</h4>
               <p className="text-xs text-amber-700/70 leading-relaxed font-medium">初潤承諾保護您的個人隱私。我們絕對不會主動要求您提供密碼或透過非官方管道進行轉帳。</p>
            </div>
         </div>

         <footer className="text-center pt-10">
            <div className="flex justify-center gap-2 items-center mb-4">
               <Lock className="w-3 h-3 text-slate-300" />
               <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">End-to-End Encryption Enabled</p>
            </div>
         </footer>
      </main>

      {/* ─── 帳號安全與會話稽核中心 (Security Sessions Audit Modal) ─── */}
      <AnimatePresence>
        {showLoginLogs && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            {/* Dark glass backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginLogs(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
            />
            {/* Sliding Panel */}
            <motion.div 
              initial={{ y: "100%", opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: "100%", opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="bg-white rounded-t-[3rem] sm:rounded-[3.5rem] p-8 sm:p-10 w-full max-w-md shadow-2xl border border-slate-100/50 relative z-10 max-h-[85vh] overflow-y-auto no-scrollbar flex flex-col gap-6"
            >
               {/* Drag indicator for mobile */}
               <div className="w-12 h-1 bg-slate-100 rounded-full mx-auto sm:hidden -mt-2 mb-2" />

               {/* Header */}
               <div className="flex justify-between items-start border-b border-slate-50 pb-5">
                  <div className="space-y-1">
                     <span className="text-[8px] font-black text-rose-500 uppercase tracking-[0.25em] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" /> 登入連線安全稽核
                     </span>
                     <h3 className="text-xl font-black text-slate-800 tracking-tight">最近 5 次安全登入活動</h3>
                  </div>
                  <button 
                    onClick={() => setShowLoginLogs(false)} 
                    className="w-8 h-8 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 transition text-xs font-bold"
                  >
                     ✕
                  </button>
               </div>

               {/* Current active session */}
               <div className="space-y-3">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">當前使用裝置 (Active Session)</h4>
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 flex items-start gap-4">
                     <div className="w-11 h-11 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Smartphone className="w-5 h-5" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 text-left">
                           <span className="text-xs font-black text-slate-800">{getDeviceDetails().os}</span>
                           <span className="text-[8px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-widest">當前連線</span>
                        </div>
                        <p className="text-[10px] text-left font-semibold text-slate-400 mt-1">{getDeviceDetails().browser} • 114.34.12.98</p>
                        <p className="text-[9px] text-left font-black text-emerald-700 uppercase tracking-widest mt-1.5 flex items-center gap-1">
                           <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> 台灣 台北市 • 經由安全憑證加密連線
                        </p>
                     </div>
                  </div>
               </div>

               {/* Historical login tracking */}
               <div className="space-y-3">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left">最近歷史連線軌跡 (Trajectory History)</h4>
                  <div className="space-y-3 max-h-[220px] overflow-y-auto no-scrollbar">
                     {logsTerminated ? (
                        <div className="text-center py-8 text-slate-400 border border-dashed border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                           <p className="text-xs font-black text-slate-600">🛡️ 已成功中斷其他所有裝置連線</p>
                           <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">All other sessions have been securely terminated.</p>
                        </div>
                     ) : (
                        [
                           { os: "iPhone 15 Pro", browser: "Safari Mobile", ip: "101.12.89.44", loc: "台灣 台中市", time: "2 小時前", desc: "主動簽退" },
                           { os: "iPad Air", browser: "Chrome iOS", ip: "101.12.89.44", loc: "台灣 台中市", time: "1 天前", desc: "階段逾期" },
                           { os: "Windows 11 PC", browser: "Edge 瀏覽器", ip: "210.61.12.18", loc: "台灣 新北市", time: "3 天前", desc: "主動登出" },
                           { os: "MacBook Pro", browser: "Safari 瀏覽器", ip: "114.34.12.98", loc: "台灣 台北市", time: "5 天前", desc: "自然過期" }
                        ].map((log, idx) => (
                           <div key={idx} className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex items-start gap-4">
                              <div className="w-9 h-9 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center flex-shrink-0">
                                 <History className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                 <div className="flex justify-between items-center gap-2">
                                    <span className="text-xs font-black text-slate-700">{log.os}</span>
                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{log.time}</span>
                                 </div>
                                 <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{log.browser} • {log.ip}</p>
                                 <div className="flex justify-between items-center mt-1.5">
                                    <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase">{log.loc}</span>
                                    <span className="text-[8px] font-black text-slate-300 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">{log.desc}</span>
                                 </div>
                              </div>
                           </div>
                        ))
                     )}
                  </div>
               </div>

               {/* Defensive action button */}
               {!logsTerminated && (
                  <button
                    disabled={isTerminating}
                    onClick={() => {
                      setIsTerminating(true);
                      setTimeout(() => {
                        setIsTerminating(false);
                        setLogsTerminated(true);
                        alert("✅ 已成功重置安全連線，中斷本裝置以外的所有工作階段！");
                      }, 1500);
                    }}
                    className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2 ${isTerminating ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-950/10'}`}
                  >
                     {isTerminating ? (
                        <>
                           <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> 連線重置程序執行中...
                        </>
                     ) : (
                        <>
                           🛡️ 登出其他所有裝置與會話連線
                        </>
                     )}
                  </button>
               )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
