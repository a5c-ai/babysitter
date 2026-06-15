# steipete/gogcli

- **Archetype**: utility-with-skill
- **Stars**: 6,804
- **Last pushed**: 2026-03-13
- **License**: NOASSERTION
- **Discovered**: 2026-04-12
- **Source**: ClawHub skills (published as "steipete/gog")
- **Skills found**: 0 SKILL.md (Go CLI; AGENTS.md present)
- **Fork**: No

## Summary

Full-featured Google Workspace CLI by steipete (OpenClaw co-founder). Covers Gmail, Calendar, Chat, Classroom, Drive, Docs, Slides, Sheets, Forms, Apps Script, Contacts, Tasks, People, Admin, Groups, and Keep. Written in Go with Homebrew and AUR distribution. JSON-first output designed for agent consumption. Supports multiple Google accounts, OAuth/service accounts, and command allowlists for sandboxed agent use.

Published on ClawHub as "gog" (~153k downloads). The CLI itself is the tool; the SKILL.md is likely auto-generated or hosted on ClawHub separately.

Notable features for babysitter context:
- Command allowlists for sandboxed/agent runs (security boundary)
- Multi-account credential management via OS keyring
- Email open tracking via Cloudflare Worker
- Comprehensive Google API coverage in a single binary

## Assessment

HIGH extractable value. Google Workspace integration is a universal developer need. The CLI's design as an agent-friendly tool (JSON output, command allowlists, sandboxed execution) makes it ideal as a babysitter plugin. The multi-account, multi-service pattern is a template for other SaaS integration plugins.

**Extraction priority**: HIGH

# Extractable Value: steipete/gogcli

## Processes

### 1. Email Triage and Response Workflow
- **Source**: Gmail search/send/label/filter capabilities + email tracking
- **Placement**: `specializations/shared/email-triage-workflow.js`
- **Description**: Multi-step process for agent-assisted email management: search inbox with criteria -> categorize by priority/topic -> draft responses for review -> apply labels/filters -> track open rates. Uses breakpoints for human approval before sending.

### 2. Calendar Conflict Resolution
- **Source**: Calendar free/busy, conflicts, propose-new-times features
- **Placement**: `specializations/shared/calendar-conflict-resolution.js`
- **Description**: Process for resolving scheduling conflicts: fetch events in range -> detect conflicts -> check free/busy across attendees -> propose alternative times -> create/update events after approval. Breakpoint before each calendar mutation.

### 3. Document Generation Pipeline
- **Source**: Docs/Slides create, import Markdown, export, template generation
- **Placement**: `specializations/shared/google-docs-generation-pipeline.js`
- **Description**: Process for generating Google Docs/Slides from structured data: prepare Markdown content -> import to Google Docs -> apply template styling -> export as PDF/HTML -> share with permissions. Useful for automated report generation.

## Plugin Ideas

### 1. Google Workspace Integration Plugin
- **Category**: Tools Integration
- **install.md**: Installs gogcli binary (brew/cargo/npm), configures OAuth credentials via guided flow, sets up command allowlist for safe agent execution. Provides hooks for email notifications on run completion, calendar-based scheduling for babysitter runs, and Drive-based artifact storage. Supports multi-account switching.

### 2. Agent Sandbox Command Allowlist Plugin
- **Category**: Security
- **install.md**: Extracts the allowlist pattern from gogcli (restricting which CLI subcommands an agent can invoke) and generalizes it as a babysitter plugin. Configures per-tool allowlists that the harness enforces. Useful for any CLI tool where the agent should only access a subset of commands.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Email Triage and Response Workflow | NEW | Agent-assisted email management with search, categorization, drafting, and tracking | - | specializations/shared/email-triage-workflow.js |
| Calendar Conflict Resolution | NEW | Scheduling conflict detection and resolution with free/busy checking and alternative times | - | specializations/shared/calendar-conflict-resolution.js |
| Google Docs Generation Pipeline | NEW | Document generation from Markdown to Google Docs with templating and export | - | specializations/shared/google-docs-generation-pipeline.js |
| Multi-Account Credential Management | NEW | Multiple service account management with credential isolation via OS keyring | - | specializations/shared/multi-account-credential-management.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Google Workspace Integration | NEW | Comprehensive Google Workspace CLI with OAuth, multi-account, and command allowlists | - | plugins/a5c/marketplace/blueprints/google-workspace-integration/ |
| Agent Sandbox Command Allowlist | UPGRADE | Generalized command allowlist pattern beyond existing basic-security | plugins/a5c/marketplace/blueprints/basic-security/ | plugins/a5c/marketplace/blueprints/agent-sandbox-command-allowlist/ |

## Implicit Procedural Knowledge

- **Agent-friendly CLI design pattern**: JSON-first output, command allowlists for sandboxed execution, credential isolation via OS keyring. This is a reference implementation for how CLI tools should be designed to work with AI agents.
- **Multi-account credential management**: The pattern of supporting multiple Google accounts with aliases and per-client OAuth buckets is relevant for any plugin that needs to manage multiple service credentials.
- **Conventional Commits + PR workflow**: The AGENTS.md documents a thorough PR landing process (temp branch, squash, changelog, thanks) that could inform a process for automated PR management.
