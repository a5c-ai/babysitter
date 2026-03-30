---
name: module-systems
description: Expert skill for designing module systems including resolution algorithms, import/export mechanisms, visibility control, namespace management, and cyclic dependency handling.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Module Systems Skill

Design and implement module systems for programming languages with support for resolution, loading, visibility, and dependency management.

## Capabilities

- Design module/import/export syntax
- Implement module resolution algorithms
- Handle cyclic module dependencies
- Implement visibility/access control
- Design namespace management systems
- Support module aliases and re-exports
- Implement lazy/on-demand module loading
- Design package/crate system integration

## Usage

Invoke this skill when you need to:
- Design a module system for a new language
- Implement module resolution algorithms
- Handle complex dependency graphs
- Build visibility and access control systems
- Integrate with package managers

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| moduleStyle | string | Yes | Style (es6, commonjs, rust, ml) |
| resolutionStrategy | string | Yes | Resolution (node, rust, python, custom) |
| features | array | No | Features to implement |
| cyclicHandling | string | No | How to handle cycles (error, lazy, tarjan) |
| visibility | object | No | Visibility model configuration |

### Feature Options

```json
{
  "features": [
    "import-export",
    "re-exports",
    "namespace-aliasing",
    "selective-imports",
    "default-exports",
    "lazy-loading",
    "cyclic-detection",
    "visibility-control",
    "inline-modules",
    "package-integration"
  ]
}
```

## Output Structure

```
module-system/
├── syntax/
│   ├── import.grammar              # Import statement syntax
│   ├── export.grammar              # Export statement syntax
│   └── module-decl.grammar         # Module declaration syntax
├── resolution/
│   ├── resolver.ts                 # Main resolution algorithm
│   ├── module-graph.ts             # Dependency graph
│   ├── path-resolver.ts            # Path resolution
│   └── cache.ts                    # Module cache
├── loading/
│   ├── loader.ts                   # Module loader
│   ├── lazy-loader.ts              # Lazy loading support
│   └── parallel-loader.ts          # Parallel loading
├── visibility/
│   ├── access-control.ts           # Visibility checking
│   └── namespace.ts                # Namespace management
├── analysis/
│   ├── cycle-detector.ts           # Cyclic dependency detection
│   └── dependency-analyzer.ts      # Dependency analysis
└── tests/
    ├── resolution.test.ts
    ├── cycles.test.ts
    └── visibility.test.ts
```

## Module System Types

### ES6-Style Modules

```typescript
// Import syntax
import defaultExport from 'module';
import { named, another as alias } from 'module';
import * as namespace from 'module';

// Export syntax
export const value = 42;
export function func() {}
export default class MyClass {}
export { name, other as renamed };
export * from 'other-module';

// Implementation
interface ESModule {
  defaultExport?: any;
  namedExports: Map<string, any>;
  reExports: ReExport[];
}

interface ImportSpecifier {
  type: 'default' | 'named' | 'namespace';
  imported: string;
  local: string;
}
```

### Rust-Style Modules

```rust
// Module declaration
mod my_module;           // Load from file
mod inline { ... }       // Inline module

// Use statements
use crate::module::Item;
use super::parent::*;
use self::child::Thing;
use external_crate::Something;

// Visibility
pub struct Public;
pub(crate) struct CrateVisible;
pub(super) struct ParentVisible;
struct Private;  // default

// Implementation
interface RustModule {
  name: string;
  path: ModulePath;
  visibility: Visibility;
  items: Map<string, ModuleItem>;
  submodules: Map<string, RustModule>;
}

type Visibility =
  | { type: 'private' }
  | { type: 'public' }
  | { type: 'restricted'; path: ModulePath };
```

### ML-Style Modules

```ocaml
(* Module signature *)
module type STACK = sig
  type 'a t
  val empty : 'a t
  val push : 'a -> 'a t -> 'a t
  val pop : 'a t -> ('a * 'a t) option
end

(* Module implementation *)
module ListStack : STACK = struct
  type 'a t = 'a list
  let empty = []
  let push x s = x :: s
  let pop = function
    | [] -> None
    | x :: xs -> Some (x, xs)
end

(* Functor *)
module MakeSet (Ord: ORD) : SET = struct
  (* ... implementation using Ord.compare *)
end
```

## Resolution Algorithms

### Node.js-Style Resolution

```typescript
interface NodeResolver {
  resolveModule(specifier: string, from: string): string | null;
}

function nodeResolve(specifier: string, fromDir: string): string | null {
  // 1. If specifier is a core module, return it
  if (isCoreModule(specifier)) return specifier;

  // 2. If starts with '/' or './', resolve relative
  if (specifier.startsWith('/') || specifier.startsWith('./') ||
      specifier.startsWith('../')) {
    return resolveRelative(specifier, fromDir);
  }

  // 3. Otherwise, walk up node_modules
  let dir = fromDir;
  while (dir !== '/') {
    const candidate = path.join(dir, 'node_modules', specifier);
    const resolved = resolvePackage(candidate);
    if (resolved) return resolved;
    dir = path.dirname(dir);
  }

  return null;
}

function resolvePackage(pkgPath: string): string | null {
  // Check package.json exports/main
  const pkgJson = readPackageJson(pkgPath);
  if (pkgJson?.exports) {
    return resolveExports(pkgPath, pkgJson.exports);
  }
  if (pkgJson?.main) {
    return path.join(pkgPath, pkgJson.main);
  }
  // Default to index.js
  return path.join(pkgPath, 'index.js');
}
```

