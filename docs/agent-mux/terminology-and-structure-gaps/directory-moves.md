# Directory Moves

5 top-level mux packages + 12 hooks-mux packages need to move under the `packages/agent-mux/` umbrella.

## Phase 1: Move Top-Level Mux Packages

```bash
git mv packages/transport-mux packages/agent-mux/transport
git mv packages/extension-mux packages/agent-mux/extensions
git mv packages/triggers-mux packages/agent-mux/triggers
git mv packages/tasks-mux packages/agent-mux/tasks
git mv packages/tool-mux packages/agent-mux/tools
```

## Phase 2: Move Hooks-Mux Under Agent-Mux

```bash
git mv packages/agent-mux/hooks packages/agent-mux/hooks
```

This moves all 12 hooks-mux subpackages at once since they're already structured under a parent directory.

## Phase 3: Update All References

After directory moves, update:
1. `package.json` workspace paths in root
2. `tsconfig.json` references across all packages
3. Import paths in source code (TypeScript `import ... from "../../transport-mux"` etc.)
4. `.github/workflows/*.yml` build paths
5. `packages/atlas/graph/` source refs
6. `docs/` file references

## Phase 4: Rename Legacy Directories

```bash
git mv packages/agent-mux/amux-proxy packages/agent-mux/transport-proxy
git mv packages/agent-mux/meta/config/amux packages/agent-mux/meta/config/agent-mux
```

## Impact Summary

| Move | Packages Affected | Import Paths to Update |
|------|------------------|----------------------|
| transport-mux → agent-mux/transport | 1 | ~30 files |
| extension-mux → agent-mux/extensions | 1 | ~20 files |
| triggers-mux → agent-mux/triggers | 1 | ~15 files |
| tasks-mux → agent-mux/tasks | 1 | ~25 files |
| tool-mux → agent-mux/tools | 1 | ~10 files |
| hooks-mux → agent-mux/hooks | 12 | ~50 files |
| amux-proxy → transport-proxy | 1 | ~5 files |
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
