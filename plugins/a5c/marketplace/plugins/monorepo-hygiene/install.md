# monorepo-hygiene — Install Instructions

Keep a multi-package monorepo coherent — shared `tsconfig`/`pyproject` base, workspace dependency consistency checks, turbo or nx pipeline wiring, and a dep-graph-drift CI job that catches circular or cross-package relative imports.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Detect monorepo tool:
   - npm/pnpm/yarn workspaces: `"workspaces"` in root `package.json` or `pnpm-workspace.yaml`
   - turborepo: `turbo.json`
   - nx: `nx.json`, `apps/`, `libs/`
   - Bazel: `WORKSPACE`, `BUILD.bazel`
   - Python poly-package: multiple `pyproject.toml` under `packages/`
2. Enumerate packages and their `name`/`version`/`dependencies`
3. Check for shared base configs: `tsconfig.base.json`, shared `pyproject.toml`
4. Look for cross-package relative imports (anti-pattern): search `from '\\.\\./` / `import .* from ['"]\\.\\./packages/`
5. Check existing CI/CD
6. Summarize findings to the user

### Stage 2: Feature Selection

Ask which checks to enable (multi-select):

1. **Workspace dep consistency** — Every package uses the same version of shared deps
2. **Shared base config** — Root `tsconfig.base.json` / shared `pyproject.toml` inherited by packages
3. **Pipeline tool** — Install turbo or nx for caching + task orchestration
4. **Dep-graph drift CI** — Fail PR if circular deps or cross-package relative imports appear
5. **Workspace import linting** — Enforce package-name imports (no relative cross-package)
6. **All**

### Stage 3: Pipeline Tool

Ask:
- Prefer: `turbo` (lightweight, Node-first) / `nx` (richer, multi-language) / `neither`
- Tasks to pipeline: `build`, `lint`, `test`, `type-check` (default: all four)
- Remote caching: none (default) / Vercel / self-hosted

### Stage 4: Policy

Ask:
- Enforce single-version policy (one version of React, TypeScript, etc. across all packages)? (default: yes)
- Block cross-package relative imports? (default: yes)
- Block circular deps at CI? (default: yes — madge/dep-cruiser)

## Step 2: Install Workspace Consistency Checker

### Node (syncpack)

```bash
npm install -D syncpack
```

Create `.syncpackrc.json`:

```json
{
  "indent": "  ",
  "dependencyTypes": ["prod", "dev", "peer"],
  "versionGroups": [
    {
      "label": "Pin shared deps",
      "packages": ["**"],
      "dependencies": ["react", "react-dom", "typescript", "eslint", "vitest"],
      "pinVersion": "workspace:*"
    }
  ],
  "semverGroups": [
    {
      "label": "Use exact versions in prod",
      "packages": ["**"],
      "dependencyTypes": ["prod"],
      "range": ""
    }
  ]
}
```

Add to `package.json`:

```json
{
  "scripts": {
    "hygiene:check-deps": "syncpack list-mismatches && syncpack format",
    "hygiene:fix-deps": "syncpack fix-mismatches"
  }
}
```

### Python (shared pyproject via PEP 621 inheritance)

Create a root `pyproject.toml` with shared tool config:

```toml
[tool.ruff]
target-version = "py312"
line-length = 100

[tool.pytest.ini_options]
addopts = "-ra --strict-markers"

[tool.mypy]
strict = true
```

Each package `pyproject.toml`:

```toml
[tool.ruff]
extend = "../../pyproject.toml"
```

## Step 3: Create Shared Base Config

### TypeScript

Create `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "incremental": true
  }
}
```

Each package `tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
```

Root `tsconfig.json` as a solution config:

```json
{
  "files": [],
  "references": [
    { "path": "./packages/sdk" },
    { "path": "./packages/agent-mux/cli" }
  ]
}
```

## Step 4: Install turbo (Optional)

```bash
npm install -D turbo
```

Create `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "lint": {},
    "test": { "dependsOn": ["^build"] },
    "type-check": { "dependsOn": ["^build"] }
  }
}
```

Scripts:

```json
{
  "scripts": {
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "type-check": "turbo run type-check"
  }
}
```

## Step 5: Install Dep-Graph Drift Tools

### madge — circular deps + graph visualization

```bash
npm install -D madge
```

```json
{
  "scripts": {
    "hygiene:circular": "madge --circular --extensions ts,tsx src/",
    "hygiene:graph": "madge --image deps.svg --extensions ts,tsx src/"
  }
}
```

### dependency-cruiser — cross-package rules

```bash
npm install -D dependency-cruiser
npx depcruise --init
```

Edit `.dependency-cruiser.cjs`:

```javascript
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-cross-package-relative',
      severity: 'error',
      comment: 'Import workspace packages by name, not relative path',
      from: { path: '^packages/([^/]+)/' },
      to: {
        path: '^packages/(?!$1)([^/]+)/',
        pathNot: 'node_modules',
      },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      from: { orphan: true, pathNot: ['\\.(spec|test)\\.ts$'] },
      to: {},
    },
  ],
  options: {
    tsConfig: { fileName: 'tsconfig.base.json' },
    includeOnly: '^packages/',
  },
};
```

## Step 6: Enforce Import-by-Name (ESLint)

```bash
npm install -D eslint-plugin-import
```

Add to `eslint.config.mjs`:

```javascript
import importPlugin from 'eslint-plugin-import';

export default [
  {
    plugins: { import: importPlugin },
    rules: {
      'import/no-relative-packages': 'error',
      'import/no-cycle': ['error', { maxDepth: 5 }],
      'import/no-self-import': 'error',
    },
  },
];
```

## Step 7: Create GitHub Actions Workflow

Create `.github/workflows/monorepo-hygiene.yml`:

```yaml
name: Monorepo Hygiene
on:
  pull_request:
  push:
    branches: [main]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'npm' }
      - run: npm ci
      - name: Workspace dep consistency
        run: npm run hygiene:check-deps
      - name: Circular deps
        run: npm run hygiene:circular
      - name: Cross-package rules
        run: npx depcruise --config .dependency-cruiser.cjs packages
      - name: Type-check workspace solution
        run: npx tsc -b --pretty
```

## Step 8: Add Pre-commit Hook

```json
{
  "lint-staged": {
    "package.json": ["syncpack list-mismatches --source"],
    "*.{ts,tsx}": ["eslint --fix --max-warnings=0"]
  }
}
```

## Step 9: Seed Hygiene Report

```bash
npm run hygiene:check-deps || true
npm run hygiene:circular || true
npx depcruise --output-type err --config .dependency-cruiser.cjs packages || true
```

Report findings to user:

```
=== Monorepo Hygiene Baseline ===
Dep mismatches: <count>
Circular deps:  <count>
Cross-package relative imports: <count>
```

## Step 10: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name monorepo-hygiene --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 11: Verify Setup

1. `npm run hygiene:check-deps` exits 0 after `syncpack fix-mismatches`
2. `npm run hygiene:circular` exits 0
3. `npx depcruise` passes with no errors
4. `tsc -b` builds the solution tree
5. Workflow passes on a clean PR
6. Adding a cross-package relative import fails ESLint and depcruise

## Reference

- syncpack: https://jamiemason.github.io/syncpack/
- dependency-cruiser: https://github.com/sverweij/dependency-cruiser
- madge: https://github.com/pahen/madge
- Turborepo: https://turbo.build/repo/docs
- Nx: https://nx.dev/
