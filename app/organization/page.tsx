"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";

export default function Organization() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [downlines, setDownlines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    setCurrentUserId(savedId);
  }, [router]);

  const fetchOrganization = async (userId: string) => {
    setIsLoading(true);
    
    // Fetch member info
    const { data: mData } = await supabase.from("members").select("*").eq("id", userId).single();
    setMemberInfo(mData);

    // 簡單抓取直屬下線 (upline_id = userId)
    const { data } = await supabase
      .from("members")
      .select("*")
      .eq("upline_id", userId)
      .order("created_at", { ascending: false });

    setDownlines(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    if (currentUserId) {
      fetchOrganization(currentUserId);
    }
  }, [currentUserId]);

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans pb-24">
      {/* 頂部導覽列 */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 p-4 flex justify-between items-center">
        <h1 className="text-lg font-medium tracking-widest text-slate-700">我的組織</h1>
      </nav>

      <main className="p-5 max-w-md mx-auto space-y-4">
        
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-xl font-medium">直屬下線名單</h2>
            <p className="text-xs text-slate-400 mt-1">累積推薦人數：{downlines.length} 人</p>
          </div>
          {memberInfo && memberInfo.is_b2b && (
            <Link href="/exit" className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-2 bg-slate-100 px-3 py-1.5 rounded-full">
              申請無憂退出
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-slate-400">載入中...</div>
        ) : downlines.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <h3 className="font-medium text-slate-600">尚未推薦任何會員</h3>
            <p className="text-xs text-slate-400 mt-1">分享您的專屬推薦碼來拓展組織吧！</p>
          </div>
        ) : (
          <div className="space-y-3">
            {downlines.map((member) => (
              <div key={member.id} className="bg-white p-4 rounded-2xl flex justify-between items-center border border-gray-50 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium text-white ${member.is_b2b ? 'bg-indigo-400' : 'bg-emerald-400'}`}>
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{member.name.split('(')[0]}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {member.tier}
                      </span>
                      {member.is_b2b && (
                        <span className="text-[10px] bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded">
                          創業夥伴
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">累積消費</p>
                  <p className="text-sm font-semibold text-slate-700">${Number(member.lifetime_spend).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 底部導覽列 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 p-3 flex justify-around items-center max-w-md mx-auto">
        <Link href="/" className="text-slate-400 hover:text-slate-600 transition flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className="text-[10px] mt-1">首頁</span>
        </Link>
        <Link href="/organization" className="text-slate-800 flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          <span className="text-[10px] mt-1 font-medium">組織</span>
        </Link>
        <Link href="/materials" className="text-slate-400 hover:text-slate-600 transition flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span className="text-[10px] mt-1">素材</span>
        </Link>
        <Link href="/store" className="text-slate-400 hover:text-slate-600 transition flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          <span className="text-[10px] mt-1">商城</span>
        </Link>
      </div>
    </div>
  );
}
