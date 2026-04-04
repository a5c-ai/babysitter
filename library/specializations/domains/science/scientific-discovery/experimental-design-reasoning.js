/**
 * @process Experimental Design Reasoning
 * @description Structure investigations with controls, treatments, randomization, and blinding to establish causal relationships
 * @category Scientific Discovery - Domain-Specific Reasoning
 * @inputs {{ researchQuestion: string, hypotheses: array, variables: object, constraints: object, context: object }}
 * @outputs {{ experimentalDesign: object, protocols: array, statisticalPlan: object, validityAnalysis: object, recommendations: array }}
 * @example
 * // Input: { researchQuestion: "Does treatment X improve outcome Y?", hypotheses: [...], variables: {...} }
 * // Output: { experimentalDesign: { type: "RCT", factors: [...] }, protocols: [...], statisticalPlan: {...} }
 * @references Fisher's experimental design principles, Campbell & Stanley validity framework, CONSORT guidelines
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  // Phase 1: Research Question Analysis
  const questionAnalysis = await ctx.task(analyzeResearchQuestionTask, {
    researchQuestion: inputs.researchQuestion,
    hypotheses: inputs.hypotheses,
    existingLiterature: inputs.context?.literature
  });

  if (!questionAnalysis.isTestable) {
    return {
      success: false,
      error: 'Research question is not empirically testable',
      suggestions: questionAnalysis.reformulationSuggestions
    };
  }

  // Phase 2: Variable Identification and Operationalization
  const variableAnalysis = await ctx.task(analyzeVariablesTask, {
    independentVariables: inputs.variables?.independent || [],
    dependentVariables: inputs.variables?.dependent || [],
    hypotheses: inputs.hypotheses,
    measurementContext: inputs.context?.measurement
  });

  // Phase 3: Confound Identification
  const confoundAnalysis = await ctx.task(identifyConfoundsTask, {
    variables: variableAnalysis.operationalizedVariables,
    researchContext: inputs.context,
    domainKnowledge: inputs.context?.domain
  });

  // Phase 4: Design Selection
  const designSelection = await ctx.task(selectDesignTask, {
    researchQuestion: inputs.researchQuestion,
    variables: variableAnalysis.operationalizedVariables,
    confounds: confoundAnalysis.identifiedConfounds,
    constraints: inputs.constraints,
    hypotheses: inputs.hypotheses
  });

  // Phase 5: Randomization Strategy
  const randomizationPlan = await ctx.task(planRandomizationTask, {
    designType: designSelection.selectedDesign,
    participants: inputs.constraints?.sampleSize,
    stratificationFactors: confoundAnalysis.stratificationCandidates,
    blockingFactors: designSelection.blockingFactors
  });

  // Phase 6: Control and Blinding Strategy
  const controlStrategy = await ctx.task(planControlsTask, {
    designType: designSelection.selectedDesign,
    confounds: confoundAnalysis.identifiedConfounds,
    feasibility: inputs.constraints,
    ethicalConsiderations: inputs.context?.ethics
  });

  // Phase 7: Statistical Analysis Plan
  const statisticalPlan = await ctx.task(planStatisticalAnalysisTask, {
    designType: designSelection.selectedDesign,
    variables: variableAnalysis.operationalizedVariables,
    hypotheses: inputs.hypotheses,
    sampleSize: inputs.constraints?.sampleSize,
    expectedEffectSize: inputs.context?.priorEffectSize
  });

  // Phase 8: Validity Assessment
  const validityAnalysis = await ctx.task(assessValidityTask, {
    design: designSelection,
    controls: controlStrategy,
    randomization: randomizationPlan,
    confounds: confoundAnalysis.identifiedConfounds
  });

  // Quality Gate: Design Validity
  if (validityAnalysis.overallValidity < 0.6) {
    await ctx.breakpoint('design-revision-required', {
      message: 'Experimental design has significant validity concerns',
      concerns: validityAnalysis.majorThreats,
      suggestedRevisions: validityAnalysis.mitigationStrategies
    });
  }

  // Phase 9: Protocol Development
  const protocols = await ctx.task(developProtocolsTask, {
    design: designSelection.selectedDesign,
    variables: variableAnalysis.operationalizedVariables,
    randomization: randomizationPlan,
    controls: controlStrategy,
    constraints: inputs.constraints
  });

  // Phase 10: Power Analysis and Sample Size
  const powerAnalysis = await ctx.task(conductPowerAnalysisTask, {
    statisticalPlan: statisticalPlan,
    expectedEffectSize: inputs.context?.priorEffectSize,
    desiredPower: inputs.constraints?.desiredPower || 0.8,
    alphaLevel: inputs.constraints?.alphaLevel || 0.05
  });

  return {
    success: true,
    reasoningType: 'Experimental Design',
    experimentalDesign: {
      type: designSelection.selectedDesign,
      factors: variableAnalysis.operationalizedVariables,
      randomization: randomizationPlan,
      controls: controlStrategy,
      justification: designSelection.justification
    },
    protocols: protocols.detailedProtocols,
    statisticalPlan: {
      primaryAnalysis: statisticalPlan.primaryAnalysis,
      secondaryAnalyses: statisticalPlan.secondaryAnalyses,
      powerAnalysis: powerAnalysis,
      sampleSizeRecommendation: powerAnalysis.recommendedSampleSize
    },
    validityAnalysis: {
      internalValidity: validityAnalysis.internal,
      externalValidity: validityAnalysis.external,
      constructValidity: validityAnalysis.construct,
      statisticalConclusion: validityAnalysis.statisticalConclusion,
      threats: validityAnalysis.identifiedThreats,
      mitigations: validityAnalysis.mitigationStrategies
    },
    recommendations: [
      ...designSelection.recommendations,
      ...validityAnalysis.recommendations,
      ...protocols.implementationRecommendations
    ],
    confidence: validityAnalysis.overallValidity
  };
}

export const analyzeResearchQuestionTask = defineTask('experimental-question-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Research Question Analysis',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'experimental-designer',
    skills: ['statistical-test-selector', 'hypothesis-generator', 'causal-inference-engine'],
    prompt: {
      role: 'Research methodology specialist with expertise in experimental design and hypothesis formulation',
      task: 'Analyze research question for testability, clarity, and experimental feasibility',
      context: args,
      instructions: [
        'Assess if the research question is empirically testable',
        'Identify the causal relationship being investigated',
        'Evaluate specificity and measurability',
        'Check alignment with stated hypotheses',
        'Determine appropriate experimental paradigm',
        'Suggest reformulations if needed'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['isTestable', 'causalStructure', 'experimentalParadigm'],
      properties: {
        isTestable: { type: 'boolean' },
        causalStructure: { type: 'object' },
        experimentalParadigm: { type: 'string' },
        clarityScore: { type: 'number' },
        reformulationSuggestions: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['experimental-design', 'research-question']
}));

export const analyzeVariablesTask = defineTask('experimental-variable-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Variable Operationalization',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'experimental-designer',
    skills: ['statistical-test-selector', 'hypothesis-generator', 'causal-inference-engine'],
    prompt: {
      role: 'Measurement and operationalization specialist',
      task: 'Operationalize variables with valid, reliable measures',
      context: args,
      instructions: [
        'Define operational definitions for all variables',
        'Specify measurement procedures and instruments',
        'Assess reliability and validity of measures',
        'Identify levels and scales of measurement',
        'Determine manipulation check requirements',
        'Document measurement assumptions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['operationalizedVariables', 'measurementPlan'],
      properties: {
        operationalizedVariables: { type: 'array' },
        measurementPlan: { type: 'object' },
        reliabilityAssessment: { type: 'object' },
        validityConsiderations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['experimental-design', 'operationalization']
}));

export const identifyConfoundsTask = defineTask('experimental-confound-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Confound Identification',
  skill: { name: 'causal-inference-engine' },
  agent: {
    name: 'experimental-designer',
    skills: ['causal-inference-engine', 'statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Causal inference and confound analysis specialist',
      task: 'Identify potential confounding variables and threats to causal inference',
      context: args,
      instructions: [
        'Identify all potential confounding variables',
        'Assess third-variable explanations',
        'Determine selection bias risks',
        'Identify maturation and history threats',
        'Evaluate testing and instrumentation effects',
        'Recommend stratification factors'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['identifiedConfounds', 'stratificationCandidates'],
      properties: {
        identifiedConfounds: { type: 'array' },
        stratificationCandidates: { type: 'array' },
        thirdVariableRisks: { type: 'array' },
        temporalThreats: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['experimental-design', 'confounds']
}));

export const selectDesignTask = defineTask('experimental-design-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Design Selection',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'experimental-designer',
    skills: ['statistical-test-selector', 'hypothesis-generator', 'causal-inference-engine'],
    prompt: {
      role: 'Experimental design architect',
      task: 'Select optimal experimental design given constraints and objectives',
      context: args,
      instructions: [
        'Evaluate candidate designs (RCT, factorial, within-subjects, etc.)',
        'Consider practical constraints and resources',
        'Balance internal and external validity',
        'Determine blocking and nesting structure',
        'Select appropriate comparison conditions',
        'Justify design choice with tradeoff analysis'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedDesign', 'justification', 'blockingFactors'],
      properties: {
        selectedDesign: { type: 'string' },
        designStructure: { type: 'object' },
        blockingFactors: { type: 'array' },
        justification: { type: 'string' },
        tradeoffAnalysis: { type: 'object' },
        recommendations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['experimental-design', 'design-selection']
}));

export const planRandomizationTask = defineTask('experimental-randomization-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Randomization Planning',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'experimental-designer',
    skills: ['statistical-test-selector', 'bayesian-inference-engine'],
    prompt: {
      role: 'Randomization and allocation specialist',
      task: 'Design randomization strategy ensuring unbiased group allocation',
      context: args,
      instructions: [
        'Select randomization method (simple, stratified, blocked)',
        'Determine allocation ratio',
        'Design concealment procedures',
        'Plan for adaptive randomization if needed',
        'Document random number generation method',
        'Ensure reproducibility of randomization'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['method', 'allocationRatio', 'concealmentProcedure'],
      properties: {
        method: { type: 'string' },
        allocationRatio: { type: 'string' },
        stratificationPlan: { type: 'object' },
        blockSize: { type: 'integer' },
        concealmentProcedure: { type: 'string' },
        seedGeneration: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['experimental-design', 'randomization']
}));

export const planControlsTask = defineTask('experimental-control-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Control and Blinding Strategy',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'experimental-designer',
    skills: ['statistical-test-selector', 'causal-inference-engine'],
    prompt: {
      role: 'Experimental control and blinding specialist',
      task: 'Design control conditions and blinding procedures',
      context: args,
      instructions: [
        'Define control condition(s) with justification',
        'Determine blinding feasibility (single, double, triple)',
        'Design placebo or sham procedures if applicable',
        'Plan for blinding assessment',
        'Address unblinding contingencies',
        'Document control for identified confounds'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['controlConditions', 'blindingLevel', 'confoundControls'],
      properties: {
        controlConditions: { type: 'array' },
        blindingLevel: { type: 'string' },
        blindingProcedures: { type: 'object' },
        placeboDesign: { type: 'object' },
        confoundControls: { type: 'array' },
        unblindingPlan: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['experimental-design', 'controls', 'blinding']
}));

export const planStatisticalAnalysisTask = defineTask('experimental-statistical-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Statistical Analysis Planning',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'experimental-designer',
    skills: ['statistical-test-selector', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Biostatistician and analysis planning specialist',
      task: 'Develop comprehensive statistical analysis plan',
      context: args,
      instructions: [
        'Specify primary and secondary endpoints',
        'Select appropriate statistical tests',
        'Plan for multiple comparison corrections',
        'Define intention-to-treat vs per-protocol analyses',
        'Specify handling of missing data',
        'Pre-register analysis decisions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryAnalysis', 'statisticalTests', 'multipleComparisons'],
      properties: {
        primaryAnalysis: { type: 'object' },
        secondaryAnalyses: { type: 'array' },
        statisticalTests: { type: 'array' },
        multipleComparisons: { type: 'object' },
        missingDataStrategy: { type: 'string' },
        preregistrationPlan: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['experimental-design', 'statistical-analysis']
}));

export const assessValidityTask = defineTask('experimental-validity-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Validity Assessment',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'experimental-designer',
    skills: ['statistical-test-selector', 'causal-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Research validity and methodological rigor specialist',
      task: 'Assess design validity using Campbell & Stanley framework',
      context: args,
      instructions: [
        'Evaluate internal validity threats',
        'Assess external validity and generalizability',
        'Analyze construct validity',
        'Evaluate statistical conclusion validity',
        'Identify remaining threats',
        'Propose mitigation strategies'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['internal', 'external', 'construct', 'overallValidity'],
      properties: {
        internal: { type: 'object' },
        external: { type: 'object' },
        construct: { type: 'object' },
        statisticalConclusion: { type: 'object' },
        identifiedThreats: { type: 'array' },
        mitigationStrategies: { type: 'array' },
        majorThreats: { type: 'array' },
        overallValidity: { type: 'number' },
        recommendations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['experimental-design', 'validity']
}));

export const developProtocolsTask = defineTask('experimental-protocol-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Protocol Development',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'experimental-designer',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Experimental protocol and procedure specialist',
      task: 'Develop detailed experimental protocols',
      context: args,
      instructions: [
        'Create step-by-step procedural protocols',
        'Document timing and sequencing',
        'Specify materials and equipment',
        'Include quality control checkpoints',
        'Design data collection forms',
        'Document deviation handling procedures'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['detailedProtocols', 'implementationRecommendations'],
      properties: {
        detailedProtocols: { type: 'array' },
        timingSchedule: { type: 'object' },
        materialsSpecification: { type: 'array' },
        qualityCheckpoints: { type: 'array' },
        dataCollectionForms: { type: 'array' },
        deviationProcedures: { type: 'object' },
        implementationRecommendations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['experimental-design', 'protocols']
}));

export const conductPowerAnalysisTask = defineTask('experimental-power-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Power Analysis',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'experimental-designer',
    skills: ['statistical-test-selector', 'bayesian-inference-engine'],
    prompt: {
      role: 'Statistical power and sample size specialist',
      task: 'Conduct power analysis and determine sample size requirements',
      context: args,
      instructions: [
        'Calculate required sample size for desired power',
        'Consider effect size assumptions',
        'Account for attrition and missing data',
        'Evaluate power under different scenarios',
        'Document sensitivity analyses',
        'Provide sample size recommendations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedSampleSize', 'powerCurve', 'assumptions'],
      properties: {
        recommendedSampleSize: { type: 'integer' },
        minimumDetectableEffect: { type: 'number' },
        powerCurve: { type: 'array' },
        assumptions: { type: 'object' },
        sensitivityAnalysis: { type: 'object' },
        attritionAdjustment: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['experimental-design', 'power-analysis']
}));
