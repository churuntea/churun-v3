"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Loader2, 
  Shield, 
  ShieldCheck, 
  Users, 
  Lock, 
  Check, 
  X, 
  Settings, 
  Ticket, 
  Image as ImageIcon, 
  Package, 
  LayoutDashboard, 
  Wallet, 
  Database,
  Building,
  UserCheck,
  Calendar,
  Phone,
  Hash,
  AlertTriangle,
  BadgeAlert,
  Crown,
  Sparkles,
  Zap,
  Award,
  Star,
  Heart,
  TrendingUp
} from "lucide-react";

// 權限模組對應清單，提供圖示與說明
const PERMISSION_MODULES = [
  { key: "coupons", label: "優惠券與派發管理", icon: Ticket, desc: "管理優惠券建立、編輯與批次發放" },
  { key: "posters", label: "公版行銷海報管理", icon: ImageIcon, desc: "新增、刪除海報 DM 樣板及分享素材" },
  { key: "members", label: "會員總覽與資料匯出", icon: Users, desc: "檢視 B2C/B2B 會員樹狀組織、匯出報表" },
  { key: "evaluation", label: "全體階級考核", icon: LayoutDashboard, desc: "執行季考核升降階、變更特定會員等級" },
  { key: "orders", label: "訂單與出貨管理", icon: Package, desc: "審核會員自取或宅配訂單，執行出貨操作" },
  { key: "settlement", label: "獎金發放結算", icon: Wallet, desc: "執行分潤結算、Cron 獎金試算作業" },
  { key: "products", label: "商品管理", icon: Settings, desc: "新增/修改商城商品、參數與庫存數量" },
  { key: "backup", label: "數據庫備份", icon: Database, desc: "下載整站資料庫備份 SQL 封包檔案" },
  { key: "withdrawals", label: "提領審核與發放", icon: ShieldCheck, desc: "審核 B2B 創業夥伴的佣金提領申請與匯款" }
];

// 快速職能預設配置對照表
const ROLE_PRESETS = [
  {
    name: "👑 總經理 / 創辦人 (Super GM)",
    desc: "解鎖全系統 9 大功能模組之所有管理與審查權限",
    perms: { coupons: true, posters: true, members: true, evaluation: true, orders: true, settlement: true, products: true, backup: true, withdrawals: true }
  },
  {
    name: "💼 財務結算與審計總監 (Finance Master)",
    desc: "一鍵授予優惠券建立、會員審查、獎金結算與提領審核發放權限",
    perms: { coupons: true, posters: false, members: true, evaluation: false, orders: false, settlement: true, products: false, backup: false, withdrawals: true }
  },
  {
    name: "🚚 倉儲物流與營運主管 (Logistics Chief)",
    desc: "一鍵授予商品項目上架調整與訂單出貨、物流狀態異動權限",
    perms: { coupons: false, posters: false, members: false, evaluation: false, orders: true, settlement: false, products: true, backup: false, withdrawals: false }
  },
  {
    name: "🎨 品牌行銷與公關專員 (Marketing Specialist)",
    desc: "一鍵授予優惠券發發、公版海報行銷DM上傳與最新消息公告權限",
    perms: { coupons: true, posters: true, members: false, evaluation: false, orders: false, settlement: false, products: false, backup: false, withdrawals: false }
  }
];


// 預設等級特權與保級/晉升設定資料
const DEFAULT_TIERS_CONFIG = [
  { 
    name: '初潤靈魂伴侶', 
    privileges: [
      '專屬匯率：30元 = 1點', 
      '累積消費滿 $50,000 晉升', 
      '每月保級：消費 $1,000 或 直推 3 人', 
      '未達標降級至 初潤知己'
    ],
    color: 'from-amber-400 via-amber-200 to-amber-500',
    icon: 'Crown'
  },
  { 
    name: '初潤知己', 
    privileges: [
      '專屬匯率：40元 = 1點', 
      '累積消費滿 $25,000 晉升', 
      '每月保級：消費 $600 或 直推 2 人', 
      '未達標降級至 初潤閨蜜'
    ],
    color: 'from-emerald-400 to-emerald-600',
    icon: 'Heart'
  },
  { 
    name: '初潤閨蜜', 
    privileges: [
      '專屬匯率：50元 = 1點', 
      '累積滿 $12,000 (或儲值 1 萬直升)', 
      '每季保級：消費 $1,200 或 直推 2 人', 
      '未達標降級至 初潤好朋友'
    ],
    color: 'from-rose-400 to-rose-600',
    icon: 'Sparkles'
  },
  { 
    name: '初潤好朋友', 
    privileges: [
      '專屬匯率：60元 = 1點', 
      '累積消費滿 $6,000 晉升', 
      '每季保級：消費 $600 或 直推 1 人', 
      '未達標降級至 初潤青少年'
    ],
    color: 'from-indigo-400 to-indigo-600',
    icon: 'Star'
  },
  { 
    name: '初潤青少年', 
    privileges: [
      '專屬匯率：70元 = 1點', 
      '累積消費滿 $3,000 晉升', 
      '無保級壓力'
    ],
    color: 'from-blue-400 to-blue-600',
    icon: 'TrendingUp'
  },
  { 
    name: '初潤小朋友', 
    privileges: [
      '專屬匯率：80元 = 1點', 
      '累積消費滿 $1,500 晉升', 
      '無保級壓力'
    ],
    color: 'from-sky-400 to-sky-600',
    icon: 'Award'
  },
  { 
    name: '初潤幼兒園', 
    privileges: [
      '專屬匯率：90元 = 1點', 
      '完成首次消費即可晉升', 
      '無保級壓力'
    ],
    color: 'from-teal-400 to-teal-600',
    icon: 'ShieldCheck'
  },
  { 
    name: '初潤寶寶', 
    privileges: [
      '專屬匯率：100元 = 1點', 
      '加入 LINE@ 註冊即可獲得', 
      '無保級壓力'
    ],
    color: 'from-slate-400 to-slate-600',
    icon: 'Zap'
  }
];

