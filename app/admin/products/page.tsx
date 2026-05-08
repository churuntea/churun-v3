"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../supabase";
import { dbCache, fetchWithSWR } from "@/utils/dbCache";
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
  Star,
  Zap,
  LayoutDashboard,
  Package,
  Hash,
  Boxes,
  AlertTriangle
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
    category: "極萃系列",
    stock_count: "100",
    sku: "",
    description: ""
  });
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"add" | "list" | "category">("add");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("全部");

  const creators = ["陳總經理", "王副總", "張主任", "系統管理員"];
  const [categories, setCategories] = useState<string[]>(["極萃系列", "精品茶具", "典藏禮盒"]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  useEffect(() => {
    const isAdmin = sessionStorage.getItem("churun_admin_auth");
    if (!isAdmin) {
      router.replace("/admin");
      return;
    }
    fetchProducts();
    fetchCategories();
  }, [router]);

  const fetchCategories = async () => {
    try {
      const categoriesKey = "churun_cache:categories";
      const cachedList = await fetchWithSWR(categoriesKey, async () => {
        const { data, error } = await supabase
          .from("announcements")
          .select("*")
          .eq("title", "[SYSTEM_CATEGORIES]")
          .maybeSingle();
        
        if (error) throw error;
        
        if (data && data.content) {
          const parsed = JSON.parse(data.content);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } else if (!data) {
          // 資料庫查無紀錄則進行初始建檔
          const defaultCats = ["極萃系列", "精品茶具", "典藏禮盒"];
          await supabase
            .from("announcements")
            .insert({
              title: "[SYSTEM_CATEGORIES]",
              tag: "SYSTEM",
              content: JSON.stringify(defaultCats),
              color: "bg-indigo-900"
            });
          return defaultCats;
        }
        return ["極萃系列", "精品茶具", "典藏禮盒"];
      }, {
        ttl: 600000, // 10 分鐘快取
        useLocal: true,
        onBackgroundUpdate: (fresh) => {
          setCategories(fresh);
          setFormData(prev => {
            if (!fresh.includes(prev.category)) {
              return { ...prev, category: fresh[0] };
            }
            return prev;
          });
        }
      });

      if (cachedList && cachedList.length > 0) {
        setCategories(cachedList);
        setFormData(prev => {
          if (!cachedList.includes(prev.category)) {
            return { ...prev, category: cachedList[0] };
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("載入分類大項錯誤:", err);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return alert("請輸入大項/分類名稱");
    if (categories.includes(trimmed)) return alert("此大項/分類已存在");

    setIsSavingCategory(true);
    const updated = [...categories, trimmed];
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ content: JSON.stringify(updated) })
        .eq("title", "[SYSTEM_CATEGORIES]");
      
      if (error) throw error;
      
      dbCache.invalidate("churun_cache:categories");
      setCategories(updated);
      setNewCategoryName("");
      alert("🎉 新增分類大項成功！");
    } catch (err: any) {
      alert("新增分類失敗: " + err.message);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (catToDelete: string) => {
    if (categories.length <= 1) {
      return alert("必須保留至少一個分類大項！");
    }
    if (!confirm(`確定要刪除大項分類「${catToDelete}」嗎？\n這不會刪除已屬於該大項的商品，但該大項將無法再被選取。`)) return;
    
    setIsSavingCategory(true);
    const updated = categories.filter(c => c !== catToDelete);
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ content: JSON.stringify(updated) })
        .eq("title", "[SYSTEM_CATEGORIES]");
      
      if (error) throw error;
      
      dbCache.invalidate("churun_cache:categories");
      setCategories(updated);
      setFormData(prev => {
        if (prev.category === catToDelete) {
          return { ...prev, category: updated[0] };
        }
        return prev;
      });
      alert("🎉 刪除分類大項成功！");
    } catch (err: any) {
      alert("刪除分類失敗: " + err.message);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const fetchProducts = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      const productsKey = "churun_cache:products_admin";
      if (forceRefresh) {
        dbCache.invalidate(productsKey);
      }
      const cachedProducts = await fetchWithSWR(productsKey, async () => {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (data.success) {
          return (data.products || []).map((p: any) => ({
            ...p,
            category: p.category || "極萃系列"
          }));
        }
        throw new Error(data.error || "取得商品列表失敗");
      }, {
        ttl: 120000, // 2 分鐘快取，前台秒開
        useLocal: true,
        onBackgroundUpdate: (fresh) => setProducts(fresh)
      });

      setProducts(cachedProducts);
    } catch (err) { console.error("獲取商品列表出錯:", err); }
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
      category: product.category || "極萃系列",
      stock_count: product.stock_count?.toString() || "0",
      sku: product.sku || "",
      description: product.description || ""
    });
    setActiveTab("add");
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
      category: "極萃系列",
      stock_count: "100",
      sku: "",
      description: ""
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
          b2b_commission_percent: Number(formData.b2b_commission_percent),
          stock_count: Number(formData.stock_count)
        })
      });
      const data = await res.json();
      if (data.success) {
        // 主動使商品與分類列表快取失效，確保管理員送出即看見最新資料
        dbCache.invalidate("churun_cache:products_admin");
        alert(editingId ? "🎉 更新成功！" : "🎉 新增成功！");
        handleCancelEdit();
        fetchProducts(true); // 強制重整抓取最新
        setActiveTab("list");
      } else { alert("操作失敗: " + data.error); }
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
        // 刪除時廢除快取
        dbCache.invalidate("churun_cache:products_admin");
        fetchProducts(true);
      }
      else alert("刪除失敗: " + data.error);
    } catch (err: any) { alert("系統錯誤: " + err.message); }
  };

  // 計算篩選後的商品
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === "全部" || product.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // 商品統計指標
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => Number(p.stock_count || 0) < 10).length;
  const highestPricedProduct = products.length > 0 
    ? products.reduce((prev, current) => (Number(prev.price || 0) > Number(current.price || 0)) ? prev : current)
    : null;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 pb-20 font-sans">
      <nav className="bg-slate-900 text-white sticky top-0 z-50 px-8 py-4 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-4">
           <button onClick={() => router.push("/admin")} className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-white/60 hover:text-white transition backdrop-blur-md">
              <ChevronLeft className="w-5 h-5" />
           </button>
            <h1 className="text-sm font-black tracking-[0.2em] uppercase">商品管理</h1>
         </div>
         {editingId && (
            <button onClick={handleCancelEdit} className="px-6 py-2 bg-rose-500 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition">
               取消編輯
            </button>
         )}
      </nav>

      <main className="max-w-4xl mx-auto p-10 space-y-12">
        
        {/* Navigation Switcher */}
        <div className="flex p-2 bg-slate-100 rounded-[2.5rem] shadow-inner relative z-10">
           <button 
             type="button"
             onClick={() => setActiveTab("add")}
             className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[2rem] transition-all duration-500 font-black text-[10px] uppercase tracking-widest cursor-pointer ${activeTab === 'add' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
           >
              <PackagePlus className={`w-5 h-5 ${activeTab === 'add' ? 'text-indigo-500' : 'text-slate-300'}`} />
              {editingId ? "編輯商品資料" : "新增上架商品"}
           </button>
           <button 
             type="button"
             onClick={() => setActiveTab("list")}
             className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[2rem] transition-all duration-500 font-black text-[10px] uppercase tracking-widest cursor-pointer ${activeTab === 'list' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
           >
              <FileText className={`w-5 h-5 ${activeTab === 'list' ? 'text-emerald-500' : 'text-slate-300'}`} />
              已上架庫存 ({products.length})
           </button>
           <button 
             type="button"
             onClick={() => setActiveTab("category")}
             className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[2rem] transition-all duration-500 font-black text-[10px] uppercase tracking-widest cursor-pointer ${activeTab === 'category' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
           >
              <LayoutDashboard className={`w-5 h-5 ${activeTab === 'category' ? 'text-amber-500' : 'text-slate-300'}`} />
              大項分類管理
           </button>
        </div>

        <div className="relative z-0">
           {activeTab === 'add' ? (
             <motion.div 
               key="add-view"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-white rounded-[4rem] p-12 border border-slate-50 shadow-2xl shadow-slate-200/20"
             >
                <form onSubmit={handleSubmitAttempt} className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3" /> 建檔者身分
                         </label>
                         <select 
                           name="creator" 
                           value={formData.creator} 
                           onChange={handleChange}
                           className="w-full bg-slate-50 border-none p-5 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition"
                         >
                           {creators.map(c => <option key={c} value={c}>{c}</option>)}
                         </select>
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest flex items-center gap-2">
                            <LayoutDashboard className="w-3 h-3" /> 商品分類
                         </label>
                         <select 
                           name="category" 
                           value={formData.category} 
                           onChange={handleChange}
                           className="w-full bg-slate-50 border-none p-5 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition"
                         >
                           {categories.map(c => <option key={c} value={c}>{c}</option>)}
                         </select>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">商品名稱</label>
                         <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="請輸入完整商品品名" className="w-full bg-slate-50 border-none p-6 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition shadow-inner" required />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest flex items-center gap-2"><Hash className="w-3 h-3" /> 商品貨號 (SKU)</label>
                         <input type="text" name="sku" value={formData.sku} onChange={handleChange} placeholder="例: CRT-001" className="w-full bg-slate-50 border-none p-6 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition shadow-inner" />
                      </div>
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">商品主圖 (點擊或拖曳)</label>
                      <div 
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-100 bg-slate-50 rounded-[3rem] p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-indigo-300 transition group relative"
                      >
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".jpg,.jpeg,.png" />
                        {formData.image_url ? (
                          <div className="relative group">
                             <img src={formData.image_url} alt="Preview" className="h-48 w-48 object-cover rounded-[2.5rem] shadow-2xl" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-[2.5rem] flex items-center justify-center">
                                <Upload className="text-white w-8 h-8" />
                             </div>
                          </div>
                        ) : (
                          <div className="text-center">
                             <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 mx-auto group-hover:scale-110 transition duration-500">
                                <Upload className="w-8 h-8 text-slate-300" />
                             </div>
                             <p className="text-sm font-bold text-slate-400">點擊上傳商品照片</p>
                          </div>
                        )}
                     </div>
                  </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-slate-400" /> 商品描述 / 特色形容
                       </label>
                       <textarea 
                         name="description" 
                         value={formData.description || ""} 
                         onChange={handleChange as any} 
                         placeholder="請輸入此商品的特色形容、風味口感、規格容量或包裝細節等描述說明..." 
                         rows={4}
                         maxLength={300}
                         className="w-full bg-slate-50 border-none p-6 rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition shadow-inner outline-none resize-none leading-relaxed text-slate-800"
                       />
                       <div className="flex justify-end pr-2">
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{(formData.description || "").length} / 300 字</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-3 gap-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">官方定價 (原價)</label>
                         <input type="number" name="original_price" value={formData.original_price} onChange={handleChange} placeholder="例: 1200" className="w-full bg-slate-50 border-none p-6 rounded-3xl text-sm font-bold" />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">結帳售價 (必填)</label>
                         <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="例: 800" className="w-full bg-slate-50 border-none p-6 rounded-3xl text-sm font-bold" required />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-indigo-600 ml-1 uppercase tracking-widest flex items-center gap-2"><Boxes className="w-3 h-3" /> 目前庫存量</label>
                         <input type="number" name="stock_count" value={formData.stock_count} onChange={handleChange} placeholder="100" className="w-full bg-indigo-50/30 border-none p-6 rounded-3xl text-sm font-black text-indigo-900 focus:ring-4 focus:ring-indigo-500/10 transition shadow-inner" required />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-8">
                      <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] border border-emerald-100/50 space-y-4">
                         <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2"><Star className="w-4 h-4 fill-emerald-200" /> B2C 會員積分 %</label>
                         <input type="number" name="b2c_reward_percent" value={formData.b2c_reward_percent} onChange={handleChange} className="w-full bg-white border-none p-4 rounded-2xl text-sm font-black text-emerald-800 shadow-sm" />
                      </div>
                      <div className="bg-indigo-50/50 p-8 rounded-[2.5rem] border border-indigo-100/50 space-y-4">
                         <label className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2"><Zap className="w-4 h-4 fill-indigo-200" /> B2B 分潤比例 %</label>
                         <input type="number" name="b2b_commission_percent" value={formData.b2b_commission_percent} onChange={handleChange} className="w-full bg-white border-none p-4 rounded-2xl text-sm font-black text-indigo-800 shadow-sm" />
                      </div>
                   </div>

                   <button 
                     type="submit" 
                     disabled={isSubmitting} 
                     className={`w-full py-7 rounded-[2.5rem] font-black text-base transition-all shadow-2xl ${editingId ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'} text-white active:scale-[0.98]`}
                   >
                      {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : editingId ? "完成編輯並儲存" : "確認上架商品"}
                   </button>
                </form>
             </motion.div>
            ) : activeTab === 'list' ? (
             <motion.div 
               key="list-view"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-white rounded-[4rem] p-12 border border-slate-50 shadow-2xl shadow-slate-200/20"
             >
                                 <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                          <Package className="w-6 h-6" />
                       </div>
                       <h3 className="text-xl font-black text-slate-800">全品項管理清單</h3>
                    </div>
                    <button onClick={() => { handleCancelEdit(); setActiveTab("add"); }} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition group">
                       <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                    </button>
                 </div>

                 {/* 1. 商品統計指標看板 */}
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100/50 flex items-center gap-4">
                       <div className="w-12 h-12 bg-white text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                          <Package className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">總上架品項</p>
                          <h4 className="text-xl font-black text-slate-800 mt-1">{totalProducts} <span className="text-xs text-slate-400">個</span></h4>
                       </div>
                    </div>
                    <div className="bg-rose-50/50 p-6 rounded-[2rem] border border-rose-100/30 flex items-center gap-4">
                       <div className="w-12 h-12 bg-white text-rose-500 rounded-2xl flex items-center justify-center shadow-sm">
                          <AlertTriangle className="w-6 h-6 animate-pulse" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">庫存吃緊警報</p>
                          <h4 className="text-xl font-black text-rose-800 mt-1">{lowStockProducts} <span className="text-xs text-rose-400">個品項</span></h4>
                       </div>
                    </div>
                    <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100/30 flex items-center gap-4">
                       <div className="w-12 h-12 bg-white text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                          <Star className="w-6 h-6 fill-indigo-200 text-indigo-500" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">最高結帳售價</p>
                          <h4 className="text-xl font-black text-indigo-900 mt-1 truncate max-w-[140px]" title={highestPricedProduct?.name}>
                             {highestPricedProduct ? `${highestPricedProduct.price.toLocaleString()}` : "無"}
                          </h4>
                       </div>
                    </div>
                 </div>

                 {/* 2. 搜尋與大項分類快捷篩選 */}
                 <div className="space-y-6 mb-10 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                    <div className="relative">
                       <input 
                         type="text" 
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         placeholder="🔍 搜尋商品名稱或商品貨號 (SKU)..." 
                         className="w-full bg-white border-none p-5 rounded-2xl text-sm font-black text-slate-800 shadow-sm focus:ring-4 focus:ring-indigo-500/10 transition outline-none"
                       />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/40">
                       {["全部", ...categories].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategoryFilter(cat)}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategoryFilter === cat ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-100'}`}
                          >
                             {cat}
                          </button>
                       ))}
                    </div>
                 </div>

                {isLoading ? (
                   <div className="py-32 flex flex-col items-center gap-4">
                      <Loader2 className="w-12 h-12 animate-spin text-slate-200" />
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">正在同步資料庫...</p>
                   </div>
                ) : (
                   <div className="grid grid-cols-1 gap-6">
                      {filteredProducts.map(product => (
                         <div 
                           key={product.id} 
                           onClick={() => handleEditClick(product)}
                           className={`bg-slate-50 p-8 rounded-[3rem] flex items-center gap-8 border transition cursor-pointer group ${editingId === product.id ? 'border-indigo-500 ring-4 ring-indigo-500/10 bg-white' : 'border-slate-50 hover:border-emerald-100 hover:bg-white'}`}
                         >
                            <div className="w-24 h-24 bg-white rounded-[2rem] overflow-hidden shadow-inner flex items-center justify-center shrink-0 border border-slate-100">
                               {product.image_url ? (
                                  <img src={product.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                               ) : (
                                  <ImageIcon className="w-10 h-10 text-slate-100" />
                               )}
                            </div>
                            <div className="flex-1 space-y-2">
                               <div className="flex items-center gap-3 flex-wrap">
                                  <h4 className="text-lg font-black text-slate-800 leading-snug">{product.name}</h4>
                                  {product.sku && (
                                     <span className="text-[8px] font-black bg-slate-200 text-slate-500 px-2.5 py-1 rounded-full uppercase tracking-widest leading-none flex items-center h-fit select-none shrink-0">
                                        {product.sku}
                                     </span>
                                  )}
                               </div>
                               <div className="flex items-center gap-4">
                                  <span className="text-xl font-black text-indigo-600">${product.price.toLocaleString()}</span>
                                  {product.original_price && <span className="text-sm font-medium text-slate-300 line-through">${product.original_price.toLocaleString()}</span>}
                               </div>
                               {product.description && (
                                  <p className="text-xs text-slate-400 font-bold leading-relaxed line-clamp-1 italic bg-white border border-slate-100 rounded-lg px-3 py-1.5 inline-block max-w-fit">
                                     「{product.description}」
                                  </p>
                               )}
                               <div className="flex items-center gap-4">
                                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                     {product.category} | 建檔：{product.creator}
                                  </p>
                                  <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                     <Boxes className="w-3 h-3" /> 庫存: {product.stock_count || 0}
                                  </div>
                               </div>
                            </div>
                            <div className="flex flex-col gap-3 items-end">
                               <div className="flex gap-2">
                                  <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl text-[8px] font-black uppercase tracking-widest border border-emerald-100/50">
                                     {product.b2c_reward_percent}% Pt
                                  </div>
                                  <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-2xl text-[8px] font-black uppercase tracking-widest border border-indigo-100/50">
                                     {product.b2b_commission_percent}% Cr
                                  </div>
                               </div>
                               <button 
                                 type="button"
                                 onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                                 className="p-3 text-slate-200 hover:text-rose-500 transition"
                               >
                                  <Trash2 className="w-5 h-5" />
                               </button>
                            </div>
                         </div>
                      ))}
                      {filteredProducts.length === 0 && (
                          <div className="py-20 text-center space-y-4">
                             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                <Package className="w-10 h-10 text-slate-200" />
                             </div>
                             <p className="text-xs font-black text-slate-300 uppercase tracking-widest">
                                {searchQuery || selectedCategoryFilter !== "全部" ? "找不到符合條件的商品" : "目前尚無上架商品"}
                             </p>
                          </div>
                       )}
                       {false && products.length === 0 && (
                         <div className="py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                               <Package className="w-10 h-10 text-slate-200" />
                            </div>
                            <p className="text-xs font-black text-slate-300 uppercase tracking-widest">目前尚無上架商品</p>
                         </div>
                      )}
                   </div>
                )}
              </motion.div>
           ) : (
              <motion.div 
                key="category-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[4rem] p-12 border border-slate-50 shadow-2xl shadow-slate-200/20 space-y-10"
              >
                 <div className="flex items-center gap-4 border-b border-slate-50 pb-8">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
                       <LayoutDashboard className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-800">大項分類管理</h3>
                       <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">新增與維護商品的頂級大項分類</p>
                    </div>
                 </div>

                 {/* 新增分類 Form */}
                 <form onSubmit={handleAddCategory} className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100/50 space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">全新分類名稱</label>
                    <div className="flex gap-4">
                       <input 
                         type="text" 
                         value={newCategoryName} 
                         onChange={(e) => setNewCategoryName(e.target.value)}
                         placeholder="例: 精選茶包系列、特級配茶系列..." 
                         className="flex-1 bg-white border-none p-5 rounded-2xl text-sm font-black text-slate-800 shadow-sm focus:ring-4 focus:ring-amber-500/10 transition"
                         required
                       />
                       <button 
                         type="submit" 
                         disabled={isSavingCategory}
                         className="px-8 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-900 transition flex items-center gap-2 active:scale-95 shadow-md shrink-0"
                       >
                          {isSavingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                          新增分類大項
                       </button>
                    </div>
                 </form>

                 {/* 已有分類清單 */}
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">目前已啟用的大項分類</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {categories.map((cat) => {
                          // 計算屬於該大項的商品數量
                          const productCount = products.filter(p => p.category === cat).length;
                          return (
                             <div 
                               key={cat}
                               className="bg-slate-50/50 border border-slate-100 p-6 rounded-2xl flex items-center justify-between group hover:bg-white hover:border-amber-200 transition-all duration-300"
                             >
                                <div className="flex flex-col gap-1">
                                   <span className="text-sm font-black text-slate-800">{cat}</span>
                                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">目前關聯品項: {productCount} 個</span>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => handleDeleteCategory(cat)}
                                  className="p-3 text-slate-300 hover:text-rose-500 transition-all rounded-xl hover:bg-rose-50 active:scale-90"
                                >
                                   <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                          );
                       })}
                    </div>
                 </div>
              </motion.div>
            )}
         </div>

      </main>

      {/* Confirm Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[4rem] w-full max-w-sm p-12 text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
              <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
                 <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">{editingId ? "確認修改內容？" : "確認上架商品？"}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-10 px-4">
                 請確認商品資訊正確無誤，確認後將立即更新至前台商城。
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setShowConfirm(false)} className="py-6 bg-slate-50 text-slate-400 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition active:scale-95">
                   取消返回
                </button>
                <button type="button" onClick={handleConfirmSubmit} className="py-6 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition shadow-xl shadow-slate-900/20 active:scale-95">
                   確認送出
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
