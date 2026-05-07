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
    qr: { x: 1300, y: 2120, size: 240 },
    name: { x: 550, y: 2280, size: 30, color: "#e2c07a" }, 
    phone: { x: 950, y: 2280, size: 30, color: "#e2c07a" },
    address: { x: 550, y: 2360, size: 26, color: "#e2c07a" }
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
