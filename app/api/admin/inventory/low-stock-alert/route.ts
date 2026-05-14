import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { productName, stock, minStock } = await request.json();

    if (!productName || stock === undefined || minStock === undefined) {
      return NextResponse.json({ success: false, error: '缺少必要參數' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'churun.tea@gmail.com', // fallback mock
        pass: process.env.EMAIL_PASS || 'mock_pass',
      },
    });

    const mailOptions = {
      from: `"初潤製茶所 ERP 系統" <${process.env.EMAIL_USER || 'system@churun.com'}>`,
      to: process.env.ADMIN_EMAIL || 'admin@churun.com',
      subject: `[庫存警報] ${productName} 庫存低於安全水位`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #e11d48;">🚨 庫存低水位警報</h2>
          <p>系統偵測到以下商品庫存已低於安全預警水位，請盡速安排補貨或盤點：</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
              <th style="text-align: left; padding: 10px; border-bottom: 2px solid #e2e8f0; color: #64748b;">商品名稱</th>
              <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${productName}</td>
            </tr>
            <tr>
              <th style="text-align: left; padding: 10px; border-bottom: 2px solid #e2e8f0; color: #64748b;">目前庫存</th>
              <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: #e11d48; font-weight: bold;">${stock} 件</td>
            </tr>
            <tr>
              <th style="text-align: left; padding: 10px; border-bottom: 2px solid #e2e8f0; color: #64748b;">安全水位</th>
              <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${minStock} 件</td>
            </tr>
          </table>
          <p style="margin-top: 30px; font-size: 12px; color: #94a3b8;">本信件由初潤製茶所 ERP 系統自動發送，請勿直接回覆。</p>
        </div>
      `,
    };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
       await transporter.sendMail(mailOptions);
    } else {
       console.log('模擬發送低庫存 Email:', mailOptions.subject);
    }

    return NextResponse.json({ success: true, message: '警報信件已送出' });
  } catch (error: any) {
    console.error('[LowStockAlert API Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
