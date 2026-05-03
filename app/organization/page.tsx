"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { motion } from "framer-motion";
import { 
  Users, 
  ChevronRight, 
  LayoutDashboard, 
  ShoppingBag, 
  Plus, 
  Zap, 
  User, 
  Loader2,
  TrendingUp,
  Award,
  ArrowRight,
  Share2,
  Activity
} from "lucide-react";

function OrganizationContent() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [downlines, setDownlines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    setCurrentUserId(savedId);
  }, [router]);

  const fetchOrganization = async (userId: string) => {
    setIsLoading(true);
    const { data: mData } = await supabase.from("members").select("*").eq("id", userId).single();
    setMemberInfo(mData);

    const { data } = await supabase
      .from("members")
      .select("*")
      .eq("upline_id", userId)
      .order("created_at", { ascending: false });

    setDownlines(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    if (currentUserId) fetchOrganization(currentUserId);
  }, [currentUserId]);

  if (isLoading && !memberInfo) return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-900" /></div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-50 px-8 py-6 flex justify-between items-center max-w-lg mx-auto">
        <h1 className="text-sm font-black tracking-[0.3em] text-slate-800 uppercase">我的組織</h1>
        <div className="bg-indigo-50 px-4 py-2 rounded-2xl flex items-center gap-2">
           <TrendingUp className="w-4 h-4 text-indigo-600" />
           <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">{downlines.length} PARTNERS</span>
        </div>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-10 mt-4">
        
        {/* Org Banner */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20"
        >
           <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-indigo-500 rounded-full blur-[100px] opacity-20"></div>
           <div className="relative z-10 flex items-center gap-8">
              <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
                 <Users className="w-10 h-10 text-indigo-300" />
              </div>
              <div className="space-y-1">
                 <h2 className="text-2xl font-black tracking-tight">組織發展概況</h2>
                 <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase">Network Growth Hub</p>
              </div>
           </div>
        </motion.section>

        {/* AI Performance Insights */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-6"
        >
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                 </div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">潛力之星</span>
              </div>
              <div>
                 <p className="text-sm font-bold text-slate-800">本月增長最快</p>
                 <p className="text-[10px] text-slate-300 mt-1 font-medium italic">目前為您挑選中...</p>
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Activity className="w-4 h-4 text-emerald-500" />
                 </div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">團隊健康</span>
              </div>
              <div className="flex items-end gap-2">
                 <h4 className="text-2xl font-black text-slate-800">92%</h4>
                 <span className="text-[8px] font-black text-emerald-500 mb-1">OPTIMAL</span>
              </div>
           </div>
        </motion.section>

        {/* Partners List */}
        <div className="space-y-6">
           <div className="flex justify-between items-center px-4">
              <h3 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase">直屬夥伴名單</h3>
              {memberInfo?.is_b2b && (
                <Link href="/exit" className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] hover:opacity-70 transition">
                   無憂退出申請
                </Link>
              )}
           </div>

           {downlines.length === 0 ? (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="bg-white rounded-[3rem] p-16 text-center border border-slate-50 shadow-sm"
             >
                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8">
                   <Users className="w-12 h-12 text-slate-200" />
                </div>
                <h4 className="text-xl font-black text-slate-800">目前尚無夥伴</h4>
                <p className="text-xs text-slate-400 mt-3 leading-relaxed px-10">
                   分享您的專屬推薦碼，開始建立您的數位茶飲團隊。
                </p>
                <div className="mt-8 pt-8 border-t border-slate-50">
                   <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em] mb-3">您的代碼</p>
                   <span className="text-2xl font-black text-emerald-600 tracking-[0.3em] uppercase">{memberInfo?.referral_code}</span>
                </div>
             </motion.div>
           ) : (
             <div className="space-y-4">
                {downlines.map((member, i) => (
                  <motion.div 
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white rounded-[2.5rem] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.02)] border border-slate-50 flex items-center gap-6 group hover:border-indigo-100 transition duration-500"
                  >
                     <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-white font-black text-xl shadow-2xl ${member.is_b2b ? 'bg-indigo-500 shadow-indigo-500/20' : 'bg-emerald-500 shadow-emerald-500/20'}`}>
                        {member.name.charAt(0)}
                     </div>
                     <div className="flex-1 space-y-1">
                        <h4 className="text-lg font-black text-slate-800 tracking-tight">{member.name}</h4>
                        <div className="flex items-center gap-2">
                           <Award className="w-3 h-3 text-amber-400 fill-current" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{member.tier}</span>
                        </div>
                     </div>
                     <div className="text-right space-y-1">
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">累積消費</p>
                        <p className="text-sm font-black text-slate-900">${Number(member.lifetime_spend).toLocaleString()}</p>
                     </div>
                  </motion.div>
                ))}
             </div>
           )}
        </div>

        {/* Invite CTA */}
        <motion.button 
           whileHover={{ scale: 1.02 }}
           whileTap={{ scale: 0.98 }}
           onClick={() => {
              if (navigator.share) {
                 navigator.share({
                    title: '加入初潤製茶所',
                    text: `推薦碼: ${memberInfo?.referral_code}`,
                    url: `${window.location.origin}/register?ref=${memberInfo?.referral_code}`
                 });
              } else {
                 alert(`推薦碼: ${memberInfo?.referral_code}`);
              }
           }}
           className="w-full bg-slate-900 text-white py-8 rounded-[2.5rem] font-black text-sm tracking-[0.2em] hover:bg-slate-800 transition shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-4 mt-8"
        >
           分享推薦邀請卡 <Share2 className="w-5 h-5" />
        </motion.button>

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
            <Link href="/organization" className="flex-1 flex flex-col items-center gap-1 text-white">
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

export default function Organization() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-900" /></div>}>
      <OrganizationContent />
    </Suspense>
  );
}
