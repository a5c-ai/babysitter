---
name: design-token-transformer
description: Transform design tokens across multiple formats and platforms. Parse W3C design token format, transform to CSS/SCSS/JS/iOS/Android, handle token aliases and references, and generate documentation.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: design-systems
  backlog-id: SK-UX-003
---

# design-token-transformer

You are **design-token-transformer** - a specialized skill for transforming design tokens across multiple formats and platforms, enabling consistent design system implementation.

## Overview

This skill enables AI-powered design token transformation including:
- Parsing W3C Design Token Community Group format
- Transforming tokens to CSS, SCSS, Less, JS, TypeScript
- Generating platform-specific formats (iOS Swift, Android XML/Kotlin)
- Handling token aliases, references, and composite tokens
- Managing token inheritance and theming
- Generating comprehensive token documentation

## Prerequisites

- Node.js 18+ installed
- Design token source files (JSON, YAML)
- Optional: Style Dictionary for advanced transformations

## Capabilities

### 1. Token Format Parsing

Support for multiple input formats:

```json
// W3C Design Token Community Group Format
{
  "color": {
    "primary": {
      "$value": "#2196F3",
      "$type": "color",
      "$description": "Primary brand color"
    },
    "primary-light": {
      "$value": "{color.primary}",
      "$type": "color",
      "alpha": 0.5
    }
  },
  "spacing": {
    "sm": {
      "$value": "8px",
      "$type": "dimension"
    },
    "md": {
      "$value": "{spacing.sm} * 2",
      "$type": "dimension"
    }
  }
}
```

### 2. CSS/SCSS Transformation

Generate CSS custom properties and SCSS variables:

```css
/* CSS Custom Properties */
:root {
  /* Colors */
  --color-primary: #2196F3;
  --color-primary-light: rgba(33, 150, 243, 0.5);
  --color-secondary: #9C27B0;

  /* Typography */
  --font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-base: 16px;
  --font-size-lg: 1.25rem;
  --font-weight-bold: 700;
  --line-height-base: 1.5;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark theme override */
[data-theme="dark"] {
  --color-primary: #64B5F6;
  --color-background: #121212;
  --color-surface: #1E1E1E;
}
```

```scss
// SCSS Variables
$color-primary: #2196F3;
$color-primary-light: rgba(33, 150, 243, 0.5);
$color-secondary: #9C27B0;

$font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
$font-size-base: 16px;
$font-size-lg: 1.25rem;

$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;

// SCSS Maps for iteration
$colors: (
  'primary': $color-primary,
  'primary-light': $color-primary-light,
  'secondary': $color-secondary
);

$spacing: (
  'xs': $spacing-xs,
  'sm': $spacing-sm,
  'md': $spacing-md
);
```

### 3. JavaScript/TypeScript Transformation

Generate typed token modules:

```typescript
// tokens.ts
export const colors = {
  primary: '#2196F3',
  primaryLight: 'rgba(33, 150, 243, 0.5)',
  secondary: '#9C27B0',
} as const;

export const typography = {
  fontFamilyBase: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontSizeBase: '16px',
  fontSizeLg: '1.25rem',
  fontWeightBold: 700,
  lineHeightBase: 1.5,
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
} as const;

// Type exports
export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;

// Theme interface
export interface Theme {
  colors: typeof colors;
  typography: typeof typography;
  spacing: typeof spacing;
}

export const theme: Theme = {
  colors,
  typography,
  spacing,
};
```

### 4. iOS Swift Transformation

Generate Swift constants and extensions:

```swift
// DesignTokens.swift
import UIKit

public enum DesignTokens {
    public enum Colors {
        public static let primary = UIColor(hex: "#2196F3")
        public static let primaryLight = UIColor(hex: "#2196F3").withAlphaComponent(0.5)
        public static let secondary = UIColor(hex: "#9C27B0")
    }

    public enum Typography {
        public static let fontFamilyBase = "Inter"
        public static let fontSizeBase: CGFloat = 16
        public static let fontSizeLg: CGFloat = 20
        public static let fontWeightBold: UIFont.Weight = .bold
    }

    public enum Spacing {
        public static let xs: CGFloat = 4
        public static let sm: CGFloat = 8
        public static let md: CGFloat = 16
        public static let lg: CGFloat = 24
        public static let xl: CGFloat = 32
    }
}

// UIColor extension for hex support
extension UIColor {
    convenience init(hex: String) {
        // Implementation
    }
}
```

### 5. Android Transformation

Generate Android resource files:

```xml
<!-- colors.xml -->
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="color_primary">#2196F3</color>
    <color name="color_primary_light">#802196F3</color>
    <color name="color_secondary">#9C27B0</color>
</resources>

<!-- dimens.xml -->
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <dimen name="spacing_xs">4dp</dimen>
    <dimen name="spacing_sm">8dp</dimen>
    <dimen name="spacing_md">16dp</dimen>
    <dimen name="spacing_lg">24dp</dimen>
    <dimen name="spacing_xl">32dp</dimen>

    <dimen name="font_size_base">16sp</dimen>
    <dimen name="font_size_lg">20sp</dimen>
</resources>
```

### 6. Token Documentation Generation

Generate comprehensive token documentation:

```markdown
# Design Tokens Documentation

## Colors

| Token | Value | Description |
|-------|-------|-------------|
| `color-primary` | #2196F3 | Primary brand color |
| `color-primary-light` | rgba(33, 150, 243, 0.5) | Light variant of primary |
| `color-secondary` | #9C27B0 | Secondary brand color |

## Typography

| Token | Value | Usage |
|-------|-------|-------|
| `font-family-base` | Inter | Primary font family |
| `font-size-base` | 16px | Body text size |
| `font-size-lg` | 1.25rem | Large text size |

## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `spacing-xs` | 4px | Tight spacing |
| `spacing-sm` | 8px | Small spacing |
| `spacing-md` | 16px | Medium spacing (default) |
```

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Installation |
|--------|-------------|--------------|
| Superdesign MCP Server | Design orchestrator with token support | [GitHub](https://glama.ai/mcp/servers/@jonthebeef/superdesign-mcp-claude-code) |

## Best Practices

1. **Use semantic naming** - Name tokens by purpose, not value (e.g., `color-primary` not `color-blue`)
2. **Establish a hierarchy** - Use base/component/semantic token levels
3. **Document everything** - Include descriptions and usage examples
4. **Version tokens** - Track changes and migrations
5. **Validate references** - Ensure all token aliases resolve correctly
6. **Test transformations** - Verify output on target platforms

## Process Integration

This skill integrates with the following processes:
- `component-library.js` - Design token consumption
- `design-system.js` - Token management and versioning
- `responsive-design.js` - Responsive token scaling

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "transform",
  "inputFormat": "w3c-dtcg",
  "outputFormats": ["css", "scss", "ts"],
  "status": "success",
  "tokenCount": 45,
  "artifacts": [
    "tokens.css",
    "tokens.scss",
    "tokens.ts"
  ],
  "warnings": [],
  "validationResults": {
    "aliasesResolved": true,
    "circularReferences": false,
    "missingValues": []
  }
}
```

## Error Handling

- Validate token structure before transformation
- Report circular reference errors
- Handle missing alias references gracefully
- Provide helpful error messages for invalid values

## Constraints

- Token names must be valid identifiers for target platforms
- Color values should be in standard formats (hex, rgb, hsl)
- Dimension values must include units
- Composite tokens require all sub-values
