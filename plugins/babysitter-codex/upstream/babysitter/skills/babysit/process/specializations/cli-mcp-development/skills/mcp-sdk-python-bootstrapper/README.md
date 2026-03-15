# MCP SDK Python Bootstrapper Skill

Bootstrap MCP servers using the Python SDK with tools, resources, and proper project structure.

## Overview

This skill automates the creation of MCP (Model Context Protocol) servers using the official Python SDK, generating a complete project structure with tools, resources, and transport configuration.

## When to Use

- Creating a new MCP server in Python
- Implementing tools for AI consumption
- Setting up MCP resources
- Configuring MCP transport layer

## Quick Start

```json
{
  "projectName": "my-mcp-server",
  "description": "MCP server for file operations",
  "tools": [
    {
      "name": "search_files",
      "description": "Search for files",
      "parameters": {
        "pattern": { "type": "string" }
      }
    }
  ]
}
```

## Features

- Python MCP SDK integration
- Tool and resource handlers
- Pydantic schemas for validation
- Async/await patterns
- pytest-asyncio testing

## Integration with Processes

| Process | Integration |
|---------|-------------|
| mcp-server-bootstrap | Python MCP server setup |
| mcp-tool-implementation | Tool handlers |
| mcp-resource-provider | Resource providers |
