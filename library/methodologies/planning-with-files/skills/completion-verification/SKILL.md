# Completion Verification

Verify all phases are complete with weighted quality scoring before allowing session exit.

## Agent
Completion Verifier - `pwf-completion-verifier`

## Workflow
1. Read all three planning files in parallel
2. Parse checkbox completion state from task_plan.md
3. Cross-reference plan, findings, and progress for consistency
4. Check error resolution status
5. Calculate weighted quality score (phases 40%, errors 25%, findings 20%, continuity 15%)
6. Generate recommendations if threshold not met
7. Write verification report to progress.md

## Inputs
- `projectPath` - Root path for planning files
- `taskDescription` - Original task description
- `qualityThreshold` - Minimum score to pass (default: 80)
- `strictMode` - Require 100% checkbox completion (default: false)

## Outputs
- Quality score with component breakdown
- Phase completion report
- Unresolved error list
- Prioritized improvement recommendations

## Process Files
- `planning-orchestrator.js` - Completion assessment and final verification
- `planning-verification.js` - Full verification pipeline
