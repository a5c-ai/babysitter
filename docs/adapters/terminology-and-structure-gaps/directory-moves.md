# Directory Moves

5 top-level adapter packages + 12 hooks-adapter packages need to move under the `packages/adapters/` umbrella.

## Phase 1: Move Top-Level Adapter Packages

```bash
git mv packages/transport-adapter packages/adapters/transport
git mv packages/extensions-adapter packages/adapters/extensions
git mv packages/triggers-adapter packages/adapters/triggers
git mv packages/tasks-adapter packages/adapters/tasks
git mv packages/tools-adapter packages/adapters/tools
```

## Phase 2: Move Hooks-Adapter Under Agent-Adapter

```bash
git mv packages/adapters/hooks packages/adapters/hooks
```

This moves all 12 hooks-adapter subpackages at once since they're already structured under a parent directory.

## Phase 3: Update All References

After directory moves, update:
1. `package.json` workspace paths in root
2. `tsconfig.json` references across all packages
3. Import paths in source code (TypeScript `import ... from "../../transport-adapter"` etc.)
4. `.github/workflows/*.yml` build paths
5. `packages/atlas/graph/` source refs
6. `docs/` file references

## Phase 4: Rename Legacy Directories

```bash
git mv packages/adapters/adapters-proxy packages/adapters/transport-proxy
git mv packages/adapters/meta/config/adapters packages/adapters/meta/config/adapters
```

## Impact Summary

| Move | Packages Affected | Import Paths to Update |
|------|------------------|----------------------|
| transport-adapter → adapters/transport | 1 | ~30 files |
| extensions-adapter → adapters/extensions | 1 | ~20 files |
| triggers-adapter → adapters/triggers | 1 | ~15 files |
| tasks-adapter → adapters/tasks | 1 | ~25 files |
| tools-adapter → adapters/tools | 1 | ~10 files |
| hooks-adapter → adapters/hooks | 12 | ~50 files |
| adapters-proxy → transport-proxy | 1 | ~5 files |
| **Total** | **18** | **~155 files** |

## Execution Order

1. Move directories (git mv)
2. Update package.json names
3. Regenerate package-lock.json
4. Update all import paths
5. Update tsconfig references
6. Update CI workflows
7. Build and test
8. Commit
