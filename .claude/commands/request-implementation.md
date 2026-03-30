# Request Implementation

Use this command when the Controller dispatches an approved slice to Worker.

Runtime model: `Claude Code Sonnet 4.6` via `--model claude-sonnet-4-6`

Host shell example:

```bash
claude \
  --model claude-sonnet-4-6 \
  --agent worker \
  -p \
  "Implement exactly this approved slice plan:
<approved-slice-plan>

Mandatory rules:
- Create and switch to branch feature/sXX-short-slice-name before editing.
- Follow the approved slice plan exactly.
- Do not widen scope.
- Open the PR with:
  Goal:
  Results:
  What is the impact:"
```

## Required Inputs

- `<approved-slice-plan>`
- `<branch-name>`
- `<verification-commands>`

## Prompt Template

```text
You are the Worker for rag-memory running on Claude Code Sonnet 4.6.

Implement exactly this approved slice plan:
<approved-slice-plan>

Mandatory rules:
- Create and switch to branch <branch-name> before editing.
- Follow the approved slice plan exactly.
- Do not widen scope.
- Run these verification steps if applicable: <verification-commands>
- Open the PR with this exact body structure:
  Goal:
  Results:
  What is the impact:

Return:
1. Branch name
2. Files changed
3. Verification run
4. Residual risks or blockers
5. PR result
```
