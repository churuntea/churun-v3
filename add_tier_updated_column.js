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
  
  console.log('Running ALTER TABLE commands to add tier_updated_at column...');
  
  const { data, error } = await supabase.rpc('exec_sql', { 
    query: `
      ALTER TABLE public.members ADD COLUMN IF NOT EXISTS tier_updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now());
    `
  });
  
  if (error) {
    console.error('Schema alteration error:', error.message);
  } else {
    console.log('tier_updated_at column added/verified successfully!');
  }
}

run();
