# Epic Generation

Transform PRD into a technical implementation plan with architecture decisions and dependency mapping.

## Agent
Architect - `architect`

## Workflow
1. Parse PRD and extract structured requirements
2. Define architecture decisions with ADR format
3. Specify technology approach and stack choices
4. Map internal, external, and cross-team dependencies
5. Assemble complete epic document
6. Validate epic covers all PRD requirements

## Inputs
- `projectName` - Project name
- `featureName` - Feature identifier
- `prd` - Finalized PRD from Phase 1
- `existingCodebase` - Codebase analysis for brownfield (optional)

## Outputs
- Epic document with architecture, tech approach, dependencies
- Architecture Decision Records (ADRs)
- Dependency graph
- Validation report

## Process Files
- `ccpm-epic-planning.js` - Standalone epic planning
- `ccpm-orchestrator.js` - Phase 2 of full lifecycle
