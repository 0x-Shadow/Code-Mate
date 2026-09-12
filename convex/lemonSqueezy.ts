"use node";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { createHmac, timingSafeEqual } from "crypto";

function getWebhookSecret(): string {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret) throw new Error("Missing LEMON_SQUEEZY_WEBHOOK_SECRET");
  return secret;
}

function verifySignature(payload: string, signature: string): boolean {
  const hmac = createHmac("sha256", getWebhookSecret());
  const computed = hmac.update(payload).digest("hex");
  const a = Buffer.from(computed, "utf8");
  const b = Buffer.from(signature, "utf8");
  // Constant-time compare: length check first (lengths are not secret).
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export type LemonSqueezyEvent = {
  meta?: { event_name?: string };
  data?: {
    id?: string | number;
    attributes?: {
      user_email?: string;
      customer_id?: string | number;
      total?: number;
    };
  };
};

export const verifyWebhook = internalAction({
  args: {
    payload: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, args): Promise<LemonSqueezyEvent> => {
    const isValid = verifySignature(args.payload, args.signature);

    if (!isValid) {
      throw new Error("Invalid signature");
    }

    try {
      return JSON.parse(args.payload) as LemonSqueezyEvent;
    } catch {
      throw new Error("Malformed webhook payload");
    }
  },
});
