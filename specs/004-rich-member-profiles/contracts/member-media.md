# Member Media & Profile Contract: Rich Member Profiles

Base path `/api`. Where feature 003 is active, these routes require group authorization; private
fields are excluded from public views. Standard error shape applies.

## Photo

| Method | Path | Purpose | Success | Errors |
|--------|------|---------|---------|--------|
| POST | `/api/family-members/:id/photo` | Upload/replace photo (validated type/size) | 200 `{ photoUrl }` | 400, 404, 413 |
| DELETE | `/api/family-members/:id/photo` | Remove photo (revert to placeholder) | 204 | 404 |

- Invalid type/oversized files return `400 validation_error` / `413 payload_too_large` with no
  change to existing data.

## Metadata

| Method | Path | Purpose | Success | Errors |
|--------|------|---------|---------|--------|
| PATCH | `/api/family-members/:id` | Update metadata fields (extended) | 200 | 400, 404 |

- Structured fields (e.g., birthday) validated; malformed values return `400 validation_error`.

## Links

| Method | Path | Purpose | Success | Errors |
|--------|------|---------|---------|--------|
| GET | `/api/family-members/:id/links` | List links (respecting privacy) | 200 | 404 |
| POST | `/api/family-members/:id/links` | Add a validated link | 201 | 400, 404 |
| PATCH | `/api/links/:linkId` | Update a link | 200 | 400, 404 |
| DELETE | `/api/links/:linkId` | Remove a link | 204 | 404 |

- Malformed URLs return `400 validation_error`; private links are excluded from public renders.
