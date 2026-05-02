"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "./supabase";
import { 
  User, 
  ShoppingBag, 
  Wallet, 
  Award, 
  LogOut, 
  ChevronRight, 
  Plus, 
  Minus, 
  CreditCard,
  Zap,
  Star,
  CheckCircle2,
  Loader2,
  Phone,
  LayoutDashboard
} from "lucide-react";

function DashboardContent() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isOrdering, setIsOrdering] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchProducts();
  }, []);

  const checkAuth = async () => {
    const savedId = localStorage.getItem("churun_member_id");
    if (savedId) {
      await fetchMemberData(savedId);
      setIsAuthenticated(true);
      
      const hasSeenWelcome = sessionStorage.getItem("has_seen_welcome");
      if (!hasSeenWelcome) {
        setShowWelcomeModal(true);
        sessionStorage.setItem("has_seen_welcome", "true");
      }
    } else {
      router.push("/login");
    }
    setIsCheckingAuth(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').eq('status', 'active').order('created_at', { ascending: false });
    setProducts(data || []);
  };

  const fetchMemberData = async (userId: string) => {
    const { data: memberData } = await supabase.from("members").select("*").eq("id", userId).single();
    if (memberData) {
      setMemberInfo(memberData);
    } else {
      handleLogout();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("churun_member_id");
    sessionStorage.removeItem("has_seen_welcome");
    router.push("/login");
  };

  const updateQuantity = (productId: string, delta: number) => {
    setQuantities(prev => ({ ...prev, [productId]: Math.max(0, (prev[productId] || 0) + delta) }));
  };

  const handleOrder = async () => {
    const items = Object.entries(quantities).filter(([_, q]) => q > 0).map(([id, quantity]) => ({ id, quantity }));
    if (items.length === 0) return alert("請先選擇商品");
    
    setIsOrdering(true);
    try {
      const res = await fetch('/api/orders/dynamic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer_id: memberInfo.id, items })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setQuantities({});
        fetchMemberData(memberInfo.id);
      } else {
        alert(data.error || "下單失敗");
      }
    } catch (err) { alert("下單失敗"); }
    setIsOrdering(false);
  };

  if (isCheckingAuth) return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-900" />
    </div>
  );

  if (!memberInfo) return null;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 pb-32">
      
      {/* Premium Header */}
      <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-50 px-6 py-4 flex justify-between items-center max-w-lg mx-auto">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-emerald-900 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-900/20">
              <span className="text-white text-[10px] font-black tracking-tighter">CR</span>
           </div>
           <h1 className="text-sm font-black tracking-widest text-emerald-900">CHURUN-MEMBER</h1>
        </div>
        <div className="flex items-center gap-4">
           <Link href="/profile" className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-200 transition">
             <User className="w-5 h-5" />
           </Link>
           <button onClick={handleLogout} className="text-slate-300 hover:text-rose-500 transition">
             <LogOut className="w-5 h-5" />
           </button>
        </div>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-8">
        
        {/* Profile Card */}
        <section className="bg-emerald-900 rounded-[3rem] p-8 text-white shadow-2xl shadow-emerald-900/30 relative overflow-hidden">
           {/* Decorative elements */}
           <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-emerald-700/30 rounded-full blur-2xl"></div>
           <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl"></div>
           
           <div className="relative z-10">
              <div className="flex justify-between items-start mb-10">
                 <div>
                    <h2 className="text-2xl font-bold">{memberInfo.name}</h2>
                    <div className="flex items-center gap-2 mt-2">
                       <Award className="w-4 h-4 text-amber-400" />
                       <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-400/80">{memberInfo.tier}</span>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">UID</p>
                    <p className="text-xs font-mono font-medium opacity-80">{memberInfo.member_code}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-emerald-200">紅利點數</p>
                    <div className="flex items-baseline gap-1">
                       <span className="text-2xl font-black">{memberInfo.points_balance.toLocaleString()}</span>
                       <span className="text-[10px] font-bold opacity-40">PTS</span>
                    </div>
                 </div>
                 <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-emerald-200">虛擬餘額</p>
                    <div className="flex items-baseline gap-1">
                       <span className="text-[10px] font-bold opacity-40">$</span>
                       <span className="text-2xl font-black">{Number(memberInfo.virtual_balance).toLocaleString()}</span>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* Quick Shopping Section */}
        <section className="space-y-6">
           <div className="flex justify-between items-center px-2">
              <h3 className="text-xl font-bold tracking-tight">精選商品</h3>
              <Link href="/store" className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                 全部商品 <ChevronRight className="w-3 h-3" />
              </Link>
           </div>

           <div className="space-y-4">
              {products.map(p => (
                <div key={p.id} className="bg-white rounded-[2rem] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-slate-50 flex items-center gap-4 group hover:border-emerald-100 transition duration-500">
                   <div className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden relative shadow-inner">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-200"><ShoppingBag className="w-8 h-8" /></div>
                      )}
                   </div>
                   <div className="flex-1">
                      <h4 className="font-bold text-slate-800">{p.name}</h4>
                      <p className="text-xs text-slate-400 mt-1">${p.price.toLocaleString()}</p>
                   </div>
                   <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-2xl">
                      <button 
                        onClick={() => updateQuantity(p.id, -1)} 
                        className="w-8 h-8 rounded-xl bg-white text-slate-400 shadow-sm flex items-center justify-center hover:text-rose-500 transition active:scale-90"
                      >
                         <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-6 text-center font-black text-sm text-slate-700">{quantities[p.id] || 0}</span>
                      <button 
                        onClick={() => updateQuantity(p.id, 1)} 
                        className="w-8 h-8 rounded-xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20 flex items-center justify-center transition active:scale-90"
                      >
                         <Plus className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              ))}
           </div>

           <button 
             onClick={handleOrder} 
             disabled={isOrdering || Object.values(quantities).every(q => q === 0)}
             className="w-full bg-slate-900 text-white py-6 rounded-3xl font-bold text-sm hover:bg-slate-800 transition shadow-2xl shadow-slate-900/10 flex items-center justify-center gap-3 disabled:opacity-50 disabled:shadow-none"
           >
              {isOrdering ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CreditCard className="w-5 h-5" /> 立即下單結帳</>}
           </button>
        </section>

        {/* Promotion Banner */}
        <section className="bg-amber-50 rounded-[2.5rem] p-8 border border-amber-100/50 flex items-center gap-6 relative overflow-hidden">
           <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12">
              <Zap className="w-32 h-32 text-amber-500" />
           </div>
           <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-400/20">
              <Star className="w-6 h-6 fill-current" />
           </div>
           <div>
              <h4 className="font-black text-amber-900 text-sm tracking-tight">升級夥伴計畫</h4>
              <p className="text-xs text-amber-700 mt-1 opacity-70">提升階級，獲得更高的分紅比例與專屬特權。</p>
           </div>
           <ChevronRight className="w-5 h-5 text-amber-400 ml-auto" />
        </section>

      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 z-50">
         <div className="bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] p-3 flex justify-between items-center shadow-2xl shadow-slate-900/30 border border-white/5">
            <Link href="/" className="flex-1 flex flex-col items-center gap-1 text-white">
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

      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-white rounded-[3rem] w-full max-w-sm overflow-hidden shadow-2xl relative p-10 text-center animate-in zoom-in-95 duration-500">
             <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
             </div>
             <h3 className="text-2xl font-bold text-slate-900 mb-2">歡迎回來</h3>
             <p className="text-sm text-slate-400 mb-10">我們已經為您更新了最新的帳務與積分資訊。</p>
             
             <button onClick={() => setShowWelcomeModal(false)} className="w-full py-6 bg-emerald-900 text-white rounded-3xl font-bold text-sm shadow-2xl shadow-emerald-900/20 hover:bg-emerald-800 transition">
                進入儀表板
             </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-900" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}