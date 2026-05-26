# Phase 0 Checklist: Planning, Docs, And Context

Phase 0 was docs and planning only. It did not approve app development.
The repo has since moved into Phase 1; this checklist records whether Phase 0
planning outcomes were completed and whether its non-actions were upheld during
that phase.

## Required Outcomes

- [x] Architecture docs complete.
- [x] ADR complete.
- [x] Safety boundaries complete.
- [x] Decision log started.
- [x] Website implementation plan superseded by architecture docs.
- [x] Dirty worktree / clean branch rule recorded.
- [x] Local config rule recorded.
- [x] All phase checklists created.
- [x] Root `AGENTS.md` created or updated.
- [x] README points to the new architecture docs.

## Historical Phase 0 Non-actions

These were Phase 0 constraints, not current Phase 1 status. Later approved
Phase 1 work added the Next.js scaffold and Supabase migration planning.

- [x] No app development during Phase 0.
- [x] No Next.js scaffold during Phase 0.
- [x] No Supabase migrations during Phase 0.
- [x] No workflow JSON changes during Phase 0.
- [x] No live n8n actions during Phase 0.
- [x] No Docker actions during Phase 0.
- [x] No workflow import/export during Phase 0.
- [x] No workflow activation/execution during Phase 0.
- [x] No credential actions during Phase 0.
- [x] No deployment or production actions during Phase 0.

## Validation

Run:

```powershell
git diff --check
git status --short
```

Do not run live or heavy commands just to look busy. Run n8n validation only if
workflow JSON, n8n scripts, or n8n validation contracts changed.
