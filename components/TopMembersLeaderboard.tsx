import React from 'react';
import { ChevronRight } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  points_balance: number;
  referral_count: number;
  avatar_url?: string;
}

interface Props {
  members: Member[];
}

export default function TopMembersLeaderboard({ members }: Props) {
  // Sort members by points descending
  const sortedMembers = [...members].sort((a, b) => (b.points_balance || 0) - (a.points_balance || 0)).slice(0, 5);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-100/50 w-full">
      <div className="flex justify-between items-center p-6 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-medium text-slate-800">積分排行</h3>
          <p className="text-xs text-slate-400 tracking-wider uppercase mt-1">TOP MEMBERS</p>
        </div>
        <button className="text-amber-600 text-sm font-medium flex items-center hover:text-amber-700 transition-colors">
          全部 <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
      
      <div className="flex flex-col">
        {sortedMembers.map((member, index) => {
          const rankStr = (index + 1).toString().padStart(2, '0');
          const isTop3 = index < 3;
          
          return (
            <div key={member.id} className="flex items-center justify-between p-4 px-6 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-4">
                <span className={`text-lg font-bold ${isTop3 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {rankStr}
                </span>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                  isTop3 ? 'bg-[#eef2eb] text-[#557048]' : 'bg-slate-100 text-slate-500'
                }`}>
                  {member.name ? member.name.charAt(0) : '無'}
                </div>
                <div className="flex flex-col">
                  <span className="text-[15px] font-bold text-slate-800">{member.name || '未知會員'}</span>
                  <span className="text-xs text-slate-500 mt-0.5">推薦 {member.referral_count || 0} 人</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-lg font-bold ${isTop3 ? 'text-amber-600' : 'text-slate-700'}`}>
                  {(member.points_balance || 0).toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 mt-0.5">積分</span>
              </div>
            </div>
          );
        })}
        {sortedMembers.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-sm">
            目前尚無排行資料
          </div>
        )}
      </div>
    </div>
  );
}
