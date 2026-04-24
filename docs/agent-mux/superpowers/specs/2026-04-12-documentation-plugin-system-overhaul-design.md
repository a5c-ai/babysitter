---
name: documentation-plugin-system-overhaul
description: Fix documentation accuracy, implement plugin/MCP command separation, and add automated link checking
type: design
---

# Documentation and Plugin System Overhaul

## Overview

This design addresses multiple documentation quality issues and implements a proper separation between plugin management and MCP server management in the agent-mux CLI system.

## Problems Being Solved

1. **Outdated Installation Instructions**: Agent docs show direct npm installation instead of `amux install`
2. **Misleading Plugin Management**: Current docs conflate plugins with MCP servers
3. **Broken Links**: Links are broken on docs homepage and throughout documentation  
4. **No Link Monitoring**: No automated prevention of broken links in future changes
5. **Command Structure Confusion**: `amux plugins` actually manages MCPs, not true plugins

## Approach: Infrastructure-First

**Sequence:**
1. Set up automated link checking in CI (mlc integration)
2. Implement new plugin/MCP command structure  
3. Update all documentation systematically
4. Update specs and tests

**Why this approach**: Link checking prevents introducing new broken links during extensive doc updates, and proper command implementation guides accurate documentation.

## Design

### 1. Automated Link Checking Infrastructure

**CI Integration:**
- Add `mlc` (Markup Link Checker) GitHub Action to the docs CI workflow
- Configure to run on all PRs and main branch pushes that touch documentation
- Set to fail builds on broken links (strict mode)

**Configuration:**
- Create `.mlcconfig` file to:
  - Exclude external domains that frequently timeout (optional allowlist approach)
  - Set timeout values appropriate for CI
  - Configure to check both markdown files and generated HTML

**Docs Build Integration:**
- Ensure the docs build treats broken links as errors
- This ensures local development catches broken links before CI

**Testing Strategy:**
- Test against current documentation to establish baseline broken links
- Fix any existing broken links as prerequisite
- Add mlc check to local development workflow (`npm run link-check`)

**Expected Outcome:** Any documentation changes will automatically be validated for broken links, preventing regression during extensive documentation updates.

### 2. Plugin/MCP Command Structure Implementation

**New Command Architecture:**
- **`amux mcp`** - Manage Model Context Protocol servers per agent
- **`amux plugin`** - Manage full plugins through agent-native systems

**MCP Commands (Rename existing `amux plugins`):**

```bash
# Global MCP management
amux mcp list <agent>                    # List installed MCPs for agent
amux mcp install <agent> <mcp-server>    # Install MCP server for agent
amux mcp uninstall <agent> <mcp-server>  # Remove MCP server for agent

# Project-level MCP management (new)
amux mcp list <agent> --project         # List project-specific MCPs
amux mcp install <agent> <mcp-server> --project  # Install to project scope
```

**Note**: MCP commands will require additional implementation beyond the basic commands shown above. The full MCP command API design (including configuration management, enable/disable states, and config file handling) will be detailed in a separate technical specification during implementation.

**Plugin Commands (New - delegate to native harness commands):**

```bash
amux plugin list <agent>                 # Calls: claude plugins list, gemini extensions list, etc.
amux plugin install <agent> <plugin>     # Calls: claude plugins install <plugin>, etc.
amux plugin enable <agent> <plugin>      # Calls: claude plugins enable <plugin>, etc.  
amux plugin disable <agent> <plugin>     # Calls: claude plugins disable <plugin>, etc.
amux plugin marketplace <agent> [cmd]    # Calls: claude plugins marketplace [cmd], etc.
```

**Agent Plugin System Support:**
- **Claude**: Full plugin system with marketplace
- **Gemini**: Extension system for prompts, MCP servers, commands, themes, hooks
- **Codex**: Plugin directory with @plugin-creator skill
- **Cursor**: Hook support (Claude Code compatible), MCP-only CLI  
- **GitHub Copilot**: GitHub Copilot CLI plugin marketplace with agents/skills/hooks/MCP packages
- **OpenCode**: Three-tier extensibility (skills/agents/plugins)

**Error Handling:**
For agents without native plugin systems, return clear error: "Plugin management not supported for `{agent}`. Use 'amux mcp' for MCP servers."

### 3. Systematic Documentation Updates

**Installation Instructions (All Agent Docs):**
Replace direct npm installs with:
```bash
# Before:
npm install -g @anthropic-ai/claude-code

# After:  
amux install claude
```

**Plugin Management Sections (All Agent Docs):**
Replace existing incorrect MCP-focused sections with agent-appropriate content:

```bash
# For agents WITH native plugin systems (Claude, Gemini, Cursor, etc.):
amux plugin install <agent> <plugin>
amux plugin list <agent>
amux plugin marketplace <agent>

# For MCP servers (all agents):
amux mcp install <agent> <mcp-server>
amux mcp list <agent>
```

**New Sections to Add:**
- Clear distinction between "Plugins" vs "MCP Servers" in each agent doc
- Examples showing both plugin installation and MCP server installation
- Links to agent-specific plugin marketplaces where available

**Agent-Specific Variations:**
- **Claude/Copilot/Cursor**: Full plugin ecosystem documentation
- **Gemini**: Extension-focused language and examples
- **OpenCode**: Three-tier system explanation (skills/agents/plugins)
- **Agents without plugin systems**: MCP-only documentation, clear explanation of limitations

**Scope:** Update all 12 agent documentation files plus any tutorial/reference docs that mention installation or plugin management.

### 4. Specs and Tests Updates

**Specification Updates:**
- Document `amux mcp` command API with all configuration nuances
- Document `amux plugin` command delegation patterns per agent
- Update CLI reference documentation with new command structure
- Create decision matrix: when to use plugins vs MCP servers
- Update TypeScript interfaces for new command structures
- Document agent capability detection (supports plugins vs MCP-only)
- Specify error handling patterns for unsupported operations

**Test Coverage:**

**Unit Tests:**
- Test `amux mcp` command variations (global/project scopes, configurations)
- Test `amux plugin` delegation to each agent's native commands
- Test error handling for agents without plugin support
- Test command parsing and argument validation

**Integration Tests:**
- Test actual delegation to `claude plugins`, `gemini extensions`, etc.
- Test MCP configuration file manipulation (global vs project)
- Test graceful failures when agent CLIs are not installed

**Documentation Tests:**
- Automated link checking in CI (using mlc)
- Test that all installation examples use `amux install` format
- Validate plugin vs MCP distinction in all agent docs

## Success Criteria

1. **Zero broken links** in documentation with automated prevention
2. **Clear separation** between plugins and MCP servers in CLI and docs
3. **Consistent installation instructions** across all agent documentation
4. **Working plugin delegation** to each agent's native plugin system
5. **Comprehensive test coverage** for new command structures
6. **Updated specifications** reflecting new architecture

## Implementation Notes

- **No backward compatibility** - existing `amux plugins` commands will be replaced entirely
- **MCP configuration complexity** will require detailed technical specification during implementation (configuration file formats, enable/disable states, global vs project scoping)
- **Agent capability detection** will check for native plugin command availability (e.g., test if `claude plugins --help` succeeds) to determine plugin vs MCP-only support
- **Link checking integration** must not significantly slow CI pipeline

## Dependencies

- **mlc (Markup Link Checker)** for automated link validation
- **Native agent CLIs** must be installed for plugin command delegation to work
- **Agent-specific plugin systems** vary significantly in capabilities and command structure
