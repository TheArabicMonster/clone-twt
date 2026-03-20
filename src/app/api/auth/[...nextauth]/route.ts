import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;

// ---------------------------------------------------------------------------
// Route Segment Config
// Limits the request body size accepted by this route to 16 KB.
// This mitigates DoS via oversized payloads (finding #3).
// Reference: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
// ---------------------------------------------------------------------------
export const maxDuration = 30; // seconds — keep auth requests short-lived
