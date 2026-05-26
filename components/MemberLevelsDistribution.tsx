import React from 'react';

interface Member {
  id: string;
  tier: string;
}

interface Props {
  members: Member[];
}

export default function MemberLevelsDistribution({ members }: Props) {
  const totalMembers = members.length;
  // This is a placeholder for new members. In a real app we would check `created_at`.
  const newMembersCount = Math.floor(totalMembers * 0.1); 

  const getCount = (tierName: string) => members.filter(m => m.tier === tierName).length;

  const getProgressWidth = (count: number, maxCount: number) => {
    if (maxCount === 0) return '0%';
    return `${(count / maxCount) * 100}%`;
  };

  // As per image, we focus on some specific tiers if they match, or just use our own tiers.
  // Assuming tiers: 鑽石, 品牌大使, 初潤合夥人, 初潤寶寶 for the example (from the image)
  // But our DB has: 初潤靈魂伴侶, 初潤知己, 初潤閨蜜, 初潤好朋友, 初潤青少年, 初潤小朋友, 初潤幼兒園, 初潤寶寶
  // Let's use the top 4 populated tiers to match the layout.
  
  const tierStats = [
    { name: '初潤靈魂伴侶', count: getCount('初潤靈魂伴侶'), color: '#3b82f6', dotColor: '#d4af37', label: '鑽石', useBadge: true },
    { name: '初潤閨蜜', count: getCount('初潤閨蜜') + getCount('初潤知己'), color: '#4b5563', dotColor: '#4b5563', label: '品牌大使', useBadge: false },
    { name: '初潤小朋友', count: getCount('初潤小朋友') + getCount('初潤青少年') + getCount('初潤好朋友'), color: '#557048', dotColor: '#557048', label: '初潤合夥人', useBadge: false },
    { name: '初潤寶寶', count: getCount('初潤寶寶') + getCount('初潤幼兒園'), color: '#e5e7eb', dotColor: '#e5e7eb', label: '初潤寶寶', useBadge: false },
  ];

  const maxCount = Math.max(...tierStats.map(t => t.count), 1);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-100/50 w-full h-full flex flex-col">
      <div className="p-6 border-b border-slate-100">
        <div className="bg-blue-600 text-white inline-block px-3 py-1 text-sm font-bold tracking-widest mb-1">
          會員等級分佈
        </div>
        <div className="bg-blue-600 text-white inline-block px-3 py-1 text-xs font-medium tracking-widest">
          MEMBER LEVELS
        </div>
      </div>
      
      <div className="flex flex-col p-8 space-y-6 flex-grow">
        {tierStats.map((tier, index) => (
          <div key={index} className="flex items-center">
            <div className="w-4 flex justify-center shrink-0">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tier.dotColor }}></div>
            </div>
            <div className="w-24 shrink-0 text-[15px] font-bold text-slate-700 ml-3">
              {tier.useBadge ? (
                <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-sm">{tier.label}</span>
              ) : (
                tier.label
              )}
            </div>
            <div className="flex-grow flex items-center h-2 bg-[#f0ede6] rounded-full mx-4 overflow-hidden relative">
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out" 
                style={{ width: getProgressWidth(tier.count, maxCount), backgroundColor: tier.color }}
              ></div>
            </div>
            <div className="w-8 text-right text-[15px] font-medium text-slate-500">
              {tier.count}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 border-t border-slate-100 p-8 pt-10">
        <div className="flex flex-col items-center justify-center border-r border-slate-100">
          <span className="text-4xl font-light text-slate-800 tracking-tight">{totalMembers}</span>
          <span className="text-xs text-slate-400 font-bold mt-2 tracking-wider">總會員數</span>
        </div>
        <div className="flex flex-col items-center justify-center">
          <span className="text-4xl font-light text-[#557048] tracking-tight">{newMembersCount}</span>
          <span className="text-xs text-slate-400 font-bold mt-2 tracking-wider">本月新增</span>
        </div>
      </div>
    </div>
  );
}
