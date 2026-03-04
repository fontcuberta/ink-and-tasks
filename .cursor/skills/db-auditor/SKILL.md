---
name: db-auditor
description: Audits Supabase database schema, Row Level Security policies, storage bucket policies, migration quality, and frontend query patterns. Use when writing migrations, adding tables, changing RLS policies, before deployment, or when the user asks to review the database layer.
---

# Database Auditor — Ink & Tasks

Reviews the Supabase backend for security gaps, schema issues, and query anti-patterns. Outputs prioritised findings.

## How to run an audit

1. Read all files in `supabase/migrations/` (chronological order)
2. Read `src/supabase.js` and every file that imports from it (grep for `from './supabase'` or `from '../supabase'`)
3. Read any composable that makes Supabase calls (grep for `supabase.from(`, `supabase.storage`, `supabase.auth`)
4. Evaluate against every checklist item below
5. Output a **Findings report** using the template at the end

---

## App context

- Backend: Supabase (PostgreSQL 15+, Auth, Storage)
- Tables: `todos`, `projects`, `project_images`, `calendar_events`, `consent_forms`
- Storage buckets: `reference-images`, `signatures`
- Auth: anonymous sign-in, email/password, RLS on all tables
- Frontend: Vue 3 + `@supabase/supabase-js` client

---

## Audit domains

### 1. Schema design

- [ ] Every table has a `uuid` primary key with `default gen_random_uuid()`
- [ ] `user_id uuid references auth.users` exists on every user-scoped table
- [ ] `created_at timestamptz not null default now()` on every table
- [ ] Foreign keys have `on delete cascade` or explicit handling (e.g., `project_images.project_id` cascades when project is deleted)
- [ ] `NOT NULL` constraints on fields that must always have a value (e.g., `client_name`, `status`)
- [ ] `CHECK` constraints on enum-like fields (e.g., `status in ('inbox', 'deposit', 'drawing', 'ready', 'done')`)
- [ ] Indexes exist on: `user_id` (every table), `status` (projects), `project_id` (images, events, consent), `start_time` (events)
- [ ] No `text` columns where a more constrained type fits (e.g., `date` for DOB, `timestamptz` for times)
- [ ] `position integer` on `projects` for Kanban card ordering, with a default

### 2. Row Level Security

- [ ] `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on every table
- [ ] Four policies per table: SELECT, INSERT, UPDATE, DELETE
- [ ] All policies use `auth.uid() = user_id` in the `USING` or `WITH CHECK` clause
- [ ] INSERT policies use `WITH CHECK (auth.uid() = user_id)` (not `USING`)
- [ ] No policy uses `true` or `public` access (unless intentionally public)
- [ ] Verify no table was forgotten (compare migration files against known table list)
- [ ] Test scenario: anonymous user A cannot read user B's projects

### 3. Storage policies

- [ ] Both buckets (`reference-images`, `signatures`) have RLS enabled
- [ ] Upload policy: only authenticated users can upload to their own folder (`auth.uid()::text` prefix)
- [ ] Download policy: users can only read their own files (or files linked to their projects)
- [ ] File size limit configured (recommended: 5MB for images, 1MB for signatures)
- [ ] MIME type restriction: images only (`image/jpeg`, `image/png`, `image/webp`)
- [ ] No public bucket access unless explicitly intended

### 4. Migration quality

- [ ] Migrations are numbered sequentially and named descriptively
- [ ] Each migration does one logical thing (not mixing schema + data + policies)
- [ ] `CREATE TABLE` uses `IF NOT EXISTS` where safe
- [ ] No `DROP TABLE` or `DROP COLUMN` without explicit user intent
- [ ] `ALTER TABLE` migrations are backwards-compatible (add columns as nullable or with defaults)
- [ ] Index creation uses `CREATE INDEX CONCURRENTLY` where possible
- [ ] No hardcoded user IDs or test data in migrations

### 5. Query patterns (frontend)

- [ ] Every `.from().select()` has error handling (check `error` return)
- [ ] User-visible feedback on every error (toast or inline message)
- [ ] No `.select('*')` when only specific columns are needed (bandwidth)
- [ ] `.order()` is explicit on list queries (not relying on default DB order)
- [ ] `.eq('user_id', ...)` is NOT added manually (RLS handles it; adding it is redundant but not harmful)
- [ ] Insert operations include `user_id: currentUser.id`
- [ ] Image uploads use Supabase Storage client, not raw fetch
- [ ] File paths include user ID as prefix for storage bucket organization
- [ ] No sensitive data logged to console (passwords, tokens)
- [ ] Batch operations use transactions where atomicity matters

---

## Findings report template

```
## Database Audit — Ink & Tasks
Date: [date]
Migration files reviewed: [list]
Frontend files reviewed: [list]

### Summary
[1-2 sentence overview]

### Findings

Critical — [count] (security holes, data loss risk, missing RLS)
Suggestion — [count] (missing indexes, suboptimal queries, schema improvements)
Nice to have — [count] (naming conventions, minor optimizations)

---

#### [Finding title]
Severity: Critical / Suggestion / Nice to have
Domain: Schema / RLS / Storage / Migration / Query
Table/File: [table name or file path]
Observed: [what's wrong]
Risk: [what could happen]
Suggested fix: [SQL or JS code]

---

### What's solid
- [positive finding]
- [positive finding]
```
