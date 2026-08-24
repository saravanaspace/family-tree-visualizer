---
description: "Task list for Event Reminders"
---

# Tasks: Event Reminders

**Input**: Design documents from `/specs/005-event-reminders/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/reminders.md

**Tests**: Included, with deterministic-clock date tests (constitution requires verification).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3

## Path Conventions

- Server in `server/` (with `server/reminders/`), shared schema in `shared/`, client in `client/src/`.

## Phase 1: Setup

- [ ] T001 Add `reminder_preferences` and `reminder_deliveries` tables in `shared/schema.ts`
- [ ] T002 [P] Add Zod validation for preferences (leadDays, kinds, channel, timezone) in `shared/schema.ts`
- [ ] T003 Generate and review the additive migration in `server/db/`

## Phase 2: Foundational (blocking)

- [ ] T004 Implement occasion derivation from member/relationship/event dates in `server/reminders/occasions.ts`
- [ ] T005 [P] Add an injectable clock abstraction for deterministic tests in `server/reminders/clock.ts`
- [ ] T006 Implement delivery record + dedup persistence in `server/storage.ts`

## Phase 3: User Story 1 — Birthday Reminders (P1)

**Goal**: Generate one birthday reminder within the lead time.
**Independent test**: With a fixed clock, an upcoming birthday yields exactly one reminder; none outside the window; unknown date yields none.

- [ ] T007 [P] [US1] Add birthday occasion + dedup tests with a fixed clock in `server/__tests__/reminders.test.ts`
- [ ] T008 [US1] Compute birthday occasions and enqueue deduplicated deliveries in `server/reminders/scheduler.ts`
- [ ] T009 [US1] Implement delivery send + status recording in `server/reminders/delivery.ts`

## Phase 4: User Story 2 — Anniversaries and Events (P2)

**Goal**: Reminders for anniversaries and dated events.
**Independent test**: Anniversary/event within lead time yields a reminder; undated yields none.

- [ ] T010 [P] [US2] Add anniversary/event occasion tests in `server/__tests__/reminders.test.ts`
- [ ] T011 [US2] Extend occasion derivation for relationship and event dates in `server/reminders/occasions.ts`

## Phase 5: User Story 3 — Reminder Preferences (P2)

**Goal**: User controls kinds, lead time, opt-in, channel.
**Independent test**: Set preferences; only matching reminders produced; opt-out sends none.

- [ ] T012 [P] [US3] Add preferences + authorization filtering tests in `server/__tests__/reminders.test.ts`
- [ ] T013 [US3] Implement preferences GET/PUT routes in `server/routes.ts`
- [ ] T014 [US3] Persist preferences and apply them in scheduling in `server/storage.ts` and `server/reminders/scheduler.ts`
- [ ] T015 [P] [US3] Build the preferences UI in `client/src/components/reminder-preferences.tsx`

## Phase 6: Polish & Cross-Cutting

- [ ] T016 [P] Add authorization checks so reminders target only permitted recipients in `server/reminders/delivery.ts`
- [ ] T017 Update `README.md` with email provider/env and scheduler notes
- [ ] T018 Run `npm test` and `npm run check`; confirm green

## Dependencies

- Setup (T001–T003) → Foundational (T004–T006) → US1 (T007–T009) → US2 (T010–T011) → US3 (T012–T015) → Polish.

## Parallel Execution Examples

- After T006: run T007, T010, T012 (same file: sequence) — otherwise parallelize by separate helper modules.

## Implementation Strategy

- MVP = US1 (birthday reminders, deduplicated). Add US2 event/anniversary and US3 preferences incrementally.
- Recipient authorization aligns with feature 003; without it, target the single owner via a configured channel.
