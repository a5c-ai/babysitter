/**
 * @process specializations/domains/social-sciences-humanities/healthcare/clinical-pathway-development
 * @description Clinical Pathway Development - Evidence-based multidisciplinary management plans that display
 * goals for patients and provide sequenced interventions for specific diagnoses or procedures.
 * @inputs { condition: string, patientPopulation?: string, currentPractice?: object, evidenceBase?: array }
 * @outputs { success: boolean, pathway: object, orderSets: array, metrics: object, artifacts: array }
 * @recommendedSkills SK-HC-001 (clinical-workflow-analysis), SK-HC-009 (population-health-stratification), SK-HC-014 (clinical-decision-support-rules)
 * @recommendedAgents AG-HC-001 (quality-improvement-orchestrator), AG-HC-005 (clinical-informatics-specialist)
 *
 * @example
 * const result = await orchestrate('specializations/domains/social-sciences-humanities/healthcare/clinical-pathway-development', {
 *   condition: 'Total Hip Replacement',
 *   patientPopulation: 'Elective primary total hip arthroplasty patients',
 *   currentPractice: { los: 3.5, complications: 0.08 },
 *   evidenceBase: ['ERAS protocols', 'joint commission standards']
 * });
 *
 * @references
 * - Rotter, T. et al. (2010). Clinical pathways: effects on professional practice
 * - De Bleser, L. et al. (2006). Defining pathways
 * - Kinsman, L. et al. (2010). What is a clinical pathway?
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    condition,
    patientPopulation = '',
    currentPractice = {},
    evidenceBase = [],
    stakeholders = [],
    timeline = null,
    outputDir = 'clinical-pathway-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Clinical Pathway Development for: ${condition}`);

  // Phase 1: Literature Review and Evidence Synthesis
  ctx.log('info', 'Phase 1: Evidence Review and Synthesis');
  const evidenceReview = await ctx.task(evidenceReviewTask, {
    condition,
    patientPopulation,
    evidenceBase,
    outputDir
  });

  artifacts.push(...evidenceReview.artifacts);

  await ctx.breakpoint({
    question: `Evidence review complete. ${evidenceReview.guidelines.length} guidelines reviewed. Evidence grade: ${evidenceReview.overallEvidenceGrade}. Proceed with current practice analysis?`,
    title: 'Evidence Review Gate',
    context: {
      runId: ctx.runId,
      condition,
      guidelines: evidenceReview.guidelines,
      recommendations: evidenceReview.recommendations,
      files: evidenceReview.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 2: Current Practice Analysis
  ctx.log('info', 'Phase 2: Current Practice Analysis');
  const practiceAnalysis = await ctx.task(currentPracticeAnalysisTask, {
    condition,
    currentPractice,
    evidenceReview,
    outputDir
  });

  artifacts.push(...practiceAnalysis.artifacts);

  // Phase 3: Stakeholder Engagement
  ctx.log('info', 'Phase 3: Stakeholder Engagement');
  const stakeholderInput = await ctx.task(stakeholderEngagementTask, {
    condition,
    evidenceReview,
    practiceAnalysis,
    stakeholders,
    outputDir
  });

  artifacts.push(...stakeholderInput.artifacts);

  await ctx.breakpoint({
    question: `Stakeholder input gathered. ${stakeholderInput.consensusAreas.length} consensus areas. ${stakeholderInput.controversies.length} areas needing resolution. Proceed with pathway design?`,
    title: 'Stakeholder Input Review',
    context: {
      runId: ctx.runId,
      consensusAreas: stakeholderInput.consensusAreas,
      controversies: stakeholderInput.controversies,
      files: stakeholderInput.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 4: Pathway Structure Design
  ctx.log('info', 'Phase 4: Pathway Structure Design');
  const pathwayStructure = await ctx.task(pathwayStructureDesignTask, {
    condition,
    evidenceReview,
    practiceAnalysis,
    stakeholderInput,
    outputDir
  });

  artifacts.push(...pathwayStructure.artifacts);

  // Phase 5: Intervention Sequencing
  ctx.log('info', 'Phase 5: Intervention Sequencing');
  const interventionSequence = await ctx.task(interventionSequencingTask, {
    pathwayStructure,
    evidenceReview,
    outputDir
  });

  artifacts.push(...interventionSequence.artifacts);

  // Phase 6: Order Set Development
  ctx.log('info', 'Phase 6: Order Set Development');
  const orderSets = await ctx.task(orderSetDevelopmentTask, {
    pathwayStructure,
    interventionSequence,
    outputDir
  });

  artifacts.push(...orderSets.artifacts);

  await ctx.breakpoint({
    question: `Pathway designed with ${interventionSequence.phases.length} phases and ${orderSets.sets.length} order sets. Proceed with variance tracking design?`,
    title: 'Pathway Design Review',
    context: {
      runId: ctx.runId,
      phases: interventionSequence.phases,
      orderSets: orderSets.sets,
      files: [...interventionSequence.artifacts, ...orderSets.artifacts].map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 7: Variance Tracking Design
  ctx.log('info', 'Phase 7: Variance Tracking Design');
  const varianceTracking = await ctx.task(varianceTrackingTask, {
    pathwayStructure,
    interventionSequence,
    outputDir
  });

  artifacts.push(...varianceTracking.artifacts);

  // Phase 8: Outcome Metrics Definition
  ctx.log('info', 'Phase 8: Outcome Metrics Definition');
  const outcomeMetrics = await ctx.task(outcomeMetricsTask, {
    condition,
    pathwayStructure,
    currentPractice,
    outputDir
  });

  artifacts.push(...outcomeMetrics.artifacts);

  // Phase 9: Implementation Planning
  ctx.log('info', 'Phase 9: Implementation Planning');
  const implementationPlan = await ctx.task(pathwayImplementationTask, {
    pathwayStructure,
    orderSets,
    varianceTracking,
    outcomeMetrics,
    timeline,
    outputDir
  });

  artifacts.push(...implementationPlan.artifacts);

  // Phase 10: Final Pathway Documentation
  ctx.log('info', 'Phase 10: Final Pathway Documentation');
  const documentation = await ctx.task(pathwayDocumentationTask, {
    condition,
    patientPopulation,
    evidenceReview,
    pathwayStructure,
    interventionSequence,
    orderSets,
    varianceTracking,
    outcomeMetrics,
    implementationPlan,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    condition,
    patientPopulation,
    pathway: {
      structure: pathwayStructure.structure,
      phases: interventionSequence.phases,
      interventions: interventionSequence.interventions,
      decisionPoints: pathwayStructure.decisionPoints,
      expectedOutcomes: pathwayStructure.expectedOutcomes
    },
    orderSets: orderSets.sets,
    varianceTracking: varianceTracking.trackingSystem,
    metrics: {
      outcomeMetrics: outcomeMetrics.metrics,
      targets: outcomeMetrics.targets,
      benchmarks: outcomeMetrics.benchmarks
    },
    evidenceSummary: evidenceReview.summary,
    implementationPlan: implementationPlan.plan,
    artifacts,
    documentationPath: documentation.documentPath,
    duration,
    metadata: {
      processId: 'specializations/domains/social-sciences-humanities/healthcare/clinical-pathway-development',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Evidence Review
export const evidenceReviewTask = defineTask('cpd-evidence-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Evidence Review - ${args.condition}`,
  agent: {
    name: 'clinical-evidence-specialist',
    prompt: {
      role: 'Clinical Evidence Specialist',
      task: 'Conduct comprehensive evidence review for clinical pathway',
      context: args,
      instructions: [
        '1. Search and retrieve clinical practice guidelines',
        '2. Review systematic reviews and meta-analyses',
        '3. Evaluate randomized controlled trials',
        '4. Assess evidence quality using GRADE',
        '5. Synthesize key recommendations',
        '6. Identify evidence gaps',
        '7. Note conflicting evidence',
        '8. Summarize best practices',
        '9. Document evidence levels for interventions',
        '10. Create evidence summary table'
      ],
      outputFormat: 'JSON with evidence review results'
    },
    outputSchema: {
      type: 'object',
      required: ['guidelines', 'recommendations', 'overallEvidenceGrade', 'summary', 'artifacts'],
      properties: {
        guidelines: { type: 'array', items: { type: 'object' } },
        systematicReviews: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'object' } },
        overallEvidenceGrade: { type: 'string' },
        evidenceGaps: { type: 'array', items: { type: 'string' } },
        conflicts: { type: 'array', items: { type: 'object' } },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clinical-pathway', 'evidence', 'healthcare']
}));

// Task 2: Current Practice Analysis
export const currentPracticeAnalysisTask = defineTask('cpd-practice-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Current Practice Analysis',
  agent: {
    name: 'quality-analyst',
    prompt: {
      role: 'Healthcare Quality Analyst',
      task: 'Analyze current clinical practice patterns',
      context: args,
      instructions: [
        '1. Review current treatment protocols',
        '2. Analyze utilization data',
        '3. Review outcomes data',
        '4. Identify practice variation',
        '5. Compare to evidence-based standards',
        '6. Calculate gap analysis',
        '7. Identify overuse/underuse',
        '8. Document current process flow',
        '9. Identify improvement opportunities',
        '10. Benchmark against peer institutions'
      ],
      outputFormat: 'JSON with practice analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['currentProcesses', 'variations', 'gaps', 'artifacts'],
      properties: {
        currentProcesses: { type: 'array', items: { type: 'object' } },
        variations: { type: 'array', items: { type: 'object' } },
        outcomes: { type: 'object' },
        gaps: { type: 'array', items: { type: 'object' } },
        benchmarks: { type: 'object' },
        opportunities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clinical-pathway', 'practice-analysis', 'healthcare']
}));

// Task 3: Stakeholder Engagement
export const stakeholderEngagementTask = defineTask('cpd-stakeholders', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Clinical Pathway Stakeholder Engagement',
  agent: {
    name: 'clinical-facilitator',
    prompt: {
      role: 'Clinical Pathway Facilitator',
      task: 'Gather and synthesize stakeholder input',
      context: args,
      instructions: [
        '1. Identify key stakeholder groups',
        '2. Conduct physician champion engagement',
        '3. Gather nursing input',
        '4. Include ancillary services',
        '5. Incorporate patient perspective',
        '6. Identify consensus areas',
        '7. Document controversies',
        '8. Facilitate consensus building',
        '9. Address resistance concerns',
        '10. Document final agreements'
      ],
      outputFormat: 'JSON with stakeholder input'
    },
    outputSchema: {
      type: 'object',
      required: ['consensusAreas', 'controversies', 'agreements', 'artifacts'],
      properties: {
        stakeholders: { type: 'array', items: { type: 'object' } },
        consensusAreas: { type: 'array', items: { type: 'object' } },
        controversies: { type: 'array', items: { type: 'object' } },
        agreements: { type: 'array', items: { type: 'object' } },
        patientInput: { type: 'object' },
        resistanceConcerns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clinical-pathway', 'stakeholders', 'healthcare']
}));

// Task 4: Pathway Structure Design
export const pathwayStructureDesignTask = defineTask('cpd-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Clinical Pathway Structure Design',
  agent: {
    name: 'pathway-architect',
    prompt: {
      role: 'Clinical Pathway Architect',
      task: 'Design clinical pathway structure',
      context: args,
      instructions: [
        '1. Define pathway phases/timeframes',
        '2. Identify inclusion/exclusion criteria',
        '3. Define entry and exit points',
        '4. Create decision points and branches',
        '5. Define expected length of stay',
        '6. Establish daily goals',
        '7. Define milestones and checkpoints',
        '8. Create expected outcomes per phase',
        '9. Design pathway visualization',
        '10. Document assumptions and constraints'
      ],
      outputFormat: 'JSON with pathway structure'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'phases', 'decisionPoints', 'expectedOutcomes', 'artifacts'],
      properties: {
        structure: { type: 'object' },
        phases: { type: 'array', items: { type: 'object' } },
        inclusionCriteria: { type: 'array', items: { type: 'string' } },
        exclusionCriteria: { type: 'array', items: { type: 'string' } },
        decisionPoints: { type: 'array', items: { type: 'object' } },
        dailyGoals: { type: 'object' },
        milestones: { type: 'array', items: { type: 'object' } },
        expectedOutcomes: { type: 'object' },
        expectedLOS: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clinical-pathway', 'structure', 'design']
}));

// Task 5: Intervention Sequencing
export const interventionSequencingTask = defineTask('cpd-interventions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Clinical Pathway Intervention Sequencing',
  agent: {
    name: 'clinical-designer',
    prompt: {
      role: 'Clinical Pathway Designer',
      task: 'Sequence interventions within pathway',
      context: args,
      instructions: [
        '1. List all required interventions',
        '2. Sequence interventions by phase',
        '3. Define timing for each intervention',
        '4. Assign responsible discipline',
        '5. Link to evidence base',
        '6. Define intervention dependencies',
        '7. Create parallel vs sequential tasks',
        '8. Define critical interventions',
        '9. Create intervention matrix',
        '10. Document intervention rationale'
      ],
      outputFormat: 'JSON with intervention sequence'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'interventions', 'matrix', 'artifacts'],
      properties: {
        phases: { type: 'array', items: { type: 'object' } },
        interventions: { type: 'array', items: { type: 'object' } },
        matrix: { type: 'object' },
        dependencies: { type: 'array', items: { type: 'object' } },
        criticalInterventions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clinical-pathway', 'interventions', 'sequencing']
}));

// Task 6: Order Set Development
export const orderSetDevelopmentTask = defineTask('cpd-order-sets', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Clinical Pathway Order Sets',
  agent: {
    name: 'order-set-developer',
    prompt: {
      role: 'Clinical Order Set Developer',
      task: 'Develop standardized order sets for pathway',
      context: args,
      instructions: [
        '1. Create admission order set',
        '2. Develop phase-specific order sets',
        '3. Include medication orders',
        '4. Include diagnostic orders',
        '5. Include nursing orders',
        '6. Include therapy orders',
        '7. Create discharge order set',
        '8. Define order set defaults',
        '9. Include alert and reminders',
        '10. Format for EHR integration'
      ],
      outputFormat: 'JSON with order sets'
    },
    outputSchema: {
      type: 'object',
      required: ['sets', 'medications', 'diagnostics', 'artifacts'],
      properties: {
        sets: { type: 'array', items: { type: 'object' } },
        admissionOrders: { type: 'object' },
        phaseOrders: { type: 'array', items: { type: 'object' } },
        medications: { type: 'array', items: { type: 'object' } },
        diagnostics: { type: 'array', items: { type: 'object' } },
        dischargeOrders: { type: 'object' },
        ehrFormat: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clinical-pathway', 'order-sets', 'healthcare']
}));

// Task 7: Variance Tracking
export const varianceTrackingTask = defineTask('cpd-variance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Clinical Pathway Variance Tracking',
  agent: {
    name: 'variance-analyst',
    prompt: {
      role: 'Clinical Variance Analyst',
      task: 'Design variance tracking system for pathway',
      context: args,
      instructions: [
        '1. Define variance categories',
        '2. Identify expected variances',
        '3. Design variance documentation',
        '4. Create variance codes',
        '5. Define variance response protocols',
        '6. Design variance reporting',
        '7. Create trend analysis approach',
        '8. Define review triggers',
        '9. Design pathway modification process',
        '10. Create variance dashboard'
      ],
      outputFormat: 'JSON with variance tracking system'
    },
    outputSchema: {
      type: 'object',
      required: ['trackingSystem', 'categories', 'codes', 'artifacts'],
      properties: {
        trackingSystem: { type: 'object' },
        categories: { type: 'array', items: { type: 'object' } },
        codes: { type: 'array', items: { type: 'object' } },
        responseProtocols: { type: 'object' },
        reportingStructure: { type: 'object' },
        dashboard: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clinical-pathway', 'variance', 'tracking']
}));

// Task 8: Outcome Metrics
export const outcomeMetricsTask = defineTask('cpd-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Clinical Pathway Outcome Metrics',
  agent: {
    name: 'outcomes-analyst',
    prompt: {
      role: 'Clinical Outcomes Analyst',
      task: 'Define outcome metrics for pathway',
      context: args,
      instructions: [
        '1. Define clinical outcome metrics',
        '2. Define process metrics',
        '3. Define patient experience metrics',
        '4. Set targets for each metric',
        '5. Define measurement methodology',
        '6. Establish baseline values',
        '7. Identify benchmark comparisons',
        '8. Design outcome dashboard',
        '9. Define reporting frequency',
        '10. Create metric definitions'
      ],
      outputFormat: 'JSON with outcome metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'targets', 'benchmarks', 'artifacts'],
      properties: {
        metrics: { type: 'array', items: { type: 'object' } },
        clinicalOutcomes: { type: 'array', items: { type: 'object' } },
        processMetrics: { type: 'array', items: { type: 'object' } },
        patientExperience: { type: 'array', items: { type: 'object' } },
        targets: { type: 'object' },
        benchmarks: { type: 'object' },
        dashboard: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clinical-pathway', 'metrics', 'outcomes']
}));

// Task 9: Implementation Planning
export const pathwayImplementationTask = defineTask('cpd-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Clinical Pathway Implementation',
  agent: {
    name: 'implementation-specialist',
    prompt: {
      role: 'Pathway Implementation Specialist',
      task: 'Plan pathway implementation',
      context: args,
      instructions: [
        '1. Create implementation timeline',
        '2. Define pilot approach',
        '3. Plan EHR build and testing',
        '4. Design training program',
        '5. Plan communication strategy',
        '6. Define go-live support',
        '7. Create escalation procedures',
        '8. Plan post-implementation review',
        '9. Define pathway maintenance process',
        '10. Design sustainability approach'
      ],
      outputFormat: 'JSON with implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'timeline', 'training', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        timeline: { type: 'object' },
        pilotStrategy: { type: 'object' },
        ehrBuild: { type: 'object' },
        training: { type: 'object' },
        communication: { type: 'object' },
        goLiveSupport: { type: 'object' },
        maintenance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clinical-pathway', 'implementation', 'healthcare']
}));

// Task 10: Pathway Documentation
export const pathwayDocumentationTask = defineTask('cpd-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Clinical Pathway Documentation',
  agent: {
    name: 'clinical-writer',
    prompt: {
      role: 'Clinical Documentation Writer',
      task: 'Create comprehensive pathway documentation',
      context: args,
      instructions: [
        '1. Write pathway purpose and scope',
        '2. Document evidence summary',
        '3. Create visual pathway diagram',
        '4. Document intervention details',
        '5. Include order set specifications',
        '6. Document variance tracking',
        '7. Include metrics specifications',
        '8. Create quick reference guide',
        '9. Include appendices',
        '10. Format for clinical use'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'pathwayDiagram', 'quickReference', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        pathwayDiagram: { type: 'string' },
        quickReference: { type: 'object' },
        appendices: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clinical-pathway', 'documentation', 'healthcare']
}));
