# Request Plan

Use this command when the Controller sends one slice to Planner.

Runtime model: `Claude Code Opus 4.6` via `--model claude-opus-4-6 --permission-mode plan`

Host shell example:

```bash
claude \
  --model claude-opus-4-6 \
  --permission-mode plan \
  --agent planner \
  -p \
  "Plan exactly one slice:
- Slice: SXX <title>
- Goal: <goal>
- Success criteria: <success-criteria>
- Restrictions: <restrictions>
- Current context: <current-context>"
```

## Required Inputs

- `<slice-id>`
- `<slice-title>`
- `<goal>`
- `<success-criteria>`
- `<restrictions>`
- `<current-context>`

## Prompt Template

```text
You are the Planner for rag-memory running on Claude Code Opus 4.6 in plan mode.

Plan exactly one slice:
- Slice: <slice-id> <slice-title>
- Goal: <goal>
- Success criteria: <success-criteria>
- Restrictions: <restrictions>
- Current context: <current-context>

Return:
1. Slice ID and title
2. Goal
3. In scope
4. Out of scope
5. Files or artifact groups to create or change
6. Implementation steps
7. Success criteria
8. Restrictions
9. Verification plan
10. Risks and assumptions

Do not implement. Do not widen scope. Do not hide future work inside this slice.
```
