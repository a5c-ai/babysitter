# auto-labeler — Install Instructions

Auto-apply labels to PRs based on changed file paths, PR size, and conventional-commit type. Wires `actions/labeler`, a size-labeler, and conventional-commit triggers so release tooling (semantic-release, release-please) can pick the right bump automatically.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Inventory directory structure to derive natural `area/*` labels (`packages/*`, `docs/`, `infra/`)
2. Check existing labels (`gh label list --json name,color`)
3. Check for existing labeler config: `.github/labeler.yml`
4. Check for `release-automation` plugin presence (drives release-label names)
5. Check existing `.github/workflows/*label*`
6. Summarize findings to the user

### Stage 2: Label Namespaces

Ask (multi-select):

1. **`area/*`** — Based on changed paths (e.g. `area/sdk`, `area/catalog`, `area/docs`)
2. **`type/*`** — Based on conventional-commit prefix (`type/feat`, `type/fix`, `type/chore`)
3. **`size/*`** — Based on PR lines changed (defer to `pr-templates` plugin if installed)
4. **`release/*`** — Drives semantic-release (`release/major`, `release/minor`, `release/patch`)
5. **`lang/*`** — Based on file extensions (`lang/typescript`, `lang/sql`, `lang/yaml`)

### Stage 3: Path Rules

Ask the user to confirm or edit path → label mapping. Default suggestions based on repo layout:

```yaml
area/sdk: packages/sdk/**/*
area/catalog: packages/catalog/**/*
area/cli: packages/*/src/cli/**/*
area/docs: '**/*.md'
area/ci: .github/**/*
area/deps: [package.json, pnpm-lock.yaml, go.mod, requirements*.txt]
```

### Stage 4: Sync Behavior

Ask:
- Re-evaluate labels on every push (default: yes — `sync-labels: true`) or only on open
- Remove labels that no longer match paths? (default: yes)
- Allow manual label overrides? (default: yes — skip re-evaluation if `manual-label` label present)

## Step 2: Install actions/labeler Config

Create `.github/labeler.yml`:

```yaml
# https://github.com/actions/labeler

area/sdk:
  - changed-files:
      - any-glob-to-any-file: ['packages/sdk/**/*']

area/catalog:
  - changed-files:
      - any-glob-to-any-file: ['packages/catalog/**/*']

area/cli:
  - changed-files:
      - any-glob-to-any-file:
          - 'packages/sdk/src/cli/**/*'
          - 'packages/babysitter/bin/**/*'

area/docs:
  - changed-files:
      - any-glob-to-any-file:
          - '**/*.md'
          - 'docs/**/*'

area/ci:
  - changed-files:
      - any-glob-to-any-file:
          - '.github/workflows/**/*'
          - '.github/actions/**/*'

area/deps:
  - changed-files:
      - any-glob-to-any-file:
          - 'package.json'
          - 'pnpm-lock.yaml'
          - 'yarn.lock'
          - 'go.mod'
          - 'go.sum'
          - 'requirements*.txt'
          - 'poetry.lock'
          - 'pyproject.toml'

area/tests:
  - changed-files:
      - any-glob-to-any-file:
          - '**/*.test.ts'
          - '**/__tests__/**/*'
          - '**/test_*.py'
          - '**/*_test.go'

lang/typescript:
  - changed-files:
      - any-glob-to-any-file: ['**/*.ts', '**/*.tsx']

lang/python:
  - changed-files:
      - any-glob-to-any-file: ['**/*.py']

lang/sql:
  - changed-files:
      - any-glob-to-any-file: ['**/*.sql', 'migrations/**/*']
```

## Step 3: Create Labeler Workflow

Create `.github/workflows/labeler.yml`:

```yaml
name: Labeler
on:
  pull_request_target:
    types: [opened, synchronize, reopened, edited]
permissions:
  contents: read
  pull-requests: write
jobs:
  label-by-path:
    runs-on: ubuntu-latest
    if: "!contains(github.event.pull_request.labels.*.name, 'manual-label')"
    steps:
      - uses: actions/labeler@v5
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          configuration-path: .github/labeler.yml
          sync-labels: true
```

## Step 4: Install Type Labeler (Conventional Commits)

Create `.github/workflows/label-type.yml`:

