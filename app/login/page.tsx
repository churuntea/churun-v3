"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Phone, 
  ChevronRight, 
  ArrowRight, 
  Loader2, 
  Sparkles,
  ShieldCheck,
  Zap,
  Eye,
  EyeOff,
  Lock
} from "lucide-react";
import Link from "next/link";
import PatternLock from "@/components/PatternLock";

function LoginContent() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberPhone, setRememberPhone] = useState(false);
  const [loginMode, setLoginMode] = useState<'password' | 'pattern'>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // LINE OAuth States
  const [lineUser, setLineUser] = useState<{ userId: string; displayName: string; pictureUrl: string } | null>(null);
  const [linePhone, setLinePhone] = useState("");
  const [lineReferral, setLineReferral] = useState("");
  const [lineRegistering, setLineRegistering] = useState(false);

  const handleLineLogin = () => {
    setIsLoading(true);
    const clientId = "2010007687";
    const redirectUri = encodeURIComponent(`${window.location.origin}/login`);
    const state = "churun_line_login";
    const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=profile%20openid`;
    window.location.href = lineAuthUrl;
  };

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (code && state === "churun_line_login") {
      const handleCallback = async () => {
        setIsLoading(true);
        try {
          const res = await fetch("/api/auth/line", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code,
              redirectUri: `${window.location.origin}/login`
            })
          });

          const data = await res.json();
          if (!data.success) {
            alert(data.error || "LINE 登入驗證失敗");
            setIsLoading(false);
            router.replace("/login");
            return;
          }

          if (data.status === "success") {
            // 已有綁定過 ➔ 登入成功，儲存資訊並跳轉
            localStorage.setItem("churun_member_id", data.memberId);
            localStorage.setItem("churun_member_name", data.memberName);
            
            // 更新最後登入時間
            try {
              await supabase.from("members").update({ last_login: new Date().toISOString() }).eq("id", data.memberId);
            } catch (err) {
              console.warn("更新最後登入時間失敗", err);
            }
            
            router.push("/profile");
          } else if (data.status === "new_user") {
            // 未綁定過 ➔ 開啟手機號碼與推薦人資料輸入框
            setLineUser({
              userId: data.lineUserId,
              displayName: data.displayName,
              pictureUrl: data.pictureUrl
            });
            setIsLoading(false);
          }
        } catch (err) {
          console.error("LINE callback handle error:", err);
          alert("系統連線異常，請重新登入");
          setIsLoading(false);
          router.replace("/login");
        }
      };

      handleCallback();
    }
  }, [searchParams, router]);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoading(true);
        try {
          const user = session.user;
          const email = user.email;
          const providerId = user.id;

          // 尋找是否有對應的會員 (透過 email 或 google_id)
          const { data: member, error } = await supabase
            .from("members")
            .select("id, name")
            .or(`email.eq."${email}",google_id.eq."${providerId}"`)
            .maybeSingle();

          if (member) {
            // 登入成功，儲存資訊並跳轉
            localStorage.setItem("churun_member_id", member.id);
            localStorage.setItem("churun_member_name", member.name);
            
            // 更新最後登入時間
            try {
              await supabase.from("members").update({ last_login: new Date().toISOString() }).eq("id", member.id);
            } catch (err) {
              console.warn("更新最後登入時間失敗", err);
            }
            
            router.push("/profile");
          } else {
            // 找不到會員，開啟手機號碼補填 (複用 LINE 的註冊表單)
            setLineUser({
              userId: "google_" + providerId,
              displayName: user.user_metadata?.full_name || "Google 用戶",
              pictureUrl: user.user_metadata?.avatar_url || "https://i.ibb.co/6R2M5X1/churun-baby.png"
            });
            setIsLoading(false);
          }
        } catch (err) {
          console.error("Google login handling error:", err);
          setIsLoading(false);
        }
      }
    };
    handleGoogleCallback();
  }, [router]);

  const handleLineRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linePhone || linePhone.trim().length < 8) {
      alert("請輸入有效的行動電話號碼");
      return;
    }

    setLineRegistering(true);
    
    const isGoogle = lineUser?.userId?.startsWith("google_");
    
    try {
      if (isGoogle) {
        // Google 新會員註冊
        const googleId = lineUser?.userId?.replace("google_", "");
        
        // 檢查手機號碼是否已被使用
        const { data: existingMember } = await supabase
          .from("members")
          .select("id, name")
          .eq("phone", linePhone.trim())
          .maybeSingle();
          
        if (existingMember) {
          // 手機號碼已存在，進行綁定
          const { error: updateError } = await supabase
            .from("members")
            .update({ google_id: googleId })
            .eq("id", existingMember.id);
            
          if (updateError) throw updateError;
          
          localStorage.setItem("churun_member_id", existingMember.id);
          localStorage.setItem("churun_member_name", existingMember.name || "會員");
          alert("🎉 帳戶綁定成功！歡迎回來！");
          router.push("/profile");
        } else {
          // 手機號碼不存在，建立新會員
          const { data: newMember, error: insertError } = await supabase
            .from("members")
            .insert({
              name: lineUser?.displayName,
              phone: linePhone.trim(),
              google_id: googleId,
              avatar_url: lineUser?.pictureUrl,
              referral_code: lineReferral.trim() || null,
              status: "active",
              role: "member",
              created_at: new Date().toISOString()
            })
            .select("id, name")
            .single();
            
          if (insertError) throw insertError;
          
          localStorage.setItem("churun_member_id", newMember.id);
          localStorage.setItem("churun_member_name", newMember.name);
          alert("🎉 恭喜您註冊成功！");
          router.push("/profile");
        }
      } else {
        // LINE 新會員註冊 (原本的邏輯)
        const res = await fetch("/api/auth/line/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lineUserId: lineUser?.userId,
            displayName: lineUser?.displayName,
            pictureUrl: lineUser?.pictureUrl,
            phone: linePhone.trim(),
            referralCode: lineReferral.trim()
          })
        });

        const data = await res.json();
        if (!data.success) {
          alert(data.error || "註冊綁定失敗，請確認資料後再試。");
          setLineRegistering(false);
          return;
        }

        // 儲存登入態
        localStorage.setItem("churun_member_id", data.memberId);
        localStorage.setItem("churun_member_name", data.memberName);
        
        // 更新最後登入時間
        try {
          await supabase.from("members").update({ last_login: new Date().toISOString() }).eq("id", data.memberId);
        } catch (err) {
          console.warn("更新最後登入時間失敗", err);
        }
        
        if (data.status === 'linked') {
          alert(`🎉 帳戶綁定成功！歡迎回來，${data.memberName}！`);
        } else {
          alert(`🎉 恭喜您註冊成功！迎新好禮折價券已存入您的券包，開始下單吧！`);
        }
        router.push("/profile");
      }
    } catch (err) {
      console.error("Register error:", err);
      alert("系統連線異常，請重新再試。");
    } finally {
      setLineRegistering(false);
    }
  };

  useEffect(() => {
    const savedPhone = localStorage.getItem("churun_remembered_phone") || localStorage.getItem("churun_last_phone");
    if (savedPhone) {
      setIdentifier(savedPhone);
      if (localStorage.getItem("churun_remembered_phone")) {
        setRememberPhone(true);
      }
    }
  }, []);

  const handleLogin = async (e?: React.FormEvent, patternCode?: string) => {
    if (e) e.preventDefault();
    
    let effectivePhone = identifier;
    if (!effectivePhone && patternCode) {
      effectivePhone = localStorage.getItem("churun_last_phone") || "";
    }

    if (!effectivePhone) {
      alert("請先輸入手機號碼 或 會員帳號");
      return;
    }
    
    setIsLoading(true);
    setError(null);

    // Try selecting with pattern_code first
    let { data, error: fetchError }: { data: any, error: any } = await supabase
      .from("members")
      .select("id, name, password, pattern_code, status")
      .or(`phone.eq.${effectivePhone},member_code.eq.${effectivePhone}`)
      .single();

    // Fallback if column missing
    if (fetchError && (fetchError.message.includes("pattern_code") || fetchError.message.includes("SCHEMA CACHE"))) {
      console.warn("pattern_code column missing, falling back to basic select");
      const fallback = await supabase
        .from("members")
        .select("id, name, password, status")
        .or(`phone.eq.${effectivePhone},member_code.eq.${effectivePhone}`)
        .single();
      data = fallback.data;
      fetchError = fallback.error;
    }

    if (fetchError || !data) {
      alert("查無此會員，請確認手機號碼 或 會員帳號是否正確");
      setIsLoading(false);
      return;
    }

    // Check account status for B2B pending reviews
    if (data.status && data.status !== 'active') {
      if (data.status === 'pending_accounting') {
        alert("⏳ 您的 B2B 創業申請正由「總部會計核對匯款金額」，審核通過前暫時無法登入。");
      } else if (data.status === 'pending_manager') {
        alert("⏳ 您的 B2B 創業申請「已通過會計核對」，目前正送交「業務主管進行最終審查」，審核通過後即可登入系統！");
      } else {
        alert(`⚠️ 您的帳號狀態目前為「${data.status}」，暫時無法登入。`);
      }
      setIsLoading(false);
      return;
    }

    if (loginMode === 'password') {
      if (data.password !== password) {
        alert("密碼錯誤，請重新輸入");
        setIsLoading(false);
        return;
      }
    } else {
      // Check for pattern in DB first, then fallback to local
      const effectivePattern = data.pattern_code || localStorage.getItem(`churun_local_pattern_${data.id}`);

      if (!effectivePattern) {
        alert("您尚未設定圖形鎖，請先使用密碼登入並前往安全中心設定");
        setLoginMode('password');
        setIsLoading(false);
        return;
      }
      if (effectivePattern !== patternCode) {
        setError("圖形解鎖失敗");
        setIsLoading(false);
        return;
      }
    }

    localStorage.setItem("churun_member_id", data.id);
    localStorage.setItem("churun_member_name", data.name);
    localStorage.setItem("churun_last_phone", effectivePhone);
    
    // 更新最後登入時間
    try {
      await supabase.from("members").update({ last_login: new Date().toISOString() }).eq("id", data.id);
    } catch (err) {
      console.warn("更新最後登入時間失敗", err);
    }
    
    if (rememberPhone) {
      localStorage.setItem("churun_remembered_phone", effectivePhone);
    } else {
      localStorage.removeItem("churun_remembered_phone");
    }

    router.push("/");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none">
         <motion.div 
           animate={{ 
             scale: [1, 1.2, 1],
             rotate: [0, 90, 0],
           }}
           transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
           className="absolute -top-1/4 -left-1/4 w-full h-full bg-emerald-200/60 rounded-full blur-[120px]"
         />
         <motion.div 
           animate={{ 
             scale: [1, 1.3, 1],
             rotate: [0, -90, 0],
           }}
           transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
           className="absolute -bottom-1/4 -right-1/4 w-full h-full bg-amber-200/40 rounded-full blur-[120px]"
         />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel rounded-[4rem] p-12">
           
            {lineUser ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-10"
              >
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <img 
                      src={lineUser.pictureUrl} 
                      alt={lineUser.displayName} 
                      className="w-24 h-24 rounded-full border-4 border-[#06C755] shadow-xl mx-auto"
                    />
                    <span className="absolute bottom-0 right-1 bg-[#06C755] text-white p-1.5 rounded-full shadow-lg">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                         <path d="M24 10.3c0-5.7-5.4-10.3-12-10.3S0 4.6 0 10.3c0 5.1 4.3 9.3 10 10.1.4.1.9.4.9.9 0 .6-.3 1.5-.4 2.2 0 .1-.1.3 0 .4.1.2.3.2.4.1 1.4-.9 6.4-3.8 8.7-5.5 2.8-2.3 4.4-4.8 4.4-7.9z"/>
                      </svg>
                    </span>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                    您好，{lineUser.displayName}
                  </h2>
                  <p className="text-[11px] font-bold text-slate-400 max-w-xs mx-auto leading-relaxed">
                    這是您首次使用 LINE 快速登入。請驗證您的手機號碼以完成安全帳戶連結，以便同步您的累積訂單與紅利點數！
                  </p>
                </div>

                <form onSubmit={handleLineRegisterSubmit} className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-6">行動電話號碼</label>
                    <div className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors">
                        <Phone className="w-5 h-5" />
                      </div>
                      <input 
                        type="tel" 
                        value={linePhone} 
                        onChange={(e) => setLinePhone(e.target.value)} 
                        placeholder="請輸入您的手機號碼" 
                        className="w-full bg-slate-50/50 border-2 border-transparent p-6 pl-16 rounded-[2rem] text-sm font-bold focus:outline-none focus:bg-white focus:border-emerald-900/5 transition-all shadow-inner"
                        required
                      />
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 ml-6 leading-relaxed">
                      💡 貼心提醒：若您曾註冊過初潤會員，系統將自動為您安全連結至原先帳戶，原有積分與餘額均不受影響。
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-6">推薦人代碼 (選填)</label>
                    <div className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <input 
                        type="text" 
                        value={lineReferral} 
                        onChange={(e) => setLineReferral(e.target.value)} 
                        placeholder="請輸入推薦人代碼" 
                        className="w-full bg-slate-50/50 border-2 border-transparent p-6 pl-16 rounded-[2rem] text-sm font-bold focus:outline-none focus:bg-white focus:border-emerald-900/5 transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={lineRegistering}
                      type="submit" 
                      className="w-full btn-premium p-6 rounded-[2rem] text-sm flex items-center justify-center gap-3 group disabled:opacity-50"
                    >
                       {lineRegistering ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                         <>
                           確認連結並登入系統 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                         </>
                       )}
                    </motion.button>

                    <button
                      type="button"
                      onClick={() => {
                        setLineUser(null);
                        router.replace("/login");
                      }}
                      className="w-full text-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:underline"
                    >
                      取消並返回一般登入
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <>
                 <div className="text-center mb-12">
                     <motion.div 
                       initial={{ scale: 0 }}
                       animate={{ scale: 1 }}
                       transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                       className="w-20 h-20 bg-gradient-to-r from-emerald-800 to-emerald-900 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-900/20"
                     >
                       <span className="text-white font-black text-2xl tracking-tighter">CR</span>
                    </motion.div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">歡迎回來</h1>
                    
                    <div className="flex bg-slate-100/50 p-1.5 rounded-[2rem] mb-10 border border-slate-100">
                     <button 
                       onClick={() => setLoginMode('password')}
                       className={`flex-1 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${loginMode === 'password' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-400'}`}
                     >
                        密碼登入
                     </button>
                     <button 
                       onClick={() => setLoginMode('pattern')}
                       className={`flex-1 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${loginMode === 'pattern' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-400'}`}
                     >
                        圖形鎖
                     </button>
                  </div>

                  <form onSubmit={(e) => handleLogin(e)} className="space-y-8">
                     {loginMode === 'password' && (
                       <motion.div 
                         initial={{ opacity: 0, y: -10 }}
                         animate={{ opacity: 1, y: 0 }}
                         className="space-y-8"
                       >
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-6">手機號碼 或 會員帳號</label>
                            <div className="relative group">
                               <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors">
                                  <Phone className="w-5 h-5" />
                               </div>
                               <input 
                                 type="text" 
                                 value={identifier} 
                                 onChange={(e) => setIdentifier(e.target.value)} 
                                 placeholder="請輸入手機號碼 或 會員帳號" 
                                 className="w-full bg-slate-50/50 border-2 border-transparent p-6 pl-16 rounded-[2rem] text-sm font-bold focus:outline-none focus:bg-white focus:border-emerald-900/5 transition-all shadow-inner"
                                 required
                               />
                            </div>
                            <div className="flex items-center gap-2 ml-6 mt-2">
                               <input 
                                 type="checkbox" 
                                 id="rememberPhone"
                                 checked={rememberPhone}
                                 onChange={(e) => setRememberPhone(e.target.checked)}
                                 className="w-4 h-4 rounded border-slate-200 text-emerald-900 focus:ring-emerald-900/10 cursor-pointer"
                               />
                               <label htmlFor="rememberPhone" className="text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer select-none">記住我的登入資訊</label>
                            </div>
                         </div>
                       </motion.div>
                     )}

                     {loginMode === 'password' ? (
                       <motion.div 
                         key="password-field"
                         initial={{ opacity: 0, x: 20 }}
                         animate={{ opacity: 1, x: 0 }}
                         className="space-y-8"
                       >
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-6">登入密碼</label>
                            <div className="relative group">
                               <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors">
                                  <Lock className="w-5 h-5" />
                               </div>
                               <input 
                                 type={showPassword ? "text" : "password"}
                                 value={password} 
                                 onChange={(e) => setPassword(e.target.value)} 
                                 placeholder="請輸入您的密碼" 
                                 className="w-full bg-slate-50/50 border-2 border-transparent p-6 pl-16 pr-16 rounded-[2rem] text-sm font-bold focus:outline-none focus:bg-white focus:border-emerald-900/5 transition-all shadow-inner"
                                 required
                               />
                               <button
                                 type="button"
                                 onClick={() => setShowPassword(!showPassword)}
                                 className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-600 transition-colors"
                               >
                                 {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                               </button>
                            </div>
                         </div>

                          <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isLoading}
                            type="submit" 
                            className="w-full btn-premium p-6 rounded-[2rem] text-sm flex items-center justify-center gap-3 group disabled:opacity-50"
                          >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                              <>
                                確認登入系統 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                              </>
                            )}
                         </motion.button>

                          <div className="relative flex py-2 items-center">
                             <div className="flex-grow border-t border-slate-100"></div>
                             <span className="flex-shrink mx-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">或透過社群帳號一鍵登入 / 帶入基本資料</span>
                             <div className="flex-grow border-t border-slate-100"></div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <motion.button 
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={handleLineLogin}
                              className="w-full bg-[#06C755] text-white p-4 rounded-[1.5rem] font-black text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[#06C755]/20 hover:bg-[#05b04b] transition-all"
                            >
                               <svg className="w-4 h-4 fill-current shrink-0 text-white" viewBox="0 0 24 24">
                                  <path d="M24 10.3c0-5.7-5.4-10.3-12-10.3S0 4.6 0 10.3c0 5.1 4.3 9.3 10 10.1.4.1.9.4.9.9 0 .6-.3 1.5-.4 2.2 0 .1-.1.3 0 .4.1.2.3.2.4.1 1.4-.9 6.4-3.8 8.7-5.5 2.8-2.3 4.4-4.8 4.4-7.9z"/>
                               </svg>
                               LINE 快速登入
                            </motion.button>

                            <motion.button 
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={async () => {
                                setIsLoading(true);
                                try {
                                  const { error } = await supabase.auth.signInWithOAuth({
                                    provider: 'google',
                                    options: {
                                      redirectTo: `${window.location.origin}/login`
                                    }
                                  });
                                  if (error) throw error;
                                } catch (err) {
                                  console.error("Google login error:", err);
                                  alert("Google 登入發送失敗，請確認後台設定！");
                                  setIsLoading(false);
                                }
                              }}
                              className="w-full bg-white border border-slate-200 text-slate-700 p-4 rounded-[1.5rem] font-black text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-slate-200/50 hover:bg-slate-50 transition-all"
                            >
                               <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.5-.1.14 2.44 1.63v3.71h3.94c2.31-2.12 3.64-5.25 3.64-8.78z"/>
                                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.94-3.71c-1.08.72-2.45 1.16-3.99 1.16-3.06 0-5.66-2.07-6.58-4.84H1.31v3.82C3.26 21.36 7.33 24 12 24z"/>
                                  <path fill="#FBBC05" d="M5.42 13.7c-.23-.69-.37-1.43-.37-2.2s.14-1.51.37-2.2V5.48H1.31C.48 7.15 0 9.02 0 11s.48 3.85 1.31 5.52l4.11-2.82z"/>
                                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.31 6.48l4.11 3.82c.92-2.77 3.52-4.84 6.58-4.84z"/>
                               </svg>
                               Google 快速登入
                            </motion.button>
                          </div>
                       </motion.div>
                     ) : (
                       <motion.div 
                         key="pattern-field"
                         initial={{ opacity: 0, x: -20 }}
                         animate={{ opacity: 1, x: 0 }}
                         className="space-y-10 py-4"
                       >
                          {identifier && (
                             <div className="text-center space-y-1">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">正在解鎖帳號</p>
                                <p className="text-sm font-bold text-slate-600">{identifier}</p>
                             </div>
                          )}
                          <div className="bg-slate-50/50 p-6 rounded-[3rem] border border-slate-100">
                             <PatternLock 
                               onComplete={(code) => handleLogin(undefined, code)}
                               error={!!error}
                               size={280}
                             />
                          </div>
                          {error && (
                            <p className="text-center text-[10px] font-black text-rose-500 uppercase tracking-widest">{error}</p>
                          )}
                          <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">請繪製解鎖圖形</p>
                          
                           <button 
                             onClick={() => {
                               setLoginMode('password');
                               setIdentifier("");
                             }}
                             className="w-full text-center text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline"
                           >
                              使用其他號碼或切換密碼登入
                           </button>
                       </motion.div>
                     )}
                  </form>
               </div>
              </>
            )}

           <div className="mt-12 pt-8 border-t border-slate-50 flex flex-col items-center gap-6">
              <p className="text-xs text-slate-400 font-bold">
                 還沒有帳號？ 
                 <Link href="/register" className="text-emerald-600 ml-2 hover:underline">立即加入</Link>
              </p>
              
              <div className="flex gap-4">
                 <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">安全加密</span>
                 </div>
                 <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">快速存取</span>
                 </div>
              </div>
           </div>
        </div>
        
        <p className="text-center mt-12 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
           © 2026 CHURUN TEA HOUSE DIGITAL SYSTEM
        </p>
      </motion.div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
