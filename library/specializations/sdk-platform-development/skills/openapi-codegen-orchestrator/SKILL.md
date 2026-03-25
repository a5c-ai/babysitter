---
name: openapi-codegen-orchestrator
description: Orchestrate multi-language SDK generation from OpenAPI specifications. Configure OpenAPI Generator per language, apply custom templates and post-processing, handle edge cases and custom extensions, and validate generated code compilation.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: sdk-code-generation
  backlog-id: SK-SDK-001
---

# openapi-codegen-orchestrator

You are **openapi-codegen-orchestrator** - a specialized skill for orchestrating multi-language SDK generation from OpenAPI specifications, enabling consistent, high-quality SDK production across diverse programming ecosystems.

## Overview

This skill enables AI-powered SDK code generation including:
- Configuring OpenAPI Generator for multiple target languages
- Applying custom templates and post-processing transformations
- Handling edge cases and OpenAPI extensions
- Validating generated code compilation
- Managing generator versions and compatibility
- Customizing code style per language idioms
- Orchestrating parallel multi-language builds

## Prerequisites

- Node.js 18+ or Java 11+
- OpenAPI Generator CLI (npm or jar)
- OpenAPI 3.x specification file
- Target language toolchains (npm, pip, maven, etc.)
- Docker (optional, for containerized generation)

## Capabilities

### 1. OpenAPI Generator Configuration

Configure OpenAPI Generator for multiple languages:

```yaml
# openapi-generator-config.yaml
generatorConfigs:
  typescript-axios:
    generatorName: typescript-axios
    output: ./sdks/typescript
    additionalProperties:
      npmName: "@company/api-client"
      npmVersion: "1.0.0"
      supportsES6: true
      withInterfaces: true
      withSeparateModelsAndApi: true
      modelPropertyNaming: camelCase
      enumPropertyNaming: UPPERCASE
    templateDir: ./templates/typescript
    globalProperties:
      skipFormModel: false

  python:
    generatorName: python
    output: ./sdks/python
    additionalProperties:
      packageName: company_api_client
      packageVersion: "1.0.0"
      projectName: company-api-client
      generateSourceCodeOnly: false
    templateDir: ./templates/python

  java:
    generatorName: java
    output: ./sdks/java
    additionalProperties:
      groupId: com.company.api
      artifactId: api-client
      artifactVersion: "1.0.0"
      library: native
      useJakartaEe: true
      dateLibrary: java8
      serializationLibrary: jackson
    templateDir: ./templates/java

  go:
    generatorName: go
    output: ./sdks/go
    additionalProperties:
      packageName: apiclient
      packageVersion: "1.0.0"
      isGoSubmodule: true
      generateInterfaces: true
```

### 2. Multi-Language Generation Script

Orchestrate SDK generation across languages:

```javascript
// generate-sdks.js
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import yaml from 'yaml';

const config = yaml.parse(readFileSync('openapi-generator-config.yaml', 'utf8'));
const specPath = process.env.OPENAPI_SPEC || './openapi.yaml';

async function generateSDK(language, langConfig) {
  console.log(`Generating ${language} SDK...`);

  const args = [
    'generate',
    '-i', specPath,
    '-g', langConfig.generatorName,
    '-o', langConfig.output,
    '--skip-validate-spec'
  ];

  // Add additional properties
  if (langConfig.additionalProperties) {
    for (const [key, value] of Object.entries(langConfig.additionalProperties)) {
      args.push('--additional-properties', `${key}=${value}`);
    }
  }

  // Add template directory
  if (langConfig.templateDir) {
    args.push('-t', langConfig.templateDir);
  }

  // Add global properties
  if (langConfig.globalProperties) {
    for (const [key, value] of Object.entries(langConfig.globalProperties)) {
      args.push('--global-property', `${key}=${value}`);
    }
  }

  try {
    execSync(`npx @openapitools/openapi-generator-cli ${args.join(' ')}`, {
      stdio: 'inherit'
    });
    console.log(`Successfully generated ${language} SDK`);
    return { language, status: 'success' };
  } catch (error) {
    console.error(`Failed to generate ${language} SDK:`, error.message);
    return { language, status: 'failed', error: error.message };
  }
}

async function generateAllSDKs() {
  const results = [];

  for (const [language, langConfig] of Object.entries(config.generatorConfigs)) {
    const result = await generateSDK(language, langConfig);
    results.push(result);
  }

  console.log('\n=== Generation Summary ===');
  results.forEach(r => {
    console.log(`${r.language}: ${r.status}`);
  });

  return results;
}

generateAllSDKs();
```

### 3. Custom Template Management

Create and manage custom Mustache templates:

