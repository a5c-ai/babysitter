# Testing Suite — Configuration

## 1. Add a Testing Layer

To add a testing layer that wasn't selected during install, copy the relevant process and install the framework:

### Add E2E tests:
```bash
npm install -D @playwright/test
npx playwright install --with-deps
cp plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/e2e-test-suite.js .a5c/processes/testing/
cp plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/cross-browser-testing.js .a5c/processes/testing/
```

### Add Storybook:
```bash
npx storybook@latest init
npm install -D @storybook/test @storybook/test-runner @storybook/addon-coverage
cp plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/visual-regression.js .a5c/processes/testing/
```

### Add API/contract testing:
```bash
cp plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/api-testing.js .a5c/processes/testing/
cp plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/contract-testing.js .a5c/processes/testing/
```

### Add performance testing:
```bash
npm install -D k6  # or your preferred load testing tool
cp plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/performance-testing.js .a5c/processes/testing/
```

### Add mutation testing:
```bash
npm install -D @stryker-mutator/core @stryker-mutator/vitest-runner  # adjust runner for your framework
cp plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/mutation-testing.js .a5c/processes/testing/
```

## 2. Adjust Coverage Thresholds

Edit the test configuration file for your framework:

### Vitest (`vitest.config.ts`):
```typescript
coverage: {
  thresholds: {
    lines: 85,      // was 80
    branches: 85,
    functions: 85,
    statements: 85
  }
}
```

### CI/CD coverage gate:
Update the threshold check in your CI/CD pipeline (`.github/workflows/test.yml` or equivalent).

## 3. Switch Test Frameworks

### Switch from Jest to Vitest:
```bash
npm uninstall jest @types/jest ts-jest
npm install -D vitest @vitest/coverage-v8
# Update imports in test files: jest → vitest
```

### Switch from Cypress to Playwright:
```bash
npm uninstall cypress
npm install -D @playwright/test
npx playwright install --with-deps
# Migrate test files from cypress/ to e2e/
```

## 4. Configure Browser Matrix (E2E)

Edit `playwright.config.ts` to add or remove browsers:

```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  // Add mobile
  { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
]
```

## 5. Configure Lint Rules

### Add stricter rules:

Edit `eslint.config.mjs` to enable additional rules:

```javascript
rules: {
  // Stricter type safety
  '@typescript-eslint/strict-boolean-expressions': 'error',  // was 'warn'
  '@typescript-eslint/no-unsafe-assignment': 'error',
  '@typescript-eslint/no-unsafe-member-access': 'error',
  '@typescript-eslint/no-unsafe-call': 'error',
  '@typescript-eslint/no-unsafe-return': 'error',

  // Complexity limits
  'complexity': ['warn', 15],
  'max-depth': ['warn', 4],
  'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true }],
}
```

### Relax rules for specific patterns:

Add overrides for specific file patterns:

```javascript
{
  files: ['scripts/**', '*.config.{ts,js,mjs}'],
  rules: {
    'no-console': 'off',
    '@typescript-eslint/no-require-imports': 'off',
  },
}
```

### Switch to Biome (all-in-one alternative):

```bash
npm uninstall eslint prettier @eslint/js typescript-eslint eslint-config-prettier
npm install -D @biomejs/biome
npx biome init
```

Biome handles linting and formatting in one tool with faster execution.

## 6. Configure Git Hooks

### Add or modify hooks:

#### Add a pre-push hook (if not installed):

```bash
# TypeScript/JavaScript
echo 'npm run typecheck && npm run test -- --run' > .husky/pre-push
chmod +x .husky/pre-push
```

#### Add conventional commit enforcement:

```bash
npm install -D @commitlint/cli @commitlint/config-conventional
echo '{ "extends": ["@commitlint/config-conventional"] }' > .commitlintrc.json
echo 'npx --no -- commitlint --edit ${1}' > .husky/commit-msg
chmod +x .husky/commit-msg
```

#### Customize lint-staged:

Edit the `lint-staged` config in `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix --max-warnings=0", "prettier --write", "vitest related --run"],
    "*.{js,jsx}": ["eslint --fix --max-warnings=0", "prettier --write"],
    "*.css": ["prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

The `vitest related --run` command runs only tests related to the staged files — fast feedback without running the full suite.

#### Disable a hook temporarily:

```bash
git commit --no-verify -m "WIP: bypass hooks for draft"
```

#### Remove a hook:

```bash
rm .husky/pre-push  # or whichever hook
```

## 7. Enable TDD Workflow

If TDD was not selected during install:

```bash
cp plugins/babysitter/skills/babysit/process/methodologies/atdd-tdd/atdd-tdd.js .a5c/processes/testing/
cp -r plugins/babysitter/skills/babysit/process/methodologies/superpowers/skills/test-driven-development .a5c/skills/testing/
```

## 8. Fix Flaky Tests

Run the flakiness elimination process:

```bash
babysitter run:create \
  --process-id flakiness-elimination \
  --entry .a5c/processes/testing/flakiness-elimination.js#process \
  --prompt "Identify and fix flaky tests in the test suite" \
  --json
```

## 9. Improve Coverage

Run the babysitter testing process to bring coverage up:

```bash
babysitter run:create \
  --process-id coverage-improvement \
  --entry .a5c/processes/testing/automation-framework.js#process \
  --prompt "Write tests to improve coverage to meet the configured threshold" \
  --json
```

## 10. Add Exploratory Testing Sessions

```bash
cp plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/exploratory-testing.js .a5c/processes/testing/
```

## 11. Set Up Test Metrics Dashboard

```bash
cp plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/metrics-dashboard.js .a5c/processes/testing/

babysitter run:create \
  --process-id test-metrics \
  --entry .a5c/processes/testing/metrics-dashboard.js#process \
  --prompt "Set up a test metrics dashboard tracking coverage, pass rate, and flakiness" \
  --json
```

## Reference

All available QA processes:
```bash
ls plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/*.js
```

QA skills and agents:
```bash
ls plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/skills/
ls plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/agents/
```
