# Per-Feature Security Review Contract

**Feature**: 013-devsecops-security-baseline | **Date**: 2026-08-24

This contract defines the OWASP Top 10 review process that every feature must complete, enacting
constitution Principle VI. It reuses the existing `/speckit-checklist` mechanism.

## Artifact

- A per-feature security review, produced from `.specify/templates/security-review-template.md`,
  stored as `specs/<feature>/checklists/security.md`.

## Scope (OWASP Top 10 2021)

The review MUST consider each risk and record applicability + notes:

- A01 Broken Access Control · A02 Cryptographic Failures · A03 Injection · A04 Insecure Design ·
  A05 Security Misconfiguration · A06 Vulnerable & Outdated Components · A07 Identification &
  Authentication Failures · A08 Software & Data Integrity Failures · A09 Security Logging &
  Monitoring Failures · A10 Server-Side Request Forgery.

## Completion Gate

- A feature MAY be marked complete only when its security review is completed and has **no
  unresolved high-severity items** (each such item is either resolved or has an owned, time-bounded
  acceptance).
- If no high-severity risks apply, the review records that the risks were considered and found not
  applicable.

## Ownership

- The review is a reviewer-owned artifact; `[x]` means the reviewer confirmed the risk is addressed
  or not applicable — not that implementation is merely present.

## Relationship to Automated Gates

- The review complements (does not replace) the automated CI security gates: tools cover
  components/secrets/known patterns; the review covers design-level access-control and
  business-logic risks tools cannot detect.
