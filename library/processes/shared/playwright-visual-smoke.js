/**
 * @module playwright-visual-smoke
 * @description Composable process component that performs visual regression smoke tests
 * using Playwright to catch CSS/layout regressions. Designed for injection into CI,
 * quality-gate, and convergence processes that need to verify UI integrity.
 *
 * The module exposes three surfaces:
 * - `createVisualSmokeTest(config)` — factory that builds two `defineTask` descriptors:
 *   a shell task that runs Playwright checks and an agent task that analyses results.
 * - `executeVisualSmokeTest(ctx, config, args)` — convenience wrapper that drives the
 *   full smoke-test sequence and returns a structured result.
 * - `playwrightVisualSmokeTask` — standalone `defineTask` for direct `ctx.task()` usage.
 *
 * @example
 * ```js
 * import { createVisualSmokeTest, executeVisualSmokeTest } from './playwright-visual-smoke.js';
 *
 * export async function process(inputs, ctx) {
 *   const result = await executeVisualSmokeTest(ctx, {
 *     name: 'dashboard-visual-smoke',
 *     baseUrl: 'http://localhost:3000',
 *     pages: ['/', '/settings', '/dashboard'],
 *     criticalButtons: ['Save', 'Submit', 'Cancel', 'Delete'],
 *     containerSelectors: ['main', '.dashboard-grid', '.sidebar'],
 *   });
 *
 *   if (!result.passed) {
 *     // result.summary contains human-readable failure description
 *   }
 *   return result;
 * }
 * ```
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ─────────────────────────────────────────────────────────────────────────────
// Internal defaults
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_PAGES = ['/'];
const DEFAULT_CRITICAL_BUTTONS = ['Save', 'Submit', 'Cancel'];
const DEFAULT_CONTAINER_SELECTORS = ['main', '[role="main"]', '.container'];
const DEFAULT_VIEWPORT_WIDTH = 1280;
const DEFAULT_VIEWPORT_HEIGHT = 720;
const DEFAULT_TIMEOUT_MS = 30000;

// ─────────────────────────────────────────────────────────────────────────────
// Script generator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a self-contained Node.js (.mjs) script that uses Playwright to
 * perform visual regression smoke checks. The script outputs structured JSON
 * to stdout.
 *
 * @param {object} params
 * @param {string} params.baseUrl              - Base URL to test against.
 * @param {string[]} params.pages              - URL paths to visit.
 * @param {string[]} params.criticalButtons    - Button labels to verify.
 * @param {string[]} params.containerSelectors - CSS selectors to dimension-check.
 * @param {number} params.viewportWidth        - Browser viewport width.
 * @param {number} params.viewportHeight       - Browser viewport height.
 * @param {number} params.timeout              - Navigation timeout in ms.
 * @returns {string} Complete .mjs script content.
 */
