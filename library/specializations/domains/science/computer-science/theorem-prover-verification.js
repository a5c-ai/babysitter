/**
 * @process computer-science/theorem-prover-verification
 * @description Use interactive theorem provers to verify system or algorithm correctness with machine-checked proofs
 * @inputs { systemDescription: string, specificationsToVerify: array, proverPreference: string }
 * @outputs { success: boolean, formalizedSpecification: object, proofArtifacts: object, extractedImplementation: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemDescription,
    specificationsToVerify = [],
    proverPreference = 'Coq',
    extractImplementation = false,
    outputDir = 'theorem-prover-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Theorem Prover Verification');

  // ============================================================================
  // PHASE 1: SYSTEM FORMALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Formalizing system in proof assistant');
  const formalization = await ctx.task(systemFormalizationTask, {
    systemDescription,
    proverPreference,
    outputDir
  });

  artifacts.push(...formalization.artifacts);

  // ============================================================================
  // PHASE 2: SPECIFICATION DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining specifications and invariants');
  const specificationDefinition = await ctx.task(specificationDefinitionTask, {
    systemDescription,
    specificationsToVerify,
    formalization,
    proverPreference,
    outputDir
  });

  artifacts.push(...specificationDefinition.artifacts);

  // ============================================================================
  // PHASE 3: PROOF STRATEGY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing proof strategy');
  const proofStrategy = await ctx.task(proofStrategyTask, {
    systemDescription,
    formalization,
    specificationDefinition,
    proverPreference,
    outputDir
  });

  artifacts.push(...proofStrategy.artifacts);

  // ============================================================================
  // PHASE 4: MACHINE-CHECKED PROOF CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Constructing machine-checked proofs');
  const proofConstruction = await ctx.task(proofConstructionTask, {
    systemDescription,
    formalization,
    specificationDefinition,
    proofStrategy,
    proverPreference,
    outputDir
  });

  artifacts.push(...proofConstruction.artifacts);

  // ============================================================================
  // PHASE 5: IMPLEMENTATION EXTRACTION (IF APPLICABLE)
  // ============================================================================

  ctx.log('info', 'Phase 5: Extracting verified implementation');
  const implementationExtraction = await ctx.task(implementationExtractionTask, {
    formalization,
    proofConstruction,
    extractImplementation,
    proverPreference,
    outputDir
  });

  artifacts.push(...implementationExtraction.artifacts);

  // ============================================================================
  // PHASE 6: PROOF ARTIFACT MAINTENANCE
  // ============================================================================

  ctx.log('info', 'Phase 6: Planning proof artifact maintenance');
  const proofMaintenance = await ctx.task(proofMaintenanceTask, {
    formalization,
    proofConstruction,
    proverPreference,
    outputDir
  });

  artifacts.push(...proofMaintenance.artifacts);

  // ============================================================================
  // PHASE 7: VERIFICATION DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating verification documentation');
  const verificationDocumentation = await ctx.task(verificationDocumentationTask, {
    systemDescription,
    formalization,
    specificationDefinition,
    proofStrategy,
    proofConstruction,
    implementationExtraction,
    proofMaintenance,
    outputDir
  });

  artifacts.push(...verificationDocumentation.artifacts);

  // Breakpoint: Review theorem prover verification
  await ctx.breakpoint({
    question: `Theorem prover verification setup complete. Prover: ${proverPreference}. Proofs planned: ${proofConstruction.proofCount}. Review verification plan?`,
    title: 'Theorem Prover Verification Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        prover: proverPreference,
        specificationCount: specificationDefinition.specifications?.length || 0,
        proofCount: proofConstruction.proofCount,
        extractionEnabled: extractImplementation
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    systemDescription,
    formalizedSpecification: {
      proverLanguage: proverPreference,
      formalizationPath: formalization.formalizationPath,
      definitions: formalization.definitions,
      specifications: specificationDefinition.specifications
    },
    proofArtifacts: {
      proofFiles: proofConstruction.proofFiles,
      proofCount: proofConstruction.proofCount,
      tactics: proofConstruction.tactics,
      lemmas: proofConstruction.lemmas
    },
    extractedImplementation: {
      extracted: implementationExtraction.extracted,
      targetLanguage: implementationExtraction.targetLanguage,
      extractedFilePath: implementationExtraction.extractedFilePath
    },
    maintenance: proofMaintenance.maintenancePlan,
    documentationPath: verificationDocumentation.documentPath,
    artifacts,
    duration,
    metadata: {
      processId: 'computer-science/theorem-prover-verification',
      timestamp: startTime,
      proverPreference,
      extractImplementation,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: System Formalization
export const systemFormalizationTask = defineTask('system-formalization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Formalize system in proof assistant',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'latex-proof-formatter', 'type-inference-engine'],
    prompt: {
      role: 'theorem prover formalization specialist',
      task: 'Formalize the system in the chosen proof assistant (Coq, Isabelle, Lean)',
      context: args,
      instructions: [
        'Choose appropriate proof assistant features',
        'Define data types for system state',
        'Formalize operations/functions',
        'Define inductive types where needed',
        'Use appropriate abstraction level',
        'Follow proof assistant conventions',
        'Document formalization decisions',
        'Generate formalization files'
      ],
      outputFormat: 'JSON with formalizationPath, definitions, dataTypes, functions, conventions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['formalizationPath', 'definitions', 'artifacts'],
      properties: {
        formalizationPath: { type: 'string' },
        definitions: { type: 'array', items: { type: 'string' } },
        dataTypes: { type: 'array', items: { type: 'string' } },
        functions: { type: 'array', items: { type: 'string' } },
        inductiveTypes: { type: 'array', items: { type: 'string' } },
        conventions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'theorem-prover', 'formalization']
}));

// Task 2: Specification Definition
export const specificationDefinitionTask = defineTask('specification-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define specifications and invariants',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'latex-proof-formatter', 'lambda-calculus-reducer'],
    prompt: {
      role: 'formal specification specialist',
      task: 'Define specifications and invariants to be verified',
      context: args,
      instructions: [
        'Translate informal requirements to formal propositions',
        'Define key invariants as predicates',
        'Specify safety properties',
        'Specify correctness conditions',
        'Define auxiliary lemmas needed',
        'Structure specifications hierarchically',
        'Document specification meanings',
        'Generate specification files'
      ],
      outputFormat: 'JSON with specifications, invariants, safetyProperties, lemmas, specificationPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['specifications', 'invariants', 'artifacts'],
      properties: {
        specifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              statement: { type: 'string' },
              informalMeaning: { type: 'string' }
            }
          }
        },
        invariants: { type: 'array', items: { type: 'string' } },
        safetyProperties: { type: 'array', items: { type: 'string' } },
        lemmas: { type: 'array', items: { type: 'string' } },
        specificationPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'theorem-prover', 'specification']
}));

// Task 3: Proof Strategy
export const proofStrategyTask = defineTask('proof-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop proof strategy',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'latex-proof-formatter', 'dataflow-analysis-engine'],
    prompt: {
      role: 'proof development strategist',
      task: 'Develop strategy for proving the specifications',
      context: args,
      instructions: [
        'Analyze proof obligations',
        'Identify proof techniques (induction, case analysis, etc.)',
        'Plan lemma dependencies',
        'Identify automation opportunities',
        'Plan proof decomposition',
        'Consider decision procedures',
        'Document proof strategy',
        'Generate proof strategy document'
      ],
      outputFormat: 'JSON with strategy, proofTechniques, lemmaDependencies, automation, decomposition, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'proofTechniques', 'artifacts'],
      properties: {
        strategy: { type: 'string' },
        proofTechniques: { type: 'array', items: { type: 'string' } },
        lemmaDependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              lemma: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        automation: {
          type: 'object',
          properties: {
            tactics: { type: 'array', items: { type: 'string' } },
            decisionProcedures: { type: 'array', items: { type: 'string' } }
          }
        },
        decomposition: { type: 'string' },
        proofOrder: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'theorem-prover', 'proof-strategy']
}));

// Task 4: Proof Construction
export const proofConstructionTask = defineTask('proof-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct machine-checked proofs',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'latex-proof-formatter', 'type-inference-engine'],
    prompt: {
      role: 'machine-checked proof specialist',
      task: 'Construct machine-checked proofs in the proof assistant',
      context: args,
      instructions: [
        'Implement proofs following strategy',
        'Use appropriate tactics',
        'Develop custom tactics if needed',
        'Prove auxiliary lemmas',
        'Ensure proofs are Qed (fully checked)',
        'Optimize proof scripts for maintainability',
        'Document proof approaches',
        'Generate proof files'
      ],
      outputFormat: 'JSON with proofFiles, proofCount, tactics, lemmas, customTactics, proofNotes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['proofFiles', 'proofCount', 'artifacts'],
      properties: {
        proofFiles: { type: 'array', items: { type: 'string' } },
        proofCount: { type: 'number' },
        tactics: { type: 'array', items: { type: 'string' } },
        lemmas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              statement: { type: 'string' },
              proofTechnique: { type: 'string' }
            }
          }
        },
        customTactics: { type: 'array', items: { type: 'string' } },
        proofNotes: { type: 'array', items: { type: 'string' } },
        allProved: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'theorem-prover', 'proof-construction']
}));

// Task 5: Implementation Extraction
export const implementationExtractionTask = defineTask('implementation-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract verified implementation',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'type-inference-engine', 'lambda-calculus-reducer'],
    prompt: {
      role: 'verified implementation extraction specialist',
      task: 'Extract verified implementation from proofs if applicable',
      context: args,
      instructions: [
        'Determine if extraction is applicable and desired',
        'Choose target extraction language (OCaml, Haskell, etc.)',
        'Configure extraction directives',
        'Handle abstract types and axioms',
        'Extract implementation',
        'Document extraction decisions',
        'Generate extracted implementation file'
      ],
      outputFormat: 'JSON with extracted, targetLanguage, extractedFilePath, extractionDirectives, handledAxioms, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['extracted', 'artifacts'],
      properties: {
        extracted: { type: 'boolean' },
        targetLanguage: { type: 'string' },
        extractedFilePath: { type: 'string' },
        extractionDirectives: { type: 'array', items: { type: 'string' } },
        handledAxioms: { type: 'array', items: { type: 'string' } },
        abstractTypes: { type: 'array', items: { type: 'string' } },
        extractionNotes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'theorem-prover', 'extraction']
}));

// Task 6: Proof Maintenance
export const proofMaintenanceTask = defineTask('proof-maintenance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan proof artifact maintenance',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'latex-proof-formatter'],
    prompt: {
      role: 'proof maintenance specialist',
      task: 'Plan maintenance strategy for proof artifacts',
      context: args,
      instructions: [
        'Document proof dependencies',
        'Create build system configuration',
        'Plan for proof assistant version updates',
        'Document proof refactoring guidelines',
        'Create proof style guide',
        'Plan CI/CD integration for proofs',
        'Generate maintenance documentation'
      ],
      outputFormat: 'JSON with maintenancePlan, dependencies, buildConfiguration, versionStrategy, styleGuide, ciIntegration, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['maintenancePlan', 'artifacts'],
      properties: {
        maintenancePlan: { type: 'string' },
        dependencies: {
          type: 'object',
          properties: {
            libraryDependencies: { type: 'array', items: { type: 'string' } },
            proofDependencies: { type: 'array', items: { type: 'string' } }
          }
        },
        buildConfiguration: { type: 'string' },
        versionStrategy: { type: 'string' },
        styleGuide: { type: 'string' },
        refactoringGuidelines: { type: 'array', items: { type: 'string' } },
        ciIntegration: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'theorem-prover', 'maintenance']
}));

// Task 7: Verification Documentation
export const verificationDocumentationTask = defineTask('verification-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate verification documentation',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['latex-proof-formatter', 'theorem-prover-interface'],
    prompt: {
      role: 'technical documentation specialist',
      task: 'Generate comprehensive theorem prover verification documentation',
      context: args,
      instructions: [
        'Create executive summary',
        'Document formalization approach',
        'Present specifications',
        'Document proof strategy',
        'List all proofs with summaries',
        'Document extraction if applicable',
        'Include maintenance guide',
        'Format as professional verification report'
      ],
      outputFormat: 'JSON with documentPath, executiveSummary, tableOfContents, proofSummaries, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'executiveSummary', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        tableOfContents: { type: 'array', items: { type: 'string' } },
        proofSummaries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              theorem: { type: 'string' },
              summary: { type: 'string' }
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
  labels: ['agent', 'theorem-prover', 'documentation']
}));
