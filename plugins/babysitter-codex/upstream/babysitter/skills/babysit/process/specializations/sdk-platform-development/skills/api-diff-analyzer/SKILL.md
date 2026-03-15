---
name: api-diff-analyzer
description: Compare API specifications to detect breaking changes. Compare OpenAPI spec versions, categorize changes by severity, generate migration guides, and block breaking changes in CI.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: versioning-compatibility
  backlog-id: SK-SDK-005
---

# api-diff-analyzer

You are **api-diff-analyzer** - a specialized skill for comparing API specifications and detecting breaking changes, ensuring SDK compatibility and safe API evolution.

## Overview

This skill enables AI-powered API diff analysis including:
- Comparing OpenAPI spec versions
- Categorizing changes by severity
- Detecting breaking changes automatically
- Generating migration guides
- Blocking breaking changes in CI
- Supporting multiple spec formats (OpenAPI, GraphQL, gRPC)
- Creating detailed change reports

## Prerequisites

- OpenAPI, GraphQL, or Protobuf specifications
- Version control with spec history
- oasdiff, openapi-diff, or similar tools
- CI/CD pipeline for automated checks

## Capabilities

### 1. OpenAPI Diff Analysis

Compare OpenAPI specifications:

```typescript
// src/analyzer/openapi-diff.ts
import { parseSpec, diffSpecs } from './parser';

interface ApiChange {
  type: 'breaking' | 'non-breaking' | 'info';
  category: string;
  path: string;
  method?: string;
  description: string;
  oldValue?: unknown;
  newValue?: unknown;
  migration?: string;
}

interface DiffResult {
  hasBreakingChanges: boolean;
  changes: ApiChange[];
  summary: {
    breaking: number;
    nonBreaking: number;
    info: number;
  };
  report: string;
}

export async function analyzeApiDiff(
  oldSpec: string,
  newSpec: string,
  options: DiffOptions = {}
): Promise<DiffResult> {
  const oldApi = await parseSpec(oldSpec);
  const newApi = await parseSpec(newSpec);

  const changes: ApiChange[] = [];

  // Analyze paths
  for (const [path, oldPathItem] of Object.entries(oldApi.paths)) {
    const newPathItem = newApi.paths[path];

    if (!newPathItem) {
      changes.push({
        type: 'breaking',
        category: 'endpoint-removed',
        path,
        description: `Endpoint ${path} was removed`,
        migration: `Update SDK to remove calls to ${path}`
      });
      continue;
    }

    // Analyze methods
    for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
      const oldOp = oldPathItem[method];
      const newOp = newPathItem[method];

      if (oldOp && !newOp) {
        changes.push({
          type: 'breaking',
          category: 'method-removed',
          path,
          method,
          description: `${method.toUpperCase()} ${path} was removed`
        });
        continue;
      }

      if (oldOp && newOp) {
        // Check parameters
        analyzeParameters(path, method, oldOp, newOp, changes);

        // Check request body
        analyzeRequestBody(path, method, oldOp, newOp, changes);

        // Check responses
        analyzeResponses(path, method, oldOp, newOp, changes);
      }
    }
  }

  // Check for new endpoints (non-breaking)
  for (const [path, newPathItem] of Object.entries(newApi.paths)) {
    if (!oldApi.paths[path]) {
      changes.push({
        type: 'non-breaking',
        category: 'endpoint-added',
        path,
        description: `New endpoint ${path} was added`
      });
    }
  }

  // Analyze components/schemas
  analyzeSchemas(oldApi.components?.schemas, newApi.components?.schemas, changes);

  const summary = {
    breaking: changes.filter(c => c.type === 'breaking').length,
    nonBreaking: changes.filter(c => c.type === 'non-breaking').length,
    info: changes.filter(c => c.type === 'info').length
  };

  return {
    hasBreakingChanges: summary.breaking > 0,
    changes,
    summary,
    report: generateReport(changes, summary)
  };
}

function analyzeParameters(
  path: string,
  method: string,
  oldOp: Operation,
  newOp: Operation,
  changes: ApiChange[]
): void {
  const oldParams = new Map(oldOp.parameters?.map(p => [p.name, p]) || []);
  const newParams = new Map(newOp.parameters?.map(p => [p.name, p]) || []);

  // Check for removed parameters
  for (const [name, oldParam] of oldParams) {
    if (!newParams.has(name)) {
      changes.push({
        type: oldParam.required ? 'breaking' : 'info',
        category: 'parameter-removed',
        path,
        method,
        description: `Parameter '${name}' was removed from ${method.toUpperCase()} ${path}`,
        oldValue: oldParam
      });
    }
  }

  // Check for new required parameters
  for (const [name, newParam] of newParams) {
    const oldParam = oldParams.get(name);

    if (!oldParam && newParam.required) {
      changes.push({
        type: 'breaking',
        category: 'required-parameter-added',
        path,
        method,
        description: `New required parameter '${name}' added to ${method.toUpperCase()} ${path}`,
        newValue: newParam,
        migration: `Update SDK calls to include '${name}' parameter`
      });
    }

    if (oldParam && !oldParam.required && newParam.required) {
      changes.push({
        type: 'breaking',
        category: 'parameter-required',
        path,
        method,
        description: `Parameter '${name}' is now required in ${method.toUpperCase()} ${path}`,
        oldValue: oldParam,
        newValue: newParam
      });
    }

    // Check type changes
    if (oldParam && oldParam.schema?.type !== newParam.schema?.type) {
      changes.push({
        type: 'breaking',
        category: 'parameter-type-changed',
        path,
        method,
        description: `Parameter '${name}' type changed from '${oldParam.schema?.type}' to '${newParam.schema?.type}'`,
        oldValue: oldParam,
        newValue: newParam
      });
    }
  }
}

function analyzeSchemas(
  oldSchemas: Record<string, Schema> | undefined,
  newSchemas: Record<string, Schema> | undefined,
  changes: ApiChange[]
): void {
  if (!oldSchemas || !newSchemas) return;

  for (const [name, oldSchema] of Object.entries(oldSchemas)) {
    const newSchema = newSchemas[name];

    if (!newSchema) {
      changes.push({
        type: 'breaking',
        category: 'schema-removed',
        path: `#/components/schemas/${name}`,
        description: `Schema '${name}' was removed`
      });
      continue;
    }

    // Check for removed properties
    if (oldSchema.properties && newSchema.properties) {
      for (const prop of Object.keys(oldSchema.properties)) {
        if (!(prop in newSchema.properties)) {
          changes.push({
            type: 'breaking',
            category: 'property-removed',
            path: `#/components/schemas/${name}/${prop}`,
            description: `Property '${prop}' was removed from schema '${name}'`
          });
        }
      }

      // Check for new required properties
      const oldRequired = new Set(oldSchema.required || []);
      const newRequired = new Set(newSchema.required || []);

      for (const prop of newRequired) {
        if (!oldRequired.has(prop) && oldSchema.properties[prop]) {
          changes.push({
            type: 'breaking',
            category: 'property-required',
            path: `#/components/schemas/${name}/${prop}`,
            description: `Property '${prop}' is now required in schema '${name}'`
          });
        }
      }
    }
  }
}
```

### 2. Breaking Change Categories

Comprehensive breaking change detection:

```typescript
// src/rules/breaking-changes.ts
export const BREAKING_CHANGE_RULES = {
  // Endpoint changes
  'endpoint-removed': {
    severity: 'major',
    description: 'Removing an endpoint breaks all consumers',
    autoFix: false
  },
  'method-removed': {
    severity: 'major',
    description: 'Removing an HTTP method breaks consumers using it',
    autoFix: false
  },

  // Parameter changes
  'required-parameter-added': {
    severity: 'major',
    description: 'Adding required parameter breaks existing calls',
    autoFix: false
  },
  'parameter-removed': {
    severity: 'minor',
    description: 'Removing parameter may break consumers expecting it',
    autoFix: 'Make parameter optional first'
  },
  'parameter-type-changed': {
    severity: 'major',
    description: 'Changing parameter type breaks serialization',
    autoFix: false
  },
  'parameter-required': {
    severity: 'major',
    description: 'Making optional parameter required breaks calls',
    autoFix: false
  },

  // Response changes
  'response-removed': {
    severity: 'major',
    description: 'Removing response status code breaks error handling',
    autoFix: false
  },
  'response-body-changed': {
    severity: 'major',
    description: 'Changing response structure breaks deserialization',
    autoFix: false
  },

  // Schema changes
  'schema-removed': {
    severity: 'major',
    description: 'Removing schema breaks type references',
    autoFix: false
  },
  'property-removed': {
    severity: 'major',
    description: 'Removing property breaks consumers accessing it',
    autoFix: false
  },
  'property-required': {
    severity: 'major',
    description: 'Making property required breaks object creation',
    autoFix: false
  },
  'property-type-changed': {
    severity: 'major',
    description: 'Changing property type breaks serialization',
    autoFix: false
  },

  // Enum changes
  'enum-value-removed': {
    severity: 'major',
    description: 'Removing enum value breaks consumers using it',
    autoFix: false
  }
};
```

### 3. Migration Guide Generation

Generate migration guides for breaking changes:

```typescript
// src/generator/migration-guide.ts
interface MigrationStep {
  change: ApiChange;
  action: string;
  code?: {
    before: string;
    after: string;
    language: string;
  };
}

