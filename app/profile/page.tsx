"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { 
  User, 
  Settings, 
  ChevronLeft, 
  CreditCard, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  LogOut, 
  Save,
  ShieldCheck,
  Award,
  IdCard,
  MessageSquare,
  Users,
  Loader2
} from "lucide-react";

function ProfileContent() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  
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
      alert("🎉 資料已成功更新！");
    } catch (err: any) {
      alert("儲存失敗: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    if (confirm("確定要安全登出嗎？")) {
      localStorage.removeItem("churun_member_id");
      sessionStorage.removeItem("has_seen_welcome");
      router.replace("/login");
    }
  };

  if (!memberInfo) return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-900" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-24">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-50 px-6 py-4 flex items-center gap-4 max-w-lg mx-auto">
        <button onClick={() => router.push("/")} className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-black tracking-[0.2em] text-slate-800 uppercase">帳戶設定</h1>
      </nav>

      <main className="p-6 max-w-lg mx-auto space-y-8 mt-2">
        
        {/* Account Summary Card */}
        <section className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
           
           <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                 <div>
                    <h2 className="text-2xl font-bold">{memberInfo.name}</h2>
                    <div className="flex items-center gap-2 mt-2">
                       <Award className="w-4 h-4 text-amber-400" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-amber-400/80">{memberInfo.tier}</span>
                    </div>
                 </div>
                 <div className="text-right">
                    <span className={`text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-[0.2em] ${memberInfo.is_b2b ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'}`}>
                      {memberInfo.is_b2b ? '創業夥伴' : '一般消費者'}
                    </span>
                 </div>
              </div>

              <div className="space-y-3">
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">會員編碼</span>
                    <span className="font-mono text-xs tracking-wider font-medium">{memberInfo.member_code}</span>
                 </div>
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">個人推薦碼</span>
                    <span className="font-mono text-xs font-black text-amber-400 tracking-[0.2em]">{memberInfo.referral_code}</span>
                 </div>
              </div>
           </div>
        </section>

        {/* Verification Section */}
        <section className="space-y-6">
           <div className="flex items-center gap-3 px-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-black tracking-tight">實名與法規資訊</h3>
           </div>
           
           <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-slate-50 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">身分證字號</label>
                <div className="relative">
                   <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                   <input 
                     type="text" name="id_card_number" value={formData.id_card_number} onChange={handleChange}
                     className="w-full bg-slate-50 border-none p-4 pl-11 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/10 transition" 
                   />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">電子信箱</label>
                <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                   <input 
                     type="email" name="email" value={formData.email} onChange={handleChange}
                     className="w-full bg-slate-50 border-none p-4 pl-11 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/10 transition" 
                   />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">通訊地址</label>
                <div className="relative">
                   <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                   <input 
                     type="text" name="address" value={formData.address} onChange={handleChange}
                     className="w-full bg-slate-50 border-none p-4 pl-11 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/10 transition" 
                   />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">LINE ID</label>
                    <div className="relative">
                       <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                       <input 
                         type="text" name="line_id" value={formData.line_id} onChange={handleChange}
                         className="w-full bg-slate-50 border-none p-4 pl-11 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/10 transition" 
                       />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">指定受益人</label>
                    <div className="relative">
                       <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                       <input 
                         type="text" name="beneficiary" value={formData.beneficiary} onChange={handleChange}
                         className="w-full bg-slate-50 border-none p-4 pl-11 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/10 transition" 
                       />
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* Financial Section */}
        <section className="space-y-6">
           <div className="flex items-center gap-3 px-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-black tracking-tight">財務撥款設定</h3>
           </div>
           
           <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-slate-50 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">銀行代碼 (3碼)</label>
                    <input 
                      type="text" name="bank_code" maxLength={3} value={formData.bank_code}
                      onChange={e => setFormData(p => ({ ...p, bank_code: e.target.value.replace(/\D/g, '') }))}
                      className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 transition" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">銀行帳號</label>
                    <input 
                      type="text" name="bank_account" value={formData.bank_account}
                      onChange={e => setFormData(p => ({ ...p, bank_account: e.target.value.replace(/\D/g, '') }))}
                      className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 transition" 
                    />
                 </div>
              </div>
           </div>
        </section>

        {/* Action Buttons */}
        <div className="space-y-4 pt-6">
           <button 
             onClick={handleSaveInfo}
             disabled={isSaving}
             className="w-full bg-emerald-900 text-white py-6 rounded-3xl font-bold text-sm hover:bg-emerald-800 transition shadow-2xl shadow-emerald-900/20 flex items-center justify-center gap-3 disabled:opacity-50"
           >
             {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> 儲存帳戶設定</>}
           </button>
           
           <button 
             onClick={handleLogout}
             className="w-full bg-rose-50 text-rose-600 py-6 rounded-3xl font-bold text-sm hover:bg-rose-100 transition border border-rose-100 flex items-center justify-center gap-3"
           >
             <LogOut className="w-5 h-5" /> 安全登出
           </button>
        </div>

      </main>
    </div>
  );
}

export default function Profile() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-900" /></div>}>
      <ProfileContent />
    </Suspense>
  );
}
