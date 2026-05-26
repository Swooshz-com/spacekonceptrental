# Supabase Migrations

This directory is reserved for future reviewed Supabase migration files.

Phase 1F-A adds the migration directory and static validation harness only. No
live Supabase project is connected by this PR, and this directory intentionally
contains no real migration SQL yet.

## Requirements For Future Migrations

- Use timestamped filenames:
  `YYYYMMDDHHMMSS_short_description.sql`.
- Keep migrations ordered by timestamp and review them in small PRs.
- Do not include secrets, credentials, tokens, private keys, webhook URLs, or
  `.env` references.
- Do not include service-role keys or browser-visible secret variables.
- Add matching validation/tests before merging real SQL.
- Do not add RLS policies without RLS and tenant-isolation tests.
- Use fake/sample seed data only when seed work is separately approved.

See `docs/SUPABASE-MIGRATION-CONVENTIONS.md` for the full convention.
