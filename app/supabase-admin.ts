import { createClient } from '@supabase/supabase-js';

// 後端專用的超級管理員金鑰 (Service Role)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wllzampbvrouiskrgaza.supabase.co';
// 不要直接把 Secret Key 寫在程式碼中，GitHub 會攔截
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key-for-build';

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
