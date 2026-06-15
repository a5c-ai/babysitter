# Jeffallan/claude-skills

- **Archetype**: mega-skill-pack
- **Stars**: 8,132
- **Last pushed**: 2026-03-23
- **License**: MIT
- **Discovered**: 2026-04-12
- **Source**: gh-search
- **Skills found**: 66 skills + 3 workflow commands (common-ground, intake, project)

## Summary

66 Claude Code skills across infrastructure, quality, security, architecture, workflow, and language/framework domains, plus 3 workflow commands. Each skill follows a consistent structure: SKILL.md with frontmatter metadata, a "Core Workflow" section with numbered phases, a "Reference Guide" table pointing to `references/*.md` files, constraints (MUST DO / MUST NOT DO), code examples, and output templates. The reference directory contains 366 markdown files totaling ~55K lines of deep domain knowledge.

The previous assessment dismissed these as "just expert personas" and "static knowledge dumps." That was wrong. While the skills do include persona framing ("Senior engineer with 15+ years..."), the procedural content underneath is substantial. Most high-potential skills contain multi-step workflows with validation checkpoints, error recovery branches, conditional phase transitions, and concrete code examples. The reference files add significant depth -- the strangler-fig-pattern reference alone is a complete multi-phase migration playbook with code for facade routing, dual-write databases, UI component strangling, event interception, and phased rollout with automated rollback.

## Assessment

**Procedural content quality is HIGH across the infrastructure/quality/workflow skills.** These are not static system prompts -- they encode genuine multi-step procedures with:

1. **Validation checkpoints** between phases (legacy-modernizer has 5 explicit checkpoints; cloud-architect validates connectivity before migration cutover)
2. **Error recovery branches** (terraform-engineer has a full error recovery section with state drift, auth errors, and dependency ordering fixes)
3. **Conditional workflow routing** (the-fool has 5 reasoning modes selected via 2-step interactive selection; feature-forge switches between PM Hat and Dev Hat perspectives)
4. **Phased rollout patterns** (legacy-modernizer: 10% -> 50% -> 100% traffic with per-phase metric thresholds; chaos-engineer: dev -> staging -> production with progressive blast radius)
5. **Concrete tooling** (security-reviewer lists exact CLI commands for each scan phase; kubernetes-specialist provides complete YAML patterns with security contexts)

The reference files are where the real depth lives. 366 files averaging ~150 lines each contain runnable code examples, decision matrices, pattern libraries, and validation checklists that go far beyond what the SKILL.md alone contains.

**Key distinction from addyosmani/agent-skills**: addyosmani focuses on meta-methodology (how to debug, how to review code -- generic reasoning frameworks). Jeffallan focuses on domain-specific procedures (how to migrate a Kubernetes workload, how to design a chaos experiment, how to extract services from a monolith). These are complementary, not competing.

## Extraction Priority

**MEDIUM-HIGH** -- Reassessed upward from LOW. Several skills contain extractable specialization processes with genuine multi-step procedural content. The infrastructure cluster (kubernetes, terraform, cloud-architect, devops, sre, chaos) and the workflow cluster (legacy-modernizer, spec-miner, feature-forge, the-fool) are the highest value. Language/framework skills (react-expert, python-pro, etc.) remain LOW priority as they're primarily knowledge references without novel procedures.

Rationale: The processes here are more domain-specific and concrete than what the existing babysitter process library contains. The legacy-modernizer strangler-fig workflow, chaos experiment design process, and security audit workflow are all directly usable as `specializations/<domain>/` processes.

## Skills Inventory

### Infrastructure Cluster

