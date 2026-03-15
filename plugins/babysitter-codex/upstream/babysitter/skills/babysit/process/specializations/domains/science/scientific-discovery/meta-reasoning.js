/**
 * @process Meta-Reasoning
 * @description Monitor and regulate the reasoning process itself, selecting strategies, allocating cognitive resources, and deciding when to stop deliberating
 * @category Scientific Discovery - Meta-Level and Reflective
 * @inputs {{ problem: object, reasoningContext: object, availableStrategies: array, constraints: object }}
 * @outputs {{ strategySelection: object, resourceAllocation: object, monitoringPlan: object, adaptations: array, recommendations: array }}
 * @example
 * // Input: { problem: { type: "complex", domain: "..." }, availableStrategies: [...], constraints: { time: "2h" } }
 * // Output: { strategySelection: { primary: "...", fallbacks: [...] }, resourceAllocation: {...}, monitoringPlan: {...} }
 * @references Bounded rationality, Satisficing theory, Cognitive resource management, Metacognition
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  // Phase 1: Problem Characterization for Meta-Reasoning
  const problemCharacterization = await ctx.task(characterizeProblemTask, {
    problem: inputs.problem,
    context: inputs.reasoningContext,
    previousAttempts: inputs.reasoningContext?.history
  });

  // Phase 2: Strategy Inventory Assessment
  const strategyAssessment = await ctx.task(assessStrategiesTask, {
    availableStrategies: inputs.availableStrategies,
    problemCharacteristics: problemCharacterization.characteristics,
    constraints: inputs.constraints
  });

  // Phase 3: Strategy Selection
  const strategySelection = await ctx.task(selectStrategyTask, {
    strategies: strategyAssessment.assessedStrategies,
    problemCharacteristics: problemCharacterization.characteristics,
    constraints: inputs.constraints,
    riskTolerance: inputs.reasoningContext?.riskTolerance
  });

  // Phase 4: Resource Allocation Planning
  const resourceAllocation = await ctx.task(allocateResourcesTask, {
    selectedStrategy: strategySelection.primaryStrategy,
    constraints: inputs.constraints,
    problemComplexity: problemCharacterization.complexity,
    availableResources: inputs.constraints?.resources
  });

  // Phase 5: Stopping Criteria Definition
  const stoppingCriteria = await ctx.task(defineStoppingCriteriaTask, {
    problem: inputs.problem,
    strategy: strategySelection.primaryStrategy,
    constraints: inputs.constraints,
    qualityThresholds: inputs.reasoningContext?.qualityThresholds
  });

  // Phase 6: Monitoring Framework Design
  const monitoringFramework = await ctx.task(designMonitoringTask, {
    strategy: strategySelection.primaryStrategy,
    resourceAllocation: resourceAllocation,
    stoppingCriteria: stoppingCriteria,
    problemCharacteristics: problemCharacterization.characteristics
  });

  // Phase 7: Adaptation Triggers Definition
  const adaptationTriggers = await ctx.task(defineAdaptationTriggersTask, {
    strategy: strategySelection.primaryStrategy,
    fallbackStrategies: strategySelection.fallbackStrategies,
    monitoringMetrics: monitoringFramework.metrics,
    riskFactors: problemCharacterization.risks
  });

  // Quality Gate: Meta-Strategy Coherence
  const coherenceCheck = await ctx.task(checkCoherenceTask, {
    strategySelection: strategySelection,
    resourceAllocation: resourceAllocation,
    stoppingCriteria: stoppingCriteria,
    adaptationTriggers: adaptationTriggers
  });

  if (coherenceCheck.coherenceScore < 0.7) {
    await ctx.breakpoint('meta-strategy-revision', {
      message: 'Meta-reasoning strategy has coherence issues',
      issues: coherenceCheck.issues,
      suggestedRevisions: coherenceCheck.revisionSuggestions
    });
  }

  // Phase 8: Reasoning Process Simulation
  const processSimulation = await ctx.task(simulateReasoningProcessTask, {
    strategy: strategySelection.primaryStrategy,
    resourceAllocation: resourceAllocation,
    problem: inputs.problem,
    constraints: inputs.constraints
  });

  // Phase 9: Risk and Failure Mode Analysis
  const riskAnalysis = await ctx.task(analyzeMetaRisksTask, {
    strategy: strategySelection.primaryStrategy,
    simulation: processSimulation,
    adaptationTriggers: adaptationTriggers,
    constraints: inputs.constraints
  });

  // Phase 10: Meta-Reasoning Plan Synthesis
  const synthesizedPlan = await ctx.task(synthesizeMetaPlanTask, {
    strategySelection: strategySelection,
    resourceAllocation: resourceAllocation,
    monitoring: monitoringFramework,
    adaptations: adaptationTriggers,
    risks: riskAnalysis
  });

  return {
    success: true,
    reasoningType: 'Meta-Reasoning',
    strategySelection: {
      primary: strategySelection.primaryStrategy,
      fallbacks: strategySelection.fallbackStrategies,
      selectionRationale: strategySelection.rationale,
      expectedPerformance: strategySelection.performanceEstimate
    },
    resourceAllocation: {
      timeAllocation: resourceAllocation.timeAllocation,
      effortDistribution: resourceAllocation.effortDistribution,
      parallelization: resourceAllocation.parallelizationPlan,
      buffers: resourceAllocation.contingencyBuffers
    },
    stoppingCriteria: {
      qualityCriteria: stoppingCriteria.qualityThresholds,
      timeCriteria: stoppingCriteria.timeConstraints,
      satisficingLevel: stoppingCriteria.satisficingThreshold,
      terminationConditions: stoppingCriteria.terminationConditions
    },
    monitoringPlan: {
      metrics: monitoringFramework.metrics,
      checkpoints: monitoringFramework.checkpoints,
      progressIndicators: monitoringFramework.progressIndicators,
      alertThresholds: monitoringFramework.alertThresholds
    },
    adaptations: {
      triggers: adaptationTriggers.triggers,
      adaptationStrategies: adaptationTriggers.strategies,
      escalationPath: adaptationTriggers.escalationPath
    },
    riskMitigation: {
      identifiedRisks: riskAnalysis.identifiedRisks,
      mitigations: riskAnalysis.mitigationStrategies
    },
    recommendations: synthesizedPlan.recommendations,
    confidence: coherenceCheck.coherenceScore
  };
}

export const characterizeProblemTask = defineTask('meta-problem-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Problem Characterization',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'meta-reasoning-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Meta-cognitive problem analysis specialist',
      task: 'Characterize the problem for meta-reasoning strategy selection',
      context: args,
      instructions: [
        'Assess problem complexity and structure',
        'Identify problem type and domain',
        'Evaluate uncertainty levels',
        'Assess decomposability',
        'Identify known solution approaches',
        'Evaluate time sensitivity'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['characteristics', 'complexity', 'risks'],
      properties: {
        characteristics: { type: 'object' },
        complexity: { type: 'object' },
        problemType: { type: 'string' },
        decomposability: { type: 'number' },
        uncertaintyLevel: { type: 'number' },
        risks: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['meta-reasoning', 'problem-characterization']
}));

export const assessStrategiesTask = defineTask('meta-strategy-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Strategy Assessment',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'meta-reasoning-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Reasoning strategy assessment specialist',
      task: 'Assess available reasoning strategies for the problem',
      context: args,
      instructions: [
        'Evaluate each strategy against problem characteristics',
        'Assess resource requirements',
        'Estimate success probability',
        'Consider strategy combinations',
        'Identify strategy prerequisites',
        'Rank strategies by expected value'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['assessedStrategies'],
      properties: {
        assessedStrategies: { type: 'array' },
        strategyRankings: { type: 'array' },
        resourceRequirements: { type: 'object' },
        combinationOpportunities: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['meta-reasoning', 'strategy-assessment']
}));

export const selectStrategyTask = defineTask('meta-strategy-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Strategy Selection',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'meta-reasoning-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Meta-reasoning strategy selection specialist',
      task: 'Select optimal reasoning strategy and fallbacks',
      context: args,
      instructions: [
        'Select primary strategy based on assessment',
        'Identify fallback strategies',
        'Define strategy switching conditions',
        'Estimate expected performance',
        'Document selection rationale',
        'Consider strategy sequencing'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryStrategy', 'fallbackStrategies', 'rationale'],
      properties: {
        primaryStrategy: { type: 'object' },
        fallbackStrategies: { type: 'array' },
        switchingConditions: { type: 'array' },
        rationale: { type: 'string' },
        performanceEstimate: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['meta-reasoning', 'strategy-selection']
}));

export const allocateResourcesTask = defineTask('meta-resource-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Resource Allocation',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'meta-reasoning-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Cognitive resource allocation specialist',
      task: 'Allocate resources across reasoning phases',
      context: args,
      instructions: [
        'Allocate time across phases',
        'Distribute effort appropriately',
        'Plan parallel execution where possible',
        'Reserve contingency buffers',
        'Consider diminishing returns',
        'Balance exploration vs exploitation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['timeAllocation', 'effortDistribution'],
      properties: {
        timeAllocation: { type: 'object' },
        effortDistribution: { type: 'object' },
        parallelizationPlan: { type: 'object' },
        contingencyBuffers: { type: 'object' },
        prioritization: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['meta-reasoning', 'resource-allocation']
}));

export const defineStoppingCriteriaTask = defineTask('meta-stopping-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Stopping Criteria Definition',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'meta-reasoning-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Satisficing and stopping criteria specialist',
      task: 'Define when to stop deliberating and commit to a solution',
      context: args,
      instructions: [
        'Define quality thresholds for acceptable solutions',
        'Set time-based stopping rules',
        'Define satisficing criteria',
        'Establish diminishing returns thresholds',
        'Create termination conditions',
        'Balance quality vs speed tradeoffs'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['qualityThresholds', 'satisficingThreshold', 'terminationConditions'],
      properties: {
        qualityThresholds: { type: 'object' },
        timeConstraints: { type: 'object' },
        satisficingThreshold: { type: 'number' },
        diminishingReturnsThreshold: { type: 'number' },
        terminationConditions: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['meta-reasoning', 'stopping-criteria']
}));

export const designMonitoringTask = defineTask('meta-monitoring-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Monitoring Framework Design',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'meta-reasoning-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Reasoning process monitoring specialist',
      task: 'Design monitoring framework for the reasoning process',
      context: args,
      instructions: [
        'Define progress metrics',
        'Establish monitoring checkpoints',
        'Create progress indicators',
        'Set alert thresholds',
        'Design feedback mechanisms',
        'Plan performance tracking'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'checkpoints', 'progressIndicators'],
      properties: {
        metrics: { type: 'array' },
        checkpoints: { type: 'array' },
        progressIndicators: { type: 'array' },
        alertThresholds: { type: 'object' },
        feedbackMechanisms: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['meta-reasoning', 'monitoring']
}));

export const defineAdaptationTriggersTask = defineTask('meta-adaptation-triggers', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Adaptation Triggers',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'meta-reasoning-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Adaptive reasoning specialist',
      task: 'Define triggers for strategy adaptation during reasoning',
      context: args,
      instructions: [
        'Define conditions triggering strategy switch',
        'Design adaptation responses',
        'Create escalation paths',
        'Define resource reallocation triggers',
        'Plan graceful degradation',
        'Document adaptation procedures'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['triggers', 'strategies', 'escalationPath'],
      properties: {
        triggers: { type: 'array' },
        strategies: { type: 'array' },
        escalationPath: { type: 'array' },
        reallocationRules: { type: 'array' },
        degradationPlan: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['meta-reasoning', 'adaptation']
}));

export const checkCoherenceTask = defineTask('meta-coherence-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Coherence Check',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'meta-reasoning-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Meta-reasoning coherence specialist',
      task: 'Check coherence of the meta-reasoning plan',
      context: args,
      instructions: [
        'Verify internal consistency',
        'Check resource-strategy alignment',
        'Validate stopping criteria appropriateness',
        'Assess adaptation feasibility',
        'Identify potential conflicts',
        'Suggest revisions if needed'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['coherenceScore', 'issues'],
      properties: {
        coherenceScore: { type: 'number' },
        issues: { type: 'array' },
        conflicts: { type: 'array' },
        revisionSuggestions: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['meta-reasoning', 'coherence']
}));

export const simulateReasoningProcessTask = defineTask('meta-process-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Process Simulation',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'meta-reasoning-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Reasoning process simulation specialist',
      task: 'Simulate the reasoning process to identify issues',
      context: args,
      instructions: [
        'Walk through expected reasoning flow',
        'Identify potential bottlenecks',
        'Estimate phase durations',
        'Identify likely failure points',
        'Assess checkpoint effectiveness',
        'Validate resource estimates'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['simulatedFlow', 'bottlenecks', 'failurePoints'],
      properties: {
        simulatedFlow: { type: 'array' },
        bottlenecks: { type: 'array' },
        phaseDurations: { type: 'object' },
        failurePoints: { type: 'array' },
        resourceValidation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['meta-reasoning', 'simulation']
}));

export const analyzeMetaRisksTask = defineTask('meta-risk-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Risk Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'meta-reasoning-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Meta-reasoning risk analyst',
      task: 'Analyze risks in the meta-reasoning plan',
      context: args,
      instructions: [
        'Identify strategy failure risks',
        'Assess resource exhaustion risks',
        'Evaluate adaptation failure risks',
        'Identify blind spots',
        'Develop mitigation strategies',
        'Prioritize risk responses'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['identifiedRisks', 'mitigationStrategies'],
      properties: {
        identifiedRisks: { type: 'array' },
        riskPriorities: { type: 'array' },
        mitigationStrategies: { type: 'array' },
        blindSpots: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['meta-reasoning', 'risk-analysis']
}));

export const synthesizeMetaPlanTask = defineTask('meta-plan-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 11: Plan Synthesis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'meta-reasoning-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Meta-reasoning plan synthesis specialist',
      task: 'Synthesize final meta-reasoning plan',
      context: args,
      instructions: [
        'Integrate all components',
        'Create execution blueprint',
        'Document key decision points',
        'Summarize monitoring approach',
        'Provide implementation guidance',
        'Generate recommendations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesizedPlan', 'recommendations'],
      properties: {
        synthesizedPlan: { type: 'object' },
        executionBlueprint: { type: 'object' },
        decisionPoints: { type: 'array' },
        recommendations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['meta-reasoning', 'synthesis']
}));
