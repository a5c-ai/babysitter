/**
 * @process Clinical-Operational Troubleshooting
 * @description Apply diagnostic reasoning to symptoms/problems, generating differential diagnoses and systematic elimination to identify root causes
 * @category Scientific Discovery - Domain-Specific Reasoning
 * @inputs {{ symptoms: array, context: object, constraints: object, systemDescription: object }}
 * @outputs {{ diagnosis: object, differentialDiagnosis: array, rootCauseAnalysis: object, treatmentPlan: object, recommendations: array }}
 * @example
 * // Input: { symptoms: ["high latency", "intermittent errors"], context: { system: "API gateway" }, systemDescription: {...} }
 * // Output: { diagnosis: { primary: "...", confidence: 0.85 }, differentialDiagnosis: [...], rootCauseAnalysis: {...} }
 * @references Medical diagnostic reasoning, Root cause analysis, FMEA, 5 Whys methodology
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  // Phase 1: Symptom Characterization
  const symptomAnalysis = await ctx.task(characterizeSymptomsTask, {
    symptoms: inputs.symptoms,
    context: inputs.context,
    systemDescription: inputs.systemDescription
  });

  // Phase 2: History and Context Gathering
  const historyGathering = await ctx.task(gatherHistoryTask, {
    symptoms: symptomAnalysis.characterizedSymptoms,
    systemContext: inputs.systemDescription,
    temporalContext: inputs.context?.timeline,
    recentChanges: inputs.context?.recentChanges
  });

  // Phase 3: Pattern Recognition
  const patternRecognition = await ctx.task(recognizePatternsTask, {
    symptoms: symptomAnalysis.characterizedSymptoms,
    history: historyGathering.relevantHistory,
    knownPatterns: inputs.context?.knownFailurePatterns
  });

  // Phase 4: Differential Diagnosis Generation
  const differentialGeneration = await ctx.task(generateDifferentialTask, {
    symptoms: symptomAnalysis.characterizedSymptoms,
    patterns: patternRecognition.matchedPatterns,
    systemDescription: inputs.systemDescription,
    constraints: inputs.constraints
  });

  // Phase 5: Diagnostic Test Planning
  const testPlanning = await ctx.task(planDiagnosticTestsTask, {
    differentials: differentialGeneration.differentialDiagnoses,
    symptoms: symptomAnalysis.characterizedSymptoms,
    availableTests: inputs.context?.availableTests,
    constraints: inputs.constraints
  });

  // Phase 6: Test Execution Simulation
  const testResults = await ctx.task(simulateTestResultsTask, {
    plannedTests: testPlanning.orderedTests,
    differentials: differentialGeneration.differentialDiagnoses,
    systemState: inputs.context?.currentState
  });

  // Phase 7: Differential Refinement
  const refinedDifferential = await ctx.task(refineDifferentialTask, {
    differentials: differentialGeneration.differentialDiagnoses,
    testResults: testResults.results,
    bayesianUpdate: true
  });

  // Quality Gate: Diagnostic Confidence
  if (refinedDifferential.topDiagnosis.confidence < 0.6) {
    await ctx.breakpoint('additional-investigation-needed', {
      message: 'Insufficient confidence for diagnosis',
      currentConfidence: refinedDifferential.topDiagnosis.confidence,
      suggestedTests: refinedDifferential.recommendedAdditionalTests
    });
  }

  // Phase 8: Root Cause Analysis
  const rootCauseAnalysis = await ctx.task(analyzeRootCauseTask, {
    diagnosis: refinedDifferential.topDiagnosis,
    symptoms: symptomAnalysis.characterizedSymptoms,
    systemDescription: inputs.systemDescription,
    history: historyGathering.relevantHistory
  });

  // Phase 9: Treatment/Remediation Planning
  const treatmentPlan = await ctx.task(planTreatmentTask, {
    diagnosis: refinedDifferential.topDiagnosis,
    rootCause: rootCauseAnalysis.rootCause,
    constraints: inputs.constraints,
    systemDescription: inputs.systemDescription
  });

  // Phase 10: Prevention and Monitoring
  const preventionPlan = await ctx.task(planPreventionTask, {
    rootCause: rootCauseAnalysis.rootCause,
    diagnosis: refinedDifferential.topDiagnosis,
    systemDescription: inputs.systemDescription,
    treatmentPlan: treatmentPlan
  });

  return {
    success: true,
    reasoningType: 'Clinical-Operational Troubleshooting',
    diagnosis: {
      primary: refinedDifferential.topDiagnosis,
      confidence: refinedDifferential.topDiagnosis.confidence,
      supportingEvidence: refinedDifferential.supportingEvidence,
      contradictingEvidence: refinedDifferential.contradictingEvidence
    },
    differentialDiagnosis: refinedDifferential.rankedDifferentials,
    rootCauseAnalysis: {
      rootCause: rootCauseAnalysis.rootCause,
      causalChain: rootCauseAnalysis.causalChain,
      contributingFactors: rootCauseAnalysis.contributingFactors,
      fiveWhys: rootCauseAnalysis.fiveWhysAnalysis
    },
    diagnosticProcess: {
      symptoms: symptomAnalysis.characterizedSymptoms,
      patterns: patternRecognition.matchedPatterns,
      testsPerformed: testResults.results,
      reasoningTrace: refinedDifferential.reasoningTrace
    },
    treatmentPlan: {
      immediateActions: treatmentPlan.immediateActions,
      shortTermRemediation: treatmentPlan.shortTermActions,
      longTermRemediation: treatmentPlan.longTermActions,
      rollbackPlan: treatmentPlan.rollbackPlan
    },
    prevention: {
      monitoringEnhancements: preventionPlan.monitoringRecommendations,
      processImprovements: preventionPlan.processImprovements,
      preventiveMeasures: preventionPlan.preventiveMeasures
    },
    recommendations: [
      ...treatmentPlan.recommendations,
      ...preventionPlan.recommendations
    ],
    confidence: refinedDifferential.topDiagnosis.confidence
  };
}

export const characterizeSymptomsTask = defineTask('troubleshoot-symptom-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Symptom Characterization',
  agent: {
    name: 'diagnostic-specialist',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Diagnostic symptom analysis specialist',
      task: 'Characterize and classify observed symptoms',
      context: args,
      instructions: [
        'Document each symptom precisely',
        'Classify symptom severity and urgency',
        'Identify symptom onset and duration',
        'Note intermittent vs constant patterns',
        'Identify symptom relationships',
        'Distinguish symptoms from artifacts'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['characterizedSymptoms'],
      properties: {
        characterizedSymptoms: { type: 'array' },
        symptomSeverity: { type: 'object' },
        temporalPatterns: { type: 'array' },
        symptomRelationships: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['troubleshooting', 'symptom-analysis']
}));

export const gatherHistoryTask = defineTask('troubleshoot-history-gathering', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: History Gathering',
  agent: {
    name: 'diagnostic-specialist',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Diagnostic history specialist',
      task: 'Gather relevant historical context for diagnosis',
      context: args,
      instructions: [
        'Identify recent changes in the system',
        'Document past similar incidents',
        'Note environmental changes',
        'Identify maintenance history',
        'Document configuration changes',
        'Assess baseline performance'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['relevantHistory', 'recentChanges'],
      properties: {
        relevantHistory: { type: 'array' },
        recentChanges: { type: 'array' },
        pastIncidents: { type: 'array' },
        environmentalChanges: { type: 'array' },
        baselineComparison: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['troubleshooting', 'history-gathering']
}));

export const recognizePatternsTask = defineTask('troubleshoot-pattern-recognition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Pattern Recognition',
  agent: {
    name: 'diagnostic-specialist',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Diagnostic pattern recognition specialist',
      task: 'Recognize patterns matching known failure modes',
      context: args,
      instructions: [
        'Match symptoms to known failure patterns',
        'Identify syndrome clusters',
        'Recognize signature patterns',
        'Note atypical presentations',
        'Consider pattern variations',
        'Assess pattern confidence'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['matchedPatterns'],
      properties: {
        matchedPatterns: { type: 'array' },
        patternConfidence: { type: 'object' },
        atypicalFeatures: { type: 'array' },
        syndromeClusters: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['troubleshooting', 'pattern-recognition']
}));

export const generateDifferentialTask = defineTask('troubleshoot-differential-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Differential Diagnosis Generation',
  agent: {
    name: 'diagnostic-specialist',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Differential diagnosis specialist',
      task: 'Generate comprehensive differential diagnosis list',
      context: args,
      instructions: [
        'Generate potential diagnoses',
        'Include common causes first',
        'Consider dangerous/critical causes',
        'Include unlikely but important causes',
        'Rank by probability',
        'Document reasoning for each'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['differentialDiagnoses'],
      properties: {
        differentialDiagnoses: { type: 'array' },
        probabilityRankings: { type: 'array' },
        criticalConsiderations: { type: 'array' },
        reasoningNotes: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['troubleshooting', 'differential-diagnosis']
}));

export const planDiagnosticTestsTask = defineTask('troubleshoot-test-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Diagnostic Test Planning',
  agent: {
    name: 'diagnostic-specialist',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Diagnostic test planning specialist',
      task: 'Plan diagnostic tests to differentiate diagnoses',
      context: args,
      instructions: [
        'Identify discriminating tests',
        'Order tests by information value',
        'Consider test cost and risk',
        'Plan test sequence',
        'Define expected results for each diagnosis',
        'Identify critical tests'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['orderedTests', 'expectedOutcomes'],
      properties: {
        orderedTests: { type: 'array' },
        testRationale: { type: 'array' },
        expectedOutcomes: { type: 'object' },
        criticalTests: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['troubleshooting', 'test-planning']
}));

export const simulateTestResultsTask = defineTask('troubleshoot-test-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Test Result Analysis',
  agent: {
    name: 'diagnostic-specialist',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Diagnostic test result analyst',
      task: 'Analyze or simulate diagnostic test results',
      context: args,
      instructions: [
        'Process available test results',
        'Interpret results in context',
        'Note abnormal findings',
        'Identify inconclusive results',
        'Compare to expected outcomes',
        'Document interpretation confidence'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'interpretations'],
      properties: {
        results: { type: 'array' },
        interpretations: { type: 'array' },
        abnormalFindings: { type: 'array' },
        inconclusiveResults: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['troubleshooting', 'test-analysis']
}));

export const refineDifferentialTask = defineTask('troubleshoot-differential-refinement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Differential Refinement',
  agent: {
    name: 'diagnostic-specialist',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Diagnostic refinement specialist',
      task: 'Refine differential diagnosis based on test results',
      context: args,
      instructions: [
        'Update diagnosis probabilities',
        'Apply Bayesian reasoning',
        'Eliminate ruled-out diagnoses',
        'Identify top diagnosis',
        'Document supporting/contradicting evidence',
        'Recommend additional tests if needed'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['topDiagnosis', 'rankedDifferentials', 'reasoningTrace'],
      properties: {
        topDiagnosis: { type: 'object' },
        rankedDifferentials: { type: 'array' },
        supportingEvidence: { type: 'array' },
        contradictingEvidence: { type: 'array' },
        reasoningTrace: { type: 'array' },
        recommendedAdditionalTests: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['troubleshooting', 'differential-refinement']
}));

export const analyzeRootCauseTask = defineTask('troubleshoot-root-cause', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Root Cause Analysis',
  agent: {
    name: 'diagnostic-specialist',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Root cause analysis specialist',
      task: 'Identify root cause using systematic analysis methods',
      context: args,
      instructions: [
        'Apply 5 Whys analysis',
        'Build causal chain',
        'Identify contributing factors',
        'Distinguish root cause from symptoms',
        'Consider systemic factors',
        'Document causal reasoning'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['rootCause', 'causalChain', 'fiveWhysAnalysis'],
      properties: {
        rootCause: { type: 'object' },
        causalChain: { type: 'array' },
        fiveWhysAnalysis: { type: 'array' },
        contributingFactors: { type: 'array' },
        systemicFactors: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['troubleshooting', 'root-cause-analysis']
}));

export const planTreatmentTask = defineTask('troubleshoot-treatment-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Treatment/Remediation Planning',
  agent: {
    name: 'diagnostic-specialist',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Remediation planning specialist',
      task: 'Plan treatment or remediation actions',
      context: args,
      instructions: [
        'Define immediate stabilization actions',
        'Plan short-term remediation',
        'Design long-term fix',
        'Create rollback plan',
        'Prioritize actions',
        'Document expected outcomes'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['immediateActions', 'shortTermActions', 'longTermActions'],
      properties: {
        immediateActions: { type: 'array' },
        shortTermActions: { type: 'array' },
        longTermActions: { type: 'array' },
        rollbackPlan: { type: 'object' },
        expectedOutcomes: { type: 'object' },
        recommendations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['troubleshooting', 'treatment-planning']
}));

export const planPreventionTask = defineTask('troubleshoot-prevention-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Prevention and Monitoring Planning',
  agent: {
    name: 'diagnostic-specialist',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Prevention and monitoring specialist',
      task: 'Plan prevention measures and enhanced monitoring',
      context: args,
      instructions: [
        'Design preventive measures',
        'Enhance monitoring coverage',
        'Create early warning indicators',
        'Improve detection capabilities',
        'Document process improvements',
        'Plan regular reviews'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['preventiveMeasures', 'monitoringRecommendations'],
      properties: {
        preventiveMeasures: { type: 'array' },
        monitoringRecommendations: { type: 'array' },
        earlyWarningIndicators: { type: 'array' },
        processImprovements: { type: 'array' },
        reviewSchedule: { type: 'object' },
        recommendations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['troubleshooting', 'prevention-planning']
}));
