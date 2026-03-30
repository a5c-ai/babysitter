# Product Brief Creation

Create comprehensive product briefs from market, domain, and technical research.

## Agent
Mary (Analyst) - `bmad-analyst-mary`

## Workflow
1. Conduct market research (competitors, trends, opportunities)
2. Perform domain research (problem space, stakeholders, pain points)
3. Evaluate technical feasibility
4. Synthesize findings into structured product brief
5. Define success metrics and scope boundaries

## Inputs
- `projectName` - Project name
- `projectDescription` - Project description
- `researchDepth` - shallow, standard, or deep
- `domainContext` - Domain-specific context (optional)

## Outputs
- Product brief with problem statement, target users, value proposition
- Research findings (market, domain, technical)
- Success metrics and KPIs
- Feature themes and scope boundaries

## Process Files
- `bmad-analysis.js` - Standalone analysis
- `bmad-orchestrator.js` - Phase 1 of full lifecycle
