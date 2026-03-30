# Test Automation

Execute Vitest and Playwright test suites with result collection and failure analysis.

## Agent
Test Runner - `automaker-test-runner`

## Workflow
1. Navigate to worktree path
2. Run Vitest unit tests (npx vitest run --reporter=json)
3. Run Playwright E2E tests (npx playwright test --reporter=json)
4. Collect pass/fail counts per suite
5. Extract failure messages and stack traces
6. Measure code coverage
7. Identify flaky tests
8. Analyze failure root causes for convergence

## Inputs
- `projectName` - Project name
- `featureId` - Feature identifier
- `worktreePath` - Path to isolated worktree
- `testFramework` - Framework: 'vitest', 'playwright', 'both'
- `changedFiles` - Files changed by implementation

## Outputs
- Test results with allPassed, counts, failures, coverage, flaky tests

## Process Files
- `automaker-orchestrator.js` - Phase 3 (testing)
- `automaker-agent-execution.js` - Stages 4-5
- `automaker-review-ship.js` - Integration testing
