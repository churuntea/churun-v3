"use client";

import React, { useEffect, useState, Suspense, useRef } from "react";
import { fetchWithSWR, dbCache } from "@/utils/dbCache";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../supabase";
import { 
  ArrowLeft,
  Plus, 
  Search, 
  Loader2, 
  X,
  FileText,
  Phone,
  Building,
  User,
  MapPin,
  Trash2,
  Edit,
  CheckCircle2,
  AlertTriangle,
  Tag,
  CreditCard,
  Briefcase,
  Package,
  PackagePlus,
  Hash,
  Upload,
  Image as ImageIcon,
  Boxes,
  Star,
  Zap,
  LayoutDashboard
} from "lucide-react";

function AdminSuppliersContent() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [productCategories, setProductCategories] = useState<string[]>(["極萃系列", "精品茶具", "典藏禮盒"]);
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

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("active");
  
  // Modal 狀態
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"basic" | "finance" | "items">("basic");
  
  // 表單狀態
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    tax_id: "",
    contact_person: "",
    address: "",
    notes: "",
    status: "active",
    category: "",
    payment_terms: "",
    bank_info: "",
    supplied_items: [] as any[]
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const categories = ["原料商", "包材商", "設備商", "物流商", "其他"];

  useEffect(() => {
    const isAdmin = sessionStorage.getItem("churun_admin_auth");
    if (!isAdmin) {
      router.replace("/admin");
      return;
    }
    fetchSuppliers();

    fetchProducts();
    fetchCategories();
    fetchCreators();

  }, [router]);

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      
      const parsedData = (data || []).map(s => {
        let notes = s.notes || "";
        let supplied_items = s.supplied_items || [];
        const separator = "||_EXT_JSON_||";
        if (notes.includes(separator)) {
          const parts = notes.split(separator);
          notes = parts[0];
          try {
            const extData = JSON.parse(parts[1]);
            if (extData.supplied_items) {
              supplied_items = extData.supplied_items;
            }
          } catch(e) {}
        }
        return { ...s, notes, supplied_items };
      });
      
      setSuppliers(parsedData);
    } catch (err) {
      console.error("獲取供應商列表出錯:", err);
    }
    setIsLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


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
      }, { ttl: 600000, useLocal: true, onBackgroundUpdate: (fresh) => setProductCategories(fresh) });
      if (cachedList && cachedList.length > 0) setProductCategories(cachedList);
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
        category: productToEdit.category || productCategories[0] || "極萃系列",
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
        category: productCategories[0] || "極萃系列", stock_count: 0, sku: "", description: "",
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

  const handleAddSuppliedItem = () => {
    setFormData(prev => ({
      ...prev,
      supplied_items: [...prev.supplied_items, { name: "", spec: "", price: "", unit: "" }]
    }));
  };

  const handleRemoveSuppliedItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      supplied_items: prev.supplied_items.filter((_, i) => i !== index)
    }));
  };

  const handleSuppliedItemChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newItems = [...prev.supplied_items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, supplied_items: newItems };
    });
  };

  const handleOpenAddModal = () => {
    setModalType("add");
    setEditingId(null);
    setActiveTab("basic");
    setFormData({
      name: "",
      phone: "",
      tax_id: "",
      contact_person: "",
      address: "",
      notes: "",
      status: "active",
      category: "原料商",
      payment_terms: "",
      bank_info: "",
      supplied_items: []
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (supplier: any) => {
    setModalType("edit");
    setEditingId(supplier.id);
    setActiveTab("basic");
    setFormData({
      name: supplier.name || "",
      phone: supplier.phone || "",
      tax_id: supplier.tax_id || "",
      contact_person: supplier.contact_person || "",
      address: supplier.address || "",
      notes: supplier.notes || "",
      status: supplier.status || "active",
      category: supplier.category || "原料商",
      payment_terms: supplier.payment_terms || "",
      bank_info: supplier.bank_info || "",
      supplied_items: supplier.supplied_items || []
    });
    setShowModal(true);
  };

  const validateForm = () => {
    if (!formData.name) return "廠商名稱為必填！";
    if (formData.tax_id && !/^\d{8}$/.test(formData.tax_id)) return "統一編號格式錯誤 (需為 8 碼數字)";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errorMsg = validateForm();
    if (errorMsg) return alert(errorMsg);
    
    setIsSubmitting(true);
    try {
      let payload = { ...formData };
      let attempt = 0;
      let maxAttempts = 2;
      let lastError = null;

      while (attempt < maxAttempts) {
        let error;
        if (modalType === "add") {
          const res = await supabase.from("suppliers").insert([payload]).select();
          error = res.error;
        } else if (modalType === "edit" && editingId) {
          const res = await supabase.from("suppliers").update(payload).eq("id", editingId).select();
          error = res.error;
        }
        
        if (!error) {
          lastError = null;
          break;
        }
        
        lastError = error;
        if (error.message && error.message.includes("Could not find the 'supplied_items' column")) {
          // Fallback: Embed supplied_items into notes
          const itemsToEmbed = payload.supplied_items || formData.supplied_items;
          const extJson = JSON.stringify({ supplied_items: itemsToEmbed });
          payload.notes = (payload.notes || "") + "||_EXT_JSON_||" + extJson;
          delete (payload as any).supplied_items;
          attempt++;
        } else {
          break; // Break on other errors
        }
      }

      if (lastError) throw lastError;

      alert(modalType === "add" ? "🎉 供應商新增成功！" : "🎉 供應商資料更新成功！");
      
      setShowModal(false);
      fetchSuppliers();
    } catch (err: any) {
      if (err.message?.includes("duplicate key value") || err.message?.includes("suppliers_name_key")) {
        alert("新增失敗：此供應商名稱已經存在，請勿重複新增！");
      } else {
        alert("操作失敗: " + err.message);
      }
    }
    setIsSubmitting(false);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", deletingId);
        
      if (error) throw error;
      alert("🎉 供應商已成功刪除！");
      fetchSuppliers();
    } catch (err: any) {
      alert("刪除失敗: " + err.message);
    }
    setShowDeleteConfirm(false);
    setDeletingId(null);
  };

  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch = s.name?.includes(searchQuery) || s.tax_id?.includes(searchQuery) || s.contact_person?.includes(searchQuery);
    const matchesCategory = filterCategory === "all" || s.category === filterCategory;
    const matchesStatus = filterStatus === "all" || s.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <main className="p-8 bg-[#FDFBF7] min-h-screen">
       <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => router.push("/admin/inventory")} 
                  className="w-10 h-10 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl flex items-center justify-center transition shadow-sm"
                >
                   <ArrowLeft className="w-5 h-5 text-slate-400" />
                </button>
                <div>
                   <h1 className="text-3xl font-black text-slate-800 tracking-tight">供應商資料庫</h1>
                   <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">維護進貨廠商基本資料與財務對帳設定</p>
                </div>
             </div>
             
             <div className="flex items-center gap-3 w-full md:w-auto">
                <button 
                  onClick={handleOpenAddModal}
                  className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 shrink-0"
                >
                   <Plus className="w-4 h-4" /> 新增供應商
                </button>
             </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
             <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 搜尋廠商名稱、統編或聯絡人..." 
                  className="w-full bg-slate-50 border-none p-3 pl-11 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/30 outline-none"
                />
             </div>
             <div className="flex gap-2 shrink-0">
                <select 
                  value={filterCategory} 
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-slate-50 border-none p-3 rounded-xl text-xs font-bold text-slate-600 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="all">所有分類</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-50 border-none p-3 rounded-xl text-xs font-bold text-slate-600 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="all">所有狀態</option>
                  <option value="active">合作中</option>
                  <option value="inactive">已終止</option>
                </select>
             </div>
          </div>

          {/* List View */}
          <div className="bg-white rounded-[3rem] p-8 border border-slate-50 shadow-2xl shadow-slate-200/20">
             {isLoading ? (
                <div className="py-32 flex flex-col items-center gap-4">
                   <Loader2 className="w-12 h-12 animate-spin text-slate-200" />
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">正在載入供應商資料...</p>
                </div>
             ) : (
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="pb-4 pl-2">廠商名稱 / 狀態</th>
                            <th className="pb-4">統一編號</th>
                            <th className="pb-4">聯絡人與電話</th>
                            <th className="pb-4">結帳/財務資訊</th>
                            <th className="pb-4">供應品項</th>
                            <th className="pb-4 text-center pr-2">操作</th>
                         </tr>
                      </thead>
                      <tbody>
                         {filteredSuppliers.map((sup) => (
                            <tr key={sup.id} className="border-b border-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-50/50 transition">
                               <td className="py-5 pl-2">
                                  <div className="flex flex-col gap-2">
                                     <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${sup.status === 'inactive' ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                           {sup.name?.charAt(0)}
                                        </div>
                                        <span className={`font-black ${sup.status === 'inactive' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{sup.name}</span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider ${sup.status === 'inactive' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                          {sup.status === 'inactive' ? '終止合作' : '合作中'}
                                        </span>
                                        {sup.category && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] uppercase tracking-wider">{sup.category}</span>}
                                     </div>
                                  </div>
                               </td>
                               <td className="py-5 text-slate-500 font-mono align-top">{sup.tax_id || "—"}</td>
                               <td className="py-5 text-slate-600 align-top">
                                  <div className="flex flex-col gap-1">
                                    <span className="font-black text-slate-700">{sup.contact_person || "—"}</span>
                                    <span className="text-[10px] text-slate-500 font-mono">{sup.phone || "—"}</span>
                                  </div>
                               </td>
                               <td className="py-5 text-slate-500 align-top">
                                  <div className="flex flex-col gap-1 text-[10px]">
                                    <div className="flex items-center gap-1"><Briefcase className="w-3 h-3 text-slate-400"/> {sup.payment_terms || "未設定"}</div>
                                    <div className="flex items-center gap-1"><CreditCard className="w-3 h-3 text-slate-400"/> <span className="truncate max-w-[150px]">{sup.bank_info || "未設定"}</span></div>
                                  </div>
                               </td>
                               <td className="py-5 text-slate-500 align-top">
                                  {(() => {
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
                                  })()}
                               </td>
                               <td className="py-5 text-center pr-2 align-top">
                                  <div className="flex items-center justify-center gap-2">
                                     <button 
                                       onClick={() => handleOpenEditModal(sup)}
                                       className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                                       title="編輯"
                                     >
                                        <Edit className="w-4 h-4" />
                                     </button>
                                     <button 
                                       onClick={() => handleDeleteClick(sup.id)}
                                       className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition"
                                       title="刪除"
                                     >
                                        <Trash2 className="w-4 h-4" />
                                     </button>
                                  </div>
                               </td>
                            </tr>
                         ))}
                         {filteredSuppliers.length === 0 && (
                            <tr>
                               <td colSpan={6} className="py-20 text-center text-slate-400 text-xs font-bold">
                                  找不到符合條件的供應商資料
                               </td>
                            </tr>
                         )}
                      </tbody>
                   </table>
                </div>
             )}
          </div>
       </div>

       {/* Add/Edit Modal */}
       <AnimatePresence>
          {showModal && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowModal(false)}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
                >
                   {/* Modal Header */}
                   <div className="p-8 pb-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                      <div>
                         <h3 className="text-2xl font-black text-slate-800">
                            {modalType === "add" ? "新增供應商資料" : "編輯供應商資料"}
                         </h3>
                         <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                            {modalType === "add" ? "建立新的廠商檔案" : `正在編輯: ${formData.name}`}
                         </p>
                      </div>
                      <button 
                        onClick={() => setShowModal(false)}
                        className="p-2 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full transition"
                      >
                         <X className="w-5 h-5" />
                      </button>
                   </div>

                   {/* Tabs */}
                   <div className="px-8 pt-4 flex gap-6 border-b border-slate-100 shrink-0">
                      <button 
                        onClick={() => setActiveTab("basic")}
                        className={`pb-4 text-xs font-black tracking-widest uppercase transition border-b-2 ${activeTab === 'basic' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                      >
                        基本資訊
                      </button>
                      <button 
                        onClick={() => setActiveTab("finance")}
                        className={`pb-4 text-xs font-black tracking-widest uppercase transition border-b-2 ${activeTab === 'finance' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                      >
                        財務設定
                      </button>
                      <button 
                        onClick={() => setActiveTab("items")}
                        className={`pb-4 text-xs font-black tracking-widest uppercase transition border-b-2 ${activeTab === 'items' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                      >
                        供應品項 ({formData.supplied_items.length})
                      </button>
                   </div>

                   {/* Modal Body */}
                   <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                      <form id="supplierForm" onSubmit={handleSubmit} className="space-y-6">
                         
                         {/* Basic Tab */}
                         {activeTab === "basic" && (
                           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                             <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">廠商名稱 <span className="text-rose-500">*</span></label>
                                   <div className="relative">
                                      <Building className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                                      <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="例: 初潤南投茶園總廠" className="w-full bg-slate-50 border-none p-4 pl-11 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/30 transition" required />
                                   </div>
                                </div>
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">統一編號</label>
                                   <div className="relative">
                                      <FileText className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                                      <input type="text" name="tax_id" value={formData.tax_id} onChange={handleChange} placeholder="8碼數字" maxLength={8} className="w-full bg-slate-50 border-none p-4 pl-11 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/30 transition" />
                                   </div>
                                </div>
                             </div>

                             <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">聯絡人</label>
                                   <div className="relative">
                                      <User className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                                      <input type="text" name="contact_person" value={formData.contact_person} onChange={handleChange} placeholder="例: 王經理" className="w-full bg-slate-50 border-none p-4 pl-11 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/30 transition" />
                                   </div>
                                </div>
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">聯絡電話</label>
                                   <div className="relative">
                                      <Phone className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="例: 049-1234567" className="w-full bg-slate-50 border-none p-4 pl-11 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/30 transition" />
                                   </div>
                                </div>
                             </div>

                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">通訊地址</label>
                                <div className="relative">
                                   <MapPin className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                                   <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="例: 南投縣竹山鎮..." className="w-full bg-slate-50 border-none p-4 pl-11 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/30 transition" />
                                </div>
                             </div>

                             <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">合作狀態</label>
                                   <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-slate-50 border-none p-4 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/30 transition">
                                     <option value="active">合作中 (Active)</option>
                                     <option value="inactive">終止合作 (Inactive)</option>
                                   </select>
                                </div>
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">廠商分類</label>
                                   <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-slate-50 border-none p-4 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/30 transition">
                                     {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                   </select>
                                </div>
                             </div>
                           </motion.div>
                         )}

                         {/* Finance Tab */}
                         {activeTab === "finance" && (
                           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">結帳方式</label>
                                <div className="relative">
                                   <Briefcase className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                                   <input type="text" name="payment_terms" value={formData.payment_terms} onChange={handleChange} placeholder="例: 月結30天、貨到付款" className="w-full bg-slate-50 border-none p-4 pl-11 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/30 transition" />
                                </div>
                             </div>

                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">匯款銀行與帳號</label>
                                <div className="relative">
                                   <CreditCard className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                                   <input type="text" name="bank_info" value={formData.bank_info} onChange={handleChange} placeholder="例: 國泰世華(013) 123456789012" className="w-full bg-slate-50 border-none p-4 pl-11 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/30 transition" />
                                </div>
                             </div>

                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">備註說明</label>
                                <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="財務對帳提醒事項..." rows={4} className="w-full bg-slate-50 border-none p-4 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/30 transition resize-none" />
                             </div>
                           </motion.div>
                         )}

                         {/* Items Tab (Synced with Products Database) */}
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
                                                <span className="text-xs font-bold text-indigo-600">${product.price.toLocaleString()}</span>
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
                         )}

                      </form>
                   </div>

                   {/* Modal Footer */}
                   <div className="p-6 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50/50 rounded-b-[2.5rem]">
                      <button 
                        type="button" 
                        onClick={() => setShowModal(false)}
                        className="px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition shadow-sm"
                      >
                         取消
                      </button>
                      <button 
                        form="supplierForm"
                        type="submit" 
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-600/20"
                      >
                         {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                         {modalType === "add" ? "確認新增" : "儲存修改"}
                      </button>
                   </div>
                </motion.div>
             </div>
          )}
       </AnimatePresence>

       {/* Delete Confirm Modal */}
       <AnimatePresence>
          {showDeleteConfirm && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-white rounded-[3rem] w-full max-w-sm p-10 text-center shadow-2xl relative z-10"
                >
                   <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <AlertTriangle className="w-10 h-10" />
                   </div>
                   <h3 className="text-xl font-black text-slate-800 mb-2">確認刪除此供應商？</h3>
                   <p className="text-xs text-slate-400 font-bold mb-8">此操作將無法復原，請確認是否繼續？</p>
                   
                   <div className="flex gap-4">
                      <button 
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition"
                      >
                         取消
                      </button>
                      <button 
                        onClick={handleConfirmDelete}
                        className="flex-1 py-4 bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-600 transition shadow-lg shadow-rose-500/20"
                      >
                         確認刪除
                      </button>
                   </div>
                </motion.div>
             </div>
          )}
       </AnimatePresence>

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
                               {productCategories.map(c => <option key={c} value={c}>{c}</option>)}
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
    </main>
  );
}

export default function AdminSuppliers() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>}>
      <AdminSuppliersContent />
    </Suspense>
  );
}
