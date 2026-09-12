import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

// Called ONLY from the Clerk webhook (internal). Never expose user
// creation to clients — otherwise anyone can squat any userId.
export const syncUser = internalMutation({
  args: {
    userId: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (!existingUser) {
      await ctx.db.insert("users", {
        userId: args.userId,
        email: args.email,
        name: args.name,
        isPro: false,
      });
    } else if (
      existingUser.email !== args.email ||
      existingUser.name !== args.name
    ) {
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
      });
    }
  },
});

// Returns ONLY the caller's own user. Clients must not pass userIds.
export const getUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .first();

    if (!user) return null;

    return user;
  },
});

// Called ONLY from the LemonSqueezy webhook (internal). Public by-email
// upgrade would be free Pro for anyone.
export const upgradeToPro = internalMutation({
  args: {
    email: v.string(),
    lemonSqueezyCustomerId: v.string(),
    lemonSqueezyOrderId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      isPro: true,
      proSince: Date.now(),
      lemonSqueezyCustomerId: args.lemonSqueezyCustomerId,
      lemonSqueezyOrderId: args.lemonSqueezyOrderId,
    });

    return { success: true };
  },
});

// Called ONLY from the Stripe webhook (internal).
export const upgradeToProByStripe = internalMutation({
  args: { email: v.string(), stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    if (!args.email) throw new Error("Missing email");
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, {
      isPro: true,
      proSince: Date.now(),
      stripeCustomerId: args.stripeCustomerId,
    });
    return { success: true };
  },
});

// Called ONLY from refund/cancel webhook events (internal).
export const downgradeToFree = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    if (!args.email) throw new Error("Missing email");
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, { isPro: false });
    return { success: true };
  },
});
