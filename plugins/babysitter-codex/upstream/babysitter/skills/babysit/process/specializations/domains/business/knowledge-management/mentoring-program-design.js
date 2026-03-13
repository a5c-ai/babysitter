/**
 * @process domains/business/knowledge-management/mentoring-program-design
 * @description Design structured mentoring programs that facilitate knowledge transfer between experienced practitioners and learners through guided relationships
 * @specialization Knowledge Management
 * @category Knowledge Sharing and Transfer
 * @inputs { programScope: object, targetAudience: object, mentoringGoals: array, organizationalContext: object, outputDir: string }
 * @outputs { success: boolean, programDesign: object, matchingCriteria: object, curriculumFramework: object, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    programScope = {},
    targetAudience = {},
    mentoringGoals = [],
    organizationalContext = {},
    existingPrograms = [],
    resourceAllocation = {},
    mentoringModels = ['one-on-one', 'group', 'peer', 'reverse'],
    outputDir = 'mentoring-program-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Mentoring Program Design and Implementation Process');

  // ============================================================================
  // PHASE 1: NEEDS ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing mentoring program needs');
  const needsAssessment = await ctx.task(needsAssessmentTask, {
    programScope,
    targetAudience,
    mentoringGoals,
    existingPrograms,
    organizationalContext,
    outputDir
  });

  artifacts.push(...needsAssessment.artifacts);

  // Breakpoint: Review needs assessment
  await ctx.breakpoint({
    question: `Identified ${needsAssessment.knowledgeGaps.length} knowledge gaps for mentoring. Review assessment?`,
    title: 'Needs Assessment Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        knowledgeGaps: needsAssessment.knowledgeGaps.length,
        targetMentees: needsAssessment.targetMenteeCount,
        availableMentors: needsAssessment.potentialMentorCount
      }
    }
  });

  // ============================================================================
  // PHASE 2: PROGRAM STRUCTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing program structure');
  const programStructure = await ctx.task(programStructureTask, {
    needsAssessment,
    mentoringModels,
    resourceAllocation,
    organizationalContext,
    outputDir
  });

  artifacts.push(...programStructure.artifacts);

  // ============================================================================
  // PHASE 3: MATCHING CRITERIA DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing mentor-mentee matching criteria');
  const matchingCriteria = await ctx.task(matchingCriteriaTask, {
    programStructure: programStructure.structure,
    targetAudience,
    mentoringGoals,
    outputDir
  });

  artifacts.push(...matchingCriteria.artifacts);

  // ============================================================================
  // PHASE 4: CURRICULUM AND ACTIVITIES DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing curriculum and activities');
  const curriculumDesign = await ctx.task(curriculumDesignTask, {
    mentoringGoals,
    knowledgeGaps: needsAssessment.knowledgeGaps,
    programStructure: programStructure.structure,
    outputDir
  });

  artifacts.push(...curriculumDesign.artifacts);

  // Breakpoint: Review curriculum
  await ctx.breakpoint({
    question: `Curriculum designed with ${curriculumDesign.activities.length} activities. Review?`,
    title: 'Curriculum Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        totalActivities: curriculumDesign.activities.length,
        milestones: curriculumDesign.milestones.length
      }
    }
  });

  // ============================================================================
  // PHASE 5: TRAINING MATERIALS DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Developing training materials');
  const trainingMaterials = await ctx.task(trainingMaterialsTask, {
    programStructure: programStructure.structure,
    curriculum: curriculumDesign.curriculum,
    outputDir
  });

  artifacts.push(...trainingMaterials.artifacts);

  // ============================================================================
  // PHASE 6: GOVERNANCE AND SUPPORT FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 6: Designing governance and support');
  const governanceSupport = await ctx.task(governanceSupportTask, {
    programStructure: programStructure.structure,
    organizationalContext,
    outputDir
  });

  artifacts.push(...governanceSupport.artifacts);

  // ============================================================================
  // PHASE 7: EVALUATION FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 7: Designing evaluation framework');
  const evaluationFramework = await ctx.task(evaluationFrameworkTask, {
    mentoringGoals,
    programStructure: programStructure.structure,
    outputDir
  });

  artifacts.push(...evaluationFramework.artifacts);

  // ============================================================================
  // PHASE 8: IMPLEMENTATION PLAN
  // ============================================================================

  ctx.log('info', 'Phase 8: Developing implementation plan');
  const implementationPlan = await ctx.task(implementationPlanTask, {
    programStructure: programStructure.structure,
    curriculum: curriculumDesign.curriculum,
    trainingMaterials: trainingMaterials.materials,
    resourceAllocation,
    outputDir
  });

  artifacts.push(...implementationPlan.artifacts);

  // ============================================================================
  // PHASE 9: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 9: Assessing program design quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, {
    needsAssessment,
    programStructure,
    matchingCriteria,
    curriculumDesign,
    evaluationFramework,
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
      programDesign: programStructure.structure,
      matchingCriteria: matchingCriteria.criteria,
      curriculum: curriculumDesign.curriculum,
      implementationPlan: implementationPlan.plan,
      qualityScore: qualityAssessment.overallScore,
      outputDir
    });

    artifacts.push(...reviewResult.artifacts);

    await ctx.breakpoint({
      question: `Stakeholder review complete. ${reviewResult.approved ? 'Approved!' : 'Requires revisions.'} Finalize program design?`,
      title: 'Final Approval Gate',
      context: {
        runId: ctx.runId,
        files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
        summary: { approved: reviewResult.approved, qualityScore: qualityAssessment.overallScore }
      }
    });
  }

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    programDesign: programStructure.structure,
    matchingCriteria: matchingCriteria.criteria,
    curriculumFramework: curriculumDesign.curriculum,
    trainingMaterials: trainingMaterials.materials,
    evaluationFramework: evaluationFramework.framework,
    implementationPlan: implementationPlan.plan,
    statistics: {
      activitiesDesigned: curriculumDesign.activities.length,
      milestonesPlanned: curriculumDesign.milestones.length,
      materialsCreated: trainingMaterials.materials.length
    },
    qualityScore: qualityAssessment.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/business/knowledge-management/mentoring-program-design',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const needsAssessmentTask = defineTask('needs-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess mentoring program needs',
  agent: {
    name: 'needs-analyst',
    prompt: {
      role: 'mentoring program needs analyst',
      task: 'Assess organizational needs for mentoring program',
      context: args,
      instructions: [
        'Assess mentoring needs:',
        '  - Knowledge gaps to address',
        '  - Target mentee population',
        '  - Available mentor pool',
        '  - Organizational readiness',
        'Identify success factors',
        'Save assessment to output directory'
      ],
      outputFormat: 'JSON with knowledgeGaps (array), targetMenteeCount (number), potentialMentorCount (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['knowledgeGaps', 'artifacts'],
      properties: {
        knowledgeGaps: { type: 'array' },
        targetMenteeCount: { type: 'number' },
        potentialMentorCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'mentoring', 'assessment']
}));

export const programStructureTask = defineTask('program-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design program structure',
  agent: {
    name: 'program-designer',
    prompt: {
      role: 'mentoring program structure designer',
      task: 'Design mentoring program structure',
      context: args,
      instructions: ['Design program structure including duration, format, and phases', 'Save to output directory'],
      outputFormat: 'JSON with structure (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['structure', 'artifacts'], properties: { structure: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'mentoring', 'structure']
}));

export const matchingCriteriaTask = defineTask('matching-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop matching criteria',
  agent: {
    name: 'matching-specialist',
    prompt: {
      role: 'mentor-mentee matching specialist',
      task: 'Develop criteria for matching mentors and mentees',
      context: args,
      instructions: ['Define matching criteria and algorithm', 'Save to output directory'],
      outputFormat: 'JSON with criteria (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['criteria', 'artifacts'], properties: { criteria: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'mentoring', 'matching']
}));

export const curriculumDesignTask = defineTask('curriculum-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design curriculum and activities',
  agent: {
    name: 'curriculum-designer',
    prompt: {
      role: 'mentoring curriculum designer',
      task: 'Design curriculum and learning activities',
      context: args,
      instructions: ['Design learning activities and milestones', 'Save to output directory'],
      outputFormat: 'JSON with curriculum (object), activities (array), milestones (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['curriculum', 'activities', 'milestones', 'artifacts'], properties: { curriculum: { type: 'object' }, activities: { type: 'array' }, milestones: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'mentoring', 'curriculum']
}));

export const trainingMaterialsTask = defineTask('training-materials', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop training materials',
  agent: {
    name: 'materials-developer',
    prompt: {
      role: 'training materials developer',
      task: 'Develop mentor and mentee training materials',
      context: args,
      instructions: ['Create training materials for program', 'Save to output directory'],
      outputFormat: 'JSON with materials (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['materials', 'artifacts'], properties: { materials: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'mentoring', 'training']
}));

export const governanceSupportTask = defineTask('governance-support', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design governance and support',
  agent: {
    name: 'governance-designer',
    prompt: {
      role: 'program governance designer',
      task: 'Design governance and support framework',
      context: args,
      instructions: ['Define governance structure and support mechanisms', 'Save to output directory'],
      outputFormat: 'JSON with governance (object), support (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['governance', 'artifacts'], properties: { governance: { type: 'object' }, support: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'mentoring', 'governance']
}));

export const evaluationFrameworkTask = defineTask('evaluation-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design evaluation framework',
  agent: {
    name: 'evaluation-designer',
    prompt: {
      role: 'program evaluation designer',
      task: 'Design evaluation framework',
      context: args,
      instructions: ['Define metrics and evaluation methods', 'Save to output directory'],
      outputFormat: 'JSON with framework (object), metrics (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['framework', 'artifacts'], properties: { framework: { type: 'object' }, metrics: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'mentoring', 'evaluation']
}));

export const implementationPlanTask = defineTask('implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop implementation plan',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'program implementation planner',
      task: 'Develop implementation plan',
      context: args,
      instructions: ['Create rollout timeline and resource plan', 'Save to output directory'],
      outputFormat: 'JSON with plan (object), timeline (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, timeline: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'mentoring', 'implementation']
}));

export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess program design quality',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'program design quality assessor',
      task: 'Evaluate quality of program design',
      context: args,
      instructions: ['Assess design quality', 'Save to output directory'],
      outputFormat: 'JSON with overallScore (number 0-100), artifacts'
    },
    outputSchema: { type: 'object', required: ['overallScore', 'artifacts'], properties: { overallScore: { type: 'number', minimum: 0, maximum: 100 }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'quality', 'assessment']
}));

export const stakeholderReviewTask = defineTask('stakeholder-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct stakeholder review',
  agent: {
    name: 'project-manager',
    prompt: {
      role: 'project manager facilitating review',
      task: 'Coordinate stakeholder review',
      context: args,
      instructions: ['Present program design for approval', 'Save to output directory'],
      outputFormat: 'JSON with approved (boolean), stakeholders (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['approved', 'stakeholders', 'artifacts'], properties: { approved: { type: 'boolean' }, stakeholders: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'stakeholder-review', 'approval']
}));
