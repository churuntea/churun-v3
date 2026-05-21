require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMemberSchema() {
  const { data, error } = await supabase
    .from('members')
    .select('id, ambassador_status')
    .limit(1);

  if (error) {
    console.error('Error fetching data:', error);
  } else if (data.length > 0) {
    const memberId = data[0].id;
    console.log('Testing update on member:', memberId);
    
    const { error: updateError } = await supabase
      .from('members')
      .update({ ambassador_status: null })
      .eq('id', memberId);
      
    if (updateError) {
      console.log('Update ambassador_status to null FAILED:', updateError);
    } else {
      console.log('Update ambassador_status to null SUCCESS');
    }
  } else {
    console.log('No members found');
  }
}

checkMemberSchema();
