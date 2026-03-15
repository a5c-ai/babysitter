/**
 * @process pilot-shell/sync
 * @description Codebase sync: explore -> index -> conventions -> update rules
 * @inputs { projectPath?: string, forceReindex?: boolean }
 * @outputs { success: boolean, language: string, conventions: object, searchIndex: object, rules: object }
 *
 * Attribution: Adapted from Pilot Shell by Max Ritter (https://github.com/maxritter/pilot-shell)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Pilot Shell Sync Process (/sync command equivalent)
 *
 * Explores the codebase, builds a search index, discovers conventions, and updates rules:
 * 1. EXPLORE: Scan project structure, identify language/framework/tools
 * 2. INDEX: Build semantic search index of key files, patterns, and APIs
 * 3. CONVENTIONS: Discover coding standards, linting rules, test patterns
 * 4. RULES: Generate/update project-specific rules based on discoveries
 *
 * Agents referenced from agents/ directory:
 *   - context-monitor: Codebase exploration and indexing
 *   - file-checker: Convention and tool detection
 *   - memory-curator: Store discoveries in persistent memory
 *
 * Skills referenced from skills/ directory:
 *   - codebase-sync: Convention discovery and rule generation
 *   - persistent-memory: Store sync results for future sessions
 *   - context-preservation: Maintain sync state across compactions
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectPath - Path to project root (default: cwd)
 * @param {boolean} inputs.forceReindex - Force full reindex even if cache exists
 * @param {Object} ctx - Process context
 */
