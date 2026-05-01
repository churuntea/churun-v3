"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";

export default function Wholesale() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  
  const [quantity, setQuantity] = useState<number>(100);
  const [customLogo, setCustomLogo] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    setCurrentUserId(savedId);
  }, [router]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!currentUserId) return;
      const { data } = await supabase.from("members").select("*").eq("id", currentUserId).single();
      if (data && !data.is_b2b) {
        alert("大宗批發區僅限 B2B 創業夥伴進入！");
        router.replace("/");
        return;
      }
      setMemberInfo(data);
    };
    fetchUser();
  }, [currentUserId, router]);

  const handleSubmit = async () => {
    if (!currentUserId) return;
    if (quantity === 300 && !customLogo) {
      alert("請輸入您的客製化 LOGO 網址或需求說明！");
      return;
    }

    const confirmed = confirm(`確定要下單 ${quantity} 盒嗎？系統將從您的虛擬帳戶扣除款項。`);
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          buyer_id: currentUserId, 
          quantity, 
          custom_logo_url: quantity === 300 ? customLogo : null 
        })
      });
      
      const data = await res.json();
      if (data.success) {
        alert("🎉 訂單已成功送出！" + data.message);
        router.push("/");
      } else {
        alert("下單失敗: " + data.error);
      }
    } catch (err) {
      alert("系統錯誤");
    }
    setIsSubmitting(false);
  };

  if (!memberInfo) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">載入中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans pb-24">
      {/* 頂部導覽列 */}
      <nav className="bg-indigo-900 text-white sticky top-0 z-50 p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <Link href="/">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-lg font-medium tracking-widest">大宗批發專區</h1>
        </div>
      </nav>

      <main className="p-5 max-w-md mx-auto space-y-6 mt-4">
        
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl text-indigo-800 text-sm">
          💡 **創業夥伴專屬**：單筆下單滿 100 盒享批發價 73 折；滿 300 盒享尊榮價 66 折，並**免費提供專屬 LOGO 客製化輸出服務**！
        </div>

        <section className="space-y-4">
          <h3 className="font-semibold text-slate-700">選擇批發數量</h3>
          
          <label className={`block p-4 rounded-2xl border-2 cursor-pointer transition ${quantity === 100 ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 bg-white hover:border-indigo-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input type="radio" name="qty" checked={quantity === 100} onChange={() => setQuantity(100)} className="text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                <div>
                  <h4 className="font-medium text-slate-800">100 盒 (一般批發)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">每盒 $329 (原價 $450)</p>
                </div>
              </div>
              <span className="font-semibold text-indigo-700">$32,900</span>
            </div>
          </label>

          <label className={`block p-4 rounded-2xl border-2 cursor-pointer transition ${quantity === 300 ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 bg-white hover:border-indigo-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input type="radio" name="qty" checked={quantity === 300} onChange={() => setQuantity(300)} className="text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                <div>
                  <h4 className="font-medium text-slate-800">300 盒 (尊榮客製)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">每盒 $297 (原價 $450)</p>
                </div>
              </div>
              <span className="font-semibold text-indigo-700">$89,100</span>
            </div>
            
            {quantity === 300 && (
              <div className="mt-4 pt-4 border-t border-indigo-200/50 animate-fade-in-down">
                <label className="text-xs font-medium text-indigo-800 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  專屬 LOGO 客製化資訊
                </label>
                <textarea 
                  value={customLogo}
                  onChange={(e) => setCustomLogo(e.target.value)}
                  placeholder="請貼上您的 LOGO 圖檔網址，或描述您的客製化文字需求..."
                  className="w-full mt-2 bg-white border border-indigo-200 p-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500 min-h-[80px]"
                />
              </div>
            )}
          </label>
        </section>

        <section className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-500">目前虛擬餘額</span>
            <span className="font-medium text-slate-700">${Number(memberInfo.virtual_balance).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm mb-4">
            <span className="text-slate-500">本次訂單總額</span>
            <span className="font-medium text-red-500">-${(quantity === 100 ? 32900 : 89100).toLocaleString()}</span>
          </div>
          <div className="pt-3 border-t border-gray-100 flex justify-between font-semibold">
            <span className="text-slate-800">結帳後餘額</span>
            <span className={Number(memberInfo.virtual_balance) - (quantity === 100 ? 32900 : 89100) < 0 ? "text-red-500" : "text-emerald-600"}>
              ${(Number(memberInfo.virtual_balance) - (quantity === 100 ? 32900 : 89100)).toLocaleString()}
            </span>
          </div>
        </section>

        <button 
          onClick={handleSubmit}
          disabled={isSubmitting || Number(memberInfo.virtual_balance) < (quantity === 100 ? 32900 : 89100)}
          className="w-full relative bg-indigo-900 hover:bg-indigo-800 text-white py-4 rounded-xl font-medium transition flex items-center justify-center shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "處理中..." : "確認扣款並送出訂單"}
        </button>

      </main>
    </div>
  );
}
