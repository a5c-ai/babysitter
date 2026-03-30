/**
 * @process methodologies/maestro/maestro-orchestrator
 * @description Maestro App Factory - Full lifecycle orchestrator: PM interview, architect spec, story dispatch, parallel coder cycles, review, merge
 * @inputs { goal: string, specFile?: string, projectRoot?: string, coderCount?: number, qualityThreshold?: number, mode?: string, maintenanceFrequency?: number }
 * @outputs { success: boolean, specification: object, stories: array, implementations: array, mergeResults: array, knowledgeGraph: object, metrics: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const pmInterviewTask = defineTask('maestro-pm-interview', async (args, _ctx) => {
  return { interview: args };
}, {
  kind: 'agent',
  title: 'Product Manager: Conduct Requirements Interview',
  labels: ['maestro', 'product-manager', 'requirements'],
  io: {
    inputs: { goal: 'string', userExpertise: 'string', existingSpec: 'string', projectContext: 'object' },
    outputs: { requirementsSpec: 'object', userPersonas: 'array', featureList: 'array', constraints: 'array', interviewLog: 'array' }
  }
});

const pmSpecGenerationTask = defineTask('maestro-pm-spec-generation', async (args, _ctx) => {
  return { spec: args };
}, {
  kind: 'agent',
  title: 'Product Manager: Generate Requirements Specification',
  labels: ['maestro', 'product-manager', 'specification'],
  io: {
    inputs: { interviewResults: 'object', projectContext: 'object', feedbackHistory: 'array' },
    outputs: { specification: 'object', acceptanceCriteria: 'array', priorities: 'array', openQuestions: 'array' }
  }
});

const architectReviewTask = defineTask('maestro-architect-review', async (args, _ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'Architect: Review and Approve Specification',
  labels: ['maestro', 'architect', 'review'],
  io: {
    inputs: { specification: 'object', projectContext: 'object', principles: 'array' },
    outputs: { approved: 'boolean', feedback: 'array', technicalConcerns: 'array', suggestedChanges: 'array' }
  }
});

const architectTechSpecTask = defineTask('maestro-architect-tech-spec', async (args, _ctx) => {
  return { techSpec: args };
}, {
  kind: 'agent',
  title: 'Architect: Create Technical Specification',
  labels: ['maestro', 'architect', 'tech-spec'],
  io: {
    inputs: { specification: 'object', projectRoot: 'string', principles: 'array' },
    outputs: { techSpec: 'object', architecture: 'object', techStack: 'object', dataModel: 'object', apiContracts: 'array' }
  }
});

const architectStoryDecompTask = defineTask('maestro-architect-story-decomp', async (args, _ctx) => {
  return { stories: args };
}, {
  kind: 'agent',
  title: 'Architect: Decompose Spec into Stories',
  labels: ['maestro', 'architect', 'stories'],
  io: {
    inputs: { techSpec: 'object', specification: 'object', maxStorySize: 'string' },
    outputs: { stories: 'array', dependencies: 'object', storyQueue: 'array', estimatedEffort: 'object' }
  }
});

const coderPlanTask = defineTask('maestro-coder-plan', async (args, _ctx) => {
  return { plan: args };
}, {
  kind: 'agent',
  title: 'Coder: Develop Implementation Plan for Story',
  labels: ['maestro', 'coder', 'planning'],
  io: {
    inputs: { story: 'object', techSpec: 'object', codebaseContext: 'object', coderId: 'string' },
    outputs: { plan: 'object', filesToCreate: 'array', filesToModify: 'array', testStrategy: 'object' }
  }
});

const coderImplementTask = defineTask('maestro-coder-implement', async (args, _ctx) => {
  return { implementation: args };
}, {
  kind: 'agent',
  title: 'Coder: Implement Story with Tests',
  labels: ['maestro', 'coder', 'implementation'],
  io: {
    inputs: { story: 'object', plan: 'object', techSpec: 'object', coderId: 'string' },
    outputs: { files: 'array', tests: 'array', testResults: 'object', branchName: 'string', prReady: 'boolean' }
  }
});

const coderTestTask = defineTask('maestro-coder-test', async (args, _ctx) => {
  return { testResults: args };
}, {
  kind: 'agent',
  title: 'Coder: Run Automated Tests',
  labels: ['maestro', 'coder', 'testing'],
  io: {
    inputs: { implementation: 'object', testCommands: 'array', coderId: 'string' },
    outputs: { passed: 'boolean', testResults: 'object', coverage: 'object', lintResults: 'object', failures: 'array' }
  }
});

const architectCodeReviewTask = defineTask('maestro-architect-code-review', async (args, _ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'Architect: Review Code and Tests, Enforce Principles',
  labels: ['maestro', 'architect', 'code-review'],
  io: {
    inputs: { implementation: 'object', story: 'object', techSpec: 'object', principles: 'array' },
    outputs: { approved: 'boolean', qualityScore: 'number', violations: 'array', feedback: 'array', mergeReady: 'boolean' }
  }
});

const architectMergeTask = defineTask('maestro-architect-merge', async (args, _ctx) => {
  return { merge: args };
}, {
  kind: 'agent',
  title: 'Architect: Merge Approved PR',
  labels: ['maestro', 'architect', 'merge'],
  io: {
    inputs: { implementation: 'object', branchName: 'string', storyId: 'string' },
    outputs: { merged: 'boolean', commitHash: 'string', conflictsResolved: 'array' }
  }
});

const knowledgeUpdateTask = defineTask('maestro-knowledge-update', async (args, _ctx) => {
  return { knowledge: args };
}, {
  kind: 'agent',
  title: 'Update Knowledge Graph with Patterns and Decisions',
  labels: ['maestro', 'knowledge', 'patterns'],
  io: {
    inputs: { completedStory: 'object', implementation: 'object', review: 'object', existingGraph: 'object' },
    outputs: { updatedGraph: 'object', newPatterns: 'array', decisions: 'array', knowledgeDotFile: 'string' }
  }
});

const metricsCollectionTask = defineTask('maestro-metrics-collection', async (args, _ctx) => {
  return { metrics: args };
}, {
  kind: 'agent',
  title: 'Collect Metrics: Tokens, Time, Quality, Coverage',
  labels: ['maestro', 'metrics', 'dashboard'],
  io: {
    inputs: { stories: 'array', implementations: 'array', reviews: 'array', startTime: 'string' },
    outputs: { tokenUsage: 'object', wallClockTime: 'number', testResults: 'object', codeQuality: 'object', costEstimate: 'object' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Maestro App Factory - Full Lifecycle Orchestrator
 *
 * Implements the Maestro workflow: a multi-agent system that mimics
 * high-performing human dev teams for production-ready applications.
 *
 * Agent Roles:
 * - Product Manager (PM): Conducts interviews, generates requirement specs
 * - Architect: Reviews specs, creates tech specs, decomposes stories, reviews code, merges PRs
 * - Coders: Pull stories, plan, implement, test, submit PRs (terminate between stories)
 *
 * Workflow:
 * 1. PM conducts requirement interview (or ingests spec file)
 * 2. PM generates requirements specification
 * 3. Architect reviews and approves specification (feedback loop with PM)
 * 4. Architect creates technical specification
 * 5. Architect decomposes spec into stories and dispatches
 * 6. Coders plan, implement, and test each story
 * 7. Architect reviews code, enforces principles (DRY, YAGNI, test coverage)
 * 8. Architect merges approved PRs
 * 9. Knowledge graph updated with patterns and decisions
 * 10. Metrics collected across the lifecycle
 *
 * Quality Gates:
 * - Code review separation (architects never write code, coders never self-review)
 * - Automated tests before PR submission
 * - DRY, YAGNI, proper abstraction, test coverage enforcement
 *
 * Attribution: Adapted from https://github.com/SnapdragonPartners/maestro
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.goal - Project goal or description
 * @param {string} inputs.specFile - Optional pre-written spec file path
 * @param {string} inputs.projectRoot - Project root directory
 * @param {number} inputs.coderCount - Number of parallel coders (default: 3)
 * @param {number} inputs.qualityThreshold - Minimum quality score (default: 80)
 * @param {string} inputs.mode - Operating mode: development|bootstrap|hotfix|maintenance
 * @param {number} inputs.maintenanceFrequency - Specs between maintenance runs (default: 5)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Full lifecycle results with metrics
 */
