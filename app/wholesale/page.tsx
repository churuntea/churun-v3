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

function WholesaleContent() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleCheckout = async () => {
    if (totalAmount <= 0) return;
    if (memberInfo.virtual_balance < totalAmount) {
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
        items: Object.entries(cart).map(([id, qty]) => ({ id, quantity: qty }))
      })
    });

    const result = await response.json();
    
    if (result.success) {
      router.push(`/order-success?id=${result.orderId}&amount=${totalAmount}`);
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
             <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-900/30 flex items-center justify-between border border-white/10">
                <div className="space-y-1">
                   <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">採購總額 ({totalItems} 件)</p>
                   <h3 className="text-2xl font-black text-white tracking-tighter">${totalAmount.toLocaleString()}</h3>
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
