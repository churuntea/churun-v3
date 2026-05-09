"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, 
  Users, 
  Package, 
  ArrowUpRight, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Loader2,
  Zap,
  ShieldCheck,
  LayoutDashboard,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  Database,
  RefreshCcw,
  TrendingUp,
  Crown,
  Activity,
  AlertTriangle,
  Ticket,
  Image as ImageIcon,
  FileText
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const data = [
  { name: 'Jan', members: 400 },
  { name: 'Feb', members: 600 },
  { name: 'Mar', members: 900 },
  { name: 'Apr', members: 1200 },
  { name: 'May', members: 1800 },
];

function AdminDashboardContent() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState("");
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalB2B: 0,
    pendingSettlement: 0,
    activeOrders: 0,
    todayRevenue: 0,
    monthRevenue: 0
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [chartTimeframe, setChartTimeframe] = useState<"6months" | "30days">("6months");
  const [chartData, setChartData] = useState<any[]>([]);
  const [topPartners, setTopPartners] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupTimeframe, setBackupTimeframe] = useState("month");
  const [isGeneratingBackup, setIsGeneratingBackup] = useState(false);
  const [backupData, setBackupData] = useState<any>(null);

  // 新增：大師級備份與還原擴充狀態
  const [backupTab, setBackupTab] = useState<"stats" | "full" | "restore">("stats");
  const [isFullBackingUp, setIsFullBackingUp] = useState(false);
  const [fullBackupData, setFullBackupData] = useState<any>(null);
  const [restoreFile, setRestoreFile] = useState<any>(null);
  const [parsedRestoreData, setParsedRestoreData] = useState<any>(null);
  const [restoreStrategy, setRestoreStrategy] = useState<"merge" | "overwrite">("merge");
  const [confirmText, setConfirmText] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreLogs, setRestoreLogs] = useState<string[]>([]);

  const handleGenerateBackup = async (timeframe: string) => {
    setIsGeneratingBackup(true);
    try {
      const res = await fetch(`/api/admin/backup-stats?timeframe=${timeframe}`);
      const result = await res.json();
      if (result.success) {
        setBackupData(result);
      } else {
        alert("分析失敗: " + result.error);
      }
    } catch (err: any) {
      alert("分析出錯: " + err.message);
    }
    setIsGeneratingBackup(false);
  };

  const handleGenerateFullBackup = async () => {
    setIsFullBackingUp(true);
    try {
      const res = await fetch(`/api/admin/backup-stats?action=full_backup`);
      const result = await res.json();
      if (result.success) {
        setFullBackupData(result);
      } else {
        alert("系統全備份失敗: " + result.error);
      }
    } catch (err: any) {
      alert("系統全備份出錯: " + err.message);
    }
    setIsFullBackingUp(false);
  };

  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreFile(file);

    const reader = new FileReader();
    reader.onload = (event: any) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const tables = json.tables || json;
        if (json && (tables.members || tables.products || tables.orders)) {
          setParsedRestoreData(json);
          setRestoreLogs([
            `[${new Date().toLocaleTimeString()}] 📂 成功載入備份檔案: ${file.name}`,
            `[${new Date().toLocaleTimeString()}] 📅 備份時間: ${json.generated_at || "未知"}`,
            `[${new Date().toLocaleTimeString()}] 📦 備份版本: ${json.version || "1.0.0"}`
          ]);
        } else {
          alert("格式不符！請上傳由初潤系統匯出的完整備份 .json 檔案。");
          setRestoreFile(null);
          setParsedRestoreData(null);
        }
      } catch (err) {
        alert("解析失敗！非標準 JSON 格式檔案。");
        setRestoreFile(null);
        setParsedRestoreData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!parsedRestoreData) return;
    if (restoreStrategy === "overwrite" && confirmText !== "CONFIRM RESTORE") {
      alert("請輸入大寫 'CONFIRM RESTORE' 以授權高風險覆寫程序！");
      return;
    }

    setIsRestoring(true);
    setRestoreLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ⚡ 還原程序已由管理員授權，正在傳送指令至雲端...`]);

    try {
      const res = await fetch("/api/admin/backup-stats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          strategy: restoreStrategy,
          backup: parsedRestoreData
        })
      });

      const result = await res.json();
      if (result.success) {
        if (result.log && Array.isArray(result.log)) {
          setRestoreLogs(prev => [...prev, ...result.log]);
        }
        setRestoreLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🎉 資料庫數據還原完全成功。`]);
        alert("🎉 數據庫還原完成！系統已套用最新備份數據。");
      } else {
        setRestoreLogs(prev => [...prev, `[❌ 錯誤] 還原執行失敗: ${result.error}`]);
        alert("還原失敗: " + result.error);
      }
    } catch (err: any) {
      setRestoreLogs(prev => [...prev, `[❌ 錯誤] 網路請求異常: ${err.message}`]);
      alert("還原出錯: " + err.message);
    }
    setIsRestoring(false);
  };

  const downloadTextFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJsonFile = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const auth = sessionStorage.getItem("churun_admin_auth");
    if (auth === "true") {
      setIsAdmin(true);
      fetchStats();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // 1. 基礎計數與待處理提領
      const { count: mCount } = await supabase.from("members").select("*", { count: "exact", head: true });
      const { count: bCount } = await supabase.from("members").select("*", { count: "exact", head: true }).eq("is_b2b", true);
      const { data: wData } = await supabase.from("wallet_transactions").select("amount").eq("status", "pending");
      const pendingSum = wData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

      // 2. 撈取最近 180 天內的所有訂單，用於動態圖表與今日/本月業績計算
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const { data: recentOrders } = await supabase
        .from("orders")
        .select("id, total_amount, status, created_at")
        .gte("created_at", sixMonthsAgo.toISOString())
        .order("created_at", { ascending: true });

      const safeOrders = recentOrders || [];
      setOrders(safeOrders);

      // 計算今日業績、本月業績、待處理訂單數
      const localToday = new Date();
      const localTodayYMD = `${localToday.getFullYear()}-${String(localToday.getMonth() + 1).padStart(2, "0")}-${String(localToday.getDate()).padStart(2, "0")}`;
      const localThisMonthYM = `${localToday.getFullYear()}-${String(localToday.getMonth() + 1).padStart(2, "0")}`;

      let activeOrderSum = 0;
      let todayRev = 0;
      let monthRev = 0;

      safeOrders.forEach(o => {
        const orderDate = new Date(o.created_at);
        const oYMD = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}-${String(orderDate.getDate()).padStart(2, "0")}`;
        const oYM = oYMD.substring(0, 7);

        if (o.status !== 'cancelled' && o.status !== 'refunded') {
          const amt = Number(o.total_amount) || 0;
          if (oYMD === localTodayYMD) {
            todayRev += amt;
          }
          if (oYM === localThisMonthYM) {
            monthRev += amt;
          }
        }

        if (o.status === 'pending' || o.status === 'paid' || o.status === 'shipped') {
          activeOrderSum += 1;
        }
      });

      setStats({
        totalMembers: mCount || 0,
        totalB2B: bCount || 0,
        pendingSettlement: pendingSum,
        activeOrders: activeOrderSum,
        todayRevenue: todayRev,
        monthRevenue: monthRev
      });

      // 3. 獲取前 3 名合夥人業績排行榜
      const { data: topB2B } = await supabase
        .from("members")
        .select("name, member_code, tier, team_total_sales")
        .eq("is_b2b", true)
        .order("team_total_sales", { ascending: false })
        .limit(3);
      
      setTopPartners(topB2B || []);

      // 4. 獲取銷售量前 3 名商品排行榜
      const { data: itemsData } = await supabase
        .from("order_items")
        .select("name, quantity, price");

      const prodMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
      if (itemsData) {
        itemsData.forEach(item => {
          const name = item.name || "其他商品";
          const qty = Number(item.quantity) || 0;
          const price = Number(item.price) || 0;
          if (!prodMap[name]) {
            prodMap[name] = { name, quantity: 0, revenue: 0 };
          }
          prodMap[name].quantity += qty;
          prodMap[name].revenue += qty * price;
        });
      }

      const topProdsList = Object.values(prodMap)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 3);

      setTopProducts(topProdsList);

    } catch (err) { 
      console.error("fetchStats error:", err); 
    }
    setIsLoading(false);
  };

  // 5. 反應式圖表數據聚合
  useEffect(() => {
    if (orders.length === 0) {
      // 載入高質感模擬數據 (當數據庫完全空白時，給予精美圖形展示)
      if (chartTimeframe === "6months") {
        setChartData([
          { name: '1月', "月度業績 (NT$)": 15000, "成交筆數": 18 },
          { name: '2月', "月度業績 (NT$)": 22000, "成交筆數": 25 },
          { name: '3月', "月度業績 (NT$)": 29000, "成交筆數": 32 },
          { name: '4月', "月度業績 (NT$)": 38000, "成交筆數": 48 },
          { name: '5月', "月度業績 (NT$)": 47000, "成交筆數": 60 },
          { name: '6月', "月度業績 (NT$)": 55000, "成交筆數": 75 },
        ]);
      } else {
        const mockDays = [];
        for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          mockDays.push({
            name: `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`,
            "月度業績 (NT$)": Math.floor(Math.random() * 4000) + 800,
            "成交筆數": Math.floor(Math.random() * 4) + 1
          });
        }
        setChartData(mockDays);
      }
      return;
    }

    if (chartTimeframe === "6months") {
      const monthsList: string[] = [];
      const monthStats: Record<string, { label: string; revenue: number; ordersCount: number }> = {};
      const localeMonths = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = `${localeMonths[d.getMonth()]}`;
        monthsList.push(key);
        monthStats[key] = { label, revenue: 0, ordersCount: 0 };
      }

      orders.forEach(o => {
        if (o.status !== 'cancelled' && o.status !== 'refunded') {
          const orderDate = new Date(o.created_at);
          const oYM = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}`;
          if (monthStats[oYM]) {
            monthStats[oYM].revenue += Number(o.total_amount) || 0;
            monthStats[oYM].ordersCount += 1;
          }
        }
      });

      const formatted = monthsList.map(key => ({
        name: monthStats[key].label,
        "月度業績 (NT$)": monthStats[key].revenue,
        "成交筆數": monthStats[key].ordersCount
      }));
      setChartData(formatted);
    } else {
      const daysList: string[] = [];
      const dayStats: Record<string, { label: string; revenue: number; ordersCount: number }> = {};

      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const label = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
        daysList.push(key);
        dayStats[key] = { label, revenue: 0, ordersCount: 0 };
      }

      orders.forEach(o => {
        if (o.status !== 'cancelled' && o.status !== 'refunded') {
          const orderDate = new Date(o.created_at);
          const oYMD = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}-${String(orderDate.getDate()).padStart(2, "0")}`;
          if (dayStats[oYMD]) {
            dayStats[oYMD].revenue += Number(o.total_amount) || 0;
            dayStats[oYMD].ordersCount += 1;
          }
        }
      });

      const formatted = daysList.map(key => ({
        name: dayStats[key].label,
        "月度業績 (NT$)": dayStats[key].revenue,
        "成交筆數": dayStats[key].ordersCount
      }));
      setChartData(formatted);
    }
  }, [orders, chartTimeframe]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      sessionStorage.setItem("churun_admin_auth", "true");
      setIsAdmin(true);
      fetchStats();
    } else {
      alert("密碼錯誤");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("churun_admin_auth");
    setIsAdmin(false);
  };

  if (isLoading && isAdmin) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#312e81,transparent)] opacity-50"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-slate-900/50 backdrop-blur-3xl p-12 rounded-[3rem] border border-slate-800 shadow-2xl text-center">
           <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-600/20">
              <ShieldCheck className="w-10 h-10 text-white" />
           </div>
           <h1 className="text-2xl font-black text-white tracking-tight mb-2">總部授權中心</h1>
           <p className="text-xs text-slate-500 uppercase tracking-[0.3em] mb-10">Restricted Area</p>
           
           <form onSubmit={handleLogin} className="space-y-6">
              <input 
                type="password" 
                placeholder="請輸入管理授權碼" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 p-5 rounded-2xl text-white text-center font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition"
              />
              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition shadow-xl shadow-indigo-600/20">
                 啟動指揮系統
              </button>
           </form>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 pb-20">
      
      <nav className="bg-slate-900 text-white sticky top-0 z-50 px-8 py-4 flex justify-between items-center shadow-2xl">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
               <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-sm font-black tracking-[0.2em] uppercase">HQ Command Center</h1>
         </div>
         <div className="flex items-center gap-6">
            <button onClick={fetchStats} className="p-2 text-slate-400 hover:text-white transition">
               <RefreshCcw className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-400 transition">
               Logout
            </button>
         </div>
      </nav>

      <main className="max-w-7xl mx-auto p-10 space-y-12">
        
        {/* HQ Stats Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-6 px-2">
           {[
             { label: "今日成交額", val: `NT$ ${stats.todayRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-indigo-500", href: "#" },
             { label: "本月累計業績", val: `NT$ ${stats.monthRevenue.toLocaleString()}`, icon: Activity, color: "text-pink-500", href: "#" },
             { label: "待核准提領", val: `NT$ ${stats.pendingSettlement.toLocaleString()}`, icon: Wallet, color: "text-amber-500", href: "/admin/withdrawals" },
             { label: "待處理訂單", val: `${stats.activeOrders} 筆`, icon: Package, color: "text-blue-500", href: "/admin/orders" },
             { label: "總註冊會員", val: `${stats.totalMembers} 員`, icon: Users, color: "text-emerald-500", href: "/admin/members" },
             { label: "B2B 合夥人", val: `${stats.totalB2B} 員`, icon: ShieldCheck, color: "text-cyan-500", href: "/admin/members" },
             
           ].map((stat, i) => (
             <Link href={stat.href} key={i}>
                <motion.div 
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-4 cursor-pointer"
                >
                   <div className="flex justify-between items-center">
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                      <ChevronRight className="w-4 h-4 text-slate-200" />
                   </div>
                   <div className="space-y-1">
                      <h4 className="text-2xl font-black text-slate-800 tracking-tighter">{stat.val}</h4>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{stat.label}</p>
                   </div>
                </motion.div>
             </Link>
           ))}
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           {/* Left: 快捷管理操作 - 4大核心視覺專區 */}
            <div className="space-y-6 lg:col-span-1">
               <div className="flex justify-between items-center px-2">
                  <h3 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase">核心管理專區</h3>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-full">HQ Console</span>
               </div>

               {/* Zone 1: 行銷管理區 */}
               <div className="bg-white rounded-[3rem] p-7 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                     <div className="w-8 h-8 bg-pink-50 text-pink-500 rounded-xl flex items-center justify-center font-bold">📢</div>
                     <div>
                        <h4 className="text-sm font-black text-slate-800">行銷管理區</h4>
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-0.5">Marketing & Materials</p>
                     </div>
                  </div>
                  <div className="space-y-2">
                     {[
                        { label: "商品管理", icon: Settings, action: "/admin/products" },
                        { label: "優惠卷與派發管理", icon: Ticket, action: "/admin/coupons" },
                        { label: "公版行銷海報管理", icon: ImageIcon, action: "/admin/posters" },
                        { label: "品牌素材與文宣管理", icon: ImageIcon, action: "/admin/materials" },
                        { label: "初潤 brand 脈動與快訊公告", icon: FileText, action: "/admin/news" }
                     ].map((act, i) => (
                        <button 
                           key={act.label}
                           onClick={() => router.push(act.action)}
                           className="w-full flex items-center justify-between p-3.5 bg-slate-50 rounded-xl hover:bg-slate-900 hover:text-white transition group"
                        >
                           <div className="flex items-center gap-3">
                              <act.icon className="w-4 h-4 text-slate-400 group-hover:text-white" />
                              <span className="text-xs font-bold text-slate-700 group-hover:text-white">{act.label === "初潤 brand 脈動與快訊公告" ? "初潤品牌脈動與快訊公告" : act.label}</span>
                           </div>
                           <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition" />
                        </button>
                     ))}
                  </div>
               </div>

               {/* Zone 2: 會員管理區 */}
               <div className="bg-white rounded-[3rem] p-7 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                     <div className="w-8 h-8 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center font-bold">👥</div>
                     <div>
                        <h4 className="text-sm font-black text-slate-800">會員管理區</h4>
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-0.5">Members & Bonuses</p>
                     </div>
                  </div>
                  <div className="space-y-2">
                     {[
                        { label: "會員總攬與資料匯出", icon: Users, action: "/admin/members" },
                        { label: "全體階級考核", icon: LayoutDashboard, action: "/admin/evaluation" },
                        { label: "獎金提醒審核中心", icon: Wallet, action: "/admin/withdrawals" },
                        { label: "獎金發放結構", icon: TrendingUp, action: "/api/cron/settlement" },
                        { label: "訂單與出貨管理", icon: Package, action: "/admin/orders" }
                     ].map((act, i) => (
                        <button 
                           key={act.label}
                           onClick={async () => {
                              if (act.action.includes('/api/')) {
                                 if (!confirm("確定要執行全體獎金發放與業績結算嗎？此動作將發放分紅並扣除相關帳戶餘額！")) return;
                                 const res = await fetch(act.action, { method: 'POST' });
                                 const d = await res.json();
                                 alert(d.message || d.error);
                              } else {
                                 router.push(act.action);
                              }
                           }}
                           className="w-full flex items-center justify-between p-3.5 bg-slate-50 rounded-xl hover:bg-slate-900 hover:text-white transition group"
                        >
                           <div className="flex items-center gap-3">
                              <act.icon className="w-4 h-4 text-slate-400 group-hover:text-white" />
                              <span className="text-xs font-bold text-slate-700 group-hover:text-white">{act.label}</span>
                           </div>
                           <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition" />
                        </button>
                     ))}
                  </div>
               </div>

               {/* Zone 3: 人事與權限管理 */}
               <div className="bg-white rounded-[3rem] p-7 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                     <div className="w-8 h-8 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center font-bold">🔑</div>
                     <div>
                        <h4 className="text-sm font-black text-slate-800">人事與權限管理</h4>
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-0.5">HR & Permissions</p>
                     </div>
                  </div>
                  <div className="space-y-2">
                     <button 
                        onClick={() => router.push("/admin/hr")}
                        className="w-full flex items-center justify-between p-3.5 bg-slate-50 rounded-xl hover:bg-slate-900 hover:text-white transition group"
                     >
                        <div className="flex items-center gap-3">
                           <ShieldCheck className="w-4 h-4 text-slate-400 group-hover:text-white" />
                           <span className="text-xs font-bold text-slate-700 group-hover:text-white">人事與權限管理</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition" />
                     </button>
                  </div>
               </div>

               {/* Zone 4: 數據庫備份 */}
               <div className="bg-white rounded-[3rem] p-7 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                     <div className="w-8 h-8 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center font-bold">📊</div>
                     <div>
                        <h4 className="text-sm font-black text-slate-800">數據庫備份</h4>
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-0.5">Database Backup</p>
                     </div>
                  </div>
                  <div className="space-y-2">
                     <button 
                        onClick={() => {
                           setShowBackupModal(true);
                           handleGenerateBackup(backupTimeframe);
                        }}
                        className="w-full flex items-center justify-between p-3.5 bg-slate-50 rounded-xl hover:bg-slate-900 hover:text-white transition group"
                     >
                        <div className="flex items-center gap-3">
                           <Database className="w-4 h-4 text-slate-400 group-hover:text-white" />
                           <span className="text-xs font-bold text-slate-700 group-hover:text-white">數據庫備份</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition" />
                     </button>
                  </div>
               </div>
            </div>
            
            {/* Right: 業績與成長趨勢 */}
           <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center px-4">
                 <h3 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase flex items-center gap-2">
                    <Activity className="w-4 h-4" /> 業績與成長趨勢
                 </h3>
                 {/* Interactive Timeframe Toggle Buttons */}
                 <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setChartTimeframe("6months")}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${chartTimeframe === "6months" ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-700"}`}
                    >
                       6個月趨勢
                    </button>
                    <button
                      onClick={() => setChartTimeframe("30days")}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${chartTimeframe === "30days" ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-700"}`}
                    >
                       30天日報
                    </button>
                 </div>
              </div>
              <div className="bg-white rounded-[4rem] p-10 border border-slate-50 shadow-sm h-[400px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                       <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                             <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#cbd5e1'}} dy={10} />
                       <YAxis hide />
                       <Tooltip 
                         contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '12px' }}
                         itemStyle={{ color: '#818cf8', fontWeight: 900 }}
                       />
                       <Area 
                         type="monotone" 
                         dataKey="月度業績 (NT$)" 
                         stroke="#6366f1" 
                         strokeWidth={4} 
                         fillOpacity={1} 
                         fill="url(#colorRevenue)" 
                       />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>

      
        {/* Top Performers & Best Sellers Leaderboards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
           {/* Leaderboard 1: Top B2B Partners */}
           <div className="space-y-6">
              <h3 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase px-4 flex items-center gap-2">
                 <Crown className="w-4 h-4 text-amber-500" /> 🏆 創業合夥人業績排行榜 (Top Partners)
              </h3>
              <div className="bg-white rounded-[3rem] p-8 border border-slate-50 shadow-sm space-y-4">
                 {topPartners.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                       <p className="text-xs font-bold">目前暫無合夥人業績數據</p>
                    </div>
                 ) : (
                    topPartners.map((partner, i) => (
                       <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:scale-[1.01] transition duration-200">
                          <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white ${
                                i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : 'bg-amber-700'
                             }`}>
                                {i + 1}
                             </div>
                             <div>
                                <h4 className="text-sm font-black text-slate-800">{partner.name}</h4>
                                <p className="text-[10px] font-mono text-indigo-500 mt-0.5">{partner.member_code}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-xs font-black text-indigo-600">NT$ {Number(partner.team_total_sales || 0).toLocaleString()}</p>
                             <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-0.5">團隊總業績</p>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>

           {/* Leaderboard 2: Top Selling Products */}
           <div className="space-y-6">
              <h3 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase px-4 flex items-center gap-2">
                 <Zap className="w-4 h-4 text-indigo-500" /> 🔥 熱銷茶飲商品排行榜 (Top Products)
              </h3>
              <div className="bg-white rounded-[3rem] p-8 border border-slate-50 shadow-sm space-y-4">
                 {topProducts.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                       <p className="text-xs font-bold">目前暫無銷售商品數據</p>
                    </div>
                 ) : (
                    topProducts.map((prod, i) => (
                       <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:scale-[1.01] transition duration-200">
                          <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white ${
                                i === 0 ? 'bg-indigo-500' : i === 1 ? 'bg-purple-500' : 'bg-pink-500'
                             }`}>
                                {i + 1}
                             </div>
                             <div>
                                <h4 className="text-sm font-black text-slate-800">{prod.name}</h4>
                                <p className="text-[10px] font-black text-slate-400 mt-0.5">單價: NT$ {Number(prod.price || 0).toLocaleString()}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-xs font-black text-indigo-600">{prod.quantity} 筆成交</p>
                             <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-0.5">累計銷量</p>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>

      {/* Backup & Analytics Statistics Modal */}
      <AnimatePresence>
        {showBackupModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isRestoring) setShowBackupModal(false);
              }}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-[3rem] p-6 sm:p-10 w-full max-w-2xl shadow-2xl relative z-10 max-h-[92vh] overflow-y-auto no-scrollbar flex flex-col gap-6 border border-slate-100"
              onClick={e => e.stopPropagation()}
            >
               {/* Modal Header */}
               <div className="flex items-center justify-between border-b border-slate-100 pb-5 shrink-0">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-md">
                        <Database className="w-6 h-6 animate-pulse" />
                     </div>
                     <div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">數位指揮中心 - 數據備份與還原大師</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Database Backup & Recovery Master Suite</p>
                     </div>
                  </div>
                  <button 
                    disabled={isRestoring} 
                    onClick={() => setShowBackupModal(false)} 
                    className="w-8 h-8 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 transition text-sm font-bold"
                  >
                    ✕
                  </button>
               </div>

               {/* Tab Control Buttons */}
               <div className="flex gap-2 p-1.5 bg-slate-50 border border-slate-100 rounded-2xl shrink-0">
                  {[
                    { id: "stats", label: "營業統計備份", sub: "Legacy Analytics" },
                    { id: "full", label: "一鍵全庫備份", sub: "Full Backup" },
                    { id: "restore", label: "一鍵數據還原", sub: "Data Restore" }
                  ].map(tab => (
                     <button
                       key={tab.id}
                       disabled={isRestoring}
                       onClick={() => setBackupTab(tab.id as any)}
                       className={`flex-1 py-3 rounded-xl flex flex-col items-center justify-center transition-all ${backupTab === tab.id ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100/50'}`}
                     >
                        <span className="text-xs font-black leading-none">{tab.label}</span>
                        <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${backupTab === tab.id ? 'text-indigo-300' : 'text-slate-300'}`}>{tab.sub}</span>
                     </button>
                  ))}
               </div>

               {/* TAB 1: 營業統計分析備份 */}
               {backupTab === "stats" && (
                 <div className="flex-1 flex flex-col gap-5 overflow-hidden">
                    {/* Timeframe Selector */}
                    <div className="space-y-2.5 shrink-0">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">選擇統計備份時間範圍 (Timeframe)</label>
                       <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                          {[
                            { label: "今日", val: "day" },
                            { label: "本週", val: "week" },
                            { label: "本月", val: "month" },
                            { label: "本季", val: "quarter" },
                            { label: "半年", val: "half-year" },
                            { label: "一年", val: "year" },
                            { label: "歷史所有", val: "all" }
                          ].map(item => (
                            <button
                              key={item.val}
                              onClick={() => {
                                setBackupTimeframe(item.val);
                                handleGenerateBackup(item.val);
                              }}
                              className={`py-2 px-0.5 rounded-xl text-[10px] font-black transition-all text-center whitespace-nowrap ${backupTimeframe === item.val ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              {item.label}
                            </button>
                          ))}
                       </div>
                    </div>

                    {isGeneratingBackup ? (
                       <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center gap-4 text-slate-400">
                          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                          <p className="text-xs font-black uppercase tracking-widest">正在從資料庫撈取海量數據並進行業務計算...</p>
                       </div>
                    ) : backupData ? (
                       <div className="flex-1 flex flex-col gap-5 overflow-hidden">
                          {/* Top Metric Cards */}
                          <div className="grid grid-cols-3 gap-4 shrink-0">
                             <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/30 text-center">
                                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-wider block mb-1">營業總額</span>
                                <h4 className="text-lg font-black text-indigo-900 tracking-tight">${backupData.summary.total_revenue.toLocaleString()}</h4>
                             </div>
                             <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/30 text-center">
                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-wider block mb-1">總銷售量</span>
                                <h4 className="text-lg font-black text-emerald-900 tracking-tight">{backupData.summary.total_volume} 件</h4>
                             </div>
                             <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100/30 text-center">
                                <span className="text-[8px] font-black text-amber-400 uppercase tracking-wider block mb-1">有效訂單</span>
                                <h4 className="text-lg font-black text-amber-900 tracking-tight">{backupData.summary.active_orders} 筆</h4>
                             </div>
                          </div>

                          {/* Report Preview */}
                          <div className="flex-1 overflow-y-auto border border-slate-100 rounded-2xl p-5 bg-slate-900 text-slate-200 font-mono text-[9px] leading-relaxed no-scrollbar max-h-[220px] relative shadow-inner">
                             <pre className="whitespace-pre-wrap">{backupData.text_report}</pre>
                          </div>

                          {/* Export Actions */}
                          <div className="grid grid-cols-2 gap-4 shrink-0">
                             <button
                               onClick={() => downloadTextFile(backupData.text_report, `churun_backup_report_${backupTimeframe}_${new Date().toISOString().slice(0, 10)}.txt`)}
                               className="bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 active:scale-95"
                             >
                               📥 下載純文字備份 (.txt)
                             </button>
                             <button
                               onClick={() => downloadJsonFile(backupData, `churun_structured_backup_${backupTimeframe}_${new Date().toISOString().slice(0, 10)}.json`)}
                               className="bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 active:scale-95"
                             >
                               📥 下載結構化數據 (.json)
                             </button>
                          </div>
                       </div>
                    ) : (
                       <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center gap-2 text-slate-300">
                          <Database className="w-12 h-12 mb-2" />
                          <p className="text-xs font-black uppercase tracking-widest">請選取一個時間維度進行導出</p>
                       </div>
                    )}
                 </div>
               )}

               {/* TAB 2: 一鍵全庫備份 */}
               {backupTab === "full" && (
                 <div className="flex-1 flex flex-col gap-5 overflow-hidden">
                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl shrink-0">
                       <p className="text-xs font-bold text-slate-600 leading-relaxed">
                          💡 <span className="font-black text-slate-800">全系統數據庫備份</span> 將封裝雲端資料庫所有的資料表（會員名冊、商品、訂單、優惠券、人事編制、素材快訊等）成一份安全的 JSON 檔案。該檔案可在下方「一鍵數據還原」分頁中隨時重新上傳並 100% 完美還原系統。
                       </p>
                    </div>

                    {!isFullBackingUp && !fullBackupData && (
                       <div className="flex-1 min-h-[250px] flex flex-col items-center justify-center gap-4">
                          <Database className="w-16 h-16 text-slate-200" />
                          <button
                            onClick={handleGenerateFullBackup}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition active:scale-95 flex items-center gap-2"
                          >
                             ⚡ 開始一鍵全資料庫封裝
                          </button>
                       </div>
                    )}

                    {isFullBackingUp && (
                       <div className="flex-1 min-h-[250px] flex flex-col items-center justify-center gap-4 text-slate-400">
                          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                          <p className="text-xs font-black uppercase tracking-widest">正在建立快照，依序封裝所有 Supabase 資料表...</p>
                       </div>
                    )}

                    {!isFullBackingUp && fullBackupData && (
                       <div className="flex-1 flex flex-col gap-5 overflow-hidden">
                          {/* Success Badge */}
                          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-5 py-4 rounded-2xl text-emerald-800 shrink-0">
                             <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                             <div>
                                <p className="text-xs font-black">資料庫一致性快照封裝完成</p>
                                <p className="text-[9px] font-bold text-emerald-600/80 uppercase tracking-widest mt-0.5">DB SNAPSHOT SUCCESSFULLY CREATED AT {fullBackupData.generated_at}</p>
                             </div>
                          </div>

                          {/* Table Counts Summary Grid */}
                          <div className="space-y-2">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">資料表封裝統計 (Table Stats)</p>
                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[160px] overflow-y-auto no-scrollbar">
                                {Object.entries(fullBackupData.table_counts).map(([tbl, count]: any) => (
                                   <div key={tbl} className="bg-slate-50 border border-slate-100/80 p-3 rounded-xl flex justify-between items-center">
                                      <span className="text-[10px] font-black text-slate-500 font-mono">{tbl}</span>
                                      <span className="text-xs font-black text-slate-900 font-mono bg-slate-200/50 px-2 py-0.5 rounded-md">{count} 筆</span>
                                   </div>
                                ))}
                             </div>
                          </div>

                          {/* Download Button */}
                          <button
                            onClick={() => downloadJsonFile(fullBackupData, `churun_full_db_backup_${new Date().toISOString().slice(0, 10)}.json`)}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 active:scale-95 shrink-0"
                          >
                             📥 下載全系統完整備份檔案 (.json)
                          </button>
                       </div>
                    )}
                 </div>
               )}

               {/* TAB 3: 數據匯入與一鍵還原 */}
               {backupTab === "restore" && (
                 <div className="flex-1 flex flex-col gap-5 overflow-hidden">
                    {/* File Uploader */}
                    {!restoreFile && (
                       <label className="flex-1 min-h-[180px] border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 rounded-3rem flex flex-col items-center justify-center gap-3 cursor-pointer transition p-6 text-center">
                          <input type="file" accept=".json" className="hidden" onChange={handleFileChange} />
                          <Database className="w-12 h-12 text-slate-300" />
                          <div>
                             <p className="text-xs font-black text-slate-700">選擇並上傳備份 JSON 檔案</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Select churun_full_db_backup_*.json</p>
                          </div>
                       </label>
                    )}

                    {restoreFile && parsedRestoreData && (
                       <div className="flex-1 flex flex-col gap-5 overflow-hidden">
                          {/* File info and tables check */}
                          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex justify-between items-center shrink-0">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center"><Database className="w-5 h-5" /></div>
                                <div>
                                   <p className="text-xs font-black text-slate-800 line-clamp-1">{restoreFile.name}</p>
                                   <p className="text-[8px] font-black text-indigo-600 uppercase tracking-widest mt-0.5">備份日期：{parsedRestoreData.generated_at || "未知"}</p>
                                </div>
                             </div>
                             <button 
                               disabled={isRestoring}
                               onClick={() => {
                                  setRestoreFile(null);
                                  setParsedRestoreData(null);
                                  setConfirmText("");
                               }}
                               className="text-[9px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 hover:bg-rose-100 transition"
                             >
                               清除重選
                             </button>
                          </div>

                          {/* Strategy selector and Confirm text */}
                          <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4 shrink-0">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">選擇資料庫恢復策略</p>
                             <div className="grid grid-cols-2 gap-3">
                                <label className={`p-4 rounded-xl border flex flex-col gap-1 cursor-pointer transition ${restoreStrategy === "merge" ? "bg-white border-indigo-500 shadow-md" : "bg-slate-100/50 border-slate-200 text-slate-400"}`}>
                                   <input type="radio" name="strategy" value="merge" checked={restoreStrategy === "merge"} onChange={() => setRestoreStrategy("merge")} disabled={isRestoring} className="hidden" />
                                   <span className="text-xs font-black">增量合併還原</span>
                                   <span className="text-[8px] font-bold text-slate-400">保留現有資料，更新並補足衝突項目 (0風險)</span>
                                </label>
                                <label className={`p-4 rounded-xl border flex flex-col gap-1 cursor-pointer transition ${restoreStrategy === "overwrite" ? "bg-white border-rose-500 shadow-md" : "bg-slate-100/50 border-slate-200 text-slate-400"}`}>
                                   <input type="radio" name="strategy" value="overwrite" checked={restoreStrategy === "overwrite"} onChange={() => setRestoreStrategy("overwrite")} disabled={isRestoring} className="hidden" />
                                   <span className="text-xs font-black text-rose-600">完整覆寫還原</span>
                                   <span className="text-[8px] font-bold text-rose-400/80">清空資料庫後完全重設為備份檔狀態 (高風險)</span>
                                </label>
                             </div>

                             {restoreStrategy === "overwrite" && (
                                <div className="space-y-2 border-t border-rose-100 pt-3">
                                   <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest block">⚠️ 授權核准限制</p>
                                   <p className="text-[10px] font-bold text-slate-500">覆寫還原會徹底清空您的 Supabase 資料庫，請在下方輸入大寫 <span className="font-black text-rose-600">CONFIRM RESTORE</span>：</p>
                                   <input
                                     type="text"
                                     disabled={isRestoring}
                                     value={confirmText}
                                     onChange={e => setConfirmText(e.target.value)}
                                     placeholder="請在此輸入 CONFIRM RESTORE"
                                     className="w-full bg-white border border-rose-200 p-3 rounded-xl font-mono text-xs text-rose-600 font-bold focus:ring-2 focus:ring-rose-500/20 outline-none transition"
                                   />
                                </div>
                             )}
                          </div>

                          {/* Execution logs / Terminal console */}
                          {restoreLogs.length > 0 && (
                             <div className="flex-1 bg-slate-950 border border-slate-900 rounded-2xl p-4 font-mono text-[9px] text-emerald-400 overflow-y-auto no-scrollbar max-h-[140px] shadow-inner space-y-1">
                                {restoreLogs.map((lg, idx) => (
                                   <div key={idx} className="leading-relaxed whitespace-pre-wrap">{lg}</div>
                                ))}
                             </div>
                          )}

                          {/* Restore Button */}
                          <button
                            disabled={isRestoring || (restoreStrategy === "overwrite" && confirmText !== "CONFIRM RESTORE")}
                            onClick={handleExecuteRestore}
                            className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-3 shadow-lg active:scale-95 shrink-0 ${isRestoring ? "bg-slate-200 text-slate-400 cursor-not-allowed" : restoreStrategy === "overwrite" ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/10" : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/10"}`}
                          >
                             {isRestoring ? (
                                <>
                                   <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> 還原程序執行中，請絕對不要關閉視窗...
                                </>
                             ) : (
                                <>
                                   🔥 一鍵執行雲端資料還原
                                </>
                             )}
                          </button>
                       </div>
                    )}
                 </div>
               )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Initializing HQ...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
