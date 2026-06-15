/**
 * @process software-architecture/here-be-dragons-audit
 * @description Scan a codebase for unmarked coupling, maintenance hazards, evil fallbacks, hidden caveats, tech debt, and places that need "here be dragons" warnings. Produce a prioritized map of dangerous zones and recommended annotations. Subsumes the evil-fallback-audit process.
 * @inputs { codebasePath: string, projectName: string, languages: array, depth: string, annotate: boolean }
 * @outputs { success: boolean, dragons: array, couplingMap: array, debtInventory: array, reportPath: string }
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:software-architecture]
 *   workflows: [workflow:code-quality, workflow:technical-debt-reduction, workflow:architecture-review]
 *   roles: [role:tech-lead, role:principal-engineer, role:staff-engineer]
 *   skillAreas: [skill-area:code-analysis-linting, skill-area:architecture-review]
 *   topics: [topic:technical-debt, topic:coupling, topic:maintainability, topic:code-quality, topic:documentation]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    codebasePath = '.',
    projectName = 'Project',
    languages = [],
    depth = 'standard',
    annotate = false,
    outputDir = 'here-be-dragons-audit',
  } = inputs;

  const artifacts = [];

  // ============================================================================
  // PHASE 1: SCAN — Four parallel scans for different hazard categories
  // ============================================================================

  const [couplingScan, hazardScan, debtScan, caveatScan, fallbackScan] = await ctx.parallel.all([
    () => ctx.task(scanUnmarkedCouplingTask, { codebasePath, projectName, languages, depth }),
    () => ctx.task(scanMaintenanceHazardsTask, { codebasePath, projectName, languages, depth }),
    () => ctx.task(scanTechDebtTask, { codebasePath, projectName, languages, depth }),
    () => ctx.task(scanMissingCaveatsTask, { codebasePath, projectName, languages, depth }),
    () => ctx.task(scanEvilFallbacksTask, { codebasePath, projectName, languages, depth }),
  ]);

  artifacts.push(
    ...(couplingScan.artifacts ?? []),
    ...(hazardScan.artifacts ?? []),
    ...(debtScan.artifacts ?? []),
    ...(caveatScan.artifacts ?? []),
    ...(fallbackScan.artifacts ?? []),
  );

  // ============================================================================
  // PHASE 2: CLASSIFY — Map danger zones and assess risk
  // ============================================================================

  const classification = await ctx.task(classifyDragonsTask, {
    couplingFindings: couplingScan.findings,
    hazardFindings: hazardScan.findings,
    debtFindings: debtScan.findings,
    caveatFindings: caveatScan.findings,
    fallbackFindings: fallbackScan.findings,
    depth,
  });

  artifacts.push(...(classification.artifacts ?? []));

  // ============================================================================
  // PHASE 3: REPORT — Generate the dragons map
  // ============================================================================

  const report = await ctx.task(generateDragonsMapTask, {
    projectName,
    classified: classification.classified,
    hotspots: classification.hotspots,
    outputDir,
  });

  artifacts.push(report.reportPath);

  // ============================================================================
  // PHASE 4 (optional): ANNOTATE — Add "here be dragons" comments
  // ============================================================================

  if (annotate) {
    const annotations = await ctx.task(addDragonAnnotationsTask, {
      codebasePath,
      classified: classification.classified,
      outputDir,
    });
    artifacts.push(...(annotations.artifacts ?? []));
  }

  return {
    success: true,
    dragons: classification.classified,
    couplingMap: classification.couplingMap,
    debtInventory: classification.debtInventory,
    hotspots: classification.hotspots,
    reportPath: report.reportPath,
    artifacts,
    summary: {
      total: classification.classified.length,
      critical: classification.classified.filter(f => f.severity === 'critical').length,
      high: classification.classified.filter(f => f.severity === 'high').length,
      medium: classification.classified.filter(f => f.severity === 'medium').length,
      low: classification.classified.filter(f => f.severity === 'low').length,
      hotspotCount: classification.hotspots.length,
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// TASK 1: Scan for unmarked coupling
// ──────────────────────────────────────────────────────────────────────────────

const scanUnmarkedCouplingTask = defineTask('scan-unmarked-coupling', (args) => ({
  kind: 'agent',
  title: 'Scan for unmarked coupling between modules',
  labels: ['scan', 'coupling', 'architecture'],
  agent: {
    name: 'Coupling Scanner',
    prompt: {
      instructions: [
        `Scan the codebase at ${args.codebasePath} for unmarked coupling — places where modules, packages, or layers depend on each other in ways that aren't obvious from the imports or API surface.`,
        '',
        'Find ALL instances of these patterns (skip test files, node_modules):',
        '',
        '**Structural coupling:**',
        '1. **Shared mutable state**: globals, singletons, module-level maps/caches shared across consumers without explicit ownership',
        '2. **Implicit ordering dependencies**: code that only works if another module was initialized first, or if functions are called in a specific sequence',
        '3. **Cross-package internal imports**: importing from another package\'s `src/` or `internal/` paths instead of its public API',
        '4. **Circular dependencies**: A imports B imports A (directly or transitively through a chain)',
        '5. **God modules**: files imported by >15 other files — single point of coupling failure',
        '',
        '**Behavioral coupling:**',
        '6. **Env var coupling**: module A writes process.env.X, module B reads it — coupled through ambient state',
        '7. **File system coupling**: modules that communicate through specific file paths without explicit contracts',
        '8. **Event/callback coupling without types**: event emitters where the event names and payload shapes are stringly-typed',
        '9. **Monkey-patching or prototype extension**: runtime modification of shared objects',
        '10. **Convention-based coupling**: code that assumes filenames, directory structure, or naming patterns without schema validation',
        '',
        '**Temporal coupling:**',
        '11. **Init-order dependencies**: module A must be loaded before module B for side effects',
        '12. **Race conditions in shared resources**: concurrent access to files, caches, or registries without synchronization',
        '13. **Implicit async ordering**: promise chains that depend on execution order not guaranteed by the language',
        '',
        `Depth: ${args.depth}. ${args.depth === 'deep' ? 'Trace transitive dependencies and build a full coupling graph.' : 'Focus on direct coupling patterns.'}`,
        '',
        'For each finding, record:',
        '- file: relative path (and the coupled counterpart)',
        '- line: line number',
        '- pattern: which category (1-13 above)',
        '- coupling: description of what is coupled to what',
        '- risk: what breaks if one side changes',
        '- unmarked: true if there is no comment, JSDoc, or architectural note about this coupling',
        '',
        'Return { findings: [...], artifacts: [] }',
      ],
    },
  },
}));

// ──────────────────────────────────────────────────────────────────────────────
// TASK 2: Scan for maintenance hazards
// ──────────────────────────────────────────────────────────────────────────────

const scanMaintenanceHazardsTask = defineTask('scan-maintenance-hazards', (args) => ({
  kind: 'agent',
  title: 'Scan for maintenance hazards and risky-to-change code',
  labels: ['scan', 'maintenance', 'risk'],
  agent: {
    name: 'Maintenance Hazard Scanner',
    prompt: {
      instructions: [
        `Scan the codebase at ${args.codebasePath} for code that is risky to maintain — places where a well-intentioned change is likely to break something non-obvious.`,
        '',
        'Find ALL instances of these patterns (skip test files, node_modules):',
        '',
        '**Fragile code:**',
        '1. **Magic numbers/strings**: hardcoded values that have meaning elsewhere but aren\'t constants (port numbers, timeout values, path fragments, version strings)',
        '2. **Copy-paste code with subtle differences**: near-duplicate blocks where each copy has slightly different behavior — changing one requires finding and updating all',
        '3. **Overly clever code**: dense one-liners, nested ternaries, bitwise tricks, regex without comments — code that takes >30 seconds to understand',
        '4. **Stringly-typed APIs**: functions that accept string parameters where an enum/union would prevent errors (event names, kind fields, status values)',
        '5. **Type assertions that lie**: `as any`, `as unknown as T`, `!` non-null assertions on values that could actually be null',
        '',
        '**Risky to change:**',
        '6. **Functions with >5 responsibilities**: functions longer than 80 lines that do multiple unrelated things — changing one responsibility risks the others',
        '7. **Deep nesting (>4 levels)**: if/for/try chains where the control flow is hard to trace',
        '8. **Implicit contracts**: function behavior that depends on caller context (e.g., "this only works if called from within withRunLock")',
        '9. **Untested critical paths**: business-critical code paths with no test coverage (check for corresponding .test files)',
        '10. **Platform-specific branches**: `if (process.platform === "win32")` blocks that are only tested on one platform',
        '',
        '**Evolution hazards:**',
        '11. **Sealed abstractions**: classes/interfaces where adding a new variant requires changes in >3 files (switch statements, type guards, handler maps)',
        '12. **Leaky abstractions**: internal implementation details exposed through return types, error messages, or side effects',
        '13. **Deprecated-but-load-bearing**: code marked deprecated or TODO-remove that is still actively used',
        '14. **Version-pinned workarounds**: code that works around a specific bug in a dependency version — may break on upgrade',
        '15. **Build-time coupling**: code that depends on specific build tool behavior (bundler resolution, tsc paths, esbuild externals)',
        '',
        `Depth: ${args.depth}.`,
        '',
        'For each finding, record:',
        '- file: relative path',
        '- line: line number or range',
        '- pattern: which category (1-15 above)',
        '- description: what makes this hazardous',
        '- blast_radius: what could break if someone changes this naively',
        '- has_warning: whether there is any existing comment/doc warning about the hazard',
        '',
        'Return { findings: [...], artifacts: [] }',
      ],
    },
  },
}));

// ──────────────────────────────────────────────────────────────────────────────
// TASK 3: Scan for tech debt
// ──────────────────────────────────────────────────────────────────────────────

const scanTechDebtTask = defineTask('scan-tech-debt', (args) => ({
  kind: 'agent',
  title: 'Scan for tech debt indicators',
  labels: ['scan', 'tech-debt'],
  agent: {
    name: 'Tech Debt Scanner',
    prompt: {
      instructions: [
        `Scan the codebase at ${args.codebasePath} for tech debt — shortcuts, workarounds, and deferred work that accumulates maintenance cost.`,
        '',
        'Find ALL instances of these patterns (skip node_modules):',
        '',
        '**Explicit markers:**',
        '1. **TODO/FIXME/HACK/XXX/WORKAROUND comments**: grep for these markers and assess if the TODO is still relevant',
        '2. **@ts-ignore / @ts-expect-error**: TypeScript safety bypasses — why was the type system wrong?',
        '3. **eslint-disable comments**: what rule was disabled and why?',
        '4. **`any` type usage**: explicit `any` annotations that bypass type checking',
        '5. **Commented-out code**: dead code left in place "just in case"',
        '',
        '**Structural debt:**',
        '6. **Re-export shims**: files that exist only to re-export from another location for backward compatibility',
        '7. **Feature flags never cleaned up**: flags that were temporary but became permanent',
        '8. **Dead code**: exported functions/types with zero importers (excluding public API surface)',
        '9. **Duplicate dependencies**: same capability provided by multiple packages (e.g., two HTTP clients, two schema validators)',
        '10. **Inconsistent patterns**: the same problem solved 3+ different ways across the codebase',
        '',
        '**Dependency debt:**',
        '11. **Pinned to old major versions**: dependencies that are 2+ major versions behind',
        '12. **Fork or patch dependencies**: local patches, resolutions overrides, or git: dependencies',
        '13. **Unnecessary dependencies**: packages imported for a single function that could be inlined',
        '14. **Missing peer dependency declarations**: runtime failures when consumer doesn\'t install the right version',
        '',
        '**Test debt:**',
        '15. **Skipped tests**: `.skip`, `xit`, `xdescribe`, `test.todo` — why were they skipped?',
        '16. **Snapshot tests as crutch**: snapshots used for complex objects where specific assertions would be better',
        '17. **No integration tests for critical flows**: unit tests exist but end-to-end paths are untested',
        '',
        `Depth: ${args.depth}.`,
        '',
        'For each finding, record:',
        '- file: relative path',
        '- line: line number',
        '- pattern: which category (1-17 above)',
        '- description: what the debt is',
        '- age: estimated age if determinable (from git blame or date in comment)',
        '- cost: estimated cost of keeping vs. fixing (low/medium/high)',
        '',
        'Return { findings: [...], artifacts: [] }',
      ],
    },
  },
}));

// ──────────────────────────────────────────────────────────────────────────────
// TASK 4: Scan for missing caveats and documentation gaps
// ──────────────────────────────────────────────────────────────────────────────

const scanMissingCaveatsTask = defineTask('scan-missing-caveats', (args) => ({
  kind: 'agent',
  title: 'Scan for missing caveats and undocumented gotchas',
  labels: ['scan', 'documentation', 'caveats'],
  agent: {
    name: 'Caveat Scanner',
    prompt: {
      instructions: [
        `Scan the codebase at ${args.codebasePath} for places that NEED a "here be dragons" warning but don't have one — non-obvious behaviors, surprising side effects, and gotchas that will bite the next person.`,
        '',
        'Find ALL instances of these patterns (skip node_modules):',
        '',
        '**Missing behavioral warnings:**',
        '1. **Side effects on import**: modules that do work (register globals, start timers, modify process.env) just by being imported',
        '2. **Non-idempotent functions**: functions that return different results on repeated calls or mutate shared state — without any JSDoc warning',
        '3. **Surprising nullability**: functions that can return null/undefined in non-obvious cases but the return type doesn\'t indicate it',
        '4. **Silent truncation**: data silently truncated at size limits (log messages, file content, API payloads) without indication',
        '5. **Timing-sensitive code**: code that depends on setTimeout, setImmediate, or process.nextTick ordering without documenting why',
        '',
        '**Missing architectural warnings:**',
        '6. **Singleton with hidden initialization**: singletons that must be initialized before use but don\'t fail-fast if not',
        '7. **Thread-unsafe patterns**: code that is not safe for concurrent access but doesn\'t document this (shared Maps, in-place array mutation)',
        '8. **Persistence assumptions**: code that assumes specific file layout, directory existence, or symlink behavior without checking',
        '9. **Network assumptions**: code that assumes localhost availability, specific ports, or DNS resolution without fallback docs',
        '10. **Platform assumptions**: code that only works on specific OS/Node versions without documenting the requirement',
        '',
        '**Missing migration/upgrade warnings:**',
        '11. **Breaking change potential**: public API functions where parameter order, return type, or behavior changed but callers weren\'t all updated',
        '12. **Schema evolution gaps**: data formats (JSON, JSONL, config files) that evolved but old formats aren\'t handled or documented',
        '13. **Environment variable changes**: env vars renamed, deprecated, or added without migration guide',
        '14. **CLI flag changes**: command-line arguments that changed meaning or were removed without deprecation warning',
        '',
        '**Missing "why" documentation:**',
        '15. **Workarounds without context**: code that works around a bug but doesn\'t link to the issue or explain the root cause',
        '16. **Non-obvious constraints**: arbitrary-looking limits (MAX_ITERATIONS=20, TIMEOUT=900000) without explaining why that specific value',
        '17. **Cross-module contracts**: implicit contracts between modules that aren\'t documented anywhere (e.g., "this file must be loaded after X")',
        '',
        `Depth: ${args.depth}.`,
        '',
        'For each finding, record:',
        '- file: relative path',
        '- line: line number',
        '- pattern: which category (1-17 above)',
        '- gotcha: what will surprise or bite the next person',
        '- suggested_warning: what comment or doc should be added',
        '- severity: how badly could someone be bitten (critical/high/medium/low)',
        '',
        'Return { findings: [...], artifacts: [] }',
      ],
    },
  },
}));

// ──────────────────────────────────────────────────────────────────────────────
// TASK 5: Scan for evil fallbacks (silent error handling, degraded behavior)
// ──────────────────────────────────────────────────────────────────────────────

const scanEvilFallbacksTask = defineTask('scan-evil-fallbacks', (args) => ({
  kind: 'agent',
  title: 'Scan for evil fallback mechanisms that hide real problems',
  labels: ['scan', 'error-handling', 'maintenance-hazard'],
  agent: {
    name: 'Evil Fallback Scanner',
    prompt: {
      instructions: [
        `Scan the codebase at ${args.codebasePath} for fallback mechanisms that silently hide real problems, introduce unexpected degraded behavior, or make debugging impossible.`,
        '',
        'Find ALL instances of these patterns (skip test files, node_modules):',
        '',
        '**Try-catch fallbacks (error swallowing):**',
        '1. **Empty catch blocks**: `catch { }`, `catch { /* */ }`, `catch { /* best effort */ }`',
        '2. **Catch-and-return-default**: `catch { return []; }`, `catch { return null; }`, `catch { return false; }`',
        '3. **Catch-and-continue**: `catch { continue; }` in loops — silently skips corrupted items',
        '4. **ESM→CJS fallback chains**: try import(), catch, try require() — original error lost',
        '5. **Retry loops that swallow**: retry N times, only throw on last attempt, no logging of intermediates',
        '6. **Promise .catch(() => undefined)**: swallows async errors in chains',
        '7. **void operator on promises**: `void asyncFn()` suppresses rejections entirely',
        '8. **Catch-and-convert**: typed errors converted to generic string messages, losing stack/category',
        '9. **Nested try-catch**: outer catch swallows inner errors without aggregation',
        '10. **Finally blocks with try-catch**: cleanup errors silently ignored',
        '',
        '**Logical fallbacks (silent substitution):**',
        '11. **Env var cascades**: `process.env.A || process.env.B || process.env.C` — no audit of which value won',
        '12. **Model/provider resolution chains**: multi-level ?? chains picking from 5+ sources silently',
        '13. **Hardcoded defaults masking missing config**: `?? "gpt-4o"`, `|| "localhost"`, `?? "node:22"`',
        '14. **Silent mode switching**: `if (available) { useA() } else { useB() }` without logging',
        '15. **|| used where ?? should be**: treats 0, "", false as missing when they are valid values',
        '16. **File precedence hierarchies**: project config silently overrides global config',
        '17. **Platform-specific behavior**: `if (windows) { skip() }` with no indication',
        '',
        '**Test/CI fallbacks (assertion weakening):**',
        '18. **Non-zero exit code tolerance**: tests pass when commands exit non-zero',
        '19. **Assertion softening**: status marked "pending" then retroactively upgraded to "passed"',
        '20. **Silent test matrix defaults**: unknown agent/model/mode substituted with defaults',
        '21. **`2>/dev/null || true`**: stderr suppressed AND failure ignored in CI scripts',
        '22. **continue-on-error: true**: workflow steps that can fail without failing the job',
        '',
        `Depth: ${args.depth}.`,
        '',
        'For each finding, record:',
        '- file: relative path',
        '- line: line number',
        '- pattern: which category (1-22 above)',
        '- code: the relevant code snippet (3-5 lines)',
        '- hides: what error/behavior is hidden',
        '- impact: what goes wrong when the real error occurs',
        '- severity: critical/high/medium/low',
        '',
        'Return { findings: [...], artifacts: [] }',
      ],
    },
  },
}));

// ──────────────────────────────────────────────────────────────────────────────
// TASK 6: Classify and build the dragons map (from all 5 scans)
// ──────────────────────────────────────────────────────────────────────────────

const classifyDragonsTask = defineTask('classify-dragons', (args) => ({
  kind: 'agent',
  title: 'Classify findings and identify hotspots',
  labels: ['analysis', 'prioritization'],
  agent: {
    name: 'Dragons Classifier',
    prompt: {
      instructions: [
        'Classify all findings from the five scan phases and identify hotspot files/modules.',
        '',
        'Input findings:',
        `- Coupling: ${JSON.stringify(args.couplingFindings ?? [])}`,
        `- Maintenance hazards: ${JSON.stringify(args.hazardFindings ?? [])}`,
        `- Tech debt: ${JSON.stringify(args.debtFindings ?? [])}`,
        `- Missing caveats: ${JSON.stringify(args.caveatFindings ?? [])}`,
        `- Evil fallbacks: ${JSON.stringify(args.fallbackFindings ?? [])}`,
        '',
        '**Severity assignment:**',
        '- **critical**: Will cause data loss, security breach, or production outage if changed naively',
        '- **high**: Will cause subtle bugs that pass tests but fail in production',
        '- **medium**: Will cause confusion, wasted debugging time, or incorrect behavior in edge cases',
        '- **low**: Code smell or documentation gap with limited blast radius',
        '',
        '**Category assignment:**',
        '- coupling: unmarked dependency between modules',
        '- fragile: code that breaks easily when touched',
        '- debt: shortcut or workaround that accumulates cost',
        '- caveat: undocumented gotcha or surprising behavior',
        '- hazard: maintenance minefield without warning signs',
        '- evil-fallback: silent error swallowing, degraded behavior, or hidden substitution',
        '',
        '**Hotspot identification:**',
        'A hotspot is a file or module that appears in 3+ findings across different categories.',
        'These are the most dangerous places in the codebase — where coupling, debt, and missing docs intersect.',
        'Rank hotspots by total finding count × average severity.',
        '',
        '**Coupling map:**',
        'Build a simplified coupling map from the coupling findings: { source, target, type, strength }.',
        '',
        '**Debt inventory:**',
        'Build a debt inventory from the tech debt findings with estimated remediation effort.',
        '',
        'Return {',
        '  classified: [...findings with severity + category],',
        '  hotspots: [{ file, findingCount, categories, severity, description }],',
        '  couplingMap: [{ source, target, type, strength }],',
        '  debtInventory: [{ file, debt, effort, priority }],',
        '  artifacts: []',
        '}',
      ],
    },
  },
}));

// ──────────────────────────────────────────────────────────────────────────────
// TASK 7: Generate the dragons map report
// ──────────────────────────────────────────────────────────────────────────────

const generateDragonsMapTask = defineTask('generate-dragons-map', (args) => ({
  kind: 'agent',
  title: 'Generate "here be dragons" report',
  labels: ['report', 'documentation'],
  agent: {
    name: 'Dragons Map Generator',
    prompt: {
      instructions: [
        `Generate the "Here Be Dragons" map for ${args.projectName}.`,
        '',
        `Classified findings: ${JSON.stringify(args.classified ?? [])}`,
        `Hotspots: ${JSON.stringify(args.hotspots ?? [])}`,
        '',
        'The report should follow this structure:',
        '',
        '# Here Be Dragons — {projectName}',
        '',
        '## Hotspot Map',
        'Files/modules that concentrate the most danger. Table format:',
        '| File | Findings | Categories | Top Risk |',
        '',
        '## Critical Dragons',
        'Each entry: file:line, what the dragon is, what it bites, blast radius.',
        '',
        '## Coupling Map',
        'Unmarked dependencies between modules. Show as source → target pairs grouped by type.',
        '',
        '## Maintenance Minefields',
        'Code that is risky to change, ordered by blast radius.',
        '',
        '## Evil Fallbacks',
        'Silent error handling, degraded behavior paths, and config cascades that hide real problems.',
        'Group by: error-swallowing, silent-degradation, config-cascade, test-weakening.',
        '',
        '## Tech Debt Inventory',
        '| File | Debt | Effort | Priority |',
        '',
        '## Missing Caveats',
        'Places that need "here be dragons" warnings but lack them.',
        '',
        '## Recommended Annotations',
        'Suggested comments to add, grouped by file. Format:',
        '```',
        '// file.ts:42',
        '// HERE BE DRAGONS: [brief explanation of the hazard]',
        '```',
        '',
        `Write the report to ${args.outputDir}/here-be-dragons.md`,
        'Return { reportPath: "path/to/report" }',
      ],
    },
  },
}));

