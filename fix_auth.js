const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'app');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Pattern to match exactly the `savedId` check and the function call immediately following it.
    const regex = /const\s+savedId\s*=\s*localStorage\.getItem\(['"]churun_member_id['"]\);\s*if\s*\(!savedId\)\s*\{\s*router\.replace\(['"]\/login['"]\);\s*return;\s*\}\s*(fetchData|setCurrentUserId|fetchInitialData|fetchWithdrawals|fetchCommissions|loadData)\(([^)]*?savedId[^)]*?)\);/g;

    content = content.replace(regex, (match, funcName, argsStr) => {
        const newArgs = argsStr.replace('savedId', 'data.member.id');
        return `fetch("/api/me/profile").then(res => res.json()).then(data => {
      if (data.member?.id) {
        ${funcName}(${newArgs});
      } else {
        router.replace("/login");
      }
    }).catch(() => router.replace("/login"));`;
    });

    // Special case for files that just do `setCurrentUserId(savedId);` without extra args
    const regex2 = /const\s+savedId\s*=\s*localStorage\.getItem\(['"]churun_member_id['"]\);\s*if\s*\(!savedId\)\s*\{\s*router\.replace\(['"]\/login['"]\);\s*return;\s*\}\s*setCurrentUserId\(\s*savedId\s*\);/g;
    
    content = content.replace(regex2, () => {
        return `fetch("/api/me/profile").then(res => res.json()).then(data => {
      if (data.member?.id) {
        setCurrentUserId(data.member.id);
      } else {
        router.replace("/login");
      }
    }).catch(() => router.replace("/login"));`;
    });

    // Handle AuthSync.tsx
    if (filePath.endsWith('AuthSync.tsx')) {
        content = content.replace(/localStorage\.setItem\("churun_member_id".*?;/g, '// localStorage set removed');
        content = content.replace(/localStorage\.removeItem\("churun_member_id"\);/g, '// localStorage remove removed');
        content = content.replace(/localStorage\.getItem\("churun_member_id"\)/g, 'data.user.memberId');
        content = content.replace(/window\.location\.reload\(\);/g, '// reload removed');
    } else {
        // Just in case, replace remaining inline getItem with null to prevent fallback to local storage
        content = content.replace(/localStorage\.getItem\(['"]churun_member_id['"]\)/g, 'null /* removed */');
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated:', filePath);
    }
}

function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
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

walkDir(directory);
walkDir(path.join(__dirname, 'components'));
console.log('Fix applied.');
