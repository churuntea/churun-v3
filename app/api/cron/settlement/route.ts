import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

async function evaluateTiers() {
  try {
    // Fetch all members
    const { data: members, error: fetchError } = await supabase
      .from('members')
      .select('id, lifetime_spend, tier');

    if (fetchError) throw fetchError;

    // Fetch dynamic rules from database
    const { data: dbRules } = await supabase.from('bonus_rules').select('tier_name, min_spend').order('display_order', { ascending: true });
    
    const tierRules = dbRules && dbRules.length > 0 
      ? dbRules.map(r => ({ name: r.tier_name, minSpend: r.min_spend }))
      : [
          { name: '初潤靈魂伴侶', minSpend: 50000 },
          { name: '初潤知己', minSpend: 25000 },
          { name: '初潤閨蜜', minSpend: 12000 },
          { name: '初潤好朋友', minSpend: 6000 },
          { name: '初潤青少年', minSpend: 3000 },
          { name: '初潤小朋友', minSpend: 1500 },
          { name: '初潤幼兒園', minSpend: 1 },
          { name: '初潤寶寶', minSpend: 0 }
        ];

    let updatedCount = 0;

    for (const member of members || []) {
      const spend = Number(member.lifetime_spend);
      let targetTier = '初潤寶寶';
      
      for (const rule of tierRules) {
        if (spend >= rule.minSpend) {
          targetTier = rule.name;
          break;
        }
      }

      if (targetTier !== member.tier) {
        const { error: updateError } = await supabase
          .from('members')
          .update({ tier: targetTier })
          .eq('id', member.id);
        
        if (!updateError) {
          updatedCount++;
          // Optional: Add a notification for tier upgrade
          await supabase.from('notifications').insert({
            member_id: member.id,
            title: '職級晉升通知',
            content: `恭喜！您的職級已正式晉升為「${targetTier}」。`,
            type: 'system'
          });
        }
      }
    }

    return { success: true, message: `Evaluated ${members?.length} members, updated ${updatedCount} tiers.` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function performSettlement() {
  try {
    // 1. Settle pending wallet transactions
    const { data: pendingTx, error: fetchError } = await supabase
      .from('wallet_transactions')
      .select('id')
      .eq('status', 'pending');

    if (fetchError) throw fetchError;

    if (pendingTx && pendingTx.length > 0) {
      const txIds = pendingTx.map(tx => tx.id);
      await supabase.from('wallet_transactions').update({ status: 'completed' }).in('id', txIds);
    }

    // 2. Evaluate tiers
    const tierResult = await evaluateTiers();
    
    return { 
      success: true, 
      message: `業績結算與職級考核完成！ ${tierResult.message} 📅 依據品牌營運規章，本期所有消費獲贈之紅利點數將於【隔月 10 號統一發送】。` 
    };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await performSettlement();
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await performSettlement();
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json(result);
}
