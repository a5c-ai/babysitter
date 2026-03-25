/**
 * @process computer-science/cross-area-cs-integration
 * @description Develop research contributions that integrate multiple computer science areas, bridging theoretical foundations with practical systems
 * @inputs {
 *   primaryArea: string,
 *   secondaryAreas: array,
 *   integrationGoal: string,
 *   theoreticalFoundations: array,
 *   systemsContext: object,
 *   bridgingConcepts: array,
 *   targetOutcome: string
 * }
 * @outputs {
 *   integratedFramework: object,
 *   theoreticalContributions: array,
 *   practicalContributions: array,
 *   bridgingResults: object,
 *   validationResults: object,
 *   researchRoadmap: object
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  // Phase 1: Area landscape analysis
  const landscapeAnalysis = await ctx.task(areaLandscapeAnalyzer, {
    primaryArea: inputs.primaryArea,
    secondaryAreas: inputs.secondaryAreas,
    foundations: inputs.theoreticalFoundations,
    bridgingConcepts: inputs.bridgingConcepts
  });

  // Phase 2: Integration point identification
  const integrationPoints = await ctx.task(integrationPointIdentifier, {
    landscapeAnalysis,
    integrationGoal: inputs.integrationGoal,
    systemsContext: inputs.systemsContext
  });

  // Phase 3: Theoretical bridge construction
  const theoreticalBridge = await ctx.task(theoreticalBridgeConstructor, {
    integrationPoints,
    foundations: inputs.theoreticalFoundations,
    primaryArea: inputs.primaryArea,
    secondaryAreas: inputs.secondaryAreas
  });

  // Phase 4: Framework synthesis
  const frameworkSynthesis = await ctx.task(frameworkSynthesizer, {
    theoreticalBridge,
    integrationPoints,
    integrationGoal: inputs.integrationGoal,
    targetOutcome: inputs.targetOutcome
  });

  // Phase 5: Theoretical contribution development
  const theoreticalContributions = await ctx.task(theoreticalContributionDeveloper, {
    framework: frameworkSynthesis,
    theoreticalBridge,
    foundations: inputs.theoreticalFoundations
  });

  // Phase 6: Practical contribution development
  const practicalContributions = await ctx.task(practicalContributionDeveloper, {
    framework: frameworkSynthesis,
    systemsContext: inputs.systemsContext,
    theoreticalContributions
  });

  // Phase 7: Cross-validation
  const crossValidation = await ctx.task(crossValidator, {
    theoreticalContributions,
    practicalContributions,
    framework: frameworkSynthesis
  });

  // Phase 8: Review breakpoint
  await ctx.breakpoint('integration-review', {
    message: 'Review cross-area CS integration results',
    frameworkSynthesis,
    theoreticalContributions,
    practicalContributions,
    crossValidation
  });

  // Phase 9: Research roadmap development
  const researchRoadmap = await ctx.task(roadmapDeveloper, {
    framework: frameworkSynthesis,
    theoreticalContributions,
    practicalContributions,
    validation: crossValidation,
    targetOutcome: inputs.targetOutcome
  });

  return {
    integratedFramework: frameworkSynthesis,
    theoreticalContributions: theoreticalContributions.contributions,
    practicalContributions: practicalContributions.contributions,
    bridgingResults: theoreticalBridge,
    validationResults: crossValidation,
    researchRoadmap
  };
}

export const areaLandscapeAnalyzer = defineTask('area-landscape-analyzer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze CS area landscapes',
  agent: {
    name: 'algorithm-analyst',
    skills: ['asymptotic-notation-calculator', 'latex-proof-formatter', 'theorem-prover-interface'],
    prompt: {
      role: 'Computer science multi-area research analyst',
      task: 'Analyze landscapes of multiple CS areas for integration potential',
      context: args,
      instructions: [
        'Map key concepts in each area',
        'Identify foundational theories and techniques',
        'Analyze historical connections between areas',
        'Identify successful prior integrations',
        'Map common mathematical foundations',
        'Identify complementary strengths',
        'Analyze terminology and notation differences',
        'Document area-specific methodologies'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        areaProfiles: { type: 'array' },
        keyConcepts: { type: 'object' },
        foundationalTheories: { type: 'array' },
        historicalConnections: { type: 'array' },
        priorIntegrations: { type: 'array' },
        commonFoundations: { type: 'array' },
        complementaryStrengths: { type: 'object' },
        methodologies: { type: 'object' }
      },
      required: ['areaProfiles', 'keyConcepts', 'foundationalTheories', 'complementaryStrengths']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cross-area', 'landscape-analysis', 'research']
}));

export const integrationPointIdentifier = defineTask('integration-point-identifier', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify integration points',
  agent: {
    name: 'algorithm-analyst',
    skills: ['asymptotic-notation-calculator', 'type-inference-engine', 'latex-proof-formatter'],
    prompt: {
      role: 'Cross-area integration point expert',
      task: 'Identify promising integration points between CS areas',
      context: args,
      instructions: [
        'Identify concept correspondences across areas',
        'Find analogous problems and techniques',
        'Identify abstraction level alignments',
        'Find complementary capabilities',
        'Identify potential synergies',
        'Analyze integration feasibility',
        'Prioritize integration opportunities',
        'Document integration challenges'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        conceptCorrespondences: { type: 'array' },
        analogousProblems: { type: 'array' },
        abstractionAlignments: { type: 'array' },
        complementaryCapabilities: { type: 'array' },
        potentialSynergies: { type: 'array' },
        feasibilityAnalysis: { type: 'object' },
        prioritizedOpportunities: { type: 'array' },
        challenges: { type: 'array' }
      },
      required: ['conceptCorrespondences', 'potentialSynergies', 'prioritizedOpportunities', 'challenges']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cross-area', 'integration-points', 'opportunity-analysis']
}));

export const theoreticalBridgeConstructor = defineTask('theoretical-bridge-constructor', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct theoretical bridges',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'latex-proof-formatter', 'type-inference-engine'],
    prompt: {
      role: 'Theoretical bridge construction expert',
      task: 'Construct theoretical bridges between CS areas',
      context: args,
      instructions: [
        'Develop unifying abstractions',
        'Create concept translations',
        'Build formal correspondences',
        'Develop shared notation and terminology',
        'Prove equivalence or relationship theorems',
        'Identify transfer theorems',
        'Document bridge limitations',
        'Create bridging examples'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        unifyingAbstractions: { type: 'array' },
        conceptTranslations: { type: 'object' },
        formalCorrespondences: { type: 'array' },
        sharedTerminology: { type: 'object' },
        relationshipTheorems: { type: 'array' },
        transferTheorems: { type: 'array' },
        limitations: { type: 'array' },
        bridgingExamples: { type: 'array' }
      },
      required: ['unifyingAbstractions', 'conceptTranslations', 'relationshipTheorems']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cross-area', 'theoretical-bridge', 'unification']
}));

export const frameworkSynthesizer = defineTask('framework-synthesizer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize integrated framework',
  agent: {
    name: 'algorithm-analyst',
    skills: ['asymptotic-notation-calculator', 'type-inference-engine', 'latex-proof-formatter'],
    prompt: {
      role: 'Integrated framework synthesis expert',
      task: 'Synthesize unified framework from cross-area integration',
      context: args,
      instructions: [
        'Design framework architecture',
        'Integrate theoretical components',
        'Incorporate systems perspectives',
        'Define framework interfaces',
        'Specify framework properties',
        'Ensure coherence across components',
        'Document framework scope and limitations',
        'Create framework usage guidelines'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        frameworkArchitecture: { type: 'object' },
        theoreticalComponents: { type: 'array' },
        systemsComponents: { type: 'array' },
        interfaces: { type: 'array' },
        frameworkProperties: { type: 'array' },
        coherenceAnalysis: { type: 'object' },
        scopeAndLimitations: { type: 'object' },
        usageGuidelines: { type: 'array' }
      },
      required: ['frameworkArchitecture', 'theoreticalComponents', 'frameworkProperties']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cross-area', 'framework-synthesis', 'integration']
}));

export const theoreticalContributionDeveloper = defineTask('theoretical-contribution-developer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop theoretical contributions',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'latex-proof-formatter', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'Cross-area theoretical contribution expert',
      task: 'Develop theoretical contributions from integrated framework',
      context: args,
      instructions: [
        'Identify novel theoretical insights',
        'Develop new theorems enabled by integration',
        'Find improved bounds or characterizations',
        'Develop new proof techniques',
        'Create new computational models',
        'Identify resolved open problems',
        'Document contribution significance',
        'Position contributions in each area'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        contributions: { type: 'array' },
        newTheorems: { type: 'array' },
        improvedBounds: { type: 'array' },
        newTechniques: { type: 'array' },
        newModels: { type: 'array' },
        resolvedProblems: { type: 'array' },
        significanceAnalysis: { type: 'object' },
        areaPositioning: { type: 'object' }
      },
      required: ['contributions', 'newTheorems', 'significanceAnalysis']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cross-area', 'theoretical-contributions', 'novelty']
}));

export const practicalContributionDeveloper = defineTask('practical-contribution-developer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop practical contributions',
  agent: {
    name: 'systems-engineer',
    skills: ['cache-simulator', 'memory-hierarchy-modeler', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'Cross-area practical contribution expert',
      task: 'Develop practical contributions from integrated framework',
      context: args,
      instructions: [
        'Identify practical applications of theory',
        'Design new algorithms and systems',
        'Develop improved implementations',
        'Create new tools and methodologies',
        'Identify performance improvements',
        'Design evaluation benchmarks',
        'Document practical impact',
        'Create adoption guidelines'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        contributions: { type: 'array' },
        practicalApplications: { type: 'array' },
        newAlgorithms: { type: 'array' },
        implementations: { type: 'array' },
        tools: { type: 'array' },
        performanceImprovements: { type: 'array' },
        benchmarks: { type: 'array' },
        adoptionGuidelines: { type: 'array' }
      },
      required: ['contributions', 'practicalApplications', 'newAlgorithms']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cross-area', 'practical-contributions', 'systems']
}));

export const crossValidator = defineTask('cross-validator', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Cross-validate contributions',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'latex-proof-formatter', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'Cross-area validation expert',
      task: 'Cross-validate theoretical and practical contributions',
      context: args,
      instructions: [
        'Verify theory-practice alignment',
        'Validate theoretical claims with experiments',
        'Verify practical work reflects theory',
        'Check for inconsistencies',
        'Validate across area boundaries',
        'Test framework coherence',
        'Identify validation gaps',
        'Document validation results'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        validationStatus: { type: 'string' },
        theoryPracticeAlignment: { type: 'object' },
        theoreticalValidation: { type: 'array' },
        practicalValidation: { type: 'array' },
        inconsistencies: { type: 'array' },
        crossBoundaryValidation: { type: 'object' },
        coherenceResults: { type: 'object' },
        gaps: { type: 'array' }
      },
      required: ['validationStatus', 'theoryPracticeAlignment', 'inconsistencies']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cross-area', 'validation', 'verification']
}));

export const roadmapDeveloper = defineTask('roadmap-developer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop research roadmap',
  agent: {
    name: 'algorithm-analyst',
    skills: ['asymptotic-notation-calculator', 'latex-proof-formatter'],
    prompt: {
      role: 'Research roadmap development expert',
      task: 'Develop research roadmap for cross-area integration',
      context: args,
      instructions: [
        'Identify short-term research goals',
        'Plan medium-term developments',
        'Envision long-term impact',
        'Identify key milestones',
        'Plan publication strategy',
        'Identify collaboration opportunities',
        'Plan resource requirements',
        'Document risks and mitigation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        shortTermGoals: { type: 'array' },
        mediumTermPlan: { type: 'array' },
        longTermVision: { type: 'object' },
        milestones: { type: 'array' },
        publicationStrategy: { type: 'object' },
        collaborationOpportunities: { type: 'array' },
        resourceRequirements: { type: 'object' },
        risksAndMitigation: { type: 'array' }
      },
      required: ['shortTermGoals', 'milestones', 'longTermVision']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cross-area', 'roadmap', 'research-planning']
}));
