// components/BrandAmbassadorCard.tsx

import React, { useState } from "react";
import { Crown } from "lucide-react";
import { supabase } from "@/app/supabase";

interface Props {
  member: any; // member object from the table row
  onClose: () => void;
  onSuccess: () => void;
}

export default function BrandAmbassadorCard({ member, onClose, onSuccess }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      const payload = {
        member_id: member.id,
        amount_paid: 98_000,
        duration_months: 24, // 2 years
      };
      const { error: apiError } = await supabase
        .from("ambassador_applications")
        .insert([payload]);
      if (apiError) throw apiError;
      // Optionally update member tier
      await supabase
        .from("members")
        .update({ tier: "ambassador" })
        .eq("id", member.id);
      onSuccess();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "提交失敗");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />
      <div className="relative bg-white glass-panel rounded-3xl p-8 w-full max-w-md shadow-2xl z-10">
        <button
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"
          onClick={onClose}
        >✕</button>
        <h2 className="text-2xl font-black text-center mb-4">
          <Crown className="inline w-6 h-6 text-amber-400 align-middle mr-2" />
          申請品牌大使資格
        </h2>
        <p className="text-center mb-4">
          您的會員等級已符合條件，申請金額 NT$98,000，
          受理後將成為品牌大使（有效期 2 年）。
        </p>
        {error && (
          <div className="bg-rose-50 border border-rose-100 p-3 rounded mb-4 text-rose-600">
            ⚠️ {error}
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-3 btn-premium flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <>確認申請 (NT$98,000)</>
          )}
        </button>
      </div>
    </div>
  );
}
