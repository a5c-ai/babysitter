# Checkpoint Management Skill

Git-backed state management for safe rollback during ClaudeKit sessions.

## Operations

- **Create**: Stage, commit with [CHECKPOINT] prefix, tag with timestamp
- **Restore**: List checkpoints, preview changes, restore to selected tag

## Used By

- `claudekit-orchestrator` (session checkpoints)
- `claudekit-safety-pipeline` (safety checkpoints)
