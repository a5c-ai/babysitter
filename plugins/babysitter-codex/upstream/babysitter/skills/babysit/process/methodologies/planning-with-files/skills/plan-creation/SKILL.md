# Plan Creation

Create a structured task_plan.md with phases, goals, and checkbox tracking for persistent planning.

## Agent
Plan Architect - `pwf-plan-architect`

## Workflow
1. Analyze task description to identify logical phases
2. Decompose phases into specific, achievable goals
3. Define phase dependencies and review gates
4. Generate task_plan.md with markdown checkbox format
5. Validate plan completeness and goal coverage
6. If recovering, merge with existing plan state

## Inputs
- `taskDescription` - Description of the task to plan
- `projectPath` - Root path for planning files
- `recoveredState` - Previous session state (optional)
- `customPhases` - Custom phase names (optional)

## Outputs
- task_plan.md with phases, goals, and checkboxes
- Plan object with phase count, total goals, summary

## Process Files
- `planning-orchestrator.js` - Phase 1 plan creation
- `planning-session.js` - Three-file pattern initialization
