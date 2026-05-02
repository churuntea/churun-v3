"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../supabase";

export default function CommissionHistory() {
  const router = useRouter();
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/");
      return;
    }
    fetchData(savedId);
  }, []);

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    // 1. Fetch member info
    const { data: mData } = await supabase.from("members").select("*").eq("id", userId).single();
    if (!mData || !mData.is_b2b) {
      router.replace("/");
      return;
    }
    setMemberInfo(mData);

    // 2. Fetch commission transactions
    const { data: txData } = await supabase
      .from("wallet_transactions")
      .select("*, orders(total_amount, member:members(name))")
      .eq("member_id", userId)
      .eq("transaction_type", "commission_refund")
      .order("created_at", { ascending: false });

    setCommissions(txData || []);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24">
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 p-4 flex items-center gap-4 max-w-md mx-auto">
        <Link href="/" className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 className="text-lg font-bold text-slate-900">推廣獎金明細</h1>
      </nav>

      <main className="max-w-md mx-auto p-5 space-y-6">
        {memberInfo && (
          <section className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">可提領獎金總額</p>
            <h2 className="text-4xl font-light mb-4">${Number(memberInfo.virtual_balance).toLocaleString()}</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-white/10 px-2 py-1 rounded-full text-white/70">創業夥伴專屬</span>
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">獎金紀錄</h3>
          
          {isLoading ? (
            <div className="text-center py-10 text-slate-400">載入中...</div>
          ) : commissions.length === 0 ? (
            <div className="bg-white p-12 rounded-[2.5rem] text-center border border-gray-100">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
               </div>
               <p className="text-sm text-slate-500">尚無推廣獎金紀錄</p>
            </div>
          ) : (
            <div className="space-y-3">
              {commissions.map((tx) => (
                <div key={tx.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">推廣獎金</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        下線: {tx.orders?.member?.name || "未知"} | 訂單總額: ${Number(tx.orders?.total_amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">+${Number(tx.amount).toLocaleString()}</p>
                    <p className="text-[10px] text-slate-300 mt-0.5">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
