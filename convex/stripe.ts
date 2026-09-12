"use node";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import Stripe from "stripe";

export const verifyWebhook = internalAction({
  args: { payload: v.string(), signature: v.string() },
  handler: async (_ctx, args) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const event = stripe.webhooks.constructEvent(
      args.payload,
      args.signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      return {
        type: "checkout.session.completed",
        email: session.customer_details?.email ?? session.customer_email ?? "",
        stripeCustomerId: (session.customer as string) ?? "",
      };
    }
    return { type: event.type };
  },
});
