/**
 * @process methodologies/maestro/maestro-bootstrap
 * @description Maestro Bootstrap - New project minimum infrastructure setup: scaffold, configure, initial architecture
 * @inputs { projectName: string, projectType: string, techStack?: object, projectRoot?: string, qualityThreshold?: number }
 * @outputs { success: boolean, scaffold: object, config: object, initialArchitecture: object, knowledgeGraph: object, readyForDevelopment: boolean }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const analyzeProjectTypeTask = defineTask('maestro-bootstrap-analyze', async (args, _ctx) => {
  return { analysis: args };
}, {
  kind: 'agent',
  title: 'Architect: Analyze Project Type and Recommend Stack',
  labels: ['maestro', 'bootstrap', 'analysis'],
  io: {
    inputs: { projectName: 'string', projectType: 'string', preferredStack: 'object', existingFiles: 'array' },
    outputs: { recommendedStack: 'object', projectStructure: 'object', dependencies: 'array', configFiles: 'array' }
  }
});

const scaffoldProjectTask = defineTask('maestro-bootstrap-scaffold', async (args, _ctx) => {
  return { scaffold: args };
}, {
  kind: 'agent',
  title: 'Coder: Scaffold Project Directory Structure',
  labels: ['maestro', 'bootstrap', 'scaffold'],
  io: {
    inputs: { projectName: 'string', projectStructure: 'object', techStack: 'object', projectRoot: 'string' },
    outputs: { createdFiles: 'array', createdDirs: 'array', packageJson: 'object', gitInitialized: 'boolean' }
  }
});

const configureToolingTask = defineTask('maestro-bootstrap-tooling', async (args, _ctx) => {
  return { tooling: args };
}, {
  kind: 'agent',
  title: 'Coder: Configure Build Tools, Linters, and CI',
  labels: ['maestro', 'bootstrap', 'tooling'],
  io: {
    inputs: { projectRoot: 'string', techStack: 'object', projectType: 'string' },
    outputs: { lintConfig: 'object', buildConfig: 'object', ciConfig: 'object', testConfig: 'object', configuredTools: 'array' }
  }
});

const installDependenciesTask = defineTask('maestro-bootstrap-deps', async (args, _ctx) => {
  return { deps: args };
}, {
  kind: 'agent',
  title: 'Coder: Install Dependencies and Verify Environment',
  labels: ['maestro', 'bootstrap', 'dependencies'],
  io: {
    inputs: { projectRoot: 'string', dependencies: 'array', packageManager: 'string' },
    outputs: { installed: 'boolean', installedPackages: 'array', warnings: 'array', lockFile: 'string' }
  }
});

const initialArchitectureTask = defineTask('maestro-bootstrap-architecture', async (args, _ctx) => {
  return { architecture: args };
}, {
  kind: 'agent',
  title: 'Architect: Define Initial Architecture and Patterns',
  labels: ['maestro', 'bootstrap', 'architecture'],
  io: {
    inputs: { projectName: 'string', projectType: 'string', techStack: 'object', scaffold: 'object' },
    outputs: { architecture: 'object', patterns: 'array', conventions: 'array', adrs: 'array' }
  }
});

const initKnowledgeGraphTask = defineTask('maestro-bootstrap-knowledge', async (args, _ctx) => {
  return { knowledge: args };
}, {
  kind: 'agent',
  title: 'Initialize Knowledge Graph with Founding Decisions',
  labels: ['maestro', 'bootstrap', 'knowledge'],
  io: {
    inputs: { projectName: 'string', architecture: 'object', techStack: 'object', conventions: 'array' },
    outputs: { knowledgeGraph: 'object', knowledgeDotFile: 'string', foundingDecisions: 'array' }
  }
});

const createMaestroConfigTask = defineTask('maestro-bootstrap-config', async (args, _ctx) => {
  return { config: args };
}, {
  kind: 'agent',
  title: 'Create Maestro Configuration File',
  labels: ['maestro', 'bootstrap', 'config'],
  io: {
    inputs: { projectName: 'string', projectRoot: 'string', techStack: 'object', architecture: 'object' },
    outputs: { configFile: 'string', modelConfig: 'object', modeDefaults: 'object', searchConfig: 'object' }
  }
});

const verifyBootstrapTask = defineTask('maestro-bootstrap-verify', async (args, _ctx) => {
  return { verification: args };
}, {
  kind: 'agent',
  title: 'Verify Bootstrap: Build, Lint, Test Smoke',
  labels: ['maestro', 'bootstrap', 'verification'],
  io: {
    inputs: { projectRoot: 'string', techStack: 'object', expectedFiles: 'array' },
    outputs: { buildPasses: 'boolean', lintPasses: 'boolean', testSmokePasses: 'boolean', missingFiles: 'array', qualityScore: 'number' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Maestro Bootstrap Process
 *
 * Sets up minimum viable infrastructure for a new project using the Maestro
 * agent model. The Architect analyzes and defines the initial architecture
 * while Coders handle scaffolding and tooling setup.
 *
 * Workflow:
 * 1. Architect analyzes project type and recommends stack
 * 2. Human approves stack selection
 * 3. Coder scaffolds project structure (parallel with tooling config)
 * 4. Coder installs dependencies
 * 5. Architect defines initial architecture and patterns
 * 6. Knowledge graph initialized with founding decisions
 * 7. Maestro config created
 * 8. Bootstrap verified (build, lint, test smoke)
 *
 * Attribution: Adapted from https://github.com/SnapdragonPartners/maestro
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project
 * @param {string} inputs.projectType - Type: web-app, api, cli, library, mobile, fullstack
 * @param {Object} inputs.techStack - Preferred technology stack (optional)
 * @param {string} inputs.projectRoot - Root directory (default: '.')
 * @param {number} inputs.qualityThreshold - Minimum quality score (default: 80)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Bootstrap results
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    projectType,
    techStack = {},
    projectRoot = '.',
    qualityThreshold = 80
  } = inputs;

  ctx.log('Maestro Bootstrap: Initializing new project', { projectName, projectType });

  // ============================================================================
  // STEP 1: ANALYZE PROJECT TYPE
  // ============================================================================

  ctx.log('Step 1: Architect analyzing project type and recommending stack');

  const analysis = await ctx.task(analyzeProjectTypeTask, {
    projectName,
    projectType,
    preferredStack: techStack,
    existingFiles: []
  });

  await ctx.breakpoint({
    question: `Architect recommends: ${JSON.stringify(analysis.recommendedStack)}. ${analysis.dependencies.length} dependencies identified. Approve stack selection to proceed with scaffolding.`,
    title: 'Stack Selection Review',
    context: { runId: ctx.runId }
  });

  // ============================================================================
  // STEP 2: SCAFFOLD + TOOLING (Parallel)
  // ============================================================================

  ctx.log('Step 2: Scaffolding project and configuring tooling');

  const [scaffoldResult, toolingResult] = await ctx.parallel.all([
    ctx.task(scaffoldProjectTask, {
      projectName,
      projectStructure: analysis.projectStructure,
      techStack: analysis.recommendedStack,
      projectRoot
    }),
    ctx.task(configureToolingTask, {
      projectRoot,
      techStack: analysis.recommendedStack,
      projectType
    })
  ]);

  // ============================================================================
  // STEP 3: INSTALL DEPENDENCIES
  // ============================================================================

  ctx.log('Step 3: Installing dependencies');

  const depsResult = await ctx.task(installDependenciesTask, {
    projectRoot,
    dependencies: analysis.dependencies,
    packageManager: analysis.recommendedStack.packageManager || 'npm'
  });

  // ============================================================================
  // STEP 4: INITIAL ARCHITECTURE
  // ============================================================================

  ctx.log('Step 4: Architect defining initial architecture');

  const archResult = await ctx.task(initialArchitectureTask, {
    projectName,
    projectType,
    techStack: analysis.recommendedStack,
    scaffold: scaffoldResult
  });

  // ============================================================================
  // STEP 5: KNOWLEDGE GRAPH + CONFIG (Parallel)
  // ============================================================================

  ctx.log('Step 5: Initializing knowledge graph and Maestro config');

  const [knowledgeResult, configResult] = await ctx.parallel.all([
    ctx.task(initKnowledgeGraphTask, {
      projectName,
      architecture: archResult.architecture,
      techStack: analysis.recommendedStack,
      conventions: archResult.conventions
    }),
    ctx.task(createMaestroConfigTask, {
      projectName,
      projectRoot,
      techStack: analysis.recommendedStack,
      architecture: archResult.architecture
    })
  ]);

  // ============================================================================
  // STEP 6: VERIFY BOOTSTRAP
  // ============================================================================

  ctx.log('Step 6: Verifying bootstrap integrity');

  const verification = await ctx.task(verifyBootstrapTask, {
    projectRoot,
    techStack: analysis.recommendedStack,
    expectedFiles: [...scaffoldResult.createdFiles, ...toolingResult.configuredTools]
  });

  if (verification.qualityScore < qualityThreshold) {
    await ctx.breakpoint({
      question: `Bootstrap verification score ${verification.qualityScore}/${qualityThreshold}. Build: ${verification.buildPasses}, Lint: ${verification.lintPasses}, Tests: ${verification.testSmokePasses}. Missing files: ${verification.missingFiles.length}. Review and decide.`,
      title: 'Bootstrap Verification Failed',
      context: { runId: ctx.runId }
    });
  }

  const readyForDevelopment = verification.buildPasses && verification.lintPasses && verification.testSmokePasses;

  return {
    success: true,
    projectName,
    projectType,
    scaffold: scaffoldResult,
    tooling: toolingResult,
    dependencies: depsResult,
    config: configResult,
    initialArchitecture: archResult,
    knowledgeGraph: knowledgeResult.knowledgeGraph,
    readyForDevelopment,
    verificationScore: verification.qualityScore,
    metadata: {
      processId: 'methodologies/maestro/maestro-bootstrap',
      attribution: 'https://github.com/SnapdragonPartners/maestro',
      author: 'SnapdragonPartners',
      license: 'MIT',
      timestamp: ctx.now()
    }
  };
}
