# post-deploy-visual-check

**Path:** `specializations/devops-sre-platform/post-deploy-visual-check`

## What it does

After a production deploy, runs Playwright against the live URL, walks a configurable set of critical flows (home, login, key feature pages, etc.), captures full-page screenshots, and emits a self-contained HTML report so a human reviewer can verify the deploy looks right before handing off.

## Why it exists

Traditional smoke tests catch hard failures (HTTP 500, missing route) but miss production-only UX regressions that slip through because they're not in the seeded e2e fixtures. A conditional banner driven by a server-side flag, for example, may ship correctly but never render because the test path never exercises the fallback record that triggers it.

This process closes that gap with ~30 seconds of browser time per deploy.

## Inputs

| field | type | required | description |
|---|---|---|---|
| `productionUrl` | `string` | ✅ | Base URL to walk, no trailing slash |
| `flows` | `Array<{name, slug, path, assertions?}>` | ✅ | Paths to walk + optional text assertions |
| `reportDir` | `string` | | Default `.a5c/reports` |
| `projectDir` | `string` | | Default `process.cwd()` |
| `seededAccount.sessionCookie` | `{name, value, domain?}` | | When set, the walk runs as a signed-in user |
| `timeoutMs` | `number` | | Per-flow Playwright timeout. Default 30s, total 300s |

## Outputs

| field | type | description |
|---|---|---|
| `success` | `boolean` | `false` if any flow failed (HTTP ≥ 500 or navigation error) |
| `reportPath` | `string` | Absolute path to `report.html` |
| `screenshotDir` | `string` | Absolute path to the folder holding `<slug>.png` files |
| `flowResults` | `Array<{name, status, httpCode, screenshot, notes, assertions?}>` | Per-flow outcome |

## Composition

Import `postDeployVisualCheckShellTask` directly if you already have a `smoke:prod` npm script set up, or use the full three-phase process when you want the walk spec generated on the fly.

```js
import { postDeployVisualCheckShellTask } from 'specializations/devops-sre-platform/post-deploy-visual-check.js';

// inside a process
const smoke = await ctx.task(postDeployVisualCheckShellTask, {
  projectDir,
  productionUrl: 'https://myapp.example.com',
});
```

## Example

```js
const result = await orchestrate('specializations/devops-sre-platform/post-deploy-visual-check', {
  productionUrl: 'https://cookbook-two-theta.vercel.app',
  flows: [
    { name: 'Home', slug: 'home', path: '/' },
    { name: 'Login', slug: 'login', path: '/login', assertions: ['magic link'] },
    { name: 'Add recipe', slug: 'import-blank', path: '/recipes/new?blank=1' },
    { name: 'Recipe bank', slug: 'recipes', path: '/recipes' },
  ],
});
// → report at result.reportPath
```

## When to include this in a deploy pipeline

- After any UI change that adds conditional rendering tied to a data flag
- Before a marketing blast / demo session where the landing flow matters
- On every production deploy if your deploy cadence is ≤ 1/day

## Non-goals

- Not a performance regression check (use Lighthouse CI for that)
- Not an a11y audit (use axe-core or axe-playwright)
- Not a visual-diff tool (compares nothing against a baseline — it's an eyes-on report)
