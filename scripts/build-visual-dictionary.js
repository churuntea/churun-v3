const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '../.env.local' });

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const { data: products } = await supabase.from('products').select('name, image_url').eq('status', 'active');
  
  const visualMapping = [];

  for (const product of products) {
    if (!product.image_url) continue;
    
    try {
      console.log(`Analyzing: ${product.name}`);
      const imageResp = await fetch(product.image_url);
      const arrayBuffer = await imageResp.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const result = await model.generateContent([
        "Describe the visual appearance of this packaging specifically focusing on color, shape, and prominent visual design elements (like patterns, material). Keep it very brief, under 20 words, in Traditional Chinese. Do not read the text on the package, just describe the visual look. E.g. '紅色亮面長方形包裝袋', '綠色底白色方格圖案包裝', '牛皮紙袋'.",
        {
          inlineData: {
            data: buffer.toString("base64"),
            mimeType: "image/jpeg"
          }
        }
      ]);
      
      const desc = result.response.text().trim();
      console.log(` -> ${desc}`);
      visualMapping.push(`- 若為「${desc}」，請判定為「${product.name}」`);
    } catch (e) {
      console.error(`Failed to analyze ${product.name}:`, e.message);
    }
  }

  console.log("\n\n=== RESULTING PROMPT ADDITION ===");
  console.log(visualMapping.join("\n"));
}

run();
