/**
 * @process humanities/archival-research-methodology
 * @description Navigate archival systems, identify relevant collections, transcribe and digitize primary sources, and organize materials with proper scholarly apparatus
 * @inputs { researchQuestion: string, archiveTargets: array, timePeriod: string, documentTypes: array }
 * @outputs { success: boolean, archivalFindings: object, transcriptions: array, bibliography: array, artifacts: array }
 * @recommendedSkills SK-HUM-007 (archival-finding-aid-interpretation), SK-HUM-001 (primary-source-evaluation), SK-HUM-014 (metadata-standards-implementation)
 * @recommendedAgents AG-HUM-001 (archival-research-specialist), AG-HUM-007 (historical-narrator)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    researchQuestion,
    archiveTargets = [],
    timePeriod,
    documentTypes = ['manuscripts', 'correspondence', 'official records'],
    outputDir = 'archival-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Archive Identification and Access Planning
  ctx.log('info', 'Identifying archives and planning access');
  const archiveIdentification = await ctx.task(archiveIdentificationTask, {
    researchQuestion,
    archiveTargets,
    timePeriod,
    documentTypes,
    outputDir
  });

  if (!archiveIdentification.success) {
    return {
      success: false,
      error: 'Archive identification failed',
      details: archiveIdentification,
      metadata: { processId: 'humanities/archival-research-methodology', timestamp: startTime }
    };
  }

  artifacts.push(...archiveIdentification.artifacts);

  // Task 2: Finding Aid Analysis
  ctx.log('info', 'Analyzing finding aids and collection guides');
  const findingAidAnalysis = await ctx.task(findingAidAnalysisTask, {
    archives: archiveIdentification.archives,
    researchQuestion,
    documentTypes,
    outputDir
  });

  artifacts.push(...findingAidAnalysis.artifacts);

  // Task 3: Source Identification Strategy
  ctx.log('info', 'Developing source identification strategy');
  const sourceStrategy = await ctx.task(sourceIdentificationTask, {
    findingAidAnalysis,
    researchQuestion,
    timePeriod,
    outputDir
  });

  artifacts.push(...sourceStrategy.artifacts);

  // Task 4: Transcription Protocols
  ctx.log('info', 'Establishing transcription protocols');
  const transcriptionProtocols = await ctx.task(transcriptionProtocolTask, {
    documentTypes,
    timePeriod,
    outputDir
  });

  artifacts.push(...transcriptionProtocols.artifacts);

  // Task 5: Digitization Standards
  ctx.log('info', 'Establishing digitization standards');
  const digitizationStandards = await ctx.task(digitizationStandardsTask, {
    documentTypes,
    outputDir
  });

  artifacts.push(...digitizationStandards.artifacts);

  // Task 6: Scholarly Apparatus Development
  ctx.log('info', 'Developing scholarly apparatus');
  const scholarlyApparatus = await ctx.task(scholarlyApparatusTask, {
    researchQuestion,
    sourceStrategy,
    outputDir
  });

  artifacts.push(...scholarlyApparatus.artifacts);

  // Task 7: Generate Archival Research Guide
  ctx.log('info', 'Generating archival research guide');
  const researchGuide = await ctx.task(archivalGuideTask, {
    archiveIdentification,
    findingAidAnalysis,
    sourceStrategy,
    transcriptionProtocols,
    digitizationStandards,
    scholarlyApparatus,
    outputDir
  });

  artifacts.push(...researchGuide.artifacts);

  // Breakpoint: Review archival methodology
  await ctx.breakpoint({
    question: `Archival research methodology complete for: ${researchQuestion}. Archives identified: ${archiveIdentification.archives?.length || 0}. Review methodology?`,
    title: 'Archival Research Methodology Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        researchQuestion,
        timePeriod,
        archivesIdentified: archiveIdentification.archives?.length || 0,
        collectionsFound: findingAidAnalysis.collections?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    archivalFindings: {
      archives: archiveIdentification.archives,
      collections: findingAidAnalysis.collections,
      sourcePriorities: sourceStrategy.priorities
    },
    methodology: {
      transcriptionProtocols: transcriptionProtocols.protocols,
      digitizationStandards: digitizationStandards.standards,
      scholarlyApparatus: scholarlyApparatus.apparatus
    },
    researchPlan: {
      visitSchedule: archiveIdentification.visitSchedule,
      accessRequirements: archiveIdentification.accessRequirements
    },
    artifacts,
    duration,
    metadata: {
      processId: 'humanities/archival-research-methodology',
      timestamp: startTime,
      researchQuestion,
      outputDir
    }
  };
}

// Task 1: Archive Identification and Access Planning
export const archiveIdentificationTask = defineTask('archive-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify archives and plan access',
  agent: {
    name: 'archival-researcher',
    prompt: {
      role: 'archival research specialist',
      task: 'Identify relevant archives and plan research access',
      context: args,
      instructions: [
        'Identify archives likely to hold relevant materials',
        'Research archive access policies and requirements',
        'Identify online catalogs and finding aids',
        'Determine physical visit requirements',
        'Research digitized collections availability',
        'Identify archive staff and contact information',
        'Plan research visit schedule',
        'Determine costs and logistical requirements'
      ],
      outputFormat: 'JSON with success, archives, accessRequirements, visitSchedule, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'archives', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        archives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              location: { type: 'string' },
              relevantCollections: { type: 'array', items: { type: 'string' } },
              accessPolicy: { type: 'string' }
            }
          }
        },
        accessRequirements: { type: 'object' },
        visitSchedule: { type: 'array', items: { type: 'object' } },
        onlineResources: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'archives', 'research-planning', 'access']
}));

// Task 2: Finding Aid Analysis
export const findingAidAnalysisTask = defineTask('finding-aid-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze finding aids and collection guides',
  agent: {
    name: 'finding-aid-analyst',
    prompt: {
      role: 'archival finding aid specialist',
      task: 'Analyze finding aids to identify relevant collections and materials',
      context: args,
      instructions: [
        'Review collection-level finding aids',
        'Identify box and folder level descriptions',
        'Note collection scope and content',
        'Identify related collections and cross-references',
        'Document access restrictions',
        'Identify gaps in documentation',
        'Note condition issues mentioned',
        'Create collection priority list'
      ],
      outputFormat: 'JSON with collections, priorities, restrictions, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['collections', 'artifacts'],
      properties: {
        collections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              scope: { type: 'string' },
              extent: { type: 'string' },
              relevance: { type: 'string' }
            }
          }
        },
        priorities: { type: 'array', items: { type: 'string' } },
        restrictions: { type: 'array', items: { type: 'object' } },
        gaps: { type: 'array', items: { type: 'string' } },
        crossReferences: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'finding-aids', 'collections', 'analysis']
}));

// Task 3: Source Identification Strategy
export const sourceIdentificationTask = defineTask('source-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop source identification strategy',
  agent: {
    name: 'source-strategist',
    prompt: {
      role: 'historical source specialist',
      task: 'Develop strategy for identifying and prioritizing primary sources',
      context: args,
      instructions: [
        'Define source types needed for research question',
        'Prioritize sources by potential value',
        'Develop search strategies for different document types',
        'Identify potential bias in source availability',
        'Plan for triangulation of sources',
        'Identify complementary secondary sources',
        'Develop sampling strategy if needed',
        'Create source tracking system'
      ],
      outputFormat: 'JSON with priorities, searchStrategies, biases, tracking, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['priorities', 'artifacts'],
      properties: {
        priorities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceType: { type: 'string' },
              priority: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        searchStrategies: { type: 'object' },
        potentialBiases: { type: 'array', items: { type: 'string' } },
        triangulation: { type: 'object' },
        trackingSystem: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sources', 'strategy', 'research']
}));

// Task 4: Transcription Protocols
export const transcriptionProtocolTask = defineTask('transcription-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish transcription protocols',
  agent: {
    name: 'transcription-specialist',
    prompt: {
      role: 'paleography and transcription specialist',
      task: 'Establish protocols for transcribing historical documents',
      context: args,
      instructions: [
        'Define transcription standards (diplomatic, normalized, etc.)',
        'Establish conventions for abbreviations',
        'Create protocols for illegible text',
        'Define handling of marginalia and insertions',
        'Establish dating and provenance notation',
        'Create verification and quality control procedures',
        'Develop encoding standards (TEI if applicable)',
        'Create transcription style guide'
      ],
      outputFormat: 'JSON with protocols, conventions, encoding, qualityControl, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['protocols', 'artifacts'],
      properties: {
        protocols: {
          type: 'object',
          properties: {
            standard: { type: 'string' },
            abbreviations: { type: 'object' },
            illegibleText: { type: 'string' },
            marginalia: { type: 'string' }
          }
        },
        conventions: { type: 'object' },
        encoding: {
          type: 'object',
          properties: {
            standard: { type: 'string' },
            elements: { type: 'array', items: { type: 'string' } }
          }
        },
        qualityControl: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'transcription', 'paleography', 'protocols']
}));

// Task 5: Digitization Standards
export const digitizationStandardsTask = defineTask('digitization-standards', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish digitization standards',
  agent: {
    name: 'digitization-specialist',
    prompt: {
      role: 'digital preservation specialist',
      task: 'Establish standards for digitizing archival materials',
      context: args,
      instructions: [
        'Define image capture specifications',
        'Establish resolution and color standards',
        'Create file naming conventions',
        'Define metadata requirements',
        'Establish quality control procedures',
        'Create protocols for fragile materials',
        'Define file format standards',
        'Establish storage and backup procedures'
      ],
      outputFormat: 'JSON with standards, specifications, fileNaming, qualityControl, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['standards', 'artifacts'],
      properties: {
        standards: {
          type: 'object',
          properties: {
            resolution: { type: 'string' },
            colorDepth: { type: 'string' },
            fileFormat: { type: 'string' }
          }
        },
        specifications: { type: 'object' },
        fileNaming: {
          type: 'object',
          properties: {
            convention: { type: 'string' },
            elements: { type: 'array', items: { type: 'string' } }
          }
        },
        qualityControl: { type: 'object' },
        fragileHandling: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'digitization', 'standards', 'preservation']
}));

// Task 6: Scholarly Apparatus Development
export const scholarlyApparatusTask = defineTask('scholarly-apparatus', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop scholarly apparatus',
  agent: {
    name: 'scholarly-editor',
    prompt: {
      role: 'scholarly editing specialist',
      task: 'Develop scholarly apparatus for organizing and presenting archival materials',
      context: args,
      instructions: [
        'Establish citation standards for archival materials',
        'Create annotation and footnote conventions',
        'Develop critical apparatus format',
        'Create bibliography organization system',
        'Establish cross-referencing system',
        'Develop calendar or chronology format',
        'Create index conventions',
        'Establish provenance documentation standards'
      ],
      outputFormat: 'JSON with apparatus, citationStandards, bibliography, indexing, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['apparatus', 'artifacts'],
      properties: {
        apparatus: {
          type: 'object',
          properties: {
            annotations: { type: 'object' },
            criticalApparatus: { type: 'object' },
            crossReferencing: { type: 'object' }
          }
        },
        citationStandards: {
          type: 'object',
          properties: {
            archivalFormat: { type: 'string' },
            examples: { type: 'array', items: { type: 'string' } }
          }
        },
        bibliography: { type: 'object' },
        indexing: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scholarly-apparatus', 'citation', 'editing']
}));

// Task 7: Archival Research Guide Generation
export const archivalGuideTask = defineTask('archival-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate archival research guide',
  agent: {
    name: 'guide-writer',
    prompt: {
      role: 'archival research methodologist',
      task: 'Generate comprehensive archival research methodology guide',
      context: args,
      instructions: [
        'Summarize research objectives and scope',
        'Document archive access and logistics',
        'Present finding aid analysis results',
        'Document source identification strategy',
        'Present transcription and digitization protocols',
        'Document scholarly apparatus',
        'Create research checklist',
        'Format as professional research guide'
      ],
      outputFormat: 'JSON with reportPath, sections, checklist, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        sections: {
          type: 'object',
          properties: {
            objectives: { type: 'string' },
            archives: { type: 'string' },
            methodology: { type: 'string' },
            protocols: { type: 'string' }
          }
        },
        checklist: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'guide', 'methodology', 'archival-research']
}));
