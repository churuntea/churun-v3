import { createClient } from '@supabase/supabase-js'

// 使用新專案的金鑰
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wllzampbvrouiskrgaza.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_jQ33CWpUayuvU9l5s57yNQ_Z9zubrYw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)