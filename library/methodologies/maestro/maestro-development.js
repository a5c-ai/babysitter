/**
 * @process methodologies/maestro/maestro-development
 * @description Maestro Development - Feature development cycle: story planning, parallel implementation, testing, architect review, merge
 * @inputs { stories: array, techSpec: object, projectRoot?: string, coderCount?: number, qualityThreshold?: number, knowledgeGraph?: object }
 * @outputs { success: boolean, completedStories: array, mergeResults: array, testCoverage: object, knowledgeGraph: object, metrics: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const analyzeCodebaseTask = defineTask('maestro-dev-analyze-codebase', async (args, _ctx) => {
  return { analysis: args };
}, {
  kind: 'agent',
  title: 'Architect: Analyze Codebase Context for Development',
  labels: ['maestro', 'development', 'analysis'],
  io: {
    inputs: { projectRoot: 'string', techSpec: 'object', stories: 'array' },
    outputs: { codebaseMap: 'object', existingPatterns: 'array', touchedModules: 'array', riskAreas: 'array' }
  }
});

const prioritizeStoriesTask = defineTask('maestro-dev-prioritize', async (args, _ctx) => {
  return { prioritized: args };
}, {
  kind: 'agent',
  title: 'Architect: Prioritize and Order Story Queue',
  labels: ['maestro', 'development', 'prioritization'],
  io: {
    inputs: { stories: 'array', dependencies: 'object', codebaseMap: 'object' },
    outputs: { orderedQueue: 'array', parallelBatches: 'array', criticalPath: 'array' }
  }
});

const coderPlanStoryTask = defineTask('maestro-dev-coder-plan', async (args, _ctx) => {
  return { plan: args };
}, {
  kind: 'agent',
  title: 'Coder: Plan Story Implementation',
  labels: ['maestro', 'development', 'planning'],
  io: {
    inputs: { story: 'object', techSpec: 'object', codebaseContext: 'object', coderId: 'string', knowledgeGraph: 'object' },
    outputs: { plan: 'object', filesToCreate: 'array', filesToModify: 'array', testStrategy: 'object', estimatedComplexity: 'string' }
  }
});

const coderImplementStoryTask = defineTask('maestro-dev-coder-implement', async (args, _ctx) => {
  return { implementation: args };
}, {
  kind: 'agent',
  title: 'Coder: Implement Story Code and Tests',
  labels: ['maestro', 'development', 'implementation'],
  io: {
    inputs: { story: 'object', plan: 'object', techSpec: 'object', coderId: 'string' },
    outputs: { files: 'array', tests: 'array', branchName: 'string', commitMessages: 'array', prDescription: 'string' }
  }
});

const runTestSuiteTask = defineTask('maestro-dev-run-tests', async (args, _ctx) => {
  return { results: args };
}, {
  kind: 'agent',
  title: 'Test Engineer: Run Full Test Suite',
  labels: ['maestro', 'development', 'testing'],
  io: {
    inputs: { projectRoot: 'string', branchName: 'string', testCommands: 'array' },
    outputs: { passed: 'boolean', unitResults: 'object', integrationResults: 'object', coverage: 'object', lintResults: 'object', failures: 'array' }
  }
});

const architectReviewPRTask = defineTask('maestro-dev-architect-review', async (args, _ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'Architect: Review PR Against Principles',
  labels: ['maestro', 'development', 'code-review'],
  io: {
    inputs: { implementation: 'object', story: 'object', techSpec: 'object', principles: 'array', testResults: 'object' },
    outputs: { approved: 'boolean', qualityScore: 'number', dryViolations: 'array', yagniViolations: 'array', abstractionIssues: 'array', coverageGaps: 'array', feedback: 'array' }
  }
});

const coderFixIssuesTask = defineTask('maestro-dev-coder-fix', async (args, _ctx) => {
  return { fixes: args };
}, {
  kind: 'agent',
  title: 'Coder: Fix Issues from Code Review',
  labels: ['maestro', 'development', 'fixes'],
  io: {
    inputs: { implementation: 'object', feedback: 'array', violations: 'array', coderId: 'string' },
    outputs: { fixedFiles: 'array', fixedTests: 'array', changesApplied: 'array', branchName: 'string' }
  }
});

const mergePRTask = defineTask('maestro-dev-merge', async (args, _ctx) => {
  return { merge: args };
}, {
  kind: 'agent',
  title: 'Architect: Merge Approved PR to Main',
  labels: ['maestro', 'development', 'merge'],
  io: {
    inputs: { branchName: 'string', storyId: 'string', qualityScore: 'number' },
    outputs: { merged: 'boolean', commitHash: 'string', conflictsResolved: 'array', mainBranchStatus: 'string' }
  }
});

const updateKnowledgeTask = defineTask('maestro-dev-knowledge-update', async (args, _ctx) => {
  return { knowledge: args };
}, {
  kind: 'agent',
  title: 'Knowledge Curator: Update Graph After Story Completion',
  labels: ['maestro', 'development', 'knowledge'],
  io: {
    inputs: { story: 'object', implementation: 'object', review: 'object', existingGraph: 'object' },
    outputs: { updatedGraph: 'object', newPatterns: 'array', newDecisions: 'array' }
  }
});

const collectBatchMetricsTask = defineTask('maestro-dev-metrics', async (args, _ctx) => {
  return { metrics: args };
}, {
  kind: 'agent',
  title: 'Collect Development Batch Metrics',
  labels: ['maestro', 'development', 'metrics'],
  io: {
    inputs: { completedStories: 'array', reviews: 'array', testResults: 'array', startTime: 'string' },
    outputs: { velocity: 'number', avgQualityScore: 'number', avgCoverage: 'number', tokenUsage: 'object', wallClockTime: 'number' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Maestro Development Process
 *
 * Default feature development workflow. Takes a set of stories and executes
 * them through the Maestro pipeline: plan, implement, test, review, merge.
 *
 * Key principles enforced:
 * - Coders never self-review (architect reviews all code)
 * - Automated tests run before PR submission
 * - DRY, YAGNI, abstraction, test coverage checks on every PR
 * - Coders fully terminate between story batches
 * - Failed coders auto-retry or story reassigned
 *
 * Attribution: Adapted from https://github.com/SnapdragonPartners/maestro
 *
 * @param {Object} inputs - Process inputs
 * @param {Array} inputs.stories - Stories to implement
 * @param {Object} inputs.techSpec - Technical specification
 * @param {string} inputs.projectRoot - Project root (default: '.')
 * @param {number} inputs.coderCount - Parallel coders (default: 3)
 * @param {number} inputs.qualityThreshold - Min quality score (default: 80)
 * @param {Object} inputs.knowledgeGraph - Existing knowledge graph
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Development cycle results
 */
