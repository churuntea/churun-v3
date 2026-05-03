"use client";

import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Award, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  Zap, 
  Heart, 
  Star,
  ShieldCheck,
  TrendingUp,
  Crown
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const TIERS = [
  { 
    name: '初潤靈魂伴侶', 
    privileges: ['直推分潤 50%', '團隊業績加成 10%', '專屬客製化 LOGO 服務', '年度股東分紅資格', '受邀參加全球領袖大會'],
    color: 'from-amber-400 via-amber-200 to-amber-500',
    icon: Crown,
    locked: true
  },
  { 
    name: '初潤知己', 
    privileges: ['直推分潤 40%', '團隊業績加成 5%', '季度禮品驚喜包', '提領手續費減免'],
    color: 'from-emerald-400 to-emerald-600',
    icon: Heart,
    locked: true
  },
  { 
    name: '初潤好朋友', 
    privileges: ['直推分潤 20%', '點數商城 8 折優惠', '專屬客服通道'],
    color: 'from-indigo-400 to-indigo-600',
    icon: Sparkles,
    locked: true
  },
  { 
    name: '初潤寶寶', 
    privileges: ['首購禮包', '5% 積分回饋', '基礎推薦碼功能'],
    color: 'from-slate-400 to-slate-600',
    icon: Zap,
    locked: false
  }
];

export default function Rewards() {
  const router = useRouter();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -30 },
    show: { opacity: 1, x: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 pb-32">
      
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-8 flex items-center gap-6 max-w-2xl mx-auto bg-[#FDFBF7]/80 backdrop-blur-xl">
         <button onClick={() => router.back()} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
         </button>
         <div>
            <h1 className="text-xl font-black tracking-tight">職級榮耀殿堂</h1>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Tier Privileges & Rewards</p>
         </div>
      </nav>

      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-2xl mx-auto px-8 pt-32 space-y-16"
      >
        
        {/* Intro Section */}
        <motion.section variants={itemVariants} className="text-center space-y-6">
           <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
              <Award className="w-10 h-10 text-emerald-600" />
           </div>
           <h2 className="text-3xl font-black tracking-tight leading-tight px-4">
              每一分耕耘，<br/>都值得<span className="text-emerald-600">最高規格</span>的回報
           </h2>
           <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-md mx-auto">
              初潤的八階成長體系，不僅記錄您的業績，更見證您的品牌影響力。升級後即可解鎖更強大的獲利引擎。
           </p>
        </motion.section>

        {/* Tiers List */}
        <section className="space-y-8">
           {TIERS.map((tier, i) => (
             <motion.div 
               key={i} 
               variants={itemVariants}
               className="relative group"
             >
                <div className={`absolute inset-0 bg-gradient-to-r ${tier.color} rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-10 transition duration-500`}></div>
                <div className="relative bg-white rounded-[3rem] p-10 border border-slate-50 shadow-sm overflow-hidden">
                   
                   <div className="flex justify-between items-start mb-10">
                      <div className="flex items-center gap-6">
                         <div className={`w-16 h-16 bg-gradient-to-br ${tier.color} rounded-3xl flex items-center justify-center text-white shadow-lg`}>
                            <tier.icon className="w-8 h-8" />
                         </div>
                         <div className="space-y-1">
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{tier.name}</h3>
                            <div className="flex items-center gap-2">
                               <TrendingUp className="w-3 h-3 text-emerald-500" />
                               <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Premium Level</span>
                            </div>
                         </div>
                      </div>
                      {tier.locked && (
                        <div className="bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-slate-100">
                           <Lock className="w-3 h-3 text-slate-300" />
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Locked</span>
                        </div>
                      )}
                   </div>

                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">解鎖特權內容</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {tier.privileges.map((priv, j) => (
                           <div key={j} className="flex items-center gap-3">
                              <CheckCircle2 className={`w-4 h-4 ${tier.locked ? 'text-slate-200' : 'text-emerald-500'}`} />
                              <span className={`text-sm font-bold ${tier.locked ? 'text-slate-300' : 'text-slate-600'}`}>{priv}</span>
                           </div>
                         ))}
                      </div>
                   </div>

                </div>
             </motion.div>
           ))}
        </section>

        {/* Global Stats Counter (Fake Dynamic) */}
        <motion.section variants={itemVariants} className="bg-slate-900 rounded-[4rem] p-16 text-center text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-emerald-500 rounded-full blur-[100px] opacity-20"></div>
           <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-8" />
           <h3 className="text-2xl font-black mb-4">準備好晉升了嗎？</h3>
           <p className="text-xs text-white/40 leading-relaxed mb-10 px-8 font-medium">
              系統會在每季末自動執行「靈魂考核」。確保您的團隊業績與推薦人數達標，即可無縫升級並領取更高的分潤獎金。
           </p>
           <Link href="/organization" className="inline-flex items-center gap-4 bg-white text-slate-900 px-12 py-6 rounded-[2rem] font-black text-sm tracking-[0.2em] hover:scale-105 transition shadow-2xl">
              查看我的團隊戰力 <Zap className="w-5 h-5 text-amber-500" />
           </Link>
        </motion.section>

      </motion.main>

      {/* Footer */}
      <footer className="text-center py-20 border-t border-slate-50 mt-20">
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">
            CHURUN ELITE PRIVILEGE SYSTEM
         </p>
      </footer>
    </div>
  );
}
