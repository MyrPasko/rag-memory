# PR Rules

This file defines the PR contract for every slice.

## Core Rule

One PR equals one slice.

If a change spans multiple slices, split it before review.

## Title Format

Use:

```text
[SXX] Short slice title
```

Examples:

- `[S01] Workflow governance and role contracts`
- `[S03] Knowledge schema and artifact contracts`

## Branch Format

Use:

```text
feature/sXX-short-slice-name
```

## Required PR Body

Every PR must contain exactly these top-level sections:

```markdown
Goal:
Results:
What is the impact:
```

Do not replace them with a different structure.

## Scope Rules

- the PR must implement one approved slice only
- no unrelated cleanup
- no hidden refactor
- no “while I was here” edits
- no naming churn without direct slice need

## Drill And Drift

This repository treats both as review failures.

- `drift`: work outside approved slice borders
- `drill`: noisy, tangential churn that increases review surface without helping the slice

The Controller checks for the absence of both.

## Verification Rules

- list only commands or checks that actually ran
- state failures honestly
- if a check could not be run, say so directly
- verification must match the slice risk

## Review Standard

The Controller reviews with the `advanced-code-reviewer` standard.

Severity model:

- `P0` critical correctness, security, or data-loss issue
- `P1` likely bug or regression
- `P2` material maintainability or design issue
- `P3` minor follow-up or polish

`P0` and `P1` block merge.

## Merge-Ready Checklist

A PR is merge-ready only when:

- approved slice scope still holds
- no blocking findings remain
- verification evidence is clear
- documentation is updated when required by the slice
- residual risk is minor and explicit

## Review Loop

If the Controller leaves comments:

- the Worker fixes only the review findings
- the Worker does not expand scope
- the Controller re-reviews the updated PR
- merge happens only after the clean re-review
