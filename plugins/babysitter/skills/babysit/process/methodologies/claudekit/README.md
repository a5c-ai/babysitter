# ClaudeKit Methodology

A coding safety net with real-time error prevention, checkpoint management, and specialized AI subagent orchestration. Adapted from [ClaudeKit](https://github.com/carlrannaberg/claudekit) by Carl Rannaberg.

## Core Principles

1. **Event-Driven Safety**: Hook system provides real-time error prevention across PreToolUse, PostToolUse, UserPromptSubmit, and Stop events
2. **File Guard Protection**: 195+ patterns across 12 categories block sensitive file access with bash pipeline analysis
3. **6-Agent Parallel Review**: Architecture, security, performance, testing, quality, and documentation reviewed concurrently
4. **Spec-Driven Development**: Full specification lifecycle from codebase research to 6-phase iterative execution
5. **Parallel Research**: 5-10 concurrent research agents for up to 90% faster results
6. **Checkpoint Management**: Git-backed state management for safe rollback
7. **Session Isolation**: All hook changes are session-scoped
8. **Context Engineering**: Codebase mapping and thinking-level enhancement for improved reasoning

## Process Files

| File | Process ID | Description |
|------|-----------|-------------|
| `claudekit-orchestrator.js` | `methodologies/claudekit/claudekit-orchestrator` | Main entry: setup hooks, file-guard, codebase-map, dispatch commands, safety checks, checkpoints |
| `claudekit-code-review.js` | `methodologies/claudekit/claudekit-code-review` | 6-agent parallel code review with weighted scoring and recommendations |
| `claudekit-spec-workflow.js` | `methodologies/claudekit/claudekit-spec-workflow` | Spec creation from research + 6-phase execution (implement, test, review, improve, commit, track) |
| `claudekit-research.js` | `methodologies/claudekit/claudekit-research` | Parallel research orchestration with 5-10 concurrent agents |
| `claudekit-safety-pipeline.js` | `methodologies/claudekit/claudekit-safety-pipeline` | Hook system: file-guard, typecheck/lint/test checks, checkpoints, profiling |

## Agents (8)

| Agent | Role | Used In |
|-------|------|---------|
| `code-review-coordinator` | Multi-agent review aggregation | Code Review |
| `security-analyst` | Security vulnerability detection | Code Review |
| `performance-analyst` | Performance bottleneck analysis | Code Review |
| `testing-specialist` | Test coverage and quality | Code Review |
| `architecture-reviewer` | Architecture quality assessment | Code Review |
| `research-coordinator` | Parallel research orchestration | Research |
| `spec-architect` | Specification design and creation | Spec Workflow |
| `triage-specialist` | Problem diagnosis and routing | Orchestrator |

## Skills (8)

| Skill | Purpose |
|-------|---------|
| `checkpoint-management` | Git-backed state management |
| `file-guard` | 195+ pattern file access protection |
| `code-review-orchestration` | 6-agent parallel review |
| `spec-creation` | Feature specification from research |
| `spec-execution` | 6-phase iterative implementation |
| `research-orchestration` | Parallel multi-agent research |
| `hook-management` | Session-scoped hook lifecycle |
| `codebase-mapping` | Automatic project indexing |

## Slash Commands (Mapped to Processes)

| Command | Maps To |
|---------|---------|
| `/code-review [target]` | `claudekit-code-review` |
| `/spec:create [feature]` | `claudekit-spec-workflow` (create mode) |
| `/spec:execute [file]` | `claudekit-spec-workflow` (execute mode) |
| `/research [query]` | `claudekit-research` |
| `/checkpoint:create` | `claudekit-orchestrator` checkpoint task |
| `/checkpoint:restore` | `claudekit-orchestrator` checkpoint task |
| `/validate-and-fix` | `claudekit-safety-pipeline` |
| `/hook:enable/disable/status` | `claudekit-orchestrator` hook management |

## Hook System

| Event | Hooks |
|-------|-------|
| PreToolUse | file-guard |
| PostToolUse | typecheck-changed, lint-changed, test-changed, check-comment-replacement, check-unused-parameters |
| UserPromptSubmit | codebase-map, thinking-level |
| Stop | create-checkpoint, typecheck-project, lint-project, test-project, self-review |

## Attribution

Adapted from [ClaudeKit](https://github.com/carlrannaberg/claudekit) by Carl Rannaberg.
