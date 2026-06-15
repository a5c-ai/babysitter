# MCP Migration Specialist Agent

## Overview

The MCP Migration Specialist handles converting applications from other platforms to the MCP Apps standard. This includes migrating from the OpenAI Apps SDK (which requires a paradigm shift from synchronous globals to async event handlers) and converting existing web applications to hybrid MCP Apps that work both standalone and inside AI chat hosts.

## Key Capabilities

- **OpenAI SDK Migration**: Maps window.openai.* synchronous globals to async App instance event handlers
- **Web App Conversion**: Maps web data sources (URLs, REST, localStorage) to MCP equivalents while preserving standalone mode
- **API Mapping**: Complete mapping tables for every API, metadata key, MIME type, and CSP property
- **Pattern Verification**: Mandatory Before Finishing Checklist with exhaustive regex searches for legacy patterns
- **CORS Configuration**: Sets up cross-origin headers for MCP HTTP transport

## When to Use This Agent

Use the MCP Migration Specialist when:
- Migrating an OpenAI Apps SDK application to MCP Apps
- Converting a web application to work as a hybrid MCP App
- Verifying that a migration is complete (no legacy patterns remain)
- Mapping API calls between platforms
- Configuring CORS for MCP HTTP transport
- Documenting unavailable features and workarounds

## Agent Profile

| Attribute | Value |
|-----------|-------|
| **Role** | MCP Migration Specialist |
| **Primary Focus** | Platform migration and API mapping |
| **Critical Requirement** | Zero remaining legacy references after migration |
| **Verification Method** | Pattern-based search (Before Finishing Checklist) |

## Supported Migration Paths

### OpenAI Apps SDK -> MCP Apps
- Synchronous globals to async event handlers
- Metadata key prefix migration (openai/* -> _meta.ui.*)
- MIME type migration (text/html+skybridge -> RESOURCE_MIME_TYPE)
- CSP property casing (snake_case -> camelCase)

### Web App -> Hybrid MCP App
- Data source mapping to MCP equivalents
- Hybrid initialization with environment detection
- Shared rendering logic between modes
- CSP investigation for external dependencies

## Integration with Processes

| Process | Integration Point |
|---------|------------------|
| migrate-openai-app-to-mcp.js | Phases 3-7: CORS, server migration, client migration, review, verification |
| convert-web-app-to-mcp.js | Phase 2: Analysis, Phase 5: Hybrid initialization |

## References

- [OpenAI Migration Guide](docs/migrate_from_openai_apps.md) (in SDK repository)
- [MCP Apps Specification](https://modelcontextprotocol.io/specification/2026-01-26/server/apps)
- [CORS Configuration](https://modelcontextprotocol.io/docs/concepts/apps/csp#cors)
