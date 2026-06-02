# Tula Stack Renames

The agent stack packages should be renamed to use the "tula" brand consistently.

## Target Convention

| Package | Target Package | Directory | Target Dir |
|---------|---------------|-----------|-----------|
| tula core | `@a5c-ai/tula-core` | `packages/tula-core/` | `packages/tula-core/` |
| tula runtime | `@a5c-ai/tula-runtime` | `packages/tula-runtime/` | `packages/tula-runtime/` |
| `@a5c-ai/agent-platform` | `@a5c-ai/tula-platform` | `packages/agent-platform/` | `packages/tula-platform/` |
| `@a5c-ai/tula` | `@a5c-ai/tula` (keep) | `packages/tula/` | `packages/tula/` (keep) |

## Scope

### Package References
```bash
# Count references
grep -rl "@a5c-ai/tula-core" packages/ docs/ .github/ --include="*.ts" --include="*.json" --include="*.yml" --include="*.md" | grep -v node_modules | grep -v dist | wc -l
grep -rl "@a5c-ai/tula-runtime" packages/ docs/ .github/ --include="*.ts" --include="*.json" --include="*.yml" --include="*.md" | grep -v node_modules | grep -v dist | wc -l
grep -rl "@a5c-ai/agent-platform" packages/ docs/ .github/ --include="*.ts" --include="*.json" --include="*.yml" --include="*.md" | grep -v node_modules | grep -v dist | wc -l
```

### Import Paths
Every import that targets a renamed package needs updating across the monorepo.

### CI/CD
- `.github/workflows/ci.yml` — build steps reference `packages/tula-core`, `packages/agent-platform`, etc.
- `.github/workflows/publish.yml` — publish steps for each package
- `.github/workflows/live-stack.yml` — build phases

### Atlas Graph
- `packages/atlas/graph/agent-stack/` — core-impls, runtime-impls, platform-impls reference these packages

### Documentation
- `docs/agent-layer-gaps.md` — references tula-core, tula-runtime, agent-platform throughout
- `docs/agent-reference/*.md` — architecture docs
- `docs/agent-stack/hooks/*.md` — hook coverage matrix

## Execution Plan

1. tula core package rename is complete.
2. tula runtime package rename is complete.
3. `git mv packages/agent-platform packages/tula-platform`
4. tula core package references are updated across all files.
5. tula runtime package references are updated across all files.
6. Find-replace `@a5c-ai/agent-platform` → `@a5c-ai/tula-platform`
7. tula core package paths are updated across all files.
8. Update tsconfig references
9. Regenerate package-lock.json
10. Build and test

## Notes

- The `agent-mux` family keeps its name (it's the multiplexer for ALL agents, not just tula)
- `babysitter-sdk` keeps its name (it's the SDK for the babysitter orchestration engine)
- Only the L4/L5/L6 stack packages that ARE tula get renamed
