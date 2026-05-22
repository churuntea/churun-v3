"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthSync() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip sync on login, register, and public pages
    if (pathname?.startsWith("/login") || pathname?.startsWith("/register") || pathname?.startsWith("/brand")) {
      return;
    }

    const syncSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user?.memberId) {
            const currentId = localStorage.getItem("churun_member_id");
            if (currentId !== data.user.memberId) {
              localStorage.setItem("churun_member_id", data.user.memberId);
              // Force reload so all client-side queries use the correct ID
              window.location.reload();
            }
          } else {
            // Not authenticated on server, clear local and redirect
            if (localStorage.getItem("churun_member_id")) {
              localStorage.removeItem("churun_member_id");
              router.replace("/login");
            }
          }
        }
      } catch (err) {
        console.error("Auth sync failed", err);
      }
    };

    syncSession();
  }, [pathname, router]);

  return null;
}
