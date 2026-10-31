# HTTP Hardening Contract

**Feature**: 014-security-audit-remediation | **Date**: 2026-10-31 | **Covers**: FR-003, FR-006, FR-007

Header definitions are owned by feature 013's [security headers contract](../../013-devsecops-security-baseline/contracts/security-headers-contract.md); this contract adds the audit-driven requirements.

## Requirements

- Responses MUST include `helmet` protective headers per 013; `X-Powered-By` MUST NOT be sent.
- `/api` MUST be rate limited; mutating routes (POST/PATCH/DELETE) use a stricter limit. Exceeded limit → `429`.
- Server errors (5xx) MUST return a generic body (e.g. `{"message":"Internal Server Error"}`) with no stack or `err.message`; details go to server logs only. The handler MUST NOT re-throw after responding.
- 4xx errors keep their client-actionable messages (validation errors).
- Request logs MUST NOT include response bodies or PII; log method, path, status, duration.

## Verification

Supertest: header presence, `x-powered-by` absent, 429 after limit, 500 body generic, log output contains no body (T010).
