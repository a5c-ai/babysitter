---
name: contrast-checker
description: Check color contrast ratios for WCAG compliance
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Contrast Checker Skill

## Purpose

Calculate and validate color contrast ratios according to WCAG 2.1 guidelines, ensuring text readability and accessibility compliance.

## Capabilities

- Calculate WCAG contrast ratios
- Validate normal text (4.5:1) and large text (3:1) requirements
- Check AA and AAA compliance levels
- Suggest passing color alternatives
- Batch check multiple color pairs
- Analyze color palettes for contrast issues

## Target Processes

- accessibility-audit.js (colorContrastVisualAnalysisTask)
- component-library.js (colorSystemDesignTask)
- design-system.js

## Integration Points

- color-contrast-checker library
- polished.js
- chroma.js

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "colorPairs": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "foreground": { "type": "string" },
          "background": { "type": "string" },
          "textSize": { "type": "string", "enum": ["normal", "large"] }
        }
      }
    },
    "targetLevel": {
      "type": "string",
      "enum": ["AA", "AAA"],
      "default": "AA"
    },
    "suggestAlternatives": {
      "type": "boolean",
      "default": true
    },
    "palette": {
      "type": "object",
      "description": "Color palette to analyze for contrast"
    }
  },
  "required": ["colorPairs"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "results": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "foreground": { "type": "string" },
          "background": { "type": "string" },
          "ratio": { "type": "number" },
          "passesAA": { "type": "boolean" },
          "passesAAA": { "type": "boolean" },
          "passesAALarge": { "type": "boolean" },
          "alternatives": { "type": "array" }
        }
      }
    },
    "summary": {
      "type": "object",
      "properties": {
        "totalPairs": { "type": "number" },
        "passingAA": { "type": "number" },
        "passingAAA": { "type": "number" },
        "failing": { "type": "number" }
      }
    },
    "paletteAnalysis": {
      "type": "object",
      "description": "Full palette contrast matrix"
    }
  }
}
```

## Usage Example

```javascript
const result = await skill.execute({
  colorPairs: [
    { foreground: '#333333', background: '#ffffff', textSize: 'normal' },
    { foreground: '#666666', background: '#f0f0f0', textSize: 'large' }
  ],
  targetLevel: 'AA',
  suggestAlternatives: true
});
```
