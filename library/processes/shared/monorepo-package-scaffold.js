/**
 * @module monorepo-package-scaffold
 * @description Composable monorepo package scaffolding component that creates a new package
 * in an existing monorepo with proper configuration files, directory structure, and workspace
 * registration. Parameterized by package type, name, and an optional reference package to
 * clone conventions from.
 *
 * The module exposes three surfaces:
 * - `createPackageScaffold(config)` — factory that builds task definitions for analyzing
 *   the monorepo, generating package files, and updating workspace configuration.
 * - `executePackageScaffold(ctx, config)` — convenience wrapper that runs the full scaffold
 *   pipeline and returns a structured result.
 * - Preset factories for common package types:
 *   - `createLibraryPackage(config)` — TypeScript library with CJS/ESM output
 *   - `createCliPackage(config)` — CLI tool with bin entry
 *   - `createNextAppPackage(config)` — Next.js application
 *   - `createPluginPackage(config)` — Babysitter harness plugin
 *
 * @example
 * ```js
 * import {
 *   createPackageScaffold,
 *   executePackageScaffold,
 *   createLibraryPackage,
 * } from './monorepo-package-scaffold.js';
 *
 * // Full pipeline:
 * const result = await executePackageScaffold(ctx, {
 *   name: 'my-new-package',
 *   scope: '@a5c-ai',
 *   packageDir: 'packages/my-new-package',
 *   packageType: 'library',
 *   referencePackage: 'packages/sdk',
 *   monorepoRoot: '.',
 * });
 *
 * // Preset usage:
 * const config = createLibraryPackage({
 *   name: 'utils',
 *   scope: '@a5c-ai',
 *   monorepoRoot: '.',
 * });
 * const result = await executePackageScaffold(ctx, config);
 * ```
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 120000;

// ─────────────────────────────────────────────────────────────────────────────
// createPackageScaffold (factory)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} PackageScaffoldConfig
 * @property {string}  name                  - Package name (without scope), e.g. 'my-utils'.
 * @property {string}  [scope]               - npm scope, e.g. '@a5c-ai'.
 * @property {string}  [packageDir]          - Directory for the new package (default: `packages/<name>`).
 * @property {string}  packageType           - One of: 'library', 'cli', 'app', 'plugin', or a custom string.
 * @property {string}  [referencePackage]    - Path to an existing package to clone conventions from.
 * @property {string}  [monorepoRoot='.']    - Root of the monorepo.
 * @property {string}  [description]         - Package description for package.json.
 * @property {string}  [author]              - Package author.
 * @property {string}  [license='MIT']       - Package license.
 * @property {string}  [moduleSystem='cjs']  - Module system: 'cjs', 'esm', or 'dual'.
 * @property {boolean} [typescript=true]     - Whether to include TypeScript configuration.
 * @property {string[]} [dependencies=[]]    - Initial dependencies.
 * @property {string[]} [devDependencies=[]] - Initial dev dependencies.
 * @property {number}  [timeout=120000]      - Timeout in milliseconds.
 */

/**
 * Factory that creates babysitter task definitions for scaffolding a new
 * monorepo package:
 *
 * - **analyzeTask** (kind: 'agent') — analyzes the monorepo structure, reference
 *   package conventions, and workspace manager to determine the right configuration.
 * - **scaffoldTask** (kind: 'agent') — generates all package files (package.json,
 *   tsconfig.json, directory structure, entry points, test setup).
 * - **registerTask** (kind: 'agent') — updates root workspace configuration
 *   (package.json workspaces, tsconfig references, etc.).
 * - **verifyTask** (kind: 'shell') — runs a basic build/lint check to verify the
 *   scaffolded package is valid.
 *
 * @param {PackageScaffoldConfig} config - Scaffold configuration.
 * @returns {{ analyzeTask: Function, scaffoldTask: Function, registerTask: Function, verifyTask: Function }}
 *
 * @example
 * ```js
 * const tasks = createPackageScaffold({
 *   name: 'my-lib',
 *   scope: '@a5c-ai',
 *   packageType: 'library',
 *   referencePackage: 'packages/sdk',
 *   monorepoRoot: '.',
 * });
 *
 * const analysis = await ctx.task(tasks.analyzeTask, {});
 * const scaffold = await ctx.task(tasks.scaffoldTask, { analysis });
 * const register = await ctx.task(tasks.registerTask, { analysis, scaffold });
 * const verify   = await ctx.task(tasks.verifyTask, {});
 * ```
 */
