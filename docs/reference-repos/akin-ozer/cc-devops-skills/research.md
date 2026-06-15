# akin-ozer/cc-devops-skills

## Metadata
- **Stars:** 174 (below typical threshold but reviewed for novelty)
- **License:** Apache-2.0
- **Last pushed:** 2026-03-27
- **Description:** A practical agent skill pack for DevOps work in Claude Code and Codex.

## Archetype: Plugin + Specialization Processes (DevOps domain)

## Structure
- `devops-skills-plugin/` — Full plugin package with `.claude-plugin/` and `.codex-plugin/` manifests
  - `skills/` — 31 skills organized as generator/validator/debugger pairs:
    - Generators (16): ansible, azure-pipelines, bash-script, dockerfile, fluentbit, github-actions, gitlab-ci, helm, jenkinsfile, k8s-yaml, loki-config, logql, makefile, promql, terraform, terragrunt
    - Validators (14): matching validators for each generator (except loki-config, logql)
    - Debugger (1): k8s-debug
- `action.yml` — GitHub Action wrapper around `anthropics/claude-code-action@v1` with auto-injection
- `docs/`, `examples/`, `scripts/` — Supporting materials

## Extractable Value

### As Babysitter Processes: `specializations/devops/`
The generator/validator pair pattern is a strong methodology concept:
1. **Generator skills** — Scaffold production-ready configs for specific tools (Terraform, Helm, Dockerfiles, CI pipelines, etc.)
2. **Validator skills** — Lint, security-check, and dry-run validate generated configs
3. **k8s-debug** — Systematic Kubernetes debugging with safety rules for disruptive commands, prerequisite checks, and snapshot-before-modify patterns

The k8s-debug skill is particularly well-structured:
- Deterministic, safety-first workflow
- Read-only diagnosis before disruptive actions
- Explicit confirmation gates for destructive commands (delete --force, drain, rollout restart)
- Pre-action state snapshots for rollback

### Plugin Idea: `devops-skills`
Already structured as a plugin with marketplace install support. Could be assimilated as a marketplace plugin pattern reference.

### Key Differentiators
- The generator/validator pairing pattern is a reusable methodology concept
- k8s-debug's safety-first approach with breakpoint-like confirmation gates maps well to babysitter's breakpoint system
- Already has both Claude and Codex plugin manifests (cross-harness)
- GitHub Action wrapper pattern is interesting for CI integration

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Generator/Validator Pattern | NEW | Config generation paired with validation methodology | - | specializations/shared/generator-validator-pattern.js |
| Kubernetes Safety Debugging | NEW | Safety-first K8s debugging with confirmation gates and snapshots | - | specializations/devops-sre-platform/k8s-safety-debugging.js |
| Infrastructure Config Generation | NEW | Production-ready config scaffolding for Terraform, Helm, Docker, CI | - | specializations/devops-sre-platform/infrastructure-config-generation.js |
| DevOps Validation Pipeline | NEW | Linting and security validation for generated infrastructure configs | - | specializations/devops-sre-platform/devops-validation-pipeline.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| DevOps Config Generator | NEW | Infrastructure config generation and validation with safety gates | - | plugins/a5c/marketplace/blueprints/devops-config-generator/ |
| K8s Safety Toolkit | NEW | Safe Kubernetes debugging and management with confirmation gates | - | plugins/a5c/marketplace/blueprints/k8s-safety-toolkit/ |

## Classification Rationale
Domain-specific (DevOps), so `specializations/devops-sre-platform/`. The generator/validator pair pattern could also inform a shared methodology. Despite lower star count, the content quality and structural patterns are novel and well-executed.
