# Security Headers & Cookie Contract

**Feature**: 013-devsecops-security-baseline | **Date**: 2026-08-24

This contract defines the secure-by-default HTTP behavior the server must exhibit. The plan uses a
`helmet`-based middleware and a shared cookie policy to satisfy it.

## Response Headers

Every application response MUST include protective headers, at minimum:

| Header | Purpose |
|--------|---------|
| `X-Content-Type-Options: nosniff` | Prevent MIME sniffing |
| `X-Frame-Options` / frame-ancestors | Prevent clickjacking |
| `Referrer-Policy` | Limit referrer leakage |
| `Strict-Transport-Security` (production) | Enforce HTTPS |
| `Content-Security-Policy` | Restrict sources (report-only during calibration, then enforced) |

- The Content-Security-Policy is tuned for the React/Vite single-page app; it starts in
  **report-only** mode and is **enforced** once validated against real client behavior.
- Header presence MUST be verifiable on application responses.

## Session Cookies

When a session cookie is issued (feature 003), it MUST be:

| Flag | Value |
|------|-------|
| `Secure` | true in production |
| `HttpOnly` | true |
| `SameSite` | `lax` (or stricter) |

- These options come from a single shared cookie policy so all cookie-issuing code inherits the
  same hardened defaults.

## Guarantees

- Adding headers MUST NOT change application data or endpoint behavior.
- A missing required header MUST be detectable by an automated check.
- No sensitive value is placed in a header or a non-secure cookie.
