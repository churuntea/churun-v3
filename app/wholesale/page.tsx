"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { 
  ChevronLeft, 
  Package, 
  CheckCircle2, 
  LayoutDashboard, 
  ShoppingBag, 
  Plus, 
  Zap, 
  User, 
  Loader2,
  Image as ImageIcon,
  CreditCard,
  ArrowRight
} from "lucide-react";

function WholesaleContent() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  
  const [quantity, setQuantity] = useState<number>(100);
  const [customLogo, setCustomLogo] = useState<string>("");
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
        alert("大宗批發區僅限 B2B 創業夥伴進入！");
        router.replace("/");
        return;
      }
      setMemberInfo(data);
    };
    fetchUser();
  }, [currentUserId, router]);

  const handleSubmit = async () => {
    if (!currentUserId) return;
    if (quantity === 300 && !customLogo) {
      alert("請輸入您的客製化 LOGO 網址或需求說明！");
      return;
    }

    if (!confirm(`確定要下單 ${quantity} 盒嗎？系統將從您的虛擬帳戶扣除款項。`)) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          buyer_id: currentUserId, 
          quantity, 
          custom_logo_url: quantity === 300 ? customLogo : null 
        })
      });
      
      const data = await res.json();
      if (data.success) {
        alert("🎉 訂單已成功送出！" + data.message);
        router.push("/");
      } else {
        alert("下單失敗: " + data.error);
      }
    } catch (err) { alert("系統錯誤"); }
    setIsSubmitting(false);
  };

  if (!memberInfo) return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-900" />
    </div>
  );

  const orderTotal = quantity === 100 ? 32900 : 89100;
  const balanceAfter = Number(memberInfo.virtual_balance) - orderTotal;

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-50 px-6 py-4 flex items-center gap-4 max-w-lg mx-auto">
        <button onClick={() => router.push("/")} className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">大宗批發專區</h1>
      </nav>

      <main className="p-6 max-w-lg mx-auto space-y-8 mt-2">
        
        {/* Banner */}
        <section className="bg-indigo-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20">
           <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/5 blur-2xl"></div>
           <div className="relative z-10 flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md">
                 <Package className="w-8 h-8 text-indigo-200" />
              </div>
              <div>
                 <h2 className="text-xl font-bold tracking-tight">批量進貨中心</h2>
                 <p className="text-xs text-white/40 mt-1">單筆滿額享 66 折優惠，專屬 LOGO 客製化服務。</p>
              </div>
           </div>
        </section>

        {/* Wholesale Selection */}
        <div className="space-y-4">
           <div className="flex justify-between items-center px-2">
              <h3 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase">選擇批發方案</h3>
           </div>

           <div className="grid grid-cols-1 gap-4">
              {[
                { qty: 100, label: "100 盒 (一般批發)", price: "32,900", unit: "329" },
                { qty: 300, label: "300 盒 (尊榮客製)", price: "89,100", unit: "297", featured: true }
              ].map((item) => (
                <div 
                  key={item.qty}
                  onClick={() => setQuantity(item.qty)}
                  className={`p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all duration-300 relative overflow-hidden ${quantity === item.qty ? 'border-indigo-600 bg-white shadow-2xl shadow-indigo-600/10' : 'border-slate-100 bg-white hover:border-indigo-200'}`}
                >
                   {item.featured && (
                      <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-bl-2xl">
                         Best Value
                      </div>
                   )}
                   <div className="flex justify-between items-start">
                      <div className="space-y-2">
                         <h4 className={`font-black text-lg ${quantity === item.qty ? 'text-indigo-900' : 'text-slate-800'}`}>{item.label}</h4>
                         <p className="text-xs text-slate-400 font-medium">每盒約 ${item.unit} (零售價 $450)</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">總金額</p>
                         <p className={`text-xl font-black ${quantity === item.qty ? 'text-indigo-600' : 'text-slate-700'}`}>${item.price}</p>
                      </div>
                   </div>

                   {quantity === item.qty && item.qty === 300 && (
                      <div className="mt-8 pt-8 border-t border-slate-50 animate-in slide-in-from-top-4">
                         <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                            <ImageIcon className="w-3 h-3" /> 專屬客製化需求
                         </label>
                         <textarea 
                           value={customLogo}
                           onChange={(e) => setCustomLogo(e.target.value)}
                           placeholder="請描述您的客製化 LOGO 需求或提供圖片連結..."
                           className="w-full bg-slate-50 border-none p-5 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 min-h-[100px] transition"
                         />
                      </div>
                   )}
                </div>
              ))}
           </div>
        </div>

        {/* Checkout Summary */}
        <section className="bg-white rounded-[2.5rem] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-slate-50 space-y-6">
           <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">當前餘額</span>
              <span className="font-mono font-bold text-slate-700">${Number(memberInfo.virtual_balance).toLocaleString()}</span>
           </div>
           <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">訂單總計</span>
              <span className="font-mono font-bold text-rose-500">-${orderTotal.toLocaleString()}</span>
           </div>
           <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
              <span className="font-black text-slate-800 text-sm">預計剩餘餘額</span>
              <span className={`font-mono text-lg font-black ${balanceAfter < 0 ? "text-rose-500" : "text-emerald-600"}`}>
                ${balanceAfter.toLocaleString()}
              </span>
           </div>
        </section>

        <button 
          onClick={handleSubmit}
          disabled={isSubmitting || balanceAfter < 0}
          className="w-full bg-slate-900 text-white py-6 rounded-3xl font-bold text-sm hover:bg-slate-800 transition shadow-2xl shadow-slate-900/10 flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CreditCard className="w-5 h-5" /> 確認扣款並送出訂單 <ArrowRight className="w-4 h-4" /></>}
        </button>

      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 z-50">
         <div className="bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] p-3 flex justify-between items-center shadow-2xl shadow-slate-900/30 border border-white/5">
            <Link href="/" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <LayoutDashboard className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">首頁</span>
            </Link>
            <Link href="/store" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <ShoppingBag className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">商城</span>
            </Link>
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 -mt-8 border-4 border-[#FDFBF7]">
               <Plus className="w-6 h-6 text-white" />
            </div>
            <Link href="/organization" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <Zap className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">組織</span>
            </Link>
            <Link href="/profile" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <User className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">我的</span>
            </Link>
         </div>
      </div>
    </div>
  );
}

export default function Wholesale() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-900" /></div>}>
      <WholesaleContent />
    </Suspense>
  );
}
