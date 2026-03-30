/**
 * @process education/curriculum-mapping
 * @description Visual documentation of curriculum including content, skills, assessments, and resources organized by time and subject to identify gaps and redundancies (Jacobs Model)
 * @inputs { curriculumData: object, timeframe: string, subjects: array, gradeLevel: string, context: object }
 * @outputs { success: boolean, curriculumMap: object, gapAnalysis: object, redundancyAnalysis: object, artifacts: array }
 * @recommendedSkills SK-EDU-008 (standards-alignment-mapping), SK-EDU-015 (curriculum-gap-analysis)
 * @recommendedAgents AG-EDU-002 (curriculum-development-specialist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    curriculumData = {},
    timeframe = 'year',
    subjects = [],
    gradeLevel = '',
    context = {},
    outputDir = 'curriculum-mapping-output',
    qualityThreshold = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Curriculum Mapping (Jacobs Model) for Grade ${gradeLevel}`);

  // ============================================================================
  // CONTENT MAPPING
  // ============================================================================

  ctx.log('info', 'Mapping curriculum content by time and subject');
  const contentMapping = await ctx.task(contentMappingTask, {
    curriculumData,
    timeframe,
    subjects,
    gradeLevel,
    outputDir
  });

  artifacts.push(...contentMapping.artifacts);

  // ============================================================================
  // SKILLS MAPPING
  // ============================================================================

  ctx.log('info', 'Mapping skills across curriculum');
  const skillsMapping = await ctx.task(skillsMappingTask, {
    curriculumData,
    subjects,
    gradeLevel,
    outputDir
  });

  artifacts.push(...skillsMapping.artifacts);

  // ============================================================================
  // ASSESSMENT MAPPING
  // ============================================================================

  ctx.log('info', 'Mapping assessments across curriculum');
  const assessmentMapping = await ctx.task(assessmentMappingTask, {
    curriculumData,
    subjects,
    gradeLevel,
    outputDir
  });

  artifacts.push(...assessmentMapping.artifacts);

  // ============================================================================
  // RESOURCES MAPPING
  // ============================================================================

  ctx.log('info', 'Mapping resources and materials');
  const resourcesMapping = await ctx.task(resourcesMappingTask, {
    curriculumData,
    subjects,
    outputDir
  });

  artifacts.push(...resourcesMapping.artifacts);

  // ============================================================================
  // GAP ANALYSIS
  // ============================================================================

  ctx.log('info', 'Analyzing curriculum gaps');
  const gapAnalysis = await ctx.task(curriculumGapAnalysisTask, {
    contentMapping,
    skillsMapping,
    assessmentMapping,
    subjects,
    gradeLevel,
    outputDir
  });

  artifacts.push(...gapAnalysis.artifacts);

  // ============================================================================
  // REDUNDANCY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Analyzing curriculum redundancies');
  const redundancyAnalysis = await ctx.task(redundancyAnalysisTask, {
    contentMapping,
    skillsMapping,
    subjects,
    outputDir
  });

  artifacts.push(...redundancyAnalysis.artifacts);

  // ============================================================================
  // INTEGRATION OPPORTUNITIES
  // ============================================================================

  ctx.log('info', 'Identifying integration opportunities');
  const integrationOpportunities = await ctx.task(integrationOpportunitiesTask, {
    contentMapping,
    skillsMapping,
    subjects,
    context,
    outputDir
  });

  artifacts.push(...integrationOpportunities.artifacts);

  // ============================================================================
  // GENERATE VISUAL CURRICULUM MAP
  // ============================================================================

  ctx.log('info', 'Generating visual curriculum map');
  const visualMap = await ctx.task(visualCurriculumMapTask, {
    contentMapping,
    skillsMapping,
    assessmentMapping,
    resourcesMapping,
    timeframe,
    subjects,
    gradeLevel,
    outputDir
  });

  artifacts.push(...visualMap.artifacts);

  // ============================================================================
  // QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Scoring curriculum mapping quality');
  const qualityScore = await ctx.task(mappingQualityScoringTask, {
    contentMapping,
    skillsMapping,
    assessmentMapping,
    gapAnalysis,
    redundancyAnalysis,
    qualityThreshold,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= qualityThreshold;

  // Breakpoint: Review curriculum map
  await ctx.breakpoint({
    question: `Curriculum mapping complete. Quality score: ${overallScore}/${qualityThreshold}. ${qualityMet ? 'Quality standards met!' : 'Issues identified - review recommended.'} Review and approve?`,
    title: 'Curriculum Mapping Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        overallScore,
        qualityMet,
        gradeLevel,
        subjectCount: subjects.length,
        gaps: gapAnalysis.totalGaps,
        redundancies: redundancyAnalysis.totalRedundancies,
        totalArtifacts: artifacts.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    gradeLevel,
    qualityScore: overallScore,
    qualityMet,
    curriculumMap: {
      content: contentMapping.map,
      skills: skillsMapping.map,
      assessments: assessmentMapping.map,
      resources: resourcesMapping.map
    },
    gapAnalysis: {
      contentGaps: gapAnalysis.contentGaps,
      skillGaps: gapAnalysis.skillGaps,
      assessmentGaps: gapAnalysis.assessmentGaps,
      totalGaps: gapAnalysis.totalGaps
    },
    redundancyAnalysis: {
      contentRedundancies: redundancyAnalysis.contentRedundancies,
      skillRedundancies: redundancyAnalysis.skillRedundancies,
      totalRedundancies: redundancyAnalysis.totalRedundancies
    },
    integrationOpportunities: integrationOpportunities.opportunities,
    visualMap: visualMap.map,
    artifacts,
    duration,
    metadata: {
      processId: 'education/curriculum-mapping',
      timestamp: startTime,
      gradeLevel,
      subjects,
      outputDir
    }
  };
}

// Task 1: Content Mapping
export const contentMappingTask = defineTask('content-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map curriculum content by time and subject',
  agent: {
    name: 'content-mapper',
    prompt: {
      role: 'curriculum content specialist',
      task: 'Create comprehensive content map organized by time and subject',
      context: args,
      instructions: [
        'Extract all content topics from curriculum data',
        'Organize content by subject area',
        'Map content to timeline (quarters, months, weeks)',
        'Identify content themes and big ideas',
        'Document content sequences and dependencies',
        'Note content that spans multiple time periods',
        'Create content matrix visualization',
        'Document essential vs supplementary content',
        'Generate content mapping document'
      ],
      outputFormat: 'JSON with map, timeline, themes, sequences, matrix, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['map', 'timeline', 'artifacts'],
      properties: {
        map: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              subject: { type: 'string' },
              unit: { type: 'string' },
              topics: { type: 'array', items: { type: 'string' } },
              timeframe: { type: 'string' },
              duration: { type: 'string' }
            }
          }
        },
        timeline: { type: 'object' },
        themes: { type: 'array', items: { type: 'string' } },
        sequences: { type: 'array' },
        matrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'curriculum-mapping', 'content', 'jacobs']
}));

// Task 2: Skills Mapping
export const skillsMappingTask = defineTask('skills-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map skills across curriculum',
  agent: {
    name: 'skills-mapper',
    prompt: {
      role: 'skills development specialist',
      task: 'Map skills development across curriculum',
      context: args,
      instructions: [
        'Extract all skills from curriculum data',
        'Categorize skills (cognitive, procedural, metacognitive)',
        'Map skills to specific content and subjects',
        'Identify skill progression across time',
        'Document skill prerequisites and dependencies',
        'Identify cross-curricular skills',
        'Create skills matrix by subject and time',
        'Note skill mastery expectations',
        'Generate skills mapping document'
      ],
      outputFormat: 'JSON with map, categories, progression, crossCurricular, matrix, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['map', 'categories', 'artifacts'],
      properties: {
        map: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              skill: { type: 'string' },
              category: { type: 'string' },
              subjects: { type: 'array', items: { type: 'string' } },
              timeframe: { type: 'string' },
              masteryLevel: { type: 'string' }
            }
          }
        },
        categories: {
          type: 'object',
          properties: {
            cognitive: { type: 'array' },
            procedural: { type: 'array' },
            metacognitive: { type: 'array' }
          }
        },
        progression: { type: 'array' },
        crossCurricular: { type: 'array' },
        matrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'curriculum-mapping', 'skills', 'jacobs']
}));

// Task 3: Assessment Mapping
export const assessmentMappingTask = defineTask('assessment-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map assessments across curriculum',
  agent: {
    name: 'assessment-mapper',
    prompt: {
      role: 'assessment specialist',
      task: 'Map assessments across curriculum',
      context: args,
      instructions: [
        'Extract all assessments from curriculum data',
        'Categorize assessments (formative, summative, benchmark)',
        'Map assessments to content and skills',
        'Document assessment timing and frequency',
        'Identify assessment methods and formats',
        'Note grading and feedback practices',
        'Create assessment calendar',
        'Document assessment alignment to standards',
        'Generate assessment mapping document'
      ],
      outputFormat: 'JSON with map, types, calendar, alignment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['map', 'types', 'artifacts'],
      properties: {
        map: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assessment: { type: 'string' },
              type: { type: 'string' },
              subject: { type: 'string' },
              content: { type: 'array', items: { type: 'string' } },
              skills: { type: 'array', items: { type: 'string' } },
              timing: { type: 'string' }
            }
          }
        },
        types: {
          type: 'object',
          properties: {
            formative: { type: 'array' },
            summative: { type: 'array' },
            benchmark: { type: 'array' }
          }
        },
        calendar: { type: 'object' },
        alignment: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'curriculum-mapping', 'assessment', 'jacobs']
}));

// Task 4: Resources Mapping
export const resourcesMappingTask = defineTask('resources-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map resources and materials',
  agent: {
    name: 'resources-mapper',
    prompt: {
      role: 'instructional resources specialist',
      task: 'Map instructional resources and materials across curriculum',
      context: args,
      instructions: [
        'Extract all resources from curriculum data',
        'Categorize resources (textbooks, digital, manipulatives)',
        'Map resources to content and subjects',
        'Document resource availability and access',
        'Identify resource gaps and needs',
        'Note technology requirements',
        'Create resource inventory',
        'Document resource sharing opportunities',
        'Generate resources mapping document'
      ],
      outputFormat: 'JSON with map, categories, inventory, gaps, sharingOpportunities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['map', 'categories', 'artifacts'],
      properties: {
        map: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource: { type: 'string' },
              type: { type: 'string' },
              subjects: { type: 'array', items: { type: 'string' } },
              availability: { type: 'string' }
            }
          }
        },
        categories: {
          type: 'object',
          properties: {
            textbooks: { type: 'array' },
            digital: { type: 'array' },
            manipulatives: { type: 'array' },
            other: { type: 'array' }
          }
        },
        inventory: { type: 'object' },
        gaps: { type: 'array' },
        sharingOpportunities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'curriculum-mapping', 'resources', 'jacobs']
}));

// Task 5: Gap Analysis
export const curriculumGapAnalysisTask = defineTask('curriculum-gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze curriculum gaps',
  agent: {
    name: 'gap-analyst',
    prompt: {
      role: 'curriculum analyst',
      task: 'Identify gaps in curriculum coverage',
      context: args,
      instructions: [
        'Identify content areas not covered',
        'Find skills not addressed in curriculum',
        'Identify assessment gaps',
        'Note time periods with insufficient instruction',
        'Document missing prerequisite content',
        'Identify gaps in cross-curricular connections',
        'Quantify gap severity',
        'Create gap visualization',
        'Generate gap analysis report'
      ],
      outputFormat: 'JSON with contentGaps, skillGaps, assessmentGaps, totalGaps, severity, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['contentGaps', 'skillGaps', 'assessmentGaps', 'totalGaps', 'artifacts'],
      properties: {
        contentGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              subject: { type: 'string' },
              severity: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        skillGaps: { type: 'array' },
        assessmentGaps: { type: 'array' },
        totalGaps: { type: 'number' },
        severity: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            moderate: { type: 'number' },
            minor: { type: 'number' }
          }
        },
        gapVisualization: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'curriculum-mapping', 'gap-analysis', 'jacobs']
}));

// Task 6: Redundancy Analysis
export const redundancyAnalysisTask = defineTask('redundancy-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze curriculum redundancies',
  agent: {
    name: 'redundancy-analyst',
    prompt: {
      role: 'curriculum efficiency specialist',
      task: 'Identify redundancies and unnecessary repetition in curriculum',
      context: args,
      instructions: [
        'Identify repeated content across subjects',
        'Find unnecessary skill repetition',
        'Distinguish intentional spiral from redundancy',
        'Document overlapping units',
        'Identify assessment redundancies',
        'Calculate time lost to redundancy',
        'Recommend consolidation opportunities',
        'Create redundancy visualization',
        'Generate redundancy analysis report'
      ],
      outputFormat: 'JSON with contentRedundancies, skillRedundancies, totalRedundancies, timeLost, consolidationOpportunities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['contentRedundancies', 'skillRedundancies', 'totalRedundancies', 'artifacts'],
      properties: {
        contentRedundancies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              content: { type: 'string' },
              occurrences: { type: 'array' },
              isIntentional: { type: 'boolean' },
              recommendation: { type: 'string' }
            }
          }
        },
        skillRedundancies: { type: 'array' },
        totalRedundancies: { type: 'number' },
        timeLost: { type: 'string' },
        consolidationOpportunities: { type: 'array' },
        redundancyVisualization: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'curriculum-mapping', 'redundancy', 'jacobs']
}));

// Task 7: Integration Opportunities
export const integrationOpportunitiesTask = defineTask('integration-opportunities', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify integration opportunities',
  agent: {
    name: 'integration-specialist',
    prompt: {
      role: 'interdisciplinary curriculum specialist',
      task: 'Identify opportunities for curriculum integration',
      context: args,
      instructions: [
        'Identify natural connections between subjects',
        'Find thematic integration opportunities',
        'Suggest interdisciplinary projects',
        'Recommend skill integration across subjects',
        'Identify timing for integrated units',
        'Document integration benefits',
        'Plan collaborative teaching opportunities',
        'Create integration roadmap',
        'Generate integration opportunities document'
      ],
      outputFormat: 'JSON with opportunities, themes, projects, benefits, roadmap, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'artifacts'],
      properties: {
        opportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              subjects: { type: 'array', items: { type: 'string' } },
              topic: { type: 'string' },
              type: { type: 'string' },
              timing: { type: 'string' },
              benefits: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        themes: { type: 'array' },
        projects: { type: 'array' },
        benefits: { type: 'array' },
        roadmap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'curriculum-mapping', 'integration', 'jacobs']
}));

// Task 8: Visual Curriculum Map
export const visualCurriculumMapTask = defineTask('visual-curriculum-map', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate visual curriculum map',
  agent: {
    name: 'visualization-designer',
    prompt: {
      role: 'curriculum visualization specialist',
      task: 'Create comprehensive visual curriculum map',
      context: args,
      instructions: [
        'Design matrix view of content by subject and time',
        'Create skills overlay visualization',
        'Add assessment markers to map',
        'Include resource annotations',
        'Show cross-curricular connections',
        'Highlight gaps and redundancies',
        'Create multiple view options (by time, by subject, by theme)',
        'Make map interactive/navigable',
        'Generate visual map documentation'
      ],
      outputFormat: 'JSON with map, views, legend, interactiveFeatures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['map', 'artifacts'],
      properties: {
        map: {
          type: 'object',
          properties: {
            format: { type: 'string' },
            location: { type: 'string' },
            dimensions: { type: 'object' }
          }
        },
        views: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              viewName: { type: 'string' },
              description: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        legend: { type: 'object' },
        interactiveFeatures: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'curriculum-mapping', 'visualization', 'jacobs']
}));

// Task 9: Quality Scoring
export const mappingQualityScoringTask = defineTask('mapping-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score curriculum mapping quality',
  agent: {
    name: 'mapping-quality-auditor',
    prompt: {
      role: 'curriculum quality auditor',
      task: 'Assess curriculum mapping quality and completeness',
      context: args,
      instructions: [
        'Evaluate content mapping completeness (weight: 25%)',
        'Assess skills mapping coverage (weight: 20%)',
        'Review assessment alignment (weight: 20%)',
        'Evaluate gap identification accuracy (weight: 20%)',
        'Assess redundancy identification (weight: 15%)',
        'Calculate weighted overall score (0-100)',
        'Identify mapping quality issues',
        'Provide improvement recommendations',
        'Validate against Jacobs model best practices'
      ],
      outputFormat: 'JSON with overallScore, componentScores, issues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            contentMapping: { type: 'number' },
            skillsMapping: { type: 'number' },
            assessmentMapping: { type: 'number' },
            gapAnalysis: { type: 'number' },
            redundancyAnalysis: { type: 'number' }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'curriculum-mapping', 'quality-scoring', 'validation']
}));
