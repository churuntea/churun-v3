import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updatePassword() {
  const { data, error } = await supabase
    .from('members')
    .update({ password: 'M0939734771' })
    .eq('phone', '0939734771');

  if (error) {
    console.error("Update Error:", error);
  } else {
    console.log("Password successfully updated back to M0939734771");
  }
}

updatePassword();
