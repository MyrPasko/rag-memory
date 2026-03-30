# Workflow

This document is the authoritative implementation workflow for this repository.

## Non-Negotiable Rules

- Build the project only through narrow, mergeable slices.
- One PR equals one slice. No exceptions.
- The Controller does not implement product code directly.
- The Planner plans one slice at a time.
- The Worker implements one approved slice at a time on a fresh feature branch.
- The Controller does not tolerate drift, drill, opportunistic cleanup, or “while I was here” edits.
- The Controller reviews every PR with the `advanced-code-reviewer` standard before merge.
- A slice is not complete until the PR is merged and `main` is updated locally.

## Roles

- Controller: scope owner, plan gate, review gate, merge authority.
- Planner: produces or revises the plan for exactly one slice.
- Worker: implements exactly one approved slice, verifies it, and opens the PR.

Detailed behavioral contracts live in [`ROLE-CONTRACTS.md`](ROLE-CONTRACTS.md).

## Model Assignments

These role-to-model bindings are mandatory:

- Controller: external governance role, not bound to a Claude model inside this repo
- Planner: `Claude Code Opus 4.6` using `--model claude-opus-4-6 --permission-mode plan`
- Worker: `Claude Code Sonnet 4.6` using `--model claude-sonnet-4-6`

Do not swap Planner and Worker models casually. If this mapping changes, update the workflow docs, role contracts, and command templates in the same slice.
Do not run Planner outside plan mode.

## Host Shell Snippets

Use these snippets when running Claude Code from the host shell.

### Start Planner

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

### Poll Planner

```bash
claude \
  --model claude-opus-4-6 \
  --permission-mode plan \
  --agent planner \
  -p \
  "Controller poll for Planner status. Report COMPLETE, NEEDS_CLARIFICATION, or IN_PROGRESS. If complete, return the full final slice plan."
```

### Start Worker

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

### Poll Worker

```bash
claude \
  --model claude-sonnet-4-6 \
  --agent worker \
  -p \
  "Controller poll for Worker status. Report COMPLETE, BLOCKED, or IN_PROGRESS. If complete, return branch, changed files, verification, residual risks, and PR result."
```

## Slice Naming

Use ordered slice IDs:

- `S01` Workflow Governance And Role Contracts
- `S02` Project Bootstrap And Runtime Skeleton
- `S03` Knowledge Schema And Artifact Contracts
- `S04` Local Indexer And Deterministic Retrieval Core
- `S05` MCP Read Path
- `S06` Session Write Path And Eval Harness
- `S07` Cloud Seam Preparation

Use `SXX` in plans, branches, PR titles, and review notes.

## Branch Naming

The Worker creates a fresh feature branch before implementation:

- `feature/s01-workflow-governance`
- `feature/s02-project-bootstrap`
- `feature/s03-knowledge-schema`

Pattern: `feature/sXX-short-slice-name`

## End-To-End Cycle

### 1. Controller selects the next slice

- Choose the next unmerged slice from [`SLICES.md`](SLICES.md).
- Restate the slice goal, success criteria, and restrictions.
- Do not combine adjacent slices.

### 2. Controller requests the plan from Planner

- Send one slice only.
- Include the slice ID, title, goal, success criteria, restrictions, known files, and open constraints.
- Require a concrete implementation plan, not a brainstorming memo.
- Run Planner with `claude --model claude-opus-4-6 --permission-mode plan --agent planner ...`

### 3. Controller polls Planner every 2 minutes

- Poll until the Planner returns a complete plan or a clarification request.
- If the plan is weak, ambiguous, broad, or leaves important decisions open, send a clarification request and keep the slice closed.
- Poll using the same Planner model binding: `claude --model claude-opus-4-6 --permission-mode plan --agent planner ...`

### 4. Controller approves or rejects the plan

A plan is acceptable only if it:

- stays inside one slice
- lists intended files or artifact groups
- includes verification steps
- repeats success criteria and restrictions
- does not hide future work inside this slice

### 5. Controller requests implementation from Worker

- Send the approved plan as the Worker contract.
- Explicitly forbid drift.
- Require the Worker to create a fresh feature branch before editing.
- Run Worker with `claude --model claude-sonnet-4-6 --agent worker ...`

### 6. Controller polls Worker every 1 minute

- Poll until the Worker reports implementation complete or blocked.
- If scope drifts, stop the run and send the Worker back to the approved slice boundary.
- Poll using the same Worker model binding: `claude --model claude-sonnet-4-6 --agent worker ...`

### 7. Worker creates the PR

The Worker must open a PR with this exact body structure:

```markdown
Goal:
Results:
What is the impact:
```

PR scope and review rules live in [`PR-RULES.md`](PR-RULES.md).

### 8. Controller reviews the PR

- Review the PR against approved slice borders first.
- Then review correctness, regression risk, architecture, tests, and verification.
- Use the `advanced-code-reviewer` standard.
- Leave direct comments when changes are required.

### 9. Controller loops review comments back to Worker

- If comments exist, send the Worker only the review findings and the current PR context.
- The Worker fixes only those findings unless the Controller explicitly expands the scope.
- The Controller re-reviews after the Worker responds.

### 10. Controller merges and resets to `main`

Merge only when:

- no blocking findings remain
- slice scope still holds
- verification evidence is clear
- remaining risk is explicitly minor

After merge:

- switch to `main`
- pull latest changes
- select the next slice
- repeat the cycle

## Review Gate

The Controller follows the `advanced-code-reviewer` severity model:

- `P0`: critical correctness, security, or data-loss issue
- `P1`: likely bug or regression
- `P2`: material design or maintainability issue
- `P3`: minor follow-up or polish

`P0` and `P1` always block merge.

## Execution Environment Notes

- Local file and git work can run in sandbox if the environment allows it.
- GitHub operations must run in a host shell or outside sandbox when sandbox cannot access keychain, `gh` auth, or GitHub network.
- The Controller must verify `gh auth status` before relying on PR creation, review, merge, or CI inspection.
