---
name: mock-spec-extractor
description: Extracts design specifications from mock images including colors, typography, spacing, and component details
allowed-tools: Bash(*) Read Write Edit Glob Grep
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: design-analysis
---

# mock-spec-extractor

You are **mock-spec-extractor** - a specialized skill for extracting comprehensive design specifications from mock images.

## Overview

This skill analyzes design mock images to extract structured specifications including colors, typography, spacing patterns, and component details that serve as the source of truth for pixel-perfect implementation.

## Prerequisites

- Node.js 18+ installed
- Image processing libraries (sharp, jimp)
- Color extraction libraries (node-vibrant, color-thief)
- OCR capabilities for text analysis (optional)

## Capabilities

### 1. Color Palette Extraction

```javascript
const Vibrant = require('node-vibrant');

async function extractColors(mockPath) {
  const palette = await Vibrant.from(mockPath).getPalette();

  return {
    primary: palette.Vibrant?.hex,
    secondary: palette.Muted?.hex,
    accent: palette.DarkVibrant?.hex,
    background: palette.LightMuted?.hex,
    text: palette.DarkMuted?.hex,
    allColors: Object.entries(palette)
      .filter(([_, swatch]) => swatch)
      .map(([name, swatch]) => ({
        name,
        hex: swatch.hex,
        rgb: swatch.rgb,
        population: swatch.population
      }))
  };
}
```

### 2. Layout Structure Analysis

```javascript
async function analyzeLayout(mockPath) {
  const image = await sharp(mockPath).metadata();

  // Detect major sections through edge detection
  const edges = await detectEdges(mockPath);

  // Identify grid patterns
  const gridAnalysis = await detectGridPattern(edges);

  return {
    dimensions: { width: image.width, height: image.height },
    sections: identifySections(edges),
    grid: gridAnalysis,
    hierarchy: buildHierarchy(sections)
  };
}
```

### 3. Typography Detection

```javascript
async function detectTypography(mockPath, regions) {
  const textStyles = [];

  for (const region of regions) {
    // Extract text regions
    const textAreas = await findTextAreas(mockPath, region);

    for (const area of textAreas) {
      textStyles.push({
        region: region.name,
        estimatedSize: estimateFontSize(area),
        estimatedWeight: estimateWeight(area),
        color: extractDominantColor(area),
        position: area.bounds
      });
    }
  }

  return deduplicateStyles(textStyles);
}
```

### 4. Spacing Pattern Recognition

```javascript
async function analyzeSpacing(mockPath, elements) {
  const spacingValues = [];

  // Analyze gaps between elements
  for (let i = 0; i < elements.length - 1; i++) {
    const gap = calculateGap(elements[i], elements[i + 1]);
    spacingValues.push(gap);
  }

  // Identify spacing scale
  const scale = identifySpacingScale(spacingValues);

  return {
    scale,
    patterns: groupByPattern(spacingValues),
    recommendations: suggestCSSVariables(scale)
  };
}
```

### 5. Component Detection

```javascript
async function detectComponents(mockPath) {
  const components = [];

  // Detect buttons
  const buttons = await detectButtons(mockPath);
  components.push(...buttons.map(b => ({ type: 'button', ...b })));

  // Detect cards
  const cards = await detectCards(mockPath);
  components.push(...cards.map(c => ({ type: 'card', ...c })));

  // Detect inputs
  const inputs = await detectInputs(mockPath);
  components.push(...inputs.map(i => ({ type: 'input', ...i })));

  return components;
}
```

## Input Schema

```json
{
  "type": "object",
  "required": ["mockSource"],
  "properties": {
    "mockSource": {
      "type": "object",
      "properties": {
        "type": { "type": "string", "enum": ["image", "figma", "url"] },
        "path": { "type": "string" }
      }
    },
    "analysisDepth": {
      "type": "string",
      "enum": ["basic", "detailed", "comprehensive"],
      "default": "detailed"
    },
    "focusAreas": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "designSpec": {
      "type": "object",
      "properties": {
        "layout": { "type": "object" },
        "typography": { "type": "object" },
        "colorPalette": { "type": "object" },
        "spacing": { "type": "object" },
        "components": { "type": "array" },
        "decorativeElements": { "type": "array" }
      }
    },
    "cssVariables": { "type": "object" },
    "implementationNotes": { "type": "array" }
  }
}
```

## Process Integration

This skill integrates with:
- `pixel-perfect-implementation.js` - Provides mock analysis for convergence
- `design-system.js` - Extracts design tokens
- `component-library.js` - Identifies component patterns

## Usage Example

```bash
/skill mock-spec-extractor \
  --mock designs/dashboard-mock.png \
  --depth comprehensive \
  --focus "header,sidebar,cards"
```

## Best Practices

1. **High-resolution mocks** - Use 2x resolution for better analysis
2. **Clean backgrounds** - Solid backgrounds improve detection
3. **Consistent naming** - Name regions consistently for tracking
4. **Validate extractions** - Review and refine extracted specs
5. **Iterate with feedback** - Use scoring feedback to improve extraction
