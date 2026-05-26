# Phase 0 Checklist: Planning, Docs, And Context

Phase 0 is docs and planning only. It does not approve app development.

## Required Outcomes

- [ ] Architecture docs complete.
- [ ] ADR complete.
- [ ] Safety boundaries complete.
- [ ] Decision log started.
- [ ] Website implementation plan amended.
- [ ] Dirty worktree / clean branch rule recorded.
- [ ] Local config rule recorded.
- [ ] All phase checklists created.
- [ ] Root `AGENTS.md` created or updated.
- [ ] README points to the new architecture docs if useful.

## Explicit Non-actions

- [ ] No app development yet.
- [ ] No Next.js scaffold yet.
- [ ] No Supabase migrations yet.
- [ ] No workflow JSON changes.
- [ ] No live n8n actions.
- [ ] No Docker actions.
- [ ] No workflow import/export.
- [ ] No workflow activation/execution.
- [ ] No credential actions.
- [ ] No deployment or production actions.

## Validation

Run:

```powershell
git diff --check
git status --short
```

Do not run live or heavy commands just to look busy. Run n8n validation only if
workflow JSON, n8n scripts, or n8n validation contracts changed.
