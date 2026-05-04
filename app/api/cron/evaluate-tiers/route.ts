import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

// 階級配置 (依照 2026/05/04 更新之職級榮耀殿堂表)
const TIERS = [
  { 
    name: '初潤靈魂伴侶', 
    rate: 30, 
    upgradeAmount: 50000, 
    maintainType: 'monthly', 
    maintainSpend: 1000, 
    maintainReferral: 3, 
    downgradeTo: '初潤知己' 
  },
  { 
    name: '初潤知己', 
    rate: 40, 
    upgradeAmount: 25000, 
    maintainType: 'monthly', 
    maintainSpend: 600, 
    maintainReferral: 2, 
    downgradeTo: '初潤閨蜜' 
  },
  { 
    name: '初潤閨蜜', 
    rate: 50, 
    upgradeAmount: 12000, 
    maintainType: 'quarterly', 
    maintainSpend: 1200, 
    maintainReferral: 2, 
    downgradeTo: '初潤好朋友' 
  },
  { 
    name: '初潤好朋友', 
    rate: 60, 
    upgradeAmount: 6000, 
    maintainType: 'quarterly', 
    maintainSpend: 600, 
    maintainReferral: 1, 
    downgradeTo: '初潤青少年' 
  },
  { 
    name: '初潤青少年', 
    rate: 70, 
    upgradeAmount: 3000, 
    maintainType: 'none'
  },
  { 
    name: '初潤小朋友', 
    rate: 80, 
    upgradeAmount: 1500, 
    maintainType: 'none'
  },
  { 
    name: '初潤幼兒園', 
    rate: 90, 
    upgradeAmount: 1, 
    maintainType: 'none'
  },
  { 
    name: '初潤寶寶', 
    rate: 100, 
    upgradeAmount: 0, 
    maintainType: 'none'
  }
];

async function evaluateTiers() {
  try {
    const { data: members, error } = await supabase
      .from('members')
      .select('id, name, tier, lifetime_spend, quarterly_spend, initial_deposit, created_at');

    if (error) throw error;
    if (!members) return { success: true, message: 'No members found' };

    let updatedCount = 0;
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString();

    for (const member of members) {
      let currentTierIdx = TIERS.findIndex(t => t.name === member.tier);
      if (currentTierIdx === -1) currentTierIdx = TIERS.length - 1; // Default to baby
      
      const currentTier = TIERS[currentTierIdx];
      let newTier = member.tier;

      // 1. 檢查升級 (Upgrade Logic)
      // 從最高階開始往回找，看是否符合終身金額
      for (let i = 0; i < TIERS.length; i++) {
        const tier = TIERS[i];
        const isEligibleBySpend = Number(member.lifetime_spend) >= tier.upgradeAmount;
        
        // 特殊規則：儲值 1 萬方案直升 初潤閨蜜 (或更高)
        const isEligibleByDeposit = (tier.name === '初潤閨蜜' || i > 2) && Number(member.initial_deposit) >= 10000;

        if (isEligibleBySpend || isEligibleByDeposit) {
          // 如果符合更高階，則嘗試升級
          if (i < currentTierIdx) {
            newTier = tier.name;
          }
          break;
        }
      }

      // 2. 檢查保級 (Maintenance Logic) - 僅針對「好朋友」以上級別
      if (currentTier.maintainType !== 'none' && newTier === member.tier) {
        const checkDate = currentTier.maintainType === 'monthly' ? oneMonthAgo : threeMonthsAgo;
        
        // 取得期間內消費
        const { data: orders } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('member_id', member.id)
          .eq('status', 'completed')
          .gte('completed_at', checkDate);
        
        const periodSpend = orders?.reduce((acc, o) => acc + Number(o.total_amount), 0) || 0;

        // 取得期間內直推人數
        const { count: newReferrals } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('upline_id', member.id)
          .gte('created_at', checkDate);

        const referralCount = newReferrals || 0;

        // 保級判定：二擇一 (消費達標 OR 推薦達標)
        const isMaintained = periodSpend >= (currentTier.maintainSpend || 0) || referralCount >= (currentTier.maintainReferral || 0);

        if (!isMaintained) {
          newTier = currentTier.downgradeTo || '初潤青少年';
        }
      }

      // 更新資料庫
      if (newTier !== member.tier) {
        const newTierIdx = TIERS.findIndex(t => t.name === newTier);
        const isUpgrade = newTierIdx < currentTierIdx; // 索引越小等級越高

        await supabase
          .from('members')
          .update({ tier: newTier })
          .eq('id', member.id);
        
        await supabase.from('notifications').insert({
          member_id: member.id,
          title: isUpgrade ? '會員等級晉升！' : '會員等級變動通知',
          content: isUpgrade 
            ? `恭喜您！您的會員等級已晉升為「${newTier}」。`
            : `提醒您，由於未達保級條件，您的等級已調整為「${newTier}」。繼續加油！`,
          type: 'system'
        });

        updatedCount++;
      }
    }

    return { success: true, message: `Successfully evaluated tiers. Updated ${updatedCount} members.` };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function GET() {
  const result = await evaluateTiers();
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json(result);
}

export async function POST() {
  const result = await evaluateTiers();
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json(result);
}
