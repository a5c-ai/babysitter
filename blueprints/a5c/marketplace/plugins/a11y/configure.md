# a11y — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `wcagLevel` | `A`, `AA`, `AAA` | `AA` | eslint config + axe `withTags` + pa11y `standard` |
| `minSeverity` | `minor`, `moderate`, `serious`, `critical` | `serious` | axe test filter, lighthouse assertion |
| `ciGate` | `off`, `warn`, `error` | `error` | workflow job `continue-on-error` |
| `lintMode` | `off`, `warn`, `error` | `error` | per-rule in eslint config |
| `lighthouseMinScore` | `0.0`–`1.0` | `0.95` | `lighthouserc.json` assertions |
| `scanRoutes` | list of URL paths | `['/']` | axe spec + pa11yci urls |
| `preCommitLint` | `on`, `off` | `on` | `.husky/pre-commit` / `.pre-commit-config.yaml` |
| `prePushRuntime` | `on`, `off` | `off` | `.husky/pre-push` |
| `axeTags` | `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`, `best-practice` | `wcag2a,wcag2aa` | axe `withTags([...])` |
| `pa11yStandard` | `WCAG2A`, `WCAG2AA`, `WCAG2AAA` | `WCAG2AA` | `.pa11yci.json` |
| `ignoreRules` | array of rule ids | `[]` | eslint + axe disableRules |
| `reportFormat` | `json`, `html`, `junit` | `html` | workflow artifact + reporter |

## 2. Adjust Lint Rule Severity

Edit `eslint.config.mjs`:

```javascript
rules: {
  'jsx-a11y/alt-text': 'error',
  'jsx-a11y/no-static-element-interactions': 'warn',  // relax noisy rule
  'jsx-a11y/no-autofocus': 'off',                     // disable entirely
}
```

To disable a rule for a specific file range:

```javascript
{
  files: ['src/legacy/**/*.tsx'],
  rules: {
    'jsx-a11y/alt-text': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
  },
},
```

## 3. Change WCAG Level

### Axe (Playwright spec)

```typescript
const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])  // add 2.2 AA
  .analyze();
```

### pa11y

Edit `.pa11yci.json`:

```json
{ "defaults": { "standard": "WCAG2AAA" } }
```

### Lighthouse

Lighthouse does not distinguish WCAG levels directly — raise `minScore`:

```json
"categories:accessibility": ["error", { "minScore": 0.98 }]
```

## 4. Change CI Gate Behavior

Edit `.github/workflows/a11y.yml`:

```yaml
# Warn-only: job runs but doesn't fail PR
a11y-runtime:
  continue-on-error: true

# Hard gate (default): remove continue-on-error
```

To run on PRs but not block merge, make the job a required check in branch protection but mark it `continue-on-error: true`; the check will always report success.

## 5. Add or Remove Scanned Routes

### Axe spec

Edit `tests/a11y.spec.ts`:

```typescript
const routes = ['/', '/about', '/pricing', '/docs', '/signup', '/login'];
```

### pa11y

Edit `.pa11yci.json` → `urls` array.

### Sitemap-driven

For large sites, pull routes from a sitemap:

```bash
npm install -D pa11y-ci-reporter-html
npx pa11y-ci --sitemap http://localhost:8000/sitemap.xml --sitemap-exclude "/admin/.*"
```

## 6. Ignore Specific Violations

### Axe — disable a rule globally

```typescript
await new AxeBuilder({ page })
  .disableRules(['color-contrast'])  // handled by design system
  .analyze();
```

### Axe — ignore selectors

```typescript
await new AxeBuilder({ page })
  .exclude('.third-party-widget')
  .analyze();
```

### pa11y — add exceptions

Edit `.pa11yci.json`:

```json
{
  "urls": [
    { "url": "http://localhost:8000/", "ignore": ["WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Fail"] }
  ]
}
```

## 7. Configure Reporting

### JUnit XML for CI test reporting

```typescript
// playwright.config.ts
reporter: [['junit', { outputFile: 'test-results/a11y-junit.xml' }], ['html']]
```

### HTML summary

pa11y-ci HTML reporter:

```bash
npm install -D pa11y-ci-reporter-html
npx pa11y-ci --reporter pa11y-ci-reporter-html
```

## 8. Per-Stack Runtime Tool Switching

### Swap pa11y → Axe

```bash
npm uninstall pa11y-ci
npm install -D @axe-core/playwright @playwright/test
# Replace npm scripts and workflow steps accordingly
```

### Swap Axe → Lighthouse (for marketing sites)

```bash
npm uninstall @axe-core/playwright
npm install -D @lhci/cli
# Use lighthouserc.json assertions instead of Playwright test file
```

## 9. Fix Baseline Violations

Run the babysitter a11y fix process:

```bash
babysitter run:create \
  --process-id a11y-baseline-fix \
  --entry .a5c/processes/a11y/fix-baseline.js#process \
  --prompt "Fix all serious and critical a11y violations in the current baseline, starting with top 3 most-visited pages" \
  --json
```

## 10. Enable Keyboard-Navigation Testing

Add a Playwright test that tabs through every focusable element and verifies visible focus:

```typescript
test('keyboard navigation', async ({ page }) => {
  await page.goto('/');
  const focusableCount = await page.locator('button, a, input, [tabindex]').count();
  for (let i = 0; i < focusableCount; i++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  }
});
```

## 11. Schedule Nightly Full Scans

Add a scheduled workflow `.github/workflows/a11y-nightly.yml`:

```yaml
on:
  schedule:
    - cron: '0 3 * * *'  # 03:00 UTC daily
```

Run a deeper scan (all routes, AAA level, include best-practice tags) and file an issue on regression.
