# GSD References

Reference documents providing domain-specific guidance for GSD processes.
Referenced by skills like `verification-suite`, `context-engineering`, and
`model-profile-resolution`.

## Reference Index

| Reference | Description | Referenced By |
|-----------|-------------|---------------|
| `checkpoints.md` | Checkpoint patterns for long-running processes: when to save, restore, and resume | `execute-phase.js`, `iterative-convergence.js` |
| `continuation-format.md` | Format specification for context continuation across session boundaries | All processes via `context-engineering` skill |
| `decimal-phase-calculation.md` | Algorithm for calculating decimal phase progress (e.g., 2.7 = phase 2, 70% complete) | `progress.js` via `gsd-tools` skill |
| `git-integration.md` | Git workflow patterns: atomic commits, branch strategy, commit message format | `execute-phase.js`, `quick.js` via `git-integration` skill |
| `git-planning-commit.md` | Conventions for committing planning artifacts (.planning/ directory) | `plan-phase.js`, `research-phase.js` |
| `model-profile-resolution.md` | Algorithm for selecting agent model profiles based on task complexity and cost | All agent tasks via `model-profile-resolution` skill |
| `model-profiles.md` | Available model profiles with capabilities, costs, and recommended use cases | `model-profile-resolution` skill |
| `phase-argument-parsing.md` | Conventions for parsing phase identifiers from user input (e.g., "2", "2.1", "auth") | `plan-phase.js`, `execute-phase.js`, `research-phase.js` |
| `planning-config.md` | Planning configuration options: max iterations, revision limits, plan structure | `plan-phase.js`, `quick.js` |
| `questioning.md` | Questioning methodology: systematic elicitation patterns for vision capture and discussion | `new-project.js`, `discuss-phase.js` |
| `tdd.md` | Test-driven development integration: when and how to apply TDD within GSD phases | `add-tests.js`, `execute-phase.js` |
| `ui-brand.md` | UI/UX branding guidelines and GSD status line formatting conventions | `progress.js` via `gsd-tools` skill |
| `verification-patterns.md` | Structured verification rubrics, quality scoring algorithms, and convergence criteria | `verify-work.js`, `iterative-convergence.js` via `verification-suite` skill |

## Implementation Status

Reference documents are currently defined declaratively as an index. The content
for each reference is resolved by the orchestrator and agent context at runtime.

Future: full reference content files will be added here for offline access and
deterministic agent context injection.
