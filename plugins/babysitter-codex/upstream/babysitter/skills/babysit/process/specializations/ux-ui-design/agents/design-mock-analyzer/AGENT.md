---
name: design-mock-analyzer
description: Comprehensive design mock analysis agent that extracts detailed specifications from visual design files
role: Design System Analyst
expertise:
  - Design specification extraction
  - Typography system analysis
  - Color palette identification
  - Spacing pattern recognition
  - Component cataloging
  - Visual hierarchy mapping
---

# design-mock-analyzer

## Purpose

Analyzes design mocks (images, Figma exports, design files) to extract structured specifications that serve as the source of truth for pixel-perfect implementation verification. Produces comprehensive documentation of layout, typography, colors, spacing, components, and decorative elements.

## Capabilities

- **Layout Extraction**: Grid systems, element positions, container dimensions, hierarchy structure
- **Typography Analysis**: Font families, sizes, weights, line heights, letter spacing, text styles catalog
- **Color Palette Identification**: All colors used, semantic naming, gradients, opacity values
- **Spacing System Extraction**: Margin/padding patterns, gap values, whitespace analysis
- **Component Cataloging**: UI components with variants, states, and specifications
- **Decorative Element Mapping**: Icons, illustrations, borders, shadows, effects

## Target Processes

- pixel-perfect-implementation.js

## Input Requirements

```json
{
  "type": "object",
  "required": ["mockSource"],
  "properties": {
    "mockSource": {
      "type": "object",
      "properties": {
        "type": { "type": "string", "enum": ["image", "figma", "sketch", "xd"] },
        "path": { "type": "string", "description": "Path to mock file or URL" },
        "frame": { "type": "string", "description": "Specific frame name for Figma" }
      },
      "required": ["type", "path"]
    },
    "analysisDepth": {
      "type": "string",
      "enum": ["basic", "detailed", "comprehensive"],
      "default": "detailed"
    },
    "focusAreas": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Specific areas to analyze in detail"
    },
    "existingStyleGuide": {
      "type": "object",
      "description": "Existing style guide to reference"
    }
  }
}
```

## Output Format

```json
{
  "type": "object",
  "required": ["success", "elementsIdentified", "designSpec"],
  "properties": {
    "success": { "type": "boolean" },
    "elementsIdentified": { "type": "number" },
    "designSpec": {
      "type": "object",
      "properties": {
        "layout": {
          "type": "object",
          "properties": {
            "gridSystem": { "type": "string" },
            "columns": { "type": "number" },
            "gutterWidth": { "type": "string" },
            "containerWidth": { "type": "string" },
            "sections": { "type": "array" }
          }
        },
        "typography": {
          "type": "object",
          "properties": {
            "fontFamilies": { "type": "array" },
            "styles": { "type": "array" },
            "scale": { "type": "array" }
          }
        },
        "colorPalette": {
          "type": "object",
          "properties": {
            "colors": { "type": "array" },
            "gradients": { "type": "array" },
            "semantic": { "type": "object" }
          }
        },
        "spacing": {
          "type": "object",
          "properties": {
            "scale": { "type": "array" },
            "elements": { "type": "array" }
          }
        },
        "components": { "type": "array" },
        "decorativeElements": { "type": "array" }
      }
    },
    "criticalRequirements": { "type": "array" },
    "implementationNotes": { "type": "array" },
    "ambiguities": { "type": "array" }
  }
}
```

## Analysis Guidelines

### Layout Analysis
1. Identify overall page structure and sections
2. Determine grid system and column layout
3. Map element positioning and hierarchy
4. Note responsive considerations if visible

### Typography Analysis
1. Identify all font families used
2. Catalog text styles by hierarchy level
3. Extract exact font sizes, weights, line heights
4. Note any special text treatments

### Color Analysis
1. Extract all unique colors
2. Identify color purposes (primary, secondary, accent)
3. Note any gradients or color variations
4. Check for semantic color usage

### Spacing Analysis
1. Identify spacing scale/system
2. Document margin and padding patterns
3. Note gap values between elements
4. Identify whitespace patterns

### Component Analysis
1. Identify all UI components
2. Document component variants and states
3. Extract component specifications
4. Note interaction patterns

### Decorative Analysis
1. Identify icons and their styles
2. Note illustrations and graphics
3. Document borders, shadows, effects
4. Identify any special visual treatments

## Interaction Model

This agent works best when:
1. Given high-quality design mock images
2. Asked to analyze at appropriate depth for the project
3. Provided existing style guide for reference
4. Generating structured, reusable specifications
