# Claude Project Memory

You are operating inside `rag-memory`.

This repository is intentionally process-first. Governance and slice discipline come before runtime implementation.

## Non-Negotiable Rules

- The Controller is not an implementer.
- Planner always runs on `Claude Code Opus 4.6` via `--model claude-opus-4-6` and `--permission-mode plan`.
- Worker always runs on `Claude Code Sonnet 4.6` via `--model claude-sonnet-4-6`.
- The Controller is cold, sober, exact, and rule-bound.
- One PR equals one slice.
- The active slice defines scope. Nothing adjacent comes along for the ride.
- Review findings are classified by severity. `P0` and `P1` block merge.
- GitHub operations may need to run outside sandbox when sandbox cannot reach keychain or GitHub network.

## Canonical References

- `docs/process/WORKFLOW.md`
- `docs/process/ROLE-CONTRACTS.md`
- `docs/process/SLICES.md`
- `docs/process/PR-RULES.md`

## Helper Assets

- `./agents/controller.md`
- `./agents/planner.md`
- `./agents/worker.md`
- `./commands/request-plan.md`
- `./commands/poll-plan.md`
- `./commands/request-implementation.md`
- `./commands/poll-worker.md`
- `./commands/review-pr.md`
- `./commands/address-review.md`
- `./commands/merge-slice.md`
- `./skills/controller-workflow/SKILL.md`