function generateSmokeTestScript(params) {
  const {
    baseUrl,
    pages,
    criticalButtons,
    containerSelectors,
    viewportWidth,
    viewportHeight,
    timeout
  } = params;

  // We use JSON.stringify to safely embed config values into the generated script.
  // Template literal dollar signs inside the script body are escaped as \$ so they
  // survive the outer template literal without interpolation.
  return `
import { chromium } from 'playwright';

const BASE_URL = ${JSON.stringify(baseUrl)};
const PAGES = ${JSON.stringify(pages)};
const CRITICAL_BUTTONS = ${JSON.stringify(criticalButtons)};
const CONTAINER_SELECTORS = ${JSON.stringify(containerSelectors)};
const VIEWPORT_WIDTH = ${JSON.stringify(viewportWidth)};
const VIEWPORT_HEIGHT = ${JSON.stringify(viewportHeight)};
const TIMEOUT = ${JSON.stringify(timeout)};

const BUILD_ERROR_PATTERNS = [
  'Build Error',
  'Compilation Error',
  'Module not found',
  'SyntaxError'
];

async function checkPage(page, urlPath) {
  const url = BASE_URL.replace(/\/$/, '') + urlPath;
  const result = {
    url: urlPath,
    buildErrorFound: null,
    containers: [],
    fixedElements: { checked: 0, outOfBounds: [] },
    buttons: []
  };

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    // Allow a brief settle for client-side rendering
    await page.waitForTimeout(1000);
  } catch (err) {
    result.buildErrorFound = 'Navigation failed: ' + err.message;
    return result;
  }

  // ── Build error check ──────────────────────────────────────────────────
  try {
    const bodyText = await page.evaluate(() => document.body ? document.body.innerText : '');
    for (const pattern of BUILD_ERROR_PATTERNS) {
      if (bodyText.includes(pattern)) {
        result.buildErrorFound = pattern;
        break;
      }
    }
    if (!result.buildErrorFound) {
      result.buildErrorFound = false;
    }
  } catch (err) {
    result.buildErrorFound = 'Body text extraction failed: ' + err.message;
  }

  // ── Container dimension checks ─────────────────────────────────────────
  for (const selector of CONTAINER_SELECTORS) {
    try {
      const el = await page.$(selector);
      if (el) {
        const box = await el.boundingBox();
        result.containers.push({
          selector,
          found: true,
          width: box ? box.width : 0,
          height: box ? box.height : 0,
          hasArea: box ? (box.width > 0 && box.height > 0) : false
        });
      } else {
        result.containers.push({
          selector,
          found: false,
          width: 0,
          height: 0,
          hasArea: false
        });
      }
    } catch (err) {
      result.containers.push({
        selector,
        found: false,
        width: 0,
        height: 0,
        hasArea: false,
        error: err.message
      });
    }
  }

  // ── Fixed element bounds check ─────────────────────────────────────────
  try {
    const fixedEls = await page.evaluate((vw, vh) => {
      const all = document.querySelectorAll('*');
      const results = [];
      for (const el of all) {
        const style = window.getComputedStyle(el);
        if (style.position === 'fixed') {
          const rect = el.getBoundingClientRect();
          results.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            className: el.className ? String(el.className).slice(0, 80) : null,
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            withinBounds: rect.left >= 0 && rect.top >= 0 &&
                          (rect.left + rect.width) <= vw &&
                          (rect.top + rect.height) <= vh
          });
        }
      }
      return results;
    }, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

    result.fixedElements.checked = fixedEls.length;
    result.fixedElements.outOfBounds = fixedEls.filter(e => !e.withinBounds);
  } catch (err) {
    result.fixedElements.error = err.message;
  }

  // ── Critical button checks ─────────────────────────────────────────────
  for (const label of CRITICAL_BUTTONS) {
    try {
      const btn = await page.getByRole('button', { name: label, exact: false }).first();
      const isVisible = btn ? await btn.isVisible().catch(() => false) : false;
      let isEnabled = false;
      if (btn && isVisible) {
        isEnabled = await btn.isEnabled().catch(() => false);
      }
      result.buttons.push({
        label,
        found: !!btn && isVisible,
        visible: isVisible,
        clickable: isEnabled
      });
    } catch {
      result.buttons.push({
        label,
        found: false,
        visible: false,
        clickable: false
      });
    }
  }

  return result;
}

async function main() {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    // Playwright or Chromium not available
    console.log(JSON.stringify({
      error: 'Failed to launch browser: ' + err.message,
      hint: 'Run: npx playwright install chromium --with-deps',
      pages: [],
      passed: false
    }));
    process.exit(0);
  }

  const context = await browser.newContext({
    viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }
  });

  const page = await context.newPage();
  const results = [];
  let allPassed = true;

  for (const urlPath of PAGES) {
    try {
      const pageResult = await checkPage(page, urlPath);
      results.push(pageResult);

      // Determine per-page pass/fail
      if (pageResult.buildErrorFound && pageResult.buildErrorFound !== false) {
        allPassed = false;
      }
      if (pageResult.fixedElements.outOfBounds && pageResult.fixedElements.outOfBounds.length > 0) {
        allPassed = false;
      }
      // Container failures are warnings, not hard failures — only fail if ALL containers
      // for the page are missing or zero-area when at least one selector was expected.
      const foundContainers = pageResult.containers.filter(c => c.hasArea);
      if (CONTAINER_SELECTORS.length > 0 && foundContainers.length === 0) {
        allPassed = false;
      }
    } catch (err) {
      results.push({ url: urlPath, error: err.message });
      allPassed = false;
    }
  }

  await browser.close();

  console.log(JSON.stringify({
    passed: allPassed,
    pages: results,
    checkedAt: new Date().toISOString()
  }));
}

main().catch(err => {
  console.log(JSON.stringify({
    error: 'Smoke test script crashed: ' + err.message,
    pages: [],
    passed: false
  }));
  process.exit(0);
});
`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// createVisualSmokeTest
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} VisualSmokeTestConfig
 * @property {string}   name                - Human-readable name for this test suite,
 *                                            e.g. `'dashboard-visual-smoke'`.
 * @property {string}   baseUrl             - Base URL of the application under test,
 *                                            e.g. `'http://localhost:3000'`.
 * @property {string[]} [pages=['/']        - URL paths to visit relative to baseUrl.
 * @property {string[]} [criticalButtons=['Save','Submit','Cancel']]
 *                                          - Button labels to verify are visible and clickable.
 * @property {string[]} [containerSelectors=['main','[role="main"]','.container']]
 *                                          - CSS selectors whose bounding boxes must have
 *                                            non-zero dimensions.
 * @property {number}   [viewportWidth=1280]  - Browser viewport width in pixels.
 * @property {number}   [viewportHeight=720]  - Browser viewport height in pixels.
 * @property {number}   [timeout=30000]       - Navigation timeout in milliseconds.
 */

/**
 * @typedef {object} VisualSmokeTestTasks
 * @property {Function} smokeTestTask      - `defineTask` descriptor for the Playwright shell task.
 * @property {Function} generateReportTask - `defineTask` descriptor for the report-generation agent task.
 */

/**
 * Creates two babysitter task definitions for visual regression smoke testing:
 * 1. A shell task that generates and executes a Playwright smoke test script.
 * 2. An agent task that analyses the raw results and produces a human-readable report.
 *
 * The returned task definitions are suitable for use with `ctx.task()` inside any
 * babysitter process function. They carry no shared mutable state and can be reused
 * across multiple iterations.
 *
 * @param {VisualSmokeTestConfig} config - Smoke test configuration.
 * @returns {VisualSmokeTestTasks} Object containing the two task definitions.
 *
 * @example
 * ```js
 * const { smokeTestTask, generateReportTask } = createVisualSmokeTest({
 *   name: 'app-visual-smoke',
 *   baseUrl: 'http://localhost:3000',
 *   pages: ['/', '/about'],
 * });
 *
 * const rawResults = await ctx.task(smokeTestTask, { attempt: 1 });
 * const report     = await ctx.task(generateReportTask, { smokeResults: rawResults });
 * ```
 */
export function createVisualSmokeTest(config) {
  const {
    name,
    baseUrl,
    pages = DEFAULT_PAGES,
    criticalButtons = DEFAULT_CRITICAL_BUTTONS,
    containerSelectors = DEFAULT_CONTAINER_SELECTORS,
    viewportWidth = DEFAULT_VIEWPORT_WIDTH,
    viewportHeight = DEFAULT_VIEWPORT_HEIGHT,
    timeout = DEFAULT_TIMEOUT_MS
  } = config;

  const scriptContent = generateSmokeTestScript({
    baseUrl,
    pages,
    criticalButtons,
    containerSelectors,
    viewportWidth,
    viewportHeight,
    timeout
  });

  // ── smokeTestTask ─────────────────────────────────────────────────────────

  /**
   * Shell task that writes a temporary .mjs script and executes it with Node.js.
   * The script installs Chromium if needed, launches headless Playwright, visits
   * each configured page, and runs four categories of checks:
   *   1. Build error detection (body text scanning)
   *   2. Container dimension verification (non-zero bounding boxes)
   *   3. Fixed element bounds validation (within viewport)
   *   4. Critical button visibility and clickability
   *
   * Expected args: `{ attempt?: number }`
   *
   * Output: JSON with `{ passed, pages, checkedAt }` on stdout.
   */
  const smokeTestTask = defineTask(
    `visual-smoke/${name}/run`,
    (args, taskCtx) => {
      // Write the script to a temp file and execute it.
      // We use a two-step command: write script, then run.
      // The script path includes the effectId to avoid collisions.
      const scriptPath = `/tmp/visual-smoke-${taskCtx.effectId}.mjs`;

      const command = [
        // Ensure Playwright + Chromium are available
        `npx playwright install chromium --with-deps 2>/dev/null || true`,
        // Write the script
        `cat > '${scriptPath}' << 'VISUAL_SMOKE_SCRIPT_EOF'\n${scriptContent}\nVISUAL_SMOKE_SCRIPT_EOF`,
        // Execute it
        `node '${scriptPath}'`,
        // Clean up
        `rm -f '${scriptPath}'`
      ].join(' && ');

      return {
        kind: 'shell',
        title: `[${name}] Visual regression smoke test (attempt ${args.attempt ?? 1})`,
        shell: {
          command,
          timeout: timeout + 60000, // Extra time for Playwright install
          outputPath: `tasks/${taskCtx.effectId}/output.json`
        },
        io: {
          inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
          outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
        },
        labels: ['visual-smoke', 'playwright', name]
      };
    }
  );

  // ── generateReportTask ────────────────────────────────────────────────────

  /**
   * Agent task that analyses raw smoke test results and produces a
   * human-readable report with actionable findings.
   *
   * Expected args: `{ smokeResults: object }`
   *
   * Output schema:
   * ```json
   * {
   *   "passed": boolean,
   *   "summary": string,
   *   "pages": [{ url, status, issues: string[] }],
   *   "recommendations": string[]
   * }
   * ```
   */
  const generateReportTask = defineTask(
    `visual-smoke/${name}/report`,
    (args, taskCtx) => ({
      kind: 'agent',
      title: `[${name}] Analyse visual smoke test results`,
      agent: {
        name: 'visual-regression-analyst',
        prompt: {
          role: 'UI quality engineer specialising in visual regression detection',
          task: 'Analyse the provided Playwright visual smoke test results and produce a structured, human-readable report.',
          context: {
            testName: name,
            baseUrl,
            smokeResults: args.smokeResults ?? null,
            configuration: {
              pages,
              criticalButtons,
              containerSelectors,
              viewportWidth,
              viewportHeight
            }
          },
          instructions: [
            'For each page, summarise what was checked and what failed.',
            'Build errors are critical — flag prominently if any were detected.',
            'Fixed elements outside viewport bounds suggest CSS layout regressions.',
            'Missing or zero-area containers suggest rendering failures or missing content.',
            'Critical buttons that are not visible or not clickable suggest UI regressions.',
            'Provide a concise overall summary (1-2 sentences).',
            'Include actionable recommendations for any failures.',
            'If the raw results contain an error field, report that the test infrastructure failed.'
          ],
          outputFormat: [
            'JSON with:',
            '  passed (boolean) — true only if all checks across all pages succeeded,',
            '  summary (string) — concise overall summary,',
            '  pages (array of { url: string, status: "pass"|"fail"|"error", issues: string[] }),',
            '  recommendations (string[]) — actionable next steps for any failures'
          ].join('\n')
        },
        outputSchema: {
          type: 'object',
          required: ['passed', 'summary', 'pages', 'recommendations'],
          properties: {
            passed: { type: 'boolean' },
            summary: { type: 'string' },
            pages: {
              type: 'array',
              items: {
                type: 'object',
                required: ['url', 'status', 'issues'],
                properties: {
                  url: { type: 'string' },
                  status: { type: 'string', enum: ['pass', 'fail', 'error'] },
                  issues: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
      },
      labels: ['visual-smoke', 'report', name]
    })
  );

  return { smokeTestTask, generateReportTask };
}

// ─────────────────────────────────────────────────────────────────────────────
// executeVisualSmokeTest
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} PageResult
 * @property {string}       url              - URL path that was tested.
 * @property {string|false} buildErrorFound  - The build error pattern matched, or false if clean.
 * @property {object[]}     containers       - Container dimension check results.
 * @property {object}       fixedElements    - Fixed element bounds check results.
 * @property {object[]}     buttons          - Critical button check results.
 */

/**
 * @typedef {object} VisualSmokeTestResult
 * @property {boolean}      passed   - True when all checks across all pages succeeded.
 * @property {PageResult[]} pages    - Per-page detailed results.
 * @property {string}       summary  - Human-readable summary from the report agent.
 */

/**
 * Convenience function that orchestrates the full visual smoke test sequence:
 *   1. Run the Playwright shell task to collect raw check results.
 *   2. Pass results to the report agent for analysis.
 *   3. Return a unified result object.
 *
 * @param {object}                ctx    - Babysitter process context (provides `ctx.task()`).
 * @param {VisualSmokeTestConfig} config - Smoke test configuration (passed to `createVisualSmokeTest`).
 * @param {object}               [args]  - Optional extra args forwarded to task invocations.
 * @param {number}               [args.attempt=1] - Attempt number for tracking retries.
 * @returns {Promise<VisualSmokeTestResult>}
 *
 * @example
 * ```js
 * const result = await executeVisualSmokeTest(ctx, {
 *   name: 'catalog-visual-smoke',
 *   baseUrl: 'http://localhost:3000',
 *   pages: ['/', '/browse', '/search'],
 *   criticalButtons: ['Search', 'Clear'],
 *   containerSelectors: ['main', '.catalog-grid'],
 * });
 *
 * if (!result.passed) {
 *   // Feed result.summary back into the convergence loop
 * }
 * ```
 */
export async function executeVisualSmokeTest(ctx, config, args = {}) {
  const { smokeTestTask, generateReportTask } = createVisualSmokeTest(config);

  // ── Phase 1: Run Playwright smoke tests ───────────────────────────────────
  const rawResults = await ctx.task(smokeTestTask, {
    attempt: args.attempt ?? 1
  });

  // ── Phase 2: Generate analysis report ─────────────────────────────────────
  const report = await ctx.task(generateReportTask, {
    smokeResults: rawResults
  });

  // ── Compose unified result ────────────────────────────────────────────────
  // Prefer the raw passed flag from the shell task, but let the agent override
  // if it detects additional issues during analysis.
  const rawPassed = rawResults?.passed === true;
  const reportPassed = report?.passed === true;
  const passed = rawPassed && reportPassed;

  return {
    passed,
    pages: rawResults?.pages ?? [],
    summary: report?.summary ?? (passed ? 'All visual smoke checks passed.' : 'Visual smoke checks failed — see page results for details.')
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// playwrightVisualSmokeTask (standalone defineTask)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Standalone babysitter task definition for the visual smoke test component.
 *
 * Use this when you want the smoke test to run as an orchestrated agent task
 * within a harness-driven run via `ctx.task()`. For programmatic composition,
 * prefer `createVisualSmokeTest` or `executeVisualSmokeTest`.
 *
 * Task inputs (passed as `args`):
 * - `name` {string}                - Test suite name.
 * - `baseUrl` {string}             - Application base URL.
 * - `pages` {string[]}             - URL paths to test (default: `['/']`).
 * - `criticalButtons` {string[]}   - Button labels to verify (default: `['Save','Submit','Cancel']`).
 * - `containerSelectors` {string[]} - CSS selectors to dimension-check (default: `['main','[role="main"]','.container']`).
 * - `viewportWidth` {number}       - Viewport width (default: 1280).
 * - `viewportHeight` {number}      - Viewport height (default: 720).
 * - `timeout` {number}             - Navigation timeout in ms (default: 30000).
 *
 * Task output:
 * - `passed` {boolean}             - Overall pass/fail.
 * - `pages` {PageResult[]}         - Per-page detailed results.
 * - `summary` {string}             - Human-readable summary.
 * - `recommendations` {string[]}   - Actionable next steps.
 */
export const playwrightVisualSmokeTask = defineTask(
  'playwright-visual-smoke',
  (args, taskCtx) => {
    const name = args.name ?? 'visual-smoke';
    const baseUrl = args.baseUrl ?? 'http://localhost:3000';
    const pages = args.pages ?? DEFAULT_PAGES;
    const criticalButtons = args.criticalButtons ?? DEFAULT_CRITICAL_BUTTONS;
    const containerSelectors = args.containerSelectors ?? DEFAULT_CONTAINER_SELECTORS;
    const viewportWidth = args.viewportWidth ?? DEFAULT_VIEWPORT_WIDTH;
    const viewportHeight = args.viewportHeight ?? DEFAULT_VIEWPORT_HEIGHT;
    const timeout = args.timeout ?? DEFAULT_TIMEOUT_MS;

    const scriptContent = generateSmokeTestScript({
      baseUrl,
      pages,
      criticalButtons,
      containerSelectors,
      viewportWidth,
      viewportHeight,
      timeout
    });

    return {
      kind: 'agent',
      title: `[${name}] Playwright visual regression smoke test`,
      agent: {
        name: 'visual-smoke-runner',
        prompt: {
          role: 'UI test engineer executing Playwright visual regression smoke tests',
          task: `Execute a visual regression smoke test against ${baseUrl}.

Steps:
1. Write the following Node.js script to a temporary .mjs file and execute it with \`node\`:

--- BEGIN SCRIPT ---
${scriptContent}
--- END SCRIPT ---

2. Before running, ensure Playwright and Chromium are available:
   npx playwright install chromium --with-deps

3. Capture the JSON output from stdout.

4. Analyse the results:
   - Build errors are critical failures.
   - Zero-area containers indicate rendering problems.
   - Fixed elements outside viewport bounds suggest CSS regressions.
   - Missing critical buttons suggest UI breakage.

5. Produce a structured report.`,
          context: {
            testName: name,
            baseUrl,
            pages,
            criticalButtons,
            containerSelectors,
            viewportWidth,
            viewportHeight,
            timeout
          },
          instructions: [
            'Execute the script — do not just analyse it theoretically',
            'If Playwright is not installed, install it first with npx playwright install chromium',
            'If the application is not running (connection refused), report that clearly',
            'Parse the JSON output from the script and include it in your analysis',
            'Produce both raw results and human-readable summary',
            'Output must be valid JSON matching the output schema'
          ],
          outputFormat: [
            'JSON with:',
            '  passed (boolean),',
            '  pages (array of { url, buildErrorFound, containers, fixedElements, buttons }),',
            '  summary (string),',
            '  recommendations (string[])'
          ].join('\n')
        },
        outputSchema: {
          type: 'object',
          required: ['passed', 'pages', 'summary', 'recommendations'],
          properties: {
            passed: { type: 'boolean' },
            pages: { type: 'array' },
            summary: { type: 'string' },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
      },
      labels: ['visual-smoke', 'playwright', name]
    };
  }
);
