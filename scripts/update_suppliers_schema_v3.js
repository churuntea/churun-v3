const fs = require('fs');
const path = require('path');

const suppliersPath = path.join(__dirname, '../app/admin/suppliers/page.tsx');
let code = fs.readFileSync(suppliersPath, 'utf8');

// 1. Add React import and missing icons
code = code.replace(
  'import { useEffect, useState, Suspense } from "react";',
  'import React, { useEffect, useState, Suspense, useRef } from "react";\nimport { fetchWithSWR, dbCache } from "@/utils/dbCache";'
);

code = code.replace(
  'Briefcase\n} from "lucide-react";',
  'Briefcase,\n  Package,\n  PackagePlus,\n  Hash,\n  Upload,\n  Image as ImageIcon,\n  Boxes,\n  Star,\n  Zap,\n  LayoutDashboard\n} from "lucide-react";'
);

// 2. Add product states and fetch logic
const stateInjection = `  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(["極萃系列", "精品茶具", "典藏禮盒"]);
  const [creators, setCreators] = useState<string[]>(["陳總經理", "王副總", "張主任", "系統管理員"]);
  
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [productFormData, setProductFormData] = useState({
    name: "", original_price: "", price: "", image_url: "", creator: "陳總經理",
    b2c_reward_percent: "10", b2b_commission_percent: "15",
    ambassador_personal_reward: "", ambassador_direct_reward: "",
    partner_personal_reward: "", partner_direct_reward: "",
    category: "極萃系列", stock_count: 0, sku: "", description: "",
    order_unit: "件", order_unit_size: 1, min_order_quantity: 1, supplier_id: ""
  });
`;

code = code.replace('  const [isLoading, setIsLoading] = useState(true);', '  const [isLoading, setIsLoading] = useState(true);\n' + stateInjection);

// Inject fetch functions
const fetchInjection = `
    fetchProducts();
    fetchCategories();
    fetchCreators();
`;
code = code.replace('fetchSuppliers();', 'fetchSuppliers();\n' + fetchInjection);

