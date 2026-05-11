"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ImageIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  X,
  Eye,
  Video,
  FileText,
  Copy,
  Save,
  Link as LinkIcon
} from "lucide-react";

function AdminMaterialsContent() {
  const router = useRouter();
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingDefault, setIsUploadingDefault] = useState<string | null>(null);
  const [isUploadingLocal, setIsUploadingLocal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cropperData, setCropperData] = useState<{
    isOpen: boolean;
    imageSrc: string;
    zoom: number;
    posX: number;
    posY: number;
    onConfirm: (croppedBase64: string) => void;
  } | null>(null);
  const [isCropperDragging, setIsCropperDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentMaterial, setCurrentMaterial] = useState<any>({
    title: "",
    category: "品牌主視覺",
    url: "",
    file_type: "image",
    description: ""
  });

  const handleCropperMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsCropperDragging(true);
    setDragStart({ x: e.clientX - (cropperData?.posX || 0), y: e.clientY - (cropperData?.posY || 0) });
  };

  const handleCropperMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isCropperDragging || !cropperData) return;
    setCropperData({
      ...cropperData,
      posX: e.clientX - dragStart.x,
      posY: e.clientY - dragStart.y
    });
  };

  const handleCropperMouseUp = () => {
    setIsCropperDragging(false);
  };

  const handleCropperTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsCropperDragging(true);
    setDragStart({ 
      x: e.touches[0].clientX - (cropperData?.posX || 0), 
      y: e.touches[0].clientY - (cropperData?.posY || 0) 
    });
  };

  const handleCropperTouchMove = (e: React.TouchEvent) => {
    if (!isCropperDragging || !cropperData || e.touches.length !== 1) return;
    setCropperData({
      ...cropperData,
      posX: e.touches[0].clientX - dragStart.x,
      posY: e.touches[0].clientY - dragStart.y
    });
  };

  const handleConfirmCrop = () => {
    if (!cropperData) return;
    const img = new Image();
    img.src = cropperData.imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 300, 300);

        ctx.save();
        ctx.translate(150, 150);
        ctx.scale(cropperData.zoom, cropperData.zoom);
        const scaleFactor = 300 / 288;
        ctx.translate(cropperData.posX * scaleFactor / cropperData.zoom, cropperData.posY * scaleFactor / cropperData.zoom);
        
        ctx.drawImage(img, -150, -150, 300, 300);
        ctx.restore();

        const croppedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        cropperData.onConfirm(croppedBase64);
        setCropperData(null);
      }
    };
  };

  const handleUploadDefaultAvatar = async (gender: 'male' | 'female', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setCropperData({
        isOpen: true,
        imageSrc: base64,
        zoom: 1.1,
        posX: 0,
        posY: 0,
        onConfirm: async (croppedBase64) => {
          setIsUploadingDefault(gender);
          const title = gender === 'male' ? "預設頭像 - 男生潤寶" : "預設頭像 - 女生潤寶";
          const existing = materials.find(m => m.category === "系統預設頭像" && m.title === title);
          try {
            const payload = {
              id: existing?.id || null,
              title,
              category: "系統預設頭像",
              file_type: "image",
              url: croppedBase64,
              description: `系統全域預設之${gender === 'male' ? '男生' : '女生'}會員大頭照`
            };
            
            const res = await fetch("/api/materials", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
              alert(`${gender === 'male' ? '男生' : '女生'}潤寶頭像更新成功！`);
              fetchMaterials();
            } else {
              alert("更新失敗: " + data.error);
            }
          } catch (err: any) {
            alert("上傳失敗: " + err.message);
          } finally {
            setIsUploadingDefault(null);
          }
        }
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
    const isAdmin = sessionStorage.getItem("churun_admin_auth");
    if (!isAdmin) {
      router.replace("/admin");
      return;
    }
    fetchMaterials();
  }, [router]);

  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/materials");
      const data = await res.json();
      if (data.success) {
        setMaterials(data.materials);
      }
    } catch (err) { console.error(err); }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!currentMaterial.title) return alert("請輸入素材名稱 / 標題");
    
    // For text-type materials (copywriting), we don't require an external URL. 
    // We automatically default it to "text" to satisfy database non-null constraints.
    const materialPayload = { ...currentMaterial };
    if (materialPayload.file_type === 'text' && !materialPayload.url) {
      materialPayload.url = 'text';
    }

    if (!materialPayload.url) return alert("請輸入檔案連結 (URL)");

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentMaterial)
      });
      const data = await res.json();
      if (data.success) {
        alert("素材已儲存！");
        setIsEditing(false);
        setCurrentMaterial({ title: "", category: "品牌主視覺", url: "", file_type: "image", description: "" });
        fetchMaterials();
      } else {
        alert("儲存失敗: " + data.error);
      }
    } catch (err: any) { alert("系統錯誤: " + err.message); }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除此素材嗎？")) return;
    try {
      const res = await fetch("/api/materials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) fetchMaterials();
    } catch (err: any) { alert("系統錯誤: " + err.message); }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="w-5 h-5" />;
      case "text": return <FileText className="w-5 h-5" />;
      default: return <ImageIcon className="w-5 h-5" />;
    }
  };

  const displayMaterials = materials.filter(m => m.category !== "系統預設頭像");
  const maleAvatarUrl = materials.find(m => m.category === "系統預設頭像" && m.title === "預設頭像 - 男生潤寶")?.url || "https://i.ibb.co/6R2M5X1/churun-baby.png";
  const femaleAvatarUrl = materials.find(m => m.category === "系統預設頭像" && m.title === "預設頭像 - 女生潤寶")?.url || "https://i.ibb.co/6R2M5X1/churun-baby.png";

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      
      <nav className="bg-emerald-900 text-white sticky top-0 z-50 px-8 py-6 flex items-center justify-between shadow-xl">
         <div className="flex items-center gap-6">
            <button onClick={() => router.push("/admin")} className="p-2 -ml-2 text-white/40 hover:text-white transition">
               <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-black tracking-[0.3em] uppercase">品牌素材管理中心</h1>
         </div>
         <button 
           onClick={() => {
             setCurrentMaterial({ title: "", category: "品牌主視覺", url: "", file_type: "image", description: "" });
             setIsEditing(true);
           }}
           className="bg-white text-emerald-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg active:scale-95 transition"
         >
            <Plus className="w-4 h-4" /> 上傳新素材
         </button>
      </nav>

      <main className="max-w-5xl mx-auto p-10 space-y-10">
        
        {/* 系統會員預設頭像 (潤寶) 專區 */}
        <div className="bg-white rounded-[3rem] p-8 border border-slate-50 shadow-sm space-y-6">
           <div className="flex justify-between items-center px-2">
              <div>
                 <h2 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase flex items-center gap-2">
                    <span>👥 會員預設頭像（潤寶）設定</span>
                    <span className="text-[8px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-100 font-bold uppercase tracking-wider">System Config</span>
                 </h2>
                 <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Default Member Avatar (Male & Female Runbao)</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 rounded-[2.5rem] p-6 border border-slate-100">
              {/* 男生潤寶 */}
              <div className="flex items-center gap-6 bg-white p-6 rounded-3xl border border-slate-100/50 shadow-sm relative group">
                 <div className="w-20 h-20 rounded-[2rem] overflow-hidden border-2 border-slate-100/80 shadow-md relative shrink-0 bg-slate-100">
                    <img src={maleAvatarUrl} className="w-full h-full object-cover" alt="Male Runbao" />
                    {isUploadingDefault === 'male' && (
                       <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                       </div>
                    )}
                 </div>
                 <div className="space-y-2 flex-1 min-w-0">
                    <h4 className="font-black text-slate-800 tracking-tight flex items-center gap-2 text-sm">
                       <span>男生版預設頭像 (潤寶)</span>
                       <span className="text-[7px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold">Male</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold tracking-wider leading-relaxed">未設定大頭照之男會員預設顯示此圖片。</p>
                    <label className="inline-block bg-emerald-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer active:scale-95 transition shadow-md shadow-emerald-900/10 hover:bg-emerald-800 mt-1">
                       上傳更換
                       <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadDefaultAvatar('male', e)} />
                    </label>
                 </div>
              </div>

              {/* 女生潤寶 */}
              <div className="flex items-center gap-6 bg-white p-6 rounded-3xl border border-slate-100/50 shadow-sm relative group">
                 <div className="w-20 h-20 rounded-[2rem] overflow-hidden border-2 border-slate-100/80 shadow-md relative shrink-0 bg-slate-100">
                    <img src={femaleAvatarUrl} className="w-full h-full object-cover" alt="Female Runbao" />
                    {isUploadingDefault === 'female' && (
                       <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                       </div>
                    )}
                 </div>
                 <div className="space-y-2 flex-1 min-w-0">
                    <h4 className="font-black text-slate-800 tracking-tight flex items-center gap-2 text-sm">
                       <span>女生版預設頭像 (潤寶)</span>
                       <span className="text-[7px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-bold">Female</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold tracking-wider leading-relaxed">未設定大頭照之女會員預設顯示此圖片。</p>
                    <label className="inline-block bg-emerald-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer active:scale-95 transition shadow-md shadow-emerald-900/10 hover:bg-emerald-800 mt-1">
                       上傳更換
                       <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadDefaultAvatar('female', e)} />
                    </label>
                 </div>
              </div>
           </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
             <Loader2 className="w-10 h-10 animate-spin text-slate-200" />
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">載入素材中...</p>
          </div>
        ) : displayMaterials.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-50 shadow-sm">
             <ImageIcon className="w-16 h-16 text-slate-100 mx-auto mb-4" />
             <p className="text-sm font-bold text-slate-300">目前尚無素材，請點擊上方按鈕新增</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayMaterials.map((item, i) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-[2.5rem] p-6 border border-slate-50 shadow-sm flex flex-col group hover:shadow-xl transition-all duration-500"
              >
                 <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.file_type === 'image' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                          {getIcon(item.file_type)}
                       </div>
                       <div>
                          <h4 className="font-black text-slate-800 tracking-tight">{item.title}</h4>
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">{item.category}</p>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => { setCurrentMaterial(item); setIsEditing(true); }} className="p-3 text-slate-300 hover:text-emerald-600 transition"><Edit3 className="w-4 h-4" /></button>
                       <button onClick={() => handleDelete(item.id)} className="p-3 text-slate-300 hover:text-rose-500 transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                 </div>

                 {item.file_type === 'image' && (
                    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-50 mb-4 border border-slate-100">
                       <img src={item.url} className="w-full h-full object-cover" alt="" />
                    </div>
                 )}

                 {item.description && (
                    <p className="text-xs text-slate-400 font-medium mb-4 line-clamp-2 italic">「 {item.description} 」</p>
                 )}

                 <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{new Date(item.created_at).toLocaleDateString()}</span>
                    <a href={item.url} target="_blank" className="text-[8px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1 hover:underline">
                       <LinkIcon className="w-3 h-3" /> 查看原始檔案
                    </a>
                 </div>
              </motion.div>
            ))}
          </div>
        )}

      </main>

      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditing(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" />
             <motion.div 
               initial={{ scale: 0.9, y: 20, opacity: 0 }}
               animate={{ scale: 1, y: 0, opacity: 1 }}
               exit={{ scale: 0.9, y: 20, opacity: 0 }}
               onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); if (currentMaterial.file_type !== 'text') setIsDragging(true); }}
               onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
               className="bg-white rounded-[3rem] p-10 w-full max-w-xl shadow-2xl space-y-8 relative overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar"
             >
                {/* Drag & Drop Visual Overlay */}
                <AnimatePresence>
                   {isDragging && currentMaterial.file_type !== 'text' && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                        onDrop={(e) => {
                           e.preventDefault();
                           e.stopPropagation();
                           setIsDragging(false);
                           
                           const file = e.dataTransfer.files?.[0];
                           if (!file) return;
                           
                           if (file.size > 50 * 1024 * 1024) {
                              alert("⚠️ 檔案大小不能超過 50MB！");
                              return;
                           }

                           let matchedType = currentMaterial.file_type;
                           if (file.type.startsWith('image/')) {
                              matchedType = 'image';
                           } else if (file.type.startsWith('video/')) {
                              matchedType = 'video';
                           } else if (file.type === 'application/pdf') {
                              matchedType = 'pdf';
                           }

                           setIsUploadingLocal(true);
                           const reader = new FileReader();
                           reader.onload = (ev) => {
                              setCurrentMaterial({
                                 ...currentMaterial,
                                 file_type: matchedType,
                                 url: ev.target?.result as string
                              });
                              setIsUploadingLocal(false);
                           };
                           reader.onerror = () => {
                              alert("⚠️ 讀取拖放檔案失敗");
                              setIsUploadingLocal(false);
                           };
                           reader.readAsDataURL(file);
                        }}
                        className="absolute inset-0 bg-emerald-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 text-center text-white border-4 border-dashed border-white/30 rounded-[3rem]"
                      >
                         <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mb-4 text-3xl animate-bounce">
                            📁
                         </div>
                         <h4 className="text-lg font-black mb-1.5">放開以載入本地檔案</h4>
                         <p className="text-[10px] text-white/60 font-black max-w-xs leading-relaxed uppercase tracking-wider">
                            將自動偵測檔案類型並存檔，支援圖片、影片或 PDF
                         </p>
                      </motion.div>
                   )}
                </AnimatePresence>
                <div className="flex justify-between items-center">
                   <h3 className="text-2xl font-black text-slate-900">編輯素材內容</h3>
                   <button onClick={() => setIsEditing(false)} className="p-2 bg-slate-50 rounded-xl"><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">素材名稱</label>
                      <input type="text" value={currentMaterial.title} onChange={e => setCurrentMaterial({...currentMaterial, title: e.target.value})} className="w-full bg-slate-50 border-none p-5 rounded-2xl text-sm font-bold" />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">分類類別</label>
                         <select value={currentMaterial.category} onChange={e => setCurrentMaterial({...currentMaterial, category: e.target.value})} className="w-full bg-slate-50 border-none p-5 rounded-2xl text-sm font-bold">
                            <option>品牌主視覺</option>
                            <option>商品宣傳圖</option>
                            <option>社群分享文案</option>
                            <option>教育訓練影片</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">檔案類型</label>
                         <select value={currentMaterial.file_type} onChange={e => setCurrentMaterial({...currentMaterial, file_type: e.target.value})} className="w-full bg-slate-50 border-none p-5 rounded-2xl text-sm font-bold">
                            <option value="image">圖片 (Image)</option>
                            <option value="video">影片 (Video)</option>
                            <option value="text">文案 (Text)</option>
                            <option value="pdf">文件 (PDF)</option>
                         </select>
                      </div>
                   </div>

                    {currentMaterial.file_type !== 'text' ? (
                       <div className="space-y-2">
                           <div className="flex justify-between items-center mb-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">檔案連結 (URL)</label>
                              {currentMaterial.file_type === 'image' && (
                                 <label className="text-[9px] font-black text-emerald-700 uppercase tracking-widest cursor-pointer hover:underline bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                                    <span>上傳圖片檔案</span>
                                    <input 
                                       type="file" 
                                       className="hidden" 
                                       accept="image/*" 
                                       onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          const reader = new FileReader();
                                          reader.onload = (ev) => {
                                             setCurrentMaterial({...currentMaterial, url: ev.target?.result as string});
                                          };
                                          reader.readAsDataURL(file);
                                       }} 
                                    />
                                 </label>
                              )}
                           </div>
                          <input type="text" value={currentMaterial.url} onChange={e => setCurrentMaterial({...currentMaterial, url: e.target.value})} className="w-full bg-slate-50 border-none p-5 rounded-2xl text-sm font-bold" placeholder="https://..." />
                       </div>
                    ) : (
                       <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100/40 text-emerald-800 text-[11px] flex items-start gap-3">
                          <span className="font-black bg-emerald-600 text-white px-2 py-0.5 rounded text-[9px] uppercase tracking-wider shrink-0 mt-0.5">INFO</span>
                          <span className="leading-relaxed">此為<strong>純文字社群文案</strong>素材，系統已自動啟用專屬文字排版通道，<strong>無須手動輸入上傳檔案連結</strong>。</span>
                       </div>
                    )}

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">描述 / 文案內容</label>
                      <textarea rows={4} value={currentMaterial.description} onChange={e => setCurrentMaterial({...currentMaterial, description: e.target.value})} className="w-full bg-slate-50 border-none p-5 rounded-2xl text-sm font-bold" placeholder="輸入素材描述或直接貼入社群文案..." />
                   </div>
                </div>

                <button 
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="w-full bg-emerald-900 text-white py-6 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition flex items-center justify-center gap-3"
                >
                   {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 儲存素材資訊
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function AdminMaterials() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-900" /></div>}>
      <AdminMaterialsContent />
    </Suspense>
  );
}
