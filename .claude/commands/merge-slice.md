# Merge Slice

Use this command when the Controller is ready to close a clean slice.

## Required Inputs

- `<slice-id>`
- `<pr-link-or-number>`

## Prompt Template

```text
Act as the Controller closing slice <slice-id> for rag-memory.

PR: <pr-link-or-number>

Before merge, verify:
- no P0 or P1 findings remain
- slice scope still holds
- verification evidence is clear
- residual risk is minor and explicit

If the PR is clean:
1. merge the PR
2. switch local repo to main
3. pull latest changes
4. state that the next slice can be selected

If the PR is not clean, say exactly why merge must not happen.
```