const fetchMethods = `
  const fetchProducts = async (forceRefresh = false) => {
    try {
      const productsKey = "churun_cache:products_admin";
      if (forceRefresh) dbCache.invalidate(productsKey);
      const cachedProducts = await fetchWithSWR(productsKey, async () => {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (data.success) {
          return (data.products || []).map((p: any) => ({ ...p, category: p.category || "極萃系列" }));
        }
        throw new Error(data.error || "取得商品列表失敗");
      }, {
        ttl: 120000,
        useLocal: true,
        onBackgroundUpdate: (fresh) => setProducts(fresh)
      });
      setProducts(cachedProducts);
    } catch (err) { console.error("獲取商品列表出錯:", err); }
  };

  const fetchCategories = async () => {
    try {
      const cachedList = await fetchWithSWR("churun_cache:categories", async () => {
        const { data } = await supabase.from("announcements").select("*").eq("title", "[SYSTEM_CATEGORIES]").maybeSingle();
        if (data && data.content) {
          const parsed = JSON.parse(data.content);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        return ["極萃系列", "精品茶具", "典藏禮盒"];
      }, { ttl: 600000, useLocal: true, onBackgroundUpdate: (fresh) => setCategories(fresh) });
      if (cachedList && cachedList.length > 0) setCategories(cachedList);
    } catch (err) { console.error("載入分類大項錯誤:", err); }
  };

  const fetchCreators = async () => {
    try {
      const res = await fetch("/api/hr", { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.staff) {
        const names = data.staff.map((s: any) => s.name);
        if (names.length > 0) setCreators(names);
      }
    } catch (err) { console.error("載入人事資料出錯:", err); }
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProductFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) return alert("檔案太大 (限制 3MB 以內)");
      const reader = new FileReader();
      reader.onload = (e) => setProductFormData(prev => ({ ...prev, image_url: e.target?.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleOpenProductModal = (productToEdit?: any) => {
    if (productToEdit) {
      setEditingProduct(productToEdit);
      setProductFormData({
        name: productToEdit.name || "",
        original_price: productToEdit.original_price?.toString() || "",
        price: productToEdit.price?.toString() || "",
        image_url: productToEdit.image_url || "",
        creator: productToEdit.creator || "陳總經理",
        b2c_reward_percent: productToEdit.b2c_reward_percent?.toString() || "10",
        b2b_commission_percent: productToEdit.b2b_commission_percent?.toString() || "15",
        ambassador_personal_reward: productToEdit.ambassador_personal_reward?.toString() || "",
        ambassador_direct_reward: productToEdit.ambassador_direct_reward?.toString() || "",
        partner_personal_reward: productToEdit.partner_personal_reward?.toString() || "",
        partner_direct_reward: productToEdit.partner_direct_reward?.toString() || "",
        category: productToEdit.category || categories[0] || "極萃系列",
        stock_count: productToEdit.stock_count || 0,
        sku: productToEdit.sku || "",
        description: productToEdit.description || "",
        order_unit: productToEdit.order_unit || "件",
        order_unit_size: productToEdit.order_unit_size || 1,
        min_order_quantity: productToEdit.min_order_quantity || 1,
        supplier_id: productToEdit.supplier_id || editingId
      });
    } else {
      setEditingProduct(null);
      setProductFormData({
        name: "", original_price: "", price: "", image_url: "", creator: creators[0] || "陳總經理",
        b2c_reward_percent: "10", b2b_commission_percent: "15",
        ambassador_personal_reward: "", ambassador_direct_reward: "",
        partner_personal_reward: "", partner_direct_reward: "",
        category: categories[0] || "極萃系列", stock_count: 0, sku: "", description: "",
        order_unit: "件", order_unit_size: 1, min_order_quantity: 1, supplier_id: editingId || ""
      });
    }
    setShowProductModal(true);
  };

  const submitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productFormData.name || !productFormData.price) return alert("品名與結帳售價為必填");
    setIsSubmittingProduct(true);
    try {
      const method = editingProduct ? "PUT" : "POST";
      const payload = {
        id: editingProduct?.id,
        ...productFormData,
        original_price: productFormData.original_price ? Number(productFormData.original_price) : null,
        price: Number(productFormData.price),
        b2c_reward_percent: Number(productFormData.b2c_reward_percent),
        b2b_commission_percent: Number(productFormData.b2b_commission_percent),
        ambassador_personal_reward: Number(productFormData.ambassador_personal_reward),
        ambassador_direct_reward: Number(productFormData.ambassador_direct_reward),
        partner_personal_reward: Number(productFormData.partner_personal_reward),
        partner_direct_reward: Number(productFormData.partner_direct_reward),
        stock_count: Number(productFormData.stock_count),
        supplier_id: editingId || productFormData.supplier_id
      };
      
      const res = await fetch("/api/products", {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        dbCache.invalidate("churun_cache:products_admin");
        alert(editingProduct ? "商品更新成功！" : "商品新增成功！");
        setShowProductModal(false);
        fetchProducts(true);
      } else {
        alert("操作失敗: " + data.error);
      }
    } catch (err: any) {
      alert("系統錯誤: " + err.message);
    }
    setIsSubmittingProduct(false);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("確定要刪除此商品嗎？")) return;
    try {
      const res = await fetch("/api/products", {
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        dbCache.invalidate("churun_cache:products_admin");
        fetchProducts(true);
      } else alert("刪除失敗: " + data.error);
    } catch (err: any) { alert("系統錯誤: " + err.message); }
  };
`;
code = code.replace('  const handleAddSuppliedItem = () => {', fetchMethods + '\n  const handleAddSuppliedItem = () => {');

