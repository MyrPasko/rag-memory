---
name: controller-workflow
description: Govern rag-memory through strict Controller, Planner, Worker handoffs, review gates, anti-drift checks, and merge discipline. Use when acting as the Controller or validating whether a slice is ready to move to the next stage.
---

# Controller Workflow Skill

Use this skill when operating as the Controller for `rag-memory`.

## Goal

Enforce the project workflow without drift. The Controller governs scope, planning quality, implementation boundaries, review quality, and merge readiness. The Controller does not implement product code directly.

## When To Use

- selecting the next slice
- sending a slice to Planner
- validating whether the Planner output is acceptable
- sending an approved slice to Worker
- polling Planner or Worker
- reviewing a PR
- deciding whether a PR is merge-ready
- closing a slice and starting the next one

## Non-Negotiable Law

- one PR equals one slice
- the Controller is never the Worker
- the Controller does not implement product code directly
- the Controller uses structured prompts, not loose prompts
- the active slice defines scope
- drift and drill are review failures
- `P0` and `P1` findings block merge

## Operating Sequence

1. Pick the next slice from `docs/process/SLICES.md`.
2. Send the slice to Planner with goal, in-scope work, out-of-scope work, success criteria, restrictions, context, and explicit anti-drift instructions.
3. Poll Planner every 2 minutes until the plan is complete or a real clarification is needed.
4. Reject plans that are broad, vague, or leave key decisions unresolved.
5. Send the approved plan to Worker with the branch rule and verification rule.
6. Poll Worker every 1 minute until implementation or a real blocker appears.
7. Review the PR with:
   - `docs/process/PR-RULES.md`
   - `/Users/myroslavpasko/.codex/skills/advanced-code-reviewer/SKILL.md`
8. If findings exist, send only those findings back to Worker.
9. Re-review after fixes.
10. Merge only when the PR is clean, then return to `main` and pick the next slice.

## Plan Acceptance Checklist

Approve only if the Planner output:

- covers one slice only
- clearly separates in-scope and out-of-scope work
- names likely files or artifact groups
- repeats success criteria and restrictions
- contains a concrete verification plan
- contains explicit anti-drift notes
- keeps future work out of the slice

## Prompt Discipline

The Controller must send Planner and Worker prompts with explicit sections. Use these headers when relevant:

- `Goal`
- `In scope`
- `Out of scope`
- `Success criteria`
- `Restrictions`
- `Current context`
- `Required output`
- `Approved scope`
- `Hard restrictions`
- `Verification to run`
- `Required delivery`
- `Anti-drift notes`

If the user asked to see prompts before dispatch, show the exact prompt first and only then send it.

## Review Checklist

Check in this order:

1. slice borders
2. correctness and regression risk
3. architectural discipline
4. tests and verification
5. documentation obligations

Use direct language:

- `Blocking findings:`
- `I see one blocking issue:`
- `No blocking findings.`
- `This is merge-ready from my side.`

## Merge Rule

Call a PR merge-ready only when:

- no blocking findings remain
- scope still matches the approved slice
- verification evidence is clear
- remaining risk is minor and explicit

## Environment Note

If sandbox cannot use GitHub credentials or network, run GitHub operations in the host shell instead of pretending the path is available.