export async function process(inputs, ctx) {
  const {
    goal,
    specFile = null,
    projectRoot = '.',
    coderCount = 3,
    qualityThreshold = 80,
    mode = 'development',
    maintenanceFrequency = 5
  } = inputs;

  const startTime = ctx.now();
  const principles = ['DRY', 'YAGNI', 'proper-abstraction', 'test-coverage', 'separation-of-concerns'];

  ctx.log('Maestro: Starting full lifecycle orchestration', { goal, mode });

  // ============================================================================
  // PHASE 1: REQUIREMENTS (PM Agent)
  // ============================================================================

  ctx.log('Phase 1: Requirements gathering via Product Manager');

  let specification;

  if (specFile) {
    ctx.log('Spec file provided, skipping interview');
    specification = { source: 'file', path: specFile, goal };
  } else {
    const interviewResult = await ctx.task(pmInterviewTask, {
      goal,
      userExpertise: inputs.userExpertise || 'intermediate',
      existingSpec: '',
      projectContext: { projectRoot, mode }
    });

    specification = await ctx.task(pmSpecGenerationTask, {
      interviewResults: interviewResult,
      projectContext: { projectRoot, goal },
      feedbackHistory: []
    });
  }

  // ============================================================================
  // PHASE 2: ARCHITECT SPEC REVIEW (Feedback Loop)
  // ============================================================================

  ctx.log('Phase 2: Architect specification review');

  let specApproved = false;
  let reviewIteration = 0;
  const maxSpecReviewIterations = 3;

  while (!specApproved && reviewIteration < maxSpecReviewIterations) {
    reviewIteration++;
    ctx.log(`Spec review iteration ${reviewIteration}/${maxSpecReviewIterations}`);

    const reviewResult = await ctx.task(architectReviewTask, {
      specification,
      projectContext: { projectRoot, goal },
      principles
    });

    if (reviewResult.approved) {
      specApproved = true;
      ctx.log('Specification approved by Architect');
    } else {
      ctx.log('Architect requested changes', { feedbackCount: reviewResult.feedback.length });

      // PM revises spec based on architect feedback
      specification = await ctx.task(pmSpecGenerationTask, {
        interviewResults: specification,
        projectContext: { projectRoot, goal },
        feedbackHistory: reviewResult.feedback
      });
    }
  }

  if (!specApproved) {
    await ctx.breakpoint({
      question: `Specification not approved after ${maxSpecReviewIterations} iterations. Review the latest spec and architect feedback. Approve to continue or reject to terminate.`,
      title: 'Specification Approval Required',
      context: { runId: ctx.runId }
    });
  }

  // ============================================================================
  // PHASE 3: TECHNICAL SPEC + STORY DECOMPOSITION (Architect)
  // ============================================================================

  ctx.log('Phase 3: Technical specification and story decomposition');

  const techSpec = await ctx.task(architectTechSpecTask, {
    specification,
    projectRoot,
    principles
  });

  const storyDecomp = await ctx.task(architectStoryDecompTask, {
    techSpec: techSpec.techSpec,
    specification,
    maxStorySize: 'small'
  });

  await ctx.breakpoint({
    question: `Architect decomposed spec into ${storyDecomp.stories.length} stories. Estimated effort: ${JSON.stringify(storyDecomp.estimatedEffort)}. Review story queue and approve to begin implementation.`,
    title: 'Story Decomposition Review',
    context: { runId: ctx.runId }
  });

  // ============================================================================
  // PHASE 4: CODER CYCLES (Parallel Implementation)
  // ============================================================================

  ctx.log('Phase 4: Coder implementation cycles');

  const implementations = [];
  const reviews = [];
  const mergeResults = [];
  let knowledgeGraph = { patterns: [], decisions: [], nodes: [], edges: [] };
  const storyQueue = [...storyDecomp.storyQueue];

  while (storyQueue.length > 0) {
    // Dispatch up to coderCount stories in parallel
    const batch = storyQueue.splice(0, coderCount);
    ctx.log(`Dispatching ${batch.length} stories to coders`, { remaining: storyQueue.length });

    // Phase 4a: Parallel planning
    const planResults = await ctx.parallel.all(
      batch.map((story, idx) =>
        ctx.task(coderPlanTask, {
          story,
          techSpec: techSpec.techSpec,
          codebaseContext: { projectRoot },
          coderId: `coder-${idx + 1}`
        })
      )
    );

    // Architect approves plans via breakpoint
    await ctx.breakpoint({
      question: `${planResults.length} coder plans ready for review. Approve plans to proceed with implementation.`,
      title: 'Coder Plan Approval',
      context: { runId: ctx.runId }
    });

    // Phase 4b: Parallel implementation
    const implResults = await ctx.parallel.all(
      batch.map((story, idx) =>
        ctx.task(coderImplementTask, {
          story,
          plan: planResults[idx],
          techSpec: techSpec.techSpec,
          coderId: `coder-${idx + 1}`
        })
      )
    );

    // Phase 4c: Parallel testing
    const testResults = await ctx.parallel.all(
      implResults.map((impl, idx) =>
        ctx.task(coderTestTask, {
          implementation: impl,
          testCommands: ['npm test', 'npm run lint'],
          coderId: `coder-${idx + 1}`
        })
      )
    );

    // Phase 4d: Sequential architect review (architects review one at a time)
    for (let i = 0; i < batch.length; i++) {
      const story = batch[i];
      const impl = implResults[i];
      const tests = testResults[i];

      if (!tests.passed) {
        ctx.log(`Story ${story.id || i} tests failed, sending back to coder`, { failures: tests.failures });
        // Re-queue failed story for retry
        storyQueue.push(story);
        continue;
      }

      // Architect code review with quality gate
      let reviewApproved = false;
      let reviewAttempt = 0;
      const maxReviewAttempts = 2;

      while (!reviewApproved && reviewAttempt < maxReviewAttempts) {
        reviewAttempt++;

        const review = await ctx.task(architectCodeReviewTask, {
          implementation: impl,
          story,
          techSpec: techSpec.techSpec,
          principles
        });

        reviews.push(review);

        if (review.approved && review.qualityScore >= qualityThreshold) {
          reviewApproved = true;

          // Architect merges
          const merge = await ctx.task(architectMergeTask, {
            implementation: impl,
            branchName: impl.branchName || `story-${story.id || i}`,
            storyId: story.id || `story-${i}`
          });

          mergeResults.push(merge);
          implementations.push({ story, implementation: impl, review, merge });

          // Update knowledge graph
          const kgUpdate = await ctx.task(knowledgeUpdateTask, {
            completedStory: story,
            implementation: impl,
            review,
            existingGraph: knowledgeGraph
          });
          knowledgeGraph = kgUpdate.updatedGraph || knowledgeGraph;

          ctx.log(`Story ${story.id || i} merged successfully`, { qualityScore: review.qualityScore });
        } else {
          ctx.log(`Code review failed (score: ${review.qualityScore}/${qualityThreshold})`, { violations: review.violations });

          if (reviewAttempt >= maxReviewAttempts) {
            // Re-queue for fresh coder attempt
            storyQueue.push(story);
          }
        }
      }
    }

    // Coders terminate between story batches (stateless, all state in storage)
    ctx.log('Coder batch complete, agents terminated');
  }

  // ============================================================================
  // PHASE 5: METRICS COLLECTION
  // ============================================================================

  ctx.log('Phase 5: Collecting lifecycle metrics');

  const metrics = await ctx.task(metricsCollectionTask, {
    stories: storyDecomp.stories,
    implementations,
    reviews,
    startTime
  });

  return {
    success: true,
    goal,
    mode,
    specification,
    techSpec: techSpec.techSpec,
    stories: storyDecomp.stories,
    implementations: implementations.map(i => ({
      storyId: i.story.id,
      qualityScore: i.review.qualityScore,
      merged: i.merge.merged
    })),
    mergeResults,
    knowledgeGraph,
    metrics: metrics,
    metadata: {
      processId: 'methodologies/maestro/maestro-orchestrator',
      attribution: 'https://github.com/SnapdragonPartners/maestro',
      author: 'SnapdragonPartners',
      license: 'MIT',
      coderCount,
      qualityThreshold,
      principles,
      timestamp: ctx.now()
    }
  };
}
