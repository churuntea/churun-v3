import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('poster_templates').select('*').order('created_at', { ascending: false }).limit(1);
  if (error) {
    console.error("Failed to fetch:", error);
  } else {
    console.log("Template:", JSON.stringify(data, null, 2));
  }
}

main();
