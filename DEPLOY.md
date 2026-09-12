# Deploy Code-Mate in 10 minutes

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill Clerk + Convex + Stripe keys.
3. `npx convex dev` (creates tables from `convex/schema.ts`).
4. Add Clerk webhook → Convex `/clerk-webhook`, Stripe webhook → `/stripe-webhook`.
   If you use your own Clerk app, also set `CLERK_JWT_ISSUER_DOMAIN` (Convex env).
5. `npm run build && npm run start` or Deploy to Vercel.

Test: sign up, run JS snippet, check Convex `codeExecutions` has `dayKey`. Upgrade via Stripe test card `4242 4242 4242 4242` (public Stripe test value only, never a real key) → `users.isPro=true`. Refund/cancel in Stripe test mode → `users.isPro=false` (downgrade webhook).

No-keys demo: the homepage runs without env keys (editor + Piston execution).
Sign-in, saving, `/snippets`, `/profile`, `/pricing` checkout need Clerk + Convex.

Quota note: `dayKey` is computed server-side (UTC `YYYY-MM-DD`) on every run,
so clients can never forge or omit it — no migration needed. Pre-existing rows
without `dayKey` keep working for stats/history and are simply never counted
against today's quota.
