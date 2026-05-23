import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get('brand'); 
  
  const LogisticsSubType = brand === '全家' ? 'FAMI' : 'UNIMART';
  const MerchantID = '2000132'; 
  const host = new URL(request.url).origin;
  const ServerReplyURL = `${host}/api/ecpay/map-callback`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><title>正在導向至電子地圖...</title></head>
    <body style="display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; background:#f8fafc;">
      <p style="color:#64748b; font-weight:bold;">正在載入超商電子地圖，請稍候...</p>
      <form id="ecpay-form" action="https://logistics-stage.ecpay.com.tw/Express/map" method="POST">
        <input type="hidden" name="MerchantID" value="${MerchantID}" />
        <input type="hidden" name="LogisticsType" value="CVS" />
        <input type="hidden" name="LogisticsSubType" value="${LogisticsSubType}" />
        <input type="hidden" name="IsCollection" value="N" />
        <input type="hidden" name="ServerReplyURL" value="${ServerReplyURL}" />
      </form>
      <script>
        document.getElementById('ecpay-form').submit();
      </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
