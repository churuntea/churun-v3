const fs = require('fs');
let content = fs.readFileSync('app/store/page.tsx', 'utf-8');

const target1 = `    if (!currentShippingInfo.senderName?.trim() || !currentShippingInfo.senderPhone?.trim()) {
       alert("請填寫完整的寄件資訊 (寄件人姓名及電話皆為必填)");
       return;
    }`;

const replace1 = `    let finalShippingInfo = { ...currentShippingInfo };
    if (!memberInfo?.is_b2b) {
       finalShippingInfo.senderName = "初潤總部";
       finalShippingInfo.senderPhone = "049-2391033";
       finalShippingInfo.senderAddress = "南投縣草屯鎮中正路1039號";
    }

    if (!finalShippingInfo.senderName?.trim() || !finalShippingInfo.senderPhone?.trim()) {
       alert("請填寫完整的寄件資訊 (寄件人姓名及電話皆為必填)");
       return;
    }`;

content = content.replace(target1, replace1);

content = content.replace("const fee = currentShippingInfo.method", "const fee = finalShippingInfo.method");
content = content.replace("name: currentShippingInfo.name,", "name: finalShippingInfo.name,");
content = content.replace("phone: currentShippingInfo.phone,", "phone: finalShippingInfo.phone,");
content = content.replace("address: currentShippingInfo.address", "address: finalShippingInfo.address");
content = content.replace("...currentShippingInfo,", "...finalShippingInfo,");
content = content.replace("? `${currentShippingInfo.notes", "? `${finalShippingInfo.notes");
content = content.replace(": currentShippingInfo.notes", ": finalShippingInfo.notes");

fs.writeFileSync('app/store/page.tsx', content);
console.log('Fixed page.tsx');
