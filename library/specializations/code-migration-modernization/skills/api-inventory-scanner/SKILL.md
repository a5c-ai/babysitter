---
name: api-inventory-scanner
description: Discover and document existing API endpoints from code, logs, and traffic analysis
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# API Inventory Scanner Skill

Discovers and documents existing API endpoints through code analysis, log inspection, and traffic analysis.

## Purpose

Enable API discovery for:
- Endpoint discovery
- Request/response format extraction
- Authentication method detection
- Rate limit identification
- Consumer mapping

## Capabilities

### 1. Endpoint Discovery
- Parse route definitions
- Analyze controller code
- Inspect API frameworks
- Find undocumented endpoints

### 2. Request/Response Format Extraction
- Extract request schemas
- Document response formats
- Identify query parameters
- Map headers and cookies

### 3. Authentication Method Detection
- Identify auth mechanisms
- Document token formats
- Map permission requirements
- Catalog security schemes

### 4. Rate Limit Identification
- Find rate limit configurations
- Document throttling rules
- Identify quotas
- Map limit tiers

### 5. Consumer Mapping
- Identify API consumers
- Track usage patterns
- Map client dependencies
- Document integrations

### 6. Usage Pattern Analysis
- Analyze access logs
- Identify hot endpoints
- Track response times
- Map error rates

## Tool Integrations

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| Swagger Inspector | Traffic capture | GUI |
| Postman | Collection building | API |
| Code parsers | Route extraction | CLI |
| Log analyzers | Traffic analysis | CLI |
| APM tools | Usage metrics | API |

## Output Schema

```json
{
  "scanId": "string",
  "timestamp": "ISO8601",
  "endpoints": [
    {
      "path": "string",
      "method": "string",
      "description": "string",
      "parameters": [],
      "requestBody": {},
      "responses": {},
      "authentication": "string",
      "rateLimit": {},
      "consumers": [],
      "metrics": {}
    }
  ],
  "summary": {
    "totalEndpoints": "number",
    "documented": "number",
    "undocumented": "number"
  }
}
```

## Integration with Migration Processes

- **api-modernization**: API inventory
- **integration-migration**: Integration mapping

## Related Skills

- `openapi-generator`: Spec generation
- `api-compatibility-analyzer`: Version analysis

## Related Agents

- `api-modernization-architect`: API design
