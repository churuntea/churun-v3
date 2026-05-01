"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminProducts() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: "",
    original_price: "",
    price: "",
    image_url: "", // 儲存 Base64
    creator: "陳總經理",
    b2c_reward_percent: "10",
    b2b_commission_percent: "15"
  });
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setProducts(data.products);
      }
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert("僅支援 JPG, PNG 或 PDF 檔案");
      return;
    }
    
    // 檢查大小 (Base64 會變大，限制在 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("檔案太大 (請小於 2MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData(prev => ({ ...prev, image_url: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSubmitAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      alert("品名與嘗鮮價為必填");
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirm(false);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          original_price: formData.original_price ? Number(formData.original_price) : null,
          price: Number(formData.price),
          b2c_reward_percent: Number(formData.b2c_reward_percent),
          b2b_commission_percent: Number(formData.b2b_commission_percent)
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("新增成功！");
        setFormData({ 
          name: "", 
          original_price: "", 
          price: "", 
          image_url: "", 
          creator: "陳總經理",
          b2c_reward_percent: "10", 
          b2b_commission_percent: "15" 
        });
        fetchProducts();
      } else {
        alert("新增失敗: " + data.error);
      }
    } catch (err: any) {
      alert("系統錯誤: " + err.message);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 relative">
      {/* 頂部導覽 */}
      <nav className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-lg font-medium tracking-wide">商品與參數管理</h1>
        </div>
      </nav>

      <main className="p-5 max-w-2xl mx-auto space-y-6 mt-4">
        
        {/* 新增商品表單 */}
        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            新增上架商品
          </h2>
          
          <form onSubmit={handleSubmitAttempt} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              
              {/* 建檔者下拉選單 */}
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-500 ml-1">建檔者身分 (不得手動更改)</label>
                <select 
                  name="creator" 
                  value={formData.creator} 
                  onChange={handleChange}
                  className="w-full mt-1 bg-slate-100 border border-slate-200 p-3 rounded-xl text-sm focus:outline-none font-medium"
                >
                  {creators.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-500 ml-1">商品名稱</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="例：初潤頂級紅茶" className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500" required />
              </div>

              {/* 拖拉式上傳區域 */}
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-500 ml-1">商品照片 (拖拉上傳 JPG/PDF)</label>
                <div 
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-indigo-300 transition group"
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".jpg,.jpeg,.png,.pdf" />
                  
                  {formData.image_url ? (
                    <div className="text-center">
                      {formData.image_url.startsWith('data:application/pdf') ? (
                        <div className="flex flex-col items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                          <p className="text-xs text-slate-500 mt-2">PDF 檔案已就緒</p>
                        </div>
                      ) : (
                        <img src={formData.image_url} alt="Preview" className="h-24 w-24 object-cover rounded-xl shadow-md" />
                      )}
                      <button type="button" onClick={(e) => {e.stopPropagation(); setFormData(prev => ({...prev, image_url: ""}))}} className="text-[10px] text-rose-500 mt-2 underline">移除並重新選擇</button>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      </div>
                      <p className="text-sm font-medium text-slate-600">點擊或拖曳檔案至此</p>
                      <p className="text-[10px] text-slate-400 mt-1">僅限 JPG, PNG, PDF (最大 2MB)</p>
                    </>
                  )}
                </div>
              </div>
              
              <div className="col-span-1">
                <label className="text-xs font-semibold text-slate-500 ml-1">商品售價 (原價)</label>
                <input type="number" name="original_price" value={formData.original_price} onChange={handleChange} placeholder="1200" className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500" />
              </div>

              <div className="col-span-1">
                <label className="text-xs font-semibold text-slate-500 ml-1">嘗鮮價 (結帳價)</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="800" className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500" required />
              </div>
              
              <div className="bg-emerald-50 p-4 rounded-xl col-span-2 sm:col-span-1 border border-emerald-100">
                <label className="text-xs font-bold text-emerald-800 flex items-center gap-1 mb-1">B2C 積分回饋 (%)</label>
                <div className="relative">
                  <input type="number" name="b2c_reward_percent" value={formData.b2c_reward_percent} onChange={handleChange} className="w-full bg-white border border-emerald-200 p-3 rounded-lg text-sm pr-8 focus:outline-none focus:border-emerald-500" />
                  <span className="absolute right-3 top-3 text-slate-400 text-sm">%</span>
                </div>
              </div>

              <div className="bg-indigo-50 p-4 rounded-xl col-span-2 sm:col-span-1 border border-indigo-100">
                <label className="text-xs font-bold text-indigo-800 flex items-center gap-1 mb-1">B2B 夥伴退傭 (%)</label>
                <div className="relative">
                  <input type="number" name="b2b_commission_percent" value={formData.b2b_commission_percent} onChange={handleChange} className="w-full bg-white border border-indigo-200 p-3 rounded-lg text-sm pr-8 focus:outline-none focus:border-indigo-500" />
                  <span className="absolute right-3 top-3 text-slate-400 text-sm">%</span>
                </div>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white py-4 rounded-xl font-medium text-sm hover:bg-slate-800 transition shadow-lg disabled:opacity-50">
              確認送出
            </button>
          </form>
        </section>

        {/* 已上架商品列表 */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center justify-between">
            已上架商品清單
            <span className="text-xs font-normal text-slate-500 bg-slate-200 px-2 py-1 rounded-full">{products.length} 項</span>
          </h2>

          {isLoading ? (
            <p className="text-center text-slate-400 text-sm py-10">讀取中...</p>
          ) : products.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl border border-dashed border-gray-300 text-center text-slate-400 text-sm">
              目前尚未新增任何商品
            </div>
          ) : (
            <div className="space-y-3">
              {products.map(product => (
                <div key={product.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {product.image_url && !product.image_url.includes('pdf') ? (
                      <img src={product.image_url} alt="" className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                         {product.image_url?.includes('pdf') ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                         ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                         )}
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-slate-800">{product.name}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-slate-900 font-bold text-sm">${product.price.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400 line-through">${product.original_price?.toLocaleString()}</p>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">建檔者：{product.creator || '系統'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] px-2.5 py-1 rounded-lg font-medium whitespace-nowrap">
                      送 {product.b2c_reward_percent}% 積分
                    </span>
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] px-2.5 py-1 rounded-lg font-medium whitespace-nowrap">
                      抽 {product.b2b_commission_percent}% 退傭
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* 確認對話框 (Modal) */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">確認上架資料</h3>
              <p className="text-sm text-slate-500 mb-6">請確認以下資訊是否正確：</p>
              
              <div className="space-y-2 text-left bg-slate-50 p-4 rounded-2xl text-sm border border-slate-100 mb-6">
                <p><span className="text-slate-400">建檔者：</span> {formData.creator}</p>
                <p><span className="text-slate-400">品名：</span> {formData.name}</p>
                <p><span className="text-slate-400">嘗鮮價：</span> ${formData.price}</p>
                <p><span className="text-slate-400">回饋與退傭：</span> {formData.b2c_reward_percent}% / {formData.b2b_commission_percent}%</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowConfirm(false)} className="py-3 bg-slate-100 text-slate-600 rounded-xl font-medium text-sm hover:bg-slate-200 transition">
                  返回修改
                </button>
                <button onClick={handleConfirmSubmit} className="py-3 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20">
                  確認上傳
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
