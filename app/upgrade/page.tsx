"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";

export default function Upgrade() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
      if (data && data.is_b2b) {
        alert("您已經是創業夥伴，無須再次升級！");
        router.replace("/");
        return;
      }
      setMemberInfo(data);
    };
    fetchUser();
  }, [currentUserId, router]);

  const handleUpgrade = async (plan: string, amount: number, tierName: string) => {
    if (!currentUserId) return;
    const confirmed = confirm(`此為模擬刷卡測試。\n確定要刷卡儲值 $${amount.toLocaleString()} 升級為【${tierName}】嗎？`);
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      // 1. 升級會員身分並寫入初始儲值
      const { error: updateError } = await supabase
        .from("members")
        .update({
          is_b2b: true,
          tier: tierName,
          virtual_balance: amount,
          initial_deposit: amount
        })
        .eq("id", currentUserId);

      if (updateError) throw updateError;

      // 2. 寫入儲值交易明細
      await supabase.from("wallet_transactions").insert({
        member_id: currentUserId,
        amount: amount,
        transaction_type: "deposit",
        status: "completed"
      });

      alert(`🎉 恭喜您成功升級為【${tierName}】！\n系統已配發 $${amount.toLocaleString()} 預收款至您的虛擬帳戶，您現在可以前往大宗批發專區開始進貨了！`);
      router.push("/");
    } catch (err: any) {
      alert("升級失敗: " + err.message);
    }
    setIsProcessing(false);
  };

  if (!memberInfo) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">載入中...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans pb-24 relative overflow-hidden">
      {/* 裝飾背景 */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
      <div className="absolute bottom-40 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -ml-20"></div>

      {/* 頂部導覽列 */}
      <nav className="relative z-10 p-4 flex items-center gap-3">
        <Link href="/">
          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </div>
        </Link>
      </nav>

      <main className="p-5 max-w-md mx-auto space-y-8 relative z-10">
        
        <div className="text-center mt-4">
          <h1 className="text-3xl font-light mb-2">升級加盟，翻轉人生</h1>
          <p className="text-sm text-white/60">解鎖大宗批發特權與無上限的組織裂變獎金</p>
        </div>

        <div className="space-y-6">
          {/* 方案 A: 品牌大使 */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px] rounded-3xl relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
              最高分潤推薦
            </div>
            <div className="bg-slate-900 p-6 rounded-3xl h-full">
              <h2 className="text-xl font-medium text-indigo-300 mb-1">初潤品牌大使</h2>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-3xl font-light text-white">$198,000</span>
                <span className="text-xs text-white/50 mb-1">/ 預收貨款</span>
              </div>
              <ul className="space-y-3 mb-6 text-sm text-white/80">
                <li className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  享最高批發折扣與最高退傭比例
                </li>
                <li className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  300盒免費專屬 LOGO 客製化輸出
                </li>
                <li className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  獨享 30% 預收款安全鎖機制
                </li>
              </ul>
              <button 
                onClick={() => handleUpgrade('ambassador', 198000, '初潤品牌大使')}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3.5 rounded-xl font-medium text-sm transition shadow-lg shadow-indigo-500/25 disabled:opacity-50"
              >
                {isProcessing ? "處理中..." : "模擬刷卡升級"}
              </button>
            </div>
          </div>

          {/* 方案 B: 創業合夥人 */}
          <div className="bg-white/10 p-[1px] rounded-3xl">
            <div className="bg-slate-900 p-6 rounded-3xl h-full border border-white/5">
              <h2 className="text-xl font-medium text-emerald-300 mb-1">初潤創業合夥人</h2>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-3xl font-light text-white">$98,000</span>
                <span className="text-xs text-white/50 mb-1">/ 預收貨款</span>
              </div>
              <ul className="space-y-3 mb-6 text-sm text-white/70">
                <li className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  享進階批發折扣與退傭比例
                </li>
                <li className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  無憂退出機制保障
                </li>
              </ul>
              <button 
                onClick={() => handleUpgrade('partner', 98000, '初潤創業合夥人')}
                disabled={isProcessing}
                className="w-full bg-white/10 hover:bg-white/20 text-white py-3.5 rounded-xl font-medium text-sm transition disabled:opacity-50"
              >
                {isProcessing ? "處理中..." : "模擬刷卡升級"}
              </button>
            </div>
          </div>

          <div className="text-center pt-4">
            <p className="text-[10px] text-white/40 max-w-xs mx-auto leading-relaxed">
              升級即代表您同意初潤製茶所 V2 加盟規範。系統將扣除 3,000 元作為數位系統終身設定維護費，退出時不予退還。
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
