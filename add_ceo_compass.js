const fs = require('fs');

const filePath = 'app/admin/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update the state type
content = content.replace(
  'const [marketingSubTab, setMarketingSubTab] = useState<"persona" | "pricing">("persona");',
  'const [marketingSubTab, setMarketingSubTab] = useState<"persona" | "pricing" | "strategy">("strategy");'
);

// 2. Add the toggle button for "strategy"
const pricingButtonCode = `                     <button
                        onClick={() => setMarketingSubTab("pricing")}
                        className={\`text-[9px] font-black px-3.5 py-2 rounded-lg uppercase tracking-wider transition \${marketingSubTab === "pricing" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-400 hover:text-slate-200"}\`}
                     >
                        🎯 訂價與爆款引流
                     </button>`;

const strategyButtonCode = `
                     <button
                        onClick={() => setMarketingSubTab("strategy")}
                        className={\`text-[9px] font-black px-3.5 py-2 rounded-lg uppercase tracking-wider transition \${marketingSubTab === "strategy" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "text-slate-400 hover:text-slate-200"}\`}
                     >
                        🧭 總裁戰略羅盤
                     </button>`;

if (!content.includes('🧭 總裁戰略羅盤')) {
  content = content.replace(pricingButtonCode, pricingButtonCode + strategyButtonCode);
}

