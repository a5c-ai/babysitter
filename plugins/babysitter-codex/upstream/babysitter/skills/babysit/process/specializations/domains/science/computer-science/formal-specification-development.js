/**
 * @process computer-science/formal-specification-development
 * @description Develop rigorous formal specifications for software systems using mathematical notation, specification languages, and verification-oriented design
 * @inputs {
 *   systemDescription: object,
 *   requirements: array,
 *   specificationLanguage: string,
 *   safetyProperties: array,
 *   livenessProperties: array,
 *   environmentAssumptions: array
 * }
 * @outputs {
 *   formalSpecification: object,
 *   propertySpecifications: array,
 *   refinementHierarchy: object,
 *   consistencyProof: object,
 *   completenessAnalysis: object,
 *   verificationConditions: array
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  // Phase 1: Requirements analysis and formalization
  const requirementsAnalysis = await ctx.task(requirementsAnalyzer, {
    requirements: inputs.requirements,
    systemDescription: inputs.systemDescription,
    safetyProperties: inputs.safetyProperties,
    livenessProperties: inputs.livenessProperties
  });

  // Phase 2: Domain modeling
  const domainModel = await ctx.task(domainModeler, {
    systemDescription: inputs.systemDescription,
    requirements: requirementsAnalysis,
    language: inputs.specificationLanguage
  });

  // Phase 3: State space specification
  const stateSpecification = await ctx.task(stateSpecifier, {
    domainModel,
    requirements: requirementsAnalysis,
    language: inputs.specificationLanguage
  });

  // Phase 4: Operation specification
  const operationSpecification = await ctx.task(operationSpecifier, {
    stateSpecification,
    domainModel,
    requirements: requirementsAnalysis,
    language: inputs.specificationLanguage
  });

  // Phase 5: Property formalization
  const propertyFormalization = await ctx.task(propertyFormalizer, {
    safetyProperties: inputs.safetyProperties,
    livenessProperties: inputs.livenessProperties,
    stateSpecification,
    operationSpecification
  });

  // Phase 6: Consistency checking
  const consistencyCheck = await ctx.task(consistencyChecker, {
    stateSpecification,
    operationSpecification,
    propertyFormalization,
    assumptions: inputs.environmentAssumptions
  });

  // Phase 7: Completeness analysis
  const completenessAnalysis = await ctx.task(completenessAnalyzer, {
    specification: {
      state: stateSpecification,
      operations: operationSpecification,
      properties: propertyFormalization
    },
    requirements: inputs.requirements
  });

  // Phase 8: Refinement development
  const refinementHierarchy = await ctx.task(refinementDeveloper, {
    specification: {
      state: stateSpecification,
      operations: operationSpecification
    },
    targetAbstraction: inputs.systemDescription.abstractionLevel
  });

  // Phase 9: Review breakpoint
  await ctx.breakpoint('specification-review', {
    message: 'Review formal specification development',
    stateSpecification,
    operationSpecification,
    propertyFormalization,
    consistencyCheck,
    completenessAnalysis
  });

  // Phase 10: Verification condition generation
  const verificationConditions = await ctx.task(verificationConditionGenerator, {
    specification: {
      state: stateSpecification,
      operations: operationSpecification,
      properties: propertyFormalization
    },
    refinement: refinementHierarchy
  });

  return {
    formalSpecification: {
      domain: domainModel,
      state: stateSpecification,
      operations: operationSpecification
    },
    propertySpecifications: propertyFormalization.formalizedProperties,
    refinementHierarchy,
    consistencyProof: consistencyCheck,
    completenessAnalysis,
    verificationConditions: verificationConditions.conditions
  };
}

export const requirementsAnalyzer = defineTask('requirements-analyzer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze and structure requirements',
  agent: {
    name: 'semantics-formalist',
    skills: ['tla-plus-model-checker', 'theorem-prover-interface', 'latex-proof-formatter'],
    prompt: {
      role: 'Formal requirements analysis expert',
      task: 'Analyze requirements for formal specification development',
      context: args,
      instructions: [
        'Classify requirements by type (functional, safety, liveness)',
        'Identify ambiguities in natural language requirements',
        'Extract implicit requirements',
        'Identify requirement dependencies',
        'Detect potential conflicts between requirements',
        'Structure requirements for formalization',
        'Identify environment assumptions',
        'Document requirement traceability'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        classifiedRequirements: { type: 'object' },
        ambiguities: { type: 'array' },
        implicitRequirements: { type: 'array' },
        dependencies: { type: 'object' },
        conflicts: { type: 'array' },
        structuredRequirements: { type: 'array' },
        assumptions: { type: 'array' }
      },
      required: ['classifiedRequirements', 'structuredRequirements', 'assumptions']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['formal-methods', 'requirements', 'analysis']
}));

export const domainModeler = defineTask('domain-modeler', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop formal domain model',
  agent: {
    name: 'semantics-formalist',
    skills: ['type-inference-engine', 'latex-proof-formatter', 'tla-plus-model-checker'],
    prompt: {
      role: 'Formal domain modeling expert',
      task: 'Develop formal domain model for specification',
      context: args,
      instructions: [
        'Identify domain entities and relationships',
        'Define domain-specific types',
        'Specify domain invariants',
        'Define domain operations and constraints',
        'Model domain hierarchies and compositions',
        'Specify type constraints and wellformedness',
        'Document domain assumptions',
        'Create domain glossary and notation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        entities: { type: 'array' },
        types: { type: 'array' },
        relationships: { type: 'array' },
        invariants: { type: 'array' },
        domainOperations: { type: 'array' },
        hierarchies: { type: 'object' },
        notation: { type: 'object' }
      },
      required: ['entities', 'types', 'relationships', 'invariants']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['formal-methods', 'domain-modeling', 'specification']
}));

export const stateSpecifier = defineTask('state-specifier', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify system state space',
  agent: {
    name: 'semantics-formalist',
    skills: ['tla-plus-model-checker', 'type-inference-engine', 'latex-proof-formatter'],
    prompt: {
      role: 'Formal state specification expert',
      task: 'Specify formal state space for the system',
      context: args,
      instructions: [
        'Define state variables with types',
        'Specify state invariants',
        'Define initial state predicates',
        'Specify state constraints',
        'Model state composition and decomposition',
        'Define abstract vs concrete state',
        'Specify state wellformedness conditions',
        'Document state space properties'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        stateVariables: { type: 'array' },
        stateInvariants: { type: 'array' },
        initialState: { type: 'object' },
        stateConstraints: { type: 'array' },
        stateComposition: { type: 'object' },
        wellformednessConditions: { type: 'array' },
        formalStateSpec: { type: 'string' }
      },
      required: ['stateVariables', 'stateInvariants', 'initialState', 'formalStateSpec']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['formal-methods', 'state-specification', 'modeling']
}));

export const operationSpecifier = defineTask('operation-specifier', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify system operations',
  agent: {
    name: 'semantics-formalist',
    skills: ['tla-plus-model-checker', 'latex-proof-formatter', 'type-inference-engine'],
    prompt: {
      role: 'Formal operation specification expert',
      task: 'Specify formal operations with pre/post conditions',
      context: args,
      instructions: [
        'Identify all system operations',
        'Specify operation signatures',
        'Define preconditions for each operation',
        'Define postconditions for each operation',
        'Specify frame conditions (what changes/unchanged)',
        'Handle exceptional cases',
        'Specify operation composition',
        'Document operation dependencies'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        operations: { type: 'array' },
        preconditions: { type: 'object' },
        postconditions: { type: 'object' },
        frameConditions: { type: 'object' },
        exceptionalCases: { type: 'array' },
        operationComposition: { type: 'object' },
        formalOperationSpecs: { type: 'array' }
      },
      required: ['operations', 'preconditions', 'postconditions', 'formalOperationSpecs']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['formal-methods', 'operation-specification', 'contracts']
}));

export const propertyFormalizer = defineTask('property-formalizer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Formalize system properties',
  agent: {
    name: 'semantics-formalist',
    skills: ['tla-plus-model-checker', 'theorem-prover-interface', 'latex-proof-formatter'],
    prompt: {
      role: 'Formal property specification expert',
      task: 'Formalize safety and liveness properties',
      context: args,
      instructions: [
        'Formalize safety properties (invariants, mutual exclusion)',
        'Formalize liveness properties (progress, fairness)',
        'Express properties in temporal logic',
        'Specify property dependencies',
        'Identify property conflicts',
        'Prioritize properties for verification',
        'Document property assumptions',
        'Create property traceability matrix'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        formalizedProperties: { type: 'array' },
        safetyFormulas: { type: 'array' },
        livenessFormulas: { type: 'array' },
        temporalLogicSpecs: { type: 'array' },
        propertyDependencies: { type: 'object' },
        conflicts: { type: 'array' },
        traceabilityMatrix: { type: 'object' }
      },
      required: ['formalizedProperties', 'safetyFormulas', 'livenessFormulas', 'temporalLogicSpecs']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['formal-methods', 'property-specification', 'temporal-logic']
}));

export const consistencyChecker = defineTask('consistency-checker', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check specification consistency',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'tla-plus-model-checker', 'latex-proof-formatter'],
    prompt: {
      role: 'Formal specification consistency expert',
      task: 'Check consistency of formal specification',
      context: args,
      instructions: [
        'Check state invariant satisfiability',
        'Verify initial state satisfies invariants',
        'Check operation consistency (pre implies post)',
        'Verify operations preserve invariants',
        'Check property consistency with specification',
        'Identify inconsistencies or contradictions',
        'Verify assumption consistency',
        'Document consistency proof obligations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        consistencyStatus: { type: 'string' },
        invariantSatisfiability: { type: 'object' },
        initialStateCheck: { type: 'object' },
        operationConsistency: { type: 'array' },
        invariantPreservation: { type: 'array' },
        inconsistencies: { type: 'array' },
        proofObligations: { type: 'array' }
      },
      required: ['consistencyStatus', 'invariantSatisfiability', 'operationConsistency', 'inconsistencies']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['formal-methods', 'consistency', 'verification']
}));

export const completenessAnalyzer = defineTask('completeness-analyzer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze specification completeness',
  agent: {
    name: 'semantics-formalist',
    skills: ['tla-plus-model-checker', 'theorem-prover-interface', 'latex-proof-formatter'],
    prompt: {
      role: 'Specification completeness analysis expert',
      task: 'Analyze completeness of formal specification',
      context: args,
      instructions: [
        'Check requirements coverage',
        'Identify unspecified behaviors',
        'Check operation totality',
        'Identify missing error cases',
        'Verify property coverage',
        'Check boundary condition handling',
        'Identify implicit requirements not covered',
        'Document completeness gaps'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        completenessScore: { type: 'number' },
        requirementsCoverage: { type: 'object' },
        unspecifiedBehaviors: { type: 'array' },
        totalityAnalysis: { type: 'object' },
        missingCases: { type: 'array' },
        propertyCoverage: { type: 'object' },
        gaps: { type: 'array' }
      },
      required: ['completenessScore', 'requirementsCoverage', 'unspecifiedBehaviors', 'gaps']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['formal-methods', 'completeness', 'analysis']
}));

export const refinementDeveloper = defineTask('refinement-developer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop refinement hierarchy',
  agent: {
    name: 'semantics-formalist',
    skills: ['theorem-prover-interface', 'latex-proof-formatter', 'type-inference-engine'],
    prompt: {
      role: 'Formal refinement development expert',
      task: 'Develop refinement hierarchy from abstract to concrete',
      context: args,
      instructions: [
        'Identify abstraction levels',
        'Define refinement relations',
        'Develop data refinement',
        'Develop operation refinement',
        'Specify refinement invariants',
        'Generate refinement proof obligations',
        'Document refinement strategy',
        'Plan implementation path'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        abstractionLevels: { type: 'array' },
        refinementRelations: { type: 'array' },
        dataRefinements: { type: 'array' },
        operationRefinements: { type: 'array' },
        refinementInvariants: { type: 'array' },
        proofObligations: { type: 'array' },
        implementationPath: { type: 'object' }
      },
      required: ['abstractionLevels', 'refinementRelations', 'proofObligations']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['formal-methods', 'refinement', 'abstraction']
}));

export const verificationConditionGenerator = defineTask('verification-condition-generator', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate verification conditions',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'tla-plus-model-checker', 'latex-proof-formatter'],
    prompt: {
      role: 'Verification condition generation expert',
      task: 'Generate verification conditions for the specification',
      context: args,
      instructions: [
        'Generate invariant preservation VCs',
        'Generate refinement correctness VCs',
        'Generate property satisfaction VCs',
        'Generate initialization VCs',
        'Simplify and optimize VCs',
        'Prioritize VCs for verification',
        'Identify provable vs requires proof VCs',
        'Document VC dependencies'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        conditions: { type: 'array' },
        invariantVCs: { type: 'array' },
        refinementVCs: { type: 'array' },
        propertyVCs: { type: 'array' },
        initializationVCs: { type: 'array' },
        simplifiedVCs: { type: 'array' },
        prioritization: { type: 'array' },
        dependencies: { type: 'object' }
      },
      required: ['conditions', 'invariantVCs', 'propertyVCs']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['formal-methods', 'verification-conditions', 'theorem-proving']
}));