// ──────────────────────────────────────────────────────────────────────────────
// TASK 8 (optional): Add "here be dragons" annotations
// ──────────────────────────────────────────────────────────────────────────────

const addDragonAnnotationsTask = defineTask('add-dragon-annotations', (args) => ({
  kind: 'agent',
  title: 'Add "here be dragons" annotations to code',
  labels: ['fix', 'documentation'],
  agent: {
    name: 'Dragon Annotator',
    prompt: {
      instructions: [
        `Add "here be dragons" warning comments to hazardous code in ${args.codebasePath}.`,
        '',
        `Findings to annotate: ${JSON.stringify((args.classified ?? []).filter(f => f.severity === 'critical' || f.severity === 'high'))}`,
        '',
        'For each critical/high finding, add a comment ABOVE the hazardous line:',
        '',
        '```typescript',
        '// HERE BE DRAGONS: [one-line description of the hazard]',
        '// [what breaks if you change this, and why it\'s this way]',
        '```',
        '',
        'Rules:',
        '- Use exactly `// HERE BE DRAGONS:` as the prefix — it\'s grep-able',
        '- Keep to 1-2 lines maximum',
        '- Explain the WHY, not the WHAT',
        '- Include the blast radius ("changes here affect X, Y, Z")',
        '- For coupling: name both sides ("coupled to session.ts:resolveEndpoint via process.env.ADAPTER_PROVIDER")',
        '- For timing: explain the ordering constraint ("must run after X initializes the registry")',
        '',
        'DO NOT:',
        '- Add annotations to test files',
        '- Add annotations to obvious code (well-named functions, clear error handling)',
        '- Modify any logic — only add comments',
        '- Add more than one annotation per finding',
        '',
        'Return { annotations: [{ file, line, comment }], artifacts: [] }',
      ],
    },
  },
}));