| Skill | Procedural Content | Phases | Checkpoints | Error Recovery | Transferability |
|-------|-------------------|--------|-------------|----------------|-----------------|
| kubernetes-specialist | 5-step workflow + 11 reference topics | 5 | Implicit (validation commands) | No explicit | HIGH -- extractable as `specializations/infrastructure/kubernetes-deployment-review` |
| terraform-engineer | 6-step workflow with error recovery | 6 | Step 5 validation loop | YES (state drift, auth, deps) | HIGH -- extractable as `specializations/infrastructure/terraform-module-development` |
| cloud-architect | 6-step workflow with validation checkpoints | 6 | 4 explicit checkpoints (post-design, pre-cutover, post-migration, post-DR) | Implicit via checkpoints | HIGH -- extractable as `specializations/infrastructure/cloud-migration-planning` |
| devops-engineer | 6-step workflow, 3 operational perspectives | 6 | Steps 4-6 have gates | Rollback procedure template | MEDIUM -- overlaps with existing CI/CD patterns |
| sre-engineer | 6-step workflow with SLO-driven gates | 6 | Step 3 (alignment), Step 6 (RTO/RPO) | Error budget policy | HIGH -- extractable as `specializations/infrastructure/slo-definition-process` |
| chaos-engineer | 5-step workflow with safety checklist | 5 | 6-point safety checklist, steady-state verification | Auto-rollback < 30s | HIGH -- extractable as `specializations/infrastructure/chaos-experiment-design` |
| monitoring-expert | 5-step workflow | 5 | Step 3 (verify data), Step 5 (validate alerts) | No explicit | MEDIUM -- mostly reference/implementation patterns |

### Quality Cluster

| Skill | Procedural Content | Phases | Checkpoints | Error Recovery | Transferability |
|-------|-------------------|--------|-------------|----------------|-----------------|
| code-reviewer | 5-step workflow with disagreement handling | 5 | Step 1 (summarize intent before proceeding) | Disagreement protocol | MEDIUM -- well-covered by existing babysitter code-reviewer agent |
| debugging-wizard | 5-step hypothesis-driven workflow | 5 | Implicit (reproduce first) | Git bisect for regression hunting | MEDIUM -- overlaps with superpowers:systematic-debugging |
| test-master | 5-step workflow with flakiness handling | 5 | Coverage targets before closing | Flaky test triage branch | MEDIUM -- good reference content but overlaps with existing TDD process |
| security-reviewer | 5-step workflow with authorization gates | 5 | Step 1 (written authorization), Step 4 (scope check), Step 5 (stakeholder confirm) | PoC-only exploitation constraint | HIGH -- extractable as `specializations/security/security-audit-process` |
| secure-code-guardian | 5-step workflow with validation checkpoints | 5 | 4 explicit validation checkpoints per domain | No explicit | MEDIUM -- primarily implementation patterns |

### Workflow Cluster

| Skill | Procedural Content | Phases | Checkpoints | Error Recovery | Transferability |
|-------|-------------------|--------|-------------|----------------|-----------------|
| legacy-modernizer | 5-step workflow with rollback strategies | 5 | 5 explicit validation checkpoints | Per-phase rollback triggers | **HIGHEST** -- directly extractable as `specializations/shared/legacy-modernization` |
| feature-forge | 5-step requirements elicitation workflow | 5 | EARS format validation | No explicit | HIGH -- extractable as `specializations/shared/requirements-elicitation` |
| spec-miner | 5-step reverse-engineering workflow | 5 | Step 2 (coverage validation) | No explicit | HIGH -- extractable as `specializations/shared/codebase-reverse-engineering` |
| the-fool | 5-step critical reasoning with 5 modes | 5 | Steelman confirmation, user engagement before synthesis | Mode selection fallback | HIGH -- extractable as `specializations/shared/pre-mortem-analysis` (the pre-mortem reference alone is a complete process) |

### Architecture Cluster

| Skill | Procedural Content | Phases | Checkpoints | Error Recovery | Transferability |
|-------|-------------------|--------|-------------|----------------|-----------------|
| architecture-designer | 5-step workflow with feedback loop | 5 | Step 5 (review fail -> return to step 3) | Feedback loop | MEDIUM -- generic, overlaps with existing patterns |
| microservices-architect | 6-step workflow with validation per phase | 6 | 6 explicit checkpoints | No explicit | HIGH -- extractable as `specializations/infrastructure/microservices-decomposition` |

### Commands

| Command | Procedural Content | Transferability |
|---------|-------------------|-----------------|
| common-ground | 2-phase interactive assumption surfacing + --graph mode with reasoning diagram generation | HIGH -- novel pattern for `specializations/shared/assumption-validation` |
| intake | Capture-behavior, create-system-description, document-codebase workflows (YAML-defined) | MEDIUM -- project onboarding workflows |
| project | Discovery, execution, planning, retrospectives sub-workflows | MEDIUM -- project management workflows |

## Processes

Directly extractable as babysitter specialization processes:

### Tier 1: Highest Value (unique procedural content, no existing overlap)

