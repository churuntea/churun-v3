"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "./supabase";

export default function Home() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  // 登入相關狀態
  const [loginPhone, setLoginPhone] = useState("");
  const [loginReferrer, setLoginReferrer] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginStep, setLoginStep] = useState<"phone" | "password">("phone");
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);

  // 儀表板相關狀態
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isOrdering, setIsOrdering] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchProducts();
  }, []);

  const checkAuth = async () => {
    const savedId = localStorage.getItem("churun_member_id");
    if (savedId) {
      await fetchMemberData(savedId);
      setIsAuthenticated(true);
      // 檢查是否要顯示歡迎彈窗 (這張單次 Session 顯示一次)
      const hasSeenWelcome = sessionStorage.getItem("has_seen_welcome");
      if (!hasSeenWelcome) {
        setShowWelcomeModal(true);
        sessionStorage.setItem("has_seen_welcome", "true");
      }
    } else {
      setIsAuthenticated(false);
    }
    setIsCheckingAuth(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').eq('status', 'active').order('created_at', { ascending: false });
    setProducts(data || []);
  };

  const fetchMemberData = async (userId: string) => {
    const { data: memberData } = await supabase.from("members").select("*").eq("id", userId).single();
    if (memberData) {
      setMemberInfo(memberData);
      fetchTransactions(userId, memberData.is_b2b);
    } else {
      handleLogout();
    }
  };

  const fetchTransactions = async (userId: string, isB2b: boolean) => {
    if (isB2b) {
      const { data } = await supabase.from("wallet_transactions").select("*, orders(members(name))").eq("member_id", userId).order("created_at", { ascending: false });
      setTransactions(data || []);
    } else {
      const { data } = await supabase.from("point_transactions").select("*, orders(total_amount)").eq("member_id", userId).order("created_at", { ascending: false });
      setTransactions(data || []);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("churun_member_id");
    sessionStorage.removeItem("has_seen_welcome");
    setIsAuthenticated(false);
    setMemberInfo(null);
    setLoginStep("phone");
  };

  // 登入邏輯
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone) return;

    try {
      const res = await fetch('/api/auth/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginPhone })
      });
      const data = await res.json();
      
      if (data.exists) {
        setLoginStep("password");
      } else {
        setShowRegisterPrompt(true);
      }
    } catch (err) {
      alert("系統錯誤");
    }
  };

  const handleLoginFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    // 這裡簡化邏輯：假設密碼正確或串接 Supabase Auth
    const { data: member } = await supabase.from('members').select('id').eq('phone', loginPhone).single();
    if (member) {
      localStorage.setItem("churun_member_id", member.id);
      checkAuth();
    }
  };

  // 選購邏輯
  const updateQuantity = (productId: string, delta: number) => {
    setQuantities(prev => ({ ...prev, [productId]: Math.max(0, (prev[productId] || 0) + delta) }));
  };

  const handleOrder = async () => {
    const items = Object.entries(quantities).filter(([_, q]) => q > 0).map(([id, quantity]) => ({ id, quantity }));
    if (items.length === 0) return alert("請選擇商品");
    
    setIsOrdering(true);
    try {
      const res = await fetch('/api/orders/dynamic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer_id: memberInfo.id, items })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setQuantities({});
        fetchMemberData(memberInfo.id);
      }
    } catch (err) { alert("下單失敗"); }
    setIsOrdering(false);
  };

  const featuredProduct = products[0];

  if (isCheckingAuth) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">載入中...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24">
      
      {/* 導覽列 */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 p-4 flex justify-between items-center max-w-md mx-auto">
        <h1 className="text-lg font-bold tracking-tighter text-slate-900">初潤製茶所</h1>
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
             <Link href="/profile" className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
             </Link>
             <button onClick={handleLogout} className="text-xs font-medium text-slate-400">登出</button>
          </div>
        ) : (
          <span className="text-xs text-slate-400">訪客模式</span>
        )}
      </nav>

      <main className="max-w-md mx-auto p-5 space-y-8">
        
        {/* 主打商品展示 (不管是登入前後都看得到) */}
        {featuredProduct && (
          <section className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 aspect-[4/5] shadow-2xl">
            {featuredProduct.image_url ? (
              <img src={featuredProduct.image_url} alt={featuredProduct.name} className="absolute inset-0 w-full h-full object-cover opacity-80" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-700">無照片</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <span className="inline-block px-3 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-full mb-3 uppercase tracking-widest">Featured</span>
              <h2 className="text-3xl font-bold text-white mb-2">{featuredProduct.name}</h2>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-light text-white">${featuredProduct.price.toLocaleString()}</span>
                {featuredProduct.original_price && (
                  <span className="text-sm text-white/40 line-through">${featuredProduct.original_price.toLocaleString()}</span>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ---------------- 登入前：顯示登入表單 ---------------- */}
        {!isAuthenticated ? (
          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-slate-900 mb-2">會員登入</h3>
            <p className="text-sm text-slate-500 mb-8">輸入電話號碼，開啟您的初潤之旅</p>

            <form onSubmit={loginStep === "phone" ? handlePhoneSubmit : handleLoginFinal} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase tracking-wider">手機號碼</label>
                <input 
                  type="tel" 
                  disabled={loginStep === "password"}
                  value={loginPhone}
                  onChange={e => setLoginPhone(e.target.value)}
                  placeholder="0912345678"
                  className="w-full mt-1 bg-slate-50 border-none p-4 rounded-2xl text-lg focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              {loginStep === "phone" && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase tracking-wider">推薦人 (選填)</label>
                  <input 
                    type="text" 
                    value={loginReferrer}
                    onChange={e => setLoginReferrer(e.target.value)}
                    placeholder="推薦人代碼"
                    className="w-full mt-1 bg-slate-50 border-none p-4 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
              )}

              {loginStep === "password" && (
                <div className="animate-in slide-in-from-top-4 duration-300">
                  <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase tracking-wider">登入密碼</label>
                  <input 
                    type="password" 
                    autoFocus
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="請輸入密碼"
                    className="w-full mt-1 bg-slate-50 border-none p-4 rounded-2xl text-lg focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
              )}

              <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-sm hover:bg-slate-800 transition shadow-xl shadow-slate-900/10">
                {loginStep === "phone" ? "下一步" : "確認登入"}
              </button>
            </form>
          </section>
        ) : (
          /* ---------------- 登入後：顯示個人儀表板 ---------------- */
          <div className="space-y-8 animate-in fade-in duration-500">
            
            {/* 簡易資訊卡 */}
            <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center justify-between">
               <div>
                  <h3 className="text-lg font-bold text-slate-900">{memberInfo.name.split('(')[0]}</h3>
                  <p className="text-[10px] font-bold text-indigo-500 tracking-widest uppercase mt-1">{memberInfo.tier}</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">UID</p>
                  <p className="text-xs font-mono text-slate-600">{memberInfo.member_code}</p>
               </div>
            </section>

            {/* 選購表單 */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
               <h3 className="text-lg font-bold text-slate-900 mb-6">快速選購</h3>
               <div className="space-y-4 mb-8">
                  {products.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <div className="flex items-center gap-3">
                          {p.image_url ? (
                            <img src={p.image_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                          ) : (
                            <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                          )}
                          <div>
                            <p className="text-sm font-bold text-slate-800">{p.name}</p>
                            <p className="text-xs text-slate-500">${p.price.toLocaleString()}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <button onClick={() => updateQuantity(p.id, -1)} className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">-</button>
                          <span className="w-4 text-center font-bold text-sm">{quantities[p.id] || 0}</span>
                          <button onClick={() => updateQuantity(p.id, 1)} className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center">+</button>
                       </div>
                    </div>
                  ))}
               </div>
               <button onClick={handleOrder} disabled={isOrdering} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold text-sm hover:bg-emerald-700 transition shadow-xl shadow-emerald-600/20">
                  {isOrdering ? "處理中..." : "立即結帳"}
               </button>
            </section>
          </div>
        )}

      </main>

      {/* ---------------- 彈窗：註冊引導 ---------------- */}
      {showRegisterPrompt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl p-8 text-center animate-in zoom-in-95 duration-200">
             <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
             </div>
             <h3 className="text-xl font-bold text-slate-900 mb-2">歡迎來到初潤！</h3>
             <p className="text-sm text-slate-500 mb-8">此號碼尚未註冊，需要現在成為我們的會員嗎？</p>
             <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowRegisterPrompt(false)} className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">先不用</button>
                <button onClick={() => router.push(`/register?phone=${loginPhone}&ref=${loginReferrer}`)} className="py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/20">我要註冊</button>
             </div>
          </div>
        </div>
      )}

      {/* ---------------- 彈窗：歡迎回來 (即時數據) ---------------- */}
      {showWelcomeModal && memberInfo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl relative animate-in slide-in-from-bottom-8 duration-500">
             {/* 關閉按鈕 X */}
             <button onClick={() => setShowWelcomeModal(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-900 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
             </button>

             <div className="p-10 text-center">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">歡迎回來, {memberInfo.name.split('(')[0]}</h3>
                <p className="text-sm text-slate-500 mb-10">這是您目前的即時帳務概況</p>

                <div className="space-y-4 mb-10">
                   <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">目前直推獎金 (B2B)</p>
                      <p className="text-3xl font-light text-slate-900">${Number(memberInfo.virtual_balance).toLocaleString()}</p>
                   </div>
                   <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex flex-col items-center">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">累積紅利積分 (B2C)</p>
                      <p className="text-3xl font-light text-emerald-600">{memberInfo.points_balance} pts</p>
                   </div>
                </div>

                <button onClick={() => setShowWelcomeModal(false)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition">
                   開始選購
                </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}