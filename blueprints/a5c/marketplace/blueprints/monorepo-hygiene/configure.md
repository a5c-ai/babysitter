# monorepo-hygiene — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `pipelineTool` | `turbo`, `nx`, `none` | `turbo` | `turbo.json` / `nx.json` |
| `singleVersionPolicy` | `on`, `off` | `on` | syncpack `versionGroups` |
| `pinnedDeps` | array of package names | `react,react-dom,typescript,eslint,vitest` | `.syncpackrc.json` |
| `blockRelativeCrossPackage` | `on`, `off` | `on` | depcruise + eslint-plugin-import |
| `blockCircularDeps` | `on`, `off` | `on` | depcruise + madge |
| `sharedTsBase` | `on`, `off` | `on` | `tsconfig.base.json` |
| `solutionReferences` | `on`, `off` | `on` | root `tsconfig.json` `references` |
| `prodVersionRange` | `exact`, `caret`, `tilde` | `exact` | syncpack `semverGroups` |
| `maxCycleDepth` | integer | `5` | eslint `import/no-cycle` |
| `remoteCaching` | `off`, `vercel`, `self` | `off` | `turbo.json` / env |
| `orphanDetection` | `on`, `off` | `warn` | depcruise `no-orphans` rule |

## 2. Pin a Different Set of Shared Deps

Edit `.syncpackrc.json`:

```json
{
  "versionGroups": [
    {
      "label": "App stack",
      "packages": ["**"],
      "dependencies": ["next", "react", "react-dom", "tailwindcss", "@types/node"],
      "pinVersion": "workspace:*"
    }
  ]
}
```

Run `npm run hygiene:fix-deps`.

## 3. Relax Cross-Package Import Rule

Allow relative imports within a specific package family:

```javascript
// .dependency-cruiser.cjs
{
  name: 'no-cross-package-relative',
  from: { path: '^packages/(?!internal/)([^/]+)/' },
  to: { path: '^packages/(?!$1|internal/)([^/]+)/' },
}
```

## 4. Allow Specific Cycles

```javascript
// .dependency-cruiser.cjs
{
  name: 'no-circular',
  from: { pathNot: '^packages/legacy/' },
  to: { circular: true },
}
```

## 5. Switch to nx

```bash
npx nx@latest init
```

Remove `turbo.json`, keep `nx.json`:

```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "targetDefaults": {
    "build": { "dependsOn": ["^build"], "outputs": ["{projectRoot}/dist"] }
  }
}
```

## 6. Enable Remote Caching (Turbo)

```bash
npx turbo login
npx turbo link
```

Sets `TURBO_TOKEN` + `TURBO_TEAM` in CI:

```yaml
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}
```

## 7. Add a New Package to the Solution

1. Create `packages/<name>/tsconfig.json` extending `../../tsconfig.base.json`
2. Add to root `tsconfig.json` `references`
3. Run `npm install --workspace=<name>`
4. Run `npm run hygiene:check-deps`

## 8. Allow Different Versions for Specific Packages

```json
{
  "versionGroups": [
    {
      "label": "Allow react 18 in legacy",
      "packages": ["legacy-*"],
      "dependencies": ["react"],
      "pinVersion": "18.3.1"
    }
  ]
}
```

## 9. Visualize the Dep Graph

```bash
npm run hygiene:graph
# Opens deps.svg
```

Or use depcruise:

```bash
npx depcruise --output-type dot packages | dot -T svg > graph.svg
```

## 10. Fix Baseline Issues at Scale

```bash
babysitter run:create \
  --process-id monorepo-hygiene-baseline \
  --entry .a5c/processes/monorepo-hygiene/baseline.js#process \
  --prompt "Rewrite all cross-package relative imports to package-name imports and pin shared dep versions" \
  --json
```

## 11. Exclude Tests from Orphan Detection

```javascript
{
  name: 'no-orphans',
  from: { orphan: true, pathNot: ['\\.(spec|test|bench)\\.ts$', '__tests__/'] },
  to: {},
}
```