1. **`specializations/shared/legacy-modernization`** -- From legacy-modernizer + strangler-fig-pattern reference. A complete 5-phase migration process with: system assessment (dependency mapping, risk register, tech debt calculation), test safety net creation (characterization tests, 80% coverage gate), strangler fig implementation (facade routing, dual-write, feature flags), phased traffic migration (10% -> 50% -> 100% with metric-gated rollback), and legacy retirement (stability gate: 1 release cycle at 100%). Includes code templates for facade layer, feature flags, characterization tests, migration phase tracking, and automated rollback.

2. **`specializations/infrastructure/chaos-experiment-design`** -- From chaos-engineer + experiment-design reference. A structured experiment design process: system analysis -> hypothesis formulation -> blast radius configuration (with progressive rollout levels) -> safety mechanism setup (auto-rollback < 30s, kill switch, metric monitoring) -> execution with monitoring -> learning documentation. Includes complete Litmus Chaos, toxiproxy, and Chaos Monkey examples.

3. **`specializations/security/security-audit-process`** -- From security-reviewer. A 5-phase audit: scope/authorization -> automated scanning (semgrep, bandit, gitleaks, npm audit, trivy) -> manual review (auth, input, crypto) -> classification with CVSS scoring -> stakeholder-confirmed reporting. Has explicit authorization gates before active testing.

4. **`specializations/shared/pre-mortem-analysis`** -- From the-fool's pre-mortem reference. A structured failure anticipation process: scene-setting -> failure narrative construction (with specificity checklist) -> consequence chain tracing (3 orders deep) -> early warning sign identification -> mitigation design. Includes domain-specific failure pattern libraries (technical, business, process) and the inversion technique ("What would guarantee this fails?").

### Tier 2: High Value (good procedural content, some overlap with existing)

5. **`specializations/shared/requirements-elicitation`** -- From feature-forge. EARS-format requirements gathering with structured PM/Dev hat switching, interview-driven discovery, and acceptance criteria validation. The EARS syntax reference is a reusable pattern.

6. **`specializations/shared/codebase-reverse-engineering`** -- From spec-miner. Systematic codebase archaeology process: scope definition -> structural exploration (with grep/glob patterns) -> data flow tracing -> EARS-format documentation -> uncertainty flagging.

7. **`specializations/infrastructure/slo-definition-process`** -- From sre-engineer. SLI identification -> SLO target setting -> alignment verification -> multi-window burn rate alerting -> toil automation. Includes complete Prometheus alerting rules and PromQL golden signal queries.

8. **`specializations/infrastructure/cloud-migration-planning`** -- From cloud-architect. 6Rs framework application with pre-cutover connectivity validation, post-migration health checks, and DR testing with RTO/RPO measurement.

9. **`specializations/infrastructure/microservices-decomposition`** -- From microservices-architect. DDD-based bounded context identification -> communication pattern selection -> database-per-service strategy -> resilience pattern application -> observability instrumentation. Each phase has an explicit validation checkpoint.

### Tier 3: Reference Value (good domain knowledge, less process structure)

10. **`specializations/infrastructure/kubernetes-deployment-review`** -- From kubernetes-specialist. Security-first deployment validation: resource limits, probes, RBAC, NetworkPolicies. More of a checklist than a process but has the 11-topic reference library as backing depth.

11. **`specializations/infrastructure/terraform-module-development`** -- From terraform-engineer. Module design with error recovery for state drift, auth issues, and dependency ordering. The error recovery section is the novel part.

12. **`specializations/shared/assumption-validation`** -- From common-ground command. Interactive assumption surfacing with tier classification (OPEN/WORKING/ESTABLISHED), reasoning graph generation, and staleness tracking.

## Plugin Ideas

1. **Chaos Engineering Plugin** -- A babysitter marketplace plugin that wraps the chaos experiment design process with actual Litmus Chaos / toxiproxy integration. Could auto-generate experiment manifests, monitor blast radius during execution, and enforce the safety checklist as breakpoints. The `install.md` would set up the chaos tooling; the process would orchestrate experiment design and execution with mandatory safety gates.

2. **Security Audit Plugin** -- Wraps the security audit process with actual tool execution (semgrep, bandit, gitleaks, trivy). Each scan phase becomes a task, findings get classified automatically, and the final report is assembled from task outputs. Authorization gates become breakpoints.

3. **Legacy Modernization Plugin** -- Orchestrates the full strangler fig migration process with babysitter. Assessment phase produces dependency maps via tasks. Characterization test creation and validation are breakpointed. Traffic migration percentages are controlled via breakpoints with metric threshold checks.

