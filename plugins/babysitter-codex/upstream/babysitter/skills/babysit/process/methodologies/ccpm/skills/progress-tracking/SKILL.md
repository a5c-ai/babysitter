# Progress Tracking

Status dashboards, standup reports, and blocked task management with GitHub synchronization.

## Agent
Project Tracker - `project-tracker`

## Workflow
1. Gather current state from all sources (tasks, GitHub, artifacts)
2. Generate standup report (accomplished, in-progress, blockers, next)
3. Manage blocked tasks with categorization and escalation
4. Create status dashboard with stream breakdown and traceability
5. Verify completion against PRD criteria
6. Sync tracking data to GitHub

## Inputs
- `projectName` - Project name
- `featureName` - Feature identifier
- `githubRepo` - GitHub repository (optional)
- `tasks` - Task list (optional)
- `executionResults` - Execution results (optional)

## Outputs
- Standup report with accomplished/in-progress/blockers/next
- Status dashboard with visual progress indicators
- Blocked task report with resolution suggestions
- Completion verification status

## Process Files
- `ccpm-tracking.js` - Standalone tracking
- `ccpm-orchestrator.js` - Final tracking report
