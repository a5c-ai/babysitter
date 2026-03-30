/**
 * @process domains/science/scientific-discovery/latent-space-transfer-thinking
 * @description Latent Space Transfer Thinking: Map domains into shared latent space, transfer operations there
 * @inputs {
 *   sourceDomain: string,
 *   targetDomain: string,
 *   operationsToTransfer: array,
 *   domain: string
 * }
 * @outputs {
 *   success: boolean,
 *   latentSpace: object,
 *   transferredOperations: array,
 *   insights: array
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    sourceDomain,
    targetDomain,
    operationsToTransfer = [],
    domain = 'general science'
  } = inputs;

  const startTime = ctx.now();

  // Phase 1: Analyze Source Domain
  ctx.log('info', 'Analyzing source domain structure');
  const sourceAnalysis = await ctx.task(analyzeDomainTask, {
    domainName: sourceDomain,
    domainType: 'source',
    domain
  });

  // Phase 2: Analyze Target Domain
  ctx.log('info', 'Analyzing target domain structure');
  const targetAnalysis = await ctx.task(analyzeDomainTask, {
    domainName: targetDomain,
    domainType: 'target',
    domain
  });

  // Phase 3: Construct Shared Latent Space
  ctx.log('info', 'Constructing shared latent space');
  const latentSpace = await ctx.task(constructLatentSpaceTask, {
    sourceAnalysis,
    targetAnalysis,
    domain
  });

  await ctx.breakpoint({
    question: 'Latent space constructed. Review before transfer operations?',
    title: 'Latent Space Transfer - Space Constructed',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/source-analysis.json', format: 'json' },
        { path: 'artifacts/target-analysis.json', format: 'json' },
        { path: 'artifacts/latent-space.json', format: 'json' }
      ]
    }
  });

  // Phase 4: Encode Source Operations
  ctx.log('info', 'Encoding source operations into latent space');
  const encodedOperations = await ctx.task(encodeOperationsTask, {
    operations: operationsToTransfer,
    sourceAnalysis,
    latentSpace,
    domain
  });

  // Phase 5: Transform in Latent Space
  ctx.log('info', 'Transforming operations in latent space');
  const transformedOperations = await ctx.task(transformInLatentSpaceTask, {
    encodedOperations,
    latentSpace,
    sourceAnalysis,
    targetAnalysis,
    domain
  });

  // Phase 6: Decode to Target Domain
  ctx.log('info', 'Decoding operations to target domain');
  const decodedOperations = await ctx.task(decodeOperationsTask, {
    transformedOperations,
    targetAnalysis,
    latentSpace,
    domain
  });

  // Phase 7: Validate Transferred Operations
  ctx.log('info', 'Validating transferred operations');
  const validationResults = await ctx.task(validateTransferTask, {
    originalOperations: operationsToTransfer,
    decodedOperations,
    sourceAnalysis,
    targetAnalysis,
    domain
  });

  // Phase 8: Extract Transfer Insights
  ctx.log('info', 'Extracting transfer insights');
  const synthesis = await ctx.task(synthesizeTransferInsightsTask, {
    sourceDomain,
    targetDomain,
    latentSpace,
    encodedOperations,
    transformedOperations,
    decodedOperations,
    validationResults,
    domain
  });

  return {
    success: validationResults.overallSuccess,
    processId: 'domains/science/scientific-discovery/latent-space-transfer-thinking',
    sourceDomain,
    targetDomain,
    sourceAnalysis,
    targetAnalysis,
    latentSpace,
    encodedOperations,
    transformedOperations,
    transferredOperations: decodedOperations.operations,
    validationResults,
    insights: synthesis.insights,
    synthesis,
    metadata: {
      operationsTransferred: operationsToTransfer.length,
      latentDimensions: latentSpace.dimensions?.length || 0,
      transferSuccessRate: validationResults.successRate,
      duration: ctx.now() - startTime,
      timestamp: startTime
    }
  };
}

export const analyzeDomainTask = defineTask('analyze-domain', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Domain: ${args.domainName}`,
  agent: {
    name: 'domain-analyst',
    prompt: {
      role: 'domain analyst and ontologist',
      task: `Analyze the structure of the ${args.domainType} domain`,
      context: args,
      instructions: [
        'Identify the core concepts and entities',
        'Map relationships between concepts',
        'Document operations and transformations native to domain',
        'Identify invariants and constraints',
        'Extract the underlying structure/grammar',
        'Document dimensions of variation',
        'Identify what makes this domain unique'
      ],
      outputFormat: 'JSON with concepts, relationships, operations, structure'
    },
    outputSchema: {
      type: 'object',
      required: ['concepts', 'relationships', 'operations'],
      properties: {
        concepts: { type: 'array', items: { type: 'object' } },
        relationships: { type: 'array', items: { type: 'object' } },
        operations: { type: 'array', items: { type: 'object' } },
        invariants: { type: 'array', items: { type: 'string' } },
        structure: { type: 'object' },
        dimensionsOfVariation: { type: 'array', items: { type: 'string' } },
        uniqueAspects: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'latent-space', 'domain-analysis', args.domainType]
}));

export const constructLatentSpaceTask = defineTask('construct-latent-space', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct Shared Latent Space',
  agent: {
    name: 'latent-space-architect',
    prompt: {
      role: 'abstract mathematician and ontologist',
      task: 'Construct a shared latent space that spans both domains',
      context: args,
      instructions: [
        'Identify common structural elements between domains',
        'Define abstract dimensions that capture both domains',
        'Create embedding scheme for source domain',
        'Create embedding scheme for target domain',
        'Document the correspondence mappings',
        'Identify what is preserved vs lost in embedding',
        'Define the geometry and topology of latent space'
      ],
      outputFormat: 'JSON with dimensions, embeddings, correspondences, geometry'
    },
    outputSchema: {
      type: 'object',
      required: ['dimensions', 'sourceEmbedding', 'targetEmbedding'],
      properties: {
        dimensions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              sourceInterpretation: { type: 'string' },
              targetInterpretation: { type: 'string' }
            }
          }
        },
        sourceEmbedding: { type: 'object' },
        targetEmbedding: { type: 'object' },
        correspondences: { type: 'array', items: { type: 'object' } },
        preservedStructure: { type: 'array', items: { type: 'string' } },
        lostStructure: { type: 'array', items: { type: 'string' } },
        geometry: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'latent-space', 'construction']
}));

export const encodeOperationsTask = defineTask('encode-operations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Encode Operations into Latent Space',
  agent: {
    name: 'operation-encoder',
    prompt: {
      role: 'representation specialist',
      task: 'Encode source domain operations into the latent space',
      context: args,
      instructions: [
        'Represent each operation in latent space coordinates',
        'Capture the essential transformation each operation performs',
        'Preserve operation composition structure',
        'Document encoding fidelity for each operation',
        'Identify operations that encode well vs poorly',
        'Note any information loss in encoding',
        'Create reversible encodings where possible'
      ],
      outputFormat: 'JSON with encoded operations, fidelity scores, information loss'
    },
    outputSchema: {
      type: 'object',
      required: ['encodedOperations'],
      properties: {
        encodedOperations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              originalOperation: { type: 'string' },
              latentRepresentation: { type: 'object' },
              encodingFidelity: { type: 'number' },
              informationLoss: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        compositionPreservation: { type: 'object' },
        wellEncodedOperations: { type: 'array', items: { type: 'string' } },
        poorlyEncodedOperations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'latent-space', 'encoding']
}));

export const transformInLatentSpaceTask = defineTask('transform-in-latent-space', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Transform Operations in Latent Space',
  agent: {
    name: 'latent-transformer',
    prompt: {
      role: 'abstract transformation specialist',
      task: 'Transform encoded operations for target domain compatibility',
      context: args,
      instructions: [
        'Identify necessary transformations for target domain',
        'Apply transformations in latent space',
        'Preserve operation semantics during transformation',
        'Handle incompatible structure gracefully',
        'Document transformation steps',
        'Identify novel operations emerging from transformation',
        'Assess transformation quality'
      ],
      outputFormat: 'JSON with transformed operations, transformations applied, quality'
    },
    outputSchema: {
      type: 'object',
      required: ['transformedOperations'],
      properties: {
        transformedOperations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              encodedOperation: { type: 'object' },
              transformedRepresentation: { type: 'object' },
              transformationsApplied: { type: 'array', items: { type: 'string' } },
              semanticsPreserved: { type: 'boolean' }
            }
          }
        },
        transformationLog: { type: 'array', items: { type: 'object' } },
        novelOperations: { type: 'array', items: { type: 'object' } },
        transformationQuality: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'latent-space', 'transformation']
}));

export const decodeOperationsTask = defineTask('decode-operations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Decode Operations to Target Domain',
  agent: {
    name: 'operation-decoder',
    prompt: {
      role: 'translation specialist',
      task: 'Decode transformed operations into target domain',
      context: args,
      instructions: [
        'Translate latent representations to target domain operations',
        'Find closest target domain equivalents',
        'Adapt operations to target domain conventions',
        'Document decoding choices and alternatives',
        'Identify operations with multiple valid decodings',
        'Note operations that do not decode cleanly',
        'Provide confidence scores for decodings'
      ],
      outputFormat: 'JSON with decoded operations, alternatives, confidence'
    },
    outputSchema: {
      type: 'object',
      required: ['operations'],
      properties: {
        operations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              originalSourceOperation: { type: 'string' },
              targetDomainOperation: { type: 'object' },
              confidence: { type: 'number' },
              alternatives: { type: 'array', items: { type: 'object' } },
              decodingNotes: { type: 'string' }
            }
          }
        },
        cleanDecodings: { type: 'array', items: { type: 'string' } },
        problematicDecodings: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'latent-space', 'decoding']
}));

export const validateTransferTask = defineTask('validate-transfer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Transferred Operations',
  agent: {
    name: 'transfer-validator',
    prompt: {
      role: 'validation specialist',
      task: 'Validate the transferred operations in target domain',
      context: args,
      instructions: [
        'Check if transferred operations are valid in target domain',
        'Assess semantic preservation across transfer',
        'Test operation behavior in target domain',
        'Compare to native target domain operations',
        'Rate transfer success for each operation',
        'Identify successful vs failed transfers',
        'Calculate overall transfer success rate'
      ],
      outputFormat: 'JSON with validation results, success rates, comparison'
    },
    outputSchema: {
      type: 'object',
      required: ['validationResults', 'overallSuccess', 'successRate'],
      properties: {
        validationResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              operation: { type: 'string' },
              valid: { type: 'boolean' },
              semanticsPreserved: { type: 'boolean' },
              behaviorCorrect: { type: 'boolean' },
              issues: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        overallSuccess: { type: 'boolean' },
        successRate: { type: 'number', minimum: 0, maximum: 100 },
        successfulTransfers: { type: 'array', items: { type: 'string' } },
        failedTransfers: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'latent-space', 'validation']
}));

export const synthesizeTransferInsightsTask = defineTask('synthesize-transfer-insights', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Transfer Insights',
  agent: {
    name: 'insight-synthesizer',
    prompt: {
      role: 'transfer learning theorist',
      task: 'Synthesize insights from the latent space transfer process',
      context: args,
      instructions: [
        'Document what was learned about domain relationships',
        'Identify transferable vs non-transferable structures',
        'Extract principles for successful transfer',
        'Note insights about the latent space itself',
        'Document implications for both domains',
        'Suggest improvements for future transfers',
        'Create comprehensive synthesis'
      ],
      outputFormat: 'JSON with synthesis, insights, principles, implications'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'insights'],
      properties: {
        synthesis: { type: 'string' },
        insights: { type: 'array', items: { type: 'string' } },
        domainRelationships: { type: 'array', items: { type: 'string' } },
        transferableConcepts: { type: 'array', items: { type: 'string' } },
        nonTransferableConcepts: { type: 'array', items: { type: 'string' } },
        transferPrinciples: { type: 'array', items: { type: 'string' } },
        latentSpaceInsights: { type: 'array', items: { type: 'string' } },
        futureImprovements: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'latent-space', 'synthesis']
}));
