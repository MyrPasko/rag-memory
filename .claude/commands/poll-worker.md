# Poll Worker

Use this command every 1 minute while waiting on Worker.

Runtime model: `Claude Code Sonnet 4.6` via `--model claude-sonnet-4-6`

Host shell example:

```bash
claude \
  --model claude-sonnet-4-6 \
  --agent worker \
  -p \
  "Controller poll for Worker status. Report COMPLETE, BLOCKED, or IN_PROGRESS. If complete, return branch, changed files, verification, residual risks, and PR result."
```

## Prompt Template

```text
Controller poll for Worker status.

Report one of:
- COMPLETE: implementation and PR are ready
- BLOCKED: concrete blocker with exact cause
- IN_PROGRESS: what remains

If complete, return:
1. Branch name
2. Files changed
3. Verification run
4. Residual risks
5. PR link or PR creation result
```
