const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log('Clearing B2B flags...');
  
  const { data, error } = await supabase
    .from('members')
    .update({ is_b2b: false })
    .eq('is_b2b', true)
    .select();
    
  if (error) {
    console.error('Error clearing b2b flags:', error);
  } else {
    console.log(`Successfully cleared B2B flag for ${data.length} members:`, data.map(d => d.name));
  }
}

main();
