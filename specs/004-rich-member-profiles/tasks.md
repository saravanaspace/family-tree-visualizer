---
description: "Task list for Rich Member Profiles"
---

# Tasks: Rich Member Profiles

**Input**: Design documents from `/specs/004-rich-member-profiles/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/member-media.md

**Tests**: Included (constitution requires behavior-driven verification).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3

## Path Conventions

- Server in `server/`, shared schema in `shared/`, client in `client/src/`.

## Phase 1: Setup

- [ ] T001 Add metadata columns and `member_links` table (with `isPrivate`) in `shared/schema.ts`
- [ ] T002 [P] Add Zod validation for metadata fields and link URLs in `shared/schema.ts`
- [ ] T003 Generate and review the additive migration in `server/db/`

## Phase 2: Foundational (blocking)

- [ ] T004 Add image upload validation utility (type/size) in `server/media/validate.ts`
- [ ] T005 [P] Add member profile persistence helpers in `server/storage.ts`

## Phase 3: User Story 1 — Add a Photo (P1)

**Goal**: Upload/replace/remove a member photo with placeholder fallback.
**Independent test**: Add a valid photo (shows on card/profile); invalid rejected; remove reverts to placeholder.

- [ ] T006 [P] [US1] Add upload validation tests (type/size, no partial change) in `server/__tests__/media.test.ts`
- [ ] T007 [US1] Implement photo upload/delete endpoints in `server/routes.ts`
- [ ] T008 [US1] Store photo reference on the member in `server/storage.ts`
- [ ] T009 [P] [US1] Build the photo upload control in `client/src/components/member-photo-upload.tsx`
- [ ] T010 [US1] Render photo/placeholder with alt text in `client/src/components/family-member-card.tsx`

## Phase 4: User Story 2 — Extended Metadata (P1)

**Goal**: Record and edit birthday, current location, and more; blanks stay distinguishable.
**Independent test**: Save/edit metadata; malformed date rejected; blanks preserved after reload.

- [ ] T011 [P] [US2] Add metadata validation/persistence tests in `server/__tests__/profile.test.ts`
- [ ] T012 [US2] Extend member update to persist metadata in `server/storage.ts`
- [ ] T013 [US2] Add metadata fields to the edit form in `client/src/components/edit-member-modal.tsx`
- [ ] T014 [P] [US2] Build the profile display in `client/src/components/member-profile.tsx`

## Phase 5: User Story 3 — Social/Contact Links (P2)

**Goal**: Add validated links with privacy control.
**Independent test**: Add valid/invalid links; private links excluded from public views.

- [ ] T015 [P] [US3] Add link validation + privacy exclusion tests in `server/__tests__/links.test.ts`
- [ ] T016 [US3] Implement link CRUD endpoints in `server/routes.ts`
- [ ] T017 [US3] Persist links and enforce privacy in `server/storage.ts`
- [ ] T018 [P] [US3] Render safe, privacy-aware links in `client/src/components/member-profile.tsx`

## Phase 6: Polish & Cross-Cutting

- [ ] T019 [P] Ensure profile UI is responsive and accessible in `client/src/components/member-profile.tsx`
- [ ] T020 Update `README.md` with image store config notes
- [ ] T021 Run `npm test` and `npm run check`; confirm green

## Dependencies

- Setup (T001–T003) → Foundational (T004–T005) → US1 (T006–T010) → US2 (T011–T014) → US3 (T015–T018) → Polish.

## Parallel Execution Examples

- After T005: run T006, T011, T015 (separate test files) in parallel.

## Implementation Strategy

- MVP = US1 (photo) + US2 (metadata). Add US3 links with privacy afterward.
- Privacy exclusion aligns with feature 003; without it, private fields stay hidden from public views.
