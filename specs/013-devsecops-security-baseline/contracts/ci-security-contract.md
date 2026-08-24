# CI Security Gate Contract

**Feature**: 013-devsecops-security-baseline | **Date**: 2026-08-24

This contract defines the automated security-gate interface layered onto feature 008's pipeline.
It is technology-agnostic about specific tools; the plan selects CodeQL, `npm audit`, Gitleaks, and
Trivy to satisfy it.

## Triggers

- Runs on **pull requests** and on **pushes to `main`**, consistent with feature 008's model.
- Artifact/container scanning runs at **release** against feature 012's built image.

## Gate Steps (required checks)

| Step | Class | Fails the gate when |
|------|-------|---------------------|
| Dependency scan | SCA | A known vulnerability at or above the high-severity threshold is present and not accepted |
| Static analysis | SAST | A code-scanning finding at or above high severity is present |
| Secret scan | Secret | A credential, key, or token is detected in the change |
| Artifact scan | Image/FS | The release artifact has a vulnerability at or above high severity |

## Pass / Fail Semantics

- The overall gate **fails** if any step reports a blocking finding; the failing step and the
  finding location MUST be clearly identified.
- A scanning tool that errors or cannot run MUST **fail** the gate (never silently pass).
- Medium/low findings are reported but do not block.

## Severity Threshold

- **Blocking**: Critical and High.
- **Non-blocking (tracked)**: Medium and Low.

## Suppression / Risk-Acceptance Policy

- A finding may be accepted only with a documented rationale, a named owner, and an expiry/
  re-review date.
- Suppressions MUST be **narrow** (specific finding/location/advisory), never a whole-check disable.

## Enforcement

- The gate steps are configured as **required status checks** via branch protection on `main`, so a
  change that fails any security check cannot be merged.

## Dependencies

- Extends feature 008's `ci.yml` and branch protection.
- Artifact scan depends on feature 012's deployable image.
