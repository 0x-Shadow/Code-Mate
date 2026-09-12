# Deploy Code-Mate to GitHub Pages

The included `.github/workflows/deploy-pages.yml` builds and deploys the app
as a static GitHub Pages site whenever `master` changes.

1. Push this repository to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. In **Settings → Secrets and variables → Actions → Variables**, add:
   - `PISTON_URL`: HTTPS URL for a self-hosted or whitelisted Piston executor,
     ending in `/api/v2/piston/execute`.
4. Push to `master` or run the **Deploy to GitHub Pages** workflow manually.

The live URL is:

`https://0x-shadow.github.io/Code-Mate/`

GitHub Pages hosts the frontend only; the Piston URL must be a separate
public HTTPS service with CORS enabled for the Pages URL.

For local development, copy `.env.example` to `.env.local`, set
`NEXT_PUBLIC_PISTON_URL`, and run `npm run dev`.
