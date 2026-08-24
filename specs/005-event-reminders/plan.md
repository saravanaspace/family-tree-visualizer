# Implementation Plan: Event Reminders

**Branch**: `005-event-reminders` | **Date**: 2026-08-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-event-reminders/spec.md`

## Summary

Generate and deliver reminders for upcoming occasions (birthdays, anniversaries, and dated
family events) based on existing member and relationship dates, honoring per-user preferences and
authorization. Adds reminder preferences and delivery tracking, a scheduled evaluation job, and a
delivery channel (email). Recipient authorization aligns with feature 003.

## Technical Context

**Language/Version**: TypeScript 5.6 (Express server; minimal client for preferences)

**Primary Dependencies**: Drizzle ORM, Zod, a scheduler (interval/cron-style job), an email
delivery provider (chosen in tasks)

**Storage**: PostgreSQL for preferences and delivery records; occasions derived from existing
member/relationship/event dates

**Testing**: Vitest for occasion computation, deduplication, authorization filtering, and
date-edge handling

**Target Platform**: Node server (scheduled job) + email delivery; browser for preferences UI

**Project Type**: Web application (`client/` + `server/` + `shared/`)

**Performance Goals**: Eligible occasions with known dates produce a reminder within the lead
time for at least 99% of cases

**Constraints**: No duplicate reminders; only authorized recipients; sensible local delivery time;
partial/unknown dates handled without misleading occasions; secrets outside source

**Scale/Scope**: Hundreds of members generating recurring annual occasions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Requirements and Traceability**: PASS — spec, plan, tasks.
- **II. Consistent Type-Safe Stack**: PASS — Drizzle tables + Zod; shared types; scheduler and
  email provider are additive server concerns.
- **III. Behavior-Driven Verification**: PASS — occasion generation, dedup, authorization, and
  date edges are unit/integration tested with deterministic time.
- **IV. Reliable Integration Boundaries**: PASS — the scheduler↔storage↔delivery boundary is
  integration-tested; delivery failures are handled and retried.
- **V. Accessible, Responsive, and Focused UX**: PASS — the preferences UI is accessible and
  responsive.

Result: No violations.

## Project Structure

### Documentation (this feature)

```text
specs/005-event-reminders/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── reminders.md
```

### Source Code (repository root)

```text
shared/
└── schema.ts                 # add reminder_preferences, reminder_deliveries

server/
├── reminders/
│   ├── occasions.ts          # NEW: derive occasions from member/relationship/event dates
│   ├── scheduler.ts          # NEW: periodic evaluation within lead time
│   └── delivery.ts           # NEW: send + record + retry
├── routes.ts                 # add preferences endpoints
├── storage.ts                # persist preferences + deliveries
└── __tests__/                # occasion + dedup + authz + date-edge tests

client/
└── src/components/reminder-preferences.tsx   # NEW: opt-in, lead time, channels
```

**Structure Decision**: A server `reminders/` module derives occasions, schedules evaluation, and
records deliveries; a small client surface manages preferences. Recipient authorization reuses
feature 003 group membership; without it, reminders target the single owner via a configured
channel.

## Complexity Tracking

> No violations; no justifications required.
