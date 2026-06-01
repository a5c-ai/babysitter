# a11y — Install Instructions

Set up accessibility feedback loops for your project — lint rules for UI code, pre-commit checks on staged files, a GitHub Actions workflow to gate PRs, and runtime scanning via Axe / Lighthouse CI / pa11y. Per-stack recommendations for React, Vue, Angular, plain HTML, and server-rendered Python templates.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Read `package.json`, `requirements.txt`, `pyproject.toml`, `composer.json`, or equivalent to identify language and framework
2. Detect UI stack:
   - React / Next.js: `react`, `next`, `.tsx`/`.jsx` files
   - Vue / Nuxt: `vue`, `nuxt`, `.vue` files
   - Angular: `@angular/core`, `angular.json`
   - Svelte / SvelteKit: `svelte`, `.svelte` files
   - Plain HTML / static sites: `.html` at repo root or `public/`
   - Python templates: `templates/*.html` with Jinja/Django syntax
3. Check for existing lint setup: `.eslintrc.*`, `eslint.config.*`, `stylelint.config.*`, `.pylintrc`, `ruff.toml`
4. Check for existing a11y tooling: `axe-core`, `@axe-core/*`, `pa11y`, `lighthouse`, `playwright`
5. Check for existing CI/CD: `.github/workflows/`, `.gitlab-ci.yml`
6. Check for existing git hooks: `.husky/`, `.pre-commit-config.yaml`, `lefthook.yml`
7. Summarize findings to the user

### Stage 2: A11y Layers

Ask the user which accessibility layers to set up (multi-select):

1. **Lint rules** — Static analysis of UI source (JSX/templates/HTML) for a11y issues
2. **Pre-commit hook** — Run a11y lint on staged files before commit
3. **GitHub Actions workflow** — Run lint + runtime a11y scan on every PR
4. **Runtime scanning** — Axe / Lighthouse CI / pa11y executes against a running app or built HTML
5. **All** — Install every layer applicable to the stack

### Stage 3: Framework Selection

Based on the stack, recommend and confirm:

| Stack | Lint Plugin | Runtime Tool |
|-------|-------------|--------------|
| React / Next.js | `eslint-plugin-jsx-a11y` | `@axe-core/playwright` or Lighthouse CI |
| Vue / Nuxt | `eslint-plugin-vuejs-accessibility` | `@axe-core/playwright` |
| Angular | `@angular-eslint/template` a11y rules | `@axe-core/playwright` |
| Svelte / SvelteKit | `eslint-plugin-svelte` (a11y rules built in) | `@axe-core/playwright` |
| Plain HTML / static | `htmlhint` + `pa11y` | `pa11y-ci` or Lighthouse CI |
| Django / Flask / Jinja | `djlint` + `pa11y` | `pa11y-ci` (against rendered pages) |

### Stage 4: Strictness & CI Gating

Ask the user:
- What WCAG conformance level? (`A`, `AA` [default], `AAA`)
- Minimum severity to fail builds? (`minor`, `moderate` [default], `serious`, `critical`)
- Should a11y violations block PR merges? (default: yes, warn-only for first 2 weeks then error)
- How many pages to scan at runtime? (default: top 10 routes from sitemap, or user-specified list)

### Stage 5: Git Hooks

Ask:
- Install or extend pre-commit hooks? (default: yes)
- Hook tool:
  - Node stacks: **husky** + **lint-staged** (reuse if already present)
  - Python stacks: **pre-commit** framework

## Step 2: Install Lint Rules

### React / Next.js

```bash
npm install -D eslint-plugin-jsx-a11y
```

Add to `eslint.config.mjs` (flat config):

```javascript
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  // ...existing config...
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: { 'jsx-a11y': jsxA11y },
    rules: {
      ...jsxA11y.configs.recommended.rules,
      // Upgrade critical rules to error
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
    },
  },
];
```

### Vue / Nuxt

```bash
npm install -D eslint-plugin-vuejs-accessibility
```

```javascript
import vueA11y from 'eslint-plugin-vuejs-accessibility';

export default [
  {
    files: ['**/*.vue'],
    plugins: { 'vuejs-accessibility': vueA11y },
    rules: {
      ...vueA11y.configs.recommended.rules,
    },
  },
];
```

### Angular

```bash
npm install -D @angular-eslint/eslint-plugin-template
```

In `eslint.config.mjs` (or legacy `.eslintrc.json`), for `*.html` template files enable:

```json
{
  "@angular-eslint/template/alt-text": "error",
  "@angular-eslint/template/elements-content": "error",
  "@angular-eslint/template/label-has-associated-control": "error",
  "@angular-eslint/template/no-positive-tabindex": "error",
  "@angular-eslint/template/click-events-have-key-events": "error",
  "@angular-eslint/template/interactive-supports-focus": "error",
  "@angular-eslint/template/valid-aria": "error"
}
```

### Svelte / SvelteKit

`eslint-plugin-svelte` ships with a11y rules enabled by default. Verify they are not disabled:

```javascript
import svelte from 'eslint-plugin-svelte';

export default [
  ...svelte.configs['flat/recommended'],
  // Ensure a11y rules are on
  {
    files: ['**/*.svelte'],
    rules: {
      'svelte/a11y-alt-text': 'error',
      'svelte/a11y-label-has-associated-control': 'error',
      'svelte/a11y-click-events-have-key-events': 'error',
    },
  },
];
```

### Plain HTML / static

```bash
npm install -D htmlhint
```

Create `.htmlhintrc`:

```json
{
  "alt-require": true,
  "attr-lowercase": true,
  "attr-no-duplication": true,
  "doctype-first": true,
  "id-unique": true,
  "tag-pair": true,
  "tagname-lowercase": true,
  "title-require": true
}
```

