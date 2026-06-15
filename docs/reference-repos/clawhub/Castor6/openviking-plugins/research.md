# Castor6/openviking-plugins

- **Archetype**: clawhub-plugin
- **Stars**: 7
- **Last pushed**: 2026-04-12
- **License**: Apache-2.0
- **Discovered**: 2026-04-12
- **Language**: JavaScript
- **Fork**: No

## Summary

Memory auto-recall and auto-capture plugin for Claude Code powered by OpenViking (VolcEngine's vector database). Provides transparent, cross-session, semantic memory through three mechanisms:

1. **Auto-Recall** (User Prompt Hook): Before every user message, relevant memories are silently injected into the agent's context via semantic search.
2. **Auto-Capture** (Stop Hook): After every response, new knowledge is automatically extracted and stored.
3. **MCP Tools**: On-demand memory operations (search, store, delete, health check) for explicit control.

Requires OpenViking server (Python) with VolcEngine embedding API (doubao-embedding-vision-251215). Uses both Claude Code hooks and MCP server integration.

## Assessment

MEDIUM extractable value. The auto-recall/auto-capture hook pattern is a clean reference for transparent memory systems. The architecture (hooks for automatic behavior + MCP for explicit control) is a good dual-interface pattern. However, tight coupling to VolcEngine's API limits direct reuse. The pattern of hook-driven memory capture is the key transferable concept.

**Extraction priority**: MEDIUM

# Extractable Value: Castor6/openviking-plugins

## Processes

None -- memory is always a plugin in babysitter, never a process.

## Plugin Ideas

### 1. Transparent Memory Plugin (Auto-Recall/Auto-Capture)
- **Category**: Context & Memory
- **install.md**: Installs hook-driven transparent memory that automatically captures knowledge after each agent response (stop hook) and silently injects relevant memories before each user message (user-prompt hook). Also provides MCP tools for explicit memory operations (search, store, delete, health). Requires a vector database backend. The dual-interface pattern (hooks for automatic + MCP for explicit) ensures both transparent operation and user control.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| N/A | N/A | No multi-step processes identified - memory systems are plugin architecture, not processes | - | N/A |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Transparent Memory Plugin | UPGRADE | Enhanced auto-recall/auto-capture beyond existing claude-mem functionality | plugins/a5c/marketplace/blueprints/claude-mem/ | plugins/a5c/marketplace/blueprints/transparent-memory/ |

## Implicit Procedural Knowledge

- **Hook-driven auto-recall/auto-capture pattern**: Using user-prompt-submit hook for recall (inject relevant memories before the agent sees the message) and stop hook for capture (extract new knowledge after the agent responds). This is the simplest transparent memory architecture and maps directly to babysitter's hook system (13 hook types including `on-iteration-start` and `on-iteration-end`).
- **Dual-interface pattern**: Automatic behavior via hooks + explicit control via MCP tools. Users get transparency by default but can override with direct commands. Good pattern for any babysitter plugin with both automatic and on-demand capabilities.
