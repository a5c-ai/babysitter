/**
 * @process computer-science/complexity-lower-bound-proof
 * @description Develop rigorous computational complexity lower bound proofs using reduction techniques, communication complexity, and other lower bound methodologies
 * @inputs {
 *   problemDefinition: object,
 *   computationalModel: string,
 *   targetBound: object,
 *   knownResults: array,
 *   proofApproach: string,
 *   restrictionsConsidered: array
 * }
 * @outputs {
 *   lowerBoundTheorem: object,
 *   proofConstruction: object,
 *   reductionChain: array,
 *   technicalLemmas: array,
 *   implications: object,
 *   limitations: object
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  // Phase 1: Problem characterization
  const problemCharacterization = await ctx.task(problemCharacterizer, {
    problem: inputs.problemDefinition,
    model: inputs.computationalModel,
    known: inputs.knownResults
  });

  // Phase 2: Lower bound technique selection
  const techniqueSelection = await ctx.task(techniqueSelector, {
    problem: inputs.problemDefinition,
    targetBound: inputs.targetBound,
    approach: inputs.proofApproach,
    characterization: problemCharacterization
  });

  // Phase 3: Reduction construction
  const reductionConstruction = await ctx.task(reductionConstructor, {
    problem: inputs.problemDefinition,
    technique: techniqueSelection,
    model: inputs.computationalModel,
    targetBound: inputs.targetBound
  });

  // Phase 4: Technical lemma development
  const lemmaDevlopment = await ctx.task(lemmaDeveloper, {
    reduction: reductionConstruction,
    technique: techniqueSelection,
    targetBound: inputs.targetBound
  });

  // Phase 5: Proof assembly
  const proofAssembly = await ctx.task(proofAssembler, {
    reduction: reductionConstruction,
    lemmas: lemmaDevlopment,
    technique: techniqueSelection,
    targetBound: inputs.targetBound
  });

  // Phase 6: Tightness analysis
  const tightnessAnalysis = await ctx.task(tightnessAnalyzer, {
    lowerBound: proofAssembly,
    knownUpperBounds: inputs.knownResults,
    restrictions: inputs.restrictionsConsidered
  });

  // Phase 7: Proof verification
  const proofVerification = await ctx.task(lowerBoundVerifier, {
    proof: proofAssembly,
    lemmas: lemmaDevlopment,
    reduction: reductionConstruction
  });

  // Phase 8: Review breakpoint
  await ctx.breakpoint('lower-bound-review', {
    message: 'Review complexity lower bound proof construction',
    proofAssembly,
    reductionConstruction,
    tightnessAnalysis,
    proofVerification
  });

  // Phase 9: Implications analysis
  const implicationsAnalysis = await ctx.task(implicationsAnalyzer, {
    lowerBound: proofAssembly,
    knownResults: inputs.knownResults,
    problem: inputs.problemDefinition
  });

  return {
    lowerBoundTheorem: proofAssembly.theorem,
    proofConstruction: proofAssembly,
    reductionChain: reductionConstruction.reductionChain,
    technicalLemmas: lemmaDevlopment.lemmas,
    implications: implicationsAnalysis,
    limitations: tightnessAnalysis.limitations,
    verification: proofVerification
  };
}

export const problemCharacterizer = defineTask('problem-characterizer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize computational problem',
  agent: {
    name: 'algorithm-analyst',
    skills: ['asymptotic-notation-calculator', 'recurrence-solver', 'latex-proof-formatter'],
    prompt: {
      role: 'Computational complexity problem characterization expert',
      task: 'Characterize computational problem for lower bound analysis',
      context: args,
      instructions: [
        'Formalize problem definition precisely',
        'Identify computational model parameters',
        'Analyze problem structure and symmetries',
        'Identify information-theoretic constraints',
        'Map connections to known hard problems',
        'Characterize input/output complexity',
        'Identify potential lower bound barriers',
        'Document problem variants and restrictions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        formalProblem: { type: 'object' },
        modelParameters: { type: 'object' },
        structuralProperties: { type: 'array' },
        informationConstraints: { type: 'array' },
        hardProblemConnections: { type: 'array' },
        potentialBarriers: { type: 'array' },
        variants: { type: 'array' }
      },
      required: ['formalProblem', 'modelParameters', 'structuralProperties']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['complexity-theory', 'problem-characterization', 'lower-bounds']
}));

export const techniqueSelector = defineTask('technique-selector', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select lower bound technique',
  agent: {
    name: 'algorithm-analyst',
    skills: ['asymptotic-notation-calculator', 'recurrence-solver', 'theorem-prover-interface'],
    prompt: {
      role: 'Lower bound proof technique expert',
      task: 'Select appropriate lower bound proof technique',
      context: args,
      instructions: [
        'Evaluate applicable lower bound methods',
        'Consider adversary arguments',
        'Analyze communication complexity approaches',
        'Evaluate reduction-based techniques',
        'Consider information-theoretic methods',
        'Assess algebraic and combinatorial techniques',
        'Identify technique limitations',
        'Recommend proof strategy'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        selectedTechnique: { type: 'string' },
        techniqueRationale: { type: 'string' },
        alternativeTechniques: { type: 'array' },
        expectedChallenges: { type: 'array' },
        requiredComponents: { type: 'array' },
        proofStrategy: { type: 'object' }
      },
      required: ['selectedTechnique', 'techniqueRationale', 'proofStrategy']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['complexity-theory', 'technique-selection', 'lower-bounds']
}));

export const reductionConstructor = defineTask('reduction-constructor', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct complexity reduction',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'latex-proof-formatter', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'Complexity reduction construction expert',
      task: 'Construct reduction for lower bound proof',
      context: args,
      instructions: [
        'Identify source problem for reduction',
        'Design gadget constructions',
        'Build instance transformation',
        'Prove correctness of reduction',
        'Analyze reduction complexity overhead',
        'Verify parameter preservation',
        'Handle edge cases in reduction',
        'Document reduction chain'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        sourceProblem: { type: 'object' },
        reductionChain: { type: 'array' },
        gadgetConstructions: { type: 'array' },
        instanceTransformation: { type: 'object' },
        correctnessArgument: { type: 'string' },
        complexityOverhead: { type: 'object' },
        parameterPreservation: { type: 'object' }
      },
      required: ['sourceProblem', 'reductionChain', 'instanceTransformation', 'correctnessArgument']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['complexity-theory', 'reduction', 'construction']
}));

export const lemmaDeveloper = defineTask('lemma-developer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop technical lemmas',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'latex-proof-formatter', 'recurrence-solver'],
    prompt: {
      role: 'Technical lemma development expert',
      task: 'Develop technical lemmas supporting lower bound proof',
      context: args,
      instructions: [
        'Identify required supporting lemmas',
        'Develop counting and combinatorial lemmas',
        'Prove information-theoretic claims',
        'Develop adversary strategy lemmas',
        'Prove communication lower bounds if needed',
        'Develop algebraic claims',
        'Ensure lemma chain completeness',
        'Document lemma dependencies'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        lemmas: { type: 'array' },
        lemmaProofs: { type: 'array' },
        dependencies: { type: 'object' },
        combinatorialArguments: { type: 'array' },
        informationTheoreticClaims: { type: 'array' },
        completenessAnalysis: { type: 'object' }
      },
      required: ['lemmas', 'lemmaProofs', 'dependencies']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['complexity-theory', 'lemmas', 'technical-development']
}));

export const proofAssembler = defineTask('proof-assembler', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble lower bound proof',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'latex-proof-formatter', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'Lower bound proof assembly expert',
      task: 'Assemble complete lower bound proof from components',
      context: args,
      instructions: [
        'State main lower bound theorem precisely',
        'Organize proof structure',
        'Integrate reduction and lemmas',
        'Write complete proof argument',
        'Verify logical completeness',
        'State all assumptions explicitly',
        'Derive tight bound expression',
        'Document proof intuition'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        theorem: { type: 'object' },
        proofStructure: { type: 'object' },
        fullProof: { type: 'string' },
        boundExpression: { type: 'string' },
        assumptions: { type: 'array' },
        proofIntuition: { type: 'string' }
      },
      required: ['theorem', 'proofStructure', 'fullProof', 'boundExpression']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['complexity-theory', 'proof-assembly', 'lower-bounds']
}));

export const tightnessAnalyzer = defineTask('tightness-analyzer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze bound tightness',
  agent: {
    name: 'algorithm-analyst',
    skills: ['asymptotic-notation-calculator', 'recurrence-solver', 'latex-proof-formatter'],
    prompt: {
      role: 'Lower bound tightness analysis expert',
      task: 'Analyze tightness of lower bound and identify gaps',
      context: args,
      instructions: [
        'Compare lower bound to known upper bounds',
        'Identify gaps between bounds',
        'Analyze barriers to tighter bounds',
        'Consider restricted models where bound is tight',
        'Identify potential improvements',
        'Analyze conditional tightness',
        'Document limitations of technique',
        'Suggest future research directions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        tightnessStatus: { type: 'string' },
        gapAnalysis: { type: 'object' },
        barriers: { type: 'array' },
        tightRestrictedModels: { type: 'array' },
        potentialImprovements: { type: 'array' },
        limitations: { type: 'array' },
        futureDirections: { type: 'array' }
      },
      required: ['tightnessStatus', 'gapAnalysis', 'limitations']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['complexity-theory', 'tightness', 'analysis']
}));

export const lowerBoundVerifier = defineTask('lower-bound-verifier', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify lower bound proof',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'latex-proof-formatter', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'Complexity proof verification expert',
      task: 'Verify correctness of lower bound proof',
      context: args,
      instructions: [
        'Verify reduction correctness',
        'Check all lemma proofs',
        'Verify parameter calculations',
        'Check proof logic completeness',
        'Verify bound derivation',
        'Look for edge cases and gaps',
        'Check assumptions are justified',
        'Identify any errors or issues'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        verificationStatus: { type: 'string' },
        reductionVerification: { type: 'object' },
        lemmaVerification: { type: 'array' },
        logicCheck: { type: 'object' },
        issuesFound: { type: 'array' },
        corrections: { type: 'array' }
      },
      required: ['verificationStatus', 'reductionVerification', 'lemmaVerification', 'issuesFound']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['complexity-theory', 'verification', 'proof-checking']
}));

export const implicationsAnalyzer = defineTask('implications-analyzer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze lower bound implications',
  agent: {
    name: 'algorithm-analyst',
    skills: ['asymptotic-notation-calculator', 'latex-proof-formatter', 'theorem-prover-interface'],
    prompt: {
      role: 'Complexity implications analysis expert',
      task: 'Analyze theoretical and practical implications of lower bound',
      context: args,
      instructions: [
        'Derive consequences for related problems',
        'Analyze algorithmic implications',
        'Identify affected computational models',
        'Analyze conditional implications',
        'Connect to complexity class relationships',
        'Identify practical implications',
        'Document surprising consequences',
        'Position in complexity landscape'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        relatedProblemConsequences: { type: 'array' },
        algorithmicImplications: { type: 'array' },
        modelImplications: { type: 'array' },
        conditionalImplications: { type: 'array' },
        classRelationships: { type: 'array' },
        practicalImplications: { type: 'array' },
        landscapePosition: { type: 'object' }
      },
      required: ['relatedProblemConsequences', 'algorithmicImplications', 'landscapePosition']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['complexity-theory', 'implications', 'consequences']
}));