export function createPackageScaffold(config) {
  const {
    name,
    scope,
    packageDir,
    packageType,
    referencePackage,
    monorepoRoot = '.',
    description,
    author,
    license = 'MIT',
    moduleSystem = 'cjs',
    typescript = true,
    dependencies = [],
    devDependencies = [],
    timeout = DEFAULT_TIMEOUT_MS,
  } = config;

  const label = name || 'new-package';
  const fullName = scope ? `${scope}/${name}` : name;
  const targetDir = packageDir || `packages/${name}`;

  // ── analyzeTask ─────────────────────────────────────────────────────────

  const analyzeTask = defineTask(
    `package-scaffold/${label}/analyze`,
    (_args, taskCtx) => ({
      kind: 'agent',
      title: `[${label}] Analyze monorepo conventions`,
      agent: {
        name: 'monorepo-analyzer',
        prompt: {
          role: 'Senior software engineer specializing in monorepo architecture, TypeScript project configuration, and npm workspace management',
          task: 'Analyze the monorepo structure and reference package to determine conventions for scaffolding a new package.',
          context: {
            monorepoRoot,
            packageName: fullName,
            packageType,
            targetDir,
            referencePackage: referencePackage ?? null,
            moduleSystem,
            typescript,
          },
          instructions: [
            `Read the root package.json to identify the workspace manager (npm workspaces, pnpm, yarn).`,
            `Identify the workspace glob patterns (e.g., "packages/*").`,
            referencePackage
              ? `Read ${referencePackage}/package.json and ${referencePackage}/tsconfig.json to extract conventions: module system, build scripts, test framework, lint config, directory structure.`
              : 'No reference package specified — use standard TypeScript library conventions.',
            'Determine the appropriate tsconfig extends path relative to the new package.',
            'Check if the monorepo uses project references (tsconfig references array).',
            'Identify any shared ESLint, Prettier, or other tool configurations.',
            'Output a structured analysis that the scaffold task can consume directly.',
          ],
          outputFormat: [
            'JSON with:',
            '  workspaceManager (string — npm/pnpm/yarn),',
            '  workspaceGlobs (string[]),',
            '  tsconfigExtends (string|null — relative path to base tsconfig),',
            '  usesProjectReferences (boolean),',
            '  buildScript (string|null),',
            '  testFramework (string|null — vitest/jest/mocha/none),',
            '  testScript (string|null),',
            '  lintScript (string|null),',
            '  entryPoint (string — e.g., src/index.ts),',
            '  outDir (string — e.g., dist),',
            '  conventions (object — any other extracted conventions)',
          ].join('\n'),
        },
        outputSchema: {
          type: 'object',
          required: ['workspaceManager', 'workspaceGlobs', 'tsconfigExtends', 'usesProjectReferences', 'entryPoint', 'outDir'],
          properties: {
            workspaceManager: { type: 'string' },
            workspaceGlobs: { type: 'array', items: { type: 'string' } },
            tsconfigExtends: { oneOf: [{ type: 'string' }, { type: 'null' }] },
            usesProjectReferences: { type: 'boolean' },
            buildScript: { oneOf: [{ type: 'string' }, { type: 'null' }] },
            testFramework: { oneOf: [{ type: 'string' }, { type: 'null' }] },
            testScript: { oneOf: [{ type: 'string' }, { type: 'null' }] },
            lintScript: { oneOf: [{ type: 'string' }, { type: 'null' }] },
            entryPoint: { type: 'string' },
            outDir: { type: 'string' },
            conventions: { type: 'object' },
          },
        },
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
      },
      labels: ['package-scaffold', 'analyze', label],
    })
  );

  // ── scaffoldTask ────────────────────────────────────────────────────────

  const scaffoldTask = defineTask(
    `package-scaffold/${label}/scaffold`,
    (args, taskCtx) => ({
      kind: 'agent',
      title: `[${label}] Generate package files`,
      agent: {
        name: 'package-scaffolder',
        prompt: {
          role: 'Senior software engineer who creates well-structured TypeScript packages in monorepo environments',
          task: `Create all files for a new ${packageType} package named "${fullName}" at ${targetDir}.`,
          context: {
            monorepoRoot,
            packageName: fullName,
            shortName: name,
            packageType,
            targetDir,
            description: description ?? `${fullName} — ${packageType} package`,
            author: author ?? null,
            license,
            moduleSystem,
            typescript,
            dependencies,
            devDependencies,
            analysis: args.analysis ?? null,
          },
          instructions: [
            `Create directory structure at ${targetDir}/ with:`,
            `  - package.json with name "${fullName}", correct module system config, scripts from analysis`,
            typescript ? '  - tsconfig.json extending the monorepo base config (from analysis)' : '',
            `  - src/ directory with entry point (e.g., src/index.ts)`,
            typescript ? '  - src/__tests__/ directory with a placeholder test file' : '',
            `  - README.md with package name, description, and basic usage`,
            'Match the conventions discovered in the analysis step (build scripts, test framework, lint config).',
            'Do NOT create node_modules, dist, or other generated directories.',
            packageType === 'cli' ? 'Include a bin/ directory with a CLI entry point and add "bin" field to package.json.' : '',
            packageType === 'plugin' ? 'Include plugin.json manifest and hooks.json stub.' : '',
            'List all created files in the output.',
          ].filter(Boolean),
          outputFormat: [
            'JSON with:',
            '  filesCreated (string[] — relative paths of all created files),',
            '  packageJson (object — the generated package.json content),',
            '  summary (string)',
          ].join('\n'),
        },
        outputSchema: {
          type: 'object',
          required: ['filesCreated', 'packageJson', 'summary'],
          properties: {
            filesCreated: { type: 'array', items: { type: 'string' } },
            packageJson: { type: 'object' },
            summary: { type: 'string' },
          },
        },
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
      },
      labels: ['package-scaffold', 'scaffold', label],
    })
  );

  // ── registerTask ────────────────────────────────────────────────────────

  const registerTask = defineTask(
    `package-scaffold/${label}/register`,
    (args, taskCtx) => ({
      kind: 'agent',
      title: `[${label}] Register in workspace`,
      agent: {
        name: 'workspace-registrar',
        prompt: {
          role: 'Monorepo workspace configuration specialist',
          task: `Register the new package "${fullName}" in the monorepo workspace configuration.`,
          context: {
            monorepoRoot,
            packageName: fullName,
            targetDir,
            analysis: args.analysis ?? null,
            scaffold: args.scaffold ?? null,
          },
          instructions: [
            'Check if the package directory matches an existing workspace glob pattern.',
            'If the target directory is NOT covered by existing workspace globs, add it to the root package.json workspaces array.',
            'If the monorepo uses TypeScript project references, add a reference entry to the root tsconfig.json.',
            'Do NOT run npm install or any package manager commands — just update configuration files.',
            'Report what was changed and what was already covered.',
          ],
          outputFormat: [
            'JSON with:',
            '  alreadyCovered (boolean — true if existing globs already match),',
            '  filesModified (string[] — paths of modified config files),',
            '  changes (array of { file, description }),',
            '  summary (string)',
          ].join('\n'),
        },
        outputSchema: {
          type: 'object',
          required: ['alreadyCovered', 'filesModified', 'changes', 'summary'],
          properties: {
            alreadyCovered: { type: 'boolean' },
            filesModified: { type: 'array', items: { type: 'string' } },
            changes: {
              type: 'array',
              items: {
                type: 'object',
                required: ['file', 'description'],
                properties: {
                  file: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
            summary: { type: 'string' },
          },
        },
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
      },
      labels: ['package-scaffold', 'register', label],
    })
  );

  // ── verifyTask ──────────────────────────────────────────────────────────

  const verifyScript = [
    'set -e',
    `cd ${JSON.stringify(targetDir)}`,
    'echo "--- Checking package.json ---"',
    'node -e "JSON.parse(require(\'fs\').readFileSync(\'package.json\',\'utf8\'))" 2>&1',
    typescript ? 'echo "--- Checking tsconfig.json ---"' : '',
    typescript ? 'node -e "JSON.parse(require(\'fs\').readFileSync(\'tsconfig.json\',\'utf8\'))" 2>&1' : '',
    'echo "--- Checking entry point ---"',
    'test -f src/index.ts || test -f src/index.js',
    'echo "{\\"valid\\":true}"',
  ].filter(Boolean).join('\n');

  const verifyTask = defineTask(
    `package-scaffold/${label}/verify`,
    (_args, taskCtx) => {
      const command = monorepoRoot !== '.'
        ? `cd ${JSON.stringify(monorepoRoot)} && bash -c '${verifyScript.replace(/'/g, "'\\''")}'`
        : `bash -c '${verifyScript.replace(/'/g, "'\\''")}'`;

      return {
        kind: 'shell',
        title: `[${label}] Verify scaffolded package`,
        shell: {
          command,
          expectedExitCode: 0,
          timeout,
          outputPath: `tasks/${taskCtx.effectId}/output.json`,
        },
        io: {
          inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
          outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
        },
        labels: ['package-scaffold', 'verify', label],
      };
    }
  );

  return { analyzeTask, scaffoldTask, registerTask, verifyTask };
}

// ─────────────────────────────────────────────────────────────────────────────
// executePackageScaffold (convenience)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} PackageScaffoldResult
 * @property {boolean} passed          - True when all steps succeeded.
 * @property {object}  analysis        - Monorepo analysis results.
 * @property {object}  scaffold        - File generation results.
 * @property {object}  registration    - Workspace registration results.
 * @property {object}  verification    - Shell verification results.
 * @property {string}  summary         - Human-readable summary.
 */

/**
 * Convenience function that runs the full package scaffold pipeline:
 *   1. Analyze monorepo conventions and reference package
 *   2. Generate all package files
 *   3. Register in workspace configuration
 *   4. Verify the scaffolded package
 *
 * @param {object}               ctx    - Babysitter process context.
 * @param {PackageScaffoldConfig} config - Scaffold configuration.
 * @returns {Promise<PackageScaffoldResult>}
 *
 * @example
 * ```js
 * const result = await executePackageScaffold(ctx, {
 *   name: 'my-lib',
 *   scope: '@a5c-ai',
 *   packageType: 'library',
 *   referencePackage: 'packages/sdk',
 *   monorepoRoot: '.',
 * });
 *
 * if (result.passed) {
 *   console.log(`Package created: ${result.scaffold.filesCreated.length} files`);
 * }
 * ```
 */
export async function executePackageScaffold(ctx, config) {
  const { analyzeTask, scaffoldTask, registerTask, verifyTask } =
    createPackageScaffold(config);

  // Step 1: Analyze
  const analysis = await ctx.task(analyzeTask, {});

  // Step 2: Scaffold
  const scaffold = await ctx.task(scaffoldTask, { analysis });

  // Step 3: Register
  const registration = await ctx.task(registerTask, { analysis, scaffold });

  // Step 4: Verify
  let verification = null;
  let verifyPassed = false;
  try {
    verification = await ctx.task(verifyTask, {});
    verifyPassed = true;
  } catch (err) {
    if (err?.name === 'EffectRequestedError' || err?.name === 'EffectPendingError') throw err;
    verification = { exitCode: err?.exitCode ?? 1, stdout: err?.stdout ?? '', stderr: err?.stderr ?? err?.message ?? '' };
  }

  const fullName = config.scope ? `${config.scope}/${config.name}` : config.name;
  const summary = verifyPassed
    ? `Package "${fullName}" scaffolded successfully at ${config.packageDir || 'packages/' + config.name}. ${scaffold?.filesCreated?.length ?? 0} files created.`
    : `Package "${fullName}" scaffolded but verification failed. Check generated files.`;

  return {
    passed: verifyPassed,
    analysis,
    scaffold,
    registration,
    verification,
    summary,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Preset factories
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} PresetPackageConfig
 * @property {string}  name                  - Package name (without scope).
 * @property {string}  [scope]               - npm scope.
 * @property {string}  [monorepoRoot='.']    - Monorepo root directory.
 * @property {string}  [referencePackage]    - Reference package to clone conventions from.
 * @property {string}  [description]         - Package description.
 * @property {string}  [author]              - Package author.
 * @property {string[]} [dependencies=[]]    - Initial dependencies.
 * @property {string[]} [devDependencies=[]] - Initial dev dependencies.
 */

/**
 * Creates a scaffold configuration for a TypeScript library package
 * with CJS output, declarations, and standard test setup.
 *
 * @param {PresetPackageConfig} config
 * @returns {PackageScaffoldConfig}
 *
 * @example
 * ```js
 * const config = createLibraryPackage({
 *   name: 'utils',
 *   scope: '@a5c-ai',
 *   referencePackage: 'packages/sdk',
 * });
 * const result = await executePackageScaffold(ctx, config);
 * ```
 */
export function createLibraryPackage(config) {
  return {
    ...config,
    packageDir: config.packageDir || `packages/${config.name}`,
    packageType: 'library',
    moduleSystem: 'cjs',
    typescript: true,
    monorepoRoot: config.monorepoRoot || '.',
    license: config.license || 'MIT',
  };
}

/**
 * Creates a scaffold configuration for a CLI tool package with a bin
 * entry point and executable setup.
 *
 * @param {PresetPackageConfig} config
 * @returns {PackageScaffoldConfig}
 *
 * @example
 * ```js
 * const config = createCliPackage({
 *   name: 'my-tool',
 *   scope: '@a5c-ai',
 *   description: 'A CLI tool for doing things',
 * });
 * const result = await executePackageScaffold(ctx, config);
 * ```
 */
export function createCliPackage(config) {
  return {
    ...config,
    packageDir: config.packageDir || `packages/${config.name}`,
    packageType: 'cli',
    moduleSystem: 'cjs',
    typescript: true,
    monorepoRoot: config.monorepoRoot || '.',
    license: config.license || 'MIT',
  };
}

/**
 * Creates a scaffold configuration for a Next.js application package.
 *
 * @param {PresetPackageConfig} config
 * @returns {PackageScaffoldConfig}
 *
 * @example
 * ```js
 * const config = createNextAppPackage({
 *   name: 'dashboard',
 *   scope: '@a5c-ai',
 *   description: 'Admin dashboard',
 * });
 * const result = await executePackageScaffold(ctx, config);
 * ```
 */
export function createNextAppPackage(config) {
  return {
    ...config,
    packageDir: config.packageDir || `packages/${config.name}`,
    packageType: 'app',
    moduleSystem: 'esm',
    typescript: true,
    monorepoRoot: config.monorepoRoot || '.',
    license: config.license || 'MIT',
    dependencies: [...(config.dependencies || []), 'next', 'react', 'react-dom'],
    devDependencies: [...(config.devDependencies || []), '@types/react', '@types/react-dom'],
  };
}

/**
 * Creates a scaffold configuration for a Babysitter harness plugin
 * package with plugin.json manifest, hooks, skills, and commands.
 *
 * @param {PresetPackageConfig} config
 * @returns {PackageScaffoldConfig}
 *
 * @example
 * ```js
 * const config = createPluginPackage({
 *   name: 'babysitter-newharn',
 *   description: 'Babysitter plugin for NewHarn',
 * });
 * const result = await executePackageScaffold(ctx, config);
 * ```
 */
export function createPluginPackage(config) {
  return {
    ...config,
    packageDir: config.packageDir || `plugins/${config.name}`,
    packageType: 'plugin',
    moduleSystem: 'cjs',
    typescript: false,
    monorepoRoot: config.monorepoRoot || '.',
    license: config.license || 'MIT',
    dependencies: [...(config.dependencies || []), '@a5c-ai/babysitter-sdk'],
  };
}
