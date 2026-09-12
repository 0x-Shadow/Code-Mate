# Deploy Code-Mate to GitHub Pages

The included `.github/workflows/deploy-pages.yml` builds and deploys the app
as a static GitHub Pages site whenever `main` changes.

1. Push this repository to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. In **Settings → Secrets and variables → Actions → Variables**, add:
   - `PISTON_URL`: HTTPS URL for a self-hosted or whitelisted Piston executor,
     ending in `/api/v2/piston/execute`.
   - `ADSENSE_CLIENT`: your `ca-pub-...` publisher ID.
   - Optional: `AD_SLOT_TOP` and `AD_SLOT_BOTTOM`.
4. Push to `main` or run the **Deploy to GitHub Pages** workflow manually.

The site URL will be:

`https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPOSITORY-NAME/`

Add that exact URL, including the repository path, under **AdSense → Sites**.
AdSense must approve the domain before ads appear. GitHub Pages hosts the
frontend only; the Piston URL must be a separate public HTTPS service with
CORS enabled for the Pages URL.

For local development, copy `.env.example` to `.env.local`, set
`NEXT_PUBLIC_PISTON_URL`, and run `npm run dev`.
