---
name: color-palette-generator
description: Generate accessible color palettes with WCAG compliance
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Color Palette Generator Skill

## Purpose

Generate accessible color palettes that comply with WCAG contrast requirements, create color scales, and export to design token formats.

## Capabilities

- Create color scales from base colors
- Generate complementary, analogous, and triadic color schemes
- Ensure WCAG 2.1 AA/AAA contrast compliance
- Export palettes to design token formats (CSS, SCSS, JSON)
- Generate dark mode color variants
- Calculate color contrast ratios
- Suggest accessible color alternatives

## Target Processes

- design-system.js
- component-library.js (colorSystemDesignTask)
- accessibility-audit.js

## Integration Points

- chroma.js for color manipulation
- color-contrast-checker for WCAG validation
- Style Dictionary for token export

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "baseColors": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Base colors in hex format"
    },
    "schemeType": {
      "type": "string",
      "enum": ["complementary", "analogous", "triadic", "split-complementary", "monochromatic"]
    },
    "contrastLevel": {
      "type": "string",
      "enum": ["AA", "AAA"],
      "default": "AA"
    },
    "includeDarkMode": {
      "type": "boolean",
      "default": true
    },
    "outputFormat": {
      "type": "string",
      "enum": ["css", "scss", "json", "tokens"],
      "default": "tokens"
    }
  },
  "required": ["baseColors"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "palette": {
      "type": "object",
      "description": "Generated color palette with scales"
    },
    "contrastMatrix": {
      "type": "array",
      "description": "Contrast ratios between color pairs"
    },
    "darkModePalette": {
      "type": "object",
      "description": "Dark mode color variants"
    },
    "tokenOutput": {
      "type": "string",
      "description": "Exported tokens in requested format"
    },
    "accessibilityReport": {
      "type": "object",
      "description": "WCAG compliance report"
    }
  }
}
```

## Usage Example

```javascript
const result = await skill.execute({
  baseColors: ['#1a73e8', '#34a853', '#ea4335'],
  schemeType: 'complementary',
  contrastLevel: 'AA',
  includeDarkMode: true,
  outputFormat: 'tokens'
});
```
