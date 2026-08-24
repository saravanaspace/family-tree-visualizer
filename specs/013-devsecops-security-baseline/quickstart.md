# Quickstart & Validation: DevSecOps Security Baseline

**Feature**: 013-devsecops-security-baseline | **Date**: 2026-08-24

This guide validates the security baseline end-to-end. It references
[contracts/ci-security-contract.md](contracts/ci-security-contract.md),
[contracts/security-headers-contract.md](contracts/security-headers-contract.md), and
[contracts/security-review-contract.md](contracts/security-review-contract.md).

## Prerequisites

- Node.js 20 and npm installed; dependencies installed (`npm ci`).
- Feature 008 CI pipeline present (this feature extends it); feature 012 image available for the
  artifact-scan check.

## 1. Dependency (SCA) gate (FR-001, FR-006)

```powershell
npm audit --audit-level=high
```

- **Expected (clean)**: exits 0.
- **Validate failure path**: add a dependency with a known high-severity advisory, re-run; expect a
  non-zero exit identifying the vulnerable package and severity. Confirm Dependabot is configured to
  open update PRs.

## 2. Static analysis (SAST) gate (FR-002)

- Open a pull request; the CodeQL workflow runs and reports code-scanning results.
- **Expected**: no high-severity alerts on a clean change.
- **Validate failure path**: introduce a flagged insecure pattern; expect a high-severity alert and
  a failing check identifying the location.

## 3. Secret scanning (FR-003)

- Attempt to commit a change containing a fake credential.
- **Expected**: push protection and/or the Gitleaks CI step blocks it and identifies the location.
- **Validate clean path**: a change with no secrets passes.

## 4. Secure-by-default headers & cookies (FR-004)

```powershell
curl http://localhost:5000/api/family-tree -i
```

- **Expected**: protective headers (`X-Content-Type-Options`, frame protection, `Referrer-Policy`,
  CSP; HSTS in production) are present.
- **Validate cookies**: when a session cookie is issued (feature 003), confirm it is
  `Secure`/`HttpOnly`/`SameSite`.
- **Validate detection**: remove a header and confirm the security-headers test fails.

## 5. Artifact/container scan before release (FR-005)

```powershell
# Against feature 012's image
trivy image familytree:local --severity HIGH,CRITICAL --exit-code 1
```

- **Expected (clean)**: exits 0.
- **Validate failure path**: scan an image with a known high-severity vulnerability; expect a
  non-zero exit that blocks release and identifies the finding.

## 6. Per-feature OWASP review gate (FR-007, FR-008)

- Generate a `security.md` review for a feature from the review template (via `/speckit-checklist`).
- **Expected**: the OWASP Top 10 risks are each considered; a feature with an unresolved
  high-severity item cannot be marked complete until it is resolved or owned-accepted with rationale
  and expiry.

## 7. Automated tests

```powershell
npm test
```

- **Expected**: the security-headers test (headers present + cookie flags) passes.

## Success signals

- SC-001: 100% of PRs/pushes trigger the security gates.
- SC-002/SC-003/SC-005: high-severity dependency vulns, committed secrets, and vulnerable release
  artifacts are each blocked in testing.
- SC-004: protective headers present on all responses; session cookies hardened.
- SC-006: 0 secrets in source, logs, or artifacts.
- SC-007/SC-008: every completed feature has a recorded OWASP review; every high-severity finding is
  resolved or owned-accepted with 0 undocumented suppressions.
