---
name: visual-diff-scorer
description: Multi-dimensional visual scoring using pixel-diff and structural analysis for design-to-implementation comparison
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: visual-testing
---

# visual-diff-scorer

You are **visual-diff-scorer** - a specialized skill for multi-dimensional visual scoring using pixel-diff and structural analysis to compare design mocks with implementations.

## Overview

This skill enables comprehensive visual comparison between design mocks and implementation screenshots, producing detailed multi-dimensional scores across layout, typography, colors, spacing, components, and decorative elements.

## Prerequisites

- Node.js 18+ installed
- Playwright or Puppeteer for screenshot capture
- `pixelmatch` for pixel-level comparison
- Image processing libraries (sharp, jimp)

## Capabilities

### 1. Multi-Dimensional Scoring

Score implementations across 6 dimensions with configurable weights:

```javascript
const defaultWeights = {
  layout: 25,      // Structure, positioning, alignment
  typography: 20,  // Fonts, sizes, weights, spacing
  colors: 20,      // Colors, gradients, opacity
  spacing: 15,     // Margins, padding, gaps
  components: 10,  // Buttons, inputs, cards
  decorative: 10   // Icons, illustrations, effects
};
```

### 2. Pixel-Diff Analysis

```javascript
const pixelmatch = require('pixelmatch');
const { PNG } = require('pngjs');

// Compare mock and implementation
const mockImg = PNG.sync.read(fs.readFileSync(mockPath));
const implImg = PNG.sync.read(fs.readFileSync(implPath));
const diff = new PNG({ width, height });

const numDiffPixels = pixelmatch(
  mockImg.data,
  implImg.data,
  diff.data,
  width,
  height,
  { threshold: 0.1 }
);

const diffPercentage = (numDiffPixels / (width * height)) * 100;
```

### 3. Region-Based Analysis

Analyze specific regions for targeted scoring:

```javascript
const regions = [
  { name: 'header', bounds: { x: 0, y: 0, width: 1920, height: 80 } },
  { name: 'hero', bounds: { x: 0, y: 80, width: 1920, height: 500 } },
  { name: 'content', bounds: { x: 0, y: 580, width: 1920, height: 600 } }
];

for (const region of regions) {
  const regionDiff = analyzeRegion(mockImg, implImg, region.bounds);
  results.push({ region: region.name, score: regionDiff.score });
}
```

### 4. Color Extraction and Comparison

```javascript
const Vibrant = require('node-vibrant');

// Extract color palette from mock
const mockPalette = await Vibrant.from(mockPath).getPalette();

// Compare with implementation colors
const colorDelta = calculateColorDelta(mockPalette, implPalette);
```

### 5. Structural Analysis

```javascript
// Analyze DOM structure alignment
const mockStructure = await extractStructure(mockAnalysis);
const implStructure = await extractStructure(page);

const structuralScore = compareStructures(mockStructure, implStructure);
```

## Input Schema

```json
{
  "type": "object",
  "required": ["mockPath", "screenshotPath"],
  "properties": {
    "mockPath": {
      "type": "string",
      "description": "Path to design mock image"
    },
    "screenshotPath": {
      "type": "string",
      "description": "Path to implementation screenshot"
    },
    "scoringWeights": {
      "type": "object",
      "description": "Custom weights for scoring dimensions"
    },
    "tolerances": {
      "type": "object",
      "description": "Tolerance thresholds for scoring"
    },
    "regions": {
      "type": "array",
      "description": "Specific regions to analyze"
    }
  }
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "overallScore": { "type": "number" },
    "breakdown": {
      "type": "object",
      "properties": {
        "layout": { "type": "number" },
        "typography": { "type": "number" },
        "colors": { "type": "number" },
        "spacing": { "type": "number" },
        "components": { "type": "number" },
        "decorative": { "type": "number" }
      }
    },
    "pixelDiff": {
      "type": "object",
      "properties": {
        "percentage": { "type": "number" },
        "diffImagePath": { "type": "string" }
      }
    },
    "differences": { "type": "array" },
    "feedback": { "type": "array" }
  }
}
```

## Process Integration

This skill integrates with:
- `pixel-perfect-implementation.js` - Main convergence process
- `design-qa.js` - Design QA verification
- `hifi-prototyping.js` - High-fidelity prototype validation

## Usage Example

```bash
/skill visual-diff-scorer \
  --mock designs/homepage-mock.png \
  --screenshot artifacts/screenshot.png \
  --weights '{"layout":30,"typography":25,"colors":20,"spacing":10,"components":10,"decorative":5}'
```

## Best Practices

1. **Consistent capture settings** - Same viewport, device scale, timing
2. **Hide dynamic content** - Timestamps, animations, ads
3. **Use appropriate thresholds** - Balance precision vs false positives
4. **Region-based analysis** - Focus on critical areas
5. **Iterative refinement** - Track score progression
