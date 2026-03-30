/**
 * @process domains/science/scientific-discovery/failure-mode-effects-analysis
 * @description Identify potential failure modes, assess severity and likelihood - Guides practitioners through
 * FMEA methodology to systematically identify potential failures, assess their risks using RPN (Risk Priority Number),
 * and develop mitigation strategies.
 * @inputs { system: object, components: array, functions?: array, scope?: string }
 * @outputs { success: boolean, fmeaTable: array, rpnAnalysis: object, mitigations: array, prioritizedActions: array }
 *
 * @example
 * const result = await orchestrate('domains/science/scientific-discovery/failure-mode-effects-analysis', {
 *   system: { name: 'Brake System', type: 'mechanical' },
 *   components: ['Master Cylinder', 'Brake Lines', 'Calipers', 'Pads'],
 *   scope: 'design-fmea'
 * });
 *
 * @references
 * - SAE J1739 (2009). Potential Failure Mode and Effects Analysis
 * - AIAG & VDA FMEA Handbook (2019)
 * - Stamatis, D.H. (2003). Failure Mode and Effect Analysis: FMEA from Theory to Execution
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    system,
    components = [],
    functions = [],
    scope = 'design-fmea',
    outputDir = 'fmea-output',
    rpnThreshold = 100,
    severityThreshold = 8
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting FMEA for: ${system.name}`);

  // ============================================================================
  // PHASE 1: SYSTEM DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining system and scope');
  const systemDefinition = await ctx.task(systemDefinitionTask, {
    system,
    components,
    functions,
    scope,
    outputDir
  });

  artifacts.push(...systemDefinition.artifacts);

  // ============================================================================
  // PHASE 2: FUNCTION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing system functions');
  const functionAnalysis = await ctx.task(functionAnalysisTask, {
    system,
    systemDefinition,
    components,
    functions,
    outputDir
  });

  artifacts.push(...functionAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: FAILURE MODE IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Identifying failure modes');
  const failureModeIdentification = await ctx.task(failureModeIdentificationTask, {
    system,
    functionAnalysis,
    components,
    outputDir
  });

  artifacts.push(...failureModeIdentification.artifacts);

  // Breakpoint: Review failure modes
  await ctx.breakpoint({
    question: `Identified ${failureModeIdentification.totalFailureModes} potential failure modes across ${components.length} components. Review before effects analysis?`,
    title: 'Failure Modes Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        system: system.name,
        components: components.length,
        failureModes: failureModeIdentification.totalFailureModes
      }
    }
  });

  // ============================================================================
  // PHASE 4: FAILURE EFFECTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing failure effects');
  const failureEffectsAnalysis = await ctx.task(failureEffectsAnalysisTask, {
    system,
    failureModes: failureModeIdentification.failureModes,
    functionAnalysis,
    outputDir
  });

  artifacts.push(...failureEffectsAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: SEVERITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Assessing severity');
  const severityAssessment = await ctx.task(severityAssessmentTask, {
    system,
    failureEffects: failureEffectsAnalysis.failureEffects,
    scope,
    outputDir
  });

  artifacts.push(...severityAssessment.artifacts);

  // ============================================================================
  // PHASE 6: CAUSE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing failure causes');
  const causeAnalysis = await ctx.task(fmeaCauseAnalysisTask, {
    system,
    failureModes: failureModeIdentification.failureModes,
    failureEffects: failureEffectsAnalysis.failureEffects,
    outputDir
  });

  artifacts.push(...causeAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: OCCURRENCE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Assessing occurrence likelihood');
  const occurrenceAssessment = await ctx.task(occurrenceAssessmentTask, {
    system,
    causes: causeAnalysis.causes,
    scope,
    outputDir
  });

  artifacts.push(...occurrenceAssessment.artifacts);

  // ============================================================================
  // PHASE 8: CURRENT CONTROLS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 8: Analyzing current controls');
  const controlsAnalysis = await ctx.task(currentControlsAnalysisTask, {
    system,
    failureModes: failureModeIdentification.failureModes,
    causes: causeAnalysis.causes,
    outputDir
  });

  artifacts.push(...controlsAnalysis.artifacts);

  // ============================================================================
  // PHASE 9: DETECTION ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 9: Assessing detection capability');
  const detectionAssessment = await ctx.task(detectionAssessmentTask, {
    system,
    controls: controlsAnalysis.controls,
    failureModes: failureModeIdentification.failureModes,
    outputDir
  });

  artifacts.push(...detectionAssessment.artifacts);

  // ============================================================================
  // PHASE 10: RPN CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Calculating Risk Priority Numbers');
  const rpnCalculation = await ctx.task(rpnCalculationTask, {
    system,
    severityAssessment,
    occurrenceAssessment,
    detectionAssessment,
    rpnThreshold,
    outputDir
  });

  artifacts.push(...rpnCalculation.artifacts);

  // ============================================================================
  // PHASE 11: ACTION PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Prioritizing recommended actions');
  const actionPrioritization = await ctx.task(actionPrioritizationTask, {
    system,
    rpnAnalysis: rpnCalculation.rpnAnalysis,
    rpnThreshold,
    severityThreshold,
    outputDir
  });

  artifacts.push(...actionPrioritization.artifacts);

  // ============================================================================
  // PHASE 12: MITIGATION DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 12: Developing mitigation strategies');
  const mitigationDevelopment = await ctx.task(mitigationDevelopmentTask, {
    system,
    prioritizedFailures: actionPrioritization.prioritizedFailures,
    currentControls: controlsAnalysis.controls,
    outputDir
  });

  artifacts.push(...mitigationDevelopment.artifacts);

  // ============================================================================
  // PHASE 13: FMEA TABLE GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Generating FMEA table');
  const fmeaTable = await ctx.task(fmeaTableGenerationTask, {
    system,
    failureModes: failureModeIdentification.failureModes,
    failureEffects: failureEffectsAnalysis.failureEffects,
    severityAssessment,
    causeAnalysis,
    occurrenceAssessment,
    controlsAnalysis,
    detectionAssessment,
    rpnCalculation,
    mitigationDevelopment,
    outputDir
  });

  artifacts.push(...fmeaTable.artifacts);

  // ============================================================================
  // PHASE 14: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 14: Scoring FMEA quality');
  const qualityScore = await ctx.task(fmeaQualityScoringTask, {
    system,
    failureModeIdentification,
    severityAssessment,
    rpnCalculation,
    mitigationDevelopment,
    fmeaTable,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  // Final breakpoint
  await ctx.breakpoint({
    question: `FMEA complete for ${system.name}. ${rpnCalculation.highRiskCount} high-risk items (RPN >= ${rpnThreshold}). Quality score: ${qualityScore.overallScore}/100. Approve FMEA?`,
    title: 'FMEA Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        system: system.name,
        totalFailureModes: failureModeIdentification.totalFailureModes,
        highRiskItems: rpnCalculation.highRiskCount,
        mitigationsPlanned: mitigationDevelopment.mitigations?.length || 0,
        qualityScore: qualityScore.overallScore
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    system: system.name,
    fmeaTable: fmeaTable.table,
    rpnAnalysis: {
      highRiskCount: rpnCalculation.highRiskCount,
      mediumRiskCount: rpnCalculation.mediumRiskCount,
      lowRiskCount: rpnCalculation.lowRiskCount,
      maxRPN: rpnCalculation.maxRPN,
      averageRPN: rpnCalculation.averageRPN
    },
    mitigations: mitigationDevelopment.mitigations,
    prioritizedActions: actionPrioritization.prioritizedActions,
    qualityScore: {
      overall: qualityScore.overallScore,
      completeness: qualityScore.completenessScore,
      rigor: qualityScore.rigorScore
    },
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/scientific-discovery/failure-mode-effects-analysis',
      timestamp: startTime,
      scope,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const systemDefinitionTask = defineTask('system-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define system and scope',
  skill: { name: 'root-cause-analyzer' },
  agent: {
    name: 'reliability-engineer',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Systems engineer specializing in FMEA',
      task: 'Define the system scope and boundaries for FMEA',
      context: args,
      instructions: [
        'Define system name, description, and purpose',
        'Identify system boundaries and interfaces',
        'List all components within scope',
        'Identify components out of scope',
        'Define FMEA type (Design, Process, System)',
        'Identify team members and responsibilities',
        'Document assumptions and constraints',
        'Define success criteria for the FMEA',
        'Create system block diagram',
        'Document revision history'
      ],
      outputFormat: 'JSON with systemDescription, boundaries, componentsInScope, assumptions, fmeaType, team, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['systemDescription', 'boundaries', 'fmeaType', 'artifacts'],
      properties: {
        systemDescription: { type: 'string' },
        systemPurpose: { type: 'string' },
        boundaries: {
          type: 'object',
          properties: {
            included: { type: 'array', items: { type: 'string' } },
            excluded: { type: 'array', items: { type: 'string' } },
            interfaces: { type: 'array', items: { type: 'string' } }
          }
        },
        componentsInScope: { type: 'array', items: { type: 'string' } },
        fmeaType: { type: 'string' },
        assumptions: { type: 'array', items: { type: 'string' } },
        team: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'system-definition']
}));

export const functionAnalysisTask = defineTask('function-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze system functions',
  skill: { name: 'root-cause-analyzer' },
  agent: {
    name: 'reliability-engineer',
    skills: ['root-cause-analyzer', 'causal-inference-engine'],
    prompt: {
      role: 'Functional analysis specialist',
      task: 'Identify and analyze all system and component functions',
      context: args,
      instructions: [
        'Identify all system-level functions',
        'Break down into component-level functions',
        'Define function requirements and performance criteria',
        'Create function hierarchy/tree',
        'Link functions to components',
        'Identify critical functions',
        'Document function interfaces',
        'Define function success criteria',
        'Note function dependencies',
        'Create function-component matrix'
      ],
      outputFormat: 'JSON with systemFunctions, componentFunctions, functionHierarchy, criticalFunctions, functionMatrix, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['systemFunctions', 'componentFunctions', 'artifacts'],
      properties: {
        systemFunctions: { type: 'array', items: { type: 'string' } },
        componentFunctions: {
          type: 'object',
          additionalProperties: { type: 'array', items: { type: 'string' } }
        },
        functionHierarchy: { type: 'object' },
        criticalFunctions: { type: 'array', items: { type: 'string' } },
        functionMatrix: { type: 'object' },
        dependencies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'function-analysis']
}));

export const failureModeIdentificationTask = defineTask('failure-mode-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify failure modes',
  skill: { name: 'root-cause-analyzer' },
  agent: {
    name: 'reliability-engineer',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Failure analysis expert',
      task: 'Identify all potential failure modes for each function',
      context: args,
      instructions: [
        'For each function, identify ways it could fail',
        'Consider complete failure, partial failure, intermittent failure',
        'Consider degraded performance failure modes',
        'Consider unintended function (doing something wrong)',
        'Consider timing-related failures (too early, too late)',
        'Use failure mode checklists for the domain',
        'Consider historical failures from similar systems',
        'Document failure mode descriptions',
        'Link failure modes to functions and components',
        'Count and categorize failure modes'
      ],
      outputFormat: 'JSON with failureModes, totalFailureModes, failureModesByComponent, failureModeTypes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['failureModes', 'totalFailureModes', 'artifacts'],
      properties: {
        failureModes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              component: { type: 'string' },
              function: { type: 'string' },
              failureMode: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string' }
            }
          }
        },
        totalFailureModes: { type: 'number' },
        failureModesByComponent: { type: 'object' },
        failureModeTypes: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'failure-mode-identification']
}));

export const failureEffectsAnalysisTask = defineTask('failure-effects-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze failure effects',
  skill: { name: 'causal-inference-engine' },
  agent: {
    name: 'reliability-engineer',
    skills: ['causal-inference-engine', 'root-cause-analyzer', 'hypothesis-generator'],
    prompt: {
      role: 'Failure effects analyst',
      task: 'Analyze the effects of each failure mode at multiple levels',
      context: args,
      instructions: [
        'For each failure mode, identify local effects',
        'Identify next-higher-level effects',
        'Identify end/system-level effects',
        'Consider effects on customer/user',
        'Consider safety effects',
        'Consider regulatory compliance effects',
        'Document effect chains',
        'Identify single-point failures',
        'Note secondary or cascading effects',
        'Classify effect severity potential'
      ],
      outputFormat: 'JSON with failureEffects, localEffects, systemEffects, customerEffects, safetyEffects, singlePointFailures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['failureEffects', 'artifacts'],
      properties: {
        failureEffects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              failureModeId: { type: 'string' },
              localEffect: { type: 'string' },
              nextLevelEffect: { type: 'string' },
              systemEffect: { type: 'string' },
              customerEffect: { type: 'string' }
            }
          }
        },
        localEffects: { type: 'array' },
        systemEffects: { type: 'array' },
        customerEffects: { type: 'array' },
        safetyEffects: { type: 'array' },
        singlePointFailures: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'effects-analysis']
}));

export const severityAssessmentTask = defineTask('severity-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess severity',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'reliability-engineer',
    skills: ['bayesian-inference-engine', 'root-cause-analyzer'],
    prompt: {
      role: 'Severity rating specialist',
      task: 'Assess the severity of each failure effect using standard FMEA severity scale',
      context: args,
      instructions: [
        'Use standard 1-10 severity scale',
        '10: Hazardous without warning (safety critical)',
        '9: Hazardous with warning',
        '8: Very high (system inoperable)',
        '7: High (significantly degraded)',
        '6: Moderate (partially degraded)',
        '5: Low (some degradation)',
        '4: Very low (minor degradation)',
        '3: Minor (slight annoyance)',
        '2: Very minor (noticed by few)',
        '1: None (no effect)',
        'Rate based on worst-case effect',
        'Document rationale for each rating',
        'Identify severity 9-10 items for special attention'
      ],
      outputFormat: 'JSON with severityRatings, severityDistribution, highSeverityItems, ratingRationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['severityRatings', 'severityDistribution', 'artifacts'],
      properties: {
        severityRatings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              failureModeId: { type: 'string' },
              severity: { type: 'number', minimum: 1, maximum: 10 },
              rationale: { type: 'string' }
            }
          }
        },
        severityDistribution: { type: 'object' },
        highSeverityItems: { type: 'array' },
        averageSeverity: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'severity-assessment']
}));

export const fmeaCauseAnalysisTask = defineTask('fmea-cause-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze failure causes',
  skill: { name: 'root-cause-analyzer' },
  agent: {
    name: 'reliability-engineer',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Root cause analyst',
      task: 'Identify potential causes for each failure mode',
      context: args,
      instructions: [
        'For each failure mode, identify potential causes',
        'Consider design-related causes',
        'Consider material-related causes',
        'Consider manufacturing/process causes',
        'Consider environment-related causes',
        'Consider human error causes',
        'Identify root causes vs symptoms',
        'Document cause mechanisms',
        'Link causes to failure modes',
        'Consider multiple causes per failure mode'
      ],
      outputFormat: 'JSON with causes, causesByFailureMode, causeCategories, rootCauses, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['causes', 'artifacts'],
      properties: {
        causes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              failureModeId: { type: 'string' },
              causes: { type: 'array', items: { type: 'string' } },
              mechanisms: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        causesByFailureMode: { type: 'object' },
        causeCategories: { type: 'object' },
        rootCauses: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'cause-analysis']
}));

export const occurrenceAssessmentTask = defineTask('occurrence-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess occurrence likelihood',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'reliability-engineer',
    skills: ['bayesian-inference-engine', 'statistical-test-selector'],
    prompt: {
      role: 'Occurrence rating specialist',
      task: 'Assess the likelihood of each cause occurring using standard FMEA occurrence scale',
      context: args,
      instructions: [
        'Use standard 1-10 occurrence scale',
        '10: Very high (almost inevitable)',
        '9: Very high',
        '8: High (repeated failures)',
        '7: High',
        '6: Moderate (occasional failures)',
        '5: Moderate',
        '4: Low (relatively few failures)',
        '3: Low',
        '2: Very low (isolated failures)',
        '1: Remote (failure unlikely)',
        'Base on historical data if available',
        'Consider similar systems if no data',
        'Document rationale for ratings'
      ],
      outputFormat: 'JSON with occurrenceRatings, occurrenceDistribution, highOccurrenceItems, dataSource, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['occurrenceRatings', 'occurrenceDistribution', 'artifacts'],
      properties: {
        occurrenceRatings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              failureModeId: { type: 'string' },
              cause: { type: 'string' },
              occurrence: { type: 'number', minimum: 1, maximum: 10 },
              rationale: { type: 'string' },
              dataSource: { type: 'string' }
            }
          }
        },
        occurrenceDistribution: { type: 'object' },
        highOccurrenceItems: { type: 'array' },
        averageOccurrence: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'occurrence-assessment']
}));

export const currentControlsAnalysisTask = defineTask('current-controls-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze current controls',
  skill: { name: 'root-cause-analyzer' },
  agent: {
    name: 'reliability-engineer',
    skills: ['root-cause-analyzer', 'causal-inference-engine'],
    prompt: {
      role: 'Controls analyst',
      task: 'Identify and document current controls that prevent or detect failures',
      context: args,
      instructions: [
        'Identify prevention controls (prevent cause from occurring)',
        'Identify detection controls (detect failure mode or cause)',
        'Document design controls',
        'Document process controls',
        'Document test and inspection controls',
        'Assess effectiveness of each control',
        'Identify gaps in current controls',
        'Note controls applied to multiple failure modes',
        'Document control verification methods',
        'Link controls to failure modes and causes'
      ],
      outputFormat: 'JSON with controls, preventionControls, detectionControls, controlGaps, controlEffectiveness, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['controls', 'artifacts'],
      properties: {
        controls: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              failureModeId: { type: 'string' },
              preventionControls: { type: 'array', items: { type: 'string' } },
              detectionControls: { type: 'array', items: { type: 'string' } },
              effectiveness: { type: 'string' }
            }
          }
        },
        preventionControls: { type: 'array' },
        detectionControls: { type: 'array' },
        controlGaps: { type: 'array', items: { type: 'string' } },
        controlEffectiveness: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'controls-analysis']
}));

export const detectionAssessmentTask = defineTask('detection-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess detection capability',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'reliability-engineer',
    skills: ['bayesian-inference-engine', 'root-cause-analyzer'],
    prompt: {
      role: 'Detection rating specialist',
      task: 'Assess detection capability using standard FMEA detection scale',
      context: args,
      instructions: [
        'Use standard 1-10 detection scale (inverse - lower is better)',
        '10: Absolute uncertainty (no detection possible)',
        '9: Very remote (unlikely to detect)',
        '8: Remote',
        '7: Very low (poor detection chance)',
        '6: Low',
        '5: Moderate (may detect)',
        '4: Moderately high',
        '3: High (good detection chance)',
        '2: Very high (almost certain detection)',
        '1: Almost certain (detection assured)',
        'Rate based on current controls',
        'Consider timing of detection',
        'Document rationale for ratings'
      ],
      outputFormat: 'JSON with detectionRatings, detectionDistribution, poorDetectionItems, averageDetection, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['detectionRatings', 'detectionDistribution', 'artifacts'],
      properties: {
        detectionRatings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              failureModeId: { type: 'string' },
              detection: { type: 'number', minimum: 1, maximum: 10 },
              detectionMethod: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        detectionDistribution: { type: 'object' },
        poorDetectionItems: { type: 'array' },
        averageDetection: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'detection-assessment']
}));

export const rpnCalculationTask = defineTask('rpn-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate Risk Priority Numbers',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'reliability-engineer',
    skills: ['bayesian-inference-engine', 'statistical-test-selector', 'root-cause-analyzer'],
    prompt: {
      role: 'Risk calculation specialist',
      task: 'Calculate RPN for each failure mode and categorize by risk level',
      context: args,
      instructions: [
        'Calculate RPN = Severity x Occurrence x Detection',
        'RPN ranges from 1 to 1000',
        'Categorize as High Risk (RPN >= threshold)',
        'Categorize as Medium Risk',
        'Categorize as Low Risk',
        'Also flag high severity items (S >= 9)',
        'Rank failure modes by RPN',
        'Calculate statistics (max, average, distribution)',
        'Identify Pareto analysis (top 20% causing 80% risk)',
        'Generate RPN summary report'
      ],
      outputFormat: 'JSON with rpnAnalysis, highRiskCount, mediumRiskCount, lowRiskCount, maxRPN, averageRPN, rankedFailureModes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rpnAnalysis', 'highRiskCount', 'maxRPN', 'averageRPN', 'artifacts'],
      properties: {
        rpnAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              failureModeId: { type: 'string' },
              severity: { type: 'number' },
              occurrence: { type: 'number' },
              detection: { type: 'number' },
              rpn: { type: 'number' },
              riskLevel: { type: 'string' }
            }
          }
        },
        highRiskCount: { type: 'number' },
        mediumRiskCount: { type: 'number' },
        lowRiskCount: { type: 'number' },
        maxRPN: { type: 'number' },
        averageRPN: { type: 'number' },
        rankedFailureModes: { type: 'array' },
        paretoAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'rpn-calculation']
}));

export const actionPrioritizationTask = defineTask('action-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize recommended actions',
  skill: { name: 'root-cause-analyzer' },
  agent: {
    name: 'reliability-engineer',
    skills: ['root-cause-analyzer', 'bayesian-inference-engine'],
    prompt: {
      role: 'Action prioritization specialist',
      task: 'Prioritize actions based on RPN and severity',
      context: args,
      instructions: [
        'Identify failure modes requiring action (RPN > threshold or S >= threshold)',
        'Prioritize by severity first, then RPN',
        'Consider cost-benefit of actions',
        'Group related failure modes for combined actions',
        'Identify quick wins',
        'Identify strategic improvements',
        'Create prioritized action list',
        'Document prioritization criteria',
        'Note any constraints on actions',
        'Recommend action timeline'
      ],
      outputFormat: 'JSON with prioritizedFailures, prioritizedActions, quickWins, strategicActions, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedFailures', 'prioritizedActions', 'artifacts'],
      properties: {
        prioritizedFailures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              failureModeId: { type: 'string' },
              rpn: { type: 'number' },
              severity: { type: 'number' },
              priority: { type: 'number' }
            }
          }
        },
        prioritizedActions: { type: 'array' },
        quickWins: { type: 'array' },
        strategicActions: { type: 'array' },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'action-prioritization']
}));

export const mitigationDevelopmentTask = defineTask('mitigation-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop mitigation strategies',
  skill: { name: 'root-cause-analyzer' },
  agent: {
    name: 'reliability-engineer',
    skills: ['root-cause-analyzer', 'hypothesis-generator', 'triz-inventive-solver'],
    prompt: {
      role: 'Mitigation strategy developer',
      task: 'Develop recommended actions to reduce risk',
      context: args,
      instructions: [
        'For each prioritized failure, develop mitigation actions',
        'Consider actions to reduce severity (if possible)',
        'Develop actions to reduce occurrence (prevention)',
        'Develop actions to improve detection',
        'Prioritize reducing severity and occurrence over detection',
        'Assign responsibility for each action',
        'Set target completion dates',
        'Estimate revised S, O, D after action',
        'Calculate target RPN after mitigation',
        'Document verification method for each action'
      ],
      outputFormat: 'JSON with mitigations, estimatedRPNReduction, responsibilityMatrix, verificationMethods, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mitigations', 'artifacts'],
      properties: {
        mitigations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              failureModeId: { type: 'string' },
              action: { type: 'string' },
              actionType: { type: 'string', enum: ['severity', 'occurrence', 'detection'] },
              responsible: { type: 'string' },
              targetDate: { type: 'string' },
              currentRPN: { type: 'number' },
              targetRPN: { type: 'number' },
              verification: { type: 'string' }
            }
          }
        },
        estimatedRPNReduction: { type: 'number' },
        responsibilityMatrix: { type: 'object' },
        verificationMethods: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'mitigation-development']
}));

export const fmeaTableGenerationTask = defineTask('fmea-table-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate FMEA table',
  skill: { name: 'root-cause-analyzer' },
  agent: {
    name: 'reliability-engineer',
    skills: ['root-cause-analyzer', 'hypothesis-generator'],
    prompt: {
      role: 'FMEA documentation specialist',
      task: 'Generate complete FMEA table/worksheet',
      context: args,
      instructions: [
        'Compile all data into standard FMEA table format',
        'Include all required columns per AIAG-VDA standard',
        'Sort by RPN or severity as appropriate',
        'Highlight high-risk items',
        'Include both current state and recommended actions',
        'Format for readability',
        'Generate summary statistics',
        'Create executive summary',
        'Prepare for stakeholder review',
        'Generate multiple output formats'
      ],
      outputFormat: 'JSON with table, summary, statistics, outputFormats, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['table', 'summary', 'artifacts'],
      properties: {
        table: { type: 'array' },
        summary: { type: 'string' },
        statistics: {
          type: 'object',
          properties: {
            totalFailureModes: { type: 'number' },
            highRiskCount: { type: 'number' },
            actionsRequired: { type: 'number' }
          }
        },
        outputFormats: { type: 'array', items: { type: 'string' } },
        tablePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'table-generation']
}));

export const fmeaQualityScoringTask = defineTask('fmea-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score FMEA quality',
  skill: { name: 'root-cause-analyzer' },
  agent: {
    name: 'reliability-engineer',
    skills: ['root-cause-analyzer', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'FMEA quality auditor',
      task: 'Assess the quality and completeness of the FMEA',
      context: args,
      instructions: [
        'Score scope definition completeness (0-100)',
        'Score failure mode identification coverage (0-100)',
        'Score rating consistency and justification (0-100)',
        'Score mitigation adequacy (0-100)',
        'Score documentation completeness (0-100)',
        'Calculate overall quality score',
        'Compare against AIAG-VDA requirements',
        'Identify gaps in the FMEA',
        'Recommend improvements',
        'Assess readiness for stakeholder review'
      ],
      outputFormat: 'JSON with overallScore, completenessScore, rigorScore, componentScores, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'completenessScore', 'rigorScore', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        completenessScore: { type: 'number', minimum: 0, maximum: 100 },
        rigorScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            scopeDefinition: { type: 'number' },
            failureModeIdentification: { type: 'number' },
            ratingConsistency: { type: 'number' },
            mitigationAdequacy: { type: 'number' },
            documentation: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        standardsCompliance: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'quality-scoring']
}));
