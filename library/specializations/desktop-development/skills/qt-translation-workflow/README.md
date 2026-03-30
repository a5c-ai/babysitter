# qt-translation-workflow

Set up Qt Linguist workflow with .ts files and translation management.

## Overview

This skill configures the complete Qt internationalization pipeline, including string extraction with lupdate, translation file management, and .qm compilation with lrelease.

## Quick Start

```javascript
const result = await invokeSkill('qt-translation-workflow', {
  projectPath: '/path/to/qt-project',
  languages: ['de', 'fr', 'ja', 'zh-CN'],
  sourceLanguage: 'en',
  translationDir: 'translations',
  includeQml: true,
  generateCMake: true
});
```

## Features

### Workflow Steps

1. Mark strings with `tr()` / `qsTr()`
2. Extract with `lupdate`
3. Translate in Qt Linguist
4. Compile with `lrelease`
5. Load at runtime

### Generated Files

| File | Purpose |
|------|---------|
| translations/*.ts | Translation source files |
| translations/*.qm | Compiled translations |
| CMakeLists.txt | CMake integration |

## Commands

```bash
# Extract strings
lupdate src/ qml/ -ts translations/*.ts

# Compile
lrelease translations/*.ts

# Edit
linguist translations/myapp_de.ts
```

## Related Skills

- `qt-cmake-project-generator`
- `docs-localization`

## Related Agents

- `qt-cpp-specialist`
- `localization-coordinator`
