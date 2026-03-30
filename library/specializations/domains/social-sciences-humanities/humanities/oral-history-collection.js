/**
 * @process humanities/oral-history-collection
 * @description Record, transcribe, and preserve personal testimonies following oral history best practices including informed consent, interview techniques, and archival standards
 * @inputs { projectFocus: string, intervieweeProfile: object, historicalPeriod: string, archivalDestination: string }
 * @outputs { success: boolean, oralHistoryRecord: object, transcript: object, archivalPackage: object, artifacts: array }
 * @recommendedSkills SK-HUM-008 (oral-history-interview-technique), SK-HUM-006 (research-ethics-irb-navigation), SK-HUM-002 (ethnographic-coding-thematics)
 * @recommendedAgents AG-HUM-006 (oral-historian), AG-HUM-008 (research-ethics-consultant)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectFocus,
    intervieweeProfile = {},
    historicalPeriod,
    archivalDestination,
    recordingFormat = 'audio',
    outputDir = 'oral-history-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Pre-Interview Planning
  ctx.log('info', 'Planning pre-interview preparation');
  const preInterviewPlan = await ctx.task(preInterviewPlanningTask, {
    projectFocus,
    intervieweeProfile,
    historicalPeriod,
    outputDir
  });

  if (!preInterviewPlan.success) {
    return {
      success: false,
      error: 'Pre-interview planning failed',
      details: preInterviewPlan,
      metadata: { processId: 'humanities/oral-history-collection', timestamp: startTime }
    };
  }

  artifacts.push(...preInterviewPlan.artifacts);

  // Task 2: Consent and Legal Framework
  ctx.log('info', 'Establishing consent and legal framework');
  const consentFramework = await ctx.task(consentFrameworkTask, {
    intervieweeProfile,
    archivalDestination,
    recordingFormat,
    outputDir
  });

  artifacts.push(...consentFramework.artifacts);

  // Task 3: Interview Protocol Development
  ctx.log('info', 'Developing interview protocol');
  const interviewProtocol = await ctx.task(interviewProtocolTask, {
    projectFocus,
    intervieweeProfile,
    historicalPeriod,
    preInterviewPlan,
    outputDir
  });

  artifacts.push(...interviewProtocol.artifacts);

  // Task 4: Recording Standards and Setup
  ctx.log('info', 'Establishing recording standards');
  const recordingStandards = await ctx.task(recordingStandardsTask, {
    recordingFormat,
    archivalDestination,
    outputDir
  });

  artifacts.push(...recordingStandards.artifacts);

  // Task 5: Transcription Protocol
  ctx.log('info', 'Establishing transcription protocol');
  const transcriptionProtocol = await ctx.task(transcriptionProtocolTask, {
    recordingFormat,
    archivalDestination,
    intervieweeProfile,
    outputDir
  });

  artifacts.push(...transcriptionProtocol.artifacts);

  // Task 6: Archival Processing Standards
  ctx.log('info', 'Establishing archival processing standards');
  const archivalStandards = await ctx.task(archivalProcessingTask, {
    archivalDestination,
    recordingFormat,
    transcriptionProtocol,
    outputDir
  });

  artifacts.push(...archivalStandards.artifacts);

  // Task 7: Generate Oral History Protocol Manual
  ctx.log('info', 'Generating oral history protocol manual');
  const protocolManual = await ctx.task(protocolManualTask, {
    preInterviewPlan,
    consentFramework,
    interviewProtocol,
    recordingStandards,
    transcriptionProtocol,
    archivalStandards,
    outputDir
  });

  artifacts.push(...protocolManual.artifacts);

  // Breakpoint: Review oral history protocols
  await ctx.breakpoint({
    question: `Oral history protocols complete for ${projectFocus}. Archival destination: ${archivalDestination}. Review protocols?`,
    title: 'Oral History Collection Protocol Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        projectFocus,
        historicalPeriod,
        recordingFormat,
        archivalDestination
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    oralHistoryRecord: {
      projectFocus,
      intervieweeProfile,
      historicalPeriod,
      interviewProtocol: interviewProtocol.protocol
    },
    consentFramework: {
      forms: consentFramework.forms,
      legalRequirements: consentFramework.legalRequirements
    },
    recordingStandards: recordingStandards.standards,
    transcriptionProtocol: transcriptionProtocol.protocol,
    archivalPackage: {
      destination: archivalDestination,
      standards: archivalStandards.standards,
      metadata: archivalStandards.metadataSchema
    },
    artifacts,
    duration,
    metadata: {
      processId: 'humanities/oral-history-collection',
      timestamp: startTime,
      projectFocus,
      outputDir
    }
  };
}

// Task 1: Pre-Interview Planning
export const preInterviewPlanningTask = defineTask('pre-interview-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan pre-interview preparation',
  agent: {
    name: 'oral-historian',
    prompt: {
      role: 'oral history project coordinator',
      task: 'Develop comprehensive pre-interview preparation plan',
      context: args,
      instructions: [
        'Research interviewee background and experiences',
        'Identify historical context and significance',
        'Review existing oral histories on topic',
        'Prepare chronological framework',
        'Identify key events and themes to explore',
        'Prepare visual aids or memory triggers',
        'Plan pre-interview contact and rapport building',
        'Create biographical data collection form'
      ],
      outputFormat: 'JSON with success, backgroundResearch, themes, preparation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'backgroundResearch', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        backgroundResearch: {
          type: 'object',
          properties: {
            biography: { type: 'object' },
            historicalContext: { type: 'string' },
            existingOralHistories: { type: 'array', items: { type: 'string' } }
          }
        },
        themes: { type: 'array', items: { type: 'string' } },
        preparation: {
          type: 'object',
          properties: {
            memoryAids: { type: 'array', items: { type: 'string' } },
            rapportBuilding: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'oral-history', 'pre-interview', 'research']
}));

// Task 2: Consent and Legal Framework
export const consentFrameworkTask = defineTask('consent-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish consent and legal framework',
  agent: {
    name: 'legal-coordinator',
    prompt: {
      role: 'oral history legal and ethics specialist',
      task: 'Develop comprehensive consent and legal framework',
      context: args,
      instructions: [
        'Develop informed consent form per OHA guidelines',
        'Create deed of gift agreement',
        'Address copyright and intellectual property',
        'Establish restrictions and embargo options',
        'Create release forms for recordings',
        'Address privacy and defamation concerns',
        'Develop ongoing consent mechanisms',
        'Create withdrawal procedures'
      ],
      outputFormat: 'JSON with forms, legalRequirements, procedures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['forms', 'legalRequirements', 'artifacts'],
      properties: {
        forms: {
          type: 'object',
          properties: {
            informedConsent: { type: 'string' },
            deedOfGift: { type: 'string' },
            releaseForm: { type: 'string' }
          }
        },
        legalRequirements: {
          type: 'object',
          properties: {
            copyright: { type: 'string' },
            privacy: { type: 'string' },
            defamation: { type: 'string' }
          }
        },
        restrictionOptions: { type: 'array', items: { type: 'object' } },
        procedures: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'consent', 'legal', 'oral-history']
}));

// Task 3: Interview Protocol Development
export const interviewProtocolTask = defineTask('interview-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop interview protocol',
  agent: {
    name: 'interview-specialist',
    prompt: {
      role: 'oral history interview specialist',
      task: 'Develop comprehensive interview protocol for life history collection',
      context: args,
      instructions: [
        'Create life history interview outline',
        'Develop open-ended questions organized thematically',
        'Create follow-up probes for depth',
        'Design for multiple sessions if needed',
        'Establish interview pacing guidelines',
        'Create strategies for sensitive topics',
        'Develop techniques for memory recall',
        'Create post-interview protocol'
      ],
      outputFormat: 'JSON with protocol, questions, techniques, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'questions', 'artifacts'],
      properties: {
        protocol: {
          type: 'object',
          properties: {
            structure: { type: 'array', items: { type: 'object' } },
            sessionPlanning: { type: 'object' },
            pacing: { type: 'object' }
          }
        },
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              theme: { type: 'string' },
              mainQuestion: { type: 'string' },
              probes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        techniques: {
          type: 'object',
          properties: {
            memoryRecall: { type: 'array', items: { type: 'string' } },
            sensitiveTopics: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'interview', 'oral-history', 'life-history']
}));

// Task 4: Recording Standards and Setup
export const recordingStandardsTask = defineTask('recording-standards', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish recording standards',
  agent: {
    name: 'recording-technician',
    prompt: {
      role: 'oral history recording specialist',
      task: 'Establish recording standards meeting archival requirements',
      context: args,
      instructions: [
        'Define audio/video recording specifications',
        'Specify equipment requirements',
        'Establish file format standards (WAV, MP4)',
        'Create recording setup protocols',
        'Develop quality control procedures',
        'Establish backup protocols',
        'Create troubleshooting guide',
        'Define metadata capture during recording'
      ],
      outputFormat: 'JSON with standards, equipment, protocols, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['standards', 'artifacts'],
      properties: {
        standards: {
          type: 'object',
          properties: {
            audioSpecs: { type: 'object' },
            videoSpecs: { type: 'object' },
            fileFormats: { type: 'array', items: { type: 'string' } }
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
        protocols: {
          type: 'object',
          properties: {
            setup: { type: 'array', items: { type: 'string' } },
            qualityControl: { type: 'array', items: { type: 'string' } },
            backup: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'recording', 'audio-video', 'standards']
}));

// Task 5: Transcription Protocol
export const transcriptionProtocolTask = defineTask('transcription-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish transcription protocol',
  agent: {
    name: 'transcription-specialist',
    prompt: {
      role: 'oral history transcription specialist',
      task: 'Develop transcription protocols for oral history interviews',
      context: args,
      instructions: [
        'Define transcription style (verbatim, edited)',
        'Establish conventions for speech patterns',
        'Create notation system for non-verbal elements',
        'Develop speaker identification protocols',
        'Establish timestamp conventions',
        'Create verification and audit procedures',
        'Develop interviewee review process',
        'Create final transcript formatting standards'
      ],
      outputFormat: 'JSON with protocol, conventions, verification, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'artifacts'],
      properties: {
        protocol: {
          type: 'object',
          properties: {
            style: { type: 'string' },
            conventions: { type: 'object' },
            formatting: { type: 'object' }
          }
        },
        conventions: {
          type: 'object',
          properties: {
            speechPatterns: { type: 'object' },
            nonVerbal: { type: 'object' },
            timestamps: { type: 'object' }
          }
        },
        verification: {
          type: 'object',
          properties: {
            auditProcess: { type: 'string' },
            intervieweeReview: { type: 'string' }
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
  labels: ['agent', 'transcription', 'oral-history', 'documentation']
}));

// Task 6: Archival Processing Standards
export const archivalProcessingTask = defineTask('archival-processing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish archival processing standards',
  agent: {
    name: 'archivist',
    prompt: {
      role: 'oral history archivist',
      task: 'Develop archival processing standards for oral histories',
      context: args,
      instructions: [
        'Define archival metadata schema',
        'Establish file naming conventions',
        'Create collection organization structure',
        'Develop preservation file format standards',
        'Create access copy specifications',
        'Establish finding aid standards',
        'Define access restrictions implementation',
        'Create long-term preservation plan'
      ],
      outputFormat: 'JSON with standards, metadataSchema, preservation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['standards', 'metadataSchema', 'artifacts'],
      properties: {
        standards: {
          type: 'object',
          properties: {
            fileNaming: { type: 'object' },
            organization: { type: 'object' },
            preservation: { type: 'object' }
          }
        },
        metadataSchema: {
          type: 'object',
          properties: {
            required: { type: 'array', items: { type: 'string' } },
            optional: { type: 'array', items: { type: 'string' } },
            controlledVocabularies: { type: 'object' }
          }
        },
        preservation: {
          type: 'object',
          properties: {
            formats: { type: 'object' },
            redundancy: { type: 'object' },
            migration: { type: 'string' }
          }
        },
        findingAid: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'archival', 'preservation', 'oral-history']
}));

// Task 7: Protocol Manual Generation
export const protocolManualTask = defineTask('protocol-manual', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate oral history protocol manual',
  agent: {
    name: 'manual-writer',
    prompt: {
      role: 'oral history documentation specialist',
      task: 'Generate comprehensive oral history protocol manual',
      context: args,
      instructions: [
        'Compile all protocols into unified manual',
        'Create quick reference guides',
        'Develop checklists for each phase',
        'Include forms and templates',
        'Create troubleshooting sections',
        'Include best practices guidance',
        'Format per OHA standards',
        'Create training materials if needed'
      ],
      outputFormat: 'JSON with manualPath, sections, checklists, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['manualPath', 'artifacts'],
      properties: {
        manualPath: { type: 'string' },
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
        checklists: {
          type: 'object',
          properties: {
            preInterview: { type: 'array', items: { type: 'string' } },
            interview: { type: 'array', items: { type: 'string' } },
            postInterview: { type: 'array', items: { type: 'string' } }
          }
        },
        templates: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'manual', 'oral-history']
}));
