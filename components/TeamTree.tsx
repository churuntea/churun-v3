"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  ChevronDown, 
  User, 
  Award, 
  Zap, 
  Loader2,
  TrendingUp,
  Target
} from "lucide-react";
import { supabase } from "@/app/supabase";

interface MemberNodeProps {
  member: any;
  level: number;
}

function MemberNode({ member, level }: MemberNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [downlines, setDownlines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDownlines = async () => {
    if (downlines.length > 0 || isLoading) return;
    setIsLoading(true);
    const { data } = await supabase
      .from("members")
      .select("*")
      .eq("upline_id", member.id)
      .order("created_at", { ascending: false });
    setDownlines(data || []);
    setIsLoading(false);
  };

  const toggleExpand = () => {
    if (!isExpanded) fetchDownlines();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="space-y-2">
      <motion.div 
        layout
        onClick={toggleExpand}
        className={`flex items-center gap-4 p-5 rounded-[1.5rem] transition-all duration-300 cursor-pointer border ${
          isExpanded ? 'bg-slate-900 text-white border-slate-800 shadow-xl' : 'bg-white text-slate-800 border-slate-50 hover:border-emerald-100 shadow-sm'
        }`}
        style={{ marginLeft: `${level * 24}px` }}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
          member.is_b2b ? 'bg-indigo-500 text-white' : 'bg-emerald-700 text-white'
        }`}>
          {member.name.charAt(0)}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-black truncate">{member.name}</h4>
          <div className="flex items-center gap-2">
             <Award className={`w-3 h-3 ${isExpanded ? 'text-amber-400' : 'text-slate-300'}`} />
             <span className={`text-[8px] font-black uppercase tracking-widest ${isExpanded ? 'text-white/40' : 'text-slate-300'}`}>
                {member.tier}
             </span>
          </div>
        </div>

        <div className="text-right shrink-0">
           <p className={`text-xs font-black tracking-tighter ${isExpanded ? 'text-emerald-400' : 'text-slate-900'}`}>
              ${Number(member.lifetime_spend || 0).toLocaleString()}
           </p>
           <p className={`text-[6px] font-black uppercase tracking-widest ${isExpanded ? 'text-white/20' : 'text-slate-200'}`}>
              Spent
           </p>
        </div>

        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>
           {isLoading ? <Loader2 className="w-4 h-4 animate-spin opacity-40" /> : <ChevronRight className="w-4 h-4 opacity-40" />}
        </div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative"
          >
            {/* Connection Line */}
            {downlines.length > 0 && (
              <div 
                className="absolute left-0 top-0 w-px bg-slate-100" 
                style={{ marginLeft: `${level * 24 + 20}px`, height: "100%", top: "-10px" }}
              />
            )}
            
            <div className="space-y-2 mt-2">
              {downlines.length === 0 && !isLoading ? (
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center py-4" style={{ marginLeft: `${level * 24}px` }}>
                   No further downlines
                </p>
              ) : (
                downlines.map(d => (
                  <MemberNode key={d.id} member={d} level={level + 1} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TeamTree({ rootMember }: { rootMember: any }) {
  if (!rootMember) return null;

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center px-4">
          <h3 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase flex items-center gap-2">
             <Zap className="w-4 h-4 text-emerald-500" /> 團隊組織樹狀圖
          </h3>
          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">INTERACTIVE NODE VIEW</span>
       </div>
       
       <div className="space-y-4">
          <MemberNode member={rootMember} level={0} />
       </div>
    </div>
  );
}
