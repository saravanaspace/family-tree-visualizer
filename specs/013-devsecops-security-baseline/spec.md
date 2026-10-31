# Feature Specification: DevSecOps Security Baseline

**Feature Branch**: `013-devsecops-security-baseline`

**Created**: 2026-08-24

**Status**: Draft

**Input**: Maintainer recommendation: "security is not yet built into the development process;
there is no automated vulnerability, secret, or code scanning, no secure-by-default application
configuration, and no consistent OWASP review" — embed security from the start (shift-left) by
adding automated pre-merge and pre-release security gates, secure-by-default application
configuration, and an OWASP Top 10 review that runs as part of every feature. Enacts constitution
Principle VI (Security by Design). Part of a broader code-health idea set; code quality tooling
(008), logging (011), and deployment (012) are tracked as separate features and are dependencies
of this one.

> **Audit note (2026-10-31)**: A `security-audit` skill review found this baseline not yet implemented (no `helmet`, CI, or scanning; 14 high/critical prod advisories). Findings and remediation are tracked in `specs/014-security-audit-remediation/`.

## Clarifications

### Session 2026-10-31

- Q: What is the "high-severity threshold"? → A: CVSS 7.0 or above (High and Critical) blocks; Medium and
  Low are reported only.
- Q: Who is the "owner" of a risk acceptance? → A: A named repository maintainer recorded in the
  acceptance entry (the PR author may not accept their own finding).
- Q: When do cookie requirements apply? → A: Once sessions exist (feature 003); see FR-004.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Block Merges That Introduce Known Vulnerabilities (Priority: P1)

As a maintainer, I can rely on the pre-merge pipeline to automatically detect known-vulnerable
dependencies and likely-insecure code patterns and block the change until they are resolved or
explicitly accepted, so vulnerabilities are caught before they land.

**Why this priority**: Automated dependency and code scanning is the backbone of shift-left
security; it catches the largest class of issues (OWASP A06 vulnerable components, common code
weaknesses) with the least human effort.

**Independent Test**: Introduce a dependency with a known high-severity vulnerability and a known
insecure code pattern, run the pipeline, and confirm it fails and identifies each finding; remove
them and confirm it passes.

**Acceptance Scenarios**:

1. **Given** a change that adds a dependency with a known high-severity vulnerability, **When** the
   pipeline runs, **Then** it fails and identifies the vulnerable dependency and severity.
2. **Given** code containing a flagged insecure pattern, **When** static security analysis runs,
   **Then** the specific finding and its location are reported and the pipeline fails.
3. **Given** a change with no high-severity findings, **When** the pipeline runs, **Then** the
   security checks pass.

---

### User Story 2 - Prevent Secrets From Entering the Repository (Priority: P1)

As a maintainer, I can rely on automated secret scanning that blocks credentials, keys, and tokens
from being committed or merged, so secrets never enter the repository history.

**Why this priority**: A leaked secret is an immediate, high-impact compromise that is expensive to
remediate once in history; prevention at the boundary is the highest-value control.

**Independent Test**: Attempt to commit or open a change containing a credential and confirm it is
blocked with the offending location identified; confirm a clean change is unaffected.

**Acceptance Scenarios**:

1. **Given** a change that contains a credential, key, or token, **When** it is committed or
   submitted, **Then** the change is blocked and the offending location is identified.
2. **Given** a change with no secrets, **When** it is submitted, **Then** secret scanning passes.
3. **Given** a secret is detected, **When** the author is notified, **Then** the guidance explains
   how to remove it and rotate the exposed credential.

---

### User Story 3 - Ship Secure-by-Default Application Configuration (Priority: P1)

As a user of the application, my requests and session are protected by secure defaults (protective
response headers and hardened cookies) so common client-side and misconfiguration attacks are
mitigated without per-feature effort.

**Why this priority**: Secure defaults (OWASP A05 misconfiguration) protect every endpoint at once
and prevent whole classes of attacks; they are foundational and cheap relative to their impact.

**Independent Test**: Inspect application responses and confirm the expected protective headers are
present and session cookies are marked secure and http-only; remove a header and confirm the check
detects its absence.

**Acceptance Scenarios**:

1. **Given** any application response, **When** it is returned, **Then** the expected protective
   security headers are present.
2. **Given** a session is established, **When** its cookie is issued, **Then** the cookie is marked
   secure, http-only, and same-site.
3. **Given** a required security header is missing, **When** the security check runs, **Then** the
   gap is detected and reported.

---

### User Story 4 - Scan the Deployable Artifact Before Release (Priority: P2)

As a maintainer, I can rely on the deployable artifact being scanned for known vulnerabilities
before it is released, so a vulnerable base image or bundled dependency is caught before it reaches
an environment.

**Why this priority**: Artifact scanning closes the gap between source-level checks and what is
actually shipped (OWASP A08 integrity), but it builds on the build/release artifact existing.

**Independent Test**: Produce a release artifact containing a known high-severity vulnerability, run
the scan, and confirm it fails the release and identifies the finding; confirm a clean artifact
passes.

**Acceptance Scenarios**:

1. **Given** a release artifact with a known high-severity vulnerability, **When** it is scanned,
   **Then** the release is blocked and the finding is identified.
2. **Given** a clean release artifact, **When** it is scanned, **Then** the scan passes.
3. **Given** an artifact scan runs, **When** it completes, **Then** its result is reported with any
   failing item clearly identified.

---

### User Story 5 - Review Every Feature Against the OWASP Top 10 (Priority: P2)

As a reviewer, I can rely on a consistent OWASP Top 10 security review being completed for every
feature before it is marked complete, so security is considered by design rather than after the
fact.

