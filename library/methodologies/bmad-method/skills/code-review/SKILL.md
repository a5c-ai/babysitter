# Code Review

Multi-dimensional code review across correctness, security, performance, maintainability, and test coverage.

## Agents
- Amelia (Developer) - `bmad-dev-amelia` (full team mode)
- Barry (Solo Dev) - `bmad-solodev-barry` (quick flow mode)

## Workflow
1. Review correctness: logic, edge cases, error handling
2. Review security: validation, auth, data protection
3. Review performance: efficiency, resources, caching
4. Review maintainability: clarity, naming, SOLID
5. Review test coverage: missing tests, quality
6. Rate overall quality and identify tech debt
7. Generate actionable recommendations

## Inputs
- `projectName` - Project name
- `storyResults` - Implementation results to review

## Outputs
- Overall rating and score (0-100)
- Category scores (5 dimensions)
- Finding list with severity and suggestions
- Technical debt identification
- Action items

## Process Files
- `bmad-orchestrator.js` - Phase 4 code review
- `bmad-implementation.js` - Sprint code review
- `bmad-quick-flow.js` - Quick flow review
