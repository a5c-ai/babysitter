/**
 * @process social-sciences/in-depth-interview-protocol
 * @description Conduct semi-structured and in-depth interviews including guide development, rapport building, probing techniques, and ethical considerations for qualitative data collection
 * @inputs { researchQuestions: array, targetParticipants: object, interviewContext: object, outputDir: string }
 * @outputs { success: boolean, interviewGuide: object, protocolDocument: string, qualityScore: number, artifacts: array }
 * @recommendedSkills SK-SS-013 (interview-facilitation), SK-SS-002 (qualitative-analysis), SK-SS-014 (research-ethics-irb)
 * @recommendedAgents AG-SS-002 (qualitative-research-specialist), AG-SS-010 (research-ethics-coordinator)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    researchQuestions = [],
    targetParticipants = {},
    interviewContext = {},
    outputDir = 'interview-protocol-output',
    interviewType = 'semi-structured'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting In-Depth Interview Protocol development');

  // ============================================================================
  // PHASE 1: INTERVIEW DESIGN PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Planning interview design');
  const designPlanning = await ctx.task(interviewDesignPlanningTask, {
    researchQuestions,
    targetParticipants,
    interviewType,
    interviewContext,
    outputDir
  });

  artifacts.push(...designPlanning.artifacts);

  // ============================================================================
  // PHASE 2: INTERVIEW GUIDE DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing interview guide');
  const guideevelopment = await ctx.task(interviewGuideDevelopmentTask, {
    designPlanning,
    researchQuestions,
    interviewType,
    outputDir
  });

  artifacts.push(...guideevelopment.artifacts);

  // ============================================================================
  // PHASE 3: PROBING STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing probing strategies');
  const probingStrategy = await ctx.task(probingStrategyTask, {
    guideevelopment,
    interviewType,
    outputDir
  });

  artifacts.push(...probingStrategy.artifacts);

  // ============================================================================
  // PHASE 4: RAPPORT BUILDING PROTOCOL
  // ============================================================================

  ctx.log('info', 'Phase 4: Developing rapport building protocol');
  const rapportProtocol = await ctx.task(rapportBuildingTask, {
    targetParticipants,
    interviewContext,
    outputDir
  });

  artifacts.push(...rapportProtocol.artifacts);

  // ============================================================================
  // PHASE 5: ETHICAL CONSIDERATIONS
  // ============================================================================

  ctx.log('info', 'Phase 5: Addressing ethical considerations');
  const ethicsProtocol = await ctx.task(interviewEthicsTask, {
    targetParticipants,
    interviewContext,
    researchQuestions,
    outputDir
  });

  artifacts.push(...ethicsProtocol.artifacts);

  // ============================================================================
  // PHASE 6: DOCUMENTATION AND RECORDING PLAN
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing documentation plan');
  const documentationPlan = await ctx.task(documentationPlanTask, {
    interviewType,
    interviewContext,
    ethicsProtocol,
    outputDir
  });

  artifacts.push(...documentationPlan.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Scoring interview protocol quality');
  const qualityScore = await ctx.task(interviewProtocolQualityScoringTask, {
    designPlanning,
    guideevelopment,
    probingStrategy,
    rapportProtocol,
    ethicsProtocol,
    documentationPlan,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const protocolScore = qualityScore.overallScore;
  const qualityMet = protocolScore >= 80;

  // Breakpoint: Review interview protocol
  await ctx.breakpoint({
    question: `Interview protocol complete. Quality score: ${protocolScore}/100. ${qualityMet ? 'Protocol meets quality standards!' : 'Protocol may need refinement.'} Review and approve?`,
    title: 'Interview Protocol Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        protocolScore,
        qualityMet,
        interviewType,
        totalQuestions: guideevelopment.totalQuestions,
        estimatedDuration: guideevelopment.estimatedDuration
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore: protocolScore,
    qualityMet,
    interviewGuide: {
      totalQuestions: guideevelopment.totalQuestions,
      sections: guideevelopment.sections,
      estimatedDuration: guideevelopment.estimatedDuration,
      guidePath: guideevelopment.guidePath
    },
    probingStrategy: probingStrategy.strategies,
    rapportProtocol: rapportProtocol.techniques,
    ethicsProtocol: {
      informedConsent: ethicsProtocol.informedConsent,
      confidentiality: ethicsProtocol.confidentiality,
      riskMitigation: ethicsProtocol.riskMitigation
    },
    documentationPlan: documentationPlan.plan,
    protocolDocument: designPlanning.protocolPath,
    artifacts,
    duration,
    metadata: {
      processId: 'social-sciences/in-depth-interview-protocol',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Interview Design Planning
export const interviewDesignPlanningTask = defineTask('interview-design-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan interview design',
  agent: {
    name: 'interview-methodologist',
    prompt: {
      role: 'qualitative research methodologist specializing in interview research',
      task: 'Plan the overall interview design and approach',
      context: args,
      instructions: [
        'Determine interview type (unstructured, semi-structured, structured)',
        'Define interview objectives aligned with research questions',
        'Plan interview setting and mode (in-person, phone, video)',
        'Estimate appropriate interview duration',
        'Plan number of interviews needed for saturation',
        'Develop participant selection criteria',
        'Plan for pilot interviews',
        'Document timing and scheduling considerations',
        'Generate interview design protocol'
      ],
      outputFormat: 'JSON with interviewType, objectives, mode, duration, sampleSize, protocolPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['interviewType', 'objectives', 'artifacts'],
      properties: {
        interviewType: { type: 'string' },
        objectives: { type: 'array', items: { type: 'string' } },
        mode: { type: 'string' },
        duration: { type: 'string' },
        sampleSize: { type: 'number' },
        pilotPlan: { type: 'object' },
        protocolPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interview-protocol', 'design-planning']
}));

// Task 2: Interview Guide Development
export const interviewGuideDevelopmentTask = defineTask('interview-guide-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop interview guide',
  agent: {
    name: 'interview-guide-developer',
    prompt: {
      role: 'qualitative interviewing expert',
      task: 'Develop comprehensive interview guide with questions',
      context: args,
      instructions: [
        'Develop opening/warm-up questions',
        'Develop main interview questions aligned with research questions',
        'Use open-ended question formats',
        'Avoid leading or loaded questions',
        'Organize questions thematically',
        'Include transition statements between sections',
        'Develop closing questions and wrap-up',
        'Include flexibility for emergent topics',
        'Estimate time allocation per section',
        'Generate complete interview guide document'
      ],
      outputFormat: 'JSON with totalQuestions, sections, estimatedDuration, guidePath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalQuestions', 'sections', 'artifacts'],
      properties: {
        totalQuestions: { type: 'number' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              questionCount: { type: 'number' },
              timeAllocation: { type: 'string' }
            }
          }
        },
        estimatedDuration: { type: 'string' },
        guidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interview-protocol', 'guide-development']
}));

// Task 3: Probing Strategy
export const probingStrategyTask = defineTask('probing-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop probing strategies',
  agent: {
    name: 'probing-specialist',
    prompt: {
      role: 'qualitative interviewing expert',
      task: 'Develop effective probing strategies for deeper exploration',
      context: args,
      instructions: [
        'Develop elaboration probes ("Can you tell me more about...")',
        'Develop clarification probes ("What do you mean by...")',
        'Develop example probes ("Can you give me an example...")',
        'Develop contrast probes ("How does that differ from...")',
        'Develop silent probes (strategic pauses)',
        'Develop echo probes (repeating key words)',
        'Plan follow-up question strategies',
        'Document when to use each probe type',
        'Generate probing strategy guide'
      ],
      outputFormat: 'JSON with strategies, probeTypes, usageGuidelines, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'artifacts'],
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              probeType: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } },
              whenToUse: { type: 'string' }
            }
          }
        },
        probeTypes: { type: 'array', items: { type: 'string' } },
        usageGuidelines: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interview-protocol', 'probing']
}));

// Task 4: Rapport Building
export const rapportBuildingTask = defineTask('rapport-building', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop rapport building protocol',
  agent: {
    name: 'rapport-specialist',
    prompt: {
      role: 'qualitative interviewing expert specializing in rapport',
      task: 'Develop strategies for building and maintaining rapport',
      context: args,
      instructions: [
        'Develop pre-interview rapport building strategies',
        'Plan initial contact and relationship establishment',
        'Design opening conversation techniques',
        'Develop active listening strategies',
        'Plan empathy and validation techniques',
        'Develop strategies for sensitive topics',
        'Plan for maintaining professional boundaries',
        'Develop closing and appreciation protocols',
        'Generate rapport building guide'
      ],
      outputFormat: 'JSON with techniques, preInterview, duringInterview, postInterview, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['techniques', 'artifacts'],
      properties: {
        techniques: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              technique: { type: 'string' },
              phase: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        preInterview: { type: 'array', items: { type: 'string' } },
        duringInterview: { type: 'array', items: { type: 'string' } },
        postInterview: { type: 'array', items: { type: 'string' } },
        sensitiveTopicStrategies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interview-protocol', 'rapport']
}));

// Task 5: Ethics Protocol
export const interviewEthicsTask = defineTask('interview-ethics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Address ethical considerations',
  agent: {
    name: 'research-ethics-specialist',
    prompt: {
      role: 'research ethics expert',
      task: 'Develop comprehensive ethics protocol for interview research',
      context: args,
      instructions: [
        'Develop informed consent procedures and form',
        'Plan for voluntary participation and right to withdraw',
        'Design confidentiality and anonymity protections',
        'Plan data security and storage procedures',
        'Assess and mitigate potential risks to participants',
        'Plan for sensitive topic handling',
        'Develop referral protocols for distressed participants',
        'Plan for member checking and feedback',
        'Generate IRB-ready ethics documentation'
      ],
      outputFormat: 'JSON with informedConsent, confidentiality, riskMitigation, dataProtection, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['informedConsent', 'confidentiality', 'artifacts'],
      properties: {
        informedConsent: {
          type: 'object',
          properties: {
            elements: { type: 'array', items: { type: 'string' } },
            formPath: { type: 'string' }
          }
        },
        confidentiality: {
          type: 'object',
          properties: {
            measures: { type: 'array', items: { type: 'string' } },
            anonymization: { type: 'string' }
          }
        },
        riskMitigation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        dataProtection: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interview-protocol', 'ethics']
}));

// Task 6: Documentation Plan
export const documentationPlanTask = defineTask('documentation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop documentation plan',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'qualitative data management expert',
      task: 'Develop plan for interview documentation and recording',
      context: args,
      instructions: [
        'Plan audio/video recording procedures',
        'Develop transcription protocol',
        'Design field notes template',
        'Plan reflexive journaling procedures',
        'Design interview summary template',
        'Plan data organization and storage',
        'Develop naming conventions for files',
        'Plan backup and security procedures',
        'Generate documentation protocol'
      ],
      outputFormat: 'JSON with plan, recordingProtocol, transcriptionProtocol, fieldNotesTemplate, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        recordingProtocol: { type: 'object' },
        transcriptionProtocol: { type: 'object' },
        fieldNotesTemplate: { type: 'string' },
        dataOrganization: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interview-protocol', 'documentation']
}));

// Task 7: Quality Scoring
export const interviewProtocolQualityScoringTask = defineTask('interview-protocol-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score interview protocol quality',
  agent: {
    name: 'protocol-quality-reviewer',
    prompt: {
      role: 'senior qualitative methodologist',
      task: 'Assess interview protocol quality and completeness',
      context: args,
      instructions: [
        'Evaluate design planning appropriateness (weight: 15%)',
        'Assess interview guide quality (weight: 25%)',
        'Evaluate probing strategy comprehensiveness (weight: 15%)',
        'Assess rapport building protocol (weight: 15%)',
        'Evaluate ethics protocol completeness (weight: 20%)',
        'Assess documentation plan adequacy (weight: 10%)',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and recommendations'
      ],
      outputFormat: 'JSON with overallScore, componentScores, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            designPlanning: { type: 'number' },
            interviewGuide: { type: 'number' },
            probingStrategy: { type: 'number' },
            rapportProtocol: { type: 'number' },
            ethicsProtocol: { type: 'number' },
            documentationPlan: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interview-protocol', 'quality-scoring']
}));
