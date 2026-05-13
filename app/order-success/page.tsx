"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  ShoppingBag, 
  LayoutDashboard, 
  Sparkles,
  Loader2,
  FileText,
  MapPin,
  User,
  CreditCard,
  Copy,
  Info,
  MessageCircle
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/app/supabase";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const fallbackAmount = searchParams.get("amount");

  const [orderData, setOrderData] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [memberData, setMemberData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    async function fetchOrderDetails() {
      try {
        // 1. Fetch Order Row
        const { data: order, error: orderErr } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (order) {
          setOrderData(order);

          // 2. Fetch Order Items
          const { data: items, error: itemsErr } = await supabase
            .from("order_items")
            .select("*")
            .eq("order_id", orderId);
          if (items) {
            setOrderItems(items);
          }

          // 3. Fetch Member Details
          const { data: member, error: memberErr } = await supabase
            .from("members")
            .select("*")
            .eq("id", order.member_id)
            .single();
          if (member) {
            setMemberData(member);
          }
        }
      } catch (err) {
        console.error("Error loading order details:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrderDetails();
  }, [orderId]);

  const handleCopy = () => {
    navigator.clipboard.writeText("214-03-500450-5");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-8">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-900/10 rounded-full blur-xl animate-pulse"></div>
          <Loader2 className="w-12 h-12 text-emerald-900 animate-spin relative z-10" />
        </div>
        <p className="mt-4 text-xs font-black text-slate-400 uppercase tracking-widest">數位收據生成中...</p>
      </div>
    );
  }

  // Get values with fallbacks
  const actualAmount = orderData ? orderData.total_amount : Number(fallbackAmount || 0);
  const orderNumber = orderData?.order_number || orderId?.slice(-8).toUpperCase() || "TX9921";
  const shippingInfo = orderData?.shipping_info || {};
  const isB2B = memberData?.is_b2b || false;

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-start p-6 md:p-12 relative overflow-x-hidden">
      
      {/* Celebration Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         {[...Array(15)].map((_, i) => (
            <motion.div
               key={i}
               initial={{ opacity: 0, y: 100, x: Math.random() * 400 - 200 }}
               animate={{ opacity: [0, 1, 0], y: -500, x: Math.random() * 600 - 300 }}
               transition={{ duration: 2.5 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
               className="absolute bottom-0 left-1/2"
            >
               <Sparkles style={{ width: Math.floor(Math.random() * 12 + 16), height: Math.floor(Math.random() * 12 + 16) }} className="text-emerald-800/10" />
            </motion.div>
         ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md text-center relative z-10 space-y-8"
      >
         {/* Success Icon */}
         <div className="relative inline-block mt-4">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-24 h-24 bg-emerald-900 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-emerald-900/20"
            >
               <CheckCircle2 className="w-12 h-12 text-white" />
            </motion.div>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-3 border-2 border-dashed border-emerald-900/15 rounded-full opacity-50"
            ></motion.div>
         </div>

         <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">訂單已圓滿完成</h1>
            <p className="text-[11px] text-slate-400 font-bold leading-relaxed px-6">
               感謝您對初潤的信任。您的精品特選茶品採購已成功建立，系統已自動同步至出貨物流中心。
            </p>
         </div>

         {/* Receipt Card */}
         <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-xl shadow-slate-900/5 text-left space-y-6">
            
            {/* Header / Order Number */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 border-dashed">
               <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-800" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Digital Receipt</span>
               </div>
               <span className="text-[10px] font-black text-slate-800 uppercase bg-slate-100 px-2.5 py-1 rounded-full">
                 #{orderNumber}
               </span>
            </div>

            {/* 1. Itemized Products List */}
            <div className="space-y-3">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">🛒 採購商品明細</p>
               <div className="space-y-2.5 max-h-48 overflow-y-auto no-scrollbar pr-1">
                 {orderItems.length === 0 ? (
                    <div className="flex justify-between items-center text-xs">
                       <span className="font-extrabold text-slate-500">精選茶品組合</span>
                       <span className="font-black text-slate-800">x 1</span>
                    </div>
                 ) : (
                    orderItems.map((item, idx) => (
                       <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="font-extrabold text-slate-600 truncate max-w-[200px]">{item.name}</span>
                          <span className="font-black text-slate-800">x{item.quantity} (${(item.price * item.quantity).toLocaleString()})</span>
                       </div>
                    ))
                 )}
               </div>
            </div>

            {/* 2. Fee Summary */}
            <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs">
               <div className="flex justify-between items-center text-slate-400 font-bold">
                  <span>商品小計</span>
                  <span>${(orderData?.original_amount || actualAmount - (shippingInfo?.shipping_fee || 0)).toLocaleString()} 元</span>
               </div>
               {orderData?.discount_amount > 0 && (
                  <div className="flex justify-between items-center text-rose-500 font-bold">
                     <span>優惠券折抵</span>
                     <span>-${orderData.discount_amount.toLocaleString()} 元</span>
                  </div>
               )}
               <div className="flex justify-between items-center text-slate-400 font-bold">
                  <span>配送運費 ({shippingInfo?.method || "宅配"})</span>
                  <span>{shippingInfo?.shipping_fee === 0 ? "免運 ($0)" : `$${shippingInfo?.shipping_fee || 70} 元`}</span>
               </div>
               <div className="flex justify-between items-end border-t border-dashed border-slate-200 pt-3 text-slate-900 font-black">
                  <span className="text-xs">應付結算金額</span>
                  <span className="text-xl text-emerald-600 tracking-tighter">NT$ {actualAmount.toLocaleString()} 元</span>
               </div>
            </div>

            {/* 3. Sender Info */}
            <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                 <User className="w-3 h-3 text-slate-400" /> 👤 訂購人 (寄件人) 資訊
               </p>
               <div className="bg-slate-50 rounded-2xl p-4 space-y-1.5 font-bold text-slate-700">
                  <div className="flex justify-between">
                     <span className="text-slate-400">姓名</span>
                     <span>{shippingInfo?.sender_name || memberData?.name || "會員本人"}</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-slate-400">電話</span>
                     <span>{shippingInfo?.sender_phone || memberData?.phone || "無"}</span>
                  </div>
               </div>
            </div>

            {/* 4. Recipient Info */}
            <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                 <MapPin className="w-3 h-3 text-slate-400" /> 📍 配送收件人資訊
               </p>
               <div className="bg-slate-50 rounded-2xl p-4 space-y-2 font-bold text-slate-700">
                  <div className="flex justify-between">
                     <span className="text-slate-400">收件姓名</span>
                     <span>{shippingInfo?.name || memberData?.name || "未知"}</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-slate-400">收件電話</span>
                     <span>{shippingInfo?.phone || memberData?.phone || "無"}</span>
                  </div>
                  <div className="flex flex-col gap-1 pt-1 border-t border-slate-200/50">
                     <span className="text-slate-400">收件地址</span>
                     <span className="text-slate-800 leading-relaxed break-all text-left">{shippingInfo?.address || "無"}</span>
                  </div>
                  {orderData?.notes && (
                     <div className="flex flex-col gap-1 pt-1">
                        <span className="text-rose-500 font-black">訂單備註</span>
                        <span className="text-rose-700 leading-relaxed break-all text-left">{orderData.notes}</span>
                     </div>
                  )}
               </div>
            </div>

            {/* 5. Remittance Bank Info OR B2B Wallet Deduction */}
            <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                 <CreditCard className="w-3 h-3 text-slate-400" /> 💳 交易結算與付款
               </p>
               {isB2B ? (
                  <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-2xl p-4 space-y-2">
                     <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black bg-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wider">加盟商預收款</span>
                        <span className="text-[9px] text-emerald-300 font-black">PRE-PAID DEBIT</span>
                     </div>
                     <div className="flex justify-between font-bold text-sm">
                        <span>扣款方式</span>
                        <span className="text-emerald-250">預收款帳戶扣款</span>
                     </div>
                     <div className="flex justify-between font-bold text-sm">
                        <span>交易狀態</span>
                        <span className="text-emerald-300">付款成功 (已自動扣減餘額)</span>
                     </div>
                  </div>
               ) : (
                  <div className="bg-slate-900 text-white rounded-2xl p-4.5 space-y-3">
                     <div className="flex justify-between">
                        <span className="text-white/60 font-bold">匯款銀行</span>
                        <span className="font-extrabold text-white">國泰世華銀行 (013)</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-white/60 font-bold">戶名</span>
                        <span className="font-extrabold text-white">安信商業有限公司</span>
                     </div>
                     <div className="flex justify-between items-center pt-2 border-t border-white/10">
                        <span className="text-white/60 font-bold">匯款帳號</span>
                        <div className="flex items-center gap-1.5">
                           <span className="font-black text-emerald-300 tracking-wider">214-03-500450-5</span>
                           <button 
                             type="button"
                             onClick={handleCopy}
                             className="px-2 py-1 bg-white/10 hover:bg-white/20 active:scale-95 text-[8px] font-black rounded transition flex items-center gap-1"
                           >
                              <Copy className="w-2.5 h-2.5" />
                              {copied ? "已複製" : "複製"}
                           </button>
                        </div>
                     </div>
                     <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-[9px] text-emerald-300 leading-relaxed font-bold flex gap-2 items-start">
                        <Info className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                        <span>請匯入正確金額 <span className="underline">${actualAmount.toLocaleString()}</span> 元。完成後，請至個人中心點選【回報匯款】，管理員將立即為您安排出貨！</span>
                     </div>
                  </div>
               )}
            </div>

         </div>

         {/* Shipping LINE CTA */}
         <motion.a 
           href="https://lin.ee/oBBw4O3"
           target="_blank"
           rel="noopener noreferrer"
           whileHover={{ scale: 1.02 }}
           whileTap={{ scale: 0.98 }}
           className="block w-full bg-[#06C755] hover:bg-[#05b04b] text-white py-5 rounded-[2rem] font-black text-xs tracking-[0.1em] flex items-center justify-center gap-3 shadow-lg shadow-[#06C755]/10 hover:shadow-[#06C755]/20 transition-all duration-300"
         >
            <MessageCircle className="w-5 h-5" /> 聯繫【初潤出貨客服】核對配送進度
         </motion.a>

         {/* Navigation Buttons */}
         <div className="grid grid-cols-2 gap-4">
            <Link href="/" className="bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition">
               <LayoutDashboard className="w-4 h-4" /> 返回儀表板
            </Link>
            <Link href="/store" className="bg-white border border-slate-100 text-slate-400 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transition">
               <ShoppingBag className="w-4 h-4" /> 繼續逛逛
            </Link>
         </div>

      </motion.div>

      <p className="mt-12 text-[8px] font-black uppercase tracking-[0.5em] text-slate-200">
         CHURUN TEA HOUSE DIGITAL RECEIPT SYSTEM
      </p>

    </div>
  );
}

export default function OrderSuccess() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
