"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { dbCache, fetchWithSWR } from "@/utils/dbCache";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  ArrowRight, 
  LayoutDashboard, 
  Zap, 
  User, 
  Loader2,
  ArrowLeft,
  Star,
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
  Search,
  Trash2,
  Check,
  Package
} from "lucide-react";

interface Coupon {
  code: string;
  name: string;
  discountType: 'fixed' | 'percent';
  value: number; // e.g. 200 for fixed, 12 for percent
  minSpend: number;
  description: string;
}
const TAIWAN_CVS_DATA: Record<string, string[]> = {
  "台北市": ["中正區", "萬華區", "大同區", "中山區", "松山區", "大安區", "信義區", "內湖區", "南港區", "士林區", "北投區", "文山區"],
  "新北市": ["板橋區", "三重區", "中和區", "永和區", "新莊區", "新店區", "土城區", "蘆洲區", "汐止區", "樹林區", "淡水區", "五股區", "泰山區", "林口區", "三峽區", "鶯歌區", "八里區", "瑞芳區"],
  "桃園市": ["桃園區", "中壢區", "平鎮區", "八德區", "楊梅區", "蘆竹區", "大溪區", "龍潭區", "龜山區", "大園區"],
  "台中市": ["中區", "東區", "南區", "西區", "北區", "北屯區", "西屯區", "南屯區", "太平區", "大里區", "霧峰區", "烏日區", "豐原區", "后里區", "潭子區", "大雅區", "沙鹿區", "清水區", "大甲區"],
  "台南市": ["中西區", "東區", "南區", "北區", "安平區", "安南區", "永康區", "歸仁區", "新化區", "麻豆區", "佳里區", "新營區", "白河區", "善化區"],
  "高雄市": ["新興區", "前金區", "苓雅區", "鹽埕區", "鼓山區", "前鎮區", "三民區", "楠梓區", "小港區", "左營區", "鳳山區", "大寮區", "林園區", "岡山區", "路竹區", "旗山區", "美濃區"],
  "基隆市": ["仁愛區", "信義區", "中正區", "中山區", "安樂區", "暖暖區", "七堵區"],
  "新竹市": ["東區", "北區", "香山區"],
  "新竹縣": ["竹北市", "竹東鎮", "新埔鎮", "關西鎮", "湖口鄉", "新豐鄉", "芎林鄉", "寶山鄉"],
  "苗栗縣": ["苗栗市", "頭份市", "竹南鎮", "後龍鎮", "通霄鎮", "苑裡鎮", "公館鄉", "三義鄉"],
  "彰化縣": ["彰化市", "鹿港鎮", "和美鎮", "員林市", "溪湖鎮", "田中鎮", "二林鎮", "北斗鎮", "花壇鄉", "大村鄉"],
  "南投縣": ["南投市", "埔里鎮", "草屯鎮", "竹山鎮", "集集鎮", "名間鄉", "鹿谷鄉", "魚池鄉", "國姓鄉"],
  "雲林縣": ["斗六市", "斗南鎮", "虎尾鎮", "西螺鎮", "土庫鎮", "北港鎮", "麥寮鄉", "古坑鄉"],
  "嘉義市": ["東區", "西區"],
  "嘉義縣": ["太保市", "朴子市", "民雄鄉", "新港鄉", "水上鄉", "中埔鄉", "竹崎鄉", "梅山鄉", "阿里山鄉"],
  "屏東縣": ["屏東市", "潮州鎮", "東港鎮", "恆春鎮", "萬丹鄉", "長治鄉", "內埔鄉", "枋寮鄉", "琉球鄉"],
  "宜蘭縣": ["宜蘭市", "羅東鎮", "蘇澳鎮", "頭城鎮", "礁溪鄉", "冬山鄉", "五結鄉", "三星鄉"],
  "花蓮縣": ["花蓮市", "鳳林鎮", "玉里鎮", "新城鄉", "吉安鄉", "壽豐鄉", "光復鄉", "瑞穗鄉"],
  "台東縣": ["台東市", "成功鎮", "關山鎮", "卑南鄉", "太麻里鄉", "鹿野鄉", "池上鄉", "綠島鄉", "蘭嶼鄉"],
  "澎湖縣": ["馬公市", "湖西鄉", "白沙鄉", "西嶼鄉"],
  "金門縣": ["金城鎮", "金湖鎮", "金沙鎮", "金寧鄉"],
  "連江縣": ["南竿鄉", "北竿鄉", "莒光鄉", "東引鄉"]
};

