# MCP Capability Declarator Skill

Generate MCP capability declarations from tool and resource inventory with proper feature flags.

## Overview

This skill generates MCP server capability declarations, creating the initialization options and feature flags that describe what the server supports.

## When to Use

- Declaring MCP server capabilities
- Generating initialization options
- Documenting supported features
- Setting up capability negotiation

## Quick Start

```json
{
  "serverName": "my-server",
  "version": "1.0.0",
  "tools": [{ "name": "search_files" }],
  "resources": [{ "uri": "file:///" }]
}
```

## Features

- Capability declaration generation
- Initialization options
- Feature flag configuration
- Capability documentation

## Integration with Processes

| Process | Integration |
|---------|-------------|
| mcp-server-bootstrap | Capability setup |
| mcp-tool-implementation | Tool declaration |
| mcp-tool-documentation | Feature documentation |
