# Testing Suite — Install Instructions

Set up a comprehensive testing infrastructure for your project — unit tests, integration tests, Storybook component tests with in-browser verification, E2E tests, coverage enforcement in CI/CD, linting with test-aware rules, and git hooks to enforce quality on every commit. Installs the right frameworks, processes, skills, and agents from the babysitter QA testing library based on your stack.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Read `package.json`, `requirements.txt`, `go.mod`, `pom.xml`, or equivalent to identify the language and framework
2. Check for existing test setup: `jest.config.*`, `vitest.config.*`, `playwright.config.*`, `cypress.config.*`, `.storybook/`, `pytest.ini`, `phpunit.xml`
3. Check for existing test files: `**/*.test.*`, `**/*.spec.*`, `**/__tests__/`, `tests/`, `test/`
4. Check for existing CI/CD: `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`
5. Check for existing coverage config: `.nycrc`, `.istanbul.yml`, `coverage/`, `.coveragerc`
6. Check for existing linting: `.eslintrc.*`, `eslint.config.*`, `.prettierrc.*`, `biome.json`, `pylintrc`, `.flake8`, `.golangci.yml`
7. Check for existing git hooks: `.husky/`, `.git/hooks/`, `lefthook.yml`, `.pre-commit-config.yaml`
8. Summarize findings to the user

### Stage 2: Testing Scope

Ask the user which testing layers to set up (multi-select):

1. **Unit Tests** — Fast, isolated tests for individual functions and modules
2. **Integration Tests** — Tests for component interactions, API endpoints, database queries
3. **Storybook + Component Tests** — Visual component development with in-browser interaction tests (frontend projects)
4. **E2E Tests** — End-to-end user flow tests in a real browser
5. **Visual Regression Tests** — Screenshot comparison to catch UI regressions
6. **API/Contract Tests** — API endpoint validation and consumer-driven contracts
7. **Performance Tests** — Load testing, stress testing, response time benchmarks
8. **All** — Install everything applicable to the stack

### Stage 3: Framework Selection

Based on the stack, recommend and ask the user to confirm framework choices:

#### Unit & Integration Testing

| Stack | Recommended | Alternatives |
|-------|-------------|--------------|
| TypeScript/JavaScript | **Vitest** (recommended) | Jest, Mocha+Chai |
| Python | **pytest** | unittest |
| Go | **built-in testing** | testify |
| Java | **JUnit 5** | TestNG |
| Rust | **built-in cargo test** | — |
| Ruby | **RSpec** | Minitest |

#### E2E Testing

| Stack | Recommended | Alternatives |
|-------|-------------|--------------|
| Web apps | **Playwright** (recommended) | Cypress, Selenium |
| Mobile | **Appium** | Detox (React Native) |
| API-only | **Supertest/Newman** | REST-assured |

#### Storybook (frontend only)

| Stack | Recommended |
|-------|-------------|
| React/Next.js | Storybook 8+ with `@storybook/test` |
| Vue/Nuxt | Storybook 8+ with Vue renderer |
| Angular | Storybook 8+ with Angular renderer |
| Svelte/SvelteKit | Storybook 8+ with Svelte renderer |
| Web Components | Storybook 8+ with Web Components renderer |

#### Visual Regression

| Stack | Recommended | Alternatives |
|-------|-------------|--------------|
| Any web | **Playwright screenshots** | Percy, BackstopJS, Chromatic |

### Stage 4: Coverage Requirements

Ask the user:
- What is the minimum coverage threshold? (default: `80%`)
- Which coverage metrics to enforce? (default: lines, branches, functions)
- Should coverage checks block CI/CD? (default: yes)
- Should coverage reports be posted to PRs? (default: yes)

### Stage 5: CI/CD Integration

Ask the user:
- Should tests run in the existing CI/CD pipeline? (default: yes)
- Which CI/CD platform? (auto-detect from existing config, or ask)
- Should tests run in parallel? (default: yes for E2E)
- Should test artifacts (screenshots, videos, coverage reports) be preserved? (default: yes)

### Stage 6: Linting & Formatting

Ask the user:
- Set up or enhance linting? (default: yes)
- Which linter? Auto-detect or recommend:
  - TypeScript/JavaScript: **ESLint** (flat config recommended) + **Prettier** (or **Biome** as all-in-one alternative)
  - Python: **ruff** (recommended) or flake8 + black
  - Go: **golangci-lint**
  - Rust: **clippy** (built-in)
  - Java: **Checkstyle** or **SpotBugs**