**Why this priority**: A lightweight, repeatable review process (enacting constitution Principle
VI) catches design-level risks (OWASP A01 access control, A04 insecure design) that automated tools
cannot, and institutionalizes shift-left thinking.

**Independent Test**: Take a feature through the workflow and confirm a completed OWASP-aligned
security review exists and that unresolved high-severity items block completion.

**Acceptance Scenarios**:

1. **Given** a feature entering implementation, **When** its artifacts are reviewed, **Then** a
   security review addressing the applicable OWASP Top 10 risks is present and completed.
2. **Given** the review surfaces a high-severity risk, **When** the feature is assessed for
   completion, **Then** the risk is resolved or explicitly accepted with rationale and an owner
   before completion.
3. **Given** a feature with no applicable high-severity risks, **When** the review is completed,
   **Then** it records that the risks were considered and not applicable.

### Edge Cases

- A scanning tool being unavailable or erroring MUST fail the gate clearly (not silently pass).
- A finding accepted as a risk MUST require a documented rationale and owner, and MUST be
  time-bounded or re-reviewed rather than permanently suppressed.
- Security gates MUST run identically on supported developer operating systems and in the automated
  environment.
- Introducing security tooling MUST NOT change the runtime behavior of the application.
- Generated, vendored, and build-output files MUST be handled so scans report real issues rather
  than noise, without excluding genuinely shipped code.
- A false positive MUST be suppressible narrowly (specific finding/location) rather than by
  disabling a whole check.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The pre-merge pipeline MUST run automated dependency (software composition) scanning
  and MUST fail when a known vulnerability at or above the high-severity threshold is present,
  unless it is explicitly accepted.
- **FR-002**: The pre-merge pipeline MUST run automated static application security analysis across
  client, server, and shared code and MUST fail on findings at or above the high-severity
  threshold.
- **FR-003**: The repository MUST have automated secret scanning that blocks credentials, keys, and
  tokens from being committed or merged and identifies the offending location.
- **FR-004**: The application MUST return protective security response headers by default. Once
  sessions exist (feature 003), session cookies MUST be marked secure, http-only, and same-site;
  until then this cookie requirement is vacuously satisfied and verified when 003 lands.
- **FR-005**: The deployable artifact MUST be scanned for known vulnerabilities before release and
  MUST fail the release on findings at or above the high-severity threshold.
- **FR-006**: Dependencies MUST be kept current through an automated update mechanism.
- **FR-007**: Every feature MUST include a completed security review against the applicable OWASP
  Top 10 risks before it is marked complete.
- **FR-008**: Any finding at or above the high-severity threshold MUST be resolved or explicitly
  accepted with a documented rationale and owner before merge or release.
- **FR-009**: Security scan results MUST be reported with any failing item and its location clearly
  identified.
- **FR-010**: Secrets MUST be supplied via environment configuration and MUST NOT appear in source,
  logs, or build artifacts.
- **FR-011**: The security gates MUST run automatically on pull requests and on pushes to `main`,
  consistent with the project's enforced pipeline.
- **FR-012**: Security tooling MUST NOT alter the runtime behavior of the application.
- **FR-013**: Documentation MUST describe how to run the security checks locally and how to triage,
  resolve, or accept findings.

### Key Entities *(include if feature involves data)*

_Not applicable: this feature introduces security tooling, gates, and process and adds no new
application data entities. It defines process artifacts (a per-feature security review and a
recorded risk-acceptance) rather than persisted domain data._

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of pull requests and pushes to `main` trigger the automated security gates.
- **SC-002**: A change introducing a known high-severity dependency vulnerability is blocked from
  merging in testing.
- **SC-003**: A change containing a credential is blocked before it lands in repository history in
  testing.
- **SC-004**: Protective security headers are present on 100% of application responses, and session
  cookies are secure, http-only, and same-site.
- **SC-005**: A release artifact containing a known high-severity vulnerability is blocked from
  release in testing.
- **SC-006**: 0 secrets are present in source, logs, or build artifacts.
- **SC-007**: 100% of features completed after this baseline have a completed OWASP-aligned security
  review recorded before completion.
- **SC-008**: Every high-severity finding is either resolved or has a documented, owned acceptance
  before merge or release, with 0 undocumented suppressions.

## Assumptions

- This feature depends on the CI pipeline from feature 008 (it adds security steps to that gate and
  reuses its pull-request + push-to-`main` enforcement model), the deployable artifact from feature
  012 (for artifact scanning and header configuration), and the logging feature 011 (for
  security-relevant event recording and no-secret-in-logs guarantees).
- Likely tools are code scanning (for example CodeQL or Semgrep), dependency scanning and automated
  updates (for example the platform's audit plus Dependabot/Renovate), secret scanning (for example
  the platform's native secret scanning plus a pre-merge scanner), artifact/container scanning (for
  example Trivy), and a security-headers middleware (for example Helmet); exact tool selection and
  thresholds are decided during planning and captured in `plan.md`.
- "High-severity threshold" is the enforced gate level for this baseline; medium and low findings
  are reported and tracked but do not block. The precise severity mapping is finalized in planning.
- Authentication and authorization implementation is delivered by feature 003 (accounts and
  collaboration); this feature provides the security baseline, secure defaults, and review process
  that 003 and all other features must satisfy, not the auth system itself.
- Explicit non-goals for this feature: implementing application authentication/authorization,
  dynamic application security testing (DAST) against a running environment, formal penetration
  testing, compliance certification, and runtime protection (WAF/IDS) are out of scope and may be
  tracked as follow-on work.
- The established TypeScript, React, Express, PostgreSQL, Drizzle, and Vitest stack is retained per
  the constitution; this feature adds security tooling and configuration around it and changes no
  application behavior.
