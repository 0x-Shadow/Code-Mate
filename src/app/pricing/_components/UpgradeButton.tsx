import { Zap } from "lucide-react";
import Link from "next/link";

export default function UpgradeButton() {
  // Legacy LemonSqueezy checkout. Prefer Stripe (NEXT_PUBLIC_STRIPE_PRO_PRICE_ID).
  // Kept as env override so buyers point it at their own store without code edits.
  const CHEKOUT_URL =
    process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL ||
    "https://codemate.lemonsqueezy.com/buy/0494ee48-9aa5-4761-b7f4-906668d1e75d";

  return (
    <Link
      href={CHEKOUT_URL}
      className="inline-flex items-center justify-center gap-2 px-8 py-4 text-white 
        bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg 
        hover:from-blue-600 hover:to-blue-700 transition-all"
    >
      <Zap className="w-5 h-5" />
      Upgrade to Pro
    </Link>
  );
}
