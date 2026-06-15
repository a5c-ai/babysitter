---
attribution: joe-habu
source: https://github.com/joe-habu/superbabysitter
license: MIT (original repo)
retrospective: docs/retrospectives/joe-habu-superbabysitter/subagent-tdd-loop.md
---

# joe-habu / superbabysitter contribution

Distilled from `joe-habu/superbabysitter@531a39c1` into two deliverables:

- **`quality-gated-development.js`** -- a single unified process that runs the full 6-phase quality-gated development workflow (design → planning → subagent-TDD loop → verification → debugging → finishing) end-to-end. Reuses the shared components below instead of the MCP-state coupling in the source repo.
- **`../../methodologies/quality-gated-six-phase.js`** -- the methodology surface: six pluggable phase tasks exported individually so other processes can compose them piecemeal.

Reusable sub-patterns lifted into `library/processes/shared/`:

- `scene-context-builder` -- position-in-plan + peers + upcoming + accumulated build manifest for subagent scene-setting.
- `n-strikes-escalation` -- run a check, invoke a fixer on failure, after N failures open a breakpoint with proper rejection branching.

Diffs vs. the source repo:

- Replaced the 3-strikes-then-assume-approved breakpoint pattern with `n-strikes-escalation`, which reads `result.approved` and feeds `result.feedback` back as additional review issues (robust rejection).
- Dropped the custom MCP state plugin coupling. The source used it for cross-session persistence; the babysitter run journal already provides that.
- Declared `labels` on every task definition (`['tdd','implementer']` etc.) so the observer dashboard can filter.
- Added `stableKey` per attempt on reviewer/fixer tasks so loop-body reordering doesn't invalidate replay identity.
- Reviewer context now carries the implementer's `concerns` and `selfReviewFindings` so the reviewer can verify the self-review claims.

See `docs/retrospectives/joe-habu-superbabysitter/subagent-tdd-loop.md` for the full retrospective.
