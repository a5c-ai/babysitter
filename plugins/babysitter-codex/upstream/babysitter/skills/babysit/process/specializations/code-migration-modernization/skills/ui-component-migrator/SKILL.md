---
name: ui-component-migrator
description: Migrate UI components between frameworks with structure, state, and style transformation
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# UI Component Migrator Skill

Migrates UI components between different frameworks, handling structure translation, state management conversion, and style migration.

## Purpose

Enable UI framework migration for:
- Component structure translation
- State management migration
- Lifecycle method conversion
- Event handling transformation
- Style migration

## Capabilities

### 1. Component Structure Translation
- Convert component syntax
- Transform templates
- Migrate component props
- Handle slots/children

### 2. State Management Migration
- Convert local state
- Migrate global state (Redux/Vuex/etc)
- Transform state updates
- Handle computed properties

### 3. Lifecycle Method Conversion
- Map lifecycle methods
- Convert to hooks/composition API
- Handle initialization
- Transform cleanup logic

### 4. Event Handling Transformation
- Convert event bindings
- Transform handlers
- Migrate custom events
- Handle event modifiers

### 5. Style Migration
- Convert CSS-in-JS
- Migrate scoped styles
- Transform CSS modules
- Handle theme systems

### 6. Test Migration
- Convert component tests
- Update test utilities
- Transform mocking
- Migrate snapshots

## Tool Integrations

| Migration Path | Tools | Integration Method |
|---------------|-------|-------------------|
| React -> Vue | Custom transformers | AST |
| Vue -> React | Custom transformers | AST |
| Angular -> React | Custom transformers | AST |
| Class -> Hooks | React codemods | CLI |
| Options -> Composition | Vue codemods | CLI |

## Output Schema

```json
{
  "migrationId": "string",
  "timestamp": "ISO8601",
  "source": {
    "framework": "string",
    "version": "string"
  },
  "target": {
    "framework": "string",
    "version": "string"
  },
  "components": [
    {
      "sourcePath": "string",
      "targetPath": "string",
      "status": "migrated|partial|failed",
      "transformations": [],
      "manualSteps": []
    }
  ],
  "summary": {
    "total": "number",
    "migrated": "number",
    "partial": "number",
    "failed": "number"
  }
}
```

## Integration with Migration Processes

- **ui-framework-migration**: Primary migration tool
- **framework-upgrade**: Internal framework upgrades

## Related Skills

- `codemod-executor`: Transformation execution
- `framework-compatibility-checker`: Compatibility analysis

## Related Agents

- `framework-upgrade-specialist`: Orchestrates UI migration
