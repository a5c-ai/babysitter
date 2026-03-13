# Design Mock Analyzer Agent

Comprehensive design mock analysis agent that extracts detailed specifications from visual design files.

## Overview

This agent analyzes design mocks (images, Figma exports) to extract structured specifications that serve as the source of truth for pixel-perfect implementation verification.

## Capabilities

- **Layout Extraction**: Grid systems, element positions, hierarchy
- **Typography Extraction**: Font specifications, text styles
- **Color Palette Extraction**: All colors and their purposes
- **Spacing System Extraction**: Margin/padding patterns, gap values
- **Component Identification**: UI components, variants, states
- **Decorative Element Identification**: Icons, illustrations, effects

## Usage

This agent is called at the start of the `pixel-perfect-implementation` process to establish design specifications.

### Example Input

```json
{
  "mockSource": "designs/homepage-mock.png",
  "mockType": "image",
  "analysisDepth": "detailed",
  "projectContext": "E-commerce product listing page"
}
```

### Example Output

```json
{
  "designSpec": {
    "layout": {
      "gridSystem": "12-column with 24px gutters",
      "containerWidth": "1200px",
      "sections": [...]
    },
    "typography": {
      "fontFamilies": [
        { "name": "Inter", "usage": "body text" },
        { "name": "Playfair Display", "usage": "headings" }
      ],
      "textStyles": [...]
    },
    "colors": {
      "palette": [
        { "name": "primary", "hex": "#2563EB" },
        ...
      ]
    },
    "spacing": { ... },
    "components": [ ... ],
    "decorativeElements": [ ... ]
  },
  "implementationNotes": [...],
  "ambiguities": [...]
}
```

## Related

- [pixel-perfect-implementation.js](../../pixel-perfect-implementation.js) - Main process
- [visual-qa-scorer](../visual-qa-scorer/) - Scoring agent
