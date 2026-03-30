# Codemod Executor Skill

## Overview

The Codemod Executor skill runs automated AST-based code transformations. It enables large-scale refactoring, framework migrations, and consistent code pattern updates across entire codebases.

## Quick Start

### Prerequisites

- Node.js 18+ (for JavaScript codemods)
- Language-specific codemod tools
- Version control for safety

### Basic Usage

1. **Select codemod**
   ```bash
   # List available codemods
   npx jscodeshift --list
   ```

2. **Dry run**
   ```bash
   npx jscodeshift -t transform.js src/ --dry
   ```

3. **Execute**
   ```bash
   npx jscodeshift -t transform.js src/
   ```

## Features

### Transformation Types

| Type | Use Case | Example |
|------|----------|---------|
| API Migration | Update deprecated APIs | React lifecycle methods |
| Syntax Upgrade | Language version updates | async/await conversion |
| Pattern Replacement | Standardize patterns | Error handling |
| Import Updates | Module path changes | Package renames |

### Common Codemods

- React: `react-codemod`
- Next.js: `@next/codemod`
- TypeScript: `ts-morph` scripts
- Java: OpenRewrite recipes

## Configuration

```json
{
  "parser": "tsx",
  "extensions": ["ts", "tsx"],
  "ignorePattern": ["**/node_modules/**", "**/dist/**"],
  "dryRun": false,
  "verbose": true
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [jscodeshift](https://github.com/facebook/jscodeshift)
- [OpenRewrite](https://docs.openrewrite.org/)
