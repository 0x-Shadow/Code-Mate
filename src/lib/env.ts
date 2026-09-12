// Central place to check whether backend env is wired.
// When keys are missing the app runs in demo mode: the editor + code
// execution work (Piston is client-side), saving/history/Pro need Convex + Clerk.

export const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

export const isConvexConfigured = CONVEX_URL.startsWith("http");
