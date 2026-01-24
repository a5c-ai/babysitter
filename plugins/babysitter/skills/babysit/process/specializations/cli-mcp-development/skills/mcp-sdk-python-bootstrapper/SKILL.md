---
name: mcp-sdk-python-bootstrapper
description: Bootstrap MCP server with Python SDK, transport configuration, tool/resource handlers, and proper project structure.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# MCP SDK Python Bootstrapper

Bootstrap a complete MCP server using the Python SDK with proper project structure.

## Capabilities

- Generate Python MCP server project structure
- Create tool and resource handlers
- Configure stdio/SSE transport layers
- Set up proper typing with Pydantic
- Implement error handling patterns
- Configure Poetry/pip project

## Usage

Invoke this skill when you need to:
- Bootstrap a new MCP server in Python
- Create tools and resources for AI consumption
- Set up MCP transport layer
- Implement MCP protocol handlers

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| projectName | string | Yes | Name of the MCP server project |
| description | string | Yes | Description of the server |
| tools | array | No | List of tools to implement |
| resources | array | No | List of resources to expose |
| transport | string | No | Transport type: stdio, sse (default: stdio) |

### Tool Structure

```json
{
  "tools": [
    {
      "name": "search_files",
      "description": "Search for files matching a pattern",
      "parameters": {
        "pattern": { "type": "string", "description": "Search pattern" },
        "path": { "type": "string", "description": "Base path", "default": "." }
      }
    }
  ]
}
```

## Output Structure

```
<projectName>/
├── pyproject.toml
├── README.md
├── .gitignore
├── src/
│   └── <package>/
│       ├── __init__.py
│       ├── __main__.py        # Entry point
│       ├── server.py          # MCP server setup
│       ├── tools/
│       │   ├── __init__.py
│       │   └── search.py      # Tool implementations
│       ├── resources/
│       │   ├── __init__.py
│       │   └── files.py       # Resource providers
│       └── types/
│           ├── __init__.py
│           └── schemas.py     # Pydantic models
└── tests/
    └── test_tools.py
```

## Generated Code Patterns

### Server Setup (src/<package>/server.py)

```python
import asyncio
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, Resource

from .tools import register_tools
from .resources import register_resources

# Create server instance
server = Server("<projectName>")

# Register handlers
register_tools(server)
register_resources(server)

async def main():
    """Run the MCP server."""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )

def run():
    """Entry point for the server."""
    asyncio.run(main())
```

### Tool Implementation (src/<package>/tools/search.py)

```python
from typing import Any
from pydantic import BaseModel, Field
from mcp.server import Server
from mcp.types import Tool, TextContent

class SearchFilesInput(BaseModel):
    """Input schema for search_files tool."""
    pattern: str = Field(description="Search pattern (glob)")
    path: str = Field(default=".", description="Base path to search")

def register(server: Server) -> None:
    """Register the search_files tool."""

    @server.list_tools()
    async def list_tools() -> list[Tool]:
        return [
            Tool(
                name="search_files",
                description="Search for files matching a pattern",
                inputSchema=SearchFilesInput.model_json_schema()
            )
        ]

    @server.call_tool()
    async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
        if name != "search_files":
            raise ValueError(f"Unknown tool: {name}")

        # Validate input
        input_data = SearchFilesInput(**arguments)

        # Execute search
        from pathlib import Path
        matches = list(Path(input_data.path).glob(input_data.pattern))

        return [
            TextContent(
                type="text",
                text="\n".join(str(m) for m in matches)
            )
        ]
```

### Resource Provider (src/<package>/resources/files.py)

```python
from mcp.server import Server
from mcp.types import Resource, TextResourceContents

def register(server: Server) -> None:
    """Register file resources."""

    @server.list_resources()
    async def list_resources() -> list[Resource]:
        return [
            Resource(
                uri="file:///config",
                name="Configuration",
                description="Server configuration",
                mimeType="application/json"
            )
        ]

    @server.read_resource()
    async def read_resource(uri: str) -> TextResourceContents:
        if uri == "file:///config":
            return TextResourceContents(
                uri=uri,
                mimeType="application/json",
                text='{"version": "1.0.0"}'
            )
        raise ValueError(f"Unknown resource: {uri}")
```

## Dependencies

```toml
[tool.poetry.dependencies]
python = ">=3.10"
mcp = "^1.0.0"
pydantic = "^2.0.0"

[tool.poetry.group.dev.dependencies]
pytest = "^8.0.0"
pytest-asyncio = "^0.23.0"
```

## Workflow

1. **Create project structure** - Set up Python package
2. **Generate server** - MCP server with transport
3. **Create tools** - Tool handlers with schemas
4. **Create resources** - Resource providers
5. **Add types** - Pydantic models
6. **Set up tests** - Async test fixtures

## Target Processes

- mcp-server-bootstrap
- mcp-tool-implementation
- mcp-resource-provider
