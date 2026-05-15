'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  ChevronLeft, 
  Target, 
  Award, 
  Users, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  Info,
  Edit3,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const TIERS = [
  { 
    name: '初潤靈魂伴侶', 
    minSpend: 50000, 
    rate: 30, 
    desc: '品牌核心領袖級別，享有最高分紅比例與專屬權益。',
    color: 'from-indigo-600 to-indigo-900',
    icon: Award,
    privileges: ['專屬客服', '新品預購優先權', '最高級別分紅']
  },
  { 
    name: '初潤知己', 
    minSpend: 25000, 
    rate: 40, 
    desc: '核心支持者，穩定參與品牌活動。',
    color: 'from-emerald-600 to-emerald-900',
    icon: ShieldCheck,
    privileges: ['生日禮金', '活動受邀權', '進階級別分紅']
  },
  { 
    name: '初潤閨蜜', 
    minSpend: 12000, 
    rate: 50, 
    desc: '品牌好友，分享茶飲生活的伴侶。',
    color: 'from-amber-600 to-amber-900',
    icon: Zap,
    privileges: ['定期回饋', '免運優惠']
  },
  { 
    name: '初潤好朋友', 
    minSpend: 6000, 
    rate: 60, 
    desc: '活躍會員，品牌忠實粉絲。',
    color: 'from-pink-600 to-pink-900',
    icon: Users,
    privileges: ['基本回饋', '會員專屬價']
  },
  { 
    name: '初潤青少年', 
    minSpend: 3000, 
    rate: 70, 
    desc: '成長中的品牌愛好者。',
    color: 'from-slate-600 to-slate-900',
    icon: TrendingUp,
    privileges: ['基本回饋']
  },
  { 
    name: '初潤小朋友', 
    minSpend: 1500, 
    rate: 80, 
    desc: '新晉愛好者，剛開始探索茶飲世界。',
    color: 'from-slate-500 to-slate-700',
    icon: Target,
    privileges: ['基本回饋']
  },
  { 
    name: '初潤幼兒園', 
    minSpend: 1, 
    rate: 90, 
    desc: '體驗期會員，探索品牌價值。',
    color: 'from-slate-400 to-slate-600',
    icon: HelpCircle,
    privileges: ['基本回饋']
  },
  { 
    name: '初潤寶寶', 
    minSpend: 0, 
    rate: 100, 
    desc: '註冊新成員，品牌的新生命。',
    color: 'from-slate-300 to-slate-500',
    icon: Info,
    privileges: ['基本回饋']
  }
];

