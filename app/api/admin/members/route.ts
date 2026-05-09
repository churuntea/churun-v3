import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function PUT(request: Request) {
  try {
    const { 
      memberId, 
      name, 
      phone, 
      email, 
      tier, 
      is_b2b, 
      balanceAdjustment, 
      pointsAdjustment,
      adjustmentReason 
    } = await request.json();

    if (!memberId) {
      return NextResponse.json({ success: false, error: '缺少會員 ID' }, { status: 400 });
    }

    // 1. 獲取該會員當前資料
    const { data: member, error: fetchErr } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (fetchErr || !member) {
      return NextResponse.json({ success: false, error: '找不到該會員' }, { status: 404 });
    }

    let currentBalance = Number(member.virtual_balance || 0);
    let currentPoints = Number(member.points_balance || 0);

    // 2. 處理預收款餘額調整
    if (balanceAdjustment && Number(balanceAdjustment) !== 0) {
      const adjustmentAmt = Number(balanceAdjustment);
      
      // 寫入錢包交易紀錄
      const { error: walletTxErr } = await supabase
        .from('wallet_transactions')
        .insert({
          member_id: memberId,
          amount: adjustmentAmt,
          transaction_type: 'admin_adjustment',
          status: 'completed',
          metadata: {
            reason: adjustmentReason || '總部管理員手動調整額度',
            operator: '總部指揮中心',
            adjusted_at: new Date().toISOString()
          }
        });

      if (walletTxErr) {
        console.error('Wallet adjustment log failed:', walletTxErr);
        return NextResponse.json({ success: false, error: '寫入交易紀錄失敗' }, { status: 500 });
      }

      currentBalance += adjustmentAmt;
    }

    // 3. 處理紅利點數調整
    if (pointsAdjustment && Number(pointsAdjustment) !== 0) {
      const adjustmentPts = Number(pointsAdjustment);

      // 寫入點數交易紀錄
      const { error: pointTxErr } = await supabase
        .from('point_transactions')
        .insert({
          member_id: memberId,
          amount: adjustmentPts,
          transaction_type: 'admin_adjustment',
          metadata: {
            reason: adjustmentReason || '總部管理員手動調整點數',
            operator: '總部指揮中心'
          }
        });

      if (pointTxErr) {
        console.error('Points adjustment log failed:', pointTxErr);
        return NextResponse.json({ success: false, error: '寫入點數交易紀錄失敗' }, { status: 500 });
      }

      currentPoints += adjustmentPts;
    }

    // 4. 更新會員主表資料
    const updatePayload: any = {
      name: name !== undefined ? name : member.name,
      phone: phone !== undefined ? phone : member.phone,
      email: email !== undefined ? email : member.email,
      tier: tier !== undefined ? tier : member.tier,
      is_b2b: is_b2b !== undefined ? is_b2b : member.is_b2b,
      virtual_balance: currentBalance,
      points_balance: currentPoints
    };

    const { data: updatedMember, error: updateErr } = await supabase
      .from('members')
      .update(updatePayload)
      .eq('id', memberId)
      .select()
      .single();

    if (updateErr) {
      console.error('Update member profile failed:', updateErr);
      return NextResponse.json({ success: false, error: '更新會員資料失敗' }, { status: 500 });
    }

    // 5. 插入系統通知
    if (balanceAdjustment || pointsAdjustment || tier !== member.tier) {
      let notificationContent = '您的會員帳戶已由總部更新：';
      if (tier !== member.tier) {
        notificationContent += `職級調整為「${tier}」；`;
      }
      if (balanceAdjustment && Number(balanceAdjustment) !== 0) {
        notificationContent += `預收款異動 NT$ ${Number(balanceAdjustment).toLocaleString()}；`;
      }
      if (pointsAdjustment && Number(pointsAdjustment) !== 0) {
        notificationContent += `紅利點數異動 ${Number(pointsAdjustment).toLocaleString()} 點；`;
      }
      
      await supabase.from('notifications').insert({
        member_id: memberId,
        title: '帳戶資料異動通知',
        content: notificationContent,
        type: 'system'
      });
    }

    return NextResponse.json({ success: true, member: updatedMember });

  } catch (error: any) {
    console.error('Admin Member Edit API Error:', error);
    return NextResponse.json({ success: false, error: '內部系統錯誤' }, { status: 500 });
  }
}
