/**
 * @process humanities/digital-archive-development
 * @description Create and curate digital collections following metadata standards (Dublin Core, TEI), IIIF protocols, and long-term preservation practices
 * @inputs { collectionScope: object, materialTypes: array, metadataStandard: string, preservationRequirements: object }
 * @outputs { success: boolean, archiveStructure: object, metadataSchema: object, preservationPlan: object, artifacts: array }
 * @recommendedSkills SK-HUM-004 (tei-text-encoding), SK-HUM-014 (metadata-standards-implementation), SK-HUM-007 (archival-finding-aid-interpretation)
 * @recommendedAgents AG-HUM-005 (digital-humanities-technologist), AG-HUM-010 (cultural-heritage-specialist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    collectionScope,
    materialTypes = ['text', 'image', 'audio'],
    metadataStandard = 'Dublin Core',
    preservationRequirements = {},
    accessPolicy = {},
    outputDir = 'digital-archive-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Collection Assessment and Planning
  ctx.log('info', 'Assessing collection and planning archive');
  const collectionAssessment = await ctx.task(collectionAssessmentTask, {
    collectionScope,
    materialTypes,
    outputDir
  });

  if (!collectionAssessment.success) {
    return {
      success: false,
      error: 'Collection assessment failed',
      details: collectionAssessment,
      metadata: { processId: 'humanities/digital-archive-development', timestamp: startTime }
    };
  }

  artifacts.push(...collectionAssessment.artifacts);

  // Task 2: Metadata Schema Development
  ctx.log('info', 'Developing metadata schema');
  const metadataSchema = await ctx.task(metadataSchemaTask, {
    collectionScope,
    materialTypes,
    metadataStandard,
    outputDir
  });

  artifacts.push(...metadataSchema.artifacts);

  // Task 3: Digitization Standards
  ctx.log('info', 'Establishing digitization standards');
  const digitizationStandards = await ctx.task(digitizationStandardsTask, {
    materialTypes,
    preservationRequirements,
    outputDir
  });

  artifacts.push(...digitizationStandards.artifacts);

  // Task 4: IIIF Implementation Planning
  ctx.log('info', 'Planning IIIF implementation');
  const iiifPlanning = await ctx.task(iiifPlanningTask, {
    materialTypes,
    collectionScope,
    outputDir
  });

  artifacts.push(...iiifPlanning.artifacts);

  // Task 5: Preservation Strategy
  ctx.log('info', 'Developing preservation strategy');
  const preservationStrategy = await ctx.task(preservationStrategyTask, {
    materialTypes,
    preservationRequirements,
    metadataSchema,
    outputDir
  });

  artifacts.push(...preservationStrategy.artifacts);

  // Task 6: Access and Discovery Framework
  ctx.log('info', 'Developing access and discovery framework');
  const accessFramework = await ctx.task(accessFrameworkTask, {
    collectionScope,
    metadataSchema,
    accessPolicy,
    outputDir
  });

  artifacts.push(...accessFramework.artifacts);

  // Task 7: Generate Archive Development Plan
  ctx.log('info', 'Generating archive development plan');
  const developmentPlan = await ctx.task(archiveDevelopmentPlanTask, {
    collectionAssessment,
    metadataSchema,
    digitizationStandards,
    iiifPlanning,
    preservationStrategy,
    accessFramework,
    outputDir
  });

  artifacts.push(...developmentPlan.artifacts);

  // Breakpoint: Review archive development plan
  await ctx.breakpoint({
    question: `Digital archive plan complete for ${collectionScope.name || 'collection'}. Metadata standard: ${metadataStandard}. Review plan?`,
    title: 'Digital Archive Development Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        collectionName: collectionScope.name,
        metadataStandard,
        materialTypes,
        estimatedItems: collectionAssessment.estimate?.items || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    archiveStructure: {
      collection: collectionScope.name,
      organization: collectionAssessment.structure,
      materialTypes
    },
    metadataSchema: {
      standard: metadataStandard,
      schema: metadataSchema.schema,
      crosswalks: metadataSchema.crosswalks
    },
    preservationPlan: {
      strategy: preservationStrategy.strategy,
      formats: preservationStrategy.formats,
      redundancy: preservationStrategy.redundancy
    },
    accessFramework: accessFramework.framework,
    artifacts,
    duration,
    metadata: {
      processId: 'humanities/digital-archive-development',
      timestamp: startTime,
      collectionName: collectionScope.name,
      outputDir
    }
  };
}

// Task 1: Collection Assessment and Planning
export const collectionAssessmentTask = defineTask('collection-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess collection and plan archive',
  agent: {
    name: 'collection-assessor',
    prompt: {
      role: 'digital collection planning specialist',
      task: 'Assess collection and develop archive structure',
      context: args,
      instructions: [
        'Survey collection scope and contents',
        'Estimate collection size and complexity',
        'Identify material types and formats',
        'Assess condition and digitization needs',
        'Identify intellectual property considerations',
        'Design collection organization structure',
        'Identify related collections',
        'Create preliminary work plan'
      ],
      outputFormat: 'JSON with success, estimate, structure, considerations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'estimate', 'structure', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        estimate: {
          type: 'object',
          properties: {
            items: { type: 'number' },
            complexity: { type: 'string' },
            timeframe: { type: 'string' }
          }
        },
        structure: {
          type: 'object',
          properties: {
            hierarchy: { type: 'array', items: { type: 'object' } },
            organization: { type: 'string' }
          }
        },
        considerations: {
          type: 'object',
          properties: {
            intellectualProperty: { type: 'array', items: { type: 'string' } },
            condition: { type: 'object' }
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
  labels: ['agent', 'assessment', 'collection', 'planning']
}));

// Task 2: Metadata Schema Development
export const metadataSchemaTask = defineTask('metadata-schema', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop metadata schema',
  agent: {
    name: 'metadata-specialist',
    prompt: {
      role: 'metadata schema specialist',
      task: 'Develop comprehensive metadata schema for collection',
      context: args,
      instructions: [
        'Select primary metadata standard',
        'Define required and optional fields',
        'Create controlled vocabularies',
        'Develop local extensions if needed',
        'Create metadata crosswalks',
        'Define data entry guidelines',
        'Create metadata templates',
        'Establish quality control procedures'
      ],
      outputFormat: 'JSON with schema, vocabularies, crosswalks, guidelines, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['schema', 'artifacts'],
      properties: {
        schema: {
          type: 'object',
          properties: {
            standard: { type: 'string' },
            fields: { type: 'array', items: { type: 'object' } },
            extensions: { type: 'array', items: { type: 'object' } }
          }
        },
        vocabularies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              terms: { type: 'array', items: { type: 'string' } },
              source: { type: 'string' }
            }
          }
        },
        crosswalks: { type: 'array', items: { type: 'object' } },
        guidelines: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'metadata', 'schema', 'dublin-core']
}));

// Task 3: Digitization Standards
export const digitizationStandardsTask = defineTask('digitization-standards', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish digitization standards',
  agent: {
    name: 'digitization-specialist',
    prompt: {
      role: 'digitization standards specialist',
      task: 'Establish digitization standards by material type',
      context: args,
      instructions: [
        'Define image capture specifications',
        'Establish audio digitization standards',
        'Define text digitization approach (OCR, TEI)',
        'Establish file format standards',
        'Define quality control procedures',
        'Create file naming conventions',
        'Establish color management protocols',
        'Define derivative creation standards'
      ],
      outputFormat: 'JSON with standards, specifications, quality, naming, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['standards', 'artifacts'],
      properties: {
        standards: {
          type: 'object',
          properties: {
            image: { type: 'object' },
            audio: { type: 'object' },
            text: { type: 'object' },
            video: { type: 'object' }
          }
        },
        specifications: {
          type: 'object',
          properties: {
            resolution: { type: 'object' },
            colorDepth: { type: 'object' },
            formats: { type: 'object' }
          }
        },
        quality: { type: 'object' },
        naming: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'digitization', 'standards', 'imaging']
}));

// Task 4: IIIF Implementation Planning
export const iiifPlanningTask = defineTask('iiif-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan IIIF implementation',
  agent: {
    name: 'iiif-specialist',
    prompt: {
      role: 'IIIF implementation specialist',
      task: 'Plan IIIF implementation for digital collection',
      context: args,
      instructions: [
        'Assess IIIF API requirements',
        'Plan Image API implementation',
        'Design Presentation API manifests',
        'Plan Content Search API if needed',
        'Select IIIF server software',
        'Design manifest structure',
        'Plan viewer integration',
        'Document IIIF workflows'
      ],
      outputFormat: 'JSON with apis, manifests, infrastructure, viewers, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['apis', 'manifests', 'artifacts'],
      properties: {
        apis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              api: { type: 'string' },
              version: { type: 'string' },
              implementation: { type: 'string' }
            }
          }
        },
        manifests: {
          type: 'object',
          properties: {
            structure: { type: 'object' },
            templates: { type: 'array', items: { type: 'string' } }
          }
        },
        infrastructure: {
          type: 'object',
          properties: {
            server: { type: 'string' },
            storage: { type: 'string' }
          }
        },
        viewers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'iiif', 'image-api', 'interoperability']
}));

// Task 5: Preservation Strategy
export const preservationStrategyTask = defineTask('preservation-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop preservation strategy',
  agent: {
    name: 'preservation-specialist',
    prompt: {
      role: 'digital preservation specialist',
      task: 'Develop long-term digital preservation strategy',
      context: args,
      instructions: [
        'Define preservation file formats',
        'Establish redundancy requirements',
        'Plan fixity checking procedures',
        'Develop format migration strategy',
        'Select preservation repository',
        'Define preservation metadata',
        'Establish disaster recovery plan',
        'Document preservation policies'
      ],
      outputFormat: 'JSON with strategy, formats, redundancy, repository, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'formats', 'artifacts'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            policies: { type: 'array', items: { type: 'string' } },
            timeline: { type: 'object' }
          }
        },
        formats: {
          type: 'object',
          properties: {
            preservation: { type: 'array', items: { type: 'string' } },
            access: { type: 'array', items: { type: 'string' } }
          }
        },
        redundancy: {
          type: 'object',
          properties: {
            copies: { type: 'number' },
            locations: { type: 'array', items: { type: 'string' } },
            fixity: { type: 'object' }
          }
        },
        repository: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'preservation', 'digital-preservation', 'archival']
}));

// Task 6: Access and Discovery Framework
export const accessFrameworkTask = defineTask('access-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop access and discovery framework',
  agent: {
    name: 'access-specialist',
    prompt: {
      role: 'digital access specialist',
      task: 'Develop framework for access and discovery',
      context: args,
      instructions: [
        'Design public interface',
        'Plan search and browse functionality',
        'Develop access control policies',
        'Plan harvesting and aggregation',
        'Design API access if needed',
        'Plan accessibility compliance',
        'Develop user documentation',
        'Plan usage analytics'
      ],
      outputFormat: 'JSON with framework, interface, policies, discovery, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            features: { type: 'array', items: { type: 'string' } },
            integration: { type: 'object' }
          }
        },
        interface: {
          type: 'object',
          properties: {
            search: { type: 'object' },
            browse: { type: 'object' },
            display: { type: 'object' }
          }
        },
        policies: {
          type: 'object',
          properties: {
            access: { type: 'array', items: { type: 'object' } },
            restrictions: { type: 'array', items: { type: 'object' } }
          }
        },
        discovery: {
          type: 'object',
          properties: {
            harvesting: { type: 'object' },
            aggregators: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'access', 'discovery', 'interface']
}));

// Task 7: Archive Development Plan Generation
export const archiveDevelopmentPlanTask = defineTask('archive-development-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate archive development plan',
  agent: {
    name: 'plan-writer',
    prompt: {
      role: 'digital archive planning specialist',
      task: 'Generate comprehensive archive development plan',
      context: args,
      instructions: [
        'Summarize collection scope and assessment',
        'Present metadata schema',
        'Document digitization standards',
        'Present IIIF implementation plan',
        'Document preservation strategy',
        'Present access framework',
        'Create implementation timeline',
        'Document resource requirements'
      ],
      outputFormat: 'JSON with planPath, sections, timeline, resources, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['planPath', 'artifacts'],
      properties: {
        planPath: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' }
            }
          }
        },
        timeline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              duration: { type: 'string' },
              deliverables: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        resources: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'planning', 'digital-archive', 'documentation']
}));
