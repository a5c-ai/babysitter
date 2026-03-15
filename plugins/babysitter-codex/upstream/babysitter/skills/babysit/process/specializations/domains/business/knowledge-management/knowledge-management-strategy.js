/**
 * @process domains/business/knowledge-management/knowledge-management-strategy
 * @description Develop KM strategy aligned with business objectives, including goals, initiatives, governance, and implementation roadmap
 * @specialization Knowledge Management
 * @category Knowledge Governance and Strategy
 * @inputs { organizationalContext: object, businessObjectives: array, currentState: object, stakeholders: array, outputDir: string }
 * @outputs { success: boolean, kmStrategy: object, roadmap: object, governanceModel: object, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationalContext = {},
    businessObjectives = [],
    currentState = {},
    stakeholders = [],
    timeHorizon = '3 years',
    resourceConstraints = {},
    industryContext = {},
    outputDir = 'km-strategy-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Knowledge Management Strategy Development Process');

  // ============================================================================
  // PHASE 1: CURRENT STATE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing current state of knowledge management');
  const currentStateAssessment = await ctx.task(currentStateAssessmentTask, {
    organizationalContext,
    currentState,
    industryContext,
    outputDir
  });

  artifacts.push(...currentStateAssessment.artifacts);

  // Breakpoint: Review current state
  await ctx.breakpoint({
    question: `Current state assessment complete. Maturity level: ${currentStateAssessment.maturityLevel}. Review?`,
    title: 'Current State Assessment Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        maturityLevel: currentStateAssessment.maturityLevel,
        strengths: currentStateAssessment.strengths.length,
        gaps: currentStateAssessment.gaps.length
      }
    }
  });

  // ============================================================================
  // PHASE 2: STRATEGIC ALIGNMENT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing alignment with business objectives');
  const strategicAlignment = await ctx.task(strategicAlignmentTask, {
    businessObjectives,
    currentStateAssessment,
    organizationalContext,
    outputDir
  });

  artifacts.push(...strategicAlignment.artifacts);

  // ============================================================================
  // PHASE 3: VISION AND GOALS DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 3: Defining KM vision and goals');
  const visionGoals = await ctx.task(visionGoalsTask, {
    businessObjectives,
    currentStateAssessment,
    strategicAlignment: strategicAlignment.alignment,
    timeHorizon,
    outputDir
  });

  artifacts.push(...visionGoals.artifacts);

  // ============================================================================
  // PHASE 4: INITIATIVE IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Identifying strategic initiatives');
  const initiativeIdentification = await ctx.task(initiativeIdentificationTask, {
    goals: visionGoals.goals,
    gaps: currentStateAssessment.gaps,
    resourceConstraints,
    outputDir
  });

  artifacts.push(...initiativeIdentification.artifacts);

  // Breakpoint: Review initiatives
  await ctx.breakpoint({
    question: `Identified ${initiativeIdentification.initiatives.length} strategic initiatives. Review?`,
    title: 'Strategic Initiatives Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        totalInitiatives: initiativeIdentification.initiatives.length,
        highPriority: initiativeIdentification.initiatives.filter(i => i.priority === 'high').length
      }
    }
  });

  // ============================================================================
  // PHASE 5: GOVERNANCE MODEL DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing governance model');
  const governanceModel = await ctx.task(governanceModelTask, {
    organizationalContext,
    initiatives: initiativeIdentification.initiatives,
    stakeholders,
    outputDir
  });

  artifacts.push(...governanceModel.artifacts);

  // ============================================================================
  // PHASE 6: TECHNOLOGY STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing technology strategy');
  const technologyStrategy = await ctx.task(technologyStrategyTask, {
    initiatives: initiativeIdentification.initiatives,
    currentState,
    resourceConstraints,
    outputDir
  });

  artifacts.push(...technologyStrategy.artifacts);

  // ============================================================================
  // PHASE 7: CHANGE MANAGEMENT STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 7: Developing change management strategy');
  const changeManagementStrategy = await ctx.task(changeManagementStrategyTask, {
    initiatives: initiativeIdentification.initiatives,
    organizationalContext,
    stakeholders,
    outputDir
  });

  artifacts.push(...changeManagementStrategy.artifacts);

  // ============================================================================
  // PHASE 8: IMPLEMENTATION ROADMAP
  // ============================================================================

  ctx.log('info', 'Phase 8: Developing implementation roadmap');
  const implementationRoadmap = await ctx.task(implementationRoadmapTask, {
    initiatives: initiativeIdentification.initiatives,
    governanceModel: governanceModel.model,
    technologyStrategy: technologyStrategy.strategy,
    changeManagementStrategy: changeManagementStrategy.strategy,
    timeHorizon,
    resourceConstraints,
    outputDir
  });

  artifacts.push(...implementationRoadmap.artifacts);

  // ============================================================================
  // PHASE 9: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 9: Assessing strategy quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, {
    currentStateAssessment,
    strategicAlignment,
    visionGoals,
    initiativeIdentification,
    governanceModel,
    implementationRoadmap,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  // ============================================================================
  // PHASE 10: STAKEHOLDER REVIEW (IF REQUIRED)
  // ============================================================================

  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 10: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, {
      kmStrategy: {
        vision: visionGoals.vision,
        goals: visionGoals.goals,
        initiatives: initiativeIdentification.initiatives
      },
      roadmap: implementationRoadmap.roadmap,
      governanceModel: governanceModel.model,
      qualityScore: qualityAssessment.overallScore,
      stakeholders,
      outputDir
    });

    artifacts.push(...reviewResult.artifacts);

    // Breakpoint: Final approval gate
    await ctx.breakpoint({
      question: `Stakeholder review complete. ${reviewResult.approved ? 'Approved!' : 'Requires revisions.'} Finalize strategy?`,
      title: 'Final Approval Gate',
      context: {
        runId: ctx.runId,
        files: artifacts.map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          language: a.language || undefined,
          label: a.label || undefined
        })),
        summary: {
          approved: reviewResult.approved,
          qualityScore: qualityAssessment.overallScore,
          initiatives: initiativeIdentification.initiatives.length
        }
      }
    });
  }

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    kmStrategy: {
      vision: visionGoals.vision,
      goals: visionGoals.goals,
      initiatives: initiativeIdentification.initiatives,
      strategicAlignment: strategicAlignment.alignment
    },
    roadmap: implementationRoadmap.roadmap,
    governanceModel: governanceModel.model,
    technologyStrategy: technologyStrategy.strategy,
    changeManagementStrategy: changeManagementStrategy.strategy,
    statistics: {
      goalsIdentified: visionGoals.goals.length,
      initiativesPlanned: initiativeIdentification.initiatives.length,
      currentMaturityLevel: currentStateAssessment.maturityLevel,
      targetMaturityLevel: visionGoals.targetMaturityLevel
    },
    qualityScore: qualityAssessment.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/business/knowledge-management/knowledge-management-strategy',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Current State Assessment
export const currentStateAssessmentTask = defineTask('current-state-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess current state of KM',
  agent: {
    name: 'km-assessor',
    prompt: {
      role: 'knowledge management maturity assessor',
      task: 'Assess current state of knowledge management',
      context: args,
      instructions: [
        'Assess current KM state:',
        '  - People (culture, skills, roles)',
        '  - Process (KM processes maturity)',
        '  - Technology (tools and platforms)',
        '  - Content (knowledge assets)',
        '  - Governance (policies and standards)',
        'Determine KM maturity level',
        'Identify strengths and capabilities',
        'Identify gaps and weaknesses',
        'Benchmark against industry',
        'Save assessment to output directory'
      ],
      outputFormat: 'JSON with maturityLevel (string), strengths (array), gaps (array), benchmarks (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['maturityLevel', 'strengths', 'gaps', 'artifacts'],
      properties: {
        maturityLevel: { type: 'string', enum: ['initial', 'developing', 'defined', 'managed', 'optimizing'] },
        strengths: { type: 'array' },
        gaps: { type: 'array' },
        benchmarks: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'assessment', 'maturity']
}));

// Task 2: Strategic Alignment
export const strategicAlignmentTask = defineTask('strategic-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze strategic alignment',
  agent: {
    name: 'strategy-analyst',
    prompt: {
      role: 'strategic alignment analyst',
      task: 'Analyze alignment between KM and business objectives',
      context: args,
      instructions: [
        'Analyze strategic alignment:',
        '  - Map KM capabilities to business objectives',
        '  - Identify how KM can enable each objective',
        '  - Assess current alignment gaps',
        '  - Identify KM value drivers',
        'Prioritize alignment opportunities',
        'Define KM value proposition',
        'Save alignment analysis to output directory'
      ],
      outputFormat: 'JSON with alignment (object), valueDrivers (array), alignmentGaps (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['alignment', 'artifacts'],
      properties: {
        alignment: { type: 'object' },
        valueDrivers: { type: 'array' },
        alignmentGaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'strategy', 'alignment']
}));

// Task 3: Vision and Goals
export const visionGoalsTask = defineTask('vision-goals', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define KM vision and goals',
  agent: {
    name: 'vision-strategist',
    prompt: {
      role: 'KM vision and goals strategist',
      task: 'Define KM vision and strategic goals',
      context: args,
      instructions: [
        'Define KM vision:',
        '  - Aspirational future state',
        '  - Alignment with business vision',
        '  - Value proposition',
        'Define strategic goals:',
        '  - SMART goals',
        '  - Tied to business objectives',
        '  - Measurable outcomes',
        'Define target maturity level',
        'Create success metrics',
        'Save vision and goals to output directory'
      ],
      outputFormat: 'JSON with vision (string), goals (array), targetMaturityLevel (string), successMetrics (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['vision', 'goals', 'artifacts'],
      properties: {
        vision: { type: 'string' },
        goals: { type: 'array' },
        targetMaturityLevel: { type: 'string' },
        successMetrics: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'strategy', 'vision']
}));

// Task 4: Initiative Identification
export const initiativeIdentificationTask = defineTask('initiative-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify strategic initiatives',
  agent: {
    name: 'initiative-planner',
    prompt: {
      role: 'KM initiative planner',
      task: 'Identify strategic initiatives to achieve goals',
      context: args,
      instructions: [
        'Identify strategic initiatives:',
        '  - Address identified gaps',
        '  - Achieve strategic goals',
        '  - Build on existing strengths',
        'For each initiative define:',
        '  - Objective and scope',
        '  - Expected outcomes',
        '  - Resource requirements',
        '  - Priority level',
        '  - Dependencies',
        'Prioritize initiatives',
        'Save initiatives to output directory'
      ],
      outputFormat: 'JSON with initiatives (array), prioritization (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['initiatives', 'artifacts'],
      properties: {
        initiatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              objective: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              outcomes: { type: 'array', items: { type: 'string' } },
              resources: { type: 'object' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        prioritization: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'strategy', 'initiatives']
}));

// Task 5: Governance Model
export const governanceModelTask = defineTask('governance-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design governance model',
  agent: {
    name: 'governance-architect',
    prompt: {
      role: 'KM governance architect',
      task: 'Design KM governance model',
      context: args,
      instructions: [
        'Design governance model:',
        '  - Roles and responsibilities',
        '  - Decision-making processes',
        '  - Policies and standards',
        '  - Performance metrics',
        '  - Review and oversight',
        'Define governance bodies',
        'Create accountability framework',
        'Save governance model to output directory'
      ],
      outputFormat: 'JSON with model (object), roles (array), policies (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'artifacts'],
      properties: {
        model: { type: 'object' },
        roles: { type: 'array' },
        policies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'governance', 'model']
}));

// Task 6: Technology Strategy
export const technologyStrategyTask = defineTask('technology-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop technology strategy',
  agent: {
    name: 'technology-strategist',
    prompt: {
      role: 'KM technology strategist',
      task: 'Develop KM technology strategy',
      context: args,
      instructions: [
        'Develop technology strategy:',
        '  - Technology landscape assessment',
        '  - Platform and tool recommendations',
        '  - Integration requirements',
        '  - Build vs buy decisions',
        '  - Technology roadmap',
        'Consider emerging technologies',
        'Define technology principles',
        'Save technology strategy to output directory'
      ],
      outputFormat: 'JSON with strategy (object), recommendations (array), roadmap (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        recommendations: { type: 'array' },
        roadmap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'technology', 'strategy']
}));

// Task 7: Change Management Strategy
export const changeManagementStrategyTask = defineTask('change-management-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop change management strategy',
  agent: {
    name: 'change-manager',
    prompt: {
      role: 'change management strategist',
      task: 'Develop change management strategy for KM',
      context: args,
      instructions: [
        'Develop change management strategy:',
        '  - Stakeholder analysis',
        '  - Impact assessment',
        '  - Communication plan',
        '  - Training and enablement',
        '  - Resistance management',
        'Define change champions network',
        'Create adoption metrics',
        'Save change management strategy to output directory'
      ],
      outputFormat: 'JSON with strategy (object), communicationPlan (object), trainingPlan (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        communicationPlan: { type: 'object' },
        trainingPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'change-management', 'strategy']
}));

// Task 8: Implementation Roadmap
export const implementationRoadmapTask = defineTask('implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop implementation roadmap',
  agent: {
    name: 'roadmap-planner',
    prompt: {
      role: 'KM implementation roadmap planner',
      task: 'Develop implementation roadmap',
      context: args,
      instructions: [
        'Develop implementation roadmap:',
        '  - Phase initiatives into waves',
        '  - Define milestones and timelines',
        '  - Sequence based on dependencies',
        '  - Allocate resources',
        '  - Define quick wins',
        'Create visual roadmap',
        'Define decision gates',
        'Save roadmap to output directory'
      ],
      outputFormat: 'JSON with roadmap (object), phases (array), milestones (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['roadmap', 'artifacts'],
      properties: {
        roadmap: { type: 'object' },
        phases: { type: 'array' },
        milestones: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'roadmap', 'implementation']
}));

// Task 9: Quality Assessment
export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess strategy quality',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'strategy quality assessor',
      task: 'Evaluate quality of KM strategy',
      context: args,
      instructions: [
        'Assess strategy quality:',
        '  - Strategic alignment',
        '  - Comprehensiveness',
        '  - Feasibility',
        '  - Governance adequacy',
        '  - Roadmap realism',
        'Calculate overall quality score',
        'Identify gaps and risks',
        'Save quality assessment to output directory'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), qualityDimensions (object), risks (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        qualityDimensions: { type: 'object' },
        risks: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'quality', 'assessment']
}));

// Task 10: Stakeholder Review
export const stakeholderReviewTask = defineTask('stakeholder-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct stakeholder review',
  agent: {
    name: 'project-manager',
    prompt: {
      role: 'project manager facilitating stakeholder review',
      task: 'Coordinate stakeholder review and approval',
      context: args,
      instructions: [
        'Present KM strategy to stakeholders',
        'Review vision and goals',
        'Present strategic initiatives',
        'Present governance model',
        'Present implementation roadmap',
        'Gather stakeholder feedback',
        'Obtain executive approval',
        'Document decisions and action items',
        'Save stakeholder review results to output directory'
      ],
      outputFormat: 'JSON with approved (boolean), stakeholders (array), feedback (array), actionItems (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'stakeholders', 'artifacts'],
      properties: {
        approved: { type: 'boolean' },
        stakeholders: { type: 'array', items: { type: 'string' } },
        feedback: { type: 'array' },
        actionItems: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'stakeholder-review', 'approval']
}));
