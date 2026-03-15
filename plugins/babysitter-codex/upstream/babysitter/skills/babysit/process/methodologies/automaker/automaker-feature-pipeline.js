/**
 * @process methodologies/automaker/automaker-feature-pipeline
 * @description AutoMaker Feature Pipeline - Feature decomposition, planning, prioritization, and agent dispatch
 * @inputs { projectName: string, features: array, prioritizationStrategy?: string, testFramework?: string, maxParallel?: number }
 * @outputs { success: boolean, featurePlans: array, dispatchQueue: array, kanbanState: object, metrics: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * AutoMaker Feature Pipeline
 *
 * Adapted from AutoMaker (https://github.com/AutoMaker-Org/automaker)
 * Handles the intake-to-dispatch pipeline: features enter as Kanban cards,
 * get decomposed into plans, prioritized, and dispatched to execution agents.
 *
 * Pipeline stages:
 * 1. Feature Intake - Parse feature descriptions, images, screenshots
 * 2. Triage & Prioritization - Score and order features
 * 3. Decomposition - Break features into atomic tasks
 * 4. Dependency Analysis - Map inter-feature dependencies
 * 5. Agent Dispatch - Assign features to execution agents
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project
 * @param {Array<Object>} inputs.features - Features to process
 * @param {string} inputs.prioritizationStrategy - Strategy: 'value-first', 'risk-first', 'dependency-first' (default: 'value-first')
 * @param {string} inputs.testFramework - Test framework (default: 'both')
 * @param {number} inputs.maxParallel - Max parallel dispatches (default: 3)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Pipeline results with dispatch queue
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    features = [],
    prioritizationStrategy = 'value-first',
    testFramework = 'both',
    maxParallel = 3
  } = inputs;

  ctx.log(`AutoMaker feature pipeline starting for "${projectName}" with ${features.length} features`);

  // ============================================================================
  // STAGE 1: FEATURE INTAKE & PARSING
  // ============================================================================

  ctx.log('Stage 1: Feature intake and parsing');

  const parsedFeatures = await ctx.parallel.map(features, async (feature) => {
    return await ctx.task(parseFeatureTask, {
      projectName,
      feature
    });
  });

  // ============================================================================
  // STAGE 2: TRIAGE & PRIORITIZATION
  // ============================================================================

  ctx.log(`Stage 2: Triage and prioritization (strategy: ${prioritizationStrategy})`);

  const triageResult = await ctx.task(triageAndPrioritizeTask, {
    projectName,
    parsedFeatures,
    strategy: prioritizationStrategy
  });

  await ctx.breakpoint({
    question: `Feature triage complete for "${projectName}". ${triageResult.prioritizedFeatures.length} features prioritized using ${prioritizationStrategy} strategy. Top feature: "${triageResult.prioritizedFeatures[0]?.title || 'N/A'}". Approve prioritization order?`,
    title: 'AutoMaker Pipeline: Prioritization Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/automaker/pipeline/prioritization.md', format: 'markdown', label: 'Prioritization Results' }
      ]
    }
  });

  // ============================================================================
  // STAGE 3: FEATURE DECOMPOSITION
  // ============================================================================

  ctx.log('Stage 3: Decomposing features into implementation plans');

  const featurePlans = await ctx.parallel.map(
    triageResult.prioritizedFeatures,
    async (feature) => {
      return await ctx.task(deepDecomposeTask, {
        projectName,
        feature,
        testFramework,
        existingPlans: [] // No dependencies resolved yet
      });
    }
  );

  // ============================================================================
  // STAGE 4: DEPENDENCY ANALYSIS
  // ============================================================================

  ctx.log('Stage 4: Analyzing inter-feature dependencies');

  const dependencyResult = await ctx.task(analyzeDependenciesTask, {
    projectName,
    featurePlans
  });

  // Re-order plans based on dependency graph
  const orderedPlans = dependencyResult.executionOrder.map(
    (featureId) => featurePlans.find((p) => p.featureId === featureId)
  ).filter(Boolean);

  // ============================================================================
  // STAGE 5: AGENT DISPATCH QUEUE
  // ============================================================================

  ctx.log('Stage 5: Building agent dispatch queue');

  const dispatchResult = await ctx.task(buildDispatchQueueTask, {
    projectName,
    orderedPlans,
    maxParallel,
    dependencyGraph: dependencyResult.graph
  });

  await ctx.breakpoint({
    question: `Dispatch queue ready for "${projectName}". ${dispatchResult.batches.length} batches of work, ${orderedPlans.length} features total. First batch: ${dispatchResult.batches[0]?.length || 0} features. Approve dispatch to execution agents?`,
    title: 'AutoMaker Pipeline: Dispatch Queue Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/automaker/pipeline/dispatch-queue.md', format: 'markdown', label: 'Dispatch Queue' },
        { path: 'artifacts/automaker/pipeline/dependency-graph.md', format: 'markdown', label: 'Dependency Graph' }
      ]
    }
  });

  return {
    success: true,
    featurePlans: orderedPlans,
    dispatchQueue: dispatchResult.batches,
    kanbanState: {
      backlog: [],
      ready: orderedPlans.map((p) => p.featureId),
      inProgress: [],
      review: [],
      done: []
    },
    dependencyGraph: dependencyResult.graph,
    metrics: {
      totalFeatures: features.length,
      totalTasks: orderedPlans.reduce((sum, p) => sum + (p.tasks?.length || 0), 0),
      batchCount: dispatchResult.batches.length,
      strategy: prioritizationStrategy
    },
    metadata: {
      processId: 'methodologies/automaker/automaker-feature-pipeline',
      timestamp: ctx.now(),
      framework: 'AutoMaker',
      source: 'https://github.com/AutoMaker-Org/automaker'
    }
  };
}

// ============================================================================
// INTAKE TASKS
// ============================================================================

export const parseFeatureTask = defineTask('automaker-parse-feature', (args, taskCtx) => ({
  kind: 'agent',
  title: `Parse Feature: ${args.feature.title || args.feature.id}`,
  description: 'Parse feature description, extract requirements from text, images, and screenshots',
  agent: {
    name: 'automaker-feature-planner',
    prompt: {
      role: 'Feature Planner agent specializing in parsing and understanding feature requests from various input formats including text descriptions, images, and screenshots.',
      task: `Parse and normalize feature "${args.feature.title || args.feature.id}"`,
      context: {
        projectName: args.projectName,
        feature: args.feature
      },
      instructions: [
        'Parse the feature title and description',
        'Extract requirements from text content',
        'If attachments exist, analyze images and screenshots for UI requirements',
        'Identify implicit requirements not explicitly stated',
        'Categorize the feature type: UI, API, infrastructure, refactor, bugfix',
        'Estimate initial complexity: small, medium, large',
        'Extract acceptance criteria from description'
      ],
      outputFormat: 'JSON with featureId, title, requirements, type, complexity, acceptanceCriteria, attachmentAnalysis'
    }
  },
  labels: ['automaker', 'pipeline', 'intake'],
  io: {
    inputs: { featureId: args.feature.id, title: args.feature.title },
    outputs: 'Parsed feature with extracted requirements'
  }
}), {
  labels: ['automaker', 'intake']
});

// ============================================================================
// TRIAGE TASKS
// ============================================================================

export const triageAndPrioritizeTask = defineTask('automaker-triage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Triage: ${args.projectName} (${args.parsedFeatures.length} features)`,
  description: 'Triage and prioritize features using the specified strategy',
  agent: {
    name: 'automaker-feature-planner',
    prompt: {
      role: 'Feature Planner agent performing triage and prioritization of parsed features.',
      task: `Prioritize ${args.parsedFeatures.length} features using ${args.strategy} strategy`,
      context: {
        projectName: args.projectName,
        parsedFeatures: args.parsedFeatures,
        strategy: args.strategy
      },
      instructions: [
        `Apply ${args.strategy} prioritization strategy:`,
        args.strategy === 'value-first'
          ? '- Score features by business value, user impact, and strategic alignment'
          : args.strategy === 'risk-first'
            ? '- Score features by technical risk, reducing highest-risk items first'
            : '- Score features by dependency depth, implementing foundations first',
        'Assign priority scores (1-100) to each feature',
        'Order features by priority score descending',
        'Flag any features that need clarification',
        'Identify quick wins (high value, low complexity)'
      ],
      outputFormat: 'JSON with prioritizedFeatures (ordered array), quickWins, needsClarification'
    }
  },
  labels: ['automaker', 'pipeline', 'triage'],
  io: {
    inputs: { featureCount: args.parsedFeatures.length, strategy: args.strategy },
    outputs: 'Prioritized feature list with scores'
  }
}), {
  labels: ['automaker', 'triage']
});

// ============================================================================
// DECOMPOSITION TASKS
// ============================================================================

export const deepDecomposeTask = defineTask('automaker-deep-decompose', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deep Decompose: ${args.feature.title}`,
  description: 'Feature Planner creates detailed implementation plan with task breakdown',
  agent: {
    name: 'automaker-feature-planner',
    prompt: {
      role: 'Feature Planner agent creating detailed implementation plans with atomic task breakdowns, file-level changes, and test strategies.',
      task: `Create detailed implementation plan for "${args.feature.title}"`,
      context: {
        projectName: args.projectName,
        feature: args.feature,
        testFramework: args.testFramework,
        existingPlans: args.existingPlans
      },
      instructions: [
        'Create atomic implementation tasks (each should take 1 agent iteration)',
        'For each task, specify: files to create/modify, changes needed, test files',
        'Define Vitest unit test requirements for each task',
        'Define Playwright E2E test scenarios for user-facing changes',
        'Map acceptance criteria to specific test assertions',
        'Identify shared utilities or components to create',
        'Estimate lines of code for each task',
        'Define the git commit strategy (one commit per task)'
      ],
      outputFormat: 'JSON with featureId, featureTitle, tasks[], testStrategy, branchName, estimatedLOC, commitStrategy'
    }
  },
  labels: ['automaker', 'pipeline', 'decomposition', 'detailed'],
  io: {
    inputs: { feature: args.feature.title, testFramework: args.testFramework },
    outputs: 'Detailed implementation plan with atomic tasks'
  }
}), {
  labels: ['automaker', 'decomposition']
});

// ============================================================================
// DEPENDENCY TASKS
// ============================================================================

export const analyzeDependenciesTask = defineTask('automaker-analyze-deps', (args, taskCtx) => ({
  kind: 'agent',
  title: `Dependency Analysis: ${args.projectName}`,
  description: 'Analyze inter-feature dependencies and build execution order',
  agent: {
    name: 'automaker-feature-planner',
    prompt: {
      role: 'Feature Planner agent analyzing dependencies between features to determine optimal execution order.',
      task: `Analyze dependencies between ${args.featurePlans.length} feature plans`,
      context: {
        projectName: args.projectName,
        featurePlans: args.featurePlans
      },
      instructions: [
        'Identify shared file modifications across features',
        'Detect data model dependencies',
        'Map API contract dependencies',
        'Build a directed acyclic graph (DAG) of feature dependencies',
        'Detect circular dependencies and suggest resolution',
        'Generate a topologically sorted execution order',
        'Identify features that can be executed in parallel (no shared dependencies)'
      ],
      outputFormat: 'JSON with graph (adjacency list), executionOrder (topological sort), parallelGroups, circularDeps'
    }
  },
  labels: ['automaker', 'pipeline', 'dependencies'],
  io: {
    inputs: { planCount: args.featurePlans.length },
    outputs: 'Dependency graph and execution order'
  }
}), {
  labels: ['automaker', 'dependencies']
});

// ============================================================================
// DISPATCH TASKS
// ============================================================================

export const buildDispatchQueueTask = defineTask('automaker-build-dispatch', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build Dispatch Queue: ${args.projectName}`,
  description: 'Build batched dispatch queue respecting dependencies and concurrency limits',
  agent: {
    name: 'automaker-feature-planner',
    prompt: {
      role: 'Feature Planner agent building the agent dispatch queue with dependency-aware batching.',
      task: `Build dispatch queue for ${args.orderedPlans.length} features (max ${args.maxParallel} parallel)`,
      context: {
        projectName: args.projectName,
        orderedPlans: args.orderedPlans,
        maxParallel: args.maxParallel,
        dependencyGraph: args.dependencyGraph
      },
      instructions: [
        `Group features into batches of up to ${args.maxParallel}`,
        'Ensure no batch contains features that depend on each other',
        'Respect topological order from dependency analysis',
        'Minimize total number of batches',
        'Assign agent types to each feature in the batch',
        'Generate dispatch metadata for each batch'
      ],
      outputFormat: 'JSON with batches (array of arrays), totalBatches, estimatedDuration'
    }
  },
  labels: ['automaker', 'pipeline', 'dispatch'],
  io: {
    inputs: { featureCount: args.orderedPlans.length, maxParallel: args.maxParallel },
    outputs: 'Batched dispatch queue'
  }
}), {
  labels: ['automaker', 'dispatch']
});