```yaml
name: Label by Type
on:
  pull_request_target:
    types: [opened, edited, reopened]
permissions:
  pull-requests: write
jobs:
  type:
    runs-on: ubuntu-latest
    steps:
      - name: Extract conventional type from PR title
        id: extract
        uses: actions/github-script@v7
        with:
          script: |
            const title = context.payload.pull_request.title;
            const match = title.match(/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+?\))?(!)?:/);
            if (!match) { core.setOutput('type', ''); return; }
            const type = match[1];
            const breaking = !!match[3];
            core.setOutput('type', type);
            core.setOutput('breaking', breaking);
      - name: Apply type label
        if: steps.extract.outputs.type != ''
        uses: actions/github-script@v7
        with:
          script: |
            const { type, breaking } = ${{ toJSON(steps.extract.outputs) }};
            const labels = [`type/${type}`];
            if (type === 'feat') labels.push('release/minor');
            if (type === 'fix') labels.push('release/patch');
            if (JSON.parse('${{ steps.extract.outputs.breaking }}')) labels.push('release/major');
            await github.rest.issues.addLabels({
              owner: context.repo.owner, repo: context.repo.repo,
              issue_number: context.payload.pull_request.number, labels,
            });
```

## Step 5: Install Size Labeler

If `pr-templates` plugin is installed, size labels are already configured. Otherwise create `.github/workflows/label-size.yml`:

```yaml
name: Label by Size
on:
  pull_request_target:
    types: [opened, synchronize, reopened]
permissions:
  pull-requests: write
jobs:
  size:
    runs-on: ubuntu-latest
    steps:
      - uses: codelytv/pr-size-labeler@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          xs_label: 'size/XS'
          xs_max_size: '9'
          s_label: 'size/S'
          s_max_size: '49'
          m_label: 'size/M'
          m_max_size: '199'
          l_label: 'size/L'
          l_max_size: '499'
          xl_label: 'size/XL'
          fail_if_xl: 'false'
```

## Step 6: Seed Labels

Create `scripts/seed-labels.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

create() {
  gh label create "$1" --color "$2" --description "$3" --force
}

# area
create "area/sdk" "1d76db" "Changes in packages/sdk"
create "area/catalog" "1d76db" "Changes in packages/catalog"
create "area/cli" "1d76db" "Changes in CLI surface"
create "area/docs" "0e8a16" "Documentation changes"
create "area/ci" "d4c5f9" "CI/workflow changes"
create "area/deps" "fbca04" "Dependency updates"
create "area/tests" "bfdadc" "Test-only changes"

# type
create "type/feat" "a2eeef" "New feature"
create "type/fix" "d73a4a" "Bug fix"
create "type/docs" "0e8a16" "Docs"
create "type/chore" "ededed" "Chore"
create "type/refactor" "cfd3d7" "Refactor"
create "type/perf" "fef2c0" "Performance"
create "type/test" "bfdadc" "Test"

# release
create "release/major" "b60205" "Major bump"
create "release/minor" "0e8a16" "Minor bump"
create "release/patch" "1d76db" "Patch bump"

# lang
create "lang/typescript" "2b7489" "TypeScript"
create "lang/python" "3572A5" "Python"
create "lang/sql" "e38c00" "SQL"

# control
create "manual-label" "ededed" "Skip auto-labeler"
```

```bash
chmod +x scripts/seed-labels.sh
./scripts/seed-labels.sh
```

## Step 7: Wire Release-Label Triggers

If `release-automation` plugin is present with semantic-release, no extra config — semantic-release uses commit-analyzer on conventional commits. The release labels are informational.

For release-please, labels `autorelease: pending` / `autorelease: tagged` are managed automatically; do not manually edit.

## Step 8: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name auto-labeler --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 9: Verify Setup

1. Open a test PR modifying `packages/sdk/` → `area/sdk` applied automatically
2. Modify `**/*.md` → `area/docs` applied
3. PR title `feat: something` → `type/feat` + `release/minor` applied
4. PR title `fix!: breaking` → `type/fix` + `release/major` applied
5. PR with `manual-label` on it is skipped by the path labeler
6. Size label updates on each push

## Reference

- actions/labeler: https://github.com/actions/labeler
- codelytv/pr-size-labeler: https://github.com/CodelyTV/pr-size-labeler
- GitHub label best practices: https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/managing-labels
- Conventional Commits: https://www.conventionalcommits.org/
