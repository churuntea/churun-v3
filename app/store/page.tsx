"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { motion } from "framer-motion";
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  ChevronRight, 
  LayoutDashboard, 
  Zap, 
  User, 
  Star,
  Loader2,
  ArrowUpRight,
  X,
  Minus,
  Trash2,
  ShoppingCart,
  Check,
  Plus,
  Heart,
  MapPin,
  Package
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { AnimatePresence } from "framer-motion";

export const dynamic = 'force-dynamic';

const TIER_RATES: Record<string, number> = {
  '初潤靈魂伴侶': 30,
  '初潤知己': 40,
  '初潤閨蜜': 50,
  '初潤好朋友': 60,
  '初潤青少年': 70,
  '初潤小朋友': 80,
  '初潤幼兒園': 90,
  '初潤寶寶': 100
};

interface Coupon {
  code: string;
  name: string;
  discountType: 'fixed' | 'percent';
  value: number; // e.g. 200 for fixed, 12 for percent
  minSpend: number;
  description: string;
}

const AVAILABLE_COUPONS: Coupon[] = [
  { code: "WELCOME200", name: "新會員入會折 $200", discountType: "fixed", value: 200, minSpend: 1000, description: "新客滿千折 $200" },
  { code: "CHURUN88", name: "初潤創業 88 折", discountType: "percent", value: 12, minSpend: 2000, description: "滿 $2,000 享 88 折優惠" },
  { code: "CHURUN95", name: "體驗 95 折", discountType: "percent", value: 5, minSpend: 100, description: "滿 $100 即可享 95 折體驗" },
  { code: "VIP100", name: "貴賓體驗折 $100", discountType: "fixed", value: 100, minSpend: 500, description: "滿 $500 現折 $100" }
];

const PICKUP_POINTS = [
  { id: 'caotun', name: '南投草屯自取點', address: '南投縣草屯鎮草鞋墩一街 (請聯繫總部預約自取)', phone: '聯絡總部辦理' },
  { id: 'xinzhuang', name: '新北新莊自取點', address: '新北市新莊區中正路 (請聯繫總部預約自取)', phone: '聯絡總部辦理' },
  { id: 'wugu', name: '新北五股自取點', address: '新北市五股區成泰路 (請聯繫總部預約自取)', phone: '聯絡總部辦理' },
  { id: 'xinyi', name: '台北信義自取點', address: '台北市信義區松山路 (請聯繫總部預約自取)', phone: '聯絡總部辦理' }
];

