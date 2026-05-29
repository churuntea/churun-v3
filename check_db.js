import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('products').select('id, name, description').order('created_at', { ascending: false }).limit(5);
  if (error) {
    console.error("DB Error:", error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

check();
