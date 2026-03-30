---
name: soap-to-rest-converter
description: Convert SOAP web services to REST APIs with WSDL parsing and resource modeling
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# SOAP to REST Converter Skill

Converts SOAP web services to REST APIs, handling WSDL parsing, operation mapping, and RESTful resource modeling.

## Purpose

Enable SOAP modernization for:
- WSDL parsing
- Operation-to-endpoint mapping
- Type conversion
- Authentication migration
- REST resource modeling

## Capabilities

### 1. WSDL Parsing
- Parse WSDL documents
- Extract operations
- Map data types
- Identify bindings

### 2. Operation-to-Endpoint Mapping
- Map operations to HTTP methods
- Design resource URIs
- Handle parameters
- Transform responses

### 3. Type Conversion
- Convert XML types to JSON
- Map complex types
- Handle enumerations
- Transform arrays

### 4. Authentication Migration
- Convert WS-Security
- Implement OAuth2
- Migrate certificates
- Handle API keys

### 5. SOAP Envelope Removal
- Strip envelope structure
- Extract body content
- Transform headers
- Handle faults

### 6. REST Resource Modeling
- Design resource hierarchy
- Implement HATEOAS
- Define link relations
- Model collections

## Tool Integrations

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| SOAP UI | WSDL analysis | GUI |
| wsdl2rest | Conversion | CLI |
| Custom transformers | Type mapping | Library |

## Output Schema

```json
{
  "conversionId": "string",
  "timestamp": "ISO8601",
  "source": {
    "wsdl": "string",
    "operations": "number"
  },
  "target": {
    "openapi": "string",
    "endpoints": "number"
  },
  "mappings": [
    {
      "soapOperation": "string",
      "restEndpoint": "string",
      "method": "string",
      "notes": "string"
    }
  ],
  "typeConversions": [],
  "manualReview": []
}
```

## Integration with Migration Processes

- **api-modernization**: SOAP to REST conversion

## Related Skills

- `openapi-generator`: REST spec generation
- `api-inventory-scanner`: Endpoint discovery

## Related Agents

- `api-modernization-architect`: API design
