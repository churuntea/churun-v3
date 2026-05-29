import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    if (action === 'fetch_applications') {
      const { data, error } = await supabase
        .from("ambassador_applications")
        .select("*, members!inner(name, phone, email, member_code, tier, avatar_url, lifetime_spend)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === 'revoke') {
      const { applicationId, memberId } = payload;
      
      // Update application status
      const { error: updateAppErr } = await supabase
        .from('ambassador_applications')
        .update({ status: 'rejected', notes: '總部手動撤銷資格' })
        .eq('id', applicationId);
        
      if (updateAppErr) throw updateAppErr;

      // Update member tier & status
      const { error: updateMemberErr } = await supabase
        .from('members')
        .update({
          is_b2b: false,
          ambassador_status: null,
          ambassador_type: null,
          ambassador_since: null,
          ambassador_expires_at: null,
          tier: '初潤知己' // Demote to a normal high tier
        })
        .eq('id', memberId);

      if (updateMemberErr) throw updateMemberErr;

      return NextResponse.json({ success: true });
    }

    if (action === 'suspend') {
      const { applicationId, memberId } = payload;
      
      const { error: updateAppErr } = await supabase
        .from('ambassador_applications')
        .update({ status: 'suspended' })
        .eq('id', applicationId);
      if (updateAppErr) throw updateAppErr;

      const { error: updateMemberErr } = await supabase
        .from('members')
        .update({
          is_b2b: false,
          ambassador_status: 'suspended'
        })
        .eq('id', memberId);
      if (updateMemberErr) throw updateMemberErr;

      return NextResponse.json({ success: true });
    }

    if (action === 'restore') {
      const { applicationId, memberId } = payload;
      
      const { error: updateAppErr } = await supabase
        .from('ambassador_applications')
        .update({ status: 'approved' })
        .eq('id', applicationId);
      if (updateAppErr) throw updateAppErr;

      const { error: updateMemberErr } = await supabase
        .from('members')
        .update({
          is_b2b: true,
          ambassador_status: 'active'
        })
        .eq('id', memberId);
      if (updateMemberErr) throw updateMemberErr;

      return NextResponse.json({ success: true });
    }

    if (action === 'manual_assign') {
      const { searchKey, adminName } = payload;
      
      const { data: member, error: findErr } = await supabase
        .from('members')
        .select('*')
        .or(`phone.eq.${searchKey},member_code.eq.${searchKey}`)
        .single();
        
      if (findErr || !member) {
        return NextResponse.json({ success: false, error: '找不到該會員，請確認手機號碼或會員代碼是否正確。' }, { status: 404 });
      }

      if (member.ambassador_status === 'active') {
        return NextResponse.json({ success: false, error: '該會員已經是有效大使。' }, { status: 400 });
      }

      // 1. Upgrade member
      const { error: updateMemberErr } = await supabase
        .from('members')
        .update({
          is_b2b: true,
          ambassador_status: 'active',
          ambassador_type: 'paid', // default type
          ambassador_since: new Date().toISOString()
        })
        .eq('id', member.id);

      if (updateMemberErr) throw updateMemberErr;

      // 2. Insert dummy application
      const { error: insertAppErr } = await supabase
        .from('ambassador_applications')
        .insert({
          member_id: member.id,
          application_type: 'manual_upgrade',
          status: 'approved',
          reviewed_by: adminName || 'Admin',
          reviewed_at: new Date().toISOString(),
          notes: '總部手動開通'
        });

      if (insertAppErr) throw insertAppErr;

      return NextResponse.json({ success: true, message: '已成功開通品牌大使資格！' });
    }

    if (action === 'update_admin_note') {
      const { applicationId, notes } = payload;
      const { error } = await supabase
        .from('ambassador_applications')
        .update({ notes })
        .eq('id', applicationId);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'open_member_detail') {
      const { memberId } = payload;
      const [memberRes, downlinesRes, txRes] = await Promise.all([
        supabase.from("members").select("*, upline:upline_id(name, member_code)").eq("id", memberId).single(),
        supabase.from("members").select("id, name, member_code, tier, created_at, lifetime_spend").eq("upline_id", memberId).order("created_at", { ascending: false }),
        supabase.from("wallet_transactions").select("amount, transaction_type, created_at").eq("member_id", memberId)
      ]);
      
      const transactions = txRes.data || [];
      const commissionEarned = transactions
        .filter(t => t.transaction_type === 'commission_refund' && t.amount > 0)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const commissionWithdrawn = transactions
        .filter(t => t.transaction_type === 'withdrawal' && t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

      return NextResponse.json({ 
        success: true, 
        data: memberRes.data, 
        downlines: downlinesRes.data || [],
        commissionEarned,
        commissionWithdrawn,
        transactions: transactions.filter(t => t.transaction_type === 'commission_refund')
      });
    }

    if (action === 'send_notification') {
      const { memberId, title, content } = payload;
      const { error } = await supabase
        .from('notifications')
        .insert({
          member_id: memberId,
          title,
          content,
          type: 'system',
          is_read: false
        });
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });

  } catch (error: any) {
    console.error('Ambassador Raw API error:', error);
    return NextResponse.json({ success: false, error: error.message || '伺服器異常' }, { status: 500 });
  }
}
