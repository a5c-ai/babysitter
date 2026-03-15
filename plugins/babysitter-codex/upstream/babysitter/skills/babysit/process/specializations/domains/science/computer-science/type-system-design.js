/**
 * @process computer-science/type-system-design
 * @description Design type systems with desired safety and expressiveness properties including typing rules, soundness proofs, and type inference
 * @inputs { languageDescription: string, safetyRequirements: object, expressivenessGoals: array }
 * @outputs { success: boolean, typeSystemSpecification: object, typingRules: array, soundnessProof: object, typeInferenceAlgorithm: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageDescription,
    safetyRequirements = {},
    expressivenessGoals = [],
    targetFeatures = [],
    outputDir = 'type-system-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Type System Design');

  // ============================================================================
  // PHASE 1: TYPE SYNTAX DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining type syntax and structure');
  const typeSyntax = await ctx.task(typeSyntaxDefinitionTask, {
    languageDescription,
    expressivenessGoals,
    targetFeatures,
    outputDir
  });

  artifacts.push(...typeSyntax.artifacts);

  // ============================================================================
  // PHASE 2: TYPE SEMANTICS DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining type semantics');
  const typeSemantics = await ctx.task(typeSemanticsDefinitionTask, {
    languageDescription,
    typeSyntax,
    safetyRequirements,
    outputDir
  });

  artifacts.push(...typeSemantics.artifacts);

  // ============================================================================
  // PHASE 3: TYPING RULES ESTABLISHMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Establishing typing rules (inference rules)');
  const typingRules = await ctx.task(typingRulesTask, {
    languageDescription,
    typeSyntax,
    typeSemantics,
    outputDir
  });

  artifacts.push(...typingRules.artifacts);

  // ============================================================================
  // PHASE 4: TYPE SOUNDNESS PROOF (PROGRESS AND PRESERVATION)
  // ============================================================================

  ctx.log('info', 'Phase 4: Proving type soundness (progress and preservation)');
  const soundnessProof = await ctx.task(soundnessProofTask, {
    languageDescription,
    typeSyntax,
    typeSemantics,
    typingRules,
    outputDir
  });

  artifacts.push(...soundnessProof.artifacts);

  // ============================================================================
  // PHASE 5: TYPE INFERENCE ALGORITHM DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing type inference algorithm');
  const typeInference = await ctx.task(typeInferenceDesignTask, {
    languageDescription,
    typeSyntax,
    typingRules,
    outputDir
  });

  artifacts.push(...typeInference.artifacts);

  // ============================================================================
  // PHASE 6: DECIDABILITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing decidability of type checking');
  const decidabilityAnalysis = await ctx.task(typeCheckingDecidabilityTask, {
    languageDescription,
    typeSyntax,
    typingRules,
    typeInference,
    outputDir
  });

  artifacts.push(...decidabilityAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: ADVANCED FEATURES HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 7: Handling polymorphism, subtyping, or dependent types');
  const advancedFeatures = await ctx.task(advancedFeaturesTask, {
    languageDescription,
    typeSyntax,
    typingRules,
    targetFeatures,
    outputDir
  });

  artifacts.push(...advancedFeatures.artifacts);

  // ============================================================================
  // PHASE 8: TYPE SYSTEM SPECIFICATION DOCUMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating type system specification document');
  const specificationDocument = await ctx.task(typeSystemSpecificationTask, {
    languageDescription,
    typeSyntax,
    typeSemantics,
    typingRules,
    soundnessProof,
    typeInference,
    decidabilityAnalysis,
    advancedFeatures,
    outputDir
  });

  artifacts.push(...specificationDocument.artifacts);

  // Breakpoint: Review type system design
  await ctx.breakpoint({
    question: `Type system design complete. Sound: ${soundnessProof.isSound}. Decidable: ${decidabilityAnalysis.isDecidable}. Review specification?`,
    title: 'Type System Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        isSound: soundnessProof.isSound,
        isDecidable: decidabilityAnalysis.isDecidable,
        hasTypeInference: typeInference.hasInference,
        advancedFeatures: advancedFeatures.features
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    languageDescription,
    typeSystemSpecification: {
      typeSyntax: typeSyntax.syntax,
      typeSemantics: typeSemantics.semantics,
      specificationDocumentPath: specificationDocument.documentPath
    },
    typingRules: typingRules.rules,
    soundnessProof: {
      isSound: soundnessProof.isSound,
      progressProof: soundnessProof.progressProof,
      preservationProof: soundnessProof.preservationProof,
      proofDocumentPath: soundnessProof.proofDocumentPath
    },
    typeInferenceAlgorithm: {
      hasInference: typeInference.hasInference,
      algorithmDescription: typeInference.algorithmDescription,
      complexity: typeInference.complexity
    },
    decidability: {
      isDecidable: decidabilityAnalysis.isDecidable,
      complexity: decidabilityAnalysis.complexity
    },
    advancedFeatures: advancedFeatures.features,
    artifacts,
    duration,
    metadata: {
      processId: 'computer-science/type-system-design',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Type Syntax Definition
export const typeSyntaxDefinitionTask = defineTask('type-syntax-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define type syntax and structure',
  agent: {
    name: 'type-theorist',
    skills: ['type-inference-engine', 'lambda-calculus-reducer', 'latex-proof-formatter'],
    prompt: {
      role: 'programming language type theorist',
      task: 'Define the syntax of types for the type system',
      context: args,
      instructions: [
        'Define base types (int, bool, unit, etc.)',
        'Define type constructors (function types, product types, sum types)',
        'Define type variables for polymorphism if needed',
        'Specify well-formedness rules for types',
        'Use BNF or similar notation for type grammar',
        'Consider recursive types if needed',
        'Document type syntax completely',
        'Generate type syntax specification'
      ],
      outputFormat: 'JSON with syntax, baseTypes, typeConstructors, typeVariables, wellFormednessRules, grammar, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['syntax', 'baseTypes', 'typeConstructors', 'artifacts'],
      properties: {
        syntax: { type: 'string' },
        baseTypes: { type: 'array', items: { type: 'string' } },
        typeConstructors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              arity: { type: 'number' },
              notation: { type: 'string' }
            }
          }
        },
        typeVariables: { type: 'boolean' },
        wellFormednessRules: { type: 'array', items: { type: 'string' } },
        grammar: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'type-system', 'syntax']
}));

// Task 2: Type Semantics Definition
export const typeSemanticsDefinitionTask = defineTask('type-semantics-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define type semantics',
  agent: {
    name: 'semantics-formalist',
    skills: ['lambda-calculus-reducer', 'type-inference-engine', 'latex-proof-formatter'],
    prompt: {
      role: 'denotational semantics specialist',
      task: 'Define the semantics of types (what values inhabit each type)',
      context: args,
      instructions: [
        'Define semantic domain for each base type',
        'Define semantic interpretation of type constructors',
        'Establish type-value relationship',
        'Define typing context semantics',
        'Consider subtyping interpretation if applicable',
        'Document semantic functions',
        'Generate type semantics specification'
      ],
      outputFormat: 'JSON with semantics, semanticDomains, interpretations, contextSemantics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['semantics', 'semanticDomains', 'artifacts'],
      properties: {
        semantics: { type: 'string' },
        semanticDomains: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        interpretations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              typeConstructor: { type: 'string' },
              interpretation: { type: 'string' }
            }
          }
        },
        contextSemantics: { type: 'string' },
        typeValueRelation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'type-system', 'semantics']
}));

// Task 3: Typing Rules
export const typingRulesTask = defineTask('typing-rules', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish typing rules (inference rules)',
  agent: {
    name: 'type-theorist',
    skills: ['type-inference-engine', 'theorem-prover-interface', 'latex-proof-formatter'],
    prompt: {
      role: 'type system designer',
      task: 'Define typing rules in inference rule notation',
      context: args,
      instructions: [
        'Define typing judgment form (Gamma |- e : T)',
        'Create rules for each expression construct',
        'Include variable rule, abstraction rule, application rule',
        'Add rules for conditionals, let bindings, etc.',
        'Ensure rules are syntax-directed where possible',
        'Use standard inference rule notation',
        'Document rule naming conventions',
        'Generate typing rules specification'
      ],
      outputFormat: 'JSON with rules (array with name, premises, conclusion), judgmentForm, syntaxDirected, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rules', 'judgmentForm', 'artifacts'],
      properties: {
        rules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              premises: { type: 'array', items: { type: 'string' } },
              conclusion: { type: 'string' },
              notation: { type: 'string' }
            }
          }
        },
        judgmentForm: { type: 'string' },
        syntaxDirected: { type: 'boolean' },
        auxiliaryJudgments: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'type-system', 'typing-rules']
}));

// Task 4: Soundness Proof
export const soundnessProofTask = defineTask('soundness-proof', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prove type soundness (progress and preservation)',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'type-inference-engine', 'latex-proof-formatter'],
    prompt: {
      role: 'type theory proof specialist',
      task: 'Prove type soundness via progress and preservation theorems',
      context: args,
      instructions: [
        'State Progress theorem: well-typed terms are values or can step',
        'State Preservation theorem: types are preserved by evaluation',
        'Prove Progress by induction on typing derivation',
        'Prove Preservation by induction on typing derivation',
        'Handle all typing rules in proofs',
        'Identify any required lemmas (substitution, inversion, etc.)',
        'Document canonical forms lemma',
        'Generate complete soundness proof document'
      ],
      outputFormat: 'JSON with isSound, progressProof, preservationProof, lemmas, canonicalForms, proofDocumentPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['isSound', 'progressProof', 'preservationProof', 'artifacts'],
      properties: {
        isSound: { type: 'boolean' },
        progressProof: {
          type: 'object',
          properties: {
            statement: { type: 'string' },
            proofOutline: { type: 'string' },
            complete: { type: 'boolean' }
          }
        },
        preservationProof: {
          type: 'object',
          properties: {
            statement: { type: 'string' },
            proofOutline: { type: 'string' },
            complete: { type: 'boolean' }
          }
        },
        lemmas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              statement: { type: 'string' }
            }
          }
        },
        canonicalForms: { type: 'string' },
        proofDocumentPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'type-system', 'soundness']
}));

// Task 5: Type Inference Design
export const typeInferenceDesignTask = defineTask('type-inference-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design type inference algorithm',
  agent: {
    name: 'type-theorist',
    skills: ['type-inference-engine', 'lambda-calculus-reducer', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'type inference specialist',
      task: 'Design type inference algorithm for the type system',
      context: args,
      instructions: [
        'Determine if full type inference is possible',
        'Design constraint generation phase',
        'Design unification algorithm (if applicable)',
        'Handle polymorphism via let-polymorphism / Hindley-Milner',
        'Specify algorithm W or similar if applicable',
        'Analyze inference algorithm complexity',
        'Document inference algorithm step by step',
        'Generate type inference specification'
      ],
      outputFormat: 'JSON with hasInference, algorithmDescription, constraintGeneration, unification, complexity, pseudocode, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hasInference', 'algorithmDescription', 'artifacts'],
      properties: {
        hasInference: { type: 'boolean' },
        algorithmDescription: { type: 'string' },
        constraintGeneration: { type: 'string' },
        unification: {
          type: 'object',
          properties: {
            algorithm: { type: 'string' },
            occursCheck: { type: 'boolean' }
          }
        },
        letPolymorphism: { type: 'boolean' },
        complexity: { type: 'string' },
        pseudocode: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'type-system', 'type-inference']
}));

// Task 6: Type Checking Decidability
export const typeCheckingDecidabilityTask = defineTask('type-checking-decidability', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze decidability of type checking',
  agent: {
    name: 'complexity-theorist',
    skills: ['complexity-class-oracle', 'type-inference-engine', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'type system decidability specialist',
      task: 'Analyze decidability and complexity of type checking',
      context: args,
      instructions: [
        'Determine if type checking is decidable',
        'Analyze complexity of type checking algorithm',
        'Identify features that affect decidability',
        'Consider type inference vs type checking decidability',
        'Note any undecidable fragments',
        'Document decidability conditions',
        'Generate decidability analysis report'
      ],
      outputFormat: 'JSON with isDecidable, complexity, factors, undecidableFragments, conditions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['isDecidable', 'complexity', 'artifacts'],
      properties: {
        isDecidable: { type: 'boolean' },
        complexity: { type: 'string' },
        typeCheckingComplexity: { type: 'string' },
        typeInferenceComplexity: { type: 'string' },
        factors: { type: 'array', items: { type: 'string' } },
        undecidableFragments: { type: 'array', items: { type: 'string' } },
        conditions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'type-system', 'decidability']
}));

// Task 7: Advanced Features
export const advancedFeaturesTask = defineTask('advanced-features', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Handle polymorphism, subtyping, or dependent types',
  agent: {
    name: 'type-theorist',
    skills: ['type-inference-engine', 'lambda-calculus-reducer', 'theorem-prover-interface'],
    prompt: {
      role: 'advanced type system specialist',
      task: 'Design and integrate advanced type system features as needed',
      context: args,
      instructions: [
        'Assess need for parametric polymorphism',
        'Design subtyping relation if needed',
        'Consider dependent types if required',
        'Add typing rules for advanced features',
        'Assess impact on decidability',
        'Update soundness proof for new features',
        'Document advanced features integration',
        'Generate advanced features specification'
      ],
      outputFormat: 'JSON with features, polymorphism, subtyping, dependentTypes, additionalRules, decidabilityImpact, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        polymorphism: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['parametric', 'ad-hoc', 'subtype', 'none'] },
            quantification: { type: 'string' },
            rules: { type: 'array', items: { type: 'string' } }
          }
        },
        subtyping: {
          type: 'object',
          properties: {
            hasSubtyping: { type: 'boolean' },
            subtypingRules: { type: 'array', items: { type: 'string' } },
            subsumptionRule: { type: 'string' }
          }
        },
        dependentTypes: {
          type: 'object',
          properties: {
            hasDependentTypes: { type: 'boolean' },
            level: { type: 'string' }
          }
        },
        decidabilityImpact: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'type-system', 'advanced-features']
}));

// Task 8: Type System Specification Document
export const typeSystemSpecificationTask = defineTask('type-system-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate type system specification document',
  agent: {
    name: 'type-theorist',
    skills: ['latex-proof-formatter', 'type-inference-engine'],
    prompt: {
      role: 'technical documentation specialist',
      task: 'Generate comprehensive type system specification document',
      context: args,
      instructions: [
        'Create executive summary of type system',
        'Document type syntax with grammar',
        'Present all typing rules in inference rule notation',
        'Include type semantics description',
        'Present soundness proof outline',
        'Document type inference algorithm',
        'Include decidability analysis',
        'Document advanced features',
        'Format as professional PL specification'
      ],
      outputFormat: 'JSON with documentPath, executiveSummary, tableOfContents, keyProperties, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'executiveSummary', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        tableOfContents: { type: 'array', items: { type: 'string' } },
        keyProperties: {
          type: 'object',
          properties: {
            sound: { type: 'boolean' },
            decidable: { type: 'boolean' },
            hasInference: { type: 'boolean' },
            polymorphic: { type: 'boolean' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'type-system', 'documentation']
}));
