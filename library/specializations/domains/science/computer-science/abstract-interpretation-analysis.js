/**
 * @process computer-science/abstract-interpretation-analysis
 * @description Design abstract interpretation frameworks for static program analysis with sound abstractions
 * @inputs { programDescription: string, analysisGoals: array, targetLanguage: string }
 * @outputs { success: boolean, abstractInterpretationFramework: object, soundnessProof: object, analysisImplementation: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    programDescription,
    analysisGoals = [],
    targetLanguage = 'imperative',
    outputDir = 'abstract-interpretation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Abstract Interpretation Analysis Design');

  // ============================================================================
  // PHASE 1: CONCRETE SEMANTICS DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining concrete semantics');
  const concreteSemantics = await ctx.task(concreteSemanticsTask, {
    programDescription,
    targetLanguage,
    outputDir
  });

  artifacts.push(...concreteSemantics.artifacts);

  // ============================================================================
  // PHASE 2: ABSTRACT DOMAIN DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing abstract domain');
  const abstractDomain = await ctx.task(abstractDomainDesignTask, {
    programDescription,
    analysisGoals,
    concreteSemantics,
    outputDir
  });

  artifacts.push(...abstractDomain.artifacts);

  // ============================================================================
  // PHASE 3: GALOIS CONNECTION ESTABLISHMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Establishing Galois connection');
  const galoisConnection = await ctx.task(galoisConnectionTask, {
    concreteSemantics,
    abstractDomain,
    outputDir
  });

  artifacts.push(...galoisConnection.artifacts);

  // ============================================================================
  // PHASE 4: ABSTRACT TRANSFER FUNCTIONS
  // ============================================================================

  ctx.log('info', 'Phase 4: Defining abstract transfer functions');
  const transferFunctions = await ctx.task(abstractTransferFunctionsTask, {
    concreteSemantics,
    abstractDomain,
    galoisConnection,
    targetLanguage,
    outputDir
  });

  artifacts.push(...transferFunctions.artifacts);

  // ============================================================================
  // PHASE 5: SOUNDNESS PROOF
  // ============================================================================

  ctx.log('info', 'Phase 5: Proving soundness of abstraction');
  const soundnessProof = await ctx.task(soundnessProofTask, {
    concreteSemantics,
    abstractDomain,
    galoisConnection,
    transferFunctions,
    outputDir
  });

  artifacts.push(...soundnessProof.artifacts);

  // ============================================================================
  // PHASE 6: FIXPOINT COMPUTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing fixpoint computation');
  const fixpointComputation = await ctx.task(fixpointComputationTask, {
    abstractDomain,
    transferFunctions,
    outputDir
  });

  artifacts.push(...fixpointComputation.artifacts);

  // ============================================================================
  // PHASE 7: ANALYSIS IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing analysis');
  const analysisImplementation = await ctx.task(analysisImplementationTask, {
    abstractDomain,
    transferFunctions,
    fixpointComputation,
    outputDir
  });

  artifacts.push(...analysisImplementation.artifacts);

  // ============================================================================
  // PHASE 8: FRAMEWORK DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating framework documentation');
  const frameworkDocumentation = await ctx.task(frameworkDocumentationTask, {
    programDescription,
    concreteSemantics,
    abstractDomain,
    galoisConnection,
    transferFunctions,
    soundnessProof,
    fixpointComputation,
    analysisImplementation,
    outputDir
  });

  artifacts.push(...frameworkDocumentation.artifacts);

  // Breakpoint: Review abstract interpretation framework
  await ctx.breakpoint({
    question: `Abstract interpretation framework complete. Domain: ${abstractDomain.domainName}. Sound: ${soundnessProof.isSound}. Review framework?`,
    title: 'Abstract Interpretation Framework Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        abstractDomain: abstractDomain.domainName,
        galoisConnectionEstablished: galoisConnection.established,
        soundnessProved: soundnessProof.isSound,
        transferFunctionCount: transferFunctions.functions?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    programDescription,
    abstractInterpretationFramework: {
      concreteSemantics: concreteSemantics.semantics,
      abstractDomain: {
        name: abstractDomain.domainName,
        elements: abstractDomain.elements,
        ordering: abstractDomain.ordering
      },
      galoisConnection: {
        established: galoisConnection.established,
        abstraction: galoisConnection.abstractionFunction,
        concretization: galoisConnection.concretizationFunction
      },
      transferFunctions: transferFunctions.functions
    },
    soundnessProof: {
      isSound: soundnessProof.isSound,
      proofTechnique: soundnessProof.proofTechnique,
      proofDocumentPath: soundnessProof.proofDocumentPath
    },
    analysisImplementation: {
      fixpointAlgorithm: fixpointComputation.algorithm,
      widening: fixpointComputation.widening,
      narrowing: fixpointComputation.narrowing,
      implementationPath: analysisImplementation.implementationPath
    },
    documentationPath: frameworkDocumentation.documentPath,
    artifacts,
    duration,
    metadata: {
      processId: 'computer-science/abstract-interpretation-analysis',
      timestamp: startTime,
      targetLanguage,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Concrete Semantics
export const concreteSemanticsTask = defineTask('concrete-semantics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define concrete semantics',
  agent: {
    name: 'semantics-formalist',
    skills: ['lambda-calculus-reducer', 'latex-proof-formatter', 'dataflow-analysis-engine'],
    prompt: {
      role: 'programming language semanticist',
      task: 'Define the concrete (collecting) semantics of the target language',
      context: args,
      instructions: [
        'Define concrete domain (sets of states)',
        'Specify concrete state representation',
        'Define concrete transition relation',
        'Express as collecting semantics',
        'Define semantic function for each construct',
        'Document concrete semantics formally',
        'Generate concrete semantics specification'
      ],
      outputFormat: 'JSON with semantics, concreteDomain, stateRepresentation, transitionRelation, collectingSemantics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['semantics', 'concreteDomain', 'artifacts'],
      properties: {
        semantics: { type: 'string' },
        concreteDomain: { type: 'string' },
        stateRepresentation: { type: 'string' },
        transitionRelation: { type: 'string' },
        collectingSemantics: { type: 'string' },
        semanticFunctions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'abstract-interpretation', 'concrete-semantics']
}));

// Task 2: Abstract Domain Design
export const abstractDomainDesignTask = defineTask('abstract-domain-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design abstract domain',
  agent: {
    name: 'semantics-formalist',
    skills: ['dataflow-analysis-engine', 'latex-proof-formatter', 'type-inference-engine'],
    prompt: {
      role: 'abstract domain designer',
      task: 'Design abstract domain for the analysis goals',
      context: args,
      instructions: [
        'Choose/design abstract domain based on analysis goals',
        'Consider standard domains: intervals, octagons, polyhedra',
        'Define domain elements',
        'Define partial order (lattice structure)',
        'Define join (least upper bound)',
        'Define meet (greatest lower bound)',
        'Identify top and bottom elements',
        'Generate abstract domain specification'
      ],
      outputFormat: 'JSON with domainName, elements, ordering, join, meet, top, bottom, latticeProperties, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['domainName', 'elements', 'ordering', 'artifacts'],
      properties: {
        domainName: { type: 'string' },
        domainType: { type: 'string', enum: ['intervals', 'signs', 'octagons', 'polyhedra', 'congruences', 'custom'] },
        elements: { type: 'string' },
        ordering: { type: 'string' },
        join: { type: 'string' },
        meet: { type: 'string' },
        top: { type: 'string' },
        bottom: { type: 'string' },
        latticeProperties: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'abstract-interpretation', 'abstract-domain']
}));

// Task 3: Galois Connection
export const galoisConnectionTask = defineTask('galois-connection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish Galois connection',
  agent: {
    name: 'semantics-formalist',
    skills: ['latex-proof-formatter', 'theorem-prover-interface', 'dataflow-analysis-engine'],
    prompt: {
      role: 'Galois connection specialist',
      task: 'Establish Galois connection between concrete and abstract domains',
      context: args,
      instructions: [
        'Define abstraction function alpha: P(Concrete) -> Abstract',
        'Define concretization function gamma: Abstract -> P(Concrete)',
        'Prove Galois connection properties',
        'alpha and gamma are monotonic',
        'alpha(gamma(a)) <= a (extensive)',
        'c <= gamma(alpha(c)) (reductive)',
        'Document Galois connection formally',
        'Generate Galois connection specification'
      ],
      outputFormat: 'JSON with established, abstractionFunction, concretizationFunction, monotonicity, galoisProperties, proof, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['established', 'abstractionFunction', 'concretizationFunction', 'artifacts'],
      properties: {
        established: { type: 'boolean' },
        abstractionFunction: { type: 'string' },
        concretizationFunction: { type: 'string' },
        monotonicity: { type: 'boolean' },
        galoisProperties: {
          type: 'object',
          properties: {
            extensive: { type: 'string' },
            reductive: { type: 'string' }
          }
        },
        proof: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'abstract-interpretation', 'galois']
}));

// Task 4: Abstract Transfer Functions
export const abstractTransferFunctionsTask = defineTask('abstract-transfer-functions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define abstract transfer functions',
  agent: {
    name: 'semantics-formalist',
    skills: ['dataflow-analysis-engine', 'lambda-calculus-reducer', 'latex-proof-formatter'],
    prompt: {
      role: 'abstract transfer function designer',
      task: 'Define abstract transfer functions for each language construct',
      context: args,
      instructions: [
        'Define abstract semantics for each statement type',
        'Ensure transfer functions are sound (over-approximate)',
        'Define abstract assignment',
        'Define abstract conditional',
        'Define abstract loop semantics',
        'Define abstract function call if applicable',
        'Document transfer functions',
        'Generate transfer function specification'
      ],
      outputFormat: 'JSON with functions, assignment, conditional, loop, functionCall, soundnessArguments, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['functions', 'artifacts'],
      properties: {
        functions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              construct: { type: 'string' },
              abstractFunction: { type: 'string' },
              soundnessArgument: { type: 'string' }
            }
          }
        },
        assignment: { type: 'string' },
        conditional: { type: 'string' },
        loop: { type: 'string' },
        functionCall: { type: 'string' },
        soundnessArguments: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'abstract-interpretation', 'transfer-functions']
}));

// Task 5: Soundness Proof
export const soundnessProofTask = defineTask('soundness-proof', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prove soundness of abstraction',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'latex-proof-formatter', 'dataflow-analysis-engine'],
    prompt: {
      role: 'soundness proof specialist',
      task: 'Prove soundness of the abstract interpretation',
      context: args,
      instructions: [
        'State soundness theorem formally',
        'Prove each abstract transfer function is sound',
        'Use Galois connection properties',
        'Prove concrete execution is always contained in abstraction',
        'Handle loop soundness via fixpoint theorem',
        'Document complete soundness proof',
        'Generate proof document'
      ],
      outputFormat: 'JSON with isSound, proofTechnique, theoremStatement, proofOutline, transferFunctionSoundness, proofDocumentPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['isSound', 'proofTechnique', 'proofDocumentPath', 'artifacts'],
      properties: {
        isSound: { type: 'boolean' },
        proofTechnique: { type: 'string' },
        theoremStatement: { type: 'string' },
        proofOutline: { type: 'string' },
        transferFunctionSoundness: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              function: { type: 'string' },
              soundnessProof: { type: 'string' }
            }
          }
        },
        fixpointTheorem: { type: 'string' },
        proofDocumentPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'abstract-interpretation', 'soundness']
}));

// Task 6: Fixpoint Computation
export const fixpointComputationTask = defineTask('fixpoint-computation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement fixpoint computation',
  agent: {
    name: 'semantics-formalist',
    skills: ['dataflow-analysis-engine', 'asymptotic-notation-calculator', 'latex-proof-formatter'],
    prompt: {
      role: 'fixpoint computation specialist',
      task: 'Design fixpoint computation algorithm with widening and narrowing',
      context: args,
      instructions: [
        'Design iterative fixpoint algorithm',
        'Apply Kleene iteration',
        'Design widening operator for convergence',
        'Design narrowing operator for precision',
        'Determine widening points (loop heads)',
        'Analyze termination guarantees',
        'Document fixpoint algorithm',
        'Generate fixpoint computation specification'
      ],
      outputFormat: 'JSON with algorithm, widening, narrowing, wideningPoints, termination, pseudocode, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithm', 'widening', 'artifacts'],
      properties: {
        algorithm: { type: 'string' },
        kleeneIteration: { type: 'string' },
        widening: {
          type: 'object',
          properties: {
            operator: { type: 'string' },
            soundness: { type: 'string' }
          }
        },
        narrowing: {
          type: 'object',
          properties: {
            operator: { type: 'string' },
            soundness: { type: 'string' }
          }
        },
        wideningPoints: { type: 'string' },
        termination: { type: 'string' },
        pseudocode: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'abstract-interpretation', 'fixpoint']
}));

// Task 7: Analysis Implementation
export const analysisImplementationTask = defineTask('analysis-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement analysis',
  agent: {
    name: 'compiler-engineer',
    skills: ['dataflow-analysis-engine', 'type-inference-engine', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'static analysis implementation specialist',
      task: 'Design implementation of the abstract interpretation analysis',
      context: args,
      instructions: [
        'Design analysis architecture',
        'Implement abstract domain operations',
        'Implement transfer functions',
        'Implement fixpoint iteration',
        'Design result reporting',
        'Consider analysis efficiency',
        'Document implementation',
        'Generate implementation specification'
      ],
      outputFormat: 'JSON with implementationPath, architecture, domainImplementation, transferImplementation, fixpointImplementation, efficiency, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implementationPath', 'architecture', 'artifacts'],
      properties: {
        implementationPath: { type: 'string' },
        architecture: { type: 'string' },
        domainImplementation: { type: 'string' },
        transferImplementation: { type: 'string' },
        fixpointImplementation: { type: 'string' },
        resultReporting: { type: 'string' },
        efficiency: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'abstract-interpretation', 'implementation']
}));

// Task 8: Framework Documentation
export const frameworkDocumentationTask = defineTask('framework-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate framework documentation',
  agent: {
    name: 'semantics-formalist',
    skills: ['latex-proof-formatter', 'dataflow-analysis-engine'],
    prompt: {
      role: 'technical documentation specialist',
      task: 'Generate comprehensive abstract interpretation framework documentation',
      context: args,
      instructions: [
        'Create executive summary',
        'Document concrete semantics',
        'Present abstract domain',
        'Detail Galois connection',
        'Document transfer functions',
        'Present soundness proof',
        'Document fixpoint algorithm',
        'Include implementation guide',
        'Format as professional framework specification'
      ],
      outputFormat: 'JSON with documentPath, executiveSummary, tableOfContents, keyResults, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'executiveSummary', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        tableOfContents: { type: 'array', items: { type: 'string' } },
        keyResults: {
          type: 'object',
          properties: {
            domainName: { type: 'string' },
            isSound: { type: 'boolean' },
            terminates: { type: 'boolean' }
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
  labels: ['agent', 'abstract-interpretation', 'documentation']
}));
