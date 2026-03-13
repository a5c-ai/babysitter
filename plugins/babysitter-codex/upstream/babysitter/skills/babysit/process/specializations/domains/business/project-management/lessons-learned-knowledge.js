/**
 * @process specializations/domains/business/project-management/lessons-learned-knowledge
 * @description Lessons Learned and Knowledge Management - Capture project experiences, document lessons,
 * create knowledge assets, and ensure organizational learning and continuous improvement.
 * @inputs { projectName: string, projectPhase: string, experiences: array, stakeholders: array }
 * @outputs { success: boolean, lessonsDocument: object, knowledgeAssets: array, recommendations: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/project-management/lessons-learned-knowledge', {
 *   projectName: 'ERP Implementation',
 *   projectPhase: 'closeout',
 *   experiences: [{ category: 'technical', description: 'Integration challenges' }],
 *   stakeholders: [{ name: 'Project Team', role: 'contributor' }]
 * });
 *
 * @references
 * - PMI Lessons Learned: https://www.pmi.org/pmbok-guide-standards/foundational/pmbok
 * - Knowledge Management: https://www.km.gov/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    projectPhase = 'closeout',
    experiences = [],
    stakeholders = [],
    projectDocuments = [],
    metrics = {}
  } = inputs;

  // Phase 1: Experience Collection
  const experienceCollection = await ctx.task(experienceCollectionTask, {
    projectName,
    projectPhase,
    experiences,
    stakeholders
  });

  // Phase 2: Stakeholder Interviews
  const stakeholderInterviews = await ctx.task(stakeholderInterviewTask, {
    projectName,
    stakeholders,
    topics: experienceCollection.topics
  });

  // Phase 3: Data Analysis
  const dataAnalysis = await ctx.task(dataAnalysisTask, {
    projectName,
    experiences: experienceCollection.experiences,
    interviews: stakeholderInterviews,
    projectDocuments,
    metrics
  });

  // Breakpoint: Review preliminary findings
  await ctx.breakpoint({
    question: `Preliminary lessons learned analysis complete for ${projectName}. ${dataAnalysis.findings?.length || 0} findings identified. Review and validate?`,
    title: 'Findings Review',
    context: {
      runId: ctx.runId,
      projectName,
      files: [{
        path: `artifacts/preliminary-findings.json`,
        format: 'json',
        content: dataAnalysis
      }]
    }
  });

  // Phase 4: Lesson Categorization
  const lessonCategorization = await ctx.task(lessonCategorizationTask, {
    projectName,
    findings: dataAnalysis.findings
  });

  // Phase 5: Root Cause Analysis
  const rootCauseAnalysis = await ctx.task(rootCauseAnalysisTask, {
    projectName,
    lessons: lessonCategorization.lessons
  });

  // Phase 6: Recommendation Development
  const recommendations = await ctx.task(recommendationTask, {
    projectName,
    lessons: lessonCategorization.lessons,
    rootCauses: rootCauseAnalysis.rootCauses
  });

  // Phase 7: Knowledge Asset Creation
  const knowledgeAssets = await ctx.task(knowledgeAssetTask, {
    projectName,
    lessons: lessonCategorization.lessons,
    recommendations: recommendations.recommendations
  });

  // Phase 8: Dissemination Planning
  const disseminationPlan = await ctx.task(disseminationPlanTask, {
    projectName,
    knowledgeAssets: knowledgeAssets.assets,
    stakeholders
  });

  // Phase 9: Documentation and Archive
  const documentation = await ctx.task(lessonsDocumentationTask, {
    projectName,
    projectPhase,
    experienceCollection,
    stakeholderInterviews,
    dataAnalysis,
    lessonCategorization,
    rootCauseAnalysis,
    recommendations,
    knowledgeAssets,
    disseminationPlan
  });

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Lessons learned complete for ${projectName}. ${lessonCategorization.lessons?.length || 0} lessons documented, ${knowledgeAssets.assets?.length || 0} knowledge assets created. Approve and archive?`,
    title: 'Lessons Learned Approval',
    context: {
      runId: ctx.runId,
      projectName,
      files: [
        { path: `artifacts/lessons-learned.json`, format: 'json', content: documentation },
        { path: `artifacts/lessons-learned.md`, format: 'markdown', content: documentation.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    projectPhase,
    lessonsDocument: documentation,
    lessons: lessonCategorization.lessons,
    knowledgeAssets: knowledgeAssets.assets,
    recommendations: recommendations.recommendations,
    disseminationPlan: disseminationPlan,
    metadata: {
      processId: 'specializations/domains/business/project-management/lessons-learned-knowledge',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const experienceCollectionTask = defineTask('experience-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Experience Collection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Knowledge Manager',
      task: 'Collect project experiences',
      context: {
        projectName: args.projectName,
        projectPhase: args.projectPhase,
        experiences: args.experiences,
        stakeholders: args.stakeholders
      },
      instructions: [
        '1. Design collection process',
        '2. Create experience templates',
        '3. Gather written submissions',
        '4. Conduct team workshops',
        '5. Review project documentation',
        '6. Collect success stories',
        '7. Document challenges',
        '8. Identify key topics',
        '9. Validate experiences',
        '10. Compile experience inventory'
      ],
      outputFormat: 'JSON object with collected experiences'
    },
    outputSchema: {
      type: 'object',
      required: ['experiences', 'topics'],
      properties: {
        experiences: { type: 'array' },
        topics: { type: 'array' },
        successStories: { type: 'array' },
        challenges: { type: 'array' },
        templates: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['lessons', 'collection', 'experience']
}));

export const stakeholderInterviewTask = defineTask('stakeholder-interviews', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Stakeholder Interviews - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Interview Facilitator',
      task: 'Conduct stakeholder interviews',
      context: {
        projectName: args.projectName,
        stakeholders: args.stakeholders,
        topics: args.topics
      },
      instructions: [
        '1. Identify key interviewees',
        '2. Develop interview guides',
        '3. Schedule interviews',
        '4. Conduct interviews',
        '5. Document responses',
        '6. Probe for details',
        '7. Capture different perspectives',
        '8. Note patterns',
        '9. Validate findings',
        '10. Compile interview results'
      ],
      outputFormat: 'JSON object with interview results'
    },
    outputSchema: {
      type: 'object',
      required: ['interviews'],
      properties: {
        interviews: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              interviewee: { type: 'string' },
              role: { type: 'string' },
              keyPoints: { type: 'array' },
              recommendations: { type: 'array' }
            }
          }
        },
        patterns: { type: 'array' },
        perspectives: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['lessons', 'interviews', 'stakeholder']
}));

export const dataAnalysisTask = defineTask('data-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Data Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Analyst',
      task: 'Analyze collected data',
      context: {
        projectName: args.projectName,
        experiences: args.experiences,
        interviews: args.interviews,
        projectDocuments: args.projectDocuments,
        metrics: args.metrics
      },
      instructions: [
        '1. Aggregate all data',
        '2. Identify themes',
        '3. Analyze patterns',
        '4. Correlate with metrics',
        '5. Identify gaps',
        '6. Assess impact',
        '7. Quantify where possible',
        '8. Prioritize findings',
        '9. Validate analysis',
        '10. Compile findings'
      ],
      outputFormat: 'JSON object with analysis findings'
    },
    outputSchema: {
      type: 'object',
      required: ['findings'],
      properties: {
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              theme: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string' },
              evidence: { type: 'array' }
            }
          }
        },
        themes: { type: 'array' },
        patterns: { type: 'array' },
        metricCorrelations: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['lessons', 'analysis', 'data']
}));

export const lessonCategorizationTask = defineTask('lesson-categorization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Lesson Categorization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Knowledge Curator',
      task: 'Categorize lessons learned',
      context: {
        projectName: args.projectName,
        findings: args.findings
      },
      instructions: [
        '1. Define categories',
        '2. Classify each finding',
        '3. Identify positive lessons',
        '4. Identify negative lessons',
        '5. Distinguish lessons from observations',
        '6. Rate significance',
        '7. Assess applicability',
        '8. Tag for searchability',
        '9. Link related lessons',
        '10. Compile categorized lessons'
      ],
      outputFormat: 'JSON object with categorized lessons'
    },
    outputSchema: {
      type: 'object',
      required: ['lessons'],
      properties: {
        lessons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              category: { type: 'string' },
              type: { type: 'string', enum: ['positive', 'negative'] },
              significance: { type: 'string' },
              applicability: { type: 'array' }
            }
          }
        },
        categories: { type: 'array' },
        positiveLessons: { type: 'array' },
        negativeLessons: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['lessons', 'categorization', 'classification']
}));

export const rootCauseAnalysisTask = defineTask('root-cause-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Root Cause Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Root Cause Analyst',
      task: 'Analyze root causes of lessons',
      context: {
        projectName: args.projectName,
        lessons: args.lessons
      },
      instructions: [
        '1. Select lessons for analysis',
        '2. Apply 5 Whys technique',
        '3. Create cause-effect diagrams',
        '4. Identify systemic issues',
        '5. Distinguish symptoms from causes',
        '6. Identify contributing factors',
        '7. Assess organizational factors',
        '8. Document root causes',
        '9. Validate findings',
        '10. Compile root cause analysis'
      ],
      outputFormat: 'JSON object with root cause analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['rootCauses'],
      properties: {
        rootCauses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              lessonId: { type: 'string' },
              rootCause: { type: 'string' },
              contributingFactors: { type: 'array' },
              systemicIssues: { type: 'array' }
            }
          }
        },
        causeEffectDiagrams: { type: 'array' },
        systemicIssues: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['lessons', 'rootcause', 'analysis']
}));

export const recommendationTask = defineTask('recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Recommendations - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Improvement Advisor',
      task: 'Develop recommendations from lessons',
      context: {
        projectName: args.projectName,
        lessons: args.lessons,
        rootCauses: args.rootCauses
      },
      instructions: [
        '1. Derive recommendations',
        '2. Link to root causes',
        '3. Define action items',
        '4. Assign ownership',
        '5. Set implementation timeline',
        '6. Estimate effort/cost',
        '7. Prioritize recommendations',
        '8. Define success measures',
        '9. Identify dependencies',
        '10. Compile recommendations'
      ],
      outputFormat: 'JSON object with recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              lessonIds: { type: 'array' },
              priority: { type: 'string' },
              actions: { type: 'array' },
              successMeasures: { type: 'array' }
            }
          }
        },
        implementationPlan: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['lessons', 'recommendations', 'improvement']
}));

export const knowledgeAssetTask = defineTask('knowledge-assets', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Knowledge Assets - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Knowledge Manager',
      task: 'Create knowledge assets',
      context: {
        projectName: args.projectName,
        lessons: args.lessons,
        recommendations: args.recommendations
      },
      instructions: [
        '1. Identify asset types needed',
        '2. Create templates',
        '3. Develop checklists',
        '4. Create process guides',
        '5. Develop training materials',
        '6. Create case studies',
        '7. Build FAQ documents',
        '8. Develop best practice guides',
        '9. Create reference materials',
        '10. Compile knowledge assets'
      ],
      outputFormat: 'JSON object with knowledge assets'
    },
    outputSchema: {
      type: 'object',
      required: ['assets'],
      properties: {
        assets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              content: { type: 'string' },
              tags: { type: 'array' }
            }
          }
        },
        templates: { type: 'array' },
        checklists: { type: 'array' },
        guides: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['lessons', 'knowledge', 'assets']
}));

export const disseminationPlanTask = defineTask('dissemination-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Dissemination Plan - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Communications Planner',
      task: 'Plan knowledge dissemination',
      context: {
        projectName: args.projectName,
        knowledgeAssets: args.knowledgeAssets,
        stakeholders: args.stakeholders
      },
      instructions: [
        '1. Identify target audiences',
        '2. Select dissemination channels',
        '3. Plan presentations',
        '4. Schedule training sessions',
        '5. Create communication materials',
        '6. Plan repository updates',
        '7. Define feedback mechanisms',
        '8. Schedule follow-ups',
        '9. Define success measures',
        '10. Compile dissemination plan'
      ],
      outputFormat: 'JSON object with dissemination plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan'],
      properties: {
        plan: { type: 'object' },
        audiences: { type: 'array' },
        channels: { type: 'array' },
        schedule: { type: 'array' },
        feedbackMechanisms: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['lessons', 'dissemination', 'communication']
}));

export const lessonsDocumentationTask = defineTask('lessons-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Lessons Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Documentation Specialist',
      task: 'Compile lessons learned documentation',
      context: {
        projectName: args.projectName,
        projectPhase: args.projectPhase,
        experienceCollection: args.experienceCollection,
        stakeholderInterviews: args.stakeholderInterviews,
        dataAnalysis: args.dataAnalysis,
        lessonCategorization: args.lessonCategorization,
        rootCauseAnalysis: args.rootCauseAnalysis,
        recommendations: args.recommendations,
        knowledgeAssets: args.knowledgeAssets,
        disseminationPlan: args.disseminationPlan
      },
      instructions: [
        '1. Compile executive summary',
        '2. Document methodology',
        '3. Present all lessons',
        '4. Include root cause analysis',
        '5. Document recommendations',
        '6. List knowledge assets',
        '7. Generate markdown report',
        '8. Add visualizations',
        '9. Include appendices',
        '10. Finalize documentation'
      ],
      outputFormat: 'JSON object with lessons documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'markdown'],
      properties: {
        documentation: { type: 'object' },
        markdown: { type: 'string' },
        executiveSummary: { type: 'string' },
        methodology: { type: 'string' },
        appendices: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['lessons', 'documentation', 'deliverable']
}));
