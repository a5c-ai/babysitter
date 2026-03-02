/**
 * @process gsd/research-phase
 * @description Standalone phase research producing structured RESEARCH.md for downstream planning
 * @inputs { phaseId: string, phaseName: string, projectDir: string, mode: string }
 * @outputs { success: boolean, researchPath: string, approaches: array, recommendation: string, openQuestions: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Research Phase Process
 *
 * GSD Methodology: Standalone research for a phase, decoupled from plan-phase.
 * Spawns gsd-phase-researcher agent to investigate the phase domain, producing
 * a structured RESEARCH.md that downstream planning can consume. Useful when
 * research needs separate review before committing to a plan.
 *
 * Agents referenced from agents/ directory:
 *   - gsd-phase-researcher: Researches implementation approaches for a phase
 *
 * Skills referenced from skills/ directory:
 *   - gsd-tools: Config, path operations
 *   - state-management: STATE.md research status tracking
 *   - template-scaffolding: RESEARCH.md template
 *   - git-integration: Commit research artifacts
 *   - frontmatter-parsing: Phase metadata reading
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.phaseId - Phase identifier
 * @param {string} inputs.phaseName - Phase name
 * @param {string} inputs.projectDir - Project root directory (default: '.')
 * @param {string} inputs.mode - Research mode: 'overwrite', 'append', 'skip-if-exists' (default: 'overwrite')
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with research findings
 */
