# snyk/agent-scan

- **GitHub**: https://github.com/snyk/agent-scan
- **Stars**: 2,108
- **License**: Apache-2.0
- **Last pushed**: 2026-04-10
- **Topics**: agent, ai, mcp, modelcontextprotocol, security
- **Source**: gh-search

## Description

Security scanner for AI agents, MCP servers, and agent skills. Python CLI tool (`snyk-agent-scan`) that auto-discovers installed agent components across multiple harnesses (Claude Code, Cursor, Windsurf, Gemini CLI, Codex, VS Code, etc.) and scans them for prompt injections, tool poisoning, malware payloads, and other security threats. Requires a Snyk API token.

## Archetype

**utility-with-skill** -- A standalone security scanning CLI (not a skill pack or plugin itself), but includes test SKILL.md fixtures and understands the agent skill format for scanning purposes.

## Structure

- `src/agent_scan/` -- Core Python package: CLI, MCP client/server scanning, skill scanning, well-known client definitions
- `tests/skills/` -- 19 test SKILL.md files (pdf, mcp-builder, malicious-skill, frontend-design, etc.) used as scanning fixtures
- `docs/issue-codes.md` -- Reference for 15+ detected issue codes across MCP and Skills categories
- `demoserver/` -- Demo MCP server for testing

## Key Capabilities

- Auto-discovers agents and their MCP servers/skills across macOS, Linux, Windows
- Detects 15+ issue codes: prompt injection (E001, E004), tool poisoning, tool shadowing (E002), malware payloads (E006), credential handling (W007), hardcoded secrets (W008), untrusted content (W015/W016), sensitive data exposure (W017/W018), destructive capabilities (W019/W020), toxic flows
- Parses SKILL.md YAML frontmatter + markdown body for analysis
- Supports `--skills` flag for skill-specific scanning
- SARIF output for CI/CD integration

---

## Processes

None directly extractable. The scanning workflow is a CLI tool, not a multi-step process pattern suitable for babysitter orchestration.

## Plugin Ideas

### 1. Skill Security Scanner Plugin

- **Category**: Security & Sandboxing
- **Plugin name**: `skill-security-scanner`
- **Description**: Integrates Snyk agent-scan (or similar scanning) into the babysitter plugin lifecycle. Runs security scans on skills before installation, on plugin updates, and optionally as a pre-commit hook.
- **install.md approach**: Check for `uvx`/`snyk-agent-scan` availability, configure SNYK_TOKEN, add pre-install hook that scans skill directories
- **Key features**:
  - Pre-install scan: before `plugin:install` completes, scan the skill's SKILL.md and associated files for prompt injection, malware, and credential handling issues
  - Periodic audit: `babysitter plugin:audit` command that scans all installed skills
  - Issue code mapping: translate Snyk issue codes (E001, E004, W007, etc.) into babysitter breakpoint decisions (auto-reject on critical, prompt on warning)
  - SARIF report generation for CI/CD pipelines
- **Integration surface**: hooks (`pre-plugin-install`), commands (`plugin:audit`, `plugin:scan`), breakpoint rules (auto-reject skills with critical findings)

### 2. Threat Taxonomy Reference

- **Not a plugin**, but the issue-codes.md provides a useful reference for what security patterns to watch for in skill/plugin review processes. The toxic flow analysis (untrusted content + private data + internet access) is particularly relevant for babysitter's breakpoint auto-approval system.

## Skipped

- The test SKILL.md fixtures are scanner test data, not real skills to assimilate
- The MCP scanning capabilities are already covered by babysitter's own MCP server infrastructure

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Agent Security Scanning Process | NEW | Auto-discovery and security scanning workflow for AI agents and MCP servers | - | specializations/security/agent-security-scanning.js |
| Threat Taxonomy Classification | NEW | 15+ security issue code classification system for prompt injection and tool poisoning | - | specializations/security/threat-taxonomy-classification.js |
| Auto-Discovery Workflow | NEW | Cross-platform agent component discovery across multiple harnesses | - | specializations/shared/auto-discovery-workflow.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Skill Security Scanner | NEW | Pre-install security scanning with threat detection and breakpoint integration | - | plugins/a5c/marketplace/blueprints/skill-security-scanner/ |
