# Kanban Management

Initialize and manage Kanban board state for feature workflow tracking.

## Agent
Feature Planner - `automaker-feature-planner`

## Workflow
1. Create Kanban board with columns: Backlog, Ready, In Progress, Review, Done
2. Place features as cards in Backlog
3. Assign priority scores to cards
4. Establish WIP limits per column
5. Track card movement through columns
6. Generate board state snapshots

## Inputs
- `projectName` - Project name
- `features` - Feature list to place on board
- `baseBranch` - Base branch for context

## Outputs
- Board state with columns, cards, WIP limits, and priority assignments

## Process Files
- `automaker-orchestrator.js` - Phase 1
