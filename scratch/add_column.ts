import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function addColumn() {
  const { data, error } = await supabase.rpc('run_sql', {
    sql: 'ALTER TABLE public.members ADD COLUMN IF NOT EXISTS avatar_url TEXT;'
  })
  if (error) console.error(error)
  else console.log('Column added successfully')
}

addColumn()
