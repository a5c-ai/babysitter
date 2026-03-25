/**
 * @process domains/science/scientific-discovery/domain-generic-logic
 * @description Domain Generic Logic: Reason within domain-agnostic formal logic of structures
 * @inputs {
 *   problem: string,
 *   structures: array,
 *   domain: string
 * }
 * @outputs {
 *   success: boolean,
 *   formalRepresentation: object,
 *   derivations: array,
 *   insights: array
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problem,
    structures = [],
    domain = 'general science'
  } = inputs;

  const startTime = ctx.now();

  // Phase 1: Abstract Problem to Generic Structures
  ctx.log('info', 'Abstracting problem to generic structures');
  const abstraction = await ctx.task(abstractToStructuresTask, {
    problem,
    structures,
    domain
  });

  // Phase 2: Identify Structural Properties
  ctx.log('info', 'Identifying structural properties');
  const structuralProperties = await ctx.task(identifyStructuralPropertiesTask, {
    abstraction,
    domain
  });

  // Phase 3: Formalize in Domain-Agnostic Logic
  ctx.log('info', 'Formalizing in domain-agnostic logic');
  const formalization = await ctx.task(formalizeLogicTask, {
    abstraction,
    structuralProperties,
    domain
  });

  await ctx.breakpoint({
    question: 'Formalization complete. Review before derivation?',
    title: 'Domain Generic Logic - Formalization Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/abstraction.json', format: 'json' },
        { path: 'artifacts/formalization.json', format: 'json' }
      ]
    }
  });

  // Phase 4: Apply Generic Derivation Rules
  ctx.log('info', 'Applying generic derivation rules');
  const derivations = await ctx.task(applyDerivationRulesTask, {
    formalization,
    structuralProperties,
    domain
  });

  // Phase 5: Identify Structural Theorems
  ctx.log('info', 'Identifying structural theorems');
  const theorems = await ctx.task(identifyTheoremsTask, {
    derivations,
    formalization,
    domain
  });

  // Phase 6: Map Back to Original Domain
  ctx.log('info', 'Mapping results back to original domain');
  const domainMapping = await ctx.task(mapBackToDomainTask, {
    theorems,
    derivations,
    abstraction,
    problem,
    domain
  });

  // Phase 7: Validate Mappings
  ctx.log('info', 'Validating domain mappings');
  const validation = await ctx.task(validateMappingsTask, {
    domainMapping,
    abstraction,
    theorems,
    domain
  });

  // Phase 8: Synthesize Insights
  ctx.log('info', 'Synthesizing domain-generic insights');
  const synthesis = await ctx.task(synthesizeGenericInsightsTask, {
    problem,
    abstraction,
    formalization,
    derivations,
    theorems,
    domainMapping,
    validation,
    domain
  });

  return {
    success: validation.isValid,
    processId: 'domains/science/scientific-discovery/domain-generic-logic',
    problem,
    domain,
    abstraction,
    structuralProperties,
    formalRepresentation: formalization,
    derivations: derivations.derivations,
    theorems: theorems.theorems,
    domainMapping,
    validation,
    insights: synthesis.insights,
    synthesis,
    metadata: {
      structuresIdentified: abstraction.structures?.length || 0,
      propertiesFound: structuralProperties.properties?.length || 0,
      derivationsPerformed: derivations.derivations?.length || 0,
      theoremsIdentified: theorems.theorems?.length || 0,
      duration: ctx.now() - startTime,
      timestamp: startTime
    }
  };
}

export const abstractToStructuresTask = defineTask('abstract-to-structures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Abstract Problem to Generic Structures',
  agent: {
    name: 'abstraction-specialist',
    prompt: {
      role: 'abstract mathematician',
      task: 'Abstract the problem into domain-agnostic structures',
      context: args,
      instructions: [
        'Identify the underlying mathematical structures',
        'Strip away domain-specific details',
        'Express relationships in structural terms',
        'Identify isomorphisms with known structures',
        'Create abstract representation',
        'Document what is preserved and lost in abstraction',
        'Identify the essential structural features'
      ],
      outputFormat: 'JSON with structures, relationships, isomorphisms, abstraction'
    },
    outputSchema: {
      type: 'object',
      required: ['structures', 'relationships', 'abstractRepresentation'],
      properties: {
        structures: { type: 'array', items: { type: 'object' } },
        relationships: { type: 'array', items: { type: 'object' } },
        isomorphisms: { type: 'array', items: { type: 'object' } },
        abstractRepresentation: { type: 'object' },
        preservedFeatures: { type: 'array', items: { type: 'string' } },
        lostDetails: { type: 'array', items: { type: 'string' } },
        essentialFeatures: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'domain-generic', 'abstraction']
}));

export const identifyStructuralPropertiesTask = defineTask('identify-structural-properties', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Structural Properties',
  agent: {
    name: 'structure-analyst',
    prompt: {
      role: 'structural analyst',
      task: 'Identify the structural properties of the abstracted problem',
      context: args,
      instructions: [
        'Identify symmetries in the structure',
        'Find invariants under transformations',
        'Identify compositionality properties',
        'Find closure properties',
        'Identify order properties',
        'Find connectivity and topology',
        'Document all structural properties'
      ],
      outputFormat: 'JSON with structural properties, symmetries, invariants'
    },
    outputSchema: {
      type: 'object',
      required: ['properties', 'symmetries'],
      properties: {
        properties: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        symmetries: { type: 'array', items: { type: 'object' } },
        invariants: { type: 'array', items: { type: 'object' } },
        compositionality: { type: 'object' },
        closure: { type: 'array', items: { type: 'string' } },
        orderProperties: { type: 'array', items: { type: 'object' } },
        topology: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'domain-generic', 'properties']
}));

export const formalizeLogicTask = defineTask('formalize-logic', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Formalize in Domain-Agnostic Logic',
  agent: {
    name: 'logician',
    prompt: {
      role: 'formal logician',
      task: 'Formalize the abstracted problem in domain-agnostic logic',
      context: args,
      instructions: [
        'Choose appropriate formal system',
        'Define the signature (sorts, functions, relations)',
        'Write axioms capturing structural properties',
        'Formalize the problem statement',
        'Ensure logical consistency',
        'Document the formal system',
        'Identify applicable inference rules'
      ],
      outputFormat: 'JSON with formal system, signature, axioms, formalized problem'
    },
    outputSchema: {
      type: 'object',
      required: ['formalSystem', 'signature', 'axioms', 'formalizedProblem'],
      properties: {
        formalSystem: { type: 'object' },
        signature: { type: 'object' },
        axioms: { type: 'array', items: { type: 'object' } },
        formalizedProblem: { type: 'object' },
        consistencyCheck: { type: 'object' },
        inferenceRules: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'domain-generic', 'formalization']
}));

export const applyDerivationRulesTask = defineTask('apply-derivation-rules', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply Generic Derivation Rules',
  agent: {
    name: 'derivation-engine',
    prompt: {
      role: 'proof assistant',
      task: 'Apply generic derivation rules to derive new facts',
      context: args,
      instructions: [
        'Apply inference rules systematically',
        'Derive consequences of axioms',
        'Look for useful lemmas',
        'Build toward problem solution',
        'Document derivation chains',
        'Identify key derivation steps',
        'Note any derivation obstacles'
      ],
      outputFormat: 'JSON with derivations, lemmas, solution progress'
    },
    outputSchema: {
      type: 'object',
      required: ['derivations'],
      properties: {
        derivations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              derivationFrom: { type: 'array', items: { type: 'string' } },
              rule: { type: 'string' },
              step: { type: 'number' }
            }
          }
        },
        lemmas: { type: 'array', items: { type: 'object' } },
        solutionProgress: { type: 'object' },
        obstacles: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'domain-generic', 'derivation']
}));

export const identifyTheoremsTask = defineTask('identify-theorems', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Structural Theorems',
  agent: {
    name: 'theorem-finder',
    prompt: {
      role: 'mathematician',
      task: 'Identify theorems about the structures',
      context: args,
      instructions: [
        'Identify important derived statements',
        'Formulate as theorems',
        'Assess generality of each theorem',
        'Find connections to known theorems',
        'Identify novel results',
        'Document proof outlines',
        'Rate theorem significance'
      ],
      outputFormat: 'JSON with theorems, proofs, generality, significance'
    },
    outputSchema: {
      type: 'object',
      required: ['theorems'],
      properties: {
        theorems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              statement: { type: 'string' },
              proofOutline: { type: 'string' },
              generality: { type: 'string' },
              significance: { type: 'string' },
              relatedTheorems: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        novelResults: { type: 'array', items: { type: 'string' } },
        knownConnections: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'domain-generic', 'theorems']
}));

export const mapBackToDomainTask = defineTask('map-back-to-domain', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map Results Back to Domain',
  agent: {
    name: 'domain-mapper',
    prompt: {
      role: 'applied mathematician',
      task: 'Map the generic results back to the original domain',
      context: args,
      instructions: [
        'Interpret theorems in original domain terms',
        'Translate derivations to domain language',
        'Identify domain-specific implications',
        'Find concrete instances of abstract results',
        'Document the mapping process',
        'Note any mapping difficulties',
        'Generate domain-specific predictions'
      ],
      outputFormat: 'JSON with domain interpretations, implications, predictions'
    },
    outputSchema: {
      type: 'object',
      required: ['interpretations', 'implications'],
      properties: {
        interpretations: { type: 'array', items: { type: 'object' } },
        implications: { type: 'array', items: { type: 'string' } },
        concreteInstances: { type: 'array', items: { type: 'object' } },
        mappingProcess: { type: 'string' },
        difficulties: { type: 'array', items: { type: 'string' } },
        predictions: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'domain-generic', 'mapping']
}));

export const validateMappingsTask = defineTask('validate-mappings', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Domain Mappings',
  agent: {
    name: 'validation-specialist',
    prompt: {
      role: 'validation specialist',
      task: 'Validate that the domain mappings preserve essential properties',
      context: args,
      instructions: [
        'Check that mappings preserve structure',
        'Verify interpretations are sound',
        'Test predictions against known facts',
        'Identify any mapping failures',
        'Assess overall validity',
        'Document validation process',
        'Rate mapping fidelity'
      ],
      outputFormat: 'JSON with validation results, soundness check, fidelity'
    },
    outputSchema: {
      type: 'object',
      required: ['isValid', 'validationResults'],
      properties: {
        isValid: { type: 'boolean' },
        validationResults: { type: 'array', items: { type: 'object' } },
        structurePreservation: { type: 'object' },
        soundnessCheck: { type: 'object' },
        predictionTests: { type: 'array', items: { type: 'object' } },
        mappingFailures: { type: 'array', items: { type: 'string' } },
        fidelity: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'domain-generic', 'validation']
}));

export const synthesizeGenericInsightsTask = defineTask('synthesize-generic-insights', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Domain-Generic Insights',
  agent: {
    name: 'insight-synthesizer',
    prompt: {
      role: 'philosopher of mathematics',
      task: 'Synthesize insights from domain-generic reasoning',
      context: args,
      instructions: [
        'Summarize key findings from generic approach',
        'Document the value of abstraction',
        'Identify what was gained and lost',
        'Extract methodological principles',
        'Note limitations of the approach',
        'Provide recommendations for future use',
        'Create comprehensive synthesis'
      ],
      outputFormat: 'JSON with synthesis, insights, methodological principles'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'insights'],
      properties: {
        synthesis: { type: 'string' },
        insights: { type: 'array', items: { type: 'string' } },
        abstractionValue: { type: 'string' },
        gainsAndLosses: { type: 'object' },
        methodologicalPrinciples: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'domain-generic', 'synthesis']
}));
