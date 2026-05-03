"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, QrCode, Share, Sparkles, Award, ShieldCheck } from "lucide-react";
import QRCode from "react-qr-code"; // 如果沒有這個庫我會改用 SVG 模擬

export default function ReferralCard({ 
  isOpen, 
  onClose, 
  memberInfo 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  memberInfo: any 
}) {
  const referralUrl = typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${memberInfo?.referral_code}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    alert("推薦連結已複製！");
  };

  const getTierColor = (tier: string) => {
    if (tier?.includes('靈魂伴侶')) return 'from-amber-400 via-amber-200 to-amber-500';
    if (tier?.includes('知己')) return 'from-emerald-400 to-emerald-600';
    return 'from-slate-700 to-slate-900';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6"
        >
          <div className="relative w-full max-w-md">
             
             {/* Close Button */}
             <button onClick={onClose} className="absolute -top-16 right-0 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition">
                <X className="w-6 h-6" />
             </button>

             {/* The Card */}
             <motion.div 
               initial={{ y: 50, scale: 0.9 }}
               animate={{ y: 0, scale: 1 }}
               className={`w-full aspect-[1.6/1] rounded-[3rem] p-10 relative overflow-hidden shadow-2xl bg-gradient-to-br ${getTierColor(memberInfo?.tier)}`}
             >
                {/* Textures */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.4),transparent)]"></div>
                <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>

                <div className="relative z-10 h-full flex flex-col justify-between text-white">
                   <div className="flex justify-between items-start">
                      <div className="space-y-1">
                         <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Official Member</span>
                         </div>
                         <h3 className="text-3xl font-black tracking-tight">{memberInfo?.name}</h3>
                      </div>
                      <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/20">
                         <Award className="w-6 h-6" />
                      </div>
                   </div>

                   <div className="flex justify-between items-end">
                      <div className="space-y-1">
                         <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Membership Tier</p>
                         <p className="text-sm font-black tracking-widest">{memberInfo?.tier}</p>
                      </div>
                      <div className="text-right space-y-1">
                         <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Referral Code</p>
                         <p className="text-xl font-black tracking-[0.2em]">{memberInfo?.referral_code}</p>
                      </div>
                   </div>
                </div>
             </motion.div>

             {/* Actions Panel */}
             <div className="mt-8 bg-white rounded-[3rem] p-8 shadow-2xl space-y-6">
                <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-3xl">
                   <div className="bg-white p-3 rounded-2xl shadow-sm">
                      {/* 這裡暫時用 QrCode Icon 示意，實際上可以整合 QRCode 組件 */}
                      <QrCode className="w-8 h-8 text-slate-800" />
                   </div>
                   <div className="flex-1">
                      <p className="text-xs font-black text-slate-800">專屬推廣連結</p>
                      <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[150px]">{referralUrl}</p>
                   </div>
                   <button onClick={copyLink} className="p-3 bg-white rounded-xl shadow-sm hover:scale-105 transition">
                      <Copy className="w-4 h-4 text-indigo-600" />
                   </button>
                </div>

                <button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: '加入初潤', url: referralUrl });
                    }
                  }}
                  className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                >
                   <Share className="w-4 h-4" /> 啟動社群擴散
                </button>
             </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
