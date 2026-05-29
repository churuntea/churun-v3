const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log('Deleting approved and rejected applications...');
  
  const { data, error } = await supabase
    .from('ambassador_applications')
    .delete()
    .in('status', ['approved', 'rejected'])
    .select();
    
  if (error) {
    console.error('Error deleting records:', error);
  } else {
    console.log(`Successfully deleted ${data.length} records:`, data);
  }
}

main();
