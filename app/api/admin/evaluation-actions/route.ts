import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    if (action === 'fetch_global_stats') {
      const { data, error } = await supabase
        .from("members")
        .select("tier")
        .eq("status", "active");
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === 'fetch_audits') {
      const { data: accountingData } = await supabase
        .from("members")
        .select("*")
        .eq("is_b2b", true)
        .eq("status", "pending_accounting")
        .order("created_at", { ascending: false });

      const { data: managerData } = await supabase
        .from("members")
        .select("*")
        .eq("is_b2b", true)
        .eq("status", "pending_manager")
        .order("created_at", { ascending: false });

      const { data: exitData } = await supabase
        .from("members")
        .select("*")
        .eq("status", "exit_pending")
        .order("created_at", { ascending: false });

      return NextResponse.json({ success: true, accountingData, managerData, exitData });
    }

    if (action === 'reject_exit') {
      const { memberId } = payload;
      const { error } = await supabase
        .from("members")
        .update({ status: "active" })
        .eq("id", memberId);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'fetch_rank_members') {
      const { rankName } = payload;
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("tier", rankName)
        .eq("status", "active")
        .order("lifetime_spend", { ascending: false });
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === 'accountant_audit') {
      const { memberId, approve, adminName } = payload;
      const { data: mData } = await supabase
        .from("members")
        .select("beneficiary")
        .eq("id", memberId)
        .single();

      let updatedBeneficiary = mData?.beneficiary || "";
      if (updatedBeneficiary.startsWith("B2B_JSON_V1|")) {
        try {
          const jsonStr = updatedBeneficiary.substring("B2B_JSON_V1|".length);
          const data = JSON.parse(jsonStr);
          data.audited_by_accountant = adminName;
          data.accountant_audited_at = new Date().toISOString();
          updatedBeneficiary = "B2B_JSON_V1|" + JSON.stringify(data);
        } catch (e) {}
      }

      if (approve) {
        const { error } = await supabase
          .from("members")
          .update({ status: "pending_manager", beneficiary: updatedBeneficiary })
          .eq("id", memberId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("members")
          .update({ status: "rejected", beneficiary: updatedBeneficiary })
          .eq("id", memberId);
        if (error) throw error;
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'manager_audit') {
      const { member, approve, adminName } = payload;
      let updatedBeneficiary = member.beneficiary || "";
      if (updatedBeneficiary.startsWith("B2B_JSON_V1|")) {
        try {
          const jsonStr = updatedBeneficiary.substring("B2B_JSON_V1|".length);
          const data = JSON.parse(jsonStr);
          data.audited_by_manager = adminName;
          data.manager_audited_at = new Date().toISOString();
          updatedBeneficiary = "B2B_JSON_V1|" + JSON.stringify(data);
        } catch (e) {}
      }

      if (approve) {
        const { error: memberErr } = await supabase
          .from("members")
          .update({ 
            status: "active",
            virtual_balance: member.initial_deposit || 0,
            initial_deposit: member.initial_deposit || 0,
            beneficiary: updatedBeneficiary
          })
          .eq("id", member.id);
        if (memberErr) throw memberErr;

        await supabase
          .from("wallet_transactions")
          .insert({
            member_id: member.id,
            amount: member.initial_deposit || 0,
            transaction_type: "deposit",
            status: "completed",
            metadata: {
              auditor: adminName,
              audited_at: new Date().toISOString(),
              note: "B2B 創始首筆預收儲值"
            }
          });

        try {
          const { data: welcomeCoupon } = await supabase
            .from("coupons")
            .select("id")
            .eq("code", "WELCOME100")
            .maybeSingle();

          if (welcomeCoupon) {
            await supabase.from("member_coupons").insert({
              member_id: member.id,
              coupon_id: welcomeCoupon.id,
              is_used: false
            });

            await supabase.from("notifications").insert({
              member_id: member.id,
              title: "🎁 獲得註冊迎新折價券！",
              content: "恭喜您獲得一張【新會員迎新折價券】！滿 $500 現折 $100，已存入您的個人券包，快到商城下單體驗吧！",
              type: "system"
            });
          }
        } catch (couponErr) {}
      } else {
        const { error } = await supabase
          .from("members")
          .update({ status: "rejected", beneficiary: updatedBeneficiary })
          .eq("id", member.id);
        if (error) throw error;
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Evaluation Actions API error:', error);
    return NextResponse.json({ success: false, error: error.message || '伺服器異常' }, { status: 500 });
  }
}
