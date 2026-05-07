"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Phone, 
  User, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck, 
  Lock,
  Mail,
  MapPin,
  Camera,
  Wallet,
  Coins,
  AlertTriangle,
  Award,
  CreditCard,
  UserCheck
} from "lucide-react";
import Link from "next/link";

function ApplyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawType = searchParams.get("type"); // 'partner' or 'ambassador'
  const isAmbassador = rawType === "ambassador";
  
  const roleTitle = isAmbassador ? "品牌大使" : "合夥人";
  const roleEnglish = isAmbassador ? "Brand Ambassador" : "Partner";
  const targetTier = isAmbassador ? "初潤知己" : "初潤好朋友";
  const minDeposit = isAmbassador ? 198000 : 6000;
  const gradientColor = isAmbassador ? "from-amber-500 to-orange-600" : "from-emerald-600 to-teal-600";
  const textColor = isAmbassador ? "text-amber-500" : "text-emerald-600";

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Inputs
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    amount: minDeposit.toString(),
    lastFive: "",
    // Brand Ambassador specific directly-bound fields
    idCardNumber: "",
    correspondenceAddress: "", // Goes to direct address column
    householdAddress: "",      // Goes to JSON metadata
    bankCode: "",             // Goes to bank_code
    bankAccount: "",          // Goes to bank_account
    bankBranch: "",           // Goes to JSON metadata
  });

  // Photo captures
  const [remittancePhoto, setRemittancePhoto] = useState<string | null>(null);
  const [idCardPhoto, setIdCardPhoto] = useState<string | null>(null);
  const [passbookPhoto, setPassbookPhoto] = useState<string | null>(null);

  const [loadingPhotos, setLoadingPhotos] = useState<Record<string, boolean>>({});

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>, targetKey: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingPhotos(prev => ({ ...prev, [targetKey]: true }));
    const reader = new FileReader();
    reader.onloadend = () => {
      if (targetKey === "remittance") setRemittancePhoto(reader.result as string);
      if (targetKey === "idCard") setIdCardPhoto(reader.result as string);
      if (targetKey === "passbook") setPassbookPhoto(reader.result as string);
      
      setLoadingPhotos(prev => ({ ...prev, [targetKey]: false }));
    };
    reader.readAsDataURL(file);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const amountVal = parseFloat(formData.amount);
    if (isNaN(amountVal) || amountVal < minDeposit) {
      setErrorMsg(`⚠️ 申請金額不得低於最低門檻 $${minDeposit.toLocaleString()} 元`);
      setIsLoading(false);
      return;
    }

    if (!formData.lastFive || formData.lastFive.length !== 5) {
      setErrorMsg("⚠️ 請填寫正確的匯款帳號後五碼（需為 5 位數字）");
      setIsLoading(false);
      return;
    }

    if (!remittancePhoto) {
      setErrorMsg("⚠️ 請拍攝並上傳匯款水單或存摺證明，以利會計審查金額！");
      setIsLoading(false);
      return;
    }

    // Validation for Brand Ambassador extra compliant fields
    if (isAmbassador) {
      if (!formData.idCardNumber || formData.idCardNumber.length < 8) {
        setErrorMsg("⚠️ 品牌大使必須填寫身分證字號");
        setIsLoading(false);
        return;
      }
      if (!formData.householdAddress) {
        setErrorMsg("⚠️ 品牌大使必須填寫戶籍地址");
        setIsLoading(false);
        return;
      }
      if (!idCardPhoto) {
        setErrorMsg("⚠️ 品牌大使必須上傳身分證照片");
        setIsLoading(false);
        return;
      }
      if (!formData.bankCode || !formData.bankAccount || !formData.bankBranch) {
        setErrorMsg("⚠️ 品牌大使必須完整填寫銀行收退款帳戶資訊");
        setIsLoading(false);
        return;
      }
      if (!passbookPhoto) {
        setErrorMsg("⚠️ 品牌大使必須上傳存摺或金融卡照片");
        setIsLoading(false);
        return;
      }
    }

    try {
      // 1. Check if phone is already registered
      const { data: existingUser } = await supabase
        .from("members")
        .select("id")
        .eq("phone", formData.phone.trim())
        .maybeSingle();

      if (existingUser) {
        setErrorMsg("⚠️ 此手機號碼已被註冊過！如果您要申請成為 B2B 夥伴，請使用其他新手機號碼，或聯絡總公司客服。");
        setIsLoading(false);
        return;
      }

      // Generate random temporary codes
      const memberCode = `CR26B${Math.floor(100000 + Math.random() * 900000)}`;
      const myReferralCode = memberCode;

      // 2. Serialize all B2B onboarding metadata into a JSON string inside the standard 'beneficiary' field
      const jsonPayload = {
        isB2BApply: true,
        type: rawType,
        lastFive: formData.lastFive,
        remittancePhoto: remittancePhoto,
        // Ambassador specific
        idCardNumber: formData.idCardNumber,
        householdAddress: formData.householdAddress,
        idCardPhoto: idCardPhoto,
        bankCode: formData.bankCode,
        bankAccount: formData.bankAccount,
        bankBranch: formData.bankBranch,
        passbookPhoto: passbookPhoto
      };

      const serializedData = `B2B_JSON_V1|${JSON.stringify(jsonPayload)}`;

      const insertData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.correspondenceAddress.trim(), // 通訊地址
        password: formData.password,
        referral_code: myReferralCode,
        member_code: memberCode,
        tier: targetTier,
        is_b2b: true,
        lifetime_spend: 0,
        quarterly_spend: 0,
        points_balance: 0,
        virtual_balance: 0,
        initial_deposit: amountVal,
        status: "pending_accounting", // Flow state
        id_card_number: formData.idCardNumber,
        bank_code: formData.bankCode,
        bank_account: formData.bankAccount,
        beneficiary: serializedData // JSON backup payload
      };

      const { error: insertError } = await supabase
        .from("members")
        .insert(insertData);

      if (insertError) {
        setErrorMsg(`申請提交失敗: ${insertError.message}`);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setErrorMsg(`異常錯誤: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 md:p-6 relative overflow-hidden pb-16">
      
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-full h-full bg-emerald-50 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-full h-full bg-amber-50 rounded-full blur-[120px] opacity-30"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="bg-white/80 backdrop-blur-3xl rounded-[3rem] p-6 md:p-12 shadow-[0_32px_64px_-16px_rgba(6,78,59,0.06)] border border-white">
          
          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div key="form" exit={{ opacity: 0, y: -20 }}>
                {/* Header Banner */}
                <div className="text-center mb-10">
                  <div className={`w-16 h-16 bg-gradient-to-tr ${gradientColor} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-900/10`}>
                    <Award className="text-white w-8 h-8" />
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">申請成為初潤 {roleTitle}</h1>
                  <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase mt-1">B2B Business {roleEnglish} Onboarding</p>
                  
                  {/* Min Limit Badge */}
                  <div className="mt-4 bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">考核職級 / 最低預收額</span>
                    <span className={`text-sm font-black ${textColor}`}>
                      {targetTier} / ${minDeposit.toLocaleString()} 元
                    </span>
                  </div>
                </div>

                {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-[10px] font-black text-rose-500 uppercase tracking-widest mb-8 flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}

                <form onSubmit={handleApply} className="space-y-8">
                  
                  {/* SECTION 1: BASIC INFORMATION */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-300 uppercase pl-2">一、 基本創業資料</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">您的姓名</label>
                        <div className="relative">
                          <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                          <input 
                            type="text" 
                            required
                            placeholder="請輸入真實姓名"
                            value={formData.name}
                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full bg-slate-50/50 border border-transparent p-4.5 pl-12 rounded-2xl text-xs font-bold focus:outline-none focus:bg-white focus:border-slate-100 transition shadow-inner placeholder-slate-300"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">聯絡手機</label>
                        <div className="relative">
                          <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                          <input 
                            type="tel" 
                            required
                            placeholder="請輸入手機號碼"
                            value={formData.phone}
                            onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full bg-slate-50/50 border border-transparent p-4.5 pl-12 rounded-2xl text-xs font-bold focus:outline-none focus:bg-white focus:border-slate-100 transition shadow-inner placeholder-slate-300"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">設定登入密碼</label>
                        <div className="relative">
                          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                          <input 
                            type="password" 
                            required
                            placeholder="請設定登入密碼"
                            value={formData.password}
                            onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full bg-slate-50/50 border border-transparent p-4.5 pl-12 rounded-2xl text-xs font-bold focus:outline-none focus:bg-white focus:border-slate-100 transition shadow-inner placeholder-slate-300"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">電子信箱（選填）</label>
                        <div className="relative">
                          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                          <input 
                            type="email" 
                            placeholder="請輸入電子信箱"
                            value={formData.email}
                            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full bg-slate-50/50 border border-transparent p-4.5 pl-12 rounded-2xl text-xs font-bold focus:outline-none focus:bg-white focus:border-slate-100 transition shadow-inner placeholder-slate-300"
                          />
                        </div>
                      </div>
                    </div>

                    {isAmbassador && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">身分證字號</label>
                        <div className="relative">
                          <UserCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                          <input 
                            type="text" 
                            required={isAmbassador}
                            placeholder="請輸入身分證字號（身分核實與稅務用）"
                            value={formData.idCardNumber}
                            onChange={e => setFormData(prev => ({ ...prev, idCardNumber: e.target.value.toUpperCase() }))}
                            className="w-full bg-slate-50/50 border border-transparent p-4.5 pl-12 rounded-2xl text-xs font-bold focus:outline-none focus:bg-white focus:border-slate-100 transition shadow-inner placeholder-slate-300"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SECTION 2: COMPLIANT IDENTITY ADDRESSES */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-300 uppercase pl-2">二、 戶籍與收件通訊地址</h3>
                    
                    {isAmbassador && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">戶籍地址</label>
                        <div className="relative">
                          <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                          <input 
                            type="text" 
                            required={isAmbassador}
                            placeholder="請輸入身分證登載之戶籍地址"
                            value={formData.householdAddress}
                            onChange={e => setFormData(prev => ({ ...prev, householdAddress: e.target.value }))}
                            className="w-full bg-slate-50/50 border border-transparent p-4.5 pl-12 rounded-2xl text-xs font-bold focus:outline-none focus:bg-white focus:border-slate-100 transition shadow-inner placeholder-slate-300"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">收件通訊地址</label>
                      <div className="relative">
                        <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                        <input 
                          type="text" 
                          required
                          placeholder="請輸入商品收件 / 預設通訊地址"
                          value={formData.correspondenceAddress}
                          onChange={e => setFormData(prev => ({ ...prev, correspondenceAddress: e.target.value }))}
                          className="w-full bg-slate-50/50 border border-transparent p-4.5 pl-12 rounded-2xl text-xs font-bold focus:outline-none focus:bg-white focus:border-slate-100 transition shadow-inner placeholder-slate-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: ID CARD CAMERA ATTACHMENT */}
                  {isAmbassador && (
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-300 uppercase pl-2">三、 身分證拍照上傳</h3>
                      
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl p-6 bg-slate-50/30 hover:bg-slate-50/80 transition relative overflow-hidden min-h-[160px]">
                        {idCardPhoto ? (
                          <div className="relative w-full h-40 group">
                            <img 
                              src={idCardPhoto} 
                              alt="ID Card" 
                              className="w-full h-full object-contain rounded-2xl"
                            />
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-2xl">
                              <label className="cursor-pointer bg-white text-slate-800 text-[10px] font-black uppercase tracking-widest py-3 px-5 rounded-xl flex items-center gap-2 active:scale-95 shadow-lg">
                                <Camera className="w-3.5 h-3.5" /> 重新拍照 / 上傳身分證
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  capture="environment" 
                                  onChange={e => handlePhotoCapture(e, "idCard")} 
                                  className="hidden" 
                                />
                              </label>
                            </div>
                          </div>
                        ) : (
                          <label className="w-full h-full flex flex-col items-center justify-center gap-3 cursor-pointer py-6">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50 text-slate-400">
                              {loadingPhotos.idCard ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <Camera className="w-5 h-5" />
                              )}
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-black text-slate-700 tracking-wider">點擊此處拍照或選擇相片</p>
                              <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-wider">拍照並上傳身分證正面（身分核實用）</p>
                            </div>
                            <input 
                              type="file" 
                              accept="image/*" 
                              capture="environment" 
                              required={isAmbassador}
                              onChange={e => handlePhotoCapture(e, "idCard")} 
                              className="hidden" 
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SECTION 4: BANK ACCOUNT VERIFICATION */}
                  {isAmbassador && (
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-300 uppercase pl-2">四、 收退款銀行帳戶資料</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">銀行代碼</label>
                          <input 
                            type="text" 
                            required={isAmbassador}
                            placeholder="例如: 822"
                            value={formData.bankCode}
                            onChange={e => setFormData(prev => ({ ...prev, bankCode: e.target.value.replace(/\D/g, "") }))}
                            className="w-full bg-slate-50/50 border border-transparent p-4.5 rounded-2xl text-xs font-bold focus:outline-none focus:bg-white focus:border-slate-100 transition shadow-inner placeholder-slate-300"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">分行名稱</label>
                          <input 
                            type="text" 
                            required={isAmbassador}
                            placeholder="例如: 信義分行"
                            value={formData.bankBranch}
                            onChange={e => setFormData(prev => ({ ...prev, bankBranch: e.target.value }))}
                            className="w-full bg-slate-50/50 border border-transparent p-4.5 rounded-2xl text-xs font-bold focus:outline-none focus:bg-white focus:border-slate-100 transition shadow-inner placeholder-slate-300"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">銀行帳號</label>
                        <div className="relative">
                          <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                          <input 
                            type="text" 
                            required={isAmbassador}
                            placeholder="請輸入收退款銀行帳號"
                            value={formData.bankAccount}
                            onChange={e => setFormData(prev => ({ ...prev, bankAccount: e.target.value.replace(/\D/g, "") }))}
                            className="w-full bg-slate-50/50 border border-transparent p-4.5 pl-12 rounded-2xl text-xs font-bold focus:outline-none focus:bg-white focus:border-slate-100 transition shadow-inner placeholder-slate-300"
                          />
                        </div>
                      </div>

                      {/* Bank Photo Upload Widget */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">存摺或金融卡拍照上傳</label>
                        
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl p-6 bg-slate-50/30 hover:bg-slate-50/80 transition relative overflow-hidden min-h-[160px]">
                          {passbookPhoto ? (
                            <div className="relative w-full h-40 group">
                              <img 
                                src={passbookPhoto} 
                                alt="Passbook" 
                                className="w-full h-full object-contain rounded-2xl"
                              />
                              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-2xl">
                                <label className="cursor-pointer bg-white text-slate-800 text-[10px] font-black uppercase tracking-widest py-3 px-5 rounded-xl flex items-center gap-2 active:scale-95 shadow-lg">
                                  <Camera className="w-3.5 h-3.5" /> 重新拍照 / 上傳存摺
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    capture="environment" 
                                    onChange={e => handlePhotoCapture(e, "passbook")} 
                                    className="hidden" 
                                  />
                                </label>
                              </div>
                            </div>
                          ) : (
                            <label className="w-full h-full flex flex-col items-center justify-center gap-3 cursor-pointer py-6">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50 text-slate-400">
                                {loadingPhotos.passbook ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <Camera className="w-5 h-5" />
                                )}
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] font-black text-slate-700 tracking-wider">點擊此處拍照或選擇相片</p>
                                <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-wider">拍照並上傳存摺或提款卡正面（匯款核對用）</p>
                              </div>
                              <input 
                                type="file" 
                                accept="image/*" 
                                capture="environment" 
                                required={isAmbassador}
                                onChange={e => handlePhotoCapture(e, "passbook")} 
                                className="hidden" 
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECTION 5: DEPOSIT & REMITTANCE PROOF */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-300 uppercase pl-2">
                      {isAmbassador ? "五、 儲值金額與匯款憑證" : "三、 儲值金額與匯款憑證"}
                    </h3>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">本次儲值/預收貨款金額 (元)</label>
                      <div className="relative">
                        <Wallet className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                        <input 
                          type="number" 
                          required
                          min={minDeposit}
                          placeholder={`最低門檻 $${minDeposit}`}
                          value={formData.amount}
                          onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                          className="w-full bg-slate-50/50 border border-transparent p-4.5 pl-12 rounded-2xl text-xs font-bold focus:outline-none focus:bg-white focus:border-slate-100 transition shadow-inner placeholder-slate-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">匯款銀行帳號【後五碼】</label>
                      <div className="relative">
                        <Coins className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                        <input 
                          type="text" 
                          required
                          maxLength={5}
                          placeholder="例如: 12345"
                          value={formData.lastFive}
                          onChange={e => setFormData(prev => ({ ...prev, lastFive: e.target.value.replace(/\D/g, "") }))}
                          className="w-full bg-slate-50/50 border border-transparent p-4.5 pl-12 rounded-2xl text-xs font-bold focus:outline-none focus:bg-white focus:border-slate-100 transition shadow-inner placeholder-slate-300"
                        />
                      </div>
                    </div>

                    {/* Remittance Photo Upload Widget */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">拍照並上傳匯款憑證/水單</label>
                      
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl p-6 bg-slate-50/30 hover:bg-slate-50/80 transition relative overflow-hidden min-h-[160px]">
                        {remittancePhoto ? (
                          <div className="relative w-full h-40 group">
                            <img 
                              src={remittancePhoto} 
                              alt="Receipt" 
                              className="w-full h-full object-cover rounded-2xl"
                            />
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-2xl">
                              <label className="cursor-pointer bg-white text-slate-800 text-[10px] font-black uppercase tracking-widest py-3 px-5 rounded-xl flex items-center gap-2 active:scale-95 shadow-lg">
                                <Camera className="w-3.5 h-3.5" /> 重新拍照 / 上傳
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  capture="environment" 
                                  onChange={e => handlePhotoCapture(e, "remittance")} 
                                  className="hidden" 
                                />
                              </label>
                            </div>
                          </div>
                        ) : (
                          <label className="w-full h-full flex flex-col items-center justify-center gap-3 cursor-pointer py-6">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50 text-slate-400">
                              {loadingPhotos.remittance ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <Camera className="w-5 h-5" />
                              )}
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-black text-slate-700 tracking-wider">點擊此處拍照或選擇相片</p>
                              <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-wider">支援手機相機鏡頭直接拍照存摺/憑證</p>
                            </div>
                            <input 
                              type="file" 
                              accept="image/*" 
                              capture="environment" 
                              required
                              onChange={e => handlePhotoCapture(e, "remittance")} 
                              className="hidden" 
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading}
                    type="submit" 
                    className={`w-full bg-gradient-to-r ${gradientColor} text-white p-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl group disabled:opacity-50 mt-8`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        送出 B2B 創業加入申請 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10 space-y-6"
              >
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">申請提交成功！</h2>
                  <p className="text-xs text-slate-400 tracking-wider font-bold uppercase mt-1">Application Submitted Successfully</p>
                </div>
                
                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 text-left space-y-4 max-w-sm mx-auto">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 font-bold text-xs flex-shrink-0 mt-0.5">1</div>
                    <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                      <strong>會計核對金額（第一階段）</strong>：總部會計將於 24 小時內核對您的匯款帳號後五碼及上傳之水單。
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 font-bold text-xs flex-shrink-0 mt-0.5">2</div>
                    <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                      <strong>業務主管審核（最終階段）</strong>：會計核對無誤後，案件將自動送交業務主管進行最終審查，通過後您的帳號將立即開通！
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 font-bold text-xs flex-shrink-0 mt-0.5">3</div>
                    <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                      <strong>開通登入通知</strong>：審核完成後，您的帳號即可正式以您的手機號碼及設定密碼登入初潤茶舍平台，且您的虛擬帳戶將自動匯入您儲值的首筆資金！
                    </p>
                  </div>
                </div>

                <div className="pt-6">
                  <Link href="/login" className="text-xs font-black text-slate-400 hover:text-slate-800 underline uppercase tracking-widest">
                    返回登入頁面
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-slate-400">Loading B2B Apply...</div>}>
      <ApplyContent />
    </Suspense>
  );
}