// 3. Update the Items Tab UI to show real products
const itemsTabOriginal = `{/* Items Tab */}
                         {activeTab === "items" && (
                           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                             <div className="flex items-center justify-between">
                                <p className="text-xs text-slate-400 font-bold">設定此廠商常態供應的物料或商品，方便後續叫貨</p>
                                <button type="button" onClick={handleAddSuppliedItem} className="px-3 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg text-xs font-black transition flex items-center gap-1 shrink-0">
                                   <Plus className="w-3 h-3" /> 新增品項
                                </button>
                             </div>
                             
                             {formData.supplied_items.length === 0 ? (
                                <div className="p-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
                                   <Tag className="w-8 h-8 text-slate-300 mb-2" />
                                   <p className="text-slate-400 text-xs font-bold">尚未建立任何品項</p>
                                </div>
                             ) : (
                                <div className="space-y-3 pt-2">
                                   {formData.supplied_items.map((item, idx) => (
                                      <div key={idx} className="flex flex-col md:flex-row items-center gap-2 bg-slate-50 p-3 rounded-xl">
                                         <input type="text" value={item.name || ""} onChange={(e) => handleSuppliedItemChange(idx, "name", e.target.value)} placeholder="品項名稱(必填)" className="w-full md:w-auto md:flex-[2] bg-white border border-slate-200 p-2.5 rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500/30 transition" required />
                                         <input type="text" value={item.spec || ""} onChange={(e) => handleSuppliedItemChange(idx, "spec", e.target.value)} placeholder="規格(例:1斤)" className="w-full md:w-auto md:flex-1 bg-white border border-slate-200 p-2.5 rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500/30 transition" />
                                         <input type="number" value={item.price || ""} onChange={(e) => handleSuppliedItemChange(idx, "price", e.target.value)} placeholder="單價" className="w-full md:w-auto md:flex-1 bg-white border border-slate-200 p-2.5 rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500/30 transition" />
                                         <input type="text" value={item.unit || ""} onChange={(e) => handleSuppliedItemChange(idx, "unit", e.target.value)} placeholder="單位(例:包)" className="w-full md:w-auto md:flex-1 bg-white border border-slate-200 p-2.5 rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500/30 transition" />
                                         <button type="button" onClick={() => handleRemoveSuppliedItem(idx)} className="p-2.5 shrink-0 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition" title="移除品項">
                                            <Trash2 className="w-4 h-4" />
                                         </button>
                                      </div>
                                   ))}
                                </div>
                             )}
                           </motion.div>
                         )}`;

const itemsTabNew = `{/* Items Tab (Synced with Products Database) */}
                         {activeTab === "items" && (
                           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                             <div className="flex items-center justify-between">
                                <p className="text-xs text-slate-400 font-bold flex items-center gap-2">
                                  <Package className="w-4 h-4"/> 
                                  與「商品管理」資料庫同步
                                </p>
                                <button type="button" onClick={() => handleOpenProductModal()} className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-black transition flex items-center gap-1 shrink-0 shadow-md">
                                   <Plus className="w-4 h-4" /> 新增商品
                                </button>
                             </div>
                             
                             <div className="space-y-3 pt-2">
                                {products.filter(p => p.supplier_id === editingId).length === 0 ? (
                                   <div className="p-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
                                      <PackagePlus className="w-10 h-10 text-slate-300 mb-3" />
                                      <p className="text-slate-400 text-sm font-bold">目前無任何關聯商品</p>
                                      <p className="text-slate-400 text-[10px] mt-1">點擊上方按鈕立即建立商品</p>
                                   </div>
                                ) : (
                                   products.filter(p => p.supplier_id === editingId).map((product) => (
                                     <div key={product.id} className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm hover:border-indigo-100 transition group">
                                        <div className="flex items-center gap-4">
                                           <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                                              {product.image_url ? <img src={product.image_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-slate-300" />}
                                           </div>
                                           <div>
                                              <h5 className="text-sm font-black text-slate-800">{product.name}</h5>
                                              <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs font-bold text-indigo-600">\${product.price.toLocaleString()}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{product.category}</span>
                                                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Boxes className="w-3 h-3"/> {product.stock_count}</span>
                                              </div>
                                           </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                           <button type="button" onClick={() => handleOpenProductModal(product)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition">
                                              <Edit className="w-4 h-4" />
                                           </button>
                                           <button type="button" onClick={() => deleteProduct(product.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition">
                                              <Trash2 className="w-4 h-4" />
                                           </button>
                                        </div>
                                     </div>
                                   ))
                                )}
                             </div>
                           </motion.div>
                         )}`;

