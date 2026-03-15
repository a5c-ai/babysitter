/**
 * @process methodologies/everything-claude-code/ecc-multi-service
 * @description Everything Claude Code Multi-Service Orchestration - PM2 process management, backend/frontend cascade, parallel worktree execution, and cross-service coordination
 * @inputs { services: array, projectRoot?: string, executionMode?: string, cascadeOrder?: array, parallelLimit?: number, pm2Config?: object }
 * @outputs { success: boolean, serviceResults: array, cascadeResult: object, pm2Status: object, crossServiceTests: object, summary: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const discoverServicesTask = defineTask('ecc-multi-discover', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discover and Map Services',
  agent: {
    name: 'architect',
    prompt: {
      role: 'ECC Service Discovery Agent',
      task: 'Discover all services in the project, map their dependencies, and determine the optimal execution order.',
      context: { ...args },
      instructions: [
        'Scan project root for service directories (packages/, services/, apps/)',
        'Read package.json in each service for dependencies and scripts',
        'Build a dependency graph between services',
        'Detect shared libraries and packages',
        'Identify service ports, protocols, and health check endpoints',
        'Determine topological order for cascade execution',
        'Detect package manager per service (npm, pnpm, yarn, bun)',
        'Flag circular dependencies as errors',
        'Return service manifest with dependency graph and execution order'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'multi-service', 'discovery']
}));

const pm2SetupTask = defineTask('ecc-multi-pm2-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'PM2 Process Manager Setup',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ECC PM2 Manager',
      task: 'Configure and start services using PM2 process manager. Create ecosystem file if needed and start services in dependency order.',
      context: { ...args },
      instructions: [
        'Check if PM2 is installed (pm2 --version), install if missing',
        'Generate or update ecosystem.config.js from service manifest',
        'Configure each service: name, script, cwd, env, instances, watch',
        'Set up log rotation and error handling',
        'Start services in topological order',
        'Wait for health checks on each service before starting dependents',
        'Report PM2 status: running, stopped, errored per service',
        'Configure restart policies: max restarts, restart delay'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'multi-service', 'pm2']
}));

const buildServiceTask = defineTask('ecc-multi-build-service', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build Individual Service',
  agent: {
    name: 'build-resolver',
    prompt: {
      role: 'ECC Service Builder',
      task: 'Build a single service: install dependencies, compile/transpile, run unit tests, and verify the build succeeds.',
      context: { ...args },
      instructions: [
        'Detect package manager from lockfile',
        'Install dependencies using the detected package manager',
        'Run build script (npm run build or equivalent)',
        'Run unit tests (npm test or equivalent)',
        'Verify build output exists and is valid',
        'Check for type errors in TypeScript projects',
        'Run linting if configured',
        'Record build time, test count, and exit codes as evidence',
        'If build fails, return error details for resolution'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'multi-service', 'build']
}));

const cascadeExecuteTask = defineTask('ecc-multi-cascade', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Cascade Execution for Sequential Dependencies',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ECC Cascade Executor',
      task: 'Execute services in cascade order, waiting for each dependency to complete before starting dependents. Handle failures with rollback.',
      context: { ...args },
      instructions: [
        'Follow topological order from the dependency graph',
        'For each service in order: build, test, start',
        'Wait for health check before proceeding to dependents',
        'If a service fails: stop, report error, suggest fix',
        'Track cascade progress: completed, in-progress, pending, failed',
        'Record timing per service for optimization insights',
        'Support partial cascade: skip already-healthy services',
        'Report cascade completion with timing breakdown'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'multi-service', 'cascade']
}));

const worktreeParallelTask = defineTask('ecc-multi-worktree', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Parallel Worktree Execution',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ECC Worktree Parallel Executor',
      task: 'Execute independent service tasks in parallel using git worktrees for isolation. Each service gets its own worktree to avoid file conflicts.',
      context: { ...args },
      instructions: [
        'Create a git worktree for each independent service group',
        'Execute build/test tasks concurrently across worktrees',
        'Monitor progress across all worktrees',
        'Collect results as each worktree completes',
        'Clean up worktrees after execution',
        'Handle failures: continue others, collect all errors',
        'Report parallel speedup vs sequential execution time',
        'Merge results into unified report'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'multi-service', 'worktree-parallel']
}));

const crossServiceTestTask = defineTask('ecc-multi-cross-test', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Cross-Service Integration Tests',
  agent: {
    name: 'e2e-runner',
    prompt: {
      role: 'ECC Cross-Service Tester',
      task: 'Run integration tests that verify communication between services. Test API contracts, event flows, and data consistency across service boundaries.',
      context: { ...args },
      instructions: [
        'Identify cross-service communication paths from the dependency graph',
        'Test API contracts between services (request/response schemas)',
        'Verify event bus message flows (publish/subscribe patterns)',
        'Test database shared state consistency',
        'Verify authentication/authorization across service boundaries',
        'Test error propagation between services',
        'Verify circuit breaker behavior under failure conditions',
        'Record pass/fail with evidence per integration point'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'multi-service', 'integration-test']
}));

const healthMonitorTask = defineTask('ecc-multi-health', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Service Health Monitoring',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ECC Health Monitor',
      task: 'Check health status of all running services, verify resource usage, and report any degradation or failures.',
      context: { ...args },
      instructions: [
        'Query health check endpoints for each service',
        'Check PM2 process status (online, stopped, errored)',
        'Monitor resource usage: CPU, memory, open handles',
        'Check log files for error patterns',
        'Verify inter-service connectivity',
        'Report service health matrix: healthy, degraded, down',
        'Suggest actions for unhealthy services'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'multi-service', 'health']
}));

// ============================================================================
// PROCESS FUNCTION
// ============================================================================

/**
 * Everything Claude Code Multi-Service Orchestration
 *
 * Manages multi-service projects with PM2, cascade execution for sequential
 * dependencies, parallel worktree execution for independent services, and
 * cross-service integration testing.
 *
 * @param {Object} inputs - Process inputs
 * @param {Array<Object>} inputs.services - Service definitions (name, path, type)
 * @param {string} inputs.projectRoot - Project root directory (default: '.')
 * @param {string} inputs.executionMode - Mode: 'cascade', 'parallel', 'auto' (default: 'auto')
 * @param {Array<string>} inputs.cascadeOrder - Override cascade order (default: auto-detect)
 * @param {number} inputs.parallelLimit - Max parallel executions (default: 4)
 * @param {Object} inputs.pm2Config - PM2 configuration overrides
 * @param {Object} ctx - Process context
 */
