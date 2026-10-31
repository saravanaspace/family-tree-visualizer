# Security Audit Report — Family Tree Visualizer

**Date**: 2026-10-31
**Method**: Source-first review using the **`security-audit` skill** (guidance mode: focused source review, no full six-phase artifact run) plus `npm audit` against the lockfile. No live endpoints were probed; no target code was executed beyond `npm audit`.
**Scope**: `server/`, `shared/`, `client/src` (non-ui), `package.json`, `.replit`, `.env.example`, `migrations/`, existing specs 001–013.
**Coverage**: Guidance pass was partial (one reviewer, no independent verifier); the full run below adds independent verification. Findings are source-evidenced; severities are calibrated to the *current* single-tenant, unauthenticated deployment model.

## Full six-phase audit (supersedes severities below where they differ)

The **`security-audit` skill was run in full audit mode** (standard profile, commit `659cdff`, sandboxed source-and-local-only, no prior runs) after the guidance pass. Run directory: `~/security-audit-skill/familytree/run-1/` (`REPORT.md`, `FINDINGS-DETAIL.md`, `NEEDS-VALIDATION.md`, `findings.json`, `coverage-ledger.json`). Coverage: 16 units (11 covered, 5 candidate-linked), final critic clean; both validators pass.

| Fingerprint | Final verdict | Maps to | Notes |
|-------------|---------------|---------|-------|
| `familytree:api:no-authn` | 🟡 MEDIUM, confirmed | SEC-001 | Reproduced locally with stubbed storage: anonymous read, modify, delete. Downgraded from HIGH: single-tenant data, and whether the live deployment is public with real data is unknown. |
| `familytree:dev-server:fs-deny-overridden-project-files-readable` | ⚪ LOW, confirmed | SEC-004 (expanded) | `setupVite` replaces the `vite.config.ts` `server` block, dropping `fs.deny`. With any Host header, source and top-level dotfiles are readable, and a refused request exits the dev process via `customLogger.error` → `process.exit(1)`. Dev mode only. |
| `familytree:deps:advisory-reachability-unestablished` | rejected | SEC-002 | No reachable vulnerable path found; advisory data is unverifiable offline. Keep as hygiene (`npm audit --omit=dev` + upgrades), not a finding. |

Corrections to the guidance-pass table: SEC-003 (headers, rate limit), SEC-005 (`sql.raw`, proven not injectable by replay), SEC-007, SEC-008 and SEC-009 are **hardening notes**, not verified findings. SEC-006: the error handler's rethrow does **not** crash the process (it only destroys the connection); only the 5xx `err.message` disclosure remains. SEC-010 is a process gap.

## Findings (guidance pass)

| ID | Severity | Location | Finding | Status |
|----|----------|----------|---------|--------|
| SEC-001 | 🟠 HIGH | `server/routes.ts` (all routes), `server/index.ts:62-66` | No authentication/authorization. Any network client can read the whole tree (names, emails, birth/death dates, biographies — PII) and create/modify/delete any record. Server binds `0.0.0.0` and `.replit` exposes port 5000 publicly. | Confirmed (source) |
| SEC-002 | 🟠 HIGH | `package.json` / lockfile | `npm audit --omit=dev`: 14 high/critical advisories incl. direct deps `express`, `drizzle-orm`, `ws`, `zod`, `postcss`, and transitive `body-parser`, `path-to-regexp`, `proxy-addr` (critical), `lodash`, `nanoid`. | Confirmed (tool); reachability per advisory unverified |
| SEC-003 | 🟡 MEDIUM | `server/index.ts`, `server/routes.ts` | No security headers (no `helmet`, CSP, nosniff, frame-options, HSTS), no rate limiting. Spec 013 FR-004 not implemented. | Confirmed |
| SEC-004 | 🟡 MEDIUM | `server/vite.ts:27` | Dev server uses `allowedHosts: true` (DNS-rebinding exposure of Vite dev server and source) when `NODE_ENV=development`; `.replit` run workflow uses `npm run dev`. | Confirmed (dev only) |
| SEC-005 | ⚪ LOW | `server/storage.ts` `getEvents` | Query built with `sql.raw` and string-joined `memberIds`. Currently not injectable (`parseInt` yields numbers/NaN; NaN causes a SQL error, i.e. 400) but is an unsafe pattern one refactor away from SQL injection. | Confirmed (hardening) |
| SEC-006 | ⚪ LOW | `server/index.ts:56-60` | Error handler returns `err.message` for 5xx (information disclosure) and re-`throw`s after responding. | Confirmed |
| SEC-007 | ⚪ LOW | `server/index.ts:23-31` | Request logger writes (truncated) JSON response bodies, which contain PII, to stdout. | Confirmed |
| SEC-008 | ⚪ LOW | `shared/schema.ts` `photoUrl`, `biography` | `photoUrl` is an arbitrary string rendered as `<img src>` (viewer IP/tracking beacon to any host; non-http schemes accepted). `biography`/`notes`/`description` have no length cap. Event `memberIds` unbounded and not checked against existing members. | Confirmed |
| SEC-009 | ⚪ LOW | `server/db/cleanup.ts`, `server/seed.ts`, `server/storage.ts:20`, `server/db/setup.ts` | Destructive `DROP TABLE` / seed scripts run against whatever `DATABASE_URL` is set with no environment guard; a hard-coded fallback connection string is used by the app; Postgres connection has no TLS option configured. | Confirmed |
| SEC-010 | ⚪ LOW (process) | `specs/013-*`, `.github/` | Spec 013 is "Draft" with 0/21 tasks complete; no CI workflow, dependabot, or secret scan exists even though commit `305dcc5` says the baseline was implemented. | Confirmed |

## Checked and not found

- No `dangerouslySetInnerHTML`; SVG built via `createElement`/`setAttribute` with numeric/style values (`innerHTML = ''` in `family-tree-canvas.tsx:118` is a clear, not a sink).
- All other DB access uses parameterized Drizzle queries; Zod validates bodies, with enums for type fields; `id`/timestamps are omitted from insert schemas (no mass assignment).
- `.env` is git-ignored; no committed secrets found (`.env.example` only).

## Needs validation (outside source)

- Production reverse proxy/TLS/headers on the Replit deployment.
- Whether the deployed DB is reachable only privately and uses TLS.
- Whether the live deployment is publicly reachable and holds real family data (decides real-world severity of `familytree:api:no-authn`; owner-observed only).
- Advisory content for SEC-002 could not be checked offline; the full audit found no reachable path (rejected). Re-run `npm audit --omit=dev` with registry access.
