# Phase 0 Research: Accounts and Collaborative Family Groups

## Existing Assets

- `package.json` already includes `passport`, `passport-local`, `express-session`,
  `connect-pg-simple`, and `memorystore`, so the core session/auth infrastructure is available.
- The current app has a single implicit tree with no ownership; this must be migrated into a
  group owned by the first authenticated account.

## Decision: Session-based auth with Passport

- **Decision**: Use `express-session` with `connect-pg-simple` (Postgres-backed sessions) and
  Passport: `passport-local` for email/password and an OIDC/OAuth strategy for SSO.
- **Rationale**: Standard, well-supported, already partially present; server-rendered session
  cookies suit this web app and simplify CSRF/session revocation.
- **Alternatives considered**: stateless JWT (harder revocation, token storage concerns);
  third-party managed auth (adds external dependency; can be revisited).

## Decision: Data model for accounts, groups, roles, invitations, shares

- **Decision**: Add `users`, `family_groups`, `memberships` (role), `invitations`, and
  `public_shares` tables; scope existing family tables to a `groupId`.
- **Rationale**: Satisfies ownership, multi-admin roles, invitations, and revocable sharing.
- **Alternatives considered**: single-owner column only (cannot express roles/sharing).

## Decision: Authorization strategy

- **Decision**: Central middleware (`requireGroupAccess`, `requireRole`) enforces group scope and
  minimum role on every family-data route; queries are always filtered by the caller's group.
- **Rationale**: Prevents cross-group access and privilege escalation (FR-007, SC-002, SC-007).
- **Alternatives considered**: ad-hoc per-route checks (error-prone, inconsistent).

## Decision: Roles and the last-admin invariant

- **Decision**: Roles = owner, administrator, editor, viewer; the system prevents removing or
  demoting the last owner/administrator.
- **Rationale**: FR-006, FR-008.

## Decision: Public share excludes private data

- **Decision**: A `public_shares` token grants read-only access to a rendered view that omits
  fields/records marked private; revocation invalidates the token immediately.
- **Rationale**: FR-009, FR-010, FR-011; SC-004, SC-005.

## Decision: Identity linking and enumeration resistance

- **Decision**: Link email and SSO identities to a single account by verified email; auth
  responses never reveal whether an account exists.
- **Rationale**: FR-013, FR-015; SC-007.

## Decision: Data migration to first owner

- **Decision**: On first authenticated use, assign existing family data to a group owned by that
  account, without data loss.
- **Rationale**: FR-014.

## Open Items

- Specific SSO provider(s) and password policy finalized during tasks; email delivery provider
  for verification/invitations confirmed during tasks.
