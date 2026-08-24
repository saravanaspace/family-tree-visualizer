# Phase 0 Research: DevSecOps Security Baseline

**Feature**: 013-devsecops-security-baseline | **Date**: 2026-08-24

This document resolves the technical unknowns for embedding automated security gates, secure
defaults, and an OWASP review process into the existing GitHub-hosted TypeScript monorepo. It
enacts constitution Principle VI.

## Current state

- No security scanning exists (no SAST, SCA gate, secret scanning, or artifact scanning).
- No `helmet` and no CORS configuration; the server sets no protective response headers.
- `express-session`/`passport` dependencies are present, but session configuration is owned by
  feature 003 (`server/auth/session.ts`); there is no active cookie hardening yet.
- Feature 008 provides the CI gate (PR + push to `main`, branch protection); feature 012 provides
  the deployable container image; feature 011 provides structured logging without secret leakage.

## Decision: SAST via GitHub CodeQL

- **Decision**: Add a dedicated `.github/workflows/codeql.yml` running CodeQL for JavaScript/
  TypeScript on pull requests and pushes to `main`, surfacing code-scanning alerts and failing the
  gate on high-severity findings.
- **Rationale**: CodeQL is GitHub-native, free for this repository, integrates with the Security
  tab and PR checks, and covers common code weaknesses (satisfies FR-002). A dedicated workflow is
  GitHub's recommended pattern and keeps SAST isolated from the main build.
- **Alternatives considered**: Semgrep — strong and portable, viable as an alternative or
  complement, but adds a third-party action/config; kept as a documented alternative. ESLint
  security plugins only — rejected: weaker taint/data-flow analysis than CodeQL.

## Decision: SCA via `npm audit` gate + Dependabot

- **Decision**: Add `npm audit --audit-level=high` as a required step in feature 008's `ci.yml`,
  and add `.github/dependabot.yml` for automated dependency-update PRs (npm ecosystem + GitHub
  Actions).
- **Rationale**: Satisfies FR-001 (fail on high-severity vulnerable dependencies) and FR-006
  (automated updates) using native, zero-cost tooling with a committed lockfile for reproducible
  results.
- **Alternatives considered**: Snyk — richer remediation but requires an account/token and is
  third-party; deferred as optional. Renovate — equivalent to Dependabot; either is acceptable,
  Dependabot chosen for native integration.

## Decision: Secret scanning — GitHub native + Gitleaks in CI

- **Decision**: Enable GitHub secret scanning with push protection (repository setting, documented)
  and add Gitleaks as a required CI step with a narrow `.gitleaks.toml` allowlist for false
  positives.
- **Rationale**: Push protection blocks secrets before they enter history; Gitleaks in CI provides
  defense-in-depth and blocks at PR time (satisfies FR-003). Narrow allowlisting satisfies the
  "suppress specific finding, not whole check" edge case.
- **Alternatives considered**: TruffleHog — comparable; Gitleaks chosen for simple config and fast
  CI runs. Native scanning alone — rejected: does not give a PR-time CI gate on forks/branches.

## Decision: Artifact/container scanning via Trivy (depends on feature 012)

- **Decision**: Add a Trivy scan of feature 012's built image (and a filesystem scan) as a
  release-time step, failing on high-severity vulnerabilities.
- **Rationale**: Closes the gap between source checks and shipped artifact (FR-005, OWASP A08).
  Trivy is free, fast, and scans OS packages plus language dependencies.
- **Alternatives considered**: Grype — equivalent; Trivy chosen for breadth (image + fs + config).
  Scanning source only — rejected: misses base-image and bundled-artifact vulnerabilities.

## Decision: Secure-by-default headers via Helmet, with SPA-aware CSP

- **Decision**: Add `helmet` as a runtime dependency and mount a `security-headers` middleware
  early in `server/index.ts`. Enable Helmet's protective defaults (frameguard, noSniff, HSTS in
  production, referrer-policy, etc.). Introduce a Content-Security-Policy tuned for the React/Vite
  SPA, starting in report-only mode to avoid breaking the client, then enforced once validated.
- **Rationale**: Secure defaults protect every endpoint at once (FR-004, OWASP A05). CSP is the
  highest-risk header for an SPA (can break inline styles/scripts and Vite dev), so report-only
  first is the safe rollout.
- **Alternatives considered**: Hand-rolled header middleware — rejected: error-prone and misses
  maintained defaults. Enforcing a strict CSP immediately — rejected: high risk of breaking the
  client without a report-only calibration pass.

## Decision: Hardened cookie policy shared with feature 003

- **Decision**: Add a `server/lib/cookie-policy.ts` exporting secure cookie options (`secure` in
  production, `httpOnly`, `sameSite: "lax"`) that feature 003's `express-session` configuration
  imports, so sessions inherit hardened defaults.
- **Rationale**: Satisfies FR-004's cookie requirement and avoids divergence when 003 wires
  sessions; centralization is the single source of truth (OWASP A02/A05/A07).
- **Alternatives considered**: Configure cookies only inside 003 — rejected: the security policy
  would live in a feature rather than the security baseline, risking inconsistency.

## Decision: Enforced severity threshold and risk-acceptance policy

- **Decision**: The blocking threshold is **high severity and above**; medium/low findings are
  reported and tracked but do not block. A finding may be accepted only with a documented rationale
  and named owner, recorded as a narrow, time-bounded suppression (tool allowlist entry plus a
  tracked note), not a blanket disable.
- **Rationale**: Satisfies FR-008 and the edge cases on fail-loud gates and narrow suppression;
  keeps the baseline achievable while preventing silent risk accumulation.
- **Alternatives considered**: Block on any severity — rejected: noisy, would stall delivery.
  Permanent suppressions — rejected: hides accumulating risk.

## Decision: Per-feature OWASP Top 10 review as a completion gate

- **Decision**: Add `.specify/templates/security-review-template.md` (an OWASP Top 10 checklist)
  and use the existing `/speckit-checklist` flow to produce a `security.md` per feature; a completed
  review with no unresolved high-severity items is required before a feature is marked complete.
- **Rationale**: Satisfies FR-007 and institutionalizes shift-left design review (OWASP A01/A04)
  that tools cannot catch, reusing existing Spec Kit mechanics rather than inventing a process.
- **Alternatives considered**: Rely on automated tools only — rejected: misses design-level access
  control and business-logic risks.

## Decision: Enforcement via branch protection (extends feature 008)

- **Decision**: Add the new security jobs/steps (CodeQL, `npm audit`, Gitleaks; artifact scan at
  release) as required status checks on `main`, reusing feature 008's branch-protection model.
- **Rationale**: Satisfies FR-011 — gates run on PRs and pushes to `main` and actually block merges.
- **Alternatives considered**: Advisory-only — rejected: does not meet the enforced-gate intent.

## Open items for planning/tasks

- Final CSP directive list is calibrated during implementation from report-only telemetry before
  enforcement.
- Exact `npm audit` handling of unfixable advisories (allowlist with owner/expiry) is finalized in
  tasks.
- Whether SAST also includes Semgrep alongside CodeQL is an optional add decided in tasks.
