import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

// 階級考核條件 (順序由高到低)
const TIERS = [
  { name: '初潤靈魂伴侶', reqType: 'quarterly', amount: 15000 },
  { name: '初潤知己', reqType: 'quarterly', amount: 7500 },
  { name: '初潤閨蜜', reqType: 'quarterly', amount: 3600 },
  { name: '初潤好朋友', reqType: 'quarterly', amount: 1800 },
  { name: '初潤青少年', reqType: 'lifetime', amount: 3000 },
  { name: '初潤小朋友', reqType: 'lifetime', amount: 1500 },
  { name: '初潤幼兒園', reqType: 'lifetime', amount: 1 }, // 大於0即完成首購
  { name: '初潤寶寶', reqType: 'lifetime', amount: 0 }
];

async function evaluateTiers() {
  try {
    // 1. 抓取所有會員 (包含 B2B 與 B2C，因為 B2B 也可能有階級變動需求，但主要針對 B2C)
    const { data: members, error } = await supabase
      .from('members')
      .select('*');

    if (error) throw error;
    if (!members) return { success: true, message: 'No members found' };

    let updatedCount = 0;

    // 2. 逐一結算考核
    for (const member of members) {
      let newTier = '初潤寶寶';
      
      // 人頭抵扣機制：推薦 1 位 = $1000，上限 50%
      const headDeduction = (member.referral_count || 0) * 1000;

      for (const tierConfig of TIERS) {
        if (tierConfig.reqType === 'quarterly') {
          // 季消費考核 (適用人頭抵扣)
          const maxDeduction = tierConfig.amount * 0.5; // 上限 50%
          const actualDeduction = Math.min(headDeduction, maxDeduction);
          const effectiveSpend = (Number(member.quarterly_spend) || 0) + actualDeduction;

          if (effectiveSpend >= tierConfig.amount) {
            newTier = tierConfig.name;
            break; // 達到最高符合的階級，跳出
          }
        } else {
          // 終身消費考核 (不適用人頭抵扣)
          if ((Number(member.lifetime_spend) || 0) >= tierConfig.amount) {
            newTier = tierConfig.name;
            break;
          }
        }
      }

      // 如果有升級，更新資料庫 (V2 邏輯通常只升不降，除非是特定週期清算，這裡先實作變動即更新)
      if (newTier !== member.tier) {
        await supabase
          .from('members')
          .update({ tier: newTier })
          .eq('id', member.id);
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
