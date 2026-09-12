# Deploy Code-Mate in 5 minutes

1. `npm install`
2. Start a Piston executor (`docker run -d -p 2000:2000
   ghcr.io/engineer-man/piston`) and set `NEXT_PUBLIC_PISTON_URL` in
   `.env.local` (see `.env.example`).
3. `npm run build && npm run start` — or push to Vercel.
4. For ad revenue: set `NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXX` (plus
   optional `NEXT_PUBLIC_AD_SLOT_TOP` / `NEXT_PUBLIC_AD_SLOT_BOTTOM`)
   in `.env.local` locally or in the host's env vars, then redeploy.

No Clerk, no Convex, no Stripe, no webhooks — nothing to configure.
Test: open the site, pick Python, hit Run Code, see output. Slots show
dashed placeholders until the AdSense ID is set (AdSense only serves
approved domains, never `localhost`).
