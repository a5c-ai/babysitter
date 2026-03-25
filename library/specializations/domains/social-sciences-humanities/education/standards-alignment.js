/**
 * @process education/standards-alignment
 * @description Systematic mapping of curriculum to educational standards ensuring vertical alignment across grade levels and horizontal alignment across subjects
 * @inputs { curriculum: object, standards: array, gradeLevel: string, subject: string, context: object }
 * @outputs { success: boolean, alignmentMatrix: object, gapAnalysis: object, recommendations: array, artifacts: array }
 * @recommendedSkills SK-EDU-008 (standards-alignment-mapping), SK-EDU-015 (curriculum-gap-analysis), SK-EDU-002 (learning-objectives-writing)
 * @recommendedAgents AG-EDU-002 (curriculum-development-specialist), AG-EDU-009 (quality-assurance-coordinator)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    curriculum = {},
    standards = [],
    gradeLevel = '',
    subject = '',
    context = {},
    outputDir = 'standards-alignment-output',
    qualityThreshold = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Standards-Based Curriculum Alignment for ${subject} - Grade ${gradeLevel}`);

  // ============================================================================
  // STANDARDS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Analyzing educational standards');
  const standardsAnalysis = await ctx.task(standardsAnalysisTask, {
    standards,
    gradeLevel,
    subject,
    context,
    outputDir
  });

  artifacts.push(...standardsAnalysis.artifacts);

  // ============================================================================
  // CURRICULUM MAPPING
  // ============================================================================

  ctx.log('info', 'Mapping curriculum to standards');
  const curriculumMapping = await ctx.task(curriculumMappingTask, {
    curriculum,
    standards: standardsAnalysis.organizedStandards,
    gradeLevel,
    subject,
    outputDir
  });

  artifacts.push(...curriculumMapping.artifacts);

  // ============================================================================
  // VERTICAL ALIGNMENT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Analyzing vertical alignment across grade levels');
  const verticalAlignment = await ctx.task(verticalAlignmentTask, {
    curriculum,
    standards: standardsAnalysis.organizedStandards,
    gradeLevel,
    subject,
    outputDir
  });

  artifacts.push(...verticalAlignment.artifacts);

  // ============================================================================
  // HORIZONTAL ALIGNMENT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Analyzing horizontal alignment across subjects');
  const horizontalAlignment = await ctx.task(horizontalAlignmentTask, {
    curriculum,
    standards: standardsAnalysis.organizedStandards,
    gradeLevel,
    subject,
    context,
    outputDir
  });

  artifacts.push(...horizontalAlignment.artifacts);

  // ============================================================================
  // GAP ANALYSIS
  // ============================================================================

  ctx.log('info', 'Conducting alignment gap analysis');
  const gapAnalysis = await ctx.task(alignmentGapAnalysisTask, {
    curriculumMapping,
    verticalAlignment,
    horizontalAlignment,
    standards: standardsAnalysis.organizedStandards,
    outputDir
  });

  artifacts.push(...gapAnalysis.artifacts);

  // ============================================================================
  // ALIGNMENT RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Generating alignment recommendations');
  const alignmentRecommendations = await ctx.task(alignmentRecommendationsTask, {
    gapAnalysis,
    curriculum,
    standards: standardsAnalysis.organizedStandards,
    context,
    outputDir
  });

  artifacts.push(...alignmentRecommendations.artifacts);

  // ============================================================================
  // QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Scoring alignment quality');
  const qualityScore = await ctx.task(alignmentQualityScoringTask, {
    curriculumMapping,
    verticalAlignment,
    horizontalAlignment,
    gapAnalysis,
    qualityThreshold,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= qualityThreshold;

  // Breakpoint: Review alignment
  await ctx.breakpoint({
    question: `Standards alignment complete. Quality score: ${overallScore}/${qualityThreshold}. ${qualityMet ? 'Alignment standards met!' : 'Gaps identified - review recommended.'} Review and approve?`,
    title: 'Standards Alignment Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        overallScore,
        qualityMet,
        subject,
        gradeLevel,
        totalStandards: standards.length,
        alignedStandards: curriculumMapping.alignedCount,
        gaps: gapAnalysis.totalGaps,
        totalArtifacts: artifacts.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    subject,
    gradeLevel,
    qualityScore: overallScore,
    qualityMet,
    alignmentMatrix: {
      mapping: curriculumMapping.mapping,
      coverageRate: curriculumMapping.coverageRate,
      alignedStandards: curriculumMapping.alignedCount
    },
    verticalAlignment: {
      prerequisiteAlignment: verticalAlignment.prerequisiteAlignment,
      progressionMap: verticalAlignment.progressionMap,
      issues: verticalAlignment.issues
    },
    horizontalAlignment: {
      crossSubjectConnections: horizontalAlignment.connections,
      integrationOpportunities: horizontalAlignment.integrationOpportunities
    },
    gapAnalysis: {
      uncoveredStandards: gapAnalysis.uncoveredStandards,
      partialCoverage: gapAnalysis.partialCoverage,
      totalGaps: gapAnalysis.totalGaps
    },
    recommendations: alignmentRecommendations.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'education/standards-alignment',
      timestamp: startTime,
      subject,
      gradeLevel,
      outputDir
    }
  };
}

// Task 1: Standards Analysis
export const standardsAnalysisTask = defineTask('standards-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze educational standards',
  agent: {
    name: 'standards-analyst',
    prompt: {
      role: 'curriculum standards specialist',
      task: 'Analyze and organize educational standards for alignment',
      context: args,
      instructions: [
        'Parse and categorize all relevant standards',
        'Identify standard clusters and domains',
        'Determine cognitive levels using Bloom\'s taxonomy',
        'Identify anchor standards vs supporting standards',
        'Map standard progressions across grades',
        'Identify cross-cutting concepts',
        'Document standard dependencies',
        'Create standards reference guide',
        'Generate standards analysis document'
      ],
      outputFormat: 'JSON with organizedStandards, domains, cognitivelevels, progressions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['organizedStandards', 'domains', 'artifacts'],
      properties: {
        organizedStandards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standardId: { type: 'string' },
              description: { type: 'string' },
              domain: { type: 'string' },
              cognitiveLevel: { type: 'string' },
              gradeLevel: { type: 'string' },
              isAnchor: { type: 'boolean' }
            }
          }
        },
        domains: { type: 'array', items: { type: 'string' } },
        cognitiveLevels: { type: 'object' },
        progressions: { type: 'array' },
        crossCuttingConcepts: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'standards', 'analysis', 'curriculum']
}));

// Task 2: Curriculum Mapping
export const curriculumMappingTask = defineTask('curriculum-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map curriculum to standards',
  agent: {
    name: 'curriculum-mapper',
    prompt: {
      role: 'curriculum alignment specialist',
      task: 'Map curriculum content and activities to standards',
      context: args,
      instructions: [
        'Map each curriculum unit to relevant standards',
        'Identify primary and secondary standard alignments',
        'Document alignment strength (direct, partial, weak)',
        'Create alignment matrix visualization',
        'Calculate coverage rate for each standard',
        'Identify curriculum elements without standard alignment',
        'Document alignment justifications',
        'Create searchable alignment database',
        'Generate curriculum mapping document'
      ],
      outputFormat: 'JSON with mapping, coverageRate, alignedCount, unalignedContent, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mapping', 'coverageRate', 'alignedCount', 'artifacts'],
      properties: {
        mapping: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              curriculumUnit: { type: 'string' },
              standardId: { type: 'string' },
              alignmentType: { type: 'string', enum: ['primary', 'secondary'] },
              alignmentStrength: { type: 'string', enum: ['direct', 'partial', 'weak'] },
              justification: { type: 'string' }
            }
          }
        },
        coverageRate: { type: 'number' },
        alignedCount: { type: 'number' },
        unalignedContent: { type: 'array', items: { type: 'string' } },
        alignmentMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'standards', 'mapping', 'curriculum']
}));

// Task 3: Vertical Alignment
export const verticalAlignmentTask = defineTask('vertical-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze vertical alignment across grade levels',
  agent: {
    name: 'vertical-alignment-analyst',
    prompt: {
      role: 'K-12 curriculum coordinator',
      task: 'Analyze vertical alignment ensuring proper progression across grades',
      context: args,
      instructions: [
        'Map prerequisite skills from lower grades',
        'Identify skills that prepare for higher grades',
        'Check for appropriate cognitive level progression',
        'Identify gaps in vertical progression',
        'Check for unintended redundancies',
        'Verify spiral curriculum principles',
        'Document vertical articulation points',
        'Create vertical alignment chart',
        'Generate vertical alignment document'
      ],
      outputFormat: 'JSON with prerequisiteAlignment, progressionMap, issues, redundancies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prerequisiteAlignment', 'progressionMap', 'artifacts'],
      properties: {
        prerequisiteAlignment: {
          type: 'object',
          properties: {
            fromLowerGrades: { type: 'array' },
            toHigherGrades: { type: 'array' },
            gaps: { type: 'array' }
          }
        },
        progressionMap: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              skill: { type: 'string' },
              progression: { type: 'array' },
              cognitiveProgression: { type: 'array' }
            }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        redundancies: { type: 'array', items: { type: 'string' } },
        verticalChart: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'standards', 'vertical-alignment', 'progression']
}));

// Task 4: Horizontal Alignment
export const horizontalAlignmentTask = defineTask('horizontal-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze horizontal alignment across subjects',
  agent: {
    name: 'horizontal-alignment-analyst',
    prompt: {
      role: 'interdisciplinary curriculum specialist',
      task: 'Analyze horizontal alignment across subjects within grade level',
      context: args,
      instructions: [
        'Identify cross-subject connections and themes',
        'Map common skills across subjects',
        'Identify integration opportunities',
        'Check for timing alignment of related concepts',
        'Document interdisciplinary projects potential',
        'Identify literacy connections across subjects',
        'Map numeracy applications across subjects',
        'Create horizontal alignment matrix',
        'Generate horizontal alignment document'
      ],
      outputFormat: 'JSON with connections, integrationOpportunities, timingAlignment, interdisciplinaryProjects, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['connections', 'integrationOpportunities', 'artifacts'],
      properties: {
        connections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              subject1: { type: 'string' },
              subject2: { type: 'string' },
              connection: { type: 'string' },
              strength: { type: 'string' }
            }
          }
        },
        integrationOpportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              subjects: { type: 'array', items: { type: 'string' } },
              topic: { type: 'string' },
              activity: { type: 'string' }
            }
          }
        },
        timingAlignment: { type: 'object' },
        interdisciplinaryProjects: { type: 'array' },
        horizontalMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'standards', 'horizontal-alignment', 'interdisciplinary']
}));

// Task 5: Gap Analysis
export const alignmentGapAnalysisTask = defineTask('alignment-gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct alignment gap analysis',
  agent: {
    name: 'gap-analyst',
    prompt: {
      role: 'curriculum gap analyst',
      task: 'Identify and analyze gaps in standards alignment',
      context: args,
      instructions: [
        'Identify standards with no curriculum coverage',
        'Identify standards with partial coverage',
        'Analyze depth of knowledge gaps',
        'Identify assessment alignment gaps',
        'Quantify gap severity (critical, moderate, minor)',
        'Prioritize gaps based on impact',
        'Document gap root causes',
        'Create gap analysis visualization',
        'Generate comprehensive gap analysis report'
      ],
      outputFormat: 'JSON with uncoveredStandards, partialCoverage, totalGaps, gapSeverity, rootCauses, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['uncoveredStandards', 'partialCoverage', 'totalGaps', 'artifacts'],
      properties: {
        uncoveredStandards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standardId: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        partialCoverage: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standardId: { type: 'string' },
              currentCoverage: { type: 'string' },
              missingElements: { type: 'array' }
            }
          }
        },
        totalGaps: { type: 'number' },
        gapSeverity: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            moderate: { type: 'number' },
            minor: { type: 'number' }
          }
        },
        rootCauses: { type: 'array', items: { type: 'string' } },
        gapVisualization: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'standards', 'gap-analysis', 'alignment']
}));

// Task 6: Alignment Recommendations
export const alignmentRecommendationsTask = defineTask('alignment-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate alignment recommendations',
  agent: {
    name: 'alignment-advisor',
    prompt: {
      role: 'curriculum improvement specialist',
      task: 'Generate actionable recommendations to improve alignment',
      context: args,
      instructions: [
        'Develop recommendations for each identified gap',
        'Prioritize recommendations by impact and feasibility',
        'Suggest curriculum modifications',
        'Recommend new content development',
        'Propose instructional strategy adjustments',
        'Suggest assessment modifications',
        'Provide resource recommendations',
        'Create implementation timeline',
        'Generate recommendations document'
      ],
      outputFormat: 'JSON with recommendations, prioritization, implementationPlan, resources, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              recommendation: { type: 'string' },
              type: { type: 'string' },
              priority: { type: 'string' },
              effort: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        prioritization: {
          type: 'object',
          properties: {
            quickWins: { type: 'array' },
            majorProjects: { type: 'array' },
            longTerm: { type: 'array' }
          }
        },
        implementationPlan: { type: 'object' },
        resources: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'standards', 'recommendations', 'improvement']
}));

// Task 7: Quality Scoring
export const alignmentQualityScoringTask = defineTask('alignment-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score alignment quality',
  agent: {
    name: 'alignment-quality-auditor',
    prompt: {
      role: 'curriculum quality auditor',
      task: 'Assess overall standards alignment quality',
      context: args,
      instructions: [
        'Evaluate curriculum-standards coverage rate (weight: 30%)',
        'Assess vertical alignment quality (weight: 25%)',
        'Evaluate horizontal alignment quality (weight: 20%)',
        'Assess gap severity and quantity (weight: 25%)',
        'Calculate weighted overall score (0-100)',
        'Identify critical alignment issues',
        'Provide specific improvement priorities',
        'Validate against alignment best practices'
      ],
      outputFormat: 'JSON with overallScore, componentScores, criticalIssues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            coverageRate: { type: 'number' },
            verticalAlignment: { type: 'number' },
            horizontalAlignment: { type: 'number' },
            gapSeverity: { type: 'number' }
          }
        },
        criticalIssues: { type: 'array', items: { type: 'string' } },
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
  labels: ['agent', 'standards', 'quality-scoring', 'validation']
}));
