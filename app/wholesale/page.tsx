"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  ArrowRight, 
  LayoutDashboard, 
  Zap, 
  User, 
  Loader2,
  ArrowLeft,
  Star,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface Coupon {
  code: string;
  name: string;
  discountType: 'fixed' | 'percent';
  value: number; // e.g. 200 for fixed, 12 for percent
  minSpend: number;
  description: string;
}

const AVAILABLE_COUPONS: Coupon[] = [
  { code: "WELCOME200", name: "新會員入會折 $200", discountType: "fixed", value: 200, minSpend: 1000, description: "新客滿千折 $200" },
  { code: "CHURUN88", name: "初潤創業 88 折", discountType: "percent", value: 12, minSpend: 2000, description: "滿 $2,000 享 88 折優惠" },
  { code: "VIP100", name: "貴賓體驗折 $100", discountType: "fixed", value: 100, minSpend: 500, description: "滿 $500 現折 $100" }
];

function WholesaleContent() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    fetchData(savedId);
  }, [router]);

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    const { data: mData } = await supabase.from("members").select("*").eq("id", userId).single();
    setMemberInfo(mData);

    const { data: pData } = await supabase.from("products").select("*").eq("status", "active");
    setProducts(pData || []);
    setIsLoading(false);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      const newQty = (prev[id] || 0) + delta;
      if (newQty <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: newQty };
    });
  };

  const totalAmount = products.reduce((acc, p) => acc + (cart[p.id] || 0) * p.price, 0);
  const totalItems = Object.values(cart).reduce((acc, q) => acc + q, 0);

  const getDiscountAmount = () => {
    if (!activeCoupon) return 0;
    if (totalAmount < activeCoupon.minSpend) return 0;
    
    if (activeCoupon.discountType === 'fixed') {
      return activeCoupon.value;
    } else if (activeCoupon.discountType === 'percent') {
      return Math.floor(totalAmount * (activeCoupon.value / 100));
    }
    return 0;
  };

  const discountAmount = getDiscountAmount();
  const finalAmount = Math.max(0, totalAmount - discountAmount);

  const handleCheckout = async () => {
    if (totalAmount <= 0) return;
    if (memberInfo.virtual_balance < finalAmount) {
      alert("預收款餘額不足，請先聯繫總部儲值。");
      return;
    }

    setIsSubmitting(true);
    
    // 這裡調用我們之前的動態訂單 API
    const response = await fetch("/api/orders/dynamic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: memberInfo.id,
        items: Object.entries(cart).map(([id, qty]) => ({ id, quantity: qty })),
        discountAmount: discountAmount,
        couponCode: activeCoupon ? activeCoupon.code : null
      })
    });

    const result = await response.json();
    
    if (result.success) {
      router.push(`/order-success?id=${result.orderId || ''}&amount=${finalAmount}`);
    } else {
      alert("結帳失敗: " + result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-40">
      
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-50 px-8 py-6 flex items-center gap-6 max-w-lg mx-auto">
         <Link href="/" className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition">
            <ArrowLeft className="w-5 h-5" />
         </Link>
         <h1 className="text-sm font-black tracking-[0.3em] text-slate-800 uppercase">大宗批發採購</h1>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-10 mt-4">
        
        {/* Wallet Warning */}
        <div className={`p-8 rounded-[2.5rem] border flex items-center gap-6 transition ${memberInfo?.virtual_balance < 5000 ? 'bg-rose-50 border-rose-100 text-rose-900' : 'bg-emerald-50 border-emerald-100 text-emerald-900'}`}>
           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${memberInfo?.virtual_balance < 5000 ? 'bg-white text-rose-500' : 'bg-white text-emerald-500'}`}>
              {memberInfo?.virtual_balance < 5000 ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
           </div>
           <div className="flex-1">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">當前可用預收款</p>
              <h3 className="text-2xl font-black tracking-tight">${Number(memberInfo?.virtual_balance || 0).toLocaleString()}</h3>
           </div>
           {memberInfo?.virtual_balance < 5000 && <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">餘額偏低</span>}
        </div>

        {/* Product List */}
        <div className="space-y-6">
           {isLoading ? (
             <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-200" /></div>
           ) : products.map((product, i) => (
             <motion.div 
               key={product.id}
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: i * 0.05 }}
               className="bg-white rounded-[2.5rem] p-6 border border-slate-50 shadow-sm flex items-center gap-6 group hover:border-emerald-100 transition"
             >
                <div className="w-20 h-20 rounded-3xl overflow-hidden bg-slate-50">
                   <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-1">
                   <h4 className="font-bold text-slate-800 text-sm">{product.name}</h4>
                   <p className="text-emerald-600 font-black text-sm">${product.price}</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl">
                   <button 
                     onClick={() => updateQuantity(product.id, -1)}
                     className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 transition"
                   >
                      <Minus className="w-4 h-4" />
                   </button>
                   <span className="text-sm font-black w-4 text-center">{cart[product.id] || 0}</span>
                   <button 
                     onClick={() => updateQuantity(product.id, 1)}
                     className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-emerald-600 transition"
                   >
                      <Plus className="w-4 h-4" />
                   </button>
                </div>
             </motion.div>
           ))}
         </div>
 
         {/* Promo Coupons Section */}
         {totalItems > 0 && (
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                 <div>
                    <h3 className="text-sm font-black text-slate-800 tracking-[0.15em] uppercase">🎟️ 優惠券折抵</h3>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">Select or Enter Coupon</p>
                 </div>
                 {activeCoupon && (
                    <button 
                      onClick={() => { setActiveCoupon(null); setCouponError(null); }}
                      className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                    >
                       取消套用
                    </button>
                 )}
              </div>

              {/* Predefined Coupon Chips (Click to use or cancel) */}
              <div className="grid grid-cols-1 gap-3">
                 {AVAILABLE_COUPONS.map((coupon) => {
                    const isSelected = activeCoupon?.code === coupon.code;
                    const canApply = totalAmount >= coupon.minSpend;
                    
                    return (
                      <div 
                        key={coupon.code}
                        onClick={() => {
                           if (isSelected) {
                              setActiveCoupon(null);
                           } else {
                              if (totalAmount < coupon.minSpend) {
                                 setCouponError(`未達該券最低消費門檻 $${coupon.minSpend}`);
                                 setActiveCoupon(null);
                              } else {
                                 setActiveCoupon(coupon);
                                 setCouponError(null);
                              }
                           }
                        }}
                        className={`p-5 rounded-[1.8rem] border-2 transition cursor-pointer flex justify-between items-center relative overflow-hidden ${isSelected ? 'border-emerald-500 bg-emerald-50/20 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}
                      >
                         {isSelected && (
                            <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500 rounded-bl-2xl flex items-center justify-center">
                               <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                               </svg>
                            </div>
                         )}
                         <div className="space-y-1 pr-6">
                            <div className="flex items-center gap-2">
                               <span className="font-black text-xs text-slate-800 tracking-wider bg-slate-100 px-2 py-0.5 rounded-md uppercase">{coupon.code}</span>
                               <span className="font-bold text-xs text-slate-700">{coupon.name}</span>
                            </div>
                            <p className="text-[10px] font-medium text-slate-400">{coupon.description}</p>
                            {!canApply && (
                               <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
                                  還差 ${coupon.minSpend - totalAmount} 即可折抵
                               </p>
                            )}
                         </div>
                         <div className="text-right flex-shrink-0">
                            <span className={`font-black text-lg ${isSelected ? 'text-emerald-600' : 'text-slate-700'}`}>
                               {coupon.discountType === 'fixed' ? `$${coupon.value}` : `${10 - (coupon.value/10)}折`}
                            </span>
                         </div>
                      </div>
                    );
                 })}
              </div>

              {/* Manual Coupon Input */}
              <div className="space-y-2 pt-2">
                 <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-2">手動輸入折扣碼</label>
                 <div className="flex gap-3">
                    <input 
                      type="text" 
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="輸入優惠代碼（如 WELCOME200）" 
                      className="flex-1 bg-slate-50/50 border-none p-4 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-900/5 transition shadow-inner"
                    />
                    <button 
                      onClick={() => {
                         const code = couponInput.trim().toUpperCase();
                         if (!code) {
                            setCouponError("請輸入優惠代碼");
                            return;
                         }
                         const found = AVAILABLE_COUPONS.find(c => c.code === code);
                         if (found) {
                            if (totalAmount < found.minSpend) {
                               setCouponError(`未達該券最低消費門檻 $${found.minSpend}`);
                            } else {
                               setActiveCoupon(found);
                               setCouponError(null);
                            }
                         } else {
                            setCouponError("找不到此優惠代碼，請重新輸入");
                         }
                      }}
                      className="px-6 bg-slate-900 text-white rounded-2xl text-xs font-black tracking-widest"
                    >
                       套用
                    </button>
                 </div>
                 {couponError && (
                    <p className="text-[10px] font-bold text-rose-500 ml-2 mt-1">{couponError}</p>
                 )}
              </div>
           </div>
         )}

       </main>

      {/* Floating Checkout Bar */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 z-[60]"
          >
             <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-900/30 flex flex-col gap-4 border border-white/10">
                {activeCoupon && discountAmount > 0 && (
                  <div className="space-y-2 pb-3 border-b border-white/5 text-xs font-bold text-white/50">
                    <div className="flex justify-between items-center">
                      <span>商品原價總計</span>
                      <span className="line-through">${totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-rose-400">
                      <span>優惠折抵 ({activeCoupon.name})</span>
                      <span>-${discountAmount.toLocaleString()}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between w-full">
                  <div className="space-y-1">
                     <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">
                       {activeCoupon && discountAmount > 0 ? '折抵後應付' : '採購總額'} ({totalItems} 件)
                     </p>
                     <h3 className="text-2xl font-black text-white tracking-tighter">
                       ${finalAmount.toLocaleString()}
                     </h3>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    disabled={isSubmitting}
                    className="bg-emerald-500 text-white px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 flex items-center gap-3 active:scale-95 transition disabled:opacity-50"
                  >
                     {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                       <>確認結帳 <ArrowRight className="w-4 h-4" /></>
                     )}
                  </button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 z-50">
         <div className="bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] p-3 flex justify-between items-center shadow-2xl shadow-slate-900/30 border border-white/5">
            <Link href="/" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <LayoutDashboard className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Dashboard</span>
            </Link>
            <Link href="/store" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <ShoppingBag className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Shop</span>
            </Link>
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 -mt-8 border-4 border-[#FDFBF7]">
               <Plus className="w-6 h-6 text-white" />
            </div>
            <Link href="/organization" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <Zap className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Team</span>
            </Link>
            <Link href="/profile" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <User className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Me</span>
            </Link>
         </div>
      </div>
    </div>
  );
}

export default function Wholesale() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>}>
      <WholesaleContent />
    </Suspense>
  );
}
