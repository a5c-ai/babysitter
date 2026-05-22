/**
 * @process specializations/devops-sre-platform/post-deploy-visual-check
 * @description Post-deploy visual check — after a production deploy, spin up
 * Playwright against the live URL, walk a configurable set of critical flows,
 * capture full-page screenshots, and emit a self-contained HTML report so a
 * human reviewer can verify the deploy looks right before handing off.
 *
 * Motivation: traditional smoke tests (HTTP 200, login form renders) often
 * pass while a production-only UX regression slips through. The canonical
 * example: a banner that renders conditionally on a flag set by the server
 * for new fallback-draft records; the banner CSS ships fine, the server
 * flag ships fine, but the pair isn't exercised because the e2e suite uses
 * seeded fixtures that never hit the fallback path. A quick visual walk
 * of 4–6 critical flows catches this.
 *
 * @inputs {
 *   productionUrl: string,
 *   flows: Array<{ name: string, slug: string, path: string, assertions?: Array<string> }>,
 *   reportDir?: string,
 *   projectDir?: string,
 *   seededAccount?: { email?: string, sessionCookie?: { name: string, value: string, domain?: string } },
 *   timeoutMs?: number
 * }
 * @outputs {
 *   success: boolean,
 *   reportPath: string,
 *   flowResults: Array<{ name: string, status: string, httpCode: number|null, screenshot: string, notes: string }>,
 *   screenshotDir: string
 * }
 *
 * @example
 * const result = await orchestrate('specializations/devops-sre-platform/post-deploy-visual-check', {
 *   productionUrl: 'https://myapp.example.com',
 *   flows: [
 *     { name: 'Home', slug: 'home', path: '/' },
 *     { name: 'Login', slug: 'login', path: '/login', assertions: ['magic link'] },
 *     { name: 'Settings', slug: 'settings', path: '/settings' },
 *   ],
 *   reportDir: '.a5c/reports',
 *   projectDir: process.cwd(),
 * });
 *
 * @references
 * - Playwright: https://playwright.dev/
 * - The "tests pass, users notice the bug" problem — see cookbook-retrospect.md
 *   in library/reference for the motivating incident report.
 *
 * @agent general-purpose
 * @graph
 *   domains: [domain:devops]
 *   specializations: [specialization:devops-sre-platform]
 *   workflows: [workflow:release-management]
 *   roles: [role:devops-engineer, role:qa-engineer]
 *   skillAreas: [skill-area:deployment-infrastructure-management]
 *   topics: [topic:continuous-deployment]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_FLOWS = [
  { name: 'Home', slug: 'home', path: '/' },
  { name: 'Login', slug: 'login', path: '/login' },
];

export async function process(inputs, ctx) {
  const {
    productionUrl,
    flows = DEFAULT_FLOWS,
    reportDir = '.a5c/reports',
    projectDir = process.cwd(),
    seededAccount = null,
    timeoutMs = 300000,
  } = inputs;

  if (!productionUrl) {
    throw new Error('post-deploy-visual-check requires `productionUrl` in inputs.');
  }

  const startTime = ctx.now();
  ctx.log('info', `Post-deploy visual check → ${productionUrl} · ${flows.length} flow(s)`);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runSubdir = `post-deploy-${stamp}`;

  const generate = await ctx.task(generateSpecTask, {
    projectDir,
    reportDir,
    runSubdir,
    flows,
    seededAccount,
  });

  const execute = await ctx.task(runPlaywrightTask, {
    projectDir,
    reportDir,
    runSubdir,
    productionUrl,
    timeoutMs,
    specPath: generate.specPath,
  });

  const report = await ctx.task(renderReportTask, {
    projectDir,
    reportDir,
    runSubdir,
    flowResults: execute.flowResults,
    productionUrl,
  });

  const anyFail = (execute.flowResults || []).some((f) => f.status === 'fail');
  return {
    success: !anyFail,
    reportPath: report.reportPath,
    screenshotDir: report.screenshotDir,
    flowResults: execute.flowResults,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/devops-sre-platform/post-deploy-visual-check',
      productionUrl,
      flowCount: flows.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Phase 1 · Generate a one-off Playwright spec that walks the flows.
// We do NOT check the spec into the repo — it lives under reportDir so the
// user can re-run it or inspect it after the fact.
// ---------------------------------------------------------------------------
export const generateSpecTask = defineTask('post-deploy-generate-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Playwright spec for the configured flows',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior test engineer',
      task: 'Write a Playwright spec that walks each configured flow, screenshots it, and records HTTP + title + user-defined assertion results.',
      context: args,
      instructions: [
        'Spec file location: `${projectDir}/${reportDir}/${runSubdir}/walk.spec.ts`. Create the parent dir if missing.',
        'Each flow is `{ name, slug, path, assertions? }`. `path` is relative to the PROD_URL env var read at runtime.',
        'For every flow: `page.goto(PROD_URL + path, { waitUntil: "domcontentloaded" })`, take a full-page screenshot `${slug}.png` next to the spec file, record httpCode + title. If `assertions` is present, for each string try `expect(page.getByText(new RegExp(assertion, "i")).first()).toBeVisible({ timeout: 5000 })` and record pass/fail per assertion.',
        'Results are appended to `${projectDir}/${reportDir}/${runSubdir}/results.json` using `test.afterAll`. Shape: `{ flows: [{ name, slug, path, status: "ok"|"warn"|"fail", httpCode, title, screenshot, assertions: [{ text, passed }] }] }`.',
        'Status rule: fail on HTTP >= 500 or navigation error. Warn on 400..499 (often auth-gated, screenshot still captured). Otherwise ok. Failed assertions demote status from ok to warn.',
        'If `seededAccount.sessionCookie` is present, use `browserContext.addCookies([{name, value, domain, path: "/", httpOnly: true, secure: true, sameSite: "Lax"}])` before the first navigation.',
        'Use `expect.configure({ timeout: 5000 })` and `test.setTimeout(30000)` per test — do not let one slow flow eat the whole walk.',
        'Do NOT add retries; this is a post-deploy check, not a flake scan.',
      ],
      outputFormat: 'JSON',
      outputSchema: {
        type: 'object',
        required: ['specPath'],
        properties: {
          specPath: { type: 'string' },
          screenshotDir: { type: 'string' },
        },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['post-deploy', 'generate'],
}));

// ---------------------------------------------------------------------------
// Phase 2 · Execute the generated spec.
// ---------------------------------------------------------------------------
export const runPlaywrightTask = defineTask('post-deploy-run-spec', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Execute Playwright walk against production',
  shell: {
    command:
      'cd "${PROJECT_DIR}" && ' +
      'PROD_URL="${PROD_URL}" npx playwright test "${SPEC_PATH}" --reporter=list 2>&1 | tail -80 && ' +
      'cat "${PROJECT_DIR}/${REPORT_DIR}/${RUN_SUBDIR}/results.json"',
    env: {
      PROJECT_DIR: args.projectDir,
      PROD_URL: args.productionUrl,
      SPEC_PATH: args.specPath,
      REPORT_DIR: args.reportDir,
      RUN_SUBDIR: args.runSubdir,
    },
    timeoutMs: args.timeoutMs || 300000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['post-deploy', 'execute'],
}));

// ---------------------------------------------------------------------------
// Phase 3 · Render a self-contained HTML report next to the screenshots.
// ---------------------------------------------------------------------------
export const renderReportTask = defineTask('post-deploy-render-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Render HTML report for the walk',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Front-end engineer',
      task: 'Write a self-contained HTML file that displays each flow as a card: name, URL, HTTP code, title, assertion results, and the screenshot inline. No external deps.',
      context: args,
      instructions: [
        'Target path: `${projectDir}/${reportDir}/${runSubdir}/report.html`.',
        'Read flowResults from args (same shape as results.json).',
        'Layout: one card per flow, status chip in header (ok = green dot, warn = amber, fail = red), HTTP + title as monospace subtitle, inline `<img src="./<slug>.png">` (same dir), assertion list beneath when present.',
        'Inline <style> only. Do not fetch fonts or use external JS. Dark-mode aware via prefers-color-scheme.',
        'Include a header summarising flows total / ok / warn / fail and the productionUrl + stamp.',
        'Output: `{ "reportPath": "...", "screenshotDir": "..." }` — both absolute paths.',
      ],
      outputFormat: 'JSON',
      outputSchema: {
        type: 'object',
        required: ['reportPath', 'screenshotDir'],
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['post-deploy', 'report'],
}));

// ---------------------------------------------------------------------------
// Re-exportable thin wrapper — host processes can import directly.
// Use when you already have a Playwright project set up and just want the
// shell invocation to run a pre-authored walk spec.
// ---------------------------------------------------------------------------
export const postDeployVisualCheckShellTask = defineTask('post-deploy-visual-check', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Post-deploy visual-check (existing walk spec)',
  shell: {
    command:
      'cd "${PROJECT_DIR}" && ' +
      'PROD_URL="${PROD_URL}" npm run smoke:prod 2>&1 | tail -60 && ' +
      'ls -1t "${REPORT_DIR}" 2>/dev/null | head -1 | xargs -I{} echo "report: ${REPORT_DIR}/{}/report.html"',
    env: {
      PROJECT_DIR: args.projectDir || process.cwd(),
      PROD_URL: args.productionUrl || '',
      REPORT_DIR: args.reportDir || '.a5c/reports',
    },
    timeoutMs: args.timeoutMs || 300000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['post-deploy', 'smoke'],
}));