export async function process(inputs, ctx) {
  const {
    services = [],
    projectRoot = '.',
    executionMode = 'auto',
    cascadeOrder,
    parallelLimit = 4,
    pm2Config = {}
  } = inputs;

  ctx.log('info', `Multi-Service Orchestration starting: ${services.length} services, mode=${executionMode}`);

  // ── Phase 1: Service Discovery ──────────────────────────────────────
  ctx.log('info', 'Phase 1: Discovering and mapping services');
  const discoveryResult = await ctx.task(discoverServicesTask, {
    services,
    projectRoot,
    cascadeOrder
  });

  const serviceCount = discoveryResult.services?.length || services.length;
  const hasCyclicDeps = discoveryResult.cyclicDependencies?.length > 0;

  if (hasCyclicDeps) {
    ctx.log('error', 'Circular dependencies detected');
    await ctx.breakpoint({
      title: 'Circular Dependencies Detected',
      description: 'The dependency graph contains cycles. Review and resolve before proceeding.',
      data: { cyclicDependencies: discoveryResult.cyclicDependencies }
    });
  }

  const resolvedMode = executionMode === 'auto'
    ? (discoveryResult.hasSequentialDeps ? 'cascade' : 'parallel')
    : executionMode;

  ctx.log('info', `Resolved execution mode: ${resolvedMode}`);

  // ── Phase 2: Build Services ─────────────────────────────────────────
  ctx.log('info', 'Phase 2: Building services');
  let serviceResults;

  if (resolvedMode === 'parallel') {
    // Build independent services in parallel
    ctx.log('info', `Parallel build: up to ${parallelLimit} concurrent`);
    const buildTasks = (discoveryResult.services || services).map(service =>
      ctx.task(buildServiceTask, {
        service,
        projectRoot: service.path || projectRoot,
        packageManager: service.packageManager
      })
    );
    serviceResults = await ctx.parallel.all(buildTasks);
  } else {
    // Cascade: build in dependency order
    ctx.log('info', 'Cascade build: sequential dependency order');
    const cascadeResult = await ctx.task(cascadeExecuteTask, {
      services: discoveryResult.services || services,
      executionOrder: discoveryResult.executionOrder,
      projectRoot
    });
    serviceResults = cascadeResult.serviceResults || [];
  }

  const failedServices = serviceResults.filter(r => r?.exitCode !== 0);
  if (failedServices.length > 0) {
    ctx.log('warn', `${failedServices.length} services failed to build`);
    await ctx.breakpoint({
      title: 'Service Build Failures',
      description: `${failedServices.length}/${serviceCount} services failed to build. Review errors before proceeding.`,
      data: { failedServices }
    });
  }

  // ── Phase 3: PM2 Setup and Start ────────────────────────────────────
  ctx.log('info', 'Phase 3: Setting up PM2 process management');
  const pm2Result = await ctx.task(pm2SetupTask, {
    services: discoveryResult.services || services,
    projectRoot,
    pm2Config,
    executionOrder: discoveryResult.executionOrder
  });

  // ── Phase 4: Cross-Service Integration Tests ────────────────────────
  ctx.log('info', 'Phase 4: Running cross-service integration tests');
  const crossTestResult = await ctx.task(crossServiceTestTask, {
    services: discoveryResult.services || services,
    dependencyGraph: discoveryResult.dependencyGraph,
    projectRoot
  });

  // ── Phase 5: Health Monitoring ──────────────────────────────────────
  ctx.log('info', 'Phase 5: Verifying service health');
  const healthResult = await ctx.task(healthMonitorTask, {
    services: discoveryResult.services || services,
    pm2Status: pm2Result,
    projectRoot
  });

  // ── Summary ─────────────────────────────────────────────────────────
  const summary = {
    totalServices: serviceCount,
    buildSucceeded: serviceResults.filter(r => r?.exitCode === 0).length,
    buildFailed: failedServices.length,
    executionMode: resolvedMode,
    pm2Running: pm2Result.runningCount || 0,
    integrationTestsPassed: crossTestResult.passed || 0,
    integrationTestsFailed: crossTestResult.failed || 0,
    healthyServices: healthResult.healthyCount || 0,
    degradedServices: healthResult.degradedCount || 0
  };

  ctx.log('info', `Multi-Service Orchestration complete: ${JSON.stringify(summary)}`);

  return {
    success: failedServices.length === 0 && (crossTestResult.failed || 0) === 0,
    serviceResults,
    cascadeResult: resolvedMode === 'cascade' ? serviceResults : null,
    pm2Status: pm2Result,
    crossServiceTests: crossTestResult,
    healthStatus: healthResult,
    summary
  };
}
