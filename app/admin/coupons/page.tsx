"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Ticket, 
  Plus, 
  Send, 
  Users, 
  Award, 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  Loader2, 
  Trash2,
  Pencil, 
  AlertCircle,
  Clock,
  Sparkles
} from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  name: string;
  discount_type: 'fixed' | 'percent';
  value: number;
  min_spend: number;
  description: string;
  created_at: string;
}

export default function CouponsAdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'welcome' | 'regular'>('all');
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  
  // Create Coupon Form State
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    name: "",
    discount_type: "fixed" as 'fixed' | 'percent',
    value: 0,
    min_spend: 0,
    description: ""
  });

  // Delivery Form State
  const [selectedCouponId, setSelectedCouponId] = useState("");
  const [targetType, setTargetType] = useState<"all_b2c" | "all_b2b" | "ambassadors" | "specific">("all_b2c");
  const [specificMemberId, setSpecificMemberId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmittingCoupon, setIsSubmittingCoupon] = useState(false);
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem("churun_admin_auth");
    if (auth === "true") {
      setIsAdmin(true);
      fetchData();
    } else {
      router.push("/admin");
    }
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Coupons
      const { data: couponsData, error: couponsError } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (couponsError) throw couponsError;
      setCoupons(couponsData || []);

      if (couponsData && couponsData.length > 0) {
        setSelectedCouponId(couponsData[0].id);
      }

      // 2. Fetch Members (for Specific Target searching)
      const { data: membersData, error: membersError } = await supabase
        .from("members")
        .select("id, name, phone, tier, is_b2b")
        .order("name");
      
      if (membersError) throw membersError;
      setMembers(membersData || []);

    } catch (err) {
      console.error("Error fetching data:", err);
    }
    setIsLoading(false);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.name || newCoupon.value <= 0) {
      showFeedback("error", "請填寫完整優惠券代碼、名稱與折抵面額！");
      return;
    }

    setIsSubmittingCoupon(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .insert({
          code: newCoupon.code.trim().toUpperCase(),
          name: newCoupon.name.trim(),
          discount_type: newCoupon.discount_type,
          value: Number(newCoupon.value),
          min_spend: Number(newCoupon.min_spend),
          description: newCoupon.description.trim()
        })
        .select();

      if (error) throw error;

      showFeedback("success", `優惠券 【${newCoupon.name}】 建立成功！`);
      setNewCoupon({
        code: "",
        name: "",
        discount_type: "fixed",
        value: 0,
        min_spend: 0,
        description: ""
      });
      fetchData();
    } catch (err: any) {
      console.error(err);
      showFeedback("error", `建立失敗: ${err.message || "代碼可能重複"}`);
    }
    setIsSubmittingCoupon(false);
  };

  const handleDeliverCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCouponId) {
      showFeedback("error", "請先選擇要送出的優惠券！");
      return;
    }

    setIsSubmittingDelivery(true);
    try {
      const couponObj = coupons.find(c => c.id === selectedCouponId);
      if (!couponObj) throw new Error("找不到對應的優惠券");

      // 篩選發送目標
      let targetMembers: any[] = [];

      if (targetType === "all_b2c") {
        // 會員 (B2C / where is_b2b === false)
        targetMembers = members.filter(m => !m.is_b2b);
      } else if (targetType === "all_b2b") {
        // 合夥人 (B2B / where is_b2b === true)
        targetMembers = members.filter(m => m.is_b2b);
      } else if (targetType === "ambassadors") {
        // 品牌大使 (B2B 且職級為 靈魂伴侶 或 知己)
        targetMembers = members.filter(m => m.is_b2b && (m.tier === "初潤靈魂伴侶" || m.tier === "初潤知己" || m.tier === "靈魂伴侶" || m.tier === "知己"));
      } else if (targetType === "specific") {
        // 特定對象
        const chosen = members.find(m => m.id === specificMemberId);
        if (chosen) targetMembers = [chosen];
      }

      if (targetMembers.length === 0) {
        showFeedback("error", "篩選結果沒有符合的會員目標！");
        setIsSubmittingDelivery(false);
        return;
      }

      // 批量發放優惠券
      const insertRows = targetMembers.map(m => ({
        member_id: m.id,
        coupon_id: selectedCouponId,
        is_used: false
      }));

      const { error: insertError } = await supabase
        .from("member_coupons")
        .insert(insertRows);

      if (insertError) throw insertError;

      // 批量發送系統通知
      const notificationRows = targetMembers.map(m => ({
        member_id: m.id,
        title: "🎁 獲得專屬優惠券！",
        content: `總部向您發放了一張【${couponObj.name}】(${couponObj.discount_type === 'fixed' ? `$${couponObj.value}` : `${100 - couponObj.value}折`})！已存入您的個人券夾中，快去使用吧！`,
        type: "system",
        is_read: false
      }));

      await supabase.from("notifications").insert(notificationRows);

      showFeedback("success", `成功將優惠券 【${couponObj.name}】 派發給 ${targetMembers.length} 位符合資格的對象！`);
    } catch (err: any) {
      console.error(err);
      showFeedback("error", `派發失敗: ${err.message}`);
    }
    setIsSubmittingDelivery(false);
  };

  const handleDeleteCoupon = async (id: string, name: string) => {
    if (!confirm(`確定要刪除優惠券【${name}】嗎？此動作將一併收回所有會員庫存中未使用的此券！`)) return;

    try {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
      showFeedback("success", `已刪除優惠券 【${name}】`);
      fetchData();
    } catch (err: any) {
      console.error(err);
      showFeedback("error", `刪除失敗: ${err.message}`);
    }
  };

  const handleUpdateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;
    
    setIsSavingEdit(true);
    try {
      const { error } = await supabase
        .from("coupons")
        .update({
          name: editingCoupon.name.trim(),
          discount_type: editingCoupon.discount_type,
          value: Number(editingCoupon.value),
          min_spend: Number(editingCoupon.min_spend),
          description: editingCoupon.description?.trim() || ""
        })
        .eq("id", editingCoupon.id);
        
      if (error) throw error;
      
      showFeedback("success", `優惠券 【${editingCoupon.name}】 更新成功！`);
      setEditingCoupon(null);
      fetchData();
    } catch (err: any) {
      console.error(err);
      showFeedback("error", `更新失敗: ${err.message || "未知錯誤"}`);
    }
    setIsSavingEdit(false);
  };

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const filteredCoupons = coupons.filter(c => {
    const isWelcome = c.code.toUpperCase().startsWith("NEW_") || c.code === "WELCOME100";
    if (filterTab === 'welcome') return isWelcome;
    if (filterTab === 'regular') return !isWelcome;
    return true;
  });

  const filteredMembersForSearch = searchQuery.trim() === ""
    ? members.slice(0, 50)
    : members.filter(m => 
        (m.name && m.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (m.phone && m.phone.includes(searchQuery))
      );

  if (isLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 pb-20">
      {/* Header */}
      <nav className="bg-slate-900 text-white sticky top-0 z-50 px-8 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/admin")} className="p-2 hover:bg-slate-800 rounded-xl transition">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
            <Ticket className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest uppercase">優惠券管理及派發</h1>
            <p className="text-[8px] font-bold text-slate-500 tracking-[0.2em]">Coupons HQ Control</p>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8 space-y-10">
        
        {/* Feedback Alert */}
        <AnimatePresence>
          {feedbackMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-5 rounded-2xl border flex items-center gap-4 relative z-10 ${feedbackMsg.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}
            >
              {feedbackMsg.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <p className="text-xs font-bold leading-relaxed">{feedbackMsg.text}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Section A: Create Coupon Form */}
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <Plus className="w-4 h-4" />
              </div>
              <h3 className="text-base font-black tracking-wider text-slate-800">1. 輸入新優惠券參數</h3>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">優惠券代碼 (UNIQUE)</label>
                  <input 
                    type="text" 
                    placeholder="例如: SPRING88" 
                    value={newCoupon.code}
                    onChange={e => setNewCoupon({...newCoupon, code: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 transition uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">優惠券顯示名稱</label>
                  <input 
                    type="text" 
                    placeholder="例如: 春季限定 88 折" 
                    value={newCoupon.name}
                    onChange={e => setNewCoupon({...newCoupon, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">折抵類型</label>
                  <select 
                    value={newCoupon.discount_type}
                    onChange={e => setNewCoupon({...newCoupon, discount_type: e.target.value as 'fixed' | 'percent'})}
                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 transition"
                  >
                    <option value="fixed">固定折抵金額 ($)</option>
                    <option value="percent">比例打折 (%)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">折抵面值 (VALUE)</label>
                  <input 
                    type="number" 
                    placeholder={newCoupon.discount_type === 'fixed' ? "金額 (如: 100)" : "比例 (如 12 代表12% off即88折)"}
                    value={newCoupon.value || ""}
                    onChange={e => setNewCoupon({...newCoupon, value: Number(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">最低消費門檻 ($)</label>
                  <input 
                    type="number" 
                    placeholder="0 代表無門檻" 
                    value={newCoupon.min_spend || ""}
                    onChange={e => setNewCoupon({...newCoupon, min_spend: Number(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 transition"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">活動簡介與描述</label>
                <textarea 
                  placeholder="顯示在會員券包卡片上的詳細說明" 
                  value={newCoupon.description}
                  rows={3}
                  onChange={e => setNewCoupon({...newCoupon, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 transition resize-none"
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmittingCoupon}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-5 rounded-2xl text-[10px] font-black tracking-widest uppercase transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10"
              >
                {isSubmittingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                新增至優惠券資料庫
              </button>
            </form>
          </div>

          {/* Section B: Delivery System Form */}
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <Send className="w-4 h-4" />
              </div>
              <h3 className="text-base font-black tracking-wider text-slate-800">2. 選擇發送目標並送出</h3>
            </div>

            <form onSubmit={handleDeliverCoupon} className="space-y-6">
              
              {/* Select Coupon */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">選擇發送的優惠券</label>
                <select 
                  value={selectedCouponId}
                  onChange={e => setSelectedCouponId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 transition"
                >
                  <option value="" disabled>請選擇優惠券</option>
                  {filteredCoupons.map(c => (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-800">{c.name}</p>
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">{c.code}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-bold text-indigo-600">
                        {c.discount_type === 'fixed' ? `$${Number(c.value).toLocaleString()}` : `${100 - c.value}折`}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-bold text-slate-700">${Number(c.min_spend).toLocaleString()}</td>
                    <td className="p-4 text-[11px] font-medium text-slate-400">{c.description || "無說明"}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => setEditingCoupon(c)}
                          className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition inline-flex items-center"
                          title="編輯優惠券"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {c.code !== "WELCOME100" ? (
                          <button 
                            onClick={() => handleDeleteCoupon(c.id, c.name)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition inline-flex items-center"
                            title="刪除優惠券"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            系統保護
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                </select>
              </div>

              {/* Target Select */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">選擇送出對象</label>
                
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { type: "all_b2c", label: "全體會員", desc: "僅一般 B2C 帳號", icon: Users },
                    { type: "all_b2b", label: "全體合夥人", desc: "全部 B2B 帳號", icon: UserCheck },
                    { type: "ambassadors", label: "品牌大使", desc: "合夥人 (知己及以上)", icon: Award },
                    { type: "specific", label: "特定個體", desc: "搜尋手機或姓名發送", icon: Ticket }
                  ].map(item => {
                    const isSelected = targetType === item.type;
                    return (
                      <div 
                        key={item.type}
                        onClick={() => setTargetType(item.type as any)}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition flex items-start gap-4 select-none ${isSelected ? "border-indigo-600 bg-indigo-50/20" : "border-slate-100 bg-slate-50/50 hover:border-slate-200"}`}
                      >
                        <item.icon className={`w-5 h-5 shrink-0 mt-0.5 ${isSelected ? "text-indigo-600 animate-pulse" : "text-slate-400"}`} />
                        <div>
                          <h4 className="text-xs font-black text-slate-800">{item.label}</h4>
                          <p className="text-[9px] font-medium text-slate-400 mt-1">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Specific Member Search Dropdown (Conditionally Rendered) */}
              <AnimatePresence>
                {targetType === "specific" && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden relative"
                  >
                    <div className="flex justify-between items-center">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">搜尋對象</label>
                       {specificMemberId && (
                         <button 
                           type="button"
                           onClick={() => {
                             setSpecificMemberId("");
                             setSearchQuery("");
                             setShowDropdown(true);
                           }}
                           className="text-[9px] font-black text-rose-500 hover:underline uppercase tracking-wider"
                         >
                            清除重新搜尋
                         </button>
                       )}
                    </div>
                    <input 
                      type="text"
                      placeholder="💡 請輸入姓名、部分名字或手機號碼..."
                      value={searchQuery}
                      onFocus={() => setShowDropdown(true)}
                      onChange={e => {
                        setSearchQuery(e.target.value);
                        setSpecificMemberId(""); // Clear selection when typing
                        setShowDropdown(true);
                      }}
                      className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 transition"
                    />

                    {showDropdown && (
                      <div className="bg-slate-50 rounded-2xl p-2 max-h-48 overflow-y-auto border border-slate-100 space-y-1 shadow-inner relative z-[80]">
                        <div className="flex justify-between items-center p-2 border-b border-slate-100 mb-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">選擇符合的會員 ({filteredMembersForSearch.length} 筆)</span>
                          <button 
                            type="button" 
                            onClick={() => setShowDropdown(false)} 
                            className="text-[9px] font-black text-indigo-600 hover:underline uppercase tracking-wider"
                          >
                            收起選單
                          </button>
                        </div>
                        {filteredMembersForSearch.map(m => {
                          const isChosen = specificMemberId === m.id;
                          return (
                            <div 
                              key={m.id}
                              onClick={() => {
                                setSpecificMemberId(m.id);
                                setSearchQuery(`${m.name} (${m.phone})`);
                                setShowDropdown(false);
                              }}
                              className={`p-3 rounded-xl cursor-pointer text-xs font-bold transition flex justify-between items-center ${isChosen ? "bg-indigo-600 text-white" : "hover:bg-slate-200 text-slate-700"}`}
                            >
                              <span>{m.name} — {m.phone}</span>
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-black/10">{m.is_b2b ? `B2B | ${m.tier}` : `B2C | ${m.tier}`}</span>
                            </div>
                          );
                        })}
                        {filteredMembersForSearch.length === 0 && (
                          <p className="text-[10px] font-bold text-slate-400 p-4 text-center">找不到匹配的會員</p>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit" 
                disabled={isSubmittingDelivery}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-5 rounded-2xl text-[10px] font-black tracking-widest uppercase transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10"
              >
                {isSubmittingDelivery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                立即送出發放
              </button>
            </form>
          </div>
        </div>

        {/* Section C: Database Coupon Records */}
        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-wider text-slate-800">優惠券資料庫庫存列表</h3>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Active Coupon Library</p>
              </div>
            </div>

          {/* Categorized Filter Tabs */}
          <div className="flex flex-wrap gap-3 border-b border-slate-100 pb-4">
            {[
              { id: 'all', label: '🎫 全部優惠券', count: coupons.length },
              { id: 'welcome', label: '🎁 迎新專屬券 (NEW_)', count: coupons.filter(c => c.code.toUpperCase().startsWith("NEW_") || c.code === "WELCOME100").length },
              { id: 'regular', label: '🛍️ 一般活動券', count: coupons.filter(c => !(c.code.toUpperCase().startsWith("NEW_") || c.code === "WELCOME100")).length },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-full text-xs font-black transition-all flex items-center gap-2 border select-none ${
                  filterTab === tab.id 
                    ? 'bg-emerald-950 text-white border-emerald-950 shadow-md shadow-emerald-950/10 scale-102' 
                    : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${filterTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
              共計 {coupons.length} 款
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">優惠券名稱/代碼</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">折抵面值</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">最低消費金額</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">活動說明</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-800">{c.name}</p>
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">{c.code}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-bold text-indigo-600">
                        {c.discount_type === 'fixed' ? `$${Number(c.value).toLocaleString()}` : `${100 - c.value}折`}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-bold text-slate-700">${Number(c.min_spend).toLocaleString()}</td>
                    <td className="p-4 text-[11px] font-medium text-slate-400">{c.description || "無說明"}</td>
                    <td className="p-4 text-right">
                      {c.code !== "WELCOME100" ? (
                        <button 
                          onClick={() => handleDeleteCoupon(c.id, c.name)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition inline-flex items-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[9px] font-black text-amber-500 bg-amber-50 px-2 py-1 rounded-full uppercase tracking-wider">
                          系統保護
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredCoupons.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-xs font-bold text-slate-400">
                      {filterTab === 'all' ? '目前資料庫無任何優惠券，請在上方新增！' : '此分類目前無任何優惠券'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      

      {/* Edit Coupon Modal */}
      <AnimatePresence>
        {editingCoupon && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[3rem] p-10 w-full max-w-xl shadow-2xl relative border border-slate-100"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black tracking-wider text-slate-800">修改優惠券參數</h3>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Edit Coupon Fields</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setEditingCoupon(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-black transition"
                >
                  ✕ 關閉
                </button>
              </div>

              <form onSubmit={handleUpdateCoupon} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">優惠券代碼 (不可修改)</label>
                    <input 
                      type="text" 
                      value={editingCoupon.code}
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 p-4 rounded-xl text-xs font-black text-slate-400 outline-none cursor-not-allowed uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">優惠券顯示名稱</label>
                    <input 
                      type="text" 
                      value={editingCoupon.name}
                      onChange={e => setEditingCoupon({...editingCoupon, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/10 transition"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">折抵類型</label>
                    <select 
                      value={editingCoupon.discount_type}
                      onChange={e => setEditingCoupon({...editingCoupon, discount_type: e.target.value as 'fixed' | 'percent'})}
                      className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/10 transition"
                    >
                      <option value="fixed">固定折抵金額 ($)</option>
                      <option value="percent">比例打折 (%)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">折抵面值</label>
                    <input 
                      type="number" 
                      value={editingCoupon.value || ""}
                      onChange={e => setEditingCoupon({...editingCoupon, value: Number(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/10 transition"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">最低消費門檻 ($)</label>
                    <input 
                      type="number" 
                      value={editingCoupon.min_spend || ""}
                      onChange={e => setEditingCoupon({...editingCoupon, min_spend: Number(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/10 transition"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">活動簡介與描述</label>
                  <textarea 
                    value={editingCoupon.description || ""}
                    rows={3}
                    onChange={e => setEditingCoupon({...editingCoupon, description: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/10 transition resize-none"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setEditingCoupon(null)}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-500 p-5 rounded-2xl text-[10px] font-black tracking-widest uppercase transition"
                  >
                    取消
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSavingEdit}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-white p-5 rounded-2xl text-[10px] font-black tracking-widest uppercase transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
                  >
                    {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
                    儲存更新
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </main>
    </div>
  );
}
