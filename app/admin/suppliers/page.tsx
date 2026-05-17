"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../supabase";
import { 
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
  AlertTriangle
} from "lucide-react";

function AdminSuppliersContent() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal 狀態
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // 表單狀態
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    tax_id: "",
    contact_person: "",
    address: "",
    notes: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const isAdmin = sessionStorage.getItem("churun_admin_auth");
    if (!isAdmin) {
      router.replace("/admin");
      return;
    }
    fetchSuppliers();
  }, [router]);

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      setSuppliers(data || []);
    } catch (err) {
      console.error("獲取供應商列表出錯:", err);
    }
    setIsLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenAddModal = () => {
    setModalType("add");
    setEditingId(null);
    setFormData({
      name: "",
      phone: "",
      tax_id: "",
      contact_person: "",
      address: "",
      notes: ""
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (supplier: any) => {
    setModalType("edit");
    setEditingId(supplier.id);
    setFormData({
      name: supplier.name || "",
      phone: supplier.phone || "",
      tax_id: supplier.tax_id || "",
      contact_person: supplier.contact_person || "",
      address: supplier.address || "",
      notes: supplier.notes || ""
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert("廠商名稱為必填！");
    
    setIsSubmitting(true);
    try {
      if (modalType === "add") {
        const { error } = await supabase
          .from("suppliers")
          .insert([formData]);
          
        if (error) throw error;
        alert("🎉 供應商新增成功！");
      } else if (modalType === "edit" && editingId) {
        const { error } = await supabase
          .from("suppliers")
          .update(formData)
          .eq("id", editingId);
          
        if (error) throw error;
        alert("🎉 供應商資料更新成功！");
      }
      
      setShowModal(false);
      fetchSuppliers();
    } catch (err: any) {
      alert("操作失敗: " + err.message);
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

  const filteredSuppliers = suppliers.filter(s => 
    s.name?.includes(searchQuery) || 
    s.tax_id?.includes(searchQuery) || 
    s.contact_person?.includes(searchQuery)
  );

  return (
    <main className="p-8 bg-[#FDFBF7] min-h-screen">
       <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
             <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">供應商資料管理</h1>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">維護進貨廠商基本資料與聯絡資訊</p>
             </div>
             
             <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                   <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                   <input 
                     type="text" 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="🔍 搜尋廠商名稱、統編或聯絡人..." 
                     className="w-full bg-white border border-slate-200 p-4 pl-11 rounded-2xl text-xs font-bold text-slate-800 shadow-sm focus:ring-4 focus:ring-indigo-500/10 transition outline-none"
                   />
                </div>
                
                <button 
                  onClick={handleOpenAddModal}
                  className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 shrink-0"
                >
                   <Plus className="w-4 h-4" /> 新增供應商
                </button>
             </div>
          </div>

          {/* List View */}
          <div className="bg-white rounded-[4rem] p-12 border border-slate-50 shadow-2xl shadow-slate-200/20">
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
                            <th className="pb-4 pl-2">廠商名稱</th>
                            <th className="pb-4">統一編號</th>
                            <th className="pb-4">聯絡人</th>
                            <th className="pb-4">聯絡電話</th>
                            <th className="pb-4">通訊地址</th>
                            <th className="pb-4 text-center pr-2">操作</th>
                         </tr>
                      </thead>
                      <tbody>
                         {filteredSuppliers.map((sup) => (
                            <tr key={sup.id} className="border-b border-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-50/50 transition">
                               <td className="py-5 pl-2">
                                  <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-black text-xs">
                                        {sup.name?.charAt(0)}
                                     </div>
                                     <span className="font-black text-slate-800">{sup.name}</span>
                                  </div>
                               </td>
                               <td className="py-5 text-slate-500 font-mono">{sup.tax_id || "—"}</td>
                               <td className="py-5 text-slate-600">{sup.contact_person || "—"}</td>
                               <td className="py-5 text-slate-600 font-mono">{sup.phone || "—"}</td>
                               <td className="py-5 text-slate-500 max-w-xs truncate" title={sup.address}>{sup.address || "—"}</td>
                               <td className="py-5 text-center pr-2">
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
             <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
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
                  className="bg-white rounded-[3rem] w-full max-w-2xl p-10 shadow-2xl relative z-10"
                >
                   <button 
                     onClick={() => setShowModal(false)}
                     className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition"
                   >
                      <X className="w-5 h-5" />
                   </button>
                   
                   <div className="mb-8">
                      <h3 className="text-xl font-black text-slate-800">
                         {modalType === "add" ? "新增供應商資料" : "編輯供應商資料"}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                         請填寫完整的廠商資料以便日後進貨與對帳
                      </p>
                   </div>

                   <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">廠商名稱 (必填)</label>
                            <div className="relative">
                               <Building className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                               <input 
                                 type="text" 
                                 name="name"
                                 value={formData.name}
                                 onChange={handleChange}
                                 placeholder="例: 初潤南投茶園總廠"
                                 className="w-full bg-slate-50 border-none p-4 pl-11 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/30 transition"
                                 required
                               />
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">統一編號</label>
                            <div className="relative">
                               <FileText className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                               <input 
                                 type="text" 
                                 name="tax_id"
                                 value={formData.tax_id}
                                 onChange={handleChange}
                                 placeholder="例: 12345678"
                                 className="w-full bg-slate-50 border-none p-4 pl-11 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/30 transition"
                               />
                            </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">聯絡人</label>
                            <div className="relative">
                               <User className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                               <input 
                                 type="text" 
                                 name="contact_person"
                                 value={formData.contact_person}
                                 onChange={handleChange}
                                 placeholder="例: 王經理"
                                 className="w-full bg-slate-50 border-none p-4 pl-11 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/30 transition"
                               />
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">聯絡電話</label>
                            <div className="relative">
                               <Phone className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                               <input 
                                 type="tel" 
                                 name="phone"
                                 value={formData.phone}
                                 onChange={handleChange}
                                 placeholder="例: 049-1234567"
                                 className="w-full bg-slate-50 border-none p-4 pl-11 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/30 transition"
                               />
                            </div>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">通訊地址</label>
                         <div className="relative">
                            <MapPin className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input 
                              type="text" 
                              name="address"
                              value={formData.address}
                              onChange={handleChange}
                              placeholder="例: 南投縣竹山鎮..."
                              className="w-full bg-slate-50 border-none p-4 pl-11 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/30 transition"
                            />
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">備註說明</label>
                         <textarea 
                           name="notes"
                           value={formData.notes}
                           onChange={handleChange}
                           placeholder="例: 主要供應茶葉原物料..."
                           rows={3}
                           className="w-full bg-slate-50 border-none p-4 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/30 transition resize-none"
                         />
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                         <button 
                           type="button" 
                           onClick={() => setShowModal(false)}
                           className="px-6 py-3 bg-slate-100 text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition"
                         >
                            取消
                         </button>
                         <button 
                           type="submit" 
                           disabled={isSubmitting}
                           className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-600/20"
                         >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            {modalType === "add" ? "確認新增" : "儲存修改"}
                         </button>
                      </div>
                   </form>
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
