# fajarhide/omni

- **Archetype**: clawhub-plugin
- **Stars**: 49
- **Last pushed**: 2026-04-12
- **License**: MIT
- **Discovered**: 2026-04-12
- **Language**: Rust
- **Fork**: No

## Summary

OMNI is a Rust-based terminal output filter that intercepts command output before it reaches the AI agent, removing noise and preserving signal. Claims up to 90% token reduction. Integrates via native hooks (pre-hook rewriter, post-hook distiller, session-start context, pre-compact summary) into Claude Code, OpenClaw, and MCP agents.

Core architecture: Registry (TOML filter definitions per tool) -> Scorer (context boost) -> Distiller (semantic filtering). Persistence via SQLite for session state and a "RewindStore" that archives raw output for on-demand retrieval. Ships with 35+ tool-specific filter definitions (vitest, jest, eslint, tsc, cargo, docker, kubectl, terraform, etc.) in TOML format.

Key features: DSL-based filter configuration (capture/action/output templates), session intelligence (tracks active files to avoid redundant context), RewindStore for lossless raw output access, `omni stats` / `omni diff` for token savings visualization.

## Assessment

HIGH extractable value. OMNI's approach to token compression via tool-specific output filtering is directly relevant to babysitter's existing compression layer (`packages/sdk/src/compression/`). The TOML filter registry pattern, capture/action DSL, and RewindStore concept are all adaptable. The 35+ pre-built filter definitions for common dev tools are immediately useful.

**Extraction priority**: HIGH

# Extractable Value: fajarhide/omni

## Processes

None -- OMNI is a tool, not a workflow. Its value is entirely in plugin patterns.

## Plugin Ideas

### 1. Smart Output Filter Plugin
- **Category**: Context & Memory
- **install.md**: Installs a hook-based output filter that intercepts tool execution results before they enter the agent context. Uses a TOML-based filter registry with per-tool definitions (capture patterns, action rules, output templates). Includes a RewindStore that archives raw output for on-demand retrieval when the agent needs full detail. Ships with pre-built filters for 35+ common dev tools (vitest, jest, eslint, tsc, cargo, docker, kubectl, terraform, npm, pip, etc.).

### 2. Token Savings Dashboard Plugin
- **Category**: Developer Experience & UX
- **install.md**: Adds `babysitter compression:stats` enhancement showing per-tool token savings over time. Tracks raw vs filtered output sizes, calculates cost savings, provides `diff` visualization comparing raw output to filtered version. Persists metrics in SQLite for historical analysis.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| N/A | N/A | No multi-step processes identified - OMNI is a tool, not a workflow | - | N/A |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Smart Output Filter | NEW | Hook-based output filter with TOML registry and RewindStore for lossless compression | - | plugins/a5c/marketplace/plugins/smart-output-filter/ |
| Token Savings Dashboard | NEW | Compression stats enhancement with per-tool metrics and cost visualization | - | plugins/a5c/marketplace/plugins/token-savings-dashboard/ |

## Implicit Procedural Knowledge

- **TOML filter registry pattern**: Each dev tool gets its own TOML file defining capture patterns, confidence scores, and output templates. This is a clean, extensible pattern for babysitter's compression layer -- currently babysitter uses a density-filter engine with FNV-1a dedup, but OMNI's approach of tool-specific semantic filtering could complement it.
- **DSL capture/action/output model**: The `omni_config.json` shows a simple but powerful DSL: `trigger` (fast string match), `capture` (template extraction with named fields), `action` (keep/count), `output` (template with extracted fields). This could inform a babysitter plugin API for custom compression rules.
- **RewindStore pattern**: Archive raw output, serve filtered output by default, allow on-demand raw access. Prevents information loss while still saving tokens. Directly relevant to babysitter's `compress-output` command.
- **Session intelligence**: Tracking which files are actively being edited to avoid feeding the agent context it already knows. This is a form of deduplication that goes beyond babysitter's current FNV-1a approach.
