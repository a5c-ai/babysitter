/**
 * @process humanities/ethnographic-interview-methodology
 * @description Design and conduct semi-structured interviews, life history collection, and key informant interviews with proper consent protocols and cultural sensitivity
 * @inputs { researchTopic: string, interviewType: string, participantProfile: object, culturalContext: object }
 * @outputs { success: boolean, interviewData: array, transcripts: array, analysis: object, artifacts: array }
 * @recommendedSkills SK-HUM-008 (oral-history-interview-technique), SK-HUM-002 (ethnographic-coding-thematics), SK-HUM-006 (research-ethics-irb-navigation)
 * @recommendedAgents AG-HUM-002 (ethnographic-methods-advisor), AG-HUM-006 (oral-historian), AG-HUM-008 (research-ethics-consultant)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    researchTopic,
    interviewType = 'semi-structured',
    participantProfile = {},
    culturalContext = {},
    consentProtocol = {},
    outputDir = 'interview-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Interview Design and Guide Development
  ctx.log('info', 'Designing interview protocol and guide');
  const interviewDesign = await ctx.task(interviewDesignTask, {
    researchTopic,
    interviewType,
    participantProfile,
    culturalContext,
    outputDir
  });

  if (!interviewDesign.success) {
    return {
      success: false,
      error: 'Interview design failed',
      details: interviewDesign,
      metadata: { processId: 'humanities/ethnographic-interview-methodology', timestamp: startTime }
    };
  }

  artifacts.push(...interviewDesign.artifacts);

  // Task 2: Consent Protocol Implementation
  ctx.log('info', 'Implementing consent protocols');
  const consentImplementation = await ctx.task(consentProtocolTask, {
    interviewType,
    participantProfile,
    culturalContext,
    consentProtocol,
    outputDir
  });

  artifacts.push(...consentImplementation.artifacts);

  // Task 3: Cultural Sensitivity Adaptation
  ctx.log('info', 'Adapting for cultural sensitivity');
  const culturalAdaptation = await ctx.task(culturalSensitivityTask, {
    interviewDesign,
    culturalContext,
    participantProfile,
    outputDir
  });

  artifacts.push(...culturalAdaptation.artifacts);

  // Task 4: Interview Conduct Protocol
  ctx.log('info', 'Establishing interview conduct protocols');
  const conductProtocol = await ctx.task(interviewConductTask, {
    interviewDesign,
    culturalAdaptation,
    interviewType,
    outputDir
  });

  artifacts.push(...conductProtocol.artifacts);

  // Task 5: Transcription and Documentation
  ctx.log('info', 'Processing transcription protocols');
  const transcriptionProtocol = await ctx.task(transcriptionTask, {
    interviewType,
    culturalContext,
    outputDir
  });

  artifacts.push(...transcriptionProtocol.artifacts);

  // Task 6: Interview Analysis Framework
  ctx.log('info', 'Establishing analysis framework');
  const analysisFramework = await ctx.task(interviewAnalysisTask, {
    interviewType,
    researchTopic,
    interviewDesign,
    outputDir
  });

  artifacts.push(...analysisFramework.artifacts);

  // Task 7: Generate Methodology Report
  ctx.log('info', 'Generating methodology report');
  const methodologyReport = await ctx.task(methodologyReportTask, {
    interviewDesign,
    consentImplementation,
    culturalAdaptation,
    conductProtocol,
    transcriptionProtocol,
    analysisFramework,
    outputDir
  });

  artifacts.push(...methodologyReport.artifacts);

  // Breakpoint: Review interview methodology
  await ctx.breakpoint({
    question: `Interview methodology complete for ${interviewType} interviews on ${researchTopic}. Review protocol?`,
    title: 'Ethnographic Interview Methodology Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        interviewType,
        researchTopic,
        questionCount: interviewDesign.guide?.questions?.length || 0,
        culturalAdaptations: culturalAdaptation.adaptations?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    interviewDesign: {
      type: interviewType,
      guide: interviewDesign.guide,
      themes: interviewDesign.themes
    },
    consentProtocol: {
      forms: consentImplementation.forms,
      procedures: consentImplementation.procedures
    },
    culturalAdaptations: culturalAdaptation.adaptations,
    conductProtocol: conductProtocol.protocols,
    transcriptionGuidelines: transcriptionProtocol.guidelines,
    analysisFramework: analysisFramework.framework,
    artifacts,
    duration,
    metadata: {
      processId: 'humanities/ethnographic-interview-methodology',
      timestamp: startTime,
      interviewType,
      outputDir
    }
  };
}

// Task 1: Interview Design and Guide Development
export const interviewDesignTask = defineTask('interview-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design interview protocol and guide',
  agent: {
    name: 'interview-designer',
    prompt: {
      role: 'qualitative interview methodologist',
      task: 'Design comprehensive interview protocol and guide',
      context: args,
      instructions: [
        'Develop research questions aligned with topic',
        'Create interview guide with open-ended questions',
        'Design probe questions for depth',
        'Structure guide flow (opening, body, closing)',
        'Include rapport-building elements',
        'Develop follow-up question strategies',
        'Create interview checklist',
        'Design for interview type (semi-structured, life history, key informant)'
      ],
      outputFormat: 'JSON with success, guide, themes, protocols, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'guide', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        guide: {
          type: 'object',
          properties: {
            questions: { type: 'array', items: { type: 'object' } },
            probes: { type: 'array', items: { type: 'string' } },
            structure: { type: 'object' }
          }
        },
        themes: { type: 'array', items: { type: 'string' } },
        protocols: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interview-design', 'methodology', 'ethnography']
}));

// Task 2: Consent Protocol Implementation
export const consentProtocolTask = defineTask('consent-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement consent protocols',
  agent: {
    name: 'ethics-coordinator',
    prompt: {
      role: 'research ethics coordinator',
      task: 'Implement culturally appropriate consent protocols',
      context: args,
      instructions: [
        'Develop informed consent documentation',
        'Create oral consent script if appropriate',
        'Address recording consent separately',
        'Develop consent for specific uses (quotes, publication)',
        'Create ongoing consent procedures',
        'Address confidentiality and anonymity',
        'Develop withdrawal procedures',
        'Create consent verification checklist'
      ],
      outputFormat: 'JSON with forms, procedures, scripts, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['forms', 'procedures', 'artifacts'],
      properties: {
        forms: {
          type: 'object',
          properties: {
            writtenConsent: { type: 'string' },
            oralConsentScript: { type: 'string' },
            recordingConsent: { type: 'string' }
          }
        },
        procedures: {
          type: 'object',
          properties: {
            consentProcess: { type: 'array', items: { type: 'string' } },
            ongoingConsent: { type: 'string' },
            withdrawal: { type: 'string' }
          }
        },
        confidentialityMeasures: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'consent', 'ethics', 'irb']
}));

// Task 3: Cultural Sensitivity Adaptation
export const culturalSensitivityTask = defineTask('cultural-sensitivity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Adapt for cultural sensitivity',
  agent: {
    name: 'cultural-consultant',
    prompt: {
      role: 'cross-cultural research specialist',
      task: 'Adapt interview methodology for cultural context',
      context: args,
      instructions: [
        'Identify culturally sensitive topics',
        'Adapt question phrasing for cultural appropriateness',
        'Consider gender and power dynamics',
        'Address language and translation needs',
        'Identify appropriate interview settings',
        'Consider timing and scheduling norms',
        'Adapt consent processes culturally',
        'Develop strategies for taboo topics'
      ],
      outputFormat: 'JSON with adaptations, sensitiveTopics, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['adaptations', 'artifacts'],
      properties: {
        adaptations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              original: { type: 'string' },
              adapted: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        sensitiveTopics: { type: 'array', items: { type: 'string' } },
        genderConsiderations: { type: 'object' },
        languageAdaptations: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cultural-sensitivity', 'cross-cultural', 'adaptation']
}));

// Task 4: Interview Conduct Protocol
export const interviewConductTask = defineTask('interview-conduct', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish interview conduct protocols',
  agent: {
    name: 'interview-conductor',
    prompt: {
      role: 'experienced ethnographic interviewer',
      task: 'Develop protocols for conducting effective interviews',
      context: args,
      instructions: [
        'Establish rapport-building techniques',
        'Develop active listening protocols',
        'Create strategies for managing silences',
        'Develop probing techniques',
        'Address emotional responses',
        'Handle difficult or evasive responses',
        'Manage time and interview flow',
        'Create post-interview debriefing protocol'
      ],
      outputFormat: 'JSON with protocols, techniques, troubleshooting, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['protocols', 'artifacts'],
      properties: {
        protocols: {
          type: 'object',
          properties: {
            opening: { type: 'array', items: { type: 'string' } },
            rapportBuilding: { type: 'array', items: { type: 'string' } },
            activeListening: { type: 'array', items: { type: 'string' } },
            closing: { type: 'array', items: { type: 'string' } }
          }
        },
        probingTechniques: { type: 'array', items: { type: 'object' } },
        troubleshooting: { type: 'object' },
        debriefingProtocol: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interview-conduct', 'rapport', 'technique']
}));

// Task 5: Transcription and Documentation
export const transcriptionTask = defineTask('transcription', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish transcription protocols',
  agent: {
    name: 'transcription-specialist',
    prompt: {
      role: 'qualitative transcription specialist',
      task: 'Develop transcription and documentation protocols',
      context: args,
      instructions: [
        'Establish transcription conventions',
        'Define notation for non-verbal elements',
        'Create translation protocols if needed',
        'Develop quality control procedures',
        'Establish file naming and organization',
        'Create anonymization procedures',
        'Develop verification protocols',
        'Address recording quality issues'
      ],
      outputFormat: 'JSON with guidelines, conventions, quality control, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['guidelines', 'artifacts'],
      properties: {
        guidelines: {
          type: 'object',
          properties: {
            transcriptionLevel: { type: 'string' },
            conventions: { type: 'object' },
            nonVerbalNotation: { type: 'object' }
          }
        },
        translationProtocols: { type: 'object' },
        qualityControl: {
          type: 'object',
          properties: {
            verification: { type: 'string' },
            accuracy: { type: 'string' }
          }
        },
        fileManagement: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'transcription', 'documentation', 'quality']
}));

// Task 6: Interview Analysis Framework
export const interviewAnalysisTask = defineTask('interview-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish interview analysis framework',
  agent: {
    name: 'qualitative-analyst',
    prompt: {
      role: 'qualitative analysis methodologist',
      task: 'Develop framework for analyzing interview data',
      context: args,
      instructions: [
        'Select appropriate analytical approach',
        'Develop coding framework',
        'Create memo-writing protocols',
        'Establish theme development procedures',
        'Design cross-interview analysis methods',
        'Develop trustworthiness measures',
        'Create audit trail procedures',
        'Design presentation of findings framework'
      ],
      outputFormat: 'JSON with framework, codingApproach, trustworthiness, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            codingStrategy: { type: 'object' },
            themeDevelopment: { type: 'object' }
          }
        },
        codingFramework: {
          type: 'object',
          properties: {
            initialCodes: { type: 'array', items: { type: 'string' } },
            codingProcess: { type: 'string' }
          }
        },
        trustworthiness: {
          type: 'object',
          properties: {
            credibility: { type: 'array', items: { type: 'string' } },
            transferability: { type: 'array', items: { type: 'string' } },
            dependability: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'analysis', 'qualitative', 'methodology']
}));

// Task 7: Methodology Report Generation
export const methodologyReportTask = defineTask('methodology-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate methodology report',
  agent: {
    name: 'methodology-writer',
    prompt: {
      role: 'qualitative methodology specialist',
      task: 'Generate comprehensive interview methodology report',
      context: args,
      instructions: [
        'Document interview design rationale',
        'Present interview guide with justification',
        'Document consent procedures',
        'Describe cultural adaptations',
        'Present conduct protocols',
        'Document transcription standards',
        'Present analysis framework',
        'Format as methods section ready for publication'
      ],
      outputFormat: 'JSON with reportPath, sections, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        sections: {
          type: 'object',
          properties: {
            design: { type: 'string' },
            consent: { type: 'string' },
            conduct: { type: 'string' },
            analysis: { type: 'string' }
          }
        },
        methodsStatement: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'methodology', 'reporting', 'documentation']
}));
