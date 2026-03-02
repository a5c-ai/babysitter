# Code Review Orchestration Skill

6-agent parallel code review with weighted scoring and actionable recommendations.

## Dimensions

1. Architecture (20%), 2. Security (25%), 3. Performance (15%), 4. Testing (15%), 5. Quality (15%), 6. Documentation (10%)

## Recommendations

- APPROVE: >= 80, no criticals
- REQUEST_CHANGES: >= 60 or criticals
- REJECT: < 60

## Used By

- `claudekit-code-review` (primary)
- `claudekit-orchestrator` (command dispatch)