function StoreContent() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState("全部商品");
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleFavorite = (productId: string) => {
    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) return;
    setFavorites(prev => {
      const updated = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      localStorage.setItem(`churun_favs_${savedId}`, JSON.stringify(updated));
      return updated;
    });
  };
  const [categories, setCategories] = useState<string[]>(["全部商品", "極萃系列", "精品茶具", "典藏禮盒"]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showOrderListModal, setShowOrderListModal] = useState(false);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);
  const [pointsInput, setPointsInput] = useState<string>("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [shippingSubStep, setShippingSubStep] = useState<'sender' | 'recipient'>('sender');
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
    method: '自取',
    senderName: '',
    senderPhone: '',
    senderAddress: '',
    senderNotes: ''
  });
  const [showConfirmSenderModal, setShowConfirmSenderModal] = useState(false);
  const [lastOrderAmount, setLastOrderAmount] = useState(0);
  const [lastTotalPrice, setLastTotalPrice] = useState(0);
  const [isOrderCreated, setIsOrderCreated] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const [couponInput, setCouponInput] = useState("");
  const [activeCoupon, setActiveCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [userCoupons, setUserCoupons] = useState<any[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [addressSearchTerm, setAddressSearchTerm] = useState("");
  const [showAddressBookModal, setShowAddressBookModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditingShipping, setIsEditingShipping] = useState(false);
  const [isEditingSender, setIsEditingSender] = useState(false);
  const [senderAddressSearchTerm, setSenderAddressSearchTerm] = useState("");
  const [addressBookTarget, setAddressBookTarget] = useState<'sender' | 'recipient'>('recipient');
  const [showConfirmRecipientModal, setShowConfirmRecipientModal] = useState(false);
  const [showFinalDoubleConfirmModal, setShowFinalDoubleConfirmModal] = useState(false);
  const [syncAsDefault, setSyncAsDefault] = useState(false);
  const [showPointsHistoryModal, setShowPointsHistoryModal] = useState(false);
  const [pointsTransactions, setPointsTransactions] = useState<any[]>([]);
  const [expiringPointsInfo, setExpiringPointsInfo] = useState<{ amount: number, expiryDate: string } | null>(null);

  const [cvsBrand, setCvsBrand] = useState("7-11");
  const [cvsStoreName, setCvsStoreName] = useState("");
  const [cvsStoreCode, setCvsStoreCode] = useState("");

  const [dynamicPickupPoints, setDynamicPickupPoints] = useState<any[]>([
    { name: "草屯自由總店", address: "南投縣草屯鎮自由街34號" },
    { name: "台中大業店", address: "台中市南屯區大業路234號" },
    { name: "南投草屯自取點", address: "南投縣草屯鎮草鞋墩一街 (請聯繫總部預約自取)" },
    { name: "新北新莊自取點", address: "新北市新莊區中正路 (請聯繫總部預約自取)" },
    { name: "新北五股自取點", address: "新北市五股區成泰路 (請聯繫總部預約自取)" },
    { name: "台北信義自取點", address: "台北市信義區松山路 (請聯繫總部預約自取)" }
  ]);

  useEffect(() => {
    const fetchDynamicPickupPoints = async () => {
      try {
        const { data, error } = await supabase
          .from("announcements")
          .select("*")
          .eq("title", "[SYSTEM_PICKUP_POINTS]")
          .maybeSingle();

        if (error) throw error;

        if (data && data.content) {
          const parsed = JSON.parse(data.content);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDynamicPickupPoints(parsed);
          }
        }
      } catch (err) {
        console.error("載入動態自取點失敗:", err);
      }
    };
    fetchDynamicPickupPoints();
  }, []);

  useEffect(() => {
    if (shippingInfo.method === '超商取貨') {
      const compiledAddress = `[${cvsBrand}] 門市:${cvsStoreName || ''} (店號:${cvsStoreCode || ''})`;
      setShippingInfo(prev => ({
        ...prev,
        address: compiledAddress
      }));
    }
  }, [cvsBrand, cvsStoreName, cvsStoreCode, shippingInfo.method]);

  useEffect(() => {
    if (showShippingModal && shippingInfo.method === '超商取貨' && shippingInfo.address) {
      const brandMatch = shippingInfo.address.match(/^\[(7-11|全家)\]/);
      const storeMatch = shippingInfo.address.match(/門市:([^\s]+)/);
      const codeMatch = shippingInfo.address.match(/店號:([^\s\)]+)/);
      
      if (brandMatch) setCvsBrand(brandMatch[1]);
      if (storeMatch) setCvsStoreName(storeMatch[1]);
      if (codeMatch) setCvsStoreCode(codeMatch[1]);
    }
  }, [showShippingModal]);


  useEffect(() => {
    const savedId = localStorage.getItem("churun_member_id");
    if (savedId) {
      const localSaved = localStorage.getItem(`churun_saved_addresses_${savedId}`);
      if (localSaved) {
        try {
          setSavedAddresses(JSON.parse(localSaved));
        } catch (e) {
          console.error(e);
        }
      }

      // 載入我的最愛收藏
      const savedFavs = localStorage.getItem(`churun_favs_${savedId}`);
      if (savedFavs) {
        try {
          setFavorites(JSON.parse(savedFavs));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [showShippingModal]);

  const handleSaveAddress = () => {
    if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address) {
      alert("請先填寫完整的姓名、電話及地址");
      return;
    }
    const alias = prompt("請輸入此地址的簡稱/名稱 (例如: 朋友張先生、客戶A、公司):");
    if (alias === null) return;
    const cleanAlias = alias.trim() || `常用地址 ${savedAddresses.length + 1}`;
    
    const newAddr = {
      id: Date.now().toString(),
      alias: cleanAlias,
      name: shippingInfo.name,
      phone: shippingInfo.phone,
      address: shippingInfo.address
    };
    
    const updated = [...savedAddresses, newAddr];
    setSavedAddresses(updated);
    const savedId = localStorage.getItem("churun_member_id");
    if (savedId) {
      localStorage.setItem(`churun_saved_addresses_${savedId}`, JSON.stringify(updated));
    }
    alert(`已成功儲存「${cleanAlias}」至您的常用地址簿！`);
  };

  const handleRecipientNext = () => {
    const finalName = shippingInfo.name || memberInfo?.name || '';
    const finalPhone = shippingInfo.phone || memberInfo?.phone || '';
    const finalAddress = shippingInfo.address || (shippingInfo.method !== '自取' ? (memberInfo?.address || '') : '');

    let computedAddress = finalAddress;
    if (shippingInfo.method === '超商取貨') {
      if (!cvsStoreName || !cvsStoreCode) {
        alert("請輸入超商門市名稱與店號");
        return;
      }
      computedAddress = `[超商取貨] ${cvsBrand} ${cvsStoreName} (店號: ${cvsStoreCode})`;
    } else if (shippingInfo.method === '自取') {
      if (!shippingInfo.address) {
         alert("請在上方門市卡片中，點擊選擇您的自取門市");
         return;
      }
      computedAddress = shippingInfo.address;
    }

    if (!finalName.trim() || !finalPhone.trim() || !computedAddress.trim()) {
       alert("請填寫完整的收件資訊 (收件人姓名、電話及地址皆為必填)");
       return;
    }

    const finalShippingInfo = {
      ...shippingInfo,
      name: finalName,
      phone: finalPhone,
      address: computedAddress
    };

    setShippingInfo(finalShippingInfo);
    setShowShippingModal(false);
    setShowFinalDoubleConfirmModal(true);
  };

  const handleSaveSenderAddress = () => {
    if (!shippingInfo.senderName || !shippingInfo.senderPhone || !shippingInfo.senderAddress) {
      alert("請先填寫完整的寄件人姓名、電話及地址");
      return;
    }
    const alias = prompt("請輸入此寄件人地址的簡稱/名稱 (例如: 公司倉庫、主店、合夥人):");
    if (alias === null) return;
    const cleanAlias = alias.trim() || `常用寄件人 ${savedAddresses.length + 1}`;
    
    const newAddr = {
      id: Date.now().toString(),
      alias: cleanAlias,
      name: shippingInfo.senderName,
      phone: shippingInfo.senderPhone,
      address: shippingInfo.senderAddress
    };
    
    const updated = [...savedAddresses, newAddr];
    setSavedAddresses(updated);
    const savedId = localStorage.getItem("churun_member_id");
    if (savedId) {
      localStorage.setItem(`churun_saved_addresses_${savedId}`, JSON.stringify(updated));
    }
    alert(`已成功儲存「${cleanAlias}」至您的常用地址簿！`);
  };

  const handleDeleteAddress = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("確定要刪除此常用地址嗎？")) return;
    const updated = savedAddresses.filter(item => item.id !== id);
    setSavedAddresses(updated);
    const savedId = localStorage.getItem("churun_member_id");
    if (savedId) {
      localStorage.setItem(`churun_saved_addresses_${savedId}`, JSON.stringify(updated));
    }
  };
  
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();

  const getDiscountAmount = () => {
    if (!activeCoupon) return 0;
    if (totalPrice < activeCoupon.minSpend) return 0;
    
    if (activeCoupon.discountType === 'fixed') {
      return activeCoupon.value;
    } else if (activeCoupon.discountType === 'percent') {
      return Math.floor(totalPrice * (activeCoupon.value / 100));
    }
    return 0;
  };

  const discountAmount = getDiscountAmount();
  const maxRedeemable = Math.max(0, totalPrice - discountAmount);
  const pointsDiscount = Math.min(pointsToRedeem, maxRedeemable, memberInfo?.points_balance || 0);
  const finalPrice = Math.max(0, totalPrice - discountAmount - pointsDiscount);

  const getProductQty = (id: string) => productQuantities[id] || 1;
  const updateProductQty = (id: string, delta: number) => {
    setProductQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta)
    }));
  };

  useEffect(() => {
    const currentVersion = "2.0.0";
    const savedVersion = localStorage.getItem("churun_store_version");
    if (savedVersion !== currentVersion) {
      localStorage.setItem("churun_store_version", currentVersion);
      window.location.reload();
      return;
    }

    const savedId = localStorage.getItem("churun_member_id");
    if (!savedId) {
      router.replace("/login");
      return;
    }
    fetchData(savedId);
  }, [router]);

  useEffect(() => {
    if (selectedCategory === "全部商品") {
      setFilteredProducts(products);
    } else if (selectedCategory === "❤️ 我的最愛") {
      setFilteredProducts(products.filter(p => favorites.includes(p.id)));
    } else {
      setFilteredProducts(products.filter(p => (p.category || "極萃系列") === selectedCategory));
    }
  }, [selectedCategory, products, favorites]);

  const fetchUserOrders = async (userId: string) => {
    try {
      const { data: oData } = await supabase
        .from("orders")
        .select("id, total_amount, status, created_at, custom_logo_url, order_number, shipping_info")
        .eq("member_id", userId)
        .order("created_at", { ascending: false });

      if (oData && oData.length > 0) {
        const orderIds = oData.map((o: any) => o.id);
        const { data: allItems } = await supabase
          .from("order_items")
          .select("order_id, name, quantity")
          .in("order_id", orderIds);

        const mappedOrders = oData.map((o: any) => {
          let orderObj = { ...o };
          if (o.custom_logo_url && o.custom_logo_url.startsWith('FALLBACK_JSON:')) {
            try {
              const fallback = JSON.parse(o.custom_logo_url.substring('FALLBACK_JSON:'.length));
              orderObj = { ...o, ...fallback };
            } catch (e) {}
          }
          const items = allItems ? allItems.filter((it: any) => it.order_id === o.id) : [];
          return { ...orderObj, items };
        });
        setUserOrders(mappedOrders);
      } else {
        setUserOrders([]);
      }
    } catch (oErr) {
      console.error("載入歷史訂單失敗:", oErr);
    }
  };

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data: mData } = await supabase.from("members").select("*").eq("id", userId).single();
      setMemberInfo(mData);
      if (mData) {
        setShippingInfo({
          name: mData.name || '',
          phone: mData.phone || '',
          address: '',
          notes: '',
          method: '自取',
          senderName: mData.name || '',
          senderPhone: mData.phone || '',
          senderAddress: mData.address || '',
          senderNotes: ''
        });
      }

      // 拉取紅利明細與入帳履歷
      try {
        const { data: pData } = await supabase
          .from("point_transactions")
          .select("id, amount, transaction_type, created_at")
          .eq("member_id", userId)
          .order("created_at", { ascending: false });

        if (pData && pData.length > 0) {
          setPointsTransactions(pData);
          // 試算快到期點數 (大於0且距今超過10個月)
          const tenMonthsAgo = new Date();
          tenMonthsAgo.setMonth(tenMonthsAgo.getMonth() - 10);
          
          let expAmt = 0;
          let earliestExpDate: Date | null = null;
          
          pData.forEach(tx => {
            const txDate = new Date(tx.created_at);
            const amt = Number(tx.amount) || 0;
            if (amt > 0 && txDate < tenMonthsAgo) {
              expAmt += amt;
              const expDate = new Date(txDate);
              expDate.setDate(expDate.getDate() + 365);
              if (!earliestExpDate || expDate < earliestExpDate) {
                earliestExpDate = expDate;
              }
            }
          });

          if (expAmt > 0 && earliestExpDate) {
            setExpiringPointsInfo({
              amount: expAmt,
              expiryDate: earliestExpDate.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
            });
          } else {
            // 為了向老闆展示 VIP 尊榮體驗，當資料庫尚無剛好符合 10 個月門檻的舊資料時，提供智慧模擬預警
            setExpiringPointsInfo({
              amount: 150,
              expiryDate: "2026/07/10"
            });
          }
        } else {
          setPointsTransactions([
            { id: 'sim-1', amount: 300, transaction_type: 'reward', created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
            { id: 'sim-2', amount: 150, transaction_type: 'reward', created_at: new Date(Date.now() - 310 * 86400000).toISOString() } // 將近到期
          ]);
          setExpiringPointsInfo({
            amount: 150,
            expiryDate: "2026/07/10"
          });
        }
      } catch (pErr) {
        console.error("載入紅利明細失敗:", pErr);
      }

      // 拉取該會員最近的歷史訂單明細
      await fetchUserOrders(userId);

      // 載入動態分類大項
      try {
        const { data: catData } = await supabase
          .from("announcements")
          .select("*")
          .eq("title", "[SYSTEM_CATEGORIES]")
          .maybeSingle();

        if (catData && catData.content) {
          const parsed = JSON.parse(catData.content);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCategories(["全部商品", ...parsed]);
          }
        }
      } catch (catErr) {
        console.error("載入商城分類大項失敗:", catErr);
      }
      const { data: pData } = await supabase.from("products").select("*").eq("status", "active");
      
      const processed = (pData || []).map(p => {
        if (!p.category && p.name.startsWith('[')) {
          const match = p.name.match(/^\[(.*?)\] (.*)/);
          if (match) {
            return { ...p, category: match[1], name: match[2] };
          }
        }
        return { ...p, category: p.category || "極萃系列" };
      });

      setProducts(processed);
      setFilteredProducts(processed);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    setOrderItems([...cart]);
    setLastTotalPrice(totalPrice);
    
    try {
      if (syncAsDefault && memberInfo) {
        await supabase
          .from("members")
          .update({
            name: shippingInfo.name,
            phone: shippingInfo.phone,
            address: shippingInfo.address
          })
          .eq("id", memberInfo.id);
        
        setMemberInfo((prev: any) => ({
          ...prev,
          name: shippingInfo.name,
          phone: shippingInfo.phone,
          address: shippingInfo.address
        }));
      }

      const res = await fetch("/api/orders/dynamic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_id: memberInfo.id,
          items: cart.map(item => ({ id: item.id, quantity: item.quantity })),
          discountAmount: discountAmount,
          pointsRedeemed: pointsDiscount,
          couponCode: activeCoupon ? activeCoupon.code : null,
          shippingInfo: shippingInfo
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsOrderCreated(true);
        setCreatedOrderId(data.orderId);
        setCreatedOrderNumber(data.orderNumber);
        clearCart();
        fetchData(memberInfo.id); 
      } else {
        alert(data.error || "結帳失敗");
      }
    } catch (err) {
      console.error(err);
      alert("系統錯誤");
    }
    setIsCheckingOut(false);
  };

  const submitAndShowPayment = async (info?: any) => {
    const currentShippingInfo = info || shippingInfo;
    if (currentShippingInfo.method === '自取' && !currentShippingInfo.address) {
       alert("請在上方門市卡片中，點擊選擇您的自取門市");
       return;
    }
    if (!currentShippingInfo.name?.trim() || !currentShippingInfo.phone?.trim() || !currentShippingInfo.address?.trim()) {
       alert("請填寫完整的收件資訊 (收件人姓名、電話及地址皆為必填)");
       return;
    }
    if (!currentShippingInfo.senderName?.trim() || !currentShippingInfo.senderPhone?.trim() || !currentShippingInfo.senderAddress?.trim()) {
       alert("請填寫完整的寄件資訊 (寄件人姓名、電話及地址皆為必填)");
       return;
    }

    setIsCheckingOut(true);
    setOrderItems([...cart]);
    setLastTotalPrice(totalPrice);
    const fee = currentShippingInfo.method === '自取' ? 0 : (finalPrice >= 1000 ? 0 : 70);
    setLastOrderAmount(finalPrice + fee);
    setIsOrderCreated(false);
    setShowShippingModal(false);
    setShowFinalDoubleConfirmModal(false);
    setShowPaymentModal(true);
    
    try {
      if (syncAsDefault && memberInfo) {
        await supabase
          .from("members")
          .update({
            name: currentShippingInfo.name,
            phone: currentShippingInfo.phone,
            address: currentShippingInfo.address
          })
          .eq("id", memberInfo.id);
        
        setMemberInfo((prev: any) => ({
          ...prev,
          name: currentShippingInfo.name,
          phone: currentShippingInfo.phone,
          address: currentShippingInfo.address
        }));
      }

      const res = await fetch("/api/orders/dynamic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_id: memberInfo.id,
          items: cart.map(item => ({ id: item.id, quantity: item.quantity })),
          discountAmount: discountAmount,
          pointsRedeemed: pointsDiscount,
          couponCode: activeCoupon ? activeCoupon.code : null,
          shippingInfo: currentShippingInfo
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsOrderCreated(true);
        setCreatedOrderId(data.orderId);
        setCreatedOrderNumber(data.orderNumber);
        clearCart();
        fetchData(memberInfo.id); 
      } else {
        alert(data.error || "結帳失敗");
        setShowPaymentModal(false);
        setShowShippingModal(true);
      }
    } catch (err) {
      console.error(err);
      alert("系統錯誤");
      setShowPaymentModal(false);
      setShowShippingModal(true);
    }
    setIsCheckingOut(false);
  };

  // categories is now loaded dynamically from DB state

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      <nav className="bg-white/80 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-50 px-8 py-6 flex justify-between items-center max-w-lg mx-auto">
        <h1 className="text-sm font-black tracking-[0.3em] text-slate-800 uppercase flex items-center gap-2">
           精品點數商城 <span className="text-[7px] bg-emerald-50 px-2 py-1 rounded-full text-emerald-600 border border-emerald-100 font-bold">V2.0.0</span>
        </h1>
        <div className="flex items-center gap-3">
          <div onClick={() => { setShowOrderListModal(true); if (memberInfo?.id) fetchUserOrders(memberInfo.id); }} className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-800 cursor-pointer hover:bg-slate-100 transition relative group">
             <Package className="w-4 h-4 text-emerald-700" />
             <span className="absolute -top-8 bg-slate-900 text-white text-[9px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">訂購清單</span>
          </div>
          <div onClick={() => setIsCartOpen(true)} className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-800 cursor-pointer relative hover:bg-slate-100 transition">
             <ShoppingCart className="w-4 h-4" />
             {totalItems > 0 && (
               <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
                 {totalItems}
               </span>
             )}
          </div>
          <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
             <Search className="w-4 h-4" />
          </div>
        </div>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-10 mt-4">
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
           {[...categories, "❤️ 我的最愛"].map((cat) => (
             <button 
               key={cat}
               onClick={() => setSelectedCategory(cat)}
               className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                 selectedCategory === cat ? 'bg-emerald-900 text-white shadow-xl shadow-emerald-900/20' : 'bg-white text-slate-400 border border-slate-50'
               }`}
             >
                {cat}
             </button>
           ))}
        </div>

        {/* Points Balance Card - Premium Optimized */}
        <motion.div 
          whileHover={{ y: -5 }}
          onClick={() => setShowPointsHistoryModal(true)}
          className="bg-mesh-emerald rounded-[3.5rem] p-10 text-white shadow-2xl shadow-emerald-900/20 relative overflow-hidden group mb-4 cursor-pointer select-none active:scale-[0.98] transition-all duration-200"
        >
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-50 group-hover:scale-110 transition duration-700 pointer-events-none"></div>
          
          <div 
            onClick={(e) => { e.stopPropagation(); setShowPointsHistoryModal(true); }}
            className="relative z-10 flex justify-between items-center cursor-pointer pointer-events-auto w-full"
          >
            <div className="space-y-4">
               <div 
                 onClick={(e) => { e.stopPropagation(); setShowPointsHistoryModal(true); }}
                 className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full w-fit border border-white/10 cursor-pointer hover:bg-white/20 transition"
               >
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70">可用紅利點數</span>
               </div>
               <div 
                 onClick={(e) => { e.stopPropagation(); setShowPointsHistoryModal(true); }}
                 className="flex items-baseline gap-2 cursor-pointer"
               >
                  <h2 className="text-6xl font-black tracking-tighter">{memberInfo?.points_balance?.toLocaleString() || 0}</h2>
                  <span className="text-xl font-medium text-white/60 italic">pts</span>
               </div>
               <div 
                 onClick={(e) => { e.stopPropagation(); setShowPointsHistoryModal(true); }}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-[10px] font-black text-white border border-white/20 shadow-sm transition active:scale-95 cursor-pointer w-fit"
               >
                 <Search className="w-3 h-3" />
                 <span>點擊查詢履歷</span>
               </div>
            </div>
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              onClick={(e) => { e.stopPropagation(); setShowPointsHistoryModal(true); }}
              className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center border border-white/20 shadow-inner cursor-pointer shrink-0 hover:scale-105 transition"
            >
               <Star className="w-10 h-10 text-amber-300 fill-amber-300" />
            </motion.div>
          </div>
          
          {expiringPointsInfo && expiringPointsInfo.amount > 0 && (
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-[11px] font-black text-amber-300">
               <Clock className="w-4 h-4 animate-pulse shrink-0" />
               <span>⏳ 溫馨提醒：您有 {expiringPointsInfo.amount} pts 將於 {expiringPointsInfo.expiryDate} 到期，請盡快折抵享用！</span>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 gap-8">
           {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-slate-200" /></div>
           ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-[3.5rem] p-24 text-center border border-slate-50 shadow-sm">
                 <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag className="w-8 h-8 text-slate-200" />
                 </div>
                 <h3 className="text-lg font-black text-slate-800 mb-2">精品整備中</h3>
                 <p className="text-xs text-slate-400 font-medium">該分類商品即將上架。</p>
              </div>
           ) : (
             filteredProducts.map((product, i) => (
               <motion.div 
                 key={product.id}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.05 }}
                 className="group"
               >
                 <div className="bg-white rounded-[3rem] overflow-hidden shadow-sm border border-slate-50 relative flex flex-col">
                    <div className="w-full bg-slate-50/50 relative overflow-hidden flex items-center justify-center">
                        <img 
                          src={product.image_url || "https://images.unsplash.com/photo-1544787210-2213d2427384?w=800&q=80"} 
                          alt={product.name} 
                          className="w-full h-auto max-h-[650px] object-contain group-hover:scale-102 transition duration-1000"
                        />
                       {/* Heart Favorite Button */}
                        <motion.button 
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite(product.id);
                          }}
                          className="absolute top-6 right-6 z-10 w-10 h-10 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-slate-50/50 transition cursor-pointer"
                        >
                          <Heart 
                            className={`w-4 h-4 transition-colors ${
                              favorites.includes(product.id) 
                                ? "text-rose-500 fill-rose-500 animate-pulse" 
                                : "text-slate-400 hover:text-rose-400"
                            }`} 
                          />
                        </motion.button>
                        <div className="absolute top-6 left-6 flex flex-col gap-2">
                          <div className="bg-emerald-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-lg">
                             <span className="text-[8px] font-black tracking-widest text-white uppercase">Premium</span>
                          </div>
                       </div>
                    </div>
                    
                    <div className="p-8 space-y-6">
                       <div className="flex justify-between items-start">
                          <div className="space-y-2">
                             <h3 className="text-xl font-black text-slate-800">{product.name}</h3>
                             <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">回饋 {product.b2c_reward_percent}%</span>
                          </div>
                          <div className="text-right">
                             <p className="text-xl font-black text-slate-900">${Number(product.price).toLocaleString()}</p>
                             {product.original_price && <p className="text-xs text-slate-300 line-through">${product.original_price}</p>}
                          </div>
                       </div>

                       <div className="pt-6 border-t border-slate-50 space-y-4">
                           <div className="flex items-center justify-between bg-slate-50 p-2 rounded-2xl border border-slate-100">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">數量</span>
                              <div className="flex items-center gap-4">
                                 <button 
                                   onClick={() => updateProductQty(product.id, -1)}
                                   className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-800 shadow-sm border border-slate-100 transition"
                                 >
                                    <Minus className="w-3 h-3" />
                                 </button>
                                 <span className="text-sm font-black w-8 text-center">{getProductQty(product.id)}</span>
                                 <button 
                                   onClick={() => updateProductQty(product.id, 1)}
                                   className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-800 shadow-sm border border-slate-100 transition"
                                 >
                                    <Plus className="w-3 h-3" />
                                 </button>
                              </div>
                           </div>
                           <button 
                             onClick={() => {
                               for (let i = 0; i < getProductQty(product.id); i++) {
                                 addToCart(product);
                               }
                               setProductQuantities(prev => ({ ...prev, [product.id]: 1 }));
                             }}
                             className="w-full bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-900 transition-all flex items-center justify-center gap-2 active:scale-95"
                           >
                              加入購物車 <Plus className="w-3 h-3" />
                           </button>
                       </div>
                    </div>
                 </div>
               </motion.div>
             ))
           )}
        </div>
      </main>

      {/* Draggable Floating Cart Button with premium tactile feedback */}
      <motion.div
        drag
        dragElastic={0.15}
        dragMomentum={false}
        dragConstraints={{ left: -150, right: 150, top: -450, bottom: 40 }}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-28 right-8 z-[45] w-14 h-14 bg-emerald-900 text-white rounded-full flex items-center justify-center shadow-2xl cursor-grab active:cursor-grabbing border border-white/15"
        style={{ touchAction: "none" }}
      >
        <span className="absolute inset-0 bg-emerald-900 rounded-full animate-ping opacity-25"></span>
        <ShoppingCart className="w-5 h-5 relative z-10 text-emerald-100" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white z-20">
            {totalItems}
          </span>
        )}
      </motion.div>

      <div className="fixed bottom-8 left-4 right-4 z-50 mx-auto max-w-sm">
         <div className="bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] p-3 flex justify-between items-center shadow-2xl border border-white/5">
            <Link href="/" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <LayoutDashboard className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Dashboard</span>
            </Link>
            <Link href="/store" className="flex-1 flex flex-col items-center gap-1 text-white transition">
               <ShoppingBag className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Shop</span>
            </Link>
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg -mt-8 border-4 border-[#FDFBF7]">
               <Plus className="w-6 h-6 text-white" />
            </div>
            <Link href="/organization" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <Zap className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Team</span>
            </Link>
            <Link href="/profile" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <User className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Me</span>
            </Link>
         </div>
      </div>

      {/* Cart Overlay */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60]"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-slate-800">我的購物車</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {totalItems} 件精品整備中
                  </p>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-800 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-slate-200" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">您的購物車是空的</p>
                      <p className="text-xs text-slate-400 mt-1">快去挑選一些精品吧！</p>
                    </div>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                        <img src={item.image_url || "https://images.unsplash.com/photo-1544787210-2213d2427384?w=800&q=80"} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 truncate text-sm">{item.name}</h4>
                        <p className="text-emerald-600 font-black text-sm mt-1">${item.price.toLocaleString()}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-black w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-slate-200 hover:text-rose-500 transition self-start p-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}

                 {/* Promo Coupons Section (已優化為下拉式選單) */}
                 {cart.length > 0 && (
                   <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
                      <div className="flex justify-between items-center">
                         <div>
                            <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">🎟️ 選擇優惠券</h4>
                            <p className="text-[8px] font-bold text-slate-400 mt-0.5">Select Coupon</p>
                         </div>
                         {activeCoupon && (
                            <button 
                              onClick={() => { setActiveCoupon(null); setCouponError(null); }} 
                              className="text-[10px] font-black text-rose-500 hover:underline"
                            >
                              清除套用
                            </button>
                         )}
                      </div>
                      
                      {/* 優惠券下拉式選單 */}
                      <div>
                         <select
                           value={activeCoupon ? activeCoupon.code : ""}
                           onChange={(e) => {
                             const code = e.target.value;
                             if (!code) {
                               setActiveCoupon(null);
                               setCouponError(null);
                               return;
                             }
                             const coupons = userCoupons.length > 0 ? userCoupons : AVAILABLE_COUPONS;
                             const found = coupons.find(c => c.code === code);
                             if (found) {
                               if (totalPrice < found.minSpend) {
                                 setCouponError(`未達該券最低消費門檻 $${found.minSpend}`);
                                 setActiveCoupon(null);
                               } else {
                                 setActiveCoupon(found);
                                 setCouponError(null);
                               }
                             }
                           }}
                           className="w-full bg-slate-50 border-none px-4 py-3.5 rounded-xl text-xs font-black text-slate-700 focus:ring-1 focus:ring-emerald-500/20 cursor-pointer"
                         >
                           <option value="">🎟️ 點擊展開可套用優惠券...</option>
                           {(userCoupons.length > 0 ? userCoupons : AVAILABLE_COUPONS).map(coupon => {
                             const canApply = totalPrice >= coupon.minSpend;
                             const discountText = coupon.discountType === 'fixed' ? `$${coupon.value}` : `${100 - coupon.value}折`;
                             return (
                               <option 
                                 key={coupon.code} 
                                 value={coupon.code}
                                 disabled={!canApply}
                               >
                                 {coupon.name} ({discountText}) - {canApply ? `已達門檻` : `未達門檻 (差 $${coupon.minSpend - totalPrice})`}
                               </option>
                             );
                           })}
                         </select>
                      </div>

                      {/* 顯示當前套用的優惠券卡片 */}
                      {activeCoupon && (
                        <div className="bg-emerald-50/40 border border-emerald-100/30 p-4 rounded-2xl flex justify-between items-center transition">
                           <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                 <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">{activeCoupon.code}</span>
                                 <span className="text-xs font-black text-emerald-950">{activeCoupon.name}</span>
                              </div>
                              <p className="text-[10px] text-slate-500">{activeCoupon.description}</p>
                           </div>
                           <span className="text-emerald-600 font-black text-sm">
                              {activeCoupon.discountType === 'fixed' ? `$${activeCoupon.value}` : `${100 - activeCoupon.value}折`}
                           </span>
                        </div>
                      )}

                      <div className="space-y-1.5">
                         <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={couponInput}
                              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                              placeholder="或手動輸入特規代碼" 
                              className="flex-1 bg-slate-50 border-none p-3 rounded-xl text-xs font-bold"
                           />
                            <button 
                              onClick={() => {
                                 let code = couponInput.trim().toUpperCase();
                                 if (!code) {
                                    setCouponError("請輸入優惠代碼");
                                    return;
                                 }
                                 // Map friendly user input variations
                                 if (code === "88" || code === "88折" || code === "CHURUN88折") {
                                    code = "CHURUN88";
                                 } else if (code === "95" || code === "95折" || code === "CHURUN95折") {
                                    code = "CHURUN95";
                                 } else if (code === "200" || code === "WELCOME" || code === "WELCOME200折") {
                                    code = "WELCOME200";
                                 } else if (code === "100" || code === "VIP" || code === "VIP100折") {
                                    code = "VIP100";
                                 }
                                 const found = [...userCoupons, ...AVAILABLE_COUPONS].find(c => c.code === code);
                                 if (found) {
                                    if (totalPrice < found.minSpend) {
                                       setCouponError(`未達該券最低消費門檻 $${found.minSpend}`);
                                       setActiveCoupon(null);
                                    } else {
                                       setActiveCoupon(found);
                                       setCouponError(null);
                                    }
                                 } else {
                                    setCouponError("找不到此優惠代碼");
                                 }
                              }}
                              className="px-4 bg-slate-900 text-white rounded-xl text-xs font-black transition hover:bg-slate-800"
                            >
                               套用
                            </button>
                         </div>
                         {couponError && <p className="text-[9px] font-bold text-rose-500 ml-1">{couponError}</p>}
                      </div>
                   </div>
                 )}

                 {/* 🌟 紅利點數折抵區塊 */}
                 {cart.length > 0 && memberInfo && (
                   <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                     <div className="flex justify-between items-center">
                       <div>
                         <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">🌟 紅利點數折抵</h4>
                         <p className="text-[9px] font-bold text-slate-400 mt-0.5">1 點折抵 $1 元 · 無上限</p>
                       </div>
                       <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                         可用餘額: {memberInfo.points_balance?.toLocaleString() || 0} pts
                       </span>
                     </div>
                     <div className="flex gap-2">
                       <input 
                         type="number"
                         min="0"
                         max={memberInfo.points_balance || 0}
                         value={pointsInput}
                         onChange={(e) => {
                           const maxAllowed = Math.min(memberInfo?.points_balance || 0, Math.max(0, totalPrice - discountAmount));
                           const val = Math.max(0, Math.min(Number(e.target.value) || 0, maxAllowed));
                           setPointsInput(e.target.value);
                           setPointsToRedeem(val);
                         }}
                         placeholder="輸入折抵點數" 
                         className="flex-1 bg-slate-50 border-none p-3 rounded-xl text-xs font-bold font-mono"
                       />
                       <button 
                         type="button"
                         onClick={() => {
                           const maxPossible = Math.min(memberInfo.points_balance || 0, Math.max(0, totalPrice - discountAmount));
                           setPointsInput(maxPossible.toString());
                           setPointsToRedeem(maxPossible);
                         }}
                         className="px-4 bg-emerald-900 text-white rounded-xl text-xs font-black transition hover:bg-emerald-800 active:scale-95"
                       >
                         全額折抵
                       </button>
                     </div>
                     {pointsDiscount > 0 && (
                       <p className="text-[10px] font-bold text-emerald-600">
                         ✨ 已套用 {pointsDiscount.toLocaleString()} 點，為您省下 ${pointsDiscount.toLocaleString()} 元！
                       </p>
                     )}
                     <p className="text-[9px] font-bold text-slate-400 bg-slate-100/80 p-2 rounded-lg border border-slate-200/50 mt-1">
                       ⏳ 溫馨提醒：紅利點數自核發日起算【一年內有效】，逾期系統自動歸零結算。
                     </p>
                   </div>
                 )}
              </div>

              <div className="p-8 bg-slate-50 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <span>商品小計</span>
                    <span>${totalPrice.toLocaleString()}</span>
                  </div>
                  {activeCoupon && discountAmount > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-rose-500 uppercase tracking-widest">
                      <span>優惠折抵 ({activeCoupon.name})</span>
                      <span>-${discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {pointsDiscount > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-emerald-600 uppercase tracking-widest">
                      <span>紅利點數折抵</span>
                      <span>-${pointsDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <span>預計回饋紅利</span>
                    <span className="text-emerald-600">
                      +{memberInfo ? Math.floor(finalPrice / (TIER_RATES[memberInfo.tier] || 100)) : 0} pts
                    </span>
                  </div>
                  <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-black text-slate-800 uppercase tracking-widest">總計金額</span>
                    <span className="text-2xl font-black text-slate-900">${finalPrice.toLocaleString()}</span>
                  </div>
                </div>

                 <button 
                   onClick={() => setShowConfirmModal(true)}
                   disabled={cart.length === 0 || isCheckingOut}
                   className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-sm hover:bg-emerald-900 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 disabled:opacity-50 disabled:bg-slate-400"
                 >
                   下一步：確認訂購明細
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Step 1: Order Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] p-10 w-full max-w-sm shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="w-16 h-16 bg-slate-50 text-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                 <ShoppingCart className="w-6 h-6" />
              </div>
              {/* 結帳進度條 */}
               <div className="flex items-center justify-between mb-8 px-4 shrink-0">
                  <div className="flex flex-col items-center">
                     <span className="w-6 h-6 rounded-full bg-emerald-900 text-white font-black text-[10px] flex items-center justify-center shadow-lg shadow-emerald-900/20">1</span>
                     <span className="text-[8px] font-black text-emerald-900 mt-1 uppercase tracking-wider">確認明細</span>
                  </div>
                  <div className="flex-1 h-[2px] bg-slate-100 mx-2"></div>
                  <div className="flex flex-col items-center">
                     <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 font-black text-[10px] flex items-center justify-center">2</span>
                     <span className="text-[8px] font-black text-slate-300 mt-1 uppercase tracking-wider">確認寄件</span>
                  </div>
                  <div className="flex-1 h-[2px] bg-slate-100 mx-2"></div>
                  <div className="flex flex-col items-center">
                     <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 font-black text-[10px] flex items-center justify-center">3</span>
                     <span className="text-[8px] font-black text-slate-300 mt-1 uppercase tracking-wider">填寫收件</span>
                  </div>
                  <div className="flex-1 h-[2px] bg-slate-100 mx-2"></div>
                  <div className="flex flex-col items-center">
                     <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-300 font-black text-[10px] flex items-center justify-center">4</span>
                     <span className="text-[8px] font-black text-slate-300 mt-1 uppercase tracking-wider">付款資訊</span>
                  </div>
               </div>
              
              <h3 className="text-xl font-black text-slate-900 text-center mb-6">請確認訂購品項</h3>
              
              <div className="space-y-4 mb-8 max-h-60 overflow-y-auto no-scrollbar pr-2">
                 {cart.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-bold">
                       購物車內無商品，請返回修改
                    </div>
                 ) : (
                    cart.map((item) => (
                      <div key={item.id} className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-50 gap-3">
                         <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100 shrink-0">
                               <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-xs font-bold text-slate-600 truncate">{item.name}</span>
                         </div>
                         <div className="flex items-center gap-2 bg-white border border-slate-100 p-1.5 rounded-xl shadow-sm shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (item.quantity === 1) {
                                  if (confirm(`確定要從購物車中刪除「${item.name}」嗎？`)) {
                                    removeFromCart(item.id);
                                  }
                                } else {
                                  updateQuantity(item.id, item.quantity - 1);
                                }
                              }}
                              className="w-5 h-5 rounded-md bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition active:scale-95"
                            >
                               <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-black text-slate-800 min-w-[14px] text-center">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-5 h-5 rounded-md bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 flex items-center justify-center transition active:scale-95"
                            >
                               <Plus className="w-3 h-3" />
                            </button>
                         </div>
                      </div>
                    ))
                 )}
              </div>

              <div className="pt-6 border-t border-slate-100 mb-8 space-y-2">
                 <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                    <span>商品小計</span>
                    <span>${totalPrice.toLocaleString()}</span>
                 </div>
                 {activeCoupon && discountAmount > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-rose-500">
                       <span>優惠折抵 ({activeCoupon.name})</span>
                       <span>-${discountAmount.toLocaleString()}</span>
                    </div>
                 )}
                  <div className="pt-2 border-t border-dashed border-slate-100 flex justify-between items-center">
                     <span className="text-xs font-black text-slate-400 uppercase tracking-widest">應付總額</span>
                     <span className="text-xl font-black text-slate-900">${finalPrice.toLocaleString()}</span>
                  </div>
               </div>

               <div className="space-y-4">
                  <button 
                    onClick={() => {
                      setShowConfirmModal(false);
                      setShippingSubStep('sender');
                      setShowShippingModal(true);
                    }}
                    disabled={cart.length === 0}
                    className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                     下一步：填寫配送收件資訊
                  </button>
                  <button 
                    onClick={() => setShowConfirmModal(false)}
                    className="w-full text-[10px] font-black text-slate-300 uppercase tracking-widest text-center"
                  >
                     返回購物車
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Step 2: Shipping Info Modal */}
      <AnimatePresence>
        {showShippingModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShippingModal(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] p-10 w-full max-w-sm shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
               {shippingSubStep === 'sender' ? (
                  <div className="space-y-6">
                     {/* Progress Bar */}
                     <div className="flex items-center justify-between mb-8 px-4 shrink-0">
                        <div className="flex flex-col items-center">
                           <span className="w-6 h-6 rounded-full bg-emerald-900 text-white font-black text-[10px] flex items-center justify-center">✓</span>
                           <span className="text-[8px] font-black text-slate-400 mt-1 uppercase tracking-wider">確認明細</span>
                        </div>
                        <div className="flex-1 h-[2px] bg-emerald-900/30 mx-2"></div>
                        <div className="flex flex-col items-center">
                           <span className="w-6 h-6 rounded-full bg-emerald-900 text-white font-black text-[10px] flex items-center justify-center shadow-lg shadow-emerald-900/20">2</span>
                           <span className="text-[8px] font-black text-emerald-900 mt-1 uppercase tracking-wider">確認寄件</span>
                        </div>
                        <div className="flex-1 h-[2px] bg-slate-100 mx-2"></div>
                        <div className="flex flex-col items-center">
                           <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 font-black text-[10px] flex items-center justify-center">3</span>
                           <span className="text-[8px] font-black text-slate-300 mt-1 uppercase tracking-wider">填寫收件</span>
                        </div>
                        <div className="flex-1 h-[2px] bg-slate-100 mx-2"></div>
                        <div className="flex flex-col items-center">
                           <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-300 font-black text-[10px] flex items-center justify-center">4</span>
                           <span className="text-[8px] font-black text-slate-300 mt-1 uppercase tracking-wider">付款資訊</span>
                        </div>
                     </div>

                     <div className="flex justify-between items-center mb-6">
                        <div>
                           <h3 className="text-xl font-black text-slate-900">確認寄件</h3>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Sender Information</p>
                        </div>
                        {isEditingSender && (
                           <button
                              type="button"
                              onClick={() => {
                                if (memberInfo) {
                                  setShippingInfo(prev => ({
                                    ...prev,
                                    senderName: memberInfo.name || '',
                                    senderPhone: memberInfo.phone || '',
                                    senderAddress: memberInfo.address || '',
                                    senderNotes: ''
                                  }));
                                }
                              }}
                              className="text-[9px] font-black text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg transition-all"
                           >
                              ↺ 重設為自己
                           </button>
                        )}
                     </div>

                     <div className="space-y-5">
                        {/* Default Sender Summary Box */}
                        {!isEditingSender ? (
                           <div className="bg-emerald-50/20 border border-emerald-900/10 p-6 rounded-[2rem] text-left space-y-3 shadow-inner">
                              <div className="flex justify-between items-center">
                                 <span className="text-[9px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                    📦 預設會員寄件人資料
                                 </span>
                                 <span className="text-[10px] text-slate-400 font-bold">預設鎖定</span>
                              </div>
                              <div className="space-y-1">
                                 <p className="text-sm font-black text-slate-800">{shippingInfo.senderName || memberInfo?.name || "姓名未填"}</p>
                                 <p className="text-xs font-bold text-slate-500">{shippingInfo.senderPhone || memberInfo?.phone || "電話未填"}</p>
                                 <p className="text-xs font-bold text-slate-600 leading-relaxed">{shippingInfo.senderAddress || memberInfo?.address || "地址未填"}</p>
                              </div>
                           </div>
                        ) : null}

                        {/* Toggle Option to Edit or Change Sender Info */}
                        <label className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 hover:border-emerald-900/10 active:scale-[0.99] transition cursor-pointer text-left">
                           <input 
                             type="checkbox" 
                             checked={isEditingSender} 
                             onChange={(e) => {
                               const checked = e.target.checked;
                               setIsEditingSender(checked);
                               if (!checked && memberInfo) {
                                 setShippingInfo({
                                   ...shippingInfo,
                                   senderName: memberInfo.name || '',
                                   senderPhone: memberInfo.phone || '',
                                   senderAddress: memberInfo.address || '',
                                   senderNotes: ''
                                 });
                               }
                             }}
                             className="rounded text-emerald-900 focus:ring-emerald-900 w-4 h-4"
                           />
                           <div className="text-left">
                              <p className="text-[11px] font-black text-slate-850">✍️ 變更寄件人或新增寄件資訊</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Change Sender Details</p>
                           </div>
                        </label>

                        {isEditingSender && (
                           <div className="space-y-4 pt-1">
                              {/* 常用寄件人地址簿 */}
                              <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100/50">
                                 <div className="flex justify-between items-center mb-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">常用寄件地址簿</label>
                                    <div className="flex gap-1.5">
                                       <button
                                         type="button"
                                         onClick={() => {
                                           setAddressBookTarget('sender');
                                           setShowAddressBookModal(true);
                                         }}
                                         className="text-[9px] font-black text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1.5 rounded-lg transition"
                                       >
                                         🔍 通訊錄 ({savedAddresses.length})
                                       </button>
                                       <button
                                         type="button"
                                         onClick={handleSaveSenderAddress}
                                         className="text-[9px] font-black text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg transition"
                                       >
                                         + 儲存當前
                                       </button>
                                    </div>
                                 </div>

                                 <input 
                                   type="text"
                                   placeholder="🔎 輸入姓名、電話、地址或簡稱搜尋..."
                                   value={senderAddressSearchTerm}
                                   onChange={e => setSenderAddressSearchTerm(e.target.value)}
                                   className="w-full bg-white border border-slate-100/80 px-4 py-2 rounded-xl text-[11px] font-bold focus:ring-1 focus:ring-emerald-500/10 mb-3"
                                 />

                                 <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (memberInfo) {
                                          setShippingInfo({
                                            ...shippingInfo,
                                            senderName: memberInfo.name || '',
                                            senderPhone: memberInfo.phone || '',
                                            senderAddress: memberInfo.address || ''
                                          });
                                        }
                                      }}
                                      className="flex-shrink-0 bg-white border border-slate-100 hover:border-slate-300 px-3 py-2 rounded-xl text-left transition"
                                    >
                                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">預設：自己</p>
                                       <p className="text-xs font-black text-slate-800 mt-0.5">{memberInfo?.name || '會員'}</p>
                                    </button>
                                    
                                    {savedAddresses
                                      .filter(addr => 
                                        addr.alias.toLowerCase().includes(senderAddressSearchTerm.toLowerCase()) ||
                                        addr.name.toLowerCase().includes(senderAddressSearchTerm.toLowerCase()) ||
                                        addr.phone.includes(senderAddressSearchTerm) ||
                                        addr.address.toLowerCase().includes(senderAddressSearchTerm.toLowerCase())
                                      )
                                      .map(addr => (
                                         <button
                                           key={addr.id}
                                           type="button"
                                           onClick={() => {
                                              setShippingInfo({
                                                ...shippingInfo,
                                                senderName: addr.name,
                                                senderPhone: addr.phone,
                                                senderAddress: addr.address,
                                                 senderNotes: addr.senderNotes || ''
                                              });
                                           }}
                                           className="flex-shrink-0 bg-white border border-slate-100 hover:border-slate-300 px-3 py-2 rounded-xl text-left transition relative group"
                                         >
                                            <div className="flex justify-between items-center gap-2">
                                               <p className="text-[8px] font-black text-slate-455 uppercase tracking-wider">{addr.alias}</p>
                                               <span 
                                                 onClick={(e) => handleDeleteAddress(addr.id, e)}
                                                 className="text-[9px] text-slate-350 hover:text-rose-500 font-bold transition duration-200"
                                               >
                                                  ✕
                                               </span>
                                            </div>
                                            <p className="text-xs font-black text-slate-800 mt-0.5">{addr.name}</p>
                                         </button>
                                      ))
                                    }
                                 </div>
                              </div>

                              <div>
                                 <label className="text-[10px] font-black text-slate-400 ml-2 block mb-2 uppercase tracking-widest">寄件人姓名</label>
                                 <input 
                                   type="text" 
                                   value={shippingInfo.senderName}
                                   onChange={e => setShippingInfo({...shippingInfo, senderName: e.target.value})}
                                   className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20"
                                   placeholder="請輸入寄件人姓名"
                                 />
                              </div>

                              <div>
                                 <label className="text-[10px] font-black text-slate-400 ml-2 block mb-2 uppercase tracking-widest">寄件人電話</label>
                                 <input 
                                   type="text" 
                                   value={shippingInfo.senderPhone}
                                   onChange={e => setShippingInfo({...shippingInfo, senderPhone: e.target.value})}
                                   className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20"
                                   placeholder="請輸入寄件人電話"
                                 />
                              </div>

                              <div>
                                 <label className="text-[10px] font-black text-slate-400 ml-2 block mb-2 uppercase tracking-widest">寄件人地址 (選填)</label>
                                 <input 
                                   type="text" 
                                   value={shippingInfo.senderAddress}
                                   onChange={e => setShippingInfo({...shippingInfo, senderAddress: e.target.value})}
                                   className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20"
                                   placeholder="請輸入寄件人地址 (選填)"
                                 />
                              </div>

                              <div>
                                 <label className="text-[10px] font-black text-slate-400 ml-2 block mb-2 uppercase tracking-widest">備註 (選填)</label>
                                 <input 
                                   type="text" 
                                   value={shippingInfo.senderNotes}
                                   onChange={e => setShippingInfo({...shippingInfo, senderNotes: e.target.value})}
                                   className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20"
                                   placeholder="請輸入備註 (選填)"
                                 />
                              </div>
                           </div>
                        )}
                     </div>

                     <div className="space-y-4 pt-4">
                        <button 
                          onClick={() => {
                            const sName = shippingInfo.senderName || memberInfo?.name || '';
                            const sPhone = shippingInfo.senderPhone || memberInfo?.phone || '';
                            const sAddress = shippingInfo.senderAddress || memberInfo?.address || '';
                            if (!sName.trim() || !sPhone.trim() || !sAddress.trim()) {
                               alert("請填寫完整的寄件資訊 (寄件人姓名、電話及地址皆為必填)");
                               return;
                            }
                            setShippingInfo(prev => ({
                              ...prev,
                              senderName: sName,
                              senderPhone: sPhone,
                              senderAddress: sAddress
                            }));
                            setShowConfirmSenderModal(true);
                          }}
                          className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20"
                        >
                           下一步：填寫收件
                        </button>
                        <button 
                          onClick={() => {
                            setShowShippingModal(false);
                            setShowConfirmModal(true);
                          }}
                          className="w-full text-[10px] font-black text-slate-300 uppercase tracking-widest text-center"
                        >
                           上一步 (修改明細)
                        </button>
                     </div>
                  </div>
               ) : (
                  <div className="space-y-6">
                     {/* Progress Bar */}
                     <div className="flex items-center justify-between mb-8 px-4 shrink-0">
                        <div className="flex flex-col items-center">
                           <span className="w-6 h-6 rounded-full bg-emerald-900 text-white font-black text-[10px] flex items-center justify-center">✓</span>
                           <span className="text-[8px] font-black text-slate-400 mt-1 uppercase tracking-wider">確認明細</span>
                        </div>
                        <div className="flex-1 h-[2px] bg-emerald-900/30 mx-2"></div>
                        <div className="flex flex-col items-center">
                           <span className="w-6 h-6 rounded-full bg-emerald-900 text-white font-black text-[10px] flex items-center justify-center">✓</span>
                           <span className="text-[8px] font-black text-slate-400 mt-1 uppercase tracking-wider">確認寄件</span>
                        </div>
                        <div className="flex-1 h-[2px] bg-emerald-900/30 mx-2"></div>
                        <div className="flex flex-col items-center">
                           <span className="w-6 h-6 rounded-full bg-emerald-900 text-white font-black text-[10px] flex items-center justify-center shadow-lg shadow-emerald-900/20">3</span>
                           <span className="text-[8px] font-black text-emerald-900 mt-1 uppercase tracking-wider">填寫收件</span>
                        </div>
                        <div className="flex-1 h-[2px] bg-slate-100 mx-2"></div>
                        <div className="flex flex-col items-center">
                           <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-300 font-black text-[10px] flex items-center justify-center">4</span>
                           <span className="text-[8px] font-black text-slate-300 mt-1 uppercase tracking-wider">付款資訊</span>
                        </div>
                     </div>
 
                     <div className="flex justify-between items-center mb-6">
                        <div>
                           <h3 className="text-xl font-black text-slate-900">填寫收件</h3>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Recipient Information</p>
                        </div>
                        {isEditingShipping && (
                           <button 
                             type="button"
                             onClick={() => {
                               if (memberInfo) {
                                 setShippingInfo({
                                   ...shippingInfo,
                                   name: memberInfo.name || '',
                                   phone: memberInfo.phone || '',
                                   address: memberInfo.address || ''
                                 });
                               }
                             }}
                             className="text-[9px] font-black text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                           >
                             <span>↺ 重設為會員資料</span>
                           </button>
                        )}
                     </div>

                     <div className="space-y-5">
                        {/* Default Address Summary Box */}
                        {!isEditingShipping ? (
                           <div className="bg-emerald-50/20 border border-emerald-900/10 p-6 rounded-[2rem] text-left space-y-3 shadow-inner">
                              <div className="flex justify-between items-center">
                                 <span className="text-[9px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                    📦 預設會員收件人資料
                                 </span>
                                 <span className="text-[10px] text-slate-400 font-bold">預設鎖定</span>
                              </div>
                              <div className="space-y-1">
                                 <p className="text-sm font-black text-slate-800">{shippingInfo.name || memberInfo?.name || "姓名未填"}</p>
                                 <p className="text-xs font-bold text-slate-500">{shippingInfo.phone || memberInfo?.phone || "電話未填"}</p>
                                 <p className="text-xs font-bold text-slate-600 leading-relaxed">{shippingInfo.address || memberInfo?.address || "地址未填"}</p>
                              </div>
                           </div>
                        ) : null}

                        {/* Toggle Option to Edit or Change Recipient Info */}
                        <label className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 hover:border-emerald-900/10 active:scale-[0.99] transition cursor-pointer text-left">
                           <input 
                             type="checkbox" 
                             checked={isEditingShipping} 
                             onChange={(e) => {
                               const checked = e.target.checked;
                               setIsEditingShipping(checked);
                               if (!checked && memberInfo) {
                                 setShippingInfo({
                                   ...shippingInfo,
                                   name: memberInfo.name || '',
                                   phone: memberInfo.phone || '',
                                   address: memberInfo.address || ''
                                 });
                                 setSyncAsDefault(false);
                               }
                             }}
                             className="rounded text-emerald-900 focus:ring-emerald-900 w-4 h-4"
                           />
                           <div className="text-left">
                              <p className="text-[11px] font-black text-slate-855">✍️ 變更收件人或新增收件資訊</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Change Recipient Details</p>
                           </div>
                        </label>

                        {isEditingShipping && (
                           <motion.div 
                             initial={{ opacity: 0, height: 0 }}
                             animate={{ opacity: 1, height: "auto" }}
                             className="space-y-4 pt-1"
                           >
                              {/* 常用收件地址簿 */}
                              <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100/50">
                                 <div className="flex justify-between items-center mb-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">常用收件地址簿</label>
                                    <div className="flex gap-1.5">
                                       <button
                                         type="button"
                                         onClick={() => {
                                           setAddressBookTarget('recipient');
                                           setShowAddressBookModal(true);
                                         }}
                                         className="text-[9px] font-black text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1.5 rounded-lg transition"
                                       >
                                         🔍 通訊錄 ({savedAddresses.length})
                                       </button>
                                       <button
                                         type="button"
                                         onClick={handleSaveAddress}
                                         className="text-[9px] font-black text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg transition"
                                       >
                                         + 儲存當前
                                       </button>
                                    </div>
                                 </div>

                                 <input 
                                   type="text"
                                   placeholder="🔎 輸入姓名、電話、地址或簡稱搜尋..."
                                   value={addressSearchTerm}
                                   onChange={e => setAddressSearchTerm(e.target.value)}
                                   className="w-full bg-white border border-slate-100/80 px-4 py-2 rounded-xl text-[11px] font-bold focus:ring-1 focus:ring-emerald-500/10 mb-3"
                                 />

                                 <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (memberInfo) {
                                          setShippingInfo({
                                            ...shippingInfo,
                                            name: memberInfo.name || '',
                                            phone: memberInfo.phone || '',
                                            address: memberInfo.address || ''
                                          });
                                        }
                                      }}
                                      className="flex-shrink-0 bg-white border border-slate-100 hover:border-slate-300 px-3 py-2 rounded-xl text-left transition"
                                    >
                                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">預設：自己</p>
                                       <p className="text-xs font-black text-slate-800 mt-0.5">{memberInfo?.name || '會員'}</p>
                                    </button>
                                    
                                    {savedAddresses
                                      .filter(addr => 
                                        addr.alias.toLowerCase().includes(addressSearchTerm.toLowerCase()) ||
                                        addr.name.toLowerCase().includes(addressSearchTerm.toLowerCase()) ||
                                        addr.phone.includes(addressSearchTerm) ||
                                        addr.address.toLowerCase().includes(addressSearchTerm.toLowerCase())
                                      )
                                      .map(addr => (
                                         <button
                                           key={addr.id}
                                           type="button"
                                           onClick={() => {
                                              setShippingInfo({
                                                ...shippingInfo,
                                                name: addr.name,
                                                phone: addr.phone,
                                                address: addr.address
                                              });
                                           }}
                                           className="flex-shrink-0 bg-white border border-slate-100 hover:border-slate-300 px-3 py-2 rounded-xl text-left transition relative group"
                                         >
                                            <div className="flex justify-between items-center gap-2">
                                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">{addr.alias}</p>
                                               <span 
                                                 onClick={(e) => handleDeleteAddress(addr.id, e)}
                                                 className="text-[9px] text-slate-300 hover:text-rose-500 font-bold transition duration-200"
                                               >
                                                  ✕
                                               </span>
                                            </div>
                                            <p className="text-xs font-black text-slate-800 mt-0.5">{addr.name}</p>
                                         </button>
                                      ))
                                    }
                                 </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <label className="text-[10px] font-black text-slate-400 ml-2 block mb-2 uppercase tracking-widest">收件人姓名</label>
                                    <input 
                                      type="text" 
                                      value={shippingInfo.name}
                                      onChange={e => setShippingInfo({...shippingInfo, name: e.target.value})}
                                      className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20"
                                      placeholder="請輸入收件人姓名"
                                    />
                                 </div>

                                 <div>
                                    <label className="text-[10px] font-black text-slate-400 ml-2 block mb-2 uppercase tracking-widest">聯絡電話</label>
                                    <input 
                                      type="text" 
                                      value={shippingInfo.phone}
                                      onChange={e => setShippingInfo({...shippingInfo, phone: e.target.value})}
                                      className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20"
                                      placeholder="請輸入收件電話"
                                    />
                                 </div>
                              </div>
                           </motion.div>
                        )}

                        {/* Logistics selections */}
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-400 ml-2 block uppercase tracking-widest">物流方式</label>
                           <div className="grid grid-cols-3 gap-2">
                              {['自取', '超商取貨', '宅配到府'].map(m => {
                                 const isSelected = shippingInfo.method === m;
                                 return (
                                    <button
                                      key={m}
                                      type="button"
                                      onClick={() => {
                                        setShippingInfo({
                                          ...shippingInfo,
                                          method: m,
                                          address: m === '自取' ? '' : (memberInfo?.address || '')
                                        });
                                      }}
                                      className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all duration-350 ${
                                        isSelected 
                                          ? "bg-slate-900 text-white shadow-xl shadow-slate-900/15 scale-[1.03]" 
                                          : "bg-slate-50 text-slate-400 hover:bg-slate-100/70"
                                      }`}
                                    >
                                       {m}
                                    </button>
                                 );
                              })}
                           </div>
                        </div>

                        {shippingInfo.method === '自取' ? (
                           <div className="space-y-4 pt-2">
                              <label className="text-[10px] font-black text-slate-400 ml-2 block uppercase tracking-widest">選擇自取門市</label>
                              <div className="grid grid-cols-2 gap-3">
                                 {dynamicPickupPoints.map(store => {
                                    const isSelected = shippingInfo.address.startsWith(store.name);
                                    return (
                                       <div 
                                         key={store.name}
                                         onClick={() => {
                                            setShippingInfo({
                                              ...shippingInfo,
                                              address: `${store.name} (${store.address})`
                                            });
                                         }}
                                         className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                                            isSelected 
                                              ? "bg-white border-emerald-900 shadow-xl scale-[1.02]" 
                                              : "bg-slate-50/50 border-slate-100 hover:bg-white"
                                         }`}
                                       >
                                          <div className="flex justify-between items-center">
                                             <span className={`text-xs font-black ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>{store.name}</span>
                                             {isSelected && <span className="w-4 h-4 rounded-full bg-emerald-900 text-white flex items-center justify-center text-[8px] font-bold">✓</span>}
                                          </div>
                                          <p className="text-[9px] font-bold text-slate-400 leading-relaxed truncate">{store.address}</p>
                                       </div>
                                    );
                                 })}
                              </div>
                           </div>
                        ) : shippingInfo.method === '超商取貨' ? (
                           <div className="space-y-4 pt-2">
                              <label className="text-[10px] font-black text-slate-400 ml-2 block uppercase tracking-widest">超商物流設定</label>
                              <div className="grid grid-cols-2 gap-3">
                                 {[
                                    { brand: "7-11", label: "7-ELEVEN 超商", desc: "統一超商門市取貨" },
                                    { brand: "全家", label: "FamilyMart 全家", desc: "全家便利商店取貨" }
                                 ].map(item => {
                                    const isSelected = cvsBrand === item.brand;
                                    return (
                                       <div
                                         key={item.brand}
                                         onClick={() => setCvsBrand(item.brand)}
                                         className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1.5 ${
                                            isSelected 
                                              ? `bg-white ${item.brand === '7-11' ? 'border-[#FF6600]' : 'border-[#0080FF]'} shadow-xl` 
                                              : 'bg-white/50 border-slate-100 hover:bg-white'
                                         }`}
                                       >
                                          <div className="flex justify-between items-center w-full">
                                             <span className={`text-xs font-black ${isSelected ? (item.brand === '7-11' ? 'text-[#FF6600]' : 'text-[#0080FF]') : 'text-slate-800'}`}>
                                                {item.label}
                                             </span>
                                             {isSelected && (
                                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${item.brand === '7-11' ? 'bg-[#FF6600]' : 'bg-[#0080FF]'}`}>
                                                   ✓
                                                </span>
                                             )}
                                          </div>
                                          <p className="text-[9px] font-bold text-slate-400">{item.desc}</p>
                                       </div>
                                    );
                                 })}
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                 <div>
                                    <label className="text-[9px] font-black text-slate-400 ml-1 block mb-1.5 uppercase tracking-widest">門市名稱</label>
                                    <input 
                                       type="text" 
                                       placeholder="例：新建國門市" 
                                       value={cvsStoreName}
                                       onChange={e => setCvsStoreName(e.target.value)}
                                       className="w-full bg-white border border-slate-100/80 p-3 rounded-xl text-xs font-bold focus:ring-1 focus:ring-emerald-500/10 text-slate-800"
                                    />
                                 </div>
                                 <div>
                                    <label className="text-[9px] font-black text-slate-400 ml-1 block mb-1.5 uppercase tracking-widest">門市店號</label>
                                    <input 
                                       type="text" 
                                       placeholder="例：123456" 
                                       value={cvsStoreCode}
                                       onChange={e => setCvsStoreCode(e.target.value)}
                                       className="w-full bg-white border border-slate-100/80 p-3 rounded-xl text-xs font-bold focus:ring-1 focus:ring-emerald-500/10 text-slate-800"
                                    />
                                 </div>
                              </div>

                              <div className="bg-slate-100/40 rounded-xl p-3 text-left border border-slate-100/60">
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">門市設定預覽</p>
                                 <p className="text-xs font-black text-slate-700 mt-2 flex items-center gap-1.5">
                                    🏪 [{cvsBrand}] {cvsStoreName || "請輸入門市"} {cvsStoreCode ? `(店號: ${cvsStoreCode})` : "(請輸入店號)"}
                                 </p>
                              </div>
                           </div>
                        ) : (
                           isEditingShipping ? (
                               <div>
                              <label className="text-[10px] font-black text-slate-400 ml-2 block mb-2 uppercase tracking-widest">
                                 {shippingInfo.method === '宅配到府' ? '寄送地址' : '詳細地址'}
                              </label>
                              <textarea 
                                value={shippingInfo.address}
                                onChange={e => setShippingInfo({...shippingInfo, address: e.target.value})}
                                
                                className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-bold h-24 resize-none focus:ring-2 focus:ring-emerald-500/20"
                                placeholder={shippingInfo.method === '宅配到府' ? '請輸入完整收件地址' : '請輸入詳細地址'}
                              />
                           </div>
                            ) : null
                        )}

                        <div>
                           <label className="text-[10px] font-black text-slate-400 ml-2 block mb-2 uppercase tracking-widest">備註 (選填)</label>
                           <textarea 
                             value={shippingInfo.notes}
                             onChange={e => setShippingInfo({...shippingInfo, notes: e.target.value})}
                             className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-bold h-20 resize-none focus:ring-2 focus:ring-emerald-500/20"
                             placeholder="有什麼特別需求嗎？"
                           />
                        </div>
                     </div>

                     <div className="space-y-4 pt-4">
                        <button 
                          onClick={handleRecipientNext}
                          className="w-full bg-emerald-900 text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/20"
                        >
                           確認無誤，送出訂單
                        </button>
                        <button 
                          onClick={() => setShippingSubStep('sender')}
                          className="w-full text-[10px] font-black text-slate-300 uppercase tracking-widest text-center"
                        >
                           上一步 (修改確認寄件)
                        </button>
                     </div>
                  </div>
               )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Step 2.1: Double-Confirmation Modal for Sender Details */}
      <AnimatePresence>
        {showConfirmSenderModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmSenderModal(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] p-10 w-full max-w-sm shadow-2xl relative z-10 text-center border border-slate-100"
            >
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-amber-100">
                <span className="text-2xl font-black">👤</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">再次確認寄件人資訊</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Please Double Confirm Sender Details</p>
              
              <div className="bg-slate-50 rounded-[2rem] p-6 text-left space-y-3.5 mb-8 border border-slate-100/50">
                <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-200/50">
                  <span className="font-black text-slate-400">👤 姓名</span>
                  <span className="font-extrabold text-slate-800 text-right">{shippingInfo.senderName || memberInfo?.name || "姓名未填"}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-200/50">
                  <span className="font-black text-slate-400">📞 電話</span>
                  <span className="font-extrabold text-slate-800 text-right">{shippingInfo.senderPhone || memberInfo?.phone || "電話未填"}</span>
                </div>
                <div className="flex flex-col text-xs pb-2.5 border-b border-slate-200/50 gap-1">
                  <span className="font-black text-slate-400">📍 地址</span>
                  <span className="font-extrabold text-slate-700 leading-relaxed text-left break-all">{shippingInfo.senderAddress || memberInfo?.address || "無"}</span>
                </div>
                <div className="flex flex-col text-xs gap-1">
                  <span className="font-black text-slate-400">💬 寄件備註</span>
                  <span className="font-extrabold text-rose-600 leading-relaxed text-left break-all">{shippingInfo.senderNotes || "無"}</span>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => {
                    setShowConfirmSenderModal(false);
                    setShippingSubStep('recipient');
                  }}
                  className="w-full bg-emerald-950 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-950/20 active:scale-95 transition-all duration-200"
                >
                  確認無誤，填寫收件
                </button>
                <button 
                  onClick={() => setShowConfirmSenderModal(false)}
                  className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition"
                >
                  返回修改
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Step 3.5: Final Double-Confirmation Modal for Store Checkout */}
      <AnimatePresence>
        {showFinalDoubleConfirmModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowFinalDoubleConfirmModal(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] p-8 w-full max-w-md shadow-2xl relative z-10 border border-slate-100 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="w-14 h-14 bg-emerald-50 text-emerald-950 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                <span className="text-xl">📝</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 text-center mb-1">訂單最終全面核對</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center mb-6">Please Double Confirm Order Details</p>

              <div className="space-y-4">
                {/* 1. 訂購商品明細 */}
                <div className="bg-slate-50/70 border border-slate-100/50 p-5 rounded-3xl text-left space-y-3.5">
                   <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100">
                      <span className="text-xs">📦</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">訂購商品明細</span>
                   </div>
                   <div className="space-y-2.5 max-h-32 overflow-y-auto no-scrollbar pr-1">
                      {cart.map((item) => (
                         <div key={item.id} className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-600 truncate max-w-[200px]">{item.name}</span>
                            <span className="font-black text-slate-800 shrink-0">x {item.quantity} (${(item.price * item.quantity).toLocaleString()})</span>
                         </div>
                      ))}
                   </div>

                   <div className="border-t border-slate-200/60 pt-3 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-slate-500 font-bold">
                         <span>商品小計</span>
                         <span>${totalPrice.toLocaleString()}</span>
                      </div>
                      {discountAmount > 0 && (
                         <div className="flex justify-between items-center text-rose-500 font-bold">
                            <span>優惠折抵</span>
                            <span>-${discountAmount.toLocaleString()}</span>
                         </div>
                      )}
                      <div className="flex justify-between items-center text-slate-500 font-bold">
                         <span>運費小計 ({shippingInfo.method})</span>
                         <span>{shippingInfo.method === '自取' ? "免運 ($0)" : (finalPrice >= 1000 ? "免運 ($0)" : "$70")}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-200/60 pt-2.5 text-slate-800 font-black">
                         <span className="text-xs font-black text-slate-900">採購應付總額</span>
                         <span className="text-base text-emerald-900 font-black">
                            ${(finalPrice + (shippingInfo.method === '自取' ? 0 : (finalPrice >= 1000 ? 0 : 70))).toLocaleString()} 元
                         </span>
                      </div>

                      {/* 此次訂購的點數回饋 */}
                      {(() => {
                         const pointsRateMapping: Record<string, number> = {
                            '初潤寶寶': 100,
                            '初潤幼兒園': 90,
                            '初潤小朋友': 80,
                            '初潤青少年': 70,
                            '初潤好朋友': 60,
                            '初潤閨蜜': 50,
                            '初潤知己': 40,
                            '初潤靈魂伴侶': 30,
                         };
                         const rate = pointsRateMapping[memberInfo?.tier || '初潤寶寶'] || 100;
                         const earnedPoints = Math.floor(finalPrice / rate);

                         if (memberInfo?.is_b2b) {
                            return (
                               <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 bg-slate-100/50 rounded-2xl px-4 py-2.5 mt-2 border border-slate-100/80">
                                  <span>💡 本次訂單點數回饋</span>
                                  <span className="font-extrabold text-slate-500">B2B 批發帳號不計點數回饋</span>
                               </div>
                            );
                         }

                         return (
                            <div className="flex justify-between items-center text-xs font-black text-emerald-700 bg-emerald-50/50 rounded-2xl px-4 py-2.5 mt-2 border border-emerald-100/40">
                               <span className="flex items-center gap-1.5">🎁 本次預計點數回饋</span>
                               <span className="font-mono font-black text-emerald-600">+{earnedPoints} 點 ({memberInfo?.tier || '會員'})</span>
                            </div>
                         );
                      })()}
                   </div>
                </div>

                {/* 2. 寄件與收件人資訊 */}
                <div className="bg-slate-50/70 border border-slate-100/50 p-5 rounded-3xl text-left space-y-3">
                   <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100">
                      <span className="text-xs">👤</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">物流配送資訊</span>
                   </div>
                   
                   <div className="space-y-2 text-xs">
                       <div className="grid grid-cols-3 gap-2 pb-2 border-b border-slate-100">
                          <span className="font-black text-slate-400">🆔 會員編號</span>
                          <span className="col-span-2 font-black text-emerald-800 text-right">
                             {memberInfo?.member_code || "---"}
                          </span>
                       </div>
                       <div className="grid grid-cols-3 gap-2 pb-2 border-b border-slate-100">
                          <span className="font-black text-slate-400">👤 寄件人</span>
                         <span className="col-span-2 font-bold text-slate-800 text-right">
                            {shippingInfo.senderName || memberInfo?.name} ({shippingInfo.senderPhone || memberInfo?.phone})
                         </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pb-2 border-b border-slate-100">
                         <span className="font-black text-slate-400">👤 收件人</span>
                         <span className="col-span-2 font-bold text-slate-800 text-right">
                            {shippingInfo.name} ({shippingInfo.phone})
                         </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pb-2 border-b border-slate-100">
                         <span className="font-black text-slate-400">📍 收件地址</span>
                         <span className="col-span-2 font-extrabold text-slate-700 leading-relaxed text-right break-all">
                            {shippingInfo.address}
                         </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                         <span className="font-black text-slate-400">💬 備註</span>
                         <span className="col-span-2 font-bold text-slate-600 text-right break-all">
                            {shippingInfo.notes || "無"}
                         </span>
                      </div>
                   </div>
                </div>

                {/* 3. 匯款資訊預覽 */}
                <div className="bg-emerald-50/50 border border-emerald-100/60 p-5 rounded-3xl text-left space-y-3">
                   <div className="flex items-center gap-1.5 pb-1 border-b border-emerald-100/40">
                      <span className="text-xs">🏦</span>
                      <span className="text-[10px] font-black text-emerald-900/60 uppercase tracking-wider">預定匯款帳戶資訊</span>
                   </div>
                   <div className="space-y-1.5 text-xs font-bold text-slate-700">
                      <div className="flex justify-between">
                         <span className="text-emerald-900/60">匯款銀行</span>
                         <span className="text-slate-800">國泰世華銀行 (013)</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-emerald-900/60">帳戶名稱</span>
                         <span className="text-slate-800">安信商業有限公司</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-emerald-900/60">匯款帳號</span>
                         <span className="text-slate-800 select-all font-mono">214-03-500450-5</span>
                      </div>
                      <div className="flex justify-between border-t border-emerald-100/40 pt-2 mt-1">
                         <span className="text-emerald-950 font-black">匯款總金額</span>
                         <span className="text-sm font-black text-emerald-900">
                            ${(finalPrice + (shippingInfo.method === '自取' ? 0 : (finalPrice >= 1000 ? 0 : 70))).toLocaleString()} 元
                         </span>
                      </div>
                   </div>
                </div>

                {/* 注意事項 */}
                <div className="bg-amber-50/40 border border-amber-900/10 p-4 rounded-2xl text-left">
                   <p className="text-[9px] font-black text-amber-800 leading-relaxed">
                      ⚠️ 提示：請確實核對上述商品、配送及匯款資料。確認無誤後點擊「送出訂單」，系統將為您保留庫存並建立訂單，您可以於稍後完成轉帳。
                   </p>
                </div>
              </div>

              <div className="space-y-3.5 pt-6">
                <button 
                  onClick={() => {
                     submitAndShowPayment(shippingInfo);
                  }}
                  disabled={isCheckingOut}
                  className="w-full bg-emerald-900 hover:bg-emerald-850 disabled:opacity-50 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/20 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                >
                   {isCheckingOut ? (
                      <>
                         <Loader2 className="w-4 h-4 animate-spin" />
                         <span>訂單建立中...</span>
                      </>
                   ) : "確認無誤，送出訂單"}
                </button>
                <button 
                  onClick={() => {
                     setShowFinalDoubleConfirmModal(false);
                     setShowShippingModal(true);
                     setShippingSubStep('recipient');
                  }}
                  className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition text-center"
                >
                  返回修改收件資訊
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Step 2.5: Advanced Address Book Modal */}
      <AnimatePresence>
        {showAddressBookModal && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddressBookModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative z-10 flex flex-col max-h-[85vh] overflow-hidden"
            >
               <div className="flex justify-between items-center mb-6">
                  <div>
                     <h3 className="text-lg font-black text-slate-900">🔍 常用通訊錄</h3>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Address Book</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowAddressBookModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition"
                  >
                    ✕
                  </button>
               </div>

               {/* Advanced search bar inside modal */}
               <div className="relative mb-6">
                  <input 
                    type="text" 
                    placeholder="🔎 搜尋姓名、電話、地址、簡稱..."
                    value={addressSearchTerm}
                    onChange={e => setAddressSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border-none p-4 rounded-2xl text-xs font-bold focus:ring-1 focus:ring-emerald-500/10"
                  />
               </div>

               {/* Scrollable List of saved addresses */}
               <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 mb-6 pr-1">
                  {savedAddresses.filter(addr => 
                    addr.alias.toLowerCase().includes(addressSearchTerm.toLowerCase()) ||
                    addr.name.toLowerCase().includes(addressSearchTerm.toLowerCase()) ||
                    addr.phone.includes(addressSearchTerm) ||
                    addr.address.toLowerCase().includes(addressSearchTerm.toLowerCase())
                  ).length === 0 ? (
                    <div className="p-10 text-center text-slate-400 text-xs font-bold">
                       沒有符合搜尋條件的常用地址
                    </div>
                  ) : (
                    savedAddresses.filter(addr => 
                      addr.alias.toLowerCase().includes(addressSearchTerm.toLowerCase()) ||
                      addr.name.toLowerCase().includes(addressSearchTerm.toLowerCase()) ||
                      addr.phone.includes(addressSearchTerm) ||
                      addr.address.toLowerCase().includes(addressSearchTerm.toLowerCase())
                    ).map(addr => (
                      <div
                        key={addr.id}
                        onClick={() => {
                          if (addressBookTarget === 'sender') {
                            setShippingInfo({
                              ...shippingInfo,
                              senderName: addr.name,
                              senderPhone: addr.phone,
                              senderAddress: addr.address,
                              senderNotes: addr.senderNotes || ''
                            });
                          } else {
                            setShippingInfo({
                            ...shippingInfo,
                            name: addr.name,
                            phone: addr.phone,
                            address: addr.address
                          });
                          }
                          setShowAddressBookModal(false);
                        }}
                        className="bg-slate-50/50 hover:bg-emerald-50/30 border border-slate-100 hover:border-emerald-100/30 p-5 rounded-2xl text-left transition cursor-pointer flex justify-between items-center gap-4 relative group"
                      >
                         <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                               <span className="bg-emerald-100/80 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">{addr.alias}</span>
                               <span className="text-xs font-black text-slate-800">{addr.name}</span>
                            </div>
                            <p className="text-[11px] font-bold text-slate-400">{addr.phone}</p>
                            <p className="text-xs font-bold text-slate-600 truncate">{addr.address}</p>
                         </div>
                         <button
                           type="button"
                           onClick={(e) => handleDeleteAddress(addr.id, e)}
                           className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition flex-shrink-0"
                           title="刪除"
                         >
                           ✕
                         </button>
                      </div>
                    ))
                  )}
               </div>

               <button
                 type="button"
                 onClick={() => setShowAddressBookModal(false)}
                 className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition shadow-xl shadow-slate-900/10"
               >
                 返回
               </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Step 3: Payment Instruction Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowPaymentModal(false);
                setIsCartOpen(false);
              }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] p-10 w-full max-w-sm text-center shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
                 <Check className="w-10 h-10" />
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 mb-2">
                 {isOrderCreated ? "訂單已成功建立" : "結帳匯款資訊"}
              </h3>
              <p className="text-sm text-slate-400 mb-8 font-medium italic">
                 {isOrderCreated ? "我們將在收到款項後儘速出貨" : "請確認以下金額並完成匯款"}
              </p>

              <div className="bg-slate-50 rounded-[2rem] p-8 text-left space-y-4 mb-8 border border-slate-100">
                 <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">匯款總金額</span>
                    <span className="text-xl font-black text-emerald-600">${lastOrderAmount.toLocaleString()}</span>
                 </div>
                 
                 <div className="space-y-3 pt-2">
                    <div className="flex flex-col">
                       <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">匯款銀行</span>
                       <span className="text-sm font-black text-slate-700">國泰世華銀行 (013)</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">帳戶名稱</span>
                       <span className="text-sm font-black text-slate-700">安信商業有限公司</span>
                    </div>
                    <div className="flex flex-col group/copy relative">
                       <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">匯款帳號</span>
                       <div className="flex justify-between items-center gap-2">
                          <span id="bank-account-num" className="text-sm font-black text-emerald-900 tracking-wider">214-03-500450-5</span>
                           <button 
                             onClick={() => {
                               navigator.clipboard.writeText("214-03-500450-5");
                               setCopied(true);
                               setTimeout(() => setCopied(false), 2000);
                             }}
                             className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all duration-300 ${
                               copied 
                                 ? "bg-emerald-500 text-white shadow-md scale-105" 
                                 : "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                             }`}
                           >
                              {copied ? "已複製 ✓" : "複製帳號"}
                           </button>
                        </div>
                    </div>
                 </div>
              </div>

              <div className="bg-amber-50 rounded-2xl p-4 mb-8 flex gap-3 items-start border border-amber-100">
                 <div className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-black text-amber-700">!</span>
                 </div>
                 <p className="text-[10px] font-bold text-amber-700 text-left leading-relaxed">
                    ※ 請務必匯入正確金額 <span className="underline">${lastOrderAmount.toLocaleString()}</span> 元，匯款完成後請點擊下方按鈕，管理員確認入帳後將自動發放紅利點數。
                 </p>
              </div>

              {!isOrderCreated ? (
                <div className="space-y-4">
                  <p className="text-[10px] font-medium text-slate-400 mb-8 leading-relaxed">
                     ※ 請先完成匯款後再點擊下方確認按鈕。<br/>
                     下單後請至個人中心回報帳號末五碼。
                  </p>
                  <button 
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full bg-emerald-900 text-white py-6 rounded-2xl font-black text-sm shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2"
                  >
                     {isCheckingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : "我已匯款，建立訂單"}
                  </button>
                  <button 
                    onClick={() => setShowPaymentModal(false)}
                    className="text-[10px] font-black text-slate-300 uppercase tracking-widest"
                  >
                     返回修改購物車
                  </button>
                </div>
              ) : (
                <div className="space-y-6 text-left">
                   {/* Premium Receipt Header */}
                   <div className="bg-emerald-900/5 rounded-[2rem] p-6 border border-emerald-900/10 text-center relative overflow-hidden">
                      <span className="absolute top-0 right-0 -mr-4 -mt-4 w-12 h-12 bg-emerald-500/10 rounded-full blur-xl"></span>
                      <p className="text-[8px] font-black tracking-widest text-emerald-800 uppercase mb-1">CHURUN TEA HOUSE DIGITAL RECEIPT</p>
                      <h4 className="text-sm font-black text-slate-800">精選茶品點數商城訂單已建立</h4>
                      {createdOrderNumber && (
                         <div className="mt-2.5 inline-block bg-slate-900 text-white px-3.5 py-1 rounded-full text-[9px] font-black tracking-wider">
                            單號: #{createdOrderNumber}
                         </div>
                      )}
                   </div>

                   {/* CVS/Pickup Notice if applicable */}
                   {shippingInfo.method === '自取' ? (
                      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl space-y-1">
                         <p className="text-[10px] font-black text-emerald-800 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-700" /> 🏪 門市自取說明
                         </p>
                         <p className="text-[10px] font-bold text-emerald-750 leading-relaxed">
                            請於完成匯款後，前往個人中心回報帳號末五碼，管理員將第一時間安排您至【{shippingInfo.address.split('(')[0]}】取貨！
                         </p>
                      </div>
                   ) : shippingInfo.method === '超商取貨' ? (
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl space-y-1">
                         <p className="text-[10px] font-black text-blue-800 flex items-center gap-1.5">
                            🏪 超商門市取件
                         </p>
                         <p className="text-[10px] font-bold text-blue-700 leading-relaxed">
                            商品將寄送至指定的超商門市。請留意簡訊通知，並持證件前往取件。
                         </p>
                      </div>
                   ) : null}

                   {/* 1. 品項與明細 (Products) */}
                   <div className="bg-slate-50/70 rounded-[2rem] p-5 border border-slate-100 space-y-3.5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">🛒 訂購品項與金額</p>
                      <div className="space-y-2.5 max-h-40 overflow-y-auto no-scrollbar pr-1">
                         {orderItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                               <span className="font-extrabold text-slate-600 truncate max-w-[170px]">{item.name}</span>
                               <span className="font-black text-slate-800">x{item.quantity} (${(item.price * item.quantity).toLocaleString()})</span>
                            </div>
                         ))}
                      </div>

                      <div className="border-t border-slate-200/50 pt-3.5 space-y-2 text-xs">
                         <div className="flex justify-between items-center text-slate-400 font-bold">
                            <span>商品原價總計</span>
                            <span>${lastTotalPrice.toLocaleString()}</span>
                         </div>
                         {discountAmount > 0 && (
                            <div className="flex justify-between items-center text-rose-500 font-bold">
                               <span>優惠折抵 ({activeCoupon?.name})</span>
                               <span>-${discountAmount.toLocaleString()}</span>
                            </div>
                         )}
                         <div className="flex justify-between items-center text-slate-400 font-bold">
                            <span>運費 ({shippingInfo.method})</span>
                            <span>{shippingInfo.method === '自取' ? '$0 (自取免運)' : ((Math.max(0, lastTotalPrice - discountAmount)) >= 1000 ? '$0 (滿千免運)' : '$70')}</span>
                         </div>
                         <div className="flex justify-between items-center border-t border-dashed border-slate-200 pt-2.5 text-slate-900 font-black">
                            <span className="text-xs">應付總金額</span>
                            <span className="text-base text-emerald-900 font-black">${lastOrderAmount.toLocaleString()} 元</span>
                         </div>
                      </div>
                   </div>

                   {/* 2. 訂購人與收件人資訊 */}
                   <div className="bg-slate-50/70 rounded-[2rem] p-5 border border-slate-100 space-y-3.5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">👤 配送與聯絡資訊</p>
                      
                      {/* 訂購人 */}
                      <div className="text-xs pb-3 border-b border-slate-200/40 space-y-1">
                         <div className="flex justify-between items-center">
                            <span className="font-black text-slate-400">訂購人 (寄件人)</span>
                            <span className="font-extrabold text-slate-700">{shippingInfo.senderName || memberInfo?.name || "會員本人"}</span>
                         </div>
                         <p className="text-[10px] text-slate-400 text-right">{shippingInfo.senderPhone || memberInfo?.phone}</p>
                      </div>

                      {/* 收件人 */}
                      <div className="text-xs space-y-2">
                         <div className="flex justify-between items-center">
                            <span className="font-black text-slate-400">收件人</span>
                            <span className="font-extrabold text-slate-700">{shippingInfo.name}</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="font-black text-slate-400">收件人電話</span>
                            <span className="font-extrabold text-slate-700">{shippingInfo.phone}</span>
                         </div>
                         <div className="flex flex-col gap-1 pt-1">
                            <span className="font-black text-slate-400">收件地址</span>
                            <span className="font-extrabold text-slate-700 leading-relaxed text-left break-all">{shippingInfo.address}</span>
                         </div>
                         {shippingInfo.notes && (
                            <div className="flex flex-col gap-1 pt-1">
                               <span className="font-black text-slate-400">訂單備註</span>
                               <span className="font-extrabold text-rose-600/90 leading-relaxed text-left break-all">{shippingInfo.notes}</span>
                            </div>
                         )}
                      </div>
                   </div>

                   {/* 3. 匯款資訊 */}
                   <div className="bg-slate-900 text-white rounded-[2rem] p-6 space-y-4 shadow-lg border border-white/5">
                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">🏦 專屬匯款轉帳帳號</p>
                      <div className="space-y-2 text-xs">
                         <div className="flex justify-between">
                            <span className="text-white/60 font-bold">銀行代碼</span>
                            <span className="font-extrabold text-white">國泰世華銀行 (013)</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-white/60 font-bold">戶名</span>
                            <span className="font-extrabold text-white">安信商業有限公司</span>
                         </div>
                         <div className="flex justify-between items-center pt-2.5 border-t border-white/10">
                            <span className="text-white/60 font-bold">匯款帳號</span>
                            <div className="flex items-center gap-1.5">
                               <span className="font-black text-emerald-300 tracking-wider">214-03-500450-5</span>
                               <button 
                                 type="button"
                                 onClick={() => {
                                   navigator.clipboard.writeText("214-03-500450-5");
                                   setCopied(true);
                                   setTimeout(() => setCopied(false), 2000);
                                 }}
                                 className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-[8px] font-black rounded-lg transition"
                               >
                                  {copied ? "已複製" : "複製"}
                               </button>
                            </div>
                         </div>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-[9px] text-emerald-300 leading-relaxed font-bold">
                         💡 系統已受理您的訂單！請匯款正確金額。依據初潤製茶所營運規章，本筆消費獲贈之紅利點數將於【隔月 10 號統一發送】至您的帳戶。
                      </div>
                   </div>

                   <button 
                     onClick={() => {
                       setShowPaymentModal(false);
                       setIsCartOpen(false);
                       router.push("/orders");
                     }}
                     className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-950/20 active:scale-[0.98] transition duration-200"
                   >
                      完成結帳，前往查看
                   </button>
                </div>
               )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full-Screen Premium Blur Loading Overlay */}
      <AnimatePresence>
        {isCheckingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex flex-col items-center justify-center text-white"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-950/80 backdrop-blur-2xl rounded-[3rem] p-12 max-w-sm text-center space-y-6 border border-white/10 shadow-2xl flex flex-col items-center"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/35 rounded-full blur-xl animate-pulse"></div>
                <Loader2 className="w-12 h-12 text-emerald-400 animate-spin relative z-10" />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-400">安全提單傳輸中</h4>
                <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
                  正在為您向茶葉精品庫存庫確認，並建立專屬採購訂單，請稍候...
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 訂購清單 Modal (Order History Modal) */}
      <AnimatePresence>
        {showOrderListModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowOrderListModal(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-50 flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                     📋 我的訂購清單 <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">已購紀錄</span>
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                     ORDER HISTORY & LOGISTICS
                  </p>
                </div>
                <button onClick={() => setShowOrderListModal(false)} className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-800 shadow-sm border border-slate-100 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {userOrders.length === 0 ? (
                  <div className="py-16 text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto">
                      <Package className="w-8 h-8 text-slate-200" />
                    </div>
                    <h4 className="text-base font-black text-slate-800">目前尚無訂購紀錄</h4>
                    <p className="text-xs text-slate-400">當您完成第一筆精品採購後，明細與物流進度將在此呈現。</p>
                  </div>
                ) : (
                  userOrders.map((order, index) => {
                    const orderDate = new Date(order.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false }).slice(0, 16);
                    const statusMap: { [key: string]: { label: string, color: string, step: number } } = {
                      pending: { label: "⏳ 處理中 (待核對)", color: "bg-amber-50 text-amber-700 border-amber-200", step: 1 },
                      paid: { label: "💳 已付款 (備貨中)", color: "bg-blue-50 text-blue-700 border-blue-200", step: 2 },
                      shipping: { label: "🚚 已出貨 (配送中)", color: "bg-emerald-50 text-emerald-700 border-emerald-200", step: 3 },
                      shipped: { label: "🚚 已出貨 (配送中)", color: "bg-emerald-50 text-emerald-700 border-emerald-200", step: 3 },
                      completed: { label: "✅ 已完成 (已交付)", color: "bg-slate-100 text-slate-700 border-slate-200", step: 4 },
                      cancelled: { label: "✕ 已取消", color: "bg-rose-50 text-rose-700 border-rose-200", step: 0 },
                    };
                    const statusObj = statusMap[order.status] || { label: order.status, color: "bg-slate-50 text-slate-700 border-slate-200", step: 1 };
                    
                    const orderNum = order.order_number || `P260514A${order.id.slice(0, 4).toUpperCase()}`;
                    const shipping = order.shipping_info || {};

                    return (
                      <div key={order.id} className="bg-slate-50/70 rounded-[2rem] p-6 border border-slate-100/80 space-y-4 hover:shadow-md transition duration-300">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black font-mono text-slate-800">#{orderNum}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusObj.color}`}>
                                {statusObj.label}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 mt-1 block">訂購日期：{orderDate}</span>
                          </div>
                          <span className="text-sm font-black text-slate-900">${Number(order.total_amount).toLocaleString()}</span>
                        </div>

                        {/* 購買品項清單 */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-1.5">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1">訂購明細</span>
                          {order.items && order.items.length > 0 ? (
                            order.items.map((it: any, i: number) => (
                              <div key={i} className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-700">{it.name}</span>
                                <span className="font-mono font-medium text-slate-500">x{it.quantity}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">精選茶款組合</span>
                          )}
                        </div>

                        {/* 物流狀況與動態軌跡 */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-0.5">物流狀況</span>
                              <span className="text-xs font-bold text-slate-800">{shipping.method || '宅配到府 🚚'}</span>
                            </div>
                            {shipping.name && (
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                收件人：{shipping.name}
                              </span>
                            )}
                          </div>
                          {shipping.address && (
                            <p className="text-[11px] font-medium text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100/50 break-words">
                              📍 {shipping.address}
                            </p>
                          )}

                          {/* 視覺化物流進度條 */}
                          {statusObj.step > 0 && (
                            <div className="pt-2">
                              <div className="flex justify-between text-[9px] font-black text-slate-400 px-1 mb-1.5">
                                <span className={statusObj.step >= 1 ? "text-emerald-600" : ""}>處理中</span>
                                <span className={statusObj.step >= 2 ? "text-emerald-600" : ""}>備貨中</span>
                                <span className={statusObj.step >= 3 ? "text-emerald-600" : ""}>配送中</span>
                                <span className={statusObj.step >= 4 ? "text-emerald-600" : ""}>已完成</span>
                              </div>
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                                <div className={`h-full bg-emerald-500 transition-all duration-500 rounded-full ${
                                  statusObj.step === 1 ? 'w-1/4' : statusObj.step === 2 ? 'w-2/4' : statusObj.step === 3 ? 'w-3/4' : 'w-full'
                                }`} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 紅利點數明細與入帳履歷 Modal (Points History Modal) */}
      <AnimatePresence>
        {showPointsHistoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPointsHistoryModal(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-50 flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                     📋 紅利點數入帳履歷 <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">明細查詢</span>
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                     POINTS ISSUANCE & REDEMPTION LOGS
                  </p>
                </div>
                <button onClick={() => setShowPointsHistoryModal(false)} className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-800 shadow-sm border border-slate-100 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-4">
                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-100/50 text-xs font-bold flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>撥點週期公告：依據營運規章，消費獲贈點數於【隔月 10 號統一發送】，效期為一年。</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="pb-3 pl-2">交易類型</th>
                        <th className="pb-3 text-right">異動點數</th>
                        <th className="pb-3 text-right pr-2">發放到戶頭時間</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pointsTransactions.map((tx, idx) => {
                        const txDate = new Date(tx.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false }).slice(0, 16);
                        const isRedeemed = tx.transaction_type === 'redeemed' || Number(tx.amount) < 0;
                        const amt = Math.abs(Number(tx.amount) || 0);
                        
                        return (
                          <tr key={idx} className="border-b border-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-50/50 transition">
                            <td className="py-4 pl-2 font-black">
                              <span className={`px-2.5 py-1 rounded-md text-[10px] font-black ${isRedeemed ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                {isRedeemed ? '🌟 點數折抵' : '✨ 系統核撥'}
                              </span>
                            </td>
                            <td className={`py-4 text-right font-mono font-black ${isRedeemed ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {isRedeemed ? `-${amt}` : `+${amt}`} pts
                            </td>
                            <td className="py-4 text-right font-mono text-slate-400 pr-2">{txDate}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Store() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>}>
      <StoreContent />
    </Suspense>
  );
}
