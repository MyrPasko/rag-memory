# Request Implementation

Use this command when the Controller dispatches an approved slice to Worker.

Runtime model: `Claude Code Sonnet 4.6` via `--model claude-sonnet-4-6`

Host shell example:

```bash
claude \
  --model claude-sonnet-4-6 \
  --agent worker \
  -p \
  "Implement exactly one approved slice for rag-memory.

Slice:
- ID: SXX
- Title: <title>

Goal:
- <goal>

Approved scope:
- <approved-scope>

Hard restrictions:
- <restrictions>
- Do not widen scope.
- No future-slice work.
- No speculative cleanup.

Required branch:
- feature/sXX-short-slice-name

Verification to run:
- <verification-commands>

Required delivery:
1. Branch name
2. Files changed
3. Verification actually run
4. Residual risks
5. PR result"
```

## Required Inputs

- `<slice-id>`
- `<slice-title>`
- `<goal>`
- `<approved-slice-plan>`
- `<branch-name>`
- `<restrictions>`
- `<verification-commands>`

## Prompt Template

```text
You are the Worker for rag-memory running on Claude Code Sonnet 4.6.

Implement exactly one approved slice for rag-memory.

Slice:
- ID: <slice-id>
- Title: <slice-title>

Goal:
- <goal>

Approved scope:
- <approved-slice-plan>

Hard restrictions:
- <restrictions>
- Create and switch to branch <branch-name> before editing.
- Follow the approved slice plan exactly.
- Do not widen scope.
- Do not perform future-slice work.
- Do not add speculative cleanup or abstractions.

Verification to run:
- Run these verification steps if applicable: <verification-commands>

Required delivery:
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
