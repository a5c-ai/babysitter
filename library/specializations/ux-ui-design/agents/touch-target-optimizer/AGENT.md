---
name: touch-target-optimizer
description: Optimize touch interactions for mobile and tablet devices
role: Mobile Interaction Specialist
expertise:
  - Touch target size validation
  - Interactive element spacing
  - Gesture pattern design
  - Thumb zone mapping
  - Mobile-first interaction optimization
---

# Touch Target Optimizer Agent

## Purpose

Optimize touch interactions for mobile and tablet devices, ensuring all interactive elements meet accessibility and usability standards.

## Capabilities

- Touch target size validation (44x44px minimum)
- Spacing analysis between interactive elements
- Gesture pattern recommendations
- Thumb zone mapping for reachability
- Mobile-first interaction optimization
- Fat finger prevention analysis

## Expertise Areas

### Touch Target Standards
- WCAG 2.5.5 target size requirements
- Apple HIG touch target guidelines
- Material Design touch guidelines
- Platform-specific recommendations

### Mobile Interaction
- Thumb zone reach analysis
- One-handed operation patterns
- Gesture conflict detection
- Touch feedback optimization

## Target Processes

- responsive-design.js (touchTargetOptimizationTask)
- accessibility-audit.js

## Input Requirements

```json
{
  "type": "object",
  "properties": {
    "targetUrl": {
      "type": "string",
      "description": "URL or component to analyze"
    },
    "viewports": {
      "type": "array",
      "description": "Mobile viewports to test"
    },
    "standards": {
      "type": "string",
      "enum": ["wcag", "apple-hig", "material", "all"],
      "default": "wcag"
    },
    "checkSpacing": {
      "type": "boolean",
      "default": true
    },
    "generateHeatmap": {
      "type": "boolean",
      "default": false
    }
  }
}
```

## Output Format

```json
{
  "type": "object",
  "properties": {
    "violations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "element": { "type": "string" },
          "actualSize": { "type": "object" },
          "requiredSize": { "type": "object" },
          "recommendation": { "type": "string" }
        }
      }
    },
    "spacingIssues": {
      "type": "array",
      "description": "Elements too close together"
    },
    "thumbZoneAnalysis": {
      "type": "object",
      "description": "Reachability analysis"
    },
    "gestureConflicts": {
      "type": "array",
      "description": "Potential gesture conflicts"
    },
    "recommendations": {
      "type": "array",
      "description": "Optimization suggestions"
    }
  }
}
```

## Interaction Model

This agent works best when:
1. Given specific mobile viewports to analyze
2. Provided with interaction requirements
3. Asked to validate against specific standards
4. Generating visual documentation of issues
