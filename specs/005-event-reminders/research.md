# Phase 0 Research: Event Reminders

## Occasion Sources

- Birthdays from `family_members.birthDate`; anniversaries from `relationships.startDate`
  (e.g., spouse); dated family events from `family_events.date`. These already exist in the data.

## Decision: Derive occasions, do not duplicate dates

- **Decision**: Compute upcoming occasions on the fly from existing dates rather than storing a
  separate occasion table; store only preferences and delivery records.
- **Rationale**: Avoids data duplication and drift; occasions always reflect current data.
- **Alternatives considered**: precomputed occasion rows (stale when members change).

## Decision: Scheduled evaluation with deterministic time in tests

- **Decision**: A periodic job evaluates occasions within each user's lead time and enqueues
  deliveries; tests inject a fixed clock for determinism.
- **Rationale**: FR-001..FR-003; verification requires deterministic date logic.
- **Alternatives considered**: on-request evaluation only (misses proactive reminders).

## Decision: Deduplication

- **Decision**: A delivery record keyed by (recipient, occasion, occurrence year) prevents
  duplicate reminders for the same occasion.
- **Rationale**: FR-006; SC-002.
- **Alternatives considered**: no ledger (risks repeats on job re-runs).

## Decision: Authorization-aware delivery

- **Decision**: Only send to recipients authorized to view the related person/event (feature 003
  membership); without accounts, target the single owner.
- **Rationale**: FR-005; SC-003.

## Decision: Partial/boundary dates and local time

- **Decision**: Skip occasions with unknown required date parts; resolve Feb 29 and
  month/year boundaries sensibly; deliver at a sensible local time.
- **Rationale**: FR-007, FR-008; edge cases.

## Decision: Delivery failure handling

- **Decision**: Failed deliveries are retried or reported without losing pending reminders.
- **Rationale**: FR-009.

## Open Items

- Email provider, exact lead-time defaults, and channel options confirmed in tasks.
