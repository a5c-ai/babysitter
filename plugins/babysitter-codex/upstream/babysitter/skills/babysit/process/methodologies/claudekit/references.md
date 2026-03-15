# ClaudeKit References and Attribution

## Primary Source

- **Repository**: [https://github.com/carlrannaberg/claudekit](https://github.com/carlrannaberg/claudekit)
- **Author**: Carl Rannaberg
- **Description**: A toolkit of custom commands, hooks, and utilities for Claude Code -- a coding safety net with real-time error prevention, checkpoint management, and specialized AI subagent orchestration

## Concepts Adapted

The following ClaudeKit concepts have been adapted into babysitter process definitions:

### Hook System (mapped to safety pipeline)
- **PreToolUse file-guard**: 195+ patterns, 12 categories -> `claudekit-safety-pipeline.js` initFileGuardTask
- **PostToolUse checks**: typecheck, lint, test, comment-replacement, unused-params -> `claudekit-safety-pipeline.js` quality check tasks
- **UserPromptSubmit**: codebase-map, thinking-level -> `claudekit-orchestrator.js` init tasks
- **Stop hooks**: checkpoint, typecheck-project, lint-project, test-project, self-review -> `claudekit-safety-pipeline.js` and `claudekit-orchestrator.js`

### Slash Commands (mapped to process dispatch)
- `/checkpoint:create`, `/checkpoint:restore` -> `claudekit-orchestrator.js` checkpoint tasks
- `/code-review [target]` -> `claudekit-code-review.js` (6 parallel agents)
- `/validate-and-fix` -> `claudekit-safety-pipeline.js`
- `/research [query]` -> `claudekit-research.js` (5-10 parallel agents)
- `/spec:create [feature]` -> `claudekit-spec-workflow.js` (create mode)
- `/spec:execute [file]` -> `claudekit-spec-workflow.js` (execute mode)
- `/hook:disable`, `/hook:enable`, `/hook:status` -> `claudekit-orchestrator.js` hook config

### Subagents (mapped to agent definitions)
- **code-review-expert** (6-agent parallel) -> `agents/code-review-coordinator/`
- **Security focus** -> `agents/security-analyst/`
- **Performance focus** -> `agents/performance-analyst/`
- **Testing focus** -> `agents/testing-specialist/`
- **Architecture focus** -> `agents/architecture-reviewer/`
- **research-expert** (5-10 parallel) -> `agents/research-coordinator/`
- **Spec design** -> `agents/spec-architect/`
- **triage-expert** (diagnosis and routing) -> `agents/triage-specialist/`

### Spec Execution Workflow (mapped to 6 phases)
1. Implementation phase -> `claudekit-spec-workflow.js` implementPhaseTask
2. Test writing phase -> `claudekit-spec-workflow.js` testPhaseTask
3. Code review phase -> `claudekit-spec-workflow.js` reviewPhaseTask
4. Iterative improvement phase -> `claudekit-spec-workflow.js` improvePhaseTask
5. Commit phase -> `claudekit-spec-workflow.js` commitPhaseTask
6. Progress tracking phase -> `claudekit-spec-workflow.js` trackProgressTask

### Key Patterns (mapped to skills)
- **Context engineering**: codebase-map, thinking-level -> `skills/codebase-mapping/`, `skills/hook-management/`
- **Security (file-guard)**: 195+ patterns, bash pipeline analysis -> `skills/file-guard/`
- **Hook profiling**: execution time, output size, color-coded alerts -> `skills/hook-management/`
- **Session isolation**: session-scoped changes -> `skills/hook-management/`
- **Checkpoint management**: git-backed state -> `skills/checkpoint-management/`
- **Code review orchestration**: 6-agent parallel -> `skills/code-review-orchestration/`
- **Research orchestration**: 5-10 parallel agents -> `skills/research-orchestration/`
- **Spec lifecycle**: create + 6-phase execute -> `skills/spec-creation/`, `skills/spec-execution/`

## Acknowledgment

This adaptation brings ClaudeKit's coding safety net patterns -- hook-driven error prevention, multi-agent code review, specification workflows, and parallel research -- into the babysitter process framework. All credit for the original concepts, terminology, and design philosophy belongs to Carl Rannaberg and the ClaudeKit project contributors.
