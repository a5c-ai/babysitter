# MCP Error Code Mapper Skill

Map application errors to MCP error codes with structured responses and recovery hints.

## Overview

This skill generates error mapping code for MCP servers, converting application errors to standardized MCP error codes with helpful messages.

## When to Use

- Mapping application errors to MCP errors
- Creating structured error responses
- Implementing error handling for tools
- Adding recovery suggestions

## Quick Start

```json
{
  "language": "typescript",
  "errors": [
    {
      "name": "FileNotFound",
      "mcpCode": -32002,
      "message": "File not found: {path}",
      "recovery": "Check if the file exists"
    }
  ]
}
```

## Features

- MCP error code mapping
- Recovery hint generation
- Error serialization
- Handler utilities

## Integration with Processes

| Process | Integration |
|---------|-------------|
| mcp-tool-implementation | Error handling |
| mcp-server-security-hardening | Error sanitization |
| error-handling-user-feedback | Error messages |
