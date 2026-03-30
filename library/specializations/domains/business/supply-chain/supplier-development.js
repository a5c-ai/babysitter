/**
 * @process specializations/domains/business/supply-chain/supplier-development
 * @description Supplier Development Program - Design and execute supplier capability improvement initiatives
 * including joint process improvement, technology adoption, and performance enhancement programs.
 * @inputs { supplier?: string, developmentAreas?: array, currentCapabilities?: object, targetCapabilities?: object }
 * @outputs { success: boolean, developmentPlan: object, milestones: array, progressMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/supply-chain/supplier-development', {
 *   supplier: 'Acme Manufacturing',
 *   developmentAreas: ['quality', 'delivery', 'technology'],
 *   currentCapabilities: { quality: 3, delivery: 2 },
 *   targetCapabilities: { quality: 5, delivery: 4 }
 * });
 *
 * @references
 * - Vested Outsourcing: https://haslam.utk.edu/faculty/kate-vitasek
 * - Supplier Development Best Practices: https://www.mckinsey.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    supplier = '',
    developmentAreas = [],
    currentCapabilities = {},
    targetCapabilities = {},
    investmentBudget = 0,
    timeline = '12-months',
    outputDir = 'supplier-development-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Supplier Development Program for: ${supplier}`);

  // ============================================================================
  // PHASE 1: CAPABILITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing current capabilities');

  const capabilityAssessment = await ctx.task(capabilityAssessmentTask, {
    supplier,
    currentCapabilities,
    developmentAreas,
    outputDir
  });

  artifacts.push(...capabilityAssessment.artifacts);

  // ============================================================================
  // PHASE 2: GAP ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing capability gaps');

  const gapAnalysis = await ctx.task(capabilityGapAnalysisTask, {
    supplier,
    capabilityAssessment,
    targetCapabilities,
    outputDir
  });

  artifacts.push(...gapAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: DEVELOPMENT STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing improvement strategy');

  const developmentStrategy = await ctx.task(developmentStrategyTask, {
    supplier,
    gapAnalysis,
    investmentBudget,
    timeline,
    outputDir
  });

  artifacts.push(...developmentStrategy.artifacts);

  // Breakpoint: Review development strategy
  await ctx.breakpoint({
    question: `Development strategy created for ${supplier}. ${developmentStrategy.initiatives.length} initiatives identified. Investment: $${developmentStrategy.totalInvestment}. Review strategy?`,
    title: 'Supplier Development Strategy Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        supplier,
        initiatives: developmentStrategy.initiatives.length,
        totalInvestment: developmentStrategy.totalInvestment,
        expectedROI: developmentStrategy.expectedROI
      }
    }
  });

  // ============================================================================
  // PHASE 4: JOINT IMPROVEMENT PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 4: Planning joint improvement projects');

  const jointImprovement = await ctx.task(jointImprovementTask, {
    supplier,
    developmentStrategy,
    outputDir
  });

  artifacts.push(...jointImprovement.artifacts);

  // ============================================================================
  // PHASE 5: TECHNOLOGY ADOPTION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 5: Planning technology adoption');

  const technologyAdoption = await ctx.task(technologyAdoptionTask, {
    supplier,
    developmentStrategy,
    developmentAreas,
    outputDir
  });

  artifacts.push(...technologyAdoption.artifacts);

  // ============================================================================
  // PHASE 6: TRAINING AND KNOWLEDGE TRANSFER
  // ============================================================================

  ctx.log('info', 'Phase 6: Planning training and knowledge transfer');

  const trainingPlan = await ctx.task(trainingKnowledgeTransferTask, {
    supplier,
    developmentStrategy,
    jointImprovement,
    outputDir
  });

  artifacts.push(...trainingPlan.artifacts);

  // ============================================================================
  // PHASE 7: MILESTONE AND KPI DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 7: Defining milestones and KPIs');

  const milestonesKpis = await ctx.task(milestonesKpisTask, {
    supplier,
    developmentStrategy,
    jointImprovement,
    technologyAdoption,
    trainingPlan,
    timeline,
    outputDir
  });

  artifacts.push(...milestonesKpis.artifacts);

  // ============================================================================
  // PHASE 8: GOVERNANCE STRUCTURE
  // ============================================================================

  ctx.log('info', 'Phase 8: Establishing governance structure');

  const governance = await ctx.task(governanceStructureTask, {
    supplier,
    developmentStrategy,
    milestonesKpis,
    outputDir
  });

  artifacts.push(...governance.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    developmentPlan: {
      supplier,
      strategy: developmentStrategy.strategy,
      initiatives: developmentStrategy.initiatives,
      totalInvestment: developmentStrategy.totalInvestment,
      expectedROI: developmentStrategy.expectedROI
    },
    jointProjects: jointImprovement.projects,
    technologyRoadmap: technologyAdoption.roadmap,
    trainingPrograms: trainingPlan.programs,
    milestones: milestonesKpis.milestones,
    progressMetrics: milestonesKpis.kpis,
    governance: governance.structure,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/supply-chain/supplier-development',
      timestamp: startTime,
      supplier,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const capabilityAssessmentTask = defineTask('capability-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Capability Assessment',
  agent: {
    name: 'capability-assessor',
    prompt: {
      role: 'Supplier Capability Assessor',
      task: 'Assess current supplier capabilities',
      context: args,
      instructions: [
        '1. Evaluate quality management capabilities',
        '2. Assess manufacturing/service capabilities',
        '3. Evaluate technology capabilities',
        '4. Assess supply chain capabilities',
        '5. Evaluate financial capabilities',
        '6. Assess human resource capabilities',
        '7. Score capabilities against maturity model',
        '8. Document capability assessment'
      ],
      outputFormat: 'JSON with capability assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['capabilities', 'maturityScores', 'artifacts'],
      properties: {
        capabilities: { type: 'object' },
        maturityScores: { type: 'object' },
        strengths: { type: 'array' },
        weaknesses: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'supplier-development', 'assessment']
}));

export const capabilityGapAnalysisTask = defineTask('capability-gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Capability Gap Analysis',
  agent: {
    name: 'gap-analyst',
    prompt: {
      role: 'Capability Gap Analyst',
      task: 'Analyze gaps between current and target capabilities',
      context: args,
      instructions: [
        '1. Compare current vs. target capabilities',
        '2. Quantify capability gaps',
        '3. Prioritize gaps by business impact',
        '4. Identify root causes of gaps',
        '5. Assess effort to close gaps',
        '6. Determine quick wins vs. long-term',
        '7. Create gap closure roadmap',
        '8. Document gap analysis'
      ],
      outputFormat: 'JSON with gap analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'priorities', 'artifacts'],
      properties: {
        gaps: { type: 'array' },
        priorities: { type: 'object' },
        rootCauses: { type: 'object' },
        quickWins: { type: 'array' },
        longTermItems: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'supplier-development', 'gap-analysis']
}));

export const developmentStrategyTask = defineTask('development-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Development Strategy',
  agent: {
    name: 'development-strategist',
    prompt: {
      role: 'Supplier Development Strategist',
      task: 'Develop supplier improvement strategy',
      context: args,
      instructions: [
        '1. Define development objectives',
        '2. Identify improvement initiatives',
        '3. Estimate investment requirements',
        '4. Calculate expected ROI',
        '5. Define resource requirements',
        '6. Create phased approach',
        '7. Identify risks and mitigation',
        '8. Document development strategy'
      ],
      outputFormat: 'JSON with development strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'initiatives', 'totalInvestment', 'expectedROI', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        initiatives: { type: 'array' },
        totalInvestment: { type: 'number' },
        expectedROI: { type: 'number' },
        resources: { type: 'object' },
        risks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'supplier-development', 'strategy']
}));

export const jointImprovementTask = defineTask('joint-improvement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Joint Improvement Planning',
  agent: {
    name: 'improvement-planner',
    prompt: {
      role: 'Joint Process Improvement Specialist',
      task: 'Plan joint improvement projects with supplier',
      context: args,
      instructions: [
        '1. Identify joint improvement opportunities',
        '2. Apply lean/six sigma methodologies',
        '3. Define project scope and objectives',
        '4. Assign joint project teams',
        '5. Define success metrics',
        '6. Create project timelines',
        '7. Establish review cadence',
        '8. Document improvement projects'
      ],
      outputFormat: 'JSON with joint improvement projects'
    },
    outputSchema: {
      type: 'object',
      required: ['projects', 'teams', 'artifacts'],
      properties: {
        projects: { type: 'array' },
        teams: { type: 'object' },
        methodologies: { type: 'array' },
        successMetrics: { type: 'object' },
        reviewCadence: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'supplier-development', 'improvement']
}));

export const technologyAdoptionTask = defineTask('technology-adoption', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Technology Adoption Planning',
  agent: {
    name: 'technology-advisor',
    prompt: {
      role: 'Technology Adoption Specialist',
      task: 'Plan technology adoption for supplier',
      context: args,
      instructions: [
        '1. Identify technology gaps',
        '2. Recommend technology solutions',
        '3. Plan system integrations',
        '4. Define implementation approach',
        '5. Estimate technology investment',
        '6. Create technology roadmap',
        '7. Plan change management',
        '8. Document technology plan'
      ],
      outputFormat: 'JSON with technology adoption plan'
    },
    outputSchema: {
      type: 'object',
      required: ['roadmap', 'recommendations', 'artifacts'],
      properties: {
        roadmap: { type: 'object' },
        recommendations: { type: 'array' },
        integrations: { type: 'array' },
        investment: { type: 'number' },
        changeManagement: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'supplier-development', 'technology']
}));

export const trainingKnowledgeTransferTask = defineTask('training-knowledge-transfer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Training and Knowledge Transfer',
  agent: {
    name: 'training-planner',
    prompt: {
      role: 'Training and Development Specialist',
      task: 'Plan training and knowledge transfer programs',
      context: args,
      instructions: [
        '1. Identify skill gaps',
        '2. Design training programs',
        '3. Plan on-site training sessions',
        '4. Develop knowledge transfer protocols',
        '5. Create training materials',
        '6. Define certification requirements',
        '7. Plan mentoring arrangements',
        '8. Document training plan'
      ],
      outputFormat: 'JSON with training plan'
    },
    outputSchema: {
      type: 'object',
      required: ['programs', 'schedule', 'artifacts'],
      properties: {
        programs: { type: 'array' },
        schedule: { type: 'object' },
        materials: { type: 'array' },
        certifications: { type: 'array' },
        mentoringPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'supplier-development', 'training']
}));

export const milestonesKpisTask = defineTask('milestones-kpis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Milestones and KPIs',
  agent: {
    name: 'metrics-planner',
    prompt: {
      role: 'Performance Metrics Specialist',
      task: 'Define milestones and KPIs for development program',
      context: args,
      instructions: [
        '1. Define program milestones',
        '2. Set milestone dates',
        '3. Define KPIs for each initiative',
        '4. Set baseline measurements',
        '5. Define target improvements',
        '6. Create progress tracking dashboard',
        '7. Define review checkpoints',
        '8. Document milestones and KPIs'
      ],
      outputFormat: 'JSON with milestones and KPIs'
    },
    outputSchema: {
      type: 'object',
      required: ['milestones', 'kpis', 'artifacts'],
      properties: {
        milestones: { type: 'array' },
        kpis: { type: 'array' },
        baselines: { type: 'object' },
        targets: { type: 'object' },
        dashboardConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'supplier-development', 'kpis']
}));

export const governanceStructureTask = defineTask('governance-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Governance Structure',
  agent: {
    name: 'governance-planner',
    prompt: {
      role: 'Program Governance Specialist',
      task: 'Establish governance structure for development program',
      context: args,
      instructions: [
        '1. Define steering committee structure',
        '2. Establish review meeting cadence',
        '3. Define escalation procedures',
        '4. Create communication plan',
        '5. Define decision-making authority',
        '6. Establish reporting requirements',
        '7. Define change management process',
        '8. Document governance structure'
      ],
      outputFormat: 'JSON with governance structure'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'meetingCadence', 'artifacts'],
      properties: {
        structure: { type: 'object' },
        steeringCommittee: { type: 'array' },
        meetingCadence: { type: 'object' },
        escalationProcedures: { type: 'object' },
        communicationPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'supplier-development', 'governance']
}));
