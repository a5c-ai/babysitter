# QA Testing

Generate and execute API and E2E tests with quality gate assessment.

## Agent
Quinn (QA Engineer) - `bmad-qa-quinn`

## Workflow
1. Generate API tests for new endpoints
2. Create E2E tests for critical user flows
3. Test edge cases from code review findings
4. Run regression tests
5. Generate coverage report
6. Provide quality gate recommendation

## Inputs
- `projectName` - Project name
- `storyResults` - Implemented story results
- `codeReview` - Code review findings (optional)

## Outputs
- Test results (total, passed, failed)
- Coverage percentage
- Quality gate status (pass/fail)
- Failed test details
- Manual testing recommendations

## Process Files
- `bmad-orchestrator.js` - Phase 4 QA
- `bmad-implementation.js` - Sprint QA
