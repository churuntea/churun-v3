const fs = require('fs');
let content = fs.readFileSync('app/store/page.tsx', 'utf-8');

const targetStr = `  const submitAndShowPayment = async (info?: any) => {
    const currentShippingInfo = info || shippingInfo;
    if (currentShippingInfo.method === '自取' && !currentShippingInfo.address) {
       alert("請在上方門市卡片中，點擊選擇您的自取門市");
       return;
    }
    if (!currentShippingInfo.name?.trim() || !currentShippingInfo.phone?.trim() || !currentShippingInfo.address?.trim()) {
       alert("請填寫完整的收件資訊 (收件人姓名、電話及地址皆為必填)");
       return;
    }
    if (!currentShippingInfo.senderName?.trim() || !currentShippingInfo.senderPhone?.trim()) {
       alert("請填寫完整的寄件資訊 (寄件人姓名及電話皆為必填)");
       return;
    }

    setIsCheckingOut(true);
    setOrderItems([...cart]);
    setLastTotalPrice(totalPrice);
    const fee = currentShippingInfo.method === '自取' ? 0 : (finalPrice >= 1000 ? 0 : 70);
    setLastShippingFee(fee);
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

      const appliedDeal = bundleDeals.find(deal => {
        if (deal.tier_restriction && memberInfo?.tier !== deal.tier_restriction) return false;
        if (deal.limit_one_per_user) {
          const hasUsed = userOrders.some((o: any) => o.notes && o.notes.includes(\`[套組優惠: \${deal.name}]\`));
          if (hasUsed) return false;
        }
        const items = deal.items;
        let allFound = true;
        items.forEach((ruleItem: any) => {
          const itemInCart = cart.find(it => it.id === ruleItem.id);
          if (!itemInCart || itemInCart.quantity < ruleItem.quantity) {
            allFound = false;
          }
        });
        return allFound;
      });

      const res = await fetch("/api/orders/dynamic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_id: memberInfo.id,
          items: cart.map(item => ({ id: item.id, quantity: item.quantity })),
          discountAmount: discountAmount,
          pointsRedeemed: pointsDiscount,
          couponCode: activeCoupon ? activeCoupon.code : null,
          shippingInfo: {
            ...currentShippingInfo,
            notes: appliedDeal 
                    ? \`\${currentShippingInfo.notes || ''} [套組優惠: \${appliedDeal.name}]\`.trim() 
                    : currentShippingInfo.notes
          }
        })
      });`;

const replaceStr = `  const submitAndShowPayment = async (info?: any) => {
    let finalShippingInfo = { ...(info || shippingInfo) };
    if (!memberInfo?.is_b2b) {
       finalShippingInfo.senderName = "初潤總部";
       finalShippingInfo.senderPhone = "049-2391033";
       finalShippingInfo.senderAddress = "南投縣草屯鎮中正路1039號";
    }

    if (finalShippingInfo.method === '自取' && !finalShippingInfo.address) {
       alert("請在上方門市卡片中，點擊選擇您的自取門市");
       return;
    }
    if (!finalShippingInfo.name?.trim() || !finalShippingInfo.phone?.trim() || !finalShippingInfo.address?.trim()) {
       alert("請填寫完整的收件資訊 (收件人姓名、電話及地址皆為必填)");
       return;
    }
    if (!finalShippingInfo.senderName?.trim() || !finalShippingInfo.senderPhone?.trim()) {
       alert("請填寫完整的寄件資訊 (寄件人姓名及電話皆為必填)");
       return;
    }

    setIsCheckingOut(true);
    setOrderItems([...cart]);
    setLastTotalPrice(totalPrice);
    const fee = finalShippingInfo.method === '自取' ? 0 : (finalPrice >= 1000 ? 0 : 70);
    setLastShippingFee(fee);
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
            name: finalShippingInfo.name,
            phone: finalShippingInfo.phone,
            address: finalShippingInfo.address
          })
          .eq("id", memberInfo.id);
        
        setMemberInfo((prev: any) => ({
          ...prev,
          name: finalShippingInfo.name,
          phone: finalShippingInfo.phone,
          address: finalShippingInfo.address
        }));
      }

      const appliedDeal = bundleDeals.find(deal => {
        if (deal.tier_restriction && memberInfo?.tier !== deal.tier_restriction) return false;
        if (deal.limit_one_per_user) {
          const hasUsed = userOrders.some((o: any) => o.notes && o.notes.includes(\`[套組優惠: \${deal.name}]\`));
          if (hasUsed) return false;
        }
        const items = deal.items;
        let allFound = true;
        items.forEach((ruleItem: any) => {
          const itemInCart = cart.find(it => it.id === ruleItem.id);
          if (!itemInCart || itemInCart.quantity < ruleItem.quantity) {
            allFound = false;
          }
        });
        return allFound;
      });

      const res = await fetch("/api/orders/dynamic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_id: memberInfo.id,
          items: cart.map(item => ({ id: item.id, quantity: item.quantity })),
          discountAmount: discountAmount,
          pointsRedeemed: pointsDiscount,
          couponCode: activeCoupon ? activeCoupon.code : null,
          shippingInfo: {
            ...finalShippingInfo,
            notes: appliedDeal 
                    ? \`\${finalShippingInfo.notes || ''} [套組優惠: \${appliedDeal.name}]\`.trim() 
                    : finalShippingInfo.notes
          }
        })
      });`;

const idx = content.indexOf(targetStr);
if (idx === -1) {
  console.log("Could not find the target string! Checking partial match...");
  const firstLine = "  const submitAndShowPayment = async (info?: any) => {";
  const startIdx = content.indexOf(firstLine);
  if (startIdx !== -1) {
    console.log("Found function start at index", startIdx);
  }
} else {
  content = content.substring(0, idx) + replaceStr + content.substring(idx + targetStr.length);
  fs.writeFileSync('app/store/page.tsx', content);
  console.log('Successfully fixed page.tsx');
}
