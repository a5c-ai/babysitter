/**
 * @process specializations/domains/science/automotive-engineering/requirements-engineering
 * @description Requirements Engineering and Management - Capture, analyze, trace, and manage vehicle and system
 * requirements throughout the development lifecycle. Ensure bidirectional traceability from customer needs
 * to verification evidence.
 * @inputs { projectName: string, stakeholders?: string[], existingRequirements?: object, complianceStandards?: string[] }
 * @outputs { success: boolean, requirementsDatabase: object, traceabilityMatrix: object, complianceMatrix: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/automotive-engineering/requirements-engineering', {
 *   projectName: 'EV-Powertrain-System',
 *   stakeholders: ['OEM Engineering', 'Suppliers', 'Regulatory', 'Quality'],
 *   complianceStandards: ['ISO 26262', 'UNECE R100', 'FMVSS']
 * });
 *
 * @references
 * - ISO 26262 Automotive Functional Safety
 * - INCOSE Requirements Engineering Guide
 * - ASPICE SYS.2 System Requirements Analysis
 * - IEEE 29148 Requirements Engineering
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    stakeholders = [],
    existingRequirements = {},
    complianceStandards = []
  } = inputs;

  // Phase 1: Stakeholder Requirements Elicitation
  const stakeholderRequirements = await ctx.task(stakeholderElicitationTask, {
    projectName,
    stakeholders,
    existingRequirements
  });

  // Quality Gate: Stakeholder requirements must be captured
  if (!stakeholderRequirements.requirements || stakeholderRequirements.requirements.length === 0) {
    return {
      success: false,
      error: 'Stakeholder requirements not captured',
      phase: 'stakeholder-elicitation',
      requirementsDatabase: null
    };
  }

  // Phase 2: Requirements Analysis and Decomposition
  const requirementsDecomposition = await ctx.task(requirementsDecompositionTask, {
    projectName,
    stakeholderRequirements: stakeholderRequirements.requirements
  });

  // Breakpoint: Review decomposed requirements
  await ctx.breakpoint({
    question: `Review requirements decomposition for ${projectName}. ${requirementsDecomposition.systemRequirements?.length || 0} system-level requirements derived. Approve decomposition?`,
    title: 'Requirements Decomposition Review',
    context: {
      runId: ctx.runId,
      projectName,
      requirementsSummary: requirementsDecomposition.summary,
      files: [{
        path: `artifacts/requirements-decomposition.json`,
        format: 'json',
        content: requirementsDecomposition
      }]
    }
  });

  // Phase 3: Traceability Links Establishment
  const traceabilityLinks = await ctx.task(traceabilityLinksTask, {
    projectName,
    stakeholderRequirements: stakeholderRequirements.requirements,
    systemRequirements: requirementsDecomposition.systemRequirements
  });

  // Phase 4: Compliance Mapping
  const complianceMapping = await ctx.task(complianceMappingTask, {
    projectName,
    systemRequirements: requirementsDecomposition.systemRequirements,
    complianceStandards
  });

  // Phase 5: Requirements Validation
  const requirementsValidation = await ctx.task(requirementsValidationTask, {
    projectName,
    stakeholderRequirements: stakeholderRequirements.requirements,
    systemRequirements: requirementsDecomposition.systemRequirements,
    traceabilityLinks: traceabilityLinks.links
  });

  // Quality Gate: Requirements validation
  if (requirementsValidation.issues && requirementsValidation.issues.length > 0) {
    await ctx.breakpoint({
      question: `Requirements validation identified ${requirementsValidation.issues.length} issues. Review and resolve before proceeding?`,
      title: 'Requirements Validation Issues',
      context: {
        runId: ctx.runId,
        validationIssues: requirementsValidation.issues,
        recommendation: 'Resolve critical issues before design phase'
      }
    });
  }

  // Phase 6: Change Impact Analysis Framework
  const changeFramework = await ctx.task(changeFrameworkTask, {
    projectName,
    requirementsDecomposition,
    traceabilityLinks: traceabilityLinks.links
  });

  // Phase 7: Requirements Database Generation
  const requirementsDatabase = await ctx.task(requirementsDatabaseTask, {
    projectName,
    stakeholderRequirements: stakeholderRequirements.requirements,
    systemRequirements: requirementsDecomposition.systemRequirements,
    traceabilityLinks: traceabilityLinks.links,
    complianceMapping: complianceMapping.mapping,
    validationStatus: requirementsValidation
  });

  // Final Breakpoint: Requirements baseline approval
  await ctx.breakpoint({
    question: `Requirements Engineering complete for ${projectName}. ${requirementsDatabase.totalRequirements} requirements baselined. Approve requirements baseline?`,
    title: 'Requirements Baseline Approval',
    context: {
      runId: ctx.runId,
      projectName,
      requirementsSummary: requirementsDatabase.summary,
      files: [
        { path: `artifacts/requirements-database.json`, format: 'json', content: requirementsDatabase },
        { path: `artifacts/traceability-matrix.json`, format: 'json', content: traceabilityLinks },
        { path: `artifacts/compliance-matrix.json`, format: 'json', content: complianceMapping }
      ]
    }
  });

  return {
    success: true,
    projectName,
    requirementsDatabase: requirementsDatabase.database,
    traceabilityMatrix: traceabilityLinks.matrix,
    complianceMatrix: complianceMapping.matrix,
    validationResults: requirementsValidation,
    changeFramework: changeFramework.framework,
    statistics: requirementsDatabase.statistics,
    nextSteps: requirementsDatabase.nextSteps,
    metadata: {
      processId: 'specializations/domains/science/automotive-engineering/requirements-engineering',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const stakeholderElicitationTask = defineTask('stakeholder-elicitation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Stakeholder Requirements Elicitation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Requirements Engineer with expertise in automotive stakeholder management',
      task: 'Elicit and capture stakeholder requirements for the vehicle system',
      context: {
        projectName: args.projectName,
        stakeholders: args.stakeholders,
        existingRequirements: args.existingRequirements
      },
      instructions: [
        '1. Identify all stakeholder groups and their interests',
        '2. Capture customer needs and expectations',
        '3. Document regulatory and compliance requirements',
        '4. Capture manufacturing and supply chain requirements',
        '5. Document quality and reliability expectations',
        '6. Capture service and maintenance requirements',
        '7. Identify constraints and boundary conditions',
        '8. Document assumptions and dependencies',
        '9. Prioritize requirements (MoSCoW or similar)',
        '10. Validate requirements with stakeholders'
      ],
      outputFormat: 'JSON object with stakeholder requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'stakeholderGroups'],
      properties: {
        requirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              stakeholder: { type: 'string' },
              type: { type: 'string', enum: ['functional', 'performance', 'interface', 'regulatory', 'quality'] },
              priority: { type: 'string', enum: ['must', 'should', 'could', 'wont'] },
              rationale: { type: 'string' }
            }
          }
        },
        stakeholderGroups: { type: 'array', items: { type: 'object' } },
        constraints: { type: 'array', items: { type: 'object' } },
        assumptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'requirements', 'stakeholders', 'elicitation']
}));

export const requirementsDecompositionTask = defineTask('requirements-decomposition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Requirements Analysis and Decomposition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Systems Requirements Analyst with expertise in requirements decomposition',
      task: 'Decompose stakeholder requirements into system-level requirements',
      context: {
        projectName: args.projectName,
        stakeholderRequirements: args.stakeholderRequirements
      },
      instructions: [
        '1. Analyze stakeholder requirements for completeness',
        '2. Decompose high-level requirements into measurable system requirements',
        '3. Ensure requirements are atomic, testable, and unambiguous',
        '4. Apply SMART criteria to each requirement',
        '5. Identify derived requirements from system analysis',
        '6. Resolve conflicting requirements',
        '7. Define acceptance criteria for each requirement',
        '8. Establish requirement attributes (verification method, criticality)',
        '9. Group requirements by functional domain',
        '10. Create requirements hierarchy'
      ],
      outputFormat: 'JSON object with decomposed system requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['systemRequirements', 'hierarchy', 'summary'],
      properties: {
        systemRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              parentId: { type: 'string' },
              description: { type: 'string' },
              acceptanceCriteria: { type: 'string' },
              verificationMethod: { type: 'string', enum: ['test', 'analysis', 'inspection', 'demonstration'] },
              criticality: { type: 'string', enum: ['safety-critical', 'mission-critical', 'standard'] },
              domain: { type: 'string' }
            }
          }
        },
        hierarchy: { type: 'array', items: { type: 'object' } },
        derivedRequirements: { type: 'array', items: { type: 'object' } },
        conflicts: { type: 'array', items: { type: 'object' } },
        summary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'requirements', 'decomposition', 'analysis']
}));

export const traceabilityLinksTask = defineTask('traceability-links', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Traceability Links Establishment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Traceability Engineer with expertise in requirements traceability',
      task: 'Establish bidirectional traceability links between requirements levels',
      context: {
        projectName: args.projectName,
        stakeholderRequirements: args.stakeholderRequirements,
        systemRequirements: args.systemRequirements
      },
      instructions: [
        '1. Create traceability links from stakeholder to system requirements',
        '2. Establish forward traceability (needs to requirements)',
        '3. Establish backward traceability (requirements to needs)',
        '4. Identify orphan requirements (no parent link)',
        '5. Identify unallocated stakeholder requirements',
        '6. Define traceability to design elements',
        '7. Define traceability to verification evidence',
        '8. Create traceability matrix',
        '9. Establish impact analysis links',
        '10. Document traceability coverage metrics'
      ],
      outputFormat: 'JSON object with traceability links and matrix'
    },
    outputSchema: {
      type: 'object',
      required: ['links', 'matrix', 'coverage'],
      properties: {
        links: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceId: { type: 'string' },
              targetId: { type: 'string' },
              linkType: { type: 'string', enum: ['derives', 'satisfies', 'verifies', 'implements'] },
              rationale: { type: 'string' }
            }
          }
        },
        matrix: { type: 'array', items: { type: 'array' } },
        orphanRequirements: { type: 'array', items: { type: 'string' } },
        unallocatedNeeds: { type: 'array', items: { type: 'string' } },
        coverage: {
          type: 'object',
          properties: {
            forwardCoverage: { type: 'number' },
            backwardCoverage: { type: 'number' },
            totalLinks: { type: 'number' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'requirements', 'traceability', 'matrix']
}));

export const complianceMappingTask = defineTask('compliance-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Compliance Mapping - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Regulatory Compliance Engineer with automotive expertise',
      task: 'Map requirements to compliance standards and regulations',
      context: {
        projectName: args.projectName,
        systemRequirements: args.systemRequirements,
        complianceStandards: args.complianceStandards
      },
      instructions: [
        '1. Identify applicable regulations by market (FMVSS, ECE, GB)',
        '2. Map requirements to ISO 26262 safety requirements',
        '3. Map requirements to cybersecurity standards (ISO 21434)',
        '4. Identify UNECE regulation requirements',
        '5. Map to environmental regulations (emissions, recyclability)',
        '6. Document compliance gaps',
        '7. Create compliance evidence mapping',
        '8. Define certification requirements',
        '9. Establish compliance verification methods',
        '10. Generate compliance matrix'
      ],
      outputFormat: 'JSON object with compliance mapping'
    },
    outputSchema: {
      type: 'object',
      required: ['mapping', 'matrix', 'gaps'],
      properties: {
        mapping: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              standard: { type: 'string' },
              clause: { type: 'string' },
              complianceStatus: { type: 'string', enum: ['compliant', 'partial', 'non-compliant', 'not-applicable'] },
              evidence: { type: 'string' }
            }
          }
        },
        matrix: { type: 'array', items: { type: 'object' } },
        gaps: { type: 'array', items: { type: 'object' } },
        certificationRequirements: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'requirements', 'compliance', 'regulatory']
}));

export const requirementsValidationTask = defineTask('requirements-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Requirements Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Requirements Quality Engineer with validation expertise',
      task: 'Validate requirements quality and completeness',
      context: {
        projectName: args.projectName,
        stakeholderRequirements: args.stakeholderRequirements,
        systemRequirements: args.systemRequirements,
        traceabilityLinks: args.traceabilityLinks
      },
      instructions: [
        '1. Validate requirements against quality criteria (clear, testable, consistent)',
        '2. Check for ambiguous or vague requirements',
        '3. Verify requirements are atomic and measurable',
        '4. Check for conflicting requirements',
        '5. Validate traceability completeness',
        '6. Verify requirement uniqueness (no duplicates)',
        '7. Check for missing requirements (gap analysis)',
        '8. Validate acceptance criteria adequacy',
        '9. Review verification method assignments',
        '10. Generate validation report'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['validationResults', 'issues', 'metrics'],
      properties: {
        validationResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              checksPassed: { type: 'array', items: { type: 'string' } },
              checksFailed: { type: 'array', items: { type: 'string' } },
              overallStatus: { type: 'string', enum: ['pass', 'fail', 'warning'] }
            }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issueId: { type: 'string' },
              requirementId: { type: 'string' },
              issueType: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              description: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        metrics: {
          type: 'object',
          properties: {
            totalRequirements: { type: 'number' },
            passedValidation: { type: 'number' },
            failedValidation: { type: 'number' },
            qualityScore: { type: 'number' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'requirements', 'validation', 'quality']
}));

export const changeFrameworkTask = defineTask('change-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Change Impact Analysis Framework - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Change Management Engineer with requirements expertise',
      task: 'Establish change impact analysis framework for requirements management',
      context: {
        projectName: args.projectName,
        requirementsDecomposition: args.requirementsDecomposition,
        traceabilityLinks: args.traceabilityLinks
      },
      instructions: [
        '1. Define change request process and workflow',
        '2. Establish impact analysis methodology',
        '3. Define change classification criteria',
        '4. Establish change approval gates',
        '5. Define rollback procedures',
        '6. Create change impact templates',
        '7. Establish configuration management links',
        '8. Define baseline management process',
        '9. Establish change notification procedures',
        '10. Document change metrics and KPIs'
      ],
      outputFormat: 'JSON object with change management framework'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'process', 'templates'],
      properties: {
        framework: {
          type: 'object',
          properties: {
            impactAnalysisMethod: { type: 'string' },
            classificationCriteria: { type: 'array', items: { type: 'object' } },
            approvalGates: { type: 'array', items: { type: 'object' } }
          }
        },
        process: {
          type: 'object',
          properties: {
            workflow: { type: 'array', items: { type: 'object' } },
            roles: { type: 'array', items: { type: 'object' } },
            escalationPath: { type: 'array', items: { type: 'string' } }
          }
        },
        templates: { type: 'array', items: { type: 'object' } },
        metrics: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'requirements', 'change-management', 'framework']
}));

export const requirementsDatabaseTask = defineTask('requirements-database', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Requirements Database Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Requirements Management Specialist',
      task: 'Generate comprehensive requirements database',
      context: {
        projectName: args.projectName,
        stakeholderRequirements: args.stakeholderRequirements,
        systemRequirements: args.systemRequirements,
        traceabilityLinks: args.traceabilityLinks,
        complianceMapping: args.complianceMapping,
        validationStatus: args.validationStatus
      },
      instructions: [
        '1. Consolidate all requirements into structured database',
        '2. Assign unique identifiers following naming convention',
        '3. Include all attributes and metadata',
        '4. Include traceability information',
        '5. Include compliance mapping',
        '6. Include validation status',
        '7. Generate requirements statistics',
        '8. Create requirements baseline',
        '9. Document database schema',
        '10. Define export formats'
      ],
      outputFormat: 'JSON object with requirements database'
    },
    outputSchema: {
      type: 'object',
      required: ['database', 'statistics', 'summary'],
      properties: {
        database: {
          type: 'object',
          properties: {
            stakeholderRequirements: { type: 'array', items: { type: 'object' } },
            systemRequirements: { type: 'array', items: { type: 'object' } },
            traceability: { type: 'array', items: { type: 'object' } },
            compliance: { type: 'array', items: { type: 'object' } }
          }
        },
        statistics: {
          type: 'object',
          properties: {
            totalStakeholderRequirements: { type: 'number' },
            totalSystemRequirements: { type: 'number' },
            traceabilityCoverage: { type: 'number' },
            validationPass: { type: 'number' }
          }
        },
        totalRequirements: { type: 'number' },
        summary: { type: 'object' },
        nextSteps: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'requirements', 'database', 'baseline']
}));
