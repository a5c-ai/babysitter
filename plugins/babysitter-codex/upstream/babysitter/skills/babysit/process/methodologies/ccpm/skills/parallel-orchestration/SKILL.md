# Parallel Orchestration

Coordinate multiple specialized agents across parallel work streams with quality gates and conflict resolution.

## Agents
- Database Engineer - `database-engineer`
- API Developer - `api-developer`
- UI Developer - `ui-developer`
- Test Engineer - `test-engineer`
- Documentation Writer - `documentation-writer`

## Workflow
1. Prepare execution plan with stream batches
2. Dispatch specialized agents per stream (ctx.parallel.all)
3. Execute tasks sequentially within each stream
4. Quality gate after each task with convergence loop (max 3 iterations)
5. Check for cross-stream conflicts
6. Resolve conflicts if found
7. Run integration verification
8. Merge stream results

## Inputs
- `tasks` - Tasks from decomposition phase
- `streams` - Work stream definitions
- `qualityThreshold` - Minimum quality score (default: 80)
- `maxParallel` - Maximum parallel streams (default: 5)
- `githubRepo` - GitHub repo for progress sync (optional)

## Outputs
- Per-stream execution results
- Integration verification report
- Conflict detection and resolution report
- Merge result

## Agent Dispatch (5-12 parallel agents per issue)
Agents are dispatched based on stream type:
- `database` -> `database-engineer`
- `api` -> `api-developer`
- `ui` -> `ui-developer`
- `testing` -> `test-engineer`
- `docs` -> `documentation-writer`
- `infrastructure` -> `architect`

## Process Files
- `ccpm-parallel-execution.js` - Standalone parallel execution
- `ccpm-orchestrator.js` - Phase 5 of full lifecycle
