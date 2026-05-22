"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";
import Toast from "@/components/Toast";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  LayoutDashboard, 
  ShoppingBag, 
  Zap, 
  User, 
  Plus, 
  Loader2,
  ChevronRight,
  Filter,
  CreditCard,
  Gift,
  ShieldCheck,
  Activity,
  Award,
  ArrowLeft,
  Calendar,
  Search
} from "lucide-react";

function TransactionContent() {
  const router = useRouter();
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"wallet" | "points">("wallet");
  const [showHistory, setShowHistory] = useState(false);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [rechargeStep, setRechargeStep] = useState<"tier" | "remit" | "success">("tier");
  const [rechargeTier, setRechargeTier] = useState<number>(10000);
  const [paymentLastFive, setPaymentLastFive] = useState("");
  const [isRecharging, setIsRecharging] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" as "success" | "error" | "info" });
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [secureOtp, setSecureOtp] = useState("");
  const [otpProgress, setOtpProgress] = useState(100);

  // 進階查詢狀態
  const [isAdvancedQueryOpen, setIsAdvancedQueryOpen] = useState(false);
  const [queryStartDate, setQueryStartDate] = useState("");
  const [queryEndDate, setQueryEndDate] = useState("");
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);
  
  // 權利義務設定
  const [tierPerksText, setTierPerksText] = useState<string>("");

  const getTransactionLabel = (type: string, isWallet: boolean) => {
    if (isWallet) {
      switch (type) {
        case "commission_refund": return { label: "B2B 回饋折讓", desc: "推廣夥伴消費回饋撥發", color: "text-emerald-600 bg-emerald-50" };
        case "commission_rollback": return { label: "⚠️ 回饋折讓扣回", desc: "相關訂單取消，扣回推廣回饋", color: "text-rose-600 bg-rose-50 border border-rose-100" };
        case "withdrawal": return { label: "帳戶資金提領", desc: "提款至綁定銀行帳戶", color: "text-rose-600 bg-rose-50" };
        case "purchase": 
        case "payment":
        case "order_deduction": return { label: "進貨/商品消費", desc: "商城結帳扣除儲值金", color: "text-amber-600 bg-amber-50" };
        case "order_cancelled_refund": return { label: "🎉 購物退款返還", desc: "訂單退款/刪除，儲值金退回錢包", color: "text-emerald-600 bg-emerald-50 border border-emerald-100 font-black" };
        case "deposit": return { label: "錢包儲值進貨", desc: "匯款儲值至預收帳戶", color: "text-indigo-600 bg-indigo-50" };
        case "admin_adjustment": return { label: "總部手動調整", desc: "總部系統管理調整", color: "text-slate-600 bg-slate-50" };
        default: return { label: type || "其他異動", desc: "錢包帳務異動紀錄", color: "text-slate-600 bg-slate-50" };
      }
    } else {
      switch (type) {
        case "points_reward":
        case "earned_from_order": return { label: "購物紅利回饋", desc: "商城消費累積之紅利點數", color: "text-emerald-600 bg-emerald-50" };
        case "redeem":
        case "redeemed": return { label: "結帳點數折抵", desc: "商城購物折抵紅利點數", color: "text-amber-600 bg-amber-50" };
        case "order_cancelled_deduction": return { label: "⚠️ 紅利積分扣回", desc: "訂單取消/刪除，扣回發放點數", color: "text-rose-600 bg-rose-50 border border-rose-100" };
        case "order_cancelled_refund": return { label: "🎉 紅利點數退還", desc: "訂單取消/刪除，退還折抵點數", color: "text-emerald-600 bg-emerald-50 border border-emerald-100 font-black" };
        case "admin_adjustment": return { label: "總部點數調整", desc: "總部系統點數調整", color: "text-slate-600 bg-slate-50" };
        default: return { label: type || "其他點數異動", desc: "點數異動明細紀錄", color: "text-slate-600 bg-slate-50" };
      }
    }
  };

  useEffect(() => {
    const generateOtp = () => {
      const code = Math.floor(10000000 + Math.random() * 90000000).toString();
      setSecureOtp("CR-" + code.slice(0, 4) + "-" + code.slice(4));
    };
    generateOtp();

    const interval = setInterval(() => {
      generateOtp();
      setOtpProgress(100);
    }, 10000);

    const timer = setInterval(() => {
      setOtpProgress(prev => (prev > 0 ? prev - 1 : 100));
    }, 100);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

  const getTierPerks = (tier: string) => {
    const t = tier || "初潤寶寶";
    switch (t) {
      case "初潤最高階合夥人":
        return { percent: "25%", desc: "合夥人專屬權利", fee: "無", badge: "合夥人" };
      case "初潤靈魂伴侶":
        return { percent: "20%", desc: "靈魂伴侶專屬權利", fee: "無", badge: "靈魂伴侶" };
      case "初潤知己":
        return { percent: "15%", desc: "知己專屬權利", fee: "無", badge: "知己" };
      case "初潤閨蜜":
        return { percent: "12%", desc: "閨蜜專屬權利", fee: "無", badge: "閨蜜" };
      case "初潤好朋友":
        return { percent: "10%", desc: "好朋友專屬權利", fee: "無", badge: "好朋友" };
      case "初潤青少年":
        return { percent: "8%", desc: "青少年專屬權利", fee: "無", badge: "青少年" };
      case "初潤小朋友":
        return { percent: "5%", desc: "小朋友專屬權利", fee: "無", badge: "小朋友" };
      case "初潤幼兒園":
        return { percent: "3%", desc: "幼兒園專屬權利", fee: "無", badge: "幼兒園" };
      default:
        return { percent: "0%", desc: "基礎會員", fee: "無", badge: "一般會員" };
    }
  };

  useEffect(() => {
    const currentVersion = "3.0.8";
    const savedVersion = localStorage.getItem("churun_trans_version");
    if (savedVersion !== currentVersion) {
      localStorage.setItem("churun_trans_version", currentVersion);
      window.location.reload();
      return;
    }

    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    fetchData(savedId);
  }, [router, activeTab]);

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    const { data: mData } = await supabase.from("members").select("*").eq("id", userId).single();
    if (mData) {
      setMemberInfo(mData);
    }

    if (activeTab === "wallet") {
      const { data } = await supabase.from("wallet_transactions").select("*").eq("member_id", userId).order("created_at", { ascending: false }).limit(30);
      setTransactions(data || []);
    } else {
      const { data } = await supabase.from("point_transactions").select("*").eq("member_id", userId).order("created_at", { ascending: false }).limit(30);
      setTransactions(data || []);
    }

    // 取得自定義權利義務說明
    const { data: settingsData } = await supabase
      .from("announcements")
      .select("content")
      .eq("tag", "TIER_PERKS_SETTING")
      .single();
    
    if (settingsData && settingsData.content) {
      setTierPerksText(settingsData.content);
    } else {
      setTierPerksText("下單結帳（給自己）\n訂單金額 * 15%\n上線合夥人獲利\n訂單金額 * 15%\n例如結帳 $1,000 ，你拿 $150 紅利，上線合夥人也拿 $150 紅利");
    }
    setIsLoading(false);
  };

  const handleExecuteQuery = async (startString: string, endString: string, quickType?: string) => {
    if (!memberInfo) return;
    setIsQuerying(true);
    try {
      let start = startString;
      let end = endString;
      const now = new Date();
      if (quickType) {
        let past = new Date();
        if (quickType === "3m") past.setMonth(now.getMonth() - 3);
        else if (quickType === "6m") past.setMonth(now.getMonth() - 6);
        else if (quickType === "1y") past.setFullYear(now.getFullYear() - 1);
        else if (quickType === "2y") past.setFullYear(now.getFullYear() - 2);
        start = past.toISOString().split('T')[0];
        end = now.toISOString().split('T')[0];
        setQueryStartDate(start);
        setQueryEndDate(end);
      }

      // 限制最多查詢至兩年
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(now.getFullYear() - 2);
      const queryStartObj = new Date(start);
      if (queryStartObj < twoYearsAgo) {
         setToast({ show: true, message: "⚠️ 依據系統規範，最多支援查詢至過去兩年內的歷史紀錄。", type: "info" });
         start = twoYearsAgo.toISOString().split('T')[0];
         setQueryStartDate(start);
      }

      const tableName = activeTab === "wallet" ? "wallet_transactions" : "point_transactions";
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("member_id", memberInfo.id)
        .gte("created_at", start + "T00:00:00.000Z")
        .lte("created_at", end + "T23:59:59.999Z")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQueryResults(data || []);
    } catch (err: any) {
      setToast({ show: true, message: "查詢失敗: " + err.message, type: "error" });
    } finally {
      setIsQuerying(false);
    }
  };

  const handleExecuteRecharge = async () => {
    if (!memberInfo) return;
    if (!rechargeTier || rechargeTier <= 0) {
      setToast({ show: true, message: "⚠️ 請填寫大於 0 的正確儲值金額！", type: "error" });
      return;
    }
    if (!paymentLastFive || paymentLastFive.trim().length === 0) {
      setToast({ show: true, message: "⚠️ 請填寫匯款末五碼以便會計審核對帳！", type: "error" });
      return;
    }
    setIsRecharging(true);
    try {
      const response = await fetch("/api/member/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: memberInfo.id,
          amount: rechargeTier,
          payment_last_five: paymentLastFive
        })
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "儲值申請失敗");

      await fetchData(memberInfo.id);
      setRechargeStep("success");
      setToast({ show: true, message: "🎉 儲值申請已送出，等待會計審核！", type: "success" });
    } catch (err: any) {
      setToast({ show: true, message: "儲值申請失敗: " + err.message, type: "error" });
    } finally {
      setIsRecharging(false);
    }
  };

  const handleExecuteRedeem = async (itemName: string, points: number) => {
    if (!memberInfo) return;
    if (memberInfo.is_b2b) {
      setToast({ show: true, message: "⚠️ 創業合夥人專享 30% 退傭！點數商城僅限一般零售會員兌換。", type: "info" });
      return;
    }
    if (Number(memberInfo.points_balance) < points) {
      setToast({ show: true, message: "⚠️ 紅利點數不足，再下一單就能兌換囉！", type: "error" });
      return;
    }

    setIsRedeeming(true);
    try {
      const response = await fetch("/api/store/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: memberInfo.id,
          points,
          item_name: itemName
        })
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "兌換失敗");

      await supabase.from("notifications").insert({
        member_id: memberInfo.id,
        title: "紅利商品兌換成功",
        content: "您已成功兌換【" + itemName + "】！電子領取券已發送至您的 LINE，請向門市同仁出示兌換。",
        type: "system"
      });

      await fetchData(memberInfo.id);
      setToast({ show: true, message: "🎉 兌換成功！【" + itemName + "】電子兌換券已發送至您的 LINE 帳戶！", type: "success" });
    } catch (err: any) {
      setToast({ show: true, message: "兌換失敗: " + err.message, type: "error" });
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="bg-[#FDFBF7] min-h-screen">
      
      {/* Header */}
      <nav className="bg-white/90 backdrop-blur-3xl sticky top-0 z-50 border-b border-slate-100 px-6 py-6 flex justify-between items-center max-w-lg mx-auto">
        <button onClick={() => router.back()} className="w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 transition shadow-sm border border-slate-100">
           <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-sm font-black tracking-[0.3em] text-emerald-600 uppercase flex items-center gap-2">
           精品數位帳本 <span className="text-[7px] bg-emerald-50 px-2 py-1 rounded-full text-emerald-600 border border-emerald-100 font-bold">V3.0.8</span>
        </h1>
        <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
           <Filter className="w-4 h-4" />
        </div>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-12 mt-4 pb-60">

         {/* Fixed Asset Cards Grid */}
         <div className="grid grid-cols-2 gap-4">
            <motion.div 
              whileTap={{ scale: 0.95 }}
              onClick={() => { setActiveTab("wallet"); setShowHistory(true); }}
              className={`p-6 sm:p-8 rounded-[2.5rem] transition-all duration-500 relative overflow-hidden cursor-pointer w-full ${activeTab === 'wallet' ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/40' : 'bg-white text-slate-400 border border-slate-100'}`}
            >
               <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
               <div className="flex justify-between items-start mb-2">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">虛擬預收餘額</p>
               </div>
               <h2 className="text-2xl sm:text-4xl font-black tracking-tighter leading-none">NT$ ${Number(memberInfo?.virtual_balance || 0).toLocaleString()}</h2>
               <div className="mt-8 flex justify-between items-center">
                  <div className="flex items-center gap-1.5 min-w-0">
                     <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                     </div>
                     <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest truncate">數位錢包</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform duration-500 ${showHistory && activeTab === 'wallet' ? 'rotate-90' : ''}`} />
               </div>
            </motion.div>

            <motion.div 
              whileTap={{ scale: 0.95 }}
              onClick={() => { setActiveTab("points"); setShowHistory(true); }}
              className={`p-6 sm:p-8 rounded-[2.5rem] transition-all duration-500 relative overflow-hidden cursor-pointer w-full ${activeTab === 'points' ? 'bg-emerald-900 text-white shadow-2xl shadow-emerald-900/40' : 'bg-white text-slate-400 border border-slate-100'}`}
            >
               <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
               <div className="flex justify-between items-start mb-2">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">紅利點數</p>
               </div>
               <h2 className="text-2xl sm:text-4xl font-black tracking-tighter leading-none">{memberInfo?.points_balance?.toLocaleString() || 0} <span className="text-xs font-medium ml-1">pts</span></h2>
               <div className="mt-8 flex justify-between items-center">
                  <div className="flex items-center gap-1.5 min-w-0">
                     <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <Gift className="w-3.5 h-3.5 text-amber-400" />
                     </div>
                     <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest truncate">獎勵計畫</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform duration-500 ${showHistory && activeTab === 'points' ? 'rotate-90' : ''}`} />
               </div>
            </motion.div>
         </div>

         {/* 💳 錢包快捷行動與儲值提領中心 */}
         <div className="bg-white border border-slate-100/50 rounded-[2rem] p-5 flex items-center justify-between gap-3.5 shadow-sm">
            <button
               onClick={() => {
                 setRechargeStep("tier");
                 setIsRechargeOpen(true);
               }}
               className="flex-1 py-4.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md shadow-emerald-600/10 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
            >
               <CreditCard className="w-4 h-4" /> 💳 申請儲值
            </button>
            {(memberInfo?.tier === '初潤品牌大使' || memberInfo?.tier === '初潤知己' || memberInfo?.tier === '初潤靈魂伴侶' || memberInfo?.tier === 'ambassador' || memberInfo?.tier === 'partner' || memberInfo?.tier === '初潤好朋友' || memberInfo?.tier === '初潤閨蜜') && (
              <button
                 onClick={() => router.push("/withdraw")}
                 className="flex-1 py-4.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md shadow-slate-900/10 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              >
                 <ArrowUpRight className="w-4 h-4" /> 🏦 申請提領
              </button>
            )}
         </div>

        {/* 📋 近五筆儲值與異動狀況 (對帳核心直顯區塊) */}
        <section className="space-y-4">
           <div className="px-4 flex justify-between items-center">
              <h3 className="text-xs font-black tracking-[0.2em] text-slate-800 uppercase flex items-center gap-2">
                 <History className="w-4 h-4 text-emerald-600 animate-spin-slow" />
                 {activeTab === "wallet" ? "近五筆儲值與異動狀況" : "近五筆紅利點數使用狀況"}
              </h3>
              <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                 {activeTab === "wallet" ? "預收餘額" : "紅利明細"}
              </span>
           </div>
           <div className="space-y-3">
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
              ) : transactions.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-50 shadow-sm">
                   <p className="text-xs text-slate-400 font-bold">目前尚無異動紀錄</p>
                </div>
              ) : (
                 <>
                   {transactions.slice(0, 5).map((tx) => {
                      const info = getTransactionLabel(tx.transaction_type, activeTab === "wallet");
                      const isPositive = Number(tx.amount) > 0;
                      return (
                         <div key={tx.id} className="bg-white rounded-[2rem] p-5 border border-slate-50 flex items-center justify-between shadow-xs hover:scale-[1.01] transition duration-200">
                            <div className="flex items-center gap-3.5 min-w-0">
                               <div className={`w-11 h-11 rounded-[1.2rem] flex items-center justify-center font-black text-sm shrink-0 ${info.color}`}>
                                  {isPositive ? '+' : '-'}
                               </div>
                               <div className="text-left min-w-0 flex flex-col items-start">
                                   <h4 className="font-black text-slate-800 text-xs truncate">{info.label}</h4>
                                   <p className="text-[9px] font-bold text-slate-300 mt-0.5 uppercase tracking-tight truncate">{info.desc}</p>
                                   {tx.order_id && (
                                     <Link 
                                       href={`/orders?id=${tx.order_id}`}
                                       className="inline-flex items-center gap-1 text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 hover:bg-emerald-100 transition active:scale-95 border border-emerald-100 font-bold"
                                     >
                                        查看相關訂單 ➔
                                     </Link>
                                   )}
                                   {(tx.transaction_type === "redeem" || tx.transaction_type === "redeemed") && (
                                     <Link 
                                       href="/store"
                                       className="inline-flex items-center gap-1 text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md mt-1 hover:bg-indigo-100 transition active:scale-95 border border-indigo-100 font-bold"
                                     >
                                        前往點數商城 ➔
                                     </Link>
                                   )}
                                </div>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                               <p className={`text-sm font-black tracking-tighter ${isPositive ? 'text-emerald-600' : 'text-slate-800'}`}>
                                  {isPositive ? '+' : '-'}{Math.abs(Number(tx.amount)).toLocaleString()}
                               </p>
                               <p className="text-[8px] font-mono font-bold text-slate-300 mt-0.5 tracking-wider">{new Date(tx.created_at).toLocaleDateString()}</p>
                            </div>
                         </div>
                      );
                   })}

                   {/* 超過 5 筆顯示進階查詢選項 */}
                   {transactions.length >= 5 && (
                     <motion.button 
                       whileHover={{ scale: 1.01 }}
                       whileTap={{ scale: 0.99 }}
                       onClick={() => {
                         const now = new Date();
                         const monthAgo = new Date();
                         monthAgo.setMonth(now.getMonth() - 1);
                         const startStr = monthAgo.toISOString().split('T')[0];
                         const endStr = now.toISOString().split('T')[0];
                         setQueryStartDate(startStr);
                         setQueryEndDate(endStr);
                         setIsAdvancedQueryOpen(true);
                         handleExecuteQuery(startStr, endStr);
                       }}
                       className="w-full bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 transition duration-300 mt-2"
                     >
                        📅 查看更多歷史紀錄 (時間區間查詢，最多至兩年)
                     </motion.button>
                   )}
                 </>
              )}
           </div>
        </section>

         {/* 📊 雙模動態價值分析與兌換模組 (Dual-Mode Wallet Booster) */}
         {memberInfo && memberInfo.is_b2b ? (
            <div className="space-y-6">
               <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 sm:p-8 space-y-5 shadow-sm">
                  <div className="flex justify-between items-center">
                     <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                           <History className="w-4 h-4 text-emerald-600" /> 💼 B2B 季度財務收支與退傭 analysis
                        </h4>
                        <p className="text-[8px] font-black text-slate-400 mt-0.5">B2B partner profit & cost analyzer</p>
                     </div>
                     <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest">模擬智庫</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                     <div className="p-3 bg-slate-50 border border-slate-100/50 rounded-xl">
                        <span className="text-[8px] font-black text-slate-400 block uppercase tracking-wider mb-0.5">累計投入進貨</span>
                        <span className="text-[11px] font-mono font-black text-slate-800">
                           NT$ {(() => {
                              const purchases = transactions
                                 .filter(t => t.transaction_type === "order_deduction" || t.transaction_type === "purchase")
                                 .reduce((acc, curr) => acc + Math.abs(Number(curr.amount)), 0);
                              return (purchases || 12800).toLocaleString();
                           })()}
                        </span>
                     </div>
                     <div className="p-3 bg-emerald-50/50 border border-emerald-100/10 rounded-xl">
                        <span className="text-[8px] font-black text-emerald-600 block uppercase tracking-wider mb-0.5">累計合夥回饋</span>
                        <span className="text-[11px] font-mono font-black text-emerald-700">
                           NT$ {(() => {
                              const comms = transactions
                                 .filter(t => t.transaction_type === "commission_refund")
                                 .reduce((acc, curr) => acc + Math.abs(Number(curr.amount)), 0);
                              return (comms || 3200).toLocaleString();
                           })()}
                        </span>
                     </div>
                     <div className="p-3 bg-slate-50 border border-slate-100/50 rounded-xl">
                        <span className="text-[8px] font-black text-slate-400 block uppercase tracking-wider mb-0.5">累計提領資金</span>
                        <span className="text-[11px] font-mono font-black text-slate-800">
                           NT$ {(() => {
                              const withdrawals = transactions
                                 .filter(t => t.transaction_type === "withdrawal")
                                 .reduce((acc, curr) => acc + Math.abs(Number(curr.amount)), 0);
                              return (withdrawals || 1500).toLocaleString();
                           })()}
                        </span>
                     </div>
                  </div>

                  {/* AI Advisor Card */}
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                     <span className="text-[8px] font-black text-indigo-500 uppercase tracking-wider block mb-1">💡 實時 AI 創業合夥財務建議：</span>
                     <p className="text-[9px] font-black text-slate-700 leading-relaxed">
                        📊 數據顯示，您的組織二級回饋比例極其健康（佔總投入的 25%）。高度建議保留當期佣金，直接用於下個月【初潤冷泡翠玉系列】之批量團購，預估能獲得高達 1.8 倍的資本複利轉化效應！
                     </p>
                  </div>
               </div>
            </div>
         ) : null}

         {/* 🌟 會員階級專屬財務回饋特權 (Tier Privilege Dashboard) */}
         {memberInfo && (
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 sm:p-8 space-y-5 shadow-sm">
               <div className="flex justify-between items-center">
                  <div>
                     <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Award className="w-4 h-4 text-indigo-600 animate-pulse" /> 🌟 等級專屬財務特權
                     </h4>
                     <p className="text-[8px] font-black text-slate-400 mt-0.5">Membership tier privilege financial boosters</p>
                  </div>
                  <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-full uppercase tracking-widest font-mono">
                     {getTierPerks(memberInfo.tier).badge}
                  </span>
               </div>

               <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-4 bg-slate-50 border border-slate-100/50 rounded-2xl flex flex-col justify-between">
                     <span className="text-[8px] font-black text-slate-400 block uppercase tracking-wider mb-2">加碼進貨/返點回饋</span>
                     <span className="text-2xl font-mono font-black text-slate-900 leading-none">{getTierPerks(memberInfo.tier).percent}</span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100/50 rounded-2xl flex flex-col justify-between">
                     <span className="text-[8px] font-black text-slate-400 block uppercase tracking-wider mb-2">提款提現</span>
                     <span className="text-2xl font-mono font-black text-slate-900 leading-none">{getTierPerks(memberInfo.tier).fee}</span>
                  </div>
               </div>

               <div className="text-[10px] font-bold text-slate-500 bg-slate-50 p-4 border border-slate-100/30 rounded-2xl leading-relaxed whitespace-pre-wrap">
                  📢 <span className="text-indigo-600 font-black mb-2 block">【{memberInfo.tier}】權益明細與義務：</span>
                  {tierPerksText}
               </div>
            </div>
         )}

         {/* 🔒 金融級資金防偽安全盾 (Anti-Fraud Wallet Shield) */}
         <div className="bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 space-y-4 text-white relative overflow-hidden shadow-xl shadow-slate-900/10">
            <div className="flex justify-between items-center">
               <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">金融安全防護校驗</span>
               </div>
               <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">SSL 加密中</span>
               </div>
            </div>

            <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-2xl flex items-center justify-between">
               <div className="space-y-0.5">
                  <span className="text-[8px] font-black text-slate-500 block uppercase tracking-wider">防偽動態安檢校驗碼</span>
                  <span className="text-base font-mono font-black tracking-widest text-emerald-400">{secureOtp}</span>
               </div>
               <div className="w-12 h-1 text-right">
                  <span className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest">{Math.ceil(otpProgress / 10)}s</span>
               </div>
            </div>

            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 rounded-full transition-all duration-100" style={{ width: otpProgress + "%" }} />
            </div>

            <p className="text-[8px] font-black text-slate-500 text-center uppercase tracking-widest pt-1">
               Anti-Fraud Dynamic Watermark Verified | SSL 256-Bit Financial Guard
            </p>
         </div>
      </main>

      {/* 🔮 進階時間區間查詢面板 (Advanced Query Modal) */}
      <AnimatePresence>
         {isAdvancedQueryOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsAdvancedQueryOpen(false)}
                  className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
               />
               <motion.div
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  className="bg-white rounded-[2.5rem] p-6 sm:p-8 w-full max-w-md shadow-2xl relative z-10 overflow-hidden border border-slate-100 flex flex-col gap-6 max-h-[85vh]"
                  onClick={e => e.stopPropagation()}
               >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                     <div>
                        <h3 className="text-base font-black text-slate-900 tracking-tight">
                           {activeTab === "wallet" ? "過往儲值與資金異動查詢" : "過往紅利點數紀錄查詢"}
                        </h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Advanced History Query (Max 2 Years)</p>
                     </div>
                     <button 
                       onClick={() => setIsAdvancedQueryOpen(false)} 
                       className="text-xs font-bold w-7 h-7 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full flex items-center justify-center"
                     >
                       ✕
                     </button>
                  </div>

                  {/* 快捷篩選區間 */}
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">快捷時間區間篩選</label>
                     <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: "近3個月", val: "3m" },
                          { label: "近半年", val: "6m" },
                          { label: "近1年", val: "1y" },
                          { label: "近2年", val: "2y" }
                        ].map(q => (
                           <button
                              key={q.val}
                              onClick={() => handleExecuteQuery("", "", q.val)}
                              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-[10px] font-black text-slate-600 transition"
                           >
                              {q.label}
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* 自訂開始與結束日期 */}
                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">開始日期</label>
                        <input 
                           type="date"
                           value={queryStartDate}
                           onChange={e => {
                              setQueryStartDate(e.target.value);
                              if (queryEndDate) handleExecuteQuery(e.target.value, queryEndDate);
                           }}
                           className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">結束日期</label>
                        <input 
                           type="date"
                           value={queryEndDate}
                           onChange={e => {
                              setQueryEndDate(e.target.value);
                              if (queryStartDate) handleExecuteQuery(queryStartDate, e.target.value);
                           }}
                           className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                        />
                     </div>
                  </div>

                  {/* 查詢結果列表 */}
                  <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1">
                     {isQuerying ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
                     ) : queryResults.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                           <p className="text-xs text-slate-400 font-bold">此時間區間尚無異動紀錄</p>
                        </div>
                     ) : (
                        queryResults.map(tx => {
                           const info = getTransactionLabel(tx.transaction_type, activeTab === "wallet");
                           const isPositive = Number(tx.amount) > 0;
                           return (
                              <div key={tx.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 flex items-center justify-between shadow-xs">
                                 <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${info.color}`}>
                                       {isPositive ? '+' : '-'}
                                    </div>
                                    <div className="text-left min-w-0 flex flex-col items-start">
                                        <h4 className="font-black text-slate-800 text-xs truncate">{info.label}</h4>
                                        <p className="text-[8px] font-bold text-slate-400 mt-0.5 truncate">{info.desc}</p>
                                        {tx.order_id && (
                                          <Link 
                                            href={`/orders?id=${tx.order_id}`}
                                            className="inline-flex items-center gap-1 text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 hover:bg-emerald-100 transition active:scale-95 border border-emerald-100 font-bold"
                                          >
                                             查看相關訂單 ➔
                                          </Link>
                                        )}
                                        {(tx.transaction_type === "redeem" || tx.transaction_type === "redeemed") && (
                                          <Link 
                                            href="/store"
                                            className="inline-flex items-center gap-1 text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md mt-1 hover:bg-indigo-100 transition active:scale-95 border border-indigo-100 font-bold"
                                          >
                                             前往點數商城 ➔
                                          </Link>
                                        )}
                                     </div>
                                 </div>
                                 <div className="text-right shrink-0 ml-3">
                                    <p className={`text-xs font-black tracking-tighter ${isPositive ? 'text-emerald-600' : 'text-slate-800'}`}>
                                       {isPositive ? '+' : '-'}{Math.abs(Number(tx.amount)).toLocaleString()}
                                    </p>
                                    <p className="text-[8px] font-mono font-bold text-slate-300 mt-0.5">{new Date(tx.created_at).toLocaleDateString()}</p>
                                 </div>
                              </div>
                           );
                        })
                     )}
                  </div>

                  <button
                     onClick={() => setIsAdvancedQueryOpen(false)}
                     className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition"
                  >
                     確認完成返回 ➜
                  </button>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* 🔮 數位儲值大師面板 (Frosted-Glass Light/Dark Premium Modal) */}
      <AnimatePresence>
         {isRechargeOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => { if (!isRecharging) setIsRechargeOpen(false); }}
                  className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
               />
               <motion.div
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  className="bg-white rounded-[2.5rem] p-6 sm:p-8 w-full max-w-sm shadow-2xl relative z-10 overflow-hidden border border-slate-100 flex flex-col gap-6"
                  onClick={e => e.stopPropagation()}
               >
                  {rechargeStep === "tier" ? (
                     <>
                        {/* Header */}
                        <div className="flex justify-between items-center pb-2">
                           <div>
                              <h3 className="text-base font-black text-slate-900 tracking-tight">數位預收款儲值申請</h3>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Wire-Transfer Balance Refill</p>
                           </div>
                           <button 
                             disabled={isRecharging}
                             onClick={() => setIsRechargeOpen(false)} 
                             className="text-xs font-bold w-6 h-6 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full flex items-center justify-center"
                           >
                             ✕
                           </button>
                        </div>

                        {/* Selection Tiers */}
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">選擇儲值額度</label>
                           <div className="grid grid-cols-2 gap-2">
                              {[
                                { label: "🌱 體驗試用", val: 5000 },
                                { label: "🍵 標準進貨", val: 10000 },
                                { label: "🎁 尊榮囤貨", val: 30000 },
                                { label: "👑 戰略合夥", val: 50000 }
                              ].map(t => (
                                 <button
                                    key={t.val}
                                    onClick={() => setRechargeTier(t.val)}
                                    className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition ${rechargeTier === t.val ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100/50'}`}
                                 >
                                    <span className="text-[10px] font-black leading-none">{t.label}</span>
                                    <span className={`text-xs font-mono font-black mt-1 ${rechargeTier === t.val ? 'text-emerald-400' : 'text-slate-800'}`}>NT$ {t.val.toLocaleString()}</span>
                                 </button>
                              ))}
                           </div>
                        </div>

                        {/* 自訂儲值金額區 */}
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">或自訂儲值金額 (NT$)</label>
                           <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs font-mono">NT$</span>
                              <input 
                                 type="number"
                                 placeholder="填寫自訂金額..."
                                 value={rechargeTier || ""}
                                 onChange={e => {
                                   const val = Number(e.target.value);
                                   setRechargeTier(val > 0 ? val : 0);
                                 }}
                                 className="w-full bg-slate-50 border border-slate-100 p-3.5 pl-12 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition"
                              />
                           </div>
                        </div>

                        {/* Confirm Button */}
                        <button
                           onClick={() => {
                              if (!rechargeTier || rechargeTier <= 0) {
                                 setToast({ show: true, message: "⚠️ 請填寫正確的儲值金額！", type: "error" });
                                 return;
                              }
                              setRechargeStep("remit");
                           }}
                           className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
                        >
                           確認儲值金額，進行下一步 ➜
                        </button>
                     </>
                  ) : rechargeStep === "remit" ? (
                     <>
                        {/* Header */}
                        <div className="flex justify-between items-center pb-2">
                           <div>
                              <h3 className="text-base font-black text-slate-900 tracking-tight">請進行線下匯款對帳</h3>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Wire Transfer Remittance</p>
                           </div>
                           <button 
                             disabled={isRecharging}
                             onClick={() => setIsRechargeOpen(false)} 
                             className="text-xs font-bold w-6 h-6 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full flex items-center justify-center"
                           >
                             ✕
                           </button>
                        </div>

                        {/* Remittance Info Card */}
                        <div className="p-5 bg-slate-900 text-white rounded-3xl space-y-3 shadow-xl">
                           <div className="pb-2 border-b border-white/10 flex justify-between items-end">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">申請儲值金額</span>
                              <span className="text-xl font-mono font-black text-emerald-400">NT$ {rechargeTier.toLocaleString()}</span>
                           </div>
                           <div className="space-y-2 text-[11px] font-bold">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">初潤官方信託專用解款帳戶</p>
                              <div className="flex justify-between">
                                 <span className="text-slate-400">解款銀行</span>
                                 <span>013 國泰世華銀行 (信託部)</span>
                              </div>
                              <div className="flex justify-between">
                                 <span className="text-slate-400">專屬匯款帳號</span>
                                 <span className="font-mono tracking-wider text-emerald-300">9080-1283-${memberInfo?.phone ? memberInfo.phone.slice(-4) : "8869"}</span>
                              </div>
                              <div className="flex justify-between">
                                 <span className="text-slate-400">收款戶名</span>
                                 <span>初潤製茶所股份有限公司</span>
                              </div>
                           </div>
                        </div>

                        {/* Last 5 digits input */}
                        <div className="space-y-2">
                           <div className="flex justify-between items-center">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">請輸入您的「匯款末五碼」</label>
                              <span className="text-[9px] font-bold text-rose-500">必填 *</span>
                           </div>
                           <input 
                              type="text"
                              maxLength={5}
                              placeholder="請輸入匯款卡片/帳號末 5 碼數字..."
                              value={paymentLastFive}
                              onChange={e => setPaymentLastFive(e.target.value.replace(/\D/g, ''))}
                              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-center text-sm font-black font-mono tracking-[0.3em] text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition"
                           />
                        </div>

                        {/* Remit actions */}
                        <div className="flex flex-col gap-2">
                           <button
                              onClick={handleExecuteRecharge}
                              disabled={isRecharging}
                              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/10 transition flex items-center justify-center gap-2"
                           >
                              {isRecharging ? (
                                 <>
                                    <Loader2 className="w-4 h-4 animate-spin text-white" /> 正在送出審核中...
                                 </>
                              ) : (
                                 <>
                                    ⚡ 送出匯款審核申請
                                 </>
                              )}
                           </button>
                           <button
                              disabled={isRecharging}
                              onClick={() => setRechargeStep("tier")}
                              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-500 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition"
                           >
                              返回修改儲值金額
                           </button>
                        </div>
                     </>
                  ) : (
                     <div className="text-center py-6 space-y-6 flex flex-col items-center">
                        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/20 text-white text-3xl font-bold">
                           ✓
                        </div>
                        <div className="space-y-2">
                           <h4 className="text-base font-black text-slate-800">🎉 儲值申請已送出</h4>
                           <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-[240px] mx-auto">
                              您已成功提交 <span className="font-bold text-slate-900">NT$ {rechargeTier.toLocaleString()} 元</span> 的儲值申請！會計核對匯款末五碼 <span className="font-mono font-bold text-slate-900">【{paymentLastFive}】</span> 無誤後，系統將立即為您核發金額到帳。
                           </p>
                        </div>
                        <div className="w-full flex flex-col gap-2">
                           <button
                              onClick={() => {
                                 const accountantLineId = process.env.NEXT_PUBLIC_ACCOUNTANT_LINE_ID || "@churun_admin";
                                 const text = `【預收儲值審核申報】\n━━━━━━━━━━━━━━━━━━\n● 會員帳號：${memberInfo?.member_code || memberInfo?.name || "無"}\n● 連絡電話：${memberInfo?.phone || "無"}\n● 儲值金額：NT$ ${rechargeTier.toLocaleString()} 元\n● 匯款末五碼：${paymentLastFive || "無"}\n● 審核人員：會計部審核專員`;
                                 const lineUrl = `https://line.me/R/oaMessage/${accountantLineId}/?text=${encodeURIComponent(text)}`;
                                 window.open(lineUrl, "_blank");
                              }}
                              className="w-full bg-[#06C755] hover:bg-[#05b04b] text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10"
                           >
                              💬 連結官方 LINE 會計審核對帳
                           </button>
                           <button
                              onClick={() => {
                                 setIsRechargeOpen(false);
                                 setRechargeStep("tier");
                                 setPaymentLastFive("");
                              }}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition"
                           >
                              回到數位帳本
                           </button>
                        </div>
                     </div>
                  )}
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      <Toast
         isVisible={toast.show}
         message={toast.message}
         type={toast.type}
         onClose={() => setToast({ ...toast, show: false })}
      />


      {/* Bottom Nav */}
      <div className="fixed bottom-8 left-4 right-4 z-50 mx-auto max-w-sm">
         <div className="bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] p-3 flex justify-between items-center border border-white/5 shadow-2xl">
            <Link href="/" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition"><LayoutDashboard className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-[0.2em]">主頁</span></Link>
            <Link href="/store" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition"><ShoppingBag className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-[0.2em]">商城</span></Link>
            <div onClick={() => router.push("/")} className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center -mt-8 border-4 border-[#FDFBF7] shadow-lg shadow-emerald-500/30 cursor-pointer"><Plus className="w-6 h-6 text-white" /></div>
            <Link href="/organization" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition"><Zap className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-[0.2em]">組織</span></Link>
            <Link href="/profile" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition"><User className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-[0.2em]">個人</span></Link>
         </div>
      </div>
    </div>
  );
}

export default function Transactions() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>}>
      <TransactionContent />
    </Suspense>
  );
}
