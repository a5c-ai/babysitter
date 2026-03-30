# Cross-Language Consistency Agent

## Overview

The `cross-language-consistency-agent` ensures feature parity, naming consistency, and API surface alignment across multi-language SDK implementations. It verifies that all SDK languages provide equivalent functionality while respecting language-specific idioms.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Senior SDK Platform Engineer |
| **Experience** | 10+ years multi-language SDK development |
| **Background** | Cloud platform SDK teams |
| **Philosophy** | "Native feel with conceptual consistency" |

## Core Principles

1. **Feature Parity** - Same API capabilities
2. **Conceptual Alignment** - Same mental model
3. **Idiomatic Implementation** - Native per language
4. **Naming Coherence** - Consistent yet adapted
5. **Documentation Symmetry** - Equivalent coverage
6. **Testing Equivalence** - Same test scenarios

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **API Surface** | Method and parameter consistency |
| **Naming** | Convention mapping across languages |
| **Features** | Parity analysis and gap tracking |
| **Documentation** | Coverage consistency |
| **Testing** | Scenario equivalence |
| **Release** | Synchronized versioning |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(consistencyCheckTask, {
  agentName: 'cross-language-consistency-agent',
  prompt: {
    role: 'SDK Platform Engineer',
    task: 'Verify SDK consistency across all languages',
    context: {
      languages: ['typescript', 'python', 'java', 'go'],
      sdkPaths: {
        typescript: './sdks/typescript',
        python: './sdks/python',
        java: './sdks/java',
        go: './sdks/go'
      }
    },
    instructions: [
      'Compare API surfaces',
      'Verify naming conventions',
      'Identify feature gaps',
      'Check documentation parity',
      'Generate consistency report'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# Full consistency check
/agent cross-language-consistency-agent check \
  --languages typescript,python,java,go \
  --report detailed

# Feature parity analysis
/agent cross-language-consistency-agent features \
  --baseline typescript

# Naming consistency review
/agent cross-language-consistency-agent naming \
  --focus methods,properties

# Documentation parity check
/agent cross-language-consistency-agent docs \
  --sections getting_started,api_reference
```

## Common Tasks

### 1. Full Consistency Analysis

```bash
/agent cross-language-consistency-agent analyze \
  --languages typescript,python,java,go \
  --output-format json
```

Output includes:
- Overall consistency score
- Category-specific scores
- Gap identification
- Prioritized recommendations

### 2. Feature Parity Check

```bash
/agent cross-language-consistency-agent features \
  --baseline typescript \
  --compare python,java,go
```

Identifies:
- Missing features per language
- Partial implementations
- Implementation blockers

### 3. Naming Convention Mapping

```bash
/agent cross-language-consistency-agent naming \
  --output mapping-table
```

Generates:
- Method name mappings
- Property name mappings
- Error type mappings
- Async pattern mappings

### 4. Release Readiness Check

```bash
/agent cross-language-consistency-agent release-ready \
  --version 2.0.0
```

Verifies:
- All SDKs at same version
- Feature parity achieved
- Documentation complete
- Tests passing

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `multi-language-sdk-strategy.js` | Language planning |
| `sdk-testing-strategy.js` | Cross-SDK testing |
| `sdk-versioning-release-management.js` | Sync releases |
| `developer-experience-optimization.js` | Consistent DX |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const checkConsistencyTask = defineTask({
  name: 'check-sdk-consistency',
  description: 'Verify consistency across SDK languages',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: 'Cross-Language Consistency Check',
      agent: {
        name: 'cross-language-consistency-agent',
        prompt: {
          role: 'SDK Platform Engineer',
          task: 'Analyze SDK consistency',
          context: {
            languages: inputs.languages,
            sdkPaths: inputs.sdkPaths,
            baselineLanguage: inputs.baseline
          },
          instructions: [
            'Extract API surface from each SDK',
            'Compare methods and parameters',
            'Map naming conventions',
            'Identify feature gaps',
            'Check documentation coverage',
            'Generate consistency report'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['score', 'gaps', 'recommendations'],
          properties: {
            score: { type: 'number' },
            gaps: { type: 'array' },
            recommendations: { type: 'array' }
          }
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

## Naming Convention Reference

### Method Names

| Concept | TypeScript | Python | Java | Go |
|---------|------------|--------|------|-----|
| List all | `listAll` | `list_all` | `listAll` | `ListAll` |
| Get by ID | `get` | `get` | `get` | `Get` |
| Create | `create` | `create` | `create` | `Create` |
| Update | `update` | `update` | `update` | `Update` |
| Delete | `delete` | `delete` | `delete` | `Delete` |

### Property Names

| Concept | TypeScript | Python | Java | Go |
|---------|------------|--------|------|-----|
| Created at | `createdAt` | `created_at` | `createdAt` | `CreatedAt` |
| Is active | `isActive` | `is_active` | `isActive` | `IsActive` |
| User ID | `userId` | `user_id` | `userId` | `UserID` |

### Error Types

| Concept | TypeScript | Python | Java | Go |
|---------|------------|--------|------|-----|
| Not found | `NotFoundError` | `NotFoundError` | `NotFoundException` | `ErrNotFound` |
| Validation | `ValidationError` | `ValidationError` | `ValidationException` | `ErrValidation` |
| Auth | `AuthenticationError` | `AuthenticationError` | `AuthenticationException` | `ErrAuthentication` |

## Interaction Guidelines

### What to Expect

- **Thorough analysis** across all languages
- **Balanced recommendations** respecting idioms
- **Prioritized gaps** by impact
- **Actionable remediation** steps

### Best Practices

1. Provide all SDK codebases
2. Specify baseline language
3. Note known constraints
4. Share existing conventions

## Related Resources

- [typescript-sdk-specialist skill](../../skills/typescript-sdk-specialist/) - TS patterns
- [openapi-codegen-orchestrator skill](../../skills/openapi-codegen-orchestrator/) - Generation
- [contract-test-framework skill](../../skills/contract-test-framework/) - Testing

## References

- [Azure SDK Design Guidelines](https://azure.github.io/azure-sdk/)
- [Google API Client Libraries](https://developers.google.com/api-client-library)
- [AWS SDK Development](https://aws.amazon.com/developer/tools/)
- [Stripe SDKs](https://github.com/stripe)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-SDK-002
**Category:** Multi-Language SDK
**Status:** Active
