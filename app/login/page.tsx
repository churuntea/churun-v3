"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import Link from "next/link";
import { User, Lock, Phone, ArrowRight, Loader2 } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"phone" | "password">("phone");

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (savedId) {
      router.replace("/");
    }
  }, [router]);

  const handlePhoneCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("members")
        .select("id")
        .eq("phone", phone)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setStep("password");
      } else {
        if (confirm("此號碼尚未註冊，是否前往註冊？")) {
          router.push(`/register?phone=${phone}`);
        }
      }
    } catch (err: any) {
      alert("系統錯誤: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    try {
      const { data: member, error } = await supabase
        .from("members")
        .select("id, password, name")
        .eq("phone", phone)
        .single();

      if (error || !member) {
        alert("帳號不存在");
        return;
      }

      if (member.password !== password) {
        alert("密碼錯誤");
        return;
      }

      localStorage.setItem("churun_member_id", member.id);
      router.push("/");
    } catch (err: any) {
      alert("登入失敗: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-10 border border-slate-50 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60"></div>
        
        <div className="relative z-10 text-center mb-10">
          <div className="w-20 h-20 bg-emerald-900 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-emerald-900/20 rotate-3">
             <span className="text-white text-2xl font-black tracking-tighter">CR</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">歡迎回來</h1>
          <p className="text-slate-400 mt-2 font-medium">開啟您的初潤數位之旅</p>
        </div>

        <form onSubmit={step === "phone" ? handlePhoneCheck : handleLogin} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase tracking-widest">手機號碼</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input 
                type="tel" 
                disabled={step === "password" || isLoading}
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="0912 345 678"
                className="w-full bg-slate-50 border-none p-5 pl-12 rounded-2xl text-lg font-medium focus:ring-2 focus:ring-emerald-500/20 transition disabled:opacity-50"
              />
            </div>
          </div>

          {step === "password" && (
            <div className="space-y-2 animate-in slide-in-from-top-4 duration-500">
              <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase tracking-widest">登入密碼</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input 
                  type="password" 
                  autoFocus
                  disabled={isLoading}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="請輸入您的密碼"
                  className="w-full bg-slate-50 border-none p-5 pl-12 rounded-2xl text-lg font-medium focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-emerald-900 text-white py-5 rounded-2xl font-bold text-sm hover:bg-emerald-800 transition shadow-2xl shadow-emerald-900/20 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {step === "phone" ? "下一步" : "確認登入"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center relative z-10">
          <p className="text-slate-400 text-sm">
            還沒有帳號？{" "}
            <Link href="/register" className="text-emerald-700 font-bold hover:underline">
              立即加入
            </Link>
          </p>
          {step === "password" && (
            <button 
              onClick={() => setStep("phone")}
              className="mt-4 text-xs font-medium text-slate-300 hover:text-slate-500 transition"
            >
              重新輸入電話
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-8 text-slate-300 text-[10px] font-bold tracking-[0.2em] uppercase">
        © 2026 CHURUN TEA HOUSE DIGITAL SYSTEM
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-900" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
