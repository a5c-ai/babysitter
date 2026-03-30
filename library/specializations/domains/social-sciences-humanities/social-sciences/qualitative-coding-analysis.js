/**
 * @process social-sciences/qualitative-coding-analysis
 * @description Conduct systematic qualitative data analysis using grounded theory, thematic analysis, or content analysis approaches with software tools like NVivo or Atlas.ti
 * @inputs { dataPath: string, researchQuestions: array, analyticalApproach: string, outputDir: string }
 * @outputs { success: boolean, codingScheme: object, themes: array, analysisReport: string, qualityScore: number, artifacts: array }
 * @recommendedSkills SK-SS-002 (qualitative-analysis)
 * @recommendedAgents AG-SS-002 (qualitative-research-specialist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    dataPath,
    researchQuestions = [],
    analyticalApproach = 'thematic',
    outputDir = 'qualitative-analysis-output',
    software = 'NVivo'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Qualitative Coding and Analysis process');

  // ============================================================================
  // PHASE 1: DATA PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Preparing qualitative data');
  const dataPreparation = await ctx.task(qualitativeDataPreparationTask, {
    dataPath,
    software,
    outputDir
  });

  artifacts.push(...dataPreparation.artifacts);

  // ============================================================================
  // PHASE 2: INITIAL CODING
  // ============================================================================

  ctx.log('info', 'Phase 2: Conducting initial coding');
  const initialCoding = await ctx.task(initialCodingTask, {
    dataPath,
    analyticalApproach,
    researchQuestions,
    outputDir
  });

  artifacts.push(...initialCoding.artifacts);

  // ============================================================================
  // PHASE 3: CODE REFINEMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Refining coding scheme');
  const codeRefinement = await ctx.task(codeRefinementTask, {
    initialCoding,
    analyticalApproach,
    outputDir
  });

  artifacts.push(...codeRefinement.artifacts);

  // ============================================================================
  // PHASE 4: THEME DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Developing themes');
  const themeDevelopment = await ctx.task(themeDevelopmentTask, {
    codeRefinement,
    researchQuestions,
    analyticalApproach,
    outputDir
  });

  artifacts.push(...themeDevelopment.artifacts);

  // ============================================================================
  // PHASE 5: TRUSTWORTHINESS PROCEDURES
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing trustworthiness procedures');
  const trustworthiness = await ctx.task(trustworthinessTask, {
    initialCoding,
    codeRefinement,
    themeDevelopment,
    outputDir
  });

  artifacts.push(...trustworthiness.artifacts);

  // ============================================================================
  // PHASE 6: ANALYSIS REPORT
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating analysis report');
  const analysisReport = await ctx.task(qualitativeReportTask, {
    dataPreparation,
    initialCoding,
    codeRefinement,
    themeDevelopment,
    trustworthiness,
    outputDir
  });

  artifacts.push(...analysisReport.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Scoring analysis quality');
  const qualityScore = await ctx.task(qualitativeAnalysisQualityScoringTask, {
    dataPreparation,
    initialCoding,
    codeRefinement,
    themeDevelopment,
    trustworthiness,
    analysisReport,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const analysisScore = qualityScore.overallScore;
  const qualityMet = analysisScore >= 80;

  // Breakpoint: Review qualitative analysis
  await ctx.breakpoint({
    question: `Qualitative analysis complete. Quality score: ${analysisScore}/100. ${qualityMet ? 'Analysis meets quality standards!' : 'Analysis may need refinement.'} Review and approve?`,
    title: 'Qualitative Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        analysisScore,
        qualityMet,
        analyticalApproach,
        totalCodes: codeRefinement.totalCodes,
        totalThemes: themeDevelopment.themes.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore: analysisScore,
    qualityMet,
    codingScheme: {
      totalCodes: codeRefinement.totalCodes,
      categories: codeRefinement.categories,
      codebook: codeRefinement.codebookPath
    },
    themes: themeDevelopment.themes,
    analysisReport: analysisReport.reportPath,
    trustworthiness: trustworthiness.measures,
    artifacts,
    duration,
    metadata: {
      processId: 'social-sciences/qualitative-coding-analysis',
      timestamp: startTime,
      analyticalApproach,
      software,
      outputDir
    }
  };
}

// Task 1: Data Preparation
export const qualitativeDataPreparationTask = defineTask('qualitative-data-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare qualitative data',
  agent: {
    name: 'qualitative-data-manager',
    prompt: {
      role: 'qualitative data management specialist',
      task: 'Prepare qualitative data for systematic analysis',
      context: args,
      instructions: [
        'Import and organize data into software',
        'Verify transcription quality',
        'Clean and format transcripts',
        'Anonymize participant identifiers',
        'Create document attributes and classifications',
        'Set up project structure in software',
        'Link related documents and memos',
        'Prepare data for team collaboration if needed',
        'Generate data preparation documentation'
      ],
      outputFormat: 'JSON with dataOrganization, documentCount, attributes, projectSetup, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dataOrganization', 'documentCount', 'artifacts'],
      properties: {
        dataOrganization: { type: 'object' },
        documentCount: { type: 'number' },
        attributes: { type: 'array', items: { type: 'string' } },
        projectSetup: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qualitative-analysis', 'data-preparation']
}));

// Task 2: Initial Coding
export const initialCodingTask = defineTask('initial-coding', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct initial coding',
  agent: {
    name: 'qualitative-coder',
    prompt: {
      role: 'qualitative researcher',
      task: 'Conduct systematic initial coding of qualitative data',
      context: args,
      instructions: [
        'Apply appropriate coding approach (open, descriptive, in vivo, etc.)',
        'Code data line-by-line or segment-by-segment',
        'Use constant comparison while coding',
        'Write analytic memos during coding',
        'Apply inductive and/or deductive codes',
        'Track code frequencies and coverage',
        'Identify emerging patterns during coding',
        'Document coding decisions and rationale',
        'Generate initial coding report'
      ],
      outputFormat: 'JSON with codingApproach, initialCodes, memosCreated, coverage, emergingPatterns, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['codingApproach', 'initialCodes', 'artifacts'],
      properties: {
        codingApproach: { type: 'string' },
        initialCodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              definition: { type: 'string' },
              frequency: { type: 'number' }
            }
          }
        },
        memosCreated: { type: 'number' },
        coverage: { type: 'number' },
        emergingPatterns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qualitative-analysis', 'initial-coding']
}));

// Task 3: Code Refinement
export const codeRefinementTask = defineTask('code-refinement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Refine coding scheme',
  agent: {
    name: 'coding-refinement-specialist',
    prompt: {
      role: 'senior qualitative analyst',
      task: 'Refine and organize coding scheme through focused coding',
      context: args,
      instructions: [
        'Review and consolidate initial codes',
        'Merge redundant codes',
        'Split overly broad codes',
        'Develop code hierarchy/tree structure',
        'Create parent and child codes',
        'Define clear code definitions and boundaries',
        'Develop comprehensive codebook',
        'Establish inclusion/exclusion criteria for codes',
        'Generate refined coding scheme documentation'
      ],
      outputFormat: 'JSON with totalCodes, categories, codeHierarchy, codebookPath, refinementDecisions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalCodes', 'categories', 'artifacts'],
      properties: {
        totalCodes: { type: 'number' },
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              codes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        codeHierarchy: { type: 'object' },
        codebookPath: { type: 'string' },
        refinementDecisions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qualitative-analysis', 'code-refinement']
}));

// Task 4: Theme Development
export const themeDevelopmentTask = defineTask('theme-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop themes',
  agent: {
    name: 'thematic-analyst',
    prompt: {
      role: 'qualitative analysis expert',
      task: 'Develop themes from coded data',
      context: args,
      instructions: [
        'Identify patterns across codes',
        'Group related codes into candidate themes',
        'Define each theme clearly',
        'Review themes against data (checking fit)',
        'Refine theme boundaries',
        'Name themes appropriately',
        'Identify relationships between themes',
        'Develop thematic map/diagram',
        'Select illustrative quotes for each theme',
        'Generate theme development documentation'
      ],
      outputFormat: 'JSON with themes, thematicMap, relationships, illustrativeQuotes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['themes', 'artifacts'],
      properties: {
        themes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              theme: { type: 'string' },
              definition: { type: 'string' },
              relatedCodes: { type: 'array', items: { type: 'string' } },
              illustrativeQuotes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        thematicMap: { type: 'string' },
        relationships: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qualitative-analysis', 'themes']
}));

// Task 5: Trustworthiness
export const trustworthinessTask = defineTask('trustworthiness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement trustworthiness procedures',
  agent: {
    name: 'trustworthiness-specialist',
    prompt: {
      role: 'qualitative methodology expert',
      task: 'Implement and document trustworthiness procedures',
      context: args,
      instructions: [
        'Conduct inter-coder reliability assessment',
        'Calculate agreement metrics (kappa, percent agreement)',
        'Conduct peer debriefing sessions',
        'Implement member checking procedures',
        'Maintain detailed audit trail',
        'Document reflexivity through memos',
        'Assess negative case analysis',
        'Evaluate thick description quality',
        'Generate trustworthiness documentation'
      ],
      outputFormat: 'JSON with measures, intercoderReliability, memberChecking, auditTrail, reflexivity, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['measures', 'artifacts'],
      properties: {
        measures: {
          type: 'object',
          properties: {
            credibility: { type: 'array', items: { type: 'string' } },
            transferability: { type: 'array', items: { type: 'string' } },
            dependability: { type: 'array', items: { type: 'string' } },
            confirmability: { type: 'array', items: { type: 'string' } }
          }
        },
        intercoderReliability: {
          type: 'object',
          properties: {
            kappa: { type: 'number' },
            percentAgreement: { type: 'number' }
          }
        },
        memberChecking: { type: 'object' },
        auditTrail: { type: 'string' },
        reflexivity: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qualitative-analysis', 'trustworthiness']
}));

// Task 6: Analysis Report
export const qualitativeReportTask = defineTask('qualitative-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate analysis report',
  agent: {
    name: 'qualitative-report-writer',
    prompt: {
      role: 'qualitative research writer',
      task: 'Generate comprehensive qualitative analysis report',
      context: args,
      instructions: [
        'Write methods section describing analytical approach',
        'Present findings organized by themes',
        'Include representative quotes with context',
        'Create visual representations (theme diagrams, code maps)',
        'Discuss relationships between themes',
        'Relate findings to research questions',
        'Address trustworthiness procedures',
        'Discuss limitations of the analysis',
        'Generate publication-ready findings section'
      ],
      outputFormat: 'JSON with reportPath, sections, visualizations, keyFindings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        visualizations: { type: 'array', items: { type: 'string' } },
        keyFindings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qualitative-analysis', 'report']
}));

// Task 7: Quality Scoring
export const qualitativeAnalysisQualityScoringTask = defineTask('qualitative-analysis-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score analysis quality',
  agent: {
    name: 'qualitative-quality-reviewer',
    prompt: {
      role: 'senior qualitative methodologist',
      task: 'Assess qualitative analysis quality and rigor',
      context: args,
      instructions: [
        'Evaluate data preparation completeness (weight: 10%)',
        'Assess initial coding rigor (weight: 20%)',
        'Evaluate code refinement quality (weight: 15%)',
        'Assess theme development soundness (weight: 20%)',
        'Evaluate trustworthiness procedures (weight: 20%)',
        'Assess report quality (weight: 15%)',
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
            dataPreparation: { type: 'number' },
            initialCoding: { type: 'number' },
            codeRefinement: { type: 'number' },
            themeDevelopment: { type: 'number' },
            trustworthiness: { type: 'number' },
            reportQuality: { type: 'number' }
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
  labels: ['agent', 'qualitative-analysis', 'quality-scoring']
}));
