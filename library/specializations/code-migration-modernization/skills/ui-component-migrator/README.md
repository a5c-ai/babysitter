# UI Component Migrator Skill

## Overview

The UI Component Migrator skill handles migration of UI components between frameworks. It transforms component structure, state management, and styles while preserving functionality.

## Quick Start

### Prerequisites

- Source components
- Target framework setup
- Transformation rules

### Basic Usage

1. **Analyze components**
   - Inventory components
   - Identify patterns
   - Map state management

2. **Configure migration**
   - Define transformation rules
   - Set up target structure
   - Configure style handling

3. **Execute migration**
   - Transform components
   - Verify functionality
   - Fix manual items

## Features

### Migration Paths

| From | To | Complexity |
|------|-----|------------|
| React Class | React Hooks | Low |
| Vue Options | Vue Composition | Medium |
| Angular | React | High |
| jQuery | React/Vue | High |

### Transformation Types

- Template/JSX conversion
- State management translation
- Lifecycle to hooks
- Event binding updates
- Style system migration

## Configuration

```json
{
  "source": {
    "framework": "vue",
    "version": "2.x"
  },
  "target": {
    "framework": "vue",
    "version": "3.x"
  },
  "options": {
    "useCompositionApi": true,
    "migrateStyles": true,
    "migrateTests": true
  }
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
