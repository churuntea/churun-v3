"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Camera,
  Image as ImageIcon,
  X,
  Upload
} from "lucide-react";

const BANK_MAP: Record<string, string> = {
  "004": "臺灣銀行",
  "005": "土地銀行",
  "006": "合作金庫銀行",
  "007": "第一商業銀行",
  "008": "華南商業銀行",
  "009": "彰化商業銀行",
  "011": "上海商業儲蓄銀行",
  "012": "台北富邦銀行",
  "013": "國泰世華商業銀行",
  "016": "高雄銀行",
  "017": "兆豐國際商業銀行",
  "021": "花旗(台灣)商業銀行",
  "050": "臺灣企銀",
  "052": "渣打國際商業銀行",
  "053": "台中商業銀行",
  "054": "京城商業銀行",
  "081": "匯豐(台灣)商業銀行",
  "102": "華泰商業銀行",
  "103": "臺灣新光商業銀行",
  "108": "陽信商業銀行",
  "118": "板信商業銀行",
  "147": "三信商業銀行",
  "700": "中華郵政",
  "803": "聯邦商業銀行",
  "805": "遠東國際商業銀行",
  "806": "元大商業銀行",
  "807": "永豐商業銀行",
  "808": "玉山商業銀行",
  "809": "凱基商業銀行",
  "812": "台新國際商業銀行",
  "815": "日盛國際商業銀行",
  "816": "安泰商業銀行",
  "822": "中國信託商業銀行"
};

