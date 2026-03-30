---
name: visual-qa-scorer
description: Multi-dimensional visual quality scorer for pixel-perfect UI implementation verification
role: Visual QA Specialist
expertise:
  - Layout comparison and grid analysis
  - Typography accuracy verification
  - Color fidelity assessment
  - Spacing and whitespace validation
  - Component visual regression
  - Decorative element positioning
---

# visual-qa-scorer

## Purpose

Performs comprehensive visual analysis comparing an implementation screenshot against a design mock. Produces detailed scores across six quality dimensions (layout, typography, colors, spacing, components, decorative) with configurable weights and tolerances. Identifies specific differences and provides actionable feedback for iterative refinement.

## Capabilities

- **Layout Analysis**: Grid alignment verification, element positioning accuracy, container sizing, overflow detection
- **Typography Scoring**: Font family matching, size verification, weight accuracy, line-height and letter-spacing validation
- **Color Assessment**: Background color matching, gradient accuracy, text color verification, shadow and opacity validation
- **Spacing Validation**: Margin and padding verification, gap consistency, whitespace pattern matching
- **Component Fidelity**: Button, input, card styling verification, border-radius accuracy, state correctness
- **Decorative Elements**: Icon positioning, illustration placement, effect accuracy (shadows, borders)

## Target Processes

- pixel-perfect-implementation.js

## Input Requirements

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
    "mockAnalysis": {
      "type": "object",
      "description": "Pre-analyzed design specifications (optional)"
    },
    "scoringWeights": {
      "type": "object",
      "properties": {
        "layout": { "type": "number", "default": 25 },
        "typography": { "type": "number", "default": 20 },
        "colors": { "type": "number", "default": 20 },
        "spacing": { "type": "number", "default": 15 },
        "components": { "type": "number", "default": 10 },
        "decorative": { "type": "number", "default": 10 }
      }
    },
    "tolerances": {
      "type": "object",
      "properties": {
        "pixelDifference": { "type": "number", "default": 0.5 },
        "colorDelta": { "type": "number", "default": 3 },
        "spacingPx": { "type": "number", "default": 2 },
        "fontSizePx": { "type": "number", "default": 1 }
      }
    },
    "previousScore": {
      "type": "number",
      "description": "Score from previous iteration for convergence tracking"
    }
  }
}
```

## Output Format

```json
{
  "type": "object",
  "required": ["overallScore", "breakdown", "feedback"],
  "properties": {
    "overallScore": {
      "type": "number",
      "minimum": 0,
      "maximum": 100,
      "description": "Weighted overall score"
    },
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
    "differences": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "category": { "type": "string" },
          "severity": { "type": "string", "enum": ["critical", "major", "minor"] },
          "element": { "type": "string" },
          "expected": { "type": "string" },
          "actual": { "type": "string" }
        }
      }
    },
    "feedback": {
      "type": "array",
      "items": { "type": "string" }
    },
    "majorGaps": {
      "type": "array",
      "items": { "type": "string" }
    },
    "remainingGaps": {
      "type": "array",
      "items": { "type": "string" }
    },
    "summary": { "type": "string" },
    "scoreImprovement": { "type": "number" },
    "convergenceStatus": {
      "type": "string",
      "enum": ["improving", "stalled", "regressing"]
    }
  }
}
```

## Scoring Guidelines

### Layout (max 25 points)
- Overall structure matches design (-5 per major difference)
- Element positioning accurate (-2 per misalignment >5px)
- Container sizes correct (-2 per significant size difference)
- Grid/flex alignment proper (-1 per minor alignment issue)

### Typography (max 20 points)
- Correct font families (-5 per wrong font)
- Font sizes match (-2 per size mismatch >1px)
- Font weights correct (-1 per weight mismatch)
- Line heights match (-1 per line height mismatch)
- Letter spacing correct (-1 per spacing mismatch)

### Colors (max 20 points)
- Background colors match (-3 per mismatch)
- Gradients correct (-3 per gradient issue)
- Border colors match (-1 per mismatch)
- Text colors match (-1 per mismatch)
- Shadow colors/opacity correct (-1 per mismatch)

### Spacing (max 15 points)
- Margins match (-2 per mismatch >2px)
- Padding correct (-2 per mismatch >2px)
- Gaps between elements correct (-1 per mismatch)

### Components (max 10 points)
- Button styling matches (-2 per component type off)
- Input styling correct (-2 per input style issue)
- Card styling matches (-2 per card issue)
- Border radius correct (-1 per radius mismatch)

### Decorative (max 10 points)
- Icons present and correct (-2 per missing/wrong icon)
- Illustrations/graphics match (-2 per difference)
- Decorative elements positioned correctly (-1 per misposition)
- Visual effects (shadows, etc.) match (-1 per effect issue)

## Interaction Model

This agent works best when:
1. Given both mock and implementation images for comparison
2. Provided with pre-analyzed mock specifications for faster scoring
3. Tracking iteration-over-iteration improvements
4. Generating actionable, prioritized feedback for refinement
