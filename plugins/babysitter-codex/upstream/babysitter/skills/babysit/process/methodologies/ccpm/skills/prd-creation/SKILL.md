# PRD Creation

Interactive PRD brainstorming and drafting with quality-gated refinement.

## Agent
Product Planner - `product-planner`

## Workflow
1. Brainstorm ideas, users, and pain points
2. Draft structured PRD with vision, user stories, success criteria
3. Validate PRD quality (completeness, clarity, testability, consistency)
4. Iteratively refine until quality threshold met
5. Finalize and write to .claude/prds/<featureName>.md

## Inputs
- `projectName` - Project name
- `featureName` - Feature identifier
- `projectDescription` - High-level description
- `targetAudience` - Target user description (optional)
- `constraints` - Known constraints (optional)

## Outputs
- PRD with vision, user stories, acceptance criteria, scope, constraints
- Quality validation report with dimensional scores
- Brainstorm artifacts

## Process Files
- `ccpm-prd-workflow.js` - Standalone PRD workflow
- `ccpm-orchestrator.js` - Phase 1 of full lifecycle
