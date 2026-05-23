const fs = require('fs');

const storeFile = 'app/store/page.tsx';
let storeContent = fs.readFileSync(storeFile, 'utf8');

// 1. Add subtotalAfterDiscount
storeContent = storeContent.replace(
  "const finalPrice = Math.max(0, totalPrice - discountAmount - balanceDiscount - pointsDiscount);",
  "const subtotalAfterDiscount = Math.max(0, totalPrice - discountAmount);\n  const finalPrice = Math.max(0, subtotalAfterDiscount - balanceDiscount - pointsDiscount);"
);

// 2. Change memberInfo.id to memberInfo?.id
storeContent = storeContent.replace(/buyer_id: memberInfo\.id,/g, "buyer_id: memberInfo?.id,");

// 3. Change finalPrice >= 1000 to subtotalAfterDiscount >= 1000 in fee calculations
storeContent = storeContent.replace(
  "const fee = currentShippingInfo.method === '自取' ? 0 : (finalPrice >= 1000 ? 0 : 70);",
  "const fee = currentShippingInfo.method === '自取' ? 0 : (subtotalAfterDiscount >= 1000 ? 0 : 70);"
);

storeContent = storeContent.replace(
  "<span>{shippingInfo.method === '自取' ? \"免運 ($0)\" : (finalPrice >= 1000 ? \"免運 ($0)\" : \"$70\")}</span>",
  "<span>{shippingInfo.method === '自取' ? \"免運 ($0)\" : (subtotalAfterDiscount >= 1000 ? \"免運 ($0)\" : \"$70\")}</span>"
);

// Replace ALL occurrences of finalPrice >= 1000 ? 0 : 70 with subtotalAfterDiscount inside the JSX
storeContent = storeContent.replace(
  /\(finalPrice >= 1000 \? 0 : 70\)/g,
  "(subtotalAfterDiscount >= 1000 ? 0 : 70)"
);

fs.writeFileSync(storeFile, storeContent, 'utf8');
console.log("Updated store/page.tsx");

const wholesaleFile = 'app/wholesale/page.tsx';
let wholesaleContent = fs.readFileSync(wholesaleFile, 'utf8');

wholesaleContent = wholesaleContent.replace(
  "memberId: memberInfo.id,",
  "memberId: memberInfo?.id,"
);

fs.writeFileSync(wholesaleFile, wholesaleContent, 'utf8');
console.log("Updated wholesale/page.tsx");
