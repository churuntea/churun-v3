"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  PackagePlus, 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  Plus, 
  Loader2,
  DollarSign,
  Zap,
  Star,
  LayoutDashboard
} from "lucide-react";

function AdminProductsContent() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: "",
    original_price: "",
    price: "",
    image_url: "", 
    creator: "陳總經理",
    b2c_reward_percent: "10",
    b2b_commission_percent: "15",
    category: "極萃系列"
  });
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"add" | "list">("add");

  const creators = ["陳總經理", "王副總", "張主任", "系統管理員"];

  useEffect(() => {
    const isAdmin = sessionStorage.getItem("churun_admin_auth");
    if (!isAdmin) {
      router.replace("/admin");
      return;
    }
    fetchProducts();
  }, [router]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success) {
        const processed = (data.products || []).map((p: any) => {
          if (!p.category && p.name.startsWith('[')) {
            const match = p.name.match(/^\[(.*?)\] (.*)/);
            if (match) {
              return { ...p, category: match[1], name: match[2] };
            }
          }
          return { ...p, category: p.category || "極萃系列" };
        });
        setProducts(processed);
      }
    } catch (err) { console.error(err); }
    setIsLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) return alert("檔案太大 (請小於 2MB)");
    const reader = new FileReader();
    reader.onload = (e) => setFormData(prev => ({ ...prev, image_url: e.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleSubmitAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return alert("品名與嘗鮮價為必填");
    setShowConfirm(true);
  };

  const handleEditClick = (product: any) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      original_price: product.original_price?.toString() || "",
      price: product.price.toString(),
      image_url: product.image_url || "",
      creator: product.creator || "陳總經理",
      b2c_reward_percent: product.b2c_reward_percent.toString(),
      b2b_commission_percent: product.b2b_commission_percent.toString(),
      category: product.category || "極萃系列"
    });
    setActiveTab("add"); // Switch to form when editing
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: "",
      original_price: "",
      price: "",
      image_url: "",
      creator: "陳總經理",
      b2c_reward_percent: "10",
      b2b_commission_percent: "15",
      category: "極萃系列"
    });
  };

  const handleConfirmSubmit = async () => {
    setShowConfirm(false);
    setIsSubmitting(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const res = await fetch("/api/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          ...formData,
          original_price: formData.original_price ? Number(formData.original_price) : null,
          price: Number(formData.price),
          b2c_reward_percent: Number(formData.b2c_reward_percent),
          b2b_commission_percent: Number(formData.b2b_commission_percent)
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(editingId ? "🎉 更新成功！" : "🎉 新增成功！");
        handleCancelEdit();
        fetchProducts();
        setActiveTab("list"); // Switch to list after success
      } else { alert(editingId ? "更新失敗: " : "新增失敗: " + data.error); }
    } catch (err: any) { alert("系統錯誤: " + err.message); }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除此商品嗎？")) return;
    try {
      const res = await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        fetchProducts();
      } else {
        alert("刪除失敗: " + data.error);
      }
    } catch (err: any) {
      alert("系統錯誤: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 pb-20 font-sans">
      <nav className="bg-slate-900 text-white sticky top-0 z-50 px-8 py-4 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-4">
           <button onClick={() => router.push("/admin")} className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-white/60 hover:text-white transition backdrop-blur-md">
              <ChevronLeft className="w-5 h-5" />
           </button>
            <h1 className="text-sm font-black tracking-[0.2em] uppercase">{editingId ? "編輯商品資料" : "商品與參數管理"}</h1>
         </div>
         {editingId && (
            <button onClick={handleCancelEdit} className="px-6 py-2 bg-rose-500 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition">
               取消編輯
            </button>
         )}
      </nav>

      <main className="max-w-6xl mx-auto p-10 space-y-10">
        
        {/* Navigation Tabs */}
        <div className="flex gap-8 border-b border-slate-100 pb-4">
           <button 
             onClick={() => setActiveTab("add")}
             className={`flex items-center gap-3 px-4 py-2 rounded-2xl transition-all ${activeTab === 'add' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
           >
              <PackagePlus className="w-5 h-5" />
              <span className="text-sm font-black uppercase tracking-widest">{editingId ? "編輯商品" : "新增上架"}</span>
           </button>
           <button 
             onClick={() => setActiveTab("list")}
             className={`flex items-center gap-3 px-4 py-2 rounded-2xl transition-all ${activeTab === 'list' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
           >
              <FileText className="w-5 h-5" />
              <span className="text-sm font-black uppercase tracking-widest">已上架品項</span>
              <span className="ml-2 text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full font-bold">{products.length}</span>
           </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
           {/* Create Form Section */}
           <div className={`lg:col-span-2 space-y-6 ${activeTab === 'list' ? 'hidden lg:block' : 'block'}`}>
              <div className="bg-white rounded-[3rem] p-10 border border-slate-50 shadow-sm">
              <form onSubmit={handleSubmitAttempt} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">建檔者身分</label>
                    <select 
                      name="creator" 
                      value={formData.creator} 
                      onChange={handleChange}
                      className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 transition"
                    >
                      {creators.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">商品名稱</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="例：初潤頂級紅茶" className="w-full bg-slate-50 border-none p-5 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 transition" required />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">商品分類</label>
                    <select 
                      name="category" 
                      value={formData.category} 
                      onChange={handleChange}
                      className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 transition"
                    >
                      {["極萃系列", "精品茶具", "典藏禮盒"].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">商品主圖</label>
                    <div 
                      onDragOver={onDragOver}
                      onDrop={onDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-100 bg-slate-50 rounded-[2rem] p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-indigo-300 transition group relative overflow-hidden"
                    >
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".jpg,.jpeg,.png,.pdf" />
                      
                      {formData.image_url ? (
                        <div className="text-center">
                           <img src={formData.image_url} alt="Preview" className="h-32 w-32 object-cover rounded-2xl shadow-xl mb-4" />
                           <button type="button" onClick={(e) => {e.stopPropagation(); setFormData(prev => ({...prev, image_url: ""}))}} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline flex items-center gap-2 mx-auto">
                             <Trash2 className="w-3 h-3" /> 移除圖片
                           </button>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition duration-500">
                             <Upload className="w-6 h-6 text-slate-400" />
                          </div>
                          <p className="text-xs font-bold text-slate-500">點擊或拖曳至此</p>
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-2">JPG, PNG, PDF (MAX 2MB)</p>
                        </>
                      )}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">原價</label>
                       <input type="number" name="original_price" value={formData.original_price} onChange={handleChange} placeholder="1200" className="w-full bg-slate-50 border-none p-5 rounded-2xl text-sm font-bold" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">結帳價</label>
                       <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="800" className="w-full bg-slate-50 border-none p-5 rounded-2xl text-sm font-bold" required />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100/50 space-y-3">
                       <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2"><Star className="w-3 h-3" /> B2C 積分 %</label>
                       <input type="number" name="b2c_reward_percent" value={formData.b2c_reward_percent} onChange={handleChange} className="w-full bg-white border-none p-3 rounded-xl text-sm font-black text-emerald-800" />
                    </div>
                    <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100/50 space-y-3">
                       <label className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2"><Zap className="w-3 h-3" /> B2B 退傭 %</label>
                       <input type="number" name="b2b_commission_percent" value={formData.b2b_commission_percent} onChange={handleChange} className="w-full bg-white border-none p-3 rounded-xl text-sm font-black text-indigo-800" />
                    </div>
                 </div>

                  <button type="submit" disabled={isSubmitting} className={`w-full py-6 rounded-3xl font-black text-sm transition shadow-2xl ${editingId ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/10' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/10'} text-white`}>
                     {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : editingId ? "更新商品資訊" : "確認上架"}
                  </button>
                  {editingId && (
                    <button type="button" onClick={handleCancelEdit} className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition">
                       放棄變更
                    </button>
                  )}
              </form>
           </div>
        </div>

        {/* Product List Section */}
        <div className={`lg:col-span-3 space-y-6 ${activeTab === 'add' ? 'hidden lg:block' : 'block'}`}>
           <div className="flex items-center gap-3 px-2 justify-between">
              <div className="flex items-center gap-3">
                 <LayoutDashboard className="w-5 h-5 text-slate-400" />
                 <h3 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">已上架商品 ({products.length})</h3>
              </div>
              <Plus 
                 onClick={() => { handleCancelEdit(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                 className="w-5 h-5 text-slate-300 cursor-pointer hover:text-slate-900 transition" 
              />
           </div>

           <div className="bg-white rounded-[3rem] p-10 border border-slate-50 shadow-sm min-h-[600px]">
              {isLoading ? (
                 <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
                 </div>
              ) : (
                 <div className="grid grid-cols-1 gap-4">
                    {products.map(product => (
                       <div 
                         key={product.id} 
                         onClick={() => handleEditClick(product)}
                         className={`bg-slate-50 p-6 rounded-[2.5rem] flex items-center gap-6 border transition cursor-pointer group ${editingId === product.id ? 'border-indigo-500 ring-4 ring-indigo-500/10 bg-white' : 'border-slate-100 hover:border-indigo-100'}`}
                       >
                          <div className="w-20 h-20 bg-white rounded-3xl overflow-hidden shadow-inner flex items-center justify-center shrink-0">
                             {product.image_url ? (
                                <img src={product.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                             ) : (
                                <ImageIcon className="w-8 h-8 text-slate-100" />
                             )}
                          </div>
                          <div className="flex-1 space-y-1">
                             <h4 className="font-black text-slate-800">{product.name}</h4>
                             <div className="flex items-center gap-3">
                                <span className="text-lg font-black text-indigo-600">${product.price.toLocaleString()}</span>
                                {product.original_price && <span className="text-xs font-medium text-slate-300 line-through">${product.original_price.toLocaleString()}</span>}
                             </div>
                             <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">建檔：{product.creator} | 分類：{product.category}</p>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                             <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-100">
                                {product.b2c_reward_percent}% Point
                             </div>
                             <div className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-indigo-100">
                                {product.b2b_commission_percent}% Comm
                             </div>
                             <button 
                               onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                               className="p-2 text-rose-300 hover:text-rose-600 transition"
                             >
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        </div>

      </main>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-sm p-12 text-center shadow-2xl animate-in zoom-in-95 duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-slate-50 rounded-full blur-2xl"></div>
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
               <CheckCircle2 className="w-10 h-10" />
            </div>
             <h3 className="text-2xl font-black text-slate-900 mb-4">{editingId ? "確認更新商品？" : "確認上架商品？"}</h3>
            <div className="bg-slate-50 p-6 rounded-3xl text-left space-y-3 mb-10 border border-slate-100">
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">商品明細</p>
               <p className="text-sm font-bold text-slate-700">{formData.name}</p>
               <p className="text-sm font-bold text-indigo-600">${formData.price}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setShowConfirm(false)} className="py-5 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition">
                 取消返回
              </button>
              <button onClick={handleConfirmSubmit} className="py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition shadow-xl shadow-slate-900/20">
                 確認送出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminProducts() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-slate-300">載入中...</div>}>
      <AdminProductsContent />
    </Suspense>
  );
}
