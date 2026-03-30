/**
 * @process specializations/domains/business/entrepreneurship/business-model-canvas
 * @description Business Model Canvas Development Process - Structured process to design, document, and validate business models using the Business Model Canvas framework.
 * @inputs { companyName: string, productDescription: string, targetCustomers: array, revenueModel?: string, existingAssumptions?: array }
 * @outputs { success: boolean, canvas: object, assumptions: array, experiments: array, validationPlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/entrepreneurship/business-model-canvas', {
 *   companyName: 'SaaSCo',
 *   productDescription: 'Cloud-based project management',
 *   targetCustomers: ['SMB teams', 'Enterprise departments']
 * });
 *
 * @references
 * - Business Model Generation: https://www.strategyzer.com/books/business-model-generation
 * - Strategyzer: https://www.strategyzer.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    productDescription,
    targetCustomers = [],
    revenueModel = '',
    existingAssumptions = []
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Business Model Canvas for ${companyName}`);

  // Phase 1: Customer Segments
  const customerSegments = await ctx.task(customerSegmentsTask, {
    companyName,
    targetCustomers,
    productDescription
  });

  artifacts.push(...(customerSegments.artifacts || []));

  // Phase 2: Value Propositions
  const valuePropositions = await ctx.task(valuePropositionsTask, {
    companyName,
    productDescription,
    customerSegments
  });

  artifacts.push(...(valuePropositions.artifacts || []));

  // Phase 3: Channels
  const channels = await ctx.task(channelsTask, {
    companyName,
    customerSegments,
    valuePropositions
  });

  artifacts.push(...(channels.artifacts || []));

  // Phase 4: Customer Relationships
  const customerRelationships = await ctx.task(customerRelationshipsTask, {
    companyName,
    customerSegments
  });

  artifacts.push(...(customerRelationships.artifacts || []));

  // Phase 5: Revenue Streams
  const revenueStreams = await ctx.task(revenueStreamsTask, {
    companyName,
    revenueModel,
    customerSegments,
    valuePropositions
  });

  artifacts.push(...(revenueStreams.artifacts || []));

  // Breakpoint: Review customer-facing blocks
  await ctx.breakpoint({
    question: `Review customer-facing canvas blocks for ${companyName}. Segments, value props, channels, relationships, and revenue defined. Continue with infrastructure?`,
    title: 'Customer Blocks Review',
    context: {
      runId: ctx.runId,
      companyName,
      files: artifacts
    }
  });

  // Phase 6: Key Resources
  const keyResources = await ctx.task(keyResourcesTask, {
    companyName,
    valuePropositions,
    channels
  });

  artifacts.push(...(keyResources.artifacts || []));

  // Phase 7: Key Activities
  const keyActivities = await ctx.task(keyActivitiesTask, {
    companyName,
    valuePropositions,
    channels,
    customerRelationships
  });

  artifacts.push(...(keyActivities.artifacts || []));

  // Phase 8: Key Partnerships
  const keyPartnerships = await ctx.task(keyPartnershipsTask, {
    companyName,
    keyResources,
    keyActivities
  });

  artifacts.push(...(keyPartnerships.artifacts || []));

  // Phase 9: Cost Structure
  const costStructure = await ctx.task(costStructureTask, {
    companyName,
    keyResources,
    keyActivities,
    keyPartnerships
  });

  artifacts.push(...(costStructure.artifacts || []));

  // Phase 10: Canvas Assembly
  const canvasAssembly = await ctx.task(canvasAssemblyTask, {
    companyName,
    customerSegments,
    valuePropositions,
    channels,
    customerRelationships,
    revenueStreams,
    keyResources,
    keyActivities,
    keyPartnerships,
    costStructure
  });

  artifacts.push(...(canvasAssembly.artifacts || []));

  // Phase 11: Assumption Identification
  const assumptions = await ctx.task(assumptionIdentificationTask, {
    companyName,
    canvasAssembly,
    existingAssumptions
  });

  artifacts.push(...(assumptions.artifacts || []));

  // Phase 12: Validation Experiments
  const experiments = await ctx.task(validationExperimentsTask, {
    companyName,
    assumptions
  });

  artifacts.push(...(experiments.artifacts || []));

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Business Model Canvas complete for ${companyName}. ${assumptions.assumptions?.length || 0} assumptions identified, ${experiments.experiments?.length || 0} experiments planned. Approve?`,
    title: 'Business Model Canvas Complete',
    context: {
      runId: ctx.runId,
      companyName,
      files: artifacts
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    companyName,
    canvas: canvasAssembly.canvas,
    assumptions: assumptions.assumptions,
    experiments: experiments.experiments,
    validationPlan: experiments.validationPlan,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/entrepreneurship/business-model-canvas',
      timestamp: startTime,
      version: '1.0.0'
    }
  };
}

// Task Definitions (abbreviated for space, following same pattern)

export const customerSegmentsTask = defineTask('customer-segments', (args, taskCtx) => ({
  kind: 'agent',
  title: `Customer Segments - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Business Model Canvas Expert',
      task: 'Define customer segments for the business model',
      context: args,
      instructions: [
        '1. Identify distinct customer segments',
        '2. Define segment characteristics and needs',
        '3. Prioritize segments by potential',
        '4. Identify early adopter segments',
        '5. Define segment-specific jobs-to-be-done',
        '6. Assess segment accessibility',
        '7. Identify segment pain points and gains',
        '8. Define segment personas',
        '9. Assess segment size and growth',
        '10. Map segment relationships'
      ],
      outputFormat: 'JSON object with customer segments'
    },
    outputSchema: {
      type: 'object',
      required: ['segments', 'prioritization'],
      properties: {
        segments: { type: 'array', items: { type: 'object' } },
        prioritization: { type: 'object' },
        earlyAdopters: { type: 'array', items: { type: 'string' } },
        personas: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'business-model', 'customer-segments']
}));

export const valuePropositionsTask = defineTask('value-propositions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Value Propositions - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Value Proposition Expert',
      task: 'Define value propositions for each customer segment',
      context: args,
      instructions: [
        '1. Map value propositions to customer jobs',
        '2. Identify pain relievers',
        '3. Identify gain creators',
        '4. Prioritize value elements',
        '5. Differentiate from competitors',
        '6. Quantify value where possible',
        '7. Create value proposition statements',
        '8. Map value to willingness to pay',
        '9. Identify must-haves vs nice-to-haves',
        '10. Validate value-market fit hypothesis'
      ],
      outputFormat: 'JSON object with value propositions'
    },
    outputSchema: {
      type: 'object',
      required: ['propositions', 'valueElements'],
      properties: {
        propositions: { type: 'array', items: { type: 'object' } },
        valueElements: { type: 'object' },
        painRelievers: { type: 'array', items: { type: 'string' } },
        gainCreators: { type: 'array', items: { type: 'string' } },
        statements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'business-model', 'value-propositions']
}));

export const channelsTask = defineTask('channels', (args, taskCtx) => ({
  kind: 'agent',
  title: `Channels - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Go-to-Market Expert',
      task: 'Define channels for reaching and serving customers',
      context: args,
      instructions: [
        '1. Map customer journey phases',
        '2. Identify awareness channels',
        '3. Define evaluation channels',
        '4. Plan purchase channels',
        '5. Design delivery channels',
        '6. Plan after-sales channels',
        '7. Assess channel economics',
        '8. Prioritize channel investment',
        '9. Identify channel partners',
        '10. Plan channel integration'
      ],
      outputFormat: 'JSON object with channels'
    },
    outputSchema: {
      type: 'object',
      required: ['channels', 'customerJourney'],
      properties: {
        channels: { type: 'array', items: { type: 'object' } },
        customerJourney: { type: 'object' },
        channelEconomics: { type: 'object' },
        channelPartners: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'business-model', 'channels']
}));

export const customerRelationshipsTask = defineTask('customer-relationships', (args, taskCtx) => ({
  kind: 'agent',
  title: `Customer Relationships - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Customer Success Expert',
      task: 'Define customer relationship types and strategies',
      context: args,
      instructions: [
        '1. Define relationship type per segment',
        '2. Plan acquisition relationships',
        '3. Design retention strategies',
        '4. Plan upsell/expansion relationships',
        '5. Define support model',
        '6. Plan community building',
        '7. Design self-service capabilities',
        '8. Plan high-touch relationships',
        '9. Assess relationship costs',
        '10. Define relationship metrics'
      ],
      outputFormat: 'JSON object with customer relationships'
    },
    outputSchema: {
      type: 'object',
      required: ['relationshipTypes', 'strategies'],
      properties: {
        relationshipTypes: { type: 'array', items: { type: 'object' } },
        strategies: { type: 'object' },
        supportModel: { type: 'object' },
        communityPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'business-model', 'customer-relationships']
}));

export const revenueStreamsTask = defineTask('revenue-streams', (args, taskCtx) => ({
  kind: 'agent',
  title: `Revenue Streams - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Revenue Model Expert',
      task: 'Define revenue streams and pricing models',
      context: args,
      instructions: [
        '1. Identify all revenue stream types',
        '2. Define pricing mechanisms',
        '3. Map revenue to customer segments',
        '4. Design pricing tiers',
        '5. Plan usage-based components',
        '6. Define transaction vs recurring revenue',
        '7. Assess revenue predictability',
        '8. Plan monetization timeline',
        '9. Identify expansion revenue',
        '10. Model revenue potential'
      ],
      outputFormat: 'JSON object with revenue streams'
    },
    outputSchema: {
      type: 'object',
      required: ['streams', 'pricingModel'],
      properties: {
        streams: { type: 'array', items: { type: 'object' } },
        pricingModel: { type: 'object' },
        pricingTiers: { type: 'array', items: { type: 'object' } },
        revenueProjection: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'business-model', 'revenue-streams']
}));

export const keyResourcesTask = defineTask('key-resources', (args, taskCtx) => ({
  kind: 'agent',
  title: `Key Resources - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Business Operations Expert',
      task: 'Identify key resources required for the business model',
      context: args,
      instructions: [
        '1. Identify physical resources needed',
        '2. Define intellectual property resources',
        '3. Identify human resource requirements',
        '4. Define financial resources needed',
        '5. Identify technology resources',
        '6. Assess resource acquisition strategy',
        '7. Prioritize critical resources',
        '8. Identify resource gaps',
        '9. Plan resource scaling',
        '10. Assess make vs buy decisions'
      ],
      outputFormat: 'JSON object with key resources'
    },
    outputSchema: {
      type: 'object',
      required: ['resources', 'gaps'],
      properties: {
        resources: { type: 'array', items: { type: 'object' } },
        gaps: { type: 'array', items: { type: 'string' } },
        acquisitionStrategy: { type: 'object' },
        scalingPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'business-model', 'key-resources']
}));

export const keyActivitiesTask = defineTask('key-activities', (args, taskCtx) => ({
  kind: 'agent',
  title: `Key Activities - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Operations Strategy Expert',
      task: 'Define key activities required for the business model',
      context: args,
      instructions: [
        '1. Identify production activities',
        '2. Define problem-solving activities',
        '3. Identify platform/network activities',
        '4. Map activities to value propositions',
        '5. Prioritize activities by impact',
        '6. Identify core vs non-core activities',
        '7. Plan activity scaling',
        '8. Assess activity outsourcing',
        '9. Define activity metrics',
        '10. Identify activity dependencies'
      ],
      outputFormat: 'JSON object with key activities'
    },
    outputSchema: {
      type: 'object',
      required: ['activities', 'prioritization'],
      properties: {
        activities: { type: 'array', items: { type: 'object' } },
        prioritization: { type: 'object' },
        coreActivities: { type: 'array', items: { type: 'string' } },
        scalingPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'business-model', 'key-activities']
}));

export const keyPartnershipsTask = defineTask('key-partnerships', (args, taskCtx) => ({
  kind: 'agent',
  title: `Key Partnerships - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Partnership Strategy Expert',
      task: 'Identify key partnerships for the business model',
      context: args,
      instructions: [
        '1. Identify strategic alliance partners',
        '2. Define supplier relationships',
        '3. Identify platform/ecosystem partners',
        '4. Define partnership value exchange',
        '5. Assess partnership risks',
        '6. Plan partnership development',
        '7. Identify channel partners',
        '8. Define partnership terms',
        '9. Prioritize partnerships',
        '10. Plan partnership metrics'
      ],
      outputFormat: 'JSON object with key partnerships'
    },
    outputSchema: {
      type: 'object',
      required: ['partnerships', 'valueExchange'],
      properties: {
        partnerships: { type: 'array', items: { type: 'object' } },
        valueExchange: { type: 'object' },
        risks: { type: 'array', items: { type: 'string' } },
        developmentPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'business-model', 'key-partnerships']
}));

export const costStructureTask = defineTask('cost-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cost Structure - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Financial Planning Expert',
      task: 'Define cost structure for the business model',
      context: args,
      instructions: [
        '1. Identify fixed costs',
        '2. Identify variable costs',
        '3. Map costs to activities and resources',
        '4. Assess cost drivers',
        '5. Identify economies of scale',
        '6. Plan cost optimization',
        '7. Define cost-driven vs value-driven approach',
        '8. Project cost scaling',
        '9. Identify cost risks',
        '10. Plan cost management'
      ],
      outputFormat: 'JSON object with cost structure'
    },
    outputSchema: {
      type: 'object',
      required: ['fixedCosts', 'variableCosts', 'costDrivers'],
      properties: {
        fixedCosts: { type: 'array', items: { type: 'object' } },
        variableCosts: { type: 'array', items: { type: 'object' } },
        costDrivers: { type: 'array', items: { type: 'string' } },
        economiesOfScale: { type: 'object' },
        costProjection: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'business-model', 'cost-structure']
}));

export const canvasAssemblyTask = defineTask('canvas-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: `Canvas Assembly - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Business Model Canvas Expert',
      task: 'Assemble complete Business Model Canvas',
      context: args,
      instructions: [
        '1. Compile all nine building blocks',
        '2. Verify block relationships and consistency',
        '3. Create visual canvas representation',
        '4. Identify canvas strengths',
        '5. Identify canvas weaknesses',
        '6. Assess overall model viability',
        '7. Compare to successful patterns',
        '8. Create canvas summary',
        '9. Identify iteration opportunities',
        '10. Document canvas version'
      ],
      outputFormat: 'JSON object with assembled canvas'
    },
    outputSchema: {
      type: 'object',
      required: ['canvas', 'viabilityAssessment'],
      properties: {
        canvas: { type: 'object' },
        viabilityAssessment: { type: 'object' },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'business-model', 'canvas-assembly']
}));

export const assumptionIdentificationTask = defineTask('assumption-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assumption Identification - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Lean Startup Expert',
      task: 'Identify and prioritize business model assumptions',
      context: args,
      instructions: [
        '1. Extract assumptions from each canvas block',
        '2. Categorize assumptions by type',
        '3. Assess assumption risk level',
        '4. Prioritize by risk and importance',
        '5. Identify leap-of-faith assumptions',
        '6. Map assumptions to evidence',
        '7. Identify testable hypotheses',
        '8. Create assumption tracking',
        '9. Define validation criteria',
        '10. Plan assumption testing sequence'
      ],
      outputFormat: 'JSON object with assumptions'
    },
    outputSchema: {
      type: 'object',
      required: ['assumptions', 'prioritization'],
      properties: {
        assumptions: { type: 'array', items: { type: 'object' } },
        prioritization: { type: 'object' },
        leapOfFaith: { type: 'array', items: { type: 'string' } },
        hypotheses: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'business-model', 'assumptions']
}));

export const validationExperimentsTask = defineTask('validation-experiments', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validation Experiments - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Lean Experimentation Expert',
      task: 'Design experiments to validate business model assumptions',
      context: args,
      instructions: [
        '1. Design experiment for each priority assumption',
        '2. Define success criteria and metrics',
        '3. Estimate experiment cost and time',
        '4. Plan experiment sequence',
        '5. Identify minimum viable experiments',
        '6. Design A/B tests where applicable',
        '7. Plan customer interviews',
        '8. Design landing page tests',
        '9. Create experiment tracking',
        '10. Plan iteration based on results'
      ],
      outputFormat: 'JSON object with validation experiments'
    },
    outputSchema: {
      type: 'object',
      required: ['experiments', 'validationPlan'],
      properties: {
        experiments: { type: 'array', items: { type: 'object' } },
        validationPlan: { type: 'object' },
        successCriteria: { type: 'object' },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'business-model', 'validation-experiments']
}));
