"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";

export default function Exit() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  
  const [simulation, setSimulation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
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
        alert("無憂退出功能僅限 B2B 創業夥伴使用！");
        router.replace("/");
        return;
      }
      setMemberInfo(data);
      
      if (data.status === 'exit_pending' || data.status === 'exited') {
        setIsLoading(false);
        return;
      }

      // Fetch simulation
      try {
        const res = await fetch('/api/b2b/exit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_id: currentUserId, action: 'simulate' })
        });
        const result = await res.json();
        if (result.success) {
          setSimulation(result.details);
        }
      } catch (err) {
        console.error(err);
      }
      setIsLoading(false);
    };
    fetchUser();
  }, [currentUserId, router]);

  const handleApplyExit = async () => {
    if (!currentUserId) return;
    const confirmed = confirm("退出申請送出後，將無法再享有 B2B 專屬的批發價與對碰獎金，且須等候總部審核。確定要送出申請嗎？");
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/b2b/exit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: currentUserId, action: 'apply' })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        router.push("/");
      } else {
        alert("申請失敗: " + data.error);
      }
    } catch (err) {
      alert("系統錯誤");
    }
    setIsSubmitting(false);
  };

  if (isLoading || !memberInfo) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">載入中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans pb-24">
      {/* 頂部導覽列 */}
      <nav className="bg-slate-900 text-white sticky top-0 z-50 p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <Link href="/organization">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-lg font-medium tracking-widest">無憂退出申請</h1>
        </div>
      </nav>

      <main className="p-5 max-w-md mx-auto space-y-6 mt-4">
        {memberInfo.status === 'exit_pending' ? (
          <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-amber-800 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h2 className="text-lg font-semibold mb-2">您的退出申請正在審核中</h2>
            <p className="text-sm">總部正在為您核算最終退款金額，請耐心等候。</p>
          </div>
        ) : memberInfo.status === 'exited' ? (
          <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-emerald-800 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h2 className="text-lg font-semibold mb-2">您已完成退出程序</h2>
            <p className="text-sm">感謝您過去的參與，若有任何問題請聯繫客服。</p>
          </div>
        ) : simulation ? (
          <>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-medium text-slate-800 mb-6">財務試算報告</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                  <div>
                    <p className="text-sm text-slate-500">當前虛擬帳戶餘額</p>
                    <p className="text-xs text-slate-400 mt-1">您尚未使用的預收款</p>
                  </div>
                  <span className="font-medium text-slate-800">${Number(simulation.virtualBalance).toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                  <div>
                    <p className="text-sm text-slate-500">已領取之退傭總額</p>
                    <p className="text-xs text-slate-400 mt-1">提領商品之原價價差補償需扣回</p>
                  </div>
                  <span className="font-medium text-red-500">-${Number(simulation.totalCommissionReceived).toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                  <div>
                    <p className="text-sm text-slate-500">行政數位設定成本</p>
                    <p className="text-xs text-slate-400 mt-1">無憂退出固定手續費</p>
                  </div>
                  <span className="font-medium text-red-500">-${Number(simulation.adminFee).toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t-2 border-slate-900 flex justify-between items-end">
                <p className="text-sm font-medium text-slate-800">試算可退還金額</p>
                <span className="text-3xl font-light text-slate-900">${Number(simulation.finalRefundAmount).toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-red-50 text-red-800 p-4 rounded-xl text-xs leading-relaxed border border-red-100">
              ⚠️ **請注意：** 送出退出申請後，您的 B2B 創業夥伴資格將被暫停，系統會停止計算您的對碰獎金，且無法再登入「大宗批發專區」。總部審核通過後，上述金額將匯入您綁定的實體銀行帳戶。
            </div>

            <button 
              onClick={handleApplyExit}
              disabled={isSubmitting}
              className="w-full relative bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-medium transition flex items-center justify-center shadow-lg shadow-slate-900/20 disabled:opacity-50"
            >
              {isSubmitting ? "送出中..." : "確認並送出退出申請"}
            </button>
          </>
        ) : (
          <div className="text-center text-slate-500">無法載入試算資料</div>
        )}
      </main>
    </div>
  );
}
