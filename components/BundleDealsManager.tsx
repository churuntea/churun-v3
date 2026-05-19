"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/supabase"; // 仍然用來抓取商品 (如果 RLS 允許)
import { 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  X, 
  Loader2,
  Package,
  Zap,
  Calendar,
  User,
  ShoppingBag
} from "lucide-react";

export default function BundleDealsManager() {
  const [deals, setDeals] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    target_price: "",
    start_time: "",
    end_time: "",
    is_active: true,
    tier_restriction: "",
    limit_one_per_user: true,
    items: [] as { id: string; quantity: number }[]
  });

  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchProducts();
    fetchDeals();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, image_url")
        .eq("status", "active");
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error("載入商品失敗:", err);
    }
  };

  const fetchDeals = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/bundle-deals?isAdmin=true");
      const data = await res.json();
      if (data.success) {
        setDeals(data.data || []);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error("載入套組失敗:", err);
      alert("載入套組失敗: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductQtyChange = (productId: string, qty: number) => {
    setSelectedProducts(prev => {
      const updated = { ...prev };
      if (qty <= 0) {
        delete updated[productId];
      } else {
        updated[productId] = qty;
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.target_price || !formData.start_time || !formData.end_time) {
      return alert("請填寫必填欄位！");
    }

    const items = Object.entries(selectedProducts).map(([id, quantity]) => ({ id, quantity }));
    if (items.length === 0) {
      return alert("請至少選擇一個商品！");
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: formData.name,
        target_price: Number(formData.target_price),
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        is_active: formData.is_active,
        tier_restriction: formData.tier_restriction || null,
        limit_one_per_user: formData.limit_one_per_user,
        items: items
      };

      if (editingId) {
        payload.id = editingId;
      }

      const res = await fetch("/api/bundle-deals", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      alert(editingId ? "🎉 更新套組成功！" : "🎉 新增套組成功！");

      setFormData({
        name: "",
        target_price: "",
        start_time: "",
        end_time: "",
        is_active: true,
        tier_restriction: "",
        limit_one_per_user: true,
        items: []
      });
      setSelectedProducts({});
      setEditingId(null);
      fetchDeals();
    } catch (err: any) {
      alert("操作失敗: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (deal: any) => {
    setEditingId(deal.id);
    setFormData({
      name: deal.name,
      target_price: deal.target_price.toString(),
      start_time: new Date(deal.start_time).toISOString().slice(0, 16),
      end_time: new Date(deal.end_time).toISOString().slice(0, 16),
      is_active: deal.is_active,
      tier_restriction: deal.tier_restriction || "",
      limit_one_per_user: deal.limit_one_per_user,
      items: deal.items
    });

    const selected: Record<string, number> = {};
    deal.items.forEach((item: any) => {
      selected[item.id] = item.quantity;
    });
    setSelectedProducts(selected);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除此套組優惠嗎？")) return;
    try {
      const res = await fetch("/api/bundle-deals", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      alert("🎉 刪除成功！");
      fetchDeals();
    } catch (err: any) {
      alert("刪除失敗: " + err.message);
    }
  };

  return (
    <div className="space-y-12">
      {/* 表單區塊 */}
      <div className="bg-white rounded-[3rem] p-10 border border-slate-50 shadow-2xl shadow-slate-200/20">
        <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
          <Zap className="w-6 h-6 text-emerald-500" />
          {editingId ? "編輯組合套組" : "新增組合套組"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">活動名稱 (必填)</label>
              <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="例: 新人專屬 A+B 特惠" className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">套組特價 (必填)</label>
              <input type="number" value={formData.target_price} onChange={e => setFormData({ ...formData, target_price: e.target.value })} placeholder="例: 799" className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">開始時間 (必填)</label>
              <input type="datetime-local" value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">結束時間 (必填)</label>
              <input type="datetime-local" value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">身份限制</label>
              <select value={formData.tier_restriction} onChange={e => setFormData({ ...formData, tier_restriction: e.target.value })} className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition">
                <option value="">所有人</option>
                <option value="初潤寶寶">初潤寶寶 (新會員)</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={formData.limit_one_per_user} onChange={e => setFormData({ ...formData, limit_one_per_user: e.target.checked })} className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">每人限購一次</label>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">活動啟用</label>
            </div>
          </div>

          {/* 商品選擇器 */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Package className="w-3.5 h-3.5" /> 選擇組合商品
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-60 overflow-y-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
              {products.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center border border-slate-100">
                      {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-slate-200" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{p.name}</p>
                      <p className="text-[10px] text-slate-400">${p.price}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" value={selectedProducts[p.id] || 0} onChange={e => handleProductQtyChange(p.id, Number(e.target.value))} className="w-16 bg-slate-50 border-none p-2 rounded-lg text-xs font-bold text-center" />
                    <span className="text-[10px] font-black text-slate-400">件</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-5 rounded-2xl font-black text-sm bg-slate-900 hover:bg-slate-800 text-white transition active:scale-[0.98] flex items-center justify-center gap-2">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingId ? "儲存修改" : "確認新增套組"}
          </button>
          
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setFormData({ name: "", target_price: "", start_time: "", end_time: "", is_active: true, tier_restriction: "", limit_one_per_user: true, items: [] }); setSelectedProducts({}); }} className="w-full py-3 rounded-2xl font-black text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 transition mt-2">
              取消編輯
            </button>
          )}
        </form>
      </div>

      {/* 列表區塊 */}
      <div className="bg-white rounded-[3rem] p-10 border border-slate-50 shadow-2xl shadow-slate-200/20">
        <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
          <ShoppingBag className="w-6 h-6 text-indigo-500" />
          現有組合套組
        </h3>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-slate-200" />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">正在載入...</p>
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm font-bold">目前無任何組合套組。</div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {deals.map(deal => (
              <div key={deal.id} className={`bg-slate-50 p-6 rounded-3xl border transition flex flex-col md:flex-row justify-between gap-4 ${deal.is_active ? 'border-slate-50 hover:border-emerald-100 hover:bg-white' : 'opacity-50 grayscale'}`}>
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-black text-slate-800">{deal.name}</h4>
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${deal.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>{deal.is_active ? '進行中/啟用' : '停用'}</span>
                    {deal.tier_restriction && <span className="text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600">{deal.tier_restriction}</span>}
                    {deal.limit_one_per_user && <span className="text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-rose-50 text-rose-600">限購一次</span>}
                  </div>
                  
                  <div className="flex items-center gap-6 text-[10px] font-bold text-slate-400">
                    <p className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(deal.start_time).toLocaleString()} ~ {new Date(deal.end_time).toLocaleString()}</p>
                    <p className="text-emerald-600 font-black text-xs">特價: ${deal.target_price}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {deal.items.map((item: any) => {
                      const product = products.find(p => p.id === item.id);
                      return (
                        <span key={item.id} className="text-[10px] font-bold bg-white px-3 py-1.5 rounded-lg border border-slate-100 flex items-center gap-1">
                          {product ? product.name : '未知商品'} <span className="text-slate-400">x{item.quantity}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleEdit(deal)} className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-500 hover:border-indigo-100 transition shadow-sm">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(deal.id)} className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-500 hover:border-rose-100 transition shadow-sm">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
