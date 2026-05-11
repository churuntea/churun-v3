"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/supabase';
import { 
  Upload, 
  Trash2, 
  Plus, 
  Save, 
  Layout, 
  Move, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';

export default function AdminPosters() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  
  // 預設配置
  const defaultConfig = {
    qr: { x: 800, y: 1100, size: 160 },
    name: { x: 380, y: 1120, size: 28, color: "#ffffff" },
    phone: { x: 380, y: 1155, size: 24, color: "#ffffff" },
    address: { x: 380, y: 1190, size: 20, color: "#ffffff" }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('poster_templates')
      .select('*')
      .order('created_at', { ascending: false });
    setTemplates(data || []);
    setIsLoading(false);
  };

  const handleCreateNew = () => {
    setEditingTemplate({
      name: '',
      url: '',
      category: '茶葉',
      config: JSON.parse(JSON.stringify(defaultConfig)),
      is_active: true
    });
  };

  const handleSave = async () => {
    if (!editingTemplate.name || !editingTemplate.url) {
      alert('請填寫完整資訊');
      return;
    }

    setIsSaving(true);
    try {
      const configWithCategory = {
        ...editingTemplate.config,
        category: editingTemplate.category || '茶葉'
      };

      const savePayload: any = {
        name: editingTemplate.name,
        url: editingTemplate.url,
        config: configWithCategory,
        is_active: editingTemplate.is_active
      };

      if (editingTemplate.id) {
        const { error } = await supabase
          .from('poster_templates')
          .update(savePayload)
          .eq('id', editingTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('poster_templates')
          .insert([savePayload]);
        if (error) throw error;
      }

      
      setEditingTemplate(null);
      fetchTemplates();
      alert('儲存成功');
    } catch (err: any) {
      alert('儲存失敗: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此樣板嗎？')) return;
    const { error } = await supabase.from('poster_templates').delete().eq('id', id);
    if (error) alert('刪除失敗');
    else fetchTemplates();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 10MB for print quality)
    if (file.size > 10 * 1024 * 1024) {
      alert("檔案太大！請上傳小於 10MB 的圖片。");
      return;
    }

    setIsUploading(true);
    try {
      // 1. Get Signed Upload URL from server
      const response = await fetch('/api/admin/posters/get-upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name })
      });
      
      const urlResult = await response.json();
      if (!urlResult.success) throw new Error(urlResult.error);

      // 2. Upload file directly to Supabase Storage using Signed URL
      const { data, error } = await supabase.storage
        .from('avatars')
        .uploadToSignedUrl(urlResult.path, urlResult.token, file);

      if (error) {
        throw new Error("直接上傳至 Storage 失敗: " + error.message);
      }

      // 3. Set the public URL
      setEditingTemplate({...editingTemplate, url: urlResult.publicUrl});
    } catch (err: any) {
      alert('上傳失敗: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <Link href="/admin" className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-colors mb-2 text-sm font-bold">
              <ChevronLeft className="w-4 h-4" /> 返回管理中心
            </Link>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
              <Layout className="w-8 h-8 text-emerald-600" /> 行銷海報樣板管理
            </h1>
          </div>
          <button 
            onClick={handleCreateNew}
            className="bg-emerald-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-900/20 flex items-center gap-2 hover:scale-105 transition"
          >
            <Plus className="w-4 h-4" /> 新增 DM 樣板
          </button>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.map(temp => (
              <div key={temp.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 group">
                <div className="aspect-[1/1.4] bg-slate-100 relative overflow-hidden">
                   <img src={temp.url} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <button 
                        onClick={() => setEditingTemplate({
                          ...temp,
                          category: temp.category || temp.config?.category || '茶葉'
                        })}
                        className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-900 hover:scale-110 transition shadow-xl"
                      >
                        <Move className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(temp.id)}
                        className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center text-white hover:scale-110 transition shadow-xl"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                   </div>
                </div>
                <div className="p-6 space-y-2">
                   <div className="flex justify-between items-center">
                      <h3 className="font-black text-slate-800">{temp.name}</h3>
                      <div className="flex gap-2 items-center">
                          <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">{temp.category || temp.config?.category || '茶葉'}</span>
                          {temp.config?.is_external ? (
                             <span className="text-[9px] font-black bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full border border-amber-100">轉外網</span>
                          ) : (
                             <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full border border-indigo-100">不轉外網</span>
                          )}
                       </div>
                   </div>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                     最後更新: {new Date(temp.created_at).toLocaleDateString()}
                   </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 編輯 Modal */}
        {editingTemplate && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-8">
            <div className="bg-white rounded-[3rem] p-10 w-full max-w-4xl shadow-2xl flex gap-10 max-h-[90vh]">
               <div className="flex-1 flex flex-col">
                  <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tighter">編輯樣板資訊</h2>
                  <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pr-4">
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">樣板名稱</label>
                        <input 
                          type="text" 
                          value={editingTemplate.name}
                          onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold"
                          placeholder="例如: 尊榮禮盒行銷海報"
                        />
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">所屬分類</label>
                        <div className="flex gap-2">
                           {['茶葉', '禮盒', '豬肉製品'].map(cat => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setEditingTemplate({...editingTemplate, category: cat})}
                                className={`flex-1 h-11 flex items-center justify-center rounded-xl font-bold text-xs whitespace-nowrap transition-all ${editingTemplate.category === cat ? 'bg-emerald-950 text-white shadow-lg' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                              >
                                 {cat}
                              </button>
                           ))}
                        </div>
                      </div>

                       <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">跳轉行為 (外網連結設定)</label>
                         <div className="flex gap-4">
                            <button
                              type="button"
                              onClick={() => setEditingTemplate({
                                ...editingTemplate,
                                config: {
                                  ...editingTemplate.config,
                                  is_external: false
                                }
                              })}
                              className={`flex-1 h-11 flex items-center justify-center rounded-xl font-bold text-xs whitespace-nowrap transition-all ${!editingTemplate.config?.is_external ? 'bg-emerald-950 text-white shadow-lg' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                            >
                               不轉外網 (本地產生器)
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTemplate({
                                ...editingTemplate,
                                config: {
                                  ...editingTemplate.config,
                                  is_external: true
                                }
                              })}
                              className={`flex-1 h-11 flex items-center justify-center rounded-xl font-bold text-xs whitespace-nowrap transition-all ${editingTemplate.config?.is_external ? 'bg-emerald-950 text-white shadow-lg' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                            >
                               轉外網 (新分頁開連結)
                            </button>
                         </div>
                       </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                          <span>公版圖片上傳 / URL</span>
                        </label>
                        <div className="flex gap-3">
                          <input 
                            type="text" 
                            value={editingTemplate.url}
                            onChange={e => setEditingTemplate({...editingTemplate, url: e.target.value})}
                            className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold"
                            placeholder="https://... 或點擊右側上傳圖片"
                          />
                          <label className={`bg-emerald-50 text-emerald-600 px-5 py-4 rounded-2xl font-black text-xs cursor-pointer hover:bg-emerald-100 transition flex items-center justify-center gap-2 whitespace-nowrap ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            <span>上傳 DM 圖片</span>
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isUploading} />
                          </label>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                        <div>
                           <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4 block underline">QR Code 位置</label>
                           <div className="space-y-4">
                              <input type="number" value={editingTemplate.config.qr?.x || 800} onChange={e => setEditingTemplate({...editingTemplate, config: {...editingTemplate.config, qr: {...editingTemplate.config.qr, x: parseInt(e.target.value)}}})} placeholder="X" className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold" />
                              <input type="number" value={editingTemplate.config.qr?.y || 1100} onChange={e => setEditingTemplate({...editingTemplate, config: {...editingTemplate.config, qr: {...editingTemplate.config.qr, y: parseInt(e.target.value)}}})} placeholder="Y" className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold" />
                              <input type="number" value={editingTemplate.config.qr?.size || 160} onChange={e => setEditingTemplate({...editingTemplate, config: {...editingTemplate.config, qr: {...editingTemplate.config.qr, size: parseInt(e.target.value)}}})} placeholder="Size" className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold" />
                           </div>
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 block underline">姓名位置</label>
                           <div className="space-y-4">
                              <input type="number" value={editingTemplate.config.name?.x || 380} onChange={e => setEditingTemplate({...editingTemplate, config: {...editingTemplate.config, name: {...editingTemplate.config.name, x: parseInt(e.target.value)}}})} placeholder="X" className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold" />
                              <input type="number" value={editingTemplate.config.name?.y || 1120} onChange={e => setEditingTemplate({...editingTemplate, config: {...editingTemplate.config, name: {...editingTemplate.config.name, y: parseInt(e.target.value)}}})} placeholder="Y" className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold" />
                              <input type="text" value={editingTemplate.config.name?.color || '#ffffff'} onChange={e => setEditingTemplate({...editingTemplate, config: {...editingTemplate.config, name: {...editingTemplate.config.name, color: e.target.value}}})} placeholder="Color" className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold" />
                           </div>
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-4 block underline">電話位置</label>
                           <div className="space-y-4">
                              <input type="number" value={editingTemplate.config.phone?.x || 380} onChange={e => setEditingTemplate({...editingTemplate, config: {...editingTemplate.config, phone: {...editingTemplate.config.phone, x: parseInt(e.target.value)}}})} placeholder="X" className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold" />
                              <input type="number" value={editingTemplate.config.phone?.y || 1155} onChange={e => setEditingTemplate({...editingTemplate, config: {...editingTemplate.config, phone: {...editingTemplate.config.phone, y: parseInt(e.target.value)}}})} placeholder="Y" className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold" />
                           </div>
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4 block underline">地址位置</label>
                           <div className="space-y-4">
                              <input type="number" value={editingTemplate.config.address?.x || 380} onChange={e => setEditingTemplate({...editingTemplate, config: {...editingTemplate.config, address: {...editingTemplate.config.address, x: parseInt(e.target.value)}}})} placeholder="X" className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold" />
                              <input type="number" value={editingTemplate.config.address?.y || 1190} onChange={e => setEditingTemplate({...editingTemplate, config: {...editingTemplate.config, address: {...editingTemplate.config.address, y: parseInt(e.target.value)}}})} placeholder="Y" className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold" />
                           </div>
                        </div>
                     </div>
                  </div>
                  <div className="mt-8 flex gap-4">
                     <button 
                       onClick={() => setEditingTemplate(null)}
                       className="flex-1 bg-slate-100 text-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest"
                     >
                       取消
                     </button>
                     <button 
                       onClick={handleSave}
                       disabled={isSaving}
                       className="flex-1 bg-emerald-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2"
                     >
                       {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 儲存樣板
                     </button>
                  </div>
               </div>
               <div className="w-[350px] bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-100 relative">
                  <div className="absolute top-4 left-6 z-10 flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></div>
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Live Preview</span>
                  </div>
                  {editingTemplate.url ? (
                    <div className="w-full h-full relative">
                       <img src={editingTemplate.url} className="w-full h-full object-cover" />
                       {/* 模擬座標點 */}
                       <div className="absolute border-2 border-emerald-500 bg-emerald-500/20 flex items-center justify-center text-[10px] text-emerald-700 font-bold" 
                            style={{ left: (editingTemplate.config.qr?.x || 800)/4, top: (editingTemplate.config.qr?.y || 1100)/4, width: (editingTemplate.config.qr?.size || 160)/4, height: (editingTemplate.config.qr?.size || 160)/4 }}>QR</div>
                       <div className="absolute border border-blue-500 bg-blue-500/20 text-[8px] text-blue-700 font-bold whitespace-nowrap p-1" 
                            style={{ left: (editingTemplate.config.name?.x || 380)/4, top: (editingTemplate.config.name?.y || 1120)/4 }}>[姓名位置]</div>
                       <div className="absolute border border-rose-500 bg-rose-500/20 text-[8px] text-rose-700 font-bold whitespace-nowrap p-1" 
                            style={{ left: (editingTemplate.config.phone?.x || 380)/4, top: (editingTemplate.config.phone?.y || 1155)/4 }}>[電話位置]</div>
                       <div className="absolute border border-amber-500 bg-amber-500/20 text-[8px] text-amber-700 font-bold whitespace-nowrap p-1" 
                            style={{ left: (editingTemplate.config.address?.x || 380)/4, top: (editingTemplate.config.address?.y || 1190)/4 }}>[地址位置]</div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                       <Layout className="w-12 h-12 mb-2 opacity-20" />
                       <p className="text-[10px] font-black uppercase">等待輸入圖片 URL</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
