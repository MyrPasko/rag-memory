# rag-memory

`rag-memory` is a process-first repository for building an agent-facing memory system.

This project starts by locking the workflow before adding runtime code. The first milestone is a disciplined `local-first` MVP built through small, reviewable slices.

## Project Rules

Read these documents in order:

1. [`docs/process/WORKFLOW.md`](docs/process/WORKFLOW.md) for the end-to-end Controller, Planner, Worker lifecycle.
2. [`docs/process/ROLE-CONTRACTS.md`](docs/process/ROLE-CONTRACTS.md) for hard role boundaries and forbidden actions.
3. [`docs/process/SLICES.md`](docs/process/SLICES.md) for the ordered implementation slices, success criteria, and restrictions.
4. [`docs/process/PR-RULES.md`](docs/process/PR-RULES.md) for PR scope, template, review, and merge gates.

## `.claude` Helpers

Project-specific Claude helpers live in `.claude/`:

- `.claude/agents/` for Controller, Planner, and Worker role prompts
- `.claude/commands/` for repeatable handoff, polling, review, and merge prompts
- `.claude/skills/controller-workflow/` for the Controller operating law
- `.claude/CLAUDE.md` for the short project memory used by Claude Code

## Delivery Model

- One PR equals one slice.
- The Controller does not implement product code directly.
- Planner runs on `Claude Code Opus 4.6` via `--model claude-opus-4-6` and always uses `--permission-mode plan`.
- Worker runs on `Claude Code Sonnet 4.6` via `--model claude-sonnet-4-6`.
- The Planner plans one slice at a time.
- The Worker implements one approved slice on a fresh feature branch.
- The Controller reviews every PR using `advanced-code-reviewer` before merge.