export default function BonusStructurePage() {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<string>(TIERS[0].name);

  const currentTier = TIERS.find(t => t.name === selectedTier) || TIERS[0];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 pb-20">
      {/* Top Header Navigation */}
      <nav className="sticky top-0 z-[60] bg-[#FDFBF7]/90 backdrop-blur-xl border-b border-slate-100/80 px-6 py-4 flex justify-between items-center max-w-5xl mx-auto">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">獎金發放結構管理</h1>
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-0.5">Bonus & Tier Architecture</p>
        </div>
        <div className="w-10" />
      </nav>

      <main className="max-w-5xl mx-auto p-6 md:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Tier List Selection */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-500" /> 會員階級列表
              </h3>
              <div className="space-y-2">
                {TIERS.map((tier) => (
                  <button
                    key={tier.name}
                    onClick={() => setSelectedTier(tier.name)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${
                      selectedTier === tier.name 
                      ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 translate-x-2' 
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-white`}>
                        <tier.icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black tracking-wide">{tier.name}</span>
                    </div>
                    <ArrowRight className={`w-4 h-4 transition-opacity ${selectedTier === tier.name ? 'opacity-100' : 'opacity-0'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-indigo-900 rounded-[2.5rem] p-6 text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2">快速操作</h4>
                <p className="text-xs font-bold leading-relaxed mb-6">目前的獎金發放邏輯已與結算系統動態同步。若需調整權重比例，請聯繫技術團隊或於系統設定中修改。</p>
                <button 
                  onClick={() => router.push('/admin/evaluation')}
                  className="w-full py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2"
                >
                  前往階級考核管理 <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <TrendingUp className="absolute -right-8 -bottom-8 w-40 h-40 text-white/5 rotate-12" />
            </div>
          </div>

          {/* Right: Detailed View & Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div 
              key={selectedTier}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[3.5rem] p-8 md:p-12 border border-slate-100 shadow-sm relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${currentTier.color} opacity-[0.03] blur-3xl -mr-20 -mt-20`} />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
                <div className="flex items-center gap-6">
                  <div className={`w-20 h-20 rounded-[2rem] bg-gradient-to-br ${currentTier.color} flex items-center justify-center text-white shadow-2xl shadow-indigo-900/20`}>
                    <currentTier.icon className="w-10 h-10" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{currentTier.name}</h2>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Tier Architecture Detailed Diagnostics</p>
                  </div>
                </div>
                <div className="bg-slate-50 px-6 py-4 rounded-[2rem] border border-slate-100 flex flex-col items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">所需累積消費額</span>
                  <span className="text-2xl font-black text-slate-900 mt-1">NT$ {currentTier.minSpend.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 relative z-10">
                <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">紅利回饋比例</h4>
                    <Zap className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-black text-slate-900">1 / {currentTier.rate}</span>
                    <span className="text-xs font-bold text-slate-400">點/元</span>
                  </div>
                  <p className="text-xs text-slate-500 font-bold leading-relaxed">
                    此級別會員每消費滿 NT$ {currentTier.rate} 元，即可獲得 1 點紅利。
                    約等於 <span className="text-indigo-600">{(100 / currentTier.rate).toFixed(2)}%</span> 的現金回饋價值。
                  </p>
                </div>

                <div className="bg-indigo-50/30 rounded-[2.5rem] p-8 border border-indigo-100/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[11px] font-black text-indigo-900 uppercase tracking-widest">級別描述與定位</h4>
                    <Info className="w-4 h-4 text-indigo-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-700 leading-loose mb-4">
                    {currentTier.desc}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentTier.privileges.map((p, i) => (
                      <span key={i} className="px-3 py-1 bg-white border border-indigo-100 text-[10px] font-black text-indigo-600 rounded-full uppercase tracking-widest">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress Visualization */}
              <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">體系權重分佈</h4>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tier weight distribution</span>
                </div>
                <div className="w-full h-12 bg-slate-50 rounded-2xl border border-slate-100 p-2 flex gap-1 overflow-hidden">
                  {TIERS.slice().reverse().map((t, idx) => {
                    const isActive = t.name === selectedTier;
                    return (
                      <div 
                        key={idx}
                        className={`h-full rounded-lg transition-all duration-500 ${isActive ? 'flex-[3] bg-indigo-600' : 'flex-1 bg-slate-200'}`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                  <span>初級 (寶寶)</span>
                  <span>中級 (閨蜜)</span>
                  <span>核心 (伴侶)</span>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-slate-100 flex justify-end gap-3 relative z-10">
                <button 
                  onClick={() => alert("目前系統採用靜態規章，若需動態修改回饋比例請聯繫工程團隊開發後台資料表同步功能。")}
                  className="px-8 py-4 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 border border-slate-100 shadow-sm"
                >
                  <Edit3 className="w-4 h-4" /> 申請調整參數
                </button>
                <button className="px-8 py-4 bg-emerald-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-900/10 active:scale-95 transition flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> 結構確認無誤
                </button>
              </div>
            </motion.div>

            {/* Additional Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex items-start gap-5">
                <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">鎖倉保護機制</h5>
                  <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                    B2B 創業夥伴初始儲值額之 30% 將作為品牌保證金鎖定，確保組織穩定運作與世襲權益。
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex items-start gap-5">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center shrink-0">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">年度結算週期</h5>
                  <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                    紅利積分於每月 10 號統一發送上月累積值。職級考核則採「即時達標、即時晉升」原則處理。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
