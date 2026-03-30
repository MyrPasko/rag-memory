# Address Review

Use this command when the Controller sends review findings back to Worker.

Runtime model: `Claude Code Sonnet 4.6` via `--model claude-sonnet-4-6`

## Required Inputs

- `<pr-link-or-number>`
- `<review-findings>`

## Prompt Template

```text
You are the Worker for rag-memory running on Claude Code Sonnet 4.6.

Address only these Controller review findings for PR <pr-link-or-number>:
<review-findings>

Rules:
- Do not widen scope.
- Fix only the findings unless the Controller explicitly reopens the slice.
- Re-run only the verification needed for the changed paths.
- Update the PR and return:
  1. Files changed
  2. Findings addressed
  3. Verification run
  4. Residual risk
```
