# Module Systems Skill

Design and implement module systems for programming languages with support for resolution algorithms, visibility control, and dependency management.

## Overview

This skill provides expertise in module system design and implementation. It covers import/export mechanisms, resolution algorithms, cyclic dependency handling, visibility control, and integration with package managers.

## When to Use

- Designing a module system for a new language
- Implementing module resolution algorithms
- Handling cyclic dependencies
- Building visibility/access control systems
- Integrating with package managers

## Expertise Areas

### Resolution Algorithms

Multiple resolution strategies:
- Node.js-style node_modules walking
- Rust-style crate/super/self paths
- Python-style package resolution
- Custom resolution strategies

### Dependency Management

Comprehensive dependency handling:
- Dependency graph construction
- Cyclic dependency detection (Tarjan's SCC)
- Topological sort for load ordering
- Diamond dependency handling

### Visibility Control

Fine-grained access control:
- Public/private visibility
- Crate/package-level visibility
- Path-restricted visibility
- Re-export visibility propagation

### Module Loading

Flexible loading strategies:
- Synchronous loading
- Async/lazy loading
- Parallel loading with dependency ordering
- Hot module replacement support

## Quick Start

### ES6-Style Module System

```json
{
  "moduleStyle": "es6",
  "resolutionStrategy": "node",
  "features": [
    "import-export",
    "default-exports",
    "re-exports",
    "namespace-aliasing"
  ],
  "cyclicHandling": "error"
}
```

### Rust-Style Module System

```json
{
  "moduleStyle": "rust",
  "resolutionStrategy": "rust",
  "features": [
    "visibility-control",
    "inline-modules",
    "re-exports",
    "package-integration"
  ],
  "visibility": {
    "default": "private",
    "levels": ["private", "pub(crate)", "pub(super)", "pub"]
  }
}
```

### ML-Style Module System

```json
{
  "moduleStyle": "ml",
  "resolutionStrategy": "custom",
  "features": [
    "signatures",
    "functors",
    "first-class-modules",
    "module-types"
  ]
}
```

## Generated Components

### Resolution Engine

```typescript
interface ModuleResolver {
  // Resolve import specifier to file path
  resolve(specifier: string, fromPath: string): ResolvedModule;

  // Build full dependency graph
  buildGraph(entryPoints: string[]): ModuleGraph;

  // Get load order respecting dependencies
  getLoadOrder(graph: ModuleGraph): string[];
}
```

### Visibility Checker

```typescript
interface VisibilityChecker {
  // Check if access is allowed
  canAccess(item: Item, from: Module): boolean;

  // Get effective visibility of re-export
  effectiveVisibility(item: Item, throughPath: ModulePath[]): Visibility;

  // Report visibility violations
  checkModule(module: Module): VisibilityError[];
}
```

### Module Loader

```typescript
interface ModuleLoader {
  // Load module and its dependencies
  load(specifier: string): Promise<Module>;

  // Load with progress tracking
  loadWithProgress(specifier: string, onProgress: (loaded: number, total: number) => void): Promise<Module>;

  // Invalidate cached module
  invalidate(specifier: string): void;
}
```

## Import/Export Patterns

### ES6 Patterns

```typescript
// Named exports
export const PI = 3.14159;
export function calculate() { }
export class Calculator { }

// Default export
export default class App { }

// Re-exports
export { helper } from './utils';
export * from './constants';
export { default as Utils } from './utils';

// Namespace import
import * as math from './math';

// Mixed imports
import App, { helper, PI } from './app';
```

### Rust Patterns

```rust
// Module tree
mod utils {
    pub mod string;
    mod internal;  // private
}

// Use paths
use crate::utils::string::*;
use super::parent_module;
use self::local_item;

// Visibility
pub struct Public;
pub(crate) struct CratePublic;
pub(super) struct ParentPublic;
pub(in crate::specific::path) struct PathPublic;
struct Private;

// Re-exports
pub use self::internal::ImportantType;
```

## Cyclic Dependency Handling

### Detection and Reporting

```
Error: Circular dependency detected

  a.js
    └─ imports b.js
         └─ imports c.js
              └─ imports a.js  <- cycle

Suggestion: Consider extracting shared code to a separate module
that doesn't depend on a.js, b.js, or c.js.

Modules in cycle:
  - /src/a.js (line 1: import { B } from './b')
  - /src/b.js (line 1: import { C } from './c')
  - /src/c.js (line 1: import { A } from './a')
```

### Handling Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| error | Reject cycles | Most languages |
| lazy | Defer resolution | Python-style |
| tarjan | SCC analysis | Grouping cycles |
| import-time | Resolve at import | CommonJS |

## Resolution Examples

### Node.js Resolution

```
import 'lodash'
  from: /project/src/app.js

Resolution steps:
  1. Check /project/src/node_modules/lodash
  2. Check /project/node_modules/lodash ✓
  3. Read package.json, find "main": "lodash.js"
  4. Resolve to /project/node_modules/lodash/lodash.js
```

### Rust Resolution

```
use crate::utils::string::capitalize;
  from: /project/src/handlers/user.rs

Resolution steps:
  1. crate -> /project/src/lib.rs (crate root)
  2. utils -> /project/src/utils/mod.rs
  3. string -> /project/src/utils/string.rs
  4. capitalize -> pub fn in string.rs
  5. Check visibility: pub ✓
```

## Integration with Processes

| Process | Integration |
|---------|-------------|
| module-system-design.js | Full module system design |
| semantic-analysis.js | Import resolution in analysis |
| interpreter-implementation.js | Module loading at runtime |
| lsp-server-implementation.js | Go-to-definition, find references |

## Visibility Model Comparison

| Model | Default | Levels | Example Language |
|-------|---------|--------|------------------|
| ES6 | export required | exported/not | JavaScript |
| Rust | private | pub, pub(crate), pub(super), pub(in path) | Rust |
| Java | package | public, protected, package, private | Java |
| Python | public | public, _protected, __private | Python |
| ML | abstract | signature-controlled | OCaml, SML |

## Performance Considerations

### Resolution Caching

```typescript
class CachedResolver {
  private cache = new Map<string, ResolvedModule>();

  resolve(specifier: string, from: string): ResolvedModule {
    const key = `${specifier}:${from}`;
    if (!this.cache.has(key)) {
      this.cache.set(key, this.doResolve(specifier, from));
    }
    return this.cache.get(key)!;
  }
}
```

### Parallel Loading

```typescript
async function parallelLoad(modules: string[]): Promise<Module[]> {
  const graph = buildDependencyGraph(modules);
  const levels = topologicalLevels(graph);

  const results = new Map<string, Module>();
  for (const level of levels) {
    // Load all modules at this level in parallel
    const loaded = await Promise.all(
      level.map(m => loadModule(m, results))
    );
    loaded.forEach((mod, i) => results.set(level[i], mod));
  }

  return modules.map(m => results.get(m)!);
}
```

## Best Practices

1. **Cache Resolutions**: Resolution can be expensive, cache results
2. **Detect Cycles Early**: Check for cycles during resolution, not loading
3. **Clear Error Messages**: Include file paths and import chains
4. **Support Incremental**: Allow invalidating single modules
5. **Respect Visibility**: Enforce visibility at compile time
6. **Handle Missing**: Graceful errors for missing modules

## References

- [ES Modules Specification](https://tc39.es/ecma262/#sec-modules)
- [Node.js Module Resolution](https://nodejs.org/api/modules.html#modules_all_together)
- [Rust Module System](https://doc.rust-lang.org/reference/items/modules.html)
- [Python Import System](https://docs.python.org/3/reference/import.html)
- [OCaml Module System](https://ocaml.org/docs/modules)
