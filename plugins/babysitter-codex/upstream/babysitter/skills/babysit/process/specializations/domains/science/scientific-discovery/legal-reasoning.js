/**
 * @process Legal Reasoning
 * @description Apply principles of statutory interpretation, precedent analysis, and argumentation to legal questions
 * @category Scientific Discovery - Domain-Specific Reasoning
 * @inputs {{ legalQuestion: string, jurisdiction: string, facts: object, relevantLaw: array, context: object }}
 * @outputs {{ legalAnalysis: object, arguments: array, conclusions: object, recommendations: array }}
 * @example
 * // Input: { legalQuestion: "Is this contract enforceable?", jurisdiction: "US-CA", facts: {...} }
 * // Output: { legalAnalysis: { elements: [...], interpretation: {...} }, arguments: [...], conclusions: {...} }
 * @references IRAC method, Canons of statutory construction, Common law precedent doctrine
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  // Phase 1: Issue Identification
  const issueAnalysis = await ctx.task(identifyIssuesTask, {
    legalQuestion: inputs.legalQuestion,
    facts: inputs.facts,
    jurisdiction: inputs.jurisdiction,
    preliminaryLaw: inputs.relevantLaw
  });

  // Phase 2: Rule Identification and Research
  const ruleIdentification = await ctx.task(identifyRulesTask, {
    issues: issueAnalysis.identifiedIssues,
    jurisdiction: inputs.jurisdiction,
    relevantLaw: inputs.relevantLaw,
    legalDomain: inputs.context?.domain
  });

  // Phase 3: Statutory Interpretation
  const statutoryAnalysis = await ctx.task(interpretStatutesTask, {
    applicableStatutes: ruleIdentification.statutes,
    facts: inputs.facts,
    legislativeHistory: inputs.context?.legislativeHistory,
    interpretiveCanons: inputs.context?.canons
  });

  // Phase 4: Precedent Analysis
  const precedentAnalysis = await ctx.task(analyzePrecedentsTask, {
    applicableCases: ruleIdentification.precedents,
    facts: inputs.facts,
    jurisdiction: inputs.jurisdiction,
    issues: issueAnalysis.identifiedIssues
  });

  // Phase 5: Analogical Case Reasoning
  const analogicalReasoning = await ctx.task(applyAnalogicalReasoningTask, {
    currentFacts: inputs.facts,
    precedents: precedentAnalysis.analyzedPrecedents,
    distinguishingFactors: precedentAnalysis.distinguishingFactors
  });

  // Phase 6: Rule Application
  const ruleApplication = await ctx.task(applyRulesToFactsTask, {
    rules: ruleIdentification.consolidatedRules,
    facts: inputs.facts,
    statutoryInterpretation: statutoryAnalysis,
    precedentGuidance: analogicalReasoning
  });

  // Quality Gate: Legal Soundness
  if (ruleApplication.confidenceScore < 0.5) {
    await ctx.breakpoint('legal-analysis-review', {
      message: 'Legal analysis has significant uncertainty',
      uncertainAreas: ruleApplication.uncertainElements,
      additionalResearchNeeded: ruleApplication.researchGaps
    });
  }

  // Phase 7: Argument Construction
  const argumentConstruction = await ctx.task(constructArgumentsTask, {
    analysis: ruleApplication,
    issues: issueAnalysis.identifiedIssues,
    clientPosition: inputs.context?.clientPosition,
    counterarguments: inputs.context?.anticipatedCounterarguments
  });

  // Phase 8: Counterargument Analysis
  const counterargumentAnalysis = await ctx.task(analyzeCounterargumentsTask, {
    primaryArguments: argumentConstruction.arguments,
    opposingPosition: inputs.context?.opposingPosition,
    weaknesses: argumentConstruction.identifiedWeaknesses
  });

  // Phase 9: Conclusion Formation
  const conclusions = await ctx.task(formConclusionsTask, {
    issues: issueAnalysis.identifiedIssues,
    analysis: ruleApplication,
    arguments: argumentConstruction.arguments,
    counterarguments: counterargumentAnalysis
  });

  // Phase 10: Recommendation Development
  const recommendations = await ctx.task(developRecommendationsTask, {
    conclusions: conclusions,
    riskAssessment: conclusions.riskAnalysis,
    clientObjectives: inputs.context?.objectives,
    practicalConsiderations: inputs.context?.practicalFactors
  });

  return {
    success: true,
    reasoningType: 'Legal Reasoning',
    legalAnalysis: {
      issues: issueAnalysis.identifiedIssues,
      applicableRules: ruleIdentification.consolidatedRules,
      statutoryInterpretation: statutoryAnalysis.interpretation,
      precedentAnalysis: precedentAnalysis.analyzedPrecedents,
      ruleApplication: ruleApplication.applicationResults
    },
    arguments: {
      primary: argumentConstruction.arguments,
      supporting: argumentConstruction.supportingArguments,
      counterarguments: counterargumentAnalysis.anticipatedCounterarguments,
      rebuttals: counterargumentAnalysis.rebuttals
    },
    conclusions: {
      primaryConclusion: conclusions.primaryConclusion,
      alternativeConclusions: conclusions.alternativeOutcomes,
      probability: conclusions.outcomeAssessment,
      riskAnalysis: conclusions.riskAnalysis
    },
    recommendations: recommendations.actionableRecommendations,
    caveats: recommendations.caveats,
    confidence: ruleApplication.confidenceScore
  };
}

export const identifyIssuesTask = defineTask('legal-issue-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Issue Identification',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'legal-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Legal analyst specializing in issue spotting and case analysis',
      task: 'Identify legal issues presented by the facts and question',
      context: args,
      instructions: [
        'Parse the legal question into discrete issues',
        'Identify threshold and procedural issues',
        'Determine substantive legal issues',
        'Establish issue hierarchy and dependencies',
        'Note jurisdictional considerations',
        'Identify potential sub-issues'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['identifiedIssues', 'issueHierarchy'],
      properties: {
        identifiedIssues: { type: 'array' },
        issueHierarchy: { type: 'object' },
        thresholdIssues: { type: 'array' },
        substantiveIssues: { type: 'array' },
        proceduralIssues: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['legal-reasoning', 'issue-spotting']
}));

export const identifyRulesTask = defineTask('legal-rule-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Rule Identification',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'legal-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Legal research specialist',
      task: 'Identify applicable legal rules, statutes, and precedents',
      context: args,
      instructions: [
        'Identify controlling statutes and regulations',
        'Find binding precedents in jurisdiction',
        'Identify persuasive authority',
        'Note constitutional provisions if applicable',
        'Synthesize rules from multiple sources',
        'Document rule hierarchy and conflicts'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['consolidatedRules', 'statutes', 'precedents'],
      properties: {
        consolidatedRules: { type: 'array' },
        statutes: { type: 'array' },
        regulations: { type: 'array' },
        precedents: { type: 'array' },
        ruleHierarchy: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['legal-reasoning', 'rule-identification']
}));

export const interpretStatutesTask = defineTask('legal-statutory-interpretation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Statutory Interpretation',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'legal-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Statutory interpretation specialist',
      task: 'Interpret applicable statutes using canons of construction',
      context: args,
      instructions: [
        'Apply textual/plain meaning analysis',
        'Consider legislative history and purpose',
        'Apply canons of construction',
        'Analyze statutory structure',
        'Consider agency interpretations',
        'Resolve ambiguities systematically'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['interpretation', 'canonsApplied'],
      properties: {
        interpretation: { type: 'object' },
        plainMeaningAnalysis: { type: 'object' },
        purposiveAnalysis: { type: 'object' },
        canonsApplied: { type: 'array' },
        ambiguities: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['legal-reasoning', 'statutory-interpretation']
}));

export const analyzePrecedentsTask = defineTask('legal-precedent-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Precedent Analysis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'legal-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Case law analysis specialist',
      task: 'Analyze relevant precedents and their application',
      context: args,
      instructions: [
        'Extract holdings from precedent cases',
        'Identify material facts from precedents',
        'Determine binding vs persuasive authority',
        'Note distinguishing factors',
        'Trace doctrinal evolution',
        'Assess precedent strength'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['analyzedPrecedents', 'distinguishingFactors'],
      properties: {
        analyzedPrecedents: { type: 'array' },
        bindingAuthority: { type: 'array' },
        persuasiveAuthority: { type: 'array' },
        distinguishingFactors: { type: 'array' },
        doctrinalTrends: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['legal-reasoning', 'precedent-analysis']
}));

export const applyAnalogicalReasoningTask = defineTask('legal-analogical-reasoning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Analogical Reasoning',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'legal-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Legal analogical reasoning specialist',
      task: 'Apply analogical reasoning from precedents to current facts',
      context: args,
      instructions: [
        'Map similarities between precedent and current facts',
        'Identify relevant differences',
        'Assess whether differences are legally material',
        'Determine if precedent should apply',
        'Construct analogical arguments',
        'Address potential distinctions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['analogicalMappings', 'applicationConclusions'],
      properties: {
        analogicalMappings: { type: 'array' },
        similarities: { type: 'array' },
        materialDifferences: { type: 'array' },
        applicationConclusions: { type: 'object' },
        distinguishabilityAnalysis: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['legal-reasoning', 'analogical-reasoning']
}));

export const applyRulesToFactsTask = defineTask('legal-rule-application', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Rule Application',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'legal-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Legal analysis and rule application specialist',
      task: 'Apply identified rules to the facts of the case',
      context: args,
      instructions: [
        'Match facts to rule elements',
        'Assess whether each element is satisfied',
        'Identify contested elements',
        'Apply burden of proof analysis',
        'Document factual gaps',
        'Assess overall rule satisfaction'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['applicationResults', 'confidenceScore'],
      properties: {
        applicationResults: { type: 'object' },
        elementAnalysis: { type: 'array' },
        contestedElements: { type: 'array' },
        uncertainElements: { type: 'array' },
        factualGaps: { type: 'array' },
        researchGaps: { type: 'array' },
        confidenceScore: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['legal-reasoning', 'rule-application']
}));

export const constructArgumentsTask = defineTask('legal-argument-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Argument Construction',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'legal-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Legal argumentation specialist',
      task: 'Construct persuasive legal arguments',
      context: args,
      instructions: [
        'Structure arguments using IRAC method',
        'Build arguments from strongest to weakest',
        'Support arguments with authority',
        'Address potential weaknesses proactively',
        'Construct alternative arguments',
        'Ensure logical coherence'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['arguments', 'supportingArguments'],
      properties: {
        arguments: { type: 'array' },
        supportingArguments: { type: 'array' },
        alternativeArguments: { type: 'array' },
        identifiedWeaknesses: { type: 'array' },
        argumentStructure: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['legal-reasoning', 'argumentation']
}));

export const analyzeCounterargumentsTask = defineTask('legal-counterargument-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Counterargument Analysis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'legal-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Adversarial legal analysis specialist',
      task: 'Anticipate and address counterarguments',
      context: args,
      instructions: [
        'Identify likely counterarguments',
        'Assess strength of opposing positions',
        'Develop rebuttals and responses',
        'Identify argument vulnerabilities',
        'Prepare for worst-case scenarios',
        'Document risk areas'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['anticipatedCounterarguments', 'rebuttals'],
      properties: {
        anticipatedCounterarguments: { type: 'array' },
        rebuttals: { type: 'array' },
        vulnerabilities: { type: 'array' },
        riskAreas: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['legal-reasoning', 'counterarguments']
}));

export const formConclusionsTask = defineTask('legal-conclusion-formation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Conclusion Formation',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'legal-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Legal conclusion and outcome assessment specialist',
      task: 'Form conclusions based on legal analysis',
      context: args,
      instructions: [
        'Synthesize analysis into conclusions',
        'Assess likelihood of different outcomes',
        'Identify key determinative factors',
        'Consider alternative outcomes',
        'Assess litigation risk',
        'Document reasoning chain'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryConclusion', 'outcomeAssessment', 'riskAnalysis'],
      properties: {
        primaryConclusion: { type: 'object' },
        alternativeOutcomes: { type: 'array' },
        outcomeAssessment: { type: 'object' },
        determinativeFactors: { type: 'array' },
        riskAnalysis: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['legal-reasoning', 'conclusions']
}));

export const developRecommendationsTask = defineTask('legal-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Recommendation Development',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'legal-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Legal strategy and advisory specialist',
      task: 'Develop actionable legal recommendations',
      context: args,
      instructions: [
        'Translate conclusions into recommendations',
        'Consider practical implementation',
        'Balance legal and business objectives',
        'Prioritize recommendations',
        'Identify contingency strategies',
        'Document limitations and caveats'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['actionableRecommendations', 'caveats'],
      properties: {
        actionableRecommendations: { type: 'array' },
        prioritizedActions: { type: 'array' },
        contingencyStrategies: { type: 'array' },
        caveats: { type: 'array' },
        nextSteps: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['legal-reasoning', 'recommendations']
}));