## Implicit Procedural Knowledge

Several skills contain procedural knowledge embedded in their constraints and reference files rather than in explicit workflow steps:

1. **Rollback-first deployment** (devops-engineer, kubernetes-specialist): Every deployment must document its rollback command and verification step *before* deploying. This is a procedural invariant that could be extracted as a pre-deployment checklist process.

2. **Dual-hat perspective switching** (feature-forge: PM/Dev, spec-miner: Arch/QA, devops-engineer: Build/Deploy/Ops): The pattern of systematically analyzing from multiple perspectives is a reusable meta-process. Feature-forge explicitly structures this as "interview from both perspectives."

3. **Metric-gated phase transitions** (legacy-modernizer, chaos-engineer, sre-engineer): The pattern of defining metric thresholds that must hold before proceeding to the next phase is a cross-domain process primitive. Legacy-modernizer gates traffic increases on error rate; chaos-engineer gates blast radius expansion on steady-state metrics; SRE gates on error budget burn rate.

4. **Characterization testing before modification** (legacy-modernizer): The discipline of capturing existing behavior as automated tests before changing code is a transferable process step applicable beyond legacy modernization -- useful for any refactoring or migration work.

5. **Progressive blast radius expansion** (chaos-engineer): Start with smallest possible scope, validate, expand. This pattern applies beyond chaos engineering to any risky change rollout (feature flags, migrations, schema changes).

6. **EARS format for requirements** (feature-forge, spec-miner): The Easy Approach to Requirements Syntax (When/While/Where templates) is a concrete, teachable format for expressing requirements that could be standardized across babysitter requirements-related processes.

7. **Pre-mortem inversion** (the-fool): "What would guarantee this fails?" + checking if those conditions exist. This is a standalone analysis technique that could be injected as a validation step into any planning process.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Legacy Modernization | NEW | 5-phase migration with strangler fig pattern and metric-gated rollback | - | specializations/shared/legacy-modernization.js |
| Chaos Experiment Design | NEW | Structured experiment design with safety mechanisms and progressive blast radius | - | specializations/devops-sre-platform/chaos-experiment-design.js |
| Security Audit Process | NEW | 5-phase audit with authorization gates and automated scanning integration | - | specializations/security-compliance/security-audit-process.js |
| Pre-mortem Analysis | NEW | Structured failure anticipation with consequence chains and mitigation design | - | specializations/shared/pre-mortem-analysis.js |
| Requirements Elicitation | NEW | EARS-format requirements gathering with PM/Dev perspective switching | - | specializations/shared/requirements-elicitation.js |
| Codebase Reverse Engineering | NEW | Systematic codebase archaeology with EARS documentation and uncertainty flagging | - | specializations/shared/codebase-reverse-engineering.js |
| SLO Definition Process | NEW | SLI identification to multi-window burn rate alerting with toil automation | - | specializations/devops-sre-platform/slo-definition-process.js |
| Cloud Migration Planning | NEW | 6Rs framework with pre-cutover validation and DR testing | - | specializations/devops-sre-platform/cloud-migration-planning.js |
| Microservices Decomposition | NEW | DDD-based bounded context identification with validation checkpoints | - | specializations/devops-sre-platform/microservices-decomposition.js |
| Kubernetes Deployment Review | NEW | Security-first deployment validation with RBAC and NetworkPolicy checks | - | specializations/devops-sre-platform/kubernetes-deployment-review.js |
| Terraform Module Development | NEW | Module design with error recovery for state drift and dependency ordering | - | specializations/devops-sre-platform/terraform-module-development.js |
| Assumption Validation | NEW | Interactive assumption surfacing with tier classification and reasoning graphs | - | specializations/shared/assumption-validation.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Chaos Engineering Toolkit | NEW | Litmus Chaos/toxiproxy integration with experiment orchestration and safety gates | - | plugins/a5c/marketplace/blueprints/chaos-engineering-toolkit/ |
| Security Audit Automation | UPGRADE | Enhanced security scanning with tool integration and automated finding classification | basic-security | plugins/a5c/marketplace/blueprints/security-audit-automation/ |
| Legacy Modernization Framework | NEW | Strangler fig migration orchestration with characterization testing and metric-gated rollback | - | plugins/a5c/marketplace/blueprints/legacy-modernization-framework/ |
