"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";

const MOCK_MATERIALS = [
  {
    id: 1,
    title: "初潤黑金特製保溫瓶 買三送一優惠",
    imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&q=80",
    content: "✨ 今天推薦給你我的靈魂茶飲品牌「初潤製茶所」！\n現在任選 3 盒只要 NT$ 999，還送限量「初潤黑金特製保溫瓶」喔！\n\n快來看看，透過我的專屬連結註冊，一起享受最高回饋吧！\n👉 {{REF_LINK}}"
  },
  {
    id: 2,
    title: "高山茶葉推薦文",
    imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=80",
    content: "🌱 尋找一杯能潤澤心靈的好茶嗎？\n我最近愛上了「初潤製茶所」的高山茶，口感甘甜不苦澀，真心推薦給愛喝茶的你！\n\n現在加入還享有新會員首購零風險承諾，一個月內不滿意拍照即退費！\n👉 專屬加入連結：{{REF_LINK}}"
  }
];

export default function Materials() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberInfo, setMemberInfo] = useState<any>(null);

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    setCurrentUserId(savedId);
  }, [router]);

  useEffect(() => {
    async function fetchUser() {
      if (!currentUserId) return;
      const { data } = await supabase.from("members").select("referral_code").eq("id", currentUserId).single();
      setMemberInfo(data);
    }
    fetchUser();
  }, [currentUserId]);

  const handleCopy = (content: string) => {
    if (!memberInfo) return;
    const refLink = `https://churun.com/ref/${memberInfo.referral_code}`;
    const finalContent = content.replace("{{REF_LINK}}", refLink);
    
    navigator.clipboard.writeText(finalContent).then(() => {
      alert("✅ 文案已複製！可以前往 LINE 或 FB 貼上了！");
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans pb-24">
      {/* 頂部導覽列 */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 p-4 flex justify-between items-center">
        <h1 className="text-lg font-medium tracking-widest text-slate-700">數位素材庫</h1>
      </nav>

      <main className="p-5 max-w-md mx-auto space-y-6">
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl text-sm border border-emerald-100">
          💡 點擊「一鍵複製」按鈕，系統會自動將您的專屬推薦連結替換進去，方便您快速推廣！
        </div>

        <div className="space-y-6">
          {MOCK_MATERIALS.map((material) => (
            <div key={material.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
              <div className="h-48 w-full bg-slate-200 overflow-hidden relative">
                {/* 加上 crossOrigin 解決部分圖片資源問題，此處僅為展示圖 */}
                <img src={material.imageUrl} alt={material.title} className="w-full h-full object-cover" />
                <button className="absolute top-3 right-3 bg-white/90 backdrop-blur text-slate-700 text-xs px-3 py-1.5 rounded-full font-medium shadow-sm flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  下載圖片
                </button>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-lg text-slate-800 mb-2">{material.title}</h3>
                <p className="text-sm text-slate-500 whitespace-pre-wrap mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {material.content}
                </p>
                <button 
                  onClick={() => handleCopy(material.content)}
                  className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  一鍵複製文案
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
        <Link href="/materials" className="text-slate-800 flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span className="text-[10px] mt-1 font-medium">素材</span>
        </Link>
        <Link href="/store" className="text-slate-400 hover:text-slate-600 transition flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          <span className="text-[10px] mt-1">商城</span>
        </Link>
      </div>
    </div>
  );
}
