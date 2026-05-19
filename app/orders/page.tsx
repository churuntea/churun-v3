"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, 
  ChevronRight, 
  ArrowLeft, 
  Loader2, 
  Clock, 
  CheckCircle2, 
  Truck,
  ShoppingBag,
  FileText
} from "lucide-react";

const CARRIERS = [
  { name: "黑貓宅急便", url: (num: string) => `https://www.t-cat.com.tw/Inquire/TraceDetail.aspx?Sn=${num}` },
  { name: "新竹物流", url: (num: string) => `https://www.hct.com.tw/Search/Search_Query.aspx?stype=1&search_no=${num}` },
  { name: "大榮貨運", url: (num: string) => `https://www.kerrytj.com/ZH/search/search.aspx?gnum=${num}` },
  { name: "中華郵政", url: (num: string) => `https://postserv.post.gov.tw/pstmail/seek_result.jsp?q_mail_no=${num}` },
  { name: "7-11 交貨便", url: (num: string) => `https://eservice.7-11.com.tw/e-tracking/search.aspx?type=1&sn=${num}` },
  { name: "全家 店到店", url: (num: string) => `https://www.famiport.com.tw/Web_Famiport/page/process.aspx?item=${num}` },
  { name: "門市自取 / 自家配送", url: null }
];

const TAIWAN_BANKS = [
  { code: "004", name: "臺灣銀行" },
  { code: "005", name: "土地銀行" },
  { code: "006", name: "合作金庫" },
  { code: "007", name: "第一銀行" },
  { code: "008", name: "華南銀行" },
  { code: "009", name: "彰化銀行" },
  { code: "011", name: "上海商業儲蓄銀行" },
  { code: "012", name: "台北富邦銀行" },
  { code: "013", name: "國泰世華銀行" },
  { code: "017", name: "兆豐國際商業銀行" },
  { code: "018", name: "臺灣企銀" },
  { code: "048", name: "王道商業銀行" },
  { code: "052", name: "渣打銀行" },
  { code: "053", name: "台中銀行" },
  { code: "054", name: "京城銀行" },
  { code: "081", name: "匯豐台灣" },
  { code: "102", name: "華泰銀行" },
  { code: "103", name: "新光銀行" },
  { code: "108", name: "陽信銀行" },
  { code: "118", name: "板信商業銀行" },
  { code: "147", name: "三信商業銀行" },
  { code: "700", name: "中華郵政" },
  { code: "803", name: "聯邦商業銀行" },
  { code: "805", name: "遠東國際商業銀行" },
  { code: "806", name: "元大商業銀行" },
  { code: "807", name: "永豐商業銀行" },
  { code: "808", name: "玉山商業銀行" },
  { code: "809", name: "凱基商業銀行" },
  { code: "812", name: "台新國際商業銀行" },
  { code: "822", name: "中國信託商業銀行" },
  { code: "823", name: "將來商業銀行" },
  { code: "824", name: "樂天國際商業銀行" },
  { code: "826", name: "LINE Bank 連線商業銀行" }
];

const getCarrierTrackingInfo = (trackingStr: string) => {
  if (!trackingStr) return { carrierName: "黑貓宅急便", trackingNum: "" };
  if (trackingStr.includes(": ")) {
    const parts = trackingStr.split(": ");
    return { carrierName: parts[0], trackingNum: parts[1] };
  }
  return { carrierName: "黑貓宅急便", trackingNum: trackingStr };
};

const handleOpenTrackingLink = (trackingStr: string) => {
  const { carrierName, trackingNum } = getCarrierTrackingInfo(trackingStr);
  if (!trackingNum) return;
  const carrier = CARRIERS.find(c => c.name === carrierName);
  if (carrier && carrier.url) {
    window.open(carrier.url(trackingNum), "_blank");
  } else {
    alert("自取或此物流不支援線上軌跡查詢");
  }
};

function OrderSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
       {[1,2,3].map(i => (
         <div key={i} className="bg-white rounded-[2.5rem] p-8 border border-slate-50 space-y-6">
            <div className="flex justify-between">
               <div className="w-20 h-4 bg-slate-100 rounded-full"></div>
               <div className="w-16 h-6 bg-slate-100 rounded-lg"></div>
            </div>
            <div className="w-full h-2 bg-slate-50 rounded-full"></div>
            <div className="flex justify-between">
               <div className="w-24 h-3 bg-slate-50 rounded"></div>
               <div className="w-12 h-3 bg-slate-50 rounded"></div>
            </div>
         </div>
       ))}
    </div>
  );
}

