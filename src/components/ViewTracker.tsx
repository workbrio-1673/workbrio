"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Fires one lightweight page-view beacon per navigation. No cookies, no PII. */
export function ViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      const body = JSON.stringify({ path: pathname });
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", blob);
      } else {
        fetch("/api/track", {
          method: "POST",
          body,
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      /* never break the page */
    }
  }, [pathname]);

  return null;
}
