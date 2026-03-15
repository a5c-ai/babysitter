# Streaming Progress

Emit real-time progress events for streaming UI consumption.

## Agent
Progress Streamer - `automaker-progress-streamer`

## Workflow
1. Receive progress event from execution stage
2. Format event with timestamp and stage information
3. Calculate completion percentage
4. Generate human-readable summary
5. Include machine-readable data for UI rendering
6. Emit formatted event

## Inputs
- `projectName` - Project name
- `featureId` - Feature being tracked
- `event` - Progress event with stage, message, data

## Outputs
- Formatted streaming event with progress metrics

## Process Files
- `automaker-orchestrator.js` - Phase 3 (batch progress)
- `automaker-agent-execution.js` - All stages
