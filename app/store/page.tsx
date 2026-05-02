"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { 
  ShoppingBag, 
  ChevronRight, 
  LayoutDashboard, 
  Zap, 
  User, 
  Plus, 
  Loader2,
  CheckCircle2,
  Gift,
  Star
} from "lucide-react";

const STORE_ITEMS = [
  { id: 1, name: "初潤黑金特製保溫瓶", points: 300, image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&q=80" },
  { id: 2, name: "初潤典藏茶具組", points: 800, image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=80" },
  { id: 3, name: "品牌限量帆布袋", points: 150, image: "https://images.unsplash.com/photo-1597554904261-0d359b3fb07c?w=500&q=80" }
];

function StoreContent() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    setCurrentUserId(savedId);
  }, [router]);

  const fetchUser = async () => {
    if (!currentUserId) return;
    const { data } = await supabase.from("members").select("*").eq("id", currentUserId).single();
    setMemberInfo(data);
  };

  useEffect(() => {
    fetchUser();
  }, [currentUserId]);

  const handleRedeem = async (item: any) => {
    if (!memberInfo || memberInfo.is_b2b) {
      alert("僅限 B2C 會員使用點數換購！");
      return;
    }
    if (memberInfo.points_balance < item.points) {
      alert("點數餘額不足！");
      return;
    }

    if (!confirm(`確定要花費 ${item.points} 點兌換「${item.name}」嗎？`)) return;

    setIsRedeeming(true);
    try {
      const res = await fetch('/api/store/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: currentUserId, item_id: item.id, points: item.points, item_name: item.name })
      });
      const data = await res.json();
      
      if (data.success) {
        alert("🎉 兌換成功！商品將寄送至您的預設地址。");
        fetchUser();
      } else {
        alert("兌換失敗: " + data.error);
      }
    } catch (err) { alert("系統錯誤"); }
    setIsRedeeming(false);
  };

  if (!memberInfo) return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-900" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-50 px-6 py-4 flex justify-between items-center max-w-lg mx-auto">
        <h1 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">點數商城</h1>
        <div className="bg-emerald-50 px-3 py-1.5 rounded-full flex items-center gap-2">
           <Star className="w-3 h-3 text-emerald-600 fill-current" />
           <span className="text-xs font-black text-emerald-700">{memberInfo.points_balance} PTS</span>
        </div>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-8 mt-2">
        
        {/* Banner */}
        <section className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
           <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/5 blur-2xl"></div>
           <div className="relative z-10 flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md">
                 <Gift className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                 <h2 className="text-xl font-bold tracking-tight">專屬好禮兌換</h2>
                 <p className="text-xs text-white/40 mt-1">使用消費累積的點數，帶走品牌限量周邊。</p>
              </div>
           </div>
        </section>

        {/* Store Items Grid */}
        <div className="grid grid-cols-2 gap-6">
          {STORE_ITEMS.map((item) => (
            <div key={item.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-slate-50 flex flex-col group hover:border-emerald-100 transition duration-500">
              <div className="h-40 w-full bg-slate-50 relative overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                <div className="absolute top-4 left-4">
                   <div className="bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-emerald-800 shadow-sm">
                      {item.points} PTS
                   </div>
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h4 className="font-bold text-slate-800 text-sm mb-4 leading-tight min-h-[2.5rem]">{item.name}</h4>
                <button 
                  onClick={() => handleRedeem(item)}
                  disabled={isRedeeming || memberInfo.is_b2b || memberInfo.points_balance < item.points}
                  className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition disabled:bg-slate-50 disabled:text-slate-300 bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 active:scale-95"
                >
                  {isRedeeming ? "處理中..." : "立即兌換"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {memberInfo.is_b2b && (
           <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100/50 text-center">
              <p className="text-xs font-bold text-amber-700 leading-relaxed">
                 溫馨提示：B2B 創業夥伴不適用點數兌換商城，<br/>您的獎金已全數回饋至虛擬帳戶餘額。
              </p>
           </div>
        )}
      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 z-50">
         <div className="bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] p-3 flex justify-between items-center shadow-2xl shadow-slate-900/30 border border-white/5">
            <Link href="/" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <LayoutDashboard className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">首頁</span>
            </Link>
            <Link href="/store" className="flex-1 flex flex-col items-center gap-1 text-white">
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

export default function Store() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-900" /></div>}>
      <StoreContent />
    </Suspense>
  );
}
