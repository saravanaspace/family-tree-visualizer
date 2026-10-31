# Research: Demo Mode with Dummy Data

All technical unknowns resolved; no `NEEDS CLARIFICATION` remain.

## 1. How to select the storage backend

- **Decision**: A dedicated entry point (`server/demo.ts`) sets an internal flag and dynamically imports the normal server entry. `storage.ts` picks the backend from that flag at module load.
- **Rationale**: Satisfies "dedicated command only" (FR-001) and keeps `npm run dev` untouched (FR-002). Dynamic import guarantees the flag is set before `storage.ts` evaluates, avoiding ES module hoisting issues.
- **Alternatives considered**: Public `STORAGE=memory` env var (rejected: spec requires no other activation path); constructor injection in `registerRoutes` (rejected: larger diff, touches all route code); dependency-injection container (rejected: over-engineering).

## 2. Making the production guard meaningful

- **Decision**: `npm run dev:demo` does not set `NODE_ENV`. `demo.ts` refuses when `NODE_ENV === "production"`, otherwise defaults it to `development` so Vite dev middleware is used.
- **Rationale**: If the script forced `NODE_ENV=development` (as `npm run dev` does) the guard could never fire.
- **Alternatives considered**: Guard in `storage.ts` (rejected: late, and also affects test environments).

## 3. Loopback-only reset

- **Decision**: Compare `req.socket.remoteAddress` against `127.0.0.1`, `::1`, and `::ffff:127.0.0.1`; respond 404 otherwise. Do not read `X-Forwarded-For`. Route is registered only in demo mode.
- **Rationale**: The server listens on `0.0.0.0`; the socket address cannot be spoofed by headers. 404 hides the endpoint's existence.
- **Alternatives considered**: Shared secret token (rejected: needs configuration for a dev-only tool); no protection (rejected by Q1).

## 4. Parity with Postgres behavior

- **Decision**: Mirror observed behavior in `server/storage.ts` and `shared/schema.ts`: not-found error strings, unique index on `(from_member_id, to_member_id, type)`, foreign keys on relationships, no foreign key on event `member_ids`, cascade delete of relationships and events on member delete.
- **Rationale**: UI bugs must reproduce identically in demo and staging.
- **Finding**: The database does not validate event `member_ids`, so spec FR-014 was corrected to match.
- **Alternatives considered**: Stricter validation in demo only (rejected: hides staging failures).

## 5. Shared contract tests

- **Decision**: `storage.contract.ts` exports `runStorageContract(name, factory)`; both storages invoke it. The Postgres leg is skipped when `TEST_DATABASE_URL` is unset; the memory leg always runs.
- **Rationale**: One set of assertions proves parity (FR-013). Existing Postgres tests migrate into the contract rather than being duplicated.
- **Alternatives considered**: Separate duplicated test files (rejected: drift risk).

## 6. Sample dataset shape

- **Decision**: About 8 members across 3 generations modeled on the existing seed (Johnson family), including one deceased member, optional fields on some members only, spouse and parent-child relationships, and at least 5 events across birth/marriage/graduation/other types. Built by a function that returns fresh objects each call.
- **Rationale**: Familiar data, guaranteed readable layout via fixed x/y, and fresh copies make reset trivial.
- **Alternatives considered**: Importing `seed.ts` (rejected: it writes to Postgres and has no exports); JSON fixture file (rejected: dates would need parsing).
