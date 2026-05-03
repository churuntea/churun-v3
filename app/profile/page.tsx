"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package,
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
  Fingerprint,
  AlertCircle,
  Award,
  Star,
  Target,
  Trophy,
  Users
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
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>
  );

  const isBankMissing = !memberInfo.bank_account || !memberInfo.bank_code;

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-50 px-8 py-6 flex justify-between items-center max-w-lg mx-auto">
        <h1 className="text-sm font-black tracking-[0.3em] text-slate-800 uppercase">尊榮個人中心</h1>
        <button onClick={handleLogout} className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shadow-sm border border-rose-100 hover:bg-rose-100 transition">
           <LogOut className="w-4 h-4" />
        </button>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-8 mt-4">
        
        {/* Bank Warning Alert */}
        {isBankMissing && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-amber-900 rounded-[2rem] p-6 text-white flex items-center gap-6 shadow-xl shadow-amber-900/20 border border-amber-800"
          >
             <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-300" />
             </div>
             <div className="flex-1 space-y-1">
                <h4 className="text-sm font-black tracking-tight">未設定匯款帳戶</h4>
                <p className="text-[10px] text-white/50 leading-relaxed">請儘速完成設定，以免影響您的分潤提領。</p>
             </div>
             <Link href="/transactions" className="bg-amber-400 text-amber-950 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                去設定
             </Link>
          </motion.div>
        )}

        {/* Elite Membership Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative aspect-[1.586/1] w-full rounded-[3rem] overflow-hidden shadow-2xl p-10 text-white flex flex-col justify-between ${
            memberInfo.tier.includes('靈魂伴侶') ? 'bg-slate-900' : 'bg-emerald-900'
          }`}
        >
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
           <div className={`absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full blur-[100px] opacity-20 ${
             memberInfo.tier.includes('靈魂伴侶') ? 'bg-amber-400' : 'bg-emerald-400'
           }`}></div>
           
           <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1">
                 <h2 className="text-3xl font-black tracking-tight leading-none">{memberInfo.name}</h2>
                 <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-2">{memberInfo.member_code || 'CHURUN-MBR'}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                 <Star className={`w-5 h-5 ${memberInfo.tier.includes('靈魂伴侶') ? 'text-amber-400 fill-amber-400' : 'text-emerald-400'}`} />
              </div>
           </div>

           <div className="relative z-10 flex justify-between items-end">
              <div className="space-y-1">
                 <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30">Membership Tier</p>
                 <Link href="/rewards" className="flex items-center gap-3 group">
                    <span className={`text-2xl font-black tracking-tighter uppercase group-hover:underline underline-offset-8 transition ${
                      memberInfo.tier.includes('靈魂伴侶') ? 'text-amber-400' : 'text-emerald-400'
                    }`}>{memberInfo.tier}</span>
                    <ArrowUpRight className="w-5 h-5 text-white/20 group-hover:text-white transition" />
                 </Link>
              </div>
              <div className="w-16 h-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                 <Fingerprint className="w-8 h-8 text-white/10" />
              </div>
           </div>
        </motion.div>

        {/* Achievement Badge Wall */}
        <div className="bg-white rounded-[3rem] p-8 border border-slate-50 shadow-sm overflow-hidden">
           <div className="flex justify-between items-center mb-8 px-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">解鎖成就標章</h3>
              <span className="text-[8px] font-bold text-slate-300">2 / 8 COLLECTED</span>
           </div>
           <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2">
              {[
                { icon: Zap, label: "首購勳章", active: true, color: "bg-amber-100 text-amber-600" },
                { icon: Users, label: "開疆闢土", active: memberInfo.referral_count > 0, color: "bg-indigo-100 text-indigo-600" },
                { icon: Target, label: "菁英領袖", active: false, color: "bg-slate-100 text-slate-300" },
                { icon: Trophy, label: "業績王", active: false, color: "bg-slate-100 text-slate-300" },
              ].map((badge, i) => (
                <div key={i} className="flex flex-col items-center gap-3 min-w-[70px]">
                   <div className={`w-14 h-14 ${badge.active ? badge.color : 'bg-slate-50 text-slate-200'} rounded-3xl flex items-center justify-center shadow-inner transition`}>
                      <badge.icon className="w-6 h-6" />
                   </div>
                   <span className={`text-[8px] font-black uppercase tracking-widest ${badge.active ? 'text-slate-500' : 'text-slate-300'}`}>{badge.label}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Action List */}
        <div className="space-y-4">
           {[
             { title: "我的訂單中心", icon: Package, color: "text-blue-500 bg-blue-50", href: "/orders" },
             { title: "資產提領與帳戶", icon: CreditCard, color: "text-indigo-500 bg-indigo-50", href: "/transactions" },
             { title: "查看職級特權", icon: Award, color: "text-emerald-500 bg-emerald-50", href: "/rewards" },
             { title: "帳號安全設定", icon: Shield, color: "text-slate-400 bg-slate-50", href: "/profile/security" },
             { title: "安全登出帳號", icon: LogOut, color: "text-rose-500 bg-rose-50", action: "logout" },
           ].map((item, i) => (
             item.action === "logout" ? (
               <button 
                 key={i}
                 onClick={handleLogout}
                 className="w-full bg-white rounded-[2.5rem] p-7 flex items-center gap-6 shadow-sm border border-slate-50 group hover:border-rose-100 transition cursor-pointer"
               >
                  <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center shadow-inner`}>
                     <item.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                     <h4 className="font-black text-slate-800">{item.title}</h4>
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">End Session</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-rose-500 transition" />
               </button>
             ) : (
               <Link 
                 href={item.href || "#"}
                 key={i}
                 className="bg-white rounded-[2.5rem] p-7 flex items-center gap-6 shadow-sm border border-slate-50 group hover:border-emerald-100 transition cursor-pointer"
               >
                  <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center shadow-inner`}>
                     <item.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                     <h4 className="font-black text-slate-800">{item.title}</h4>
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Member Service</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-emerald-500 transition" />
               </Link>
             )
           ))}
        </div>

      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 z-50">
         <div className="bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] p-3 flex justify-between items-center shadow-2xl shadow-slate-900/30 border border-white/5">
            <Link href="/" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <LayoutDashboard className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">主頁</span>
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
            <Link href="/profile" className="flex-1 flex flex-col items-center gap-1 text-white transition">
               <User className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">個人</span>
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