function OrdersContent() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});
  const [loadingItems, setLoadingItems] = useState<string | null>(null);
  const [remittanceInputs, setRemittanceInputs] = useState<Record<string, string>>({});
  const [remitterNames, setRemitterNames] = useState<Record<string, string>>({});
  const [remitterBanks, setRemitterBanks] = useState<Record<string, string>>({});
  const [isEditingRemittance, setIsEditingRemittance] = useState<Record<string, boolean>>({});
  const [activeBankFocus, setActiveBankFocus] = useState<Record<string, boolean>>({});
  const [memberProfileInfo, setMemberProfileInfo] = useState<{ name: string; bankName: string; lastFive: string } | null>(null);

  // 常用匯款帳號簿狀態
  const [showBankBookModal, setShowBankBookModal] = useState(false);
  const [selectedOrderIdForBankBook, setSelectedOrderIdForBankBook] = useState<string | null>(null);
  const [savedBanks, setSavedBanks] = useState<any[]>([]);
  
  // 新增常用帳號表單狀態
  const [newBankAlias, setNewBankAlias] = useState("");
  const [newBankName, setNewBankName] = useState("");
  const [newBankLastFive, setNewBankLastFive] = useState("");
  const [newBankSearchText, setNewBankSearchText] = useState("");
  const [showNewBankForm, setShowNewBankForm] = useState(false);
  const [newBankFocus, setNewBankFocus] = useState(false);

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    fetchOrders(savedId);

    // 載入常用帳號
    try {
      const saved = localStorage.getItem("churun_saved_banks");
      if (saved) {
        setSavedBanks(JSON.parse(saved));
      }
    } catch (e) {
      console.error("載入常用帳號失敗:", e);
    }
  }, [router]);

  const fetchOrders = async (userId: string) => {
    setIsLoading(true);

    // 取得會員綁定的銀行與姓名資訊
    let memberName = localStorage.getItem("churun_member_name") || "";
    let memberBankName = "";
    let memberLastFive = "";

    try {
      const { data: member } = await supabase
        .from("members")
        .select("name, bank_code, bank_account")
        .eq("id", userId)
        .single();
      if (member) {
        if (member.name) memberName = member.name;
        if (member.bank_code) {
          const found = TAIWAN_BANKS.find(b => b.code === member.bank_code);
          memberBankName = found ? found.name : member.bank_code;
        }
        if (member.bank_account) {
          memberLastFive = member.bank_account.slice(-5);
        }
      }
    } catch (err) {
      console.error("抓取會員綁定資料失敗:", err);
    }

    setMemberProfileInfo({ name: memberName, bankName: memberBankName, lastFive: memberLastFive });

    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("member_id", userId)
      .order("created_at", { ascending: false });
    
    // 支援解讀備份在 custom_logo_url 的 JSON 欄位（以解決資料庫未更新到最新欄位時的容錯）
    const processed = (data || []).map((order: any) => {
      if (order.custom_logo_url && order.custom_logo_url.startsWith('FALLBACK_JSON:')) {
        try {
          const fallbackData = JSON.parse(order.custom_logo_url.substring('FALLBACK_JSON:'.length));
          return {
            ...order,
            ...fallbackData
          };
        } catch (e) {
          console.error("解析備份 JSON 欄位失敗:", e);
        }
      }
      return order;
    });

    setOrders(processed);

    // 預設匯款人姓名、銀行與末五碼為會員資料
    const defaultNames: Record<string, string> = {};
    const defaultBanks: Record<string, string> = {};
    const defaultLastFives: Record<string, string> = {};

    processed.forEach((order: any) => {
      if (!order.remitter_name && memberName) {
        defaultNames[order.id] = memberName;
      }
      if (!order.remitter_bank && memberBankName) {
        defaultBanks[order.id] = memberBankName;
      }
      if (!order.payment_last_five && memberLastFive) {
        defaultLastFives[order.id] = memberLastFive;
      }
    });

    if (Object.keys(defaultNames).length > 0) {
      setRemitterNames(prev => ({ ...defaultNames, ...prev }));
    }
    if (Object.keys(defaultBanks).length > 0) {
      setRemitterBanks(prev => ({ ...defaultBanks, ...prev }));
    }
    if (Object.keys(defaultLastFives).length > 0) {
      setRemittanceInputs(prev => ({ ...defaultLastFives, ...prev }));
    }

    setIsLoading(false);
  };

  const handleSaveBank = () => {
    if (!newBankAlias.trim()) { alert("請輸入常用帳號名稱 (例如：我的富邦)"); return; }
    if (!newBankName.trim()) { alert("請輸入匯款人姓名"); return; }
    if (!newBankSearchText.trim()) { alert("請選擇或輸入匯款銀行"); return; }
    if (!newBankLastFive.trim() || newBankLastFive.length !== 5) { alert("請輸入正確的 5 碼帳號末五碼"); return; }

    const newAcc = {
      id: Date.now().toString(),
      alias: newBankAlias.trim(),
      name: newBankName.trim(),
      bank: newBankSearchText.trim(),
      lastFive: newBankLastFive.trim()
    };

    const updated = [newAcc, ...savedBanks];
    setSavedBanks(updated);
    localStorage.setItem("churun_saved_banks", JSON.stringify(updated));

    // 自動套用到當前正在操作的訂單
    if (selectedOrderIdForBankBook) {
      setRemitterNames(prev => ({ ...prev, [selectedOrderIdForBankBook]: newAcc.name }));
      setRemitterBanks(prev => ({ ...prev, [selectedOrderIdForBankBook]: newAcc.bank }));
      setRemittanceInputs(prev => ({ ...prev, [selectedOrderIdForBankBook]: newAcc.lastFive }));
    }

    // 重設表單
    setNewBankAlias("");
    setNewBankName("");
    setNewBankSearchText("");
    setNewBankLastFive("");
    setShowNewBankForm(false);
    setShowBankBookModal(false);
    alert("✅ 成功儲存常用帳號並已自動套用到欄位中！");
  };

  const handleDeleteBank = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("確定要刪除此常用帳號嗎？")) return;
    const updated = savedBanks.filter(b => b.id !== id);
    setSavedBanks(updated);
    localStorage.setItem("churun_saved_banks", JSON.stringify(updated));
  };

  const handleSelectBank = (bankInfo: { name: string; bank: string; lastFive: string }) => {
    if (selectedOrderIdForBankBook) {
      setRemitterNames(prev => ({ ...prev, [selectedOrderIdForBankBook]: bankInfo.name }));
      setRemitterBanks(prev => ({ ...prev, [selectedOrderIdForBankBook]: bankInfo.bank }));
      setRemittanceInputs(prev => ({ ...prev, [selectedOrderIdForBankBook]: bankInfo.lastFive }));
    }
    setShowBankBookModal(false);
  };
  const fetchOrderItems = async (orderId: string) => {
    if (orderItems[orderId]) {
      setExpandedOrder(expandedOrder === orderId ? null : orderId);
      return;
    }
    
    setLoadingItems(orderId);
    const { data } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);
    
    if (data) {
      setOrderItems(prev => ({ ...prev, [orderId]: data }));
    }
    setExpandedOrder(orderId);
    setLoadingItems(null);
  };

  const handleUpdatePaymentLastFive = async (orderId: string, lastFive: string, remitterName: string, remitterBank: string) => {
    if (!remitterName || !remitterBank || !lastFive || lastFive.length !== 5) {
      alert("請完整填寫匯款人姓名、匯款銀行與 5 碼帳號末碼");
      return;
    }
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, lastFive, remitterName, remitterBank })
      });
      const data = await res.json();
      
      if (data.success) {
        alert("匯款資訊回報成功！我們將會盡速為您核對對帳。");
        const savedId = localStorage.getItem("churun_member_id");
        if (savedId) await fetchOrders(savedId);
        setIsEditingRemittance(prev => ({ ...prev, [orderId]: false }));
      } else {
        console.error("Remittance API returned failure:", data.error);
        alert("提交對帳失敗：" + (data.error || "請重試"));
      }
    } catch (err) {
      console.error("Failed to submit remittance code:", err);
      alert("提交對帳失敗，請重試");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === "all") return true;
    if (activeTab === "processing") return order.status !== "cancelled" && order.fulfillment_status !== "shipped";
    if (activeTab === "shipped") return order.fulfillment_status === "shipped" && order.status !== "completed";
    if (activeTab === "completed") return order.status === "completed";
    return order.status === activeTab;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500 text-white shadow-emerald-500/20';
      case 'pending': return 'bg-amber-500 text-white shadow-amber-500/20';
      case 'paid': return 'bg-blue-500 text-white shadow-blue-500/20';
      case 'shipping': return 'bg-indigo-500 text-white shadow-indigo-500/20';
      default: return 'bg-slate-400 text-white shadow-slate-400/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '訂單已完成';
      case 'pending': return '待核對/待處理';
      case 'paid': return '已付款/備貨中';
      case 'shipping': return '商品已發貨';
      case 'cancelled': return '已取消';
      default: return status || '已取消';
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      
      {/* Header */}
      <nav className="bg-[#FDFBF7]/80 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-100 px-8 py-6 flex items-center gap-6 max-w-lg mx-auto">
         <Link href="/profile" className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition">
            <ArrowLeft className="w-5 h-5" />
         </Link>
         <h1 className="text-xs font-black tracking-[0.3em] text-slate-800 uppercase">我的訂單中心</h1>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-8 mt-4">
         
         {/* Status Tabs */}
         <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {[
              { id: "all", label: "全部" },
              { id: "processing", label: "待處理" },
              { id: "shipped", label: "運送中" },
              { id: "completed", label: "已完成" }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                  activeTab === tab.id ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'bg-white text-slate-400 border border-slate-50'
                }`}
              >
                 {tab.label}
              </button>
            ))}
         </div>
        
         {isLoading ? <OrderSkeleton /> : (
           filteredOrders.length === 0 ? (
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-white rounded-[3.5rem] p-20 text-center border border-slate-100 shadow-sm"
             >
                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-slate-200">
                   <Package className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">查無相關訂單</h3>
                <p className="text-xs text-slate-400 mt-4 leading-relaxed font-medium">看來您還沒有這個分類的訂單紀錄。<br />立即去商城逛逛吧！</p>
                <Link href="/store" className="mt-12 inline-block bg-emerald-900 text-white px-10 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-900/20 active:scale-95 transition">
                   前往精品商城
                </Link>
             </motion.div>
           ) : (
             <div className="space-y-6">
                {filteredOrders.map((order, i) => {
                  const bankQuery = (remitterBanks[order.id] || "").trim();
                  const filteredBanks = bankQuery ? TAIWAN_BANKS.filter(
                    b => b.name.includes(bankQuery) || b.code.includes(bankQuery)
                  ) : [];

                  return (
                    <motion.div 
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white rounded-[3rem] p-8 border border-slate-50 shadow-[0_15px_40px_rgba(0,0,0,0.02)] space-y-6 group hover:border-emerald-100 transition-all duration-500"
                    >
                     <div className="flex justify-between items-start">
                        <div className="space-y-3">
                           <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-lg ${getStatusStyle(order.status)}`}>
                              {getStatusLabel(order.status)}
                           </div>
                           <h4 
                             onClick={() => fetchOrderItems(order.id)}
                             className="text-[10px] font-black text-slate-400 hover:text-slate-900 cursor-pointer transition uppercase tracking-[0.15em]"
                             title="點擊查詢訂單詳情"
                           >
                              {order.order_number ? `編號: ${order.order_number}` : `ID: ${order.id.slice(-8).toUpperCase()}`}
                              <span className="text-[7px] px-1 bg-slate-100 text-slate-500 rounded ml-1 font-bold">點擊查詢</span>
                           </h4>
                        </div>
                        <div className="text-right">
                           <p className="text-2xl font-black text-slate-800 tracking-tighter">${Number(order.total_amount).toLocaleString()}</p>
                           {order.status === 'cancelled' ? (
                              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1 block">訂單已取消</span>
                           ) : order.status === 'pending' ? (
                              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1 block">⏳ 對帳審核中</span>
                           ) : (
                              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1 block">
                                 {Number(order.b2b_commission || 0) > 0 ? (
                                    `分紅返還 +NT$ ${Number(order.b2b_commission).toLocaleString()}`
                                 ) : (
                                    `獲得積分 +${Number(order.reward_points || Math.floor(order.total_amount / 100)).toLocaleString()} P`
                                 )}
                              </span>
                           )}
                        </div>
                     </div>

                     <div className="space-y-3">
                        <div className="flex justify-between text-[8px] font-black tracking-widest text-slate-300">
                           <span className={order.status !== 'cancelled' ? 'text-emerald-600 font-extrabold' : ''}>下單成功</span>
                           <span className={order.fulfillment_status === 'shipped' ? 'text-indigo-600 font-extrabold' : ''}>包裹配送中</span>
                           <span className={(order.status === 'completed' && order.fulfillment_status === 'shipped') ? 'text-emerald-700 font-extrabold' : ''}>簽收完成</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden flex gap-1">
                           <div className={`h-full rounded-full transition-all duration-1000 ${order.status !== 'cancelled' ? 'bg-emerald-500 w-1/3' : 'bg-slate-100 w-1/3'}`}></div>
                           <div className={`h-full rounded-full transition-all duration-1000 ${order.fulfillment_status === 'shipped' ? 'bg-indigo-500 w-1/3' : 'bg-slate-100 w-1/3'}`}></div>
                           <div className={`h-full rounded-full transition-all duration-1000 ${(order.status === 'completed' && order.fulfillment_status === 'shipped') ? 'bg-emerald-600 w-1/3' : 'bg-slate-100 w-1/3'}`}></div>
                        </div>
                     </div>

                     {order.fulfillment_status === 'shipped' && order.tracking_number && (
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between gap-3 mt-4">
                           <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                                 <Truck className="w-5 h-5 animate-bounce" />
                              </div>
                              <div>
                                 <p className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">包裹已發貨 ➔ {getCarrierTrackingInfo(order.tracking_number).carrierName}</p>
                                 <p className="text-xs font-mono font-bold text-slate-600 mt-0.5">{getCarrierTrackingInfo(order.tracking_number).trackingNum}</p>
                              </div>
                           </div>
                           <button 
                             onClick={() => handleOpenTrackingLink(order.tracking_number)}
                             className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition shadow-md shadow-indigo-600/10 flex items-center gap-1.5"
                           >
                              追蹤包裹 ➔
                           </button>
                        </div>
                     )}

                     {order.status === 'pending' && (
                        <div className="bg-amber-50/30 border border-amber-100/70 rounded-2xl p-4 mt-4 space-y-3 text-left">
                           {order.payment_last_five && !isEditingRemittance[order.id] ? (
                              <div className="flex items-start justify-between gap-4">
                                 <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center text-sm font-black mt-0.5 shrink-0">
                                       ⏳
                                    </div>
                                    <div>
                                       <p className="text-[10px] font-black text-amber-700 tracking-wider">已回報匯款對帳資訊</p>
                                       <div className="text-xs font-black text-slate-700 mt-1.5 space-y-1">
                                          <p>👤 匯款姓名：{order.remitter_name || "未填寫"}</p>
                                          <p>🏦 匯款銀行：{order.remitter_bank || "未填寫"}</p>
                                          <p>🔢 帳號末五碼：<span className="font-mono text-emerald-700">{order.payment_last_five}</span></p>
                                       </div>
                                    </div>
                                 </div>
                                  <div className="flex flex-col items-end gap-2 shrink-0">
                                     <button 
                                       onClick={() => {
                                         setRemittanceInputs(prev => ({ ...prev, [order.id]: order.payment_last_five || memberProfileInfo?.lastFive || "" }));
                                         setRemitterNames(prev => ({ ...prev, [order.id]: order.remitter_name || memberProfileInfo?.name || localStorage.getItem("churun_member_name") || "" }));
                                         setRemitterBanks(prev => ({ ...prev, [order.id]: order.remitter_bank || memberProfileInfo?.bankName || "" }));
                                         setIsEditingRemittance(prev => ({ ...prev, [order.id]: true }));
                                       }}
                                       className="text-amber-600 hover:text-amber-700 text-[10px] font-black tracking-widest transition uppercase"
                                     >
                                        修改資訊
                                     </button>
                                     <button 
                                       onClick={() => {
                                         setSelectedOrderIdForBankBook(order.id);
                                         setShowBankBookModal(true);
                                       }}
                                       className="text-slate-400 hover:text-slate-600 text-[9px] font-bold tracking-wider transition flex items-center gap-1"
                                     >
                                        🏦 常用帳號
                                     </button>
                                  </div>
                               </div>
                            ) : (
                               <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                     <p className="text-[10px] font-black text-amber-700 tracking-wider">請回報匯款資訊以供對帳</p>
                                     <button 
                                       type="button"
                                       onClick={() => {
                                         setSelectedOrderIdForBankBook(order.id);
                                         setShowBankBookModal(true);
                                       }}
                                       className="text-[9px] font-black text-amber-700 hover:text-amber-800 bg-amber-100/60 hover:bg-amber-200/80 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 shadow-sm"
                                     >
                                       🏦 選擇常用帳號
                                     </button>
                                  </div>
                                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    <div>
                                      <label className="text-[9px] font-bold text-slate-500 mb-1 block">匯款人姓名</label>
                                      <input 
                                        type="text" 
                                        placeholder="例：陳小明"
                                        value={remitterNames[order.id] || ""}
                                        onChange={e => setRemitterNames(prev => ({ ...prev, [order.id]: e.target.value }))}
                                        className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-slate-300"
                                      />
                                    </div>
                                    <div className="relative">
                                      <label className="text-[9px] font-bold text-slate-500 mb-1 block">匯款銀行名稱</label>
                                      <input 
                                        type="text" 
                                        placeholder="例：國泰世華"
                                        value={remitterBanks[order.id] || ""}
                                        onChange={e => setRemitterBanks(prev => ({ ...prev, [order.id]: e.target.value }))}
                                        onFocus={() => setActiveBankFocus(prev => ({ ...prev, [order.id]: true }))}
                                        onBlur={() => setTimeout(() => setActiveBankFocus(prev => ({ ...prev, [order.id]: false })), 200)}
                                        className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-slate-300"
                                      />
                                      {activeBankFocus[order.id] && filteredBanks.length > 0 && (
                                        <div className="absolute left-0 right-0 z-50 mt-1 max-h-40 overflow-y-auto bg-white border border-slate-100 rounded-xl shadow-xl divide-y divide-slate-50">
                                          {filteredBanks.map(bank => (
                                            <button
                                              key={bank.code}
                                              type="button"
                                              onClick={() => {
                                                setRemitterBanks(prev => ({ ...prev, [order.id]: bank.name }));
                                              }}
                                              className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition font-bold"
                                            >
                                              <span className="font-mono text-slate-400 mr-2">[{bank.code}]</span>
                                              {bank.name}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-bold text-slate-500 mb-1 block">帳號末五碼</label>
                                      <input 
                                        type="text" 
                                        maxLength={5}
                                        placeholder="例：12345"
                                        value={remittanceInputs[order.id] || ""}
                                        onChange={e => {
                                          const cleanVal = e.target.value.replace(/\D/g, "");
                                          setRemittanceInputs(prev => ({ ...prev, [order.id]: cleanVal }));
                                        }}
                                        className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-slate-300 font-mono"
                                      />
                                    </div>
                                 </div>
                                 <div className="flex justify-end pt-1">
                                    <button 
                                      onClick={() => handleUpdatePaymentLastFive(order.id, remittanceInputs[order.id] || "", remitterNames[order.id] || "", remitterBanks[order.id] || "")}
                                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition shadow-lg shadow-amber-500/10 flex items-center gap-1"
                                    >
                                       送出對帳 ✓
                                    </button>
                                 </div>
                              </div>
                           )}
                        </div>
                     )}

                      {/* Expanded Items */}
                      <AnimatePresence>
                        {expandedOrder === order.id && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                             <div className="pt-6 space-y-4">
                                {orderItems[order.id]?.map((item: any) => (
                                  <div key={item.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                     <div className="flex flex-col gap-1">
                                        <span className="text-sm font-black text-slate-800">{item.name}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">數量: {item.quantity}</span>
                                     </div>
                                     <span className="text-sm font-black text-slate-900">${Number(item.price * item.quantity).toLocaleString()}</span>
                                  </div>
                                ))}

                                {order.original_amount > order.total_amount && (
                                   <div className="flex justify-between items-center bg-rose-50/50 p-4 rounded-2xl border border-rose-100 text-rose-600 mt-2">
                                      <div className="flex flex-col gap-1">
                                         <span className="text-sm font-black">優惠折抵</span>
                                         <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400">折扣碼優惠</span>
                                      </div>
                                      <span className="text-sm font-black">-${Number(order.original_amount - order.total_amount).toLocaleString()}</span>
                                   </div>
                                )}

                                {order.shipping_info && (
                                   <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mt-4 space-y-2 text-left">
                                      <span className="text-[8px] font-black uppercase text-emerald-700 tracking-[0.2em] block">📦 物流配送資訊</span>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px] font-bold text-slate-600 border-t border-slate-100/50">
                                         <p>👤 收件姓名：<span className="text-slate-800">{order.shipping_info.name}</span></p>
                                         <p>📞 聯絡電話：<span className="text-slate-800">{order.shipping_info.phone}</span></p>
                                         <p className="sm:col-span-2">📍 配送地址：<span className="text-slate-800">{order.shipping_info.address}</span></p>
                                         <p className="sm:col-span-2">🚚 物流方式：<span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[9px] inline-block mt-0.5">{order.shipping_info.method || "宅配到府"}</span></p>
                                      </div>
                                      {order.shipping_info.senderName && (
                                          <div className="text-[11px] font-bold text-slate-600 mt-2 pt-2 border-t border-slate-200/50 space-y-1">
                                             <p>👤 寄件姓名：<span className="text-slate-800">{order.shipping_info.senderName}</span></p>
                                             {order.shipping_info.senderPhone && <p>📞 寄件電話：<span className="text-slate-800">{order.shipping_info.senderPhone}</span></p>}
                                             {order.shipping_info.senderAddress && <p>📍 寄件地址：<span className="text-slate-800">{order.shipping_info.senderAddress}</span></p>}
                                             {order.shipping_info.senderNotes && <p className="text-rose-600">💬 寄件備註：<span className="font-extrabold">{order.shipping_info.senderNotes}</span></p>}
                                          </div>
                                       )}
                                       {order.notes && (
                                         <p className="text-[11px] font-black text-slate-500 mt-2 pt-2 border-t border-dashed border-slate-200">
                                            💬 買家備註：<span className="font-medium text-slate-600">{order.notes}</span>
                                         </p>
                                      )}
                                   </div>
                                )}
                             </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                         <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-slate-300" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                               {new Date(order.created_at).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                         </div>
                         <div className="flex items-center gap-2">
                            {order.status !== 'cancelled' && (
                               <a 
                                 href="https://line.me/R/ti/p/@947vpgjp" 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-1"
                               >
                                  💬 聯絡出貨
                               </a>
                            )}
                            <button 
                              onClick={() => fetchOrderItems(order.id)}
                              className="bg-slate-50 text-slate-900 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-900 hover:text-white transition flex items-center gap-2"
                            >
                               {loadingItems === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : expandedOrder === order.id ? "收起詳情" : "訂單詳情"} 
                               <ChevronRight className={`w-4 h-4 transition-transform ${expandedOrder === order.id ? 'rotate-90' : ''}`} />
                            </button>
                         </div>
                      </div>
                    </motion.div>
                  );
                })}
             </div>
           )
         )}

      {/* 常用銀行帳號選擇 Modal */}
      <AnimatePresence>
        {showBankBookModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={() => setShowBankBookModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-slate-900 p-6 text-white shrink-0 relative">
                <h3 className="text-base font-black tracking-wider flex items-center gap-2">🏦 常用匯款帳號簿</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Saved Remittance Accounts</p>
                <button
                  onClick={() => setShowBankBookModal(false)}
                  className="absolute right-5 top-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1 min-h-0">
                {/* 🌟 預設綁定帳號 */}
                {memberProfileInfo && (
                  <div className="bg-emerald-50/40 border border-emerald-900/10 rounded-2xl p-4 text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-emerald-900 text-white text-[8px] font-black tracking-wider px-2.5 py-1 rounded-bl-xl uppercase">
                      🌟 預設綁定
                    </div>
                    <p className="text-[10px] font-black text-emerald-800 tracking-wider">會員註冊綁定帳號</p>
                    <div className="mt-2.5 space-y-1 text-xs font-bold text-slate-650">
                      <p>👤 戶名：<span className="text-slate-800">{memberProfileInfo.name}</span></p>
                      <p>🏦 銀行：<span className="text-slate-800">{memberProfileInfo.bankName || "未設定"}</span></p>
                      <p>🔢 末五碼：<span className="text-emerald-700 font-mono font-black">{memberProfileInfo.lastFive || "未設定"}</span></p>
                    </div>
                    {memberProfileInfo.bankName && (
                      <button
                        onClick={() => handleSelectBank({ name: memberProfileInfo.name, bank: memberProfileInfo.bankName, lastFive: memberProfileInfo.lastFive })}
                        className="w-full bg-emerald-900 hover:bg-emerald-950 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition shadow-lg shadow-emerald-900/10 mt-3 flex items-center justify-center gap-1"
                      >
                        套用此預設帳號 ➔
                      </button>
                    )}
                  </div>
                )}

                {/* 常用帳號列表 */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">常用帳號列表 ({savedBanks.length})</h4>
                    {!showNewBankForm && (
                      <button
                        onClick={() => setShowNewBankForm(true)}
                        className="text-[9px] font-black text-amber-600 hover:text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg transition"
                      >
                        + 新增常用帳號
                      </button>
                    )}
                  </div>

                  {showNewBankForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 text-left animate-fade-in"
                    >
                      <p className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex justify-between items-center">
                        <span>➕ 填寫常用帳號</span>
                        <span onClick={() => setShowNewBankForm(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">收起 ✕</span>
                      </p>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="col-span-2">
                          <label className="text-[9px] font-bold text-slate-500 mb-1 block">帳號暱稱 / 簡稱</label>
                          <input
                            type="text"
                            placeholder="例：我的富邦卡、媽媽的帳戶"
                            value={newBankAlias}
                            onChange={e => setNewBankAlias(e.target.value)}
                            className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 mb-1 block">匯款人姓名</label>
                          <input
                            type="text"
                            placeholder="例：陳小明"
                            value={newBankName}
                            onChange={e => setNewBankName(e.target.value)}
                            className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div className="relative">
                          <label className="text-[9px] font-bold text-slate-500 mb-1 block">匯款銀行</label>
                          <input
                            type="text"
                            placeholder="例：國泰世華"
                            value={newBankSearchText}
                            onChange={e => setNewBankSearchText(e.target.value)}
                            onFocus={() => setNewBankFocus(true)}
                            onBlur={() => setTimeout(() => setNewBankFocus(false), 200)}
                            className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                          {newBankFocus && TAIWAN_BANKS.filter(b => b.name.includes(newBankSearchText) || b.code.includes(newBankSearchText)).length > 0 && (
                            <div className="absolute left-0 right-0 z-[110] mt-1 max-h-32 overflow-y-auto bg-white border border-slate-100 rounded-xl shadow-xl divide-y divide-slate-50">
                              {TAIWAN_BANKS.filter(b => b.name.includes(newBankSearchText) || b.code.includes(newBankSearchText)).map(bank => (
                                <button
                                  key={bank.code}
                                  type="button"
                                  onClick={() => {
                                    setNewBankSearchText(bank.name);
                                  }}
                                  className="w-full text-left px-3 py-2 text-[10px] text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition font-bold"
                                >
                                  <span className="font-mono text-slate-400 mr-1">[{bank.code}]</span>
                                  {bank.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="col-span-2">
                          <label className="text-[9px] font-bold text-slate-500 mb-1 block">帳號末五碼</label>
                          <input
                            type="text"
                            maxLength={5}
                            placeholder="例：12345"
                            value={newBankLastFive}
                            onChange={e => setNewBankLastFive(e.target.value.replace(/\D/g, ""))}
                            className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleSaveBank}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition mt-1 shadow-md shadow-amber-500/10"
                      >
                        儲存並套用 ✓
                      </button>
                    </motion.div>
                  )}

                  {savedBanks.length === 0 ? (
                    <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100">
                      <p className="text-xs text-slate-400 font-bold">尚無任何常用帳號</p>
                      <p className="text-[9px] text-slate-350 font-bold mt-1 leading-relaxed">您可以點擊右上角新增，以便未來一鍵快速代入！</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {savedBanks.map(bank => (
                        <div
                          key={bank.id}
                          onClick={() => handleSelectBank({ name: bank.name, bank: bank.bank, lastFive: bank.lastFive })}
                          className="bg-white border border-slate-100 hover:border-amber-200 hover:bg-amber-50/10 rounded-2xl p-4 text-left transition cursor-pointer flex justify-between items-center relative group"
                        >
                          <div>
                            <span className="text-[8px] font-black text-slate-400 bg-slate-50 group-hover:bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              🏷️ {bank.alias}
                            </span>
                            <div className="mt-2 space-y-0.5 text-[11px] font-bold text-slate-650">
                              <p>👤 戶名：<span className="text-slate-800">{bank.name}</span></p>
                              <p>🏦 銀行：<span className="text-slate-800">{bank.bank}</span></p>
                              <p>🔢 末五碼：<span className="text-amber-800 font-mono font-black">{bank.lastFive}</span></p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleDeleteBank(bank.id, e)}
                              className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center text-xs transition"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </main>
    </div>
  );
}


export default function Orders() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>}>
      <OrdersContent />
    </Suspense>
  );
}
