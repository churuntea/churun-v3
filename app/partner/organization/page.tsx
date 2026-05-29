"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, Users, Search, Loader2, Star, TrendingUp, User } from "lucide-react";
import { supabase } from "@/app/supabase";

function PartnerOrganizationContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [downlines, setDownlines] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchOrgData = async () => {
      try {
        const res = await fetch("/api/me/dashboard");
        if (!res.ok) throw new Error("Fetch failed");
        const data = await res.json();
        
        if (!data.member || !data.member.tier?.includes("合夥人")) {
           router.replace("/");
           return;
        }

        const { data: downlinesData } = await supabase
          .from("members")
          .select("*")
          .eq("upline_id", data.member.id);
          
        if (downlinesData) {
           setDownlines(downlinesData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrgData();
  }, [router]);

  if (isLoading) return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
    </div>
  );

  const filteredDownlines = downlines.filter(d => 
    (d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (d.member_code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 pb-32 font-sans">
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 px-6 py-6 flex items-center justify-between max-w-lg mx-auto">
        <button onClick={() => router.push("/partner")} className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 active:scale-90 transition">
          <ChevronLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          <h1 className="text-[11px] font-black tracking-[0.3em] text-white uppercase">合夥人專屬組織樹</h1>
        </div>
      </nav>

      <main className="p-6 max-w-lg mx-auto space-y-6">
         <div className="relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors">
               <Search className="w-5 h-5" />
            </div>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋夥伴姓名或編號..." 
              className="w-full bg-slate-900/50 border border-white/10 p-6 pl-16 rounded-[2rem] text-sm font-bold text-white focus:outline-none focus:bg-slate-900 focus:border-amber-500/50 transition-all shadow-inner placeholder-slate-600"
            />
         </div>

         <div className="space-y-4">
            {filteredDownlines.length > 0 ? filteredDownlines.map((member, idx) => (
              <motion.div 
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-6 hover:bg-slate-800 transition-colors"
              >
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center border border-indigo-500/30">
                          <User className="w-5 h-5" />
                       </div>
                       <div>
                          <p className="text-sm font-black text-white">{member.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 font-mono mt-0.5">{member.member_code}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <span className="inline-block px-2 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-md text-[9px] font-black tracking-widest">
                          {member.tier || "一般會員"}
                       </span>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                    <div>
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">終身累積業績</p>
                       <p className="text-xs font-black text-slate-300 font-mono">${Number(member.lifetime_spend || 0).toLocaleString()}</p>
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                         <TrendingUp className="w-3 h-3 text-emerald-500" /> 本月活躍度
                       </p>
                       <p className="text-xs font-black text-emerald-400">高</p>
                    </div>
                 </div>
              </motion.div>
            )) : (
              <div className="text-center py-10 bg-slate-900/30 rounded-[2rem] border border-dashed border-white/10">
                 <p className="text-xs font-bold text-slate-500">找不到符合的成員</p>
              </div>
            )}
         </div>
      </main>
    </div>
  );
}

export default function PartnerOrganization() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0F172A] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-amber-500" /></div>}>
      <PartnerOrganizationContent />
    </Suspense>
  );
}
