# Poll Plan

Use this command every 2 minutes while waiting on Planner.

Runtime model: `Claude Code Opus 4.6` via `--model claude-opus-4-6 --permission-mode plan`

Host shell example:

```bash
claude \
  --model claude-opus-4-6 \
  --permission-mode plan \
  --agent planner \
  -p \
  "Controller poll for Planner status. Report COMPLETE, NEEDS_CLARIFICATION, or IN_PROGRESS. If complete, return the full final slice plan."
```

## Prompt Template

```text
Controller poll for Planner status.

Report one of:
- COMPLETE: final slice plan is ready
- NEEDS_CLARIFICATION: specific missing decision or conflict
- IN_PROGRESS: what remains to finish the plan

If complete, return the full final slice plan.
If clarification is needed, ask only what materially blocks a decision-complete plan.
```
