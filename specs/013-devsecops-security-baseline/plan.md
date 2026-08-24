# Implementation Plan: DevSecOps Security Baseline

**Branch**: `013-devsecops-security-baseline` | **Date**: 2026-08-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/013-devsecops-security-baseline/spec.md`

## Summary

Enact constitution Principle VI by embedding security into the existing pipeline and codebase.
Extend feature 008's CI gate with automated security jobs — dependency (SCA) scanning, static
application security testing (SAST), and secret scanning — that block merges on high-severity
findings, plus a container/artifact scan of feature 012's image before release. Add
secure-by-default HTTP behavior with a `helmet` security-headers middleware and a shared
hardened-cookie policy that feature 003's session config consumes. Automate dependency updates and
add a per-feature OWASP Top 10 security-review template that plugs into the existing
`/speckit-checklist` flow and becomes a completion gate. The work is additive tooling,
configuration, and one small runtime middleware; it changes no application behavior beyond adding
protective response headers.

## Technical Context

**Language/Version**: TypeScript 5.6 on Node.js 20 (ESM); CI on GitHub Actions `ubuntu-latest`,
extending feature 008's workflow.

**Primary Dependencies**: `helmet` (runtime, security headers) is the only application dependency
added. CI/security tooling: CodeQL (GitHub-native SAST), `npm audit` + Dependabot (SCA and
automated updates), Gitleaks + GitHub secret scanning/push protection, and Trivy (artifact/image
scanning of feature 012's container). No change to the React/Express/Drizzle stack.

**Storage**: N/A — no schema, persistence, or data changes.

**Testing**: Existing Vitest suite; a new integration test asserting protective response headers
are present and session cookies are `secure`/`httpOnly`/`sameSite`. Reuses `server/__tests__/`.

**Target Platform**: Developer workstations (Windows/macOS/Linux) and GitHub Actions runners on
Node.js 20; the application runtime gains only response-header behavior.

**Project Type**: Web application — single npm package with `client/` (React/Vite), `server/`
(Express), and `shared/` (schemas). Security gates span the repo; headers apply to the server.

**Performance Goals**: Added CI security jobs keep the overall pipeline within feature 008's ~10
minute budget (SAST/scan jobs run in parallel with existing checks); header middleware adds
negligible per-request overhead.

**Constraints**: No application behavior change except added protective headers; gates fail loudly
(never silently pass); high-severity findings block; false positives are suppressed narrowly (per
finding/location) not by disabling whole checks; secrets stay out of source, logs, and artifacts.

**Scale/Scope**: CI workflow additions, a Dependabot config, a Gitleaks config, a `helmet`
middleware and shared cookie policy, a security-review template, `server/__tests__` coverage, and
documentation. Depends on features 008 (CI gate), 011 (logging), and 012 (deployable artifact).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Requirements and Traceability**: PASS — `spec.md` with prioritized stories exists; this
  `plan.md` follows; `tasks.md` via `/speckit-tasks`.
- **II. Consistent Type-Safe Stack**: PASS — retains the stack; adds only `helmet` (focused
  runtime middleware) plus dev/CI security tooling. No shared-schema or DB change.
- **III. Behavior-Driven Verification**: PASS — the new header/cookie behavior is covered by a
  Vitest integration test; the CI security gates are themselves verification infrastructure.
- **IV. Reliable Integration Boundaries**: PASS — the header middleware crosses the HTTP boundary
  and is validated by an integration test; the secure-cookie policy is shared with feature 003.
- **V. Accessible, Responsive, and Focused UX**: PASS (N/A user-facing) — no UI change; scope is
  limited to security tooling, headers, and process.
- **VI. Security by Design (Shift-Left)**: PASS — this feature is the concrete enactment of
  Principle VI: automated scanning gates, secure defaults, secret hygiene, and a per-feature OWASP
  review. It adds no auth system (that is feature 003) but provides the baseline 003 must meet.

**Technical Constraints (constitution §)**: Directly satisfied — secrets remain outside committed
source (enforced by secret scanning) and out of logs/artifacts; no destructive migration.

Result: No violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/013-devsecops-security-baseline/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (process artifacts; no persistent entities)
├── quickstart.md        # Phase 1 output (validation guide)
├── contracts/           # Phase 1 output
│   ├── ci-security-contract.md
│   ├── security-headers-contract.md
│   └── security-review-contract.md
└── tasks.md             # Phase 2 output (/speckit-tasks - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
.github/
├── workflows/
│   ├── ci.yml                  # EDIT (feature 008): add SCA (npm audit), secret scan (gitleaks),
│   │                           #   and artifact scan (Trivy, gated on feature 012 image) as
│   │                           #   required steps
│   └── codeql.yml              # NEW: CodeQL SAST workflow (JS/TS) on PR + push to main
├── dependabot.yml              # NEW: automated dependency update PRs
.gitleaks.toml                  # NEW: secret-scan ruleset/allowlist (narrow suppressions)
server/
├── middleware/
│   └── security-headers.ts     # NEW: helmet configuration (headers; CSP tuned for the SPA)
├── lib/
│   └── cookie-policy.ts        # NEW: shared secure cookie options (secure/httpOnly/sameSite)
│                               #   consumed by feature 003 session config
├── index.ts                    # EDIT: mount security-headers middleware early
└── __tests__/
    └── security-headers.test.ts # NEW: assert headers present + cookie flags hardened
.specify/templates/
└── security-review-template.md # NEW: per-feature OWASP Top 10 review (used via /speckit-checklist)
README.md                       # EDIT: document security checks, local run, triage/acceptance
package.json                    # EDIT: add helmet; add audit/scan scripts
```

**Structure Decision**: Single existing web application. Security gates extend feature 008's one
CI workflow (SCA + secret scan + artifact scan as steps) plus a dedicated CodeQL workflow (GitHub's
recommended pattern for code scanning), all added to branch protection as required checks.
Dependabot config automates updates. In the server, a `helmet`-based `security-headers` middleware
is mounted early in `server/index.ts`, and a shared `cookie-policy` module centralizes hardened
cookie options so feature 003's session configuration inherits secure defaults. A
`security-review-template` institutionalizes the per-feature OWASP review through the existing
`/speckit-checklist` mechanism, and the Development Workflow treats a completed review as a
completion gate.

## Complexity Tracking

> No constitution violations; no complexity justifications required.
