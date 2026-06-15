# omarshahine/Apple-PIM-Agent-Plugin

- **Archetype**: clawhub-plugin
- **Stars**: 3
- **Last pushed**: 2026-04-12
- **License**: MIT
- **Discovered**: 2026-04-12
- **Language**: Swift + Node.js
- **Fork**: No

## Summary

Native macOS integration for Calendar, Reminders, Contacts, and Mail using EventKit, Contacts, and JXA frameworks. Dual-platform: works with Claude Code (via MCP server) and OpenClaw (via native tool registration). Swift CLIs handle native API calls; Node.js handles MCP/plugin integration.

Features: calendar CRUD with recurrence rules and attendees (CalDAV), reminder management, contact management with birthday support, Mail.app integration (read/search/send/reply with attachments), batch operations, per-domain enable/disable, multi-agent isolation via per-call config overrides.

Plugin architecture: Swift CLIs built via `setup.sh` -> MCP server wraps CLI calls -> Claude Code plugin.json registers the MCP server. Also ships as an OpenClaw plugin and a Claude Code marketplace plugin.

## Assessment

MEDIUM extractable value. The dual-platform plugin pattern (same Swift CLIs, different integration layers for Claude Code vs OpenClaw) is a clean architecture reference. The MCP server wrapping native CLI tools is a reusable pattern. The PIM domain itself is relevant for a babysitter Tools Integration plugin. Per-domain enable/disable and multi-agent isolation are good plugin design patterns.

**Extraction priority**: MEDIUM

# Extractable Value: omarshahine/Apple-PIM-Agent-Plugin

## Processes

None -- PIM integration is a plugin concern, not a process.

## Plugin Ideas

### 1. Apple PIM Integration Plugin
- **Category**: Tools Integration
- **install.md**: Installs Swift CLI tools for Calendar, Reminders, Contacts, and Mail access on macOS. Wraps them in an MCP server for agent integration. Supports per-domain enable/disable (calendar, reminders, contacts, mail independently), batch operations, and multi-agent isolation via per-call config overrides. Requires macOS 13.0+, Swift 5.9+, and granting Privacy & Security permissions.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| N/A | N/A | No multi-step processes identified - PIM integration is a plugin concern, not a process | - | N/A |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Apple PIM Integration | NEW | macOS Calendar/Reminders/Contacts/Mail integration with per-domain controls | - | plugins/a5c/marketplace/blueprints/apple-pim-integration/ |

## Implicit Procedural Knowledge

- **Dual-platform plugin architecture**: Same native CLI tools, different integration layers (MCP for Claude Code, native tool registration for OpenClaw). This pattern allows a single babysitter plugin to support multiple harnesses with minimal duplication.
- **MCP server wrapping native CLIs**: The MCP server spawns Swift CLI processes and translates results. This is a reusable pattern for any babysitter plugin that needs to wrap native/system tools.
- **Per-domain enable/disable**: Each functional domain (calendar, reminders, contacts, mail) can be independently enabled or disabled. Good pattern for plugins with multiple capabilities.
- **Multi-agent isolation**: Per-call config/profile overrides for workspace isolation. Relevant for babysitter's multi-run environments.
