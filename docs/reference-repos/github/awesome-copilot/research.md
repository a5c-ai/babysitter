# github/awesome-copilot

- **Archetype**: mega-skill-pack
- **Stars**: 29,421
- **Last pushed**: 2026-04-10
- **License**: MIT
- **Discovered**: 2026-04-12
- **Skills found**: 294

## Summary
Official GitHub community-contributed skill repository for GitHub Copilot. Contains 294 skills spanning an enormous range of domains: cloud infrastructure (AWS CDK, Azure, GCP), security (CodeQL, OWASP compliance, supply chain), language-specific tooling (Java, .NET, Python), DevOps (GitHub Actions, CI/CD), productivity (PRD generation, daily-prep, issue triage), observability (Arize, AppInsights), and meta-skills (skill creation, context mapping). The largest single-repo skill collection discovered.

## Assessment
Extremely rich source of extractable domain processes. The PRD skill demonstrates a multi-phase interview-then-generate pattern directly applicable to babysitter's spec-driven methodology. Security skills (CodeQL, OWASP, supply chain) are prime candidates for specializations/security/. Cloud architecture skills (Azure, AWS, GCP) map to specializations/devops/. The sheer volume means selective extraction is critical -- focus on skills with well-defined multi-step workflows rather than simple prompt wrappers.

## Extraction Priority
- High
- Rationale: 294 skills is the largest collection found. Many skills follow multi-phase workflows that map naturally to babysitter processes. The official GitHub backing ensures quality. Key targets: PRD generation, security scanning, architecture review, CI/CD automation.

## Processes
- `prd-generation` -- Multi-phase product requirements document creation (interview -> analysis -> drafting -> review) extractable as `specializations/business/prd-generation.js`
- `codeql-security-scan` -- CodeQL-based security analysis workflow extractable as `specializations/security/codeql-analysis.js`
- `agent-owasp-compliance` -- OWASP compliance checking for agent systems extractable as `specializations/security/agent-owasp-compliance.js`
- `azure-architecture-review` -- Cloud architecture assessment extractable as `specializations/devops/azure-architecture.js`
- `daily-developer-prep` -- Daily standup and work preparation workflow extractable as `specializations/devx/daily-prep.js`
- `context-map-generation` -- Codebase context mapping for agent consumption extractable as `methodologies/context-mapping.js`
- `agentic-eval` -- Agent evaluation framework extractable as `specializations/devx/agentic-evaluation.js`
- `agent-governance` -- Agent governance and policy enforcement extractable as `specializations/security/agent-governance.js`

## Plugin Ideas
- **security**: Agent supply chain security plugin that validates dependencies and skill provenance using the agent-supply-chain skill patterns
- **DevX**: PRD generator plugin that orchestrates multi-phase requirements gathering with breakpoints for stakeholder review
- **CI/CD**: GitHub Actions workflow generator plugin using the CI/CD-focused skills as templates
- **context & memory**: Context map plugin that generates and maintains codebase context documents for agent consumption
- **QA & testing**: Agentic evaluation plugin that benchmarks agent skill performance using the agentic-eval patterns
- **security**: CodeQL integration plugin that runs security scans as babysitter tasks with breakpoint-gated remediation

## Patterns
- Interview-then-generate pattern: PRD and architecture skills gather requirements via structured questions before generating output
- Skill naming follows kebab-case convention with descriptive names
- Heavy use of `metadata` field for categorization and dependency declaration
- Skills organized as flat directory under `skills/` with one SKILL.md per directory
- Community contribution model with PR-based submission

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| PRD Generation | NEW | Multi-phase product requirements creation | - | specializations/business/prd-generation.js |
| CodeQL Security Scan | NEW | CodeQL-based security analysis workflow | - | specializations/security-compliance/codeql-analysis.js |
| Agent OWASP Compliance | NEW | OWASP compliance checking for agent systems | - | specializations/security-compliance/agent-owasp-compliance.js |
| Azure Architecture Review | NEW | Cloud architecture assessment workflow | - | specializations/devops-sre-platform/azure-architecture.js |
| Daily Developer Prep | NEW | Daily standup and work preparation workflow | - | specializations/developer-experience-ux/daily-prep.js |
| Context Map Generation | NEW | Codebase context mapping for agent consumption | - | methodologies/context-mapping/ |
| Agentic Evaluation | NEW | Agent skill performance evaluation framework | - | specializations/shared/agentic-evaluation.js |
| Agent Governance | NEW | Agent governance and policy enforcement | - | specializations/security-compliance/agent-governance.js |
| Interview-Then-Generate Pattern | NEW | Structured requirements gathering methodology | - | specializations/shared/interview-generate-pattern.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Agent Supply Chain Security | UPGRADE | Enhanced dependency validation | basic-security | plugins/a5c/marketplace/plugins/agent-supply-chain-security/ |
| PRD Generator | NEW | Multi-phase requirements gathering with stakeholder review | - | plugins/a5c/marketplace/plugins/prd-generator/ |
| GitHub Actions Workflow Generator | UPGRADE | Enhanced CI/CD workflow automation | github-actions-cicd-* | plugins/a5c/marketplace/plugins/github-actions-enhanced/ |
| Context Map Builder | NEW | Automated codebase context documentation | - | plugins/a5c/marketplace/plugins/context-map-builder/ |
| Agentic Evaluation Suite | NEW | Agent skill performance benchmarking | - | plugins/a5c/marketplace/plugins/agentic-evaluation-suite/ |
| CodeQL Integration | NEW | Security scanning with breakpoint-gated remediation | - | plugins/a5c/marketplace/plugins/codeql-integration/ |
