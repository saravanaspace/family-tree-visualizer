# Data Model: Security Audit Remediation

**Feature**: 014-security-audit-remediation | **Date**: 2026-10-31

## Overview

No persistent entities are added and no migration is needed. The feature constrains existing fields in `shared/schema.ts` and defines audit/process artifacts.

## Constrained Existing Fields

| Entity.Field | Current | Required (FR) |
|--------------|---------|---------------|
| `family_members.photoUrl` | any string | `http`/`https` URL only (FR-008) |
| `family_members.biography`, `notes` | unbounded text | maximum length (FR-008) |
| `events.description` | unbounded text | maximum length (FR-008) |
| `events.memberIds` | unbounded, unchecked | max count, each references an existing member (FR-008) |
| position `x`, `y` (PATCH) | any JSON number (incl. `Infinity` via `1e999`) | finite, range-bounded (FR-005) |
| `GET /api/events?memberIds` | `parseInt` per item | bounded positive integers, 400 otherwise (FR-005) |

## Process Artifacts (non-data)

| Artifact | Purpose | Key attributes |
|----------|---------|----------------|
| Audit Finding | Verified result of a security audit | fingerprint, verdict (confirmed/needs_validation/rejected), severity (confirmed only), root cause, trace, remediation |
| Hardening Note | Non-finding improvement | description, linked SEC id, linked requirement |
| Risk Acceptance | Decision to accept a residual item | finding reference, rationale, named owner, expiry (013) |
| Audit Run | One recorded audit | date, method/tool (`security-audit` skill), profile, scope, coverage, run directory |

## Finding Fingerprints

| Fingerprint | Verdict | Severity |
|-------------|---------|----------|
| `familytree:api:no-authn` | confirmed | medium |
| `familytree:dev-server:fs-deny-overridden-project-files-readable` | confirmed | low |
| `familytree:deps:advisory-reachability-unestablished` | rejected | n/a |

## State Transitions

Finding: `open` → `fixed` (with regression test) or `accepted` (owner, rationale, expiry). A re-run of the audit (T016) re-evaluates each.
