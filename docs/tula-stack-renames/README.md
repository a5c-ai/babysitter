# genty Stack Renames

The agent stack packages should be renamed to use the "genty" brand consistently.

## Target Convention

| Package | Target Package | Directory | Target Dir |
|---------|---------------|-----------|-----------|
| genty core | `@a5c-ai/genty-core` | `packages/genty/core/` | `packages/genty/core/` |
| genty runtime | `@a5c-ai/genty-runtime` | `packages/genty/runtime/` | `packages/genty/runtime/` |
| `@a5c-ai/genty-platform` | `@a5c-ai/genty-platform` | `packages/genty/platform/` | `packages/genty/platform/` |
| `@a5c-ai/genty` | `@a5c-ai/genty` (keep) | `packages/genty/` | `packages/genty/` (keep) |

## Scope

### Package References
```bash
# Count references
grep -rl "@a5c-ai/genty-core" packages/ docs/ .github/ --include="*.ts" --include="*.json" --include="*.yml" --include="*.md" | grep -v node_modules | grep -v dist | wc -l
grep -rl "@a5c-ai/genty-runtime" packages/ docs/ .github/ --include="*.ts" --include="*.json" --include="*.yml" --include="*.md" | grep -v node_modules | grep -v dist | wc -l
grep -rl "@a5c-ai/genty-platform" packages/ docs/ .github/ --include="*.ts" --include="*.json" --include="*.yml" --include="*.md" | grep -v node_modules | grep -v dist | wc -l
```

### Import Paths
Every import that targets a renamed package needs updating across the monorepo.

### CI/CD
- `.github/workflows/ci.yml` — build steps reference `packages/genty/core`, `packages/genty/platform`, etc.
- `.github/workflows/publish.yml` — publish steps for each package
- `.github/workflows/live-stack.yml` — build phases

### Atlas Graph
- `packages/atlas/graph/agent-stack/` — core-impls, runtime-impls, platform-impls reference these packages

### Documentation
- `docs/agent-layer-gaps.md` — references genty-core, genty-runtime, agent-platform throughout
- `docs/agent-reference/*.md` — architecture docs
- `docs/agent-stack/hooks/*.md` — hook coverage matrix

## Execution Plan

1. genty core package rename is complete.
2. genty runtime package rename is complete.
3. `git mv packages/genty/platform packages/genty/platform`
4. genty core package references are updated across all files.
5. genty runtime package references are updated across all files.
6. Find-replace `@a5c-ai/genty-platform` → `@a5c-ai/genty-platform`
7. genty core package paths are updated across all files.
8. Update tsconfig references
9. Regenerate package-lock.json
10. Build and test

## Notes

- The `adapters` family keeps its name (it's the multiplexer for ALL agents, not just genty)
- `babysitter-sdk` keeps its name (it's the SDK for the babysitter orchestration engine)
- Only the L4/L5/L6 stack packages that ARE genty get renamed
