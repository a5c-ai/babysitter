/**
 * @process domains/business/knowledge-management/best-practice-documentation
 * @description Capture, document, and standardize proven practices, procedures, and methodologies for replication across the organization
 * @specialization Knowledge Management
 * @category Knowledge Capture and Documentation
 * @inputs { practiceArea: string, sourcePractices: array, targetAudience: string, standardizationGoals: object, outputDir: string }
 * @outputs { success: boolean, documentedPractices: array, standardizedProcedures: array, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    practiceArea = '',
    sourcePractices = [],
    targetAudience = 'general',
    standardizationGoals = {},
    existingDocumentation = [],
    organizationalContext = {},
    documentationStandards = {
      format: 'markdown',
      includeExamples: true,
      includeMetrics: true,
      versionControl: true
    },
    outputDir = 'best-practice-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Best Practice Documentation and Standardization Process');

  // ============================================================================
  // PHASE 1: PRACTICE IDENTIFICATION AND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Identifying and analyzing best practices');
  const practiceAnalysis = await ctx.task(practiceAnalysisTask, {
    practiceArea,
    sourcePractices,
    existingDocumentation,
    organizationalContext,
    outputDir
  });

  artifacts.push(...practiceAnalysis.artifacts);

  // Breakpoint: Review practice analysis
  await ctx.breakpoint({
    question: `Identified ${practiceAnalysis.practices.length} best practices for documentation. Review analysis?`,
    title: 'Practice Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        practiceArea,
        practicesIdentified: practiceAnalysis.practices.length,
        successFactors: practiceAnalysis.successFactors.length
      }
    }
  });

  // ============================================================================
  // PHASE 2: SUCCESS CRITERIA AND METRICS DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining success criteria and metrics');
  const successCriteria = await ctx.task(successCriteriaTask, {
    practices: practiceAnalysis.practices,
    standardizationGoals,
    organizationalContext,
    outputDir
  });

  artifacts.push(...successCriteria.artifacts);

  // ============================================================================
  // PHASE 3: PRACTICE DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Documenting best practices');
  const practiceDocumentation = await ctx.task(practiceDocumentationTask, {
    practices: practiceAnalysis.practices,
    successCriteria: successCriteria.criteria,
    targetAudience,
    documentationStandards,
    outputDir
  });

  artifacts.push(...practiceDocumentation.artifacts);

  // Breakpoint: Review documentation
  await ctx.breakpoint({
    question: `Created ${practiceDocumentation.documents.length} practice documents. Review documentation?`,
    title: 'Documentation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        documentsCreated: practiceDocumentation.documents.length,
        documentTypes: practiceDocumentation.documentTypes
      }
    }
  });

  // ============================================================================
  // PHASE 4: PROCEDURE STANDARDIZATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Standardizing procedures');
  const procedureStandardization = await ctx.task(procedureStandardizationTask, {
    documents: practiceDocumentation.documents,
    existingDocumentation,
    standardizationGoals,
    documentationStandards,
    outputDir
  });

  artifacts.push(...procedureStandardization.artifacts);

  // ============================================================================
  // PHASE 5: TEMPLATE AND CHECKLIST DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Developing templates and checklists');
  const templateDevelopment = await ctx.task(templateDevelopmentTask, {
    standardizedProcedures: procedureStandardization.standardizedProcedures,
    targetAudience,
    outputDir
  });

  artifacts.push(...templateDevelopment.artifacts);

  // ============================================================================
  // PHASE 6: EXPERT VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Validating with subject matter experts');
  const expertValidation = await ctx.task(expertValidationTask, {
    documents: practiceDocumentation.documents,
    standardizedProcedures: procedureStandardization.standardizedProcedures,
    templates: templateDevelopment.templates,
    outputDir
  });

  artifacts.push(...expertValidation.artifacts);

  // ============================================================================
  // PHASE 7: TRAINING MATERIAL DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Developing training materials');
  const trainingMaterials = await ctx.task(trainingMaterialTask, {
    documents: practiceDocumentation.documents,
    standardizedProcedures: procedureStandardization.standardizedProcedures,
    targetAudience,
    outputDir
  });

  artifacts.push(...trainingMaterials.artifacts);

  // ============================================================================
  // PHASE 8: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Assessing documentation quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, {
    practiceDocumentation,
    procedureStandardization,
    expertValidation,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  // ============================================================================
  // PHASE 9: ADOPTION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 9: Planning adoption and rollout');
  const adoptionPlan = await ctx.task(adoptionPlanningTask, {
    documents: practiceDocumentation.documents,
    standardizedProcedures: procedureStandardization.standardizedProcedures,
    trainingMaterials: trainingMaterials.materials,
    organizationalContext,
    outputDir
  });

  artifacts.push(...adoptionPlan.artifacts);

  // ============================================================================
  // PHASE 10: STAKEHOLDER REVIEW (IF REQUIRED)
  // ============================================================================

  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 10: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, {
      documents: practiceDocumentation.documents,
      standardizedProcedures: procedureStandardization.standardizedProcedures,
      qualityScore: qualityAssessment.overallScore,
      expertValidation,
      adoptionPlan,
      outputDir
    });

    artifacts.push(...reviewResult.artifacts);

    // Breakpoint: Final approval gate
    await ctx.breakpoint({
      question: `Stakeholder review complete. ${reviewResult.approved ? 'Approved!' : 'Requires revisions.'} Finalize documentation?`,
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
          documentsProduced: practiceDocumentation.documents.length
        }
      }
    });
  }

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    practiceArea,
    documentedPractices: practiceDocumentation.documents,
    standardizedProcedures: procedureStandardization.standardizedProcedures,
    templates: templateDevelopment.templates,
    trainingMaterials: trainingMaterials.materials,
    statistics: {
      practicesDocumented: practiceDocumentation.documents.length,
      proceduresStandardized: procedureStandardization.standardizedProcedures.length,
      templatesCreated: templateDevelopment.templates.length,
      trainingMaterialsCreated: trainingMaterials.materials.length
    },
    validation: {
      expertValidationScore: expertValidation.overallScore,
      validationPassed: expertValidation.overallScore >= 80,
      expertsReviewed: expertValidation.expertsReviewed
    },
    qualityScore: qualityAssessment.overallScore,
    adoptionPlan: adoptionPlan.plan,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/business/knowledge-management/best-practice-documentation',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Practice Analysis
export const practiceAnalysisTask = defineTask('practice-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify and analyze best practices',
  agent: {
    name: 'practice-analyst',
    prompt: {
      role: 'best practice analyst identifying proven practices',
      task: 'Analyze and identify best practices for documentation',
      context: args,
      instructions: [
        'Analyze source practices and identify best practices:',
        '  - Proven effectiveness and results',
        '  - Replicability across contexts',
        '  - Alignment with organizational goals',
        'For each practice identify:',
        '  - Core process or methodology',
        '  - Key success factors',
        '  - Prerequisites and dependencies',
        '  - Variations and adaptations',
        '  - Common pitfalls to avoid',
        'Categorize practices by type and domain',
        'Assess documentation readiness',
        'Identify gaps in existing documentation',
        'Save practice analysis to output directory'
      ],
      outputFormat: 'JSON with practices (array), successFactors (array), gaps (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['practices', 'successFactors', 'artifacts'],
      properties: {
        practices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              effectiveness: { type: 'string', enum: ['proven', 'emerging', 'experimental'] },
              complexity: { type: 'string', enum: ['high', 'medium', 'low'] },
              prerequisites: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        successFactors: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'practice', 'analysis']
}));

// Task 2: Success Criteria Definition
export const successCriteriaTask = defineTask('success-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define success criteria and metrics',
  agent: {
    name: 'metrics-specialist',
    prompt: {
      role: 'performance metrics specialist',
      task: 'Define success criteria and metrics for best practices',
      context: args,
      instructions: [
        'Define success criteria for each practice:',
        '  - Measurable outcomes',
        '  - Key performance indicators',
        '  - Quality standards',
        '  - Compliance requirements',
        'Establish baseline metrics where available',
        'Define target performance levels',
        'Create measurement methodology',
        'Identify leading and lagging indicators',
        'Save success criteria to output directory'
      ],
      outputFormat: 'JSON with criteria (array), metrics (array), measurementMethods (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['criteria', 'artifacts'],
      properties: {
        criteria: { type: 'array' },
        metrics: { type: 'array' },
        measurementMethods: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'metrics', 'success-criteria']
}));

// Task 3: Practice Documentation
export const practiceDocumentationTask = defineTask('practice-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document best practices',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'technical writer creating best practice documentation',
      task: 'Create comprehensive best practice documentation',
      context: args,
      instructions: [
        'Create documentation for each best practice:',
        '  - Overview and purpose',
        '  - Detailed process steps',
        '  - Roles and responsibilities',
        '  - Tools and resources required',
        '  - Success criteria and metrics',
        '  - Examples and case studies',
        '  - Common pitfalls and how to avoid them',
        '  - Troubleshooting guidance',
        'Apply consistent formatting and structure',
        'Include visual aids where helpful',
        'Add navigation and cross-references',
        'Save practice documents to output directory'
      ],
      outputFormat: 'JSON with documents (array), documentTypes (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documents', 'documentTypes', 'artifacts'],
      properties: {
        documents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              type: { type: 'string' },
              path: { type: 'string' },
              practice: { type: 'string' }
            }
          }
        },
        documentTypes: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'documentation', 'writing']
}));

// Task 4: Procedure Standardization
export const procedureStandardizationTask = defineTask('procedure-standardization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Standardize procedures',
  agent: {
    name: 'process-engineer',
    prompt: {
      role: 'process standardization engineer',
      task: 'Standardize procedures for consistent execution',
      context: args,
      instructions: [
        'Standardize procedures across practices:',
        '  - Consistent terminology and language',
        '  - Standardized formats and structures',
        '  - Common steps and sequences',
        '  - Unified quality standards',
        'Remove variations that do not add value',
        'Preserve necessary context-specific adaptations',
        'Create procedure templates',
        'Define governance for procedure updates',
        'Save standardized procedures to output directory'
      ],
      outputFormat: 'JSON with standardizedProcedures (array), standardsApplied (array), variations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['standardizedProcedures', 'artifacts'],
      properties: {
        standardizedProcedures: { type: 'array' },
        standardsApplied: { type: 'array' },
        variations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'standardization', 'procedures']
}));

// Task 5: Template Development
export const templateDevelopmentTask = defineTask('template-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop templates and checklists',
  agent: {
    name: 'template-developer',
    prompt: {
      role: 'template and tools developer',
      task: 'Create templates, checklists, and job aids',
      context: args,
      instructions: [
        'Develop templates for each standardized procedure:',
        '  - Process templates',
        '  - Checklists',
        '  - Forms and worksheets',
        '  - Decision aids',
        '  - Quick reference guides',
        'Ensure templates are user-friendly',
        'Include instructions and examples',
        'Design for practical use',
        'Save templates to output directory'
      ],
      outputFormat: 'JSON with templates (array), checklists (array), quickReferenceGuides (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['templates', 'artifacts'],
      properties: {
        templates: { type: 'array' },
        checklists: { type: 'array' },
        quickReferenceGuides: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'templates', 'tools']
}));

// Task 6: Expert Validation
export const expertValidationTask = defineTask('expert-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate with subject matter experts',
  agent: {
    name: 'validation-coordinator',
    prompt: {
      role: 'validation coordinator facilitating expert review',
      task: 'Coordinate expert validation of documented practices',
      context: args,
      instructions: [
        'Design validation process',
        'Gather expert feedback on:',
        '  - Accuracy and completeness',
        '  - Practical applicability',
        '  - Clarity and usability',
        '  - Alignment with actual practice',
        'Calculate validation scores',
        'Document corrections and improvements',
        'Obtain expert sign-offs',
        'Save validation results to output directory'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), expertsReviewed (number), feedback (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'expertsReviewed', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        expertsReviewed: { type: 'number' },
        feedback: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'validation', 'expert-review']
}));

// Task 7: Training Material Development
export const trainingMaterialTask = defineTask('training-material', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop training materials',
  agent: {
    name: 'learning-designer',
    prompt: {
      role: 'learning designer creating training materials',
      task: 'Create training materials for best practice adoption',
      context: args,
      instructions: [
        'Develop training materials:',
        '  - Training presentations',
        '  - Workshop guides',
        '  - E-learning content outlines',
        '  - Practice exercises',
        '  - Assessment questions',
        'Design for target audience',
        'Include practical examples',
        'Create facilitator guides',
        'Save training materials to output directory'
      ],
      outputFormat: 'JSON with materials (array), materialTypes (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['materials', 'artifacts'],
      properties: {
        materials: { type: 'array' },
        materialTypes: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'training', 'learning']
}));

// Task 8: Quality Assessment
export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess documentation quality',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'documentation quality assessor',
      task: 'Evaluate the quality of best practice documentation',
      context: args,
      instructions: [
        'Assess documentation quality:',
        '  - Completeness and coverage',
        '  - Accuracy and validity',
        '  - Clarity and usability',
        '  - Consistency and standardization',
        '  - Practical applicability',
        'Calculate overall quality score',
        'Identify strengths and improvement areas',
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

// Task 9: Adoption Planning
export const adoptionPlanningTask = defineTask('adoption-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan adoption and rollout',
  agent: {
    name: 'change-manager',
    prompt: {
      role: 'change management specialist',
      task: 'Plan adoption and rollout of best practices',
      context: args,
      instructions: [
        'Develop adoption plan:',
        '  - Rollout phases and timeline',
        '  - Communication strategy',
        '  - Training schedule',
        '  - Support mechanisms',
        '  - Success metrics',
        'Identify adoption barriers and mitigations',
        'Plan change management activities',
        'Define governance and ownership',
        'Save adoption plan to output directory'
      ],
      outputFormat: 'JSON with plan (object), timeline (object), communications (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        timeline: { type: 'object' },
        communications: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'adoption', 'change-management']
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
        'Present documentation to stakeholders',
        'Review documented best practices',
        'Present standardized procedures',
        'Present quality assessment results',
        'Present adoption plan',
        'Gather stakeholder feedback',
        'Obtain approval or identify required changes',
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
