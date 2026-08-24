# Data Model: DevSecOps Security Baseline

**Feature**: 013-devsecops-security-baseline | **Date**: 2026-08-24

## Overview

This feature introduces **no persistent application data entities** and makes no database or schema
changes. It adds security tooling, gates, and process. For completeness, the "model" here is the
set of process artifacts and security-configuration objects that downstream tasks and tests
reference.

## Process Artifacts (non-data)

| Artifact | Purpose | Key attributes |
|----------|---------|----------------|
| Security Finding | A scanner-reported issue | source (SCA/SAST/secret/artifact), severity, location, status (open/resolved/accepted) |
| Risk Acceptance | A documented decision to accept a finding | finding reference, rationale, owner, expiry/re-review date, scope (narrow) |
| Security Review | Per-feature OWASP Top 10 review | feature id, per-risk applicability + notes, unresolved high items, completion state |

## Security Configuration Objects (non-data)

| Object | Purpose | Key contents |
|--------|---------|--------------|
| `.github/workflows/codeql.yml` | SAST | CodeQL for JS/TS on PR + push to `main` |
| `.github/workflows/ci.yml` (edit) | SCA + secret + artifact scan steps | `npm audit --audit-level=high`, Gitleaks, Trivy (release) |
| `.github/dependabot.yml` | Automated updates | npm + GitHub Actions ecosystems, schedule |
| `.gitleaks.toml` | Secret-scan rules | ruleset + narrow allowlist |
| `server/middleware/security-headers.ts` | Response headers | Helmet defaults + SPA-aware CSP (report-only → enforced) |
| `server/lib/cookie-policy.ts` | Cookie hardening | `secure` (prod), `httpOnly`, `sameSite: lax` |
| `.specify/templates/security-review-template.md` | OWASP review | Top 10 checklist consumed via `/speckit-checklist` |

## Severity & Gate States

| Severity | Gate behavior |
|----------|---------------|
| Critical / High | Blocks merge or release unless an owned, time-bounded acceptance exists |
| Medium / Low | Reported and tracked; does not block |

## Risk-Acceptance Lifecycle

An accepted finding moves through: **open** (detected by a gate) → **accepted** (documented
rationale + owner + expiry, narrow suppression applied) → **re-review** (at expiry) → **resolved**
(fixed) or **re-accepted**. Blanket or permanent suppressions are not allowed.

## Security-Review Lifecycle

A per-feature review moves through: **required** (feature enters implementation) → **in progress**
(OWASP Top 10 assessed) → **completed** (no unresolved high-severity items, or all owned-accepted)
— a completed review is a precondition for marking the feature complete.
