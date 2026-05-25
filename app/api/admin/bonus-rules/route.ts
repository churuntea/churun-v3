import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

const DEFAULT_RULES = [
  { 
    tier_name: '初潤靈魂伴侶', 
    min_spend: 50000, 
    reward_rate: 30, 
    description: '品牌核心領袖級別，享有最高回饋比例與專屬權益。',
    privileges: ['紅利點數 1.5 倍送', 'VIP 私人品茗會', '新品搶先體驗權', '生日專屬豪禮', '累積消費滿 $50,000 晉升', '每月保級：消費 $1,000 或 直推 3 人', '未達標降級至 初潤知己'],
    display_order: 0,
    color_theme: 'from-indigo-600 to-indigo-900'
  },
  { 
    tier_name: '初潤知己', 
    min_spend: 25000, 
    reward_rate: 40, 
    description: '核心支持者，穩定參與品牌活動。',
    privileges: ['紅利點數 1.2 倍送', '專屬節慶禮券', '首購優惠折扣', '累積消費滿 $25,000 晉升', '每月保級：消費 $600 或 直推 2 人', '未達標降級至 初潤閨蜜'],
    display_order: 1,
    color_theme: 'from-emerald-600 to-emerald-900'
  },
  { 
    tier_name: '初潤閨蜜', 
    min_spend: 12000, 
    reward_rate: 50, 
    description: '品牌好友，分享茶飲生活的伴侶。',
    privileges: ['專屬節慶禮券', '生日專屬豪禮', '累積滿 $12,000 (或儲值 1 萬直升)', '每季保級：消費 $1,200 或 直推 2 人', '未達標降級至 初潤好朋友'],
    display_order: 2,
    color_theme: 'from-amber-600 to-amber-900'
  },
  { 
    tier_name: '初潤好朋友', 
    min_spend: 6000, 
    reward_rate: 60, 
    description: '活躍會員，品牌忠實粉絲。',
    privileges: ['生日專屬豪禮', '累積消費滿 $6,000 晉升', '每季保級：消費 $600 或 直推 1 人', '未達標降級至 初潤青少年'],
    display_order: 3,
    color_theme: 'from-pink-600 to-pink-900'
  },
  { 
    tier_name: '初潤青少年', 
    min_spend: 3000, 
    reward_rate: 70, 
    description: '成長中的品牌愛好者。',
    privileges: ['基本回饋'],
    display_order: 4,
    color_theme: 'from-slate-600 to-slate-900'
  },
  { 
    tier_name: '初潤小朋友', 
    min_spend: 1500, 
    reward_rate: 80, 
    description: '新晉愛好者，剛開始探索茶飲世界。',
    privileges: ['基本回饋'],
    display_order: 5,
    color_theme: 'from-slate-500 to-slate-700'
  },
  { 
    tier_name: '初潤幼兒園', 
    min_spend: 1, 
    reward_rate: 90, 
    description: '體驗期會員，探索品牌價值。',
    privileges: ['基本回饋'],
    display_order: 6,
    color_theme: 'from-slate-400 to-slate-600'
  },
  { 
    tier_name: '初潤寶寶', 
    min_spend: 0, 
    reward_rate: 100, 
    description: '註冊新成員，品牌的新生命。',
    privileges: ['基本回饋'],
    display_order: 7,
    color_theme: 'from-slate-300 to-slate-500'
  }
];

export async function GET() {
  try {
    // Attempt to fetch from bonus_rules table
    const { data, error } = await supabase
      .from('bonus_rules')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.warn('Table bonus_rules might not exist, using defaults:', error.message);
      return NextResponse.json({ success: true, data: DEFAULT_RULES, is_fallback: true });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ success: true, data: DEFAULT_RULES, is_fallback: true });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { rules } = await request.json();

    if (!Array.isArray(rules)) {
      return NextResponse.json({ success: false, error: 'Invalid data format' }, { status: 400 });
    }

    // Attempt to update/upsert rules
    // Note: This requires the table to exist. If it doesn't, we recommend the user to run the SQL migration.
    const { error } = await supabase
      .from('bonus_rules')
      .upsert(rules.map((r, i) => ({
        tier_name: r.tier_name,
        min_spend: r.min_spend,
        reward_rate: r.reward_rate,
        description: r.description,
        privileges: r.privileges,
        display_order: i,
        color_theme: r.color_theme,
        updated_at: new Date().toISOString()
      })), { onConflict: 'tier_name' });

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message, 
        hint: '請確保資料庫中已建立 bonus_rules 資料表。' 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: '獎金結構已成功更新！' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
