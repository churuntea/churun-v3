"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../supabase";
import Link from "next/link";
import { User, Lock, Phone, Mail, Home, CreditCard, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

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
    upline_id: "" 
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uplineName, setUplineName] = useState<string | null>(null);

  useEffect(() => {
    const phone = searchParams.get("phone") || "";
    const ref = searchParams.get("ref") || "";
    setFormData(prev => ({ ...prev, phone, upline_id: ref }));
    
    if (ref) {
      fetchUpline(ref);
    }
  }, [searchParams]);

  const fetchUpline = async (ref: string) => {
    const { data } = await supabase
      .from("members")
      .select("name, id")
      .eq("referral_code", ref)
      .maybeSingle();
    
    if (data) {
      setUplineName(data.name);
      setFormData(prev => ({ ...prev, upline_id: data.id }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);

    try {
      // 1. 產生會員編碼與推薦碼
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      
      const { count } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .gte("created_at", new Date(now.getFullYear(), now.getMonth(), 1).toISOString());
        
      const seq = String((count || 0) + 1).padStart(4, '0');
      const memberCode = `CR${year}M${month}${seq}`;
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

      // 3. 更新推薦人
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

      alert("🎉 註冊成功！歡迎加入初潤。");
      localStorage.setItem("churun_member_id", data.id);
      router.push("/");
    } catch (err: any) {
      alert("註冊失敗: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 px-6 font-sans">
      <main className="max-w-md mx-auto bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-10 border border-slate-50 relative overflow-hidden">
        
        <div className="absolute top-0 left-0 -ml-16 -mt-16 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60"></div>

        <div className="relative z-10 text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">建立帳號</h2>
          <p className="text-slate-400 mt-2 font-medium">填寫資料，開始您的初潤之旅</p>
        </div>

        {uplineName && (
          <div className="relative z-10 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl mb-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-200 rounded-full flex items-center justify-center text-emerald-700">
               <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">推薦人</p>
              <p className="text-sm font-bold text-emerald-800">{uplineName}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6 relative z-10">
          <div className="space-y-4">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">基本帳戶資訊</p>
             
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-widest">真實姓名</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input name="name" value={formData.name} onChange={handleChange} required className="w-full bg-slate-50 border-none p-4 pl-11 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 transition" placeholder="王小明" />
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-widest">手機號碼</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input name="phone" value={formData.phone} onChange={handleChange} required className="w-full bg-slate-50 border-none p-4 pl-11 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 transition" placeholder="0912 345 678" />
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-widest">設定密碼</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input name="password" type="password" value={formData.password} onChange={handleChange} required className="w-full bg-slate-50 border-none p-4 pl-11 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 transition" placeholder="設定登入密碼" />
                </div>
             </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-50">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">進階資訊 (選填)</p>
             
             <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input name="email" value={formData.email} onChange={handleChange} placeholder="電子郵件" className="w-full bg-slate-50 border-none p-4 pl-11 rounded-2xl text-sm font-medium" />
             </div>

             <div className="relative">
                <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input name="address" value={formData.address} onChange={handleChange} placeholder="通訊地址" className="w-full bg-slate-50 border-none p-4 pl-11 rounded-2xl text-sm font-medium" />
             </div>

             <div className="grid grid-cols-2 gap-3">
                <input name="bank_code" value={formData.bank_code} onChange={handleChange} placeholder="銀行代碼" className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-medium" />
                <input name="bank_account" value={formData.bank_account} onChange={handleChange} placeholder="銀行帳號" className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-medium" />
             </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-sm hover:bg-slate-800 transition shadow-2xl shadow-slate-900/10 flex items-center justify-center gap-2 mt-8"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>完成註冊 <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="mt-8 text-center relative z-10">
          <p className="text-slate-400 text-sm">
            已經有帳號了？{" "}
            <Link href="/login" className="text-emerald-700 font-bold hover:underline">
              立即登入
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-900" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
