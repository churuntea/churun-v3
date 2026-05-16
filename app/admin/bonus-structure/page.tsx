'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  HelpCircle,
  Save,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TierRule {
  tier_name: string;
  min_spend: number;
  reward_rate: number;
  description: string;
  privileges: string[];
  color_theme: string;
}

const TIER_ICONS: Record<string, any> = {
  '初潤靈魂伴侶': Award,
  '初潤知己': ShieldCheck,
  '初潤閨蜜': Zap,
  '初潤好朋友': Users,
  '初潤青少年': TrendingUp,
  '初潤小朋友': Target,
  '初潤幼兒園': HelpCircle,
  '初潤寶寶': Info
};

export default function BonusStructurePage() {
  const router = useRouter();
  const [rules, setRules] = useState<TierRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<TierRule | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/admin/bonus-rules');
      const d = await res.json();
      if (d.success) {
        setRules(d.data);
        if (d.data.length > 0 && !selectedTier) {
          setSelectedTier(d.data[0].tier_name);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    const rule = rules.find(r => r.tier_name === selectedTier);
    if (rule) {
      setEditingRule({ ...rule });
      setIsEditModalOpen(true);
    }
  };

  const handleSave = async () => {
    if (!editingRule) return;
    setSaving(true);
    try {
      const updatedRules = rules.map(r => r.tier_name === editingRule.tier_name ? editingRule : r);
      const res = await fetch('/api/admin/bonus-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: updatedRules })
      });
      const d = await res.json();
      if (d.success) {
        setRules(updatedRules);
        setIsEditModalOpen(false);
        alert('✅ 設定已更新並同步至全系統！');
      } else {
        alert('❌ 更新失敗: ' + (d.error || '請確保資料庫中已建立 bonus_rules 資料表。'));
      }
    } catch (err) {
      alert('❌ 系統錯誤');
    } finally {
      setSaving(false);
    }
  };

  const currentTier = rules.find(t => t.tier_name === selectedTier);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-900" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Bonus Architecture...</p>
      </div>
    );
  }

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
                {rules.map((tier) => {
                  const Icon = TIER_ICONS[tier.tier_name] || Info;
                  const isActive = selectedTier === tier.tier_name;
                  return (
                    <button
                      key={tier.tier_name}
                      onClick={() => setSelectedTier(tier.tier_name)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${
                        isActive
                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 translate-x-2' 
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${tier.color_theme} flex items-center justify-center text-white`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black tracking-wide">{tier.tier_name}</span>
                      </div>
                      <ArrowRight className={`w-4 h-4 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-indigo-900 rounded-[2.5rem] p-6 text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2">快速操作</h4>
                <p className="text-xs font-bold leading-relaxed mb-6">目前的獎金發放邏輯已與結算系統動態同步。調整參數後將立即影響後續訂單結算比例。</p>
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
            <AnimatePresence mode="wait">
              {currentTier && (
                <motion.div 
                  key={currentTier.tier_name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-[3.5rem] p-8 md:p-12 border border-slate-100 shadow-sm relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${currentTier.color_theme} opacity-[0.03] blur-3xl -mr-20 -mt-20`} />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
                    <div className="flex items-center gap-6">
                      <div className={`w-20 h-20 rounded-[2rem] bg-gradient-to-br ${currentTier.color_theme} flex items-center justify-center text-white shadow-2xl shadow-indigo-900/20`}>
                        {React.createElement(TIER_ICONS[currentTier.tier_name] || Info, { className: "w-10 h-10" })}
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{currentTier.tier_name}</h2>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Tier Architecture Detailed Diagnostics</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 px-6 py-4 rounded-[2rem] border border-slate-100 flex flex-col items-end">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">所需累積消費額</span>
                      <span className="text-2xl font-black text-slate-900 mt-1">NT$ {Number(currentTier.min_spend).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 relative z-10">
                    <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">紅利回饋比例</h4>
                        <Zap className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-5xl font-black text-slate-900">1 / {currentTier.reward_rate}</span>
                        <span className="text-xs font-bold text-slate-400">點/元</span>
                      </div>
                      <p className="text-xs text-slate-500 font-bold leading-relaxed">
                        此級別會員每消費滿 NT$ {currentTier.reward_rate} 元，即可獲得 1 點紅利。
                        約等於 <span className="text-indigo-600">{(100 / currentTier.reward_rate).toFixed(2)}%</span> 的現金回饋價值。
                      </p>
                    </div>

                    <div className="bg-indigo-50/30 rounded-[2.5rem] p-8 border border-indigo-100/50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[11px] font-black text-indigo-900 uppercase tracking-widest">級別描述與定位</h4>
                        <Info className="w-4 h-4 text-indigo-500" />
                      </div>
                      <p className="text-sm font-bold text-slate-700 leading-loose mb-4">
                        {currentTier.description}
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

                  <div className="mt-12 pt-8 border-t border-slate-100 flex justify-end gap-3 relative z-10">
                    <button 
                      onClick={handleEditClick}
                      className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 active:scale-95 transition flex items-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" /> 進入編輯模式
                    </button>
                    <button 
                      className="px-8 py-4 bg-slate-50 text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 cursor-not-allowed"
                      disabled
                    >
                      <CheckCircle2 className="w-4 h-4" /> 結構已同步至 DB
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingRule && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsEditModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[3rem] p-8 md:p-12 w-full max-w-lg shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">編輯參數：{editingRule.tier_name}</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Tier Parameter Configuration</p>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">所需累積消費額 (NT$)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={editingRule.min_spend}
                      onChange={(e) => setEditingRule({ ...editingRule, min_spend: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">TWD</div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">紅利回饋比例 (1 / X)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={editingRule.reward_rate}
                      onChange={(e) => setEditingRule({ ...editingRule, reward_rate: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">Rate</div>
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 mt-2 ml-2 italic">* 數值越小，點數發放越多 (例如 30 比 100 更好)</p>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">階級權益描述 (顯示於 APP)</label>
                  <textarea 
                    value={editingRule.description}
                    onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                    placeholder="請輸入此階級的簡短描述..."
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">特權清單 (每行一項)</label>
                  <textarea 
                    value={editingRule.privileges.join('\n')}
                    onChange={(e) => setEditingRule({ ...editingRule, privileges: e.target.value.split('\n').filter(p => p.trim() !== '') })}
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                    placeholder="專屬匯率：30元 = 1點&#10;累積消費滿 $50,000 晉升..."
                  />
                </div>

                <div className="pt-6">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 active:scale-95 transition flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    儲存變更並同步全系統
                  </button>
                </div>
              </div>

              <div className="mt-8 p-4 bg-amber-50 border border-amber-100/50 rounded-2xl flex gap-4">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-amber-800 leading-relaxed">
                  請注意：修改「特權清單」內容將立即更新前端會員看到的榮耀殿堂資訊。修改「消費額」與「回饋比例」則會影響結算邏輯。
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