// 3. Add the actual panel content for "strategy"
const strategyPanelCode = `
                     {/* TAB C: 總裁戰略羅盤 (Strategy) */}
                     {marketingSubTab === "strategy" && (
                        <motion.div 
                           initial={{ opacity: 0, y: 15 }}
                           animate={{ opacity: 1, y: 0 }}
                           className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-2"
                        >
                           {/* 財務毛利與成本結構透視 */}
                           <div className="bg-slate-900 rounded-[3rem] p-8 border border-slate-800 shadow-sm space-y-6 flex flex-col justify-between relative overflow-hidden">
                              {/* Background glow */}
                              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                              
                              <div className="relative z-10 space-y-4">
                                 <div>
                                    <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                       <Activity className="w-4 h-4 text-emerald-400" /> 💰 財務毛利與成本結構透視
                                    </h4>
                                    <p className="text-[9px] font-black text-slate-400 mt-0.5">Profit Margin & Cost Structure Analysis</p>
                                 </div>

                                 <div className="space-y-4 pt-2">
                                    <div className="space-y-1">
                                       <div className="flex justify-between text-[10px] font-bold">
                                          <span className="text-slate-300">總營業額 (100%)</span>
                                          <span className="text-white font-mono font-black">NT$ {(stats.monthRevenue || 3850000).toLocaleString()}</span>
                                       </div>
                                       <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                                          <div className="h-full bg-slate-600 rounded-full transition-all duration-500" style={{ width: "100%" }} />
                                       </div>
                                    </div>
                                    <div className="space-y-1">
                                       <div className="flex justify-between text-[10px] font-bold">
                                          <span className="text-emerald-400">預估毛利 (約 65%)</span>
                                          <span className="text-emerald-400 font-mono font-black">NT$ {Math.round((stats.monthRevenue || 3850000) * 0.65).toLocaleString()}</span>
                                       </div>
                                       <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                                          <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: "65%" }} />
                                       </div>
                                    </div>
                                    <div className="space-y-1">
                                       <div className="flex justify-between text-[10px] font-bold">
                                          <span className="text-rose-400">物流與包材成本 (約 12%)</span>
                                          <span className="text-rose-400 font-mono font-black">NT$ {Math.round((stats.monthRevenue || 3850000) * 0.12).toLocaleString()}</span>
                                       </div>
                                       <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                                          <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: "12%" }} />
                                       </div>
                                    </div>
                                    <div className="space-y-1">
                                       <div className="flex justify-between text-[10px] font-bold">
                                          <span className="text-amber-400">品牌大使獎金支出 (約 23%)</span>
                                          <span className="text-amber-400 font-mono font-black">NT$ {Math.round((stats.monthRevenue || 3850000) * 0.23).toLocaleString()}</span>
                                       </div>
                                       <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                                          <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: "23%" }} />
                                       </div>
                                    </div>
                                 </div>
                              </div>
                              <div className="relative z-10 p-4 bg-slate-800/80 border border-slate-700/50 rounded-2xl">
                                 <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider block mb-1">💡 毛利結構分析建議：</span>
                                 <p className="text-[10px] font-black text-slate-300 leading-relaxed">
                                    目前毛利率維持在健康的 65% 水平，足以支撐品牌大使的高額獎金。唯物流成本近期因常溫件增加微幅上升至 12%，建議可考慮將免運門檻從 1500 元調升至 1800 元，以提升整體利潤率。
                                 </p>
                              </div>
                           </div>

                           <div className="space-y-10">
                              {/* 雙引擎動能分析 */}
                              <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm space-y-5">
                                 <div>
                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                       <Zap className="w-4 h-4 text-indigo-500" /> 🚀 通路雙引擎動能分析 (B2B vs B2C)
                                    </h4>
                                    <p className="text-[9px] font-black text-slate-400 mt-0.5">Dual-Engine Growth Matrix</p>
                                 </div>
                                 <div className="flex gap-6 items-center pt-2">
                                    <div className="flex-1 space-y-2">
                                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">B2B 合夥人批發 (68%)</p>
                                       <h3 className="text-2xl font-black text-indigo-600 font-mono">NT$ {Math.round((stats.monthRevenue || 3850000) * 0.68).toLocaleString()}</h3>
                                       <div className="flex items-center gap-1 text-[9px] font-black text-emerald-500">
                                          <TrendingUp className="w-3 h-3" /> +15.2% vs 上月
                                       </div>
                                    </div>
                                    <div className="w-px h-16 bg-slate-100"></div>
                                    <div className="flex-1 space-y-2">
                                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">B2C 終端零售 (32%)</p>
                                       <h3 className="text-2xl font-black text-pink-600 font-mono">NT$ {Math.round((stats.monthRevenue || 3850000) * 0.32).toLocaleString()}</h3>
                                       <div className="flex items-center gap-1 text-[9px] font-black text-rose-500">
                                          <TrendingUp className="w-3 h-3" /> -3.1% vs 上月
                                       </div>
                                    </div>
                                 </div>
                                 <div className="w-full h-4 bg-slate-50 rounded-full overflow-hidden flex">
                                    <div className="h-full bg-indigo-500 transition-all duration-500 hover:opacity-90 cursor-pointer" style={{ width: "68%" }} title="B2B 合夥人 68%" />
                                    <div className="h-full bg-pink-500 transition-all duration-500 hover:opacity-90 cursor-pointer" style={{ width: "32%" }} title="B2C 終端零售 32%" />
                                 </div>
                                 <p className="text-[9px] font-black text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    📈 <span className="text-slate-700">戰略解析：</span> B2B 合夥人成長動能強勁，為主要營收護城河；但 B2C 自然流量略顯疲軟，建議加強社群媒體的產品導購力。
                                 </p>
                              </div>

                              {/* AI 總裁級營運方向建議 */}
                              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] p-8 border border-slate-700 shadow-xl shadow-slate-900/20 relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-6 opacity-10">
                                    <Crown className="w-24 h-24 text-white" />
                                 </div>
                                 <div className="relative z-10 space-y-4">
                                    <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                                       <Crown className="w-4 h-4 text-amber-400" /> AI 總裁級營運方向建議
                                    </h4>
                                    <div className="space-y-3">
                                       <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                                          <div className="flex gap-3">
                                             <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                                                <span className="text-amber-400 text-[10px] font-black">1</span>
                                             </div>
                                             <div>
                                                <h5 className="text-[11px] font-black text-white">啟動「B2C新客破冰計畫」</h5>
                                                <p className="text-[9px] font-medium text-slate-300 mt-1 leading-relaxed">有鑑於 B2C 業績微幅下滑，建議針對尚未下單的新註冊會員，發送限時 48 小時的「首購免運+首購禮」推播，以活化潛水客。</p>
                                             </div>
                                          </div>
                                       </div>
                                       <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                                          <div className="flex gap-3">
                                             <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                                                <span className="text-indigo-400 text-[10px] font-black">2</span>
                                             </div>
                                             <div>
                                                <h5 className="text-[11px] font-black text-white">擴大「超級小幫手」影響力</h5>
                                                <p className="text-[9px] font-medium text-slate-300 mt-1 leading-relaxed">洪召安等超級小幫手本月業績貢獻極大。建議可考慮從「品牌大使」名單中，篩選直推超過 10 人的菁英，主動賦予更高權限以鞏固組織動能。</p>
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </motion.div>
                     )}
`;

if (!content.includes('總裁戰略羅盤 (Strategy)')) {
  // Find where to insert the new panel
  const insertIndex = content.lastIndexOf('</motion.div>\n                     )}\n                  </AnimatePresence>');
  if (insertIndex !== -1) {
    const before = content.substring(0, insertIndex);
    const after = content.substring(insertIndex);
    content = before + strategyPanelCode + after;
  }
}

fs.writeFileSync(filePath, content);
console.log('Successfully added CEO Compass to dashboard.');
