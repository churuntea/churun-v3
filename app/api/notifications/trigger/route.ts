import { NextResponse } from 'next/server';
import { sendSecurityNotification } from '@/app/api/notify-helper';

export async function POST(request: Request) {
  try {
    const { memberId, actionName, details } = await request.json();

    if (!memberId || !actionName || !details) {
      return NextResponse.json({ success: false, error: '缺少必要參數' }, { status: 400 });
    }

    await sendSecurityNotification({
      memberId,
      actionName,
      details,
    });

    return NextResponse.json({ success: true, message: '異動通知已成功發送' });
  } catch (error: any) {
    console.error('[TriggerNotify API Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
