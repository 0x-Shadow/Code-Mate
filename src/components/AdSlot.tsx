"use client";

import { useEffect } from "react";

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function AdSlot({
  slot,
  label,
  className = "",
}: {
  // AdSense ad-unit ID. Optional: with only a publisher ID, AdSense Auto
  // Ads can still fill `data-ad-format="auto"` units; set explicit slot IDs
  // per placement for full control.
  slot?: string;
  label: string;
  className?: string;
}) {
  useEffect(() => {
    if (!ADSENSE_CLIENT || !slot) return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // Ad blockers / unapproved domains throw here — page must not break.
    }
  }, [slot]);

  // No publisher ID configured yet: show a quiet placeholder so the owner
  // sees exactly where ads will appear. Never shown to visitors once set.
  if (!ADSENSE_CLIENT) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-dashed border-gray-700/60 bg-white/[0.02] px-4 py-3 text-xs text-gray-600 ${className}`}
      >
        Ad space — {label} (set NEXT_PUBLIC_ADSENSE_CLIENT to go live)
      </div>
    );
  }

  return (
    <div className={`overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        {...(slot ? { "data-ad-slot": slot } : {})}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