export function generateMigrationGuide(
  oldVersion: string,
  newVersion: string,
  changes: ApiChange[]
): string {
  const breakingChanges = changes.filter(c => c.type === 'breaking');

  if (breakingChanges.length === 0) {
    return `# Migration Guide: ${oldVersion} to ${newVersion}\n\nNo breaking changes! You can upgrade safely.`;
  }

  const sections: string[] = [
    `# Migration Guide: ${oldVersion} to ${newVersion}`,
    '',
    '## Overview',
    '',
    `This release contains **${breakingChanges.length} breaking changes** that require updates to your code.`,
    '',
    '## Breaking Changes',
    ''
  ];

  // Group changes by category
  const byCategory = groupBy(breakingChanges, 'category');

  for (const [category, categoryChanges] of Object.entries(byCategory)) {
    sections.push(`### ${formatCategory(category)}`);
    sections.push('');

    for (const change of categoryChanges) {
      sections.push(`#### ${change.path}${change.method ? ` (${change.method.toUpperCase()})` : ''}`);
      sections.push('');
      sections.push(change.description);
      sections.push('');

      if (change.migration) {
        sections.push('**Migration:**');
        sections.push('');
        sections.push(change.migration);
        sections.push('');
      }

      // Add code examples
      const codeExample = generateCodeExample(change);
      if (codeExample) {
        sections.push('**Before:**');
        sections.push('```' + codeExample.language);
        sections.push(codeExample.before);
        sections.push('```');
        sections.push('');
        sections.push('**After:**');
        sections.push('```' + codeExample.language);
        sections.push(codeExample.after);
        sections.push('```');
        sections.push('');
      }
    }
  }

  return sections.join('\n');
}

