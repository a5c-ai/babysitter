# cisco-ai-defense/skill-scanner

- **GitHub**: https://github.com/cisco-ai-defense/skill-scanner
- **Stars**: 1,731
- **License**: Apache-2.0 (NOASSERTION in API, but Apache-2.0 per LICENSE file)
- **Last pushed**: 2026-04-10
- **Topics**: agent, agent-skills, security
- **Source**: gh-search

## Description

Security scanner for AI agent skills from Cisco AI Defense. Python CLI tool (`cisco-ai-skill-scanner`) with multi-engine detection: static pattern analysis (YAML + YARA rules), LLM-as-a-judge semantic analysis, behavioral dataflow analysis, and optional cloud-based scanning. Supports OpenAI Codex Skills and Cursor Agent Skills formats (Agent Skills spec), plus lenient mode for Claude Code `.claude/commands/*.md` and flat markdown repos.

## Archetype

**utility-with-skill** -- Standalone security scanning tool with pre-commit hook integration. Not a skill pack itself, but deeply understands and analyzes the skill format.

## Structure

- `skill_scanner/core/` -- Scanner engine, analyzers (static, LLM, behavioral, meta), rule registry, scan policy, extractors
- `skill_scanner/threats/` -- Cisco AI Security Framework taxonomy (AITech codes), threat definitions
- `skill_scanner/hooks/` -- pre-commit hook integration
- `skill_scanner/api/` -- REST API server mode
- `skill_scanner/cli/` -- CLI interface
- `evals/` -- 15 evaluation SKILL.md files (safe and malicious) for scanner testing
- `docs/` -- Comprehensive docs: architecture, threat taxonomy, custom rules, GitHub Actions, scan policy configuration

## Key Capabilities

- Multi-engine detection: pattern-based (YAML+YARA), LLM semantic, behavioral dataflow, cloud scanning
- Cisco AI Security Framework taxonomy mapping (AITech-1.1 through AITech-12.1+)
- Meta-analyzer for false positive reduction
- Pre-commit hook via standard pre-commit framework
- SARIF output for GitHub Code Scanning
- Configurable scan policies with presets
- Plugin architecture for custom analyzers
- REST API server mode
- Supports `--lenient` for non-standard formats (Claude Code commands, etc.)

---

## Processes

None directly extractable. The scanning is a standalone CLI tool, not a multi-step orchestration pattern.

## Plugin Ideas

### 1. Skill Scanning Integration Plugin

- **Category**: Security & Sandboxing
- **Plugin name**: `skill-scanner` (or combine with snyk/agent-scan into a unified `skill-security` plugin)
- **Description**: Integrates Cisco skill-scanner into the babysitter plugin lifecycle for pre-install and CI/CD skill vetting.
- **install.md approach**: Check for `uv`/`cisco-ai-skill-scanner` availability, configure scan policy, add hooks
- **Key features**:
  - Pre-install scanning with configurable scan policy (strict/balanced/permissive presets)
  - Pre-commit hook integration via babysitter's hook system (maps to `pre-commit` hook type)
  - Cisco AI threat taxonomy (AITech codes) mapped to babysitter breakpoint severity levels
  - LLM-as-a-judge mode for semantic analysis of suspicious skill content
  - SARIF report generation for CI/CD pipelines
  - REST API mode for integration with babysitter's MCP server
- **Integration surface**: hooks (`pre-plugin-install`, `pre-commit`), commands (`plugin:scan`), breakpoint rules

### 2. Threat Taxonomy as Breakpoint Rules

- **Category**: Security & Sandboxing
- **Description**: The Cisco AI Security Framework taxonomy (AITech-1.x through AITech-12.x) provides a structured threat classification that could inform babysitter's breakpoint auto-approval rules. Map threat categories to breakpoint tags for automatic rejection of skills with critical findings.
- **Mapping example**:
  - AITech-1.x (Prompt Injection) -> `never-auto-approve` breakpoint rule
  - AITech-8.x (Data Privacy) -> `never-auto-approve` breakpoint rule
  - AITech-9.x (Supply Chain) -> `never-auto-approve` breakpoint rule
  - Lower severity -> standard breakpoint prompt

## Comparison with snyk/agent-scan

Both tools serve similar purposes. Key differences:
- Cisco: multi-engine (static + LLM + behavioral + cloud), configurable scan policies, plugin architecture for custom analyzers, REST API mode
- Snyk: simpler single-engine approach, requires Snyk API token, broader agent discovery (more harness support), toxic flow analysis
- **Recommendation**: A unified `skill-security` babysitter plugin could wrap either/both, with a configurable backend. The threat taxonomies from both are complementary.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| N/A | N/A | No extractable processes - scanning is a standalone CLI tool, not multi-step orchestration | - | N/A |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Skill Security Scanner | UPGRADE | Enhanced security scanning with multi-engine detection and threat taxonomy | basic-security | plugins/a5c/marketplace/plugins/skill-security-scanner/ |
| AI Threat Taxonomy Integration | NEW | Cisco AI Security Framework taxonomy for breakpoint auto-approval rules | - | plugins/a5c/marketplace/plugins/ai-threat-taxonomy/ |

## Skipped

- The eval SKILL.md files are scanner test fixtures, not real skills
- The pre-commit hook is Python-specific; babysitter hooks are JS-based
