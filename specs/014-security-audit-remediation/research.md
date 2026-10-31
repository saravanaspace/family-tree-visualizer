# Phase 0 Research: Security Audit Remediation

**Feature**: 014-security-audit-remediation | **Date**: 2026-10-31

Resolves the technical choices for remediating the audit findings. Evidence: full `security-audit` run `run-1` (`~/security-audit-skill/familytree/run-1/`).

## Current state

- All `/api` routes are unauthenticated; the server binds `0.0.0.0:5000`; `.replit` publishes the port.
- `setupVite` replaces the `vite.config.ts` `server` block, sets `allowedHosts: true`, and the Vite logger exits the process on errors.
- No `helmet`, no rate limit, `X-Powered-By` is sent, error handler returns `err.message` for 5xx.
- `getEvents` builds an array with `sql.raw`; not injectable today (`parseInt` output only).
- No CI or Dependabot; feature 013 is Draft with 0/21 tasks done.

## Decision: Interim containment by loopback bind

- **Decision**: Bind to `127.0.0.1` by default; `HOST` env overrides.
- **Rationale**: Removes the network path with one line until feature 003 lands; the audit showed exposure, not auth logic, is the risk.
- **Alternatives**: Shared-secret header (invented auth, replaced by 003); ignore until 003 (leaves the confirmed gap).

## Decision: Full auth via feature 003

- **Decision**: `requireAuth` on `/api` with per-tree membership (401/403); this feature adds the route-enumeration test.
- **Rationale**: Avoids duplicating 003; the test keeps new routes from shipping unguarded.

## Decision: Merge Vite server options

- **Decision**: `server: { ...viteConfig.server, middlewareMode: true, hmr: { server } }`, explicit `allowedHosts`, no `process.exit` in the logger, and `fs.deny: ['**/.*', '**/.*/**']`.
- **Rationale**: Reproduced in the sandbox: replacement dropped `fs.deny`; a refused request exited the process; the `**/.*` glob alone does not match files inside dot-directories such as `.git/`.
- **Caveat**: the `**/.*/**` addition was suggested during verification; confirm with the regression test.
- **Alternatives**: restrict `server.fs.allow` to `client/` and `shared/` (also acceptable); keep dev server loopback-only.

## Decision: Parameterize `getEvents`

- **Decision**: Use a Drizzle `sql` template with `&&` and `${memberIds}::int[]`, or `arrayOverlaps`; validate `memberIds` with Zod (positive ints, max count).
- **Rationale**: Removes an unsafe pattern even though it is not currently injectable; invalid values return 400 instead of a database error.

## Decision: Headers and rate limiting

- **Decision**: `helmet` (shared with 013), `express-rate-limit` for `/api` (stricter on mutations), `app.disable('x-powered-by')`.
- **Rationale**: Standard, small middleware; defined once in 013 FR-004.

## Decision: Generic error and logging behaviour

- **Decision**: 5xx returns a generic message, details logged server-side, no re-throw; request logger omits response bodies.
- **Rationale**: Audit showed the rethrow only drops the connection (not a crash) but leaks internals; bodies contain PII.

## Decision: Dependencies

- **Decision**: `npm audit fix`, staged upgrades with tests, remove unused packages, add `npm audit --omit=dev --audit-level=high` script and CI gate through 013.
- **Rationale**: The audit found no reachable path, so this is hygiene; fewer dependencies shrinks the advisory surface. Advisory content must be checked with registry access.

## Decision: Input bounds and scripts

- **Decision**: `photoUrl` http(s) only, length caps on free text, `memberIds` max count with existence check, finite bounded `x`/`y`; `DATABASE_URL` required in production, `cleanup`/`seed` refuse in production, `DATABASE_SSL` option.
- **Rationale**: Closes the hardening notes at the schema and boundary level.

## Open items (need owner input)

- Is the deployment public and does it hold real data? (decides real-world severity of the auth gap; owner-observed only)
- Production proxy/TLS/headers and DB reachability on the Replit deployment.
