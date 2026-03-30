/**
 * @process computer-science/theoretical-cs-paper-development
 * @description Develop theoretical computer science research papers with rigorous mathematical foundations, novel contributions, and clear exposition for academic publication
 * @inputs {
 *   researchTopic: string,
 *   targetVenue: string,
 *   preliminaryResults: object,
 *   relatedWork: array,
 *   contributionClaims: array,
 *   proofSketches: array
 * }
 * @outputs {
 *   paperDraft: object,
 *   theorems: array,
 *   proofs: array,
 *   contributionAnalysis: object,
 *   relatedWorkSynthesis: object,
 *   presentationMaterials: object
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  // Phase 1: Research landscape analysis
  const landscapeAnalysis = await ctx.task(researchLandscapeAnalyzer, {
    topic: inputs.researchTopic,
    venue: inputs.targetVenue,
    relatedWork: inputs.relatedWork,
    claims: inputs.contributionClaims
  });

  // Phase 2: Contribution formalization
  const formalContribution = await ctx.task(contributionFormalizer, {
    preliminaryResults: inputs.preliminaryResults,
    landscapeAnalysis,
    claims: inputs.contributionClaims
  });

  // Phase 3: Theorem development
  const theoremDevelopment = await ctx.task(theoremDeveloper, {
    formalContribution,
    proofSketches: inputs.proofSketches,
    topic: inputs.researchTopic
  });

  // Phase 4: Proof construction
  const proofConstruction = await ctx.task(proofConstructor, {
    theorems: theoremDevelopment.theorems,
    proofSketches: inputs.proofSketches,
    formalContribution
  });

  // Phase 5: Related work synthesis
  const relatedWorkSynthesis = await ctx.task(relatedWorkSynthesizer, {
    relatedWork: inputs.relatedWork,
    contribution: formalContribution,
    theorems: theoremDevelopment.theorems
  });

  // Phase 6: Paper drafting
  const paperDraft = await ctx.task(paperDrafter, {
    contribution: formalContribution,
    theorems: theoremDevelopment,
    proofs: proofConstruction,
    relatedWorkSynthesis,
    venue: inputs.targetVenue
  });

  // Phase 7: Technical verification
  const verification = await ctx.task(technicalVerifier, {
    paperDraft,
    theorems: theoremDevelopment.theorems,
    proofs: proofConstruction.proofs
  });

  // Phase 8: Review breakpoint
  await ctx.breakpoint('paper-review', {
    message: 'Review theoretical CS paper draft',
    paperDraft,
    theorems: theoremDevelopment,
    proofs: proofConstruction,
    verification
  });

  // Phase 9: Presentation preparation
  const presentationMaterials = await ctx.task(presentationPreparer, {
    paperDraft,
    contribution: formalContribution,
    theorems: theoremDevelopment,
    venue: inputs.targetVenue
  });

  return {
    paperDraft,
    theorems: theoremDevelopment.theorems,
    proofs: proofConstruction.proofs,
    contributionAnalysis: formalContribution,
    relatedWorkSynthesis,
    presentationMaterials,
    verification
  };
}

export const researchLandscapeAnalyzer = defineTask('research-landscape-analyzer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze theoretical CS research landscape',
  agent: {
    name: 'algorithm-analyst',
    skills: ['asymptotic-notation-calculator', 'latex-proof-formatter', 'theorem-prover-interface'],
    prompt: {
      role: 'Theoretical computer science research analyst',
      task: 'Analyze research landscape for theoretical CS contribution positioning',
      context: args,
      instructions: [
        'Survey recent advances in the research area',
        'Identify open problems and conjectures',
        'Map existing techniques and approaches',
        'Analyze venue-specific expectations and standards',
        'Identify gaps where contribution fits',
        'Assess novelty potential of claimed contributions',
        'Map connections to related theoretical areas',
        'Identify potential reviewers and their perspectives'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        areaOverview: { type: 'object' },
        openProblems: { type: 'array' },
        existingTechniques: { type: 'array' },
        venueExpectations: { type: 'object' },
        noveltyAssessment: { type: 'object' },
        positioningStrategy: { type: 'object' },
        relatedAreas: { type: 'array' }
      },
      required: ['areaOverview', 'openProblems', 'noveltyAssessment', 'positioningStrategy']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['theoretical-cs', 'research-landscape', 'literature-analysis']
}));

export const contributionFormalizer = defineTask('contribution-formalizer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Formalize theoretical contributions',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'latex-proof-formatter', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'Theoretical computer science formalization expert',
      task: 'Formalize research contributions with precise mathematical statements',
      context: args,
      instructions: [
        'Transform informal claims into formal statements',
        'Define all necessary notation and terminology',
        'Establish the formal model and setting',
        'State main theorems precisely',
        'Identify key lemmas needed for proofs',
        'Clarify assumptions and limitations',
        'Formulate corollaries and extensions',
        'Ensure consistency with established conventions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        formalModel: { type: 'object' },
        definitions: { type: 'array' },
        mainTheorems: { type: 'array' },
        supportingLemmas: { type: 'array' },
        assumptions: { type: 'array' },
        notation: { type: 'object' },
        contributionSummary: { type: 'string' }
      },
      required: ['formalModel', 'definitions', 'mainTheorems', 'assumptions']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['theoretical-cs', 'formalization', 'contributions']
}));

export const theoremDeveloper = defineTask('theorem-developer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop theorems and proof strategies',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'latex-proof-formatter', 'recurrence-solver'],
    prompt: {
      role: 'Theorem development and proof strategy expert',
      task: 'Develop rigorous theorems with clear proof strategies',
      context: args,
      instructions: [
        'Refine theorem statements for maximum clarity',
        'Develop proof strategies for each theorem',
        'Identify proof techniques to employ',
        'Structure lemma dependencies',
        'Anticipate potential proof difficulties',
        'Design proof by induction/contradiction strategies',
        'Plan probabilistic or combinatorial arguments',
        'Ensure completeness of proof coverage'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        theorems: { type: 'array' },
        proofStrategies: { type: 'array' },
        lemmaDependencies: { type: 'object' },
        techniques: { type: 'array' },
        difficulties: { type: 'array' },
        proofOutline: { type: 'object' }
      },
      required: ['theorems', 'proofStrategies', 'lemmaDependencies']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['theoretical-cs', 'theorems', 'proof-strategy']
}));

export const proofConstructor = defineTask('proof-constructor', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct rigorous mathematical proofs',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'latex-proof-formatter', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'Mathematical proof construction expert',
      task: 'Construct complete, rigorous proofs for all theorems',
      context: args,
      instructions: [
        'Construct detailed proofs following strategies',
        'Prove all supporting lemmas',
        'Ensure logical completeness at each step',
        'Handle edge cases and boundary conditions',
        'Verify correctness of probabilistic arguments',
        'Check algebraic manipulations carefully',
        'Ensure induction base cases and steps',
        'Document proof intuition alongside rigor'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        proofs: { type: 'array' },
        lemmaProofs: { type: 'array' },
        verificationStatus: { type: 'object' },
        proofDifficulties: { type: 'array' },
        intuitionNotes: { type: 'array' }
      },
      required: ['proofs', 'lemmaProofs', 'verificationStatus']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['theoretical-cs', 'proof-construction', 'verification']
}));

export const relatedWorkSynthesizer = defineTask('related-work-synthesizer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize related work analysis',
  agent: {
    name: 'algorithm-analyst',
    skills: ['latex-proof-formatter', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'Academic related work synthesis expert',
      task: 'Synthesize comprehensive related work analysis positioning the contribution',
      context: args,
      instructions: [
        'Organize related work by themes and techniques',
        'Compare and contrast with closest prior work',
        'Highlight what prior work cannot achieve',
        'Explain how contribution advances the state of the art',
        'Acknowledge inspirations and building blocks',
        'Identify concurrent/independent work if any',
        'Ensure fair and accurate characterization',
        'Connect to broader research context'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        thematicOrganization: { type: 'object' },
        closestPriorWork: { type: 'array' },
        gapsAddressed: { type: 'array' },
        advancementsClaimed: { type: 'array' },
        acknowledgments: { type: 'array' },
        broaderContext: { type: 'string' },
        relatedWorkText: { type: 'string' }
      },
      required: ['thematicOrganization', 'closestPriorWork', 'advancementsClaimed']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['theoretical-cs', 'related-work', 'positioning']
}));

export const paperDrafter = defineTask('paper-drafter', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Draft theoretical CS paper',
  agent: {
    name: 'algorithm-analyst',
    skills: ['latex-proof-formatter', 'asymptotic-notation-calculator', 'theorem-prover-interface'],
    prompt: {
      role: 'Theoretical computer science paper writing expert',
      task: 'Draft complete theoretical CS paper for target venue',
      context: args,
      instructions: [
        'Write compelling abstract and introduction',
        'Present preliminaries and notation clearly',
        'Structure main results for maximum impact',
        'Write proofs with appropriate detail level',
        'Integrate related work discussion',
        'Craft conclusions and future directions',
        'Ensure venue-appropriate style and length',
        'Include clear examples and illustrations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        abstract: { type: 'string' },
        introduction: { type: 'string' },
        preliminaries: { type: 'string' },
        mainResults: { type: 'string' },
        proofSections: { type: 'array' },
        relatedWork: { type: 'string' },
        conclusions: { type: 'string' },
        appendices: { type: 'array' },
        fullDraft: { type: 'string' }
      },
      required: ['abstract', 'introduction', 'mainResults', 'fullDraft']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['theoretical-cs', 'paper-writing', 'drafting']
}));

export const technicalVerifier = defineTask('technical-verifier', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify technical correctness',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'latex-proof-formatter', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'Technical verification expert for theoretical CS papers',
      task: 'Verify technical correctness of all claims and proofs',
      context: args,
      instructions: [
        'Check all proofs for logical correctness',
        'Verify theorem statements match proofs',
        'Check mathematical notation consistency',
        'Verify all lemma dependencies',
        'Test boundary cases and edge conditions',
        'Check for unstated assumptions',
        'Verify citations are accurate',
        'Identify any remaining gaps or issues'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        overallVerification: { type: 'string' },
        proofVerifications: { type: 'array' },
        issuesFound: { type: 'array' },
        notationInconsistencies: { type: 'array' },
        gapsIdentified: { type: 'array' },
        recommendations: { type: 'array' }
      },
      required: ['overallVerification', 'proofVerifications', 'issuesFound']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['theoretical-cs', 'verification', 'quality-assurance']
}));

export const presentationPreparer = defineTask('presentation-preparer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare presentation materials',
  agent: {
    name: 'algorithm-analyst',
    skills: ['latex-proof-formatter', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'Academic presentation preparation expert',
      task: 'Prepare presentation materials for theoretical CS paper',
      context: args,
      instructions: [
        'Design talk structure for venue format',
        'Create compelling narrative arc',
        'Prepare clear visualizations of key concepts',
        'Design proof sketches for presentation',
        'Prepare responses to anticipated questions',
        'Create supplementary materials',
        'Design poster if applicable',
        'Prepare demo or examples if relevant'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        talkOutline: { type: 'object' },
        slideContent: { type: 'array' },
        visualizations: { type: 'array' },
        proofSketches: { type: 'array' },
        anticipatedQuestions: { type: 'array' },
        supplementaryMaterials: { type: 'array' }
      },
      required: ['talkOutline', 'slideContent', 'anticipatedQuestions']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['theoretical-cs', 'presentation', 'academic-talk']
}));
