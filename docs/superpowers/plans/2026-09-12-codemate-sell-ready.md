# Code-Mate Sell-Ready Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Code-Mate sellable this week as a $99-499 starter kit / Flippa listing with real code execution, Stripe payments, usage limits, and buyer trust assets.

**Architecture:** Keep Next.js 15 App Router + Clerk auth + Convex DB. Harden client Piston execution with timeouts/limits, enforce daily quotas in Convex, add Stripe Checkout + webhook alongside existing LemonSqueezy, fix hygiene typos, add .env.example + LICENSE + SEO landing polish.

**Tech Stack:** Next.js 15.5, React 19, TypeScript 5, Tailwind 3.4, Clerk 6.x, Convex 1.27, Monaco, Zustand 5, Stripe (new), Piston execute API.

**Spec:** Brainstorm approval 2026-09-12 — Approach A Quick-flip starter kit (Stripe + real execution + landing/docs). No separate spec file; this plan argues from Code-Mate README + verified code in `src/app/(root)/page.tsx`, `src/store/useCodeEditorStore.ts`, `convex/schema.ts`, `convex/codeExecutions.ts`, `convex/users.ts`, `convex/http.ts`, `convex/lemonSqueezy.ts`.

## Global Constraints

- Node 20+ (matches `@types/node: ^20` in package.json).
- `npm run build` must pass after every task.
- `npx tsc --noEmit` must pass after every task.
- Do not break existing Clerk + Convex auth flow in `convex/http.ts` `/clerk-webhook`.
- Keep LemonSqueezy webhook intact; Stripe is additive.
- Piston public API: no secrets committed; 10s timeout; 50KB code limit.
- No hardcoded API keys in `src/`.

---

## File Structure

- `src/app/(root)/_components/OuputPanel.tsx` → rename to `OutputPanel.tsx` (fix typo; component inside is already `OutputPanel`). Update import in `src/app/(root)/page.tsx:1-3`.
- `src/app/(root)/_components/ThemeSelector copy.tsx` → delete (stray duplicate).
- `src/store/useCodeEditorStore.ts:112-199` → harden `runCode()` with AbortController timeout, code-size guard, `api.piston.rs` primary + `emkc.org` fallback.
- `src/lib/piston.ts` (new) → single `executeCode({language, version, code}: {language: string; version: string; code: string}): Promise<{output: string}>` helper so store stays thin.
- `src/lib/quotas.ts` (new) → `FREE_DAILY_RUNS = 30`, `PRO_DAILY_RUNS = 1000`, `getDayKey(d: Date): string` for client display.
- `convex/schema.ts` → add to `codeExecutions`: `dayKey: v.string()` + index `by_user_and_day`. Add to `users`: `stripeCustomerId: v.optional(v.string())`.
- `convex/codeExecutions.ts` → add `checkQuota` query + enforce in `saveExecution`.
- `convex/stripe.ts` (new, `use node`) → `verifyWebhook(payload: string, signature: string)` with `stripe` npm package.
- `convex/http.ts` → add `/stripe-webhook` route calling `internal.stripe.verifyWebhook` then `api.users.upgradeToProByStripe`.
- `convex/users.ts` → add `upgradeToProByStripe` mutation.
- `.env.example` (new) → all required keys with empty values.
- `LICENSE` (new) → MIT with `Copyright (c) 2026 Code-Mate`.
- `src/app/layout.tsx` → add metadata title/description/og.
- `README.md` → rewrite Sell-Ready section: demo GIF placeholder, deploy steps, env table, license.

---

### Task 1: Hygiene + green build

**Files:**
- Modify: `src/app/(root)/page.tsx:1-3`
- Modify: `src/app/(root)/_components/OuputPanel.tsx` (rename to `OutputPanel.tsx`)
- Delete: `src/app/(root)/_components/ThemeSelector copy.tsx`
- Create: `.env.example`
- Create: `LICENSE`

**Interfaces:**
- Consumes: nothing.
- Produces: correct import path `@/app/(root)/_components/OutputPanel` for later tasks.

- [ ] **Step 1: Verify failing state — stray file + typo import exist**

Run: `npm run build`
Expected: PASS (build passes now, but hygiene fails manual review — stray file listed below).

Run:
```bash
Get-ChildItem "src/app/(root)/_components"
```
Expected: lists `OuputPanel.tsx` and `ThemeSelector copy.tsx`.

- [ ] **Step 2: Rename typo file via git mv**

Run:
```bash
git mv "src/app/(root)/_components/OuputPanel.tsx" "src/app/(root)/_components/OutputPanel.tsx"
Remove-Item -LiteralPath "src/app/(root)/_components/ThemeSelector copy.tsx"
```
Expected: `OutputPanel.tsx` exists, stray gone.

