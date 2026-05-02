"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
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
  ArrowRight
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
    if (currentUserId) {
      fetchOrganization(currentUserId);
    }
  }, [currentUserId]);

  if (isLoading && !memberInfo) return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-900" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-50 px-6 py-4 flex justify-between items-center max-w-lg mx-auto">
        <h1 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">我的組織</h1>
        <div className="bg-indigo-50 px-3 py-1.5 rounded-full flex items-center gap-2">
           <TrendingUp className="w-3 h-3 text-indigo-600" />
           <span className="text-xs font-black text-indigo-700">{downlines.length} 人</span>
        </div>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-8 mt-2">
        
        {/* Org Summary */}
        <section className="bg-indigo-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20">
           <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/5 blur-2xl"></div>
           <div className="relative z-10 flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md">
                 <Users className="w-8 h-8 text-indigo-200" />
              </div>
              <div>
                 <h2 className="text-xl font-bold tracking-tight">組織發展概況</h2>
                 <p className="text-xs text-white/40 mt-1">目前已成功連結 {downlines.length} 位夥伴入會。</p>
              </div>
           </div>
        </section>

        {/* Downlines List */}
        <div className="space-y-4">
           <div className="flex justify-between items-center px-2">
              <h3 className="text-lg font-black tracking-tight text-slate-800">直屬夥伴名單</h3>
              {memberInfo?.is_b2b && (
                <Link href="/exit" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition">
                   申請無憂退出
                </Link>
              )}
           </div>

           {downlines.length === 0 ? (
             <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-50 shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Users className="w-10 h-10 text-slate-200" />
                </div>
                <h4 className="font-bold text-slate-400">目前尚無夥伴</h4>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                   快分享您的推薦碼：<br/>
                   <span className="font-mono font-black text-emerald-600 tracking-widest text-sm mt-1 block">{memberInfo?.referral_code}</span>
                </p>
             </div>
           ) : (
             <div className="space-y-4">
                {downlines.map((member) => (
                  <div key={member.id} className="bg-white rounded-[2rem] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-slate-50 flex items-center gap-4 group transition duration-500">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black shadow-lg ${member.is_b2b ? 'bg-indigo-500 shadow-indigo-500/20' : 'bg-emerald-500 shadow-emerald-500/20'}`}>
                        {member.name.charAt(0)}
                     </div>
                     <div className="flex-1">
                        <h4 className="font-bold text-slate-800">{member.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                           <Award className="w-3 h-3 text-amber-400" />
                           <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">{member.tier}</span>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">累積消費</p>
                        <p className="text-sm font-black text-slate-700 mt-0.5">${Number(member.lifetime_spend).toLocaleString()}</p>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>

        {/* Invite Banner */}
        <button 
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
           className="w-full bg-emerald-900 text-white py-6 rounded-3xl font-bold text-sm hover:bg-emerald-800 transition shadow-2xl shadow-emerald-900/20 flex items-center justify-center gap-3 mt-8"
        >
           分享推薦邀請卡 <ArrowRight className="w-4 h-4" />
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
            <Link href="/organization" className="flex-1 flex flex-col items-center gap-1 text-white">
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

export default function Organization() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-900" /></div>}>
      <OrganizationContent />
    </Suspense>
  );
}
