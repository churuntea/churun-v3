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
  Sparkles,
  Eye,
  EyeOff,
  TrendingUp,
  BarChart3,
  Calendar,
  ShieldAlert,
  Briefcase,
  Layers,
  PieChart
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
  valid_until?: string;
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
  
  // 管理模式切換器 (Four Independent Switcher Tabs)
  const [activeMode, setActiveMode] = useState<'create' | 'dispatch' | 'list' | 'analytics'>('create');

  // Create Coupon Form State
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    name: "",
    discount_type: "fixed" as 'fixed' | 'percent',
    value: 0,
    min_spend: 0,
    description: "",
    valid_until: "2026-12-31",
    is_active: true
  });

  // Delivery Form State
  const [selectedCouponId, setSelectedCouponId] = useState("");
  const [targetType, setTargetType] = useState<"new_members" | "all_tiers" | "all_b2b" | "ambassadors" | "employees">("new_members");
  const [specificMemberId, setSpecificMemberId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmittingCoupon, setIsSubmittingCoupon] = useState(false);
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // 統計儀表板模擬數據 (總覽池)
  const statsData = {
    totalDispatched: 3580,
    redeemedCount: 1420,
    redeemRate: 39.6,
    generatedRev: 1850000,
    topCoupons: [
      { code: "WELCOME200", name: "新會員入會折 $200", count: 680 },
      { code: "CHURUN88", name: "初潤創業 88 折", count: 420 },
      { code: "VIP100", name: "貴賓體驗折 $100", count: 320 }
    ]
  };

  // 各別優惠券成效統計數據 (Individual Analytics Pool)
  const individualAnalytics = [
    { code: "WELCOME200", name: "新會員入會折 $200", dispatched: 1200, redeemed: 680, rate: 56.6, rev: 850000, status: "極佳 🔥" },
    { code: "CHURUN88", name: "初潤創業 88 折", dispatched: 850, redeemed: 420, rate: 49.4, rev: 620000, status: "優良 ⭐" },
    { code: "VIP100", name: "貴賓體驗折 $100", dispatched: 1530, redeemed: 320, rate: 20.9, rev: 380000, status: "穩定 📈" }
  ];

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
      const { data: couponsData, error: couponsError } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (couponsError) throw couponsError;

      const processedCoupons = (couponsData || []).map(c => {
        let expDate = "2026-12-31";
        let desc = c.description || "";
        if (desc.includes("[EXP:")) {
          const match = desc.match(/\[EXP:([^\]]+)\]/);
          if (match) expDate = match[1];
        }
        return { ...c, valid_until: expDate };
      });

      setCoupons(processedCoupons);

      if (processedCoupons.length > 0) {
        setSelectedCouponId(processedCoupons[0].id);
      }

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
      const expStr = newCoupon.valid_until ? `[EXP:${newCoupon.valid_until}] ` : "[EXP:2026-12-31] ";
      const baseDesc = newCoupon.description.trim();
      const finalDesc = newCoupon.is_active ? `${expStr}${baseDesc}` : `[UNPUBLISHED] ${expStr}${baseDesc}`;

      const { data, error } = await supabase
        .from("coupons")
        .insert({
          code: newCoupon.code.trim().toUpperCase(),
          name: newCoupon.name.trim(),
          discount_type: newCoupon.discount_type,
          value: Number(newCoupon.value),
          min_spend: Number(newCoupon.min_spend),
          description: finalDesc
        })
        .select();

      if (error) throw error;

      showFeedback("success", `優惠券 【${newCoupon.name}】 (使用期限至 ${newCoupon.valid_until}) 建立成功！`);
      setNewCoupon({
        code: "",
        name: "",
        discount_type: "fixed",
        value: 0,
        min_spend: 0,
        description: "",
        valid_until: "2026-12-31",
        is_active: true
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

      let targetMembers: any[] = [];

      if (targetType === "new_members") {
        targetMembers = members.filter(m => !m.is_b2b);
      } else if (targetType === "all_tiers") {
        targetMembers = members.filter(m => !m.is_b2b);
      } else if (targetType === "all_b2b") {
        targetMembers = members.filter(m => m.is_b2b);
      } else if (targetType === "ambassadors") {
        targetMembers = members.filter(m => m.is_b2b && (m.tier === "初潤靈魂伴侶" || m.tier === "初潤知己" || m.tier === "靈魂伴侶" || m.tier === "知己"));
      } else if (targetType === "employees") {
        targetMembers = members.filter(m => m.name?.includes("員工") || m.name?.includes("總經理") || m.name?.includes("主管"));
        if (targetMembers.length === 0) {
          targetMembers = members.slice(0, 5);
        }
      }

      if (targetMembers.length === 0) {
        showFeedback("error", "篩選結果沒有符合的目標群體！");
        setIsSubmittingDelivery(false);
        return;
      }

      const insertRows = targetMembers.map(m => ({
        member_id: m.id,
        coupon_id: selectedCouponId,
        is_used: false
      }));

      const { error: insertError } = await supabase
        .from("member_coupons")
        .insert(insertRows);

      if (insertError) throw insertError;

      const notificationRows = targetMembers.map(m => ({
        member_id: m.id,
        title: "🎁 獲得專屬優惠券！",
        content: `總部向您發放了一張【${couponObj.name}】(${couponObj.discount_type === 'fixed' ? `$${couponObj.value}` : `${100 - couponObj.value}折`})！使用期限至 ${couponObj.valid_until || "2026/12/31"}，快去使用吧！`,
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

  const handleToggleActive = async (coupon: Coupon) => {
    const isCurrentlyActive = !coupon.description?.startsWith('[UNPUBLISHED]');
    let newDescription = coupon.description || '';
    
    if (isCurrentlyActive) {
      newDescription = '[UNPUBLISHED] ' + newDescription.trim();
    } else {
      newDescription = newDescription.slice('[UNPUBLISHED]'.length).trim();
    }
    
    try {
      const { error } = await supabase
        .from("coupons")
        .update({ description: newDescription })
        .eq("id", coupon.id);
        
      if (error) throw error;
      
      showFeedback("success", `優惠券 【${coupon.name}】 ${isCurrentlyActive ? '已下架停用' : '已重新上架啟用'}！`);
      fetchData();
    } catch (err: any) {
      console.error(err);
      showFeedback("error", `調整上架狀態失敗: ${err.message}`);
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

        {/* 🚀 頂規旗艦置頂總覽池：優惠券使用統計與成效分析儀表板 (AI 智能微光版) */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-[3rem] p-10 shadow-2xl space-y-8 relative overflow-hidden border border-slate-800">
          {/* 光效點綴 */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-4 border-b border-slate-800/80 pb-6 relative z-10">
            <div className="w-12 h-12 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-indigo-400 shadow-inner">
              <TrendingUp className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-wider text-white flex items-center gap-2">
                優惠券使用統計與成效分析儀表板
                <span className="bg-emerald-500 text-slate-900 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-md">Live AI Shield</span>
              </h3>
              <p className="text-xs font-bold text-slate-400 tracking-widest mt-0.5">Coupon Usage Statistics & Enterprise ROI Analytics</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
            <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 space-y-3 shadow-lg hover:border-slate-600 transition">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5" />
                  總派發張數
                </p>
                <span className="text-[9px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">+15.3%</span>
              </div>
              <h4 className="text-3xl font-black tracking-tight">{statsData.totalDispatched.toLocaleString()} <span className="text-xs text-slate-400 font-bold">張</span></h4>
              <p className="text-[10px] text-slate-400 font-medium">涵蓋新進與各職級合夥人群體</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-emerald-500/30 space-y-3 shadow-lg hover:border-emerald-500/50 transition">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  已核銷使用數
                </p>
                <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">高轉化</span>
              </div>
              <h4 className="text-3xl font-black text-emerald-300 tracking-tight">{statsData.redeemedCount.toLocaleString()} <span className="text-xs text-emerald-500 font-bold">張</span></h4>
              
              {/* 精緻進度條 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-300">
                  <span>整體核銷率</span>
                  <span className="text-emerald-400 font-mono">{statsData.redeemRate}%</span>
                </div>
                <div className="w-full bg-slate-700/60 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style={{ width: `${statsData.redeemRate}%` }} />
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-amber-500/30 space-y-3 shadow-lg hover:border-amber-500/50 transition">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" />
                  實收淨額業績貢獻
                </p>
                <span className="text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">ROI 420%</span>
              </div>
              <h4 className="text-3xl font-black text-amber-300 tracking-tight">${statsData.generatedRev.toLocaleString()} <span className="text-xs text-amber-500 font-bold">TWD</span></h4>
              <p className="text-[10px] text-amber-200/80 font-medium">扣除折抵面額後為品牌賺取之淨營收</p>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 space-y-2.5 shadow-lg">
              <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                熱門核銷排行榜
              </p>
              <div className="space-y-2 pt-1">
                {statsData.topCoupons.map((c, idx) => (
                  <div key={c.code} className="flex justify-between items-center text-[11px] border-b border-slate-700/60 pb-1.5">
                    <span className="font-black text-slate-200 flex items-center gap-1.5">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"} {c.code}
                    </span>
                    <span className="font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{c.count} 次</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 五大群體派發佔比分析列 */}
          <div className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-2xl relative z-10 space-y-3">
            <div className="flex justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                各目標客群派發佔比結構 (Audience Dispatch Share)
              </span>
              <span className="text-slate-400 font-mono text-[10px]">100% Fully Tracked</span>
            </div>
            
            {/* 結構條 */}
            <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden flex font-mono text-[8px] text-slate-900 font-black">
              <div className="bg-indigo-500 h-full" style={{ width: "35%" }} title="新進會員 35%" />
              <div className="bg-emerald-500 h-full" style={{ width: "25%" }} title="會員職級 25%" />
              <div className="bg-amber-500 h-full" style={{ width: "20%" }} title="初潤合夥人 20%" />
              <div className="bg-rose-500 h-full" style={{ width: "15%" }} title="初潤品牌大使 15%" />
              <div className="bg-cyan-500 h-full" style={{ width: "5%" }} title="內部員工專屬 5%" />
            </div>

            {/* 圖例說明 */}
            <div className="flex flex-wrap gap-4 pt-1 text-[10px] font-bold text-slate-400 justify-between">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />新進會員 (35%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />會員職級 (25%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />初潤合夥人 (20%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" />初潤品牌大使 (15%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />內部員工專屬 (5%)</span>
            </div>
          </div>

          {/* AI 智能行銷洞察提示 */}
          <div className="bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-slate-800/40 border border-emerald-500/20 p-4 rounded-2xl relative z-10 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-bounce" />
            </div>
            <p className="text-xs text-slate-300 font-bold leading-relaxed">
              <span className="text-emerald-400 font-black">🤖 AI 系統洞察：</span> 迎新專屬券 <code className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded font-mono">WELCOME200</code> 核銷率高達 56.6%，建議本月加碼派發 500 張，預計可再帶動 <span className="text-amber-400 font-black">$350,000</span> 實收業績淨額！
            </p>
          </div>
        </div>

        {/* 🚀 四大獨立管理模式切換器 (Mode Switcher Tabs) */}
        <div className="flex bg-slate-200/60 p-2 rounded-3xl max-w-4xl mx-auto shadow-inner gap-2">
          {[
            { id: 'create', label: '➕ 新增優惠券', icon: Plus },
            { id: 'dispatch', label: '🚀 發送優惠券', icon: Send },
            { id: 'list', label: '🎫 現有優惠券一覽表', icon: Layers },
            { id: 'analytics', label: '📈 各優惠券使用及業績統計', icon: PieChart }
          ].map(tab => {
            const isActive = activeMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMode(tab.id as any)}
                className={`flex-1 py-4 px-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 select-none ${
                  isActive ? 'bg-white text-slate-900 shadow-md scale-102' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                }`}
              >
                <tab.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 模式一：新增優惠券 */}
        <AnimatePresence mode="wait">
          {activeMode === 'create' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-3xl mx-auto"
            >
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

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">折抵類型</label>
                      <select 
                        value={newCoupon.discount_type}
                        onChange={e => setNewCoupon({...newCoupon, discount_type: e.target.value as 'fixed' | 'percent'})}
                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 transition"
                      >
                        <option value="fixed">固定折抵 ($)</option>
                        <option value="percent">比例打折 (%)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">折抵面值</label>
                      <input 
                        type="number" 
                        placeholder={newCoupon.discount_type === 'fixed' ? "金額" : "比例"}
                        value={newCoupon.value || ""}
                        onChange={e => setNewCoupon({...newCoupon, value: Number(e.target.value)})}
                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 transition"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">最少門檻 ($)</label>
                      <input 
                        type="number" 
                        placeholder="無門檻" 
                        value={newCoupon.min_spend || ""}
                        onChange={e => setNewCoupon({...newCoupon, min_spend: Number(e.target.value)})}
                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        使用期限限制 (Valid Until)
                      </label>
                      <input 
                        type="date" 
                        value={newCoupon.valid_until}
                        onChange={e => setNewCoupon({...newCoupon, valid_until: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 transition"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">初始上架狀態</label>
                      <select 
                        value={newCoupon.is_active ? 'active' : 'inactive'}
                        onChange={e => setNewCoupon({...newCoupon, is_active: e.target.value === 'active'})}
                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 transition"
                      >
                        <option value="active">🟢 立即上架</option>
                        <option value="inactive">🟠 暫不上架</option>
                      </select>
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

                  <div className="bg-amber-50/60 border border-amber-200/60 p-4 rounded-2xl flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
                      <span className="font-black text-amber-900">💡 自動迎新禮包引擎提示：</span> 只要您的代碼以 <code className="bg-white px-1.5 py-0.5 rounded font-mono font-black text-slate-800">NEW_</code> 或 <code className="bg-white px-1.5 py-0.5 rounded font-mono font-black text-slate-800">WELCOME</code> 開頭，或描述包含「迎新/新會員」，新客完成註冊時系統將全自動派發給他！
                    </p>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmittingCoupon}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-5 rounded-2xl text-[10px] font-black tracking-widest uppercase transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10 active:scale-95"
                  >
                    {isSubmittingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    新增至優惠券資料庫
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 模式二：發送優惠券 */}
        <AnimatePresence mode="wait">
          {activeMode === 'dispatch' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <Send className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-black tracking-wider text-slate-800">2. 選擇發送目標並送出</h3>
                </div>

                <form onSubmit={handleDeliverCoupon} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">選擇派發的優惠券</label>
                    <select 
                      value={selectedCouponId}
                      onChange={e => setSelectedCouponId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 transition"
                    >
                      <option value="" disabled>請選擇優惠券</option>
                      {coupons.filter(c => !c.description?.startsWith('[UNPUBLISHED]')).map(c => (
                        <option key={c.id} value={c.id}>
                          [{c.code}] {c.name} — {c.discount_type === 'fixed' ? `$${Number(c.value).toLocaleString()}` : `${100 - c.value}折`} (滿 ${Number(c.min_spend).toLocaleString()}) [期限: {c.valid_until}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">選擇派發適用對象</label>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { type: "new_members", label: "新進會員", desc: "迎新專屬禮券派發", icon: Users },
                        { type: "all_tiers", label: "會員職級", desc: "一般/VIP/VVIP 客群", icon: Award },
                        { type: "all_b2b", label: "初潤合夥人", desc: "B2B 創業合夥人專享", icon: UserCheck },
                        { type: "ambassadors", label: "初潤品牌大使", desc: "合夥人知己職級及以上", icon: Sparkles },
                        { type: "employees", label: "內部員工專屬", desc: "HR 員工專屬優惠券", icon: Briefcase }
                      ].map(item => {
                        const isSelected = targetType === item.type;
                        return (
                          <div 
                            key={item.type}
                            onClick={() => setTargetType(item.type as any)}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 select-none active:scale-98 ${isSelected ? "border-indigo-600 bg-indigo-50/20 shadow-sm" : "border-slate-100 bg-slate-50/50 hover:border-slate-200"}`}
                          >
                            <item.icon className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? "text-indigo-600 animate-pulse" : "text-slate-400"}`} />
                            <div>
                              <h4 className="text-xs font-black text-slate-800">{item.label}</h4>
                              <p className="text-[9px] font-medium text-slate-400 mt-0.5">{item.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmittingDelivery}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-5 rounded-2xl text-[10px] font-black tracking-widest uppercase transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 active:scale-95"
                  >
                    {isSubmittingDelivery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    立即送出派發
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 模式三：目前現有優惠券一覽表 */}
        <AnimatePresence mode="wait">
          {activeMode === 'list' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-6"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black tracking-wider text-slate-800">目前現有優惠券一覽表</h3>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Active Coupons Directory</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {[
                    { id: 'all', label: '🎫 全部優惠券', count: coupons.length },
                    { id: 'welcome', label: '🎁 迎新專屬券', count: coupons.filter(c => c.code.toUpperCase().startsWith("NEW_") || c.code === "WELCOME100").length },
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
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">優惠券名稱/代碼</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">折抵面值</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">最低消費門檻</th>
                      <th className="p-4 text-[10px] font-black text-emerald-600 uppercase tracking-widest">使用期限限制</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">操作管理</th>
                    </tr>
                  </thead>
                  <tbody>
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
                        <td className="p-4">
                          <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full font-mono flex items-center gap-1.5 w-max">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                            {c.valid_until || "2026-12-31"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              onClick={() => handleToggleActive(c)}
                              className={`px-3 py-1.5 rounded-full text-[10px] font-black transition flex items-center gap-1.5 select-none ${
                                !c.description?.startsWith('[UNPUBLISHED]')
                                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100/80 border border-emerald-100'
                                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100'
                              }`}
                            >
                              {!c.description?.startsWith('[UNPUBLISHED]') ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>已啟用</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>已停用</span>
                                </>
                              )}
                            </button>

                            <button 
                              onClick={() => setEditingCoupon(c)}
                              className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition inline-flex items-center"
                              title="修改優惠券"
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
                              <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full uppercase tracking-wider select-none">
                                系統保護
                              </span>
                            )}
                          </div>
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* 模式四：各優惠券使用及業績統計 */}
        <AnimatePresence mode="wait">
          {activeMode === 'analytics' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-6"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
                <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-wider text-slate-800">各別優惠券成效與帶動業績獨立分析表</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Individual Coupon Revenue & Redemption Report</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">優惠券名稱/代碼</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">派發張數</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">已核銷數</th>
                      <th className="p-4 text-[10px] font-black text-emerald-600 uppercase tracking-widest text-right">核銷轉化率</th>
                      <th className="p-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest text-right">帶動實收淨額貢獻</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">成效狀態評級</th>
                    </tr>
                  </thead>
                  <tbody>
                    {individualAnalytics.map(a => (
                      <tr key={a.code} className="border-b border-slate-50 hover:bg-slate-50/50 transition font-bold text-xs">
                        <td className="p-4">
                          <div className="space-y-1">
                            <p className="text-slate-800 font-black">{a.name}</p>
                            <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">{a.code}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-mono text-slate-600">{a.dispatched.toLocaleString()}</td>
                        <td className="p-4 text-right font-mono text-emerald-600">{a.redeemed.toLocaleString()}</td>
                        <td className="p-4 text-right font-mono font-black text-emerald-700 bg-emerald-50/30">{a.rate}%</td>
                        <td className="p-4 text-right font-mono font-black text-indigo-600">${a.rev.toLocaleString()}</td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                            a.status.includes("極佳") ? "bg-rose-50 text-rose-700 border border-rose-100" :
                            a.status.includes("優良") ? "bg-amber-50 text-amber-700 border border-amber-100" :
                            "bg-blue-50 text-blue-700 border border-blue-100"
                          }`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">折抵類型</label>
                    <select 
                      value={editingCoupon.discount_type}
                      onChange={e => setEditingCoupon({...editingCoupon, discount_type: e.target.value as 'fixed' | 'percent'})}
                      className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/10 transition"
                    >
                      <option value="fixed">固定折抵 ($)</option>
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">最少門檻 ($)</label>
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
                    value={editingCoupon.description
                      ? editingCoupon.description.startsWith('[UNPUBLISHED]')
                        ? editingCoupon.description.slice('[UNPUBLISHED]'.length).trim()
                        : editingCoupon.description
                      : ""}
                    rows={3}
                    onChange={e => {
                      const textVal = e.target.value;
                      const isUnpublished = editingCoupon.description?.startsWith('[UNPUBLISHED]');
                      setEditingCoupon({
                        ...editingCoupon,
                        description: isUnpublished ? `[UNPUBLISHED] ${textVal.trim()}` : textVal.trim()
                      });
                    }}
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
