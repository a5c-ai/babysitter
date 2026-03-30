---
name: python-sdk-specialist
description: Python SDK development with async support and type hints
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Python SDK Specialist Skill

## Overview

This skill specializes in developing Pythonic SDKs with full type hint support, async/await capabilities, and modern Python best practices for Python 3.8+ compatibility.

## Capabilities

- Design Pythonic SDK architecture following PEP guidelines
- Implement async/await with aiohttp, httpx, or asyncio
- Configure comprehensive type hints with mypy validation
- Support Python 3.8+ with proper compatibility handling
- Implement context managers for resource management
- Design intuitive API surfaces following Python conventions
- Configure packaging for PyPI distribution
- Implement proper logging and debugging support

## Target Processes

- Multi-Language SDK Strategy
- SDK Architecture Design
- SDK Testing Strategy

## Integration Points

- PyPI package registry
- pytest for testing
- mypy for type checking
- httpx/aiohttp for HTTP clients
- pydantic for data validation
- poetry/setuptools for packaging

## Input Requirements

- API specification (OpenAPI, GraphQL, or custom)
- Target Python version range
- Async requirements
- Type strictness level
- Packaging preferences (poetry vs setuptools)

## Output Artifacts

- Python SDK package source code
- Type stub files (.pyi) if needed
- pytest test suite
- pyproject.toml configuration
- Documentation (Sphinx-ready)
- Example scripts

## Usage Example

```yaml
skill:
  name: python-sdk-specialist
  context:
    apiSpec: ./openapi.yaml
    pythonVersion: ">=3.8"
    asyncSupport: true
    typeHints: strict
    httpClient: httpx
    packageManager: poetry
```

## Best Practices

1. Follow PEP 8 style guide
2. Use type hints throughout (PEP 484, 585)
3. Implement both sync and async interfaces
4. Use context managers for connections
5. Provide comprehensive docstrings (Google style)
6. Support optional dependencies properly
