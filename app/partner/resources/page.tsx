"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, BookOpen, Video, FileText, Download, Loader2, PlayCircle } from "lucide-react";

function PartnerResourcesContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/me/dashboard");
        if (!res.ok) throw new Error("Fetch failed");
        const data = await res.json();
        
        if (!data.member || !data.member.tier?.includes("合夥人")) {
           router.replace("/");
           return;
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (isLoading) return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 pb-32 font-sans">
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 px-6 py-6 flex items-center justify-between max-w-lg mx-auto">
        <button onClick={() => router.push("/partner")} className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 active:scale-90 transition">
          <ChevronLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <h1 className="text-[11px] font-black tracking-[0.3em] text-white uppercase">高階資源庫</h1>
        </div>
      </nav>

      <main className="p-6 max-w-lg mx-auto space-y-8">
         <section>
            <h2 className="text-xl font-black text-white mb-6">推薦培訓課程</h2>
            <div className="space-y-4">
               {[
                 { title: "2026 Q2 合夥人全球戰略會議", duration: "1h 45m", type: "video" },
                 { title: "如何有效帶領百人以上團隊", duration: "45m", type: "video" },
                 { title: "高客單價客戶談判技巧", duration: "32m", type: "video" }
               ].map((course, i) => (
                 <div key={i} className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex items-center gap-4 hover:bg-slate-800 transition-colors cursor-pointer group">
                    <div className="relative w-24 h-16 bg-slate-800 rounded-xl overflow-hidden shrink-0 border border-white/10 group-hover:border-blue-500/50 transition-colors">
                       <div className="absolute inset-0 flex items-center justify-center">
                          <PlayCircle className="w-6 h-6 text-white/50 group-hover:text-blue-400 transition-colors" />
                       </div>
                    </div>
                    <div>
                       <h3 className="text-sm font-black text-white line-clamp-2">{course.title}</h3>
                       <p className="text-[10px] font-bold text-slate-500 mt-1">{course.duration}</p>
                    </div>
                 </div>
               ))}
            </div>
         </section>

         <section>
            <h2 className="text-xl font-black text-white mb-6">專屬行銷素材</h2>
            <div className="grid grid-cols-2 gap-4">
               {[
                 { title: "頂級茶葉型錄 (PDF)", icon: FileText, color: "text-rose-400", bg: "bg-rose-500/10" },
                 { title: "社交媒體圖文包", icon: Download, color: "text-indigo-400", bg: "bg-indigo-500/10" },
                 { title: "合夥人專屬短影音", icon: Video, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                 { title: "企業採購報價單", icon: FileText, color: "text-amber-400", bg: "bg-amber-500/10" }
               ].map((item, i) => (
                 <div key={i} className="bg-slate-900/50 p-5 rounded-2xl border border-white/5 text-center hover:bg-slate-800 transition-colors cursor-pointer group">
                    <div className={`w-12 h-12 mx-auto ${item.bg} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                       <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <p className="text-xs font-black text-white">{item.title}</p>
                 </div>
               ))}
            </div>
         </section>
      </main>
    </div>
  );
}

export default function PartnerResources() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0F172A] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-amber-500" /></div>}>
      <PartnerResourcesContent />
    </Suspense>
  );
}
