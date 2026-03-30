---
name: mcp-capability-declarator
description: Generate MCP capability declarations from tool and resource inventory with proper versioning and feature flags.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# MCP Capability Declarator

Generate MCP capability declarations from tool/resource inventory.

## Capabilities

- Generate capability declarations from inventory
- Create initialization options
- Set up feature flags
- Implement capability negotiation
- Document server capabilities
- Generate capability tests

## Usage

Invoke this skill when you need to:
- Declare MCP server capabilities
- Generate initialization options
- Document supported features
- Implement capability negotiation

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| serverName | string | Yes | Server name |
| version | string | Yes | Server version |
| tools | array | No | Tool capabilities |
| resources | array | No | Resource capabilities |
| prompts | array | No | Prompt capabilities |

## Generated Patterns

### TypeScript Capability Declaration

```typescript
import { ServerCapabilities, InitializationOptions } from '@modelcontextprotocol/sdk/types.js';

// Server metadata
export const SERVER_INFO = {
  name: 'my-mcp-server',
  version: '1.0.0',
} as const;

// Capability declarations
export const CAPABILITIES: ServerCapabilities = {
  tools: {
    // Tool capabilities
    listChanged: true,
  },
  resources: {
    // Resource capabilities
    subscribe: true,
    listChanged: true,
  },
  prompts: {
    // Prompt capabilities
    listChanged: true,
  },
  logging: {},
};

// Tool definitions
export const TOOL_DEFINITIONS = [
  {
    name: 'search_files',
    description: 'Search for files matching a pattern',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Glob pattern' },
        path: { type: 'string', description: 'Base path' },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'read_file',
    description: 'Read contents of a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path' },
      },
      required: ['path'],
    },
  },
] as const;

// Resource templates
export const RESOURCE_TEMPLATES = [
  {
    uriTemplate: 'file:///{path}',
    name: 'File',
    description: 'Access file contents',
    mimeType: 'text/plain',
  },
] as const;

// Create initialization options
export function createInitializationOptions(): InitializationOptions {
  return {
    serverInfo: SERVER_INFO,
    capabilities: CAPABILITIES,
  };
}

// Capability documentation
export const CAPABILITY_DOCS = `
# ${SERVER_INFO.name} v${SERVER_INFO.version}

## Supported Capabilities

### Tools
${TOOL_DEFINITIONS.map(t => `- **${t.name}**: ${t.description}`).join('\n')}

### Resources
- File access via \`file:///\` URI scheme
- Resource subscription support
- List change notifications

### Prompts
- Dynamic prompt templates
- List change notifications

## Feature Flags
- Tool list change notifications: enabled
- Resource subscriptions: enabled
`;
```

### Python Capability Declaration

```python
from dataclasses import dataclass
from typing import List, Dict, Any

@dataclass
class ServerInfo:
    name: str = "my-mcp-server"
    version: str = "1.0.0"

@dataclass
class ToolDefinition:
    name: str
    description: str
    input_schema: Dict[str, Any]

TOOL_DEFINITIONS: List[ToolDefinition] = [
    ToolDefinition(
        name="search_files",
        description="Search for files matching a pattern",
        input_schema={
            "type": "object",
            "properties": {
                "pattern": {"type": "string"},
                "path": {"type": "string"},
            },
            "required": ["pattern"],
        },
    ),
]

CAPABILITIES = {
    "tools": {"listChanged": True},
    "resources": {"subscribe": True, "listChanged": True},
    "prompts": {"listChanged": True},
    "logging": {},
}

def create_initialization_options() -> dict:
    return {
        "serverInfo": {
            "name": ServerInfo.name,
            "version": ServerInfo.version,
        },
        "capabilities": CAPABILITIES,
    }
```

## Workflow

1. **Inventory tools** - List all tools
2. **Inventory resources** - List all resources
3. **Define capabilities** - Feature flags
4. **Generate declarations** - Capability objects
5. **Create init options** - Initialization
6. **Document capabilities** - API docs

## Target Processes

- mcp-server-bootstrap
- mcp-tool-implementation
- mcp-tool-documentation
