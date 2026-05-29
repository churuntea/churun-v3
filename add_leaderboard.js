const fs = require('fs');

const filePath = 'app/admin/ambassador/list/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add state for tier filter
if (!content.includes('const [selectedTierFilter, setSelectedTierFilter]')) {
  content = content.replace(
    'const [searchTerm, setSearchTerm] = useState("");',
    'const [searchTerm, setSearchTerm] = useState("");\n  const [selectedTierFilter, setSelectedTierFilter] = useState<string>("all");'
  );
}

// 2. Update filteredMembers logic
content = content.replace(
  /const filteredMembers = members\.filter\(m => \{[\s\S]*?\}\);/,
  `const filteredMembers = members.filter(m => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      m.name?.toLowerCase().includes(term) ||
      m.phone?.includes(term) ||
      m.member_code?.toLowerCase().includes(term)
    );
    const matchesTier = selectedTierFilter === "all" || m.tier === selectedTierFilter;
    return matchesSearch && matchesTier;
  });`
);

// 3. Add Leaderboard and Filters UI
const newUICode = `

        {/* --- 大使戰力榮譽榜 (Top 3 Leaderboard) --- */}
        {members.length > 0 && (
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 rounded-[3rem] border border-slate-700 shadow-2xl relative overflow-hidden">
             {/* Decorative Background Elements */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
             
             <div className="relative z-10 mb-8 flex justify-between items-end">
                <div>
                   <h2 className="text-xl font-black text-white flex items-center gap-3">
                      <Crown className="w-6 h-6 text-amber-400" /> 品牌大使戰力排行榜
                   </h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Top Performing Ambassadors</p>
                </div>
                <div className="text-[10px] font-black text-slate-400 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
                   依團隊累積業績排名
                </div>
             </div>

             <div className="relative z-10 flex flex-col md:flex-row justify-center items-end gap-6 md:gap-12 mt-12">
                {(() => {
                   const sorted = [...members].sort((a, b) => (Number(b.team_total_sales) || 0) - (Number(a.team_total_sales) || 0));
                   const top3 = sorted.slice(0, 3);
                   
                   const PodiumCard = ({ member, rank, height, color, glow }: any) => {
                      if (!member) return null;
                      return (
                         <div className="flex flex-col items-center group relative">
                            {/* Floating Stats */}
                            <div className="absolute -top-24 w-48 text-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 z-20">
                               <div className="bg-white text-slate-900 p-3 rounded-2xl shadow-xl border border-slate-100">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">團隊總業績</p>
                                  <p className="text-base font-black font-mono text-indigo-600">NT$ {(Number(member.team_total_sales) || 0).toLocaleString()}</p>
                                  <div className="w-full h-px bg-slate-100 my-2"></div>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">直推人數</p>
                                  <p className="text-sm font-black font-mono text-emerald-600">{member.downlines?.length || 0} 人</p>
                               </div>
                               <div className="w-3 h-3 bg-white rotate-45 mx-auto -mt-1.5 border-r border-b border-slate-100"></div>
                            </div>
                            
                            {/* Avatar */}
                            <div className="relative mb-4 z-10">
                               <div className={\`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-xl \${color}\`}>
                                  {member.name?.slice(0, 1)}
                               </div>
                               <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-slate-900 rounded-xl border-2 border-slate-800 flex items-center justify-center text-sm font-black text-white shadow-lg">
                                  {rank}
                               </div>
                            </div>
                            
                            <h3 className="text-sm font-black text-white">{member.name}</h3>
                            <p className="text-[10px] font-bold text-slate-400 mt-1">{member.member_code}</p>
                            
                            {/* Podium Bar */}
                            <div className={\`w-24 mt-6 rounded-t-3xl \${height} \${glow} bg-gradient-to-t border-t border-white/20 transition-all duration-500 group-hover:-translate-y-2 relative overflow-hidden\`}>
                               <div className="absolute inset-0 bg-white/5 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_linear_infinite]" />
                            </div>
                         </div>
                      );
                   };

                   return (
                      <>
                         {/* Rank 2 (Left) */}
                         <div className="order-2 md:order-1 opacity-90 hover:opacity-100 transition-opacity">
                            <PodiumCard member={top3[1]} rank="2" height="h-24 md:h-32" color="bg-slate-500" glow="from-slate-600 to-slate-400 shadow-[0_0_30px_rgba(148,163,184,0.3)]" />
                         </div>
                         {/* Rank 1 (Center) */}
                         <div className="order-1 md:order-2 z-10 transform md:-translate-y-8">
                            <PodiumCard member={top3[0]} rank="1" height="h-32 md:h-48" color="bg-gradient-to-br from-amber-400 to-orange-500" glow="from-amber-600 to-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.5)]" />
                         </div>
                         {/* Rank 3 (Right) */}
                         <div className="order-3 md:order-3 opacity-90 hover:opacity-100 transition-opacity">
                            <PodiumCard member={top3[2]} rank="3" height="h-20 md:h-24" color="bg-orange-700" glow="from-orange-800 to-orange-600 shadow-[0_0_30px_rgba(194,65,12,0.3)]" />
                         </div>
                      </>
                   );
                })()}
             </div>
          </div>
        )}

        {/* Advanced Filters */}
        <div className="bg-white rounded-[2rem] p-4 flex flex-wrap items-center gap-2 border border-slate-100 shadow-sm">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4 pr-2">篩選職級</span>
           {[
              { id: "all", label: "全部顯示", icon: "🌐" },
              { id: "初潤品牌大使", label: "初潤品牌大使", icon: "💎" },
              { id: "初潤知己", label: "初潤知己", icon: "🤝" },
              { id: "初潤靈魂伴侶", label: "初潤靈魂伴侶", icon: "🌟" },
              { id: "超級小幫手", label: "超級小幫手", icon: "👑" },
           ].map(t => (
              <button
                 key={t.id}
                 onClick={() => setSelectedTierFilter(t.id)}
                 className={\`px-4 py-2 rounded-xl text-[11px] font-black transition-all \${selectedTierFilter === t.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}\`}
              >
                 {t.icon} {t.label}
              </button>
           ))}
        </div>
`;

// Find where to insert it: After KPI Dashboard, before Search Bar
const insertIndex = content.indexOf('{/* Search Bar & Total Counter */}');
if (insertIndex !== -1 && !content.includes('品牌大使戰力排行榜')) {
  const before = content.substring(0, insertIndex);
  const after = content.substring(insertIndex);
  content = before + newUICode + '\n        ' + after;
}

// Write back
fs.writeFileSync(filePath, content);
console.log('Leaderboard and filters added successfully.');
