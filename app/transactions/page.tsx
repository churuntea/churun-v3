"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";

export default function Transactions() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState<'wallet' | 'points'>('wallet');
  const [walletTx, setWalletTx] = useState<any[]>([]);
  const [pointTx, setPointTx] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    setCurrentUserId(savedId);
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUserId) return;
      setIsLoading(true);
      
      const { data: mData } = await supabase.from("members").select("*").eq("id", currentUserId).single();
      setMemberInfo(mData);
      
      if (mData && !mData.is_b2b) {
        setActiveTab('points'); // 強制 B2C 只能看點數
      }

      // Fetch wallet tx
      if (mData?.is_b2b) {
        const { data: wTx } = await supabase.from("wallet_transactions").select("*").eq("member_id", currentUserId).order("created_at", { ascending: false });
        setWalletTx(wTx || []);
      }

      // Fetch points tx
      const { data: pTx } = await supabase.from("point_transactions").select("*").eq("member_id", currentUserId).order("created_at", { ascending: false });
      setPointTx(pTx || []);

      setIsLoading(false);
    };
    fetchData();
  }, [currentUserId]);

  if (isLoading || !memberInfo) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">載入中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans pb-24">
      {/* 頂部導覽列 */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 p-4 flex items-center shadow-sm gap-3">
        <Link href="/">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 className="text-lg font-medium tracking-widest text-slate-700">歷史明細帳本</h1>
      </nav>

      <main className="p-5 max-w-md mx-auto space-y-6 mt-2">
        
        {/* Tabs */}
        <div className="flex bg-slate-200/50 p-1 rounded-xl">
          {memberInfo.is_b2b && (
            <button 
              onClick={() => setActiveTab('wallet')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${activeTab === 'wallet' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              虛擬預收款明細
            </button>
          )}
          <button 
            onClick={() => setActiveTab('points')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${activeTab === 'points' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            紅利點數明細
          </button>
        </div>

        {/* Wallet Transactions */}
        {activeTab === 'wallet' && memberInfo.is_b2b && (
          <section className="space-y-4">
            <div className="bg-indigo-900 text-white p-6 rounded-3xl shadow-sm relative overflow-hidden">
              <p className="text-indigo-200 text-sm mb-1">目前可用預收款餘額</p>
              <h3 className="text-4xl font-light">${Number(memberInfo.virtual_balance).toLocaleString()}</h3>
            </div>

            <div className="space-y-3">
              {walletTx.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">暫無交易紀錄</div>
              ) : (
                walletTx.map((tx) => (
                  <div key={tx.id} className="bg-white p-4 rounded-2xl flex justify-between items-center border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${Number(tx.amount) > 0 ? 'bg-indigo-50 text-indigo-500' : 'bg-rose-50 text-rose-500'}`}>
                        {Number(tx.amount) > 0 ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-800">
                          {tx.transaction_type === 'deposit' ? '儲值預收款' : 
                           tx.transaction_type === 'order_deduction' ? '大宗下單扣款' :
                           tx.transaction_type === 'commission_refund' ? '直推退傭入帳' : 
                           tx.transaction_type === 'withdrawal' ? '無憂退出扣回結算' : tx.transaction_type}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{new Date(tx.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${Number(tx.amount) > 0 ? 'text-indigo-600' : 'text-slate-700'}`}>
                        {Number(tx.amount) > 0 ? '+' : ''}{Number(tx.amount).toLocaleString()}
                      </p>
                      {tx.status === 'pending' && <span className="text-[10px] text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">審核中</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Point Transactions */}
        {activeTab === 'points' && (
          <section className="space-y-4">
            <div className="bg-emerald-800 text-white p-6 rounded-3xl shadow-sm relative overflow-hidden">
              <p className="text-emerald-200 text-sm mb-1">目前紅利點數餘額</p>
              <h3 className="text-4xl font-light">{memberInfo.points_balance} <span className="text-lg">pts</span></h3>
            </div>

            <div className="space-y-3">
              {pointTx.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">暫無點數紀錄</div>
              ) : (
                pointTx.map((tx) => (
                  <div key={tx.id} className="bg-white p-4 rounded-2xl flex justify-between items-center border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.amount > 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-500'}`}>
                        {tx.amount > 0 ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-800">
                          {tx.transaction_type === 'earned_from_order' ? '購物回饋點數' : 
                           tx.transaction_type === 'redeemed' ? '商城兌換扣點' : tx.transaction_type}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{new Date(tx.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <p className={`font-semibold ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
