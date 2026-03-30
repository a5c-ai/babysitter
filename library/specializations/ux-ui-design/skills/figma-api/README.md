# Figma API Skill

## Overview

The `figma-api` skill provides direct integration with the Figma REST API for design asset management. It enables design-to-code workflows including file/component fetching, design token extraction, image export, comment management, and version history access.

## Quick Start

### Prerequisites

1. **Figma Account** - With access to target files
2. **Personal Access Token** - Generate from Figma settings
3. **Optional MCP Server** - Enhanced real-time integration

### Installation

The skill is included in the babysitter-sdk. Configure your Figma token:

```bash
# Set environment variable
export FIGMA_TOKEN="your-personal-access-token"

# Or configure in .babysitter config
echo "FIGMA_TOKEN=your-token" >> .env
```

To add MCP server integration:

```bash
# Option 1: Claude Talk to Figma MCP
git clone https://github.com/arinspunk/claude-talk-to-figma-mcp
cd claude-talk-to-figma-mcp && npm install

# Option 2: Figma MCP Server
npx @anthropic-ai/create-mcp-server figma-server
```

## Usage

### Basic Operations

```bash
# Fetch file data
/skill figma-api get-file --file-key abc123xyz

# Extract design tokens
/skill figma-api extract-tokens --file-key abc123xyz --output tokens.json

# Export images
/skill figma-api export-images --file-key abc123xyz --node-ids 1:2,1:3 --format png --scale 2

# Get components
/skill figma-api get-components --file-key abc123xyz
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(figmaApiTask, {
  operation: 'extract-tokens',
  fileKey: 'abc123xyz',
  outputFormat: 'css',
  includeTypography: true,
  includeColors: true,
  includeSpacing: true
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **File Fetching** | Retrieve file data, nodes, and metadata |
| **Token Extraction** | Extract colors, typography, spacing tokens |
| **Image Export** | Export assets as PNG, SVG, JPG, PDF |
| **Comment Management** | Read, post, and resolve design comments |
| **Version History** | Access file version history and labels |
| **Style Extraction** | Extract color, text, and effect styles |

## Examples

### Example 1: Extract Design Tokens

```bash
# Extract all design tokens to JSON
/skill figma-api extract-tokens \
  --file-key abc123xyz \
  --output tokens.json \
  --format json

# Generate CSS variables
/skill figma-api extract-tokens \
  --file-key abc123xyz \
  --output variables.css \
  --format css
```

Output (JSON):
```json
{
  "colors": {
    "primary-500": "#2196F3",
    "secondary-500": "#9C27B0"
  },
  "typography": {
    "heading-1": {
      "fontFamily": "Inter",
      "fontSize": "48px",
      "fontWeight": 700
    }
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "16px"
  }
}
```

Output (CSS):
```css
:root {
  --color-primary-500: #2196F3;
  --color-secondary-500: #9C27B0;
  --font-heading-1-family: 'Inter';
  --font-heading-1-size: 48px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
}
```

### Example 2: Export Component Images

```bash
# Export specific components as 2x PNG
/skill figma-api export-images \
  --file-key abc123xyz \
  --node-ids 1:2,1:3,1:4 \
  --format png \
  --scale 2 \
  --output-dir ./assets/components

# Export icons as SVG
/skill figma-api export-images \
  --file-key abc123xyz \
  --page-name "Icons" \
  --format svg \
  --output-dir ./assets/icons
