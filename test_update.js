import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testUpdate() {
  const { data: products } = await supabase.from('products').select('*').limit(1);
  if (!products || products.length === 0) return console.log("No products");
  
  const p = products[0];
  console.log("Original description:", p.description);

  const extJson = JSON.stringify({
    order_unit: '件',
    order_unit_size: 45,
    min_order_quantity: 39
  });
  const finalDescription = (p.description || "") + "||_EXT_JSON_||" + extJson;

  const updateData = {
    description: finalDescription
  };

  console.log("Updating to:", updateData);

  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', p.id)
    .select()
    .single();

  if (error) {
    console.error("Update Error:", error);
  } else {
    console.log("Updated Product:", data);
  }
}

testUpdate();
