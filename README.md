# Code-Mate — Free Online Code Playground

Live site: [https://0x-shadow.github.io/Code-Mate/](https://0x-shadow.github.io/Code-Mate/)

Write and run JavaScript, Python, Java, Go, Rust, C++, C#, Ruby and Swift
right in the browser. **Free, no sign-up, no database.**

## Run it

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. No accounts, no database.

## Code execution

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

(Any VPS with Docker works. The public endpoint is no longer a general
fallback; the app requires `NEXT_PUBLIC_PISTON_URL`.)

## Deploy to GitHub Pages

Push the repository to GitHub and set **Settings → Pages → Source** to
**GitHub Actions**. The included workflow deploys the static site on every
push to `master`.

Add this repository variable under **Settings → Secrets and variables →
Actions → Variables**:

- `PISTON_URL`: your public HTTPS Piston endpoint.

The live URL is:

`https://0x-shadow.github.io/Code-Mate/`

The Piston server must allow CORS requests from this GitHub Pages URL.

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

See [DEPLOY.md](https://github.com/0x-Shadow/Code-Mate/blob/master/DEPLOY.md)
for the complete GitHub Pages checklist.