- Enable strict type checking? (default: yes for TypeScript — `strict: true`, `noUncheckedIndexedAccess`)
- Add test-specific lint rules? (default: yes)

### Stage 7: Git Hooks

Ask the user:
- Install git hooks to enforce quality on commits? (default: yes)
- Which hooks to enable?
  - **pre-commit**: Lint and type-check staged files (default: yes)
  - **pre-push**: Run full test suite before pushing (default: yes)
  - **commit-msg**: Enforce conventional commit messages (default: no)
- Git hooks tool:
  - TypeScript/JavaScript: **husky** + **lint-staged** (recommended) or **lefthook**
  - Python: **pre-commit** framework
  - Go: **lefthook** or custom shell scripts
  - Other: custom shell scripts in `.git/hooks/`

### Stage 8: Test Strategy

Ask the user:
- Follow the test pyramid (many unit, fewer integration, fewest E2E)? (default: yes)
- Use TDD workflow for new features? (default: yes — installs TDD process)
- Use mutation testing to verify test quality? (default: no — can be added later)

## Step 2: Install Test Frameworks

Based on the interview answers, install the selected frameworks. Examples for common stacks:

### TypeScript/JavaScript (Vitest + Playwright + Storybook):

```bash
# Unit & integration
npm install -D vitest @vitest/coverage-v8

# E2E
npm install -D @playwright/test
npx playwright install --with-deps

# Storybook (if selected)
npx storybook@latest init
npm install -D @storybook/test @storybook/addon-coverage

# Visual regression (if selected)
# Playwright handles this natively with toHaveScreenshot()
```

### Python (pytest + Playwright):

```bash
pip install pytest pytest-cov pytest-asyncio
pip install playwright
playwright install --with-deps

# Storybook is frontend-only, skip if backend project
```

Generate configuration files appropriate for the stack:

