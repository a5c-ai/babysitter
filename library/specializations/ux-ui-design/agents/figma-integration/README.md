# Figma Integration Agent

## Overview

The `figma-integration` agent is a specialized AI agent embodying the expertise of a Senior Design Technologist. It provides bidirectional Figma integration for design-to-code workflows, including asset management, token extraction, component mapping, and design-code consistency validation.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Senior Design Technologist |
| **Experience** | 8+ years design systems |
| **Background** | Figma expertise, frontend development |
| **Specialization** | Design-code synchronization |

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Figma API** | REST API, Plugin API, file navigation |
| **Token Extraction** | Colors, typography, spacing, effects |
| **Component Mapping** | Figma-to-code variant mapping |
| **Asset Export** | SVG, PNG, WebP optimization |
| **Change Detection** | Figma version monitoring and sync |
| **Documentation** | Handoff specs, component docs |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(figmaIntegrationTask, {
  agentName: 'figma-integration',
  prompt: {
    role: 'Senior Design Technologist',
    task: 'Sync design system from Figma',
    context: {
      figmaFileKey: 'abc123xyz',
      targetDirectory: './src/design-system',
      scope: ['tokens', 'components', 'icons']
    },
    instructions: [
      'Extract all design tokens',
      'Map component variants to code props',
      'Export icon assets as optimized SVG',
      'Generate sync report'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# Full design system sync
/agent figma-integration sync \
  --file-key abc123xyz \
  --output ./src/design-system

# Extract tokens only
/agent figma-integration extract-tokens \
  --file-key abc123xyz \
  --output ./tokens

# Validate design-code consistency
/agent figma-integration validate \
  --file-key abc123xyz \
  --code-path ./src/components

# Generate component mapping
/agent figma-integration map-components \
  --file-key abc123xyz \
  --mapping-file ./component-mapping.json
```

## Common Tasks

### 1. Design System Synchronization

The agent can perform full design system sync:

```bash
/agent figma-integration sync \
  --file-key abc123xyz \
  --include tokens,components,assets \
  --output-format css,ts,json
```

Output includes:
- Design tokens in multiple formats
- Component-to-code mappings
- Exported assets (icons, illustrations)
- Sync report with changes

### 2. Token Extraction

Extract design tokens from Figma:

```bash
/agent figma-integration extract-tokens \
  --file-key abc123xyz \
  --categories colors,typography,spacing,shadows \
  --format w3c-dtcg
```

Output:
```json
{
  "colors": {
    "primary-500": { "$value": "#2196F3", "$type": "color" }
  },
  "typography": {
    "heading-1": { "$value": { "fontFamily": "Inter", "fontSize": "48px" } }
  }
}
```

### 3. Component Mapping

Generate component variant mappings:

```bash
/agent figma-integration map-components \
  --file-key abc123xyz \
  --component Button \
  --code-path ./src/components/Button
```

Output:
```json
{
  "Button": {
    "variants": [
      { "figma": "Type=Primary", "code": { "variant": "primary" } },
      { "figma": "Size=Large", "code": { "size": "lg" } }
    ]
  }
}
```

### 4. Design-Code Validation

Validate implementation matches design:

```bash
/agent figma-integration validate \
  --file-key abc123xyz \
  --component Button \
  --code-path ./src/components/Button
```

Output:
- Property-by-property comparison
- Mismatch identification
- Recommended fixes
- Match percentage score

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `component-library.js` | Design-to-code workflows |
| `design-system.js` | Design system synchronization |
| `hifi-prototyping.js` | Prototype asset exports |
| `wireframing.js` | Wireframe management |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const syncDesignSystemTask = defineTask({
  name: 'sync-design-system',
  description: 'Sync design system from Figma',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: `Sync Design System: ${inputs.figmaFileKey}`,
      agent: {
        name: 'figma-integration',
        prompt: {
          role: 'Senior Design Technologist',
          task: 'Synchronize design system from Figma to code',
          context: {
            figmaFileKey: inputs.figmaFileKey,
            targetDirectory: inputs.outputDir,
            previousSync: inputs.lastSyncTimestamp
          },
          instructions: [
            'Compare Figma version with last sync',
            'Extract changed tokens and styles',
            'Update component mappings',
            'Export modified assets',
            'Generate change report'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['tokens', 'components', 'changes'],
          properties: {
            tokens: { type: 'object' },
            components: { type: 'array', items: { type: 'object' } },
            changes: { type: 'array', items: { type: 'object' } }
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

### Figma Node Types

| Type | Description | Use Case |
|------|-------------|----------|
| `DOCUMENT` | Root file node | File structure |
| `CANVAS` | Page | Page navigation |
| `FRAME` | Container | Layout groups |
| `COMPONENT` | Reusable design | Components |
| `COMPONENT_SET` | Variant container | Component variants |
| `INSTANCE` | Component instance | Usage tracking |
| `TEXT` | Text layer | Typography |
| `RECTANGLE` | Shape | Backgrounds |
| `VECTOR` | Vector shape | Icons |

### Token Categories

| Category | Figma Source | Code Output |
|----------|--------------|-------------|
| Colors | Fill styles | CSS variables, JS constants |
| Typography | Text styles | Font stacks, sizes |
| Spacing | Auto layout | Spacing scale |
| Shadows | Effect styles | Box-shadow values |
| Border radius | Corner radius | Border-radius values |

## Interaction Guidelines

### What to Expect

- **Structured sync workflows** with clear steps
- **Detailed mappings** between Figma and code
- **Change detection** with impact analysis
- **Asset optimization** recommendations

### Best Practices

1. Provide Figma file key (from URL)
2. Specify target output directory
3. Define scope (tokens, components, assets)
4. Include component naming conventions
5. Mention any existing code structure

## Related Resources

- [figma-api skill](../skills/figma-api/) - Direct API operations
- [design-token-transformer skill](../skills/design-token-transformer/) - Token transformation
- [design-token-manager agent](../agents/design-token-manager/) - Token lifecycle

## References

- [Figma REST API](https://www.figma.com/developers/api)
- [Figma Plugin API](https://www.figma.com/plugin-docs/)
- [Design Tokens W3C](https://www.w3.org/community/design-tokens/)
- [Claude Talk to Figma MCP](https://github.com/arinspunk/claude-talk-to-figma-mcp)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-UX-002
**Category:** Design Integration
**Status:** Active
