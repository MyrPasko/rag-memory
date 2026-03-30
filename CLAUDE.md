# rag-memory Controller Rails

This repository uses a strict three-role workflow:

- Controller decides scope, validates plans, reviews PRs, merges, and starts the next slice.
- Planner plans one slice at a time on `Claude Code Opus 4.6` via `--model claude-opus-4-6` and always runs in `plan mode` via `--permission-mode plan`.
- Worker implements one approved slice at a time on `Claude Code Sonnet 4.6` via `--model claude-sonnet-4-6`.

Mandatory rules:

- The Controller does not implement product code directly.
- One PR equals one slice.
- No silent scope drift, cleanup spillover, or opportunistic refactors.
- The Controller uses `.claude/skills/controller-workflow/SKILL.md` and the `advanced-code-reviewer` standard at review time.

Canonical process docs:

- `docs/process/WORKFLOW.md`
- `docs/process/ROLE-CONTRACTS.md`
- `docs/process/SLICES.md`
- `docs/process/PR-RULES.md`

Claude-specific helper assets live in `.claude/`.
