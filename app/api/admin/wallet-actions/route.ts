import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function POST(request: Request) {
  try {
    const { action, transactionId, status, memberId, amount, auditorName } = await request.json();

    if (!transactionId || !status || !memberId) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Fetch current metadata
    const { data: txData } = await supabase
      .from("wallet_transactions")
      .select("metadata, amount, transaction_type")
      .eq("id", transactionId)
      .single();

    if (!txData) {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
    }

    const updatedMetadata = {
      ...(txData.metadata || {}),
      auditor: auditorName || "系統管理專員",
      audited_at: new Date().toISOString()
    };

    // 2. Update transaction status
    const { error: updateError } = await supabase
      .from("wallet_transactions")
      .update({ 
        status,
        metadata: updatedMetadata
      })
      .eq("id", transactionId);

    if (updateError) throw updateError;

    // 3. If completed, update member balance
    if (status === 'completed') {
      const { data: member, error: mErr } = await supabase
        .from("members")
        .select("virtual_balance")
        .eq("id", memberId)
        .single();
      
      if (mErr) throw mErr;

      const currentBalance = Number(member?.virtual_balance || 0);
      const newBalance = currentBalance + Number(amount);

      const { error: balError } = await supabase
        .from("members")
        .update({ virtual_balance: newBalance })
        .eq("id", memberId);

      if (balError) throw balError;
    }

    // 4. Send Notification
    const isDeposit = txData.transaction_type === 'deposit';
    let notifyTitle = "";
    let notifyContent = "";

    if (isDeposit) {
      if (status === 'completed') {
        notifyTitle = "預收儲值核發成功！ 🎉";
        notifyContent = `您申請的預收儲值 NT$ ${Number(amount).toLocaleString()} 元已成功核對並到帳，感謝您的進貨與支持！`;
      } else {
        notifyTitle = "儲值審核未通過 ❌";
        notifyContent = `您申請的預收儲值 NT$ ${Number(amount).toLocaleString()} 元因帳款對帳不符已被駁回。`;
      }
    } else {
      if (status === 'completed') {
        notifyTitle = "提領審核通過並已發款 💸";
        notifyContent = `您申請提領的 NT$ ${Math.abs(amount).toLocaleString()} 元已通過審核並成功發放。`;
      } else {
        notifyTitle = "提領審核未通過 ❌";
        notifyContent = `您申請提領的 NT$ ${Math.abs(amount).toLocaleString()} 元因審核資格未符已被駁回。`;
      }
    }

    await supabase.from("notifications").insert({
      member_id: memberId,
      title: notifyTitle,
      content: notifyContent,
      type: isDeposit ? 'deposit' : 'withdrawal'
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Wallet Action Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