```

### Example 3: Sync Design System

```javascript
// Automated design system sync
const designSystemSync = async () => {
  // 1. Fetch latest file data
  const file = await ctx.task(figmaApiTask, {
    operation: 'get-file',
    fileKey: process.env.FIGMA_DESIGN_SYSTEM_KEY
  });

  // 2. Extract tokens
  const tokens = await ctx.task(figmaApiTask, {
    operation: 'extract-tokens',
    fileKey: process.env.FIGMA_DESIGN_SYSTEM_KEY,
    outputFormat: 'json'
  });

  // 3. Transform to CSS
  await ctx.task(designTokenTransformerTask, {
    input: tokens,
    outputFormats: ['css', 'scss', 'js']
  });

  // 4. Export updated components
  await ctx.task(figmaApiTask, {
    operation: 'export-images',
    fileKey: process.env.FIGMA_DESIGN_SYSTEM_KEY,
    nodeIds: tokens.componentIds,
    format: 'svg'
  });
};
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FIGMA_TOKEN` | Personal Access Token | Required |
| `FIGMA_TEAM_ID` | Team ID for team endpoints | Optional |
| `FIGMA_PROJECT_ID` | Default project ID | Optional |
| `FIGMA_CACHE_TTL` | Cache TTL in seconds | `300` |

### Skill Configuration

```yaml
# .babysitter/skills/figma-api.yaml
figma-api:
  token: ${FIGMA_TOKEN}
  defaultFileKey: abc123xyz
  caching:
    enabled: true
    ttl: 300
  export:
    defaultFormat: png
    defaultScale: 2
  tokens:
    outputFormats: [json, css, scss]
    colorFormat: hex
  mcpServer:
    enabled: true
    provider: arinspunk
```

## Process Integration

### Processes Using This Skill

1. **component-library.js** - Design-to-code component workflows
2. **design-system.js** - Design system synchronization
3. **hifi-prototyping.js** - High-fidelity prototype exports
4. **wireframing.js** - Wireframe asset management

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const syncDesignTokensTask = defineTask({
  name: 'sync-design-tokens',
  description: 'Sync design tokens from Figma',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Sync Design Tokens from ${inputs.fileKey}`,
      skill: {
        name: 'figma-api',
        context: {
          operation: 'extract-tokens',
          fileKey: inputs.fileKey,
          includeColors: true,
          includeTypography: true,
          includeSpacing: true,
          includeShadows: true,
          outputFormat: inputs.format || 'json'
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

## MCP Server Reference

### Claude Talk to Figma MCP

Bidirectional Figma integration for real-time design manipulation.

**Features:**
- Real-time design updates
- Component manipulation
- Style management
- 23+ design tools

**Installation:**
```bash
git clone https://github.com/arinspunk/claude-talk-to-figma-mcp
cd claude-talk-to-figma-mcp && npm install
```

**GitHub:** https://github.com/arinspunk/claude-talk-to-figma-mcp

### Figma MCP Server (karthiks3000)

Claude MCP Server for Figma file operations.

**Features:**
- File data retrieval
- Component access
- Asset export
- Style extraction

**GitHub:** https://github.com/karthiks3000/figma-mcp-server

## API Rate Limits

| Token Type | Limit | Scope |
|------------|-------|-------|
| Personal Access Token | 50 req/min | Per user |
| OAuth Token | 100 req/min | Per application |
| Enterprise | Custom | Per organization |

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `403 Forbidden` | Check token permissions and file access |
| `404 Not Found` | Verify file key is correct |
| `429 Too Many Requests` | Implement rate limiting/backoff |
| `Timeout on large files` | Use node-specific endpoints |

### Debug Mode

Enable verbose output for troubleshooting:

```bash
FIGMA_DEBUG=true /skill figma-api get-file --file-key abc123xyz
```

## Related Skills

- **design-token-transformer** - Transform tokens to multiple formats
- **screenshot-comparison** - Visual comparison of design vs implementation
- **storybook-integration** - Sync with Storybook components

## References

- [Figma REST API Documentation](https://www.figma.com/developers/api)
- [Figma Plugin API](https://www.figma.com/plugin-docs/)
- [Design Tokens W3C Spec](https://www.w3.org/community/design-tokens/)
- [Builder.io Figma MCP Guide](https://www.builder.io/blog/claude-code-figma-mcp-server)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-UX-002
**Category:** Design Integration
**Status:** Active
