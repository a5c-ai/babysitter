/**
 * @process business-strategy/business-model-canvas
 * @description Structured approach to designing, documenting, and iterating on business models using the nine building blocks framework
 * @inputs { businessConcept: string, organizationContext: object, targetSegments: array, outputDir: string }
 * @outputs { success: boolean, businessModelCanvas: object, valueProposition: object, revenueModel: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    businessConcept = '',
    organizationContext = {},
    targetSegments = [],
    outputDir = 'bmc-output',
    iterationMode = false
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Business Model Canvas Development Process');

  // ============================================================================
  // PHASE 1: CUSTOMER SEGMENTS
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining customer segments');
  const customerSegments = await ctx.task(customerSegmentsTask, {
    businessConcept,
    targetSegments,
    organizationContext,
    outputDir
  });

  artifacts.push(...customerSegments.artifacts);

  // ============================================================================
  // PHASE 2: VALUE PROPOSITIONS
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing value propositions');
  const valuePropositions = await ctx.task(valuePropositionsTask, {
    businessConcept,
    customerSegments: customerSegments.segments,
    outputDir
  });

  artifacts.push(...valuePropositions.artifacts);

  // ============================================================================
  // PHASE 3: CHANNELS
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing channels');
  const channels = await ctx.task(channelsTask, {
    customerSegments: customerSegments.segments,
    valuePropositions: valuePropositions.propositions,
    outputDir
  });

  artifacts.push(...channels.artifacts);

  // ============================================================================
  // PHASE 4: CUSTOMER RELATIONSHIPS
  // ============================================================================

  ctx.log('info', 'Phase 4: Defining customer relationships');
  const customerRelationships = await ctx.task(customerRelationshipsTask, {
    customerSegments: customerSegments.segments,
    valuePropositions: valuePropositions.propositions,
    outputDir
  });

  artifacts.push(...customerRelationships.artifacts);

  // ============================================================================
  // PHASE 5: REVENUE STREAMS
  // ============================================================================

  ctx.log('info', 'Phase 5: Identifying revenue streams');
  const revenueStreams = await ctx.task(revenueStreamsTask, {
    customerSegments: customerSegments.segments,
    valuePropositions: valuePropositions.propositions,
    outputDir
  });

  artifacts.push(...revenueStreams.artifacts);

  // Breakpoint: Review customer-facing elements
  await ctx.breakpoint({
    question: `Customer-facing canvas elements complete. ${customerSegments.segments.length} segments, ${valuePropositions.propositions.length} value propositions identified. Review before infrastructure elements?`,
    title: 'Business Model Canvas - Customer Side Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        segments: customerSegments.segments.length,
        valuePropositions: valuePropositions.propositions.length,
        channels: channels.channels.length,
        revenueStreams: revenueStreams.streams.length
      }
    }
  });

  // ============================================================================
  // PHASE 6: KEY RESOURCES
  // ============================================================================

  ctx.log('info', 'Phase 6: Identifying key resources');
  const keyResources = await ctx.task(keyResourcesTask, {
    valuePropositions: valuePropositions.propositions,
    channels: channels.channels,
    customerRelationships: customerRelationships.relationships,
    outputDir
  });

  artifacts.push(...keyResources.artifacts);

  // ============================================================================
  // PHASE 7: KEY ACTIVITIES
  // ============================================================================

  ctx.log('info', 'Phase 7: Defining key activities');
  const keyActivities = await ctx.task(keyActivitiesTask, {
    valuePropositions: valuePropositions.propositions,
    channels: channels.channels,
    keyResources: keyResources.resources,
    outputDir
  });

  artifacts.push(...keyActivities.artifacts);

  // ============================================================================
  // PHASE 8: KEY PARTNERSHIPS
  // ============================================================================

  ctx.log('info', 'Phase 8: Identifying key partnerships');
  const keyPartnerships = await ctx.task(keyPartnershipsTask, {
    keyResources: keyResources.resources,
    keyActivities: keyActivities.activities,
    outputDir
  });

  artifacts.push(...keyPartnerships.artifacts);

  // ============================================================================
  // PHASE 9: COST STRUCTURE
  // ============================================================================

  ctx.log('info', 'Phase 9: Analyzing cost structure');
  const costStructure = await ctx.task(costStructureTask, {
    keyResources: keyResources.resources,
    keyActivities: keyActivities.activities,
    keyPartnerships: keyPartnerships.partnerships,
    outputDir
  });

  artifacts.push(...costStructure.artifacts);

  // ============================================================================
  // PHASE 10: CANVAS INTEGRATION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Integrating and validating canvas');
  const canvasValidation = await ctx.task(canvasValidationTask, {
    customerSegments: customerSegments.segments,
    valuePropositions: valuePropositions.propositions,
    channels: channels.channels,
    customerRelationships: customerRelationships.relationships,
    revenueStreams: revenueStreams.streams,
    keyResources: keyResources.resources,
    keyActivities: keyActivities.activities,
    keyPartnerships: keyPartnerships.partnerships,
    costStructure: costStructure.costs,
    outputDir
  });

  artifacts.push(...canvasValidation.artifacts);

  // ============================================================================
  // PHASE 11: GENERATE COMPREHENSIVE CANVAS DOCUMENT
  // ============================================================================

  ctx.log('info', 'Phase 11: Generating comprehensive canvas document');
  const canvasDocument = await ctx.task(canvasDocumentTask, {
    businessConcept,
    customerSegments,
    valuePropositions,
    channels,
    customerRelationships,
    revenueStreams,
    keyResources,
    keyActivities,
    keyPartnerships,
    costStructure,
    canvasValidation,
    outputDir
  });

  artifacts.push(...canvasDocument.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    businessModelCanvas: {
      customerSegments: customerSegments.segments,
      valuePropositions: valuePropositions.propositions,
      channels: channels.channels,
      customerRelationships: customerRelationships.relationships,
      revenueStreams: revenueStreams.streams,
      keyResources: keyResources.resources,
      keyActivities: keyActivities.activities,
      keyPartnerships: keyPartnerships.partnerships,
      costStructure: costStructure.costs
    },
    valueProposition: valuePropositions.summary,
    revenueModel: revenueStreams.revenueModel,
    canvasValidation: canvasValidation.validation,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/business-model-canvas',
      timestamp: startTime,
      businessConcept
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Customer Segments
export const customerSegmentsTask = defineTask('customer-segments', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define customer segments',
  agent: {
    name: 'customer-strategist',
    prompt: {
      role: 'customer strategy expert',
      task: 'Define and prioritize customer segments for the business model',
      context: args,
      instructions: [
        'Identify distinct customer segments:',
        '  - Mass market vs niche market',
        '  - Segmented vs diversified',
        '  - Multi-sided platforms',
        'For each segment define:',
        '  - Demographics and characteristics',
        '  - Needs and pain points',
        '  - Current alternatives',
        '  - Willingness to pay',
        '  - Segment size and growth',
        'Prioritize segments by attractiveness',
        'Identify primary and secondary segments',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with segments (array of objects), prioritization (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['segments', 'artifacts'],
      properties: {
        segments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              characteristics: { type: 'array', items: { type: 'string' } },
              needs: { type: 'array', items: { type: 'string' } },
              painPoints: { type: 'array', items: { type: 'string' } },
              size: { type: 'string' },
              priority: { type: 'string', enum: ['primary', 'secondary', 'tertiary'] }
            }
          }
        },
        prioritization: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bmc', 'customer-segments']
}));

// Task 2: Value Propositions
export const valuePropositionsTask = defineTask('value-propositions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop value propositions',
  agent: {
    name: 'value-designer',
    prompt: {
      role: 'value proposition designer',
      task: 'Develop compelling value propositions for each customer segment',
      context: args,
      instructions: [
        'For each customer segment, design value proposition:',
        '  - Products and services offered',
        '  - Pain relievers (how we solve problems)',
        '  - Gain creators (how we create benefits)',
        'Types of value to consider:',
        '  - Newness and innovation',
        '  - Performance improvement',
        '  - Customization',
        '  - "Getting the job done"',
        '  - Design and usability',
        '  - Brand and status',
        '  - Price and cost reduction',
        '  - Risk reduction',
        '  - Accessibility and convenience',
        'Ensure fit between segment needs and value',
        'Save propositions to output directory'
      ],
      outputFormat: 'JSON with propositions (array of objects), summary (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['propositions', 'artifacts'],
      properties: {
        propositions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              products: { type: 'array', items: { type: 'string' } },
              painRelievers: { type: 'array', items: { type: 'string' } },
              gainCreators: { type: 'array', items: { type: 'string' } },
              valueType: { type: 'string' },
              uniqueness: { type: 'string' }
            }
          }
        },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bmc', 'value-propositions']
}));

// Task 3: Channels
export const channelsTask = defineTask('channels', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design channels',
  agent: {
    name: 'channel-strategist',
    prompt: {
      role: 'channel and distribution strategist',
      task: 'Design channels to reach and serve customer segments',
      context: args,
      instructions: [
        'Define channels across customer journey phases:',
        '  - Awareness: How do customers learn about us?',
        '  - Evaluation: How do customers evaluate our value?',
        '  - Purchase: How do customers buy?',
        '  - Delivery: How do we deliver value?',
        '  - After-sales: How do we provide support?',
        'Consider channel types:',
        '  - Direct vs indirect',
        '  - Owned vs partner',
        '  - Physical vs digital',
        'Optimize for cost and customer experience',
        'Save channel design to output directory'
      ],
      outputFormat: 'JSON with channels (array of objects), channelMix (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['channels', 'artifacts'],
      properties: {
        channels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              type: { type: 'string' },
              phase: { type: 'array', items: { type: 'string' } },
              segments: { type: 'array', items: { type: 'string' } },
              ownership: { type: 'string' }
            }
          }
        },
        channelMix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bmc', 'channels']
}));

// Task 4: Customer Relationships
export const customerRelationshipsTask = defineTask('customer-relationships', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define customer relationships',
  agent: {
    name: 'relationship-designer',
    prompt: {
      role: 'customer relationship designer',
      task: 'Define the type of relationships to establish with customers',
      context: args,
      instructions: [
        'Define relationship types per segment:',
        '  - Personal assistance',
        '  - Dedicated personal assistance',
        '  - Self-service',
        '  - Automated services',
        '  - Communities',
        '  - Co-creation',
        'Consider relationship motivations:',
        '  - Customer acquisition',
        '  - Customer retention',
        '  - Upselling and growth',
        'Balance cost vs customer expectations',
        'Save relationships to output directory'
      ],
      outputFormat: 'JSON with relationships (array of objects), retentionStrategy (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['relationships', 'artifacts'],
      properties: {
        relationships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              type: { type: 'string' },
              motivation: { type: 'array', items: { type: 'string' } },
              touchpoints: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        retentionStrategy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bmc', 'customer-relationships']
}));

// Task 5: Revenue Streams
export const revenueStreamsTask = defineTask('revenue-streams', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify revenue streams',
  agent: {
    name: 'revenue-strategist',
    prompt: {
      role: 'revenue model strategist',
      task: 'Identify and design revenue streams for the business model',
      context: args,
      instructions: [
        'Identify revenue stream types:',
        '  - Asset sale',
        '  - Usage fee',
        '  - Subscription fee',
        '  - Lending/Leasing/Renting',
        '  - Licensing',
        '  - Brokerage fees',
        '  - Advertising',
        'For each stream define:',
        '  - Pricing mechanism (fixed, dynamic, auction, negotiated)',
        '  - Revenue potential',
        '  - Margin expectations',
        'Analyze revenue mix and diversification',
        'Save revenue model to output directory'
      ],
      outputFormat: 'JSON with streams (array of objects), revenueModel (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['streams', 'artifacts'],
      properties: {
        streams: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              segment: { type: 'string' },
              pricingMechanism: { type: 'string' },
              revenuePotential: { type: 'string' },
              contribution: { type: 'number' }
            }
          }
        },
        revenueModel: {
          type: 'object',
          properties: {
            primaryStream: { type: 'string' },
            diversification: { type: 'string' },
            recurringRevenue: { type: 'number' }
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
  labels: ['agent', 'bmc', 'revenue-streams']
}));

// Task 6: Key Resources
export const keyResourcesTask = defineTask('key-resources', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify key resources',
  agent: {
    name: 'resource-analyst',
    prompt: {
      role: 'resource planning analyst',
      task: 'Identify key resources required to deliver the business model',
      context: args,
      instructions: [
        'Identify key resources by category:',
        '  - Physical (facilities, equipment, inventory)',
        '  - Intellectual (IP, patents, brands, data)',
        '  - Human (expertise, skills, experience)',
        '  - Financial (cash, credit, capital)',
        'For each resource assess:',
        '  - Criticality to value proposition',
        '  - Ownership vs lease/outsource',
        '  - Acquisition difficulty',
        '  - Competitive advantage potential',
        'Prioritize resources by strategic importance',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with resources (array of objects), resourcePriorities (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['resources', 'artifacts'],
      properties: {
        resources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string', enum: ['physical', 'intellectual', 'human', 'financial'] },
              criticality: { type: 'string', enum: ['critical', 'important', 'supporting'] },
              ownership: { type: 'string' },
              competitiveAdvantage: { type: 'boolean' }
            }
          }
        },
        resourcePriorities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bmc', 'key-resources']
}));

// Task 7: Key Activities
export const keyActivitiesTask = defineTask('key-activities', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define key activities',
  agent: {
    name: 'operations-analyst',
    prompt: {
      role: 'operations and activity analyst',
      task: 'Define key activities required to operate the business model',
      context: args,
      instructions: [
        'Identify key activities by category:',
        '  - Production (designing, making, delivering)',
        '  - Problem solving (consulting, knowledge work)',
        '  - Platform/Network (maintaining, promoting platform)',
        'For each activity define:',
        '  - Description and scope',
        '  - Link to value proposition',
        '  - Required resources',
        '  - In-house vs outsource decision',
        'Identify core vs supporting activities',
        'Save activities to output directory'
      ],
      outputFormat: 'JSON with activities (array of objects), coreActivities (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['activities', 'artifacts'],
      properties: {
        activities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              description: { type: 'string' },
              valuePropositionLink: { type: 'string' },
              resources: { type: 'array', items: { type: 'string' } },
              inHouse: { type: 'boolean' }
            }
          }
        },
        coreActivities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bmc', 'key-activities']
}));

// Task 8: Key Partnerships
export const keyPartnershipsTask = defineTask('key-partnerships', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify key partnerships',
  agent: {
    name: 'partnership-strategist',
    prompt: {
      role: 'partnership and alliance strategist',
      task: 'Identify key partnerships and supplier relationships',
      context: args,
      instructions: [
        'Identify partnership types:',
        '  - Strategic alliances (non-competitors)',
        '  - Coopetition (competitors)',
        '  - Joint ventures',
        '  - Buyer-supplier relationships',
        'Partnership motivations:',
        '  - Optimization and scale',
        '  - Risk and uncertainty reduction',
        '  - Resource and activity acquisition',
        'For each partnership define:',
        '  - Partner type and role',
        '  - Value exchanged',
        '  - Dependency level',
        'Save partnerships to output directory'
      ],
      outputFormat: 'JSON with partnerships (array of objects), partnerEcosystem (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['partnerships', 'artifacts'],
      properties: {
        partnerships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              partner: { type: 'string' },
              type: { type: 'string' },
              motivation: { type: 'string' },
              valueExchange: { type: 'string' },
              dependency: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        partnerEcosystem: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bmc', 'key-partnerships']
}));

// Task 9: Cost Structure
export const costStructureTask = defineTask('cost-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze cost structure',
  agent: {
    name: 'financial-analyst',
    prompt: {
      role: 'financial and cost analyst',
      task: 'Analyze the cost structure of the business model',
      context: args,
      instructions: [
        'Identify cost structure type:',
        '  - Cost-driven (minimize costs)',
        '  - Value-driven (premium value)',
        'Categorize costs:',
        '  - Fixed costs',
        '  - Variable costs',
        '  - Economies of scale potential',
        '  - Economies of scope potential',
        'Map costs to:',
        '  - Key resources',
        '  - Key activities',
        '  - Key partnerships',
        'Identify largest cost drivers',
        'Analyze unit economics potential',
        'Save cost analysis to output directory'
      ],
      outputFormat: 'JSON with costs (array of objects), costDrivers (array), unitEconomics (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['costs', 'artifacts'],
      properties: {
        costs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              category: { type: 'string', enum: ['fixed', 'variable'] },
              linkedTo: { type: 'string' },
              magnitude: { type: 'string' },
              scalability: { type: 'string' }
            }
          }
        },
        costDrivers: { type: 'array', items: { type: 'string' } },
        costStructureType: { type: 'string' },
        unitEconomics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bmc', 'cost-structure']
}));

// Task 10: Canvas Validation
export const canvasValidationTask = defineTask('canvas-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate business model canvas',
  agent: {
    name: 'business-model-validator',
    prompt: {
      role: 'business model validation expert',
      task: 'Validate coherence and viability of the business model canvas',
      context: args,
      instructions: [
        'Validate canvas coherence:',
        '  - Value proposition fits customer segments',
        '  - Channels reach target segments effectively',
        '  - Revenue streams align with value delivered',
        '  - Cost structure supports revenue model',
        '  - Resources enable key activities',
        'Assess business model viability:',
        '  - Desirability (do customers want it?)',
        '  - Feasibility (can we build it?)',
        '  - Viability (can we make money?)',
        'Identify risks and assumptions',
        'Recommend validation experiments',
        'Save validation to output directory'
      ],
      outputFormat: 'JSON with validation (object), risks (array), assumptions (array), experiments (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['validation', 'artifacts'],
      properties: {
        validation: {
          type: 'object',
          properties: {
            coherenceScore: { type: 'number' },
            desirabilityScore: { type: 'number' },
            feasibilityScore: { type: 'number' },
            viabilityScore: { type: 'number' },
            overallScore: { type: 'number' }
          }
        },
        risks: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        experiments: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bmc', 'validation']
}));

// Task 11: Canvas Document Generation
export const canvasDocumentTask = defineTask('canvas-document', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate business model canvas document',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'business model consultant and technical writer',
      task: 'Generate comprehensive business model canvas documentation',
      context: args,
      instructions: [
        'Create executive summary',
        'Generate visual canvas representation',
        'Document each building block in detail:',
        '  - Customer Segments',
        '  - Value Propositions',
        '  - Channels',
        '  - Customer Relationships',
        '  - Revenue Streams',
        '  - Key Resources',
        '  - Key Activities',
        '  - Key Partnerships',
        '  - Cost Structure',
        'Include validation assessment',
        'Document risks and assumptions',
        'Add recommended next steps',
        'Format as professional business document',
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
  labels: ['agent', 'bmc', 'documentation']
}));
