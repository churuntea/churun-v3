const fs = require('fs');
const path = require('path');

const directory = 'd:/0_事業體/初潤製茶所_Gemini/churun-frontend';

function processFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Remove 專屬匯率 lines from arrays
    content = content.replace(/'專屬匯率：\d+元 = 1點',\s*/g, '');
    content = content.replace(/"專屬匯率：\d+元 = 1點",\s*/g, '');
    content = content.replace(/解鎖專屬匯率：<span[^>]*>[^<]*<\/span>/g, '解鎖專屬特權');

    // 2. Replace 分紅
    content = content.replace(/預估分紅與可用餘額/g, '可用餘額');
    content = content.replace(/分紅帳本與交易明細/g, '交易明細');
    content = content.replace(/推廣分紅/g, '推廣回饋');
    content = content.replace(/推薦分紅/g, '推薦回饋');
    content = content.replace(/撥發中的分紅/g, '撥發中的回饋');
    content = content.replace(/預估分紅/g, '預估回饋');
    content = content.replace(/分紅歷史紀錄/g, '歷史紀錄');
    content = content.replace(/推薦分紅獎金/g, '推薦獎金');
    content = content.replace(/B2B 分紅/g, 'B2B 回饋');
    content = content.replace(/分紅: /g, '回饋: ');
    content = content.replace(/分紅比例/g, '回饋比例');
    content = content.replace(/最高級別分紅/g, '最高級別回饋');
    content = content.replace(/進階級別分紅/g, '進階級別回饋');
    content = content.replace(/發放分紅/g, '發放回饋');
    content = content.replace(/分紅表彰大會/g, '表彰大會');
    content = content.replace(/加碼分紅/g, '加碼回饋');
    content = content.replace(/回扣分紅/g, '回饋');
    content = content.replace(/退傭分紅/g, '退傭');
    content = content.replace(/團隊分紅/g, '團隊回饋');
    content = content.replace(/夥伴分紅/g, '夥伴回饋');
    content = content.replace(/分紅返還/g, '回饋返還');
    content = content.replace(/額外分紅加成/g, '額外回饋加成');
    content = content.replace(/額外分紅/g, '額外回饋');
    content = content.replace(/季度分紅特權/g, '季度特權');
    content = content.replace(/下線儲值 [\d.]+%\ 分紅/g, '下線儲值回饋');
    content = content.replace(/[\d.]+%\ 分紅/g, '回饋');

    // 3. Replace 手續費
    content = content.replace(/創業解除行政手續費/g, '創業解除行政費');
    content = content.replace(/享提領手續費減免與/g, '享');
    content = content.replace(/提領手續費減免/g, '');
    content = content.replace(/尊榮提領免手續費/g, '尊榮提領服務');
    content = content.replace(/提領免手續費/g, '提領服務');
    content = content.replace(/免手續費 \(0元\)/g, '無');
    content = content.replace(/免手續費 \(\$0\)/g, '無');
    content = content.replace(/手續費：15元/g, '');
    content = content.replace(/fee:\s*"[^"]*手續費[^"]*"/g, 'fee: "無"');
    content = content.replace(/fee:\s*"10\s*元"/g, 'fee: "無"');
    content = content.replace(/fee:\s*"15\s*元"/g, 'fee: "無"');
    content = content.replace(/fee:\s*"5\s*元"/g, 'fee: "無"');
    content = content.replace(/提款提現手續費/g, '提款提現');
    content = content.replace(/提領手續費為每筆 15 元。/g, '');
    content = content.replace(/提領金額必須大於等級手續費.*\n/g, '');
    content = content.replace(/實時提領手續費與到帳金額試算/g, '實時到帳金額試算');
    content = content.replace(/手續費為 .* 元，將從撥款金額中扣除。/g, '');
    content = content.replace(/👑 會員職級 \(\{memberInfo.tier \|\| '初潤寶寶'\}\) 手續費/g, '');
    content = content.replace(/\{getWithdrawalFee\(memberInfo\.tier\) > 0 \? `-\\\$\\\{getWithdrawalFee\(memberInfo\.tier\)\\} 元` : "免手續費 \(\\\$0\)"\}/g, '');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated:', filePath);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
                walkDir(fullPath);
            }
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            processFile(fullPath);
        }
    }
}

walkDir(path.join(directory, 'app'));
console.log('Done.');