const generateCvsStores = (brand: string, city: string, dist: string) => {
  const prefix = brand === '7-11' ? '初潤' : '潤茶';
  return [
    { name: `${dist}${prefix}店`, code: brand === '7-11' ? '915801' : '15801', address: `${city}${dist}中山路88號` },
    { name: `${dist}春水店`, code: brand === '7-11' ? '912304' : '12304', address: `${city}${dist}中正路220號` },
    { name: `${dist}初韻店`, code: brand === '7-11' ? '918809' : '18809', address: `${city}${dist}自由街66號` }
  ];
};

function WholesaleContent() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [activeCoupon, setActiveCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [userCoupons, setUserCoupons] = useState<any[]>([]);
  
  // 採購與配送優化狀態
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [shippingSubStep, setShippingSubStep] = useState<'sender' | 'recipient' | 'payment_review'>('sender');
  const [showAddressBookModal, setShowAddressBookModal] = useState(false);
  const [addressSearchTerm, setAddressSearchTerm] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [isEditingShipping, setIsEditingShipping] = useState(false);
  const [isEditingSender, setIsEditingSender] = useState(false);
  const [senderAddressSearchTerm, setSenderAddressSearchTerm] = useState("");
  const [addressBookTarget, setAddressBookTarget] = useState<'sender' | 'recipient'>('recipient');
  const [showConfirmRecipientModal, setShowConfirmRecipientModal] = useState(false);
  const [showConfirmSenderModal, setShowConfirmSenderModal] = useState(false);
  const [syncAsDefault, setSyncAsDefault] = useState(false);

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

  const [cvsBrand, setCvsBrand] = useState("7-11");
  const [cvsStoreName, setCvsStoreName] = useState("");
  const [cvsStoreCode, setCvsStoreCode] = useState("");
  const [selectedCity, setSelectedCity] = useState("台北市");
  const [selectedDist, setSelectedDist] = useState("中正區");

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
    if (!savedId) {
      router.replace("/login");
      return;
    }
    fetchData(savedId);
  }, [router]);

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    const { data: mData } = await supabase.from("members").select("*").eq("id", userId).single();
    setMemberInfo(mData);
    if (mData) {
      setShippingInfo(prev => ({
        ...prev,
        name: mData.name || '',
        phone: mData.phone || '',
        address: '',
        method: '自取',
        senderName: mData.name || '',
        senderPhone: mData.phone || '',
        senderAddress: mData.address || '',
        senderNotes: ''
      }));
    }

    // 智慧商品列表快取 (SWR 緩存 3 分鐘，本地持久化)
    const productsKey = "churun_cache:products_active";
    const pData = await fetchWithSWR(productsKey, async () => {
      const { data, error } = await supabase.from("products").select("*").eq("status", "active");
      if (error) throw error;
      return data || [];
    }, {
      ttl: 180000, // 3 分鐘快取
      useLocal: true,
      onBackgroundUpdate: (fresh) => setProducts(fresh)
    });
    setProducts(pData || []);

    // 載入該會員在庫存中擁有的、未使用的優惠券
    try {
      const { data: mcData } = await supabase
        .from("member_coupons")
        .select(`
          id,
          is_used,
          coupons (
            id,
            code,
            name,
            discount_type,
            value,
            min_spend,
            description
          )
        `)
        .eq("member_id", userId)
        .eq("is_used", false);

      if (mcData) {
        const fetched: any[] = mcData
          .filter((row: any) => row.coupons !== null)
          .map((row: any) => ({
            id: row.id, // 會員優惠券紀錄的 ID，以便結帳後標記已使用
            code: row.coupons.code,
            name: row.coupons.name,
            discountType: row.coupons.discount_type,
            value: Number(row.coupons.value),
            minSpend: Number(row.coupons.min_spend),
            description: row.coupons.description
          }));
        setUserCoupons(fetched);
      }
    } catch (couponErr) {
      console.error("載入會員自訂優惠券失敗:", couponErr);
    }

    setIsLoading(false);
  };

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

    setShippingInfo(prev => ({
      ...prev,
      name: finalName,
      phone: finalPhone,
      address: computedAddress
    }));
    setShippingSubStep('payment_review');
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


  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      const newQty = (prev[id] || 0) + delta;
      if (newQty <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: newQty };
    });
  };

  const totalAmount = products.reduce((acc, p) => acc + (cart[p.id] || 0) * p.price, 0);
  const totalItems = Object.values(cart).reduce((acc, q) => acc + q, 0);

  const getDiscountAmount = () => {
    if (!activeCoupon) return 0;
    if (totalAmount < activeCoupon.minSpend) return 0;
    
    if (activeCoupon.discountType === 'fixed') {
      return activeCoupon.value;
    } else if (activeCoupon.discountType === 'percent') {
      return Math.floor(totalAmount * (activeCoupon.value / 100));
    }
    return 0;
  };

  const discountAmount = getDiscountAmount();
  const finalAmount = Math.max(0, totalAmount - discountAmount);

  const getShippingFee = () => {
    if (shippingInfo.method === '自取') return 0;
    return finalAmount >= 1000 ? 0 : 70;
  };
  const shippingFee = getShippingFee();
  const orderTotalAmount = finalAmount + shippingFee;

  const handleCheckout = async () => {
    if (totalAmount <= 0) return;
    if (memberInfo.virtual_balance < orderTotalAmount) {
      alert("預收款餘額不足，請先聯繫總部儲值。");
      return;
    }

    setIsSubmitting(true);

    if (syncAsDefault && memberInfo) {
      try {
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
      } catch (err) {
        console.error("更新預設會員地址失敗:", err);
      }
    }
    
    // 這裡調用我們之前的動態訂單 API
    const response = await fetch("/api/orders/dynamic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: memberInfo.id,
        items: Object.entries(cart).map(([id, qty]) => ({ id, quantity: qty })),
        discountAmount: discountAmount,
        couponCode: activeCoupon ? activeCoupon.code : null,
        shippingInfo: shippingInfo
      })
    });

    const result = await response.json();
    
    if (result.success) {
      // 如果使用的是真正的資料庫優惠券，將其狀態更新為已使用！
      if (activeCoupon && activeCoupon.id) {
        try {
          await supabase
            .from("member_coupons")
            .update({ is_used: true, used_at: new Date().toISOString() })
            .eq("id", activeCoupon.id);
        } catch (couponErr) {
          console.error("更新優惠券狀態為已使用失敗:", couponErr);
        }
      }
      router.push(`/order-success?id=${result.orderId || ''}&amount=${orderTotalAmount}`);
    } else {
      alert("結帳失敗: " + result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-40">
      
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-50 px-8 py-6 flex items-center gap-6 max-w-lg mx-auto">
         <Link href="/" className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition">
            <ArrowLeft className="w-5 h-5" />
         </Link>
         <h1 className="text-sm font-black tracking-[0.3em] text-slate-800 uppercase">特選精品採購</h1>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-10 mt-4">
        
        {/* Wallet Warning */}
        <div className={`p-8 rounded-[2.5rem] border flex items-center gap-6 transition ${memberInfo?.virtual_balance < 5000 ? 'bg-rose-50 border-rose-100 text-rose-900' : 'bg-emerald-50 border-emerald-100 text-emerald-900'}`}>
           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${memberInfo?.virtual_balance < 5000 ? 'bg-white text-rose-500' : 'bg-white text-emerald-500'}`}>
              {memberInfo?.virtual_balance < 5000 ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
           </div>
           <div className="flex-1">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">當前可用預收款</p>
              <h3 className="text-2xl font-black tracking-tight">${Number(memberInfo?.virtual_balance || 0).toLocaleString()}</h3>
           </div>
           {memberInfo?.virtual_balance < 5000 && <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">餘額偏低</span>}
        </div>

        {/* Product List */}
        <div className="space-y-6">
           {isLoading ? (
             <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-200" /></div>
           ) : products.map((product, i) => (
             <motion.div 
               key={product.id}
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: i * 0.05 }}
               className="bg-white rounded-[2.5rem] p-6 border border-slate-50 shadow-sm flex items-center gap-6 group hover:border-emerald-100 transition"
             >
                <div className="w-20 h-20 rounded-3xl overflow-hidden bg-slate-50">
                   <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm">{product.name}</h4>
                    {product.description && (
                       <p className="text-[11px] font-bold text-slate-400/90 leading-relaxed">{product.description}</p>
                    )}
                    <p className="text-emerald-600 font-black text-sm">${product.price}</p>
                 </div>
                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl">
                   <button 
                     onClick={() => updateQuantity(product.id, -1)}
                     className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 transition"
                   >
                      <Minus className="w-4 h-4" />
                   </button>
                   <span className="text-sm font-black w-4 text-center">{cart[product.id] || 0}</span>
                   <button 
                     onClick={() => updateQuantity(product.id, 1)}
                     className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-emerald-600 transition"
                   >
                      <Plus className="w-4 h-4" />
                   </button>
                </div>
             </motion.div>
           ))}
         </div>
 
         {/* Promo Coupons Section */}
         {totalItems > 0 && (
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                 <div>
                    <h3 className="text-sm font-black text-slate-800 tracking-[0.15em] uppercase">🎟️ 優惠券折抵</h3>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">Select or Enter Coupon</p>
                 </div>
                 {activeCoupon && (
                    <button 
                      onClick={() => { setActiveCoupon(null); setCouponError(null); }}
                      className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                    >
                       取消套用
                    </button>
                 )}
              </div>

              {/* Predefined Coupon Chips (Click to use or cancel) */}
              <div className="grid grid-cols-1 gap-3">
                 {userCoupons.map((coupon) => {
                    const isSelected = activeCoupon?.code === coupon.code;
                    const canApply = totalAmount >= coupon.minSpend;
                    
                    return (
                      <div 
                        key={coupon.code}
                        onClick={() => {
                           if (isSelected) {
                              setActiveCoupon(null);
                           } else {
                              if (totalAmount < coupon.minSpend) {
                                 setCouponError(`未達該券最低消費門檻 $${coupon.minSpend}`);
                                 setActiveCoupon(null);
                              } else {
                                 setActiveCoupon(coupon);
                                 setCouponError(null);
                              }
                           }
                        }}
                        className={`p-5 rounded-[1.8rem] border-2 transition cursor-pointer flex justify-between items-center relative overflow-hidden ${isSelected ? 'border-emerald-500 bg-emerald-50/20 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}
                      >
                         {isSelected && (
                            <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500 rounded-bl-2xl flex items-center justify-center">
                               <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                               </svg>
                            </div>
                         )}
                         <div className="space-y-1 pr-6">
                            <div className="flex items-center gap-2">
                               <span className="font-black text-xs text-slate-800 tracking-wider bg-slate-100 px-2 py-0.5 rounded-md uppercase">{coupon.code}</span>
                               <span className="font-bold text-xs text-slate-700">{coupon.name}</span>
                            </div>
                            <p className="text-[10px] font-medium text-slate-400">{coupon.description}</p>
                            {!canApply && (
                               <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
                                  還差 ${coupon.minSpend - totalAmount} 即可折抵
                               </p>
                            )}
                         </div>
                         <div className="text-right flex-shrink-0">
                            <span className={`font-black text-lg ${isSelected ? 'text-emerald-600' : 'text-slate-700'}`}>
                               {coupon.discountType === 'fixed' ? `$${coupon.value}` : `${100 - coupon.value}折`}
                            </span>
                         </div>
                      </div>
                    );
                 })}
              </div>

              {/* Manual Coupon Input */}
              <div className="space-y-2 pt-2">
                 <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-2">手動輸入折扣碼</label>
                 <div className="flex gap-3">
                    <input 
                      type="text" 
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="輸入優惠代碼（如 WELCOME200）" 
                      className="flex-1 bg-slate-50/50 border-none p-4 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-900/5 transition shadow-inner"
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
                         const found = [...userCoupons].find(c => c.code === code);
                         if (found) {
                            if (totalAmount < found.minSpend) {
                               setCouponError(`未達該券最低消費門檻 $${found.minSpend}`);
                               setActiveCoupon(null);
                            } else {
                               setActiveCoupon(found);
                               setCouponError(null);
                            }
                         } else {
                            setCouponError("找不到此優惠代碼，請重新輸入");
                         }
                      }}
                      className="px-6 bg-slate-900 text-white rounded-2xl text-xs font-black tracking-widest"
                    >
                       套用
                    </button>
                 </div>
                 {couponError && (
                    <p className="text-[10px] font-bold text-rose-500 ml-2 mt-1">{couponError}</p>
                 )}
              </div>
           </div>
         )}

       </main>

      {/* Floating Checkout Bar */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-32 left-4 right-4 z-[60] mx-auto max-w-sm"
          >
             <div className="bg-slate-900 rounded-[2.5rem] p-5 shadow-2xl shadow-slate-900/30 flex flex-col gap-3 border border-white/10">
                {activeCoupon && discountAmount > 0 && (
                  <div className="space-y-1.5 pb-2.5 border-b border-white/5 text-[10px] font-bold text-white/50">
                    <div className="flex justify-between items-center">
                      <span>商品原價總計</span>
                      <span className="line-through">${totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-rose-400">
                      <span>優惠折抵 ({activeCoupon.name})</span>
                      <span>-${discountAmount.toLocaleString()}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between w-full">
                  <div className="space-y-0.5">
                     <p className="text-[7px] font-black text-white/40 uppercase tracking-[0.2em]">
                       {activeCoupon && discountAmount > 0 ? '折抵後應付' : '採購總額'} ({totalItems} 件)
                     </p>
                     <h3 className="text-xl font-black text-white tracking-tighter">
                       ${finalAmount.toLocaleString()}
                     </h3>
                  </div>
                  <button 
                    onClick={() => setShowConfirmModal(true)}
                    disabled={isSubmitting}
                    className="bg-emerald-500 text-white px-5 py-4 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 flex items-center gap-2 active:scale-95 transition disabled:opacity-50"
                  >
                     {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
                       <>確認結帳 <ArrowRight className="w-3.5 h-3.5" /></>
                     )}
                  </button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 1: Confirm Order Modal */}
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
              <div className="flex items-center justify-between mb-8 px-4 shrink-0">
                  <div className="flex flex-col items-center">
                     <span className="w-6 h-6 rounded-full bg-emerald-950 text-white font-black text-[10px] flex items-center justify-center shadow-lg shadow-emerald-950/20">1</span>
                     <span className="text-[8px] font-black text-slate-800 mt-1 uppercase tracking-wider">確認明細</span>
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
              
              <h3 className="text-xl font-black text-slate-900 text-center mb-6">請確認採購明細</h3>
              
              <div className="space-y-4 mb-8 max-h-60 overflow-y-auto no-scrollbar pr-2">
                 {Object.keys(cart).length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-bold">
                       採購單內無商品，請返回修改
                    </div>
                 ) : (
                    Object.entries(cart).map(([id, qty]) => {
                       const product = products.find(p => p.id === id);
                       if (!product) return null;
                       return (
                          <div key={id} className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-50 gap-3">
                             <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100 shrink-0">
                                   <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                </div>
                                <span className="text-xs font-bold text-slate-600 truncate">{product.name}</span>
                             </div>
                             <div className="flex items-center gap-2 bg-white border border-slate-100 p-1.5 rounded-xl shadow-sm shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (qty === 1) {
                                      if (confirm(`確定要從採購單中刪除「${product.name}」嗎？`)) {
                                        updateQuantity(id, -1);
                                      }
                                    } else {
                                      updateQuantity(id, -1);
                                    }
                                  }}
                                  className="w-5 h-5 rounded-md bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition active:scale-95"
                                >
                                   <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-black text-slate-800 min-w-[14px] text-center">{qty}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(id, 1)}
                                  className="w-5 h-5 rounded-md bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 flex items-center justify-center transition active:scale-95"
                                >
                                   <Plus className="w-3 h-3" />
                                </button>
                             </div>
                          </div>
                       );
                    })
                 )}
              </div>

              <div className="pt-6 border-t border-slate-100 mb-8 space-y-2">
                 <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                    <span>採購小計</span>
                    <span>${totalAmount.toLocaleString()}</span>
                 </div>
                 {activeCoupon && discountAmount > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-rose-500">
                       <span>優惠折抵 ({activeCoupon.name})</span>
                       <span>-${discountAmount.toLocaleString()}</span>
                    </div>
                 )}
                 <div className="pt-2 border-t border-dashed border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">應付總額</span>
                    <span className="text-xl font-black text-slate-900">${finalAmount.toLocaleString()}</span>
                 </div>
              </div>

              <div className="space-y-4">
                 <button 
                   onClick={() => {
                     setShowConfirmModal(false);
                     setShippingSubStep('sender');
                     setShowShippingModal(true);
                   }}
                   disabled={Object.keys(cart).length === 0}
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

      {/* Step 2: Shipping Modal */}
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
                           <span className="w-6 h-6 rounded-full bg-emerald-950 text-white font-black text-[10px] flex items-center justify-center">✓</span>
                           <span className="text-[8px] font-black text-slate-400 mt-1 uppercase tracking-wider">確認明細</span>
                        </div>
                        <div className="flex-1 h-[2px] bg-emerald-950/30 mx-2"></div>
                        <div className="flex flex-col items-center">
                           <span className="w-6 h-6 rounded-full bg-emerald-950 text-white font-black text-[10px] flex items-center justify-center shadow-lg shadow-emerald-950/20">2</span>
                           <span className="text-[8px] font-black text-emerald-950 mt-1 uppercase tracking-wider">確認寄件</span>
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
                             className="rounded text-emerald-950 focus:ring-emerald-950 w-4 h-4"
                           />
                           <div className="text-left">
                              <p className="text-[11px] font-black text-slate-855">✍️ 變更寄件人或新增寄件資訊</p>
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
                                            senderAddress: memberInfo.address || '',
                                             senderNotes: ''
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
               ) : shippingSubStep === 'recipient' ? (
                  <div className="space-y-6">
                     {/* Progress Bar */}
                     <div className="flex items-center justify-between mb-8 px-4 shrink-0">
                        <div className="flex flex-col items-center">
                           <span className="w-6 h-6 rounded-full bg-emerald-950 text-white font-black text-[10px] flex items-center justify-center">✓</span>
                           <span className="text-[8px] font-black text-slate-400 mt-1 uppercase tracking-wider">確認明細</span>
                        </div>
                        <div className="flex-1 h-[2px] bg-emerald-950/30 mx-2"></div>
                        <div className="flex flex-col items-center">
                           <span className="w-6 h-6 rounded-full bg-emerald-950 text-white font-black text-[10px] flex items-center justify-center">✓</span>
                           <span className="text-[8px] font-black text-slate-400 mt-1 uppercase tracking-wider">確認寄件</span>
                        </div>
                        <div className="flex-1 h-[2px] bg-emerald-950/30 mx-2"></div>
                        <div className="flex flex-col items-center">
                           <span className="w-6 h-6 rounded-full bg-emerald-950 text-white font-black text-[10px] flex items-center justify-center shadow-lg shadow-emerald-950/20">3</span>
                           <span className="text-[8px] font-black text-emerald-950 mt-1 uppercase tracking-wider">填寫收件</span>
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
                         {shippingInfo.method === '宅配到府' && (
                            <>

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
                             className="rounded text-emerald-955 focus:ring-emerald-955 w-4 h-4"
                           />
                           <div className="text-left">
                              <p className="text-[11px] font-black text-slate-855">✍️ 變更收件人或新增收件資訊</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Change Recipient Details</p>
                           </div>
                        </label>
                            </>
                         )}

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
                                              ? "bg-white border-emerald-955 shadow-xl scale-[1.02]" 
                                              : "bg-slate-50/50 border-slate-100 hover:bg-white"
                                         }`}
                                       >
                                          <div className="flex justify-between items-center">
                                             <span className={`text-xs font-black ${isSelected ? 'text-emerald-955' : 'text-slate-800'}`}>{store.name}</span>
                                             {isSelected && <span className="w-4 h-4 rounded-full bg-emerald-955 text-white flex items-center justify-center text-[8px] font-bold">✓</span>}
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

                              {/* 縣市與鄉鎮區選擇器 */}
                              <div className="grid grid-cols-2 gap-3">
                                 <div>
                                    <label className="text-[9px] font-black text-slate-400 ml-1 block mb-1.5 uppercase tracking-widest">選擇縣市</label>
                                    <select 
                                       value={selectedCity}
                                       onChange={e => {
                                          const city = e.target.value;
                                          setSelectedCity(city);
                                          setSelectedDist(TAIWAN_CVS_DATA[city][0]);
                                       }}
                                       className="w-full bg-white border border-slate-100/80 p-3 rounded-xl text-xs font-bold focus:ring-1 focus:ring-emerald-500/10 text-slate-800 focus:outline-none cursor-pointer"
                                    >
                                       {Object.keys(TAIWAN_CVS_DATA).map(city => (
                                          <option key={city} value={city}>{city}</option>
                                       ))}
                                    </select>
                                 </div>
                                 <div>
                                    <label className="text-[9px] font-black text-slate-400 ml-1 block mb-1.5 uppercase tracking-widest">選擇鄉鎮區</label>
                                    <select 
                                       value={selectedDist}
                                       onChange={e => setSelectedDist(e.target.value)}
                                       className="w-full bg-white border border-slate-100/80 p-3 rounded-xl text-xs font-bold focus:ring-1 focus:ring-emerald-500/10 text-slate-800 focus:outline-none cursor-pointer"
                                    >
                                       {(TAIWAN_CVS_DATA[selectedCity] || []).map(dist => (
                                          <option key={dist} value={dist}>{dist}</option>
                                       ))}
                                    </select>
                                 </div>
                              </div>

                              {/* 推薦門市快速點選 */}
                              <div className="space-y-2">
                                 <label className="text-[9px] font-black text-slate-400 ml-1 block mb-1 uppercase tracking-widest">💡 點選快速自動填入門市</label>
                                 <div className="grid grid-cols-3 gap-2">
                                    {generateCvsStores(cvsBrand, selectedCity, selectedDist).map(store => {
                                       const isThisStore = cvsStoreName === store.name && cvsStoreCode === store.code;
                                       return (
                                          <button
                                             key={store.code}
                                             type="button"
                                             onClick={() => {
                                                setCvsStoreName(store.name);
                                                setCvsStoreCode(store.code);
                                             }}
                                             className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 focus:outline-none ${
                                                isThisStore 
                                                   ? (cvsBrand === '7-11' ? 'bg-[#FF6600]/5 border-[#FF6600]' : 'bg-[#0080FF]/5 border-[#0080FF]')
                                                   : 'bg-slate-50 border-slate-100 hover:bg-slate-100/60'
                                             }`}
                                          >
                                             <span className={`text-[10px] font-black ${isThisStore ? (cvsBrand === '7-11' ? 'text-[#FF6600]' : 'text-[#0080FF]') : 'text-slate-800'}`}>
                                                {store.name}
                                             </span>
                                             <span className="text-[8px] font-bold text-slate-400 font-mono">
                                                店號: {store.code}
                                             </span>
                                          </button>
                                       );
                                    })}
                                 </div>
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
                           <label className="text-[10px] font-black text-slate-400 ml-2 block mb-2 uppercase tracking-widest">採購備註 (選填)</label>
                           <textarea 
                             value={shippingInfo.notes}
                             onChange={e => setShippingInfo({...shippingInfo, notes: e.target.value})}
                             className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-bold h-20 resize-none focus:ring-2 focus:ring-emerald-500/20"
                             placeholder="有什麼特別需求或代寫卡片需求嗎？"
                           />
                        </div>
                     </div>

                                           <div className="space-y-4 pt-4">
                         <button 
                           onClick={handleRecipientNext}
                           className="w-full bg-emerald-900 text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/20"
                         >
                            確認無誤，下一步 (進入總確認)
                         </button>
                         <button 
                           onClick={() => setShippingSubStep('sender')}
                           className="w-full text-[10px] font-black text-slate-300 uppercase tracking-widest text-center"
                         >
                            上一步 (修改確認寄件)
                         </button>
                      </div>
                   </div>
                ) : (
                   <div className="space-y-6">
                      {/* Step 4: Progress Bar */}
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
                            <span className="w-6 h-6 rounded-full bg-emerald-900 text-white font-black text-[10px] flex items-center justify-center">✓</span>
                            <span className="text-[8px] font-black text-slate-400 mt-1 uppercase tracking-wider">填寫收件</span>
                         </div>
                         <div className="flex-1 h-[2px] bg-emerald-900/30 mx-2"></div>
                         <div className="flex flex-col items-center">
                            <span className="w-6 h-6 rounded-full bg-emerald-900 text-white font-black text-[10px] flex items-center justify-center shadow-lg shadow-emerald-900/20">4</span>
                            <span className="text-[8px] font-black text-emerald-900 mt-1 uppercase tracking-wider">扣款確認</span>
                         </div>
                      </div>

                      {/* Step 4 Contents */}
                      <div className="text-center">
                         <h3 className="text-xl font-black text-slate-900">採購扣款與訂單總確認</h3>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Virtual Balance Payment Confirmation</p>
                         <div className="mt-2.5 inline-flex items-center gap-1.5 bg-slate-100 px-3.5 py-1 rounded-full text-[10px] font-black text-slate-600 tracking-wider">
                            <span>🆔 會員編號:</span>
                            <span className="text-emerald-800">{memberInfo?.member_code || "---"}</span>
                         </div>
                      </div>

                      {/* Virtual Balance Card */}
                      <div className="bg-gradient-to-br from-slate-900 to-emerald-955 text-white p-6 rounded-[2rem] text-left space-y-4 shadow-xl">
                         <div className="flex justify-between items-center">
                            <span className="text-[8px] font-black bg-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest text-emerald-300">
                               💰 預收款帳戶餘額
                            </span>
                            <span className="text-[9px] text-white/50 font-bold uppercase tracking-widest">Pre-payments Balance</span>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <p className="text-[10px] font-bold text-white/60">目前餘額</p>
                               <p className="text-base font-black tracking-wide">${(memberInfo?.virtual_balance || 0).toLocaleString()} 元</p>
                            </div>
                            <div>
                               <p className="text-[10px] font-bold text-emerald-300/80">應扣款總額</p>
                               <p className="text-base font-black text-emerald-300 tracking-wide">-${orderTotalAmount.toLocaleString()} 元</p>
                            </div>
                         </div>
                         <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-white/60">扣款後餘額</span>
                            <span className="text-xs font-black text-emerald-200">
                               ${( (memberInfo?.virtual_balance || 0) - orderTotalAmount ).toLocaleString()} 元
                            </span>
                         </div>
                      </div>

                      {/* Itemized Order Confirmation Box */}
                      <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] text-left space-y-4">
                         <span className="text-[8px] font-black text-slate-400 bg-slate-200/50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            🛒 採購商品明細
                         </span>
                         <div className="space-y-3 max-h-40 overflow-y-auto no-scrollbar">
                            {Object.entries(cart).map(([id, qty]) => {
                               const product = products.find(p => p.id === id);
                               if (!product) return null;
                               return (
                                  <div key={id} className="flex justify-between items-center text-xs">
                                     <span className="font-bold text-slate-600 truncate max-w-[180px]">{product.name}</span>
                                     <span className="font-black text-slate-800 shrink-0">x {qty} (${(product.wholesale_price * qty).toLocaleString()})</span>
                                  </div>
                               );
                            })}
                         </div>

                         <div className="border-t border-slate-200/60 pt-3 space-y-2 text-xs">
                            <div className="flex justify-between items-center text-slate-500 font-bold">
                               <span>商品小計</span>
                               <span>${totalAmount.toLocaleString()}</span>
                            </div>
                            {discountAmount > 0 && (
                               <div className="flex justify-between items-center text-rose-500 font-bold">
                                  <span>優惠券折抵</span>
                                  <span>-${discountAmount.toLocaleString()}</span>
                               </div>
                            )}
                            <div className="flex justify-between items-center text-slate-500 font-bold">
                               <span>運費小計 ({shippingInfo.method})</span>
                               <span>{shippingFee === 0 ? "免運 ($0)" : `${shippingFee}`}</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-slate-200 pt-2 text-slate-800 font-black">
                               <span className="text-sm">應扣款總額</span>
                               <span className="text-base text-emerald-900 font-extrabold">${orderTotalAmount.toLocaleString()} 元</span>
                            </div>
                         </div>
                      </div>

                      {/* Order Summary Confirmation Card */}
                      <div className="bg-amber-50/40 border border-amber-900/10 p-5 rounded-2xl text-left space-y-2">
                         <p className="text-[9px] font-black text-amber-800 bg-amber-100/60 px-2.5 py-1 rounded-full uppercase tracking-widest w-max">
                            ⚠️ 採購確認注意事項
                         </p>
                         <p className="text-[11px] font-bold text-amber-900/80 leading-relaxed">
                            請確認您的收件人姓名、電話、地址以及寄件人備註無誤。送出採購訂單後，系統將直接從您的加盟合作商預收款帳戶餘額中扣減應扣款總額，並立即同步發布出貨通知至總部物流中心。
                         </p>
                      </div>

                      <div className="space-y-4 pt-4">
                         <button 
                           onClick={handleCheckout}
                           disabled={isSubmitting}
                           className="w-full bg-emerald-900 hover:bg-emerald-800 disabled:opacity-50 text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/20 transition flex items-center justify-center gap-2"
                         >
                            {isSubmitting ? (
                               <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>採購提單中...</span>
                               </>
                            ) : "確認無誤，送出採購單扣款"}
                         </button>
                         <button 
                           onClick={() => setShippingSubStep('recipient')}
                           className="w-full text-[10px] font-black text-slate-300 uppercase tracking-widest text-center"
                         >
                            上一步 (修改收件資訊)
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

               <div className="relative mb-6">
                  <input 
                    type="text" 
                    placeholder="🔎 搜尋姓名、電話、地址、簡稱..."
                    value={addressSearchTerm}
                    onChange={e => setAddressSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border-none p-4 rounded-2xl text-xs font-bold focus:ring-1 focus:ring-emerald-500/10"
                  />
               </div>

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

      {/* Bottom Nav */}
      <div className="fixed bottom-8 left-4 right-4 z-50 mx-auto max-w-sm">
         <div className="bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] p-3 flex justify-between items-center shadow-2xl shadow-slate-900/30 border border-white/5">
            <Link href="/" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <LayoutDashboard className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Dashboard</span>
            </Link>
            <Link href="/store" className="flex-1 flex flex-col items-center gap-1 text-white/40 hover:text-white transition">
               <ShoppingBag className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Shop</span>
            </Link>
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 -mt-8 border-4 border-[#FDFBF7]">
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
    </div>
   );
}

export default function Wholesale() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-900" /></div>}>
      <WholesaleContent />
    </Suspense>
  );
}
