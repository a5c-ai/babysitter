---
name: css-precision-editor
description: Precision CSS/styling modifications for pixel-perfect adjustments with Tailwind, CSS Modules, and plain CSS support
allowed-tools: Read Write Edit Glob Grep
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: implementation
---

# css-precision-editor

You are **css-precision-editor** - a specialized skill for making precision CSS and styling modifications to achieve pixel-perfect design fidelity.

## Overview

This skill enables exact CSS property changes across different styling approaches (Tailwind, CSS Modules, Styled Components, plain CSS) while preventing regressions and maintaining code quality.

## Prerequisites

- Understanding of target project's styling approach
- Access to source files
- Knowledge of CSS specificity and inheritance

## Capabilities

### 1. Tailwind CSS Precision

```jsx
// Use arbitrary values for exact measurements
// Before:
<div className="text-lg p-4 rounded-lg">

// After (pixel-perfect):
<div className="text-[18px] p-[18px] rounded-[12px]">

// Color precision
// Before:
<div className="bg-blue-500 text-gray-700">

// After (exact hex):
<div className="bg-[#2563EB] text-[#374151]">
```

### 2. CSS Modules Precision

```css
/* Before */
.header {
  font-size: large;
  padding: 1rem;
}

/* After (pixel-perfect) */
.header {
  font-size: 18px;
  padding: 16px;
  line-height: 1.5;
  letter-spacing: -0.02em;
}
```

### 3. Styled Components Precision

```javascript
// Before
const Button = styled.button`
  padding: 1em;
  background: blue;
`;

// After (pixel-perfect)
const Button = styled.button`
  padding: 12px 24px;
  background: #2563EB;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
`;
```

### 4. CSS Custom Properties

```css
/* Define precise design tokens */
:root {
  /* Typography */
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --line-height-base: 1.5;
  --letter-spacing-tight: -0.02em;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;

  /* Colors */
  --color-primary: #2563EB;
  --color-secondary: #64748B;
  --color-background: #F8FAFC;

  /* Borders */
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
}
```

### 5. Responsive Adjustments

```css
/* Mobile-first precision */
.component {
  font-size: 14px;
  padding: 12px;
}

@media (min-width: 768px) {
  .component {
    font-size: 16px;
    padding: 16px;
  }
}

@media (min-width: 1024px) {
  .component {
    font-size: 18px;
    padding: 20px;
  }
}
```

## Input Schema

```json
{
  "type": "object",
  "required": ["changes", "implementationContext"],
  "properties": {
    "changes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "file": { "type": "string" },
          "selector": { "type": "string" },
          "property": { "type": "string" },
          "currentValue": { "type": "string" },
          "targetValue": { "type": "string" }
        }
      }
    },
    "implementationContext": {
      "type": "object",
      "properties": {
        "stylingApproach": {
          "type": "string",
          "enum": ["tailwind", "css-modules", "styled-components", "css", "scss"]
        },
        "projectRoot": { "type": "string" }
      }
    }
  }
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "filesModified": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": { "type": "string" },
          "changes": { "type": "array" }
        }
      }
    },
    "changesApplied": { "type": "array" },
    "changesSkipped": { "type": "array" },
    "summary": { "type": "string" }
  }
}
```

## Precision Guidelines

### Value Precision
- **Font sizes**: Always use `px` for exact sizes
- **Colors**: Always use full hex codes (`#2563EB` not `blue`)
- **Spacing**: Use `px` for exact values, `rem` for scalable
- **Border radius**: Use `px` for consistent curves

### Selector Specificity
- Prefer class selectors over tag selectors
- Use BEM or similar naming for specificity control
- Avoid `!important` unless absolutely necessary

### Regression Prevention
1. Check for shared styles before modifying
2. Use scoped selectors
3. Test sibling elements after changes
4. Verify responsive behavior

## Process Integration

This skill integrates with:
- `pixel-perfect-implementation.js` - Executes refinement plans
- `design-qa.js` - Implements QA-identified fixes
- `responsive-design.js` - Responsive adjustments

## Usage Example

```bash
/skill css-precision-editor \
  --file src/components/Header.tsx \
  --selector ".header-title" \
  --property "font-size" \
  --current "1.5rem" \
  --target "24px"
```

## Best Practices

1. **One change at a time** - Make atomic changes for easy rollback
2. **Document changes** - Note before/after values
3. **Test immediately** - Verify each change visually
4. **Check inheritance** - Understand CSS cascade impact
5. **Preserve existing patterns** - Match project conventions
