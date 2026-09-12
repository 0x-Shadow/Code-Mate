# Code-Mate — Free Online Code Playground (ad-supported)

Write and run JavaScript, Python, Java, Go, Rust, C++, C#, Ruby and Swift
right in the browser. **Free, no sign-up, no database.** You earn via
Google AdSense slots above and below the editor.

## Run it

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. No accounts, no database.

## Code execution (1 step, required)

Code runs on a **Piston** sandbox (isolated server, never in the visitor's
browser). The public endpoint is whitelist-only, so point the app at your
own instance:

```bash
docker run -d -p 2000:2000 ghcr.io/engineer-man/piston
```

then set in `.env.local`:

```
NEXT_PUBLIC_PISTON_URL=http://YOUR-SERVER:2000/api/v2/piston/execute
```

(Any VPS with Docker works — ~$5/mo. Or apply for the public whitelist at
https://github.com/engineer-man/piston#public-api and keep the default.)

## Get paid (AdSense)

1. Apply at https://www.google.com/adsense with your deployed domain
   (AdSense does not serve `localhost` — slots show placeholders locally).
2. Copy `.env.example` to `.env.local`, set `NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXX`.
3. (Optional) Create ad units and set `NEXT_PUBLIC_AD_SLOT_TOP` / `NEXT_PUBLIC_AD_SLOT_BOTTOM`.
4. Redeploy. Revenue lands in your AdSense account.

## How it stays safe (no accounts to abuse)

- **User code never runs in the visitor's browser.** It is sent as plain
  text over HTTPS to your Piston sandbox, which executes it isolated and
  returns stdout. There is no `eval`, no `innerHTML`, no
  `dangerouslySetInnerHTML` anywhere — output renders as React-escaped
  text inside `<pre>`. Even malicious JavaScript (infinite loops, miners,
  fetch spam) can only burn executor CPU until the 10s timeout — it can
  never touch your page, your visitors' data, or your server.
- **Runaway code is capped:** 10s executor timeout, 50KB code limit,
  20KB output cap, 2s between runs, 60 runs/hour per browser.
- **Strict CSP** in `next.config.ts` (scripts, frames, connect allowlists).
- **Nothing to steal:** no logins, no cookies, no database, no user data
  stored anywhere. Preferences (theme, code drafts) live only in the
  visitor's own `localStorage`.

## Deploy

```bash
npm run build && npm run start
```

or push to Vercel. Set `NEXT_PUBLIC_ADSENSE_CLIENT` in the host's env vars.
