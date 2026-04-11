/**
 * @process domains/science/scientific-discovery/cross-domain-innovation-protocol
 * @description Cross-Domain Innovation Protocol: Abstract to shared latent space -> Scale-invariant structures -> Transfer
 * @inputs {
 *   sourceDomain: string,
 *   targetDomain: string,
 *   innovationGoal: string,
 *   domain: string
 * }
 * @outputs {
 *   success: boolean,
 *   innovations: array,
 *   transferredConcepts: array,
 *   insights: array
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    sourceDomain,
    targetDomain,
    innovationGoal = '',
    domain = 'general science'
  } = inputs;

  const startTime = ctx.now();
  const innovations = [];

  // STAGE 1: ANALYZE SOURCE DOMAIN - Deep analysis of source domain
  ctx.log('info', 'Stage 1: Analyzing source domain');
  const sourceAnalysis = await ctx.task(analyzeSourceDomainTask, {
    sourceDomain,
    innovationGoal,
    domain
  });

  // STAGE 2: ANALYZE TARGET DOMAIN - Deep analysis of target domain
  ctx.log('info', 'Stage 2: Analyzing target domain');
  const targetAnalysis = await ctx.task(analyzeTargetDomainTask, {
    targetDomain,
    innovationGoal,
    domain
  });

  // STAGE 3: ABSTRACT TO SHARED LATENT SPACE - Find common abstractions
  ctx.log('info', 'Stage 3: Abstracting to shared latent space');
  const latentSpaceConstruction = await ctx.task(constructSharedLatentSpaceTask, {
    sourceAnalysis,
    targetAnalysis,
    innovationGoal,
    domain
  });

  await ctx.breakpoint({
    question: 'Latent space constructed. Review before scale-invariant analysis?',
    title: 'Cross-Domain Innovation - Stage 3 Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/source-analysis.json', format: 'json' },
        { path: 'artifacts/target-analysis.json', format: 'json' },
        { path: 'artifacts/latent-space.json', format: 'json' }
      ]
    }
  });

  // STAGE 4: FIND SCALE-INVARIANT STRUCTURES - Identify structures that transfer
  ctx.log('info', 'Stage 4: Finding scale-invariant structures');
  const scaleInvariantStructures = await ctx.task(findScaleInvariantStructuresTask, {
    latentSpaceConstruction,
    sourceAnalysis,
    targetAnalysis,
    domain
  });

  // STAGE 5: IDENTIFY TRANSFER CANDIDATES - Select concepts for transfer
  ctx.log('info', 'Stage 5: Identifying transfer candidates');
  const transferCandidates = await ctx.task(identifyTransferCandidatesTask, {
    scaleInvariantStructures,
    latentSpaceConstruction,
    innovationGoal,
    domain
  });

  // STAGE 6: TRANSFER TO TARGET DOMAIN - Execute the transfer
  ctx.log('info', 'Stage 6: Transferring to target domain');
  const transferResults = await ctx.task(executeTransferTask, {
    transferCandidates,
    targetAnalysis,
    latentSpaceConstruction,
    domain
  });

  // STAGE 7: ADAPT AND INNOVATE - Adapt transfers into innovations
  ctx.log('info', 'Stage 7: Adapting and creating innovations');
  const adaptationResults = await ctx.task(adaptAndInnovateTask, {
    transferResults,
    targetAnalysis,
    innovationGoal,
    domain
  });

  innovations.push(...adaptationResults.innovations);

  // STAGE 8: VALIDATE INNOVATIONS - Validate in target domain
  ctx.log('info', 'Stage 8: Validating innovations');
  const validationResults = await ctx.task(validateInnovationsTask, {
    innovations,
    targetAnalysis,
    innovationGoal,
    domain
  });

  // STAGE 9: SYNTHESIZE - Create comprehensive innovation report
  ctx.log('info', 'Stage 9: Synthesizing cross-domain innovation');
  const synthesis = await ctx.task(synthesizeCrossDomainInnovationTask, {
    sourceDomain,
    targetDomain,
    innovationGoal,
    sourceAnalysis,
    targetAnalysis,
    latentSpaceConstruction,
    scaleInvariantStructures,
    transferResults,
    adaptationResults,
    validationResults,
    domain
  });

  return {
    success: validationResults.validInnovations.length > 0,
    processId: 'domains/science/scientific-discovery/cross-domain-innovation-protocol',
    sourceDomain,
    targetDomain,
    innovationGoal,
    sourceAnalysis,
    targetAnalysis,
    latentSpace: latentSpaceConstruction,
    scaleInvariantStructures,
    transferredConcepts: transferResults.transfers,
    innovations: validationResults.validInnovations,
    validation: validationResults,
    insights: synthesis.insights,
    synthesis,
    metadata: {
      structuresIdentified: scaleInvariantStructures.structures?.length || 0,
      conceptsTransferred: transferResults.transfers?.length || 0,
      innovationsGenerated: innovations.length,
      validInnovations: validationResults.validInnovations?.length || 0,
      duration: ctx.now() - startTime,
      timestamp: startTime
    }
  };
}

export const analyzeSourceDomainTask = defineTask('analyze-source-domain', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Source Domain',
  agent: {
    name: 'source-domain-analyst',
    prompt: {
      role: 'domain expert',
      task: 'Deeply analyze the source domain for transferable concepts',
      context: args,
      instructions: [
        'Identify key concepts and principles',
        'Map the ontology of the domain',
        'Identify successful patterns and techniques',
        'Document mathematical structures',
        'Identify what makes the domain work',
        'Find generalizable mechanisms',
        'Document domain-specific innovations'
      ],
      outputFormat: 'JSON with concepts, patterns, structures, mechanisms'
    },
    outputSchema: {
      type: 'object',
      required: ['concepts', 'patterns', 'structures'],
      properties: {
        concepts: { type: 'array', items: { type: 'object' } },
        ontology: { type: 'object' },
        patterns: { type: 'array', items: { type: 'object' } },
        mathematicalStructures: { type: 'array', items: { type: 'object' } },
        mechanisms: { type: 'array', items: { type: 'object' } },
        innovations: { type: 'array', items: { type: 'object' } },
        successFactors: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cross-domain-innovation', 'source-analysis']
}));

export const analyzeTargetDomainTask = defineTask('analyze-target-domain', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Target Domain',
  agent: {
    name: 'target-domain-analyst',
    prompt: {
      role: 'domain expert',
      task: 'Analyze the target domain to identify opportunities',
      context: args,
      instructions: [
        'Identify current state of the domain',
        'Map existing concepts and approaches',
        'Identify gaps and limitations',
        'Find unsolved problems',
        'Identify what the domain needs',
        'Document existing structures',
        'Identify innovation opportunities'
      ],
      outputFormat: 'JSON with current state, gaps, opportunities, structures'
    },
    outputSchema: {
      type: 'object',
      required: ['currentState', 'gaps', 'opportunities'],
      properties: {
        currentState: { type: 'object' },
        concepts: { type: 'array', items: { type: 'object' } },
        approaches: { type: 'array', items: { type: 'object' } },
        gaps: { type: 'array', items: { type: 'object' } },
        limitations: { type: 'array', items: { type: 'string' } },
        unsolvedProblems: { type: 'array', items: { type: 'string' } },
        structures: { type: 'array', items: { type: 'object' } },
        opportunities: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cross-domain-innovation', 'target-analysis']
}));

export const constructSharedLatentSpaceTask = defineTask('construct-shared-latent-space', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct Shared Latent Space',
  agent: {
    name: 'latent-space-constructor',
    prompt: {
      role: 'abstract mathematician',
      task: 'Construct a shared latent space that spans both domains',
      context: args,
      instructions: [
        'Identify common abstract dimensions',
        'Find structural correspondences',
        'Create unified representation framework',
        'Define embedding for source domain',
        'Define embedding for target domain',
        'Identify what is preserved in embedding',
        'Document the latent space structure'
      ],
      outputFormat: 'JSON with latent space, embeddings, correspondences'
    },
    outputSchema: {
      type: 'object',
      required: ['latentSpace', 'sourceEmbedding', 'targetEmbedding'],
      properties: {
        latentSpace: { type: 'object' },
        dimensions: { type: 'array', items: { type: 'object' } },
        sourceEmbedding: { type: 'object' },
        targetEmbedding: { type: 'object' },
        correspondences: { type: 'array', items: { type: 'object' } },
        preservedStructure: { type: 'array', items: { type: 'string' } },
        lostStructure: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cross-domain-innovation', 'latent-space']
}));

export const findScaleInvariantStructuresTask = defineTask('find-scale-invariant-structures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Find Scale-Invariant Structures',
  agent: {
    name: 'invariant-finder',
    prompt: {
      role: 'theoretical physicist',
      task: 'Find structures that are invariant across scales and domains',
      context: args,
      instructions: [
        'Identify structures present in both domains',
        'Find patterns that transcend domain specifics',
        'Look for self-similar structures',
        'Identify universal principles',
        'Find scaling relationships',
        'Identify structures that transfer well',
        'Document invariant properties'
      ],
      outputFormat: 'JSON with invariant structures, universal principles, scaling'
    },
    outputSchema: {
      type: 'object',
      required: ['structures', 'universalPrinciples'],
      properties: {
        structures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              sourceInstance: { type: 'object' },
              targetInstance: { type: 'object' },
              invariantProperties: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        universalPrinciples: { type: 'array', items: { type: 'object' } },
        selfSimilarStructures: { type: 'array', items: { type: 'object' } },
        scalingRelationships: { type: 'array', items: { type: 'object' } },
        transferableStructures: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cross-domain-innovation', 'scale-invariance']
}));

export const identifyTransferCandidatesTask = defineTask('identify-transfer-candidates', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Transfer Candidates',
  agent: {
    name: 'transfer-candidate-finder',
    prompt: {
      role: 'innovation strategist',
      task: 'Identify the best candidates for cross-domain transfer',
      context: args,
      instructions: [
        'Evaluate structures for transfer potential',
        'Match source concepts to target needs',
        'Prioritize by innovation value',
        'Consider transfer feasibility',
        'Identify complementary transfers',
        'Rank candidates by impact potential',
        'Document transfer rationale'
      ],
      outputFormat: 'JSON with transfer candidates, priorities, rationale'
    },
    outputSchema: {
      type: 'object',
      required: ['candidates'],
      properties: {
        candidates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceConcept: { type: 'object' },
              targetNeed: { type: 'string' },
              transferPotential: { type: 'number' },
              innovationValue: { type: 'number' },
              feasibility: { type: 'string' },
              priority: { type: 'number' },
              rationale: { type: 'string' }
            }
          }
        },
        complementaryTransfers: { type: 'array', items: { type: 'object' } },
        transferStrategy: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cross-domain-innovation', 'transfer-candidates']
}));

export const executeTransferTask = defineTask('execute-transfer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute Transfer',
  agent: {
    name: 'transfer-executor',
    prompt: {
      role: 'cross-domain translator',
      task: 'Execute the transfer of concepts to target domain',
      context: args,
      instructions: [
        'Translate each candidate to target domain',
        'Adapt terminology and framing',
        'Preserve essential structure',
        'Handle domain-specific constraints',
        'Document translation choices',
        'Note adaptation challenges',
        'Create transferred concepts'
      ],
      outputFormat: 'JSON with transfers, translations, adaptations'
    },
    outputSchema: {
      type: 'object',
      required: ['transfers'],
      properties: {
        transfers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceConcept: { type: 'string' },
              transferredForm: { type: 'object' },
              translationSteps: { type: 'array', items: { type: 'string' } },
              adaptations: { type: 'array', items: { type: 'string' } },
              transferQuality: { type: 'number' }
            }
          }
        },
        translationChallenges: { type: 'array', items: { type: 'object' } },
        preservedStructure: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cross-domain-innovation', 'transfer-execution']
}));

export const adaptAndInnovateTask = defineTask('adapt-and-innovate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Adapt and Create Innovations',
  agent: {
    name: 'innovation-creator',
    prompt: {
      role: 'innovation designer',
      task: 'Adapt transferred concepts into concrete innovations',
      context: args,
      instructions: [
        'Develop transferred concepts into innovations',
        'Combine with target domain knowledge',
        'Create novel applications',
        'Address target domain problems',
        'Design implementation approaches',
        'Identify unique value propositions',
        'Document innovation details'
      ],
      outputFormat: 'JSON with innovations, applications, value propositions'
    },
    outputSchema: {
      type: 'object',
      required: ['innovations'],
      properties: {
        innovations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              basedOn: { type: 'string' },
              noveltySource: { type: 'string' },
              valueProposition: { type: 'string' },
              implementation: { type: 'object' },
              potentialImpact: { type: 'string' }
            }
          }
        },
        applications: { type: 'array', items: { type: 'object' } },
        combinedConcepts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cross-domain-innovation', 'innovation-creation']
}));

export const validateInnovationsTask = defineTask('validate-innovations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Innovations',
  agent: {
    name: 'innovation-validator',
    prompt: {
      role: 'innovation evaluator',
      task: 'Validate innovations in the target domain context',
      context: args,
      instructions: [
        'Evaluate each innovation for feasibility',
        'Check consistency with target domain',
        'Assess novelty and value',
        'Identify implementation challenges',
        'Rate innovation potential',
        'Identify valid vs problematic innovations',
        'Document validation criteria'
      ],
      outputFormat: 'JSON with validation results, valid innovations, challenges'
    },
    outputSchema: {
      type: 'object',
      required: ['validationResults', 'validInnovations'],
      properties: {
        validationResults: { type: 'array', items: { type: 'object' } },
        validInnovations: { type: 'array', items: { type: 'object' } },
        problematicInnovations: { type: 'array', items: { type: 'object' } },
        implementationChallenges: { type: 'array', items: { type: 'object' } },
        validationCriteria: { type: 'array', items: { type: 'string' } },
        overallAssessment: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cross-domain-innovation', 'validation']
}));

export const synthesizeCrossDomainInnovationTask = defineTask('synthesize-cross-domain-innovation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Cross-Domain Innovation',
  agent: {
    name: 'innovation-synthesizer',
    prompt: {
      role: 'innovation strategist',
      task: 'Synthesize the cross-domain innovation process results',
      context: args,
      instructions: [
        'Summarize the innovation journey',
        'Document successful transfers',
        'Highlight key innovations',
        'Extract methodology insights',
        'Document lessons learned',
        'Provide recommendations',
        'Create comprehensive synthesis'
      ],
      outputFormat: 'JSON with synthesis, insights, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'insights'],
      properties: {
        synthesis: { type: 'string' },
        innovationJourney: { type: 'object' },
        successfulTransfers: { type: 'array', items: { type: 'string' } },
        keyInnovations: { type: 'array', items: { type: 'object' } },
        methodologyInsights: { type: 'array', items: { type: 'string' } },
        lessonsLearned: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        futureOpportunities: { type: 'array', items: { type: 'string' } },
        insights: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cross-domain-innovation', 'synthesis']
}));
