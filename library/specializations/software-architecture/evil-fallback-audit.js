/**
 * @process software-architecture/evil-fallback-audit
 * @description Scan a codebase for silent fallback mechanisms, catch-and-swallow patterns, degraded behavior paths, and configuration cascades that hide real problems. Produce a prioritized inventory and fix plan.
 * @inputs { codebasePath: string, projectName: string, languages: array, severity: string, autoFix: boolean }
 * @outputs { success: boolean, inventory: array, fixPlan: array, reportPath: string }
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:software-architecture]
 *   workflows: [workflow:code-quality, workflow:technical-debt-reduction]
 *   roles: [role:tech-lead, role:principal-engineer, role:sre]
 *   skillAreas: [skill-area:code-analysis-linting, skill-area:debugging]
 *   topics: [topic:error-handling, topic:resilience, topic:observability, topic:technical-debt]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    codebasePath = '.',
    projectName = 'Project',
    languages = [],
    severity = 'all',
    autoFix = false,
    outputDir = 'evil-fallback-audit',
  } = inputs;

  const artifacts = [];

  // ============================================================================
  // PHASE 1: SCAN — Identify all fallback patterns
  // ============================================================================

  const [tryCatchScan, logicalScan, configScan, testScan] = await ctx.parallel.all([
    () => ctx.task(scanTryCatchFallbacksTask, { codebasePath, projectName, languages }),
    () => ctx.task(scanLogicalFallbacksTask, { codebasePath, projectName, languages }),
    () => ctx.task(scanConfigCascadesTask, { codebasePath, projectName, languages }),
    () => ctx.task(scanTestWeakeningTask, { codebasePath, projectName, languages }),
  ]);

  artifacts.push(
    ...(tryCatchScan.artifacts ?? []),
    ...(logicalScan.artifacts ?? []),
    ...(configScan.artifacts ?? []),
    ...(testScan.artifacts ?? []),
  );

  // ============================================================================
  // PHASE 2: CLASSIFY — Assess severity and impact
  // ============================================================================

  const classification = await ctx.task(classifyFindingsTask, {
    tryCatchFindings: tryCatchScan.findings,
    logicalFindings: logicalScan.findings,
    configFindings: configScan.findings,
    testFindings: testScan.findings,
    severity,
  });

  artifacts.push(...(classification.artifacts ?? []));

  // ============================================================================
  // PHASE 3: REPORT — Generate prioritized inventory
  // ============================================================================

  const report = await ctx.task(generateReportTask, {
    projectName,
    classified: classification.classified,
    outputDir,
  });

  artifacts.push(report.reportPath);

  // ============================================================================
  // PHASE 4 (optional): FIX — Apply safe fixes
  // ============================================================================

  if (autoFix) {
    const fixes = await ctx.task(applyFixesTask, {
      codebasePath,
      classified: classification.classified,
      outputDir,
    });
    artifacts.push(...(fixes.artifacts ?? []));
  }

  return {
    success: true,
    inventory: classification.classified,
    fixPlan: classification.fixPlan,
    reportPath: report.reportPath,
    artifacts,
    summary: {
      total: classification.classified.length,
      critical: classification.classified.filter(f => f.severity === 'critical').length,
      high: classification.classified.filter(f => f.severity === 'high').length,
      medium: classification.classified.filter(f => f.severity === 'medium').length,
      low: classification.classified.filter(f => f.severity === 'low').length,
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// TASK 1: Scan try-catch fallbacks
// ──────────────────────────────────────────────────────────────────────────────

const scanTryCatchFallbacksTask = defineTask('scan-try-catch-fallbacks', (args) => ({
  kind: 'agent',
  title: 'Scan for try-catch fallback patterns',
  labels: ['scan', 'error-handling'],
  agent: {
    name: 'Try-Catch Fallback Scanner',
    prompt: {
      instructions: [
        `Scan the codebase at ${args.codebasePath} for try-catch fallback patterns that hide real problems.`,
        '',
        'Find ALL instances of these patterns (skip test files):',
        '',
        '1. **Empty catch blocks**: `catch { }`, `catch { /* */ }`, `catch { /* best effort */ }`',
        '2. **Catch-and-return-default**: `catch { return []; }`, `catch { return null; }`, `catch { return false; }`',
        '3. **Catch-and-continue**: `catch { continue; }` in loops',
        '4. **ESM→CJS fallback chains**: try import(), catch, try require()',
        '5. **Retry loops that swallow**: retry N times, only throw on last attempt',
        '6. **Nested try-catch**: outer catch swallows inner errors',
        '7. **Promise .catch(() => undefined)**: swallows async errors in chains',
        '8. **catch-and-convert**: converts typed errors to generic strings/results',
        '9. **finally blocks with try-catch**: cleanup errors ignored',
        '10. **void operator on promises**: `void asyncFn()` suppresses rejections',
        '',
        'For each finding, record:',
        '- file: relative path',
        '- line: line number',
        '- pattern: which pattern category (1-10 above)',
        '- code: the relevant code snippet (5-10 lines)',
        '- hides: what error/behavior is hidden',
        '- impact: what goes wrong when the real error occurs',
        '',
        'Return { findings: [...], artifacts: [...] }',
      ],
    },
  },
}));

// ──────────────────────────────────────────────────────────────────────────────
// TASK 2: Scan logical fallbacks (||, ??, ternary chains)
// ──────────────────────────────────────────────────────────────────────────────

const scanLogicalFallbacksTask = defineTask('scan-logical-fallbacks', (args) => ({
  kind: 'agent',
  title: 'Scan for logical fallback patterns',
  labels: ['scan', 'config'],
  agent: {
    name: 'Logical Fallback Scanner',
    prompt: {
      instructions: [
        `Scan the codebase at ${args.codebasePath} for logical fallback patterns that silently degrade behavior.`,
        '',
        'Find ALL instances of these patterns (skip test files):',
        '',
        '1. **Environment variable cascades**: `process.env.A || process.env.B || process.env.C` — silent credential/config switching',
        '2. **Model/provider resolution chains**: code that picks a model/endpoint from multiple sources with silent fallbacks',
        '3. **Hardcoded defaults masking missing config**: `?? "gpt-4o"`, `|| "localhost:4318"`, `?? "node:22-bookworm"`',
        '4. **Silent mode switching**: `if (available) { useA() } else { useB() }` without logging which path taken',
        '5. **Conditional feature degradation**: feature detection that silently drops capabilities',
        '6. **File precedence hierarchies**: project config silently overrides global config (or vice versa)',
        '7. **Platform-specific behavior**: `if (windows) { skip() }` with no indication',
        '8. **Timeout values with fallbacks**: `timeout || DEFAULT` where 0 is a valid timeout but treated as falsy',
        '9. **Binary/command resolution**: trying multiple paths to find a CLI tool',
        '10. **Implicit type coercion**: `||` used where `??` should be (treats 0, "", false as missing)',
        '',
        'For each finding, record:',
        '- file: relative path',
        '- line: line number',
        '- pattern: which pattern category (1-10 above)',
        '- code: the relevant code snippet',
        '- hides: what configuration/behavior silently changes',
        '- impact: what goes wrong when the real value is missing',
        '',
        'Return { findings: [...], artifacts: [...] }',
      ],
    },
  },
}));

// ──────────────────────────────────────────────────────────────────────────────
// TASK 3: Scan configuration cascades and resolution chains
// ──────────────────────────────────────────────────────────────────────────────

const scanConfigCascadesTask = defineTask('scan-config-cascades', (args) => ({
  kind: 'agent',
  title: 'Scan for configuration cascade patterns',
  labels: ['scan', 'config', 'credentials'],
  agent: {
    name: 'Config Cascade Scanner',
    prompt: {
      instructions: [
        `Scan the codebase at ${args.codebasePath} for configuration resolution patterns that silently substitute values.`,
        '',
        'Find ALL instances of these patterns (skip test files):',
        '',
        '1. **Credential resolution chains**: functions that try multiple API key sources and silently pick one',
        '2. **Endpoint/URL resolution**: functions that construct API URLs from multiple env vars with fallbacks',
        '3. **Profile/config file loading**: code that loads config from project → user → global with silent precedence',
        '4. **Cache with stale defaults**: config caching where stale values are served without indication',
        '5. **Auto-upgrade/downgrade**: code that silently switches providers, protocols, or versions',
        '6. **Registration with skip-on-error**: plugin/adapter registration that skips failures',
        '7. **Detection with false-negative fallback**: "is installed?" checks that return false on detection errors',
        '8. **Matrix/combination generation**: test or config matrix generation with silent defaults for unknown values',
        '',
        'For each finding, record:',
        '- file: relative path',
        '- line: line number',
        '- pattern: which pattern category (1-8 above)',
        '- code: the relevant code snippet',
        '- hides: what value is silently substituted',
        '- impact: what incorrect behavior results',
        '',
        'Return { findings: [...], artifacts: [...] }',
      ],
    },
  },
}));

// ──────────────────────────────────────────────────────────────────────────────
// TASK 4: Scan test infrastructure for assertion weakening
// ──────────────────────────────────────────────────────────────────────────────

const scanTestWeakeningTask = defineTask('scan-test-weakening', (args) => ({
  kind: 'agent',
  title: 'Scan test infrastructure for assertion weakening',
  labels: ['scan', 'testing'],
  agent: {
    name: 'Test Weakening Scanner',
    prompt: {
      instructions: [
        `Scan the test infrastructure and CI pipelines at ${args.codebasePath} for patterns that weaken test assertions.`,
        '',
        'Find ALL instances of these patterns:',
        '',
        '1. **Non-zero exit code tolerance**: tests that pass when commands exit non-zero',
        '2. **Content validation weakening**: checks that accept minimal content as "valid"',
        '3. **Assertion softening**: status marked "pending" then retroactively upgraded to "passed"',
        '4. **Threshold too low**: minimum counts/sizes that are easily satisfied by error output',
        '5. **Silent test matrix defaults**: unknown agent/model/mode silently substituted with defaults',
        '6. **JSON parse errors suppressed**: `2>/dev/null` or `|| echo ""` on parsing commands',
        '7. **Missing artifact tolerance**: missing files reported as "—" instead of failures',
        '8. **Retry-until-pass**: tests retried until they pass without flagging flakiness',
        '9. **Feature-flag gated assertions**: assertions skipped based on runtime conditions',
        '10. **Grep count errors → zero**: `grep -c pattern || true` — grep errors become "0 matches"',
        '',
        'Look in CI workflow files (.github/workflows/), test runners, scenario contracts, etc.',
        '',
        'For each finding, record:',
        '- file: relative path',
        '- line: line number',
        '- pattern: which pattern category (1-10 above)',
        '- code: the relevant code snippet',
        '- hides: what test failure is masked',
        '- impact: what broken behavior could pass CI',
        '',
        'Return { findings: [...], artifacts: [...] }',
      ],
    },
  },
}));

// ──────────────────────────────────────────────────────────────────────────────
// TASK 5: Classify and prioritize findings
// ──────────────────────────────────────────────────────────────────────────────

const classifyFindingsTask = defineTask('classify-findings', (args) => ({
  kind: 'agent',
  title: 'Classify findings by severity and create fix plan',
  labels: ['analysis', 'prioritization'],
  agent: {
    name: 'Findings Classifier',
    prompt: {
      instructions: [
        'Classify and prioritize all findings from the scan phases.',
        '',
        'Input findings:',
        `- Try-catch fallbacks: ${JSON.stringify(args.tryCatchFindings ?? [])}`,
        `- Logical fallbacks: ${JSON.stringify(args.logicalFindings ?? [])}`,
        `- Config cascades: ${JSON.stringify(args.configFindings ?? [])}`,
        `- Test weakening: ${JSON.stringify(args.testFindings ?? [])}`,
        '',
        'For each finding, assign:',
        '',
        '**Severity** (using these criteria):',
        '- **critical**: Data loss, corruption, security bypass, or financial impact',
        '- **high**: Behavior changes without any indication, debugging impossible',
        '- **medium**: Degraded behavior with only stderr logging, or error context lost',
        '- **low**: Cosmetic, cleanup-only, or intentional-and-documented fallbacks',
        '',
        '**Category**:',
        '- error-swallowing: catch blocks that hide errors',
        '- silent-degradation: behavior silently changes to worse alternative',
        '- config-cascade: configuration resolved from wrong source without indication',
        '- test-weakening: test assertions that mask real failures',
        '- resource-leak: cleanup failures causing accumulation',
        '',
        'Also create a **fix plan** for each high/critical finding:',
        '- What to change (add logging, remove fallback, use explicit error, etc.)',
        '- Estimated effort (trivial, small, medium, large)',
        '- Risk of fix (could the fix itself break things?)',
        '',
        args.severity !== 'all' ? `Filter to only ${args.severity} severity findings.` : '',
        '',
        'Return { classified: [...findings with severity+category], fixPlan: [...], artifacts: [] }',
      ],
    },
  },
}));

// ──────────────────────────────────────────────────────────────────────────────
// TASK 6: Generate report
// ──────────────────────────────────────────────────────────────────────────────

const generateReportTask = defineTask('generate-report', (args) => ({
  kind: 'agent',
  title: 'Generate evil fallbacks report',
  labels: ['report', 'documentation'],
  agent: {
    name: 'Report Generator',
    prompt: {
      instructions: [
        `Generate a markdown report for ${args.projectName} evil fallback audit.`,
        '',
        `Classified findings: ${JSON.stringify(args.classified ?? [])}`,
        '',
        'The report should follow this structure:',
        '',
        '# Evil Fallbacks Audit — {projectName}',
        '',
        '## Summary',
        '- Total findings, breakdown by severity, breakdown by category',
        '',
        '## Critical',
        '### {finding title}',
        '**File:** `{path}:{line}`',
        '{description of the pattern, what it hides, and the impact}',
        '',
        '## High / ## Medium / ## Low (same format)',
        '',
        '## Fix Plan',
        '| Priority | File | Finding | Fix | Effort |',
        '',
        '## Anti-Patterns to Avoid',
        'Common patterns found and guidance on alternatives.',
        '',
        `Write the report to ${args.outputDir}/evil-fallbacks.md`,
        'Return { reportPath: "path/to/report.md" }',
      ],
    },
  },
}));

// ──────────────────────────────────────────────────────────────────────────────
// TASK 7 (optional): Apply safe fixes
// ──────────────────────────────────────────────────────────────────────────────

const applyFixesTask = defineTask('apply-fixes', (args) => ({
  kind: 'agent',
  title: 'Apply safe fixes for evil fallbacks',
  labels: ['fix', 'refactor'],
  agent: {
    name: 'Fallback Fixer',
    prompt: {
      instructions: [
        `Apply safe fixes for evil fallback patterns in ${args.codebasePath}.`,
        '',
        `Findings to fix: ${JSON.stringify((args.classified ?? []).filter(f => f.severity === 'critical' || f.severity === 'high'))}`,
        '',
        'ONLY apply these safe transformations:',
        '',
        '1. **Add logging to empty catch blocks**: `catch { /* */ }` → `catch (e) { console.warn("...", e.message); }`',
        '2. **Add logging to fallback paths**: when a fallback is chosen, log which value was used and why',
        '3. **Replace || with ??** where 0, "", or false are valid values',
        '4. **Add explicit type to error returns**: distinguish "not found" from "detection failed"',
        '',
        'DO NOT:',
        '- Remove fallbacks entirely (they may be load-bearing)',
        '- Change error handling behavior (just add visibility)',
        '- Modify test assertions (separate concern)',
        '- Change config resolution order (just add logging)',
        '',
        'For each fix applied, record the before/after diff.',
        'Return { fixes: [...], artifacts: [...] }',
      ],
    },
  },
}));
