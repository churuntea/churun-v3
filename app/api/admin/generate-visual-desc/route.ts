import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/supabase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { id, image_url } = await request.json();

    if (!id || !image_url) {
      return NextResponse.json({ success: false, error: '缺少 ID 或圖片網址' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
       return NextResponse.json({ success: false, error: '未設定 GEMINI_API_KEY' }, { status: 500 });
    }

    console.log(`[Auto-Visual-Desc] 開始分析商品 ${id} 的圖片: ${image_url}`);

    // Fetch the image
    const imageResp = await fetch(image_url);
    const arrayBuffer = await imageResp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Call Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = "Describe the visual appearance of this packaging specifically focusing on color, shape, and prominent visual design elements. Keep it very brief, under 20 words, in Traditional Chinese. Do not read the text on the package, just describe the visual look. E.g. 紅色亮面長方形包裝袋, 綠色底白色方格圖案包裝, 牛皮紙袋.";

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: buffer.toString('base64'), mimeType: 'image/jpeg' } }
    ]);
    
    const visual_description = result.response.text().trim();
    console.log(`[Auto-Visual-Desc] 分析完成: ${visual_description}`);

    // Update the product's description field by injecting it into ||_EXT_JSON_||
    // First, fetch the current product
    const { data: product, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('description')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    let desc = product.description || "";
    let extData: any = {};
    const separator = "||_EXT_JSON_||";
    if (desc.includes(separator)) {
      const parts = desc.split(separator);
      desc = parts[0];
      try {
        extData = JSON.parse(parts[1]);
      } catch(e) {}
    }

    extData.visual_description = visual_description;
    const finalDescription = desc + separator + JSON.stringify(extData);

    const { error: updateError } = await supabaseAdmin
      .from('products')
      .update({ description: finalDescription })
      .eq('id', id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, visual_description });
  } catch (error: any) {
    console.error('[Auto-Visual-Desc] 發生錯誤:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
