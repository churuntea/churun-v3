import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 會員編碼產生器 API
// 格式：CR + 年份後2碼 + 類型碼 + 月份2碼 + 流水號4碼
// 例：CR26M050001 (會員), CR26A050001 (品牌大使), CR26P050001 (合夥人)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "member"; // 'member' | 'ambassador' | 'partner'
    
    // 類型碼對應
    const typeCode = type === "ambassador" ? "A" : type === "partner" ? "P" : "M";
    
    // 取得目前時間
    const now = new Date();
    const yearCode = String(now.getFullYear()).slice(-2); // 取後2碼，2026 → "26"
    const monthCode = String(now.getMonth() + 1).padStart(2, "0"); // 月份 → "05"
    
    // 前綴：CR26M05
    const prefix = `CR${yearCode}${typeCode}${monthCode}`;
    
    // 查詢當月同類型已有幾個，計算流水號
    const { data, error } = await supabase
      .from("members")
      .select("member_code")
      .like("member_code", `${prefix}%`);
    
    if (error) {
      console.error("查詢會員編碼失敗:", error);
      // 若查詢失敗，使用時間戳記作為備案
      const fallback = `${prefix}${String(Date.now()).slice(-4)}`;
      return NextResponse.json({ code: fallback, prefix });
    }
    
    // 找到目前最大流水號
    let maxSeq = 0;
    if (data && data.length > 0) {
      for (const row of data) {
        const code = row.member_code || "";
        if (code.startsWith(prefix)) {
          const seqStr = code.slice(prefix.length);
          const seq = parseInt(seqStr, 10);
          if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      }
    }
    
    // 流水號 +1，補零到4碼
    const nextSeq = maxSeq + 1;
    const seqCode = String(nextSeq).padStart(4, "0");
    const memberCode = `${prefix}${seqCode}`;
    
    return NextResponse.json({ 
      code: memberCode, 
      prefix,
      sequence: nextSeq,
      type,
      typeCode,
      year: yearCode,
      month: monthCode
    });
  } catch (err: any) {
    console.error("generate-code API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
