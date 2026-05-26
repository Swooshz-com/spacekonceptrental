# Supabase Migrations

This directory contains reviewed Supabase migration files.

Phase 1F-A added the migration directory and static validation harness. Phase
1F-B adds the first base schema migration. No live Supabase project is
connected by these PRs, and migrations must not be applied from review without
separate approval for a named target and action.

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