function generateCodeExample(change: ApiChange): CodeExample | null {
  switch (change.category) {
    case 'required-parameter-added':
      return {
        language: 'typescript',
        before: `await sdk.users.create({ name: 'John' });`,
        after: `await sdk.users.create({ name: 'John', email: 'john@example.com' });`
      };

    case 'endpoint-removed':
      return {
        language: 'typescript',
        before: `await sdk.deprecated.oldMethod();`,
        after: `await sdk.newNamespace.newMethod();`
      };

    default:
      return null;
  }
}
```

### 4. CI/CD Integration

Block breaking changes in CI:

```yaml
name: API Compatibility Check

on:
  pull_request:
    paths:
      - 'openapi/**'
      - 'api/**'

jobs:
  check-breaking-changes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Get base spec
        run: |
          git show origin/${{ github.base_ref }}:openapi/openapi.yaml > old-spec.yaml

      - name: Install oasdiff
        run: |
          curl -fsSL https://raw.githubusercontent.com/oasdiff/oasdiff/main/install.sh | sh

      - name: Check for breaking changes
        id: diff
        run: |
          oasdiff breaking old-spec.yaml openapi/openapi.yaml \
            --fail-on ERR \
            --format json > diff-result.json

          echo "has_breaking=$(jq 'length > 0' diff-result.json)" >> $GITHUB_OUTPUT

      - name: Generate report
        if: always()
        run: |
          oasdiff diff old-spec.yaml openapi/openapi.yaml \
            --format markdown > CHANGES.md

      - name: Comment on PR
        if: steps.diff.outputs.has_breaking == 'true'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('CHANGES.md', 'utf8');

            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `## ⚠️ Breaking API Changes Detected\n\n${report}\n\nPlease review these changes and update the SDK accordingly.`
            });

      - name: Fail on breaking changes
        if: steps.diff.outputs.has_breaking == 'true'
        run: |
          echo "Breaking changes detected! Review required."
          exit 1
```

### 5. oasdiff CLI Integration

Use oasdiff for comprehensive analysis:

```bash
#!/bin/bash
# scripts/check-api-diff.sh

set -e

OLD_SPEC="${1:-main:openapi/openapi.yaml}"
NEW_SPEC="${2:-openapi/openapi.yaml}"
OUTPUT_FORMAT="${3:-text}"

echo "Comparing API specifications..."
echo "Old: $OLD_SPEC"
echo "New: $NEW_SPEC"
echo ""

# Check for breaking changes
echo "=== Breaking Changes ==="
oasdiff breaking "$OLD_SPEC" "$NEW_SPEC" --format "$OUTPUT_FORMAT"

