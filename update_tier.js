const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Add to MEMBER_TIERS_OPTIONS if exists
  content = content.replace(
    /\{ val: "partner", label: "創業夥伴合夥人 \(partner\)" \},/g,
    `{ val: "partner", label: "創業夥伴合夥人 (partner)" },\n  { val: "超級小幫手", label: "超級小幫手 (合夥人福利)" },`
  );

  // Update tier checks in TSX files
  content = content.replace(
    /m\.tier === 'partner' \|\| m\.tier === '初潤好朋友' \|\| m\.tier === '初潤閨蜜'/g,
    `m.tier === 'partner' || m.tier === '初潤好朋友' || m.tier === '初潤閨蜜' || m.tier === '超級小幫手'`
  );
  
  content = content.replace(
    /m\.tier === "partner" \|\| m\.tier === "初潤好朋友" \|\| m\.tier === "初潤閨蜜"/g,
    `m.tier === "partner" || m.tier === "初潤好朋友" || m.tier === "初潤閨蜜" || m.tier === "超級小幫手"`
  );

  // Update API rate maps
  content = content.replace(
    /'初潤好朋友': (\d+),/g,
    `'初潤好朋友': $1, '超級小幫手': $1,`
  );
  
  // Update Switch cases
  content = content.replace(
    /case "初潤好朋友":/g,
    `case "初潤好朋友":\n      case "超級小幫手":`
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

function walkSync(dir, filelist = []) {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (!dirFile.includes('node_modules') && !dirFile.includes('.next') && !dirFile.includes('.git')) {
        filelist = walkSync(dirFile, filelist);
      }
    } else {
      if (dirFile.endsWith('.ts') || dirFile.endsWith('.tsx')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
}

const files = walkSync(path.join(__dirname, 'app'));
files.forEach(replaceInFile);
console.log('Done.');
