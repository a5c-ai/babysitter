---
name: figma-api
description: Direct Figma API interactions for design asset management. Fetch files and components, extract design tokens, export images, manage comments, and access version history.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: design-integration
  backlog-id: SK-UX-002
---

# figma-api

You are **figma-api** - a specialized skill for direct Figma API interactions, enabling seamless design-to-code workflows and design asset management.

## Overview

This skill enables AI-powered Figma integration including:
- Fetching files, components, and component sets
- Extracting design tokens (colors, typography, spacing)
- Exporting images and assets at various scales
- Managing comments and feedback
- Accessing version history and change tracking
- Syncing design systems between Figma and code

## Prerequisites

- Figma Personal Access Token (PAT) or OAuth token
- Figma file/project access permissions
- Optional: MCP server for enhanced real-time integration

## Capabilities

### 1. File and Component Fetching

Retrieve Figma file data and components:

```javascript
// Fetch entire file
const fileData = await figmaApi.getFile(fileKey);

// Fetch specific nodes
const nodes = await figmaApi.getFileNodes(fileKey, ['1:2', '1:3']);

// Fetch component metadata
const components = await figmaApi.getComponents(fileKey);

// Fetch component sets (variants)
const componentSets = await figmaApi.getComponentSets(fileKey);
```

### 2. Design Token Extraction

Extract design tokens from Figma files:

```json
{
  "colors": {
    "primary": {
      "50": { "value": "#E3F2FD", "type": "color" },
      "100": { "value": "#BBDEFB", "type": "color" },
      "500": { "value": "#2196F3", "type": "color" },
      "900": { "value": "#0D47A1", "type": "color" }
    },
    "semantic": {
      "success": { "value": "{colors.green.500}", "type": "color" },
      "error": { "value": "{colors.red.500}", "type": "color" },
      "warning": { "value": "{colors.yellow.500}", "type": "color" }
    }
  },
  "typography": {
    "heading-1": {
      "fontFamily": { "value": "Inter", "type": "fontFamily" },
      "fontSize": { "value": "48px", "type": "dimension" },
      "fontWeight": { "value": "700", "type": "fontWeight" },
      "lineHeight": { "value": "1.2", "type": "number" }
    }
  },
  "spacing": {
    "xs": { "value": "4px", "type": "dimension" },
    "sm": { "value": "8px", "type": "dimension" },
    "md": { "value": "16px", "type": "dimension" },
    "lg": { "value": "24px", "type": "dimension" },
    "xl": { "value": "32px", "type": "dimension" }
  }
}
```

### 3. Image Export

Export images and assets at various scales:

```javascript
// Export specific nodes as PNG
const images = await figmaApi.getImage(fileKey, {
  ids: ['1:2', '1:3'],
  format: 'png',
  scale: 2
});

// Export as SVG
const svgImages = await figmaApi.getImage(fileKey, {
  ids: ['1:4'],
  format: 'svg',
  svg_include_id: true,
  svg_simplify_stroke: true
});

// Export with fills rendered
const renderedImages = await figmaApi.getImageFills(fileKey);
```

### 4. Comment Management

Manage design feedback and comments:

```javascript
// Get all comments
const comments = await figmaApi.getComments(fileKey);

// Post new comment
const newComment = await figmaApi.postComment(fileKey, {
  message: 'Please review the button states',
  client_meta: { x: 100, y: 200 }
});

// Reply to comment
const reply = await figmaApi.postComment(fileKey, {
  message: 'Updated per feedback',
  comment_id: '123456'
});

// Resolve comment
await figmaApi.deleteComment(fileKey, commentId);
```

### 5. Version History

Access file version history:

```javascript
// Get version history
const versions = await figmaApi.getVersions(fileKey);

// Output:
{
  "versions": [
    {
      "id": "123456789",
      "created_at": "2026-01-24T10:30:00Z",
      "label": "v2.0 - Updated color system",
      "description": "Migrated to new brand colors",
      "user": {
        "id": "user_id",
        "handle": "designer",
        "img_url": "avatar.png"
      }
    }
  ]
}
```

### 6. Style Extraction

Extract styles from Figma:

```javascript
// Get all styles
const styles = await figmaApi.getStyles(fileKey);

// Extract color styles
const colorStyles = styles.filter(s => s.style_type === 'FILL');

// Extract text styles
const textStyles = styles.filter(s => s.style_type === 'TEXT');

// Extract effect styles (shadows, blurs)
const effectStyles = styles.filter(s => s.style_type === 'EFFECT');
```

## MCP Server Integration

This skill can leverage the following MCP servers for enhanced capabilities:

| Server | Description | Installation |
|--------|-------------|--------------|
| Claude Talk to Figma MCP | Bidirectional Figma interaction for real-time design manipulation | [GitHub](https://github.com/arinspunk/claude-talk-to-figma-mcp) |
| Figma MCP Server (karthiks3000) | Claude MCP Server for working with Figma files | [GitHub](https://github.com/karthiks3000/figma-mcp-server) |
| html.to.design MCP | Converts HTML directly into editable Figma designs | [Docs](https://html.to.design/docs/mcp-tab/) |

## API Reference

### REST API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/files/:key` | GET | Get file data |
| `/v1/files/:key/nodes` | GET | Get specific nodes |
| `/v1/files/:key/images` | GET | Export images |
| `/v1/files/:key/comments` | GET/POST | Manage comments |
| `/v1/files/:key/versions` | GET | Get version history |
| `/v1/files/:key/components` | GET | Get components |

### Authentication

```bash
# Using Personal Access Token
curl -H "X-Figma-Token: YOUR_TOKEN" \
  "https://api.figma.com/v1/files/FILE_KEY"

# Using OAuth
curl -H "Authorization: Bearer OAUTH_TOKEN" \
  "https://api.figma.com/v1/files/FILE_KEY"
```

## Best Practices

1. **Cache responses** - Figma API has rate limits; cache file data locally
2. **Use node IDs** - Fetch specific nodes instead of entire files when possible
3. **Batch exports** - Group image exports to minimize API calls
4. **Handle pagination** - Large files may require paginated requests
5. **Version your tokens** - Use descriptive names and rotate tokens regularly
6. **Respect rate limits** - 50 requests per minute for personal access tokens

## Process Integration

This skill integrates with the following processes:
- `component-library.js` - Design-to-code component workflows
- `design-system.js` - Design system synchronization
- `hifi-prototyping.js` - High-fidelity prototype exports
- `wireframing.js` - Wireframe asset management

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "extract-tokens",
  "fileKey": "abc123xyz",
  "status": "success",
  "tokens": {
    "colors": {},
    "typography": {},
    "spacing": {}
  },
  "metadata": {
    "lastModified": "2026-01-24T10:30:00Z",
    "version": "123456789"
  },
  "artifacts": ["tokens.json", "tokens.css"]
}
```

## Error Handling

- Handle 403 errors for permission issues
- Retry on 429 rate limit errors with exponential backoff
- Validate file keys before making requests
- Provide helpful messages for common authentication failures

## Constraints

- Respect Figma API rate limits (50 req/min for PAT)
- File exports may timeout for very large files
- Some features require team/organization plans
- Plugin API requires Figma desktop app running
