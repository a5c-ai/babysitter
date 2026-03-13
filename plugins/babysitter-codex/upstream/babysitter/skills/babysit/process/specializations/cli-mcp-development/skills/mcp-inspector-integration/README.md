# MCP Inspector Integration Skill

Set up MCP Inspector for debugging and testing MCP servers with protocol inspection.

## Overview

This skill configures MCP Inspector integration for debugging MCP servers, enabling request/response logging, protocol validation, and test scenario execution.

## When to Use

- Debugging MCP server communication
- Testing tool and resource handlers
- Inspecting protocol messages
- Validating MCP implementation

## Quick Start

```json
{
  "serverPath": "dist/index.js",
  "transport": "stdio",
  "logging": true
}
```

## Features

- Inspector configuration
- Debug logging setup
- Test scenario generation
- Protocol validation

## Integration with Processes

| Process | Integration |
|---------|-------------|
| mcp-server-monitoring-debugging | Debug setup |
| mcp-server-testing-suite | Test scenarios |
| mcp-tool-implementation | Tool testing |
