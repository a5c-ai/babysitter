# Setup Guide

Complete instructions for installing, building, and configuring the Breakpoints Mux system.

## Prerequisites

- **Node.js 22+** -- Required. The project uses modern ES module syntax and Node.js APIs that require version 22 or later. Check your version with `node --version`.
- **npm** -- Comes bundled with Node.js.

## Installation

Clone or obtain the repository, then install all workspace dependencies from the root:

```bash
cd breakpointsMux
npm install
```

This installs dependencies for all five packages (`shared`, `sdk`, `server`, `cli`, `mcp-tool`) via npm workspaces.

## Building

The project uses TypeScript 5.7+ with project references. Build all packages at once:

```bash
npm run build
# or equivalently:
npx tsc --build
```

This compiles the `@a5c-ai/breakpoints-mux` package (types, SDK, CLI, MCP tools, auth).

To clean build artifacts:

```bash
npm run clean
```

## Running Tests

The test suite uses Vitest. Run all 325 tests across all packages:

```bash
npm test
```

Watch mode for development:

```bash
npm run test:watch
```

Type-check without emitting JS:

```bash
npm run typecheck
```

## Server Setup

### Starting the server

Using the CLI:

```bash
bmux server start
```

Or directly with Node:

```bash
node packages/server/dist/index.js
```

The server starts on port **3847** by default. Override with the `-p` flag or `PORT` environment variable:

```bash
bmux server start -p 4000
# or
PORT=4000 node packages/server/dist/index.js
```

### Verifying the server

```bash
curl http://localhost:3847/api/v1/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2026-03-10T12:00:00.000Z",
  "questionCount": 0
}
```

### Server features

- **In-memory question store** -- Questions are stored in memory. Restarting the server clears all data.
- **SSE push notifications** -- Clients can subscribe to `/api/v1/questions/:id/events` for real-time answer notifications.
- **Automatic expiration sweep** -- A background task periodically marks expired questions (past their `expiresAt` timestamp).
- **CORS enabled** -- All origins are allowed by default.
- **Request logging** -- Every request is logged to stdout with timestamp, method, and URL.

## Expert Profile Creation

### Directory structure

Expert profiles are stored as JSON files in `.a5c/expert/`:

```
.a5c/
  expert/
    schema.json              # JSON Schema for profile validation
    frontend-expert.json     # Example: frontend expert
    backend-expert.json      # Example: backend expert
    devops-expert.json       # Example: DevOps expert
```

### Creating a new profile

1. Choose an ID (lowercase slug, e.g., `security-expert`).
2. Create `.a5c/expert/security-expert.json`:

```json
{
  "id": "security-expert",
  "name": "Sam Rivera",
  "title": "Application Security Engineer",
  "expertiseAreas": [
    {
      "domain": "security",
      "topics": ["OAuth 2.0", "JWT", "OWASP", "encryption", "penetration testing"],
      "keywords": ["auth", "vulnerability", "CVE", "token", "certificate"],
      "proficiency": 5
    }
  ],
  "availability": true,
  "responseTimeSla": 1800000
}
```

3. Verify the profile loads correctly:

```bash
bmux responders show security-expert
```

### Profile schema reference

The full JSON Schema is at `.a5c/expert/schema.json`. Required fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Must match the filename (without `.json`). |
| `name` | string | Display name. |
| `title` | string | Professional title. |
| `expertiseAreas` | array | At least one expertise area with `domain`, `topics`, `keywords`, and `proficiency` (1-5). |
| `availability` | boolean | Whether the expert is currently accepting questions. |
| `responseTimeSla` | number | Expected max response time in milliseconds. |

Optional fields:

| Field | Type | Description |
|-------|------|-------------|
| `sessionConfig` | object | Arbitrary key-value pairs (timezone, schedule, concurrency limits). |

## Claude Code Plugin Installation

To make the MCP tools available to Claude Code, add the tool server to your Claude Code MCP configuration.

### Option 1: Project-level configuration

Add to your project's `.claude/mcp.json` (or equivalent):

```json
{
  "mcpServers": {
    "breakpoints-mux": {
      "command": "node",
      "args": ["packages/mcp-tool/dist/index.js"]
    }
  }
}
```

### Option 2: With environment overrides

If the server runs on a non-default URL or the expert directory is elsewhere:

```json
{
  "mcpServers": {
    "breakpoints-mux": {
      "command": "node",
      "args": ["packages/mcp-tool/dist/index.js"],
      "env": {
        "BPX_SERVER_URL": "http://localhost:4000/api/v1",
        "BPX_EXPERT_DIR": "/path/to/experts",
        "BPX_TIMEOUT_MS": "600000"
      }
    }
  }
}
```

### Verifying the tools are available

Once configured, Claude Code should expose four tools:

| Tool | Description |
|------|-------------|
| `submit_breakpoint` | Route questions to domain experts and wait for answers. |
| `list_responders` | List available experts and their expertise areas. |
| `check_breakpoint_status` | Check status of a previously submitted question. |
| `cancel_breakpoint` | Cancel a question that is no longer needed. |

## Configuration Options

### Environment variables

All configuration can be set via environment variables. These are read by both the CLI and the MCP tool.

| Variable | Description | Default |
|----------|-------------|---------|
| `BPX_SERVER_URL` | Base URL of the BMUX server (including `/api/v1` path) | `http://localhost:3847/api/v1` |
| `SERVER_URL` | Alias for `BPX_SERVER_URL` | -- |
| `BPX_EXPERT_DIR` | Path to the directory containing expert profile JSON files | `.a5c/expert` |
| `EXPERT_DIR` | Alias for `BPX_EXPERT_DIR` | -- |
| `BPX_TIMEOUT_MS` | Default timeout for waiting for answers, in milliseconds | `1800000` (30 minutes) |
| `PORT` | Port the server listens on (server package only) | `3847` |

### CLI global options

These apply to all `bmux` subcommands:

| Option | Description | Default |
|--------|-------------|---------|
| `--server-url <url>` | Server URL (without `/api/v1` -- the CLI appends it) | `http://localhost:3847` |
| `--json` | Output in JSON format for scripting | `false` |
| `--expert-dir <path>` | Directory containing expert profiles | `.a5c/expert` |

### Constants

Defined in `@a5c-ai/breakpoints-mux`:

| Constant | Value | Description |
|----------|-------|-------------|
| `DEFAULT_PORT` | `3847` | Default server port |
| `DEFAULT_TIMEOUT_MS` | `1800000` | Default question timeout (30 min) |
| `DEFAULT_POLL_INTERVAL_MS` | `5000` | Default polling interval (5 sec) |
| `API_BASE_PATH` | `/api/v1` | Base path for all API endpoints |
