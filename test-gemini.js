require('dotenv').config({path: '.env.local'});
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const prompt = `請分析這張茶葉包裝圖片，並告訴我這是初潤製茶所的哪一款專屬商品。
請務必「完全忽略」包裝上的通用印刷字（例如高山茶），單純根據包裝的「顏色與圖案特徵」來辨識。
請從以下清單中，挑選「最符合的一項」商品名稱並直接回傳（不可回傳其他字，不可加描述）：
- 若為「粉色頂部配茶園山景，有大字，長方形包裝袋。」：回傳「觀日樓金萱」
- 若為「米白色方形提袋，印有綠色植物風景圖和金色文字。」：回傳「[包裝及材料] 環保_潤寶_帆布袋」
- 若為「透明圓柱玻璃瓶，多色（粉、米、綠、藍）套，燙金文字。」：回傳「[新品上市] 高山烏龍套組」
- 若為「兩種顏色直立袋，棕色標籤有大字及水墨山水畫，帶提把。」：回傳「高級伴手禮提袋/10入」

若無法辨識，請回覆「UNKNOWN」。`;

fetch('https://wllzampbvrouiskrgaza.supabase.co/storage/v1/object/public/avatars/products/product_1780659328838.png')
  .then(res => res.arrayBuffer())
  .then(buffer => genAI.getGenerativeModel({ model: 'gemini-1.5-pro' }).generateContent([
    prompt, 
    { inlineData: { data: Buffer.from(buffer).toString('base64'), mimeType: 'image/jpeg' } }
  ]))
  .then(r => console.log(r.response.text()))
  .catch(console.error);
