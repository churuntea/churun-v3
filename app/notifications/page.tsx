"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell,
  ArrowLeft,
  CheckCircle2,
  Info,
  AlertCircle,
  Clock,
  Trash2,
  ChevronRight,
  Loader2,
  Sparkles,
  Zap,
  ShoppingBag,
  Users
} from "lucide-react";

function NotificationsContent() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    fetchNotifications(savedId);
  }, [router]);

  const fetchNotifications = async (userId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("member_id", userId)
      .order("created_at", { ascending: false });
    
    if (!error) setNotifications(data || []);
    setIsLoading(false);

    // Auto mark all as read
    if (data && data.some(n => !n.is_read)) {
      await supabase.from("notifications").update({ is_read: true }).eq("member_id", userId);
    }
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (!error) {
      setNotifications(notifications.filter(n => n.id !== id));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "order_status": return <ShoppingBag className="w-5 h-5 text-blue-500" />;
      case "team_join": return <Users className="w-5 h-5 text-indigo-500" />;
      case "bonus": return <Sparkles className="w-5 h-5 text-amber-500" />;
      case "system": return <Info className="w-5 h-5 text-emerald-500" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case "order_status": return "bg-blue-50";
      case "team_join": return "bg-indigo-50";
      case "bonus": return "bg-amber-50";
      case "system": return "bg-emerald-50";
      default: return "bg-slate-50";
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-50 px-8 py-6 flex items-center gap-6 max-w-lg mx-auto">
        <Link href="/" className="p-2 hover:bg-slate-50 rounded-full transition">
           <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div className="flex-1">
           <h1 className="text-sm font-black tracking-[0.3em] text-slate-800 uppercase">消息通知中心</h1>
           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Notification Center</p>
        </div>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-6 mt-4 pb-32">
        
        <div className="flex justify-between items-center px-4">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">最近消息 ({notifications.length})</h3>
           <button onClick={() => fetchNotifications(localStorage.getItem("churun_member_id")!)} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">重新整理</button>
        </div>

        <div className="space-y-4">
           {isLoading ? (
             <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-200" /></div>
           ) : notifications.length === 0 ? (
             <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-50 shadow-sm">
                <Bell className="w-12 h-12 text-slate-100 mx-auto mb-6" />
                <h4 className="text-sm font-black text-slate-300 uppercase tracking-widest">目前尚無任何消息</h4>
                <p className="text-[10px] text-slate-200 mt-2 leading-relaxed uppercase">Stay tuned for updates from Churun</p>
             </div>
           ) : (
             <AnimatePresence>
               {notifications.map((n, i) => (
                 <motion.div 
                   key={n.id}
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   transition={{ delay: i * 0.05 }}
                   className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm relative overflow-hidden group hover:border-emerald-100 transition-all duration-300"
                 >
                    <div className="flex gap-6">
                       <div className={`w-14 h-14 ${getBg(n.type)} rounded-2xl flex items-center justify-center shadow-inner flex-shrink-0`}>
                          {getIcon(n.type)}
                       </div>
                       <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-start">
                             <h4 className="font-black text-slate-800 leading-snug">{n.title}</h4>
                             {!n.is_read && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>}
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed font-medium">{n.content}</p>
                          <div className="flex justify-between items-center pt-4">
                             <div className="flex items-center gap-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                <Clock className="w-3 h-3" />
                                {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </div>
                             <button 
                               onClick={() => deleteNotification(n.id)}
                               className="p-2 text-slate-100 hover:text-rose-500 transition-colors"
                             >
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                       </div>
                    </div>
                 </motion.div>
               ))}
             </AnimatePresence>
           )}
        </div>

        {/* Feature Teaser */}
        <section className="bg-slate-900 rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20 mt-12">
           <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-emerald-500 rounded-full blur-[100px] opacity-20"></div>
           <div className="relative z-10 flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 rounded-[2rem] flex items-center justify-center">
                 <Sparkles className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                 <h4 className="text-lg font-black tracking-tight">專屬邀請計畫即將推出</h4>
                 <p className="text-[10px] text-white/50 leading-relaxed uppercase tracking-widest mt-1">Unlock more rewards as you grow your team.</p>
              </div>
           </div>
        </section>

      </main>

    </div>
  );
}

export default function Notifications() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>}>
      <NotificationsContent />
    </Suspense>
  );
}
