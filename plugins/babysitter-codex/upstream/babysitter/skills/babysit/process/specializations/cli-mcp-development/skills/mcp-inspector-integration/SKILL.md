---
name: mcp-inspector-integration
description: Set up MCP Inspector for debugging and testing MCP servers with request logging, response inspection, and protocol validation.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# MCP Inspector Integration

Set up MCP Inspector for debugging and testing MCP servers.

## Capabilities

- Configure MCP Inspector connection
- Set up request/response logging
- Implement protocol debugging
- Create test scenarios
- Generate inspection reports
- Configure development workflows

## Usage

Invoke this skill when you need to:
- Debug MCP server communication
- Test tool and resource handlers
- Inspect protocol messages
- Validate MCP implementation

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| serverPath | string | Yes | Path to MCP server entry |
| transport | string | No | Transport type (stdio, sse) |
| logging | boolean | No | Enable verbose logging |

## Generated Patterns

### Inspector Configuration

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "DEBUG": "mcp:*",
        "NODE_ENV": "development"
      }
    }
  }
}
```

### Debug Wrapper Script

```typescript
#!/usr/bin/env node
import { createServer } from './server';

// Enable debug logging
process.env.DEBUG = 'mcp:*';

// Log all stdin/stdout for debugging
const originalWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk: any, ...args: any[]) => {
  if (process.env.MCP_DEBUG_LOG) {
    const fs = require('fs');
    fs.appendFileSync(
      process.env.MCP_DEBUG_LOG,
      `[OUT] ${new Date().toISOString()} ${chunk}\n`
    );
  }
  return originalWrite(chunk, ...args);
};

process.stdin.on('data', (chunk) => {
  if (process.env.MCP_DEBUG_LOG) {
    const fs = require('fs');
    fs.appendFileSync(
      process.env.MCP_DEBUG_LOG,
      `[IN] ${new Date().toISOString()} ${chunk}\n`
    );
  }
});

// Start server
createServer();
```

### NPM Scripts for Development

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "debug": "MCP_DEBUG_LOG=./debug.log tsx src/index.ts",
    "inspect": "npx @anthropic/mcp-inspector node dist/index.js",
    "test:mcp": "npx @anthropic/mcp-inspector --test node dist/index.js"
  }
}
```

### Test Scenarios

```typescript
// tests/mcp-scenarios.ts
export const testScenarios = [
  {
    name: 'List Tools',
    request: {
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 1,
    },
    validate: (response: any) => {
      return response.result?.tools?.length > 0;
    },
  },
  {
    name: 'Call Tool - search_files',
    request: {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'search_files',
        arguments: { pattern: '*.ts', path: './src' },
      },
      id: 2,
    },
    validate: (response: any) => {
      return !response.error && response.result?.content;
    },
  },
  {
    name: 'List Resources',
    request: {
      jsonrpc: '2.0',
      method: 'resources/list',
      id: 3,
    },
    validate: (response: any) => {
      return Array.isArray(response.result?.resources);
    },
  },
];

// Run test scenarios
export async function runScenarios(
  send: (msg: any) => Promise<any>
): Promise<void> {
  for (const scenario of testScenarios) {
    console.log(`Testing: ${scenario.name}`);
    const response = await send(scenario.request);
    const passed = scenario.validate(response);
    console.log(`  ${passed ? '✓ PASS' : '✗ FAIL'}`);
    if (!passed) {
      console.log('  Response:', JSON.stringify(response, null, 2));
    }
  }
}
```

## Workflow

1. **Install Inspector** - Set up MCP Inspector
2. **Configure connection** - Server path and args
3. **Enable logging** - Debug output
4. **Create scenarios** - Test cases
5. **Run inspection** - Debug session
6. **Generate report** - Inspection results

## Target Processes

- mcp-server-monitoring-debugging
- mcp-server-testing-suite
- mcp-tool-implementation
