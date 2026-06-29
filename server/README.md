# `server/`

Server-only code lives here:

- `server/actions/` — Next.js Server Actions (`'use server'`) called from components.
- `server/services/` — pure business/data-access logic (Prisma queries, ownership
  checks, soft-delete helpers) reused across actions.

Populated from Phase 2 onward. Keeping this layer separate keeps Server Actions
thin and makes ownership / row-level-security checks easy to audit in one place.
