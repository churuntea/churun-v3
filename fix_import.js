const fs = require('fs');
let c = fs.readFileSync('app/admin/ambassador/list/page.tsx', 'utf8');
c = c.replace(/\} from "lucide-react";/, '  TrendingUp,\n  MonitorSmartphone\n} from "lucide-react";');
fs.writeFileSync('app/admin/ambassador/list/page.tsx', c);
console.log('Import fixed');
