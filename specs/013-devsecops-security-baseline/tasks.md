---
description: "Task list for DevSecOps Security Baseline"
---

# Tasks: DevSecOps Security Baseline

**Input**: Design documents from `/specs/013-devsecops-security-baseline/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ci-security-contract.md, contracts/security-headers-contract.md, contracts/security-review-contract.md

**Tests**: Included (a Vitest integration test asserting protective response headers and hardened cookie flags), per constitution Principle III and spec SC-004. Scanning gates are verification infrastructure validated by running the pipeline (see Polish).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3, US4, US5

## Path Conventions

- CI under `.github/workflows/`; repo-root config (`.github/dependabot.yml`, `.gitleaks.toml`); server code under `server/`; review template under `.specify/templates/`; docs in `README.md`.

## Dependencies on other features

- CI edits target feature 008's `.github/workflows/ci.yml` (create the step there; if 008 has not landed, this feature establishes the workflow).
- Artifact scanning (US4) depends on feature 012's deployable image.
- The cookie policy (US3) is consumed by feature 003's session configuration.

## Phase 1: Setup

- [ ] T001 Add `helmet` (runtime) to `package.json` and add `audit` / secret-scan helper scripts
- [ ] T002 [P] Add `supertest` and `@types/supertest` (dev) to `package.json` for the security-headers integration test (skip if already present from features 009/010/011/012)

## Phase 2: Foundational (blocking)

- [ ] T003 Document the shared security-gate policy — the high-severity blocking threshold and the narrow, owned, time-bounded risk-acceptance/suppression rules — in `README.md` (referenced by all scanning gates)

**Checkpoint**: Gate threshold and acceptance policy defined — scanning stories can build on it.

## Phase 3: User Story 1 — Block Merges That Introduce Known Vulnerabilities (P1)

**Goal**: The pre-merge pipeline fails on known high-severity dependency vulnerabilities and static-analysis findings, identifying each.
**Independent test**: Add a high-severity vulnerable dependency and a flagged insecure pattern; the pipeline fails and names each; remove them and it passes.

- [ ] T004 [US1] Add `npm audit --audit-level=high` as a required SCA step in `.github/workflows/ci.yml`
- [ ] T005 [P] [US1] Create a CodeQL SAST workflow for JavaScript/TypeScript triggered on `pull_request` and `push` to `main` in `.github/workflows/codeql.yml`
- [ ] T006 [P] [US1] Create Dependabot config for the `npm` and `github-actions` ecosystems in `.github/dependabot.yml`
- [ ] T007 [US1] Document running dependency/code scanning locally and triaging findings in `README.md`

**Checkpoint**: Vulnerable dependencies and insecure code patterns are blocked before merge.

## Phase 4: User Story 2 — Prevent Secrets From Entering the Repository (P1)

**Goal**: Credentials, keys, and tokens are blocked from being committed or merged, with the location identified.
**Independent test**: Submit a change containing a fake credential; it is blocked and located; a clean change passes.

- [ ] T008 [US2] Add a required Gitleaks secret-scan step to `.github/workflows/ci.yml`
- [ ] T009 [P] [US2] Create a Gitleaks ruleset with a narrow allowlist in `.gitleaks.toml`
- [ ] T010 [US2] Document enabling GitHub secret scanning + push protection and secret removal/rotation guidance in `README.md`

**Checkpoint**: Secrets are blocked at commit/PR time.

## Phase 5: User Story 3 — Ship Secure-by-Default Application Configuration (P1)

**Goal**: Every response carries protective security headers and session cookies are hardened by default.
**Independent test**: Inspect a response for the required headers and confirm cookie flags are secure/http-only/same-site; remove a header and the test fails.

- [ ] T011 [US3] Create the shared secure cookie policy (`secure` in production, `httpOnly`, `sameSite: lax`) in `server/lib/cookie-policy.ts`
- [ ] T012 [US3] Create the `helmet`-based security-headers middleware (protective headers; SPA-aware Content-Security-Policy in report-only mode) in `server/middleware/security-headers.ts`
- [ ] T013 [US3] Mount the security-headers middleware early in `server/index.ts`
- [ ] T014 [P] [US3] Add integration test asserting protective headers are present and cookie flags are hardened in `server/__tests__/security-headers.test.ts`

**Checkpoint**: The application is secure-by-default at the HTTP layer.

## Phase 6: User Story 4 — Scan the Deployable Artifact Before Release (P2)

**Goal**: The release artifact is scanned for known vulnerabilities and a high-severity finding blocks release.
**Independent test**: Scan an image with a known high-severity vulnerability (blocks) and a clean image (passes).

- [ ] T015 [US4] Add a Trivy scan of feature 012's image (fail on `HIGH,CRITICAL`) as a release step in `.github/workflows/ci.yml`
- [ ] T016 [US4] Document the artifact-scan release gate and severity threshold in `README.md`

**Checkpoint**: Vulnerable artifacts are blocked before release.

## Phase 7: User Story 5 — Review Every Feature Against the OWASP Top 10 (P2)

**Goal**: Each feature completes an OWASP Top 10 review before it is marked complete.
**Independent test**: A feature with an unresolved high-severity review item cannot be marked complete until resolved or owned-accepted.

- [ ] T017 [US5] Create the OWASP Top 10 per-feature security-review template in `.specify/templates/security-review-template.md`
- [ ] T018 [US5] Document the per-feature security-review completion gate (no unresolved high-severity items; owned acceptances) in `README.md`, referencing constitution Principle VI

**Checkpoint**: Security-by-design review is institutionalized per feature.

## Phase 8: Polish & Cross-Cutting

- [ ] T019 Configure the new security checks (CodeQL, `npm audit`, Gitleaks; artifact scan at release) as required status checks via branch protection on `main` (documented; extends feature 008)
- [ ] T020 Run `npm run check` and `npm test`; confirm the security-headers test passes and the report-only CSP does not break the client
- [ ] T021 [P] Validate `quickstart.md` end-to-end (SCA, SAST, secret, headers/cookies, artifact scan, OWASP review)

## Dependencies

- Setup (T001–T002) → Foundational (T003) → US1 (T004–T007) → US2 (T008–T010) → US3 (T011–T014) → US4 (T015–T016) → US5 (T017–T018) → Polish (T019–T021).
- `T004`, `T008`, and `T015` all edit `.github/workflows/ci.yml` — run sequentially (US1 → US2 → US4).
- `T013` (US3) depends on the cookie policy (T011) and the middleware (T012).
- `T015` (US4) depends on feature 012's image existing; `T019` depends on feature 008's branch protection.

## Parallel Execution Examples

- Setup T002 runs alongside T001.
- Within US1: `codeql.yml` (T005) and `dependabot.yml` (T006) are separate files and run in parallel with the `ci.yml` audit step (T004).
- US2's `.gitleaks.toml` (T009) runs in parallel with the CI step (T008).
- US3's test (T014) can be written in parallel with the middleware implementation.

## Implementation Strategy

- MVP = US1 + US2 + US3 (the P1 core): a merge-blocking vulnerability + secret gate and secure-by-default HTTP configuration — the minimum shift-left baseline.
- Then US4 (artifact scanning) and US5 (OWASP review process). Each phase is an independently testable increment; the only runtime change is added protective headers, and CSP ships report-only first to avoid breaking the client.
