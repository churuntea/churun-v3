import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const CVSStoreID = formData.get('CVSStoreID') || '';
    const CVSStoreName = formData.get('CVSStoreName') || '';
    const CVSAddress = formData.get('CVSAddress') || '';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>處理中...</title></head>
      <body style="display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; background:#f8fafc;">
        <p style="color:#64748b; font-weight:bold;">已成功選擇門市！正在帶入資料...</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'ECPAY_MAP_RESULT',
              CVSStoreID: '${CVSStoreID}',
              CVSStoreName: '${CVSStoreName}',
              CVSAddress: '${CVSAddress}'
            }, '*');
            window.close();
          } else {
            document.body.innerHTML = '請關閉此視窗並回到原頁面。';
          }
        </script>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