export async function process(inputs, ctx) {
  const {
    phaseId,
    phaseName,
    projectDir = '.',
    mode = 'overwrite'
  } = inputs;

  // ============================================================================
  // PHASE 1: INITIALIZE
  // ============================================================================

  ctx.log(`Initializing research for phase "${phaseName}"...`);

  const initResult = await ctx.task(initializeResearchTask, {
    phaseId,
    phaseName,
    projectDir,
    mode
  });

  const phaseExists = initResult.phaseExists;
  const researchExists = initResult.researchExists;
  const phaseDir = initResult.phaseDir;
  const researchPath = `${phaseDir}/RESEARCH.md`;

  if (!phaseExists) {
    return {
      success: false,
      reason: 'phase-not-found',
      recommendation: `Phase "${phaseName}" (${phaseId}) not found in ROADMAP.md. Verify phase exists.`,
      metadata: {
        processId: 'gsd/research-phase',
        timestamp: ctx.now()
      }
    };
  }

  if (researchExists && mode === 'skip-if-exists') {
    ctx.log('RESEARCH.md already exists, skipping (mode: skip-if-exists)');

    return {
      success: true,
      skipped: true,
      researchPath,
      reason: 'research-exists',
      metadata: {
        processId: 'gsd/research-phase',
        timestamp: ctx.now()
      }
    };
  }

  if (researchExists && mode !== 'overwrite' && mode !== 'append') {
    await ctx.breakpoint({
      question: `RESEARCH.md already exists for phase "${phaseName}". Choose: overwrite existing research, append new findings, or skip?`,
      title: `Existing Research: ${phaseName}`,
      context: {
        runId: ctx.runId,
        files: [
          { path: researchPath, format: 'markdown', label: 'Existing Research' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 2: LOAD CONTEXT
  // ============================================================================

  ctx.log('Loading project context for research...');

  const contextResult = await ctx.task(loadResearchContextTask, {
    phaseId,
    phaseName,
    phaseDir,
    projectDir
  });

  const projectContext = contextResult.projectContext;
  const roadmapContext = contextResult.roadmapContext;
  const requirementsContext = contextResult.requirementsContext;
  const existingContext = contextResult.existingPhaseContext;

  // ============================================================================
  // PHASE 3: RESEARCH
  // ============================================================================

  ctx.log(`Researching phase "${phaseName}"...`);

  const researchResult = await ctx.task(conductResearchTask, {
    phaseId,
    phaseName,
    phaseDir,
    projectContext,
    roadmapContext,
    requirementsContext,
    existingContext,
    existingResearch: researchExists && mode === 'append' ? initResult.existingResearchContent : null,
    projectDir
  });

  const approaches = researchResult.approaches || [];
  const recommendation = researchResult.recommendation;
  const risks = researchResult.risks || [];
  const openQuestions = researchResult.openQuestions || [];
  const libraryEvaluations = researchResult.libraryEvaluations || [];

  ctx.log(`Research complete: ${approaches.length} approaches, ${openQuestions.length} open questions`);

  // ============================================================================
  // PHASE 4: BREAKPOINT REVIEW
  // ============================================================================

  await ctx.breakpoint({
    question: `Research findings for phase "${phaseName}":\n\n` +
      `Recommended approach: ${recommendation}\n` +
      `Alternative approaches: ${approaches.length - 1}\n` +
      `Risks identified: ${risks.length}\n` +
      `Open questions: ${openQuestions.length}\n\n` +
      `Review the research. Ask questions, request deeper investigation, or approve for planning.`,
    title: `Research Review: ${phaseName}`,
    context: {
      runId: ctx.runId,
      files: [
        { path: researchPath, format: 'markdown', label: 'Research' },
        { path: '.planning/ROADMAP.md', format: 'markdown', label: 'Roadmap' }
      ]
    }
  });

  // ============================================================================
  // PHASE 5: COMMIT
  // ============================================================================

  ctx.log('Committing research artifacts...');

  const [commitResult, stateResult] = await ctx.parallel.all([
    () => ctx.task(commitResearchTask, {
      phaseId,
      phaseName,
      researchPath,
      projectDir
    }),
    () => ctx.task(updateResearchStateTask, {
      phaseId,
      phaseName,
      researchPath,
      approachCount: approaches.length,
      openQuestionCount: openQuestions.length,
      projectDir
    })
  ]);

  return {
    success: true,
    phaseId,
    phaseName,
    researchPath,
    approaches: approaches.map(a => ({ name: a.name, pros: a.pros, cons: a.cons })),
    recommendation,
    risks,
    openQuestions,
    libraryEvaluations: libraryEvaluations.map(l => ({ name: l.name, verdict: l.verdict })),
    commitHash: commitResult.hash,
    artifacts: {
      research: researchPath
    },
    metadata: {
      processId: 'gsd/research-phase',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const initializeResearchTask = defineTask('initialize-research', (args, taskCtx) => ({
  kind: 'orchestrator_task',
  title: `Initialize research: ${args.phaseName}`,
  description: 'Parse phase, validate in roadmap, check existing RESEARCH.md',

  orchestratorTask: {
    payload: {
      skill: 'gsd-tools',
      operation: 'initialize-research',
      projectDir: args.projectDir,
      phaseId: args.phaseId,
      phaseName: args.phaseName,
      checkResearch: true,
      mode: args.mode
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'research', 'init']
}));

export const loadResearchContextTask = defineTask('load-research-context', (args, taskCtx) => ({
  kind: 'orchestrator_task',
  title: `Load context: ${args.phaseName}`,
  description: 'Read PROJECT.md, ROADMAP.md, REQUIREMENTS.md, CONTEXT.md for target phase',

  orchestratorTask: {
    payload: {
      skill: 'context-engineering',
      operation: 'load-context',
      phaseId: args.phaseId,
      phaseName: args.phaseName,
      phaseDir: args.phaseDir,
      files: [
        '.planning/PROJECT.md',
        '.planning/ROADMAP.md',
        '.planning/REQUIREMENTS.md',
        `${args.phaseDir}/CONTEXT.md`
      ],
      projectDir: args.projectDir
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'research', 'context']
}));

export const conductResearchTask = defineTask('conduct-research', (args, taskCtx) => ({
  kind: 'agent',
  title: `Research: ${args.phaseName}`,
  description: 'Investigate phase domain with structured research output',

  agent: {
    name: 'gsd-phase-researcher',
    prompt: {
      role: 'Senior Software Engineer - Research Specialist',
      task: 'Research implementation approaches for the target phase',
      context: {
        phaseId: args.phaseId,
        phaseName: args.phaseName,
        projectContext: args.projectContext,
        roadmapContext: args.roadmapContext,
        requirementsContext: args.requirementsContext,
        existingContext: args.existingContext,
        existingResearch: args.existingResearch
      },
      instructions: [
        'Read PROJECT.md, ROADMAP.md, REQUIREMENTS.md for context',
        'Research implementation approaches for this phase',
        'Evaluate at least 2-3 different approaches',
        'For each approach: document pros, cons, effort estimate, risk level',
        'Evaluate relevant libraries/tools with version compatibility',
        'Identify integration points with existing codebase',
        'Assess risks and propose mitigation strategies',
        'Document open questions that need answers before planning',
        'Recommend a specific approach with clear rationale',
        'Use template-scaffolding skill for RESEARCH.md format',
        'Write structured RESEARCH.md to phase directory',
        'If appending to existing research, integrate new findings with existing'
      ],
      outputFormat: 'JSON with approaches (array), recommendation (string), risks (array), openQuestions (array), libraryEvaluations (array), researchMarkdown (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['approaches', 'recommendation', 'researchMarkdown'],
      properties: {
        approaches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } },
              effortEstimate: { type: 'string' },
              riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        },
        recommendation: { type: 'string' },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              likelihood: { type: 'string', enum: ['low', 'medium', 'high'] },
              impact: { type: 'string', enum: ['low', 'medium', 'high'] },
              mitigation: { type: 'string' }
            }
          }
        },
        openQuestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              context: { type: 'string' },
              suggestedAction: { type: 'string' }
            }
          }
        },
        libraryEvaluations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              version: { type: 'string' },
              purpose: { type: 'string' },
              verdict: { type: 'string', enum: ['recommended', 'acceptable', 'not-recommended'] },
              notes: { type: 'string' }
            }
          }
        },
        researchMarkdown: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'research', 'investigation']
}));

export const commitResearchTask = defineTask('commit-research', (args, taskCtx) => ({
  kind: 'orchestrator_task',
  title: `Commit: RESEARCH.md for ${args.phaseName}`,
  description: 'Commit research artifacts via git-integration skill',

  orchestratorTask: {
    payload: {
      skill: 'git-integration',
      operation: 'commit',
      files: [args.researchPath],
      message: `docs(${args.phaseId}): add phase research\n\nResearch for phase "${args.phaseName}"`,
      projectDir: args.projectDir
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'research', 'commit']
}));

export const updateResearchStateTask = defineTask('update-research-state', (args, taskCtx) => ({
  kind: 'orchestrator_task',
  title: 'Update STATE.md with research status',
  description: 'Record research completion in STATE.md',

  orchestratorTask: {
    payload: {
      skill: 'state-management',
      operation: 'update-research-status',
      phaseId: args.phaseId,
      phaseName: args.phaseName,
      researchPath: args.researchPath,
      approachCount: args.approachCount,
      openQuestionCount: args.openQuestionCount,
      projectDir: args.projectDir
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'research', 'state']
}));
