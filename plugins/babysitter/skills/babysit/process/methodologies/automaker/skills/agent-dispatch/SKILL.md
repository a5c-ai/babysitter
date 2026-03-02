# Agent Dispatch

Build dependency-aware, batched dispatch queues for parallel agent execution.

## Agent
Feature Planner - `automaker-feature-planner`

## Workflow
1. Analyze inter-feature dependencies
2. Build directed acyclic graph (DAG)
3. Generate topologically sorted execution order
4. Group features into batches respecting concurrency limits
5. Ensure no batch contains interdependent features
6. Assign agent types to each feature

## Inputs
- `projectName` - Project name
- `orderedPlans` - Feature plans in dependency order
- `maxParallel` - Maximum concurrent agents
- `dependencyGraph` - Feature dependency graph

## Outputs
- Batched dispatch queue with agent assignments

## Process Files
- `automaker-feature-pipeline.js` - Stage 5
- `automaker-orchestrator.js` - Phase 3 (batching)
