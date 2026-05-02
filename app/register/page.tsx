"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../supabase";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    email: "",
    id_card_number: "",
    address: "",
    bank_code: "",
    bank_account: "",
    upline_id: "" // 推薦人 UID
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 從 URL 抓取帶過來的資料
    const phone = searchParams.get("phone") || "";
    const ref = searchParams.get("ref") || "";
    setFormData(prev => ({ ...prev, phone, upline_id: ref }));
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. 產生會員編碼與推薦碼
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const memberCode = `CR${year}M${month}${random}`;
      const referralCode = `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // 2. 寫入資料庫
      const { data, error } = await supabase
        .from('members')
        .insert({
          ...formData,
          member_code: memberCode,
          referral_code: referralCode,
          tier: '初潤寶寶',
          is_b2b: false,
          points_balance: 0,
          virtual_balance: 0,
          lifetime_spend: 0,
          referral_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      // 3. 如果有推薦人，更新推薦人的推薦人數
      if (formData.upline_id) {
        const { data: upline } = await supabase
          .from('members')
          .select('referral_count')
          .eq('id', formData.upline_id)
          .single();
        
        if (upline) {
          await supabase
            .from('members')
            .update({ referral_count: (upline.referral_count || 0) + 1 })
            .eq('id', formData.upline_id);
        }
      }

      alert("註冊成功！歡迎加入初潤。");
      localStorage.setItem("churun_member_id", data.id);
      router.push("/"); // 回首頁
    } catch (err: any) {
      alert("註冊失敗: " + err.message);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <main className="max-w-md mx-auto bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">加入初潤</h2>
        <p className="text-sm text-slate-500 mb-8">請填寫基本資料以完成註冊</p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">真實姓名</label>
            <input name="name" value={formData.name} onChange={handleChange} required className="w-full mt-1 bg-slate-50 border-none p-4 rounded-2xl text-sm" placeholder="王小明" />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">手機號碼</label>
            <input name="phone" value={formData.phone} onChange={handleChange} readOnly className="w-full mt-1 bg-slate-100 border-none p-4 rounded-2xl text-sm text-slate-500" />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">登入密碼</label>
            <input name="password" type="password" value={formData.password} onChange={handleChange} required className="w-full mt-1 bg-slate-50 border-none p-4 rounded-2xl text-sm" placeholder="設定您的密碼" />
          </div>

          <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-100 mt-4">
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">法規必要資訊</p>
            
            <input name="id_card_number" value={formData.id_card_number} onChange={handleChange} placeholder="身分證字號" className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm" />
            <input name="email" value={formData.email} onChange={handleChange} placeholder="電子郵件" className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm" />
            <input name="address" value={formData.address} onChange={handleChange} placeholder="戶籍地址" className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm" />
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-sm hover:bg-slate-800 transition shadow-xl mt-6">
            {isSubmitting ? "註冊中..." : "完成註冊"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>載入中...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
