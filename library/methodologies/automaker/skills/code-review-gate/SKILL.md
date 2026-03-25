# Code Review Gate

Perform code review with quality scoring and configurable threshold enforcement.

## Agent
Code Reviewer - `automaker-code-reviewer`

## Workflow
1. Review all changed files for correctness
2. Check for security vulnerabilities
3. Identify performance issues
4. Verify test coverage adequacy
5. Check code style consistency
6. Detect dead code and debug artifacts
7. Verify no secrets in code
8. Assign quality score (0-100)
9. Make approve/reject decision
10. Enforce quality threshold gate

## Inputs
- `projectName` - Project name
- `featureId` - Feature identifier
- `branch` - Feature branch name
- `changedFiles` - Files to review
- `reviewPolicy` - Policy: 'auto', 'manual', 'hybrid'
- `qualityThreshold` - Minimum score (0-100)

## Outputs
- Review with approval, score, comments, security issues, quality gate pass/fail

## Process Files
- `automaker-orchestrator.js` - Phase 4
- `automaker-review-ship.js` - Stages 1-2
