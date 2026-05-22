"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/app/supabase';
import { Loader2, Save, ArrowLeft, Settings, Info } from 'lucide-react';
import Link from 'next/link';
import Toast from '@/components/Toast';

export default function AdminSettings() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [tierPerksText, setTierPerksText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    // 檢查管理員權限
    const checkAuth = () => {
      const auth = sessionStorage.getItem('churun_admin_user');
      if (auth) {
        setIsAdmin(true);
        fetchSettings();
      } else {
        window.location.href = '/admin';
      }
    };
    checkAuth();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('content')
        .eq('tag', 'TIER_PERKS_SETTING')
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
        throw error;
      }
      
      if (data) {
        setTierPerksText(data.content || "");
      } else {
        // 如果沒有資料，帶入預設值
        setTierPerksText("下單結帳（給自己）\n訂單金額 * 15%\n上線合夥人獲利\n訂單金額 * 15%\n例如結帳 $1,000 ，你拿 $150 紅利，上線合夥人也拿 $150 紅利");
      }
    } catch (err) {
      console.error("載入設定失敗:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 確認是否已經存在
      const { data: existingData } = await supabase
        .from('announcements')
        .select('id')
        .eq('tag', 'TIER_PERKS_SETTING')
        .single();
        
      if (existingData) {
        // 更新
        const { error } = await supabase
          .from('announcements')
          .update({ content: tierPerksText })
          .eq('tag', 'TIER_PERKS_SETTING');
          
        if (error) throw error;
      } else {
        // 新增
        const { error } = await supabase
          .from('announcements')
          .insert({
            title: '會員階級權利義務設定',
            tag: 'TIER_PERKS_SETTING',
            content: tierPerksText,
            color: 'bg-slate-800'
          });
          
        if (error) throw error;
      }
      
      setToast({ show: true, message: '設定已成功儲存！', type: 'success' });
    } catch (err: any) {
      setToast({ show: true, message: '儲存失敗: ' + err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-24 text-slate-800">
      {/* 標題列 */}
      <div className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-100 p-4 sm:p-6 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin" 
              className="w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-500 transition shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" />
                系統參數設定
              </h1>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-wider uppercase">System Settings</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-full text-sm font-black tracking-widest uppercase transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            儲存設定
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 mt-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <Settings className="w-32 h-32" />
              </div>
              <h2 className="text-base font-black text-slate-800 mb-6 flex items-center gap-2 relative z-10">
                <Info className="w-5 h-5 text-indigo-500" /> 會員階級權利義務文案
              </h2>
              
              <div className="space-y-3 relative z-10">
                <label className="text-xs font-black text-slate-500 block uppercase tracking-widest">
                  顯示於數位帳本的文字內容
                </label>
                <textarea
                  value={tierPerksText}
                  onChange={(e) => setTierPerksText(e.target.value)}
                  className="w-full h-64 bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition resize-none custom-scrollbar"
                  placeholder="輸入您的權利義務文案..."
                />
                <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1">
                  💡 修改後，將即時同步顯示在所有會員的手機端「數位帳本」頁面中。只有最高權限管理員可變更。
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Toast
         isVisible={toast.show}
         message={toast.message}
         type={toast.type}
         onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
}
