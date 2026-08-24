# Reminders API Contract: Event Reminders

Base path `/api`. Preference routes require an authenticated user (feature 003) or, without
accounts, the single owner context. Standard error shape applies. Delivery itself is performed by
a scheduled job, not a request.

## Preferences

| Method | Path | Purpose | Success | Errors |
|--------|------|---------|---------|--------|
| GET | `/api/reminders/preferences` | Get current user's preferences | 200 | 401 |
| PUT | `/api/reminders/preferences` | Set opt-in, lead time, kinds, channel, timezone | 200 | 400, 401 |

- Invalid lead time, unknown kind, or invalid timezone returns `400 validation_error`.

## Upcoming (read-only convenience)

| Method | Path | Purpose | Success | Errors |
|--------|------|---------|---------|--------|
| GET | `/api/reminders/upcoming?withinDays=` | List authorized upcoming occasions | 200 | 401 |

- Only occasions the caller is authorized to see are returned; undated occasions are omitted.

## Delivery (internal, scheduled)

- A periodic job evaluates occasions within each user's lead time, creates `reminder_deliveries`
  rows (deduplicated by `occasionKey`), sends via the configured channel, and records status.
- Failed sends increment `attempts` and are retried; pending items are never lost.