### Rust-Style Resolution

```typescript
interface RustResolver {
  resolveUse(usePath: UsePath, currentModule: ModulePath): ResolvedItem;
}

function rustResolve(usePath: UsePath, current: ModulePath): ResolvedItem {
  const [first, ...rest] = usePath.segments;

  // Determine starting point
  let startModule: RustModule;
  if (first === 'crate') {
    startModule = getCrateRoot();
  } else if (first === 'super') {
    startModule = getParentModule(current);
  } else if (first === 'self') {
    startModule = getCurrentModule(current);
  } else if (isExternCrate(first)) {
    startModule = getExternCrate(first);
  } else {
    // Start from current module scope
    startModule = getCurrentModule(current);
    rest.unshift(first);
  }

  // Resolve path segments
  let currentItem: ModuleItem = startModule;
  for (const segment of rest) {
    currentItem = resolveSegment(currentItem, segment);
    checkVisibility(currentItem, current);
  }

  return currentItem;
}
```

## Cyclic Dependency Handling

```typescript
// Tarjan's algorithm for SCC detection
function findCycles(graph: ModuleGraph): ModuleCycle[] {
  const index = new Map<Module, number>();
  const lowlink = new Map<Module, number>();
  const onStack = new Set<Module>();
  const stack: Module[] = [];
  const sccs: Module[][] = [];
  let currentIndex = 0;

  function strongconnect(module: Module): void {
    index.set(module, currentIndex);
    lowlink.set(module, currentIndex);
    currentIndex++;
    stack.push(module);
    onStack.add(module);

    for (const dep of module.dependencies) {
      if (!index.has(dep)) {
        strongconnect(dep);
        lowlink.set(module, Math.min(lowlink.get(module)!, lowlink.get(dep)!));
      } else if (onStack.has(dep)) {
        lowlink.set(module, Math.min(lowlink.get(module)!, index.get(dep)!));
      }
    }

    if (lowlink.get(module) === index.get(module)) {
      const scc: Module[] = [];
      let w: Module;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.push(w);
      } while (w !== module);
      if (scc.length > 1) {
        sccs.push(scc);
      }
    }
  }

  for (const module of graph.modules) {
    if (!index.has(module)) {
      strongconnect(module);
    }
  }

  return sccs.map(modules => ({ modules, edges: findCycleEdges(modules) }));
}
```

## Visibility Control

```typescript
interface VisibilityChecker {
  canAccess(item: ModuleItem, fromModule: ModulePath): boolean;
}

function checkVisibility(
  item: ModuleItem,
  fromModule: ModulePath,
  itemModule: ModulePath
): boolean {
  switch (item.visibility.type) {
    case 'public':
      return true;

    case 'private':
      return isSameModule(fromModule, itemModule);

    case 'crate':
      return isSameCrate(fromModule, itemModule);

    case 'super':
      return isParentOrSame(getParent(itemModule), fromModule);

    case 'restricted':
      return isDescendantOf(fromModule, item.visibility.path);

    default:
      return false;
  }
}
```

## Lazy Loading

```typescript
interface LazyModule {
  path: string;
  loaded: boolean;
  exports: Map<string, any> | null;
  loading: Promise<void> | null;
}

class LazyModuleLoader {
  private modules = new Map<string, LazyModule>();

  async import(specifier: string): Promise<any> {
    const resolved = this.resolve(specifier);
    let module = this.modules.get(resolved);

    if (!module) {
      module = {
        path: resolved,
        loaded: false,
        exports: null,
        loading: null
      };
      this.modules.set(resolved, module);
    }

    if (module.loaded) {
      return module.exports;
    }

    if (module.loading) {
      await module.loading;
      return module.exports;
    }

    module.loading = this.loadModule(module);
    await module.loading;
    return module.exports;
  }

  private async loadModule(module: LazyModule): Promise<void> {
    const source = await readFile(module.path);
    const compiled = compile(source);
    module.exports = await execute(compiled);
    module.loaded = true;
  }
}
```

## Workflow

1. **Design module syntax** - Import, export, module declarations
2. **Implement resolution** - Path resolution algorithm
3. **Build dependency graph** - Track module dependencies
4. **Detect cycles** - Find and report cyclic dependencies
5. **Implement visibility** - Access control checking
6. **Add lazy loading** - On-demand module loading
7. **Integrate packages** - Package manager support
8. **Generate tests** - Resolution, cycles, visibility

## Best Practices Applied

- Clear separation of resolution from loading
- Efficient caching of resolved modules
- Informative cycle detection error messages
- Consistent visibility semantics
- Support for both sync and async loading
- Incremental resolution for IDE support

## References

- ES Modules Spec: https://tc39.es/ecma262/#sec-modules
- Node.js Module Resolution: https://nodejs.org/api/modules.html
- Rust Module System: https://doc.rust-lang.org/reference/items/modules.html
- OCaml Module System: https://ocaml.org/docs/modules

## Target Processes

- module-system-design.js
- semantic-analysis.js
- interpreter-implementation.js
- lsp-server-implementation.js