code = code.replace(itemsTabOriginal, itemsTabNew);


// 4. Also update the supplier list view to use the real products
const listSuppliedItemsOriginal = `{sup.supplied_items && sup.supplied_items.length > 0 ? (
                                    <div className="flex flex-col gap-1 items-start">
                                      {sup.supplied_items.slice(0, 2).map((item: any, idx: number) => (
                                        <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[10px] font-bold inline-block truncate max-w-[120px]">
                                          {item.name}
                                        </span>
                                      ))}
                                      {sup.supplied_items.length > 2 && (
                                        <span className="text-[9px] text-slate-400 font-bold ml-1">+{sup.supplied_items.length - 2} 個品項</span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic text-[10px]">無</span>
                                  )}`;

const listSuppliedItemsNew = `(() => {
                                     const linkedProducts = products.filter(p => p.supplier_id === sup.id);
                                     if (linkedProducts.length > 0) {
                                       return (
                                         <div className="flex flex-col gap-1 items-start">
                                           {linkedProducts.slice(0, 2).map((product: any) => (
                                             <span key={product.id} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-[10px] font-bold inline-block truncate max-w-[140px] border border-indigo-100/50">
                                               {product.name}
                                             </span>
                                           ))}
                                           {linkedProducts.length > 2 && (
                                             <span className="text-[9px] text-slate-400 font-bold ml-1">+{linkedProducts.length - 2} 個商品</span>
                                           )}
                                         </div>
                                       );
                                     } else {
                                       return <span className="text-slate-400 italic text-[10px]">無</span>;
                                     }
                                  })()`;

code = code.replace(listSuppliedItemsOriginal, listSuppliedItemsNew);

