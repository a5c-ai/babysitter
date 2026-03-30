# Design Token Manager Agent

## Overview

The `design-token-manager` agent is a specialized AI agent embodying the expertise of a Principal Design Systems Engineer. It provides comprehensive design token management including architecture design, versioning, multi-platform transformation, and governance.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Principal Design Systems Engineer |
| **Experience** | 10+ years design systems |
| **Background** | Multi-platform design systems, enterprise |
| **Specialization** | Token architecture, governance |

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Architecture** | Three-tier token structure, semantic naming |
| **Versioning** | SemVer, migration guides, codemods |
| **Transformation** | CSS, SCSS, JS, Swift, Android, RN |
| **Theming** | Light/dark modes, high contrast |
| **Validation** | Naming, contrast, scale enforcement |
| **Documentation** | Auto-generated token docs |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(designTokenManagerTask, {
  agentName: 'design-token-manager',
  prompt: {
    role: 'Principal Design Systems Engineer',
    task: 'Manage design token lifecycle',
    context: {
      tokenSource: './tokens/source.json',
      platforms: ['web', 'ios', 'android'],
      themes: ['light', 'dark']
    },
    instructions: [
      'Validate token structure',
      'Transform to all platforms',
      'Generate theme variants',
      'Create documentation'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# Full token management
/agent design-token-manager manage \
  --source ./tokens/source.json \
  --platforms web,ios,android \
  --themes light,dark

# Validate tokens
/agent design-token-manager validate \
  --source ./tokens/source.json \
  --rules strict

# Generate migration guide
/agent design-token-manager migrate \
  --from v1.0.0 \
  --to v2.0.0 \
  --generate-codemod

# Transform to specific platform
/agent design-token-manager transform \
  --source ./tokens/source.json \
  --platform ios \
  --output ./ios/DesignTokens.swift
```

## Common Tasks

### 1. Token Architecture Design

Design scalable token structure:

```bash
/agent design-token-manager architect \
  --categories colors,typography,spacing,shadows \
  --tiers primitive,semantic,component \
  --output ./tokens/architecture.json
```

Output:
- Three-tier token structure
- Naming conventions
- Reference patterns
- Documentation template

### 2. Multi-Platform Transformation

Transform tokens for all platforms:

```bash
/agent design-token-manager transform \
  --source ./tokens/source.json \
  --platforms web,ios,android,react-native \
  --output-dir ./dist/tokens
```

Generated files:
- `tokens.css` - CSS custom properties
- `tokens.scss` - SCSS variables and maps
- `tokens.ts` - TypeScript constants
- `DesignTokens.swift` - iOS Swift
- `colors.xml`, `dimens.xml` - Android resources
- `tokens.rn.ts` - React Native

### 3. Theme Management

Create and manage themes:

```bash
/agent design-token-manager themes \
  --source ./tokens/source.json \
  --themes light,dark,high-contrast \
  --output ./tokens/themed
```

Output:
- Theme-specific token files
- CSS theme switching
- Theme type definitions
- Configuration options

### 4. Token Validation

Validate tokens against standards:

```bash
/agent design-token-manager validate \
  --source ./tokens/source.json \
  --rules naming,contrast,references \
  --wcag-level AA
```

Output:
- Validation report
- Naming convention violations
- Contrast ratio failures
- Unresolved references
- Suggested fixes

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `component-library.js` | Token consumption |
| `design-system.js` | Token management |
| `responsive-design.js` | Responsive scaling |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const manageTokensTask = defineTask({
  name: 'manage-tokens',
  description: 'Manage design token lifecycle',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: 'Design Token Management',
      agent: {
        name: 'design-token-manager',
        prompt: {
          role: 'Principal Design Systems Engineer',
          task: 'Manage design tokens across platforms',
          context: {
            tokenSource: inputs.source,
            targetPlatforms: inputs.platforms,
            themes: inputs.themes,
            validationLevel: inputs.validation || 'standard'
          },
          instructions: [
            'Validate source token structure',
            'Resolve all token references',
            'Transform to target platforms',
            'Generate theme variants',
            'Create documentation',
            'Report any issues'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['tokens', 'artifacts', 'validation'],
          properties: {
            tokens: { type: 'object' },
            artifacts: { type: 'array', items: { type: 'string' } },
            validation: { type: 'object' }
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

## Knowledge Base

### Token Tiers

| Tier | Purpose | Example |
|------|---------|---------|
| **Primitive** | Raw values | `blue-500: #2196F3` |
| **Semantic** | Purpose-driven | `primary: {blue-500}` |
| **Component** | Component-specific | `button-bg: {primary}` |

### Token Types (W3C DTCG)

| Type | Description | Example |
|------|-------------|---------|
| `color` | Color values | `#2196F3` |
| `dimension` | Sizes with units | `16px`, `1rem` |
| `fontFamily` | Font stack | `'Inter', sans-serif` |
| `fontWeight` | Weight value | `700` |
| `number` | Unitless number | `1.5` |
| `shadow` | Box shadow | Complex object |
| `transition` | Timing | `200ms ease` |

### Platform Outputs

| Platform | Format | File |
|----------|--------|------|
| Web | CSS Variables | `tokens.css` |
| Web | SCSS | `tokens.scss` |
| Web | TypeScript | `tokens.ts` |
| iOS | Swift | `DesignTokens.swift` |
| Android | XML | `colors.xml`, `dimens.xml` |
| React Native | TypeScript | `tokens.rn.ts` |

## Interaction Guidelines

### What to Expect

- **Scalable architecture** recommendations
- **Platform-specific** transformations
- **Version management** with migrations
- **Quality enforcement** through validation

### Best Practices

1. Provide source token file path
2. Specify target platforms
3. Define theme requirements
4. Mention validation strictness
5. Include versioning requirements

## Related Resources

- [design-token-transformer skill](../skills/design-token-transformer/) - Token transformation
- [figma-integration agent](../agents/figma-integration/) - Figma token sync
- [figma-api skill](../skills/figma-api/) - Figma API access

## References

- [W3C Design Tokens Spec](https://www.w3.org/community/design-tokens/)
- [Style Dictionary](https://amzn.github.io/style-dictionary/)
- [Tokens Studio](https://tokens.studio/)
- [Design Tokens Community Group](https://www.designtokens.org/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-UX-003
**Category:** Design Systems
**Status:** Active
