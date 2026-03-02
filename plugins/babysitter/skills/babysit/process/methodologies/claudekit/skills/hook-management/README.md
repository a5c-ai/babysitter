# Hook Management Skill

Session-scoped hook lifecycle management with profiling and alerts.

## Hook Types

- PreToolUse (file-guard)
- PostToolUse (typecheck, lint, test, comment-check, unused-params)
- UserPromptSubmit (codebase-map, thinking-level)
- Stop (checkpoint, typecheck, lint, test, self-review)

## Commands

`/hook:enable`, `/hook:disable`, `/hook:status`

## Used By

- `claudekit-orchestrator` (setup)
- `claudekit-safety-pipeline` (profiling)