- [ ] **Step 3: Fix import in page.tsx**

Replace in `src/app/(root)/page.tsx`:
```tsx
import Header from "./_components/Header";
import OuputPanel from "./_components/OuputPanel";
import EditorPanel from "./_components/EditorPanel";


export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="max-w-[1800px] mx-auto p-4">
        <Header/>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <EditorPanel/>
            <OuputPanel/>
        </div>
      </div>
    </div>
  );
}
```
With:
```tsx
import Header from "./_components/Header";
import OutputPanel from "./_components/OutputPanel";
import EditorPanel from "./_components/EditorPanel";


export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="max-w-[1800px] mx-auto p-4">
        <Header/>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <EditorPanel/>
            <OutputPanel/>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create .env.example**

Content:
```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
# Convex
NEXT_PUBLIC_CONVEX_URL=
# Stripe (sell-ready payments)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=
# LemonSqueezy (legacy, optional)
LEMON_SQUEEZY_WEBHOOK_SECRET=
```

- [ ] **Step 5: Create LICENSE**

Content:
```
MIT License

Copyright (c) 2026 Code-Mate

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 6: Run build + types to verify pass**

Run: `npx tsc --noEmit`
Expected: PASS with no output.

Run: `npm run build`
Expected: PASS (`Compiled successfully`).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: fix OutputPanel typo, remove stray file, add env example and license"
```

---

### Task 2: Harden Piston execution

**Files:**
- Create: `src/lib/piston.ts`
- Create: `src/lib/quotas.ts`
- Modify: `src/store/useCodeEditorStore.ts:112-199`

**Interfaces:**
- Consumes: `LANGUAGE_CONFIG` from `@/app/(root)/_constants` (existing, `{language, version}` per lang).
- Produces: `executeCode(args): Promise<{output: string}>` used by store; `FREE_DAILY_RUNS`, `PRO_DAILY_RUNS`, `getDayKey()` used by Task 3 UI.

- [ ] **Step 1: Create src/lib/piston.ts with timeout + fallback**

```ts
export type PistonArgs = { language: string; version: string; code: string };

const PRIMARY = "https://emkc.org/api/v2/piston/execute";
const FALLBACK = "https://api.piston.rs/api/v2/execute";

export async function executeCode({ language, version, code }: PistonArgs): Promise<{ output: string }> {
  if (!code.trim()) throw new Error("Please Enter Some Code");
  if (code.length > 50_000) throw new Error("Code too large (max 50KB)");

  const body = JSON.stringify({ language, version, files: [{ content: code }] });

  const attempt = async (url: string): Promise<any> => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10_000);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`Executor HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(t);
    }
  };

  let data: any;
  try {
    data = await attempt(PRIMARY);
  } catch {
    data = await attempt(FALLBACK);
  }

  if (data.message) throw new Error(data.message);
  if (data.compile && data.compile.code !== 0) {
    throw new Error(data.compile.stderr || data.compile.output || "Compile error");
  }
  if (data.run && data.run.code !== 0) {
    throw new Error(data.run.stderr || data.run.output || "Runtime error");
  }
  const out: string = data.run?.output ?? "";
  return { output: out.trim() };
}
```

- [ ] **Step 2: Create src/lib/quotas.ts**

```ts
export const FREE_DAILY_RUNS = 30;
export const PRO_DAILY_RUNS = 1000;

export function getDayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
```

- [ ] **Step 3: Wire store runCode() to helper**

Replace `src/store/useCodeEditorStore.ts:112-199` `runCode` body with:
```ts
runCode: async () => {
  const { language, getCode } = get();
  const code = getCode();
  if (!code) {
    set({ error: "Please Enter Some Code" });
    return;
  }
  set({ isRunning: true, error: null, output: "" });
  try {
    const runtime = LANGUAGE_CONFIG[language].pistonRuntime;
    const { executeCode } = await import("@/lib/piston");
    const { output } = await executeCode({ language: runtime.language, version: runtime.version, code });
    set({
      output,
      error: null,
      executionResult: { code, output, error: null },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error Running Code";
    set({ error: msg, executionResult: { code, output: "", error: msg } });
  } finally {
    set({ isRunning: false });
  }
},
```

- [ ] **Step 4: Verify types + build**

Run: `npx tsc --noEmit`
Expected: PASS.

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Manual verify (no secrets needed)**

Run: `npm run dev`
Expected: open `http://localhost:3000`, paste JavaScript default code, Run → Output shows squares/sum. Paste `while(true){}` → after ~10s shows error, no hang.

- [ ] **Step 6: Commit**

