/**
 * @process Adversarial Red-Team Reasoning
 * @description Systematically attack arguments, plans, or models from an adversarial stance to find weaknesses before deployment
 * @category Scientific Discovery - Meta-Level and Reflective
 * @inputs {{ target: object, targetType: string, context: object, constraints: object }}
 * @outputs {{ vulnerabilities: array, attackVectors: array, recommendations: array, robustnessAssessment: object }}
 * @example
 * // Input: { target: { type: "argument", content: "..." }, targetType: "argument", context: {...} }
 * // Output: { vulnerabilities: [...], attackVectors: [...], robustnessAssessment: { score: 0.65, weaknesses: [...] } }
 * @references Red teaming methodology, Adversarial analysis, Devil's advocate technique, Pre-mortem analysis
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  // Phase 1: Target Analysis
  const targetAnalysis = await ctx.task(analyzeTargetTask, {
    target: inputs.target,
    targetType: inputs.targetType,
    context: inputs.context
  });

  // Phase 2: Attack Surface Mapping
  const attackSurface = await ctx.task(mapAttackSurfaceTask, {
    target: targetAnalysis.analyzedTarget,
    targetType: inputs.targetType,
    components: targetAnalysis.components,
    dependencies: targetAnalysis.dependencies
  });

  // Phase 3: Threat Modeling
  const threatModel = await ctx.task(modelThreatsTask, {
    attackSurface: attackSurface.surface,
    targetType: inputs.targetType,
    adversaryProfiles: inputs.context?.adversaryProfiles,
    threatCategories: inputs.context?.threatCategories
  });

  // Phase 4: Vulnerability Discovery
  const vulnerabilityDiscovery = await ctx.task(discoverVulnerabilitiesTask, {
    target: targetAnalysis.analyzedTarget,
    attackSurface: attackSurface.surface,
    threatModel: threatModel,
    knownVulnerabilityPatterns: inputs.context?.knownPatterns
  });

  // Phase 5: Attack Vector Development
  const attackVectors = await ctx.task(developAttackVectorsTask, {
    vulnerabilities: vulnerabilityDiscovery.vulnerabilities,
    threatModel: threatModel,
    targetType: inputs.targetType,
    constraints: inputs.constraints
  });

  // Phase 6: Attack Simulation
  const attackSimulation = await ctx.task(simulateAttacksTask, {
    attackVectors: attackVectors.vectors,
    target: targetAnalysis.analyzedTarget,
    simulationParameters: inputs.context?.simulationParams
  });

  // Quality Gate: Critical Vulnerabilities
  if (attackSimulation.criticalVulnerabilities.length > 0) {
    await ctx.breakpoint('critical-vulnerabilities-found', {
      message: 'Critical vulnerabilities discovered',
      criticalVulnerabilities: attackSimulation.criticalVulnerabilities,
      immediateRecommendations: attackSimulation.immediateActions
    });
  }

  // Phase 7: Defense Evasion Analysis
  const evasionAnalysis = await ctx.task(analyzeDefenseEvasionTask, {
    existingDefenses: inputs.context?.defenses,
    attackVectors: attackVectors.vectors,
    simulationResults: attackSimulation.results
  });

  // Phase 8: Cascading Failure Analysis
  const cascadeAnalysis = await ctx.task(analyzeCascadingFailuresTask, {
    vulnerabilities: vulnerabilityDiscovery.vulnerabilities,
    attackVectors: attackVectors.vectors,
    systemDependencies: targetAnalysis.dependencies,
    targetType: inputs.targetType
  });

  // Phase 9: Robustness Assessment
  const robustnessAssessment = await ctx.task(assessRobustnessTask, {
    vulnerabilities: vulnerabilityDiscovery.vulnerabilities,
    attackSimulation: attackSimulation,
    cascadeAnalysis: cascadeAnalysis,
    defenseEvasion: evasionAnalysis
  });

  // Phase 10: Mitigation Recommendations
  const mitigations = await ctx.task(recommendMitigationsTask, {
    vulnerabilities: vulnerabilityDiscovery.vulnerabilities,
    attackVectors: attackVectors.vectors,
    robustnessAssessment: robustnessAssessment,
    constraints: inputs.constraints
  });

  return {
    success: true,
    reasoningType: 'Adversarial Red-Team Reasoning',
    vulnerabilities: vulnerabilityDiscovery.vulnerabilities.map(v => ({
      id: v.id,
      description: v.description,
      severity: v.severity,
      exploitability: v.exploitability,
      impactArea: v.impactArea,
      evidence: v.evidence
    })),
    attackVectors: attackVectors.vectors.map(av => ({
      id: av.id,
      name: av.name,
      description: av.description,
      targetVulnerabilities: av.targetVulnerabilities,
      successProbability: av.successProbability,
      impact: av.impact,
      prerequisites: av.prerequisites
    })),
    attackSimulation: {
      results: attackSimulation.results,
      successfulAttacks: attackSimulation.successfulAttacks,
      criticalVulnerabilities: attackSimulation.criticalVulnerabilities
    },
    defenseAnalysis: {
      evasionCapabilities: evasionAnalysis.evasionCapabilities,
      defenseGaps: evasionAnalysis.gaps,
      blindSpots: evasionAnalysis.blindSpots
    },
    cascadeRisks: {
      cascadePatterns: cascadeAnalysis.patterns,
      amplificationFactors: cascadeAnalysis.amplificationFactors,
      systemicRisks: cascadeAnalysis.systemicRisks
    },
    robustnessAssessment: {
      score: robustnessAssessment.overallScore,
      weaknesses: robustnessAssessment.keyWeaknesses,
      strengths: robustnessAssessment.strengths,
      riskLevel: robustnessAssessment.riskLevel
    },
    recommendations: mitigations.recommendations,
    prioritizedActions: mitigations.prioritizedActions,
    confidence: robustnessAssessment.assessmentConfidence
  };
}

export const analyzeTargetTask = defineTask('redteam-target-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Target Analysis',
  agent: {
    name: 'critical-evaluator',
    skills: ['hypothesis-generator', 'formal-logic-reasoner', 'causal-inference-engine'],
    prompt: {
      role: 'Red team target analysis specialist',
      task: 'Analyze the target for adversarial assessment',
      context: args,
      instructions: [
        'Understand target structure and purpose',
        'Identify key components',
        'Map dependencies and interfaces',
        'Identify critical assets',
        'Understand threat context',
        'Document target characteristics'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['analyzedTarget', 'components', 'dependencies'],
      properties: {
        analyzedTarget: { type: 'object' },
        components: { type: 'array' },
        dependencies: { type: 'array' },
        criticalAssets: { type: 'array' },
        threatContext: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['red-team', 'target-analysis']
}));

export const mapAttackSurfaceTask = defineTask('redteam-attack-surface', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Attack Surface Mapping',
  agent: {
    name: 'critical-evaluator',
    skills: ['hypothesis-generator', 'formal-logic-reasoner', 'causal-inference-engine'],
    prompt: {
      role: 'Attack surface mapping specialist',
      task: 'Map the attack surface of the target',
      context: args,
      instructions: [
        'Identify all entry points',
        'Map interfaces and boundaries',
        'Identify exposed components',
        'Assess accessibility of attack points',
        'Categorize attack surface areas',
        'Document surface topology'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['surface', 'entryPoints'],
      properties: {
        surface: { type: 'object' },
        entryPoints: { type: 'array' },
        interfaces: { type: 'array' },
        exposedComponents: { type: 'array' },
        surfaceCategories: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['red-team', 'attack-surface']
}));

export const modelThreatsTask = defineTask('redteam-threat-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Threat Modeling',
  agent: {
    name: 'critical-evaluator',
    skills: ['hypothesis-generator', 'formal-logic-reasoner', 'causal-inference-engine'],
    prompt: {
      role: 'Threat modeling specialist',
      task: 'Model potential threats to the target',
      context: args,
      instructions: [
        'Identify threat actors',
        'Model adversary capabilities',
        'Assess adversary motivations',
        'Map threats to attack surface',
        'Categorize threat types',
        'Prioritize threats by risk'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['threats', 'threatActors'],
      properties: {
        threats: { type: 'array' },
        threatActors: { type: 'array' },
        adversaryCapabilities: { type: 'object' },
        threatToSurfaceMapping: { type: 'object' },
        threatPriorities: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['red-team', 'threat-modeling']
}));

export const discoverVulnerabilitiesTask = defineTask('redteam-vulnerability-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Vulnerability Discovery',
  agent: {
    name: 'critical-evaluator',
    skills: ['hypothesis-generator', 'formal-logic-reasoner', 'causal-inference-engine'],
    prompt: {
      role: 'Vulnerability discovery specialist',
      task: 'Discover vulnerabilities in the target',
      context: args,
      instructions: [
        'Systematically probe for weaknesses',
        'Identify logical flaws',
        'Find assumption violations',
        'Discover edge case failures',
        'Assess vulnerability severity',
        'Document exploitation potential'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities'],
      properties: {
        vulnerabilities: { type: 'array' },
        logicalFlaws: { type: 'array' },
        assumptionViolations: { type: 'array' },
        edgeCaseFailures: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['red-team', 'vulnerability-discovery']
}));

export const developAttackVectorsTask = defineTask('redteam-attack-vectors', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Attack Vector Development',
  agent: {
    name: 'critical-evaluator',
    skills: ['hypothesis-generator', 'formal-logic-reasoner', 'causal-inference-engine'],
    prompt: {
      role: 'Attack vector development specialist',
      task: 'Develop concrete attack vectors',
      context: args,
      instructions: [
        'Design attack scenarios',
        'Chain vulnerabilities together',
        'Develop exploitation techniques',
        'Assess attack prerequisites',
        'Estimate success probability',
        'Document attack procedures'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['vectors'],
      properties: {
        vectors: { type: 'array' },
        attackChains: { type: 'array' },
        exploitationTechniques: { type: 'array' },
        attackPrerequisites: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['red-team', 'attack-vectors']
}));

export const simulateAttacksTask = defineTask('redteam-attack-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Attack Simulation',
  agent: {
    name: 'critical-evaluator',
    skills: ['hypothesis-generator', 'formal-logic-reasoner', 'causal-inference-engine'],
    prompt: {
      role: 'Attack simulation specialist',
      task: 'Simulate attacks against the target',
      context: args,
      instructions: [
        'Execute simulated attacks',
        'Assess attack outcomes',
        'Identify successful attacks',
        'Measure impact of attacks',
        'Identify critical vulnerabilities',
        'Document simulation results'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'successfulAttacks', 'criticalVulnerabilities'],
      properties: {
        results: { type: 'array' },
        successfulAttacks: { type: 'array' },
        criticalVulnerabilities: { type: 'array' },
        impactAssessments: { type: 'array' },
        immediateActions: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['red-team', 'attack-simulation']
}));

export const analyzeDefenseEvasionTask = defineTask('redteam-defense-evasion', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Defense Evasion Analysis',
  agent: {
    name: 'critical-evaluator',
    skills: ['hypothesis-generator', 'formal-logic-reasoner', 'causal-inference-engine'],
    prompt: {
      role: 'Defense evasion analyst',
      task: 'Analyze how attacks could evade existing defenses',
      context: args,
      instructions: [
        'Map existing defenses',
        'Identify defense gaps',
        'Develop evasion techniques',
        'Find blind spots',
        'Assess defense coverage',
        'Document evasion capabilities'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['evasionCapabilities', 'gaps', 'blindSpots'],
      properties: {
        evasionCapabilities: { type: 'array' },
        gaps: { type: 'array' },
        blindSpots: { type: 'array' },
        existingDefenses: { type: 'array' },
        defenseCoverage: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['red-team', 'defense-evasion']
}));

export const analyzeCascadingFailuresTask = defineTask('redteam-cascade-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Cascading Failure Analysis',
  agent: {
    name: 'critical-evaluator',
    skills: ['hypothesis-generator', 'formal-logic-reasoner', 'causal-inference-engine'],
    prompt: {
      role: 'Cascading failure analyst',
      task: 'Analyze potential cascading failures',
      context: args,
      instructions: [
        'Identify cascade patterns',
        'Map failure propagation paths',
        'Assess amplification factors',
        'Identify systemic risks',
        'Evaluate containment boundaries',
        'Document cascade scenarios'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'amplificationFactors', 'systemicRisks'],
      properties: {
        patterns: { type: 'array' },
        propagationPaths: { type: 'array' },
        amplificationFactors: { type: 'array' },
        systemicRisks: { type: 'array' },
        containmentBoundaries: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['red-team', 'cascade-analysis']
}));

export const assessRobustnessTask = defineTask('redteam-robustness-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Robustness Assessment',
  agent: {
    name: 'critical-evaluator',
    skills: ['hypothesis-generator', 'formal-logic-reasoner', 'causal-inference-engine'],
    prompt: {
      role: 'Robustness assessment specialist',
      task: 'Assess overall robustness of the target',
      context: args,
      instructions: [
        'Calculate overall robustness score',
        'Identify key weaknesses',
        'Identify strengths',
        'Assess risk level',
        'Compare to baselines',
        'Document assessment confidence'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'keyWeaknesses', 'riskLevel'],
      properties: {
        overallScore: { type: 'number' },
        keyWeaknesses: { type: 'array' },
        strengths: { type: 'array' },
        riskLevel: { type: 'string' },
        baselineComparison: { type: 'object' },
        assessmentConfidence: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['red-team', 'robustness-assessment']
}));

export const recommendMitigationsTask = defineTask('redteam-mitigation-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Mitigation Recommendations',
  agent: {
    name: 'critical-evaluator',
    skills: ['hypothesis-generator', 'formal-logic-reasoner', 'causal-inference-engine'],
    prompt: {
      role: 'Mitigation recommendation specialist',
      task: 'Recommend mitigations for discovered vulnerabilities',
      context: args,
      instructions: [
        'Develop mitigation strategies',
        'Prioritize mitigations',
        'Assess mitigation effectiveness',
        'Consider implementation constraints',
        'Recommend quick wins',
        'Plan long-term hardening'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'prioritizedActions'],
      properties: {
        recommendations: { type: 'array' },
        prioritizedActions: { type: 'array' },
        quickWins: { type: 'array' },
        longTermHardening: { type: 'array' },
        effectivenessEstimates: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['red-team', 'mitigation-recommendations']
}));
