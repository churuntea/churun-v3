const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  const { data, error } = await supabase
    .from('members')
    .select('id, name, phone, member_code, tier')
    .or('phone.eq.0939734771,member_code.eq.CR99P999999,member_code.eq.M0939734771');
    
  if (error) {
    console.error('Error fetching member:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Found members:', data);
    const memberId = data[0].id;
    
    const { error: updateError } = await supabase
      .from('members')
      .update({ tier: '超級小幫手' })
      .eq('id', memberId);
      
    if (updateError) {
      console.error('Error updating member:', updateError);
    } else {
      console.log('Successfully updated member tier to 超級小幫手');
    }
  } else {
    console.log('No member found');
  }
}

main();
