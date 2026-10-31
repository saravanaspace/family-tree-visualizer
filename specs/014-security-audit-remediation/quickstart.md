# Quickstart & Validation: Security Audit Remediation

**Feature**: 014-security-audit-remediation | **Date**: 2026-10-31

Validates the remediation end-to-end. References [api-access](contracts/api-access-contract.md), [http-hardening](contracts/http-hardening-contract.md), [input-validation](contracts/input-validation-contract.md) and [dev-server](contracts/dev-server-contract.md) contracts and the [data model](data-model.md).

## Prerequisites

- Node.js 20, `npm ci`, a local test database (as used by the existing Vitest suite).

## 1. Automated checks

```bash
npm run check
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

- **Expected**: type check, tests and build pass; audit exits 0 or each residual advisory has an owned, expiring acceptance (013).

## 2. Containment (FR-001)

```bash
npm run start
ss -ltn | grep 5000
```

- **Expected**: listening on `127.0.0.1:5000`; with `HOST=0.0.0.0` it listens on all interfaces (intended deployments only).

## 3. Auth enumeration (FR-001, after feature 003)

- Run the route-enumeration test. **Expected**: every `/api` route returns 401 unauthenticated and 403 for a non-member.

## 4. HTTP hardening (FR-003, FR-006, FR-007)

- `curl -i http://127.0.0.1:5000/api/family-tree`: protective headers present, no `X-Powered-By`.
- Exceed the mutating-route limit: `429`.
- Force a server error: body is generic; logs contain no response body.

## 5. Input validation (FR-005, FR-008, FR-009)

- `GET /api/events?memberIds[a]=1`, `?memberIds=1abc` → `400`.
- `PATCH .../position` with `1e999` → `400`.
- `photoUrl: "javascript:alert(1)"` → `400`; over-long `biography` → `400`.
- Start with `NODE_ENV=production` and no `DATABASE_URL` → startup error; `npm run db:cleanup` in production → refused.

## 6. Dev server (FR-004)

```bash
npm run dev
curl -i -H 'Host: evil.example' 'http://127.0.0.1:5000/@fs/<project-root>/server/vite.ts'
curl -i 'http://127.0.0.1:5000/@fs/<project-root>/.git/config'
curl -i 'http://127.0.0.1:5000/@fs/etc/passwd'
```

- **Expected**: 403 for each, and the dev server keeps running after the refused requests.

## 7. Re-audit (FR-011, T016)

Re-run the `security-audit` skill; append a dated section to [audit-report.md](audit-report.md). Expect `familytree:api:no-authn` and the dev-server record to be gone or accepted.
