# Visual QA Scorer Agent

Multi-dimensional visual quality scorer for pixel-perfect UI implementation verification.

## Overview

This agent performs comprehensive visual analysis comparing an implementation screenshot against a design mock. It produces detailed scores across six quality dimensions with configurable weights and tolerances.

## Scoring Dimensions

| Dimension | Default Weight | Focus Areas |
|-----------|---------------|-------------|
| Layout | 25 | Grid alignment, element positioning, overflow |
| Typography | 20 | Font families, sizes, weights, line heights |
| Colors | 20 | Background, text, accent colors, gradients |
| Spacing | 15 | Margins, padding, gaps, whitespace |
| Components | 10 | UI component fidelity, state accuracy |
| Decorative | 10 | Icons, borders, shadows, effects |

## Usage

This agent is designed to be called as part of the `pixel-perfect-implementation` process iterative convergence loop.

### Example Input

```json
{
  "mockPath": "artifacts/design-mock.png",
  "screenshotPath": "artifacts/screenshot-iteration-3.png",
  "scoringWeights": {
    "layout": 25,
    "typography": 20,
    "colors": 20,
    "spacing": 15,
    "components": 10,
    "decorative": 10
  },
  "tolerances": {
    "pixelDifference": 0.5,
    "colorDelta": 3,
    "spacingPx": 2,
    "fontSizePx": 1
  },
  "previousScore": 87
}
```

### Example Output

```json
{
  "overallScore": 92,
  "breakdown": {
    "layout": 24,
    "typography": 18,
    "colors": 20,
    "spacing": 14,
    "components": 9,
    "decorative": 7
  },
  "differences": [...],
  "feedback": ["Typography improved from last iteration", ...],
  "majorGaps": ["Header spacing too wide"],
  "scoreImprovement": 5,
  "convergenceStatus": "improving"
}
```

## Related

- [pixel-perfect-implementation.js](../../pixel-perfect-implementation.js) - Main process
- [design-mock-analyzer](../design-mock-analyzer/) - Mock analysis agent
- [refinement-planner](../refinement-planner/) - Planning agent
