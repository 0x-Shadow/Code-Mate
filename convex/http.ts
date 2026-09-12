import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/lemon-squeezy-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payloadString = await request.text();
    const signature = request.headers.get("X-Signature");

    if (!signature) {
      return new Response("Missing X-Signature header", { status: 400 });
    }

    try {
      const payload = await ctx.runAction(internal.lemonSqueezy.verifyWebhook, {
        payload: payloadString,
        signature,
      });

      const eventName = payload.meta?.event_name;
      if (eventName === "order_created") {
        const email = payload.data?.attributes?.user_email;
        const customerId = payload.data?.attributes?.customer_id;
        const orderId = payload.data?.id;
        if (!email || customerId === undefined || orderId === undefined) {
          return new Response("Malformed order payload", { status: 400 });
        }
        await ctx.runMutation(internal.users.upgradeToPro, {
          email,
          lemonSqueezyCustomerId: String(customerId),
          lemonSqueezyOrderId: String(orderId),
        });
      } else if (
        eventName === "subscription_cancelled" ||
        eventName === "subscription_payment_refunded"
      ) {
        const email = payload.data?.attributes?.user_email;
        if (email) {
          await ctx.runMutation(internal.users.downgradeToFree, { email });
        }
      }

      return new Response("Webhook processed successfully", { status: 200 });
    } catch (error) {
      if ((error as Error).message === "Invalid signature") {
        return new Response("Invalid signature", { status: 401 });
      }
      if ((error as Error).message === "Malformed webhook payload") {
        return new Response("Malformed payload", { status: 400 });
      }
      console.log("Webhook error:", error);
      return new Response("Error processing webhook", { status: 500 });
    }
  }),
});

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable");
    }

    const svix_id = request.headers.get("svix-id");
    const svix_signature = request.headers.get("svix-signature");
    const svix_timestamp = request.headers.get("svix-timestamp");

    if (!svix_id || !svix_signature || !svix_timestamp) {
      return new Response("Error occurred -- no svix headers", {
        status: 400,
      });
    }

    // Svix must verify the raw body bytes — parse/stringify round-trips
    // change whitespace/key order and break the signature.
    const body = await request.text();

    const wh = new Webhook(webhookSecret);
    let evt: WebhookEvent;

    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return new Response("Invalid signature", { status: 401 });
    }

    const eventType = evt.type;
    if (eventType === "user.created") {
      // save the user to convex db
      const { id, email_addresses, first_name, last_name } = evt.data;

      const email = email_addresses?.[0]?.email_address;
      if (!email) {
        return new Response("User has no email", { status: 400 });
      }
      const name = `${first_name || ""} ${last_name || ""}`.trim();

      try {
        await ctx.runMutation(internal.users.syncUser, {
          userId: id,
          email,
          name,
        });
      } catch (error) {
        console.log("Error creating user:", error);
        return new Response("Error creating user", { status: 500 });
      }
    }

    return new Response("Webhook processed successfully", { status: 200 });
  }),
});

http.route({
  path: "/stripe-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payloadString = await request.text();
    const signature = request.headers.get("stripe-signature");
    if (!signature) return new Response("Missing stripe-signature", { status: 400 });
    try {
      const result = await ctx.runAction(internal.stripe.verifyWebhook, {
        payload: payloadString,
        signature,
      });
      if (result.type === "checkout.session.completed" && "email" in result && result.email) {
        await ctx.runMutation(internal.users.upgradeToProByStripe, {
          email: result.email,
          stripeCustomerId: result.stripeCustomerId,
        });
      } else if (
        (result.type === "customer.subscription.deleted" ||
          result.type === "charge.refunded") &&
        "email" in result &&
        result.email
      ) {
        await ctx.runMutation(internal.users.downgradeToFree, {
          email: result.email,
        });
      }
      return new Response("Webhook processed successfully", { status: 200 });
    } catch (error) {
      if ((error as Error).message === "Invalid Stripe signature") {
        return new Response("Invalid signature", { status: 401 });
      }
      console.log("Stripe webhook error:", error);
      return new Response("Error processing webhook", { status: 500 });
    }
  }),
});

export default http;
