import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Edge-compatible in-memory rate limiter
// Uses a simple sliding-window counter stored per-request-context.
// NOTE: Edge Runtime does not support Node.js modules, so we cannot import
// src/lib/rate-limit.ts (which relies on a Node.js Map that persists across
// invocations only in Node.js runtime). Here we rely on the global scope
// available inside a single Edge isolate. This provides best-effort
// protection; for production multi-instance deployments, replace with an
// external store (e.g., Upstash Redis).
// ---------------------------------------------------------------------------

interface WindowEntry {
  count: number;
  resetAt: number;
}

// globalThis persists within the same Edge isolate/worker instance.
const rateLimitStore: Map<string, WindowEntry> =
  (globalThis as unknown as Record<string, unknown>).__rl_store as Map<
    string,
    WindowEntry
  > ?? new Map<string, WindowEntry>();

(globalThis as unknown as Record<string, unknown>).__rl_store = rateLimitStore;

/**
 * Returns true when the request should be rate-limited (limit exceeded).
 */
function isRateLimited(
  key: string,
  limit: number,
  windowSec: number
): boolean {
  const now = Date.now();
  const windowMs = windowSec * 1000;

  const entry = rateLimitStore.get(key);

  if (!entry || now >= entry.resetAt) {
    // Start a new window
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count += 1;

  if (entry.count > limit) {
    return true;
  }

  return false;
}

/**
 * Derive a stable client identifier from the request.
 * Prefers the forwarded IP header set by reverse proxies/Vercel.
 */
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

// ---------------------------------------------------------------------------
// Auth middleware (NextAuth)
// ---------------------------------------------------------------------------
const authMiddleware = auth((req) => {
  // Auth logic is handled inside auth.config.ts (authorized callback).
  // This wrapper ensures the session cookie is validated on every request
  // matched by the config below.
  return NextResponse.next();
});

// ---------------------------------------------------------------------------
// Main middleware entry point
// ---------------------------------------------------------------------------
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Rate limiting for NextAuth routes ---
  // These routes are legitimately public but must be protected against
  // brute-force and DoS attacks.
  if (pathname.startsWith("/api/auth/")) {
    const ip = getClientIP(request);
    const key = `auth:${ip}`;

    // Allow at most 30 requests per minute per IP on auth routes.
    const limited = isRateLimited(key, 30, 60);

    if (limited) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests, please slow down." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
            "X-RateLimit-Limit": "30",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // Enforce a strict content-length limit for auth routes (16 KB max).
    // This mitigates DoS via oversized payloads at the edge, before the
    // request reaches the Next.js server.
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 16 * 1024) {
      return new NextResponse(
        JSON.stringify({ error: "Payload too large." }),
        {
          status: 413,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Do NOT block — auth routes are intentionally public.
    return NextResponse.next();
  }

  // --- Rate limiting for API routes (non-auth) ---
  // Applied at the edge BEFORE the route handler runs, regardless of auth
  // state. This ensures unauthenticated requests are also rate-limited,
  // preventing enumeration and DoS even when the handler returns 401.
  if (pathname.startsWith("/api/")) {
    const ip = getClientIP(request);
    const key = `api:${ip}`;

    // Allow at most 60 requests per minute per IP on general API routes.
    const limited = isRateLimited(key, 60, 60);

    if (limited) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests, please slow down." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
            "X-RateLimit-Limit": "60",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // API routes handle their own authentication (returning 401 when needed).
    // Do NOT delegate to NextAuth's authMiddleware for API routes — it can
    // interfere and return 403 instead of letting the route handler produce
    // the correct 401 Unauthorized response.
    return NextResponse.next();
  }

  // For page routes, delegate to NextAuth session validation.
  return (authMiddleware as unknown as (req: NextRequest) => Promise<NextResponse>)(request);
}

// ---------------------------------------------------------------------------
// Route matcher
// ---------------------------------------------------------------------------
export const config = {
  matcher: [
    /*
     * Match all paths except:
     *  - _next/static  (static files)
     *  - _next/image   (image optimisation)
     *  - favicon.ico
     *  - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
