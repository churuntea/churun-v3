"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";

const STORE_ITEMS = [
  { id: 1, name: "初潤黑金特製保溫瓶", points: 300, image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&q=80" },
  { id: 2, name: "初潤典藏茶具組", points: 800, image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=80" },
  { id: 3, name: "品牌限量帆布袋", points: 150, image: "https://images.unsplash.com/photo-1597554904261-0d359b3fb07c?w=500&q=80" }
];

export default function Store() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    setCurrentUserId(savedId);
  }, [router]);

  const fetchUser = async () => {
    if (!currentUserId) return;
    const { data } = await supabase.from("members").select("*").eq("id", currentUserId).single();
    setMemberInfo(data);
  };

  useEffect(() => {
    fetchUser();
  }, [currentUserId]);

  const handleRedeem = async (item: any) => {
    if (!memberInfo || memberInfo.is_b2b) {
      alert("僅限 B2C 會員使用點數換購！");
      return;
    }
    if (memberInfo.points_balance < item.points) {
      alert("點數餘額不足！");
      return;
    }

    const confirmed = confirm(`確定要花費 ${item.points} 點兌換「${item.name}」嗎？`);
    if (!confirmed) return;

    setIsRedeeming(true);
    try {
      const res = await fetch('/api/store/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: currentUserId, item_id: item.id, points: item.points, item_name: item.name })
      });
      const data = await res.json();
      
      if (data.success) {
        alert("兌換成功！商品將寄送至您的預設地址。");
        fetchUser(); // 重新抓取餘額
      } else {
        alert("兌換失敗: " + data.error);
      }
    } catch (err) {
      alert("系統錯誤");
    }
    setIsRedeeming(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans pb-24">
      {/* 頂部導覽列 */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 p-4 flex justify-between items-center">
        <h1 className="text-lg font-medium tracking-widest text-slate-700">點數換購商城</h1>
      </nav>

      <main className="p-5 max-w-md mx-auto space-y-6">
        {memberInfo && !memberInfo.is_b2b ? (
          <div className="bg-emerald-800 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-emerald-500/30 blur-2xl"></div>
            <p className="text-white/70 text-sm mb-1 relative z-10">目前可用點數</p>
            <h3 className="text-4xl font-light relative z-10">{memberInfo.points_balance} <span className="text-lg">pts</span></h3>
          </div>
        ) : (
          <div className="bg-slate-200 text-slate-500 p-6 rounded-3xl text-center text-sm">
            B2B 創業夥伴無法使用點數換購商城。
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {STORE_ITEMS.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
              <div className="h-32 w-full bg-slate-100">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-3 flex flex-col flex-1">
                <h4 className="font-medium text-sm text-slate-800 mb-1 leading-tight">{item.name}</h4>
                <p className="text-emerald-600 font-semibold text-sm mb-3 mt-auto">{item.points} 點</p>
                <button 
                  onClick={() => handleRedeem(item)}
                  disabled={isRedeeming || !memberInfo || memberInfo.is_b2b || memberInfo.points_balance < item.points}
                  className="w-full py-2 rounded-xl text-xs font-medium transition disabled:bg-slate-100 disabled:text-slate-400 bg-slate-900 text-white hover:bg-slate-800"
                >
                  立即兌換
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* 底部導覽列 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 p-3 flex justify-around items-center max-w-md mx-auto">
        <Link href="/" className="text-slate-400 hover:text-slate-600 transition flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className="text-[10px] mt-1">首頁</span>
        </Link>
        <Link href="/organization" className="text-slate-400 hover:text-slate-600 transition flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          <span className="text-[10px] mt-1">組織</span>
        </Link>
        <Link href="/materials" className="text-slate-400 hover:text-slate-600 transition flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span className="text-[10px] mt-1">素材</span>
        </Link>
        <Link href="/store" className="text-slate-800 flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          <span className="text-[10px] mt-1 font-medium">商城</span>
        </Link>
      </div>
    </div>
  );
}