export async function process(inputs, ctx) {
  const {
    stories,
    techSpec,
    projectRoot = '.',
    coderCount = 3,
    qualityThreshold = 80,
    knowledgeGraph: inputKG = { patterns: [], decisions: [], nodes: [], edges: [] }
  } = inputs;

  const startTime = ctx.now();
  const principles = ['DRY', 'YAGNI', 'proper-abstraction', 'test-coverage', 'separation-of-concerns'];
  let knowledgeGraph = { ...inputKG };

  ctx.log('Maestro Development: Starting feature development cycle', { storyCount: stories.length, coderCount });

  // ============================================================================
  // STEP 1: CODEBASE ANALYSIS + STORY PRIORITIZATION
  // ============================================================================

  ctx.log('Step 1: Analyzing codebase and prioritizing stories');

  const [codebaseAnalysis, prioritization] = await ctx.parallel.all([
    ctx.task(analyzeCodebaseTask, { projectRoot, techSpec, stories }),
    ctx.task(prioritizeStoriesTask, { stories, dependencies: {}, codebaseMap: {} })
  ]);

  // ============================================================================
  // STEP 2: BATCH EXECUTION
  // ============================================================================

  const completedStories = [];
  const allReviews = [];
  const allTestResults = [];
  const allMerges = [];
  const storyQueue = [...prioritization.orderedQueue];

  while (storyQueue.length > 0) {
    const batch = storyQueue.splice(0, coderCount);
    ctx.log(`Processing batch of ${batch.length} stories`, { remaining: storyQueue.length });

    // Phase A: Parallel planning
    const plans = await ctx.parallel.all(
      batch.map((story, idx) =>
        ctx.task(coderPlanStoryTask, {
          story,
          techSpec,
          codebaseContext: codebaseAnalysis,
          coderId: `coder-${idx + 1}`,
          knowledgeGraph
        })
      )
    );

    // Phase B: Parallel implementation
    const implementations = await ctx.parallel.all(
      batch.map((story, idx) =>
        ctx.task(coderImplementStoryTask, {
          story,
          plan: plans[idx],
          techSpec,
          coderId: `coder-${idx + 1}`
        })
      )
    );

    // Phase C: Parallel testing
    const testResults = await ctx.parallel.all(
      implementations.map(impl =>
        ctx.task(runTestSuiteTask, {
          projectRoot,
          branchName: impl.branchName,
          testCommands: ['npm test', 'npm run lint']
        })
      )
    );

    allTestResults.push(...testResults);

    // Phase D: Sequential architect review + merge
    for (let i = 0; i < batch.length; i++) {
      const story = batch[i];
      let impl = implementations[i];
      const tests = testResults[i];

      if (!tests.passed) {
        ctx.log(`Story tests failed, re-queueing`, { storyId: story.id, failures: tests.failures?.length });
        storyQueue.push(story);
        continue;
      }

      // Quality convergence loop
      let approved = false;
      let attempts = 0;
      const maxAttempts = 3;

      while (!approved && attempts < maxAttempts) {
        attempts++;

        const review = await ctx.task(architectReviewPRTask, {
          implementation: impl,
          story,
          techSpec,
          principles,
          testResults: tests
        });

        allReviews.push(review);

        if (review.approved && review.qualityScore >= qualityThreshold) {
          approved = true;

          const merge = await ctx.task(mergePRTask, {
            branchName: impl.branchName,
            storyId: story.id || `story-${i}`,
            qualityScore: review.qualityScore
          });

          allMerges.push(merge);
          completedStories.push({ story, implementation: impl, review, merge, tests });

          // Update knowledge graph
          const kgUpdate = await ctx.task(updateKnowledgeTask, {
            story,
            implementation: impl,
            review,
            existingGraph: knowledgeGraph
          });
          knowledgeGraph = kgUpdate.updatedGraph || knowledgeGraph;

          ctx.log(`Story merged`, { storyId: story.id, score: review.qualityScore });
        } else if (attempts < maxAttempts) {
          ctx.log(`Review failed, coder fixing issues`, { attempt: attempts, score: review.qualityScore });

          const fixes = await ctx.task(coderFixIssuesTask, {
            implementation: impl,
            feedback: review.feedback,
            violations: [...(review.dryViolations || []), ...(review.yagniViolations || [])],
            coderId: `coder-fix-${i + 1}`
          });

          impl = { ...impl, files: fixes.fixedFiles, tests: fixes.fixedTests, branchName: fixes.branchName };
        } else {
          ctx.log(`Story failed after ${maxAttempts} review attempts, escalating`);
          await ctx.breakpoint({
            question: `Story ${story.id} failed code review ${maxAttempts} times. Latest score: ${allReviews[allReviews.length - 1].qualityScore}/${qualityThreshold}. Manual intervention required.`,
            title: `Story Review Escalation: ${story.id}`,
            context: { runId: ctx.runId }
          });
          storyQueue.push(story);
        }
      }
    }

    // Coders terminate between batches
    ctx.log('Batch complete, coder agents terminated');
  }

  // ============================================================================
  // STEP 3: COLLECT METRICS
  // ============================================================================

  ctx.log('Step 3: Collecting development metrics');

  const metrics = await ctx.task(collectBatchMetricsTask, {
    completedStories,
    reviews: allReviews,
    testResults: allTestResults,
    startTime
  });

  return {
    success: true,
    completedStories: completedStories.map(s => ({
      storyId: s.story.id,
      qualityScore: s.review.qualityScore,
      merged: s.merge.merged,
      coveragePercent: s.tests.coverage?.percentage
    })),
    mergeResults: allMerges,
    testCoverage: {
      storiesPassed: allTestResults.filter(t => t.passed).length,
      storiesFailed: allTestResults.filter(t => !t.passed).length
    },
    knowledgeGraph,
    metrics,
    metadata: {
      processId: 'methodologies/maestro/maestro-development',
      attribution: 'https://github.com/SnapdragonPartners/maestro',
      author: 'SnapdragonPartners',
      license: 'MIT',
      coderCount,
      qualityThreshold,
      timestamp: ctx.now()
    }
  };
}
