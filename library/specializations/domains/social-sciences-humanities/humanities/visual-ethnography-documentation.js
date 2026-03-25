/**
 * @process humanities/visual-ethnography-documentation
 * @description Create photographic, video, and audio documentation of cultural practices, rituals, and daily life with appropriate community permissions and metadata standards
 * @inputs { documentationFocus: string, mediaTypes: array, communityContext: object, ethicsApproval: object }
 * @outputs { success: boolean, mediaCollection: object, metadataRecords: array, ethicsDocumentation: object, artifacts: array }
 * @recommendedSkills SK-HUM-002 (ethnographic-coding-thematics), SK-HUM-014 (metadata-standards-implementation)
 * @recommendedAgents AG-HUM-002 (ethnographic-methods-advisor), AG-HUM-010 (cultural-heritage-specialist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    documentationFocus,
    mediaTypes = ['photography', 'video', 'audio'],
    communityContext = {},
    ethicsApproval = {},
    metadataStandard = 'Dublin Core',
    outputDir = 'visual-ethnography-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Visual Documentation Planning
  ctx.log('info', 'Planning visual documentation strategy');
  const documentationPlan = await ctx.task(documentationPlanningTask, {
    documentationFocus,
    mediaTypes,
    communityContext,
    outputDir
  });

  if (!documentationPlan.success) {
    return {
      success: false,
      error: 'Documentation planning failed',
      details: documentationPlan,
      metadata: { processId: 'humanities/visual-ethnography-documentation', timestamp: startTime }
    };
  }

  artifacts.push(...documentationPlan.artifacts);

  // Task 2: Community Permission Protocols
  ctx.log('info', 'Establishing community permission protocols');
  const permissionProtocols = await ctx.task(permissionProtocolTask, {
    mediaTypes,
    communityContext,
    ethicsApproval,
    outputDir
  });

  artifacts.push(...permissionProtocols.artifacts);

  // Task 3: Technical Standards and Equipment
  ctx.log('info', 'Establishing technical standards');
  const technicalStandards = await ctx.task(technicalStandardsTask, {
    mediaTypes,
    documentationFocus,
    outputDir
  });

  artifacts.push(...technicalStandards.artifacts);

  // Task 4: Metadata Framework Development
  ctx.log('info', 'Developing metadata framework');
  const metadataFramework = await ctx.task(metadataFrameworkTask, {
    mediaTypes,
    metadataStandard,
    communityContext,
    outputDir
  });

  artifacts.push(...metadataFramework.artifacts);

  // Task 5: Documentation Execution Protocol
  ctx.log('info', 'Establishing documentation execution protocols');
  const executionProtocol = await ctx.task(documentationExecutionTask, {
    documentationPlan,
    technicalStandards,
    permissionProtocols,
    outputDir
  });

  artifacts.push(...executionProtocol.artifacts);

  // Task 6: Archival and Preservation Standards
  ctx.log('info', 'Establishing archival standards');
  const archivalStandards = await ctx.task(archivalStandardsTask, {
    mediaTypes,
    metadataFramework,
    communityContext,
    outputDir
  });

  artifacts.push(...archivalStandards.artifacts);

  // Task 7: Generate Documentation Protocol Report
  ctx.log('info', 'Generating documentation protocol report');
  const protocolReport = await ctx.task(protocolReportTask, {
    documentationPlan,
    permissionProtocols,
    technicalStandards,
    metadataFramework,
    executionProtocol,
    archivalStandards,
    outputDir
  });

  artifacts.push(...protocolReport.artifacts);

  // Breakpoint: Review visual documentation protocols
  await ctx.breakpoint({
    question: `Visual ethnography protocols complete for ${documentationFocus}. Media types: ${mediaTypes.join(', ')}. Review protocols?`,
    title: 'Visual Ethnography Documentation Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        documentationFocus,
        mediaTypes,
        metadataStandard,
        permissionTypes: permissionProtocols.types
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    documentationPlan: {
      focus: documentationFocus,
      mediaTypes,
      strategy: documentationPlan.strategy
    },
    permissionProtocols: {
      types: permissionProtocols.types,
      forms: permissionProtocols.forms,
      communityAgreements: permissionProtocols.communityAgreements
    },
    technicalStandards: technicalStandards.standards,
    metadataFramework: {
      standard: metadataStandard,
      schema: metadataFramework.schema,
      fields: metadataFramework.fields
    },
    archivalStandards: archivalStandards.standards,
    artifacts,
    duration,
    metadata: {
      processId: 'humanities/visual-ethnography-documentation',
      timestamp: startTime,
      documentationFocus,
      outputDir
    }
  };
}

// Task 1: Visual Documentation Planning
export const documentationPlanningTask = defineTask('documentation-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan visual documentation strategy',
  agent: {
    name: 'visual-ethnographer',
    prompt: {
      role: 'visual anthropologist',
      task: 'Develop comprehensive visual documentation strategy',
      context: args,
      instructions: [
        'Identify key subjects and practices for documentation',
        'Develop documentation timeline aligned with cultural calendar',
        'Plan for different media types (photo, video, audio)',
        'Identify key events and ceremonies to document',
        'Develop daily documentation routines',
        'Plan for collaborative documentation with community',
        'Create shot lists and documentation goals',
        'Develop contingency plans for access issues'
      ],
      outputFormat: 'JSON with success, strategy, timeline, subjects, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'strategy', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        strategy: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            priorities: { type: 'array', items: { type: 'string' } },
            mediaAllocation: { type: 'object' }
          }
        },
        timeline: { type: 'array', items: { type: 'object' } },
        subjects: { type: 'array', items: { type: 'string' } },
        events: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visual-ethnography', 'planning', 'documentation']
}));

// Task 2: Community Permission Protocols
export const permissionProtocolTask = defineTask('permission-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish community permission protocols',
  agent: {
    name: 'ethics-coordinator',
    prompt: {
      role: 'visual research ethics specialist',
      task: 'Develop comprehensive permission protocols for visual documentation',
      context: args,
      instructions: [
        'Develop individual release forms for photography/video',
        'Create community-level permission processes',
        'Address permissions for minors and vulnerable groups',
        'Develop protocols for sacred or sensitive practices',
        'Create ongoing consent mechanisms',
        'Develop image use agreements',
        'Address intellectual property and ownership',
        'Create protocols for withdrawal of permission'
      ],
      outputFormat: 'JSON with types, forms, communityAgreements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['types', 'forms', 'artifacts'],
      properties: {
        types: { type: 'array', items: { type: 'string' } },
        forms: {
          type: 'object',
          properties: {
            individualRelease: { type: 'string' },
            minorRelease: { type: 'string' },
            communityAgreement: { type: 'string' }
          }
        },
        communityAgreements: {
          type: 'object',
          properties: {
            ownership: { type: 'string' },
            useRights: { type: 'string' },
            restrictions: { type: 'array', items: { type: 'string' } }
          }
        },
        sensitiveContent: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'permissions', 'ethics', 'visual-documentation']
}));

// Task 3: Technical Standards and Equipment
export const technicalStandardsTask = defineTask('technical-standards', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish technical standards',
  agent: {
    name: 'media-technician',
    prompt: {
      role: 'ethnographic media specialist',
      task: 'Establish technical standards for visual documentation',
      context: args,
      instructions: [
        'Define camera and recording equipment requirements',
        'Establish image/video quality standards',
        'Define audio recording specifications',
        'Develop file format standards',
        'Create backup and storage protocols',
        'Establish field workflow procedures',
        'Define lighting and environmental considerations',
        'Create equipment maintenance protocols'
      ],
      outputFormat: 'JSON with standards, equipment, workflows, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['standards', 'artifacts'],
      properties: {
        standards: {
          type: 'object',
          properties: {
            photography: { type: 'object' },
            video: { type: 'object' },
            audio: { type: 'object' }
          }
        },
        equipment: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              specifications: { type: 'object' }
            }
          }
        },
        workflows: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-standards', 'equipment', 'media']
}));

// Task 4: Metadata Framework Development
export const metadataFrameworkTask = defineTask('metadata-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop metadata framework',
  agent: {
    name: 'metadata-specialist',
    prompt: {
      role: 'digital humanities metadata specialist',
      task: 'Develop comprehensive metadata framework for visual materials',
      context: args,
      instructions: [
        'Select appropriate metadata standard (Dublin Core, VRA Core, etc.)',
        'Define required and optional fields',
        'Create controlled vocabularies',
        'Develop culturally appropriate descriptive terms',
        'Establish naming conventions',
        'Create geographic and temporal encoding standards',
        'Develop rights and permissions metadata',
        'Create community-specific metadata fields'
      ],
      outputFormat: 'JSON with schema, fields, controlledVocabularies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['schema', 'fields', 'artifacts'],
      properties: {
        schema: {
          type: 'object',
          properties: {
            standard: { type: 'string' },
            version: { type: 'string' },
            extensions: { type: 'array', items: { type: 'string' } }
          }
        },
        fields: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              required: { type: 'boolean' },
              dataType: { type: 'string' }
            }
          }
        },
        controlledVocabularies: { type: 'object' },
        namingConventions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'metadata', 'standards', 'digital-humanities']
}));

// Task 5: Documentation Execution Protocol
export const documentationExecutionTask = defineTask('documentation-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish documentation execution protocols',
  agent: {
    name: 'field-documentarian',
    prompt: {
      role: 'ethnographic documentarian',
      task: 'Develop protocols for executing visual documentation in the field',
      context: args,
      instructions: [
        'Develop daily documentation routines',
        'Create protocols for different documentation scenarios',
        'Establish real-time metadata capture procedures',
        'Develop collaborative documentation methods',
        'Create protocols for documenting sensitive events',
        'Establish quality review procedures',
        'Develop field cataloging systems',
        'Create backup and transfer protocols'
      ],
      outputFormat: 'JSON with protocols, scenarios, routines, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['protocols', 'artifacts'],
      properties: {
        protocols: {
          type: 'object',
          properties: {
            daily: { type: 'array', items: { type: 'string' } },
            events: { type: 'array', items: { type: 'string' } },
            sensitive: { type: 'array', items: { type: 'string' } }
          }
        },
        scenarios: { type: 'array', items: { type: 'object' } },
        routines: { type: 'object' },
        qualityReview: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'field-protocols', 'visual']
}));

// Task 6: Archival and Preservation Standards
export const archivalStandardsTask = defineTask('archival-standards', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish archival and preservation standards',
  agent: {
    name: 'archivist',
    prompt: {
      role: 'digital preservation specialist',
      task: 'Develop archival and preservation standards for visual materials',
      context: args,
      instructions: [
        'Define preservation file formats',
        'Establish redundancy and backup requirements',
        'Develop long-term storage strategies',
        'Create access and distribution protocols',
        'Establish community archive agreements',
        'Develop deaccessioning policies',
        'Create disaster recovery procedures',
        'Establish migration and format conversion protocols'
      ],
      outputFormat: 'JSON with standards, storage, access, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['standards', 'artifacts'],
      properties: {
        standards: {
          type: 'object',
          properties: {
            fileFormats: { type: 'object' },
            redundancy: { type: 'object' },
            storage: { type: 'object' }
          }
        },
        storage: {
          type: 'object',
          properties: {
            primary: { type: 'string' },
            backup: { type: 'string' },
            offsite: { type: 'string' }
          }
        },
        access: {
          type: 'object',
          properties: {
            levels: { type: 'array', items: { type: 'string' } },
            restrictions: { type: 'array', items: { type: 'string' } }
          }
        },
        communityArchive: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'archival', 'preservation', 'digital']
}));

// Task 7: Protocol Report Generation
export const protocolReportTask = defineTask('protocol-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate documentation protocol report',
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'visual ethnography documentation specialist',
      task: 'Generate comprehensive visual documentation protocol report',
      context: args,
      instructions: [
        'Summarize documentation strategy and approach',
        'Document permission and ethics protocols',
        'Present technical standards',
        'Document metadata framework',
        'Present execution protocols',
        'Document archival standards',
        'Create quick reference guides',
        'Format as professional documentation manual'
      ],
      outputFormat: 'JSON with reportPath, sections, quickReference, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        sections: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            permissions: { type: 'string' },
            technical: { type: 'string' },
            metadata: { type: 'string' },
            archival: { type: 'string' }
          }
        },
        quickReference: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'reporting', 'documentation', 'protocols']
}));
