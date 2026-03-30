/**
 * @process scientific-discovery/failure-mode-edge-case-analysis
 * @description Failure Mode and Edge Case Analysis process - Proactively identify how theories, models, or experiments can fail
 * @inputs { subject: object, subjectType: string, context: object, outputDir: string }
 * @outputs { success: boolean, failureModes: array, edgeCases: array, mitigations: array, robustnessScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    subject = {},
    subjectType = 'theory', // theory, model, experiment, methodology
    context = {},
    outputDir = 'failure-analysis-output',
    thoroughness = 'comprehensive'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Failure Mode and Edge Case Analysis Process');

  // ============================================================================
  // PHASE 1: SUBJECT DECOMPOSITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Decomposing subject into analyzable components');
  const subjectDecomposition = await ctx.task(subjectDecompositionTask, {
    subject,
    subjectType,
    context,
    outputDir
  });

  artifacts.push(...subjectDecomposition.artifacts);

  // ============================================================================
  // PHASE 2: ASSUMPTION ENUMERATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Enumerating assumptions and dependencies');
  const assumptionEnumeration = await ctx.task(assumptionEnumerationTask, {
    components: subjectDecomposition.components,
    subjectType,
    outputDir
  });

  artifacts.push(...assumptionEnumeration.artifacts);

  // ============================================================================
  // PHASE 3: FAILURE MODE IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Identifying potential failure modes');
  const failureModeIdentification = await ctx.task(failureModeIdentificationTask, {
    components: subjectDecomposition.components,
    assumptions: assumptionEnumeration.assumptions,
    subjectType,
    outputDir
  });

  artifacts.push(...failureModeIdentification.artifacts);

  // ============================================================================
  // PHASE 4: EDGE CASE DISCOVERY
  // ============================================================================

  ctx.log('info', 'Phase 4: Discovering edge cases');
  const edgeCaseDiscovery = await ctx.task(edgeCaseDiscoveryTask, {
    components: subjectDecomposition.components,
    assumptions: assumptionEnumeration.assumptions,
    failureModes: failureModeIdentification.failureModes,
    subjectType,
    outputDir
  });

  artifacts.push(...edgeCaseDiscovery.artifacts);

  // Breakpoint: Review failure modes and edge cases
  await ctx.breakpoint({
    question: `Identified ${failureModeIdentification.failureModes.length} failure modes and ${edgeCaseDiscovery.edgeCases.length} edge cases. Review before impact analysis?`,
    title: 'Failure Mode and Edge Case Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        subjectType,
        componentCount: subjectDecomposition.components.length,
        failureModeCount: failureModeIdentification.failureModes.length,
        edgeCaseCount: edgeCaseDiscovery.edgeCases.length
      }
    }
  });

  // ============================================================================
  // PHASE 5: IMPACT AND SEVERITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing impact and severity');
  const impactAnalysis = await ctx.task(impactSeverityTask, {
    failureModes: failureModeIdentification.failureModes,
    edgeCases: edgeCaseDiscovery.edgeCases,
    subject,
    subjectType,
    outputDir
  });

  artifacts.push(...impactAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: PROBABILITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Assessing failure probabilities');
  const probabilityAssessment = await ctx.task(probabilityAssessmentTask, {
    failureModes: failureModeIdentification.failureModes,
    edgeCases: edgeCaseDiscovery.edgeCases,
    context,
    outputDir
  });

  artifacts.push(...probabilityAssessment.artifacts);

  // ============================================================================
  // PHASE 7: RISK PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Prioritizing risks');
  const riskPrioritization = await ctx.task(riskPrioritizationTask, {
    failureModes: failureModeIdentification.failureModes,
    edgeCases: edgeCaseDiscovery.edgeCases,
    impacts: impactAnalysis.impacts,
    probabilities: probabilityAssessment.probabilities,
    outputDir
  });

  artifacts.push(...riskPrioritization.artifacts);

  // ============================================================================
  // PHASE 8: MITIGATION DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Developing mitigations');
  const mitigationDevelopment = await ctx.task(mitigationDevelopmentTask, {
    prioritizedRisks: riskPrioritization.prioritizedRisks,
    subject,
    subjectType,
    outputDir
  });

  artifacts.push(...mitigationDevelopment.artifacts);

  // ============================================================================
  // PHASE 9: ROBUSTNESS ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 9: Assessing overall robustness');
  const robustnessAssessment = await ctx.task(robustnessAssessmentTask, {
    failureModes: failureModeIdentification.failureModes,
    edgeCases: edgeCaseDiscovery.edgeCases,
    mitigations: mitigationDevelopment.mitigations,
    prioritizedRisks: riskPrioritization.prioritizedRisks,
    outputDir
  });

  artifacts.push(...robustnessAssessment.artifacts);

  // Final breakpoint
  await ctx.breakpoint({
    question: `Failure analysis complete. Robustness score: ${robustnessAssessment.robustnessScore}%. ${mitigationDevelopment.mitigations.length} mitigations proposed. Review final assessment?`,
    title: 'Failure Analysis Complete',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        robustnessScore: robustnessAssessment.robustnessScore,
        criticalRisks: riskPrioritization.criticalRisks.length,
        mitigationCount: mitigationDevelopment.mitigations.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    subjectType,
    components: subjectDecomposition.components,
    assumptions: assumptionEnumeration.assumptions,
    failureModes: failureModeIdentification.failureModes,
    edgeCases: edgeCaseDiscovery.edgeCases,
    riskAssessment: {
      prioritizedRisks: riskPrioritization.prioritizedRisks,
      criticalRisks: riskPrioritization.criticalRisks,
      riskMatrix: riskPrioritization.riskMatrix
    },
    mitigations: mitigationDevelopment.mitigations,
    robustnessScore: robustnessAssessment.robustnessScore,
    recommendations: robustnessAssessment.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/failure-mode-edge-case-analysis',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Subject Decomposition
export const subjectDecompositionTask = defineTask('subject-decomposition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Decompose subject into analyzable components',
  agent: {
    name: 'decomposition-analyst',
    prompt: {
      role: 'systems analyst specializing in decomposition',
      task: 'Decompose the subject (theory/model/experiment) into components for failure analysis',
      context: args,
      instructions: [
        'Identify all major components of the subject',
        'For theories: identify axioms, principles, derivations, predictions',
        'For models: identify equations, parameters, boundary conditions, approximations',
        'For experiments: identify setup, measurement, analysis, interpretation',
        'Map dependencies between components',
        'Identify interfaces and connections',
        'Note which components are most critical',
        'Document component hierarchies',
        'Save decomposition to output directory'
      ],
      outputFormat: 'JSON with components (array with name, type, description, dependencies, criticality), hierarchy, interfaces, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'artifacts'],
      properties: {
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } },
              criticality: { type: 'string' }
            }
          }
        },
        hierarchy: { type: 'object' },
        interfaces: { type: 'array' },
        criticalComponents: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'failure-analysis', 'decomposition']
}));

// Task 2: Assumption Enumeration
export const assumptionEnumerationTask = defineTask('assumption-enumeration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Enumerate assumptions and dependencies',
  agent: {
    name: 'assumption-analyst',
    prompt: {
      role: 'critical analyst identifying assumptions',
      task: 'Enumerate all assumptions, both explicit and implicit, underlying each component',
      context: args,
      instructions: [
        'For each component, list explicit assumptions',
        'Identify implicit/hidden assumptions',
        'Note mathematical assumptions (continuity, linearity, etc.)',
        'Note physical assumptions (equilibrium, homogeneity, etc.)',
        'Note methodological assumptions',
        'Identify dependencies on external factors',
        'Assess validity range of each assumption',
        'Note which assumptions are most questionable',
        'Document assumption chains (A depends on B)',
        'Save assumptions to output directory'
      ],
      outputFormat: 'JSON with assumptions (array with assumption, type, component, validity, questionability), assumptionChains, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assumptions', 'artifacts'],
      properties: {
        assumptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              assumption: { type: 'string' },
              type: { type: 'string' },
              explicit: { type: 'boolean' },
              component: { type: 'string' },
              validityRange: { type: 'string' },
              questionability: { type: 'string' },
              dependsOn: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        assumptionChains: { type: 'array' },
        mostQuestionable: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'failure-analysis', 'assumption-enumeration']
}));

// Task 3: Failure Mode Identification
export const failureModeIdentificationTask = defineTask('failure-mode-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify potential failure modes',
  agent: {
    name: 'failure-mode-analyst',
    prompt: {
      role: 'reliability engineer identifying failure modes',
      task: 'Identify all potential ways the subject could fail or give wrong results',
      context: args,
      instructions: [
        'For each component, ask "how can this fail?"',
        'For each assumption, ask "what if this is wrong?"',
        'Identify logical failures (invalid reasoning)',
        'Identify empirical failures (wrong predictions)',
        'Identify applicability failures (used outside valid range)',
        'Consider systematic vs random failures',
        'Consider single-point failures vs cascading failures',
        'Identify failure modes from component interactions',
        'Note historical failures of similar subjects',
        'Save failure modes to output directory'
      ],
      outputFormat: 'JSON with failureModes (array with mode, type, trigger, component, consequence), cascadeChains, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['failureModes', 'artifacts'],
      properties: {
        failureModes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              mode: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string' },
              trigger: { type: 'string' },
              affectedComponent: { type: 'string' },
              consequence: { type: 'string' },
              detectable: { type: 'boolean' },
              detectabilityMethod: { type: 'string' }
            }
          }
        },
        cascadeChains: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              initialFailure: { type: 'string' },
              cascade: { type: 'array', items: { type: 'string' } },
              finalConsequence: { type: 'string' }
            }
          }
        },
        historicalFailures: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'failure-analysis', 'failure-modes']
}));

// Task 4: Edge Case Discovery
export const edgeCaseDiscoveryTask = defineTask('edge-case-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discover edge cases',
  agent: {
    name: 'edge-case-hunter',
    prompt: {
      role: 'scientist specializing in boundary conditions',
      task: 'Identify edge cases where the subject may behave unexpectedly or fail',
      context: args,
      instructions: [
        'Identify parameter extremes (very small, very large)',
        'Find boundary conditions where behavior changes',
        'Identify singular limits',
        'Find cases where approximations break down',
        'Identify regime transitions',
        'Find cases near phase boundaries',
        'Identify rare but possible scenarios',
        'Consider zero, negative, infinite values',
        'Find corner cases in parameter space',
        'Consider time evolution edge cases',
        'Save edge cases to output directory'
      ],
      outputFormat: 'JSON with edgeCases (array with case, parameters, expectedIssue, likelihood), regimeTransitions, singularities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['edgeCases', 'artifacts'],
      properties: {
        edgeCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              case: { type: 'string' },
              description: { type: 'string' },
              parameters: { type: 'object' },
              expectedIssue: { type: 'string' },
              likelihood: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        regimeTransitions: { type: 'array' },
        singularities: { type: 'array' },
        cornerCases: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'failure-analysis', 'edge-cases']
}));

// Task 5: Impact and Severity Analysis
export const impactSeverityTask = defineTask('impact-severity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze impact and severity',
  agent: {
    name: 'impact-analyst',
    prompt: {
      role: 'risk analyst assessing impact',
      task: 'Assess the impact and severity of each failure mode and edge case',
      context: args,
      instructions: [
        'For each failure mode, assess consequence severity',
        'Classify: catastrophic, major, moderate, minor',
        'Assess scope of impact (local vs global)',
        'Determine if failure is recoverable',
        'Assess impact on downstream users/applications',
        'Consider reputational impact if applicable',
        'Assess impact on scientific conclusions',
        'Determine if failure would be noticed',
        'Rate overall severity for each item',
        'Save impact analysis to output directory'
      ],
      outputFormat: 'JSON with impacts (array with itemId, severity, scope, recoverability, downstream, overall), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['impacts', 'artifacts'],
      properties: {
        impacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              itemId: { type: 'string' },
              itemType: { type: 'string' },
              severityCategory: { type: 'string' },
              scope: { type: 'string' },
              recoverability: { type: 'string' },
              downstreamImpact: { type: 'string' },
              noticeability: { type: 'string' },
              overallSeverityScore: { type: 'number' }
            }
          }
        },
        severityDistribution: { type: 'object' },
        catastrophicItems: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'failure-analysis', 'impact-severity']
}));

// Task 6: Probability Assessment
export const probabilityAssessmentTask = defineTask('probability-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess failure probabilities',
  agent: {
    name: 'probability-analyst',
    prompt: {
      role: 'probabilist assessing failure likelihood',
      task: 'Assess the probability of each failure mode and edge case occurring',
      context: args,
      instructions: [
        'Estimate probability of each failure mode',
        'Consider: certain, likely, possible, unlikely, rare',
        'Account for usage patterns and contexts',
        'Consider frequency of encountering edge cases',
        'Account for historical failure rates if known',
        'Consider dependencies (conditional probabilities)',
        'Account for operator/user factors',
        'Consider environmental variations',
        'Assign probability scores',
        'Save probability assessment to output directory'
      ],
      outputFormat: 'JSON with probabilities (array with itemId, probability, confidence, basis), probabilityDistribution, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['probabilities', 'artifacts'],
      properties: {
        probabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              itemId: { type: 'string' },
              probabilityCategory: { type: 'string' },
              probabilityScore: { type: 'number' },
              confidence: { type: 'string' },
              basis: { type: 'string' },
              contextDependence: { type: 'string' }
            }
          }
        },
        probabilityDistribution: { type: 'object' },
        highProbabilityItems: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'failure-analysis', 'probability-assessment']
}));

// Task 7: Risk Prioritization
export const riskPrioritizationTask = defineTask('risk-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize risks',
  agent: {
    name: 'risk-prioritizer',
    prompt: {
      role: 'risk manager prioritizing risks',
      task: 'Prioritize risks by combining probability and impact assessments',
      context: args,
      instructions: [
        'Calculate risk score = probability x impact',
        'Create risk matrix',
        'Identify critical risks (high probability AND high impact)',
        'Rank all risks by overall risk score',
        'Identify risk clusters',
        'Note risks with high uncertainty',
        'Identify acceptable vs unacceptable risks',
        'Consider risk interactions',
        'Document prioritization rationale',
        'Save prioritized risks to output directory'
      ],
      outputFormat: 'JSON with prioritizedRisks (sorted array with risk details), riskMatrix, criticalRisks, riskClusters, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedRisks', 'criticalRisks', 'riskMatrix', 'artifacts'],
      properties: {
        prioritizedRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              itemId: { type: 'string' },
              riskScore: { type: 'number' },
              priority: { type: 'number' },
              probability: { type: 'number' },
              impact: { type: 'number' },
              category: { type: 'string' }
            }
          }
        },
        criticalRisks: { type: 'array', items: { type: 'string' } },
        riskMatrix: { type: 'object' },
        riskClusters: { type: 'array' },
        acceptableRisks: { type: 'array', items: { type: 'string' } },
        unacceptableRisks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'failure-analysis', 'risk-prioritization']
}));

// Task 8: Mitigation Development
export const mitigationDevelopmentTask = defineTask('mitigation-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop mitigations',
  agent: {
    name: 'mitigation-developer',
    prompt: {
      role: 'engineer developing risk mitigations',
      task: 'Develop mitigations for prioritized risks',
      context: args,
      instructions: [
        'For each critical risk, develop mitigation strategy',
        'Consider: elimination, reduction, transfer, acceptance',
        'Design preventive measures',
        'Design detection measures',
        'Design recovery measures',
        'Assess mitigation effectiveness',
        'Assess mitigation cost/effort',
        'Identify residual risk after mitigation',
        'Prioritize mitigations by effectiveness/cost',
        'Save mitigations to output directory'
      ],
      outputFormat: 'JSON with mitigations (array with risk, strategy, measures, effectiveness, cost, residualRisk), mitigationPlan, artifacts'
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
              riskId: { type: 'string' },
              strategy: { type: 'string' },
              preventiveMeasures: { type: 'array', items: { type: 'string' } },
              detectionMeasures: { type: 'array', items: { type: 'string' } },
              recoveryMeasures: { type: 'array', items: { type: 'string' } },
              effectiveness: { type: 'number' },
              cost: { type: 'string' },
              residualRisk: { type: 'number' }
            }
          }
        },
        mitigationPlan: { type: 'object' },
        unmitgatableRisks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'failure-analysis', 'mitigation']
}));

// Task 9: Robustness Assessment
export const robustnessAssessmentTask = defineTask('robustness-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess overall robustness',
  agent: {
    name: 'robustness-assessor',
    prompt: {
      role: 'senior scientist assessing robustness',
      task: 'Assess overall robustness of the subject after failure analysis',
      context: args,
      instructions: [
        'Calculate overall robustness score (0-100)',
        'Assess residual risk profile after mitigations',
        'Identify remaining vulnerabilities',
        'Assess confidence in the subject given failure analysis',
        'Compare to similar subjects if possible',
        'Identify areas needing most improvement',
        'Generate recommendations for improving robustness',
        'Document known limitations',
        'Provide overall assessment summary',
        'Save robustness assessment to output directory'
      ],
      outputFormat: 'JSON with robustnessScore, residualRiskProfile, vulnerabilities, confidence, recommendations, summary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['robustnessScore', 'recommendations', 'artifacts'],
      properties: {
        robustnessScore: { type: 'number', minimum: 0, maximum: 100 },
        residualRiskProfile: { type: 'object' },
        remainingVulnerabilities: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        strengthAreas: { type: 'array', items: { type: 'string' } },
        weaknessAreas: { type: 'array', items: { type: 'string' } },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string' },
              expectedImprovement: { type: 'string' }
            }
          }
        },
        knownLimitations: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'failure-analysis', 'robustness-assessment']
}));
