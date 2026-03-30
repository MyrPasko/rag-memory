# Review PR

Use this command when the Controller reviews a Worker PR.

## Required Inputs

- `<slice-id>`
- `<approved-scope>`
- `<pr-link-or-number>`
- `<verification-evidence>`

## Prompt Template

```text
Act as the Controller reviewing a PR for rag-memory.

Slice: <slice-id>
Approved scope: <approved-scope>
PR: <pr-link-or-number>
Verification evidence: <verification-evidence>

Review using:
- .claude/skills/controller-workflow/SKILL.md
- /Users/myroslavpasko/.codex/skills/advanced-code-reviewer/SKILL.md

Review order:
1. Slice borders
2. Correctness and regressions
3. Architecture and maintainability
4. Tests and verification
5. Documentation required by the slice

Return findings first.
If there are blocking issues, classify them by severity.
If there are no blocking findings, say so directly and state whether the PR is merge-ready.
```
