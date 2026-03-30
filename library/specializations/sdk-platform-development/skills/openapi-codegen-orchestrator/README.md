# OpenAPI Codegen Orchestrator Skill

## Overview

The `openapi-codegen-orchestrator` skill provides comprehensive orchestration of multi-language SDK generation from OpenAPI specifications. It enables consistent, high-quality SDK production across TypeScript, Python, Java, Go, and other programming ecosystems.

## Quick Start

### Prerequisites

1. **Node.js** - v18 or later
2. **OpenAPI Generator CLI** - npm or Docker
3. **OpenAPI Specification** - Version 3.x

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

Install OpenAPI Generator:

```bash
# npm (recommended)
npm install -g @openapitools/openapi-generator-cli

# Docker alternative
docker pull openapitools/openapi-generator-cli
```

## Usage

### Basic Operations

```bash
# Generate single language SDK
/skill openapi-codegen-orchestrator generate --spec openapi.yaml --language typescript

# Generate all configured languages
/skill openapi-codegen-orchestrator generate-all --spec openapi.yaml

# Validate generated SDK
/skill openapi-codegen-orchestrator validate --sdk ./sdks/typescript --language typescript

# Apply post-processing
/skill openapi-codegen-orchestrator post-process --sdk ./sdks/typescript --language typescript
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(openApiCodegenTask, {
  operation: 'generate-all',
  specPath: './openapi.yaml',
  languages: ['typescript', 'python', 'java', 'go'],
  outputDir: './sdks'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Multi-Language Generation** | Generate SDKs for 15+ languages |
| **Custom Templates** | Use Mustache templates for customization |
| **Post-Processing** | Apply transformations after generation |
| **Validation** | Compile and lint generated code |
| **Extension Handling** | Process custom OpenAPI extensions |
| **CI/CD Integration** | GitHub Actions workflow support |
| **Version Management** | Track generator and SDK versions |

## Examples

### Example 1: TypeScript SDK Generation

```bash
openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-axios \
  -o ./sdks/typescript \
  --additional-properties=npmName=@company/api-client \
  --additional-properties=supportsES6=true \
  --additional-properties=withInterfaces=true
```

### Example 2: Multi-Language Configuration

```yaml
# openapi-generator-config.yaml
generatorConfigs:
  typescript-axios:
    generatorName: typescript-axios
    output: ./sdks/typescript
    additionalProperties:
      npmName: "@company/api-client"
      supportsES6: true

  python:
    generatorName: python
    output: ./sdks/python
    additionalProperties:
      packageName: company_api_client

  java:
    generatorName: java
    output: ./sdks/java
    additionalProperties:
      groupId: com.company.api
      artifactId: api-client
```

### Example 3: CI/CD Pipeline

```yaml
name: Generate SDKs

on:
  push:
    paths: ['openapi.yaml']

jobs:
  generate:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        language: [typescript, python, java, go]
    steps:
      - uses: actions/checkout@v4
      - name: Generate SDK
        run: |
          npx @openapitools/openapi-generator-cli generate \
            -i openapi.yaml \
            -g ${{ matrix.language }} \
            -o ./sdks/${{ matrix.language }}
```

### Example 4: Custom Templates

```mustache
{{! templates/typescript/apiInner.mustache }}
{{#operations}}
{{#operation}}
/**
 * {{summary}}
 */
public async {{operationId}}(
  {{#allParams}}{{paramName}}{{^required}}?{{/required}}: {{{dataType}}}{{^-last}}, {{/-last}}{{/allParams}}
): Promise<{{{returnType}}}> {
  return this.request('{{httpMethod}}', '{{path}}', { {{#allParams}}{{paramName}}{{^-last}}, {{/-last}}{{/allParams}} });
}
{{/operation}}
{{/operations}}
```

## Configuration

### Generator Properties by Language

| Language | Key Properties |
|----------|----------------|
| **TypeScript** | npmName, supportsES6, withInterfaces |
| **Python** | packageName, projectName, generateSourceCodeOnly |
| **Java** | groupId, artifactId, library, dateLibrary |
| **Go** | packageName, isGoSubmodule, generateInterfaces |
| **C#** | packageName, targetFramework, library |

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAPI_SPEC` | Path to OpenAPI spec | `./openapi.yaml` |
| `OUTPUT_DIR` | SDK output directory | `./sdks` |
| `GENERATOR_VERSION` | OpenAPI Generator version | `latest` |

## Process Integration

### Processes Using This Skill

1. **sdk-code-generation-pipeline.js** - Main generation workflow
2. **multi-language-sdk-strategy.js** - Language configurations
3. **package-distribution.js** - SDK publishing
4. **backward-compatibility-management.js** - Version tracking

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const generateSDKsTask = defineTask({
  name: 'generate-sdks',
  description: 'Generate SDKs from OpenAPI specification',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: 'Generate Multi-Language SDKs',
      skill: {
        name: 'openapi-codegen-orchestrator',
        context: {
          operation: 'generate-all',
          specPath: inputs.specPath,
          languages: inputs.languages,
          config: inputs.generatorConfig
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## Supported Generators

| Generator | Language | Notes |
|-----------|----------|-------|
| typescript-axios | TypeScript | Axios HTTP client |
| typescript-fetch | TypeScript | Fetch API |
| python | Python | sync/async support |
| java | Java | Multiple HTTP libraries |
| go | Go | Native HTTP client |
| csharp | C# | .NET support |
| rust | Rust | reqwest client |
| kotlin | Kotlin | Coroutines support |
| swift5 | Swift | iOS/macOS |
| ruby | Ruby | Gem packaging |

## MCP Server Reference

### mcp-openapi-schema

Explore OpenAPI schemas through natural language.

**Features:**
- Schema exploration
- Path discovery
- Parameter analysis
- Response modeling

**Documentation:** https://github.com/hannesj/mcp-openapi-schema

### swagger-mcp

Analyze large OpenAPI specifications.

**Features:**
- Large API support
- Private API authentication
- Schema validation

**Documentation:** https://github.com/johnneerdael/swagger-mcp

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Unknown generator` | Check generator name spelling |
| `Template not found` | Verify templateDir path |
| `Invalid spec` | Run spec validation first |
| `Memory error` | Increase Node.js heap size |

### Debug Mode

Enable verbose output:

```bash
openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-axios \
  -o ./sdks/typescript \
  --verbose
```

## Related Skills

- **typescript-sdk-specialist** - TypeScript-specific SDK patterns
- **python-sdk-specialist** - Python SDK development
- **api-diff-analyzer** - Detect breaking API changes
- **semver-analyzer** - Semantic versioning

## References

- [OpenAPI Generator](https://openapi-generator.tech/)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [Generator Templates](https://openapi-generator.tech/docs/templating)
- [Azure SDK Guidelines](https://azure.github.io/azure-sdk/)
- [Stainless SDK Platform](https://www.stainless.com/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-SDK-001
**Category:** SDK Code Generation
**Status:** Active
