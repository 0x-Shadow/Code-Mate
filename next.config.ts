import type { NextConfig } from "next";
import MonacoWebpackPlugin from "monaco-editor-webpack-plugin";

const isGitHubPages = process.env.GITHUB_ACTIONS === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  ...(isGitHubPages ? { output: "export" as const } : {}),
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    // Self-host Monaco (editor + language workers) from our own bundle.
    // Without this the editor loads from a public CDN at runtime — blocked
    // by our CSP and by several national firewalls.
    if (!isServer) {
      config.plugins.push(
        new MonacoWebpackPlugin({
          filename: "static/[name].worker.js",
          languages: [
            "javascript",
            "typescript",
            "python",
            "java",
            "go",
            "rust",
            "cpp",
            "csharp",
            "ruby",
            "swift",
          ],
        })
      );
    }
    return config;
  },
  ...(!isGitHubPages ? { async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js hydration + Monaco web workers/blobs.
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com",
              // Piston code executors + AdSense.
              "connect-src 'self' https://emkc.org https://api.piston.rs https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net",
              "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com",
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  } } : {}),
};

export default nextConfig;
