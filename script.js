const fs = require('fs');
let c = fs.readFileSync('app/admin/ambassador/list/page.tsx', 'utf8');

c = c.replace(/className="hover:bg-slate-50\/50 transition group"/g, 'className="hover:bg-amber-50/30 transition-all group border-b border-slate-50/50 last:border-0"');

c = c.replace(/<div className="w-12 h-12 bg-slate-900 rounded-\\[1rem\\] flex items-center justify-center text-white font-black">\s*\{m\.name\?\.slice\(0, 1\)\}\s*<\/div>/g, 
  `<div className="relative w-14 h-14 rounded-[1.2rem] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
  {m.name?.slice(0, 1)}
  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
     <Crown className="w-3 h-3 text-amber-500" />
  </div>
</div>`);

c = c.replace(/<span className={`px-4 py-2 rounded-full text-\\[9px\\] font-black tracking-widest inline-flex items-center gap-1 \$\{[\s\S]*?<span className="text-\\[8px\\] font-mono font-bold block text-slate-400 mt-1 opacity-60">\[\{m\.tier \|\| "一般會員"\}\]<\/span>/g,
  `<span className={\`px-4 py-2 rounded-full text-[10px] font-black tracking-widest inline-flex items-center gap-1 shadow-sm \${
                               (m.tier === 'partner' || m.tier === '初潤好朋友' || m.tier === '初潤閨蜜') ? 'bg-gradient-to-r from-amber-100 to-orange-50 text-amber-700 border border-amber-200/50' :
                               (m.tier === 'ambassador' || m.tier === '初潤知己' || m.tier === '初潤靈魂伴侶') ? 'bg-gradient-to-r from-emerald-100 to-teal-50 text-emerald-700 border border-emerald-200/50' :
                               (m.tier === 'invited_team' || m.tier === '初潤特邀團') ? 'bg-gradient-to-r from-purple-100 to-fuchsia-50 text-purple-700 border border-purple-200/50' :
                               'bg-slate-100 text-slate-500'
                            }\`}>
                               {(m.tier === 'partner' || m.tier === '初潤好朋友' || m.tier === '初潤閨蜜') ? <Crown className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                               {
                                 (m.tier === 'partner' || m.tier === '初潤好朋友' || m.tier === '初潤閨蜜') ? '合夥人' :
                                 (m.tier === 'ambassador' || m.tier === '初潤品牌大使' || m.tier === '初潤知己' || m.tier === '初潤靈魂伴侶') ? '品牌大使' :
                                 (m.tier === 'invited_team' || m.tier === '初潤特邀團') ? '初潤特邀團' : '一般會員'
                               }
                            </span>
                            <span className="text-[9px] font-mono font-bold block text-slate-400 mt-2 opacity-80">[{m.tier || "一般會員"}]</span>`);

c = c.replace(/<td className="p-6 text-right">\s*<p className="text-sm font-black text-slate-800">\$\{Number\(m\.virtual_balance \|\| 0\)\.toLocaleString\(\)\}\s*<\/p>\s*<\/td>\s*<td className="p-6 text-right">\s*<p className="text-sm font-black text-slate-800">\{Number\(m\.points_balance \|\| 0\)\.toLocaleString\(\)\} pt<\/p>\s*<\/td>\s*<td className="p-6 text-center">\s*<p className="text-sm font-black text-slate-800 bg-slate-100 py-1 px-3 rounded-full inline-block">\{m\.downlines \? m\.downlines\.length : 0\}<\/p>\s*<\/td>\s*<td className="p-6 text-right">\s*<p className="text-sm font-black text-slate-800">\$\{Number\(m\.team_total_sales \|\| 0\)\.toLocaleString\(\)\}<\/p>\s*<\/td>/g,
  `<td className="p-6 text-right">
     <p className="text-sm font-black text-slate-800 tracking-tight">\${Number(m.virtual_balance || 0).toLocaleString()}</p>
  </td>
  <td className="p-6 text-right">
     <p className="text-sm font-black text-amber-600 tracking-tight">{Number(m.points_balance || 0).toLocaleString()} <span className="text-[10px] text-amber-400">pt</span></p>
  </td>
  <td className="p-6 text-center">
     <div className="inline-flex items-center gap-1.5 bg-indigo-50/80 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-100/50">
        <Users className="w-3.5 h-3.5" />
        <span className="text-xs font-black">{m.downlines ? m.downlines.length : 0}</span>
     </div>
  </td>
  <td className="p-6 text-right">
     <p className="text-sm font-black text-emerald-600 tracking-tight">\${Number(m.team_total_sales || 0).toLocaleString()}</p>
  </td>`);

c = c.replace(/className="px-4 py-2 bg-slate-900 text-white rounded-xl text-\\[10px\\] font-black uppercase tracking-widest hover:bg-indigo-600 transition shadow-md shadow-slate-900\/10 active:scale-95"\s*>\s*編輯帳戶 ⚙️/g,
  `className="px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-slate-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 ml-auto"
                            >
                               <Edit2 className="w-3.5 h-3.5" /> 編輯帳戶`);

fs.writeFileSync('app/admin/ambassador/list/page.tsx', c);
