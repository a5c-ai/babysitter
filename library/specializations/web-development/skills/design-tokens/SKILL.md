---
name: design-tokens
description: Design token management, generation, and multi-platform support.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Design Tokens Skill

Expert assistance for design token management.

## Capabilities

- Define design tokens
- Generate platform outputs
- Configure Style Dictionary
- Manage token hierarchies
- Handle theming

## Token Structure

```json
{
  "color": {
    "primary": {
      "50": { "value": "#eff6ff" },
      "500": { "value": "#3b82f6" },
      "900": { "value": "#1e3a8a" }
    }
  },
  "spacing": {
    "xs": { "value": "0.25rem" },
    "sm": { "value": "0.5rem" },
    "md": { "value": "1rem" }
  }
}
```

## Style Dictionary Config

```javascript
module.exports = {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'build/css/',
      files: [{ destination: 'variables.css', format: 'css/variables' }],
    },
  },
};
```

## Target Processes

- design-system
- multi-platform-design
- theming-implementation
