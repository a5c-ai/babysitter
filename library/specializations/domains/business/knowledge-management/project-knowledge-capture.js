/**
 * @process domains/business/knowledge-management/project-knowledge-capture
 * @description Systematically capture knowledge generated during projects including decisions, solutions, challenges, and outcomes for future reference and reuse
 * @specialization Knowledge Management
 * @category Knowledge Capture and Documentation
 * @inputs { projectContext: object, projectPhase: string, captureScope: object, stakeholders: array, outputDir: string }
 * @outputs { success: boolean, capturedKnowledge: array, lessonsLearned: array, reusableAssets: array, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectContext = {},
    projectPhase = 'completion',
    captureScope = {
      decisions: true,
      solutions: true,
      challenges: true,
      outcomes: true,
      processImprovements: true
    },
    stakeholders = [],
    existingDocumentation = [],
    archiveRequirements = {
      retentionPeriod: '7 years',
      accessLevel: 'internal',
      searchable: true
    },
    outputDir = 'project-knowledge-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Project Knowledge Capture and Archiving Process');

  // ============================================================================
  // PHASE 1: PROJECT KNOWLEDGE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing project knowledge landscape');
  const knowledgeAssessment = await ctx.task(knowledgeAssessmentTask, {
    projectContext,
    projectPhase,
    captureScope,
    existingDocumentation,
    outputDir
  });

  artifacts.push(...knowledgeAssessment.artifacts);

  // Breakpoint: Review knowledge assessment
  await ctx.breakpoint({
    question: `Identified ${knowledgeAssessment.knowledgeAreas.length} knowledge areas for capture. Review assessment?`,
    title: 'Knowledge Assessment Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        projectName: projectContext.name,
        knowledgeAreas: knowledgeAssessment.knowledgeAreas.length,
        captureComplexity: knowledgeAssessment.captureComplexity
      }
    }
  });

  // ============================================================================
  // PHASE 2: DECISION CAPTURE
  // ============================================================================

  ctx.log('info', 'Phase 2: Capturing project decisions');
  const decisionCapture = await ctx.task(decisionCaptureTask, {
    projectContext,
    existingDocumentation,
    stakeholders,
    outputDir
  });

  artifacts.push(...decisionCapture.artifacts);

  // ============================================================================
  // PHASE 3: SOLUTION AND APPROACH DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Documenting solutions and approaches');
  const solutionDocumentation = await ctx.task(solutionDocumentationTask, {
    projectContext,
    decisions: decisionCapture.decisions,
    outputDir
  });

  artifacts.push(...solutionDocumentation.artifacts);

  // Breakpoint: Review captured knowledge
  await ctx.breakpoint({
    question: `Captured ${decisionCapture.decisions.length} decisions and ${solutionDocumentation.solutions.length} solutions. Review?`,
    title: 'Knowledge Capture Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        decisionsCapture: decisionCapture.decisions.length,
        solutionsDocumented: solutionDocumentation.solutions.length
      }
    }
  });

  // ============================================================================
  // PHASE 4: CHALLENGES AND ISSUES DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Documenting challenges and issues');
  const challengeDocumentation = await ctx.task(challengeDocumentationTask, {
    projectContext,
    solutions: solutionDocumentation.solutions,
    outputDir
  });

  artifacts.push(...challengeDocumentation.artifacts);

  // ============================================================================
  // PHASE 5: OUTCOMES AND RESULTS CAPTURE
  // ============================================================================

  ctx.log('info', 'Phase 5: Capturing outcomes and results');
  const outcomeCapture = await ctx.task(outcomeCaptureTask, {
    projectContext,
    projectPhase,
    outputDir
  });

  artifacts.push(...outcomeCapture.artifacts);

  // ============================================================================
  // PHASE 6: LESSONS LEARNED EXTRACTION
  // ============================================================================

  ctx.log('info', 'Phase 6: Extracting lessons learned');
  const lessonsExtraction = await ctx.task(lessonsExtractionTask, {
    projectContext,
    decisions: decisionCapture.decisions,
    solutions: solutionDocumentation.solutions,
    challenges: challengeDocumentation.challenges,
    outcomes: outcomeCapture.outcomes,
    outputDir
  });

  artifacts.push(...lessonsExtraction.artifacts);

  // ============================================================================
  // PHASE 7: REUSABLE ASSET IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Identifying reusable assets');
  const reusableAssets = await ctx.task(reusableAssetIdentificationTask, {
    projectContext,
    solutions: solutionDocumentation.solutions,
    lessonsLearned: lessonsExtraction.lessonsLearned,
    outputDir
  });

  artifacts.push(...reusableAssets.artifacts);

  // ============================================================================
  // PHASE 8: KNOWLEDGE ORGANIZATION AND TAGGING
  // ============================================================================

  ctx.log('info', 'Phase 8: Organizing and tagging knowledge');
  const knowledgeOrganization = await ctx.task(knowledgeOrganizationTask, {
    capturedKnowledge: {
      decisions: decisionCapture.decisions,
      solutions: solutionDocumentation.solutions,
      challenges: challengeDocumentation.challenges,
      outcomes: outcomeCapture.outcomes,
      lessonsLearned: lessonsExtraction.lessonsLearned,
      reusableAssets: reusableAssets.assets
    },
    archiveRequirements,
    outputDir
  });

  artifacts.push(...knowledgeOrganization.artifacts);

  // ============================================================================
  // PHASE 9: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 9: Assessing capture quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, {
    knowledgeAssessment,
    decisionCapture,
    solutionDocumentation,
    challengeDocumentation,
    outcomeCapture,
    lessonsExtraction,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  // ============================================================================
  // PHASE 10: STAKEHOLDER REVIEW (IF REQUIRED)
  // ============================================================================

  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 10: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, {
      projectContext,
      capturedKnowledge: knowledgeOrganization.organizedKnowledge,
      lessonsLearned: lessonsExtraction.lessonsLearned,
      reusableAssets: reusableAssets.assets,
      qualityScore: qualityAssessment.overallScore,
      outputDir
    });

    artifacts.push(...reviewResult.artifacts);

    // Breakpoint: Final approval gate
    await ctx.breakpoint({
      question: `Stakeholder review complete. ${reviewResult.approved ? 'Approved!' : 'Requires revisions.'} Finalize capture?`,
      title: 'Final Approval Gate',
      context: {
        runId: ctx.runId,
        files: artifacts.map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          language: a.language || undefined,
          label: a.label || undefined
        })),
        summary: {
          approved: reviewResult.approved,
          qualityScore: qualityAssessment.overallScore,
          lessonsLearned: lessonsExtraction.lessonsLearned.length,
          reusableAssets: reusableAssets.assets.length
        }
      }
    });
  }

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectContext,
    capturedKnowledge: {
      decisions: decisionCapture.decisions,
      solutions: solutionDocumentation.solutions,
      challenges: challengeDocumentation.challenges,
      outcomes: outcomeCapture.outcomes
    },
    lessonsLearned: lessonsExtraction.lessonsLearned,
    reusableAssets: reusableAssets.assets,
    statistics: {
      decisionsCaptures: decisionCapture.decisions.length,
      solutionsDocumented: solutionDocumentation.solutions.length,
      challengesDocumented: challengeDocumentation.challenges.length,
      lessonsExtracted: lessonsExtraction.lessonsLearned.length,
      reusableAssetsIdentified: reusableAssets.assets.length
    },
    qualityScore: qualityAssessment.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/business/knowledge-management/project-knowledge-capture',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Knowledge Assessment
export const knowledgeAssessmentTask = defineTask('knowledge-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess project knowledge landscape',
  agent: {
    name: 'knowledge-analyst',
    prompt: {
      role: 'project knowledge analyst',
      task: 'Assess the knowledge landscape of the project',
      context: args,
      instructions: [
        'Analyze project context and phase',
        'Identify knowledge areas for capture:',
        '  - Technical knowledge',
        '  - Process knowledge',
        '  - Domain knowledge',
        '  - Organizational knowledge',
        'Assess existing documentation coverage',
        'Identify knowledge holders and sources',
        'Evaluate capture complexity',
        'Define capture priorities',
        'Save knowledge assessment to output directory'
      ],
      outputFormat: 'JSON with knowledgeAreas (array), documentationGaps (array), captureComplexity (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['knowledgeAreas', 'captureComplexity', 'artifacts'],
      properties: {
        knowledgeAreas: { type: 'array' },
        documentationGaps: { type: 'array' },
        captureComplexity: { type: 'string', enum: ['high', 'medium', 'low'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'project', 'assessment']
}));

// Task 2: Decision Capture
export const decisionCaptureTask = defineTask('decision-capture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Capture project decisions',
  agent: {
    name: 'decision-documenter',
    prompt: {
      role: 'decision documentation specialist',
      task: 'Capture and document key project decisions',
      context: args,
      instructions: [
        'Capture key project decisions:',
        '  - Decision context and drivers',
        '  - Options considered',
        '  - Decision rationale',
        '  - Decision makers',
        '  - Implications and impacts',
        '  - Related constraints',
        'Categorize decisions by type and domain',
        'Link decisions to outcomes',
        'Document decision dependencies',
        'Save decisions to output directory'
      ],
      outputFormat: 'JSON with decisions (array), decisionCategories (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['decisions', 'artifacts'],
      properties: {
        decisions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              context: { type: 'string' },
              optionsConsidered: { type: 'array', items: { type: 'string' } },
              decision: { type: 'string' },
              rationale: { type: 'string' },
              decisionMakers: { type: 'array', items: { type: 'string' } },
              date: { type: 'string' },
              category: { type: 'string' }
            }
          }
        },
        decisionCategories: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'decisions', 'capture']
}));

// Task 3: Solution Documentation
export const solutionDocumentationTask = defineTask('solution-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document solutions and approaches',
  agent: {
    name: 'solution-documenter',
    prompt: {
      role: 'solution documentation specialist',
      task: 'Document project solutions and approaches',
      context: args,
      instructions: [
        'Document solutions and approaches:',
        '  - Problem addressed',
        '  - Solution description',
        '  - Implementation approach',
        '  - Technologies and tools used',
        '  - Configuration and setup',
        '  - Trade-offs and limitations',
        'Include diagrams and examples',
        'Document prerequisites and dependencies',
        'Assess reusability potential',
        'Save solutions to output directory'
      ],
      outputFormat: 'JSON with solutions (array), solutionCategories (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['solutions', 'artifacts'],
      properties: {
        solutions: { type: 'array' },
        solutionCategories: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'solutions', 'documentation']
}));

// Task 4: Challenge Documentation
export const challengeDocumentationTask = defineTask('challenge-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document challenges and issues',
  agent: {
    name: 'challenge-documenter',
    prompt: {
      role: 'challenge documentation specialist',
      task: 'Document project challenges and issues',
      context: args,
      instructions: [
        'Document challenges and issues:',
        '  - Challenge description',
        '  - Root cause analysis',
        '  - Impact assessment',
        '  - Resolution approach',
        '  - Resolution outcome',
        '  - Preventive measures',
        'Categorize by type and severity',
        'Link to related decisions and solutions',
        'Extract patterns and recurring issues',
        'Save challenges to output directory'
      ],
      outputFormat: 'JSON with challenges (array), patterns (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['challenges', 'artifacts'],
      properties: {
        challenges: { type: 'array' },
        patterns: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'challenges', 'documentation']
}));

// Task 5: Outcome Capture
export const outcomeCaptureTask = defineTask('outcome-capture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Capture outcomes and results',
  agent: {
    name: 'outcome-documenter',
    prompt: {
      role: 'outcome documentation specialist',
      task: 'Capture project outcomes and results',
      context: args,
      instructions: [
        'Capture project outcomes:',
        '  - Deliverables produced',
        '  - Objectives achieved',
        '  - Metrics and measurements',
        '  - Value delivered',
        '  - Stakeholder feedback',
        'Compare actual vs planned outcomes',
        'Document variances and reasons',
        'Assess success factors',
        'Save outcomes to output directory'
      ],
      outputFormat: 'JSON with outcomes (array), metrics (object), successFactors (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['outcomes', 'artifacts'],
      properties: {
        outcomes: { type: 'array' },
        metrics: { type: 'object' },
        successFactors: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'outcomes', 'capture']
}));

// Task 6: Lessons Extraction
export const lessonsExtractionTask = defineTask('lessons-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract lessons learned',
  agent: {
    name: 'lessons-analyst',
    prompt: {
      role: 'lessons learned analyst',
      task: 'Extract and document lessons learned from project',
      context: args,
      instructions: [
        'Extract lessons learned from:',
        '  - Decisions and their outcomes',
        '  - Solutions and their effectiveness',
        '  - Challenges and their resolutions',
        '  - Processes and their efficiency',
        'Categorize lessons:',
        '  - What worked well (successes)',
        '  - What did not work (failures)',
        '  - What could be improved',
        'Formulate actionable recommendations',
        'Identify applicability to future projects',
        'Save lessons learned to output directory'
      ],
      outputFormat: 'JSON with lessonsLearned (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['lessonsLearned', 'artifacts'],
      properties: {
        lessonsLearned: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              category: { type: 'string', enum: ['success', 'failure', 'improvement'] },
              description: { type: 'string' },
              context: { type: 'string' },
              recommendation: { type: 'string' },
              applicability: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'lessons-learned', 'extraction']
}));

// Task 7: Reusable Asset Identification
export const reusableAssetIdentificationTask = defineTask('reusable-asset-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify reusable assets',
  agent: {
    name: 'asset-analyst',
    prompt: {
      role: 'reusable asset analyst',
      task: 'Identify and package reusable knowledge assets',
      context: args,
      instructions: [
        'Identify reusable assets:',
        '  - Templates and frameworks',
        '  - Code and configurations',
        '  - Processes and procedures',
        '  - Designs and architectures',
        '  - Training materials',
        'Assess reusability potential',
        'Document adaptation requirements',
        'Package assets for reuse',
        'Define access and usage guidelines',
        'Save reusable assets to output directory'
      ],
      outputFormat: 'JSON with assets (array), assetCatalog (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assets', 'artifacts'],
      properties: {
        assets: { type: 'array' },
        assetCatalog: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'reusable-assets', 'identification']
}));

// Task 8: Knowledge Organization
export const knowledgeOrganizationTask = defineTask('knowledge-organization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Organize and tag knowledge',
  agent: {
    name: 'knowledge-architect',
    prompt: {
      role: 'knowledge organization architect',
      task: 'Organize and tag captured knowledge for archival',
      context: args,
      instructions: [
        'Organize captured knowledge:',
        '  - Apply taxonomy and classification',
        '  - Add metadata and tags',
        '  - Create relationships and links',
        '  - Structure for discovery',
        'Apply archive requirements',
        'Create knowledge index',
        'Define access controls',
        'Prepare for integration',
        'Save organized knowledge to output directory'
      ],
      outputFormat: 'JSON with organizedKnowledge (object), knowledgeIndex (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['organizedKnowledge', 'artifacts'],
      properties: {
        organizedKnowledge: { type: 'object' },
        knowledgeIndex: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'organization', 'archiving']
}));

// Task 9: Quality Assessment
export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess capture quality',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'knowledge quality assessor',
      task: 'Evaluate the quality of project knowledge capture',
      context: args,
      instructions: [
        'Assess capture quality:',
        '  - Completeness of coverage',
        '  - Accuracy and validity',
        '  - Clarity and usability',
        '  - Searchability and findability',
        'Calculate overall quality score',
        'Identify gaps and improvements',
        'Provide recommendations',
        'Save quality assessment to output directory'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), qualityDimensions (object), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        qualityDimensions: { type: 'object' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'quality', 'assessment']
}));

// Task 10: Stakeholder Review
export const stakeholderReviewTask = defineTask('stakeholder-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct stakeholder review',
  agent: {
    name: 'project-manager',
    prompt: {
      role: 'project manager facilitating stakeholder review',
      task: 'Coordinate stakeholder review and approval',
      context: args,
      instructions: [
        'Present captured knowledge to stakeholders',
        'Review lessons learned',
        'Present reusable assets',
        'Present quality assessment',
        'Gather stakeholder feedback',
        'Obtain approval or identify changes',
        'Document decisions and action items',
        'Save stakeholder review results to output directory'
      ],
      outputFormat: 'JSON with approved (boolean), stakeholders (array), feedback (array), actionItems (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'stakeholders', 'artifacts'],
      properties: {
        approved: { type: 'boolean' },
        stakeholders: { type: 'array', items: { type: 'string' } },
        feedback: { type: 'array' },
        actionItems: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'stakeholder-review', 'approval']
}));
