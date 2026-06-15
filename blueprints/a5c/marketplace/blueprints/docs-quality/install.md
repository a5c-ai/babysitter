# docs-quality — Install Instructions

Set up documentation quality feedback loops — markdownlint for style consistency, lychee for broken-link detection, cspell for spelling, and a doc-coverage metric that tracks documented vs. undocumented public APIs. Stack-agnostic.

## Step 1: Interview the User

### Stage 1: Project Analysis

1. Discover documentation locations: `README.md`, `docs/`, `documentation/`, `*.md` under repo root
2. Detect doc generator: MkDocs (`mkdocs.yml`), Docusaurus (`docusaurus.config.*`), VitePress (`.vitepress/`), Sphinx (`conf.py`), TypeDoc, JSDoc, rustdoc
3. Check existing tooling: `markdownlint-cli`, `markdownlint-cli2`, `lychee`, `cspell`, `vale`, `alex`
4. Check CI: `.github/workflows/`, `.gitlab-ci.yml`
5. Check git hooks: `.husky/`, `.pre-commit-config.yaml`, `lefthook.yml`
6. Summarize findings to the user

### Stage 2: Docs Layers

Ask the user which layers to install (multi-select):

1. **Markdownlint** — Markdown style + structure enforcement
2. **Link check** — lychee detects broken internal and external links
3. **Spell check** — cspell detects typos with per-project dictionary
4. **Doc coverage** — Metric tracking documented vs. undocumented public symbols
5. **All** — Install every layer

### Stage 3: Strictness

Ask:
- Markdownlint preset? (`default`, `relaxed`, `strict` — default: `default`)
- External link checking in PR CI? (slow + flaky; default: `nightly only`)
- cspell language? (default: `en-US`)
- Min doc coverage %? (default: `70%` — warn below, `50%` fail)

## Step 2: Install Markdownlint

```bash
npm install -D markdownlint-cli2
```

Create `.markdownlint-cli2.jsonc`:

```jsonc
{
  "config": {
    "default": true,
    "MD013": { "line_length": 120, "code_blocks": false, "tables": false },
    "MD033": { "allowed_elements": ["br", "details", "summary", "kbd"] },
    "MD041": false,
    "MD024": { "siblings_only": true }
  },
  "globs": ["**/*.md", "!node_modules", "!dist", "!.next", "!CHANGELOG.md"]
}
```

Add script:

```json
{ "scripts": { "docs:lint": "markdownlint-cli2" } }
```

## Step 3: Install Link Checker (lychee)

### Install

lychee is a Rust binary. Use the official GitHub Action in CI; locally:

```bash
# macOS
brew install lychee
# Cargo
cargo install lychee
```

Create `lychee.toml`:

```toml
exclude_path = ["node_modules", "dist", ".next", "target"]
exclude = [
  "^https://twitter\\.com",
  "^https://x\\.com",
  "^http://localhost",
  "^http://127\\.0\\.0\\.1",
]
max_concurrency = 16
max_retries = 2
retry_wait_time = 2
accept = ["200", "204", "206", "301", "302", "403", "429"]
no_progress = true
```

Add script:

```json
{ "scripts": { "docs:links": "lychee --config lychee.toml '**/*.md'" } }
```

## Step 4: Install Spell Check (cspell)

```bash
npm install -D cspell
```

Create `.cspell.json`:

```json
{
  "version": "0.2",
  "language": "en",
  "words": [],
  "ignorePaths": [
    "node_modules/**",
    "dist/**",
    ".next/**",
    "package-lock.json",
    "*.min.js"
  ],
  "dictionaryDefinitions": [
    { "name": "project-terms", "path": "./.cspell/project-terms.txt", "addWords": true }
  ],
  "dictionaries": ["project-terms"],
  "ignoreRegExpList": ["/\\b[0-9a-f]{7,}\\b/g"]
}
```

```bash
mkdir -p .cspell && touch .cspell/project-terms.txt
```

Add script:

```json
{ "scripts": { "docs:spell": "cspell '**/*.{md,mdx}'" } }
```

## Step 5: Install Doc Coverage Metric

Stack-dependent. Pick one:

### TypeScript — typedoc-plugin-coverage

```bash
npm install -D typedoc typedoc-plugin-coverage
```

```json
{
  "scripts": { "docs:coverage": "typedoc --plugin typedoc-plugin-coverage" }
}
```

### Python — interrogate

```bash
pip install interrogate
```

Create `pyproject.toml` section:

```toml
[tool.interrogate]
fail-under = 70
exclude = ["tests", "setup.py"]
ignore-init-method = true
ignore-private = true
ignore-magic = true
verbose = 1
```

### Go — godoc-lint / custom

```bash
go install github.com/godoc-lint/godoc-lint/cmd/godoc-lint@latest
godoc-lint ./...
```

### Stack-agnostic fallback

Count exported symbols vs. those with preceding doc comments via a simple script — record as a baseline metric.

## Step 6: Set Up Pre-commit Hook

```bash
npm install -D husky lint-staged
npx husky init
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{md,mdx}": ["markdownlint-cli2 --fix", "cspell"]
  }
}
```

Create `.husky/pre-commit`:

```bash
npx lint-staged
```

## Step 7: Create GitHub Actions Workflow

Create `.github/workflows/docs-quality.yml`:

```yaml
name: Docs Quality

on:
  pull_request:
    paths: ['**/*.md', '**/*.mdx', 'docs/**']
  push:
    branches: [main]

jobs:
  markdownlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'npm' }
      - run: npm ci
      - run: npm run docs:lint

  spell:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'npm' }
      - run: npm ci
      - run: npm run docs:spell

  links-internal:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: lycheeverse/lychee-action@v2
        with:
          args: --offline --verbose --no-progress '**/*.md'
          fail: true

  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'npm' }
      - run: npm ci
      - run: npm run docs:coverage
```

Nightly full link check at `.github/workflows/docs-links-nightly.yml`:

```yaml
on:
  schedule:
    - cron: '0 5 * * *'
jobs:
  links:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: lycheeverse/lychee-action@v2
        with:
          args: --verbose --no-progress '**/*.md'
          fail: true
```

## Step 8: Run Baseline

```bash
npm run docs:lint || true
npm run docs:spell || true
lychee --offline '**/*.md' || true
npm run docs:coverage || true
```

Report baseline counts to the user.

## Step 9: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name docs-quality --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 10: Verify Setup

1. `npm run docs:lint` exits 0 (after fixes) or reports violations
2. `npm run docs:spell` runs; add unknown terms to `.cspell/project-terms.txt`
3. lychee offline scan passes (internal links resolve)
4. Doc coverage metric is recorded
5. Pre-commit hook fires on staged markdown
6. Workflow committed at `.github/workflows/docs-quality.yml`

## Reference

- markdownlint rules: https://github.com/DavidAnson/markdownlint/blob/main/doc/Rules.md
- lychee: https://lychee.cli.rs/
- cspell: https://cspell.org/
- interrogate: https://interrogate.readthedocs.io/
