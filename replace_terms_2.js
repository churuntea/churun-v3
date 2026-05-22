const fs = require('fs');
const path = require('path');

const directory = 'd:/0_事業體/初潤製茶所_Gemini/churun-frontend';

function processFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Remaining replacements
    content = content.replace(/自動撥發分紅與點數/g, '自動撥發回饋與點數');
    content = content.replace(/分紅推薦金/g, '推薦回饋金');
    content = content.replace(/"分紅", /g, '');
    content = content.replace(/您的分紅提領/g, '您的帳戶提領');
    content = content.replace(/可提領分紅/g, '可提領餘額');
    content = content.replace(/分紅帳戶/g, '提領帳戶');
    content = content.replace(/消費分紅/g, '消費回饋');
    content = content.replace(/分紅折讓/g, '回饋折讓');
    content = content.replace(/合夥分紅/g, '合夥回饋');
    content = content.replace(/返點分紅/g, '返點回饋');
    content = content.replace(/業績分紅/g, '業績回饋');
    
    // Withdraw fee message
    content = content.replace(/提領金額必須大於等級手續費.*\n/g, '      setToast({ show: true, message: `提領金額未達標準`, type: "error" });\n');

    // 專屬匯率
    content = content.replace(/專屬匯率：30元 = 1點/g, '專屬特權');
    content = content.replace(/以您的專屬匯率/g, '以您的專屬特權');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated 2:', filePath);
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
console.log('Done 2.');
