# Worktree Isolation

Manage git worktree lifecycle for safe, isolated parallel development.

## Agent
Worktree Manager - `automaker-worktree-manager`

## Workflow
1. Create new branch from base (feature/<id>)
2. Set up git worktree in .worktrees/ directory
3. Verify worktree isolation
4. Install dependencies in worktree
5. After completion, merge or preserve worktree
6. Clean up merged worktrees, preserve failed ones

## Inputs
- `projectName` - Project name
- `featureId` - Feature identifier
- `baseBranch` - Base branch for worktree creation

## Outputs
- Worktree path, branch name, isolation status

## Process Files
- `automaker-orchestrator.js` - Phase 3 (setup) and cleanup
- `automaker-agent-execution.js` - Stage 1
- `automaker-review-ship.js` - Stage 3 (merge)
