"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, 
  Search, 
  Filter, 
  ChevronRight, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MoreVertical,
  Loader2,
  Calendar,
  DollarSign,
  User,
  ExternalLink,
  Truck,
  Download,
  Printer,
} from "lucide-react";
import Link from "next/link";
import { supabaseAdmin } from "@/app/supabase-admin";
import { exportToCsv } from "@/utils/exportCsv";

const CARRIERS = [
  { name: "自取", url: null },
  { name: "郵局", url: (num: string) => `https://postserv.post.gov.tw/pstmail/seek_result.jsp?q_mail_no=${num}` },
  { name: "7-11", url: (num: string) => `https://eservice.7-11.com.tw/e-tracking/search.aspx?type=1&sn=${num}` },
  { name: "全家", url: (num: string) => `https://www.famiport.com.tw/Web_Famiport/page/process.aspx?item=${num}` },
  { name: "蝦皮店到店", url: (num: string) => `https://shopee.tw/track/${num}` }
];

const getCarrierTrackingInfo = (trackingStr: string) => {
  if (!trackingStr) return { carrierName: "自取", trackingNum: "" };
  if (trackingStr.includes(": ")) {
    const parts = trackingStr.split(": ");
    return { carrierName: parts[0], trackingNum: parts[1] };
  }
  return { carrierName: "自取", trackingNum: trackingStr };
};

const handleOpenTrackingLink = (trackingStr: string) => {
  const { carrierName, trackingNum } = getCarrierTrackingInfo(trackingStr);
  if (!trackingNum) return;
  const carrier = CARRIERS.find(c => c.name === carrierName);
  if (carrier && carrier.url) {
    window.open(carrier.url(trackingNum), "_blank");
  } else {
    alert("自取或此物流不支援線上軌跡查詢");
  }
};

const isToday = (dateStr: string) => {
  if (!dateStr) return false;
  const today = new Date().toDateString();
  return new Date(dateStr).toDateString() === today;
};

const isThisMonth = (dateStr: string) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

