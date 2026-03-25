# Task Decomposition

Break epics into parallelizable tasks with acceptance criteria, effort estimates, and dependency graphs.

## Agent
Task Analyst - `task-analyst`

## Workflow
1. Analyze epic and identify 4-5 parallel work streams
2. Decompose each stream into concrete tasks (parallel)
3. Set acceptance criteria in Given/When/Then format
4. Estimate effort (S/M/L/XL) and set parallelization flags
5. Build cross-stream dependency graph
6. Validate coverage against PRD user stories
7. Fill gaps with additional tasks if needed
8. Write task files to .claude/epics/<featureName>/<N>.md

## Inputs
- `projectName` - Project name
- `featureName` - Feature identifier
- `epic` - Epic from Phase 2
- `prd` - PRD from Phase 1
- `parallelAgents` - Max parallel agents (default: 5)

## Outputs
- Task list with acceptance criteria and effort estimates
- Work stream definitions
- Dependency graph with execution waves
- Coverage report with PRD traceability

## Process Files
- `ccpm-task-decomposition.js` - Standalone decomposition
- `ccpm-orchestrator.js` - Phase 3 of full lifecycle
