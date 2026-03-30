/**
 * @process business-analysis/brd-creation
 * @description Create comprehensive Business Requirements Documents that capture business needs, objectives, scope, constraints, and success criteria. Ensures alignment between stakeholder expectations and solution delivery.
 * @inputs { projectName: string, businessContext: object, stakeholders: array, requirements: array, constraints: object }
 * @outputs { success: boolean, brdDocument: string, traceabilityMatrix: object, approvalWorkflow: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'Project',
    businessContext = {},
    stakeholders = [],
    requirements = [],
    constraints = {},
    outputDir = 'brd-output',
    template = 'ieee-29148'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting BRD Creation for ${projectName}`);

  // ============================================================================
  // PHASE 1: BUSINESS CONTEXT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing business context and problem statement');
  const contextAnalysis = await ctx.task(contextAnalysisTask, {
    projectName,
    businessContext,
    stakeholders,
    outputDir
  });

  artifacts.push(...contextAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: SCOPE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining project scope and boundaries');
  const scopeDefinition = await ctx.task(scopeDefinitionTask, {
    projectName,
    contextAnalysis,
    businessContext,
    constraints,
    outputDir
  });

  artifacts.push(...scopeDefinition.artifacts);

  // ============================================================================
  // PHASE 3: REQUIREMENTS STRUCTURING
  // ============================================================================

  ctx.log('info', 'Phase 3: Structuring and categorizing requirements');
  const requirementsStructuring = await ctx.task(requirementsStructuringTask, {
    projectName,
    requirements,
    scopeDefinition,
    businessContext,
    outputDir
  });

  artifacts.push(...requirementsStructuring.artifacts);

  // ============================================================================
  // PHASE 4: SUCCESS CRITERIA DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 4: Defining success criteria and acceptance criteria');
  const successCriteria = await ctx.task(successCriteriaTask, {
    projectName,
    requirements: requirementsStructuring.structuredRequirements,
    businessContext,
    stakeholders,
    outputDir
  });

  artifacts.push(...successCriteria.artifacts);

  // ============================================================================
  // PHASE 5: TRACEABILITY MATRIX CREATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating requirements traceability matrix');
  const traceabilityMatrix = await ctx.task(traceabilityMatrixTask, {
    projectName,
    requirements: requirementsStructuring.structuredRequirements,
    businessContext,
    successCriteria,
    outputDir
  });

  artifacts.push(...traceabilityMatrix.artifacts);

  // ============================================================================
  // PHASE 6: BRD DOCUMENT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating comprehensive BRD document');
  const brdDocument = await ctx.task(brdDocumentGenerationTask, {
    projectName,
    contextAnalysis,
    scopeDefinition,
    requirementsStructuring,
    successCriteria,
    traceabilityMatrix,
    stakeholders,
    constraints,
    template,
    outputDir
  });

  artifacts.push(...brdDocument.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Validating BRD quality and completeness');
  const qualityValidation = await ctx.task(brdQualityValidationTask, {
    projectName,
    brdDocument,
    requirements: requirementsStructuring.structuredRequirements,
    traceabilityMatrix,
    template,
    outputDir
  });

  artifacts.push(...qualityValidation.artifacts);

  const qualityMet = qualityValidation.overallScore >= 85;

  // Breakpoint: Review BRD
  await ctx.breakpoint({
    question: `BRD creation complete for ${projectName}. Quality score: ${qualityValidation.overallScore}/100. ${qualityMet ? 'BRD meets quality standards!' : 'BRD may need refinement.'} Review and approve?`,
    title: 'BRD Quality Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        projectName,
        qualityScore: qualityValidation.overallScore,
        qualityMet,
        totalRequirements: requirementsStructuring.structuredRequirements?.length || 0,
        traceabilityComplete: traceabilityMatrix.completeness
      }
    }
  });

  // ============================================================================
  // PHASE 8: APPROVAL WORKFLOW SETUP
  // ============================================================================

  ctx.log('info', 'Phase 8: Setting up approval workflow');
  const approvalWorkflow = await ctx.task(approvalWorkflowTask, {
    projectName,
    brdDocument,
    stakeholders,
    qualityValidation,
    outputDir
  });

  artifacts.push(...approvalWorkflow.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    qualityScore: qualityValidation.overallScore,
    qualityMet,
    brdDocument: {
      path: brdDocument.documentPath,
      version: brdDocument.version,
      sections: brdDocument.sections
    },
    scope: {
      inScope: scopeDefinition.inScope,
      outOfScope: scopeDefinition.outOfScope,
      assumptions: scopeDefinition.assumptions
    },
    requirements: {
      total: requirementsStructuring.structuredRequirements?.length || 0,
      functional: requirementsStructuring.functionalCount,
      nonFunctional: requirementsStructuring.nonFunctionalCount
    },
    traceabilityMatrix: {
      completeness: traceabilityMatrix.completeness,
      matrixPath: traceabilityMatrix.matrixPath
    },
    approvalWorkflow: {
      status: approvalWorkflow.status,
      approvers: approvalWorkflow.approvers,
      workflowPath: approvalWorkflow.workflowPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'business-analysis/brd-creation',
      timestamp: startTime,
      template,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const contextAnalysisTask = defineTask('context-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze business context',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'senior business analyst with strategic analysis expertise',
      task: 'Analyze business context and define problem statement for BRD',
      context: args,
      instructions: [
        'Analyze current business situation and challenges',
        'Define clear problem statement that BRD addresses',
        'Identify business drivers and motivations',
        'Document strategic alignment with organizational goals',
        'Analyze stakeholder landscape and their interests',
        'Identify key pain points and improvement opportunities',
        'Document current state vs desired future state',
        'Identify external factors affecting the business need',
        'Define business value proposition',
        'Create executive summary of business context'
      ],
      outputFormat: 'JSON with problemStatement, businessDrivers, strategicAlignment, currentState, futureState, valueProposition, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['problemStatement', 'businessDrivers', 'artifacts'],
      properties: {
        problemStatement: { type: 'string' },
        businessDrivers: { type: 'array', items: { type: 'string' } },
        strategicAlignment: { type: 'array', items: { type: 'string' } },
        currentState: { type: 'string' },
        futureState: { type: 'string' },
        valueProposition: { type: 'string' },
        painPoints: { type: 'array', items: { type: 'string' } },
        opportunities: { type: 'array', items: { type: 'string' } },
        externalFactors: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'context-analysis', 'brd']
}));

export const scopeDefinitionTask = defineTask('scope-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define project scope',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'senior business analyst with scope management expertise',
      task: 'Define comprehensive project scope including boundaries and exclusions',
      context: args,
      instructions: [
        'Define clear scope boundaries (what is IN scope)',
        'Explicitly document what is OUT of scope',
        'Identify scope assumptions and their rationale',
        'Document scope dependencies on other projects/systems',
        'Define organizational scope (departments, teams affected)',
        'Define technical scope (systems, interfaces involved)',
        'Identify potential scope risks and mitigation',
        'Document scope change management approach',
        'Create scope statement document',
        'Define criteria for scope freeze'
      ],
      outputFormat: 'JSON with inScope, outOfScope, assumptions, dependencies, organizationalScope, technicalScope, risks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['inScope', 'outOfScope', 'assumptions', 'artifacts'],
      properties: {
        inScope: { type: 'array', items: { type: 'string' } },
        outOfScope: { type: 'array', items: { type: 'string' } },
        assumptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assumption: { type: 'string' },
              rationale: { type: 'string' },
              risk: { type: 'string' }
            }
          }
        },
        dependencies: { type: 'array', items: { type: 'string' } },
        organizationalScope: { type: 'object' },
        technicalScope: { type: 'object' },
        risks: { type: 'array', items: { type: 'object' } },
        changeManagement: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'scope-definition', 'brd']
}));

export const requirementsStructuringTask = defineTask('requirements-structuring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Structure requirements',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'senior business analyst with IEEE 29148 expertise',
      task: 'Structure and categorize requirements following IEEE 29148 standards',
      context: args,
      instructions: [
        'Categorize requirements into functional and non-functional',
        'Structure functional requirements by business capability',
        'Structure non-functional requirements by quality attribute',
        'Assign unique identifiers following naming conventions',
        'Define requirement attributes (priority, status, source)',
        'Add acceptance criteria to each requirement',
        'Identify requirement dependencies and relationships',
        'Validate requirements against scope boundaries',
        'Apply SMART criteria to ensure quality',
        'Create requirements hierarchy showing relationships'
      ],
      outputFormat: 'JSON with structuredRequirements, functionalCount, nonFunctionalCount, hierarchy, dependencies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['structuredRequirements', 'functionalCount', 'nonFunctionalCount', 'artifacts'],
      properties: {
        structuredRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              category: { type: 'string' },
              subcategory: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string' },
              source: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        functionalCount: { type: 'number' },
        nonFunctionalCount: { type: 'number' },
        hierarchy: { type: 'object' },
        dependencies: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'requirements-structuring', 'ieee-29148']
}));

export const successCriteriaTask = defineTask('success-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define success criteria',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'senior business analyst with success metrics expertise',
      task: 'Define measurable success criteria and acceptance criteria for the project',
      context: args,
      instructions: [
        'Define business success criteria with KPIs',
        'Define technical success criteria',
        'Create user acceptance criteria',
        'Define operational success criteria',
        'Establish baseline measurements where available',
        'Define target values for each success metric',
        'Create measurement methods for each criterion',
        'Define success criteria ownership',
        'Establish review and validation process',
        'Document criteria for project completion'
      ],
      outputFormat: 'JSON with businessCriteria, technicalCriteria, userAcceptance, operationalCriteria, measurements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['businessCriteria', 'technicalCriteria', 'artifacts'],
      properties: {
        businessCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              kpi: { type: 'string' },
              baseline: { type: 'string' },
              target: { type: 'string' },
              measurement: { type: 'string' }
            }
          }
        },
        technicalCriteria: { type: 'array', items: { type: 'object' } },
        userAcceptance: { type: 'array', items: { type: 'object' } },
        operationalCriteria: { type: 'array', items: { type: 'object' } },
        measurements: { type: 'object' },
        completionCriteria: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'success-criteria', 'brd']
}));

export const traceabilityMatrixTask = defineTask('traceability-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create traceability matrix',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'senior business analyst with requirements management expertise',
      task: 'Create comprehensive requirements traceability matrix',
      context: args,
      instructions: [
        'Link requirements to business objectives',
        'Link requirements to stakeholder needs',
        'Create forward traceability (requirements to design/test)',
        'Create backward traceability (requirements to source)',
        'Identify orphan requirements without traceability',
        'Document coverage gaps',
        'Create visual traceability diagram',
        'Calculate traceability completeness percentage',
        'Identify requirements needing clarification',
        'Generate traceability report'
      ],
      outputFormat: 'JSON with matrixPath, completeness, traceabilityLinks, orphanRequirements, coverageGaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['matrixPath', 'completeness', 'traceabilityLinks', 'artifacts'],
      properties: {
        matrixPath: { type: 'string' },
        completeness: { type: 'number', minimum: 0, maximum: 100 },
        traceabilityLinks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              objective: { type: 'string' },
              stakeholder: { type: 'string' },
              testCase: { type: 'string' }
            }
          }
        },
        orphanRequirements: { type: 'array', items: { type: 'string' } },
        coverageGaps: { type: 'array', items: { type: 'string' } },
        statistics: {
          type: 'object',
          properties: {
            totalRequirements: { type: 'number' },
            linkedRequirements: { type: 'number' },
            orphanCount: { type: 'number' }
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
  labels: ['agent', 'business-analysis', 'traceability', 'requirements-management']
}));

export const brdDocumentGenerationTask = defineTask('brd-document-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate BRD document',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'senior technical writer with BRD expertise',
      task: 'Generate comprehensive Business Requirements Document following industry standards',
      context: args,
      instructions: [
        'Create executive summary with key highlights',
        'Document business context and problem statement',
        'Include project scope and boundaries',
        'Document all functional requirements with details',
        'Document non-functional requirements',
        'Include success criteria and acceptance criteria',
        'Add traceability matrix reference',
        'Include glossary of terms',
        'Add appendices for supporting materials',
        'Format document following template standards',
        'Include version control information',
        'Add document approval section'
      ],
      outputFormat: 'JSON with documentPath, version, sections, wordCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'version', 'sections', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        version: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              title: { type: 'string' },
              pageCount: { type: 'number' }
            }
          }
        },
        wordCount: { type: 'number' },
        glossaryTerms: { type: 'number' },
        appendices: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'brd-generation', 'documentation']
}));

export const brdQualityValidationTask = defineTask('brd-quality-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate BRD quality',
  agent: {
    name: 'qa-analyst',
    prompt: {
      role: 'quality assurance specialist with requirements validation expertise',
      task: 'Validate BRD quality and completeness against IEEE 29148 standards',
      context: args,
      instructions: [
        'Validate document structure against template',
        'Check requirements completeness and consistency',
        'Verify traceability coverage',
        'Assess clarity and unambiguity of requirements',
        'Check for missing or incomplete sections',
        'Validate acceptance criteria quality',
        'Verify stakeholder coverage',
        'Check glossary completeness',
        'Calculate overall quality score',
        'Provide improvement recommendations'
      ],
      outputFormat: 'JSON with overallScore, componentScores, issues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            structure: { type: 'number' },
            completeness: { type: 'number' },
            clarity: { type: 'number' },
            traceability: { type: 'number' },
            consistency: { type: 'number' }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              section: { type: 'string' },
              issue: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        readiness: { type: 'string', enum: ['ready', 'needs-revision', 'major-rework'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'quality-validation', 'brd']
}));

export const approvalWorkflowTask = defineTask('approval-workflow', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup approval workflow',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'senior business analyst with governance expertise',
      task: 'Setup BRD approval workflow and stakeholder sign-off process',
      context: args,
      instructions: [
        'Define approval workflow stages',
        'Identify required approvers by role',
        'Create approval routing rules',
        'Define escalation procedures',
        'Create approval tracking document',
        'Setup notification mechanisms',
        'Define approval criteria for each stage',
        'Create revision and re-approval process',
        'Document approval history template',
        'Define final sign-off requirements'
      ],
      outputFormat: 'JSON with status, approvers, workflowPath, stages, escalation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'approvers', 'workflowPath', 'artifacts'],
      properties: {
        status: { type: 'string', enum: ['pending', 'in-review', 'approved', 'rejected'] },
        approvers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              stage: { type: 'string' },
              status: { type: 'string' },
              deadline: { type: 'string' }
            }
          }
        },
        workflowPath: { type: 'string' },
        stages: { type: 'array', items: { type: 'object' } },
        escalation: { type: 'object' },
        revisionProcess: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'approval-workflow', 'governance']
}));
