---
name: mcp-error-code-mapper
description: Map application errors to MCP error codes with proper messages, error types, and recovery suggestions.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# MCP Error Code Mapper

Map application errors to MCP error codes with proper handling.

## Capabilities

- Map errors to MCP error codes
- Create structured error responses
- Generate error documentation
- Implement error recovery hints
- Configure error serialization
- Create error handler utilities

## Usage

Invoke this skill when you need to:
- Map application errors to MCP errors
- Create structured error responses
- Implement error handling for tools
- Generate error documentation

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| language | string | Yes | Target language |
| errors | array | Yes | Error definitions |
| includeRecovery | boolean | No | Include recovery hints |

### Error Structure

```json
{
  "errors": [
    {
      "name": "FileNotFound",
      "mcpCode": -32002,
      "message": "File not found: {path}",
      "recovery": "Check if the file exists and the path is correct"
    },
    {
      "name": "InvalidInput",
      "mcpCode": -32602,
      "message": "Invalid input: {reason}",
      "recovery": "Review the input parameters and try again"
    }
  ]
}
```

## Generated Patterns

### TypeScript Error Mapper

```typescript
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// Standard MCP Error Codes
export const MCP_ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  // Custom codes (-32000 to -32099)
  FILE_NOT_FOUND: -32001,
  PERMISSION_DENIED: -32002,
  RESOURCE_NOT_FOUND: -32003,
  VALIDATION_ERROR: -32004,
} as const;

// Error with recovery hint
interface McpErrorWithRecovery extends McpError {
  data?: {
    recovery?: string;
    details?: unknown;
  };
}

// Error factory functions
export function fileNotFoundError(path: string): McpErrorWithRecovery {
  return {
    code: MCP_ERROR_CODES.FILE_NOT_FOUND,
    message: `File not found: ${path}`,
    data: {
      recovery: 'Check if the file exists and the path is correct',
      details: { path },
    },
  };
}

export function invalidParamsError(reason: string): McpErrorWithRecovery {
  return {
    code: MCP_ERROR_CODES.INVALID_PARAMS,
    message: `Invalid parameters: ${reason}`,
    data: {
      recovery: 'Review the input parameters and try again',
    },
  };
}

// Error handler wrapper
export function handleToolError(error: unknown): McpErrorWithRecovery {
  if (error instanceof Error) {
    // Map known error types
    if (error.message.includes('ENOENT')) {
      return fileNotFoundError(error.message);
    }
    if (error.message.includes('EACCES')) {
      return {
        code: MCP_ERROR_CODES.PERMISSION_DENIED,
        message: `Permission denied: ${error.message}`,
        data: { recovery: 'Check file permissions' },
      };
    }
    // Fallback to internal error
    return {
      code: MCP_ERROR_CODES.INTERNAL_ERROR,
      message: error.message,
    };
  }
  return {
    code: MCP_ERROR_CODES.INTERNAL_ERROR,
    message: 'An unexpected error occurred',
  };
}
```

### Python Error Mapper

```python
from enum import IntEnum
from typing import Any, Optional
from dataclasses import dataclass

class McpErrorCode(IntEnum):
    PARSE_ERROR = -32700
    INVALID_REQUEST = -32600
    METHOD_NOT_FOUND = -32601
    INVALID_PARAMS = -32602
    INTERNAL_ERROR = -32603
    # Custom codes
    FILE_NOT_FOUND = -32001
    PERMISSION_DENIED = -32002
    RESOURCE_NOT_FOUND = -32003

@dataclass
class McpError(Exception):
    code: int
    message: str
    recovery: Optional[str] = None
    details: Optional[Any] = None

    def to_dict(self) -> dict:
        result = {'code': self.code, 'message': self.message}
        if self.recovery or self.details:
            result['data'] = {}
            if self.recovery:
                result['data']['recovery'] = self.recovery
            if self.details:
                result['data']['details'] = self.details
        return result

def file_not_found_error(path: str) -> McpError:
    return McpError(
        code=McpErrorCode.FILE_NOT_FOUND,
        message=f'File not found: {path}',
        recovery='Check if the file exists and the path is correct',
        details={'path': path}
    )

def handle_tool_error(error: Exception) -> McpError:
    error_msg = str(error)
    if 'FileNotFoundError' in type(error).__name__:
        return file_not_found_error(error_msg)
    if 'PermissionError' in type(error).__name__:
        return McpError(
            code=McpErrorCode.PERMISSION_DENIED,
            message=f'Permission denied: {error_msg}',
            recovery='Check file permissions'
        )
    return McpError(
        code=McpErrorCode.INTERNAL_ERROR,
        message=error_msg
    )
```

## Workflow

1. **Define errors** - List application errors
2. **Map codes** - Assign MCP error codes
3. **Create messages** - User-friendly messages
4. **Add recovery** - Recovery suggestions
5. **Generate handlers** - Error handling code
6. **Document errors** - Error documentation

## Target Processes

- mcp-tool-implementation
- mcp-server-security-hardening
- error-handling-user-feedback
