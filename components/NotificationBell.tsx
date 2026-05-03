"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  X, 
  ShoppingBag, 
  UserPlus, 
  CreditCard, 
  Info,
  CheckCircle2,
  Clock
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'order' | 'withdrawal' | 'referral' | 'system';
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell({ memberId }: { memberId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (memberId) {
      fetchNotifications();
      // Polling every 60 seconds
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [memberId]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?memberId=${memberId}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n: Notification) => !n.is_read).length);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, markAllAsRead: true })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingBag className="w-4 h-4 text-emerald-500" />;
      case 'referral': return <UserPlus className="w-4 h-4 text-indigo-500" />;
      case 'withdrawal': return <CreditCard className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTimeLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} 分鐘前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} 小時前`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center relative shadow-sm border border-slate-50 hover:bg-slate-50 transition active:scale-95 z-10"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-emerald-600' : 'text-slate-400'}`} />
        {unreadCount > 0 && (
          <span className="absolute top-3 right-3 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce pointer-events-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[60] bg-slate-900/10 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10, x: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute right-0 top-16 w-[320px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 z-[70] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">系統通知</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest"
                  >
                    全部已讀
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                {notifications.length === 0 ? (
                  <div className="py-16 text-center space-y-4">
                     <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                        <Bell className="w-8 h-8 text-slate-200" />
                     </div>
                     <p className="text-xs font-bold text-slate-400">目前尚無通知</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => !n.is_read && markAsRead(n.id)}
                        className={`p-6 hover:bg-slate-50/80 transition cursor-pointer relative group ${!n.is_read ? 'bg-indigo-50/20' : ''}`}
                      >
                        {!n.is_read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-full" />}
                        <div className="flex gap-4">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${!n.is_read ? 'bg-white' : 'bg-slate-50'}`}>
                            {getIcon(n.type)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                               <p className={`text-xs font-black ${!n.is_read ? 'text-slate-900' : 'text-slate-500'}`}>{n.title}</p>
                               <span className="text-[8px] font-bold text-slate-300 flex items-center gap-1"><Clock className="w-2 h-2" /> {getTimeLabel(n.created_at)}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                              {n.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-100">
                 <button onClick={() => setIsOpen(false)} className="w-full py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition shadow-sm">
                    關閉視窗
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