### Django / Flask / Jinja templates

```bash
pip install djlint
```

Create `.djlintrc`:

```json
{
  "profile": "django",
  "indent": 2,
  "ignore": "H006,H030"
}
```

`djlint` flags missing `alt`, missing `<title>`, non-unique IDs, and related issues. Combine with runtime `pa11y-ci` against rendered pages for full coverage.

## Step 3: Set Up Pre-commit Hook

### Node stacks (husky + lint-staged)

If husky is not already installed:

```bash
npm install -D husky lint-staged
npx husky init
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{jsx,tsx,vue,svelte}": ["eslint --fix --max-warnings=0"],
    "*.html": ["htmlhint"]
  }
}
```

Create or update `.husky/pre-commit`:

```bash
npx lint-staged
```

### Python / template stacks (pre-commit framework)

```bash
pip install pre-commit
```

Add to `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/djlint/djLint
    rev: v1.36.4
    hooks:
      - id: djlint-django
        files: \.(html|jinja|j2)$
  - repo: local
    hooks:
      - id: pa11y-staged
        name: pa11y on staged HTML
        entry: pa11y-ci --config .pa11yci.json
        language: system
        files: \.(html|jinja|j2)$
        pass_filenames: false
        stages: [pre-push]
```

Install:

```bash
pre-commit install
```

## Step 4: Install Runtime Scanning Tools

### Axe via Playwright (recommended for SPAs)

```bash
npm install -D @axe-core/playwright @playwright/test
npx playwright install --with-deps chromium
```

Create `tests/a11y.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = ['/', '/about', '/pricing', '/docs'];

for (const route of routes) {
  test(`a11y: ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
}
```

### Lighthouse CI (recommended for marketing sites)

```bash
npm install -D @lhci/cli
```

Create `lighthouserc.json`:

```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000/", "http://localhost:3000/about"],
      "numberOfRuns": 2,
      "startServerCommand": "npm run start"
    },
    "assert": {
      "assertions": {
        "categories:accessibility": ["error", { "minScore": 0.95 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```

### pa11y-ci (plain HTML / server-rendered)

```bash
npm install -D pa11y-ci
```

Create `.pa11yci.json`:

```json
{
  "defaults": {
    "standard": "WCAG2AA",
    "timeout": 30000,
    "chromeLaunchConfig": { "args": ["--no-sandbox"] }
  },
  "urls": [
    "http://localhost:8000/",
    "http://localhost:8000/about",
    "http://localhost:8000/contact"
  ]
}
```

Add scripts to `package.json`:

```json
{
  "scripts": {
    "a11y:lint": "eslint . --ext .js,.jsx,.ts,.tsx,.vue,.svelte",
    "a11y:axe": "playwright test tests/a11y.spec.ts",
    "a11y:lighthouse": "lhci autorun",
    "a11y:pa11y": "pa11y-ci"
  }
}
```

## Step 5: Create GitHub Actions Workflow

Create `.github/workflows/a11y.yml`:

```yaml
name: Accessibility

on:
  pull_request:
    branches: [main, staging]
  push:
    branches: [main]

jobs:
  a11y-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - name: Run a11y lint
        run: npm run a11y:lint

  a11y-runtime:
    runs-on: ubuntu-latest
    needs: a11y-lint
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - name: Build app
        run: npm run build
      - name: Start app
        run: npm run start &
      - name: Wait for app
        run: npx wait-on http://localhost:3000 --timeout 60000
      - name: Axe scan
        run: npm run a11y:axe
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: a11y-report
          path: |
            playwright-report/
            test-results/
            .lighthouseci/
```

For Python/Django stacks, replace the Node build/start steps with:

```yaml
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install -r requirements.txt
      - run: python manage.py migrate
      - run: python manage.py runserver &
      - run: npx wait-on http://localhost:8000
      - run: npx pa11y-ci
```

## Step 6: Configure Warn-Only Grace Period (Optional)

If the project has existing a11y debt, start with warn-only mode so the plugin doesn't immediately break CI:

1. Set all lint rules to `'warn'` instead of `'error'` in the eslint config
2. In the workflow, add `continue-on-error: true` to the runtime scan job
3. Add a TODO comment with a deadline date to flip to `'error'` after 2 weeks

## Step 7: Run Initial Baseline Scan

```bash
npm run a11y:lint || true
npm run a11y:axe || true
```

Collect the violation count and report to the user:

```
=== A11y Baseline ===
Lint violations: <count>
Runtime violations (serious+critical): <count>
```

Suggest running a babysitter process to fix the baseline:

```bash
babysitter run:create \
  --process-id a11y-baseline-fix \
  --entry .a5c/processes/a11y/fix-baseline.js#process \
  --prompt "Fix all serious and critical a11y violations discovered in the baseline scan" \
  --json
```

## Step 8: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name a11y --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 9: Verify Setup

1. Lint rules run: `npm run a11y:lint`
2. Runtime scan runs: `npm run a11y:axe` (or `a11y:pa11y` / `a11y:lighthouse`)
3. Pre-commit hook fires on staged UI files
4. GitHub Actions workflow is committed at `.github/workflows/a11y.yml`
5. Baseline violation count is recorded (for progress tracking)
6. User knows how to bypass hooks in emergencies: `git commit --no-verify`

## Reference

- WCAG 2.2 quick reference: https://www.w3.org/WAI/WCAG22/quickref/
- axe-core rules: https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md
- eslint-plugin-jsx-a11y: https://github.com/jsx-eslint/eslint-plugin-jsx-a11y
- pa11y: https://pa11y.org/
- Lighthouse accessibility audits: https://developer.chrome.com/docs/lighthouse/accessibility/
