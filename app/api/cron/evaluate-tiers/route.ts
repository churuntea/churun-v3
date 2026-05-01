import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key';
// 這裡最好使用 Service Role Key 來繞過 RLS，因為是後台批次作業
const supabase = createClient(supabaseUrl, supabaseKey);

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

export async function POST(request: Request) {
  // 檢查簡單的 Authorization 標頭，防止外部隨意呼叫
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'secret'}`) {
    // 為了測試方便先不擋，但正式環境需啟用
    // return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // 1. 抓取所有 B2C 會員
    const { data: members, error } = await supabase
      .from('members')
      .select('*')
      .eq('is_b2b', false);

    if (error) throw error;
    if (!members) return NextResponse.json({ message: 'No members found' });

    let updatedCount = 0;

    // 2. 逐一結算考核
    for (const member of members) {
      let newTier = '初潤寶寶';
      
      // 人頭抵扣機制：推薦 1 位 = $1000，上限 50%
      const headDeduction = member.referral_count * 1000;

      for (const tierConfig of TIERS) {
        if (tierConfig.reqType === 'quarterly') {
          // 季消費考核
          const maxDeduction = tierConfig.amount * 0.5; // 上限 50%
          const actualDeduction = Math.min(headDeduction, maxDeduction);
          const effectiveSpend = Number(member.quarterly_spend) + actualDeduction;

          if (effectiveSpend >= tierConfig.amount) {
            newTier = tierConfig.name;
            break; // 達到最高符合的階級，跳出
          }
        } else {
          // 終身消費考核 (不適用人頭抵扣)
          if (Number(member.lifetime_spend) >= tierConfig.amount) {
            newTier = tierConfig.name;
            break;
          }
        }
      }

      // 如果有升降級，更新資料庫
      if (newTier !== member.tier) {
        await supabase
          .from('members')
          .update({ tier: newTier })
          .eq('id', member.id);
        updatedCount++;
      }
    }

    return NextResponse.json({ success: true, message: `Successfully evaluated tiers. Updated ${updatedCount} members.` });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
