"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Package,
  Search,
  Trash2,
  XCircle,
  User,
  DollarSign,
  Truck,
  Loader2,
  FileText
} from "lucide-react";
import Link from "next/link";

export default function DeletedOrdersPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<"cancelled" | "deleted">("cancelled");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [cancelledOrders, setCancelledOrders] = useState<any[]>([]);
  const [deletedBackups, setDeletedBackups] = useState<any[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const auth = sessionStorage.getItem("churun_admin_auth");
    if (auth !== "true") {
      router.replace("/admin");
      return;
    }
    setIsAdmin(true);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch cancelled orders from standard orders table
      const { data: ords, error: ordsError } = await supabase
        .from("orders")
        .select(`
          *,
          members (
            name,
            phone,
            member_code
          ),
          order_items (
            name,
            quantity,
            price
          )
        `)
        .eq("status", "cancelled")
        .order("created_at", { ascending: false });

      if (ordsError) throw ordsError;

      // Unpack fallback JSON if present (similar to standard page)
      const processedCancelled = (ords || []).map((order: any) => {
        if (order.custom_logo_url && order.custom_logo_url.startsWith('FALLBACK_JSON:')) {
          try {
            const fallbackData = JSON.parse(order.custom_logo_url.substring('FALLBACK_JSON:'.length));
            return {
              ...order,
              ...fallbackData
            };
          } catch (e) {
            console.error("解析備份 JSON 欄位失敗:", e);
          }
        }
        return order;
      });
      setCancelledOrders(processedCancelled);

      // 2. Fetch deleted order backups from announcements table
      const { data: annons, error: annonsError } = await supabase
        .from("announcements")
        .select("*")
        .eq("tag", "DELETED")
        .order("created_at", { ascending: false });

      if (annonsError) throw annonsError;

      const processedDeleted = (annons || []).map((ann: any) => {
        try {
          const backupObj = JSON.parse(ann.content);
          return {
            id: ann.id,
            title: ann.title,
            created_at: ann.created_at, // backup creation date
            ...backupObj
          };
        } catch (e) {
          console.error("解析備份訂單 JSON 失敗:", e);
          return {
            id: ann.id,
            title: ann.title,
            created_at: ann.created_at,
            order_number: ann.title.replace("[DELETED_ORDER]: ", ""),
            parseError: true
          };
        }
      });
      setDeletedBackups(processedDeleted);

    } catch (err) {
      console.error("載入廢棄訂單資料失敗:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredData = () => {
    const list = activeTab === "cancelled" ? cancelledOrders : deletedBackups;
    if (!searchTerm.trim()) return list;

    const term = searchTerm.toLowerCase();
    return list.filter((order: any) => {
      const orderNum = (order.order_number || order.order_id || order.id || "").toLowerCase();
      const memName = (order.members?.name || order.member?.name || "").toLowerCase();
      const memPhone = (order.members?.phone || order.member?.phone || "").toLowerCase();
      const tracking = (order.tracking_number || "").toLowerCase();
      
      return (
        orderNum.includes(term) ||
        memName.includes(term) ||
        memPhone.includes(term) ||
        tracking.includes(term)
      );
    });
  };

  if (!isAdmin) return null;

  const displayList = getFilteredData();

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 pb-20">
      {/* Top Header */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 px-8 py-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/admin/orders" className="p-2 hover:bg-slate-50 rounded-full transition">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-xl font-black tracking-tight">廢棄訂單查詢中心</h1>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">
              Trash & Cancelled Orders Inquiry
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="p-3 bg-slate-100 text-slate-400 rounded-[1.5rem] hover:text-indigo-600 hover:bg-indigo-50 transition"
            title="重新整理"
          >
            <Clock className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-10 space-y-10">
        {/* Top Announcement/Tip */}
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2.5rem] shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 bg-rose-500/10 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-rose-800">關於廢棄訂單的資料來源</h3>
            <p className="text-xs text-rose-600/90 mt-1 leading-relaxed">
              <strong>已取消訂單</strong> 為保留在資料庫中但狀態設為 <code>cancelled</code> 的訂單，可執行對帳及取消還原。<br />
              <strong>已物理刪除訂單</strong> 為執行永久物理刪除前，由系統完整序列化為 JSON 備份至公告表 (<code>announcements</code>，標籤為 <code>DELETED</code>) 的檔案。您可以在此分頁一鍵查詢並展開其完整的歷史明細與寄送地址。
            </p>
          </div>
        </div>

        {/* Search & Tabs Bar */}
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
          <div className="w-full md:w-96 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            <input
              type="text"
              placeholder="搜尋單號、會員姓名、電話..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-100 p-4 pl-16 rounded-[2rem] text-xs font-bold focus:ring-2 focus:ring-rose-500/5 transition shadow-sm focus:outline-none"
            />
          </div>
          
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-[2rem] w-full md:w-auto">
            <button
              onClick={() => {
                setActiveTab("cancelled");
                setExpandedOrderId(null);
              }}
              className={`flex-1 md:flex-initial px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2 ${
                activeTab === "cancelled"
                  ? "bg-white text-slate-900 shadow-md"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <XCircle className="w-4 h-4 text-rose-500" />
              已取消訂單 ({cancelledOrders.length})
            </button>
            <button
              onClick={() => {
                setActiveTab("deleted");
                setExpandedOrderId(null);
              }}
              className={`flex-1 md:flex-initial px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2 ${
                activeTab === "deleted"
                  ? "bg-white text-slate-900 shadow-md"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              已物理刪除備份 ({deletedBackups.length})
            </button>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-[3rem] border border-slate-50 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-6 pl-8">訂單日期 / 廢棄單號</th>
                <th className="p-6">會員/訂購人資訊</th>
                <th className="p-6 text-right">結帳實付金額</th>
                <th className="p-6 text-center">原狀態 / 物流方式</th>
                <th className="p-6 text-right pr-8">動作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-rose-500 mx-auto" />
                  </td>
                </tr>
              ) : displayList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Package className="w-8 h-8 text-slate-200" />
                    </div>
                    <p className="text-sm font-bold text-slate-400">目前沒有符合條件的廢棄訂單</p>
                  </td>
                </tr>
              ) : (
                displayList.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString() : "未知";
                  const orderNum = order.order_number || order.order_id || order.id || "未知單號";
                  
                  const memberName = order.members?.name || order.member?.name || "未知會員";
                  const memberPhone = order.members?.phone || order.member?.phone || "無電話";
                  const memberCode = order.members?.member_code || order.member?.member_code || "無代碼";
                  
                  const amount = order.total_amount !== undefined ? order.total_amount : 0;
                  const isB2B = order.members?.is_b2b || order.member?.is_b2b || false;

                  return (
                    <React.Fragment key={order.id}>
                      <tr
                        className="hover:bg-slate-50/50 transition cursor-pointer"
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      >
                        <td className="p-6 pl-8">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 ${activeTab === 'cancelled' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'} rounded-xl flex items-center justify-center shrink-0`}>
                              <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800">{orderDate}</p>
                              <p className="text-[10px] font-bold text-slate-400 font-mono mt-0.5">
                                {orderNum.length > 20 ? `編號: ${orderNum.substring(0, 12)}...` : `編號: ${orderNum}`}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-black text-slate-800">{memberName}</span>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${isB2B ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                {isB2B ? "B2B 夥伴" : "B2C 會員"}
                              </span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400">
                              {memberPhone} • {memberCode}
                            </p>
                          </div>
                        </td>
                        <td className="p-6 text-right">
                          <p className="text-sm font-black text-slate-800">${Number(amount).toLocaleString()}</p>
                          <p className="text-[9px] text-slate-400 font-bold mt-0.5">原價: ${Number(order.original_amount || amount).toLocaleString()}</p>
                        </td>
                        <td className="p-6 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded-[6px] text-[9px] font-black uppercase tracking-wider">
                              {order.status === "cancelled" ? "已取消" : `原狀態: ${order.status || "待確認"}`}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {order.shipping_info?.method || "自取 / 未指定"}
                            </span>
                          </div>
                        </td>
                        <td className="p-6 text-right pr-8" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                            className="p-2.5 bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition flex items-center justify-center gap-1.5 ml-auto text-[10px] font-bold"
                          >
                            明細
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Detail View */}
                      {isExpanded && (
                        <tr className="bg-slate-50/20 border-b border-slate-50">
                          <td colSpan={5} className="p-6 pl-8 pr-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Left Card: Order Items list */}
                              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-3">
                                  <Package className="w-4 h-4 text-slate-400" />
                                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    訂購商品明細
                                  </h4>
                                </div>
                                <div className="space-y-3">
                                  {order.order_items && order.order_items.length > 0 ? (
                                    order.order_items.map((item: any, idx: number) => (
                                      <div key={idx} className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-slate-700">{item.name}</span>
                                        <div className="flex gap-4 shrink-0">
                                          <span className="text-slate-400 font-bold">x{item.quantity}</span>
                                          <span className="font-black text-slate-800">${item.price}</span>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs text-slate-400">無商品明細</p>
                                  )}
                                  
                                  {order.notes && (
                                    <div className="mt-4 pt-3 border-t border-slate-50">
                                      <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">
                                        訂單備註
                                      </p>
                                      <p className="text-xs font-bold text-slate-600">{order.notes}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right Card: Shipping Info */}
                              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-3">
                                  <Truck className="w-4 h-4 text-slate-400" />
                                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    收件與配送資訊
                                  </h4>
                                </div>
                                {order.shipping_info ? (
                                  <div className="space-y-2 text-xs leading-relaxed">
                                    <p className="flex justify-between">
                                      <span className="text-slate-400">配送方式:</span>
                                      <span className="font-black text-slate-800 bg-slate-50 px-2 py-0.5 rounded">
                                        {order.shipping_info.method || "未指定"}
                                      </span>
                                    </p>
                                    <p className="flex justify-between">
                                      <span className="text-slate-400">收件姓名:</span>
                                      <span className="font-black text-slate-800">{order.shipping_info.name}</span>
                                    </p>
                                    <p className="flex justify-between">
                                      <span className="text-slate-400">收件電話:</span>
                                      <span className="font-black text-slate-800 font-mono">{order.shipping_info.phone}</span>
                                    </p>
                                    <p className="flex flex-col gap-1 mt-1.5">
                                      <span className="text-slate-400">收件地址/店名店號:</span>
                                      <span className="font-black text-slate-800 bg-slate-50/50 p-2.5 rounded border border-slate-100/50">
                                        {order.shipping_info.address || "自取據點"}
                                      </span>
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-400">無收件資訊</p>
                                )}

                                {/* Backup Details Info */}
                                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[10px] text-slate-400">
                                  {activeTab === "deleted" ? (
                                    <>
                                      <p className="flex justify-between font-bold">
                                        <span>🗑️ 物理刪除時間:</span>
                                        <span className="text-slate-600">{order.deleted_at ? new Date(order.deleted_at).toLocaleString() : "未知"}</span>
                                      </p>
                                      <p className="flex justify-between font-bold">
                                        <span>原單庫存狀態:</span>
                                        <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">物理刪除已完成庫存回滾</span>
                                      </p>
                                    </>
                                  ) : (
                                    <>
                                      <p className="flex justify-between font-bold">
                                        <span>⏳ 訂單取消時間:</span>
                                        <span className="text-slate-600">{order.updated_at ? new Date(order.updated_at).toLocaleString() : "未知"}</span>
                                      </p>
                                      {order.auditor && (
                                        <p className="flex justify-between font-bold">
                                          <span>審核取消人:</span>
                                          <span className="text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">{order.auditor}</span>
                                        </p>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
