/**
 * @process computer-science/operational-semantics-specification
 * @description Define precise operational semantics for programming languages including evaluation rules and semantic properties
 * @inputs { languageDescription: string, abstractSyntax: object, semanticsStyle: string }
 * @outputs { success: boolean, semanticsSpecification: object, evaluationRules: array, propertyProofs: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageDescription,
    abstractSyntax = {},
    semanticsStyle = 'small-step',
    outputDir = 'operational-semantics-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Operational Semantics Specification');

  // ============================================================================
  // PHASE 1: SEMANTICS STYLE SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Selecting semantics style');
  const styleSelection = await ctx.task(semanticsStyleSelectionTask, {
    languageDescription,
    abstractSyntax,
    semanticsStyle,
    outputDir
  });

  artifacts.push(...styleSelection.artifacts);

  // ============================================================================
  // PHASE 2: ABSTRACT SYNTAX DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining abstract syntax');
  const abstractSyntaxDef = await ctx.task(abstractSyntaxDefinitionTask, {
    languageDescription,
    abstractSyntax,
    outputDir
  });

  artifacts.push(...abstractSyntaxDef.artifacts);

  // ============================================================================
  // PHASE 3: VALUES AND RUNTIME ENTITIES
  // ============================================================================

  ctx.log('info', 'Phase 3: Defining values and runtime entities');
  const runtimeEntities = await ctx.task(runtimeEntitiesTask, {
    languageDescription,
    abstractSyntaxDef,
    outputDir
  });

  artifacts.push(...runtimeEntities.artifacts);

  // ============================================================================
  // PHASE 4: EVALUATION RULES SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Specifying evaluation rules');
  const evaluationRules = await ctx.task(evaluationRulesTask, {
    languageDescription,
    abstractSyntaxDef,
    runtimeEntities,
    styleSelection,
    outputDir
  });

  artifacts.push(...evaluationRules.artifacts);

  // ============================================================================
  // PHASE 5: BINDING AND SUBSTITUTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Handling binding and substitution');
  const bindingSubstitution = await ctx.task(bindingSubstitutionTask, {
    languageDescription,
    abstractSyntaxDef,
    evaluationRules,
    outputDir
  });

  artifacts.push(...bindingSubstitution.artifacts);

  // ============================================================================
  // PHASE 6: EVALUATION CONTEXTS (IF APPLICABLE)
  // ============================================================================

  ctx.log('info', 'Phase 6: Defining evaluation contexts');
  const evaluationContexts = await ctx.task(evaluationContextsTask, {
    languageDescription,
    abstractSyntaxDef,
    styleSelection,
    evaluationRules,
    outputDir
  });

  artifacts.push(...evaluationContexts.artifacts);

  // ============================================================================
  // PHASE 7: SEMANTIC PROPERTY PROOFS
  // ============================================================================

  ctx.log('info', 'Phase 7: Proving semantic properties');
  const propertyProofs = await ctx.task(semanticPropertyProofsTask, {
    languageDescription,
    abstractSyntaxDef,
    evaluationRules,
    bindingSubstitution,
    outputDir
  });

  artifacts.push(...propertyProofs.artifacts);

  // ============================================================================
  // PHASE 8: SEMANTICS SPECIFICATION DOCUMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating semantics specification document');
  const specificationDocument = await ctx.task(semanticsSpecificationTask, {
    languageDescription,
    styleSelection,
    abstractSyntaxDef,
    runtimeEntities,
    evaluationRules,
    bindingSubstitution,
    evaluationContexts,
    propertyProofs,
    outputDir
  });

  artifacts.push(...specificationDocument.artifacts);

  // Breakpoint: Review operational semantics
  await ctx.breakpoint({
    question: `Operational semantics specification complete. Style: ${styleSelection.selectedStyle}. Deterministic: ${propertyProofs.determinism}. Review specification?`,
    title: 'Operational Semantics Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        semanticsStyle: styleSelection.selectedStyle,
        ruleCount: evaluationRules.rules?.length || 0,
        isDeterministic: propertyProofs.determinism,
        isConfluent: propertyProofs.confluence
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    languageDescription,
    semanticsSpecification: {
      style: styleSelection.selectedStyle,
      abstractSyntax: abstractSyntaxDef.syntax,
      runtimeEntities: runtimeEntities.entities,
      specificationDocumentPath: specificationDocument.documentPath
    },
    evaluationRules: evaluationRules.rules,
    bindingSubstitution: {
      bindingConstructs: bindingSubstitution.bindingConstructs,
      substitutionDefinition: bindingSubstitution.substitutionDefinition
    },
    evaluationContexts: evaluationContexts.contexts,
    propertyProofs: {
      determinism: propertyProofs.determinism,
      confluence: propertyProofs.confluence,
      proofDocuments: propertyProofs.proofDocuments
    },
    artifacts,
    duration,
    metadata: {
      processId: 'computer-science/operational-semantics-specification',
      timestamp: startTime,
      semanticsStyle,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Semantics Style Selection
export const semanticsStyleSelectionTask = defineTask('semantics-style-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select semantics style',
  agent: {
    name: 'semantics-formalist',
    skills: ['lambda-calculus-reducer', 'type-inference-engine', 'latex-proof-formatter'],
    prompt: {
      role: 'programming language semanticist',
      task: 'Choose and justify the operational semantics style for the language',
      context: args,
      instructions: [
        'Evaluate small-step (structural) operational semantics',
        'Evaluate big-step (natural) operational semantics',
        'Consider language features (concurrency, non-determinism, effects)',
        'Small-step: better for concurrency, intermediate states visible',
        'Big-step: simpler proofs, direct correspondence to implementation',
        'Consider reduction semantics with evaluation contexts',
        'Document selection rationale',
        'Generate style selection report'
      ],
      outputFormat: 'JSON with selectedStyle, rationale, alternatives, styleCharacteristics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedStyle', 'rationale', 'artifacts'],
      properties: {
        selectedStyle: { type: 'string', enum: ['small-step', 'big-step', 'reduction-contexts', 'abstract-machine'] },
        rationale: { type: 'string' },
        alternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              style: { type: 'string' },
              tradeoffs: { type: 'string' }
            }
          }
        },
        styleCharacteristics: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'operational-semantics', 'style-selection']
}));

// Task 2: Abstract Syntax Definition
export const abstractSyntaxDefinitionTask = defineTask('abstract-syntax-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define abstract syntax',
  agent: {
    name: 'semantics-formalist',
    skills: ['grammar-parser-generator', 'lambda-calculus-reducer', 'latex-proof-formatter'],
    prompt: {
      role: 'abstract syntax specialist',
      task: 'Define the abstract syntax of the programming language',
      context: args,
      instructions: [
        'Define expression categories (expressions, statements, declarations)',
        'Specify abstract syntax using BNF or inductive definitions',
        'Distinguish between syntactic categories',
        'Identify binding constructs (lambda, let, etc.)',
        'Define metavariables for each category',
        'Document syntactic sugar if any',
        'Generate abstract syntax specification'
      ],
      outputFormat: 'JSON with syntax, categories, bnfDefinition, metavariables, bindingConstructs, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['syntax', 'categories', 'bnfDefinition', 'artifacts'],
      properties: {
        syntax: { type: 'string' },
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              metavariable: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        bnfDefinition: { type: 'string' },
        metavariables: { type: 'object' },
        bindingConstructs: { type: 'array', items: { type: 'string' } },
        syntacticSugar: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'operational-semantics', 'abstract-syntax']
}));

// Task 3: Runtime Entities
export const runtimeEntitiesTask = defineTask('runtime-entities', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define values and runtime entities',
  agent: {
    name: 'semantics-formalist',
    skills: ['lambda-calculus-reducer', 'type-inference-engine', 'latex-proof-formatter'],
    prompt: {
      role: 'runtime semantics specialist',
      task: 'Define values, environments, stores, and other runtime entities',
      context: args,
      instructions: [
        'Define the set of values (results of evaluation)',
        'Distinguish values from non-value expressions',
        'Define environments (variable bindings) if using environments',
        'Define stores (mutable state) if language has mutation',
        'Define any other runtime entities (continuations, etc.)',
        'Specify canonical forms',
        'Generate runtime entities specification'
      ],
      outputFormat: 'JSON with entities, values, environments, stores, canonicalForms, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['entities', 'values', 'artifacts'],
      properties: {
        entities: { type: 'array', items: { type: 'string' } },
        values: {
          type: 'object',
          properties: {
            definition: { type: 'string' },
            grammar: { type: 'string' }
          }
        },
        environments: {
          type: 'object',
          properties: {
            hasEnvironments: { type: 'boolean' },
            definition: { type: 'string' }
          }
        },
        stores: {
          type: 'object',
          properties: {
            hasStores: { type: 'boolean' },
            definition: { type: 'string' }
          }
        },
        canonicalForms: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'operational-semantics', 'runtime']
}));

// Task 4: Evaluation Rules
export const evaluationRulesTask = defineTask('evaluation-rules', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify evaluation rules',
  agent: {
    name: 'semantics-formalist',
    skills: ['lambda-calculus-reducer', 'theorem-prover-interface', 'latex-proof-formatter'],
    prompt: {
      role: 'evaluation semantics specialist',
      task: 'Define evaluation rules in inference rule notation',
      context: args,
      instructions: [
        'Define evaluation relation (e -> e\' for small-step, e => v for big-step)',
        'Create rules for each syntactic construct',
        'Include rules for: literals, variables, functions, application, conditionals',
        'Add rules for: let bindings, sequencing, references (if applicable)',
        'Use standard inference rule notation',
        'Ensure rules cover all syntactic forms',
        'Generate evaluation rules specification'
      ],
      outputFormat: 'JSON with rules (array with name, premises, conclusion), evaluationRelation, ruleCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rules', 'evaluationRelation', 'artifacts'],
      properties: {
        rules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              premises: { type: 'array', items: { type: 'string' } },
              conclusion: { type: 'string' },
              notation: { type: 'string' },
              sideConditions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        evaluationRelation: { type: 'string' },
        ruleCount: { type: 'number' },
        computationRules: { type: 'array', items: { type: 'string' } },
        congruenceRules: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'operational-semantics', 'evaluation-rules']
}));

// Task 5: Binding and Substitution
export const bindingSubstitutionTask = defineTask('binding-substitution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Handle binding and substitution',
  agent: {
    name: 'semantics-formalist',
    skills: ['lambda-calculus-reducer', 'type-inference-engine', 'latex-proof-formatter'],
    prompt: {
      role: 'binding and substitution specialist',
      task: 'Define binding constructs and substitution mechanism',
      context: args,
      instructions: [
        'Identify all binding constructs in the language',
        'Define free variables function FV(e)',
        'Define capture-avoiding substitution [e/x]e\'',
        'Handle alpha-equivalence',
        'Consider using de Bruijn indices or locally nameless',
        'Document substitution lemmas',
        'Generate binding and substitution specification'
      ],
      outputFormat: 'JSON with bindingConstructs, freeVariables, substitutionDefinition, alphaEquivalence, representation, lemmas, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['bindingConstructs', 'substitutionDefinition', 'artifacts'],
      properties: {
        bindingConstructs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              construct: { type: 'string' },
              boundVariable: { type: 'string' },
              scope: { type: 'string' }
            }
          }
        },
        freeVariables: { type: 'string' },
        substitutionDefinition: { type: 'string' },
        alphaEquivalence: { type: 'string' },
        representation: { type: 'string', enum: ['named', 'de-bruijn', 'locally-nameless'] },
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
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'operational-semantics', 'binding']
}));

// Task 6: Evaluation Contexts
export const evaluationContextsTask = defineTask('evaluation-contexts', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define evaluation contexts',
  agent: {
    name: 'semantics-formalist',
    skills: ['lambda-calculus-reducer', 'grammar-parser-generator', 'latex-proof-formatter'],
    prompt: {
      role: 'reduction semantics specialist',
      task: 'Define evaluation contexts for reduction semantics if applicable',
      context: args,
      instructions: [
        'Determine if evaluation contexts are beneficial',
        'Define evaluation context grammar E ::= ...',
        'Specify hole notation and context application E[e]',
        'Define unique decomposition lemma',
        'Factor rules into computation rules and context rule',
        'Identify evaluation order from context definition',
        'Generate evaluation contexts specification'
      ],
      outputFormat: 'JSON with useContexts, contexts, holeNotation, decompositionLemma, evaluationOrder, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['useContexts', 'artifacts'],
      properties: {
        useContexts: { type: 'boolean' },
        contexts: {
          type: 'object',
          properties: {
            grammar: { type: 'string' },
            holeNotation: { type: 'string' }
          }
        },
        contextApplication: { type: 'string' },
        decompositionLemma: { type: 'string' },
        evaluationOrder: { type: 'string', enum: ['left-to-right', 'right-to-left', 'call-by-value', 'call-by-name', 'other'] },
        factoredRules: {
          type: 'object',
          properties: {
            computationRules: { type: 'array', items: { type: 'string' } },
            contextRule: { type: 'string' }
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
  labels: ['agent', 'operational-semantics', 'evaluation-contexts']
}));

// Task 7: Semantic Property Proofs
export const semanticPropertyProofsTask = defineTask('semantic-property-proofs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prove semantic properties',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'lambda-calculus-reducer', 'latex-proof-formatter'],
    prompt: {
      role: 'semantic property specialist',
      task: 'Prove key semantic properties like determinism and confluence',
      context: args,
      instructions: [
        'State and prove determinism (if applicable)',
        'State and prove confluence (Church-Rosser)',
        'Prove termination for strongly normalizing fragments',
        'Establish equivalence between small-step and big-step (if both defined)',
        'Prove substitution lemmas',
        'Document all property proofs',
        'Generate semantic property proofs document'
      ],
      outputFormat: 'JSON with determinism, confluence, termination, equivalence, substitutionLemmas, proofDocuments, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['determinism', 'confluence', 'artifacts'],
      properties: {
        determinism: { type: 'boolean' },
        determinismProof: { type: 'string' },
        confluence: { type: 'boolean' },
        confluenceProof: { type: 'string' },
        termination: {
          type: 'object',
          properties: {
            stronglyNormalizing: { type: 'boolean' },
            normalizingFragments: { type: 'array', items: { type: 'string' } }
          }
        },
        equivalence: {
          type: 'object',
          properties: {
            smallStepBigStepEquivalent: { type: 'boolean' },
            equivalenceProof: { type: 'string' }
          }
        },
        substitutionLemmas: { type: 'array', items: { type: 'string' } },
        proofDocuments: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'operational-semantics', 'property-proofs']
}));

// Task 8: Semantics Specification Document
export const semanticsSpecificationTask = defineTask('semantics-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate semantics specification document',
  agent: {
    name: 'semantics-formalist',
    skills: ['latex-proof-formatter', 'lambda-calculus-reducer'],
    prompt: {
      role: 'technical documentation specialist',
      task: 'Generate comprehensive operational semantics specification document',
      context: args,
      instructions: [
        'Create executive summary of semantics',
        'Document abstract syntax with grammar',
        'Present all evaluation rules in inference rule notation',
        'Include binding and substitution definitions',
        'Document evaluation contexts if used',
        'Present semantic property proofs',
        'Include examples of evaluation derivations',
        'Format as professional PL semantics specification'
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
            semanticsStyle: { type: 'string' },
            deterministic: { type: 'boolean' },
            confluent: { type: 'boolean' }
          }
        },
        examples: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'operational-semantics', 'documentation']
}));