// 5. Append Product Modal at the end of the return statement
const productModalJSX = `
       {/* Product Edit Modal */}
       <AnimatePresence>
          {showProductModal && (
             <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowProductModal(false)}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl relative z-10 flex flex-col max-h-[95vh]"
                >
                   {/* Header */}
                   <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-indigo-50/30 rounded-t-[2.5rem]">
                      <div>
                         <h3 className="text-xl font-black text-slate-800">
                            {editingProduct ? "編輯商品資料" : "新增商品資料"}
                         </h3>
                         <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest flex items-center gap-1">
                            <Package className="w-3 h-3" /> 與商品管理資料庫連動
                         </p>
                      </div>
                      <button 
                        onClick={() => setShowProductModal(false)}
                        className="p-2 bg-white text-slate-400 hover:text-slate-600 rounded-full transition shadow-sm"
                      >
                         <X className="w-5 h-5" />
                      </button>
                   </div>

                   {/* Form Body */}
                   <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                     <form id="productForm" onSubmit={submitProduct} className="space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3" /> 建檔者身分
                             </label>
                             <select name="creator" value={productFormData.creator} onChange={handleProductChange} className="w-full bg-slate-50 border-none p-5 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition">
                               {creators.map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                          </div>
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest flex items-center gap-2">
                                <LayoutDashboard className="w-3 h-3" /> 商品分類
                             </label>
                             <select name="category" value={productFormData.category} onChange={handleProductChange} className="w-full bg-slate-50 border-none p-5 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition">
                               {categories.map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">商品名稱</label>
                             <input type="text" name="name" value={productFormData.name} onChange={handleProductChange} placeholder="請輸入完整商品品名" className="w-full bg-slate-50 border-none p-5 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition shadow-inner" required />
                          </div>
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest flex items-center gap-2"><Hash className="w-3 h-3" /> 商品貨號 (SKU)</label>
                             <input type="text" name="sku" value={productFormData.sku} onChange={handleProductChange} placeholder="例: CRT-001" className="w-full bg-slate-50 border-none p-5 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition shadow-inner" />
                          </div>
                       </div>

                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">商品主圖</label>
                          <div className="flex items-center gap-6">
                             <div 
                               onClick={() => fileInputRef.current?.click()}
                               className="w-32 h-32 border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-indigo-300 transition overflow-hidden relative shrink-0"
                             >
                               <input type="file" ref={fileInputRef} onChange={handleProductFileChange} className="hidden" accept=".jpg,.jpeg,.png" />
                               {productFormData.image_url ? (
                                  <img src={productFormData.image_url} alt="" className="w-full h-full object-cover" />
                               ) : (
                                  <>
                                     <Upload className="w-6 h-6 text-slate-300 mb-2" />
                                     <span className="text-[8px] font-bold text-slate-400">上傳圖片</span>
                                  </>
                               )}
                             </div>
                             <div className="flex-1 space-y-2">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">或輸入圖片網址</span>
                                <input 
                                  type="text" name="image_url" value={productFormData.image_url && productFormData.image_url.startsWith('data:image') ? "" : productFormData.image_url} 
                                  onChange={handleProductChange} placeholder="https://..." 
                                  className="w-full bg-slate-50 border-none p-4 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 transition"
                                />
                             </div>
                          </div>
                       </div>

                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">商品描述</label>
                         <textarea name="description" value={productFormData.description} onChange={handleProductChange} placeholder="商品描述..." className="w-full bg-slate-50 border-none p-4 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 transition min-h-[80px] resize-none" />
                       </div>

                       <h3 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-2 mt-4">價格與庫存</h3>
                       <div className="grid grid-cols-3 gap-6">
                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">定價 (原價)</label>
                            <input type="number" name="original_price" value={productFormData.original_price} onChange={handleProductChange} className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-bold" />
                         </div>
                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-indigo-500 ml-1 uppercase tracking-widest">結帳售價 (必填)</label>
                            <input type="number" name="price" value={productFormData.price} onChange={handleProductChange} className="w-full bg-indigo-50 border-none p-4 rounded-2xl text-sm font-bold text-indigo-900" required />
                         </div>
                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-emerald-600 ml-1 uppercase tracking-widest flex items-center gap-1"><Boxes className="w-3 h-3"/> 庫存量</label>
                            <input type="number" name="stock_count" value={productFormData.stock_count} onChange={handleProductChange} className="w-full bg-emerald-50 border-none p-4 rounded-2xl text-sm font-black text-emerald-900" required />
                         </div>
                       </div>

                       <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">B2C 會員積分 %</label>
                             <input type="number" name="b2c_reward_percent" value={productFormData.b2c_reward_percent} onChange={handleProductChange} className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-bold" />
                          </div>
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">B2B 分潤比例 %</label>
                             <input type="number" name="b2b_commission_percent" value={productFormData.b2b_commission_percent} onChange={handleProductChange} className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-bold" />
                          </div>
                       </div>
                     </form>
                   </div>
                   
                   {/* Footer */}
                   <div className="p-6 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50/50 rounded-b-[2.5rem]">
                      <button type="button" onClick={() => setShowProductModal(false)} className="px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition shadow-sm">
                         取消
                      </button>
                      <button form="productForm" type="submit" disabled={isSubmittingProduct} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50">
                         {isSubmittingProduct ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                         儲存商品
                      </button>
                   </div>
                </motion.div>
             </div>
          )}
       </AnimatePresence>
`;

code = code.replace('</AnimatePresence>\n    </main>', '</AnimatePresence>\n' + productModalJSX + '    </main>');

fs.writeFileSync(suppliersPath, code);
console.log("Successfully updated suppliers/page.tsx!");