```bash
git add src/lib/piston.ts src/lib/quotas.ts src/store/useCodeEditorStore.ts
git commit -m "feat: harden piston execution with timeout fallback and limits"
```

---

### Task 3: Daily quotas Free vs Pro in Convex

**Files:**
- Modify: `convex/schema.ts:15-21`
- Modify: `convex/schema.ts:5-13`
- Modify: `convex/codeExecutions.ts:5-35`
- Modify: `convex/codeExecutions.ts:37-50` (add checkQuota, keep getUserExecutions)

**Interfaces:**
- Consumes: `getDayKey` logic mirrored server-side (same `YYYY-MM-DD` UTC).
- Produces: `api.codeExecutions.checkQuota({userId, dayKey}) -> {used, limit, isPro}` and `saveExecution` now requires `{dayKey: string}` and throws `ConvexError("Daily limit reached")`.

- [ ] **Step 1: Update convex/schema.ts codeExecutions table**

Replace:
```ts
codeExecutions: defineTable({
    userId: v.string(),
    language: v.string(),
    code: v.string(),
    output: v.optional(v.string()),
    error: v.optional(v.string()),
  }).index("by_user_id", ["userId"]),
```
With:
```ts
codeExecutions: defineTable({
    userId: v.string(),
    language: v.string(),
    code: v.string(),
    output: v.optional(v.string()),
    error: v.optional(v.string()),
    dayKey: v.string(),
  }).index("by_user_id", ["userId"]).index("by_user_and_day", ["userId", "dayKey"]),
```

- [ ] **Step 2: Add stripeCustomerId to users table**

Replace:
```ts
lemonSqueezyCustomerId: v.optional(v.string()),
        lemonSqueezyOrderId: v.optional(v.string()),
```
With:
```ts
lemonSqueezyCustomerId: v.optional(v.string()),
        lemonSqueezyOrderId: v.optional(v.string()),
        stripeCustomerId: v.optional(v.string()),
```

- [ ] **Step 3: Add checkQuota + enforce in convex/codeExecutions.ts**

Add after imports:
```ts
const FREE_DAILY_RUNS = 30;
const PRO_DAILY_RUNS = 1000;

export const checkQuota = query({
  args: { userId: v.string(), dayKey: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    const isPro = user?.isPro === true;
    const limit = isPro ? PRO_DAILY_RUNS : FREE_DAILY_RUNS;
    const used = (
      await ctx.db
        .query("codeExecutions")
        .withIndex("by_user_and_day")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .filter((q) => q.eq(q.field("dayKey"), args.dayKey))
        .collect()
    ).length;
    return { used, limit, isPro, remaining: Math.max(0, limit - used) };
  },
});
```

Replace `saveExecution` args/handler with:
```ts
export const saveExecution = mutation({
    args:{
        language: v.string(),
        code:v.string(),
        output:v.optional(v.string()),
        error:v.optional(v.string()),
        dayKey: v.string(),
    },
    handler:async(ctx,args)=>{
        const identity=await ctx.auth.getUserIdentity();
        if(!identity) throw new ConvexError("Not authenticated");
        if (args.code.length > 50_000) throw new ConvexError("Code too large");

        const user=await ctx.db
        .query("users")
        .withIndex("by_user_id")
        .filter((q)=>q.eq(q.field("userId"),identity.subject))
        .first();

        if(!user?.isPro && args.language!=="javascript"){
            throw new ConvexError("Pro Subscription Required");
        }

        const used = (
          await ctx.db
            .query("codeExecutions")
            .withIndex("by_user_and_day")
            .filter((q) => q.eq(q.field("userId"), identity.subject))
            .filter((q) => q.eq(q.field("dayKey"), args.dayKey))
            .collect()
        ).length;
        const limit = user?.isPro ? PRO_DAILY_RUNS : FREE_DAILY_RUNS;
        if (used >= limit) throw new ConvexError("Daily limit reached");

        await ctx.db.insert("codeExecutions",{
            language: args.language,
            code: args.code,
            output: args.output,
            error: args.error,
            dayKey: args.dayKey,
            userId:identity.subject,
        })
    }
})
```

