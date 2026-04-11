/**
 * @process Moral-Ethical Reasoning
 * @description Apply normative frameworks including consequentialist, deontological, and virtue-based perspectives to ethical dilemmas
 * @category Scientific Discovery - Domain-Specific Reasoning
 * @inputs {{ ethicalDilemma: string, stakeholders: array, context: object, constraints: object }}
 * @outputs {{ ethicalAnalysis: object, frameworkApplications: array, recommendations: array, justification: object }}
 * @example
 * // Input: { ethicalDilemma: "Should AI be used for autonomous weapons?", stakeholders: [...], context: {...} }
 * // Output: { ethicalAnalysis: { consequentialist: {...}, deontological: {...} }, recommendations: [...] }
 * @references Utilitarian calculus, Kantian ethics, Virtue ethics, Rawlsian justice theory, Care ethics
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  // Phase 1: Dilemma Clarification
  const dilemmaAnalysis = await ctx.task(analyzeDilemmaTask, {
    ethicalDilemma: inputs.ethicalDilemma,
    context: inputs.context,
    stakeholders: inputs.stakeholders
  });

  // Phase 2: Stakeholder Analysis
  const stakeholderAnalysis = await ctx.task(analyzeStakeholdersTask, {
    stakeholders: inputs.stakeholders,
    dilemma: dilemmaAnalysis.clarifiedDilemma,
    impactDimensions: dilemmaAnalysis.impactDimensions
  });

  // Phase 3: Consequentialist Analysis
  const consequentialistAnalysis = await ctx.task(applyConsequentialismTask, {
    dilemma: dilemmaAnalysis.clarifiedDilemma,
    options: dilemmaAnalysis.availableOptions,
    stakeholders: stakeholderAnalysis.analyzedStakeholders,
    utilityMetrics: inputs.context?.utilityMetrics
  });

  // Phase 4: Deontological Analysis
  const deontologicalAnalysis = await ctx.task(applyDeontologyTask, {
    dilemma: dilemmaAnalysis.clarifiedDilemma,
    options: dilemmaAnalysis.availableOptions,
    duties: inputs.context?.relevantDuties,
    rights: stakeholderAnalysis.stakeholderRights
  });

  // Phase 5: Virtue Ethics Analysis
  const virtueAnalysis = await ctx.task(applyVirtueEthicsTask, {
    dilemma: dilemmaAnalysis.clarifiedDilemma,
    options: dilemmaAnalysis.availableOptions,
    characterTraits: inputs.context?.relevantVirtues,
    roleResponsibilities: inputs.context?.roles
  });

  // Phase 6: Care Ethics Analysis
  const careAnalysis = await ctx.task(applyCareEthicsTask, {
    dilemma: dilemmaAnalysis.clarifiedDilemma,
    relationships: stakeholderAnalysis.relationships,
    vulnerabilities: stakeholderAnalysis.vulnerabilities,
    contextualFactors: inputs.context
  });

  // Phase 7: Justice and Fairness Analysis
  const justiceAnalysis = await ctx.task(applyJusticeFrameworkTask, {
    dilemma: dilemmaAnalysis.clarifiedDilemma,
    options: dilemmaAnalysis.availableOptions,
    distributionalImpacts: stakeholderAnalysis.distributionalImpacts,
    fairnessConstraints: inputs.constraints?.fairness
  });

  // Quality Gate: Framework Convergence
  const frameworkResults = [
    consequentialistAnalysis,
    deontologicalAnalysis,
    virtueAnalysis,
    careAnalysis,
    justiceAnalysis
  ];

  const convergenceAnalysis = await ctx.task(analyzeConvergenceTask, {
    frameworkResults: frameworkResults,
    options: dilemmaAnalysis.availableOptions
  });

  if (convergenceAnalysis.significantConflict) {
    await ctx.breakpoint('ethical-conflict-resolution', {
      message: 'Significant conflict between ethical frameworks',
      conflicts: convergenceAnalysis.conflicts,
      possibleResolutions: convergenceAnalysis.resolutionStrategies
    });
  }

  // Phase 8: Moral Intuition Check
  const intuitionCheck = await ctx.task(checkMoralIntuitionsTask, {
    analysis: convergenceAnalysis,
    dilemma: dilemmaAnalysis.clarifiedDilemma,
    culturalContext: inputs.context?.culturalFactors
  });

  // Phase 9: Synthesis and Recommendation
  const synthesis = await ctx.task(synthesizeEthicalAnalysisTask, {
    frameworkResults: frameworkResults,
    convergenceAnalysis: convergenceAnalysis,
    intuitionCheck: intuitionCheck,
    constraints: inputs.constraints
  });

  // Phase 10: Justification Development
  const justification = await ctx.task(developJustificationTask, {
    recommendation: synthesis.recommendation,
    frameworkSupport: synthesis.supportingFrameworks,
    counterarguments: synthesis.anticipatedObjections
  });

  return {
    success: true,
    reasoningType: 'Moral-Ethical Reasoning',
    ethicalAnalysis: {
      dilemma: dilemmaAnalysis.clarifiedDilemma,
      stakeholders: stakeholderAnalysis.analyzedStakeholders,
      options: dilemmaAnalysis.availableOptions,
      consequentialist: consequentialistAnalysis.analysis,
      deontological: deontologicalAnalysis.analysis,
      virtue: virtueAnalysis.analysis,
      care: careAnalysis.analysis,
      justice: justiceAnalysis.analysis
    },
    frameworkApplications: [
      { framework: 'Consequentialism', recommendation: consequentialistAnalysis.recommendation, rationale: consequentialistAnalysis.rationale },
      { framework: 'Deontology', recommendation: deontologicalAnalysis.recommendation, rationale: deontologicalAnalysis.rationale },
      { framework: 'Virtue Ethics', recommendation: virtueAnalysis.recommendation, rationale: virtueAnalysis.rationale },
      { framework: 'Care Ethics', recommendation: careAnalysis.recommendation, rationale: careAnalysis.rationale },
      { framework: 'Justice Theory', recommendation: justiceAnalysis.recommendation, rationale: justiceAnalysis.rationale }
    ],
    convergence: {
      agreementLevel: convergenceAnalysis.agreementLevel,
      conflicts: convergenceAnalysis.conflicts,
      commonGround: convergenceAnalysis.commonGround
    },
    recommendations: synthesis.recommendations,
    justification: {
      primaryJustification: justification.primaryArgument,
      supportingReasons: justification.supportingReasons,
      anticipatedObjections: justification.objections,
      responses: justification.responses
    },
    confidence: synthesis.confidenceLevel
  };
}

export const analyzeDilemmaTask = defineTask('ethical-dilemma-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Dilemma Clarification',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'ethics-analyst',
    skills: ['hypothesis-generator', 'formal-logic-reasoner'],
    prompt: {
      role: 'Ethics analyst specializing in moral dilemma clarification',
      task: 'Clarify and structure the ethical dilemma',
      context: args,
      instructions: [
        'Articulate the core ethical tension',
        'Identify available courses of action',
        'Determine relevant moral considerations',
        'Map impact dimensions',
        'Identify value conflicts',
        'Note factual uncertainties'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['clarifiedDilemma', 'availableOptions', 'impactDimensions'],
      properties: {
        clarifiedDilemma: { type: 'object' },
        availableOptions: { type: 'array' },
        impactDimensions: { type: 'array' },
        valueConflicts: { type: 'array' },
        factualUncertainties: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ethical-reasoning', 'dilemma-analysis']
}));

export const analyzeStakeholdersTask = defineTask('ethical-stakeholder-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Stakeholder Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'ethics-analyst',
    skills: ['hypothesis-generator', 'formal-logic-reasoner'],
    prompt: {
      role: 'Stakeholder ethics specialist',
      task: 'Analyze stakeholders, their interests, rights, and vulnerabilities',
      context: args,
      instructions: [
        'Identify all affected parties',
        'Assess stakeholder interests and preferences',
        'Identify rights and entitlements',
        'Assess vulnerabilities and power dynamics',
        'Map relationships between stakeholders',
        'Analyze distributional impacts'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['analyzedStakeholders', 'stakeholderRights', 'relationships'],
      properties: {
        analyzedStakeholders: { type: 'array' },
        stakeholderRights: { type: 'array' },
        relationships: { type: 'array' },
        vulnerabilities: { type: 'array' },
        distributionalImpacts: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ethical-reasoning', 'stakeholder-analysis']
}));

export const applyConsequentialismTask = defineTask('ethical-consequentialism', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Consequentialist Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'ethics-analyst',
    skills: ['hypothesis-generator', 'formal-logic-reasoner'],
    prompt: {
      role: 'Utilitarian ethics specialist',
      task: 'Analyze options using consequentialist/utilitarian framework',
      context: args,
      instructions: [
        'Identify likely outcomes for each option',
        'Assess utility/welfare impacts for all stakeholders',
        'Calculate aggregate welfare effects',
        'Consider probability-weighted outcomes',
        'Apply rule vs act utilitarian perspectives',
        'Recommend option maximizing net welfare'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'recommendation', 'rationale'],
      properties: {
        analysis: { type: 'object' },
        outcomeAssessments: { type: 'array' },
        utilityCalculations: { type: 'object' },
        recommendation: { type: 'string' },
        rationale: { type: 'string' },
        uncertainties: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ethical-reasoning', 'consequentialism']
}));

export const applyDeontologyTask = defineTask('ethical-deontology', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Deontological Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'ethics-analyst',
    skills: ['hypothesis-generator', 'formal-logic-reasoner'],
    prompt: {
      role: 'Kantian ethics specialist',
      task: 'Analyze options using deontological/duty-based framework',
      context: args,
      instructions: [
        'Identify relevant moral duties and obligations',
        'Apply categorical imperative tests',
        'Assess rights violations for each option',
        'Consider universalizability of actions',
        'Evaluate treatment of persons as ends',
        'Identify morally impermissible options'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'recommendation', 'rationale'],
      properties: {
        analysis: { type: 'object' },
        dutyAssessments: { type: 'array' },
        rightsAnalysis: { type: 'object' },
        categoricalImperativeTests: { type: 'object' },
        recommendation: { type: 'string' },
        rationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ethical-reasoning', 'deontology']
}));

export const applyVirtueEthicsTask = defineTask('ethical-virtue-ethics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Virtue Ethics Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'ethics-analyst',
    skills: ['hypothesis-generator', 'formal-logic-reasoner'],
    prompt: {
      role: 'Virtue ethics specialist',
      task: 'Analyze options using virtue ethics framework',
      context: args,
      instructions: [
        'Identify relevant virtues and vices',
        'Consider what a person of good character would do',
        'Assess character implications of each option',
        'Consider role-based virtues',
        'Evaluate practical wisdom application',
        'Recommend virtuous course of action'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'recommendation', 'rationale'],
      properties: {
        analysis: { type: 'object' },
        relevantVirtues: { type: 'array' },
        characterAssessment: { type: 'object' },
        practicalWisdomAnalysis: { type: 'object' },
        recommendation: { type: 'string' },
        rationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ethical-reasoning', 'virtue-ethics']
}));

export const applyCareEthicsTask = defineTask('ethical-care-ethics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Care Ethics Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'ethics-analyst',
    skills: ['hypothesis-generator', 'formal-logic-reasoner'],
    prompt: {
      role: 'Care ethics specialist',
      task: 'Analyze options using care ethics framework',
      context: args,
      instructions: [
        'Map care relationships involved',
        'Identify needs and vulnerabilities',
        'Consider relational implications',
        'Assess responsiveness to particular needs',
        'Evaluate maintenance of relationships',
        'Recommend caring response'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'recommendation', 'rationale'],
      properties: {
        analysis: { type: 'object' },
        relationshipMapping: { type: 'object' },
        needsAssessment: { type: 'array' },
        careResponses: { type: 'array' },
        recommendation: { type: 'string' },
        rationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ethical-reasoning', 'care-ethics']
}));

export const applyJusticeFrameworkTask = defineTask('ethical-justice-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Justice and Fairness Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'ethics-analyst',
    skills: ['hypothesis-generator', 'formal-logic-reasoner'],
    prompt: {
      role: 'Justice theory specialist',
      task: 'Analyze options using theories of justice',
      context: args,
      instructions: [
        'Apply Rawlsian veil of ignorance',
        'Assess distributional fairness',
        'Consider procedural justice',
        'Evaluate impact on worst-off groups',
        'Assess equality and equity considerations',
        'Recommend just course of action'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'recommendation', 'rationale'],
      properties: {
        analysis: { type: 'object' },
        distributionalAnalysis: { type: 'object' },
        proceduralJusticeAssessment: { type: 'object' },
        worstOffImpact: { type: 'object' },
        recommendation: { type: 'string' },
        rationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ethical-reasoning', 'justice-theory']
}));

export const analyzeConvergenceTask = defineTask('ethical-convergence-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Framework Convergence Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'ethics-analyst',
    skills: ['hypothesis-generator', 'formal-logic-reasoner'],
    prompt: {
      role: 'Ethical framework integration specialist',
      task: 'Analyze convergence and conflicts between framework recommendations',
      context: args,
      instructions: [
        'Compare recommendations across frameworks',
        'Identify points of agreement',
        'Identify significant conflicts',
        'Assess conflict severity',
        'Propose resolution strategies',
        'Determine overall direction'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['agreementLevel', 'conflicts', 'commonGround'],
      properties: {
        agreementLevel: { type: 'number' },
        commonGround: { type: 'array' },
        conflicts: { type: 'array' },
        significantConflict: { type: 'boolean' },
        resolutionStrategies: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ethical-reasoning', 'framework-integration']
}));

export const checkMoralIntuitionsTask = defineTask('ethical-intuition-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Moral Intuition Check',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'ethics-analyst',
    skills: ['hypothesis-generator', 'formal-logic-reasoner'],
    prompt: {
      role: 'Moral psychology specialist',
      task: 'Check analysis against common moral intuitions',
      context: args,
      instructions: [
        'Identify relevant moral intuitions',
        'Compare analysis conclusions with intuitions',
        'Note intuition-analysis conflicts',
        'Consider cultural variations',
        'Assess whether intuitions should override',
        'Document reflective equilibrium process'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['intuitionAlignment', 'conflicts'],
      properties: {
        intuitionAlignment: { type: 'object' },
        relevantIntuitions: { type: 'array' },
        conflicts: { type: 'array' },
        culturalConsiderations: { type: 'array' },
        equilibriumAdjustments: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ethical-reasoning', 'moral-intuitions']
}));

export const synthesizeEthicalAnalysisTask = defineTask('ethical-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Synthesis and Recommendation',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'ethics-analyst',
    skills: ['hypothesis-generator', 'formal-logic-reasoner'],
    prompt: {
      role: 'Ethical decision synthesis specialist',
      task: 'Synthesize analysis into actionable recommendations',
      context: args,
      instructions: [
        'Weigh framework contributions',
        'Integrate convergent findings',
        'Resolve remaining conflicts',
        'Formulate primary recommendation',
        'Identify supporting frameworks',
        'Assess confidence level'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendation', 'recommendations', 'supportingFrameworks', 'confidenceLevel'],
      properties: {
        recommendation: { type: 'string' },
        recommendations: { type: 'array' },
        supportingFrameworks: { type: 'array' },
        frameworkWeights: { type: 'object' },
        anticipatedObjections: { type: 'array' },
        confidenceLevel: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ethical-reasoning', 'synthesis']
}));

export const developJustificationTask = defineTask('ethical-justification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 11: Justification Development',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'ethics-analyst',
    skills: ['hypothesis-generator', 'formal-logic-reasoner'],
    prompt: {
      role: 'Ethical argumentation specialist',
      task: 'Develop comprehensive justification for recommendation',
      context: args,
      instructions: [
        'Construct primary justification argument',
        'Provide supporting reasons',
        'Anticipate objections',
        'Develop responses to objections',
        'Document limitations and caveats',
        'Ensure reasoning transparency'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryArgument', 'supportingReasons', 'objections', 'responses'],
      properties: {
        primaryArgument: { type: 'string' },
        supportingReasons: { type: 'array' },
        objections: { type: 'array' },
        responses: { type: 'array' },
        limitations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ethical-reasoning', 'justification']
}));
