import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ---------------------------------------------------------------------------
  // HTTP Security Headers
  // Applied to all responses; tightened further for /api/auth/* routes.
  // ---------------------------------------------------------------------------
  async headers() {
    return [
      {
        // Global security headers for every route
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // Extra headers for NextAuth API routes
        // These routes are public by design; we harden them further.
        source: "/api/auth/:path*",
        headers: [
          {
            // Prevent browsers from caching auth responses
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            // Disallow embedding auth endpoints in frames
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            // Do not expose server software info
            key: "X-Powered-By",
            value: "",
          },
          {
            // Minimal CSP for auth endpoints — no inline scripts, same-origin only
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none';",
          },
        ],
      },
    ];
  },

  // ---------------------------------------------------------------------------
  // Body size limit for API routes
  // Next.js App Router uses the Web Fetch API; the sizeLimit below applies
  // to the built-in body parser for Pages API routes and is also respected
  // by the server runtime for App Router routes.
  // ---------------------------------------------------------------------------
  experimental: {
    serverActions: {
      // Limit Server Action bodies to 1 MB (default is 1 MB; explicit here)
      bodySizeLimit: "1mb",
    },
  },
};

export default nextConfig;
