"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DigitalCardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/profile/security/vcard");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-900" />
      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">正在導向專屬電子名片...</p>
    </div>
  );
}
