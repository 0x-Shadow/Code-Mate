# Deploy Code-Mate in 10 minutes

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill Clerk + Convex + Stripe keys.
3. `npx convex dev` (creates tables from `convex/schema.ts`).
4. Add Clerk webhook → Convex `/clerk-webhook`, Stripe webhook → `/stripe-webhook`.
5. `npm run build && npm run start` or Deploy to Vercel.

Test: sign up, run JS snippet, check Convex `codeExecutions` has `dayKey`. Upgrade via Stripe test card `4242 4242 4242 4242` → `users.isPro=true`.

Backfill note: old codeExecutions rows lack dayKey — on first `npx convex dev` push, old rows keep working for stats; new runs require dayKey.
