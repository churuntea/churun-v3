const fs = require('fs');

let c = fs.readFileSync('app/admin/ambassador/list/page.tsx', 'utf8');

// 1. KPI Cards
const kpiDashboard = `
        {/* KPI Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-amber-500/20 transition-all" />
              <div className="relative z-10 flex flex-col gap-2">
                 <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 mb-2">
                    <Crown className="w-5 h-5 text-white" />
                 </div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">活躍大使總數</p>
                 <h3 className="text-3xl font-black text-slate-800">{members.length}</h3>
              </div>
           </div>
           
           <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-indigo-500/20 transition-all" />
              <div className="relative z-10 flex flex-col gap-2">
                 <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-2">
                    <Users className="w-5 h-5 text-white" />
                 </div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">大使體系總直推</p>
                 <h3 className="text-3xl font-black text-slate-800">{members.reduce((sum, m) => sum + (m.downlines ? m.downlines.length : 0), 0)}</h3>
              </div>
           </div>
           
           <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-all" />
              <div className="relative z-10 flex flex-col gap-2">
                 <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-2">
                    <TrendingUp className="w-5 h-5 text-white" />
                 </div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">大使創造總業績</p>
                 <h3 className="text-3xl font-black text-slate-800">$\${members.reduce((sum, m) => sum + (Number(m.team_total_sales) || 0), 0).toLocaleString()}</h3>
              </div>
           </div>
        </div>

        {/* Search Bar & Total Counter */}`;

c = c.replace(/\{\/\* Search Bar & Total Counter \*\/\}/g, kpiDashboard);

// 2. Add badges and also ensure icon imports (TrendingUp missing?)
if (!c.includes('TrendingUp')) {
  c = c.replace('Crown, Users,', 'Crown, Users, TrendingUp,');
}
if (!c.includes('MonitorSmartphone')) {
  c = c.replace('import { Search,', 'import { Search, MonitorSmartphone,');
}

const badgeReplacement = `<div className="flex items-center gap-2 flex-wrap">
                                     <p className="text-sm font-black text-slate-800">{m.name}</p>
                                     {m.downlines && m.downlines.length >= 10 && (
                                        <span className="px-2 py-0.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-md text-[9px] font-black tracking-widest flex items-center gap-1 shadow-md shadow-rose-500/20 shrink-0">
                                           🔥 招募王
                                        </span>
                                     )}
                                     {Number(m.team_total_sales) >= 100000 && (
                                        <span className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-md text-[9px] font-black tracking-widest flex items-center gap-1 shadow-md shadow-amber-500/20 shrink-0">
                                           💎 業績王
                                        </span>
                                     )}
                                     {m.status === 'warning' && (`;

c = c.replace(/<div className="flex items-center gap-2">\s*<p className="text-sm font-black text-slate-800">\{m\.name\}<\/p>\s*\{m\.status === 'warning' && \(/g, badgeReplacement);


// 3. Update Modal
// Read the file and replace modal classes
// bg-white -> bg-slate-900 for main modal
// text-slate-900 -> text-white
// bg-slate-50 -> bg-slate-800/50
// bg-indigo-50 -> bg-gradient-to-br from-indigo-500 to-purple-600, text-white
// text-slate-800 -> text-white (in labels sometimes)

// Let's do it safely by just replacing the modal header and background
c = c.replace(
  /className="bg-white rounded-\[3rem\] p-6 sm:p-10 w-full max-w-xl shadow-2xl relative z-10 max-h-\[92vh\] overflow-y-auto no-scrollbar flex flex-col gap-6 border border-slate-100"/g,
  'className="bg-slate-900 rounded-[3rem] p-6 sm:p-10 w-full max-w-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10 max-h-[92vh] overflow-y-auto no-scrollbar flex flex-col gap-6 border border-slate-800"'
);

c = c.replace(
  /className="flex items-center justify-between border-b border-slate-100 pb-5 shrink-0"/g,
  'className="flex items-center justify-between border-b border-slate-800 pb-5 shrink-0"'
);

c = c.replace(
  /className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-md"/g,
  'className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20"'
);

c = c.replace(/<Users className="w-6 h-6 animate-pulse" \/>/g, '<MonitorSmartphone className="w-6 h-6 animate-pulse" />');

c = c.replace(
  /className="text-base sm:text-lg font-black text-slate-900 tracking-tight">會員帳戶總部控制面板<\/h3>/g,
  'className="text-base sm:text-lg font-black text-white tracking-tight">總部最高控制台</h3>'
);

c = c.replace(
  /className="text-\[9px\] font-black text-slate-400 uppercase tracking-widest mt-0\.5">Admin Member Control Desk<\/p>/g,
  'className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Admin Executive Console</p>'
);

c = c.replace(
  /className="w-8 h-8 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 transition text-sm font-bold"/g,
  'className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition text-sm font-bold"'
);

// Form Inputs inside modal (Basic regex for bg-slate-50 -> bg-slate-800/50, text-slate-900/800 -> text-white)
c = c.replace(/className="w-full bg-slate-50 border-none p-4/g, 'className="w-full bg-slate-800/50 text-white border border-slate-700 p-4');
c = c.replace(/className="flex-1 bg-slate-50 border-none p-4/g, 'className="flex-1 bg-slate-800/50 text-white border border-slate-700 p-4');
c = c.replace(/className="w-full bg-slate-50 border-none px-4/g, 'className="w-full bg-slate-800/50 text-white border border-slate-700 px-4');
c = c.replace(/className="w-full bg-white border border-slate-200 p-4/g, 'className="w-full bg-slate-800/50 text-white border border-slate-700 p-4');

c = c.replace(/className="px-6 py-4 bg-slate-900 text-white rounded-xl text-xs font-black/g, 'className="px-6 py-4 bg-indigo-500 text-white rounded-xl text-xs font-black');


fs.writeFileSync('app/admin/ambassador/list/page.tsx', c);
