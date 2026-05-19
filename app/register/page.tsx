"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Phone, 
  User, 
  UserPlus, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck, 
  Hash,
  Sparkles,
  Lock,
  AlertCircle,
  Mail,
  MapPin
} from "lucide-react";
import Link from "next/link";

// 預設上線 (若未填寫推薦碼，統一歸入洪召安名下)
const DEFAULT_UPLINE_NAME = "洪召安";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    referral_code: "",
    password: "",
    google_id: "",
    line_id: "",
    avatar_url: ""
  });
  const [uplineName, setUplineName] = useState<string | null>(null);
  const [isValidatingRef, setIsValidatingRef] = useState(false);
  const [hasRef, setHasRef] = useState(false);

  // 1. 還原/帶入推薦碼
  useEffect(() => {
    const savedRef = localStorage.getItem("churun_register_ref");
    const ref = searchParams.get("ref") || savedRef;
    if (ref) {
      setFormData(prev => ({ ...prev, referral_code: ref.trim().toUpperCase() }));
      setHasRef(true);
      if (savedRef) {
        localStorage.removeItem("churun_register_ref");
      }
    }
  }, [searchParams]);

  // 2. 處理社群 OAuth 登入/資料帶入回調
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const provider = searchParams.get("provider");
      const code = searchParams.get("code");
      const state = searchParams.get("state");

      // Google 帶入回調
      if (provider === "google") {
        setIsLoading(true);
        try {
          const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
          if (sessionErr) throw sessionErr;
          
          if (session?.user) {
            const user = session.user;
            const email = user.email || "";
            const name = user.user_metadata?.full_name || "Google 用戶";
            const googleId = user.id;
            const avatarUrl = user.user_metadata?.avatar_url || "https://i.ibb.co/6R2M5X1/churun-baby.png";

            // 檢查是否已註冊過
            const { data: existingMember } = await supabase
              .from("members")
              .select("id, name")
              .eq("google_id", googleId)
              .maybeSingle();

            if (existingMember) {
              localStorage.setItem("churun_member_id", existingMember.id);
              localStorage.setItem("churun_member_name", existingMember.name);
              await supabase.from("members").update({ last_login: new Date().toISOString() }).eq("id", existingMember.id);
              alert(`歡迎回來，${existingMember.name}！您已註冊過會員，已為您自動登入。`);
              router.push("/profile");
              return;
            }

            setFormData(prev => ({
              ...prev,
              name,
              email,
              google_id: googleId,
              avatar_url: avatarUrl
            }));
            alert("✅ 成功從 Google 帳戶帶入基本資料 (姓名、信箱)！請確認或補全手機號碼與自訂密碼即可完成註冊。");
          }
        } catch (err: any) {
          console.error("Google callback error:", err);
          setErrorMsg("Google 資料帶入失敗，請稍後重試。");
        } finally {
          setIsLoading(false);
        }
      }

      // LINE 帶入回調
      if (code && state === "churun_line_register") {
        setIsLoading(true);
        try {
          const res = await fetch("/api/auth/line", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code,
              redirectUri: `${window.location.origin}/register`
            })
          });

          const data = await res.json();
          if (!data.success) {
            alert(data.error || "LINE 授權驗證失敗");
            router.replace("/register");
            return;
          }

          if (data.status === "success") {
            localStorage.setItem("churun_member_id", data.memberId);
            localStorage.setItem("churun_member_name", data.memberName);
            await supabase.from("members").update({ last_login: new Date().toISOString() }).eq("id", data.memberId);
            alert(`歡迎回來，${data.memberName}！您已註冊過會員，已為您自動登入。`);
            router.push("/profile");
          } else if (data.status === "new_user") {
            setFormData(prev => ({
              ...prev,
              name: data.displayName || "LINE 用戶",
              line_id: data.lineUserId,
              avatar_url: data.pictureUrl || "https://i.ibb.co/6R2M5X1/churun-baby.png"
            }));
            alert("✅ 成功從 LINE 授權帶入基本資料 (姓名)！請確認或補全手機號碼與自訂密碼即可完成註冊。");
          }
        } catch (err: any) {
          console.error("LINE callback error:", err);
          setErrorMsg("LINE 資料帶入失敗，請稍後重試。");
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleOAuthCallback();
  }, [searchParams, router]);

  // 3. 實作 Google 與 LINE 的跳轉授權
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const refCode = formData.referral_code || searchParams.get("ref") || "";
    if (refCode) {
      localStorage.setItem("churun_register_ref", refCode.trim().toUpperCase());
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/register?provider=google`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Google auth error:", err);
      setErrorMsg("啟動 Google 授權失敗，請確認網路連線。");
      setIsLoading(false);
    }
  };

  const handleLineAuth = () => {
    setIsLoading(true);
    setErrorMsg(null);
    const refCode = formData.referral_code || searchParams.get("ref") || "";
    if (refCode) {
      localStorage.setItem("churun_register_ref", refCode.trim().toUpperCase());
    }

    const clientId = "2010007687";
    const redirectUri = encodeURIComponent(`${window.location.origin}/register`);
    const state = "churun_line_register";
    const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=profile%20openid`;
    window.location.href = lineAuthUrl;
  };

  // Real-time Referral Code Validation
  useEffect(() => {
    const checkUpline = async () => {
      const refCode = formData.referral_code?.trim().toUpperCase();
      if (!refCode || refCode.length < 3) {
        setUplineName(null);
        return;
      }

      setIsValidatingRef(true);
      const { data, error } = await supabase
        .from("members")
        .select("name")
        .or(`referral_code.eq.${refCode},member_code.eq.${refCode},phone.eq.${refCode}`)
        .single();
      
      if (data && !error) {
        setUplineName(data.name);
      } else {
        setUplineName(null);
      }
      setIsValidatingRef(false);
    };

    const timer = setTimeout(checkUpline, 500);
    return () => clearTimeout(timer);
  }, [formData.referral_code]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const memberCode = `CR26M${Math.floor(100000 + Math.random() * 900000)}`;
    const myReferralCode = memberCode;

    try {
      let uplineId = null;
      const refCode = formData.referral_code?.trim().toUpperCase();

      if (refCode) {
        // 使用者有填寫推薦碼
        const { data: upline, error: uplineErr } = await supabase
          .from("members")
          .select("id")
          .or(`referral_code.eq.${refCode},member_code.eq.${refCode},phone.eq.${refCode}`)
          .single();
        
        if (uplineErr || !upline) {
          setErrorMsg("找不到該推薦人代碼，請確認後再試一次。");
          setIsLoading(false);
          return;
        }
        uplineId = upline.id;
      } else {
        // 未填寫推薦碼 → 自動歸入洪召安名下
        const { data: defaultUpline } = await supabase
          .from("members")
          .select("id")
          .eq("name", DEFAULT_UPLINE_NAME)
          .single();
        
        if (defaultUpline) {
          uplineId = defaultUpline.id;
        }
        // 若連洪召安帳號也找不到，uplineId 維持 null（不阻擋註冊流程）
      }

      const insertData: any = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        password: formData.password,
        referral_code: myReferralCode,
        member_code: memberCode,
        tier: "初潤寶寶",
        is_b2b: false,
        lifetime_spend: 0,
        quarterly_spend: 0,
        points_balance: 0,
        virtual_balance: 0,
        avatar_url: formData.avatar_url || "https://i.ibb.co/6R2M5X1/churun-baby.png"
      };

      if (uplineId) insertData.upline_id = uplineId;
      if (formData.google_id) insertData.google_id = formData.google_id;
      if (formData.line_id) insertData.line_id = formData.line_id;

      const { data, error } = await supabase
        .from("members")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        if (error.message.includes("unique_phone") || error.code === "23505") {
          setErrorMsg("此手機號碼已被註冊過，請直接登入或更換號碼。");
        } else {
          setErrorMsg(`註冊失敗: ${error.message}`);
        }
      } else {
        localStorage.setItem("churun_member_id", data.id);
        localStorage.setItem("churun_member_name", data.name);
        
        // 1. 自動發放 WELCOME100 迎新折價券到其庫存
        try {
          // 查詢所有以 NEW_、WELCOME 開頭的優惠券，或簡介包含迎新、新會員的活躍券碼
          const { data: welcomeCoupons } = await supabase
            .from("coupons")
            .select("id, name, description")
            .or("code.ilike.NEW_%,code.ilike.WELCOME%,description.ilike.%迎新%,description.ilike.%新會員%");

          if (welcomeCoupons && welcomeCoupons.length > 0) {
            const insertRows = welcomeCoupons.map(c => ({
              member_id: data.id,
              coupon_id: c.id,
              is_used: false
            }));

            await supabase.from("member_coupons").insert(insertRows);

            // 發送獲得優惠券的通知
            const namesList = welcomeCoupons.map(c => `【${c.name}】`).join("、");
            await supabase.from("notifications").insert({
              member_id: data.id,
              title: "🎁 獲得新會員專屬迎新禮包！",
              content: `恭喜您獲得 ${namesList}！已存入您的個人券包，快到商城體驗吧！`,
              type: "system"
            });
          }
        } catch (couponErr) {
          console.error("自動發送迎新券失敗:", couponErr);
        }

        // 2. 新增上線通知
        if (uplineId) {
          await supabase.from("notifications").insert({
            member_id: uplineId,
            title: "新夥伴加入！",
            content: `您的團隊有新夥伴 ${formData.name} 透過您的代碼加入了。`,
            type: "referral"
          });
        }

        setShowSuccessModal(true);
      }
    } catch (err: any) {
      setErrorMsg("網路連線異常，請稍後再試。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6 relative overflow-hidden">
      
      
      <div className="absolute inset-0 pointer-events-none">
         <motion.div 
           animate={{ y: [0, -50, 0], x: [0, 30, 0] }}
           transition={{ duration: 15, repeat: Infinity }}
           className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-50/50 rounded-full blur-[120px]"
         />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="bg-white/80 backdrop-blur-3xl rounded-[4rem] p-12 lg:p-16 shadow-[0_32px_64px_-16px_rgba(6,78,59,0.08)] border border-white">
           
           <div className="flex justify-between items-start mb-8">
              <div className="space-y-4">
                 <div className="w-16 h-16 bg-emerald-900 rounded-[2rem] flex items-center justify-center shadow-xl shadow-emerald-900/20">
                    <UserPlus className="w-8 h-8 text-white" />
                 </div>
                 <h1 className="text-4xl font-black text-slate-900 tracking-tight">建立帳號</h1>
                 <p className="text-sm text-slate-400 font-medium">填寫資料，開始您的初潤之旅</p>
              </div>
           </div>

           {/* 社群帳號快速帶入引擎 */}
           <div className="bg-slate-50/80 rounded-[2.5rem] p-6 mb-10 border border-slate-100">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">⚡ 想要省去填寫時間？選擇社群帳號一鍵帶入基本資料</p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <motion.button 
                  type="button" 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLineAuth}
                  className="w-full bg-[#06C755] text-white p-4 rounded-2xl font-black text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[#06C755]/20 hover:bg-[#05b04b] transition"
                >
                  <svg className="w-4 h-4 fill-current shrink-0 text-white" viewBox="0 0 24 24"><path d="M24 10.3c0-5.7-5.4-10.3-12-10.3S0 4.6 0 10.3c0 5.1 4.3 9.3 10 10.1.4.1.9.4.9.9 0 .6-.3 1.5-.4 2.2 0 .1-.1.3 0 .4.1.2.3.2.4.1 1.4-.9 6.4-3.8 8.7-5.5 2.8-2.3 4.4-4.8 4.4-7.9z"/></svg>
                  LINE 帶入基本資料
                </motion.button>
                <motion.button 
                  type="button" 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoogleAuth}
                  className="w-full bg-white border border-slate-200 text-slate-700 p-4 rounded-2xl font-black text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-slate-200/50 hover:bg-slate-50 transition"
                >
                 <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.5-.1.14 2.44 1.63v3.71h3.94c2.31-2.12 3.64-5.25 3.64-8.78z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.94-3.71c-1.08.72-2.45 1.16-3.99 1.16-3.06 0-5.66-2.07-6.58-4.84H1.31v3.82C3.26 21.36 7.33 24 12 24z"/><path fill="#FBBC05" d="M5.42 13.7c-.23-.69-.37-1.43-.37-2.2s.14-1.51.37-2.2V5.48H1.31C.48 7.15 0 9.02 0 11s.48 3.85 1.31 5.52l4.11-2.82z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.31 6.48l4.11 3.82c.92-2.77 3.52-4.84 6.58-4.84z"/></svg>
                 Google 帶入基本資料
               </motion.button>
             </div>
           </div>

           <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-6">真實姓名</label>
                 <div className="relative">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
                    <input name="name" type="text" value={formData.name} onChange={handleChange} placeholder="您的姓名" className="w-full bg-slate-50/50 border-none p-6 pl-16 rounded-[2rem] text-sm font-bold focus:ring-2 focus:ring-emerald-900/5 transition shadow-inner" required />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-6">手機號碼</label>
                 <div className="relative">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
                    <input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="0912345678" className="w-full bg-slate-50/50 border-none p-6 pl-16 rounded-[2rem] text-sm font-bold focus:ring-2 focus:ring-emerald-900/5 transition shadow-inner" required />
                 </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                 <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-6">電子郵件 (選填)</label>
                 <div className="relative">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
                    <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="your@email.com" className="w-full bg-slate-50/50 border-none p-6 pl-16 rounded-[2rem] text-sm font-bold focus:ring-2 focus:ring-emerald-900/5 transition shadow-inner" />
                 </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                 <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-6">收件地址 (選填)</label>
                 <div className="relative">
                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
                    <input name="address" type="text" value={formData.address} onChange={handleChange} placeholder="請輸入收件地址" className="w-full bg-slate-50/50 border-none p-6 pl-16 rounded-[2rem] text-sm font-bold focus:ring-2 focus:ring-emerald-900/5 transition shadow-inner" />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-6">自訂密碼</label>
                 <div className="relative">
                    <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
                    <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="請輸入密碼" className="w-full bg-slate-50/50 border-none p-6 pl-16 rounded-[2rem] text-sm font-bold focus:ring-2 focus:ring-emerald-900/5 transition shadow-inner" required />
                 </div>
              </div>

              <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-6">推薦人代碼或手機號碼 (選填)</label>
                  <div className="relative">
                     <Hash className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
                     <input 
                       name="referral_code" 
                       type="text" 
                       value={formData.referral_code} 
                       onChange={handleChange} 
                       placeholder="推薦碼或推薦人手機" 
                       readOnly={hasRef}
                      className={`w-full border-none p-6 pl-16 rounded-[2rem] text-sm font-bold focus:ring-2 focus:ring-emerald-900/5 transition shadow-inner ${hasRef ? 'bg-emerald-50/50 text-emerald-800 cursor-not-allowed font-black' : 'bg-slate-50/50 text-slate-800'}`} 
                    />
                    {hasRef && (
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full text-[8px] font-black tracking-widest uppercase">
                        <Lock className="w-3 h-3" /> 已鎖定
                      </div>
                    )}
                    {!formData.referral_code && (
                      <div className="mt-3 ml-6 flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           預設大使：<span className="text-emerald-600 underline underline-offset-4 decoration-emerald-200">{DEFAULT_UPLINE_NAME}</span>
                        </p>
                      </div>
                    )}
                    <AnimatePresence>
                      {isValidatingRef && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute right-6 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>
                 <AnimatePresence>
                    {uplineName ? (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-[10px] font-bold text-emerald-600 ml-6 mt-2 flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" /> 推薦人：{uplineName} ✨
                      </motion.p>
                    ) : (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[10px] font-bold text-slate-300 ml-6 mt-2"
                      >
                        未填寫時將由品牌大使統一介紹
                      </motion.p>
                    )}
                 </AnimatePresence>
              </div>

              <div className="md:col-span-2 pt-6">
                 <motion.button 
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   disabled={isLoading}
                   type="submit" 
                   className="w-full bg-emerald-900 text-white p-7 rounded-[2.5rem] font-black text-sm tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl shadow-emerald-900/30 group disabled:opacity-50"
                 >
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                      <>
                        立即完成註冊 <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                      </>
                    )}
                 </motion.button>
              </div>
           </form>

           <p className="text-center mt-8 text-xs text-slate-400">
             已有帳號？{" "}
             <Link href="/login" className="text-emerald-600 font-bold hover:underline">立即登入</Link>
           </p>
        </div>
      </motion.div>

      <AnimatePresence>
        {showSuccessModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-2xl flex items-center justify-center p-6">
             <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3rem] p-12 w-full max-w-sm text-center shadow-2xl relative overflow-hidden">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-xl font-black mb-2 text-slate-800">註冊成功！</h3>
                <p className="text-sm text-slate-500 mb-8 font-bold">為了確保您能收到最新的通知與專屬服務，請務必加入我們的官方 LINE@！</p>
                
                <div className="space-y-3">
                  <a 
                    href="https://lin.ee/PB4ztiM" 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full py-4 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[#06C755]/30 transition block"
                  >
                    <span>💬</span> 點擊加入官方 LINE@
                  </a>
                  <button 
                    onClick={() => router.push("/")} 
                    className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition"
                  >
                    前往首頁
                  </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {errorMsg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-2xl flex items-center justify-center p-6">
             <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3rem] p-12 w-full max-w-sm text-center shadow-2xl">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-6" />
                <h3 className="text-xl font-black mb-4">註冊失敗</h3>
                <p className="text-sm text-slate-500 mb-10">{errorMsg}</p>
                <button onClick={() => setErrorMsg(null)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">返回修改</button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Register() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>}>
      <RegisterContent />
    </Suspense>
  );
}