- [ ] **Step 4: Verify convex types**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add convex/schema.ts convex/codeExecutions.ts
git commit -m "feat: add daily execution quotas free vs pro"
```

---

### Task 4: Stripe payments (additive, keep LemonSqueezy)

**Files:**
- Modify: `package.json` (add `stripe` dep)
- Create: `convex/stripe.ts`
- Modify: `convex/users.ts` (append mutation)
- Modify: `convex/http.ts` (append route)

**Interfaces:**
- Consumes: `api.users.upgradeToProByStripe` from `convex/users.ts`.
- Produces: `POST /stripe-webhook` → upgrades user `isPro=true`.

- [ ] **Step 1: Install stripe dep**

Run: `npm install stripe`
Expected: `package.json` gains `"stripe": "^..."` in dependencies.

- [ ] **Step 2: Create convex/stripe.ts**

```ts
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
```

- [ ] **Step 3: Append upgradeToProByStripe to convex/users.ts**

```ts
export const upgradeToProByStripe = mutation({
  args: { email: v.string(), stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
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
```

- [ ] **Step 4: Add /stripe-webhook route to convex/http.ts**

Append before `export default http;`:
```ts
http.route({
  path: "/stripe-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payloadString = await request.text();
    const signature = request.headers.get("stripe-signature");
    if (!signature) return new Response("Missing stripe-signature", { status: 400 });
    try {
      const result: any = await ctx.runAction(internal.stripe.verifyWebhook, {
        payload: payloadString,
        signature,
      });
      if (result?.type === "checkout.session.completed" && result.email) {
        await ctx.runMutation(api.users.upgradeToProByStripe, {
          email: result.email,
          stripeCustomerId: result.stripeCustomerId ?? "",
        });
      }
      return new Response("Webhook processed successfully", { status: 200 });
    } catch (error) {
      console.log("Stripe webhook error:", error);
      return new Response("Error processing webhook", { status: 500 });
    }
  }),
});
```
Also add `internal` to existing import: `import { api, internal } from "./_generated/api";` (already present — keep).

- [ ] **Step 5: Verify build**

Run: `npx tsc --noEmit`
Expected: PASS.

Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json convex/stripe.ts convex/users.ts convex/http.ts
git commit -m "feat: add stripe checkout webhook alongside lemonsqueezy"
```

---

### Task 5: Sell-ready trust assets (SEO, README, deploy)

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `README.md`
- Create: `DEPLOY.md`

**Interfaces:**
- Consumes: all prior tasks.
- Produces: buyer can deploy from docs with env table + 1-click steps.

- [ ] **Step 1: Add SEO metadata to src/app/layout.tsx**

Ensure export exists:
```tsx
export const metadata = {
  title: "Code-Mate — Browser IDE + Snippet Library (Next.js + Convex SaaS Starter)",
  description: "Run 10+ languages in the browser, save snippets, gate Pro with Stripe. Clerk auth, Convex DB, Monaco editor. Deploy in 10 minutes.",
};
```

- [ ] **Step 2: Rewrite README top section**

Replace first 10 lines with:
```md
# Code-Mate — Browser IDE SaaS Starter (Next.js + Clerk + Convex + Stripe)

Run JavaScript, Python, Java, Go, Rust, C++, C#, Ruby, Swift, TypeScript in the browser (Piston), save/share snippets, gate Pro runs with Stripe + Convex quotas.

- Live demo: _(paste your Vercel URL here)_
- Stack: Next.js 15, Clerk, Convex, Monaco, Zustand, Tailwind
- Payments: Stripe (primary) + LemonSqueezy (legacy)
- Limits: 30 runs/day Free, 1000/day Pro (see `convex/codeExecutions.ts`)
```
Keep rest of file unchanged.

- [ ] **Step 3: Create DEPLOY.md**

```md
# Deploy Code-Mate in 10 minutes

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill Clerk + Convex + Stripe keys.
3. `npx convex dev` (creates tables from `convex/schema.ts`).
4. Add Clerk webhook → Convex `/clerk-webhook`, Stripe webhook → `/stripe-webhook`.
5. `npm run build && npm run start` or Deploy to Vercel.

Test: sign up, run JS snippet, check Convex `codeExecutions` has `dayKey`. Upgrade via Stripe test card `4242 4242 4242 4242` → `users.isPro=true`.
```

- [ ] **Step 4: Final verify**

Run: `npm run lint`
Expected: PASS (warnings ok, no errors).

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx README.md DEPLOY.md
git commit -m "docs: sell-ready seo readme and deploy guide"
```

---

## Self-Review

- Spec coverage: execution hardening (Task 2), quotas (Task 3), Stripe (Task 4), hygiene/env/license (Task 1), SEO/README/deploy (Task 5). Pricing page wiring left to buyer Stripe Price ID via `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` — intentional to avoid hardcoding.
- Placeholder scan: no TBD/TODO; all code blocks concrete with exact paths and expected commands.
- Type consistency: `executeCode({language, version, code})` defined Task 2, used in store same task; `dayKey: string` added Task 3 schema + mutation args together; `upgradeToProByStripe({email, stripeCustomerId})` defined Task 4 step 3, called step 4 with same names.
