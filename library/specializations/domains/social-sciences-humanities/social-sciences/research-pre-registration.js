/**
 * @process social-sciences/research-pre-registration
 * @description Pre-register hypotheses, analysis plans, and study designs on Open Science Framework or discipline-specific registries to enhance transparency and reproducibility
 * @inputs { studyDesign: object, hypotheses: array, analysisPlan: object, outputDir: string }
 * @outputs { success: boolean, preregistration: object, registrationDocument: string, qualityScore: number, artifacts: array }
 * @recommendedSkills SK-SS-011 (academic-writing-publication), SK-SS-014 (research-ethics-irb)
 * @recommendedAgents AG-SS-001 (quantitative-research-methodologist), AG-SS-010 (research-ethics-coordinator)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    studyDesign = {},
    hypotheses = [],
    analysisPlan = {},
    outputDir = 'preregistration-output',
    registry = 'OSF'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Research Pre-Registration process');

  // ============================================================================
  // PHASE 1: STUDY INFORMATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Documenting study information');
  const studyInformation = await ctx.task(studyInformationTask, {
    studyDesign,
    outputDir
  });

  artifacts.push(...studyInformation.artifacts);

  // ============================================================================
  // PHASE 2: HYPOTHESES SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Specifying hypotheses');
  const hypothesesSpec = await ctx.task(hypothesesSpecificationTask, {
    hypotheses,
    studyDesign,
    outputDir
  });

  artifacts.push(...hypothesesSpec.artifacts);

  // ============================================================================
  // PHASE 3: DESIGN PLAN
  // ============================================================================

  ctx.log('info', 'Phase 3: Documenting design plan');
  const designPlan = await ctx.task(designPlanTask, {
    studyDesign,
    outputDir
  });

  artifacts.push(...designPlan.artifacts);

  // ============================================================================
  // PHASE 4: SAMPLING PLAN
  // ============================================================================

  ctx.log('info', 'Phase 4: Documenting sampling plan');
  const samplingPlan = await ctx.task(samplingPlanTask, {
    studyDesign,
    outputDir
  });

  artifacts.push(...samplingPlan.artifacts);

  // ============================================================================
  // PHASE 5: ANALYSIS PLAN
  // ============================================================================

  ctx.log('info', 'Phase 5: Documenting analysis plan');
  const analysisSpecification = await ctx.task(analysisSpecificationTask, {
    analysisPlan,
    hypotheses,
    outputDir
  });

  artifacts.push(...analysisSpecification.artifacts);

  // ============================================================================
  // PHASE 6: REGISTRATION DOCUMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating registration document');
  const registrationDocument = await ctx.task(registrationDocumentTask, {
    studyInformation,
    hypothesesSpec,
    designPlan,
    samplingPlan,
    analysisSpecification,
    registry,
    outputDir
  });

  artifacts.push(...registrationDocument.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Scoring pre-registration quality');
  const qualityScore = await ctx.task(preregistrationQualityScoringTask, {
    studyInformation,
    hypothesesSpec,
    designPlan,
    samplingPlan,
    analysisSpecification,
    registrationDocument,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const preregScore = qualityScore.overallScore;
  const qualityMet = preregScore >= 80;

  // Breakpoint: Review pre-registration
  await ctx.breakpoint({
    question: `Pre-registration complete. Quality score: ${preregScore}/100. ${qualityMet ? 'Pre-registration meets quality standards!' : 'Pre-registration may need refinement.'} Review and approve?`,
    title: 'Pre-Registration Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        preregScore,
        qualityMet,
        registry,
        hypothesesCount: hypothesesSpec.hypotheses.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore: preregScore,
    qualityMet,
    preregistration: {
      studyTitle: studyInformation.title,
      hypothesesCount: hypothesesSpec.hypotheses.length,
      registry
    },
    registrationDocument: registrationDocument.documentPath,
    artifacts,
    duration,
    metadata: {
      processId: 'social-sciences/research-pre-registration',
      timestamp: startTime,
      registry,
      outputDir
    }
  };
}

export const studyInformationTask = defineTask('study-information', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document study information',
  agent: {
    name: 'study-documentation-specialist',
    prompt: {
      role: 'open science specialist',
      task: 'Document basic study information for pre-registration',
      context: args,
      instructions: [
        'Create descriptive study title',
        'Write study description/abstract',
        'List research questions',
        'Document existing data or secondary data use',
        'Specify study timeline',
        'List authors and affiliations',
        'Document funding sources',
        'Generate study information section'
      ],
      outputFormat: 'JSON with title, description, researchQuestions, timeline, authors, funding, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['title', 'description', 'researchQuestions', 'artifacts'],
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        researchQuestions: { type: 'array', items: { type: 'string' } },
        existingData: { type: 'string' },
        timeline: { type: 'object' },
        authors: { type: 'array' },
        funding: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'preregistration', 'study-info']
}));

export const hypothesesSpecificationTask = defineTask('hypotheses-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify hypotheses',
  agent: {
    name: 'hypothesis-specialist',
    prompt: {
      role: 'research methodology specialist',
      task: 'Specify precise, testable hypotheses',
      context: args,
      instructions: [
        'State each hypothesis precisely',
        'Specify direction of predicted effects',
        'Distinguish confirmatory vs exploratory',
        'Link hypotheses to variables',
        'Specify what would falsify each hypothesis',
        'Order hypotheses by priority',
        'Document theoretical basis',
        'Generate hypotheses section'
      ],
      outputFormat: 'JSON with hypotheses, confirmatoryExploratory, operationalizations, falsificationCriteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hypotheses', 'artifacts'],
      properties: {
        hypotheses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesis: { type: 'string' },
              direction: { type: 'string' },
              type: { type: 'string' },
              variables: { type: 'object' }
            }
          }
        },
        confirmatoryExploratory: { type: 'object' },
        operationalizations: { type: 'object' },
        falsificationCriteria: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'preregistration', 'hypotheses']
}));

export const designPlanTask = defineTask('design-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document design plan',
  agent: {
    name: 'design-planner',
    prompt: {
      role: 'research design specialist',
      task: 'Document research design plan',
      context: args,
      instructions: [
        'Specify study type (experimental, observational)',
        'Describe design (between, within, mixed)',
        'Specify blinding procedures',
        'Describe randomization if applicable',
        'Document study conditions/groups',
        'List all measured variables',
        'Describe data collection procedures',
        'Generate design plan section'
      ],
      outputFormat: 'JSON with studyType, design, blinding, randomization, conditions, variables, procedures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['studyType', 'design', 'variables', 'artifacts'],
      properties: {
        studyType: { type: 'string' },
        design: { type: 'string' },
        blinding: { type: 'object' },
        randomization: { type: 'object' },
        conditions: { type: 'array' },
        variables: { type: 'object' },
        procedures: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'preregistration', 'design']
}));

export const samplingPlanTask = defineTask('sampling-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document sampling plan',
  agent: {
    name: 'sampling-planner',
    prompt: {
      role: 'sampling methodology specialist',
      task: 'Document sampling and sample size plan',
      context: args,
      instructions: [
        'Specify target population',
        'Describe sampling procedure',
        'Document eligibility criteria',
        'Report power analysis',
        'Specify target sample size with justification',
        'Document stopping rules',
        'Describe recruitment procedures',
        'Generate sampling plan section'
      ],
      outputFormat: 'JSON with population, procedure, eligibility, powerAnalysis, sampleSize, stoppingRules, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['population', 'sampleSize', 'powerAnalysis', 'artifacts'],
      properties: {
        population: { type: 'string' },
        procedure: { type: 'string' },
        eligibility: { type: 'object' },
        powerAnalysis: { type: 'object' },
        sampleSize: { type: 'number' },
        stoppingRules: { type: 'string' },
        recruitment: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'preregistration', 'sampling']
}));

export const analysisSpecificationTask = defineTask('analysis-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify analysis plan',
  agent: {
    name: 'analysis-planner',
    prompt: {
      role: 'statistical analysis specialist',
      task: 'Specify detailed analysis plan',
      context: args,
      instructions: [
        'Specify primary statistical tests',
        'Document model specifications',
        'Specify inference criteria (alpha level)',
        'Document data exclusion criteria',
        'Specify missing data handling',
        'Document data transformations',
        'Specify robustness checks',
        'Generate analysis plan section'
      ],
      outputFormat: 'JSON with statisticalTests, modelSpecs, inferenceCriteria, exclusionCriteria, missingData, transformations, robustness, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['statisticalTests', 'inferenceCriteria', 'artifacts'],
      properties: {
        statisticalTests: { type: 'array' },
        modelSpecs: { type: 'object' },
        inferenceCriteria: { type: 'object' },
        exclusionCriteria: { type: 'array', items: { type: 'string' } },
        missingData: { type: 'string' },
        transformations: { type: 'array', items: { type: 'string' } },
        robustness: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'preregistration', 'analysis']
}));

export const registrationDocumentTask = defineTask('registration-document', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create registration document',
  agent: {
    name: 'registration-document-creator',
    prompt: {
      role: 'pre-registration specialist',
      task: 'Create complete pre-registration document',
      context: args,
      instructions: [
        'Compile all sections into single document',
        'Format for target registry requirements',
        'Include all required fields',
        'Add timestamps and version',
        'Include supplementary materials references',
        'Create checklist verification',
        'Prepare for registry submission',
        'Generate final registration document'
      ],
      outputFormat: 'JSON with documentPath, sections, completeness, registryFormat, checklistVerified, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'completeness', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        completeness: { type: 'number' },
        registryFormat: { type: 'string' },
        checklistVerified: { type: 'boolean' },
        version: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'preregistration', 'document']
}));

export const preregistrationQualityScoringTask = defineTask('preregistration-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score pre-registration quality',
  agent: {
    name: 'preregistration-reviewer',
    prompt: {
      role: 'open science reviewer',
      task: 'Assess pre-registration quality',
      context: args,
      instructions: [
        'Evaluate study information completeness (weight: 10%)',
        'Assess hypotheses specificity (weight: 25%)',
        'Evaluate design plan detail (weight: 15%)',
        'Assess sampling plan rigor (weight: 15%)',
        'Evaluate analysis plan specificity (weight: 25%)',
        'Assess document completeness (weight: 10%)',
        'Calculate weighted overall score (0-100)',
        'Identify areas for improvement'
      ],
      outputFormat: 'JSON with overallScore, componentScores, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: { type: 'object' },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'preregistration', 'quality-scoring']
}));
