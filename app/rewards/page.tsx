"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Award, 
  Lock, 
  Unlock, 
  Star, 
  Zap, 
  TrendingUp, 
  Gift, 
  ChevronRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  ShieldCheck
} from "lucide-react";

const TIER_DATA = [
  { 
    name: "初潤寶寶", 
    color: "from-slate-400 to-slate-500", 
    benefits: ["消費即享紅利積點", "基礎品牌活動參與"],
    requirement: "加入會員即可",
    points: "1.0x"
  },
  { 
    name: "初潤知己", 
    color: "from-emerald-400 to-emerald-600", 
    benefits: ["紅利點數 1.2 倍送", "專屬節慶禮券", "首購優惠折扣"],
    requirement: "季消費滿 $5,000",
    points: "1.2x"
  },
  { 
    name: "初潤靈魂伴侶", 
    color: "from-amber-400 to-yellow-600", 
    benefits: ["紅利點數 1.5 倍送", "VIP 私人品茗會", "新品搶先體驗權", "生日專屬豪禮"],
    requirement: "季消費滿 $20,000",
    points: "1.5x"
  },
  { 
    name: "初潤守護神", 
    color: "from-indigo-500 to-purple-700", 
    benefits: ["紅利點數 2.0 倍送", "終身免運特權", "總部年度分紅參與", "專屬數位身份黑卡"],
    requirement: "季消費滿 $50,000",
    points: "2.0x"
  }
];

function RewardsContent() {
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

  const currentTierIndex = TIER_DATA.findIndex(t => t.name === memberInfo?.tier);

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-20">
      
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-50 px-8 py-6 flex items-center gap-6 max-w-lg mx-auto">
         <Link href="/" className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition">
            <ArrowLeft className="w-5 h-5" />
         </Link>
         <h1 className="text-sm font-black tracking-[0.3em] text-slate-800 uppercase">尊榮權益中心</h1>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-12 mt-4">
        
        {/* Status Header */}
        <header className="space-y-4">
           <div className="flex items-center gap-3 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Verified Excellence</span>
           </div>
           <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
              您的階級是 <span className="text-emerald-600">{memberInfo?.tier}</span>
           </h2>
           <p className="text-sm text-slate-400 font-medium leading-relaxed">
              您的每一筆消費都在為品牌賦能。以下是您已解鎖及未來可期的專屬權益。
           </p>
        </header>

        {/* Tiers List */}
        <div className="space-y-8">
           {TIER_DATA.map((tier, idx) => {
              const isUnlocked = idx <= currentTierIndex;
              const isNext = idx === currentTierIndex + 1;

              return (
                <motion.div 
                  key={tier.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative p-10 rounded-[3rem] overflow-hidden border transition-all duration-500 ${isUnlocked ? 'bg-white border-slate-100 shadow-xl' : 'bg-slate-50 border-transparent opacity-60'}`}
                >
                   {/* Background Glow */}
                   {isUnlocked && <div className={`absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-gradient-to-br ${tier.color} opacity-5 blur-3xl`}></div>}
                   
                   <div className="flex justify-between items-start mb-8 relative z-10">
                      <div className="space-y-3">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${tier.color} shadow-lg shadow-slate-200`}>
                            {isUnlocked ? <Unlock className="w-6 h-6 text-white" /> : <Lock className="w-6 h-6 text-slate-300" />}
                         </div>
                         <h3 className={`text-xl font-black tracking-tight ${isUnlocked ? 'text-slate-900' : 'text-slate-400'}`}>{tier.name}</h3>
                      </div>
                      <div className="text-right">
                         <p className="text-[8px] font-black uppercase tracking-widest text-slate-300 mb-1">積分係數</p>
                         <span className={`text-2xl font-black ${isUnlocked ? 'text-emerald-600' : 'text-slate-300'}`}>{tier.points}</span>
                      </div>
                   </div>

                   <div className="space-y-4 relative z-10">
                      {tier.benefits.map((b, i) => (
                        <div key={i} className="flex items-center gap-3">
                           <div className={`w-1.5 h-1.5 rounded-full ${isUnlocked ? 'bg-emerald-400' : 'bg-slate-200'}`}></div>
                           <span className={`text-xs font-bold ${isUnlocked ? 'text-slate-600' : 'text-slate-300'}`}>{b}</span>
                        </div>
                      ))}
                   </div>

                   {isNext && (
                     <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <Zap className="w-4 h-4 text-amber-500 fill-current" />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">解鎖下一階</span>
                        </div>
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{tier.requirement}</span>
                     </div>
                   )}

                   {isUnlocked && <Sparkles className="absolute bottom-10 right-10 w-8 h-8 text-slate-50" />}
                </motion.div>
              );
           })}
        </div>

      </main>

    </div>
  );
}

export default function Rewards() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>}>
      <RewardsContent />
    </Suspense>
  );
}
