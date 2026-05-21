// Update 洪召安 member_code to CR99P999999
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Service Key present:', !!supabaseServiceKey);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateFounderCode() {
  const { data, error } = await supabase
    .from('members')
    .update({ member_code: 'CR99P999999' })
    .eq('name', '洪召安');

  if (error) {
    console.error('Failed to update founder member_code:', error);
    process.exit(1);
  }
  console.log('Founder member_code updated:', data);
}

updateFounderCode();
