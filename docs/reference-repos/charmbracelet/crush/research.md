# charmbracelet/crush

- **Archetype**: harness-framework
- **Stars**: 22,930
- **Last pushed**: 2026-04-13
- **License**: NOASSERTION (undetermined)
- **Discovered**: 2026-04-13
- **Source**: successor to archived opencode-ai/opencode
- **Skills found**: 0 (harness framework)

## Summary
Terminal-based AI assistant with TUI interface, multi-provider support, and MCP extensibility. Successor to OpenCode, developed by Charmbracelet team with "glamorous agentic coding for all." Features LSP integration, cross-platform support (macOS, Linux, Windows, Android, BSDs), and comprehensive Model Context Protocol support across stdio, HTTP, and SSE transports.

## Assessment
HIGH VALUE for harness assimilation - modern terminal AI interface with sophisticated MCP integration and skill system. Active development with 22K+ stars indicates strong community adoption. However, lack of stop hooks limits full babysitter integration potential.

## Extraction Priority
- High
- Rationale: Active successor to OpenCode with modern architecture and strong MCP support. TUI patterns and session management valuable for babysitter observer dashboard improvements.

## Harness Integration Ideas

**Capability Assessment for Babysitter Integration:**

| Capability | Status | Details |
|------------|---------|---------|
| **Custom Tools/MCP** | ✅ EXCELLENT | Comprehensive MCP support (stdio, HTTP, SSE transports), built-in tool disabling, environment variable expansion, per-tool configuration |
| **Stop Hooks** | ❌ NOT SUPPORTED | Session-based architecture with LSP integration but **no interruption hooks documented** for mid-conversation stopping |
| **Plugin System** | ✅ EXCELLENT | Agent Skills system following agentskills.io standard, discoverable SKILL.md folders, configurable skill paths, anthropics/skills integration |

**Integration Viability:** PARTIAL - Excellent MCP integration and skills system but **lacks critical stop-hook capability** for babysitter's orchestration loop interruption needs.

- **Harness Adapter**: New harness integration for Crush platform
  - Adapter implementation: `createCrushAdapter` in `packages/sdk/src/harness/adapters/`
  - Plugin structure: `plugins/babysitter-crush/` for Charmbracelet Crush integration
  - CLI integration: Terminal UI patterns, session management, MCP server orchestration
  - Current limitation: **No stop hooks for conversation interruption**
  - Integration approach: Custom conversation pause/resume mechanism required
  - Implementation scope: Terminal UI adaptation, MCP protocol bridging, session state management

## TUI/Orchestration Improvements

- **Terminal Interface Patterns**: Adapt Crush's glamorous TUI design for babysitter observer dashboard
  - Current limitation: Basic terminal output vs. polished TUI experience
  - Integration approach: Import Charmbracelet's TUI libraries and design patterns
  - Implementation scope: Observer dashboard visual enhancement, terminal UI modernization

- **Session Management**: Multi-context session architecture for project-specific agent state
  - Current limitation: Single-context babysitter runs vs. multi-session capability
  - Integration approach: Implement session switching and context isolation
  - Implementation scope: Run directory organization, session state persistence

## Implicit Procedural Knowledge

None - framework rather than process repository.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| TUI Design Patterns | NEW | Charmbracelet-style terminal interface patterns | - | specializations/developer-experience-ux/tui-design-patterns.js |
| Multi-Session Management | NEW | Context isolation and session switching methodology | - | specializations/shared/multi-session-management.js |
| MCP Transport Orchestration | NEW | Multi-transport MCP server management | - | specializations/devops-sre-platform/mcp-transport-orchestration.js |
| Cross-Platform Terminal Adaptation | NEW | Terminal interface adaptation across platforms | - | specializations/shared/cross-platform-terminal.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Crush Harness Adapter | NEW | Charmbracelet Crush integration for babysitter | - | plugins/a5c/marketplace/plugins/crush-harness-adapter/ |
| Glamorous TUI Enhancement | NEW | Charmbracelet-style TUI improvements for observer dashboard | - | plugins/a5c/marketplace/plugins/glamorous-tui-enhancement/ |