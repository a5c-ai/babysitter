# glitternetwork/pinme

- **Archetype**: tool-with-skills
- **Stars**: 3,172
- **Last pushed**: 2026-04-11
- **License**: MIT
- **Discovered**: 2026-04-12
- **Skills found**: 2

## Summary

A zero-config frontend deployment tool supporting IPFS uploads and full-stack project deployment (React+Vite + Cloudflare Worker + D1 database). Ships with 2 Claude Code skills: `pinme` (main deployment orchestrator with decision tree for static vs full-stack paths) and `pinme-api` (API/backend-focused). The deployment skill uses a graphviz decision tree to route between simple file upload (no login required) and full-stack project creation (with Workers, D1, email support).

## Assessment

Moderate value. The deployment orchestration pattern (decision tree routing between deployment paths) is transferable. The skill demonstrates a clean decision-tree pattern using graphviz dot notation within SKILL.md for workflow visualization. The dual-path architecture (simple upload vs full-stack) shows how to structure skills that handle varying complexity levels.

## Extraction Priority
- Low
- Rationale: Very tool-specific (PinMe platform). The deployment decision-tree pattern is reusable but the actual skills are tightly coupled to the PinMe CLI/platform.

## Processes

### 1. Frontend Deployment Decision Process
- **Source skills**: pinme
- **Placement**: `specializations/shared/frontend-deployment-decision.js`
- **Description**: Generic deployment decision process: analyze project type -> determine deployment target -> select deployment strategy (static/SSR/full-stack) -> execute deployment -> return preview URL. Adaptable to any deployment platform.

## Plugin Ideas

- **IPFS Deployment plugin**: Add IPFS-based deployment as a babysitter task executor for decentralized hosting workflows. Category: DevOps.
- **Deployment Orchestrator plugin**: Multi-platform deployment with decision routing based on project analysis (Vercel, Cloudflare, IPFS, etc.). Category: CI/CD.

## Patterns

- Graphviz dot notation in SKILL.md for workflow visualization
- Dual-path skill design (simple vs complex workflow branching)
- No-login-required path for low-friction operations
- Decision diamond routing based on project requirements analysis

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Frontend Deployment Decision Process | NEW | Generic deployment decision workflow with project analysis and strategy selection | - | specializations/shared/frontend-deployment-decision.js |
| Dual-Path Workflow Design | NEW | Simple vs complex workflow branching pattern with decision diamond routing | - | specializations/shared/dual-path-workflow-design.js |
| Project Type Analysis for Deployment | NEW | Analyze frontend projects to determine appropriate deployment strategy | - | specializations/frontend/project-type-analysis-deployment.js |
| IPFS Deployment Workflow | NEW | Decentralized hosting deployment process via IPFS | - | specializations/devops-sre-platform/ipfs-deployment-workflow.js |
| Full-Stack Project Deployment | NEW | Complete deployment for React + Cloudflare Worker + D1 database stacks | - | specializations/frontend/fullstack-project-deployment.js |
| Workflow Visualization with Graphviz | NEW | Decision tree and workflow visualization using dot notation in documentation | - | specializations/shared/workflow-visualization-graphviz.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| IPFS Deployment Integration | NEW | IPFS CLI integration for decentralized hosting workflows | - | plugins/a5c/marketplace/plugins/ipfs-deployment-integration/ |
| Multi-Platform Deployment Orchestrator | NEW | Deployment routing with Vercel, Cloudflare, IPFS integration based on project analysis | - | plugins/a5c/marketplace/plugins/multi-platform-deployment-orchestrator/ |
