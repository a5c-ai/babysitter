---
name: svg-optimizer
description: Optimize SVG assets, generate sprites, and convert to React components
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# SVG Optimizer Skill

## Purpose

Optimize SVG assets for web and mobile use, including compression, sprite generation, and React component conversion.

## Capabilities

- Remove unnecessary metadata and comments
- Optimize paths and shapes
- Generate SVG sprites for icon systems
- Convert SVGs to React/Vue components
- Minify SVG file sizes
- Ensure accessibility attributes (aria-labels, roles)
- Generate icon documentation

## Target Processes

- component-library.js (iconSystemDesignTask)
- design-system.js

## Integration Points

- SVGO for optimization
- svgr for React component generation
- svg-sprite for sprite generation

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "inputPath": {
      "type": "string",
      "description": "Path to SVG file or directory"
    },
    "outputPath": {
      "type": "string",
      "description": "Output directory"
    },
    "generateSprite": {
      "type": "boolean",
      "default": false
    },
    "generateComponents": {
      "type": "boolean",
      "default": false
    },
    "componentFormat": {
      "type": "string",
      "enum": ["react", "vue", "svelte"],
      "default": "react"
    },
    "optimizationLevel": {
      "type": "string",
      "enum": ["minimal", "standard", "aggressive"],
      "default": "standard"
    },
    "addAccessibility": {
      "type": "boolean",
      "default": true
    }
  },
  "required": ["inputPath"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "optimizedFiles": {
      "type": "array",
      "description": "List of optimized SVG files"
    },
    "spritePath": {
      "type": "string",
      "description": "Path to generated sprite file"
    },
    "componentPaths": {
      "type": "array",
      "description": "Paths to generated components"
    },
    "sizeSavings": {
      "type": "object",
      "description": "File size reduction statistics"
    },
    "accessibilityReport": {
      "type": "object",
      "description": "Accessibility attributes added"
    }
  }
}
```

## Usage Example

```javascript
const result = await skill.execute({
  inputPath: './icons',
  outputPath: './optimized-icons',
  generateSprite: true,
  generateComponents: true,
  componentFormat: 'react',
  addAccessibility: true
});
```
