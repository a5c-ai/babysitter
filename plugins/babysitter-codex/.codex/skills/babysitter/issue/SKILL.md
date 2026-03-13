---
name: babysitter:issue
description: Start a babysitter workflow from a GitHub issue.
argument-hint: "<issue-number|url> [--repo owner/name] [--apply] [--pr <number>] [--open-pr]"
---

# babysitter:issue

Run issue-driven orchestration.

## Behavior

1. Parse issue input:
   - Numeric issue id, or full GitHub issue URL.
   - Optional `--repo owner/name`.
2. Resolve repository:
   - If `--repo` omitted, infer from current git remote.
3. Fetch issue details:
   - Use `.codex/github-workflow.js` helper.
4. Generate:
   - Concise implementation plan.
   - Proposed steps and risk notes.
5. Optional actions:
   - `--apply` -> return `mode=apply` and ready-to-run babysitter prompt.
   - `--pr <number>` -> post plan comment to existing PR.
   - `--open-pr` -> attempt `gh pr create --fill`.
6. If in apply mode:
   - Start babysitter run with issue context in prompt.

## Output Contract

- Return JSON with:
  - `issue`: metadata
  - `plan`: list of actionable steps
  - `mode`: `plan` or `apply`
  - `nextAction`: command suggestion
