---
name: typography-calculator
description: Calculate typography scales, metrics, and responsive font sizing
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Typography Calculator Skill

## Purpose

Calculate typography scales and metrics for design systems, including modular scales, line heights, and responsive font sizing.

## Capabilities

- Generate type scales (modular, golden ratio, major third, etc.)
- Calculate optimal line heights for readability
- Generate responsive font sizing with fluid typography
- Calculate vertical rhythm and baseline grids
- Generate font-size/line-height pairings
- Create typography tokens

## Target Processes

- design-system.js
- component-library.js (typographySystemDesignTask)
- responsive-design.js (responsiveTypographySpacingTask)

## Integration Points

- type-scale.com algorithms
- CSS clamp() for fluid typography
- Modular scale calculations

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "baseSize": {
      "type": "number",
      "default": 16,
      "description": "Base font size in pixels"
    },
    "scaleRatio": {
      "type": "string",
      "enum": ["minor-second", "major-second", "minor-third", "major-third", "perfect-fourth", "augmented-fourth", "perfect-fifth", "golden-ratio"],
      "default": "perfect-fourth"
    },
    "steps": {
      "type": "number",
      "default": 6,
      "description": "Number of scale steps above and below base"
    },
    "lineHeightRatio": {
      "type": "number",
      "default": 1.5,
      "description": "Base line height ratio"
    },
    "fluidTypography": {
      "type": "boolean",
      "default": true
    },
    "minViewport": {
      "type": "number",
      "default": 320
    },
    "maxViewport": {
      "type": "number",
      "default": 1440
    }
  },
  "required": ["baseSize"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "scale": {
      "type": "array",
      "description": "Typography scale with sizes"
    },
    "lineHeights": {
      "type": "object",
      "description": "Optimal line heights for each size"
    },
    "fluidSizes": {
      "type": "object",
      "description": "CSS clamp values for fluid typography"
    },
    "verticalRhythm": {
      "type": "object",
      "description": "Vertical rhythm calculations"
    },
    "tokens": {
      "type": "object",
      "description": "Typography design tokens"
    }
  }
}
```

## Usage Example

```javascript
const result = await skill.execute({
  baseSize: 16,
  scaleRatio: 'perfect-fourth',
  steps: 6,
  fluidTypography: true,
  minViewport: 320,
  maxViewport: 1440
});
```
