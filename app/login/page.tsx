"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "../supabase";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const refCode = searchParams.get("ref");

  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // 一進來先檢查是否已經登入過
  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (savedId) {
      router.replace("/");
    }
  }, [router]);

  const handleNext = async () => {
    if (!phone) {
      alert("請輸入手機號碼");
      return;
    }
    
    setIsLoading(true);

    try {
      // 檢查手機號碼是否已存在
      const { data: existingUser, error: checkError } = await supabase
        .from("members")
        .select("id, name")
        .eq("phone", phone)
        .maybeSingle();

      if (existingUser) {
        // 老會員登入
        localStorage.setItem("churun_member_id", existingUser.id);
        alert(`歡迎回來，${existingUser.name}！`);
        router.push("/");
      } else {
        // 新會員註冊
        setIsRegistering(true);
      }
    } catch (err: any) {
      alert("發生錯誤：" + err.message);
    }
    setIsLoading(false);
  };

  const handleRegister = async () => {
    if (!name) {
      alert("請輸入真實姓名");
      return;
    }
    setIsLoading(true);
    try {
      let uplineId = null;

      // 如果網址帶有 ref 推薦碼，先找出推薦人的 ID
      if (refCode) {
        const { data: upline } = await supabase
          .from("members")
          .select("id")
          .eq("referral_code", refCode)
          .single();
        
        if (upline) {
          uplineId = upline.id;
        }
      }

      // 產生一組隨機的新推薦碼給這個新用戶
      const newRefCode = "NEW" + Math.floor(Math.random() * 10000);

      // 產生專屬內部管理 UID (CR26M040001)
      const today = new Date();
      const year = String(today.getFullYear()).slice(-2);
      const month = String(today.getMonth() + 1).padStart(2, '0');
      
      // 計算當月入會人數來作為流水號
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const { count } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth);
        
      const seq = String((count || 0) + 1).padStart(4, '0');
      const memberCode = `CR${year}M${month}${seq}`;

      // 寫入新會員資料
      const { data: newUser, error } = await supabase
        .from("members")
        .insert({
          name: name,
          phone: phone,
          upline_id: uplineId,
          tier: "初潤寶寶", // 預設階級
          referral_code: newRefCode,
          member_code: memberCode,
          is_b2b: false // 預設一般消費者
        })
        .select()
        .single();

      if (error) {
        alert("註冊失敗：" + error.message);
      } else if (newUser) {
        localStorage.setItem("churun_member_id", newUser.id);
        alert("🎉 註冊成功！已自動為您登入。");
        router.push("/");
      }
    } catch (err: any) {
      alert("發生錯誤：" + err.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-emerald-900 flex flex-col justify-center items-center p-5 font-sans">
      <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden">
        {/* 背景裝飾 */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-emerald-100 rounded-full blur-3xl opacity-50"></div>
        
        <div className="relative z-10 text-center mb-8">
          <div className="w-16 h-16 bg-emerald-50 rounded-full mx-auto flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <h1 className="text-2xl font-semibold text-slate-800">初潤製茶所</h1>
          <p className="text-sm text-slate-500 mt-2">註冊即享 V2 專屬會員福利</p>
        </div>

        {refCode && (
          <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl mb-6 flex items-center justify-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium text-emerald-800">已偵測到好友專屬推薦碼：{refCode}</span>
          </div>
        )}

        <div className="space-y-4 mb-6 relative z-10">
          <div>
            <label className="text-xs font-medium text-slate-500 ml-1">手機號碼</label>
            <input 
              type="tel" 
              value={phone}
              onChange={e => setPhone(e.target.value)}
              disabled={isRegistering}
              className="w-full mt-1 bg-slate-50 border border-slate-100 p-3 rounded-xl text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50" 
              placeholder="09xxxxxxxx" 
            />
          </div>
          
          {isRegistering && (
            <div>
              <label className="text-xs font-medium text-slate-500 ml-1">真實姓名</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full mt-1 bg-slate-50 border border-slate-100 p-3 rounded-xl text-sm focus:outline-none focus:border-emerald-500" 
                placeholder="請輸入您的真實姓名以完成註冊" 
              />
            </div>
          )}
        </div>

        {!isRegistering ? (
          <button 
            onClick={handleNext}
            disabled={isLoading}
            className="w-full relative z-10 bg-[#06C755] hover:bg-[#05b34c] text-white py-3.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-70"
          >
            {isLoading ? "檢查中..." : "下一步 (登入 / 註冊)"}
          </button>
        ) : (
          <button 
            onClick={handleRegister}
            disabled={isLoading}
            className="w-full relative z-10 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-70"
          >
            {isLoading ? "處理中..." : "確認註冊"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-emerald-900 flex items-center justify-center text-white">載入中...</div>}>
      <LoginContent />
    </Suspense>
  );
}
