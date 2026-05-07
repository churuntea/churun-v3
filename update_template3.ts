import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const config = {
    qr: { x: 1250, y: 2220, size: 180 },
    name: { x: 420, y: 2330, size: 45, color: "#a88151" }, 
    phone: { x: 880, y: 2330, size: 45, color: "#a88151" },
    address: { x: 420, y: 2390, size: 40, color: "#a88151" }
  };

  const { data, error } = await supabase
    .from('poster_templates')
    .update({ config })
    .eq('id', 'd329ba62-168f-4cea-aab2-d8dc4ef84283');

  if (error) {
    console.error("Failed to update:", error);
  } else {
    console.log("Template config updated successfully.");
  }
}

main();