```mustache
{{! templates/typescript/apiInner.mustache }}
{{#operations}}
{{#operation}}
/**
 * {{summary}}
 * {{notes}}
 {{#allParams}}
 * @param {{paramName}} {{description}}
 {{/allParams}}
 * @throws {ApiError} if the request fails
 */
public async {{operationId}}({{#allParams}}{{paramName}}{{^required}}?{{/required}}: {{{dataType}}}{{^-last}}, {{/-last}}{{/allParams}}): Promise<{{{returnType}}}{{^returnType}}void{{/returnType}}> {
  const response = await this.{{operationId}}Raw({{#allParams}}{{paramName}}{{^-last}}, {{/-last}}{{/allParams}});
  {{#returnType}}
  return await response.value();
  {{/returnType}}
}
{{/operation}}
{{/operations}}
```

### 4. Post-Generation Processing

Apply transformations after generation:

```javascript
// post-process.js
import { glob } from 'glob';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const postProcessors = {
  typescript: async (outputDir) => {
    // Add ESLint disable comments for generated code
    const files = await glob(`${outputDir}/**/*.ts`);

    for (const file of files) {
      let content = readFileSync(file, 'utf8');

      // Add header comment
      if (!content.startsWith('/* eslint-disable */')) {
        content = `/* eslint-disable */\n/**\n * Auto-generated by OpenAPI Generator\n * Do not edit manually\n */\n\n${content}`;
      }

      // Fix common issues
      content = content
        .replace(/any\[\]/g, 'unknown[]')  // Replace any[] with unknown[]
        .replace(/: any;/g, ': unknown;'); // Replace any with unknown

      writeFileSync(file, content);
    }

    // Generate barrel exports
    const models = await glob(`${outputDir}/models/*.ts`);
    const exports = models
      .map(f => path.basename(f, '.ts'))
      .filter(n => n !== 'index')
      .map(n => `export * from './${n}';`)
      .join('\n');

    writeFileSync(`${outputDir}/models/index.ts`, exports + '\n');
  },

  python: async (outputDir) => {
    // Fix Python imports and type hints
    const files = await glob(`${outputDir}/**/*.py`);

    for (const file of files) {
      let content = readFileSync(file, 'utf8');

      // Add future annotations for Python 3.8 compatibility
      if (!content.includes('from __future__ import annotations')) {
        content = `from __future__ import annotations\n\n${content}`;
      }

      writeFileSync(file, content);
    }
  },

  java: async (outputDir) => {
    // Add Lombok annotations
    const files = await glob(`${outputDir}/**/model/*.java`);

    for (const file of files) {
      let content = readFileSync(file, 'utf8');

      // Add Lombok imports if not present
      if (!content.includes('lombok')) {
        content = content.replace(
          'package ',
          'import lombok.Builder;\nimport lombok.Data;\n\npackage '
        );
      }

      writeFileSync(file, content);
    }
  }
};

async function runPostProcessing(language, outputDir) {
  if (postProcessors[language]) {
    console.log(`Running post-processing for ${language}...`);
    await postProcessors[language](outputDir);
    console.log(`Post-processing complete for ${language}`);
  }
}
```

### 5. Generated Code Validation

Validate generated SDKs compile and pass linting:

```javascript
// validate-sdks.js
import { execSync } from 'child_process';

const validators = {
  'typescript-axios': {
    install: 'npm install',
    build: 'npm run build',
    lint: 'npm run lint',
    test: 'npm test'
  },
  python: {
    install: 'pip install -e .[dev]',
    build: 'python -m build',
    lint: 'ruff check .',
    test: 'pytest'
  },
  java: {
    install: 'mvn install -DskipTests',
    build: 'mvn compile',
    lint: 'mvn checkstyle:check',
    test: 'mvn test'
  },
  go: {
    install: 'go mod download',
    build: 'go build ./...',
    lint: 'golangci-lint run',
    test: 'go test ./...'
  }
};

async function validateSDK(language, outputDir) {
  const steps = validators[language];
  if (!steps) {
    console.log(`No validator for ${language}`);
    return { language, status: 'skipped' };
  }

  const results = { language, steps: {} };

  for (const [step, command] of Object.entries(steps)) {
    try {
      console.log(`[${language}] Running ${step}...`);
      execSync(command, { cwd: outputDir, stdio: 'inherit' });
      results.steps[step] = 'passed';
    } catch (error) {
      console.error(`[${language}] ${step} failed:`, error.message);
      results.steps[step] = 'failed';
      results.status = 'failed';
      break;
    }
  }

  results.status = results.status || 'passed';
  return results;
}
```

### 6. OpenAPI Extension Handling

Handle custom OpenAPI extensions:

```javascript
// extension-handler.js
const extensionHandlers = {
  'x-sdk-operation-group': (operation, value) => {
    // Group operations into namespaced clients
    operation.operationGroup = value;
  },

  'x-sdk-ignore': (operation, value) => {
    // Skip generation for this operation
    operation.vendorExtensions['x-skip-generation'] = value;
  },

  'x-sdk-paginated': (operation, value) => {
    // Generate pagination helpers
    operation.vendorExtensions['x-pagination'] = {
      enabled: true,
      pageParam: value.pageParam || 'page',
      limitParam: value.limitParam || 'limit',
      resultPath: value.resultPath || 'data'
    };
  },

  'x-sdk-deprecated-date': (operation, value) => {
    // Add deprecation with sunset date
    operation.vendorExtensions['x-deprecation'] = {
      date: value,
      message: `This operation will be removed after ${value}`
    };
  }
};

function processExtensions(spec) {
  // Process path-level extensions
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (typeof operation !== 'object') continue;

      for (const [ext, value] of Object.entries(operation)) {
        if (ext.startsWith('x-sdk-') && extensionHandlers[ext]) {
          extensionHandlers[ext](operation, value);
        }
      }
    }
  }

  return spec;
}
```

### 7. CI/CD Integration

GitHub Actions workflow for SDK generation:

```yaml
name: Generate SDKs

on:
  push:
    paths:
      - 'openapi.yaml'
      - 'templates/**'
  workflow_dispatch:
    inputs:
      languages:
        description: 'Languages to generate (comma-separated or "all")'
        default: 'all'

jobs:
  generate:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        language: [typescript, python, java, go]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup language toolchain
        uses: ./.github/actions/setup-${{ matrix.language }}

      - name: Install OpenAPI Generator
        run: npm install -g @openapitools/openapi-generator-cli

      - name: Generate SDK
        run: |
          openapi-generator-cli generate \
            -i openapi.yaml \
            -g ${{ matrix.language }} \
            -o ./sdks/${{ matrix.language }} \
            -c ./config/${{ matrix.language }}.yaml

      - name: Run post-processing
        run: node scripts/post-process.js ${{ matrix.language }}

      - name: Validate SDK
        run: node scripts/validate-sdk.js ${{ matrix.language }}

      - name: Upload SDK artifact
        uses: actions/upload-artifact@v4
        with:
          name: sdk-${{ matrix.language }}
          path: ./sdks/${{ matrix.language }}

  publish:
    needs: generate
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Download all SDKs
        uses: actions/download-artifact@v4

      - name: Publish SDKs
        run: |
          for sdk in sdk-*; do
            echo "Publishing $sdk..."
            # Language-specific publish commands
          done
```

### 8. Configuration Schema

Validate generator configuration:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "generatorConfigs": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "required": ["generatorName", "output"],
        "properties": {
          "generatorName": {
            "type": "string",
            "enum": ["typescript-axios", "typescript-fetch", "python", "java", "go", "csharp", "rust"]
          },
          "output": { "type": "string" },
          "additionalProperties": { "type": "object" },
          "templateDir": { "type": "string" },
          "globalProperties": { "type": "object" }
        }
      }
    }
  }
}
```

## MCP Server Integration

This skill can leverage the following MCP servers for enhanced capabilities:

| Server | Description | Installation |
|--------|-------------|--------------|
| mcp-openapi-schema | Explore OpenAPI schemas | [GitHub](https://github.com/hannesj/mcp-openapi-schema) |
| openapi-mcp-server | Navigate complex OpenAPIs | [GitHub](https://github.com/janwilmake/openapi-mcp-server) |
| swagger-mcp | Analyze OpenAPI specifications | [GitHub](https://github.com/johnneerdael/swagger-mcp) |

## Best Practices

1. **Version control templates** - Track custom templates in git
2. **Validate specs first** - Run spec linting before generation
3. **Use semantic versioning** - Version SDKs with semver
4. **Automate everything** - CI/CD for generation and publishing
5. **Test generated code** - Include tests in validation
6. **Document customizations** - Explain template changes
7. **Handle deprecations** - Process deprecation extensions
8. **Monitor generation** - Track generation metrics

## Process Integration

This skill integrates with the following processes:
- `sdk-code-generation-pipeline.js` - Main generation workflow
- `multi-language-sdk-strategy.js` - Language-specific configurations
- `api-design-specification.js` - Spec preparation
- `package-distribution.js` - SDK publishing

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "generate",
  "specPath": "./openapi.yaml",
  "specVersion": "3.0.3",
  "generatedSDKs": [
    {
      "language": "typescript",
      "generator": "typescript-axios",
      "outputPath": "./sdks/typescript",
      "status": "success",
      "validation": {
        "compile": "passed",
        "lint": "passed",
        "test": "passed"
      },
      "files": 42,
      "models": 15,
      "apis": 8
    }
  ],
  "duration": "45s",
  "warnings": ["Deprecated endpoint /v1/legacy detected"]
}
```

## Error Handling

- Validate OpenAPI spec before generation
- Handle unsupported features gracefully
- Provide clear error messages for template issues
- Support retry for transient failures
- Log detailed diagnostics for debugging

## Constraints

- OpenAPI Generator version compatibility varies by generator
- Custom templates require maintenance across versions
- Some generators have limited feature support
- Large specs may require memory tuning
- Generated code style may need post-processing
