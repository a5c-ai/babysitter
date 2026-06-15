# antonbabenko/terraform-skill

## Metadata
- **Stars**: 1,516
- **Description**: The Claude Agent Skill for Terraform and OpenTofu - testing, modules, CI/CD, and production patterns
- **License**: NOASSERTION (Apache 2.0 per README badge)
- **Last pushed**: 2026-02-02
- **Topics**: best-practices, claude-code, claude-skills, devops, infrastructure-as-code, modules, opentofu, terraform, testing
- **Fork**: No

## Classification
- **Archetype**: claude-plugin
- **Domain**: Infrastructure as Code (Terraform/OpenTofu)

## Structure
- `.claude-plugin/` -- marketplace plugin packaging
- `SKILL.md` -- single comprehensive skill file
- `CLAUDE.md` -- Claude Code integration
- `references/` -- reference materials (testing frameworks, module patterns, CI/CD, security)
- `tests/` -- test examples

## Key Observations
- Distributed via Claude Code marketplace (`/plugin marketplace add antonbabenko/terraform-skill`)
- Single SKILL.md covering: testing strategy (native vs Terratest), module development, CI/CD integration, security/compliance
- Well-structured reference material in `references/`
- Author is a well-known Terraform community figure (terraform-aws-modules maintainer)

## Extractable Value

### Processes
- **Terraform module development workflow** -- placement: `specializations/devops/terraform-module-development.js`
  - Testing strategy decision (native tests vs Terratest)
  - Module scaffolding with proper naming/structure
  - CI/CD pipeline generation
  - Security scanning integration (Trivy, Checkov)
- **IaC quality convergence** -- placement: `specializations/devops/iac-quality-convergence.js`
  - Static analysis -> integration -> E2E testing pipeline
  - Compliance automation

### Plugin Ideas
- **terraform-skill plugin** -- babysitter marketplace plugin wrapping the reference knowledge
  - install.md: clone references into workspace, configure SKILL.md loading
  - Skills: terraform module scaffolding, testing strategy advisor, CI/CD workflow generator
  - Would complement existing devops process library

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Terraform Module Development Workflow | NEW | Testing strategy, scaffolding, CI/CD, security scanning for Terraform modules | - | specializations/devops-sre-platform/terraform-module-development.js |
| IaC Quality Convergence | NEW | Static analysis to E2E testing pipeline with compliance automation | - | specializations/devops-sre-platform/iac-quality-convergence.js |
| Terraform Testing Strategy | NEW | Native tests vs Terratest decision framework with implementation patterns | - | specializations/devops-sre-platform/terraform-testing-strategy.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Terraform IaC Toolkit | NEW | Terraform module scaffolding with testing strategy and CI/CD generation | - | plugins/a5c/marketplace/blueprints/terraform-iac-toolkit/ |

### SKIP
- Skill management (how they distribute via marketplace) -- SDK-covered
