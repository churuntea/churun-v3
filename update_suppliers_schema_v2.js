const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function run() {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
  
  if (!urlMatch || !keyMatch) {
    console.error('Missing env vars');
    return;
  }
  
  const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());
  
  const { data, error } = await supabase.rpc('exec_sql', { 
    query: `
      ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS tax_id TEXT;
      ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS notes TEXT;
      ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS supplied_items JSONB DEFAULT '[]'::jsonb;
    `
  });
  
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Schema updated successfully.');
  }
}
run();
