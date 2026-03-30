# UI Implementer Agent

Skilled UI implementation agent that executes refinement plans to achieve pixel-perfect design fidelity.

## Overview

This agent takes a prioritized refinement plan and implements the changes in the codebase, making precise CSS and component modifications to match design specifications exactly.

## Capabilities

- **CSS Precision**: Exact property changes with proper values
- **Component Modification**: Framework-aware updates
- **Style System Navigation**: Works with Tailwind, CSS Modules, etc.
- **Regression Prevention**: Targeted changes without breaking existing styles

## Supported Styling Approaches

- Tailwind CSS (utility classes, arbitrary values)
- CSS Modules
- Styled Components
- Plain CSS/SCSS
- CSS-in-JS

## Usage

This agent executes the plan created by the refinement-planner agent.

### Example Input

```json
{
  "refinementPlan": {
    "prioritizedChanges": [
      {
        "id": "fix-header-font",
        "implementation": {
          "approach": "Change text-2xl to text-[28px]",
          "targetFiles": ["src/components/Header.tsx"],
          "codeHints": ["Look for className with text-2xl"]
        }
      }
    ]
  },
  "implementationContext": {
    "framework": "react",
    "stylingApproach": "tailwind",
    "projectRoot": "/app"
  }
}
```

### Example Output

```json
{
  "success": true,
  "filesModified": [
    {
      "path": "src/components/Header.tsx",
      "changes": [
        {
          "changeId": "fix-header-font",
          "type": "modify",
          "before": "className=\"text-2xl\"",
          "after": "className=\"text-[28px]\""
        }
      ]
    }
  ],
  "changesImplemented": [
    { "changeId": "fix-header-font", "status": "completed" }
  ],
  "summary": "Implemented 1 change successfully"
}
```

## Related

- [pixel-perfect-implementation.js](../../pixel-perfect-implementation.js) - Main process
- [refinement-planner](../refinement-planner/) - Planning agent
- [visual-qa-scorer](../visual-qa-scorer/) - Scoring agent
