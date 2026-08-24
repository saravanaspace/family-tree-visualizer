# Phase 1 Data Model: Event Reminders

Occasions are derived, not stored. Only preferences and delivery records are persisted (new
Drizzle tables). Migration is additive.

## Derived: Reminder occasion (not persisted)

- `kind`: birthday | anniversary | event.
- `sourceId`: member/relationship/event id.
- `date`: the upcoming occurrence date (resolved for the current/next year).
- `subjectMemberIds`: people the occasion concerns (for authorization).

## New: `reminder_preferences`

- `id`, `userId` (FK), `enabled` (boolean), `leadDays` (int), `eventKinds` (array of kinds),
  `channel` (e.g., email), `timezone`, `createdAt`, `updatedAt`.

## New: `reminder_deliveries`

- `id`, `userId` (FK), `occasionKey` (stable string: kind+sourceId+year), `scheduledFor`,
  `status` (pending | sent | failed), `attempts`, `lastError`, `createdAt`, `updatedAt`.
- Unique (`userId`, `occasionKey`) prevents duplicate reminders per occurrence.

## Invariants

- No two deliveries share the same (`userId`, `occasionKey`).
- Only occasions the user is authorized to see generate deliveries for that user.
- Occasions with unknown required date parts generate no delivery.
- Pending deliveries are never dropped on failure; they are retried or reported.

## Validation

- Zod validates preference inputs (leadDays bounds, known kinds, valid channel, valid timezone).
