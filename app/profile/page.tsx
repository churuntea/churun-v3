"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { motion } from "framer-motion";
import { 
  User, 
  Settings, 
  CreditCard, 
  Shield, 
  LogOut, 
  ChevronRight, 
  LayoutDashboard, 
  ShoppingBag, 
  Zap, 
  Plus, 
  Loader2,
  QrCode,
  ArrowUpRight,
  Fingerprint
} from "lucide-react";

function ProfileContent() {
  const router = useRouter();
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    const { data } = await supabase.from("members").select("*").eq("id", userId).single();
    setMemberInfo(data);
    setIsLoading(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  if (isLoading || !memberInfo) return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-200" /></div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-50 px-8 py-6 flex justify-between items-center max-w-lg mx-auto">
        <h1 className="text-sm font-black tracking-[0.3em] text-slate-800 uppercase">個人中心</h1>
        <button onClick={handleLogout} className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
           <LogOut className="w-4 h-4" />
        </button>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-10 mt-4">
        
        {/* Elite Membership Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative aspect-[1.586/1] w-full rounded-[2.5rem] bg-slate-900 overflow-hidden shadow-2xl p-10 text-white flex flex-col justify-between"
        >
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
           <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-20"></div>
           
           <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1">
                 <h2 className="text-2xl font-black tracking-tight">{memberInfo.name}</h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{memberInfo.member_code}</p>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                 <Fingerprint className="w-6 h-6 text-emerald-400" />
              </div>
           </div>

           <div className="relative z-10 flex justify-between items-end">
              <div className="space-y-1">
                 <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">Membership Tier</p>
                 <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-emerald-400 tracking-tighter uppercase">{memberInfo.tier}</span>
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                 </div>
              </div>
              <Link href="/profile/card" className="w-16 h-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition group">
                 <QrCode className="w-8 h-8 text-white/20 group-hover:text-emerald-400 transition" />
              </Link>
           </div>
        </motion.div>

        {/* Action List */}
        <div className="space-y-4">
           {[
             { title: "提領與銀行設定", icon: CreditCard, color: "text-indigo-500 bg-indigo-50" },
             { title: "世襲與受益人", icon: Shield, color: "text-emerald-500 bg-emerald-50" },
             { title: "帳號安全設定", icon: Settings, color: "text-amber-500 bg-amber-50" },
           ].map((item, i) => (
             <motion.div 
               key={i}
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: i * 0.1 }}
               className="bg-white rounded-[2rem] p-6 flex items-center gap-5 shadow-sm border border-slate-50 group hover:border-emerald-100 transition cursor-pointer"
             >
                <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center shadow-inner`}>
                   <item.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                   <h4 className="font-bold text-slate-800">{item.title}</h4>
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Manage Settings</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-emerald-500 transition" />
             </motion.div>
           ))}
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-[3rem] p-10 border border-slate-50 shadow-sm grid grid-cols-2 gap-8">
           <div className="space-y-1">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">有效推薦</p>
              <p className="text-3xl font-black text-slate-800">{memberInfo.referral_count || 0} <span className="text-xs font-medium text-slate-300">人</span></p>
           </div>
           <div className="space-y-1">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">當季累積</p>
              <p className="text-3xl font-black text-slate-800">${Number(memberInfo.quarterly_spend || 0).toLocaleString()}</p>
           </div>
        </div>

      </main>

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
            <Link href="/profile" className="flex-1 flex flex-col items-center gap-1 text-white transition">
               <User className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Me</span>
            </Link>
         </div>
      </div>
    </div>
  );
}

export default function Profile() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>}>
      <ProfileContent />
    </Suspense>
  );
}
