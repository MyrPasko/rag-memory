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
  "Plan exactly one slice for rag-memory.

Slice:
- ID: SXX
- Title: <title>

Goal:
- <goal>

In scope:
- <in-scope items>

Out of scope:
- <out-of-scope items>

Success criteria:
- <success-criteria items>

Restrictions:
- <restriction items>

Current context:
- <current-context>

Required output:
1. Goal
2. In scope
3. Out of scope
4. Exact files or artifact groups to create or change
5. Implementation steps
6. Verification plan
7. Risks
8. Explicit anti-drift notes"
```

## Required Inputs

- `<slice-id>`
- `<slice-title>`
- `<goal>`
- `<in-scope>`
- `<out-of-scope>`
- `<success-criteria>`
- `<restrictions>`
- `<current-context>`

## Prompt Template

```text
You are the Planner for rag-memory running on Claude Code Opus 4.6 in plan mode.

Plan exactly one slice for rag-memory.

Slice:
- ID: <slice-id>
- Title: <slice-title>

Goal:
- <goal>

In scope:
- <in-scope>

Out of scope:
- <out-of-scope>

Success criteria:
- <success-criteria>

Restrictions:
- <restrictions>

Current context:
- <current-context>

Return:
1. Slice ID and title
2. Goal
3. In scope
4. Out of scope
5. Exact files or artifact groups to create or change
6. Implementation steps
7. Success criteria
8. Restrictions
9. Verification plan
10. Risks and assumptions
11. Explicit anti-drift notes

Do not implement. Do not widen scope. Do not hide future work inside this slice.
```
