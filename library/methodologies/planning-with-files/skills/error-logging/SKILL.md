# Error Logging

Log all errors with full context, detect patterns, and suggest approach mutations to avoid repeated failures.

## Agent
Error Analyst - `pwf-error-analyst`

## Workflow
1. Log ALL errors immediately to progress.md (Rule 3)
2. Include error context, stack traces, and reproduction steps
3. Tag errors with severity: critical, warning, informational
4. Analyze error patterns across phases and iterations
5. Suggest approach mutations for known failure patterns (Rule 4)
6. Track error resolution status for verification

## Inputs
- `projectPath` - Root path for planning files
- `phaseName` - Phase where error occurred
- `errors` - Array of error objects
- `errorHistory` - Previous errors for pattern detection

## Outputs
- Updated progress.md error section
- Approach mutations with alternative strategies
- Error resolution report for verification

## Process Files
- `planning-orchestrator.js` - Error logging during phases
- `planning-execution.js` - Immediate error logging, pattern analysis
- `planning-verification.js` - Error resolution checking