echo ""
echo "=== Full Diff ==="
oasdiff diff "$OLD_SPEC" "$NEW_SPEC" --format "$OUTPUT_FORMAT"

# Summary
echo ""
echo "=== Summary ==="
oasdiff summary "$OLD_SPEC" "$NEW_SPEC"
```

### 6. GraphQL Schema Diff

Compare GraphQL schemas:

```typescript
// src/analyzer/graphql-diff.ts
import { buildSchema, printSchema, diff as graphqlDiff } from 'graphql';

interface GraphQLChange {
  type: 'breaking' | 'dangerous' | 'non-breaking';
  criticality: string;
  message: string;
  path: string;
}

export async function analyzeGraphQLDiff(
  oldSchemaSDL: string,
  newSchemaSDL: string
): Promise<GraphQLChange[]> {
  const oldSchema = buildSchema(oldSchemaSDL);
  const newSchema = buildSchema(newSchemaSDL);

  const changes = graphqlDiff(oldSchema, newSchema);

  return changes.map(change => ({
    type: change.criticality.level,
    criticality: change.criticality.reason || '',
    message: change.message,
    path: change.path || ''
  }));
}

// Breaking changes in GraphQL:
// - Removing a type
// - Removing a field
// - Changing field type to incompatible type
// - Adding required argument to field
// - Removing enum value
// - Changing union members
```

### 7. Protobuf/gRPC Diff

Compare Protobuf definitions:

```typescript
// src/analyzer/protobuf-diff.ts
import { execSync } from 'child_process';

interface ProtobufChange {
  type: 'FILE' | 'MESSAGE' | 'FIELD' | 'ENUM' | 'SERVICE' | 'RPC';
  category: 'ADDITION' | 'DELETION' | 'MODIFICATION';
  breaking: boolean;
  path: string;
  description: string;
}

export function analyzeProtobufDiff(
  oldProtoPath: string,
  newProtoPath: string
): ProtobufChange[] {
  // Use buf for protobuf breaking change detection
  const result = execSync(
    `buf breaking ${newProtoPath} --against ${oldProtoPath} --format json`,
    { encoding: 'utf8' }
  );

  const bufOutput = JSON.parse(result);
  const changes: ProtobufChange[] = [];

  for (const issue of bufOutput) {
    changes.push({
      type: issue.type,
      category: issue.category,
      breaking: true,
      path: issue.path,
      description: issue.message
    });
  }

  return changes;
}

// Breaking changes in Protobuf:
// - Changing field number
// - Changing field type
// - Removing required field
// - Changing field from optional to required
// - Removing enum value
// - Renaming message/field (wire format stays same, but breaks generated code)
```

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Installation |
|--------|-------------|--------------|
| Specmatic MCP | Contract testing and diff | [GitHub](https://github.com/specmatic/specmatic-mcp-server) |
| mcp-openapi-schema | OpenAPI exploration | [GitHub](https://github.com/hannesj/mcp-openapi-schema) |

## Best Practices

1. **Version specs** - Keep specs in version control
2. **Automate checks** - Run diff in CI/CD
3. **Block breaking** - Fail builds on breaking changes
4. **Generate guides** - Create migration docs
5. **Review carefully** - Human review for edge cases
6. **Deprecate first** - Deprecate before removing
7. **Communicate early** - Notify SDK teams of changes
8. **Test migrations** - Verify migration guides work

## Process Integration

This skill integrates with the following processes:
- `api-versioning-strategy.js` - API version management
- `backward-compatibility-management.js` - Breaking change policy
- `sdk-versioning-release-management.js` - SDK releases
- `api-design-specification.js` - Spec management

## Output Format

```json
{
  "operation": "diff",
  "oldVersion": "1.0.0",
  "newVersion": "2.0.0",
  "hasBreakingChanges": true,
  "summary": {
    "breaking": 3,
    "nonBreaking": 5,
    "info": 2
  },
  "changes": [
    {
      "type": "breaking",
      "category": "required-parameter-added",
      "path": "/users",
      "method": "POST",
      "description": "New required parameter 'email' added",
      "migration": "Update SDK calls to include email"
    }
  ],
  "migrationGuide": "# Migration Guide...",
  "affectedEndpoints": ["/users", "/orders"]
}
```

## Error Handling

- Handle invalid spec formats
- Report parse errors clearly
- Support partial comparisons
- Warn on deprecated features
- Log detailed change context

## Constraints

- Requires spec access for both versions
- Complex schema changes may need manual review
- Some changes may be false positives
- Behavior changes not always detectable
- GraphQL/gRPC need separate tools
