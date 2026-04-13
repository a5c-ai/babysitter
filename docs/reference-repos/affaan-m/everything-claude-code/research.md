# affaan-m/everything-claude-code

## Metadata
- **Stars:** 152,433
- **License:** MIT
- **Last pushed:** 2026-04-12
- **Description:** The agent harness performance optimization system. Skills, instincts, memory, security, and research-first development for Claude Code, Codex, Opencode, Cursor and beyond.

## Archetype: Harness Framework (performance optimization system for AI agent harnesses)

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

## Harness Integration Ideas

### Multi-Harness Architecture for Babysitter
- **Harness Adapter**: Universal optimization framework (like plugins/babysitter-codex)
- **Adapter implementation**: Multi-harness optimization layer in `packages/sdk/src/harness/optimizers/`
- **Plugin structure**: Performance optimization plugin for `plugins/babysitter-performance/`
- **CLI integration**: Token optimization, memory persistence, security scanning integration

### TUI/Orchestration Improvements
- **Current limitation**: No cross-session memory persistence or performance optimization
- **Integration approach**: Adapt memory hooks, token optimization, and AgentShield security patterns
- **Implementation scope**: `packages/sdk/src/memory/`, `packages/sdk/src/performance/`, `packages/sdk/src/security/`

### Security Framework Integration
- **Current limitation**: Limited security scanning for agent processes
- **Integration approach**: Integrate AgentShield patterns for process security validation
- **Implementation scope**: New security validation layer for babysitter processes

## Classification Rationale
While containing 181 skills, this is primarily a harness framework providing performance optimization, security, and memory persistence across multiple AI coding tools. The multi-harness architecture and production-ready optimization patterns represent significant value for enhancing our internal agent harness capabilities. Individual skills should be cherry-picked based on domain value, but the core harness optimization patterns are the primary extraction target.
