# Dev Server Contract

**Feature**: 014-security-audit-remediation | **Date**: 2026-10-31 | **Covers**: FR-004, `familytree:dev-server:fs-deny-overridden-project-files-readable`

## Requirements

- `setupVite` MUST merge `viteConfig.server` (e.g. `server: { ...viteConfig.server, middlewareMode: true, hmr: { server } }`) so `fs.strict` and `fs.deny` from `vite.config.ts` apply.
- `fs.deny` MUST cover dot-files and the contents of dot-directories (`['**/.*', '**/.*/**']`) or `server.fs.allow` MUST be restricted to `client/` and `shared/`.
- `allowedHosts` MUST be an explicit allowlist, never `true`. A foreign `Host` header MUST receive `403`.
- The Vite logger MUST NOT call `process.exit` for a refused request; the process stays up.
- The dev server MUST NOT be exposed publicly; production uses `serveStatic` (`npm run start`).

## Expected behaviour

| Request (Host) | Expected |
|----------------|----------|
| `/@fs/<root>/server/vite.ts` (`evil.example`) | 403 (Host blocked) |
| `/@fs/<root>/.git/config` (`localhost`) | 403 |
| `/@fs/<root>/.replit`, `.gitignore` (`localhost`) | 403 |
| `/@fs/etc/passwd`, `.env.example` | 403, process keeps running |
| Normal client assets (`localhost`) | 200 |

## Verification

Integration test that starts `setupVite` with a stub app on loopback and asserts the table (T007). Reference probes: `agents/f2-devsrv/artifacts/{p.mjs,v2.ts}` in the audit run directory.
