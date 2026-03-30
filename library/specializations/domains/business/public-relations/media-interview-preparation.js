/**
 * @process specializations/domains/business/public-relations/media-interview-preparation
 * @description Brief executives and spokespersons with key messages, anticipated questions, bridging techniques, and practice sessions before media interviews
 * @specialization Public Relations and Communications
 * @category Media Relations
 * @inputs { interview: object, spokesperson: object, outlet: object, topic: string, keyMessages: string[] }
 * @outputs { success: boolean, briefingPackage: object, prepSession: object, quality: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    interview,
    spokesperson,
    outlet,
    topic,
    keyMessages = [],
    sensitiveTopics = [],
    interviewFormat = 'live',
    targetQuality = 90
  } = inputs;

  // Phase 1: Interview Context Analysis
  await ctx.breakpoint({
    question: 'Starting media interview preparation. Analyze interview context and journalist?',
    title: 'Phase 1: Context Analysis',
    context: {
      runId: ctx.runId,
      phase: 'context-analysis',
      interview,
      outlet
    }
  });

  const [contextAnalysis, journalistProfile] = await Promise.all([
    ctx.task(analyzeInterviewContextTask, {
      interview,
      outlet,
      topic
    }),
    ctx.task(researchJournalistTask, {
      journalist: interview.journalist,
      outlet
    })
  ]);

  // Phase 2: Key Messages Development
  await ctx.breakpoint({
    question: 'Context analyzed. Develop key messages and proof points?',
    title: 'Phase 2: Key Messages Development',
    context: {
      runId: ctx.runId,
      phase: 'key-messages',
      topic,
      inputMessages: keyMessages.length
    }
  });

  const messageFramework = await ctx.task(developKeyMessagesTask, {
    topic,
    keyMessages,
    contextAnalysis,
    journalistProfile,
    spokesperson
  });

  // Phase 3: Question Anticipation
  await ctx.breakpoint({
    question: 'Messages developed. Anticipate likely questions and prepare responses?',
    title: 'Phase 3: Question Anticipation',
    context: {
      runId: ctx.runId,
      phase: 'question-anticipation',
      sensitiveTopics
    }
  });

  const anticipatedQuestions = await ctx.task(anticipateQuestionsTask, {
    topic,
    contextAnalysis,
    journalistProfile,
    sensitiveTopics,
    outlet
  });

  // Phase 4: Response Preparation
  await ctx.breakpoint({
    question: 'Questions anticipated. Prepare responses and bridging techniques?',
    title: 'Phase 4: Response Preparation',
    context: {
      runId: ctx.runId,
      phase: 'response-preparation',
      questionCount: anticipatedQuestions.questions.length
    }
  });

  const [preparedResponses, bridgingTechniques] = await Promise.all([
    ctx.task(prepareResponsesTask, {
      anticipatedQuestions,
      messageFramework,
      sensitiveTopics
    }),
    ctx.task(developBridgingTechniquesTask, {
      messageFramework,
      sensitiveTopics,
      interviewFormat
    })
  ]);

  // Phase 5: Briefing Package Assembly
  await ctx.breakpoint({
    question: 'Responses prepared. Assemble comprehensive briefing package?',
    title: 'Phase 5: Briefing Package',
    context: {
      runId: ctx.runId,
      phase: 'briefing-package'
    }
  });

  const briefingPackage = await ctx.task(assembleBriefingPackageTask, {
    contextAnalysis,
    journalistProfile,
    messageFramework,
    anticipatedQuestions,
    preparedResponses,
    bridgingTechniques,
    interview,
    interviewFormat
  });

  // Phase 6: Practice Session Design
  await ctx.breakpoint({
    question: 'Briefing package ready. Design practice session?',
    title: 'Phase 6: Practice Session Design',
    context: {
      runId: ctx.runId,
      phase: 'practice-session',
      interviewFormat
    }
  });

  const practiceSession = await ctx.task(designPracticeSessionTask, {
    briefingPackage,
    spokesperson,
    interviewFormat,
    anticipatedQuestions
  });

  // Phase 7: Quality Validation
  await ctx.breakpoint({
    question: 'Validate preparation quality and readiness?',
    title: 'Phase 7: Quality Validation',
    context: {
      runId: ctx.runId,
      phase: 'quality-validation',
      targetQuality
    }
  });

  const qualityResult = await ctx.task(validatePreparationQualityTask, {
    briefingPackage,
    practiceSession,
    targetQuality
  });

  const quality = qualityResult.score;

  if (quality >= targetQuality) {
    return {
      success: true,
      briefingPackage: {
        contextSummary: contextAnalysis.summary,
        journalistInsights: journalistProfile.insights,
        keyMessages: messageFramework.messages,
        proofPoints: messageFramework.proofPoints,
        anticipatedQuestions: anticipatedQuestions.questions,
        preparedResponses: preparedResponses.responses,
        bridgingTechniques: bridgingTechniques.techniques,
        dosAndDonts: briefingPackage.dosAndDonts,
        logisticsInfo: briefingPackage.logistics
      },
      prepSession: {
        agenda: practiceSession.agenda,
        duration: practiceSession.duration,
        mockQuestions: practiceSession.mockQuestions,
        scenarios: practiceSession.scenarios,
        feedbackFramework: practiceSession.feedbackFramework
      },
      quality,
      targetQuality,
      readinessAssessment: qualityResult.readinessAssessment,
      metadata: {
        processId: 'specializations/domains/business/public-relations/media-interview-preparation',
        timestamp: ctx.now(),
        interviewDate: interview.date,
        outlet: outlet.name
      }
    };
  } else {
    return {
      success: false,
      qualityGateFailed: true,
      quality,
      targetQuality,
      gaps: qualityResult.gaps,
      recommendations: qualityResult.recommendations,
      metadata: {
        processId: 'specializations/domains/business/public-relations/media-interview-preparation',
        timestamp: ctx.now()
      }
    };
  }
}

// Task Definitions

export const analyzeInterviewContextTask = defineTask('analyze-interview-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Interview Context',
  agent: {
    name: 'interview-context-analyzer',
    prompt: {
      role: 'Media relations strategist analyzing interview opportunities',
      task: 'Analyze interview context, outlet, and news environment',
      context: args,
      instructions: [
        'Research outlet audience, reach, and editorial positioning',
        'Analyze recent coverage of similar topics by outlet',
        'Identify current news environment and relevant trends',
        'Assess interview format and constraints (live, taped, length)',
        'Identify potential editorial angle or story thesis',
        'Note any recent organizational news affecting context',
        'Assess reputational opportunities and risks',
        'Determine interview objectives and success criteria'
      ],
      outputFormat: 'JSON with summary, outletProfile, newsContext, formatDetails, editorialAngle, opportunities, risks, objectives'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'outletProfile', 'objectives'],
      properties: {
        summary: { type: 'object' },
        outletProfile: { type: 'object' },
        newsContext: { type: 'object' },
        formatDetails: { type: 'object' },
        editorialAngle: { type: 'string' },
        opportunities: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        objectives: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'interview-context']
}));

export const researchJournalistTask = defineTask('research-journalist', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research Journalist Background',
  agent: {
    name: 'journalist-researcher',
    prompt: {
      role: 'Media intelligence specialist researching journalist backgrounds',
      task: 'Research journalist background, style, and recent work',
      context: args,
      instructions: [
        'Review journalist\'s recent articles and coverage',
        'Analyze interview style (confrontational, conversational, technical)',
        'Identify topics and angles journalist favors',
        'Note any past coverage of organization or competitors',
        'Research journalist\'s social media presence and positions',
        'Identify any professional background or expertise',
        'Note any known relationships or biases',
        'Provide strategic insights for interview approach'
      ],
      outputFormat: 'JSON with insights, recentWork, interviewStyle, topicInterests, pastCoverage, socialPresence, strategicNotes'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'interviewStyle'],
      properties: {
        insights: { type: 'array', items: { type: 'string' } },
        recentWork: { type: 'array', items: { type: 'object' } },
        interviewStyle: { type: 'string' },
        topicInterests: { type: 'array', items: { type: 'string' } },
        pastCoverage: { type: 'array', items: { type: 'object' } },
        socialPresence: { type: 'object' },
        strategicNotes: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'journalist-research']
}));

export const developKeyMessagesTask = defineTask('develop-key-messages', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Key Messages',
  agent: {
    name: 'key-message-developer',
    prompt: {
      role: 'Strategic communications expert crafting interview messages',
      task: 'Develop key messages and proof points for interview',
      context: args,
      instructions: [
        'Refine 3-5 key messages aligned with interview objectives',
        'Ensure messages are concise, memorable, and quotable',
        'Develop supporting proof points for each message',
        'Include data, examples, and anecdotes as evidence',
        'Create message variations for different question contexts',
        'Align messages with organizational narrative',
        'Test messages for potential misinterpretation',
        'Create headline-ready sound bites'
      ],
      outputFormat: 'JSON with messages array (message, proofPoints, soundBite, variations), messagingPriority, narrativeAlignment'
    },
    outputSchema: {
      type: 'object',
      required: ['messages', 'proofPoints'],
      properties: {
        messages: { type: 'array', items: { type: 'object' } },
        proofPoints: { type: 'array', items: { type: 'object' } },
        soundBites: { type: 'array', items: { type: 'string' } },
        messagingPriority: { type: 'array', items: { type: 'string' } },
        narrativeAlignment: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'key-messages']
}));

export const anticipateQuestionsTask = defineTask('anticipate-questions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Anticipate Interview Questions',
  agent: {
    name: 'question-anticipator',
    prompt: {
      role: 'Media trainer expert in journalist questioning techniques',
      task: 'Anticipate likely interview questions including difficult ones',
      context: args,
      instructions: [
        'Generate likely opening and scene-setting questions',
        'Anticipate substantive topic-focused questions',
        'Predict challenging or confrontational questions',
        'Identify questions on sensitive topics',
        'Generate follow-up questions to initial responses',
        'Anticipate hypothetical and speculative questions',
        'Predict questions based on journalist style and past work',
        'Include curveball or unexpected angle questions',
        'Categorize questions by difficulty and risk level'
      ],
      outputFormat: 'JSON with questions array (question, category, difficulty, riskLevel, likelyFollowUp), categorySummary'
    },
    outputSchema: {
      type: 'object',
      required: ['questions'],
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              category: { type: 'string' },
              difficulty: { type: 'string' },
              riskLevel: { type: 'string' },
              likelyFollowUp: { type: 'string' }
            }
          }
        },
        categorySummary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'question-anticipation']
}));

export const prepareResponsesTask = defineTask('prepare-responses', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare Question Responses',
  agent: {
    name: 'response-preparer',
    prompt: {
      role: 'Media trainer crafting interview responses',
      task: 'Prepare responses for anticipated questions',
      context: args,
      instructions: [
        'Draft concise responses for each anticipated question',
        'Incorporate key messages into responses naturally',
        'Create bridge phrases to pivot to key messages',
        'Prepare responses for sensitive topic questions',
        'Include "don\'t know" and "can\'t discuss" responses where needed',
        'Ensure responses are authentic to spokesperson voice',
        'Create response alternatives for different scenarios',
        'Note red lines and topics to avoid'
      ],
      outputFormat: 'JSON with responses array (question, response, keyMessageIntegrated, bridgeUsed, alternatives), redLines'
    },
    outputSchema: {
      type: 'object',
      required: ['responses'],
      properties: {
        responses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              response: { type: 'string' },
              keyMessageIntegrated: { type: 'string' },
              bridgeUsed: { type: 'string' },
              alternatives: { type: 'array' }
            }
          }
        },
        redLines: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'response-preparation']
}));

export const developBridgingTechniquesTask = defineTask('develop-bridging-techniques', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Bridging Techniques',
  agent: {
    name: 'bridging-expert',
    prompt: {
      role: 'Media training specialist expert in interview techniques',
      task: 'Develop bridging techniques to navigate difficult questions',
      context: args,
      instructions: [
        'Create bridge phrases to transition from question to message',
        'Develop flagging techniques to emphasize key points',
        'Prepare hooking techniques to engage journalist interest',
        'Create blocking responses for off-limits topics',
        'Develop defusing techniques for hostile questions',
        'Prepare reframing techniques for negative premises',
        'Include pivot phrases for changing direction',
        'Tailor techniques to interview format (live vs. taped)'
      ],
      outputFormat: 'JSON with techniques object (bridging, flagging, hooking, blocking, defusing, reframing, pivoting), examples'
    },
    outputSchema: {
      type: 'object',
      required: ['techniques'],
      properties: {
        techniques: {
          type: 'object',
          properties: {
            bridging: { type: 'array', items: { type: 'string' } },
            flagging: { type: 'array', items: { type: 'string' } },
            hooking: { type: 'array', items: { type: 'string' } },
            blocking: { type: 'array', items: { type: 'string' } },
            defusing: { type: 'array', items: { type: 'string' } },
            reframing: { type: 'array', items: { type: 'string' } },
            pivoting: { type: 'array', items: { type: 'string' } }
          }
        },
        examples: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'bridging-techniques']
}));

export const assembleBriefingPackageTask = defineTask('assemble-briefing-package', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble Briefing Package',
  agent: {
    name: 'briefing-assembler',
    prompt: {
      role: 'Communications director assembling executive briefings',
      task: 'Assemble comprehensive briefing package for spokesperson',
      context: args,
      instructions: [
        'Create executive summary of interview context and objectives',
        'Compile key messages card (one-page reference)',
        'Include Q&A document with all prepared responses',
        'Add journalist background briefing',
        'Include bridging techniques cheat sheet',
        'Create do\'s and don\'ts list',
        'Add logistics information (time, location, format, contacts)',
        'Include supporting materials (data, facts, background)',
        'Create pre-interview checklist'
      ],
      outputFormat: 'JSON with executiveSummary, keyMessagesCard, qaDocument, journalistBrief, techniqueSheet, dosAndDonts, logistics, checklist'
    },
    outputSchema: {
      type: 'object',
      required: ['executiveSummary', 'keyMessagesCard', 'dosAndDonts', 'logistics'],
      properties: {
        executiveSummary: { type: 'object' },
        keyMessagesCard: { type: 'object' },
        qaDocument: { type: 'object' },
        journalistBrief: { type: 'object' },
        techniqueSheet: { type: 'object' },
        dosAndDonts: { type: 'object' },
        logistics: { type: 'object' },
        checklist: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'briefing-package']
}));

export const designPracticeSessionTask = defineTask('design-practice-session', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Practice Session',
  agent: {
    name: 'practice-session-designer',
    prompt: {
      role: 'Media trainer designing spokesperson preparation sessions',
      task: 'Design practice session to prepare spokesperson for interview',
      context: args,
      instructions: [
        'Create practice session agenda with timing',
        'Design warm-up exercises for message delivery',
        'Prepare mock interview questions sequence',
        'Create scenarios for difficult question handling',
        'Design on-camera presence exercises if video interview',
        'Prepare feedback framework for improvement',
        'Include bridging technique practice',
        'Design rapid-fire message recall exercises',
        'Allow time for Q&A and clarification'
      ],
      outputFormat: 'JSON with agenda, duration, warmUpExercises, mockQuestions, scenarios, feedbackFramework, techniquePractice'
    },
    outputSchema: {
      type: 'object',
      required: ['agenda', 'duration', 'mockQuestions'],
      properties: {
        agenda: { type: 'array', items: { type: 'object' } },
        duration: { type: 'string' },
        warmUpExercises: { type: 'array', items: { type: 'object' } },
        mockQuestions: { type: 'array', items: { type: 'string' } },
        scenarios: { type: 'array', items: { type: 'object' } },
        feedbackFramework: { type: 'object' },
        techniquePractice: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'practice-session']
}));

export const validatePreparationQualityTask = defineTask('validate-preparation-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Preparation Quality',
  agent: {
    name: 'preparation-quality-validator',
    prompt: {
      role: 'Media training quality assessor',
      task: 'Validate interview preparation quality and readiness',
      context: args,
      instructions: [
        'Assess key message clarity and memorability',
        'Evaluate question coverage completeness',
        'Review response quality and authenticity',
        'Assess bridging technique appropriateness',
        'Evaluate briefing package comprehensiveness',
        'Review practice session design effectiveness',
        'Assess spokesperson readiness indicators',
        'Provide overall quality score (0-100)',
        'Identify gaps and recommendations'
      ],
      outputFormat: 'JSON with score, passed, readinessAssessment, gaps, recommendations, componentScores'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'passed', 'readinessAssessment'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'boolean' },
        readinessAssessment: { type: 'object' },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        componentScores: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'quality-validation']
}));
