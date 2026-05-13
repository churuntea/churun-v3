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
  const [isEditingRemittance, setIsEditingRemittance] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    fetchOrders(savedId);
  }, [router]);

  const fetchOrders = async (userId: string) => {
    setIsLoading(true);
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
    setIsLoading(false);
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

  const handleUpdatePaymentLastFive = async (orderId: string, value: string) => {
    if (!value || value.length !== 5) {
      alert("請輸入正確的 5 碼匯款帳號末碼");
      return;
    }
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, lastFive: value })
      });
      const data = await res.json();
      
      if (data.success) {
        alert("帳號末五碼回報成功！我們將會盡速為您核對對帳。");
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
                {filteredOrders.map((order, i) => (
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

                     {/* Visual Timeline */}
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

                     {/* ─── 物流配送即時查單卡 (Smart Logistics tracking) ─── */}
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

                     {/* ─── 匯款末五碼回報對帳表單 (Remittance payment tracking form) ─── */}
                     {order.status === 'pending' && (
                        <div className="bg-amber-50/30 border border-amber-100/70 rounded-2xl p-4 mt-4 space-y-3 text-left">
                           {/* Check if already submitted remittance code */}
                           {order.payment_last_five && !isEditingRemittance[order.id] ? (
                              <div className="flex items-center justify-between gap-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center text-sm font-black">
                                       ⏳
                                    </div>
                                    <div>
                                       <p className="text-[10px] font-black text-amber-700 tracking-wider">已回報帳號末五碼</p>
                                       <p className="text-xs font-black text-slate-700 mt-0.5">【 {order.payment_last_five} 】對帳核對中</p>
                                    </div>
                                 </div>
                                 <button 
                                   onClick={() => {
                                     setRemittanceInputs(prev => ({ ...prev, [order.id]: order.payment_last_five || "" }));
                                     setIsEditingRemittance(prev => ({ ...prev, [order.id]: true }));
                                   }}
                                   className="text-slate-400 hover:text-slate-600 text-[10px] font-black tracking-widest transition uppercase"
                                 >
                                    修改末碼
                                 </button>
                              </div>
                           ) : (
                              <div className="space-y-2">
                                 <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-black text-amber-700 tracking-wider">請回報匯款帳號末五碼對帳</p>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Remittance Submission</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <input 
                                      type="text" 
                                      maxLength={5}
                                      placeholder="請輸入匯款後五碼"
                                      value={remittanceInputs[order.id] || ""}
                                      onChange={e => {
                                        const cleanVal = e.target.value.replace(/\D/g, ""); // only digits
                                        setRemittanceInputs(prev => ({ ...prev, [order.id]: cleanVal }));
                                      }}
                                      className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 flex-1 placeholder:text-slate-300 font-mono"
                                    />
                                    <button 
                                      onClick={() => handleUpdatePaymentLastFive(order.id, remittanceInputs[order.id] || "")}
                                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition shadow-lg shadow-amber-500/10 flex items-center gap-1"
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
                                 href="https://lin.ee/oBBw4O3" 
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
                ))}
             </div>
           )
         )}

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
