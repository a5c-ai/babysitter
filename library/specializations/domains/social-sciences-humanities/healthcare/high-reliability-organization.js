/**
 * @process specializations/domains/social-sciences-humanities/healthcare/high-reliability-organization
 * @description High Reliability Organization (HRO) Implementation - Framework for achieving consistent safety
 * and quality through preoccupation with failure, reluctance to simplify, sensitivity to operations,
 * commitment to resilience, and deference to expertise.
 * @inputs { organizationName: string, assessmentScope?: string, currentMaturity?: string, focusAreas?: array }
 * @outputs { success: boolean, assessment: object, implementationPlan: object, metrics: object, artifacts: array }
 * @recommendedSkills SK-HC-002 (quality-metrics-measurement), SK-HC-005 (patient-safety-event-analysis), SK-HC-010 (accreditation-tracer-simulation)
 * @recommendedAgents AG-HC-004 (patient-safety-officer), AG-HC-001 (quality-improvement-orchestrator)
 *
 * @example
 * const result = await orchestrate('specializations/domains/social-sciences-humanities/healthcare/high-reliability-organization', {
 *   organizationName: 'Regional Medical Center',
 *   assessmentScope: 'hospital-wide',
 *   currentMaturity: 'developing',
 *   focusAreas: ['patient safety', 'leadership commitment', 'just culture']
 * });
 *
 * @references
 * - Weick, K. & Sutcliffe, K. (2015). Managing the Unexpected
 * - Chassin, M. & Loeb, J. (2013). High-Reliability Healthcare
 * - AHRQ High Reliability Organization Tools
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName,
    assessmentScope = 'organization-wide',
    currentMaturity = 'unknown',
    focusAreas = [],
    stakeholders = [],
    timeline = null,
    outputDir = 'hro-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting HRO Implementation for: ${organizationName}`);

  // Phase 1: Leadership Commitment Assessment
  ctx.log('info', 'Phase 1: Leadership Commitment Assessment');
  const leadershipAssessment = await ctx.task(leadershipCommitmentTask, {
    organizationName,
    assessmentScope,
    outputDir
  });

  artifacts.push(...leadershipAssessment.artifacts);

  await ctx.breakpoint({
    question: `Leadership assessment complete. Commitment level: ${leadershipAssessment.commitmentLevel}. Executive sponsor: ${leadershipAssessment.executiveSponsor}. Proceed with culture assessment?`,
    title: 'Leadership Commitment Review',
    context: {
      runId: ctx.runId,
      organizationName,
      commitment: leadershipAssessment.findings,
      files: leadershipAssessment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 2: Safety Culture Assessment
  ctx.log('info', 'Phase 2: Safety Culture Assessment');
  const cultureAssessment = await ctx.task(safetyCultureAssessmentTask, {
    organizationName,
    leadershipAssessment,
    outputDir
  });

  artifacts.push(...cultureAssessment.artifacts);

  // Phase 3: HRO Principles Assessment
  ctx.log('info', 'Phase 3: HRO Principles Assessment');
  const principlesAssessment = await ctx.task(hroPrinciplesAssessmentTask, {
    cultureAssessment,
    currentMaturity,
    outputDir
  });

  artifacts.push(...principlesAssessment.artifacts);

  await ctx.breakpoint({
    question: `HRO principles assessed. Overall maturity: ${principlesAssessment.overallMaturity}. Strongest: ${principlesAssessment.strongestPrinciple}. Weakest: ${principlesAssessment.weakestPrinciple}. Proceed with gap analysis?`,
    title: 'HRO Principles Assessment Review',
    context: {
      runId: ctx.runId,
      principleScores: principlesAssessment.principleScores,
      files: principlesAssessment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 4: Gap Analysis
  ctx.log('info', 'Phase 4: HRO Gap Analysis');
  const gapAnalysis = await ctx.task(hroGapAnalysisTask, {
    principlesAssessment,
    cultureAssessment,
    focusAreas,
    outputDir
  });

  artifacts.push(...gapAnalysis.artifacts);

  // Phase 5: Just Culture Implementation
  ctx.log('info', 'Phase 5: Just Culture Framework');
  const justCulture = await ctx.task(justCultureImplementationTask, {
    cultureAssessment,
    gapAnalysis,
    outputDir
  });

  artifacts.push(...justCulture.artifacts);

  // Phase 6: Safety Behaviors Design
  ctx.log('info', 'Phase 6: Safety Behaviors Design');
  const safetyBehaviors = await ctx.task(safetyBehaviorsDesignTask, {
    principlesAssessment,
    justCulture,
    outputDir
  });

  artifacts.push(...safetyBehaviors.artifacts);

  await ctx.breakpoint({
    question: `Just culture framework and ${safetyBehaviors.behaviors.length} safety behaviors designed. Proceed with implementation roadmap?`,
    title: 'Culture and Behaviors Review',
    context: {
      runId: ctx.runId,
      justCultureFramework: justCulture.framework,
      behaviors: safetyBehaviors.behaviors,
      files: [...justCulture.artifacts, ...safetyBehaviors.artifacts].map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 7: Implementation Roadmap
  ctx.log('info', 'Phase 7: Implementation Roadmap Development');
  const implementationRoadmap = await ctx.task(hroImplementationRoadmapTask, {
    gapAnalysis,
    justCulture,
    safetyBehaviors,
    timeline,
    outputDir
  });

  artifacts.push(...implementationRoadmap.artifacts);

  // Phase 8: Training Program Design
  ctx.log('info', 'Phase 8: HRO Training Program Design');
  const trainingProgram = await ctx.task(hroTrainingProgramTask, {
    principlesAssessment,
    safetyBehaviors,
    justCulture,
    outputDir
  });

  artifacts.push(...trainingProgram.artifacts);

  // Phase 9: Metrics and Monitoring
  ctx.log('info', 'Phase 9: HRO Metrics and Monitoring Design');
  const metricsMonitoring = await ctx.task(hroMetricsMonitoringTask, {
    principlesAssessment,
    gapAnalysis,
    outputDir
  });

  artifacts.push(...metricsMonitoring.artifacts);

  // Phase 10: HRO Report Generation
  ctx.log('info', 'Phase 10: HRO Implementation Report');
  const hroReport = await ctx.task(hroReportTask, {
    organizationName,
    leadershipAssessment,
    cultureAssessment,
    principlesAssessment,
    gapAnalysis,
    justCulture,
    safetyBehaviors,
    implementationRoadmap,
    trainingProgram,
    metricsMonitoring,
    outputDir
  });

  artifacts.push(...hroReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organizationName,
    assessment: {
      leadershipCommitment: leadershipAssessment.commitmentLevel,
      safetyCulture: cultureAssessment.cultureScore,
      hroMaturity: principlesAssessment.overallMaturity,
      principleScores: principlesAssessment.principleScores,
      gaps: gapAnalysis.prioritizedGaps
    },
    implementationPlan: {
      roadmap: implementationRoadmap.roadmap,
      phases: implementationRoadmap.phases,
      justCulture: justCulture.framework,
      safetyBehaviors: safetyBehaviors.behaviors,
      trainingProgram: trainingProgram.program
    },
    metrics: {
      leading: metricsMonitoring.leadingIndicators,
      lagging: metricsMonitoring.laggingIndicators,
      targets: metricsMonitoring.targets
    },
    artifacts,
    reportPath: hroReport.reportPath,
    duration,
    metadata: {
      processId: 'specializations/domains/social-sciences-humanities/healthcare/high-reliability-organization',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Leadership Commitment
export const leadershipCommitmentTask = defineTask('hro-leadership', (args, taskCtx) => ({
  kind: 'agent',
  title: `HRO Leadership Assessment - ${args.organizationName}`,
  agent: {
    name: 'hro-consultant',
    prompt: {
      role: 'HRO Consultant',
      task: 'Assess leadership commitment to HRO',
      context: args,
      instructions: [
        '1. Assess board-level safety oversight',
        '2. Evaluate CEO/CMO commitment',
        '3. Review safety in strategic priorities',
        '4. Assess resource allocation for safety',
        '5. Evaluate leader safety behaviors',
        '6. Review accountability structures',
        '7. Assess transparency practices',
        '8. Identify executive sponsor',
        '9. Evaluate leader rounding practices',
        '10. Document commitment gaps'
      ],
      outputFormat: 'JSON with leadership assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['commitmentLevel', 'executiveSponsor', 'findings', 'artifacts'],
      properties: {
        commitmentLevel: { type: 'string' },
        executiveSponsor: { type: 'string' },
        boardOversight: { type: 'object' },
        strategicPriority: { type: 'object' },
        resourceAllocation: { type: 'object' },
        leaderBehaviors: { type: 'object' },
        findings: { type: 'array', items: { type: 'object' } },
        gaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hro', 'leadership', 'healthcare']
}));

// Task 2: Safety Culture Assessment
export const safetyCultureAssessmentTask = defineTask('hro-culture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'HRO Safety Culture Assessment',
  agent: {
    name: 'culture-assessor',
    prompt: {
      role: 'Safety Culture Assessor',
      task: 'Assess organizational safety culture',
      context: args,
      instructions: [
        '1. Review safety culture survey results',
        '2. Assess psychological safety',
        '3. Evaluate reporting culture',
        '4. Assess learning culture',
        '5. Evaluate teamwork and communication',
        '6. Assess staffing perceptions',
        '7. Evaluate management support',
        '8. Identify culture strengths',
        '9. Identify culture vulnerabilities',
        '10. Document culture assessment'
      ],
      outputFormat: 'JSON with culture assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['cultureScore', 'dimensions', 'artifacts'],
      properties: {
        cultureScore: { type: 'number' },
        dimensions: { type: 'object' },
        psychologicalSafety: { type: 'object' },
        reportingCulture: { type: 'object' },
        learningCulture: { type: 'object' },
        teamwork: { type: 'object' },
        strengths: { type: 'array', items: { type: 'string' } },
        vulnerabilities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hro', 'culture', 'healthcare']
}));

// Task 3: HRO Principles Assessment
export const hroPrinciplesAssessmentTask = defineTask('hro-principles', (args, taskCtx) => ({
  kind: 'agent',
  title: 'HRO Principles Assessment',
  agent: {
    name: 'hro-analyst',
    prompt: {
      role: 'HRO Principles Analyst',
      task: 'Assess adoption of HRO principles',
      context: args,
      instructions: [
        '1. Assess Preoccupation with Failure',
        '2. Assess Reluctance to Simplify',
        '3. Assess Sensitivity to Operations',
        '4. Assess Commitment to Resilience',
        '5. Assess Deference to Expertise',
        '6. Score each principle (1-5)',
        '7. Identify strongest principle',
        '8. Identify weakest principle',
        '9. Calculate overall maturity',
        '10. Document principle assessment'
      ],
      outputFormat: 'JSON with principles assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['principleScores', 'overallMaturity', 'strongestPrinciple', 'weakestPrinciple', 'artifacts'],
      properties: {
        principleScores: { type: 'object' },
        preoccupationWithFailure: { type: 'object' },
        reluctanceToSimplify: { type: 'object' },
        sensitivityToOperations: { type: 'object' },
        commitmentToResilience: { type: 'object' },
        deferenceToExpertise: { type: 'object' },
        overallMaturity: { type: 'string' },
        strongestPrinciple: { type: 'string' },
        weakestPrinciple: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hro', 'principles', 'healthcare']
}));

// Task 4: Gap Analysis
export const hroGapAnalysisTask = defineTask('hro-gaps', (args, taskCtx) => ({
  kind: 'agent',
  title: 'HRO Gap Analysis',
  agent: {
    name: 'gap-analyst',
    prompt: {
      role: 'HRO Gap Analyst',
      task: 'Analyze gaps in HRO adoption',
      context: args,
      instructions: [
        '1. Compare current to target state',
        '2. Identify gaps by principle',
        '3. Identify infrastructure gaps',
        '4. Identify process gaps',
        '5. Identify capability gaps',
        '6. Prioritize gaps by impact',
        '7. Assess gap closure difficulty',
        '8. Identify quick wins',
        '9. Create gap closure roadmap',
        '10. Document gap analysis'
      ],
      outputFormat: 'JSON with gap analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'prioritizedGaps', 'artifacts'],
      properties: {
        gaps: { type: 'array', items: { type: 'object' } },
        gapsByPrinciple: { type: 'object' },
        infrastructureGaps: { type: 'array', items: { type: 'object' } },
        processGaps: { type: 'array', items: { type: 'object' } },
        capabilityGaps: { type: 'array', items: { type: 'object' } },
        prioritizedGaps: { type: 'array', items: { type: 'object' } },
        quickWins: { type: 'array', items: { type: 'object' } },
        closureRoadmap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hro', 'gaps', 'healthcare']
}));

// Task 5: Just Culture Implementation
export const justCultureImplementationTask = defineTask('hro-just-culture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Just Culture Framework',
  agent: {
    name: 'just-culture-expert',
    prompt: {
      role: 'Just Culture Expert',
      task: 'Design just culture framework',
      context: args,
      instructions: [
        '1. Define just culture principles',
        '2. Create behavior classification algorithm',
        '3. Design human error response',
        '4. Design at-risk behavior response',
        '5. Design reckless behavior response',
        '6. Create coaching protocols',
        '7. Design fair review process',
        '8. Create leader training content',
        '9. Design communication plan',
        '10. Document just culture framework'
      ],
      outputFormat: 'JSON with just culture framework'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'algorithm', 'responses', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        principles: { type: 'array', items: { type: 'string' } },
        algorithm: { type: 'object' },
        humanErrorResponse: { type: 'object' },
        atRiskResponse: { type: 'object' },
        recklessResponse: { type: 'object' },
        coachingProtocols: { type: 'object' },
        reviewProcess: { type: 'object' },
        responses: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hro', 'just-culture', 'healthcare']
}));

// Task 6: Safety Behaviors Design
export const safetyBehaviorsDesignTask = defineTask('hro-behaviors', (args, taskCtx) => ({
  kind: 'agent',
  title: 'HRO Safety Behaviors Design',
  agent: {
    name: 'behavior-designer',
    prompt: {
      role: 'Safety Behavior Designer',
      task: 'Design universal safety behaviors',
      context: args,
      instructions: [
        '1. Define error prevention behaviors',
        '2. Design speaking up behaviors',
        '3. Create questioning attitude behaviors',
        '4. Design self-checking behaviors',
        '5. Create peer-checking behaviors',
        '6. Design handoff behaviors',
        '7. Create escalation behaviors',
        '8. Design stop-the-line authority',
        '9. Create behavior reinforcement plan',
        '10. Document safety behaviors'
      ],
      outputFormat: 'JSON with safety behaviors'
    },
    outputSchema: {
      type: 'object',
      required: ['behaviors', 'reinforcementPlan', 'artifacts'],
      properties: {
        behaviors: { type: 'array', items: { type: 'object' } },
        errorPrevention: { type: 'array', items: { type: 'object' } },
        speakingUp: { type: 'object' },
        questioningAttitude: { type: 'object' },
        selfChecking: { type: 'object' },
        peerChecking: { type: 'object' },
        handoffBehaviors: { type: 'object' },
        escalation: { type: 'object' },
        stopTheLine: { type: 'object' },
        reinforcementPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hro', 'behaviors', 'healthcare']
}));

// Task 7: Implementation Roadmap
export const hroImplementationRoadmapTask = defineTask('hro-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'HRO Implementation Roadmap',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'HRO Implementation Planner',
      task: 'Create HRO implementation roadmap',
      context: args,
      instructions: [
        '1. Define implementation phases',
        '2. Sequence initiatives by priority',
        '3. Create detailed timeline',
        '4. Identify resource requirements',
        '5. Define milestones',
        '6. Plan change management',
        '7. Identify risks and mitigations',
        '8. Plan communication strategy',
        '9. Define governance structure',
        '10. Document implementation roadmap'
      ],
      outputFormat: 'JSON with implementation roadmap'
    },
    outputSchema: {
      type: 'object',
      required: ['roadmap', 'phases', 'timeline', 'artifacts'],
      properties: {
        roadmap: { type: 'object' },
        phases: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' },
        milestones: { type: 'array', items: { type: 'object' } },
        resources: { type: 'object' },
        changeManagement: { type: 'object' },
        risks: { type: 'array', items: { type: 'object' } },
        governance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hro', 'implementation', 'healthcare']
}));

// Task 8: Training Program
export const hroTrainingProgramTask = defineTask('hro-training', (args, taskCtx) => ({
  kind: 'agent',
  title: 'HRO Training Program Design',
  agent: {
    name: 'training-designer',
    prompt: {
      role: 'HRO Training Designer',
      task: 'Design HRO training program',
      context: args,
      instructions: [
        '1. Define training objectives',
        '2. Create board/executive training',
        '3. Create leader training',
        '4. Create frontline training',
        '5. Design just culture training',
        '6. Design safety behavior training',
        '7. Create simulation exercises',
        '8. Define competency assessments',
        '9. Plan training delivery',
        '10. Document training program'
      ],
      outputFormat: 'JSON with training program'
    },
    outputSchema: {
      type: 'object',
      required: ['program', 'modules', 'competencies', 'artifacts'],
      properties: {
        program: { type: 'object' },
        objectives: { type: 'array', items: { type: 'string' } },
        modules: { type: 'array', items: { type: 'object' } },
        executiveTraining: { type: 'object' },
        leaderTraining: { type: 'object' },
        frontlineTraining: { type: 'object' },
        simulations: { type: 'array', items: { type: 'object' } },
        competencies: { type: 'array', items: { type: 'object' } },
        deliveryPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hro', 'training', 'healthcare']
}));

// Task 9: Metrics and Monitoring
export const hroMetricsMonitoringTask = defineTask('hro-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'HRO Metrics and Monitoring',
  agent: {
    name: 'metrics-analyst',
    prompt: {
      role: 'HRO Metrics Analyst',
      task: 'Design HRO metrics and monitoring',
      context: args,
      instructions: [
        '1. Define leading indicators',
        '2. Define lagging indicators',
        '3. Create HRO maturity metrics',
        '4. Design culture metrics',
        '5. Define safety event metrics',
        '6. Create behavior metrics',
        '7. Set targets for each metric',
        '8. Design monitoring dashboard',
        '9. Plan reporting cadence',
        '10. Document metrics system'
      ],
      outputFormat: 'JSON with metrics system'
    },
    outputSchema: {
      type: 'object',
      required: ['leadingIndicators', 'laggingIndicators', 'targets', 'artifacts'],
      properties: {
        leadingIndicators: { type: 'array', items: { type: 'object' } },
        laggingIndicators: { type: 'array', items: { type: 'object' } },
        maturityMetrics: { type: 'array', items: { type: 'object' } },
        cultureMetrics: { type: 'array', items: { type: 'object' } },
        behaviorMetrics: { type: 'array', items: { type: 'object' } },
        targets: { type: 'object' },
        dashboard: { type: 'object' },
        reportingCadence: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hro', 'metrics', 'healthcare']
}));

// Task 10: HRO Report
export const hroReportTask = defineTask('hro-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'HRO Implementation Report',
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'HRO Report Writer',
      task: 'Generate HRO implementation report',
      context: args,
      instructions: [
        '1. Write executive summary',
        '2. Document assessment findings',
        '3. Present gap analysis',
        '4. Detail implementation roadmap',
        '5. Include training program',
        '6. Document metrics system',
        '7. Include just culture framework',
        '8. Present safety behaviors',
        '9. Add implementation resources',
        '10. Format professionally'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hro', 'report', 'healthcare']
}));