#### `vitest.config.ts` (if not present):
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // or 'jsdom' for frontend
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80
      }
    },
    include: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
  },
});
```

#### `playwright.config.ts` (if not present):
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['json', { outputFile: 'test-results/e2e-results.json' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

#### Storybook test runner config (if selected):
```bash
npm install -D @storybook/test-runner
```

Add to `package.json` scripts:
```json
{
  "scripts": {
    "test:storybook": "test-storybook",
    "test:storybook:ci": "concurrently -k -s first -n \"SB,TEST\" \"npm run storybook -- --ci\" \"wait-on tcp:6006 && npm run test:storybook\""
  }
}
```

## Step 3: Set Up Linting & Formatting

### TypeScript/JavaScript

#### Install ESLint + Prettier (if not already present):

```bash
npm install -D eslint @eslint/js typescript-eslint prettier eslint-config-prettier
```

#### Create or update `eslint.config.mjs` (flat config):

```javascript
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettierConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Type safety
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'warn',

      // Code quality
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
    },
  },
  // Test file overrides — relaxed rules for test files
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/__tests__/**', 'e2e/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      'no-console': 'off',
    },
  },
  {
    ignores: ['dist/', 'build/', 'node_modules/', 'coverage/', 'playwright-report/', '.storybook/'],
  }
);
```

#### Create `.prettierrc` (if not present):

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2
}
```

#### Update `tsconfig.json` for strict type checking (if agreed):

Ensure these are set:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": false
  }
}
```

#### Add lint scripts to `package.json`:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit"
  }
}
```

### Python

```bash
pip install ruff
```

Create `ruff.toml`:
```toml
line-length = 100
target-version = "py311"

[lint]
select = ["E", "F", "W", "I", "N", "UP", "B", "A", "C4", "SIM", "TCH", "PTH", "RUF"]

[lint.per-file-ignores]
"tests/**" = ["S101"]  # Allow assert in tests
```

### Go

```bash
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
```

Create `.golangci.yml`:
```yaml
linters:
  enable:
    - errcheck
    - gosimple
    - govet
    - ineffassign
    - staticcheck
    - unused
    - gocritic
    - gofmt
    - goimports
```

## Step 4: Set Up Git Hooks

### TypeScript/JavaScript (husky + lint-staged)

#### Install husky and lint-staged:

```bash
npm install -D husky lint-staged
npx husky init
```

#### Configure lint-staged in `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix --max-warnings=0",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

#### Create pre-commit hook (`.husky/pre-commit`):

```bash
npx lint-staged
```

#### Create pre-push hook (`.husky/pre-push`):

```bash
npm run typecheck
npm run test -- --run
```

This ensures:
- **On every commit**: staged files are linted, formatted, and type-errors are caught
- **On every push**: full type-check and test suite runs — broken code never reaches the remote

#### Optional: commit-msg hook for conventional commits (`.husky/commit-msg`):

If the user opted in, install commitlint:

```bash
npm install -D @commitlint/cli @commitlint/config-conventional
echo '{ "extends": ["@commitlint/config-conventional"] }' > .commitlintrc.json
```

Create `.husky/commit-msg`:
```bash
npx --no -- commitlint --edit ${1}
```

### Python (pre-commit framework)

```bash
pip install pre-commit
```

Create `.pre-commit-config.yaml`:
```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.8.0
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.13.0
    hooks:
      - id: mypy
        additional_dependencies: []
  - repo: local
    hooks:
      - id: pytest-check
        name: pytest
        entry: pytest --tb=short -q
        language: system
        pass_filenames: false
        stages: [pre-push]
```

Install the hooks:
```bash
pre-commit install
pre-commit install --hook-type pre-push
```

### Go (lefthook or shell scripts)

```bash
go install github.com/evilmartians/lefthook@latest
lefthook install
```

Create `lefthook.yml`:
```yaml
pre-commit:
  parallel: true
  commands:
    lint:
      glob: "*.go"
      run: golangci-lint run --fix
    format:
      glob: "*.go"
      run: gofmt -w {staged_files}
pre-push:
  commands:
    test:
      run: go test ./...
```

## Step 5: Create Test Directory Structure

```bash
# Unit & integration tests (co-located pattern)
mkdir -p src/__tests__

# E2E tests
mkdir -p e2e

# Storybook stories (co-located)
# Stories go next to components: src/components/Button/Button.stories.tsx

# Test fixtures and helpers
mkdir -p test/fixtures
mkdir -p test/helpers

# Visual regression baselines
mkdir -p test/visual-baselines
```

## Step 6: Copy Processes from Library

```bash
mkdir -p .a5c/processes/testing
```

### Core testing processes (always install):

```bash
cp plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/test-strategy.js .a5c/processes/testing/
cp plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/quality-gates.js .a5c/processes/testing/
cp plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/flakiness-elimination.js .a5c/processes/testing/
```

### If unit/integration testing selected:

```bash
cp plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/automation-framework.js .a5c/processes/testing/
cp plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/test-data-management.js .a5c/processes/testing/
```

### If E2E testing selected:

```bash
cp plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/e2e-test-suite.js .a5c/processes/testing/
cp plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/cross-browser-testing.js .a5c/processes/testing/
cp plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/environment-management.js .a5c/processes/testing/
```

### If Storybook selected:

```bash
cp plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/visual-regression.js .a5c/processes/testing/
```

### If API/contract testing selected:

```bash
cp plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/api-testing.js .a5c/processes/testing/
cp plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/contract-testing.js .a5c/processes/testing/
```

### If performance testing selected:

```bash
cp plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/performance-testing.js .a5c/processes/testing/
```

### If TDD workflow selected:

```bash
cp plugins/babysitter/skills/babysit/process/methodologies/atdd-tdd/atdd-tdd.js .a5c/processes/testing/
```

### If mutation testing selected:

```bash
cp plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/mutation-testing.js .a5c/processes/testing/
```

### CI/CD testing integration (always, if CI/CD exists):

```bash
cp plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/continuous-testing.js .a5c/processes/testing/
cp plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/shift-left-testing.js .a5c/processes/testing/
cp plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/metrics-dashboard.js .a5c/processes/testing/
```

## Step 7: Copy Skills and Agents

```bash
mkdir -p .a5c/skills/testing
mkdir -p .a5c/agents/testing

# Copy QA skills
ls plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/skills/
# Copy relevant skills based on selections

# Copy TDD skills
cp -r plugins/babysitter/skills/babysit/process/methodologies/atdd-tdd/skills/* .a5c/skills/testing/ 2>/dev/null || true
cp -r plugins/babysitter/skills/babysit/process/methodologies/superpowers/skills/test-driven-development .a5c/skills/testing/ 2>/dev/null || true

# Copy QA agents
ls plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/agents/
# Copy relevant agents based on selections

# Copy methodology agents (test runners, verifiers)
cp -r plugins/babysitter/skills/babysit/process/methodologies/gsd/agents/gsd-verifier .a5c/agents/testing/ 2>/dev/null || true
```

## Step 8: Set Up CI/CD Test Pipeline

If CI/CD exists, add or update the test workflow. Based on the platform:

### GitHub Actions (`.github/workflows/test.yml`):

```yaml
name: Tests

on:
  pull_request:
    branches: [main, staging]
  push:
    branches: [main]

jobs:
  lint-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm run typecheck

  unit-tests:
    runs-on: ubuntu-latest
    needs: lint-typecheck
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm run test -- --coverage
      - name: Check coverage threshold
        run: |
          npx vitest run --coverage --coverage.thresholds.lines=80 --coverage.thresholds.branches=80 --coverage.thresholds.functions=80
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report
          path: coverage/

  e2e-tests:
    runs-on: ubuntu-latest
    needs: lint-typecheck
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  storybook-tests:
    runs-on: ubuntu-latest
    needs: lint-typecheck
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm run test:storybook:ci
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: storybook-results
          path: storybook-static/

  coverage-gate:
    needs: [unit-tests, e2e-tests]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/download-artifact@v4
        with:
          name: coverage-report
          path: coverage/
      - name: Enforce coverage threshold
        run: |
          COVERAGE=$(node -e "const c=JSON.parse(require('fs').readFileSync('coverage/coverage-summary.json','utf8'));console.log(Math.round(c.total.lines.pct))")
          echo "Line coverage: ${COVERAGE}%"
          if [ "$COVERAGE" -lt 80 ]; then
            echo "::error::Coverage ${COVERAGE}% is below threshold 80%"
            exit 1
          fi
```

Adjust job names, test commands, and thresholds based on the user's answers. Remove jobs for layers not selected (e.g., remove `storybook-tests` if Storybook was not chosen). The `lint-typecheck` job runs first and gates all other jobs.

## Step 9: Create Example Tests

Generate a few example test files so the user has working templates:

### Unit test example:
```typescript
// src/__tests__/example.test.ts
import { describe, it, expect } from 'vitest';

describe('Example', () => {
  it('should pass a basic assertion', () => {
    expect(1 + 1).toBe(2);
  });
});
```

### E2E test example:
```typescript
// e2e/example.spec.ts
import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/.+/);
});
```

### Storybook story example (if applicable):
```typescript
// src/components/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, userEvent } from '@storybook/test';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  component: Button,
  title: 'Components/Button',
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { label: 'Click me', variant: 'primary' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await expect(button).toBeInTheDocument();
    await userEvent.click(button);
  },
};
```

## Step 10: Run Initial Test Coverage Check

After installation, run all configured test layers and report coverage:

```bash
# Lint check
npm run lint

# Type check
npm run typecheck

# Unit tests with coverage
npm run test -- --coverage

# E2E tests
npx playwright test

# Storybook tests (if configured)
npm run test:storybook:ci

# Report results
echo "=== Coverage Summary ==="
cat coverage/coverage-summary.json | jq '.total | {lines: .lines.pct, branches: .branches.pct, functions: .functions.pct, statements: .statements.pct}'
```

If coverage is below the configured threshold, inform the user and suggest running the babysitter TDD process to bring coverage up:

```bash
babysitter run:create \
  --process-id coverage-improvement \
  --entry .a5c/processes/testing/automation-framework.js#process \
  --prompt "Improve test coverage to meet the 80% threshold across all metrics" \
  --json
```

## Step 11: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name testing-suite --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 12: Verify Setup

1. All selected test frameworks are installed and configured
2. Linter runs without errors: `npm run lint`
3. Type checker passes: `npm run typecheck`
4. Formatter is consistent: `npm run format:check`
5. Git hooks are installed: `ls .husky/` (or equivalent)
6. Pre-commit hook works: make a small change, `git add`, `git commit` — lint-staged should run
7. Test directory structure exists
8. Example tests run successfully
9. Coverage reports generate correctly
10. CI/CD pipeline includes lint + test stages (if applicable)
11. Coverage thresholds are enforced
12. Babysitter testing processes are copied and accessible

## Reference

- QA Testing processes: `plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/`
- TDD methodology: `plugins/babysitter/skills/babysit/process/methodologies/atdd-tdd/`
- Superpowers TDD: `plugins/babysitter/skills/babysit/process/methodologies/superpowers/test-driven-development.js`
- QA README: `plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/README.md`
- Process backlog: `plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/processes-backlog.md`
