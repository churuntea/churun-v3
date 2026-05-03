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
  Check
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { AnimatePresence } from "framer-motion";

export const dynamic = 'force-dynamic';

function StoreContent() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState("全部商品");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();

  useEffect(() => {
    // Force cache break
    const currentVersion = "1.1.2";
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
    try {
      const res = await fetch("/api/orders/dynamic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_id: memberInfo.id,
          items: cart.map(item => ({ id: item.id, quantity: item.quantity }))
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowSuccess(true);
        clearCart();
        setTimeout(() => {
          setShowSuccess(false);
          setIsCartOpen(false);
          fetchData(memberInfo.id); // Refresh balance
        }, 2000);
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
           精品嚴選商城 <span className="text-[7px] bg-emerald-50 px-2 py-1 rounded-full text-emerald-600 border border-emerald-100 font-bold">V1.1.2</span>
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

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-emerald-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-emerald-900/20 flex justify-between items-center relative overflow-hidden"
        >
           <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
           <div className="space-y-1 relative z-10">
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/40">可用紅利點數</p>
              <h2 className="text-3xl font-black">{memberInfo?.points_balance?.toLocaleString() || 0} <span className="text-xs font-medium ml-1">pts</span></h2>
           </div>
           <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/10 shadow-inner">
              <Star className="w-8 h-8 text-amber-300 fill-current" />
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

                       <div className="pt-6 border-t border-slate-50 flex items-center justify-between gap-4">
                          <button 
                            onClick={() => addToCart(product)}
                            className="flex-1 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-900 transition-all flex items-center justify-center gap-2 active:scale-95"
                          >
                             {cart.find(i => i.id === product.id) ? "繼續添加" : "加入購物車"} <Plus className="w-3 h-3" />
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
              </div>

              <div className="p-8 bg-slate-50 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <span>商品小計</span>
                    <span>${totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <span>預計回饋紅利</span>
                    <span className="text-emerald-600">+{cart.reduce((sum, i) => sum + Math.floor(i.price * i.quantity * (i.b2c_reward_percent || 0) / 100), 0)} pts</span>
                  </div>
                  <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-black text-slate-800 uppercase tracking-widest">總計金額</span>
                    <span className="text-2xl font-black text-slate-900">${totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || isCheckingOut}
                  className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-sm hover:bg-emerald-900 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 disabled:opacity-50 disabled:bg-slate-400"
                >
                  {isCheckingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : showSuccess ? <><Check className="w-5 h-5" /> 結帳成功</> : "確認結帳並支付"}
                </button>
              </div>
            </motion.div>
          </>
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
