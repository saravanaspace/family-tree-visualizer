# Quickstart & Validation Guide: Accounts and Collaborative Family Groups

## Prerequisites

- PostgreSQL configured; `DATABASE_URL` set; session secret and SSO provider credentials provided
  via environment variables (never committed).
- Dependencies installed.

## Setup

```powershell
npm run db:generate   # generate migration for new tables + groupId scope
npm run db:migrate    # apply migration (includes data migration to first owner)
npm run dev
```

## Automated checks

```powershell
npm run check
npm test              # auth, authorization, invitation, share, and security tests
```

Security-focused coverage to expect:
- Access control: 100% of family-data actions allowed only for the correct role and group.
- No account enumeration: login/registration responses do not reveal account existence.
- Last-admin invariant: cannot remove/demote the final owner/administrator.
- Public share: excludes private data; revocation removes access immediately.
- Identity linking: email + SSO resolve to a single account without duplicate family data.

## Manual validation

1. Register, log out, log back in with email and with SSO; confirm single account and private data.
2. Create a group, invite a second account, assign administrator; confirm both can manage.
3. As a viewer, confirm edits are blocked.
4. Publish a public link; open it signed-out; confirm read-only and no private data; revoke and
   confirm access is gone.

## Expected outcome

- All acceptance scenarios in [spec.md](spec.md) pass; security tests show no unauthorized access
  or enumeration.
