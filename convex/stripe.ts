"use node";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import Stripe from "stripe";

export type StripeWebhookResult =
  | { type: "checkout.session.completed"; email: string; stripeCustomerId: string; eventId: string }
  | { type: "subscription.deleted" | "charge.refunded"; email: string; eventId: string }
  | { type: string; eventId: string };

function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(secret);
}

function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("Missing STRIPE_WEBHOOK_SECRET");
  return secret;
}

export const verifyWebhook = internalAction({
  args: { payload: v.string(), signature: v.string() },
  handler: async (_ctx, args): Promise<StripeWebhookResult> => {
    const stripe = getStripe();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        args.payload,
        args.signature,
        getWebhookSecret()
      );
    } catch {
      // Signature mismatch must not bubble as a 500 (Stripe would retry).
      throw new Error("Invalid Stripe signature");
    }
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const email =
        session.customer_details?.email ?? session.customer_email ?? "";
      const customer = session.customer;
      const stripeCustomerId =
        typeof customer === "string" ? customer : customer?.id ?? "";
      if (!email || !stripeCustomerId) {
        throw new Error("Checkout session missing email/customer");
      }
      return {
        type: "checkout.session.completed",
        email,
        stripeCustomerId,
        eventId: event.id,
      };
    }
    if (
      event.type === "customer.subscription.deleted" ||
      event.type === "charge.refunded"
    ) {
      const obj = event.data.object as {
        customer?: string | Stripe.Customer | null;
        billing_details?: { email?: string };
        receipt_email?: string | null;
      };
      const email = obj.billing_details?.email ?? obj.receipt_email ?? "";
      // Downgrade needs an email; without one there is nothing to revoke.
      if (!email) return { type: event.type, email: "", eventId: event.id };
      return { type: event.type, email, eventId: event.id };
    }
    return { type: event.type, eventId: event.id };
  },
});