function AdminHRContent() {
  const router = useRouter();
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "form" | "tiers">("list");
  
  // 搜尋與篩選狀態
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("全部");
  const [selectedStatus, setSelectedStatus] = useState("全部");
  const [selectedPermission, setSelectedPermission] = useState("全部");

  // 表單資料
  const [editingId, setEditingId] = useState<string | null>(null);
  // 生成職員預設編號：CR + 年(2) + ST + 月(2) + 隨機(4)
  const generateStaffId = () => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `CR${yy}ST${mm}${seq}`;
  };

  const [formData, setFormData] = useState({
    staff_id: generateStaffId(),
    name: "",
    phone: "",
    department: "營運部",
    title: "專員",
    password: "",
    status: "active",
    hire_date: "",
    permissions: {
      coupons: false,
      posters: false,
      members: false,
      evaluation: false,
      orders: false,
      settlement: false,
      products: false,
      backup: false,
      withdrawals: false
    } as Record<string, boolean>
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 職級等級特權與獎勵設定相關狀態
  const [tiersConfig, setTiersConfig] = useState<any[]>([]);
  const [isLoadingTiers, setIsLoadingTiers] = useState(false);
  const [selectedTierIdx, setSelectedTierIdx] = useState<number | null>(null);
  const [editingPrivs, setEditingPrivs] = useState<string[]>([]);
  const [isSavingTiers, setIsSavingTiers] = useState(false);

  const getTierIcon = (iconName: string) => {
    switch (iconName) {
      case 'Crown': return Crown;
      case 'Heart': return Heart;
      case 'Sparkles': return Sparkles;
      case 'Star': return Star;
      case 'TrendingUp': return TrendingUp;
      case 'Award': return Award;
      case 'ShieldCheck': return ShieldCheck;
      case 'Zap': return Zap;
      default: return Award;
    }
  };

  const fetchTiersConfig = async () => {
    setIsLoadingTiers(true);
    try {
      const res = await fetch("/api/materials");
      const data = await res.json();
      if (data.success) {
        const dbConfigs = data.materials.filter((m: any) => m.category === "職級特權設定");
        const mergedConfigs = DEFAULT_TIERS_CONFIG.map(def => {
          const matched = dbConfigs.find((m: any) => m.title === def.name);
          return {
            ...def,
            id: matched?.id || null,
            privileges: matched ? JSON.parse(matched.description) : def.privileges
          };
        });
        setTiersConfig(mergedConfigs);
      }
    } catch (err) {
      console.error("載入職級特權設定失敗:", err);
    }
    setIsLoadingTiers(false);
  };

  useEffect(() => {
    if (activeTab === "tiers") {
      fetchTiersConfig();
    }
  }, [activeTab]);

  const handleSaveTierConfig = async (idx: number) => {
    const tier = tiersConfig[idx];
    setIsSavingTiers(true);
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tier.id || undefined,
          title: tier.name,
          category: "職級特權設定",
          url: "text",
          file_type: "text",
          description: JSON.stringify(editingPrivs.filter(Boolean))
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`🎉 ${tier.name} 特權與獎勵設定儲存成功！`);
        setSelectedTierIdx(null);
        fetchTiersConfig();
      } else {
        alert("❌ 儲存失敗: " + data.error);
      }
    } catch (err: any) {
      alert("⚠️ 系統連線異常: " + err.message);
    }
    setIsSavingTiers(false);
  };

  const handleResetTierToDefault = (idx: number) => {
    if (confirm("💡 確定要將此職級重設回系統預設設定嗎？（儲存後生效）")) {
      setEditingPrivs([...DEFAULT_TIERS_CONFIG[idx].privileges]);
    }
  };
  
  // 總經理安全軌跡稽核狀態
  const [adminTitle, setAdminTitle] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminDept, setAdminDept] = useState("");
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  useEffect(() => {
    const userStr = sessionStorage.getItem("churun_admin_user");
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setAdminTitle(parsed.title || "");
        setAdminName(parsed.name || "");
        setAdminDept(parsed.department || "");
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const fetchAuditLogs = async () => {
    setIsLoadingAudit(true);
    try {
      const userStr = sessionStorage.getItem("churun_admin_user");
      if (!userStr) return;
      const parsed = JSON.parse(userStr);
      
      const res = await fetch(`/api/admin/audit-logs?title=${encodeURIComponent(parsed.title || '')}&name=${encodeURIComponent(parsed.name || '')}`);
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.logs || []);
      } else {
        alert("❌ " + data.error);
      }
    } catch (err: any) {
      console.error("載入審計日誌失敗:", err);
    }
    setIsLoadingAudit(false);
  };

  // 初始化今日日期
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, hire_date: today }));
  }, []);

  // 登入驗證與資料載入
  useEffect(() => {
    const isAdmin = sessionStorage.getItem("churun_admin_auth");
    if (!isAdmin) {
      router.replace("/admin");
      return;
    }
    fetchStaff();
  }, [router]);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/hr", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setStaff(data.staff || []);
        setIsFallbackMode(!!data.fallback);
      }
    } catch (err) {
      console.error("載入人事資料失敗:", err);
    }
    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionToggle = (key: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }));
  };

  const handleAllPermissionsToggle = (enableAll: boolean) => {
    const updatedPermissions = { ...formData.permissions };
    PERMISSION_MODULES.forEach(mod => {
      updatedPermissions[mod.key] = enableAll;
    });
    setFormData(prev => ({ ...prev, permissions: updatedPermissions }));
  };

  const handleEditClick = (person: any) => {
    setEditingId(person.id);
    setFormData({
      staff_id: person.staff_id,
      name: person.name,
      phone: person.phone,
      department: person.department,
      title: person.title,
      password: person.password || "admin123",
      status: person.status,
      hire_date: person.hire_date ? person.hire_date.substring(0, 10) : "",
      permissions: {
        coupons: person.permissions?.coupons || false,
        posters: person.permissions?.posters || false,
        members: person.permissions?.members || false,
        evaluation: person.permissions?.evaluation || false,
        orders: person.permissions?.orders || false,
        settlement: person.permissions?.settlement || false,
        products: person.permissions?.products || false,
        backup: person.permissions?.backup || false,
        withdrawals: person.permissions?.withdrawals || false
      }
    });
    setActiveTab("form");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      staff_id: generateStaffId(),
      name: "",
      phone: "",
      department: "營運部",
      title: "專員",
      status: "active",
      password: "",
      hire_date: new Date().toISOString().split('T')[0],
      permissions: {
        coupons: false,
        posters: false,
        members: false,
        evaluation: false,
        orders: false,
        settlement: false,
        products: false,
        backup: false,
        withdrawals: false
      }
    });
    setActiveTab("list");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.staff_id || !formData.name || !formData.phone) {
      alert("⚠️ 請完整填寫員工編號、姓名與手機號碼！");
      return;
    }

    // 1. 台灣手機號碼格式驗證 (10 位數字且 09 開頭)
    if (!/^09\d{8}$/.test(formData.phone)) {
      alert("⚠️ 手機號碼格式不正確！請輸入 10 位數的台灣手機號碼 (如 0912345678)");
      return;
    }

    // 2. 員工工號標準首碼提示 (不再強制 CR_ST，允許 CRxxST)
    if (!formData.staff_id.toUpperCase().startsWith("CR") || !formData.staff_id.toUpperCase().includes("ST")) {
      const confirmCustomId = confirm("💡 溫馨提示：初潤製茶所建議員工工號以會員編排原則 (例如 CR26ST050001) 為格式，以維持內部編碼統一與系統安全性。確定要使用目前的自定義工號嗎？");
      if (!confirmCustomId) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const isEdit = !!editingId;
      const res = await fetch("/api/hr", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { id: editingId, ...formData } : formData)
      });
      const data = await res.json();
      if (data.success) {
        alert(isEdit ? "🎉 職員權限更新成功！" : "🎉 成功建檔人事並授予權限！");
        fetchStaff();
        handleCancelEdit();
      } else {
        alert("❌ 操作失敗: " + data.error);
      }
    } catch (err: any) {
      alert("⚠️ 系統連線異常: " + err.message);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`⚠️ 確定要刪除/註銷【${name}】的職員檔案與所有權限嗎？`)) return;
    try {
      const res = await fetch("/api/hr", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        alert("🎉 檔案已成功刪除！");
        fetchStaff();
      } else {
        alert("❌ 刪除失敗: " + data.error);
      }
    } catch (err: any) {
      alert("⚠️ 系統連線異常: " + err.message);
    }
  };

  // 1. 計算篩選後的人員
  const filteredStaff = staff.filter(person => {
    const matchesSearch = 
      person.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.staff_id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDept = selectedDept === "全部" || person.department === selectedDept;
    const matchesStatus = selectedStatus === "全部" || person.status === selectedStatus;
    const matchesPermission = selectedPermission === "全部" || person.permissions?.[selectedPermission] === true;

    return matchesSearch && matchesDept && matchesStatus && matchesPermission;
  });

  // 2. 統計計算
  const totalCount = staff.length;
  const activeCount = staff.filter(s => s.status === "active").length;
  const superAdminCount = staff.filter(s => {
    // 擁有 6 個以上權限判定為高階授權帳號
    const allowedCount = Object.values(s.permissions || {}).filter(Boolean).length;
    return allowedCount >= 6;
  }).length;

  const departments = ["全部", "總經理室", "財務部", "營運部", "倉儲部", "行銷部"];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 pb-20 font-sans">
      {/* 導覽列 */}
      <nav className="bg-slate-900 text-white sticky top-0 z-50 px-8 py-4 flex justify-between items-center shadow-2xl">
         <div className="flex items-center gap-4">
            <button onClick={() => router.push("/admin")} className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-white/60 hover:text-white transition backdrop-blur-md">
               <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-black tracking-[0.2em] uppercase">人事與權限管理</h1>
         </div>
         <div className="flex items-center gap-3">
            {isFallbackMode ? (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 px-4 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1.5 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" /> 測試備援模式 (Memory Fallback)
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 px-4 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 fill-emerald-500/20" /> 雲端資料庫已同步 (Database Linked)
              </div>
            )}
         </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 mt-12 space-y-12">
        {/* KPI 數據指標 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex items-center gap-5">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                 <Users className="w-7 h-7" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">在冊人事總人數</p>
                 <h4 className="text-2xl font-black text-slate-800 mt-1">{totalCount} <span className="text-xs text-slate-400">員</span></h4>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex items-center gap-5">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                 <UserCheck className="w-7 h-7 text-emerald-500" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">正常在職人數</p>
                 <h4 className="text-2xl font-black text-slate-800 mt-1">{activeCount} <span className="text-xs text-slate-400">員 ({totalCount > 0 ? Math.round((activeCount/totalCount)*100) : 100}%)</span></h4>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex items-center gap-5">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
                 <ShieldCheck className="w-7 h-7 text-amber-500" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">高階模組權限數 (≥6項)</p>
                 <h4 className="text-2xl font-black text-slate-800 mt-1">{superAdminCount} <span className="text-xs text-slate-400">個帳號</span></h4>
              </div>
           </div>
        </div>

        {/* 頁面 Tab 切換 */}
        <div className="flex gap-4 border-b border-slate-100 pb-1">
           <button 
             onClick={() => setActiveTab("list")}
             className={`pb-4 px-6 text-sm font-black tracking-widest transition-all border-b-2 ${activeTab === "list" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}
           >
              在職人員名冊 ({filteredStaff.length})
           </button>
           <button 
             onClick={() => { setEditingId(null); handleCancelEdit(); setActiveTab("form"); }}
             className={`pb-4 px-6 text-sm font-black tracking-widest transition-all border-b-2 ${activeTab === "form" && !editingId ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}
           >
              ➕ 建立新職員資料
           </button>
           <button
             type="button"
             onClick={() => { setSelectedTierIdx(null); setActiveTab("tiers"); }}
             className={`pb-4 px-6 text-sm font-black tracking-widest transition-all border-b-2 ${activeTab === "tiers" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}
           >
              🏆 各職級特權與獎勵設定
           </button>
           {editingId && (
             <button 
               className="pb-4 px-6 text-sm font-black tracking-widest border-b-2 border-indigo-600 text-indigo-600"
               disabled
             >
                🔧 正在編輯：{formData.name}
             </button>
           )}
        </div>

        {/* 內容區塊 */}
        <AnimatePresence mode="wait">
           {activeTab === "list" ? (
             <motion.div
               key="list"
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -15 }}
               className="space-y-8"
             >
                {/* 搜尋與過濾面板 */}
                <div className="bg-white rounded-[3rem] p-8 border border-slate-50 shadow-2xl shadow-slate-200/10 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">關鍵字檢索</label>
                          <input 
                            type="text" 
                            placeholder="🔍 搜尋職員姓名、員工工號、手機號碼..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border-none p-4 rounded-2xl text-xs font-bold text-slate-800 shadow-inner outline-none focus:ring-4 focus:ring-slate-900/5 transition"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">在職狀態過濾</label>
                          <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full bg-slate-50 border-none p-4 rounded-2xl text-xs font-black text-slate-800 shadow-inner outline-none focus:ring-4 focus:ring-slate-900/5 transition appearance-none"
                          >
                             <option value="全部">全部狀態 (All Status)</option>
                             <option value="active">在職正常 (Active)</option>
                             <option value="suspended">已停權停用 (Suspended)</option>
                             <option value="left">已離職註銷 (Left)</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">系統權限授權篩選</label>
                          <select
                            value={selectedPermission}
                            onChange={(e) => setSelectedPermission(e.target.value)}
                            className="w-full bg-slate-50 border-none p-4 rounded-2xl text-xs font-black text-slate-800 shadow-inner outline-none focus:ring-4 focus:ring-slate-900/5 transition appearance-none"
                          >
                             <option value="全部">全部權限模組 (All Modules)</option>
                             {PERMISSION_MODULES.map(mod => (
                               <option key={mod.key} value={mod.key}>僅顯示具「{mod.label}」者</option>
                             ))}
                          </select>
                       </div>
                    </div>

                   {/* 部門標籤 */}
                   <div className="space-y-2 pt-4 border-t border-slate-100">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">部門快速篩選</label>
                      <div className="flex flex-wrap gap-2">
                         {departments.map((dept) => (
                            <button
                              key={dept}
                              onClick={() => setSelectedDept(dept)}
                              className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-widest transition-all ${selectedDept === dept ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15' : 'bg-slate-50 text-slate-400 hover:text-slate-600 border border-slate-100'}`}
                            >
                               {dept}
                            </button>
                         ))}
                      </div>
                   </div>
                </div>

                {/* 職員列表 */}
                {isLoading ? (
                   <div className="bg-white rounded-[3rem] py-32 flex flex-col items-center gap-4 border border-slate-50 shadow-2xl">
                      <Loader2 className="w-12 h-12 animate-spin text-slate-200" />
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">同步系統人事庫中...</p>
                   </div>
                ) : filteredStaff.length === 0 ? (
                   <div className="bg-white rounded-[3rem] py-24 text-center border border-slate-50 shadow-2xl space-y-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                         <Users className="w-8 h-8 text-slate-200" />
                      </div>
                      <p className="text-xs font-black text-slate-300 uppercase tracking-widest">找不到符合搜尋條件的在職員工</p>
                   </div>
                ) : (
                   <div className="grid grid-cols-1 gap-6">
                      {filteredStaff.map((person) => {
                         const allowedPerms = Object.entries(person.permissions || {})
                           .filter(([_, v]) => v === true)
                           .map(([k, _]) => PERMISSION_MODULES.find(m => m.key === k))
                           .filter(Boolean);

                         return (
                            <div 
                              key={person.id}
                              className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/5 hover:shadow-2xl hover:shadow-slate-200/20 transition duration-500 flex flex-col md:flex-row md:items-center justify-between gap-8 group"
                            >
                               {/* 員工基本資料 */}
                               <div className="flex items-start gap-6">
                                  <div className="w-16 h-16 bg-gradient-to-tr from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center text-slate-600 text-xl font-black shadow-inner border border-slate-200 shrink-0 uppercase">
                                     {person.name?.[0] || 'ST'}
                                  </div>
                                  <div className="space-y-2">
                                     <div className="flex items-center gap-3">
                                        <h4 className="text-lg font-black text-slate-800">{person.name}</h4>
                                        <span className="text-[8px] font-black tracking-widest bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase">{person.staff_id}</span>
                                        {person.status === "active" ? (
                                          <span className="text-[8px] font-black tracking-widest bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full uppercase">在職中</span>
                                        ) : person.status === "suspended" ? (
                                          <span className="text-[8px] font-black tracking-widest bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full uppercase">已停權</span>
                                        ) : (
                                          <span className="text-[8px] font-black tracking-widest bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full uppercase">已離職</span>
                                        )}
                                     </div>
                                     <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                                        <span className="font-bold text-indigo-600 flex items-center gap-1"><Building className="w-3.5 h-3.5" /> {person.department} · {person.title}</span>
                                        <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {person.phone}</span>
                                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {person.hire_date ? person.hire_date.substring(0, 10) : "未註明"} 入職</span>
                                     </div>
                                  </div>
                               </div>

                               {/* 模組授權徽章 */}
                               <div className="flex-1 flex flex-wrap gap-1.5 md:max-w-md">
                                  {allowedPerms.length === 0 ? (
                                     <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1">
                                        <Lock className="w-3 h-3" /> 未授予任何管理功能權限
                                     </span>
                                  ) : (
                                     allowedPerms.map((p: any) => (
                                        <span 
                                          key={p.key} 
                                          className="bg-indigo-50/50 border border-indigo-100/40 text-indigo-700 text-[8px] font-black px-2.5 py-1.5 rounded-xl uppercase tracking-widest flex items-center gap-1"
                                          title={p.label}
                                        >
                                           <p.icon className="w-3 h-3" /> {p.label.substring(0, 4)}
                                        </span>
                                     ))
                                  )}
                               </div>

                               {/* 控制按鈕 */}
                               <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                                  <button
                                    onClick={() => handleEditClick(person)}
                                    className="px-5 py-2.5 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-900 hover:text-white text-xs font-black transition active:scale-[0.97]"
                                  >
                                     授權/編輯
                                  </button>
                                  <button
                                    onClick={() => handleDelete(person.id, person.name)}
                                    className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition"
                                  >
                                     <Trash2 className="w-4 h-4" />
                                  </button>
                               </div>
                            </div>
                         );
                      })}
                   </div>
                )}
             </motion.div>
           ) : activeTab === "form" ? (
              <motion.div
                key="form"
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -15 }}
               className="bg-white rounded-[4rem] p-12 border border-slate-50 shadow-2xl shadow-slate-200/10"
             >
                <form onSubmit={handleSubmit} className="space-y-12">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                         <Shield className="w-6 h-6" />
                      </div>
                      <div>
                         <h3 className="text-xl font-black text-slate-800">{editingId ? "修改職位與功能授權" : "新建職員檔案與功能授權"}</h3>
                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">請填寫基本人事，並在下方矩陣中勾選可開放的管理權限</p>
                      </div>
                   </div>

                   {/* 基本人事資料表單 */}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Hash className="w-4 h-4" /> 員工編號</label>
                         <input 
                           type="text" 
                           name="staff_id" 
                           value={formData.staff_id} 
                           onChange={handleInputChange} 
                           placeholder="如: CR_ST005" 
                           disabled={!!editingId}
                           className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-black text-slate-800 shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10 transition disabled:opacity-50"
                         />
                      </div>

                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Users className="w-4 h-4" /> 職員姓名</label>
                         <input 
                           type="text" 
                           name="name" 
                           value={formData.name} 
                           onChange={handleInputChange} 
                           placeholder="輸入職員姓名" 
                           className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-black text-slate-800 shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10 transition"
                         />
                      </div>

                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Phone className="w-4 h-4" /> 職員手機</label>
                         <input 
                           type="text" 
                           name="phone" 
                           value={formData.phone} 
                           onChange={handleInputChange} 
                           placeholder="手機號碼" 
                           className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-black text-slate-800 shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10 transition"
                         />
                      </div>

                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Building className="w-4 h-4" /> 隸屬部門</label>
                         <select 
                           name="department" 
                           value={formData.department} 
                           onChange={handleInputChange}
                           className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-black text-slate-800 shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10 transition appearance-none"
                         >
                            <option value="總經理室">總經理室</option>
                            <option value="財務部">財務部</option>
                            <option value="營運部">營運部</option>
                            <option value="倉儲部">倉儲部</option>
                            <option value="行銷部">行銷部</option>
                         </select>
                      </div>

                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Building className="w-4 h-4" /> 職稱職位</label>
                         <input 
                           type="text" 
                           name="title" 
                           value={formData.title} 
                           onChange={handleInputChange} 
                           placeholder="如: 會計經理、營運主管" 
                           className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-black text-slate-800 shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10 transition"
                         />
                      </div>

                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Calendar className="w-4 h-4" /> 入職日期</label>
                         <input 
                           type="date" 
                           name="hire_date" 
                           value={formData.hire_date} 
                           onChange={handleInputChange} 
                           className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-black text-slate-800 shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10 transition"
                         />
                      </div>

                      <div className="space-y-3 md:col-span-3">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><UserCheck className="w-4 h-4" /> 帳號狀態</label>
                         <div className="flex gap-4">
                            {[
                              { key: "active", label: "在職正常 (Active)", color: "text-emerald-600 bg-emerald-50" },
                              { key: "suspended", label: "暫時停權 (Suspended)", color: "text-rose-600 bg-rose-50" },
                              { key: "left", label: "離職註銷 (Left)", color: "text-slate-500 bg-slate-100" }
                            ].map((opt) => (
                               <button
                                 key={opt.key}
                                 type="button"
                                 onClick={() => setFormData(prev => ({ ...prev, status: opt.key }))}
                                 className={`px-6 py-3.5 rounded-2xl text-xs font-black tracking-widest transition-all border ${formData.status === opt.key ? `${opt.color} border-current ring-4 ring-current/5` : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'}`}
                               >
                                  {opt.label}
                               </button>
                            ))}
                         </div>
                      </div>
                   </div>

                   {/* 快速職務角色預設套用 */}
                   <div className="pt-8 border-t border-slate-100 space-y-4">
                      <div className="space-y-1">
                         <h4 className="text-sm font-black text-slate-800 tracking-wider">🌟 職務角色權限預設 (Role Presets)</h4>
                         <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">一鍵自動快速配置對應職責之系統功能授權，無須手動繁瑣逐項點選</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {ROLE_PRESETS.map((preset, idx) => {
                            const isMatching = Object.entries(preset.perms).every(([k, v]) => formData.permissions[k] === v);
                            const activeCount = Object.values(preset.perms).filter(Boolean).length;
                            return (
                               <button
                                 key={idx}
                                 type="button"
                                 onClick={() => {
                                   setFormData(prev => ({ ...prev, permissions: { ...preset.perms } }));
                                 }}
                                 className={`p-5 text-left rounded-3xl border transition-all flex flex-col justify-between group ${isMatching ? 'bg-indigo-50/50 border-indigo-200 ring-4 ring-indigo-500/5' : 'bg-slate-50/70 hover:bg-slate-100/50 border-slate-100 hover:border-slate-200'}`}
                               >
                                  <div className="flex justify-between items-center w-full">
                                     <span className={`text-xs font-black transition-colors ${isMatching ? 'text-indigo-900' : 'text-slate-700'}`}>{preset.name}</span>
                                     <span className={`text-[9px] px-2 py-0.5 font-bold rounded-full transition-all ${isMatching ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                        {activeCount} 項模組授權
                                     </span>
                                  </div>
                                  <span className="text-[10px] font-medium text-slate-400 mt-2 leading-relaxed">{preset.desc}</span>
                               </button>
                            );
                         })}
                      </div>
                   </div>

                   {/* 系統權限授權矩陣 */}
                   <div className="pt-8 border-t border-slate-100 space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                         <div className="space-y-1">
                            <h4 className="text-sm font-black text-slate-800 tracking-wider">🛠️ 系統模組授權配置矩陣</h4>
                            <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">請勾選該員工有權點擊進入的後台功能模組</p>
                         </div>
                         <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleAllPermissionsToggle(true)}
                              className="px-4 py-2 bg-slate-100 text-slate-600 text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition"
                            >
                               全選授予 (Grant All)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAllPermissionsToggle(false)}
                              className="px-4 py-2 bg-slate-100 text-slate-600 text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-rose-500 hover:text-white transition"
                            >
                               全部清空 (Revoke All)
                            </button>
                         </div>
                      </div>

                      {/* 授權卡片格柵 */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         {PERMISSION_MODULES.map((mod) => {
                            const isAllowed = formData.permissions[mod.key] || false;
                            return (
                               <div 
                                 key={mod.key}
                                 onClick={() => handlePermissionToggle(mod.key)}
                                 className={`p-6 rounded-[2rem] border transition cursor-pointer flex items-start gap-4 select-none ${isAllowed ? 'bg-indigo-50/40 border-indigo-200 shadow-lg shadow-indigo-100/10' : 'bg-slate-50/50 border-slate-100 hover:border-slate-200'}`}
                               >
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isAllowed ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>
                                     <mod.icon className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1 space-y-1">
                                     <div className="flex items-center justify-between">
                                        <h5 className={`text-xs font-black tracking-wider ${isAllowed ? 'text-indigo-900' : 'text-slate-600'}`}>{mod.label}</h5>
                                        <div className={`w-8 h-5 rounded-full transition duration-300 relative shrink-0 ${isAllowed ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                           <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-all duration-300 ${isAllowed ? 'right-1' : 'left-1'}`} />
                                        </div>
                                     </div>
                                     <p className="text-[10px] font-medium text-slate-400 leading-relaxed">{mod.desc}</p>
                                  </div>
                               </div>
                            );
                         })}
                      </div>
                   </div>

                   {/* 表單送出 */}
                   <div className="pt-8 border-t border-slate-100 flex gap-4">
                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="flex-1 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-sm tracking-widest transition hover:bg-slate-800 shadow-2xl active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                         {isSubmitting ? (
                           <Loader2 className="w-5 h-5 animate-spin" />
                         ) : editingId ? (
                           "儲存變更權限並存檔"
                         ) : (
                           "確認建立人事檔案並授予系統權限"
                         )}
                      </button>
                      <button 
                        type="button" 
                        onClick={handleCancelEdit}
                        className="px-8 py-6 bg-slate-50 text-slate-500 rounded-[2rem] font-black text-xs tracking-widest transition hover:bg-slate-100"
                      >
                         取消返回
                      </button>
                   </div>
                </form>
             </motion.div>
           ) : (
              <motion.div
                key="tiers"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8 animate-fade-in"
              >
                 {/* 職級與特權編輯面板 */}
                 <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-indigo-500 rounded-full blur-[80px] opacity-20"></div>
                    <div className="flex items-center gap-4 relative z-10">
                       <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                          <Crown className="w-6 h-6 text-amber-400" />
                       </div>
                       <div>
                          <h3 className="text-xl font-black tracking-wider">八階會員等級與榮耀特權配置</h3>
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">
                             在這裡可以直接修改各職級所獲得的專屬回饋匯率、晉升門檻、保級標準等明細。修改完成後，前台「職級榮耀殿堂」將即時同步更新！
                          </p>
                       </div>
                    </div>
                 </div>

                 {isLoadingTiers ? (
                    <div className="bg-white rounded-[3rem] py-32 flex flex-col items-center gap-4 border border-slate-50 shadow-2xl">
                       <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">同步職級特權資料庫中...</p>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                       {/* 左側 職級選單 */}
                       <div className={`${selectedTierIdx !== null ? 'lg:col-span-5' : 'lg:col-span-12'} grid grid-cols-1 md:grid-cols-2 ${selectedTierIdx !== null ? 'md:grid-cols-1' : 'md:grid-cols-3'} gap-6 transition-all duration-300`}>
                          {tiersConfig.map((tier, idx) => {
                             const isSelected = selectedTierIdx === idx;
                             const IconComp = getTierIcon(tier.icon);
                             return (
                                <div
                                   key={idx}
                                   onClick={() => {
                                      setSelectedTierIdx(idx);
                                      setEditingPrivs([...tier.privileges]);
                                   }}
                                   className={`relative group cursor-pointer p-6 rounded-[2.5rem] border transition duration-300 overflow-hidden ${isSelected ? 'bg-indigo-900 border-indigo-950 text-white shadow-xl ring-4 ring-indigo-500/10' : 'bg-white border-slate-100 hover:border-slate-200 text-slate-800 shadow-xl shadow-slate-200/5 hover:shadow-2xl hover:shadow-slate-200/10'}`}
                                >
                                   <div className="flex items-center gap-4">
                                      <div className={`w-12 h-12 bg-gradient-to-br ${tier.color} rounded-2xl flex items-center justify-center text-white shadow-md`}>
                                         <IconComp className="w-6 h-6" />
                                      </div>
                                      <div className="space-y-1 flex-1">
                                         <h4 className="text-sm font-black tracking-tight">{tier.name}</h4>
                                         <p className={`text-[9px] font-bold uppercase tracking-widest ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                                            {tier.privileges.length} 項特權配置
                                         </p>
                                      </div>
                                      {!isSelected && (
                                         <div className="w-8 h-8 bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white rounded-xl flex items-center justify-center transition">
                                            <Settings className="w-4 h-4" />
                                         </div>
                                      )}
                                   </div>
                                   {/* 快速摘要前兩項特權 */}
                                   <div className="mt-4 pt-4 border-t border-dashed border-slate-200/10 flex flex-col gap-1">
                                      {tier.privileges.slice(0, 2).map((p: string, pIdx: number) => (
                                         <div key={pIdx} className="flex items-center gap-2 text-[11px] font-bold">
                                            <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-indigo-300' : 'bg-indigo-500'}`} />
                                            <span className={isSelected ? 'text-indigo-200 truncate' : 'text-slate-400 truncate'}>{p}</span>
                                         </div>
                                      ))}
                                   </div>
                                </div>
                             );
                          })}
                       </div>

                       {/* 右側 編輯面板 */}
                       {selectedTierIdx !== null && (
                          <div className="lg:col-span-7 bg-white rounded-[3rem] p-8 border border-slate-50 shadow-2xl space-y-8 h-fit animate-fade-in">
                             {(() => {
                                const tier = tiersConfig[selectedTierIdx];
                                const IconComp = getTierIcon(tier.icon);
                                return (
                                   <>
                                      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                         <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 bg-gradient-to-br ${tier.color} rounded-2xl flex items-center justify-center text-white`}>
                                               <IconComp className="w-6 h-6" />
                                            </div>
                                            <div>
                                               <h4 className="text-md font-black text-slate-800">{tier.name} - 編輯特權明細</h4>
                                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">系統職級階梯專屬特權調整</p>
                                            </div>
                                         </div>
                                         <button 
                                            type="button"
                                            onClick={() => setSelectedTierIdx(null)}
                                            className="p-2 hover:bg-slate-50 rounded-full transition text-slate-400 hover:text-slate-600"
                                         >
                                            <X className="w-5 h-5" />
                                         </button>
                                      </div>

                                      {/* 編輯行清單 */}
                                      <div className="space-y-4">
                                         <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">特權內容明細 (點擊垃圾桶可刪除該行)</label>
                                            <button
                                               type="button"
                                               onClick={() => setEditingPrivs([...editingPrivs, ""])}
                                               className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition flex items-center gap-1"
                                            >
                                               <Plus className="w-3.5 h-3.5" /> 新增一行
                                            </button>
                                         </div>

                                         <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                                            {editingPrivs.map((priv, pIdx) => (
                                               <div key={pIdx} className="flex items-center gap-3">
                                                  <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 text-xs font-black select-none">
                                                     {pIdx + 1}
                                                  </div>
                                                  <input
                                                     type="text"
                                                     value={priv}
                                                     onChange={(e) => {
                                                        const updated = [...editingPrivs];
                                                        updated[pIdx] = e.target.value;
                                                        setEditingPrivs(updated);
                                                     }}
                                                     placeholder="輸入特權/回饋內容描述 (例如: 累積消費滿 $10,000 晉升)"
                                                     className="flex-1 bg-slate-50 border-none px-4 py-3 rounded-xl text-xs font-bold text-slate-800 shadow-inner outline-none focus:ring-2 focus:ring-indigo-500/10 transition"
                                                  />
                                                  <button
                                                     type="button"
                                                     onClick={() => {
                                                        const updated = editingPrivs.filter((_, idx) => idx !== pIdx);
                                                        setEditingPrivs(updated);
                                                     }}
                                                     className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                                  >
                                                     <Trash2 className="w-4 h-4" />
                                                  </button>
                                               </div>
                                            ))}

                                            {editingPrivs.length === 0 && (
                                               <p className="text-xs text-center font-bold text-slate-300 py-8">
                                                  目前無任何特權明細，請點選「新增一行」開始輸入。
                                               </p>
                                            )}
                                         </div>
                                      </div>

                                      {/* 送出或重設 */}
                                      <div className="flex gap-4 pt-6 border-t border-slate-100">
                                         <button
                                            type="button"
                                            disabled={isSavingTiers}
                                            onClick={() => handleSaveTierConfig(selectedTierIdx)}
                                            className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs tracking-widest hover:bg-slate-800 transition active:scale-[0.98] flex items-center justify-center gap-2"
                                         >
                                            {isSavingTiers ? (
                                               <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                               "儲存變更並同步至前台"
                                            )}
                                         </button>
                                         <button
                                            type="button"
                                            onClick={() => handleResetTierToDefault(selectedTierIdx)}
                                            className="px-6 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-xs tracking-widest hover:bg-slate-100 transition"
                                         >
                                            重設系統預設
                                         </button>
                                      </div>
                                   </>
                                );
                             })()}
                          </div>
                       )}
                    </div>
                 )}
              </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function AdminHRPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center gap-4">
         <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">載入人事與權限中...</p>
      </div>
    }>
      <AdminHRContent />
    </Suspense>
  );
}
