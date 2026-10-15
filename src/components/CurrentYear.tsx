"use client";

import { useEffect, useState } from "react";

/**
 * Renders the current year. The Date read happens in useEffect so it never
 * runs during static prerender (Next.js 16 flags render-time Date calls).
 */
export function CurrentYear() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return <>{year ?? ""}</>;
}
