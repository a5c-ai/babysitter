/**
 * @process social-sciences/ethnographic-fieldwork
 * @description Execute participant observation and ethnographic research including site access, field notes, immersion strategies, and thick description documentation
 * @inputs { researchFocus: string, fieldSite: object, researchQuestions: array, constraints: object, outputDir: string }
 * @outputs { success: boolean, fieldworkPlan: object, dataCollectionProtocol: object, qualityScore: number, artifacts: array }
 * @recommendedSkills SK-SS-005 (ethnographic-research), SK-SS-002 (qualitative-analysis), SK-SS-014 (research-ethics-irb)
 * @recommendedAgents AG-SS-002 (qualitative-research-specialist), AG-SS-010 (research-ethics-coordinator)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    researchFocus,
    fieldSite = {},
    researchQuestions = [],
    constraints = {},
    outputDir = 'ethnographic-fieldwork-output',
    fieldworkDuration = '6 months'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Ethnographic Fieldwork planning process');

  // ============================================================================
  // PHASE 1: SITE ACCESS AND ENTRY PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Planning site access and entry');
  const siteAccessPlan = await ctx.task(siteAccessPlanningTask, {
    fieldSite,
    researchFocus,
    constraints,
    outputDir
  });

  artifacts.push(...siteAccessPlan.artifacts);

  // ============================================================================
  // PHASE 2: PARTICIPANT OBSERVATION DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing participant observation approach');
  const observationDesign = await ctx.task(participantObservationDesignTask, {
    researchFocus,
    researchQuestions,
    siteAccessPlan,
    outputDir
  });

  artifacts.push(...observationDesign.artifacts);

  // ============================================================================
  // PHASE 3: FIELD NOTES PROTOCOL
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing field notes protocol');
  const fieldNotesProtocol = await ctx.task(fieldNotesProtocolTask, {
    observationDesign,
    researchQuestions,
    outputDir
  });

  artifacts.push(...fieldNotesProtocol.artifacts);

  // ============================================================================
  // PHASE 4: IMMERSION STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 4: Developing immersion strategy');
  const immersionStrategy = await ctx.task(immersionStrategyTask, {
    fieldSite,
    fieldworkDuration,
    siteAccessPlan,
    outputDir
  });

  artifacts.push(...immersionStrategy.artifacts);

  // ============================================================================
  // PHASE 5: DATA COLLECTION METHODS
  // ============================================================================

  ctx.log('info', 'Phase 5: Planning additional data collection methods');
  const dataCollectionMethods = await ctx.task(ethnographicDataCollectionTask, {
    researchQuestions,
    observationDesign,
    outputDir
  });

  artifacts.push(...dataCollectionMethods.artifacts);

  // ============================================================================
  // PHASE 6: ETHICS AND REFLEXIVITY
  // ============================================================================

  ctx.log('info', 'Phase 6: Addressing ethics and reflexivity');
  const ethicsReflexivity = await ctx.task(ethnographicEthicsTask, {
    fieldSite,
    researchFocus,
    observationDesign,
    outputDir
  });

  artifacts.push(...ethicsReflexivity.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Scoring ethnographic fieldwork plan quality');
  const qualityScore = await ctx.task(ethnographicQualityScoringTask, {
    siteAccessPlan,
    observationDesign,
    fieldNotesProtocol,
    immersionStrategy,
    dataCollectionMethods,
    ethicsReflexivity,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const fieldworkScore = qualityScore.overallScore;
  const qualityMet = fieldworkScore >= 80;

  // Breakpoint: Review ethnographic fieldwork plan
  await ctx.breakpoint({
    question: `Ethnographic fieldwork plan complete. Quality score: ${fieldworkScore}/100. ${qualityMet ? 'Plan meets quality standards!' : 'Plan may need refinement.'} Review and approve?`,
    title: 'Ethnographic Fieldwork Plan Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        fieldworkScore,
        qualityMet,
        fieldworkDuration,
        observationRole: observationDesign.observerRole,
        dataCollectionMethods: dataCollectionMethods.methods
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore: fieldworkScore,
    qualityMet,
    fieldworkPlan: {
      siteAccess: siteAccessPlan.accessStrategy,
      duration: fieldworkDuration,
      phases: immersionStrategy.phases
    },
    dataCollectionProtocol: {
      observationApproach: observationDesign.approach,
      observerRole: observationDesign.observerRole,
      fieldNotes: fieldNotesProtocol.protocol,
      additionalMethods: dataCollectionMethods.methods
    },
    ethicsProtocol: {
      informedConsent: ethicsReflexivity.informedConsent,
      reflexivityPlan: ethicsReflexivity.reflexivityPlan
    },
    artifacts,
    duration,
    metadata: {
      processId: 'social-sciences/ethnographic-fieldwork',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Site Access Planning
export const siteAccessPlanningTask = defineTask('site-access-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan site access and entry',
  agent: {
    name: 'ethnographic-methodologist',
    prompt: {
      role: 'experienced ethnographer',
      task: 'Plan site access and entry strategies for ethnographic fieldwork',
      context: args,
      instructions: [
        'Identify gatekeepers and key informants',
        'Develop approach for negotiating access',
        'Plan for building trust with community',
        'Address potential barriers to access',
        'Develop contingency plans for access challenges',
        'Plan timeline for entry and relationship building',
        'Document site characteristics and context',
        'Develop rapport building strategies',
        'Generate site access protocol'
      ],
      outputFormat: 'JSON with accessStrategy, gatekeepers, barriers, contingencies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['accessStrategy', 'artifacts'],
      properties: {
        accessStrategy: { type: 'string' },
        gatekeepers: { type: 'array', items: { type: 'string' } },
        keyInformants: { type: 'array', items: { type: 'string' } },
        barriers: { type: 'array', items: { type: 'string' } },
        contingencies: { type: 'array', items: { type: 'string' } },
        entryTimeline: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ethnographic', 'site-access']
}));

// Task 2: Participant Observation Design
export const participantObservationDesignTask = defineTask('participant-observation-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design participant observation approach',
  agent: {
    name: 'observation-specialist',
    prompt: {
      role: 'ethnographic methodologist',
      task: 'Design comprehensive participant observation approach',
      context: args,
      instructions: [
        'Determine observer role (complete participant to complete observer)',
        'Define observation focus areas aligned with research questions',
        'Plan observation schedule and timing',
        'Identify key settings and events for observation',
        'Design sampling strategy for observations',
        'Plan for varying observation contexts',
        'Develop protocols for different observation types',
        'Plan progression of observation intensity',
        'Generate observation protocol document'
      ],
      outputFormat: 'JSON with approach, observerRole, focusAreas, schedule, observationProtocol, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'observerRole', 'artifacts'],
      properties: {
        approach: { type: 'string' },
        observerRole: { type: 'string' },
        focusAreas: { type: 'array', items: { type: 'string' } },
        schedule: { type: 'object' },
        keySettings: { type: 'array', items: { type: 'string' } },
        samplingStrategy: { type: 'string' },
        observationProtocol: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ethnographic', 'observation']
}));

// Task 3: Field Notes Protocol
export const fieldNotesProtocolTask = defineTask('field-notes-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop field notes protocol',
  agent: {
    name: 'field-notes-specialist',
    prompt: {
      role: 'ethnographic writing expert',
      task: 'Develop comprehensive field notes protocol for thick description',
      context: args,
      instructions: [
        'Design jottings protocol for in-field notes',
        'Design expanded field notes template',
        'Include descriptive notes protocol',
        'Include reflective/analytical notes protocol',
        'Include methodological notes protocol',
        'Plan for thick description writing',
        'Design coding system for organizing notes',
        'Plan regular note-writing schedule',
        'Generate field notes templates and protocol'
      ],
      outputFormat: 'JSON with protocol, jottingsGuide, expandedNotesTemplate, writingSchedule, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'artifacts'],
      properties: {
        protocol: { type: 'object' },
        jottingsGuide: { type: 'string' },
        expandedNotesTemplate: { type: 'string' },
        noteTypes: {
          type: 'object',
          properties: {
            descriptive: { type: 'string' },
            reflective: { type: 'string' },
            methodological: { type: 'string' }
          }
        },
        writingSchedule: { type: 'string' },
        codingSystem: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ethnographic', 'field-notes']
}));

// Task 4: Immersion Strategy
export const immersionStrategyTask = defineTask('immersion-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop immersion strategy',
  agent: {
    name: 'immersion-specialist',
    prompt: {
      role: 'experienced ethnographer',
      task: 'Develop comprehensive immersion strategy for fieldwork',
      context: args,
      instructions: [
        'Plan phased immersion approach',
        'Design strategies for cultural learning',
        'Plan for language/communication needs',
        'Develop strategies for managing researcher identity',
        'Plan for self-care and avoiding burnout',
        'Design exit strategy and leaving the field',
        'Plan for maintaining relationships post-fieldwork',
        'Address going native concerns',
        'Generate immersion strategy document'
      ],
      outputFormat: 'JSON with phases, culturalLearning, identityManagement, selfCare, exitStrategy, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'artifacts'],
      properties: {
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              duration: { type: 'string' },
              activities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        culturalLearning: { type: 'array', items: { type: 'string' } },
        identityManagement: { type: 'string' },
        selfCare: { type: 'array', items: { type: 'string' } },
        exitStrategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ethnographic', 'immersion']
}));

// Task 5: Ethnographic Data Collection
export const ethnographicDataCollectionTask = defineTask('ethnographic-data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan additional data collection methods',
  agent: {
    name: 'data-collection-specialist',
    prompt: {
      role: 'ethnographic methodologist',
      task: 'Plan additional data collection methods beyond observation',
      context: args,
      instructions: [
        'Plan informal conversational interviews',
        'Design key informant interview protocols',
        'Plan for life history interviews if needed',
        'Design artifact and document collection protocol',
        'Plan visual methods (photography, video)',
        'Design mapping and spatial data collection',
        'Plan for collecting cultural artifacts/texts',
        'Design triangulation strategy',
        'Generate data collection protocol'
      ],
      outputFormat: 'JSON with methods, interviewProtocols, artifactCollection, visualMethods, triangulation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['methods', 'artifacts'],
      properties: {
        methods: { type: 'array', items: { type: 'string' } },
        interviewProtocols: { type: 'object' },
        artifactCollection: { type: 'object' },
        visualMethods: { type: 'object' },
        triangulation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ethnographic', 'data-collection']
}));

// Task 6: Ethics and Reflexivity
export const ethnographicEthicsTask = defineTask('ethnographic-ethics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Address ethics and reflexivity',
  agent: {
    name: 'ethnographic-ethics-specialist',
    prompt: {
      role: 'research ethics expert in ethnographic methods',
      task: 'Develop ethics protocol and reflexivity plan',
      context: args,
      instructions: [
        'Develop informed consent approach for ethnographic context',
        'Address confidentiality in identifiable communities',
        'Plan for managing dual relationships',
        'Address power dynamics and representation',
        'Develop reflexivity journaling protocol',
        'Plan for researcher positionality documentation',
        'Address reciprocity and giving back to community',
        'Plan for ethical challenges in covert observation',
        'Generate ethics and reflexivity protocol'
      ],
      outputFormat: 'JSON with informedConsent, confidentiality, reflexivityPlan, positionality, reciprocity, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['informedConsent', 'reflexivityPlan', 'artifacts'],
      properties: {
        informedConsent: { type: 'object' },
        confidentiality: { type: 'object' },
        reflexivityPlan: { type: 'object' },
        positionality: { type: 'string' },
        powerDynamics: { type: 'string' },
        reciprocity: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ethnographic', 'ethics']
}));

// Task 7: Quality Scoring
export const ethnographicQualityScoringTask = defineTask('ethnographic-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score ethnographic fieldwork plan quality',
  agent: {
    name: 'ethnographic-reviewer',
    prompt: {
      role: 'senior ethnographic methodologist',
      task: 'Assess ethnographic fieldwork plan quality',
      context: args,
      instructions: [
        'Evaluate site access planning (weight: 15%)',
        'Assess observation design rigor (weight: 20%)',
        'Evaluate field notes protocol comprehensiveness (weight: 20%)',
        'Assess immersion strategy appropriateness (weight: 15%)',
        'Evaluate data collection methods adequacy (weight: 15%)',
        'Assess ethics and reflexivity plan (weight: 15%)',
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
            siteAccess: { type: 'number' },
            observationDesign: { type: 'number' },
            fieldNotesProtocol: { type: 'number' },
            immersionStrategy: { type: 'number' },
            dataCollectionMethods: { type: 'number' },
            ethicsReflexivity: { type: 'number' }
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
  labels: ['agent', 'ethnographic', 'quality-scoring']
}));