export async function process(inputs, ctx) {
  const {
    projectPath = '.',
    forceReindex = false
  } = inputs;

  // ============================================================================
  // PHASE 1: EXPLORE - Scan project structure
  // ============================================================================

  const explorationResult = await ctx.task(projectExplorationTask, {
    projectPath,
    forceReindex
  });

  // ============================================================================
  // PHASE 2: INDEX - Build semantic search index (parallel across domains)
  // ============================================================================

  const [
    codeIndex,
    testIndex,
    configIndex,
    apiIndex
  ] = await ctx.parallel.all([
    () => ctx.task(codeIndexTask, { projectPath, exploration: explorationResult }),
    () => ctx.task(testIndexTask, { projectPath, exploration: explorationResult }),
    () => ctx.task(configIndexTask, { projectPath, exploration: explorationResult }),
    () => ctx.task(apiIndexTask, { projectPath, exploration: explorationResult })
  ]);

  const searchIndex = {
    code: codeIndex,
    tests: testIndex,
    config: configIndex,
    api: apiIndex
  };

  // ============================================================================
  // PHASE 3: CONVENTIONS - Discover coding standards and patterns
  // ============================================================================

  const conventionsResult = await ctx.task(conventionDiscoveryTask, {
    projectPath,
    exploration: explorationResult,
    searchIndex
  });

  // ============================================================================
  // PHASE 4: RULES - Generate/update project rules
  // ============================================================================

  const rulesResult = await ctx.task(ruleGenerationTask, {
    conventions: conventionsResult,
    exploration: explorationResult,
    projectPath
  });

  // Store sync results in persistent memory
  const memoryResult = await ctx.task(syncMemoryStoreTask, {
    exploration: explorationResult,
    conventions: conventionsResult,
    rules: rulesResult,
    projectPath
  });

  return {
    success: true,
    language: explorationResult.language,
    framework: explorationResult.framework,
    conventions: conventionsResult,
    searchIndex,
    rules: rulesResult,
    memory: memoryResult,
    artifacts: {
      conventions: 'artifacts/CONVENTIONS.md',
      searchIndex: 'artifacts/SEARCH-INDEX.json',
      rules: 'artifacts/RULES.md'
    },
    metadata: {
      processId: 'pilot-shell/sync',
      timestamp: ctx.now(),
      attribution: 'Adapted from Pilot Shell by Max Ritter (https://github.com/maxritter/pilot-shell)'
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const projectExplorationTask = defineTask('project-exploration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Explore project structure',
  agent: {
    name: 'context-monitor',
    prompt: {
      role: 'codebase exploration specialist',
      task: 'Scan the project structure and identify language, framework, tools, and architecture',
      context: args,
      instructions: [
        'Scan directory structure and identify project type',
        'Detect primary language and framework',
        'Identify package manager and dependency files',
        'Find CI/CD configuration',
        'Locate test directories and test framework',
        'Identify build tools and scripts',
        'Map the high-level architecture (monorepo, microservices, etc.)',
        'Count files by type for index planning'
      ],
      outputFormat: 'JSON with language, framework, packageManager, testFramework, buildTools (array), ciConfig (string), architecture (string), fileStats (object), entryPoints (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['language', 'framework', 'packageManager'],
      properties: {
        language: { type: 'string' },
        framework: { type: 'string' },
        packageManager: { type: 'string' },
        testFramework: { type: 'string' },
        buildTools: { type: 'array', items: { type: 'string' } },
        ciConfig: { type: 'string' },
        architecture: { type: 'string' },
        fileStats: { type: 'object' },
        entryPoints: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'sync', 'exploration']
}));

export const codeIndexTask = defineTask('code-index', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Index source code files',
  agent: {
    name: 'context-monitor',
    prompt: {
      role: 'code indexing specialist',
      task: 'Build a semantic search index of source code files',
      context: args,
      instructions: [
        'Index all source files with their exports and key functions',
        'Map module dependencies and import graphs',
        'Identify key abstractions and design patterns',
        'Record file purposes and responsibilities',
        'Create searchable entries with tags'
      ],
      outputFormat: 'JSON with files (array of {path, exports, purpose, tags, dependencies}), patterns (array), abstractions (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['files'],
      properties: {
        files: { type: 'array', items: { type: 'object' } },
        patterns: { type: 'array', items: { type: 'object' } },
        abstractions: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'sync', 'index', 'code']
}));

export const testIndexTask = defineTask('test-index', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Index test files and patterns',
  agent: {
    name: 'context-monitor',
    prompt: {
      role: 'test indexing specialist',
      task: 'Build a search index of test files, fixtures, and test patterns',
      context: args,
      instructions: [
        'Index all test files with their test cases',
        'Identify test frameworks and assertion libraries',
        'Map test-to-source file relationships',
        'Catalog test fixtures, mocks, and helpers',
        'Record common test patterns'
      ],
      outputFormat: 'JSON with testFiles (array of {path, testCases, sourcefile, framework}), fixtures (array), patterns (array), coverage (object)'
    },
    outputSchema: {
      type: 'object',
      required: ['testFiles'],
      properties: {
        testFiles: { type: 'array', items: { type: 'object' } },
        fixtures: { type: 'array', items: { type: 'object' } },
        patterns: { type: 'array', items: { type: 'object' } },
        coverage: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'sync', 'index', 'tests']
}));

export const configIndexTask = defineTask('config-index', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Index configuration files',
  agent: {
    name: 'file-checker',
    prompt: {
      role: 'configuration indexing specialist',
      task: 'Index all configuration files: linting, formatting, building, CI/CD',
      context: args,
      instructions: [
        'Find and index all config files (eslint, prettier, tsconfig, etc.)',
        'Parse lint rules and their severity levels',
        'Identify formatting standards (indentation, quotes, etc.)',
        'Map build configuration and output targets',
        'Catalog environment variables and their defaults'
      ],
      outputFormat: 'JSON with configs (array of {path, type, rules}), lintRules (object), formatRules (object), buildConfig (object), envVars (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['configs'],
      properties: {
        configs: { type: 'array', items: { type: 'object' } },
        lintRules: { type: 'object' },
        formatRules: { type: 'object' },
        buildConfig: { type: 'object' },
        envVars: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'sync', 'index', 'config']
}));

export const apiIndexTask = defineTask('api-index', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Index APIs and interfaces',
  agent: {
    name: 'context-monitor',
    prompt: {
      role: 'API indexing specialist',
      task: 'Index public APIs, interfaces, types, and contracts',
      context: args,
      instructions: [
        'Find and index all public API endpoints or exported interfaces',
        'Map type definitions and their relationships',
        'Identify data models and schemas',
        'Record API conventions (naming, error handling, versioning)',
        'Document public surface area'
      ],
      outputFormat: 'JSON with apis (array of {path, name, type, signature}), types (array), models (array), conventions (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['apis'],
      properties: {
        apis: { type: 'array', items: { type: 'object' } },
        types: { type: 'array', items: { type: 'object' } },
        models: { type: 'array', items: { type: 'object' } },
        conventions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'sync', 'index', 'api']
}));

export const conventionDiscoveryTask = defineTask('convention-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discover coding conventions and standards',
  agent: {
    name: 'file-checker',
    prompt: {
      role: 'convention discovery specialist',
      task: 'Analyze the codebase to discover coding conventions, standards, and patterns',
      context: args,
      instructions: [
        'Analyze code style patterns (naming, structure, organization)',
        'Identify error handling conventions',
        'Discover testing conventions (naming, structure, assertions)',
        'Find commit message conventions',
        'Detect documentation standards',
        'Identify conditional coding standards by language',
        'Generate CONVENTIONS.md'
      ],
      outputFormat: 'JSON with codeStyle (object), errorHandling (object), testingConventions (object), gitConventions (object), documentation (object), conditionalStandards (object), conventionsMarkdown (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['codeStyle', 'testingConventions'],
      properties: {
        codeStyle: { type: 'object' },
        errorHandling: { type: 'object' },
        testingConventions: { type: 'object' },
        gitConventions: { type: 'object' },
        documentation: { type: 'object' },
        conditionalStandards: { type: 'object' },
        conventionsMarkdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'sync', 'conventions']
}));

export const ruleGenerationTask = defineTask('rule-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate/update project rules',
  agent: {
    name: 'memory-curator',
    prompt: {
      role: 'rule generation specialist',
      task: 'Generate or update project-specific rules based on discovered conventions',
      context: args,
      instructions: [
        'Convert discovered conventions into enforceable rules',
        'Categorize rules: core, dev-practices, tools, coding-standards',
        'Generate language-conditional rules (TypeScript, Python, Go, etc.)',
        'Create RULES.md with structured rule definitions',
        'Include rule severity and auto-fix availability'
      ],
      outputFormat: 'JSON with rules (array of {id, category, description, severity, autoFixable, language}), categories (array), rulesMarkdown (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['rules', 'categories'],
      properties: {
        rules: { type: 'array', items: { type: 'object' } },
        categories: { type: 'array', items: { type: 'string' } },
        rulesMarkdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'sync', 'rules']
}));

export const syncMemoryStoreTask = defineTask('sync-memory-store', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Store sync results in persistent memory',
  agent: {
    name: 'memory-curator',
    prompt: {
      role: 'memory curator',
      task: 'Store codebase sync results in persistent memory for future sessions',
      context: args,
      instructions: [
        'Store project metadata (language, framework, architecture)',
        'Store convention summaries as searchable observations',
        'Store rule definitions for quick retrieval',
        'Tag all entries with project path and timestamp',
        'Enable future /sync to detect changes incrementally'
      ],
      outputFormat: 'JSON with stored (boolean), entriesCreated (number), tags (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['stored', 'entriesCreated'],
      properties: {
        stored: { type: 'boolean' },
        entriesCreated: { type: 'number' },
        tags: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'sync', 'memory']
}));
