// Clerk JWT issuer Convex accepts. Override per deployment:
// `npx convex env set CLERK_JWT_ISSUER_DOMAIN <your-clerk-domain>`
// Falls back to the original dev tenant so existing setups keep working.
export default {
  providers: [
    {
      domain:
        process.env.CLERK_JWT_ISSUER_DOMAIN ??
        "https://loving-mako-11.clerk.accounts.dev/",
      applicationID: "convex",
    },
  ]
};
