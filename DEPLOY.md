# Deploy Code-Mate in 10 minutes

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill Clerk + Convex + Stripe keys.
3. `npx convex dev` (creates tables from `convex/schema.ts`).
4. Add Clerk webhook → Convex `/clerk-webhook`, Stripe webhook → `/stripe-webhook`.
5. `npm run build && npm run start` or Deploy to Vercel.

Test: sign up, run JS snippet, check Convex `codeExecutions` has `dayKey`. Upgrade via Stripe test card `4242 4242 4242 4242` → `users.isPro=true`.

Backfill note: `dayKey` on `codeExecutions` is optional, so this migration is
non-breaking. Fresh deploys are unaffected — new runs always write `dayKey`
(`YYYY-MM-DD`). For existing Convex data with rows missing `dayKey`, those rows
are treated as uncounted legacy (excluded from daily quota counts) and keep
working for stats/history. Optional one-off backfill: query rows missing
`dayKey`, derive `YYYY-MM-DD` from each row's `_creationTime`, and patch them:

```ts
// One-off backfill (Convex dashboard function or script):
// for each doc in codeExecutions where dayKey == undefined:
//   const d = new Date(doc._creationTime);
//   const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
//   await ctx.db.patch(doc._id, { dayKey });
```
