/**
 * @process philosophy/philosophical-literature-review
 * @description Survey and synthesize existing philosophical literature on a topic, identifying major positions, debates, and gaps in the scholarly conversation
 * @inputs { topic: string, scope: string, timeframe: string, outputDir: string }
 * @outputs { success: boolean, literatureReview: object, majorPositions: array, debates: array, gaps: array, artifacts: array }
 * @recommendedSkills SK-PHIL-013 (scholarly-literature-synthesis), SK-PHIL-010 (philosophical-writing-argumentation), SK-PHIL-005 (conceptual-analysis)
 * @recommendedAgents AG-PHIL-006 (academic-philosophy-writer-agent), AG-PHIL-003 (hermeneutics-specialist-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    topic,
    scope = 'comprehensive',
    timeframe = 'all',
    outputDir = 'literature-review-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Topic Scoping and Search Strategy
  ctx.log('info', 'Starting literature review: Scoping topic');
  const topicScoping = await ctx.task(topicScopingTask, {
    topic,
    scope,
    timeframe,
    outputDir
  });

  if (!topicScoping.success) {
    return {
      success: false,
      error: 'Topic scoping failed',
      details: topicScoping,
      metadata: { processId: 'philosophy/philosophical-literature-review', timestamp: startTime }
    };
  }

  artifacts.push(...topicScoping.artifacts);

  // Task 2: Major Positions Identification
  ctx.log('info', 'Identifying major positions');
  const positionsIdentification = await ctx.task(positionsIdentificationTask, {
    scopedTopic: topicScoping.scoped,
    outputDir
  });

  artifacts.push(...positionsIdentification.artifacts);

  // Task 3: Key Debates Mapping
  ctx.log('info', 'Mapping key debates');
  const debatesMapping = await ctx.task(debatesMappingTask, {
    scopedTopic: topicScoping.scoped,
    positions: positionsIdentification.positions,
    outputDir
  });

  artifacts.push(...debatesMapping.artifacts);

  // Task 4: Historical Development Tracing
  ctx.log('info', 'Tracing historical development');
  const historicalTracing = await ctx.task(historicalTracingTask, {
    topic,
    positions: positionsIdentification.positions,
    timeframe,
    outputDir
  });

  artifacts.push(...historicalTracing.artifacts);

  // Task 5: Gap Identification
  ctx.log('info', 'Identifying gaps in the literature');
  const gapIdentification = await ctx.task(gapIdentificationTask, {
    scopedTopic: topicScoping.scoped,
    positions: positionsIdentification.positions,
    debates: debatesMapping.debates,
    outputDir
  });

  artifacts.push(...gapIdentification.artifacts);

  // Task 6: Synthesis Development
  ctx.log('info', 'Developing synthesis');
  const synthesisDevelopment = await ctx.task(synthesisDevelopmentTask, {
    positions: positionsIdentification.positions,
    debates: debatesMapping.debates,
    history: historicalTracing.development,
    gaps: gapIdentification.gaps,
    outputDir
  });

  artifacts.push(...synthesisDevelopment.artifacts);

  // Breakpoint: Review literature review
  await ctx.breakpoint({
    question: `Literature review complete. Identified ${positionsIdentification.positions.length} positions and ${gapIdentification.gaps.length} gaps. Review the synthesis?`,
    title: 'Philosophical Literature Review Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        topic,
        positionsCount: positionsIdentification.positions.length,
        debatesCount: debatesMapping.debates.length,
        gapsCount: gapIdentification.gaps.length
      }
    }
  });

  // Task 7: Generate Literature Review Report
  ctx.log('info', 'Generating literature review report');
  const reviewReport = await ctx.task(literatureReportTask, {
    topic,
    topicScoping,
    positionsIdentification,
    debatesMapping,
    historicalTracing,
    gapIdentification,
    synthesisDevelopment,
    outputDir
  });

  artifacts.push(...reviewReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    literatureReview: {
      topic,
      scope: topicScoping.scoped,
      synthesis: synthesisDevelopment.synthesis,
      historicalDevelopment: historicalTracing.development
    },
    majorPositions: positionsIdentification.positions,
    debates: debatesMapping.debates,
    gaps: gapIdentification.gaps,
    artifacts,
    duration,
    metadata: {
      processId: 'philosophy/philosophical-literature-review',
      timestamp: startTime,
      scope,
      outputDir
    }
  };
}

// Task definitions
export const topicScopingTask = defineTask('topic-scoping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scope the topic for review',
  agent: {
    name: 'topic-scoper',
    prompt: {
      role: 'philosophical researcher',
      task: 'Scope and define the topic for literature review',
      context: args,
      instructions: [
        'Define the topic boundaries precisely',
        'Identify sub-topics and related areas',
        'Determine inclusion/exclusion criteria',
        'Identify key terms and concepts',
        'Determine appropriate timeframe',
        'Identify relevant philosophical traditions',
        'Develop search strategy',
        'Save topic scoping to output directory'
      ],
      outputFormat: 'JSON with success, scoped (definition, subtopics, criteria, terms, traditions), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'scoped', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        scoped: {
          type: 'object',
          properties: {
            definition: { type: 'string' },
            subtopics: { type: 'array', items: { type: 'string' } },
            inclusionCriteria: { type: 'array', items: { type: 'string' } },
            exclusionCriteria: { type: 'array', items: { type: 'string' } },
            keyTerms: { type: 'array', items: { type: 'string' } },
            traditions: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'literature-review', 'scoping']
}));

export const positionsIdentificationTask = defineTask('positions-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify major positions',
  agent: {
    name: 'positions-identifier',
    prompt: {
      role: 'philosophical researcher',
      task: 'Identify major positions in the literature on this topic',
      context: args,
      instructions: [
        'Identify all major positions on the topic',
        'Name and characterize each position',
        'Identify key proponents of each',
        'Summarize main arguments for each',
        'Note variations within positions',
        'Identify relationships between positions',
        'Map the conceptual landscape',
        'Save positions identification to output directory'
      ],
      outputFormat: 'JSON with positions (name, proponents, arguments, variations), relationships, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['positions', 'artifacts'],
      properties: {
        positions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              proponents: { type: 'array', items: { type: 'string' } },
              mainArguments: { type: 'array', items: { type: 'string' } },
              variations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        relationships: { type: 'array', items: { type: 'string' } },
        conceptualMap: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'literature-review', 'positions']
}));

export const debatesMappingTask = defineTask('debates-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map key debates',
  agent: {
    name: 'debates-mapper',
    prompt: {
      role: 'philosophical researcher',
      task: 'Map the key debates in the literature',
      context: args,
      instructions: [
        'Identify major debates between positions',
        'Characterize what is at stake in each',
        'Identify key arguments on each side',
        'Note the current state of each debate',
        'Identify any resolved debates',
        'Note ongoing unresolved debates',
        'Identify emerging debates',
        'Save debates mapping to output directory'
      ],
      outputFormat: 'JSON with debates (topic, sides, arguments, state), resolved, emerging, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['debates', 'artifacts'],
      properties: {
        debates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              stakes: { type: 'string' },
              sides: { type: 'array', items: { type: 'string' } },
              keyArguments: { type: 'object' },
              currentState: { type: 'string' }
            }
          }
        },
        resolved: { type: 'array', items: { type: 'string' } },
        emerging: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'literature-review', 'debates']
}));

export const historicalTracingTask = defineTask('historical-tracing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace historical development',
  agent: {
    name: 'history-tracer',
    prompt: {
      role: 'philosophical researcher',
      task: 'Trace the historical development of the topic',
      context: args,
      instructions: [
        'Identify the origins of the topic',
        'Trace key developments over time',
        'Identify turning points or paradigm shifts',
        'Note influential works and thinkers',
        'Map the evolution of positions',
        'Identify contemporary trends',
        'Create historical narrative',
        'Save historical tracing to output directory'
      ],
      outputFormat: 'JSON with development (origins, timeline, turningPoints, influences, trends), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['development', 'artifacts'],
      properties: {
        development: {
          type: 'object',
          properties: {
            origins: { type: 'string' },
            timeline: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  period: { type: 'string' },
                  developments: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            turningPoints: { type: 'array', items: { type: 'string' } },
            influentialWorks: { type: 'array', items: { type: 'string' } },
            contemporaryTrends: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'literature-review', 'history']
}));

export const gapIdentificationTask = defineTask('gap-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify gaps in literature',
  agent: {
    name: 'gap-identifier',
    prompt: {
      role: 'philosophical researcher',
      task: 'Identify gaps and opportunities in the literature',
      context: args,
      instructions: [
        'Identify unanswered questions',
        'Note underexplored areas',
        'Identify methodological gaps',
        'Note missing connections',
        'Identify opportunities for contribution',
        'Assess importance of each gap',
        'Prioritize gaps for future research',
        'Save gap identification to output directory'
      ],
      outputFormat: 'JSON with gaps (description, type, importance, opportunity), priorities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'artifacts'],
      properties: {
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              type: { type: 'string' },
              importance: { type: 'string' },
              opportunity: { type: 'string' }
            }
          }
        },
        priorities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'literature-review', 'gaps']
}));

export const synthesisDevelopmentTask = defineTask('synthesis-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop synthesis',
  agent: {
    name: 'synthesis-developer',
    prompt: {
      role: 'philosophical researcher',
      task: 'Develop a synthesis of the literature',
      context: args,
      instructions: [
        'Integrate all findings into coherent narrative',
        'Present the state of the field',
        'Highlight key insights',
        'Note areas of consensus',
        'Note areas of disagreement',
        'Assess overall progress on the topic',
        'Provide recommendations for future research',
        'Save synthesis to output directory'
      ],
      outputFormat: 'JSON with synthesis (narrative, stateOfField, insights, consensus, disagreement, progress), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'artifacts'],
      properties: {
        synthesis: {
          type: 'object',
          properties: {
            narrative: { type: 'string' },
            stateOfField: { type: 'string' },
            keyInsights: { type: 'array', items: { type: 'string' } },
            consensus: { type: 'array', items: { type: 'string' } },
            disagreement: { type: 'array', items: { type: 'string' } },
            progress: { type: 'string' },
            recommendations: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'literature-review', 'synthesis']
}));

export const literatureReportTask = defineTask('literature-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate literature review report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'philosophical researcher and technical writer',
      task: 'Generate comprehensive literature review report',
      context: args,
      instructions: [
        'Create executive summary',
        'Present topic scope and methodology',
        'Document major positions',
        'Present key debates',
        'Include historical development',
        'Identify gaps and opportunities',
        'Present synthesis',
        'Include recommendations',
        'Format as scholarly literature review',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath, summary, keyFindings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'literature-review', 'reporting']
}));
