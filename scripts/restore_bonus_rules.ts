import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const TIERS = [
  { 
    tier_name: '初潤靈魂伴侶', 
    privileges: ['專屬匯率：30元 = 1點', '累積消費滿 $50,000 晉升', '每月保級：消費 $1,000 或 直推 3 人', '未達標降級至 初潤知己'],
    description: '最高階級',
    min_spend: 50000,
    reward_rate: 30,
    color_theme: 'from-amber-400 via-amber-200 to-amber-500'
  },
  { 
    tier_name: '初潤知己', 
    privileges: ['專屬匯率：40元 = 1點', '累積消費滿 $25,000 晉升', '每月保級：消費 $600 或 直推 2 人', '未達標降級至 初潤閨蜜'],
    description: '次高階級',
    min_spend: 25000,
    reward_rate: 40,
    color_theme: 'from-emerald-400 to-emerald-600'
  },
  { 
    tier_name: '初潤閨蜜', 
    privileges: ['專屬匯率：50元 = 1點', '累積滿 $12,000 (或儲值 1 萬直升)', '每季保級：消費 $1,200 或 直推 2 人', '未達標降級至 初潤好朋友'],
    description: '高階會員',
    min_spend: 12000,
    reward_rate: 50,
    color_theme: 'from-rose-400 to-rose-600'
  },
  { 
    tier_name: '初潤好朋友', 
    privileges: ['專屬匯率：60元 = 1點', '累積消費滿 $6,000 晉升', '每季保級：消費 $600 或 直推 1 人', '未達標降級至 初潤青少年'],
    description: '中高階會員',
    min_spend: 6000,
    reward_rate: 60,
    color_theme: 'from-indigo-400 to-indigo-600'
  },
  { 
    tier_name: '初潤青少年', 
    privileges: ['專屬匯率：70元 = 1點', '累積消費滿 $3,000 晉升', '無保級壓力'],
    description: '中階會員',
    min_spend: 3000,
    reward_rate: 70,
    color_theme: 'from-blue-400 to-blue-600'
  },
  { 
    tier_name: '初潤小朋友', 
    privileges: ['專屬匯率：80元 = 1點', '累積消費滿 $1,500 晉升', '無保級壓力'],
    description: '基礎會員',
    min_spend: 1500,
    reward_rate: 80,
    color_theme: 'from-sky-400 to-sky-600'
  },
  { 
    tier_name: '初潤幼兒園', 
    privileges: ['專屬匯率：90元 = 1點', '完成首次消費即可晉升', '無保級壓力'],
    description: '入門會員',
    min_spend: 1,
    reward_rate: 90,
    color_theme: 'from-teal-400 to-teal-600'
  },
  { 
    tier_name: '初潤寶寶', 
    privileges: ['專屬匯率：100元 = 1點', '加入 LINE@ 註冊即可獲得', '無保級壓力'],
    description: '新註冊會員',
    min_spend: 0,
    reward_rate: 100,
    color_theme: 'from-slate-400 to-slate-600'
  }
];

async function run() {
  for (const t of TIERS) {
    await supabase.from('bonus_rules').update({ privileges: t.privileges }).eq('tier_name', t.tier_name);
  }
  console.log('Restored privileges');
}
run();
