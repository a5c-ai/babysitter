/**
 * @process business-strategy/value-proposition-design
 * @description Customer-centric methodology for creating products and services that address customer jobs, pains, and gains
 * @inputs { customerSegment: object, productConcept: string, organizationContext: object, outputDir: string }
 * @outputs { success: boolean, valueMap: object, customerProfile: object, fitAssessment: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    customerSegment = {},
    productConcept = '',
    organizationContext = {},
    outputDir = 'vpd-output',
    iterateToFit = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Value Proposition Design Process');

  // ============================================================================
  // PHASE 1: CUSTOMER PROFILE - JOBS
  // ============================================================================

  ctx.log('info', 'Phase 1: Mapping customer jobs');
  const customerJobs = await ctx.task(customerJobsTask, {
    customerSegment,
    productConcept,
    outputDir
  });

  artifacts.push(...customerJobs.artifacts);

  // ============================================================================
  // PHASE 2: CUSTOMER PROFILE - PAINS
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying customer pains');
  const customerPains = await ctx.task(customerPainsTask, {
    customerSegment,
    customerJobs: customerJobs.jobs,
    outputDir
  });

  artifacts.push(...customerPains.artifacts);

  // ============================================================================
  // PHASE 3: CUSTOMER PROFILE - GAINS
  // ============================================================================

  ctx.log('info', 'Phase 3: Identifying customer gains');
  const customerGains = await ctx.task(customerGainsTask, {
    customerSegment,
    customerJobs: customerJobs.jobs,
    outputDir
  });

  artifacts.push(...customerGains.artifacts);

  // ============================================================================
  // PHASE 4: CUSTOMER PROFILE PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Prioritizing customer profile elements');
  const profilePrioritization = await ctx.task(profilePrioritizationTask, {
    jobs: customerJobs.jobs,
    pains: customerPains.pains,
    gains: customerGains.gains,
    outputDir
  });

  artifacts.push(...profilePrioritization.artifacts);

  // Breakpoint: Review customer profile
  await ctx.breakpoint({
    question: `Customer profile complete. ${customerJobs.jobs.length} jobs, ${customerPains.pains.length} pains, ${customerGains.gains.length} gains identified. Review before value map design?`,
    title: 'Customer Profile Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        jobs: customerJobs.jobs.length,
        pains: customerPains.pains.length,
        gains: customerGains.gains.length,
        topJobs: profilePrioritization.topJobs,
        topPains: profilePrioritization.topPains,
        topGains: profilePrioritization.topGains
      }
    }
  });

  // ============================================================================
  // PHASE 5: VALUE MAP - PRODUCTS AND SERVICES
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing products and services');
  const productsServices = await ctx.task(productsServicesTask, {
    productConcept,
    prioritizedJobs: profilePrioritization.topJobs,
    organizationContext,
    outputDir
  });

  artifacts.push(...productsServices.artifacts);

  // ============================================================================
  // PHASE 6: VALUE MAP - PAIN RELIEVERS
  // ============================================================================

  ctx.log('info', 'Phase 6: Designing pain relievers');
  const painRelievers = await ctx.task(painRelieversTask, {
    productsServices: productsServices.offerings,
    prioritizedPains: profilePrioritization.topPains,
    outputDir
  });

  artifacts.push(...painRelievers.artifacts);

  // ============================================================================
  // PHASE 7: VALUE MAP - GAIN CREATORS
  // ============================================================================

  ctx.log('info', 'Phase 7: Designing gain creators');
  const gainCreators = await ctx.task(gainCreatorsTask, {
    productsServices: productsServices.offerings,
    prioritizedGains: profilePrioritization.topGains,
    outputDir
  });

  artifacts.push(...gainCreators.artifacts);

  // ============================================================================
  // PHASE 8: FIT ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Assessing problem-solution fit');
  const fitAssessment = await ctx.task(fitAssessmentTask, {
    customerProfile: {
      jobs: customerJobs.jobs,
      pains: customerPains.pains,
      gains: customerGains.gains
    },
    valueMap: {
      productsServices: productsServices.offerings,
      painRelievers: painRelievers.relievers,
      gainCreators: gainCreators.creators
    },
    prioritization: profilePrioritization,
    outputDir
  });

  artifacts.push(...fitAssessment.artifacts);

  // ============================================================================
  // PHASE 9: ITERATION RECOMMENDATIONS (IF NEEDED)
  // ============================================================================

  let iterationRecommendations = null;
  if (iterateToFit && fitAssessment.fitScore < 80) {
    ctx.log('info', 'Phase 9: Generating iteration recommendations');
    iterationRecommendations = await ctx.task(iterationRecommendationsTask, {
      fitAssessment,
      customerProfile: {
        jobs: customerJobs.jobs,
        pains: customerPains.pains,
        gains: customerGains.gains
      },
      valueMap: {
        productsServices: productsServices.offerings,
        painRelievers: painRelievers.relievers,
        gainCreators: gainCreators.creators
      },
      outputDir
    });
    artifacts.push(...iterationRecommendations.artifacts);
  }

  // ============================================================================
  // PHASE 10: GENERATE COMPREHENSIVE VALUE PROPOSITION
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating value proposition statement');
  const valuePropositionStatement = await ctx.task(valuePropositionStatementTask, {
    customerSegment,
    customerProfile: {
      jobs: customerJobs.jobs,
      pains: customerPains.pains,
      gains: customerGains.gains
    },
    valueMap: {
      productsServices: productsServices.offerings,
      painRelievers: painRelievers.relievers,
      gainCreators: gainCreators.creators
    },
    fitAssessment,
    outputDir
  });

  artifacts.push(...valuePropositionStatement.artifacts);

  // ============================================================================
  // PHASE 11: GENERATE COMPREHENSIVE DOCUMENT
  // ============================================================================

  ctx.log('info', 'Phase 11: Generating comprehensive VPD document');
  const vpdDocument = await ctx.task(vpdDocumentTask, {
    customerSegment,
    customerJobs,
    customerPains,
    customerGains,
    profilePrioritization,
    productsServices,
    painRelievers,
    gainCreators,
    fitAssessment,
    iterationRecommendations,
    valuePropositionStatement,
    outputDir
  });

  artifacts.push(...vpdDocument.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    customerProfile: {
      jobs: customerJobs.jobs,
      pains: customerPains.pains,
      gains: customerGains.gains,
      prioritization: profilePrioritization
    },
    valueMap: {
      productsServices: productsServices.offerings,
      painRelievers: painRelievers.relievers,
      gainCreators: gainCreators.creators
    },
    fitAssessment: fitAssessment.assessment,
    fitScore: fitAssessment.fitScore,
    valuePropositionStatement: valuePropositionStatement.statement,
    iterationRecommendations: iterationRecommendations ? iterationRecommendations.recommendations : null,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/value-proposition-design',
      timestamp: startTime,
      customerSegment: customerSegment.name || 'unnamed'
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Customer Jobs
export const customerJobsTask = defineTask('customer-jobs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map customer jobs',
  agent: {
    name: 'customer-researcher',
    prompt: {
      role: 'customer research and jobs-to-be-done expert',
      task: 'Identify and map all customer jobs for the target segment',
      context: args,
      instructions: [
        'Identify customer jobs across categories:',
        '  - Functional jobs (tasks to complete)',
        '  - Social jobs (how they want to be perceived)',
        '  - Emotional jobs (how they want to feel)',
        '  - Supporting jobs (buyer, co-creator, transferrer)',
        'For each job document:',
        '  - Job statement (verb + object + context)',
        '  - Job importance to customer',
        '  - Current satisfaction level',
        '  - Job context and triggers',
        'Identify job chain and dependencies',
        'Map jobs to customer journey',
        'Save jobs analysis to output directory'
      ],
      outputFormat: 'JSON with jobs (array of objects with statement, type, importance, satisfaction, context), jobChain (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['jobs', 'artifacts'],
      properties: {
        jobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              type: { type: 'string', enum: ['functional', 'social', 'emotional', 'supporting'] },
              importance: { type: 'string', enum: ['critical', 'important', 'nice-to-have'] },
              satisfaction: { type: 'string', enum: ['well-served', 'underserved', 'unserved'] },
              context: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        jobChain: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'vpd', 'customer-jobs']
}));

// Task 2: Customer Pains
export const customerPainsTask = defineTask('customer-pains', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify customer pains',
  agent: {
    name: 'pain-analyst',
    prompt: {
      role: 'customer pain and frustration analyst',
      task: 'Identify and analyze customer pains related to their jobs',
      context: args,
      instructions: [
        'Identify pains across categories:',
        '  - Undesired outcomes (functional, social, emotional)',
        '  - Obstacles (things preventing job completion)',
        '  - Risks (potential negative outcomes)',
        'For each pain document:',
        '  - Pain description',
        '  - Severity (extreme, moderate, mild)',
        '  - Related job',
        '  - Frequency of occurrence',
        '  - Current workarounds',
        'Identify pain points in customer journey',
        'Rank pains by severity and frequency',
        'Save pains analysis to output directory'
      ],
      outputFormat: 'JSON with pains (array of objects with description, type, severity, relatedJob, frequency, workaround), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['pains', 'artifacts'],
      properties: {
        pains: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              type: { type: 'string', enum: ['undesired-outcome', 'obstacle', 'risk'] },
              severity: { type: 'string', enum: ['extreme', 'severe', 'moderate', 'mild'] },
              relatedJob: { type: 'string' },
              frequency: { type: 'string' },
              workaround: { type: 'string' }
            }
          }
        },
        painPoints: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'vpd', 'customer-pains']
}));

// Task 3: Customer Gains
export const customerGainsTask = defineTask('customer-gains', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify customer gains',
  agent: {
    name: 'gain-analyst',
    prompt: {
      role: 'customer benefit and gain analyst',
      task: 'Identify and analyze customer gains related to their jobs',
      context: args,
      instructions: [
        'Identify gains across categories:',
        '  - Required gains (minimum expectations)',
        '  - Expected gains (standard expectations)',
        '  - Desired gains (beyond expectations)',
        '  - Unexpected gains (delighters)',
        'For each gain document:',
        '  - Gain description',
        '  - Relevance (essential, nice-to-have, unexpected)',
        '  - Related job',
        '  - Current fulfillment level',
        'Identify functional, social, and emotional gains',
        'Rank gains by relevance to customer',
        'Save gains analysis to output directory'
      ],
      outputFormat: 'JSON with gains (array of objects with description, type, relevance, relatedJob, fulfillment), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['gains', 'artifacts'],
      properties: {
        gains: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              type: { type: 'string', enum: ['required', 'expected', 'desired', 'unexpected'] },
              relevance: { type: 'string', enum: ['essential', 'important', 'nice-to-have'] },
              relatedJob: { type: 'string' },
              fulfillment: { type: 'string' }
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
  labels: ['agent', 'vpd', 'customer-gains']
}));

// Task 4: Profile Prioritization
export const profilePrioritizationTask = defineTask('profile-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize customer profile elements',
  agent: {
    name: 'prioritization-analyst',
    prompt: {
      role: 'strategic prioritization analyst',
      task: 'Prioritize jobs, pains, and gains for value proposition focus',
      context: args,
      instructions: [
        'Prioritize jobs by:',
        '  - Importance to customer',
        '  - Frequency',
        '  - Underserved status',
        'Prioritize pains by:',
        '  - Severity',
        '  - Frequency',
        '  - Lack of good solutions',
        'Prioritize gains by:',
        '  - Relevance to customer',
        '  - Competitive differentiation potential',
        'Select top 3-5 items in each category',
        'Create prioritization rationale',
        'Save prioritization to output directory'
      ],
      outputFormat: 'JSON with topJobs (array), topPains (array), topGains (array), prioritizationRationale (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['topJobs', 'topPains', 'topGains', 'artifacts'],
      properties: {
        topJobs: { type: 'array', items: { type: 'string' } },
        topPains: { type: 'array', items: { type: 'string' } },
        topGains: { type: 'array', items: { type: 'string' } },
        prioritizationRationale: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'vpd', 'prioritization']
}));

// Task 5: Products and Services
export const productsServicesTask = defineTask('products-services', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design products and services',
  agent: {
    name: 'product-designer',
    prompt: {
      role: 'product designer and innovation specialist',
      task: 'Design products and services that help customers complete their jobs',
      context: args,
      instructions: [
        'Design products/services that:',
        '  - Enable customers to complete functional jobs',
        '  - Help achieve social jobs',
        '  - Enable emotional jobs',
        '  - Support buyer/user journey',
        'For each offering define:',
        '  - Name and description',
        '  - Core features',
        '  - Target jobs addressed',
        '  - Differentiation from alternatives',
        'Categorize by importance to value proposition',
        'Save offerings to output directory'
      ],
      outputFormat: 'JSON with offerings (array of objects with name, description, features, targetJobs, differentiation, importance), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['offerings', 'artifacts'],
      properties: {
        offerings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              features: { type: 'array', items: { type: 'string' } },
              targetJobs: { type: 'array', items: { type: 'string' } },
              differentiation: { type: 'string' },
              importance: { type: 'string', enum: ['core', 'important', 'supporting'] }
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
  labels: ['agent', 'vpd', 'products-services']
}));

// Task 6: Pain Relievers
export const painRelieversTask = defineTask('pain-relievers', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design pain relievers',
  agent: {
    name: 'pain-reliever-designer',
    prompt: {
      role: 'solution designer focused on pain relief',
      task: 'Design specific pain relievers for prioritized customer pains',
      context: args,
      instructions: [
        'For each prioritized pain, design relievers that:',
        '  - Eliminate the pain completely',
        '  - Reduce pain severity',
        '  - Make pain less frequent',
        '  - Remove obstacles',
        '  - Reduce or eliminate risks',
        'For each reliever define:',
        '  - Description and mechanism',
        '  - Target pain addressed',
        '  - Effectiveness (eliminates, reduces, mitigates)',
        '  - Product/service that delivers it',
        'Prioritize by pain severity and addressability',
        'Save relievers to output directory'
      ],
      outputFormat: 'JSON with relievers (array of objects with description, targetPain, effectiveness, deliveredBy, priority), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['relievers', 'artifacts'],
      properties: {
        relievers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              targetPain: { type: 'string' },
              effectiveness: { type: 'string', enum: ['eliminates', 'significantly-reduces', 'reduces', 'mitigates'] },
              deliveredBy: { type: 'string' },
              priority: { type: 'string' }
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
  labels: ['agent', 'vpd', 'pain-relievers']
}));

// Task 7: Gain Creators
export const gainCreatorsTask = defineTask('gain-creators', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design gain creators',
  agent: {
    name: 'gain-creator-designer',
    prompt: {
      role: 'solution designer focused on gain creation',
      task: 'Design specific gain creators for prioritized customer gains',
      context: args,
      instructions: [
        'For each prioritized gain, design creators that:',
        '  - Create required gains',
        '  - Exceed expected gains',
        '  - Deliver desired gains',
        '  - Surprise with unexpected gains',
        'For each creator define:',
        '  - Description and mechanism',
        '  - Target gain addressed',
        '  - Impact level (delights, exceeds, meets)',
        '  - Product/service that delivers it',
        'Prioritize by gain relevance and differentiation potential',
        'Save creators to output directory'
      ],
      outputFormat: 'JSON with creators (array of objects with description, targetGain, impact, deliveredBy, priority), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['creators', 'artifacts'],
      properties: {
        creators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              targetGain: { type: 'string' },
              impact: { type: 'string', enum: ['delights', 'exceeds', 'meets', 'partially-meets'] },
              deliveredBy: { type: 'string' },
              priority: { type: 'string' }
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
  labels: ['agent', 'vpd', 'gain-creators']
}));

// Task 8: Fit Assessment
export const fitAssessmentTask = defineTask('fit-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess problem-solution fit',
  agent: {
    name: 'fit-analyst',
    prompt: {
      role: 'problem-solution fit analyst',
      task: 'Assess the fit between customer profile and value map',
      context: args,
      instructions: [
        'Assess fit across dimensions:',
        '  - Job coverage: Do products help complete priority jobs?',
        '  - Pain relief: Do relievers address priority pains?',
        '  - Gain creation: Do creators deliver priority gains?',
        'Calculate fit scores:',
        '  - Job fit score (0-100)',
        '  - Pain relief score (0-100)',
        '  - Gain creation score (0-100)',
        '  - Overall fit score (weighted average)',
        'Identify fit gaps',
        'Assess competitive differentiation of fit',
        'Save assessment to output directory'
      ],
      outputFormat: 'JSON with assessment (object), fitScore (number), fitGaps (array), competitiveDifferentiation (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'fitScore', 'artifacts'],
      properties: {
        assessment: {
          type: 'object',
          properties: {
            jobFitScore: { type: 'number' },
            painReliefScore: { type: 'number' },
            gainCreationScore: { type: 'number' }
          }
        },
        fitScore: { type: 'number', minimum: 0, maximum: 100 },
        fitGaps: { type: 'array', items: { type: 'string' } },
        competitiveDifferentiation: { type: 'string' },
        fitStrengths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'vpd', 'fit-assessment']
}));

// Task 9: Iteration Recommendations
export const iterationRecommendationsTask = defineTask('iteration-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate iteration recommendations',
  agent: {
    name: 'iteration-coach',
    prompt: {
      role: 'value proposition iteration coach',
      task: 'Recommend iterations to improve problem-solution fit',
      context: args,
      instructions: [
        'Analyze fit gaps and weaknesses',
        'Recommend improvements:',
        '  - Product/service enhancements',
        '  - New pain relievers to add',
        '  - New gain creators to add',
        '  - Elements to remove (not addressing priority)',
        'Prioritize recommendations by impact',
        'Suggest validation experiments',
        'Define iteration roadmap',
        'Save recommendations to output directory'
      ],
      outputFormat: 'JSON with recommendations (array of objects), validationExperiments (array), iterationRoadmap (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              type: { type: 'string', enum: ['enhance', 'add', 'remove', 'pivot'] },
              impact: { type: 'string' },
              effort: { type: 'string' },
              priority: { type: 'number' }
            }
          }
        },
        validationExperiments: { type: 'array' },
        iterationRoadmap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'vpd', 'iteration']
}));

// Task 10: Value Proposition Statement
export const valuePropositionStatementTask = defineTask('vp-statement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate value proposition statement',
  agent: {
    name: 'copywriter',
    prompt: {
      role: 'strategic copywriter and value proposition expert',
      task: 'Craft compelling value proposition statement',
      context: args,
      instructions: [
        'Synthesize value proposition into clear statement',
        'Create multiple statement formats:',
        '  - Elevator pitch (30 seconds)',
        '  - One-liner',
        '  - Full paragraph',
        '  - "For [target], who [need], [product] is a [category] that [benefit]. Unlike [alternatives], we [differentiation]."',
        'Ensure statement is:',
        '  - Customer-focused',
        '  - Benefit-driven',
        '  - Differentiated',
        '  - Credible',
        'Save statements to output directory'
      ],
      outputFormat: 'JSON with statement (object with elevator, oneLiner, paragraph, template), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['statement', 'artifacts'],
      properties: {
        statement: {
          type: 'object',
          properties: {
            elevatorPitch: { type: 'string' },
            oneLiner: { type: 'string' },
            paragraph: { type: 'string' },
            template: { type: 'string' }
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
  labels: ['agent', 'vpd', 'statement']
}));

// Task 11: VPD Document
export const vpdDocumentTask = defineTask('vpd-document', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive VPD document',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'value proposition consultant and technical writer',
      task: 'Generate comprehensive Value Proposition Design documentation',
      context: args,
      instructions: [
        'Create executive summary',
        'Document Customer Profile:',
        '  - Customer jobs analysis',
        '  - Customer pains analysis',
        '  - Customer gains analysis',
        '  - Prioritization rationale',
        'Document Value Map:',
        '  - Products and services',
        '  - Pain relievers',
        '  - Gain creators',
        'Present fit assessment',
        'Include value proposition statements',
        'Document iteration recommendations (if any)',
        'Add visual Value Proposition Canvas',
        'Format as professional design document',
        'Save document to output directory'
      ],
      outputFormat: 'JSON with documentPath (string), executiveSummary (string), canvasVisual (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        canvasVisual: { type: 'string' },
        keyInsights: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'vpd', 'documentation']
}));
