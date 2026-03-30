/**
 * @process education/accreditation-preparation
 * @description Systematic preparation for program accreditation including self-study, evidence collection, and continuous improvement documentation
 * @inputs { programName: string, accreditingBody: string, standards: array, timeline: object, context: object }
 * @outputs { success: boolean, selfStudy: object, evidencePortfolio: object, improvementPlan: object, artifacts: array }
 * @recommendedSkills SK-EDU-013 (quality-assurance-review), SK-EDU-015 (curriculum-gap-analysis), SK-EDU-009 (learning-analytics-interpretation)
 * @recommendedAgents AG-EDU-009 (quality-assurance-coordinator), AG-EDU-007 (learning-evaluation-analyst)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    programName = 'Academic Program',
    accreditingBody = '',
    standards = [],
    timeline = {},
    context = {},
    outputDir = 'accreditation-output',
    qualityThreshold = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Accreditation Preparation for ${programName}`);

  // ============================================================================
  // STANDARDS MAPPING
  // ============================================================================

  ctx.log('info', 'Mapping accreditation standards');
  const standardsMapping = await ctx.task(standardsMappingTask, {
    programName,
    accreditingBody,
    standards,
    outputDir
  });

  artifacts.push(...standardsMapping.artifacts);

  // ============================================================================
  // GAP ANALYSIS
  // ============================================================================

  ctx.log('info', 'Conducting compliance gap analysis');
  const gapAnalysis = await ctx.task(complianceGapAnalysisTask, {
    programName,
    standardsMapping: standardsMapping.mapping,
    context,
    outputDir
  });

  artifacts.push(...gapAnalysis.artifacts);

  // ============================================================================
  // EVIDENCE COLLECTION
  // ============================================================================

  ctx.log('info', 'Planning evidence collection');
  const evidenceCollection = await ctx.task(evidenceCollectionTask, {
    programName,
    standardsMapping: standardsMapping.mapping,
    gapAnalysis: gapAnalysis.analysis,
    outputDir
  });

  artifacts.push(...evidenceCollection.artifacts);

  // ============================================================================
  // SELF-STUDY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Developing self-study document');
  const selfStudy = await ctx.task(selfStudyDevelopmentTask, {
    programName,
    accreditingBody,
    standardsMapping: standardsMapping.mapping,
    evidenceCollection: evidenceCollection.plan,
    outputDir
  });

  artifacts.push(...selfStudy.artifacts);

  // ============================================================================
  // CONTINUOUS IMPROVEMENT
  // ============================================================================

  ctx.log('info', 'Creating continuous improvement plan');
  const improvementPlan = await ctx.task(continuousImprovementTask, {
    programName,
    gapAnalysis: gapAnalysis.analysis,
    context,
    outputDir
  });

  artifacts.push(...improvementPlan.artifacts);

  // ============================================================================
  // SITE VISIT PREPARATION
  // ============================================================================

  ctx.log('info', 'Preparing for site visit');
  const siteVisitPrep = await ctx.task(siteVisitPreparationTask, {
    programName,
    accreditingBody,
    selfStudy: selfStudy.document,
    timeline,
    outputDir
  });

  artifacts.push(...siteVisitPrep.artifacts);

  // ============================================================================
  // QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Scoring accreditation preparation quality');
  const qualityScore = await ctx.task(accreditationQualityScoringTask, {
    programName,
    standardsMapping,
    gapAnalysis,
    evidenceCollection,
    selfStudy,
    improvementPlan,
    qualityThreshold,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= qualityThreshold;

  // Breakpoint: Review accreditation preparation
  await ctx.breakpoint({
    question: `Accreditation preparation complete. Quality score: ${overallScore}/${qualityThreshold}. ${qualityMet ? 'Quality standards met!' : 'May need refinement.'} Review and approve?`,
    title: 'Accreditation Preparation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        overallScore,
        qualityMet,
        programName,
        accreditingBody,
        standardsCount: standards.length,
        gaps: gapAnalysis.analysis?.gaps?.length || 0,
        totalArtifacts: artifacts.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    programName,
    accreditingBody,
    qualityScore: overallScore,
    qualityMet,
    selfStudy: selfStudy.document,
    evidencePortfolio: evidenceCollection.portfolio,
    improvementPlan: improvementPlan.plan,
    siteVisitPreparation: siteVisitPrep.preparation,
    artifacts,
    duration,
    metadata: {
      processId: 'education/accreditation-preparation',
      timestamp: startTime,
      programName,
      accreditingBody,
      outputDir
    }
  };
}

// Task definitions
export const standardsMappingTask = defineTask('standards-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map accreditation standards',
  agent: {
    name: 'standards-mapper',
    prompt: {
      role: 'accreditation standards specialist',
      task: 'Map accreditation standards to program elements',
      context: args,
      instructions: [
        'Parse all accreditation standards',
        'Identify standard categories',
        'Map standards to program components',
        'Identify required evidence types',
        'Note standard weights/priorities',
        'Identify cross-cutting standards',
        'Create standards compliance matrix',
        'Generate standards mapping document'
      ],
      outputFormat: 'JSON with mapping, categories, evidence, matrix, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mapping', 'artifacts'],
      properties: {
        mapping: { type: 'array' },
        categories: { type: 'array' },
        evidence: { type: 'array' },
        matrix: { type: 'object' },
        crossCutting: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'accreditation', 'standards', 'mapping']
}));

export const complianceGapAnalysisTask = defineTask('compliance-gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct compliance gap analysis',
  agent: {
    name: 'gap-analyst',
    prompt: {
      role: 'accreditation compliance analyst',
      task: 'Analyze compliance gaps against standards',
      context: args,
      instructions: [
        'Assess current compliance status',
        'Identify full compliance areas',
        'Identify partial compliance areas',
        'Identify non-compliance areas',
        'Prioritize gaps by severity',
        'Identify quick wins',
        'Document gap root causes',
        'Generate gap analysis report'
      ],
      outputFormat: 'JSON with analysis, gaps, compliance, priorities, quickWins, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: { type: 'object' },
        gaps: { type: 'array' },
        compliance: { type: 'object' },
        priorities: { type: 'array' },
        quickWins: { type: 'array' },
        rootCauses: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'accreditation', 'gap-analysis', 'compliance']
}));

export const evidenceCollectionTask = defineTask('evidence-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan evidence collection',
  agent: {
    name: 'evidence-collector',
    prompt: {
      role: 'accreditation evidence specialist',
      task: 'Plan evidence collection for accreditation',
      context: args,
      instructions: [
        'Identify required evidence per standard',
        'Plan evidence collection timeline',
        'Identify evidence owners',
        'Design evidence organization system',
        'Plan evidence quality review',
        'Create evidence tracking system',
        'Design evidence portfolio structure',
        'Generate evidence collection plan'
      ],
      outputFormat: 'JSON with plan, portfolio, timeline, owners, tracking, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'portfolio', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        portfolio: { type: 'object' },
        timeline: { type: 'object' },
        owners: { type: 'array' },
        tracking: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'accreditation', 'evidence', 'collection']
}));

export const selfStudyDevelopmentTask = defineTask('self-study-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop self-study document',
  agent: {
    name: 'self-study-writer',
    prompt: {
      role: 'accreditation documentation specialist',
      task: 'Develop comprehensive self-study document',
      context: args,
      instructions: [
        'Create self-study outline',
        'Write executive summary',
        'Document program description',
        'Write standards-based narratives',
        'Integrate evidence references',
        'Document strengths and challenges',
        'Write reflection and analysis',
        'Generate self-study document'
      ],
      outputFormat: 'JSON with document, outline, narratives, reflections, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['document', 'artifacts'],
      properties: {
        document: { type: 'object' },
        outline: { type: 'array' },
        narratives: { type: 'array' },
        reflections: { type: 'object' },
        executiveSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'accreditation', 'self-study', 'documentation']
}));

export const continuousImprovementTask = defineTask('continuous-improvement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create continuous improvement plan',
  agent: {
    name: 'improvement-planner',
    prompt: {
      role: 'continuous improvement specialist',
      task: 'Create continuous improvement plan',
      context: args,
      instructions: [
        'Define improvement priorities',
        'Create action plans for gaps',
        'Define improvement metrics',
        'Plan assessment cycle',
        'Design feedback loop',
        'Plan stakeholder involvement',
        'Create monitoring system',
        'Generate continuous improvement document'
      ],
      outputFormat: 'JSON with plan, priorities, actions, metrics, monitoring, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        priorities: { type: 'array' },
        actions: { type: 'array' },
        metrics: { type: 'array' },
        monitoring: { type: 'object' },
        feedbackLoop: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'accreditation', 'improvement', 'planning']
}));

export const siteVisitPreparationTask = defineTask('site-visit-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare for site visit',
  agent: {
    name: 'site-visit-coordinator',
    prompt: {
      role: 'accreditation site visit coordinator',
      task: 'Prepare for accreditation site visit',
      context: args,
      instructions: [
        'Create site visit schedule',
        'Plan stakeholder interviews',
        'Prepare presentation materials',
        'Organize resource room',
        'Brief faculty and staff',
        'Prepare student representatives',
        'Create logistics plan',
        'Generate site visit preparation document'
      ],
      outputFormat: 'JSON with preparation, schedule, interviews, materials, briefings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['preparation', 'artifacts'],
      properties: {
        preparation: { type: 'object' },
        schedule: { type: 'object' },
        interviews: { type: 'array' },
        materials: { type: 'array' },
        briefings: { type: 'array' },
        logistics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'accreditation', 'site-visit', 'preparation']
}));

export const accreditationQualityScoringTask = defineTask('accreditation-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score accreditation preparation quality',
  agent: {
    name: 'accreditation-quality-auditor',
    prompt: {
      role: 'accreditation quality auditor',
      task: 'Assess accreditation preparation quality',
      context: args,
      instructions: [
        'Evaluate standards mapping completeness (weight: 20%)',
        'Assess gap analysis thoroughness (weight: 20%)',
        'Review evidence collection plan (weight: 20%)',
        'Evaluate self-study quality (weight: 25%)',
        'Assess improvement plan feasibility (weight: 15%)',
        'Calculate weighted overall score (0-100)',
        'Identify preparation issues',
        'Provide improvement recommendations'
      ],
      outputFormat: 'JSON with overallScore, componentScores, issues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'accreditation', 'quality-scoring', 'validation']
}));