export default function BankSettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [bankCode, setBankCode] = useState("013");
  const [bankAccount, setBankAccount] = useState("");
  const [bankRemark, setBankRemark] = useState("");
  const [bankCardPhotoUrl, setBankCardPhotoUrl] = useState("");
  const [bankCardPhotoBase64, setBankCardPhotoBase64] = useState("");

  useEffect(() => {
    fetch("/api/me/profile").then(res => res.json()).then(data => {
      if (data.member?.id) {
        fetchData(data.member.id);
      } else {
        router.replace("/login");
      }
    }).catch(() => router.replace("/login"));
  }, [router]);

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    const { data } = await supabase.from("members").select("*").eq("id", userId).single();
    if (data) {
      setMemberInfo(data);
      setBankCode(data.bank_code || "013");
      setBankAccount(data.bank_account || "");

      // 支援雙向相容取值，優先使用獨立欄位，次之使用 beneficiary 欄位
      let accountName = data.bank_account_name || "";
      let branchName = data.bank_branch || "";
      let photoUrl = "";
      let remark = "";

      if (data.beneficiary && data.beneficiary.includes("|")) {
        const parts = data.beneficiary.split("|");
        if (!accountName) accountName = parts[0] || "";
        if (!branchName) branchName = parts[1] || "";
        photoUrl = parts[2] || "";
        remark = parts[3] || "";
      } else if (data.beneficiary && !data.beneficiary.includes("|")) {
        if (!accountName) accountName = data.beneficiary;
      }

      setBankAccountName(accountName);
      setBankBranch(branchName);
      setBankCardPhotoUrl(photoUrl);
      setBankRemark(remark);
    }
    setIsLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert("⚠️ 檔案容量過大，請上傳小於 8MB 的圖片");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setBankCardPhotoBase64(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleOpenConfirm = () => {
    if (!bankAccountName.trim()) { alert("【 錯誤 】請輸入帳戶姓名 (戶名)"); return; }
    if (!bankAccount.trim()) { alert("【 錯誤 】請輸入銀行帳號"); return; }
    if (bankAccount.length < 10) { alert("【 錯誤 】銀行帳號長度不足，請輸入 10-14 碼純數字"); return; }
    setShowConfirm(true);
  };

  const handleFinalSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/member/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: memberInfo.id,
          bank_account_name: bankAccountName,
          bank_branch: bankBranch,
          bank_code: bankCode,
          bank_account: bankAccount,
          bank_remark: bankRemark,
          bank_card_photo_base64: bankCardPhotoBase64 || undefined,
          bank_card_photo_url: bankCardPhotoUrl || undefined
        })
      });
      const result = await res.json();
      if (result.success) {
        alert("✅ 匯款資訊已成功更新！");
        setShowConfirm(false);
        router.back();
      } else {
        alert("❌ 儲存失敗: " + (result.error || "原因不明"));
      }
    } catch (err: any) {
      alert("⚠️ 系統發生嚴重錯誤: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-900" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-24">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 max-w-lg mx-auto flex justify-between items-center bg-[#FDFBF7]/80 backdrop-blur-xl border-b border-slate-100">
        <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50">
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </button>
        <h1 className="text-xs font-black tracking-[0.3em] text-slate-800 uppercase">銀行帳戶設定</h1>
        <div className="w-10"></div>
      </nav>

      <main className="max-w-lg mx-auto px-6 pt-32 space-y-6">
        {/* Security Warning */}
        <div className="bg-emerald-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-900/20">
           <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
           <div className="flex gap-4 items-start relative z-10">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                 <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="space-y-1">
                 <h2 className="font-black text-sm uppercase tracking-widest">提款帳戶安全保護</h2>
                 <p className="text-[10px] text-white/60 leading-relaxed">
                    請務必確認填寫的匯款帳號與「戶名」相符。此帳戶將用於您的帳戶提領，設定後如需修改需再次進行身份驗證。
                 </p>
              </div>
           </div>
        </div>

        {/* Bank Form */}
        <div className="bg-white rounded-[3rem] p-8 border border-slate-50 shadow-sm space-y-6">
           <div className="space-y-2">
              <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-2">銀行代碼與名稱 (依規定限國泰世華銀行)</label>
              <div className="flex gap-4">
                 <input 
                    type="text" value="013" readOnly
                    className="w-24 bg-slate-100 border-none rounded-2xl p-5 text-sm font-black text-slate-400 text-center cursor-not-allowed"
                 />
                 <div className="flex-1 bg-emerald-50 rounded-2xl p-5 text-xs font-black text-emerald-900 flex items-center">國泰世華商業銀行</div>
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-2">分行名稱</label>
              <input 
                 type="text" value={bankBranch} onChange={e => setBankBranch(e.target.value)}
                 className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-black text-slate-800 focus:ring-2 focus:ring-emerald-500/20"
                 placeholder="例: 新莊新泰分行"
              />
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-2">帳戶姓名 (戶名)</label>
                 <input 
                    type="text" value={bankAccountName} onChange={e => setBankAccountName(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-black text-slate-800 focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="請輸入姓名"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-2">銀行帳號 (10-14 碼)</label>
                 <input 
                    type="tel" value={bankAccount} onChange={e => setBankAccount(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-mono font-black text-slate-800 focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="請輸入帳號"
                 />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-2">備註</label>
              <input 
                 type="text" value={bankRemark} onChange={e => setBankRemark(e.target.value)}
                 className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-black text-slate-800 focus:ring-2 focus:ring-emerald-500/20"
                 placeholder="例: 薪轉戶 / 常用收款帳戶"
              />
           </div>

           {/* Photo Upload Section */}
           <div className="space-y-2 pt-2">
              <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-2 flex justify-between">
                <span>拍照上傳存摺 / 銀行卡 (避免輸入錯誤)</span>
                {bankCardPhotoUrl || bankCardPhotoBase64 ? <span className="text-emerald-500">已選取照片</span> : null}
              </label>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
              />

              <div 
                onClick={triggerFileSelect}
                className="border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50 rounded-[2rem] p-6 text-center cursor-pointer transition-all duration-300 group flex flex-col items-center justify-center gap-3 min-h-[140px] relative overflow-hidden"
              >
                {bankCardPhotoBase64 || bankCardPhotoUrl ? (
                  <>
                    <img 
                      src={bankCardPhotoBase64 || bankCardPhotoUrl} 
                      alt="存摺/銀行卡預覽" 
                      className="absolute inset-0 w-full h-full object-cover z-0 opacity-80"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 z-10 flex items-center justify-center gap-2 text-white">
                      <Camera className="w-5 h-5 text-white animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest">點選重新拍照 / 上傳</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition duration-300 border border-slate-100">
                      <Camera className="w-5 h-5 text-slate-400 group-hover:text-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center justify-center gap-1">
                        <Upload className="w-3 h-3" /> 點擊此處拍照上傳
                      </p>
                      <p className="text-[8px] text-slate-400 font-bold">支援相機拍照或相簿檔案，請確保帳號清晰可見</p>
                    </div>
                  </>
                )}
              </div>
           </div>

           <button 
              onClick={handleOpenConfirm}
              className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition"
           >
              確認更新資訊
           </button>
        </div>

        {/* Info Box */}
        <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-100/50 flex gap-6 items-start">
           <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-amber-600" />
           </div>
           <div className="space-y-2">
              <h4 className="text-sm font-black text-amber-900 tracking-tight">重要說明</h4>
              <p className="text-xs text-amber-700/70 leading-relaxed font-medium">匯款帳戶僅限本人使用。如因提供錯誤帳號導致款項匯錯，本公司恕不負責。變更後次日生效。</p>
           </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-3xl flex items-center justify-center p-6"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[3rem] p-10 w-full max-w-sm shadow-2xl space-y-8"
            >
              <div className="text-center space-y-4">
                 <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                    <CreditCard className="w-10 h-10 text-emerald-600" />
                  </div>
                 <h3 className="text-2xl font-black text-slate-900">確認匯款資訊？</h3>
                 <p className="text-xs text-slate-400 font-bold leading-relaxed">一旦確認，系統將會將此帳戶設為預設撥款通道。</p>
              </div>

              <div className="bg-slate-50 rounded-[2rem] p-6 space-y-3.5">
                 <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">銀行名稱</span>
                    <span className="text-sm font-black text-emerald-900">{bankCode} {BANK_MAP[bankCode] || `代碼 (${bankCode})`}</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">分行名稱</span>
                    <span className="text-sm font-black text-slate-800">{bankBranch || "未填寫"}</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">戶名</span>
                    <span className="text-sm font-black text-slate-800">{bankAccountName}</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">銀行帳號</span>
                    <span className="text-sm font-mono font-black text-slate-900">{bankAccount}</span>
                 </div>
                 <div className="flex justify-between items-center pb-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">備註</span>
                    <span className="text-sm font-black text-slate-600">{bankRemark || "無"}</span>
                 </div>
                 {bankCardPhotoBase64 || bankCardPhotoUrl ? (
                   <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">隨附銀行照片</span>
                     <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
                       <CheckCircle2 className="w-3 h-3" /> 有
                     </span>
                   </div>
                 ) : null}
              </div>

              <div className="flex gap-3">
                 <button onClick={() => setShowConfirm(false)} className="flex-1 py-5 rounded-2xl bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">返回修改</button>
                 <button 
                   onClick={handleFinalSave}
                   disabled={isSaving}
                   className="flex-[2] py-5 rounded-2xl bg-emerald-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20"
                 >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "確定儲存"}
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
