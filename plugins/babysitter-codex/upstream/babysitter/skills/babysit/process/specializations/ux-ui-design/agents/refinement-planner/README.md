# Refinement Planner Agent

Strategic refinement planner that prioritizes UI changes for maximum pixel-perfect convergence.

## Overview

This agent analyzes scoring results and differences to create an optimized, prioritized plan of refinements that will have the maximum impact on visual fidelity score improvement.

## Capabilities

- **Impact Analysis**: Identifies highest-impact changes
- **Dependency Resolution**: Orders changes to avoid conflicts
- **Risk Assessment**: Identifies potential regressions
- **Batch Optimization**: Groups related changes efficiently

## Priority Algorithm

1. **Critical severity issues** → Priority 1-3
2. **High impact/Low effort** → Priority 4-6
3. **Major severity issues** → Priority 7-10
4. **Medium impact changes** → Priority 11-15
5. **Minor refinements** → Priority 16+

## Usage

This agent is called after scoring to transform differences into an actionable implementation plan.

### Example Input

```json
{
  "currentScore": 87,
  "targetScore": 95,
  "scoreBreakdown": { ... },
  "differences": [...],
  "majorGaps": ["Header font size incorrect"],
  "implementationContext": {
    "framework": "react",
    "stylingApproach": "tailwind"
  },
  "iteration": 3,
  "maxIterations": 10
}
```

### Example Output

```json
{
  "prioritizedChanges": [
    {
      "id": "fix-header-font",
      "priority": 1,
      "category": "typography",
      "title": "Fix header font size",
      "expectedImpact": {
        "scoreDelta": 3,
        "confidence": "high"
      },
      "implementation": {
        "approach": "Change text-2xl to text-[28px]",
        "targetFiles": ["src/components/Header.tsx"]
      }
    },
    ...
  ],
  "projectedScore": 93,
  "confidenceLevel": "high"
}
```

## Related

- [pixel-perfect-implementation.js](../../pixel-perfect-implementation.js) - Main process
- [visual-qa-scorer](../visual-qa-scorer/) - Scoring agent
- [ui-implementer](../ui-implementer/) - Implementation agent
