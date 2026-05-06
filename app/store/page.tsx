"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { motion } from "framer-motion";
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  ChevronRight, 
  LayoutDashboard, 
  Zap, 
  User, 
  Star,
  Loader2,
  ArrowUpRight,
  X,
  Minus,
  Trash2,
  ShoppingCart,
  Check,
  Plus
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { AnimatePresence } from "framer-motion";

export const dynamic = 'force-dynamic';

const TIER_RATES: Record<string, number> = {
  '初潤靈魂伴侶': 30,
  '初潤知己': 40,
  '初潤閨蜜': 50,
  '初潤好朋友': 60,
  '初潤青少年': 70,
  '初潤小朋友': 80,
  '初潤幼兒園': 90,
  '初潤寶寶': 100
};

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

function StoreContent() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState("全部商品");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [lastOrderAmount, setLastOrderAmount] = useState(0);
  const [isOrderCreated, setIsOrderCreated] = useState(false);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const [couponInput, setCouponInput] = useState("");
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();

  const getDiscountAmount = () => {
    if (!activeCoupon) return 0;
    if (totalPrice < activeCoupon.minSpend) return 0;
    
    if (activeCoupon.discountType === 'fixed') {
      return activeCoupon.value;
    } else if (activeCoupon.discountType === 'percent') {
      return Math.floor(totalPrice * (activeCoupon.value / 100));
    }
    return 0;
  };

  const discountAmount = getDiscountAmount();
  const finalPrice = Math.max(0, totalPrice - discountAmount);

  const getProductQty = (id: string) => productQuantities[id] || 1;
  const updateProductQty = (id: string, delta: number) => {
    setProductQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta)
    }));
  };

  useEffect(() => {
    const currentVersion = "2.0.0";
    const savedVersion = localStorage.getItem("churun_store_version");
    if (savedVersion !== currentVersion) {
      localStorage.setItem("churun_store_version", currentVersion);
      window.location.reload();
      return;
    }

    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    fetchData(savedId);
  }, [router]);

  useEffect(() => {
    if (selectedCategory === "全部商品") {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => (p.category || "極萃系列") === selectedCategory));
    }
  }, [selectedCategory, products]);

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data: mData } = await supabase.from("members").select("*").eq("id", userId).single();
      setMemberInfo(mData);

      const { data: pData } = await supabase.from("products").select("*").eq("status", "active");
      
      const processed = (pData || []).map(p => {
        if (!p.category && p.name.startsWith('[')) {
          const match = p.name.match(/^\[(.*?)\] (.*)/);
          if (match) {
            return { ...p, category: match[1], name: match[2] };
          }
        }
        return { ...p, category: p.category || "極萃系列" };
      });

      setProducts(processed);
      setFilteredProducts(processed);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    setOrderItems([...cart]);
    
    try {
      const res = await fetch("/api/orders/dynamic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_id: memberInfo.id,
          items: cart.map(item => ({ id: item.id, quantity: item.quantity })),
          discountAmount: discountAmount,
          couponCode: activeCoupon ? activeCoupon.code : null
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsOrderCreated(true);
        clearCart();
        fetchData(memberInfo.id); 
      } else {
        alert(data.error || "結帳失敗");
      }
    } catch (err) {
      console.error(err);
      alert("系統錯誤");
    }
    setIsCheckingOut(false);
  };

  const categories = ["全部商品", "極萃系列", "精品茶具", "典藏禮盒"];

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      <nav className="bg-white/80 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-50 px-8 py-6 flex justify-between items-center max-w-lg mx-auto">
        <h1 className="text-sm font-black tracking-[0.3em] text-slate-800 uppercase flex items-center gap-2">
           精品嚴選商城 <span className="text-[7px] bg-emerald-50 px-2 py-1 rounded-full text-emerald-600 border border-emerald-100 font-bold">V2.0.0</span>
        </h1>
        <div className="flex items-center gap-3">
          <div onClick={() => setIsCartOpen(true)} className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-800 cursor-pointer relative hover:bg-slate-100 transition">
             <ShoppingCart className="w-4 h-4" />
             {totalItems > 0 && (
               <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
                 {totalItems}
               </span>
             )}
          </div>
          <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
             <Search className="w-4 h-4" />
          </div>
        </div>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-10 mt-4">
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
           {categories.map((cat) => (
             <button 
               key={cat}
               onClick={() => setSelectedCategory(cat)}
               className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                 selectedCategory === cat ? 'bg-emerald-900 text-white shadow-xl shadow-emerald-900/20' : 'bg-white text-slate-400 border border-slate-50'
               }`}
             >
                {cat}
             </button>
           ))}
        </div>

        {/* Points Balance Card - Premium Optimized */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-mesh-emerald rounded-[3.5rem] p-10 text-white shadow-2xl shadow-emerald-900/20 relative overflow-hidden group mb-4"
        >
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-50 group-hover:scale-110 transition duration-700"></div>
          
          <div className="relative z-10 flex justify-between items-center">
            <div className="space-y-4">
               <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full w-fit border border-white/10">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70">可用紅利點數</span>
               </div>
               <div className="flex items-baseline gap-2">
                  <h2 className="text-6xl font-black tracking-tighter">{memberInfo?.points_balance?.toLocaleString() || 0}</h2>
                  <span className="text-xl font-medium text-white/60 italic">pts</span>
               </div>
            </div>
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center border border-white/20 shadow-inner"
            >
               <Star className="w-10 h-10 text-amber-300 fill-amber-300" />
            </motion.div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-8">
           {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-slate-200" /></div>
           ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-[3.5rem] p-24 text-center border border-slate-50 shadow-sm">
                 <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag className="w-8 h-8 text-slate-200" />
                 </div>
                 <h3 className="text-lg font-black text-slate-800 mb-2">精品整備中</h3>
                 <p className="text-xs text-slate-400 font-medium">該分類商品即將上架。</p>
              </div>
           ) : (
             filteredProducts.map((product, i) => (
               <motion.div 
                 key={product.id}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.05 }}
                 className="group"
               >
                 <div className="bg-white rounded-[3rem] overflow-hidden shadow-sm border border-slate-50 relative flex flex-col">
                    <div className="aspect-square w-full bg-slate-50 relative overflow-hidden">
                       <img 
                         src={product.image_url || "https://images.unsplash.com/photo-1544787210-2213d2427384?w=800&q=80"} 
                         alt={product.name} 
                         className="w-full h-full object-cover group-hover:scale-110 transition duration-1000"
                       />
                       <div className="absolute top-6 left-6 flex flex-col gap-2">
                          <div className="bg-emerald-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-lg">
                             <span className="text-[8px] font-black tracking-widest text-white uppercase">Premium</span>
                          </div>
                       </div>
                    </div>
                    
                    <div className="p-8 space-y-6">
                       <div className="flex justify-between items-start">
                          <div className="space-y-2">
                             <h3 className="text-xl font-black text-slate-800">{product.name}</h3>
                             <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">回饋 {product.b2c_reward_percent}%</span>
                          </div>
                          <div className="text-right">
                             <p className="text-xl font-black text-slate-900">${Number(product.price).toLocaleString()}</p>
                             {product.original_price && <p className="text-xs text-slate-300 line-through">${product.original_price}</p>}
                          </div>
                       </div>

                       <div className="pt-6 border-t border-slate-50 space-y-4">
                           <div className="flex items-center justify-between bg-slate-50 p-2 rounded-2xl border border-slate-100">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">數量</span>
                              <div className="flex items-center gap-4">
                                 <button 
                                   onClick={() => updateProductQty(product.id, -1)}
                                   className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-800 shadow-sm border border-slate-100 transition"
                                 >
                                    <Minus className="w-3 h-3" />
                                 </button>
                                 <span className="text-sm font-black w-8 text-center">{getProductQty(product.id)}</span>
                                 <button 
                                   onClick={() => updateProductQty(product.id, 1)}
                                   className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-800 shadow-sm border border-slate-100 transition"
                                 >
                                    <Plus className="w-3 h-3" />
                                 </button>
                              </div>
                           </div>
                           <button 
                             onClick={() => {
                               for (let i = 0; i < getProductQty(product.id); i++) {
                                 addToCart(product);
                               }
                               setProductQuantities(prev => ({ ...prev, [product.id]: 1 }));
                             }}
                             className="w-full bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-900 transition-all flex items-center justify-center gap-2 active:scale-95"
                           >
                              加入購物車 <Plus className="w-3 h-3" />
                           </button>
                       </div>
                    </div>
                 </div>
               </motion.div>
             ))
           )}
        </div>
      </main>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 z-50">
         <div className="bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] p-3 flex justify-between items-center shadow-2xl border border-white/5">
            <Link href="/" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <LayoutDashboard className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Dashboard</span>
            </Link>
            <Link href="/store" className="flex-1 flex flex-col items-center gap-1 text-white transition">
               <ShoppingBag className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Shop</span>
            </Link>
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg -mt-8 border-4 border-[#FDFBF7]">
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

      {/* Cart Overlay */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60]"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-slate-800">我的購物車</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {totalItems} 件精品整備中
                  </p>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-800 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-slate-200" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">您的購物車是空的</p>
                      <p className="text-xs text-slate-400 mt-1">快去挑選一些精品吧！</p>
                    </div>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                        <img src={item.image_url || "https://images.unsplash.com/photo-1544787210-2213d2427384?w=800&q=80"} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 truncate text-sm">{item.name}</h4>
                        <p className="text-emerald-600 font-black text-sm mt-1">${item.price.toLocaleString()}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-black w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-slate-200 hover:text-rose-500 transition self-start p-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}

                {/* Promo Coupons Section */}
                {cart.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-slate-100 space-y-6">
                     <div className="flex justify-between items-center">
                        <div>
                           <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">🎟️ 選擇優惠券</h4>
                           <p className="text-[8px] font-bold text-slate-400 mt-0.5">Select Coupon</p>
                        </div>
                        {activeCoupon && (
                           <button onClick={() => { setActiveCoupon(null); setCouponError(null); }} className="text-[10px] font-black text-rose-500 hover:underline">取消套用</button>
                        )}
                     </div>
                     
                     <div className="space-y-3">
                        {AVAILABLE_COUPONS.map(coupon => {
                           const isSelected = activeCoupon?.code === coupon.code;
                           const canApply = totalPrice >= coupon.minSpend;
                           return (
                             <div 
                               key={coupon.code}
                               onClick={() => {
                                  if (isSelected) {
                                     setActiveCoupon(null);
                                  } else {
                                     setActiveCoupon(coupon);
                                     setCouponError(null);
                                  }
                               }}
                               className={`p-4 rounded-2xl border transition cursor-pointer flex justify-between items-center relative overflow-hidden ${isSelected ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-100 hover:border-slate-200'}`}
                             >
                                <div className="space-y-0.5 pr-4">
                                   <div className="flex items-center gap-1.5">
                                      <span className="font-black text-[9px] text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{coupon.code}</span>
                                      <span className="font-bold text-xs text-slate-700">{coupon.name}</span>
                                   </div>
                                   <p className="text-[9px] text-slate-400">{coupon.description}</p>
                                   {!canApply && (
                                      <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mt-1">還差 ${coupon.minSpend - totalPrice} 即可折抵</p>
                                   )}
                                </div>
                                <span className={`font-black text-sm shrink-0 ${isSelected ? 'text-emerald-600' : 'text-slate-700'}`}>
                                   {coupon.discountType === 'fixed' ? `$${coupon.value}` : `${10 - (coupon.value/10)}折`}
                                </span>
                             </div>
                           );
                        })}
                     </div>

                     <div className="space-y-1.5">
                        <div className="flex gap-2">
                           <input 
                             type="text" 
                             value={couponInput}
                             onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                             placeholder="輸入優惠代碼" 
                             className="flex-1 bg-slate-50 border-none p-3 rounded-xl text-xs font-bold"
                          />
                           <button 
                             onClick={() => {
                                const code = couponInput.trim().toUpperCase();
                                const found = AVAILABLE_COUPONS.find(c => c.code === code);
                                if (found) {
                                   if (totalPrice < found.minSpend) {
                                      setCouponError(`未達該券最低消費門檻 $${found.minSpend}`);
                                   } else {
                                      setActiveCoupon(found);
                                      setCouponError(null);
                                   }
                                } else {
                                   setCouponError("找不到此優惠代碼");
                                }
                             }}
                             className="px-4 bg-slate-900 text-white rounded-xl text-xs font-black"
                           >
                              套用
                           </button>
                        </div>
                        {couponError && <p className="text-[9px] font-bold text-rose-500 ml-1">{couponError}</p>}
                     </div>
                  </div>
                )}
              </div>

              <div className="p-8 bg-slate-50 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <span>商品小計</span>
                    <span>${totalPrice.toLocaleString()}</span>
                  </div>
                  {activeCoupon && discountAmount > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-rose-500 uppercase tracking-widest">
                      <span>優惠折抵 ({activeCoupon.name})</span>
                      <span>-${discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <span>預計回饋紅利</span>
                    <span className="text-emerald-600">
                      +{memberInfo ? Math.floor(finalPrice / (TIER_RATES[memberInfo.tier] || 100)) : 0} pts
                    </span>
                  </div>
                  <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-black text-slate-800 uppercase tracking-widest">總計金額</span>
                    <span className="text-2xl font-black text-slate-900">${finalPrice.toLocaleString()}</span>
                  </div>
                </div>

                 <button 
                   onClick={() => setShowConfirmModal(true)}
                   disabled={cart.length === 0 || isCheckingOut}
                   className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-sm hover:bg-emerald-900 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 disabled:opacity-50 disabled:bg-slate-400"
                 >
                   下一步：確認訂購明細
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Step 1: Order Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] p-10 w-full max-w-sm shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="w-16 h-16 bg-slate-50 text-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                 <ShoppingCart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 text-center mb-6">請確認訂購品項</h3>
              
              <div className="space-y-4 mb-8 max-h-60 overflow-y-auto no-scrollbar pr-2">
                 {cart.map((item) => (
                   <div key={item.id} className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100">
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                         </div>
                         <span className="text-xs font-bold text-slate-600">{item.name}</span>
                      </div>
                      <span className="text-xs font-black text-slate-400 whitespace-nowrap">x {item.quantity}</span>
                   </div>
                 ))}
              </div>

              <div className="pt-6 border-t border-slate-100 mb-8 space-y-2">
                 <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                    <span>商品小計</span>
                    <span>${totalPrice.toLocaleString()}</span>
                 </div>
                 {activeCoupon && discountAmount > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-rose-500">
                       <span>優惠折抵 ({activeCoupon.name})</span>
                       <span>-${discountAmount.toLocaleString()}</span>
                    </div>
                 )}
                 <div className="pt-2 border-t border-dashed border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">應付總額</span>
                    <span className="text-xl font-black text-slate-900">${finalPrice.toLocaleString()}</span>
                 </div>
              </div>

              <div className="space-y-4">
                 <button 
                   onClick={() => {
                     setShowConfirmModal(false);
                     setLastOrderAmount(finalPrice);
                     setIsOrderCreated(false);
                     setShowPaymentModal(true);
                   }}
                   className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20"
                 >
                    品項正確，取得匯款資訊
                 </button>
                 <button 
                   onClick={() => setShowConfirmModal(false)}
                   className="w-full text-[10px] font-black text-slate-300 uppercase tracking-widest text-center"
                 >
                    返回修改
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Step 2: Payment Instruction Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowPaymentModal(false);
                setIsCartOpen(false);
              }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] p-10 w-full max-w-sm text-center shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
                 {isOrderCreated ? <Check className="w-10 h-10" /> : <Plus className="w-10 h-10" />}
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 mb-2">
                 {isOrderCreated ? "訂單已成功建立" : "結帳匯款資訊"}
              </h3>
              <p className="text-sm text-slate-400 mb-8 font-medium italic">
                 {isOrderCreated ? "我們將在收到款項後儘速出貨" : "請確認以下金額並完成匯款"}
              </p>

              <div className="bg-slate-50 rounded-[2rem] p-8 text-left space-y-4 mb-8 border border-slate-100">
                 <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">匯款總金額</span>
                    <span className="text-xl font-black text-emerald-600">${lastOrderAmount.toLocaleString()}</span>
                 </div>
                 
                 <div className="space-y-3 pt-2">
                    <div className="flex flex-col">
                       <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">匯款銀行</span>
                       <span className="text-sm font-black text-slate-700">國泰世華銀行 (013)</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">帳戶名稱</span>
                       <span className="text-sm font-black text-slate-700">安信商業有限公司</span>
                    </div>
                    <div className="flex flex-col group/copy relative">
                       <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">匯款帳號</span>
                       <div className="flex justify-between items-center gap-2">
                          <span id="bank-account-num" className="text-sm font-black text-emerald-900 tracking-wider">214-03-500450-5</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText("214-03-500450-5");
                              alert("帳號已複製！");
                            }}
                            className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter hover:bg-emerald-600 hover:text-white transition"
                          >
                             複製帳號
                          </button>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-amber-50 rounded-2xl p-4 mb-8 flex gap-3 items-start border border-amber-100">
                 <div className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-black text-amber-700">!</span>
                 </div>
                 <p className="text-[10px] font-bold text-amber-700 text-left leading-relaxed">
                    ※ 請務必匯入正確金額 <span className="underline">${lastOrderAmount.toLocaleString()}</span> 元，匯款完成後請點擊下方按鈕，管理員確認入帳後將自動發放紅利點數。
                 </p>
              </div>

              {!isOrderCreated ? (
                <div className="space-y-4">
                  <p className="text-[10px] font-medium text-slate-400 mb-8 leading-relaxed">
                     ※ 請先完成匯款後再點擊下方確認按鈕。<br/>
                     下單後請至個人中心回報帳號末五碼。
                  </p>
                  <button 
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full bg-emerald-900 text-white py-6 rounded-2xl font-black text-sm shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2"
                  >
                     {isCheckingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : "我已匯款，建立訂單"}
                  </button>
                  <button 
                    onClick={() => setShowPaymentModal(false)}
                    className="text-[10px] font-black text-slate-300 uppercase tracking-widest"
                  >
                     返回修改購物車
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="bg-slate-50 rounded-[2rem] p-6 space-y-4 border border-slate-100 max-h-48 overflow-y-auto no-scrollbar">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">訂購明細</p>
                     {orderItems.map((item, idx) => (
                       <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-600">{item.name}</span>
                          <span className="font-black text-slate-400">x{item.quantity}</span>
                       </div>
                     ))}
                  </div>
                  
                  <button 
                    onClick={() => {
                      setShowPaymentModal(false);
                      setIsCartOpen(false);
                    }}
                    className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20"
                  >
                     完成結帳，前往查看
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Store() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>}>
      <StoreContent />
    </Suspense>
  );
}
