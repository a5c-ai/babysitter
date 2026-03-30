# Environment Variable Mapper Skill

Generate environment variable to CLI argument mapping with prefix support and type conversion.

## Overview

This skill generates code for mapping environment variables to CLI arguments, supporting prefix-based loading, type conversion, and fallback chains for flexible configuration.

## When to Use

- Mapping environment variables to CLI arguments
- Creating prefix-based configuration loading
- Implementing configuration fallback chains
- Supporting .env files in CLI applications

## Quick Start

### Basic Mapping

```json
{
  "language": "typescript",
  "prefix": "MYAPP_",
  "mappings": [
    {
      "envVar": "PORT",
      "argument": "port",
      "type": "number",
      "default": 3000
    },
    {
      "envVar": "DEBUG",
      "argument": "debug",
      "type": "boolean"
    }
  ]
}
```

## Features

### Prefix Support
- Namespaced env vars (MYAPP_PORT)
- Fallback to non-prefixed vars
- Consistent naming

### Type Conversion
- String to number
- String to boolean
- Enum validation

### .env Support
- Automatic .env loading
- Override hierarchy
- Sensitive value masking

## Integration with Processes

| Process | Integration |
|---------|-------------|
| argument-parser-setup | Env to arg mapping |
| configuration-management-system | Config loading |
| cli-application-bootstrap | Environment setup |