function AdminOrdersContent() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showBulkShipModal, setShowBulkShipModal] = useState(false);
  const [bulkShipData, setBulkShipData] = useState<Record<string, { carrier: string; trackingNum: string }>>({});
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectedCarriers, setSelectedCarriers] = useState<Record<string, string>>({});

  // 自取點管理狀態與載入
  const [showPickupPointsModal, setShowPickupPointsModal] = useState(false);
  const [pickupPoints, setPickupPoints] = useState<any[]>([]);
  const [editingPickupPointId, setEditingPickupPointId] = useState<string | null>(null);
  const [pickupForm, setPickupForm] = useState({
    name: "",
    contact_person: "",
    phone: "",
    address: "",
    notes: ""
  });
  const [isSavingPickupPoint, setIsSavingPickupPoint] = useState(false);

  const fetchPickupPoints = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("title", "[SYSTEM_PICKUP_POINTS]");

      if (error) throw error;

      const singleData = data && data.length > 0 ? data[0] : null;

      if (singleData && singleData.content) {
        try {
          const parsed = JSON.parse(singleData.content);
          if (Array.isArray(parsed)) {
            setPickupPoints(parsed);
            return;
          }
        } catch (e) {
          console.error("解析自取點 JSON 失敗:", e);
        }
      }

      // 預設備份
      const defaultPoints = [
        { id: "caotun", name: "草屯自由總店", address: "南投縣草屯鎮自由街34號", contact_person: "陳總經理", phone: "0939734771", notes: "營業時間：09:00 - 21:00" },
        { id: "daye", name: "台中大業店", address: "台中市南屯區大業路234號", contact_person: "台中店長", phone: "04-23214567", notes: "營業時間：10:00 - 22:00" },
        { id: "caotun_b2c", name: "南投草屯自取點", address: "南投縣草屯鎮草鞋墩一街 (請聯繫總部預約自取)", contact_person: "草屯客服", phone: "聯絡總部辦理", notes: "請先致電客服預約" },
        { id: "xinzhuang_b2c", name: "新北新莊自取點", address: "新北市新莊區中正路 (請聯繫總部預約自取)", contact_person: "新莊客服", phone: "聯絡總部辦理", notes: "請先致電客服預約" },
        { id: "wugu_b2c", name: "新北五股自取點", address: "新北市五股區成泰路 (請聯繫總部預約自取)", contact_person: "五股客服", phone: "聯絡總部辦理", notes: "請先致電客服預約" },
        { id: "xinyi_b2c", name: "台北信義自取點", address: "台北市信義區松山路 (請聯繫總部預約自取)", contact_person: "信義客服", phone: "聯絡總部辦理", notes: "請先致電客服預約" }
      ];

      await supabase
        .from("announcements")
        .insert({
          title: "[SYSTEM_PICKUP_POINTS]",
          tag: "SYSTEM",
          content: JSON.stringify(defaultPoints),
          color: "bg-emerald-900"
        });

      setPickupPoints(defaultPoints);
    } catch (err) {
      console.error("載入自取點失敗:", err);
    }
  };

  const handleSavePickupPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupForm.name || !pickupForm.address) {
      alert("據點名稱與地址為必填欄位！");
      return;
    }

    setIsSavingPickupPoint(true);
    try {
      let updatedPoints = [...pickupPoints];
      if (editingPickupPointId) {
        updatedPoints = updatedPoints.map(pt => 
          pt.id === editingPickupPointId 
            ? { ...pt, ...pickupForm } 
            : pt
        );
      } else {
        const newPoint = {
          id: Math.random().toString(36).substring(2, 9),
          ...pickupForm
        };
        updatedPoints.push(newPoint);
      }

      const { error } = await supabase
        .from("announcements")
        .update({ content: JSON.stringify(updatedPoints) })
        .eq("title", "[SYSTEM_PICKUP_POINTS]");

      if (error) throw error;

      setPickupPoints(updatedPoints);
      setPickupForm({ name: "", contact_person: "", phone: "", address: "", notes: "" });
      setEditingPickupPointId(null);
      alert("🎉 自取地點儲存成功！");
    } catch (err: any) {
      alert("儲存自取地點失敗: " + err.message);
    } finally {
      setIsSavingPickupPoint(false);
    }
  };

  const handleDeletePickupPoint = async (id: string) => {
    if (!confirm("確定要刪除此自取地點嗎？")) return;
    
    setIsSavingPickupPoint(true);
    try {
      const updatedPoints = pickupPoints.filter(pt => pt.id !== id);
      const { error } = await supabase
        .from("announcements")
        .update({ content: JSON.stringify(updatedPoints) })
        .eq("title", "[SYSTEM_PICKUP_POINTS]");

      if (error) throw error;

      setPickupPoints(updatedPoints);
      alert("🎉 自取地點刪除成功！");
    } catch (err: any) {
      alert("刪除自取地點失敗: " + err.message);
    } finally {
      setIsSavingPickupPoint(false);
    }
  };

  useEffect(() => {
    const auth = sessionStorage.getItem("churun_admin_auth");
    if (auth !== "true") {
      router.replace("/admin");
      return;
    }
    setIsAdmin(true);
    fetchOrders();
    fetchPickupPoints();
  }, [router]);

  const handlePrintPackingSlip = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const itemsHtml = order.order_items ? order.order_items.map((item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">x${item.quantity}</td>
      </tr>
    `).join('') : '<tr><td colspan="2" style="padding: 12px; text-align: center;">無商品明細</td></tr>';

    const shipping = order.shipping_info || {};
    
    printWindow.document.write(`
      <html>
        <head>
          <title>初潤製茶所 - 出貨單/揀貨單</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #333; padding: 40px; }
            .header { text-align: center; margin-bottom: 40px; }
            .title { font-size: 24px; font-weight: 900; letter-spacing: 2px; }
            .subtitle { font-size: 12px; color: #666; margin-top: 5px; }
            .info-grid { display: grid; grid-cols: 2; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .info-box { border: 1px solid #eee; padding: 20px; border-radius: 12px; }
            .info-title { font-size: 10px; font-weight: 900; color: #999; text-transform: uppercase; margin-bottom: 10px; }
            .info-value { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f9f9f9; padding: 12px; text-align: left; font-size: 12px; color: #666; border-bottom: 2px solid #eee; }
            .notes { margin-top: 30px; border-left: 4px solid #f59e0b; padding-left: 15px; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <span style="font-weight: bold; font-size: 12px; color: #999;">訂單編號: ${order.order_number || order.id}</span>
            <button onclick="window.print()" style="background: #111827; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer;">列印此單</button>
          </div>
          <div class="header">
            <div class="title">初 潤 製 茶 所</div>
            <div class="subtitle">出 貨 單 & 揀 貨 明 細</div>
          </div>
          <div class="info-grid" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px;">
            <div class="info-box">
              <div class="info-title">收件人資訊</div>
              <div class="info-value">姓名: ${shipping.name || order.members?.name || '無'}</div>
              <div class="info-value">電話: ${shipping.phone || order.members?.phone || '無'}</div>
              <div class="info-value">方式: ${shipping.method || '宅配到府'}</div>
              <div class="info-value" style="margin-top: 10px;">地址: ${shipping.address || '自取/無'}</div>
            </div>
            <div class="info-box">
              <div class="info-title">寄件人資訊</div>
              <div class="info-value">姓名: ${shipping.sender_name || shipping.senderName || '初潤製茶所'}</div>
              <div class="info-value">電話: ${shipping.sender_phone || shipping.senderPhone || '0939734771'}</div>
              <div class="info-value" style="margin-top: 10px;">地址: ${shipping.sender_address || shipping.senderAddress || '南投縣草屯鎮自由街34號'}</div>
              ${(shipping.sender_notes || shipping.senderNotes) ? `
                <div class="info-value" style="margin-top: 8px; color: #dc2626; font-size: 11px;">
                  備註: ${shipping.sender_notes || shipping.senderNotes}
                </div>
              ` : ''}
            </div>
            <div class="info-box">
              <div class="info-title">訂單資訊</div>
              <div class="info-value">訂單日期: ${new Date(order.created_at).toLocaleString()}</div>
              <div class="info-value">結帳金額: ${order.total_amount}</div>
              <div class="info-value">匯款姓名: ${order.remitter_name || '無'}</div>
              <div class="info-value">匯款銀行: ${order.remitter_bank || '無'}</div>
              <div class="info-value">付款末五碼: ${order.payment_last_five || '無'}</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="text-align: left;">商品品名</th>
                <th style="width: 100px; text-align: center;">數量</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          ${order.notes ? `
            <div class="notes">
              <div class="info-title">備註說明</div>
              <div style="font-size: 13px; font-weight: bold;">${order.notes}</div>
            </div>
          ` : ''}
          
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleBatchApprove = async () => {
    if (selectedOrderIds.length === 0) return;
    if (!confirm(`確定要批量核對並同意這 ${selectedOrderIds.length} 筆訂單的付款嗎？`)) return;
    setIsLoading(true);
    try {
      for (const orderId of selectedOrderIds) {
        await fetch('/api/orders/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId })
        });
      }
      setSelectedOrderIds([]);
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("部分訂單核對失敗");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchShip = async () => {
    if (selectedOrderIds.length === 0) return;
    if (!confirm(`確定要把這 ${selectedOrderIds.length} 筆訂單標記為已出貨嗎？`)) return;
    setIsLoading(true);
    try {
      const payload = selectedOrderIds.map(id => ({ orderId: id, status: 'shipped' }));
      const res = await fetch('/api/orders/ship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: payload })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || '批量出貨失敗');
      setSelectedOrderIds([]);
      fetchOrders();
      alert(data.message || "批量出貨成功！");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "批量出貨失敗");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintCombinedPickingList = () => {
    if (selectedOrderIds.length === 0) return;
    const selectedOrders = orders.filter(o => selectedOrderIds.includes(o.id));
    
    const totals: any = {};
    selectedOrders.forEach(o => {
      if (o.order_items) {
        o.order_items.forEach((item: any) => {
          totals[item.name] = (totals[item.name] || 0) + item.quantity;
        });
      }
    });
    
    const summaryHtml = Object.entries(totals).map(([name, qty]) => `
      <tr style="font-size: 16px; border-bottom: 2px solid #ddd;">
        <td style="padding: 15px 12px; font-weight: 900; color: #111;">${name}</td>
        <td style="padding: 15px 12px; text-align: center; font-weight: 900; color: #b45309; font-size: 20px;">${qty}</td>
      </tr>
    `).join('');
    
    const detailedHtml = selectedOrders.map(o => {
      const shipping = o.shipping_info || {};
      const items = o.order_items ? o.order_items.map((i: any) => `${i.name} x${i.quantity}`).join(', ') : '無';
      return `
        <tr style="font-size: 12px; border-bottom: 1px solid #eee;">
          <td style="padding: 10px 8px; font-weight: bold; font-family: monospace;">${o.order_number || o.id.substring(0,8)}</td>
          <td style="padding: 10px 8px;">
            <div style="font-weight: bold;">${shipping.name || o.members?.name || '無'}</div>
            ${shipping.sender_name ? `<div style="font-size: 10px; color: #d97706; margin-top: 4px; font-weight: 900;">指定寄件: ${shipping.sender_name}</div>` : ''}
          </td>
          <td style="padding: 10px 8px;">${shipping.phone || o.members?.phone || '無'}</td>
          <td style="padding: 10px 8px; font-weight: bold; color: #047857;">${shipping.method || '宅配到府'}</td>
          <td style="padding: 10px 8px; font-size: 11px; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${shipping.address || '自取'}</td>
          <td style="padding: 10px 8px; font-weight: bold;">${items}</td>
        </tr>
      `;
    }).join('');
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>初潤製茶所 - 總部合併揀貨出貨單</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #333; padding: 40px; }
            .header { text-align: center; margin-bottom: 40px; }
            .title { font-size: 26px; font-weight: 900; letter-spacing: 2px; }
            .subtitle { font-size: 12px; color: #666; margin-top: 5px; }
            .section-title { font-size: 14px; font-weight: 900; text-transform: uppercase; margin-top: 40px; margin-bottom: 15px; border-left: 5px solid #111827; padding-left: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #f3f4f6; padding: 12px; text-align: left; font-size: 12px; color: #4b5563; border-bottom: 2px solid #e5e7eb; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <span style="font-weight: bold; font-size: 12px; color: #999;">合併揀貨單 (共 ${selectedOrders.length} 筆訂單)</span>
            <button onclick="window.print()" style="background: #111827; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">立即列印</button>
          </div>
          <div class="header">
            <div class="title">初 潤 製 茶 所</div>
            <div class="subtitle">總 部 合 併 揀 貨 出 貨 單</div>
          </div>
          
          <div class="section-title">📦 第一步：倉庫總揀貨清單 (商品總計)</div>
          <table>
            <thead>
              <tr>
                <th style="text-align: left; font-size: 14px;">商品品名</th>
                <th style="width: 150px; text-align: center; font-size: 14px;">應揀貨總數量</th>
              </tr>
            </thead>
            <tbody>
              ${summaryHtml}
            </tbody>
          </table>
          
          <div class="section-title">🚚 第二步：分單配送明細</div>
          <table>
            <thead>
              <tr>
                <th style="width: 80px;">單號末碼</th>
                <th style="width: 80px;">收件人</th>
                <th style="width: 100px;">電話</th>
                <th style="width: 90px;">物流方式</th>
                <th>寄送地址 / 門市</th>
                <th>購買品項</th>
              </tr>
            </thead>
            <tbody>
              ${detailedHtml}
            </tbody>
          </table>
          
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
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
        .order("created_at", { ascending: false });
      
      if (error) throw error;

      // 支援解讀備份在 custom_logo_url 的 JSON 欄位（以解決資料庫未更新到最新欄位時的容錯）
      const processed = (data || []).map((order: any) => {
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

      setOrders(processed);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitBulkShip = async () => {
    setIsLoading(true);
    try {
      const payload = Object.entries(bulkShipData).map(([orderId, data]) => {
        const finalTracking = data.trackingNum ? `${data.carrier}: ${data.trackingNum}` : "";
        return { orderId, status: 'shipped', trackingNumber: finalTracking };
      });
      const res = await fetch('/api/orders/ship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: payload })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || '批量出貨失敗');
      
      setShowBulkShipModal(false);
      setSelectedOrderIds([]);
      fetchOrders();
      alert(data.message || "批量出貨及單號綁定成功！");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "部分訂單更新失敗");
    } finally {
      setIsLoading(false);
    }
  };

  const getAuditorName = () => {
    try {
      const adminStr = sessionStorage.getItem("churun_admin_user");
      if (adminStr) {
        const u = JSON.parse(adminStr);
        return u.name || "系統核對專員";
      }
    } catch (e) {
      console.error(e);
    }
    return "系統核對專員";
  };

  const updateOrderStatus = async (orderId: string, action: 'approve' | 'cancel') => {
    setIsLoading(true);
    try {
      const adminName = getAuditorName();
      const res = await fetch("/api/orders/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, action, auditor: adminName })
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
      } else {
        alert(data.error || "操作失敗");
      }
    } catch (err) {
      console.error(err);
      alert("系統錯誤");
    } finally {
      setIsLoading(false);
    }
  };

  const updateFulfillment = async (orderId: string, status: string, trackingNum?: string) => {
    setIsLoading(true);
    try {
      const payload = [{ orderId, status, trackingNumber: trackingNum }];
      const res = await fetch('/api/orders/ship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: payload })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || '更新出貨狀態失敗');
      fetchOrders();
      alert(data.message || "出貨狀態更新成功！");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "更新出貨狀態失敗");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (filteredOrders.length === 0) return;
    
    const exportData = filteredOrders.map(order => {
      const itemsString = order.order_items ? order.order_items.map((i: any) => `${i.name}x${i.quantity}`).join('; ') : '';
      const shippingString = order.shipping_info ? `收件人:${order.shipping_info.name}, 電話:${order.shipping_info.phone}, 地址:${order.shipping_info.address}${order.shipping_info.notes ? ', 備註:'+order.shipping_info.notes : ''}` : '';
      
      return {
        '訂單日期': new Date(order.created_at).toLocaleDateString(),
        '訂單編號': order.id,
        '會員姓名': order.members?.name || '',
        '會員電話': order.members?.phone || '',
        '購買明細': itemsString,
        '結帳金額': order.total_amount,
        '預計回饋點數': order.reward_points || 0,
        '匯款姓名': order.remitter_name || '',
        '匯款銀行': order.remitter_bank || '',
        '匯款末五碼': order.payment_last_five || '',
        '訂單狀態': order.status === 'completed' ? '已完成' : order.status === 'cancelled' ? '已取消' : '待確認',
        '出貨狀態': order.fulfillment_status === 'shipped' ? '已出貨' : '未出貨',
        '物流單號': order.tracking_number || '',
        '收件資訊': shippingString
      };
    });

    exportToCsv(`初潤_訂單總表_${new Date().toISOString().split('T')[0]}.csv`, exportData);
  };

  const filteredOrders = orders.filter(order => {
    let matchesStatus = true;
    if (filterStatus === "pending") {
      matchesStatus = order.status === "pending";
    } else if (filterStatus === "preparing") {
      matchesStatus = order.status === "completed" && order.fulfillment_status !== "shipped";
    } else if (filterStatus === "shipped") {
      matchesStatus = order.fulfillment_status === "shipped";
    } else if (filterStatus === "cancelled") {
      matchesStatus = order.status === "cancelled";
    }

    let matchesDate = true;
    if (startDate) {
      const sDate = new Date(startDate);
      sDate.setHours(0, 0, 0, 0);
      const oDate = new Date(order.created_at);
      if (oDate < sDate) matchesDate = false;
    }
    if (endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);
      const oDate = new Date(order.created_at);
      if (oDate > eDate) matchesDate = false;
    }

    const matchesSearch = 
      order.members?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.members?.phone?.includes(searchTerm) ||
      order.id?.includes(searchTerm) ||
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.payment_last_five?.includes(searchTerm) ||
      order.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shipping_info?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shipping_info?.phone?.includes(searchTerm) ||
      order.shipping_info?.address?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch && matchesDate;
  });

  // ─── KPI METRICS COMPUTATIONS ───
  const pendingAmount = orders
    .filter(o => o.status === "pending")
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const preparingCount = orders
    .filter(o => o.status === "completed" && o.fulfillment_status !== "shipped")
    .length;

  const shippedTodayCount = orders
    .filter(o => o.fulfillment_status === "shipped" && isToday(o.updated_at || o.created_at))
    .length;

  const monthlyRevenue = orders
    .filter(o => o.status === "completed" && isThisMonth(o.created_at))
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 pb-20">
      {/* Top Header */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 px-8 py-6 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-6">
            <Link href="/admin" className="p-2 hover:bg-slate-50 rounded-full transition">
               <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div>
               <h1 className="text-xl font-black tracking-tight">訂單指揮中心</h1>
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Order Management Console</p>
            </div>
         </div>
         <div className="flex gap-2">
            <button 
               onClick={() => setShowPickupPointsModal(true)} 
               className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-[1.5rem] hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 text-[10px] font-black uppercase tracking-widest"
            >
               📍 自取點管理
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-[1.5rem] hover:bg-indigo-600 transition shadow-lg shadow-indigo-500/20 text-[10px] font-black uppercase tracking-widest">
               <Download className="w-4 h-4" /> 匯出訂單 (CSV)
            </button>
            <button onClick={fetchOrders} className="p-3 bg-slate-100 text-slate-400 rounded-[1.5rem] hover:text-indigo-600 hover:bg-indigo-50 transition">
               <Clock className="w-5 h-5" />
            </button>
         </div>
      </nav>

      <main className="max-w-7xl mx-auto p-10 space-y-10">
         
        {/* ─── DYNAMIC KPI CARDS DISPLAY ─── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {/* Card 1: Pending Cash */}
           <motion.div 
             whileHover={{ y: -5 }}
             className="bg-white/75 backdrop-blur-md border border-slate-100 p-6 rounded-[2.5rem] shadow-sm flex items-center gap-6"
           >
              <div className="w-14 h-14 bg-amber-50 rounded-[1.5rem] flex items-center justify-center text-amber-600 shadow-inner">
                 <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">待核對金額</p>
                 <p className="text-xl font-black text-amber-700 tracking-tight">${pendingAmount.toLocaleString()}</p>
              </div>
           </motion.div>

           {/* Card 2: Paid & Preparing */}
           <motion.div 
             whileHover={{ y: -5 }}
             className="bg-white/75 backdrop-blur-md border border-slate-100 p-6 rounded-[2.5rem] shadow-sm flex items-center gap-6"
           >
              <div className="w-14 h-14 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-blue-600 shadow-inner">
                 <Package className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">備貨中訂單</p>
                 <p className="text-xl font-black text-blue-700 tracking-tight">{preparingCount} 筆</p>
              </div>
           </motion.div>

           {/* Card 3: Shipped Today */}
           <motion.div 
             whileHover={{ y: -5 }}
             className="bg-white/75 backdrop-blur-md border border-slate-100 p-6 rounded-[2.5rem] shadow-sm flex items-center gap-6"
           >
              <div className="w-14 h-14 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center text-indigo-600 shadow-inner">
                 <Truck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">今日已出貨</p>
                 <p className="text-xl font-black text-indigo-700 tracking-tight">{shippedTodayCount} 筆</p>
              </div>
           </motion.div>

           {/* Card 4: Monthly Revenue */}
           <motion.div 
             whileHover={{ y: -5 }}
             className="bg-white/75 backdrop-blur-md border border-slate-100 p-6 rounded-[2.5rem] shadow-sm flex items-center gap-6"
           >
              <div className="w-14 h-14 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-emerald-600 shadow-inner">
                 <DollarSign className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">本月總交易額</p>
                 <p className="text-xl font-black text-emerald-700 tracking-tight">${monthlyRevenue.toLocaleString()}</p>
              </div>
           </motion.div>
        </div>
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-6">
           <div className="flex-1 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input 
                type="text" 
                placeholder="搜尋會員姓名、電話或訂單編號..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-100 p-6 pl-16 rounded-[2rem] text-sm font-bold focus:ring-2 focus:ring-indigo-500/5 transition shadow-sm"
              />
           </div>
           <div className="flex gap-2 p-2 bg-slate-100 rounded-[2rem]">
              {["all", "pending", "preparing", "shipped", "cancelled"].map((s) => (
                <button 
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition ${filterStatus === s ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                >
                   {s === "all" ? "全部" : s === "pending" ? "待對帳 ⏳" : s === "preparing" ? "待出貨 📦" : s === "shipped" ? "已出貨 🚚" : "已取消 ✕"}
                </button>
              ))}
           </div>
         </div>

         {/* 📅 日期查詢與篩選面板 */}
         <div className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm flex flex-col sm:flex-row items-center gap-4 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-2.5 shrink-0">
               <Calendar className="w-4 h-4 text-emerald-600" />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">訂單日期區間查詢</span>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
               <input 
                  type="date" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="bg-slate-50 border border-slate-100/80 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500/10 transition text-slate-700 font-bold focus:outline-none w-full sm:w-44"
               />
               <span className="text-slate-300 font-bold shrink-0">至</span>
               <input 
                  type="date" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="bg-slate-50 border border-slate-100/80 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500/10 transition text-slate-700 font-bold focus:outline-none w-full sm:w-44"
               />
            </div>

            {(startDate || endDate) && (
               <button
                  onClick={() => { setStartDate(""); setEndDate(""); }}
                  className="sm:ml-auto px-5 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100/50 rounded-xl transition text-[9px] font-black uppercase tracking-widest"
               >
                  ✕ 清除日期篩選
               </button>
            )}
         </div>

         {/* Orders Table */}
        <div className="bg-white rounded-[3rem] border border-slate-50 shadow-sm overflow-hidden">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <th className="p-8 w-12 text-center">
                        <input 
                          type="checkbox"
                          checked={selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedOrderIds(filteredOrders.map(o => o.id));
                            } else {
                              setSelectedOrderIds([]);
                            }
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                     </th>
                    <th className="p-8">訂單日期 / 編號</th>
                    <th className="p-8">會員資訊</th>
                    <th className="p-8">匯款對帳資訊</th>
                    <th className="p-8 text-right">結帳金額</th>
                    <th className="p-8 text-right">預計回饋</th>
                    <th className="p-8 text-center">目前狀態</th>
                    <th className="p-8 text-right">操作管理</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {isLoading ? (
                   <tr>
                      <td colSpan={6} className="p-20 text-center">
                         <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                      </td>
                   </tr>
                 ) : filteredOrders.length === 0 ? (
                   <tr>
                      <td colSpan={5} className="p-20 text-center">
                         <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Package className="w-8 h-8 text-slate-200" />
                         </div>
                         <p className="text-sm font-bold text-slate-400">目前沒有符合條件的訂單</p>
                      </td>
                   </tr>
                 ) : (
                   filteredOrders.map((order) => (
                     <React.Fragment key={order.id}>
                       <motion.tr 
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         className="hover:bg-slate-50/50 transition group cursor-pointer"
                         onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                       >
                           <td className="p-8 text-center" onClick={e => e.stopPropagation()}>
                              <input 
                                type="checkbox"
                                checked={selectedOrderIds.includes(order.id)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedOrderIds([...selectedOrderIds, order.id]);
                                  } else {
                                    setSelectedOrderIds(selectedOrderIds.filter(id => id !== order.id));
                                  }
                                }}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                           </td>
                          <td className="p-8">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                 <Calendar className="w-5 h-5" />
                              </div>
                              <div className="space-y-1">
                                 <p className="text-sm font-black text-slate-800">{new Date(order.created_at).toLocaleDateString()}</p>
                                 <p className="text-[10px] font-bold text-slate-400 font-mono">
                                    {order.order_number ? `編號: ${order.order_number}` : `ID: ${order.id.substring(0, 8)}...`}
                                 </p>
                              </div>
                           </div>
                        </td>
                        <td className="p-8">
                           <div className="space-y-1">
                              <p className="text-sm font-black text-slate-800">{order.members?.name}</p>
                              <p className="text-[10px] font-bold text-slate-400">{order.members?.phone}</p>
                           </div>
                        </td>
                        <td className="p-8">
                           {order.payment_last_five ? (
                             <div className="space-y-0.5 text-xs">
                               <p className="font-bold text-slate-700">{order.remitter_name || "未填寫姓名"}</p>
                               <p className="text-[10px] text-slate-500">{order.remitter_bank || "未填寫銀行"}</p>
                               <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-black font-mono inline-block mt-1">末碼: {order.payment_last_five}</span>
                             </div>
                           ) : (
                             <span className="text-[10px] font-black text-slate-200">未回報</span>
                           )}
                        </td>
                        <td className="p-8 text-right">
                           <div className="space-y-1">
                              <p className="text-lg font-black text-slate-900 tracking-tighter">${Number(order.total_amount).toLocaleString()}</p>
                              <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">TWD</p>
                           </div>
                        </td>
                        <td className="p-8 text-right">
                           <div className="space-y-1">
                              {order.reward_points > 0 && <p className="text-sm font-black text-emerald-600">{order.reward_points} pts</p>}
                              {order.b2b_commission > 0 && order.members?.is_b2b && <p className="text-sm font-black text-indigo-600">${Number(order.b2b_commission).toLocaleString()} 退傭</p>}
                              {(!order.reward_points && (!order.b2b_commission || !order.members?.is_b2b)) && <p className="text-sm text-slate-300">-</p>}
                           </div>
                        </td>
                        <td className="p-8 text-center">
                           <div className="flex flex-col items-center gap-2">
                             <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${
                               order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                               order.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                               'bg-rose-50 text-rose-600'
                             }`}>
                                {order.status === 'completed' ? '已付款' :
                                 order.status === 'pending' ? '待付款' : 'Cancelled'}
                             </span>
                             {order.auditor && (
                               <span className="text-[8px] font-bold text-slate-400 block">👤 審核: {order.auditor}</span>
                             )}
                             {order.status === 'completed' && (
                               <span className={`px-4 py-2 rounded-full text-[9px] font-black tracking-widest flex items-center gap-1 ${
                                  order.fulfillment_status === 'shipped' ? 'bg-blue-50 text-blue-600' : order.fulfillment_status === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
                                 order.fulfillment_status === 'processing' ? 'bg-indigo-50 text-indigo-600' :
                                 'bg-slate-100 text-slate-500'
                               }`}>
                                 <Truck className="w-3 h-3" />
                                 {order.fulfillment_status === 'shipped' ? '已出貨' : order.fulfillment_status === 'delivered' ? '已簽收/已取貨' : order.fulfillment_status === 'processing' ? '備貨中' : '未出貨'}
                               </span>
                             )}
                             {order.tracking_number && (
                               <span className="text-[9px] font-mono font-bold text-slate-400">{order.tracking_number}</span>
                             )}
                           </div>
                        </td>
                        <td className="p-8 text-right">
                           <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                              {order.status === 'pending' && (
                                <>
                                  <button 
                                    onClick={() => updateOrderStatus(order.id, 'approve')}
                                    className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-110 transition"
                                    title="確認匯款並發放點數"
                                  >
                                     <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => updateOrderStatus(order.id, 'cancel')}
                                    className="p-3 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20 hover:scale-110 transition"
                                    title="取消訂單"
                                  >
                                     <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              
                              {order.status === 'completed' && order.fulfillment_status !== 'shipped' && order.fulfillment_status !== 'delivered' && (
                                <button 
                                  onClick={() => {
                                    const num = prompt("請輸入物流單號，支援格式如「7-11: 123456」或「郵局: 123456」（留空則標記為「自取」已出貨）：");
                                    if (num !== null) updateFulfillment(order.id, 'shipped', num);
                                  }}
                                  className="p-3 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:scale-110 transition"
                                  title="標記為已出貨"
                                >
                                   <Truck className="w-4 h-4" />
                                </button>
                              )}
                              {order.status === 'completed' && order.fulfillment_status === 'shipped' && (
                                 <button 
                                   onClick={() => {
                                     if (confirm("確認此訂單已順利簽收或取貨完成？\n確認後將啟動 30 天鑑賞期計時，屆滿後自動撥發分紅與點數。")) {
                                       updateFulfillment(order.id, 'delivered', order.tracking_number);
                                     }
                                   }}
                                   className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-110 transition mr-2"
                                   title="標記為已簽收/已取貨"
                                 >
                                    <CheckCircle2 className="w-4 h-4" />
                                 </button>
                               )}
                               <button className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition">
                                 <MoreVertical className="w-4 h-4" />
                              </button>
                           </div>
                        </td>
                       </motion.tr>
                       {expandedOrderId === order.id && (
                         <tr className="bg-slate-50/30 border-b border-slate-50">
                           <td colSpan={8} className="p-8">
                             <div className="grid grid-cols-2 gap-8">
                               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">訂購明細</h4>
                                 <div className="space-y-3">
                                   {order.order_items && order.order_items.length > 0 ? order.order_items.map((item: any, idx: number) => (
                                     <div key={idx} className="flex justify-between items-center text-sm">
                                       <span className="font-bold text-slate-700">{item.name}</span>
                                       <div className="flex gap-4">
                                         <span className="text-slate-400">x{item.quantity}</span>
                                         <span className="font-black text-slate-800">${item.price}</span>
                                       </div>
                                     </div>
                                   )) : (
                                     <p className="text-xs text-slate-400">無商品明細</p>
                                   )}
                                   {order.notes && (
                                     <div className="mt-4 pt-4 border-t border-slate-50">
                                       <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">訂單備註</p>
                                       <p className="text-xs font-bold text-slate-600">{order.notes}</p>
                                     </div>
                                   )}
                                 </div>
                               </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">收件/寄送資訊</h4>
                                  {order.shipping_info ? (
                                    <div className="space-y-3">
                                      <p className="text-sm"><span className="text-slate-400 mr-2 text-[10px] uppercase font-bold tracking-widest">物流方式</span> <span className="font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">{order.shipping_info.method || '宅配到府'}</span></p>
                                      <p className="text-sm"><span className="text-slate-400 mr-2 text-[10px] uppercase font-bold tracking-widest">收件人</span> <span className="font-black text-slate-800">{order.shipping_info.name}</span></p>
                                      <p className="text-sm"><span className="text-slate-400 mr-2 text-[10px] uppercase font-bold tracking-widest">聯絡電話</span> <span className="font-black text-slate-800">{order.shipping_info.phone}</span></p>
                                      <p className="text-sm"><span className="text-slate-400 mr-2 text-[10px] uppercase font-bold tracking-widest">寄送地址</span> <span className="font-black text-slate-800">{order.shipping_info.address}</span></p>
                                      
                                      {/* 寄件人資訊 */}
                                      {(order.shipping_info.sender_name || order.shipping_info.senderName) && (
                                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">指定寄件人 (代發代寄)</p>
                                          <p className="text-sm"><span className="text-slate-400 mr-2 text-[10px] uppercase font-bold tracking-widest">寄件人</span> <span className="font-black text-slate-800">{order.shipping_info.sender_name || order.shipping_info.senderName}</span></p>
                                          <p className="text-sm"><span className="text-slate-400 mr-2 text-[10px] uppercase font-bold tracking-widest">聯絡電話</span> <span className="font-black text-slate-800">{order.shipping_info.sender_phone || order.shipping_info.senderPhone}</span></p>
                                          {(order.shipping_info.sender_address || order.shipping_info.senderAddress) && (
                                            <p className="text-sm"><span className="text-slate-400 mr-2 text-[10px] uppercase font-bold tracking-widest">寄送地址</span> <span className="font-black text-slate-800">{order.shipping_info.sender_address || order.shipping_info.senderAddress}</span></p>
                                          )}
                                          {(order.shipping_info.sender_notes || order.shipping_info.senderNotes) && (
                                            <p className="text-sm"><span className="text-rose-500 mr-2 text-[10px] uppercase font-black tracking-widest">寄件備註</span> <span className="font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">{order.shipping_info.sender_notes || order.shipping_info.senderNotes}</span></p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-400">無收件資訊 (由會員中心帶入)</p>
                                  )}
                                  
                                  {/* 物流出貨管理控鍵 */}
                                  <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">出貨控制台</h5>
                                    {order.status === 'completed' && (() => {
                                      const currentCarrier = selectedCarriers[order.id] || getCarrierTrackingInfo(order.tracking_number).carrierName || "自取";
                                      return (
                                        <div className="space-y-3">
                                          <div className="flex gap-2">
                                            <select 
                                              id={`carrier-select-${order.id}`}
                                              value={currentCarrier}
                                              onChange={(e) => {
                                                setSelectedCarriers(prev => ({ ...prev, [order.id]: e.target.value }));
                                              }}
                                              className="bg-slate-50 border-none px-4 py-2.5 rounded-xl text-xs font-bold focus:ring-1 focus:ring-blue-500 max-w-[150px] cursor-pointer"
                                            >
                                              {CARRIERS.map(c => (
                                                <option key={c.name} value={c.name}>{c.name}</option>
                                              ))}
                                            </select>

                                            {currentCarrier === "自取" ? (
                                              <select
                                                id={`tracking-input-${order.id}`}
                                                defaultValue={getCarrierTrackingInfo(order.tracking_number).trackingNum}
                                                className="flex-1 bg-slate-50 border-none px-4 py-2.5 rounded-xl text-xs font-bold focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                              >
                                                <option value="">-- 請選擇自取據點 --</option>
                                                {pickupPoints.map(pt => (
                                                  <option key={pt.id} value={pt.name}>
                                                    {pt.name} ({pt.address})
                                                  </option>
                                                ))}
                                              </select>
                                            ) : (
                                              <input 
                                                id={`tracking-input-${order.id}`}
                                                type="text" 
                                                defaultValue={getCarrierTrackingInfo(order.tracking_number).trackingNum}
                                                placeholder="請輸入物流單號"
                                                className="flex-1 bg-slate-50 border-none px-4 py-2.5 rounded-xl text-xs font-bold focus:ring-1 focus:ring-blue-500"
                                              />
                                            )}

                                            <button 
                                              onClick={() => {
                                                const carrier = (document.getElementById(`carrier-select-${order.id}`) as HTMLSelectElement)?.value || "自取";
                                                const input = (document.getElementById(`tracking-input-${order.id}`) as HTMLSelectElement | HTMLInputElement)?.value || "";
                                                const finalTracking = input ? `${carrier}: ${input}` : "";
                                                updateFulfillment(order.id, 'shipped', finalTracking);
                                              }}
                                              className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-blue-600/10 hover:bg-blue-700 transition shrink-0"
                                            >
                                              {order.fulfillment_status === 'shipped' ? '更新單號' : '確認出貨'}
                                            </button>
                                          </div>
                                          {order.tracking_number && (
                                            <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                                              <span className="text-[10px] font-bold text-slate-500">
                                                當前單號: <span className="font-mono text-blue-600 font-black">{order.tracking_number}</span>
                                              </span>
                                              <button 
                                                onClick={() => handleOpenTrackingLink(order.tracking_number)}
                                                className="text-[9px] font-black text-indigo-600 hover:underline flex items-center gap-1"
                                              >
                                                🔍 追蹤配送軌跡 ➔
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
                                    <div className="flex gap-2">
                                      <button 
                                        onClick={() => handlePrintPackingSlip(order)}
                                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition"
                                      >
                                        <Printer className="w-3.5 h-3.5" /> 列印出貨揀貨單
                                      </button>
                                    </div>
                                  </div>
                                </div>
                             </div>
                           </td>
                         </tr>
                       )}
                     </React.Fragment>
                   ))
                 )}
              </tbody>
           </table>
        </div>

        {/* 批量操作懸浮工具列 (Bulk Action Floating Toolbar) */}
        <AnimatePresence>
          {selectedOrderIds.length > 0 && (
            <motion.div 
              initial={{ y: 100, opacity: 0, x: "-50%" }}
              animate={{ y: 0, opacity: 1, x: "-50%" }}
              exit={{ y: 100, opacity: 0, x: "-50%" }}
              className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[150] w-full max-w-4xl px-6"
            >
               <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 text-white p-6 rounded-[2.5rem] shadow-2xl flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center font-black text-sm">
                        {selectedOrderIds.length}
                     </div>
                     <div>
                        <p className="text-xs font-black">已選取 {selectedOrderIds.length} 筆訂單</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Bulk Action Management</p>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <button 
                       onClick={handlePrintCombinedPickingList}
                       className="px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition"
                     >
                        <Printer className="w-4 h-4" /> 合併揀貨單
                     </button>
                     <button 
                       onClick={handleBatchApprove}
                       className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition"
                     >
                        <CheckCircle2 className="w-4 h-4" /> 批量核付款
                     </button>
                     <button 
                       onClick={() => {
                          const initialData: Record<string, { carrier: string; trackingNum: string }> = {};
                          orders.filter(o => selectedOrderIds.includes(o.id)).forEach(o => {
                            const info = getCarrierTrackingInfo(o.tracking_number);
                            initialData[o.id] = { carrier: info.carrierName || "黑貓宅急便", trackingNum: info.trackingNum || "" };
                          });
                          setBulkShipData(initialData);
                          setShowBulkShipModal(true);
                        }}
                       className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition"
                     >
                        <Truck className="w-4 h-4" /> 批量出貨
                     </button>
                     <button 
                       onClick={() => setSelectedOrderIds([])}
                       className="px-4 py-3.5 text-slate-400 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition"
                     >
                        取消
                     </button>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* ─── 批量出貨物流單號智慧錄入彈窗 (Bulk Shipping Waybill Modal) ─── */}
      <AnimatePresence>
        {showBulkShipModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200] flex items-center justify-center p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[3rem] p-8 w-full max-w-4xl shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-start pb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Truck className="w-6 h-6 text-indigo-600 animate-pulse" /> 批量出貨物流智慧錄入
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    正在為 {selectedOrderIds.length} 筆已選取訂單批次綁定物流配送單號
                  </p>
                </div>
                
                {/* Global Carrier sync tool */}
                <div className="flex items-center gap-2 bg-indigo-50/50 p-2.5 rounded-2xl border border-indigo-100/50">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">一鍵同步物流商：</span>
                  <select 
                    id="global-carrier-select"
                    className="bg-white border border-indigo-100 px-3 py-1.5 rounded-xl text-xs font-black text-slate-700 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    {CARRIERS.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => {
                      const selectedCarrier = (document.getElementById("global-carrier-select") as HTMLSelectElement)?.value || "黑貓宅急便";
                      const updated = { ...bulkShipData };
                      Object.keys(updated).forEach(id => {
                        updated[id] = { ...updated[id], carrier: selectedCarrier };
                      });
                      setBulkShipData(updated);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition"
                  >
                    套用全部
                  </button>
                </div>
              </div>

              {/* Scrollable List of orders */}
              <div className="flex-1 overflow-y-auto my-6 pr-2 space-y-4 max-h-[50vh] no-scrollbar">
                {orders
                  .filter(o => selectedOrderIds.includes(o.id))
                  .map(order => {
                    const orderData = bulkShipData[order.id] || { carrier: "黑貓宅急便", trackingNum: "" };
                    return (
                      <div 
                        key={order.id} 
                        className="bg-slate-50/60 hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] font-mono font-bold text-slate-500">
                              #{order.id.substring(0, 8)}
                            </span>
                            <span className="text-sm font-black text-slate-800">
                              {order.shipping_info?.name || order.members?.name || '無收件人'}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                              ({order.shipping_info?.phone || order.members?.phone || '無電話'})
                            </span>
                          </div>
                          <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                            📍 {order.shipping_info?.address || '門市自取'}
                          </p>
                          <div className="text-[9px] font-bold text-indigo-600/80 bg-indigo-50 px-2 py-0.5 rounded-md inline-block">
                            品項：{order.order_items ? order.order_items.map((i: any) => `${i.name}x${i.quantity}`).join(', ') : '無'}
                          </div>
                        </div>

                        {/* Order Inputs */}
                        <div className="flex items-center gap-2 w-full md:w-auto">
                          <select 
                            value={orderData.carrier}
                            onChange={e => {
                              setBulkShipData({
                                ...bulkShipData,
                                [order.id]: { ...orderData, carrier: e.target.value, trackingNum: "" }
                              });
                            }}
                            className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold focus:ring-1 focus:ring-indigo-500 cursor-pointer min-w-[140px]"
                          >
                            {CARRIERS.map(c => (
                              <option key={c.name} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                          {orderData.carrier === "自取" ? (
                            <select
                              value={orderData.trackingNum}
                              onChange={e => {
                                setBulkShipData({
                                  ...bulkShipData,
                                  [order.id]: { ...orderData, trackingNum: e.target.value }
                                });
                              }}
                              className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold focus:ring-1 focus:ring-indigo-500 flex-1 md:w-48 cursor-pointer"
                            >
                              <option value="">-- 請選擇自取點 --</option>
                              {pickupPoints.map(pt => (
                                <option key={pt.id} value={pt.name}>
                                  {pt.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input 
                              type="text" 
                              placeholder="輸入物流單號"
                              value={orderData.trackingNum}
                              onChange={e => {
                                setBulkShipData({
                                  ...bulkShipData,
                                  [order.id]: { ...orderData, trackingNum: e.target.value }
                                });
                              }}
                              className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold focus:ring-1 focus:ring-indigo-500 flex-1 md:w-48"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Bottom Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button 
                  onClick={() => setShowBulkShipModal(false)}
                  className="px-6 py-3.5 text-slate-400 hover:text-slate-600 font-black text-xs uppercase tracking-widest"
                >
                  取消
                </button>
                <button 
                  onClick={handleSubmitBulkShip}
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.1em] shadow-lg shadow-indigo-600/15 flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Truck className="w-4 h-4" />
                  )}
                  確認整批出貨
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showPickupPointsModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[3.5rem] p-10 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-50"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-6 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">自取點管理中心</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Manage Self-Pickup Locations</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowPickupPointsModal(false);
                    setEditingPickupPointId(null);
                    setPickupForm({ name: "", contact_person: "", phone: "", address: "", notes: "" });
                  }}
                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition active:scale-95"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body - 2 Columns */}
              <div className="flex-1 overflow-y-auto py-8 grid grid-cols-1 md:grid-cols-5 gap-10 min-h-0 pr-2">
                {/* Left Column: Existing List */}
                <div className="md:col-span-3 space-y-4 overflow-y-auto max-h-[60vh] pr-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                     📋 現有自取據點 ({pickupPoints.length})
                  </h4>
                  {pickupPoints.map((pt) => (
                    <div 
                      key={pt.id} 
                      className={`p-6 rounded-3xl border transition flex flex-col gap-3 ${
                        editingPickupPointId === pt.id 
                          ? "bg-emerald-50/30 border-emerald-500 shadow-lg shadow-emerald-500/5" 
                          : "bg-slate-50 border-slate-100 hover:bg-white hover:shadow-md"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full uppercase tracking-widest leading-none">
                            自取據點
                          </span>
                          <h5 className="font-black text-slate-800 text-sm mt-1">{pt.name}</h5>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingPickupPointId(pt.id);
                              setPickupForm({
                                name: pt.name || "",
                                contact_person: pt.contact_person || "",
                                phone: pt.phone || "",
                                address: pt.address || "",
                                notes: pt.notes || ""
                              });
                            }}
                            className="px-4 py-2 bg-white hover:bg-indigo-50 border border-slate-100 rounded-xl text-xs font-black text-indigo-600 transition shadow-sm active:scale-95"
                          >
                            編輯
                          </button>
                          <button
                            onClick={() => handleDeletePickupPoint(pt.id)}
                            className="px-4 py-2 bg-white hover:bg-rose-50 border border-slate-100 rounded-xl text-xs font-black text-rose-600 transition shadow-sm active:scale-95"
                          >
                            刪除
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/40 text-[11px] font-bold text-slate-500">
                        <div>
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-0.5">👤 據點負責人</p>
                          <p className="text-slate-700">{pt.contact_person || "未設定"}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-0.5">📞 連絡電話</p>
                          <p className="text-slate-700">{pt.phone || "未設定"}</p>
                        </div>
                      </div>

                      <div className="text-[11px] font-bold text-slate-500 space-y-2 pt-2 border-t border-slate-200/40">
                        <div>
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-0.5">📍 據點地址</p>
                          <p className="text-slate-700 break-all leading-relaxed">{pt.address}</p>
                        </div>
                        {pt.notes && (
                          <div>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-0.5">📝 備註說明</p>
                            <p className="text-slate-600 italic break-all leading-relaxed">{pt.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {pickupPoints.length === 0 && (
                    <div className="py-12 text-center text-slate-300 font-bold space-y-2">
                      <Truck className="w-10 h-10 mx-auto text-slate-200" />
                      <p className="text-xs">尚無自取地點，請在右側新增！</p>
                    </div>
                  )}
                </div>

                {/* Right Column: Add/Edit Form */}
                <div className="md:col-span-2 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between max-h-[60vh] overflow-y-auto">
                  <form onSubmit={handleSavePickupPoint} className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                      {editingPickupPointId ? "✏️ 編輯自取點" : "✨ 新增自取點"}
                    </h4>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">據點名稱 (必填)</label>
                      <input 
                        type="text" 
                        value={pickupForm.name}
                        onChange={e => setPickupForm({ ...pickupForm, name: e.target.value })}
                        placeholder="例：台北大安店、桃園桃子點..." 
                        className="w-full bg-white border-none p-4 rounded-xl text-xs font-bold shadow-sm focus:ring-2 focus:ring-emerald-500/10 outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">據點負責人</label>
                      <input 
                        type="text" 
                        value={pickupForm.contact_person}
                        onChange={e => setPickupForm({ ...pickupForm, contact_person: e.target.value })}
                        placeholder="例：張主管" 
                        className="w-full bg-white border-none p-4 rounded-xl text-xs font-bold shadow-sm focus:ring-2 focus:ring-emerald-500/10 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">連絡電話</label>
                      <input 
                        type="text" 
                        value={pickupForm.phone}
                        onChange={e => setPickupForm({ ...pickupForm, phone: e.target.value })}
                        placeholder="例：0912345678" 
                        className="w-full bg-white border-none p-4 rounded-xl text-xs font-bold shadow-sm focus:ring-2 focus:ring-emerald-500/10 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">地址 (必填)</label>
                      <input 
                        type="text" 
                        value={pickupForm.address}
                        onChange={e => setPickupForm({ ...pickupForm, address: e.target.value })}
                        placeholder="例：台北市大安區忠孝東路三段..." 
                        className="w-full bg-white border-none p-4 rounded-xl text-xs font-bold shadow-sm focus:ring-2 focus:ring-emerald-500/10 outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">備註說明</label>
                      <textarea 
                        value={pickupForm.notes}
                        onChange={e => setPickupForm({ ...pickupForm, notes: e.target.value })}
                        placeholder="例：營業時間、特定預約說明等..." 
                        rows={2}
                        className="w-full bg-white border-none p-4 rounded-xl text-xs font-bold shadow-sm focus:ring-2 focus:ring-emerald-500/10 outline-none resize-none leading-relaxed"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button 
                        type="submit"
                        disabled={isSavingPickupPoint}
                        className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-md transition active:scale-95 flex items-center justify-center gap-2"
                      >
                        {isSavingPickupPoint ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : editingPickupPointId ? (
                          "儲存修改"
                        ) : (
                          "確認新增"
                        )}
                      </button>
                      {editingPickupPointId && (
                        <button 
                          type="button"
                          onClick={() => {
                            setEditingPickupPointId(null);
                            setPickupForm({ name: "", contact_person: "", phone: "", address: "", notes: "" });
                          }}
                          className="px-6 py-4 bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition active:scale-95"
                        >
                          取消
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </main>
    </div>
  );
}

export default function AdminOrders() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-slate-400">Loading Orders...</div>}>
      <AdminOrdersContent />
    </Suspense>
  );
}
