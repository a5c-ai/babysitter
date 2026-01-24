# SOAP to REST Converter Skill

## Overview

The SOAP to REST Converter skill modernizes SOAP web services to REST APIs. It parses WSDL documents and generates RESTful endpoint designs.

## Quick Start

### Prerequisites

- WSDL document
- Understanding of operations
- REST design principles

### Basic Usage

1. **Parse WSDL**
   - Extract operations
   - Map data types
   - Identify endpoints

2. **Design REST resources**
   - Map operations to methods
   - Design URI structure
   - Model resources

3. **Generate implementation**
   - Create OpenAPI spec
   - Implement endpoints
   - Set up adapters

## Features

### Operation Mapping

| SOAP Pattern | REST Equivalent |
|--------------|-----------------|
| getUser | GET /users/{id} |
| createUser | POST /users |
| updateUser | PUT /users/{id} |
| deleteUser | DELETE /users/{id} |
| listUsers | GET /users |

### Type Conversions

- XML complex types -> JSON objects
- XML arrays -> JSON arrays
- XSD types -> JSON Schema
- Enumerations -> enums

## Configuration

```json
{
  "source": {
    "wsdl": "./service.wsdl"
  },
  "target": {
    "format": "openapi-3.0",
    "output": "./rest-api"
  },
  "options": {
    "preserveOperationNames": false,
    "generateExamples": true,
    "authMigration": "oauth2"
  }
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
