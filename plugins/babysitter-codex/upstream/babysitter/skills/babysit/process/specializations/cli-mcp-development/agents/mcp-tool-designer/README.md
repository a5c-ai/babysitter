# MCP Tool Designer Agent

Expert in designing AI-consumable MCP tool schemas and descriptions that AI models can understand and use effectively.

## Overview

The MCP Tool Designer agent specializes in creating tool definitions that are optimized for AI consumption. It ensures tools have clear schemas, effective descriptions, and intuitive interfaces that enable AI models to use them correctly.

## When to Use

- Designing new MCP tool schemas
- Improving existing tool descriptions
- Reviewing tool definitions for AI compatibility
- Creating consistent tool sets
- Optimizing for AI discoverability

## Expertise Areas

### Schema Design

The agent advises on:
- JSON Schema structure and constraints
- Type selection and validation
- Required vs optional parameters
- Default value strategies
- Nested object design

### Description Writing

Expertise in:
- AI-optimized language
- Behavior documentation
- Limitation disclosure
- Context for tool selection

### Tool Organization

Focus on:
- Naming conventions
- Tool grouping patterns
- CRUD consistency
- Versioning strategies

## Interaction Examples

### Tool Review

**Input:**
```json
{
  "name": "search",
  "description": "Search",
  "inputSchema": {
    "type": "object",
    "properties": {
      "q": { "type": "string" }
    }
  }
}
```

**Agent Response:**
```
This tool definition needs significant improvement for AI usability:

Issues:
1. Name is too vague - what are we searching?
2. Description doesn't explain behavior
3. Parameter name 'q' is unclear
4. No constraints or validation

Improved version:

{
  "name": "search_knowledge_base",
  "description": "Search the knowledge base for relevant documents using semantic similarity. Returns the 10 most relevant documents with titles, snippets, and relevance scores. Use when the user asks questions that might be answered by stored documentation.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Natural language search query. More specific queries yield better results.",
        "minLength": 3,
        "maxLength": 500
      },
      "category": {
        "type": "string",
        "description": "Filter results by category",
        "enum": ["technical", "business", "support", "all"],
        "default": "all"
      },
      "limit": {
        "type": "integer",
        "description": "Maximum results to return",
        "minimum": 1,
        "maximum": 50,
        "default": 10
      }
    },
    "required": ["query"]
  }
}
```

### Description Improvement

**Input:**
```
Help me write a description for a tool that reads files from the filesystem.
```

**Agent Response:**
```
Here's an AI-optimized description:

"Read the contents of a file from the allowed project directories.
Returns file content as UTF-8 text for text files, or base64-encoded
string for binary files. Use when the user asks to see, analyze, or
work with specific files.

Supports: source code, configuration files, documentation, and data files.
Limitations: Maximum file size 10MB. Cannot access files outside project
directory or follow symbolic links to external locations."

Key elements included:
1. What it does: Reads file contents
2. Output format: UTF-8 or base64
3. When to use: User wants to see/analyze files
4. Capabilities: Types of files supported
5. Limitations: Size and path restrictions
```

### Tool Set Design

**Input:**
```
I need tools for managing a todo list application.
```

**Agent Response:**
```
Here's a consistent CRUD tool set for todo management:

1. create_todo
   - Required: title
   - Optional: description, due_date, priority, tags
   - Returns: Created todo with ID

2. list_todos
   - Optional: status (pending/completed/all), priority, tag, limit
   - Returns: Array of todos sorted by due date

3. get_todo
   - Required: id
   - Returns: Full todo details

4. update_todo
   - Required: id
   - Optional: Any field to update
   - Returns: Updated todo

5. complete_todo (convenience method)
   - Required: id
   - Returns: Updated todo with status=completed

6. delete_todo
   - Required: id
   - Returns: Success confirmation

Design principles applied:
- Consistent naming: verb_noun pattern
- list/get separation for collections vs single items
- Convenience method for common action
- Partial updates supported
- Minimal required fields
```

## Best Practices

### Naming

| Pattern | Example | Use Case |
|---------|---------|----------|
| verb_noun | search_documents | Actions |
| get_noun | get_user_profile | Retrieval |
| list_nouns | list_repositories | Collections |
| create/update/delete | create_task | CRUD |

### Descriptions

Structure: `[Action]. [Output]. [When to use]. [Limitations].`

Example:
```
Query the PostgreSQL database with a read-only SQL statement.
Returns results as JSON array with columns as keys.
Use when user needs to retrieve or analyze data.
Limited to SELECT; max 1000 rows; 30 second timeout.
```

### Parameter Design

| Principle | Example |
|-----------|---------|
| Descriptive names | `user_email` not `e` |
| Appropriate types | `enum` for fixed options |
| Sensible defaults | `limit: 20` |
| Clear constraints | `minLength`, `maximum` |

### Error Messages

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Todo with ID 'xyz' not found",
    "suggestion": "Use list_todos to find valid IDs"
  }
}
```

## Integration

The MCP Tool Designer agent integrates with:

| Process | Role |
|---------|------|
| mcp-tool-implementation | Schema and description design |
| mcp-tool-documentation | Documentation generation |
| mcp-server-bootstrap | Initial tool set design |

## References

- [MCP Tool Documentation](https://modelcontextprotocol.io/docs/tools)
- [JSON Schema](https://json-schema.org/)
- [OpenAI Function Calling Guide](https://platform.openai.com/docs/guides/function-calling)
- [Anthropic Tool Use](https://docs.anthropic.com/en/docs/tool-use)
