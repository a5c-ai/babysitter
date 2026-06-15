# affaan-m/everything-claude-code

## Metadata
- **Stars:** 152,433
- **License:** MIT
- **Last pushed:** 2026-04-12
- **Description:** The agent harness performance optimization system. Skills, instincts, memory, security, and research-first development for Claude Code, Codex, Opencode, Cursor and beyond.

## Archetype: mega-skill-pack

## Structure
- `skills/` — 181 skill directories spanning many domains
- `agents/` — Agent definitions (38 agents per README)
- `hooks/` — Hook implementations
- `rules/` — Language-specific rule sets (common, typescript, python, golang, java, php, perl, kotlin, c++, rust)
- `commands/` — 72 legacy command shims
- `plugins/` — Plugin integrations
- `contexts/` — Context files
- `ecc2/` — Rust control-plane prototype (alpha)
- `.claude-plugin/`, `.codex-plugin/`, `.cursor/`, `.gemini/`, `.opencode/` — Multi-harness support
- `research/` — Research-first development
- `mcp-configs/` — MCP server configurations
- `schemas/` — Schema definitions

## Extractable Value

### Skills with Process Potential (cherry-pick, not bulk import)
From 181 skills, notable clusters that map to babysitter specializations:

**DevOps/Infrastructure:**
- `docker-patterns`, `deployment-patterns`, `database-migrations`, `postgres-patterns`

**Security:**
- `security-scan` (AgentShield integration), `security-review`, `security-bounty-hunter`, `hipaa-compliance`, `healthcare-phi-compliance`, `defi-amm-security`, `llm-trading-agent-security`

**Testing Methodologies:**
- `tdd-workflow`, `e2e-testing`, `verification-loop`, `ai-regression-testing`, `eval-harness`
- Language-specific testing: `golang-testing`, `python-testing`, `rust-testing`, `cpp-testing`, `csharp-testing`, `kotlin-testing`

**Domain Specializations:**
- Healthcare: `healthcare-cdss-patterns`, `healthcare-emr-patterns`, `healthcare-eval-harness`
- Finance: `finance-billing-ops`, `evm-token-decimals`, `defi-amm-security`
- Logistics: `logistics-exception-management`, `returns-reverse-logistics`, `customs-trade-compliance`, `energy-procurement`, `inventory-demand-planning`
- Legal/Compliance: `hipaa-compliance`, `visa-doc-translate`

**Agent/AI Meta-skills:**
- `autonomous-loops`, `continuous-learning-v2`, `iterative-retrieval`, `context-budget`, `token-budget-advisor`, `cost-aware-llm-pipeline`

**Content/Media:**
- `manim-video`, `remotion-video-creation`, `frontend-slides`, `article-writing`, `content-engine`

### Methodological Patterns Worth Extracting
1. **Verification loop pattern** — Checkpoint vs continuous evals with pass@k metrics
2. **Continuous learning** — Auto-extract patterns from sessions into reusable skills
3. **Santa method** — Unknown, worth investigating
4. **Research-ops** — Research-first development workflow
5. **Hook profile system** — `ECC_HOOK_PROFILE=minimal|standard|strict` for runtime gating

### Plugin Idea: Selective Skill Import
The selective install architecture (`install-plan.js` / `install-apply.js`) with manifest-driven pipeline and state tracking is a pattern worth studying for babysitter's plugin system.

### What to SKIP
- `ecc2/` Rust control-plane — Competing orchestration, not assimilable
- Memory/session infrastructure — SDK-covered primitives
- Cross-harness management — Covered by babysitter harness adapters
- Skill management/discovery — SDK-covered primitives
- Observer/dashboard — Babysitter has its own

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Healthcare HIPAA Compliance | NEW | Multi-stage PHI compliance verification workflow | - | specializations/healthcare/hipaa-compliance-validation.js |
| DeFi Security Audit | NEW | Automated market maker security analysis process | - | specializations/finance/defi-security-audit.js |
| Logistics Exception Management | NEW | Supply chain disruption handling and recovery workflow | - | specializations/logistics/exception-management.js |
| Continuous Learning Methodology | NEW | Auto-pattern extraction from agent sessions | - | specializations/shared/continuous-learning.js |
| Verification Loop Pattern | NEW | Checkpoint vs continuous evaluation framework | - | specializations/shared/verification-loop.js |
| Multi-Language Testing Pipeline | NEW | Cross-language testing methodology (Go, Python, Rust, C++, C#, Kotlin) | - | specializations/shared/multi-language-testing.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Healthcare Compliance Suite | NEW | HIPAA/PHI compliance setup with validation processes | - | plugins/a5c/marketplace/blueprints/healthcare-compliance/ |
| Multi-Language Security Scanning | UPGRADE | Enhance existing security with language-specific scanners | basic-security | plugins/a5c/marketplace/blueprints/multi-language-security/ |
