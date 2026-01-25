/**
 * @process education/peer-observation
 * @description Structured peer observation protocols with pre-observation conferences, classroom observations, and constructive feedback sessions
 * @inputs { observationType: string, focusAreas: array, instructor: object, observer: object, context: object }
 * @outputs { success: boolean, protocol: object, observationTools: array, feedbackFramework: object, artifacts: array }
 * @recommendedSkills SK-EDU-012 (facilitation-workshop-delivery)
 * @recommendedAgents AG-EDU-006 (faculty-development-facilitator)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    observationType = 'formative',
    focusAreas = [],
    instructor = {},
    observer = {},
    context = {},
    outputDir = 'peer-observation-output',
    qualityThreshold = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Peer Observation Protocol Development: ${observationType}`);

  // ============================================================================
  // PRE-OBSERVATION PROTOCOL
  // ============================================================================

  ctx.log('info', 'Developing pre-observation protocol');
  const preObservationProtocol = await ctx.task(preObservationProtocolTask, {
    observationType,
    focusAreas,
    instructor,
    observer,
    outputDir
  });

  artifacts.push(...preObservationProtocol.artifacts);

  // ============================================================================
  // OBSERVATION TOOLS
  // ============================================================================

  ctx.log('info', 'Creating observation tools');
  const observationTools = await ctx.task(observationToolsTask, {
    observationType,
    focusAreas,
    context,
    outputDir
  });

  artifacts.push(...observationTools.artifacts);

  // ============================================================================
  // POST-OBSERVATION PROTOCOL
  // ============================================================================

  ctx.log('info', 'Developing post-observation protocol');
  const postObservationProtocol = await ctx.task(postObservationProtocolTask, {
    observationType,
    focusAreas,
    observationTools: observationTools.tools,
    outputDir
  });

  artifacts.push(...postObservationProtocol.artifacts);

  // ============================================================================
  // FEEDBACK FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Creating feedback framework');
  const feedbackFramework = await ctx.task(feedbackFrameworkTask, {
    observationType,
    focusAreas,
    postObservationProtocol: postObservationProtocol.protocol,
    outputDir
  });

  artifacts.push(...feedbackFramework.artifacts);

  // ============================================================================
  // DOCUMENTATION SYSTEM
  // ============================================================================

  ctx.log('info', 'Creating documentation system');
  const documentationSystem = await ctx.task(observationDocumentationTask, {
    observationType,
    protocols: {
      preObservation: preObservationProtocol.protocol,
      postObservation: postObservationProtocol.protocol
    },
    tools: observationTools.tools,
    outputDir
  });

  artifacts.push(...documentationSystem.artifacts);

  // ============================================================================
  // QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Scoring peer observation protocol quality');
  const qualityScore = await ctx.task(peerObservationQualityScoringTask, {
    observationType,
    preObservationProtocol,
    observationTools,
    postObservationProtocol,
    feedbackFramework,
    qualityThreshold,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= qualityThreshold;

  // Breakpoint: Review protocol
  await ctx.breakpoint({
    question: `Peer observation protocol complete. Quality score: ${overallScore}/${qualityThreshold}. ${qualityMet ? 'Quality standards met!' : 'May need refinement.'} Review and approve?`,
    title: 'Peer Observation Protocol Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        overallScore,
        qualityMet,
        observationType,
        focusAreasCount: focusAreas.length,
        totalTools: observationTools.tools?.length || 0,
        totalArtifacts: artifacts.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    observationType,
    qualityScore: overallScore,
    qualityMet,
    protocol: {
      preObservation: preObservationProtocol.protocol,
      observation: observationTools.protocol,
      postObservation: postObservationProtocol.protocol
    },
    observationTools: observationTools.tools,
    feedbackFramework: feedbackFramework.framework,
    documentation: documentationSystem.system,
    artifacts,
    duration,
    metadata: {
      processId: 'education/peer-observation',
      timestamp: startTime,
      observationType,
      outputDir
    }
  };
}

// Task definitions
export const preObservationProtocolTask = defineTask('pre-observation-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop pre-observation protocol',
  agent: {
    name: 'protocol-developer',
    prompt: {
      role: 'peer observation specialist',
      task: 'Develop pre-observation conference protocol',
      context: args,
      instructions: [
        'Design pre-observation conference agenda',
        'Create focus area discussion guide',
        'Develop class context questionnaire',
        'Create lesson overview template',
        'Design observation goals setting process',
        'Plan logistics coordination',
        'Create confidentiality agreement',
        'Generate pre-observation protocol document'
      ],
      outputFormat: 'JSON with protocol, agenda, questionnaire, templates, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'artifacts'],
      properties: {
        protocol: { type: 'object' },
        agenda: { type: 'array' },
        questionnaire: { type: 'object' },
        templates: { type: 'array' },
        confidentiality: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'peer-observation', 'pre-observation', 'protocol']
}));

export const observationToolsTask = defineTask('observation-tools', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create observation tools',
  agent: {
    name: 'tools-creator',
    prompt: {
      role: 'classroom observation specialist',
      task: 'Create observation tools and instruments',
      context: args,
      instructions: [
        'Create observation checklist',
        'Design note-taking template',
        'Develop time-sampling tool',
        'Create interaction tracking form',
        'Design seating chart observation tool',
        'Create evidence collection template',
        'Develop observation protocol',
        'Generate observation tools package'
      ],
      outputFormat: 'JSON with tools, protocol, checklists, templates, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['tools', 'protocol', 'artifacts'],
      properties: {
        tools: { type: 'array' },
        protocol: { type: 'object' },
        checklists: { type: 'array' },
        templates: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'peer-observation', 'tools', 'instruments']
}));

export const postObservationProtocolTask = defineTask('post-observation-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop post-observation protocol',
  agent: {
    name: 'post-observation-developer',
    prompt: {
      role: 'feedback and reflection specialist',
      task: 'Develop post-observation conference protocol',
      context: args,
      instructions: [
        'Design post-observation conference agenda',
        'Create reflection prompts for instructor',
        'Develop evidence presentation format',
        'Design constructive feedback protocol',
        'Create goal-setting framework',
        'Plan follow-up actions',
        'Design written summary template',
        'Generate post-observation protocol document'
      ],
      outputFormat: 'JSON with protocol, agenda, reflectionPrompts, feedbackFormat, goalSetting, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'artifacts'],
      properties: {
        protocol: { type: 'object' },
        agenda: { type: 'array' },
        reflectionPrompts: { type: 'array' },
        feedbackFormat: { type: 'object' },
        goalSetting: { type: 'object' },
        followUp: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'peer-observation', 'post-observation', 'protocol']
}));

export const feedbackFrameworkTask = defineTask('feedback-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create feedback framework',
  agent: {
    name: 'feedback-designer',
    prompt: {
      role: 'constructive feedback specialist',
      task: 'Create framework for delivering constructive feedback',
      context: args,
      instructions: [
        'Design feedback delivery model',
        'Create evidence-based feedback structure',
        'Develop questioning techniques for reflection',
        'Design strengths-first approach',
        'Create growth-oriented language guidelines',
        'Develop difficult conversation strategies',
        'Design written feedback template',
        'Generate feedback framework document'
      ],
      outputFormat: 'JSON with framework, model, techniques, guidelines, templates, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        model: { type: 'object' },
        techniques: { type: 'array' },
        guidelines: { type: 'array' },
        templates: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'peer-observation', 'feedback', 'framework']
}));

export const observationDocumentationTask = defineTask('observation-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create documentation system',
  agent: {
    name: 'documentation-designer',
    prompt: {
      role: 'documentation systems specialist',
      task: 'Create observation documentation system',
      context: args,
      instructions: [
        'Design documentation workflow',
        'Create record-keeping templates',
        'Design confidentiality procedures',
        'Create archiving system',
        'Design summary report format',
        'Plan data privacy compliance',
        'Create observer training materials',
        'Generate documentation system guide'
      ],
      outputFormat: 'JSON with system, workflow, templates, privacy, training, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['system', 'artifacts'],
      properties: {
        system: { type: 'object' },
        workflow: { type: 'object' },
        templates: { type: 'array' },
        privacy: { type: 'object' },
        training: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'peer-observation', 'documentation', 'system']
}));

export const peerObservationQualityScoringTask = defineTask('peer-observation-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score peer observation protocol quality',
  agent: {
    name: 'protocol-quality-auditor',
    prompt: {
      role: 'peer observation quality auditor',
      task: 'Assess peer observation protocol quality',
      context: args,
      instructions: [
        'Evaluate pre-observation protocol (weight: 20%)',
        'Assess observation tools quality (weight: 25%)',
        'Review post-observation protocol (weight: 25%)',
        'Evaluate feedback framework (weight: 20%)',
        'Assess documentation system (weight: 10%)',
        'Calculate weighted overall score (0-100)',
        'Identify quality issues',
        'Provide improvement recommendations'
      ],
      outputFormat: 'JSON with overallScore, componentScores, issues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'peer-observation', 'quality-scoring', 'validation']
}));
