# Quickstart & Validation Guide: Event Reminders

## Prerequisites

- PostgreSQL configured; app running.
- Email provider credentials supplied via environment variables (never committed).

## Setup

```powershell
npm run db:generate
npm run db:migrate    # adds reminder_preferences + reminder_deliveries
npm run dev
```

## Automated checks

```powershell
npm run check
npm test              # occasion computation, dedup, authorization, and date-edge tests
```

Coverage to expect (with an injected fixed clock):
- Birthdays/anniversaries/events within the lead time generate exactly one reminder per occurrence.
- Occasions outside the lead time or without a date generate none.
- Only authorized recipients receive reminders.
- Feb 29 and month/year boundaries resolve sensibly; delivery targets a sensible local time.
- Delivery failures retry without dropping pending reminders.

## Manual validation

1. Set preferences (opt-in, lead time, kinds); confirm they persist.
2. With a fixed test clock, confirm an upcoming birthday produces one reminder and no duplicates.
3. Confirm a member with an unknown birthday produces no birthday reminder.

## Expected outcome

- All acceptance scenarios in [spec.md](spec.md) pass; no duplicates and no unauthorized delivery.
