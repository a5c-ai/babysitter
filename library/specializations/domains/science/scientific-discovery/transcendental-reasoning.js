/**
 * @process Transcendental Reasoning
 * @description Identify necessary preconditions for the possibility of experience, knowledge, or meaningful discourse
 * @category Scientific Discovery - Meta-Level and Reflective
 * @inputs {{ phenomenon: string, domain: string, context: object, constraints: object }}
 * @outputs {{ preconditions: array, necessityAnalysis: object, constitutiveStructures: object, recommendations: array }}
 * @example
 * // Input: { phenomenon: "scientific inquiry", domain: "epistemology", context: {...} }
 * // Output: { preconditions: [{ condition: "...", necessity: "absolute" }], necessityAnalysis: {...}, constitutiveStructures: {...} }
 * @references Kantian transcendental method, Transcendental argumentation, Conditions of possibility analysis
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  // Phase 1: Phenomenon Characterization
  const phenomenonAnalysis = await ctx.task(characterizePhenomenonTask, {
    phenomenon: inputs.phenomenon,
    domain: inputs.domain,
    context: inputs.context
  });

  // Phase 2: Presupposition Identification
  const presuppositions = await ctx.task(identifyPresuppositionsTask, {
    phenomenon: phenomenonAnalysis.characterizedPhenomenon,
    implicitAssumptions: phenomenonAnalysis.implicitAssumptions,
    domain: inputs.domain
  });

  // Phase 3: Necessary Conditions Analysis
  const necessaryConditions = await ctx.task(analyzeNecessaryConditionsTask, {
    phenomenon: phenomenonAnalysis.characterizedPhenomenon,
    presuppositions: presuppositions.identifiedPresuppositions,
    domain: inputs.domain
  });

  // Phase 4: Transcendental Deduction
  const transcendentalDeduction = await ctx.task(performTranscendentalDeductionTask, {
    phenomenon: phenomenonAnalysis.characterizedPhenomenon,
    necessaryConditions: necessaryConditions.conditions,
    presuppositions: presuppositions.identifiedPresuppositions
  });

  // Phase 5: Constitutive Structure Analysis
  const constitutiveAnalysis = await ctx.task(analyzeConstitutiveStructuresTask, {
    deduction: transcendentalDeduction,
    phenomenon: phenomenonAnalysis.characterizedPhenomenon,
    domain: inputs.domain
  });

  // Phase 6: Regulative Principles Identification
  const regulativePrinciples = await ctx.task(identifyRegulativePrinciplesTask, {
    constitutiveStructures: constitutiveAnalysis.structures,
    phenomenon: phenomenonAnalysis.characterizedPhenomenon,
    practicalContext: inputs.context?.practical
  });

  // Quality Gate: Transcendental Validity
  const validityCheck = await ctx.task(checkTranscendentalValidityTask, {
    deduction: transcendentalDeduction,
    constitutiveStructures: constitutiveAnalysis.structures,
    regulativePrinciples: regulativePrinciples.principles
  });

  if (validityCheck.validityScore < 0.6) {
    await ctx.breakpoint('transcendental-revision', {
      message: 'Transcendental argument has validity concerns',
      concerns: validityCheck.concerns,
      suggestedRevisions: validityCheck.revisionSuggestions
    });
  }

  // Phase 7: Modal Status Assessment
  const modalAssessment = await ctx.task(assessModalStatusTask, {
    preconditions: transcendentalDeduction.derivedPreconditions,
    constitutiveStructures: constitutiveAnalysis.structures,
    domain: inputs.domain
  });

  // Phase 8: Scope and Limits Analysis
  const scopeAnalysis = await ctx.task(analyzeScopeAndLimitsTask, {
    preconditions: transcendentalDeduction.derivedPreconditions,
    constitutiveStructures: constitutiveAnalysis.structures,
    modalStatus: modalAssessment,
    domain: inputs.domain
  });

  // Phase 9: Implications Derivation
  const implications = await ctx.task(deriveImplicationsTask, {
    preconditions: transcendentalDeduction.derivedPreconditions,
    constitutiveStructures: constitutiveAnalysis.structures,
    regulativePrinciples: regulativePrinciples.principles,
    scope: scopeAnalysis
  });

  // Phase 10: Synthesis and Recommendations
  const synthesis = await ctx.task(synthesizeTranscendentalAnalysisTask, {
    phenomenon: phenomenonAnalysis.characterizedPhenomenon,
    preconditions: transcendentalDeduction.derivedPreconditions,
    constitutiveStructures: constitutiveAnalysis.structures,
    regulativePrinciples: regulativePrinciples.principles,
    modalStatus: modalAssessment,
    implications: implications
  });

  return {
    success: true,
    reasoningType: 'Transcendental Reasoning',
    preconditions: transcendentalDeduction.derivedPreconditions.map(p => ({
      condition: p.statement,
      necessity: p.necessityType,
      justification: p.justification,
      modalStatus: modalAssessment.statusByCondition?.[p.id]
    })),
    necessityAnalysis: {
      absoluteNecessities: necessaryConditions.absoluteNecessities,
      relativeNecessities: necessaryConditions.relativeNecessities,
      presuppositions: presuppositions.identifiedPresuppositions,
      deductionChain: transcendentalDeduction.deductionChain
    },
    constitutiveStructures: {
      structures: constitutiveAnalysis.structures,
      formalConditions: constitutiveAnalysis.formalConditions,
      materialConditions: constitutiveAnalysis.materialConditions,
      relationalStructure: constitutiveAnalysis.relationalStructure
    },
    regulativePrinciples: regulativePrinciples.principles,
    scopeAndLimits: {
      validityDomain: scopeAnalysis.validityDomain,
      limitations: scopeAnalysis.limitations,
      boundaries: scopeAnalysis.boundaries
    },
    implications: implications.derivedImplications,
    recommendations: synthesis.recommendations,
    confidence: validityCheck.validityScore
  };
}

export const characterizePhenomenonTask = defineTask('transcendental-phenomenon-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Phenomenon Characterization',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'transcendental-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Transcendental philosophy specialist',
      task: 'Characterize the phenomenon for transcendental analysis',
      context: args,
      instructions: [
        'Describe the phenomenon precisely',
        'Identify what makes it possible',
        'Note implicit assumptions',
        'Identify conditions of intelligibility',
        'Determine domain boundaries',
        'Document phenomenon structure'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['characterizedPhenomenon', 'implicitAssumptions'],
      properties: {
        characterizedPhenomenon: { type: 'object' },
        implicitAssumptions: { type: 'array' },
        intelligibilityConditions: { type: 'array' },
        phenomenonStructure: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['transcendental-reasoning', 'phenomenon-characterization']
}));

export const identifyPresuppositionsTask = defineTask('transcendental-presupposition-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Presupposition Identification',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'transcendental-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Presuppositional analysis specialist',
      task: 'Identify presuppositions underlying the phenomenon',
      context: args,
      instructions: [
        'Identify logical presuppositions',
        'Identify semantic presuppositions',
        'Identify pragmatic presuppositions',
        'Distinguish levels of presupposition',
        'Assess presupposition necessity',
        'Document presupposition chains'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['identifiedPresuppositions'],
      properties: {
        identifiedPresuppositions: { type: 'array' },
        logicalPresuppositions: { type: 'array' },
        semanticPresuppositions: { type: 'array' },
        pragmaticPresuppositions: { type: 'array' },
        presuppositionChains: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['transcendental-reasoning', 'presuppositions']
}));

export const analyzeNecessaryConditionsTask = defineTask('transcendental-necessary-conditions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Necessary Conditions Analysis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'transcendental-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Modal and necessity analysis specialist',
      task: 'Analyze necessary conditions for the phenomenon',
      context: args,
      instructions: [
        'Identify absolutely necessary conditions',
        'Identify relatively necessary conditions',
        'Distinguish necessary from sufficient',
        'Assess necessity types (logical, metaphysical, nomological)',
        'Evaluate condition independence',
        'Document necessity justifications'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['conditions', 'absoluteNecessities', 'relativeNecessities'],
      properties: {
        conditions: { type: 'array' },
        absoluteNecessities: { type: 'array' },
        relativeNecessities: { type: 'array' },
        necessityTypes: { type: 'object' },
        conditionIndependence: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['transcendental-reasoning', 'necessary-conditions']
}));

export const performTranscendentalDeductionTask = defineTask('transcendental-deduction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Transcendental Deduction',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'transcendental-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Transcendental deduction specialist',
      task: 'Perform transcendental deduction of preconditions',
      context: args,
      instructions: [
        'Construct transcendental argument',
        'Show how preconditions enable phenomenon',
        'Establish necessity of preconditions',
        'Demonstrate logical connections',
        'Build deduction chain',
        'Document deductive steps'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['derivedPreconditions', 'deductionChain'],
      properties: {
        derivedPreconditions: { type: 'array' },
        deductionChain: { type: 'array' },
        transcendentalArgument: { type: 'object' },
        logicalConnections: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['transcendental-reasoning', 'deduction']
}));

export const analyzeConstitutiveStructuresTask = defineTask('transcendental-constitutive-structures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Constitutive Structure Analysis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'transcendental-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Constitutive structure analyst',
      task: 'Analyze constitutive structures enabling the phenomenon',
      context: args,
      instructions: [
        'Identify formal constitutive conditions',
        'Identify material constitutive conditions',
        'Map structural relationships',
        'Analyze enabling structures',
        'Distinguish constitutive from regulative',
        'Document structure dependencies'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['structures', 'formalConditions', 'materialConditions'],
      properties: {
        structures: { type: 'array' },
        formalConditions: { type: 'array' },
        materialConditions: { type: 'array' },
        relationalStructure: { type: 'object' },
        structureDependencies: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['transcendental-reasoning', 'constitutive-structures']
}));

export const identifyRegulativePrinciplesTask = defineTask('transcendental-regulative-principles', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Regulative Principles',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'transcendental-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Regulative principle analyst',
      task: 'Identify regulative principles guiding the phenomenon',
      context: args,
      instructions: [
        'Identify regulative (vs constitutive) principles',
        'Determine principle function',
        'Assess principle scope',
        'Evaluate practical implications',
        'Distinguish methodological from substantive',
        'Document principle justifications'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['principles'],
      properties: {
        principles: { type: 'array' },
        methodologicalPrinciples: { type: 'array' },
        substantivePrinciples: { type: 'array' },
        principleScopes: { type: 'object' },
        practicalImplications: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['transcendental-reasoning', 'regulative-principles']
}));

export const checkTranscendentalValidityTask = defineTask('transcendental-validity-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Validity Check',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'transcendental-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Transcendental argument validity specialist',
      task: 'Check validity of transcendental argument',
      context: args,
      instructions: [
        'Verify argument structure',
        'Check for circularity',
        'Assess necessity claims',
        'Evaluate deduction soundness',
        'Identify potential objections',
        'Suggest revisions if needed'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['validityScore', 'concerns'],
      properties: {
        validityScore: { type: 'number' },
        structureValid: { type: 'boolean' },
        circularityRisk: { type: 'number' },
        concerns: { type: 'array' },
        revisionSuggestions: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['transcendental-reasoning', 'validity-check']
}));

export const assessModalStatusTask = defineTask('transcendental-modal-status', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Modal Status Assessment',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'transcendental-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Modal status assessment specialist',
      task: 'Assess modal status of derived preconditions',
      context: args,
      instructions: [
        'Classify modal status of each precondition',
        'Distinguish logical from metaphysical necessity',
        'Assess conceptual necessity',
        'Evaluate nomological necessity',
        'Document modal justifications',
        'Map modal relationships'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['statusByCondition', 'modalClassification'],
      properties: {
        statusByCondition: { type: 'object' },
        modalClassification: { type: 'object' },
        logicalNecessities: { type: 'array' },
        metaphysicalNecessities: { type: 'array' },
        conceptualNecessities: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['transcendental-reasoning', 'modal-status']
}));

export const analyzeScopeAndLimitsTask = defineTask('transcendental-scope-limits', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Scope and Limits Analysis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'transcendental-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Transcendental scope analyst',
      task: 'Analyze scope and limits of transcendental conclusions',
      context: args,
      instructions: [
        'Define validity domain',
        'Identify scope limitations',
        'Determine boundary conditions',
        'Assess generalizability',
        'Identify domain restrictions',
        'Document applicability conditions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['validityDomain', 'limitations', 'boundaries'],
      properties: {
        validityDomain: { type: 'object' },
        limitations: { type: 'array' },
        boundaries: { type: 'array' },
        generalizability: { type: 'object' },
        domainRestrictions: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['transcendental-reasoning', 'scope-limits']
}));

export const deriveImplicationsTask = defineTask('transcendental-implications', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Implications Derivation',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'transcendental-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Transcendental implication specialist',
      task: 'Derive implications from transcendental analysis',
      context: args,
      instructions: [
        'Derive theoretical implications',
        'Identify practical implications',
        'Determine methodological implications',
        'Assess implications for related domains',
        'Evaluate constraint implications',
        'Document implication chains'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['derivedImplications'],
      properties: {
        derivedImplications: { type: 'array' },
        theoreticalImplications: { type: 'array' },
        practicalImplications: { type: 'array' },
        methodologicalImplications: { type: 'array' },
        constraintImplications: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['transcendental-reasoning', 'implications']
}));

export const synthesizeTranscendentalAnalysisTask = defineTask('transcendental-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 11: Synthesis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'transcendental-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Transcendental analysis synthesis specialist',
      task: 'Synthesize transcendental analysis and provide recommendations',
      context: args,
      instructions: [
        'Integrate all analysis components',
        'Summarize key findings',
        'Highlight critical preconditions',
        'Provide practical guidance',
        'Recommend further investigations',
        'Document methodological insights'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'summary'],
      properties: {
        summary: { type: 'object' },
        keyFindings: { type: 'array' },
        criticalPreconditions: { type: 'array' },
        recommendations: { type: 'array' },
        furtherInvestigations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['transcendental-reasoning', 'synthesis']
}));
