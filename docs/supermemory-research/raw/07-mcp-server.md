# Supermemory MCP Server

Sources: https://supermemory.ai/docs/supermemory-mcp/introduction, https://supermemory.ai/docs/supermemory-mcp/setup, https://github.com/supermemoryai/supermemory/tree/main/apps/mcp

## Overview

Supermemory MCP Server 4.0 provides AI assistants with persistent memory across conversations through the Model Context Protocol. Built on Cloudflare Workers with Durable Objects for scalable, persistent connections.

## Core Tools

The MCP server exposes these tools:

1. **addMemory** -- Save information about the user with optional project scoping
2. **search** -- Search memories and get user profile with flexible queries
3. **getProjects** -- List available projects
4. **whoAmI** -- Returns authenticated user details (userId, email, session info)

## Authentication

### OAuth (Primary)

Automatic discovery via `/.well-known/oauth-protected-resource`. The MCP client handles authorization and prompts for login automatically.

### API Key (Alternative)

Bearer tokens prefixed with `sm_` passed through Authorization headers. Get keys from app.supermemory.ai.

## Installation

### Quick Install

```bash
npx -y install-mcp@latest https://mcp.supermemory.ai/mcp --client claude --oauth=yes
```

Substitute client name (cursor, windsurf, vscode, etc.) for "claude".

### Manual Configuration

Add the server URL `https://mcp.supermemory.ai/mcp` to your MCP client's configuration file.

## Project Scoping

Add `x-sm-project` header to scope all operations to a specific project, keeping memories organized by project.

## Supported Clients

- Claude Desktop
- Cursor IDE
- Windsurf
- VS Code with AI extensions
- Cline/Roo-Cline
- Claude Code
- OpenCode
- OpenClaw
- Hermes

## Technical Architecture

- Cloudflare Workers infrastructure
- Durable Objects for persistent session state
- SQLite for data persistence
- Hono framework for request handling
- PostHog integration for analytics

## Security

Complete user data separation per account. Open-source code for transparency.
