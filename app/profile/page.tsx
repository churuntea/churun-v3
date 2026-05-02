"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";

export default function Profile() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  
  // 表單狀態
  const [formData, setFormData] = useState({
    bank_code: "",
    bank_account: "",
    email: "",
    id_card_number: "",
    address: "",
    line_id: "",
    beneficiary: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    setCurrentUserId(savedId);
  }, [router]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!currentUserId) return;
      const { data } = await supabase.from("members").select("*").eq("id", currentUserId).single();
      if (data) {
        setMemberInfo(data);
        setFormData({
          bank_code: data.bank_code || "",
          bank_account: data.bank_account || "",
          email: data.email || "",
          id_card_number: data.id_card_number || "",
          address: data.address || "",
          line_id: data.line_id || "",
          beneficiary: data.beneficiary || ""
        });
      }
    };
    fetchUser();
  }, [currentUserId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveInfo = async () => {
    if (!currentUserId) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("members")
        .update({ 
          bank_code: formData.bank_code, 
          bank_account: formData.bank_account,
          email: formData.email,
          id_card_number: formData.id_card_number,
          address: formData.address,
          line_id: formData.line_id,
          beneficiary: formData.beneficiary
        })
        .eq("id", currentUserId);

      if (error) throw error;
      alert("資料已成功儲存！");
    } catch (err: any) {
      alert("儲存失敗: " + err.message);
    }
    setIsSaving(false);
  };

  const handleLogout = () => {
    const confirmed = confirm("確定要登出嗎？");
    if (confirmed) {
      localStorage.removeItem("churun_member_id");
      router.replace("/");
    }
  };

  if (!memberInfo) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">載入中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans pb-24">
      {/* 頂部導覽列 */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 p-4 flex items-center gap-3 shadow-sm">
        <Link href="/">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 className="text-lg font-medium tracking-widest text-slate-700">會員中心設定</h1>
      </nav>

      <main className="p-5 max-w-md mx-auto space-y-6 mt-2">
        
        {/* 會員名片 */}
        <section className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <p className="text-white/60 text-xs mb-1">初潤製茶所 V2</p>
              <h2 className="text-2xl font-light">{memberInfo.name.split('(')[0]}</h2>
            </div>
            <div className="text-right">
              <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${memberInfo.is_b2b ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'}`}>
                {memberInfo.is_b2b ? '創業夥伴' : '一般消費者'}
              </span>
              <p className="text-white/80 text-sm mt-2">{memberInfo.tier}</p>
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            <div className="bg-black/20 p-3 rounded-xl backdrop-blur-sm flex justify-between items-center border border-white/10">
              <span className="text-xs text-white/60">專屬會員編碼</span>
              <span className="font-mono text-sm tracking-wider">{memberInfo.member_code || '處理中...'}</span>
            </div>
            <div className="bg-black/20 p-3 rounded-xl backdrop-blur-sm flex justify-between items-center border border-white/10">
              <span className="text-xs text-white/60">專屬推薦碼</span>
              <span className="font-mono text-sm font-bold text-amber-400 tracking-widest">{memberInfo.referral_code || '無'}</span>
            </div>
            <div className="bg-black/20 p-3 rounded-xl backdrop-blur-sm flex justify-between items-center border border-white/10">
              <span className="text-xs text-white/60">手機號碼</span>
              <span className="font-mono text-sm tracking-wider">{memberInfo.phone}</span>
            </div>
          </div>
        </section>

        {/* 實名認證與社群資料 */}
        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="font-medium text-slate-800 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
            實名認證與聯絡資料
          </h3>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            依照多層次傳銷管理法規定，參與獎金分配之加盟商須提供真實身分資料以供報稅及核實身分使用。
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600 ml-1">身分證字號 (必填，報稅用)</label>
              <input 
                type="text" name="id_card_number" value={formData.id_card_number} onChange={handleChange}
                placeholder="請輸入身分證字號"
                className="w-full mt-1 bg-slate-50 border border-slate-100 p-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500" 
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 ml-1">電子信箱</label>
              <input 
                type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="聯絡與寄送電子發票用"
                className="w-full mt-1 bg-slate-50 border border-slate-100 p-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500" 
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 ml-1">通訊地址</label>
              <input 
                type="text" name="address" value={formData.address} onChange={handleChange}
                placeholder="預設商品收件地址"
                className="w-full mt-1 bg-slate-50 border border-slate-100 p-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500" 
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 ml-1">LINE ID</label>
              <input 
                type="text" name="line_id" value={formData.line_id} onChange={handleChange}
                placeholder="客服與組織聯絡用"
                className="w-full mt-1 bg-slate-50 border border-slate-100 p-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500" 
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 ml-1">法定繼承人/受益人 (組織世襲用)</label>
              <input 
                type="text" name="beneficiary" value={formData.beneficiary} onChange={handleChange}
                placeholder="填寫姓名與關係，如：王小明(子)"
                className="w-full mt-1 bg-slate-50 border border-slate-100 p-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500" 
              />
            </div>
          </div>
        </section>

        {/* 銀行帳戶綁定 */}
        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="font-medium text-slate-800 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            銀行帳戶綁定 (撥款用)
          </h3>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            請確實填寫您的本人銀行帳戶，以利系統在進行「雙週結算退傭」或「無憂退出」時，能夠準確將款項匯入。
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600 ml-1">銀行代碼 (3碼)</label>
              <input 
                type="text" name="bank_code" maxLength={3} value={formData.bank_code}
                onChange={e => setFormData(p => ({ ...p, bank_code: e.target.value.replace(/\D/g, '') }))}
                placeholder="例如：808"
                className="w-full mt-1 bg-slate-50 border border-slate-100 p-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500" 
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 ml-1">銀行帳號</label>
              <input 
                type="text" name="bank_account" value={formData.bank_account}
                onChange={e => setFormData(p => ({ ...p, bank_account: e.target.value.replace(/\D/g, '') }))}
                placeholder="請輸入純數字帳號"
                className="w-full mt-1 bg-slate-50 border border-slate-100 p-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500" 
              />
            </div>
          </div>
        </section>

        {/* 儲存按鈕 */}
        <button 
          onClick={handleSaveInfo}
          disabled={isSaving}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-medium transition flex items-center justify-center shadow-lg shadow-slate-900/20 disabled:opacity-50"
        >
          {isSaving ? "儲存中..." : "儲存所有設定"}
        </button>

        {/* 獨立顯眼的登出按鈕 */}
        <div className="pt-6 pb-2 border-t border-gray-200 mt-8">
          <button 
            onClick={handleLogout}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-4 rounded-xl font-medium transition border border-red-100 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            安全登出帳號
          </button>
        </div>

      </main>
    </div>
  );
}
