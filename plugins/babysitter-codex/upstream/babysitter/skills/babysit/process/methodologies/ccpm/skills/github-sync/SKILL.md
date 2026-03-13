# GitHub Sync

Bidirectional synchronization of epics and tasks with GitHub issues, labels, and relationships.

## Agent
Project Tracker - `project-tracker`

## Workflow
1. Create epic issue with `epic` and `ccpm` labels
2. Create task issues linked to epic with stream-type labels
3. Add acceptance criteria as checkboxes in issue body
4. Set issue relationships (parent/child)
5. Sync progress updates as issue comments
6. Close issues when tasks complete
7. Maintain bidirectional sync state

## Inputs
- `githubRepo` - GitHub repository (owner/repo)
- `featureName` - Feature identifier
- `epic` - Epic document
- `tasks` - Task list from decomposition

## Outputs
- Epic issue number
- Task issue numbers with ID mapping
- Labels applied
- Sync status report

## Issue States
`open` -> `in-progress` -> `blocked` -> `review` -> `closed`

## Process Files
- `ccpm-orchestrator.js` - Phase 4 of full lifecycle
- `ccpm-parallel-execution.js` - Progress sync during execution
- `ccpm-tracking.js` - Tracking data sync
