/**
 * @process methodologies/waterfall
 * @description Waterfall - Sequential SDLC methodology with distinct phases: Requirements, Design, Implementation, Testing, Deployment, Maintenance
 * @inputs { projectName: string, projectDescription: string, stakeholders?: array, requirementsSource?: string, testingStrategy?: string, deploymentTarget?: string }
 * @outputs { success: boolean, requirements: object, design: object, implementation: object, testing: object, deployment: object, maintenance: object, artifacts: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Waterfall Process
 *
 * Created by Winston W. Royce (1970)
 *
 * The Waterfall model is a linear and sequential approach to software development where
 * progress flows in one direction through distinct phases. Each phase must be completed
 * and approved before the next phase begins.
 *
 * Six Sequential Phases:
 * 1. Requirements - Gather and document all requirements upfront
 * 2. Design - Define system architecture and detailed design
 * 3. Implementation - Write code per design specifications
 * 4. Testing - Test complete system (unit, integration, system, UAT)
 * 5. Deployment - Release to production environment
 * 6. Maintenance - Bug fixes, updates, and support planning
 *
 * Key Characteristics:
 * - Sequential phases with no overlap
 * - Document-driven approach with heavy documentation
 * - Phase gates require formal approval before proceeding
 * - Requirements fixed early in the process
 * - Expensive to return to previous phases
 * - Well-suited for: stable requirements, regulatory environments, clear specifications
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project/system
 * @param {string} inputs.projectDescription - High-level description of what needs to be built
 * @param {Array<Object>} inputs.stakeholders - Project stakeholders (optional)
 * @param {string} inputs.requirementsSource - Source of requirements (interviews, documents, etc.)
 * @param {string} inputs.testingStrategy - Testing approach (default: comprehensive)
 * @param {string} inputs.deploymentTarget - Target deployment environment
 * @param {boolean} inputs.includeV Model - Use V-Model for testing (default: true)
 * @param {string} inputs.regulatoryCompliance - Compliance requirements (FDA, ISO, etc.)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with all phase outputs and artifacts
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    projectDescription,
    stakeholders = [],
    requirementsSource = 'stakeholder-interviews',
    testingStrategy = 'comprehensive',
    deploymentTarget = 'production',
    includeVModel = true,
    regulatoryCompliance = null
  } = inputs;

  // Validate required inputs
  if (!projectName || !projectDescription) {
    throw new Error('projectName and projectDescription are required');
  }

  // ============================================================================
  // PHASE 1: REQUIREMENTS GATHERING AND ANALYSIS
  // ============================================================================

  const requirementsResult = await ctx.task(requirementsGatheringTask, {
    projectName,
    projectDescription,
    stakeholders,
    requirementsSource,
    regulatoryCompliance
  });

  // Phase Gate 1: Requirements Review and Approval
  await ctx.breakpoint({
    question: `Requirements phase complete for "${projectName}". Documented ${requirementsResult.functionalRequirements.length} functional and ${requirementsResult.nonFunctionalRequirements.length} non-functional requirements. Requirements specification (SRS) created with ${requirementsResult.totalPages} pages. All stakeholders reviewed. Approve requirements and proceed to design phase?`,
    title: 'Phase Gate 1: Requirements Approval',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/waterfall/phase-1-requirements/srs.md', format: 'markdown', label: 'Software Requirements Specification' },
        { path: 'artifacts/waterfall/phase-1-requirements/requirements.json', format: 'code', language: 'json', label: 'Requirements Data' },
        { path: 'artifacts/waterfall/phase-1-requirements/stakeholder-signoffs.md', format: 'markdown', label: 'Stakeholder Sign-offs' }
      ]
    }
  });

  // ============================================================================
  // PHASE 2: SYSTEM AND SOFTWARE DESIGN
  // ============================================================================

  const designResult = await ctx.task(systemDesignTask, {
    projectName,
    requirements: requirementsResult,
    testingStrategy,
    includeVModel
  });

  // Phase Gate 2: Design Review and Approval
  await ctx.breakpoint({
    question: `Design phase complete. Created high-level architecture with ${designResult.components.length} components, ${designResult.databaseTables.length} database tables, and ${designResult.interfaces.length} interfaces. Software Design Document (SDD) generated. Design reviews completed. Approve design and proceed to implementation?`,
    title: 'Phase Gate 2: Design Approval',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/waterfall/phase-2-design/sdd.md', format: 'markdown', label: 'Software Design Document' },
        { path: 'artifacts/waterfall/phase-2-design/architecture-diagram.md', format: 'markdown', label: 'Architecture Diagram' },
        { path: 'artifacts/waterfall/phase-2-design/database-schema.md', format: 'markdown', label: 'Database Schema' },
        { path: 'artifacts/waterfall/phase-2-design/interface-specifications.json', format: 'code', language: 'json', label: 'Interface Specs' }
      ]
    }
  });

  // ============================================================================
  // PHASE 3: IMPLEMENTATION (CODING)
  // ============================================================================

  const implementationResult = await ctx.task(implementationTask, {
    projectName,
    requirements: requirementsResult,
    design: designResult,
    includeVModel
  });

  // Phase Gate 3: Code Review and Unit Test Approval
  await ctx.breakpoint({
    question: `Implementation phase complete. Developed ${implementationResult.modules.length} modules (${implementationResult.totalLinesOfCode} LOC). All modules code-reviewed. ${implementationResult.unitTests.passed}/${implementationResult.unitTests.total} unit tests passing. Code meets design specifications. Approve implementation and proceed to testing phase?`,
    title: 'Phase Gate 3: Implementation Approval',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/waterfall/phase-3-implementation/implementation-report.md', format: 'markdown', label: 'Implementation Report' },
        { path: 'artifacts/waterfall/phase-3-implementation/code-review-summary.md', format: 'markdown', label: 'Code Review Summary' },
        { path: 'artifacts/waterfall/phase-3-implementation/unit-test-report.md', format: 'markdown', label: 'Unit Test Report' },
        { path: 'artifacts/waterfall/phase-3-implementation/modules.json', format: 'code', language: 'json', label: 'Module Details' }
      ]
    }
  });

  // ============================================================================
  // PHASE 4: TESTING (INTEGRATION, SYSTEM, UAT)
  // ============================================================================

  const testingResult = await ctx.task(testingPhaseTask, {
    projectName,
    requirements: requirementsResult,
    design: designResult,
    implementation: implementationResult,
    testingStrategy,
    includeVModel
  });

  // Phase Gate 4: Testing Sign-off
  await ctx.breakpoint({
    question: `Testing phase complete. Integration testing: ${testingResult.integrationTests.passed}/${testingResult.integrationTests.total} passed. System testing: ${testingResult.systemTests.passed}/${testingResult.systemTests.total} passed. UAT: ${testingResult.uat.status}. ${testingResult.defects.critical} critical, ${testingResult.defects.high} high, ${testingResult.defects.medium} medium defects. All critical defects resolved. System ready for deployment?`,
    title: 'Phase Gate 4: Testing Sign-off',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/waterfall/phase-4-testing/test-plan.md', format: 'markdown', label: 'Master Test Plan' },
        { path: 'artifacts/waterfall/phase-4-testing/integration-test-report.md', format: 'markdown', label: 'Integration Test Report' },
        { path: 'artifacts/waterfall/phase-4-testing/system-test-report.md', format: 'markdown', label: 'System Test Report' },
        { path: 'artifacts/waterfall/phase-4-testing/uat-report.md', format: 'markdown', label: 'UAT Report' },
        { path: 'artifacts/waterfall/phase-4-testing/defect-log.json', format: 'code', language: 'json', label: 'Defect Log' }
      ]
    }
  });

  // ============================================================================
  // PHASE 5: DEPLOYMENT
  // ============================================================================

  const deploymentResult = await ctx.task(deploymentTask, {
    projectName,
    requirements: requirementsResult,
    design: designResult,
    testing: testingResult,
    deploymentTarget,
    regulatoryCompliance
  });

  // Phase Gate 5: Production Release Approval
  await ctx.breakpoint({
    question: `Deployment phase complete. ${deploymentResult.deploymentType} deployment to ${deploymentTarget} executed. ${deploymentResult.verificationTests.passed}/${deploymentResult.verificationTests.total} post-deployment verification tests passed. System operational. Production environment verified. ${deploymentResult.rollbackPlan ? 'Rollback plan in place.' : ''} Release to users?`,
    title: 'Phase Gate 5: Production Release Approval',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/waterfall/phase-5-deployment/deployment-plan.md', format: 'markdown', label: 'Deployment Plan' },
        { path: 'artifacts/waterfall/phase-5-deployment/deployment-report.md', format: 'markdown', label: 'Deployment Report' },
        { path: 'artifacts/waterfall/phase-5-deployment/verification-results.md', format: 'markdown', label: 'Verification Results' },
        { path: 'artifacts/waterfall/phase-5-deployment/release-notes.md', format: 'markdown', label: 'Release Notes' }
      ]
    }
  });

  // ============================================================================
  // PHASE 6: MAINTENANCE PLANNING
  // ============================================================================

  const maintenanceResult = await ctx.task(maintenancePlanningTask, {
    projectName,
    requirements: requirementsResult,
    design: designResult,
    deployment: deploymentResult,
    regulatoryCompliance
  });

  // Final Phase Gate: Maintenance Plan Approval and Project Closure
  await ctx.breakpoint({
    question: `Maintenance phase planning complete. Support procedures established with SLA: ${maintenanceResult.sla.responseTime}. Bug tracking process defined. Update procedures documented. ${maintenanceResult.trainingDocuments.length} training documents created. End-of-life plan defined. Approve maintenance plan and close project?`,
    title: 'Phase Gate 6: Maintenance Plan Approval & Project Closure',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/waterfall/phase-6-maintenance/maintenance-plan.md', format: 'markdown', label: 'Maintenance Plan' },
        { path: 'artifacts/waterfall/phase-6-maintenance/support-procedures.md', format: 'markdown', label: 'Support Procedures' },
        { path: 'artifacts/waterfall/phase-6-maintenance/training-materials.md', format: 'markdown', label: 'Training Materials' },
        { path: 'artifacts/waterfall/phase-6-maintenance/eol-plan.md', format: 'markdown', label: 'End-of-Life Plan' }
      ]
    }
  });

  // ============================================================================
  // PROJECT SUMMARY AND CLOSURE
  // ============================================================================

  const projectMetrics = calculateProjectMetrics(
    requirementsResult,
    designResult,
    implementationResult,
    testingResult,
    deploymentResult,
    maintenanceResult
  );

  // Final summary breakpoint
  await ctx.breakpoint({
    question: `Waterfall SDLC complete for "${projectName}". All 6 phases completed successfully. ${requirementsResult.functionalRequirements.length} requirements implemented. ${implementationResult.modules.length} modules deployed. ${testingResult.totalTestsExecuted} tests executed. System in production. Maintenance plan active. Review final project documentation?`,
    title: 'Project Complete - Final Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/waterfall/project-summary.md', format: 'markdown', label: 'Project Summary' },
        { path: 'artifacts/waterfall/project-metrics.json', format: 'code', language: 'json', label: 'Project Metrics' },
        { path: 'artifacts/waterfall/lessons-learned.md', format: 'markdown', label: 'Lessons Learned' },
        { path: 'artifacts/waterfall/final-documentation-index.md', format: 'markdown', label: 'Documentation Index' }
      ]
    }
  });

  return {
    success: true,
    projectName,
    projectDescription,
    phase1Requirements: requirementsResult,
    phase2Design: designResult,
    phase3Implementation: implementationResult,
    phase4Testing: testingResult,
    phase5Deployment: deploymentResult,
    phase6Maintenance: maintenanceResult,
    projectMetrics,
    summary: {
      phasesCompleted: 6,
      totalRequirements: requirementsResult.functionalRequirements.length + requirementsResult.nonFunctionalRequirements.length,
      componentsDesigned: designResult.components.length,
      modulesImplemented: implementationResult.modules.length,
      linesOfCode: implementationResult.totalLinesOfCode,
      totalTestsExecuted: testingResult.totalTestsExecuted,
      testPassRate: ((testingResult.totalTestsPassed / testingResult.totalTestsExecuted) * 100).toFixed(1) + '%',
      deploymentStatus: deploymentResult.status,
      productionReady: deploymentResult.status === 'deployed',
      maintenancePlanActive: maintenanceResult.planApproved
    },
    artifacts: {
      requirements: 'artifacts/waterfall/phase-1-requirements/',
      design: 'artifacts/waterfall/phase-2-design/',
      implementation: 'artifacts/waterfall/phase-3-implementation/',
      testing: 'artifacts/waterfall/phase-4-testing/',
      deployment: 'artifacts/waterfall/phase-5-deployment/',
      maintenance: 'artifacts/waterfall/phase-6-maintenance/',
      summary: 'artifacts/waterfall/project-summary.md'
    },
    metadata: {
      processId: 'methodologies/waterfall',
      methodology: 'Waterfall SDLC',
      creator: 'Winston W. Royce',
      year: 1970,
      includeVModel,
      regulatoryCompliance,
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS - ALL INLINE
// ============================================================================

/**
 * Phase 1: Requirements Gathering and Analysis
 * Comprehensive requirements documentation with stakeholder sign-off
 */
export const requirementsGatheringTask = defineTask('requirements-gathering', (args, taskCtx) => ({
  kind: 'agent',
  title: `Requirements Gathering: ${args.projectName}`,
  description: 'Gather and document all functional and non-functional requirements with stakeholder approval',

  agent: {
    name: 'requirements-analyst',
    prompt: {
      role: 'experienced requirements analyst and business analyst',
      task: 'Gather comprehensive requirements and create Software Requirements Specification (SRS)',
      context: {
        projectName: args.projectName,
        projectDescription: args.projectDescription,
        stakeholders: args.stakeholders,
        requirementsSource: args.requirementsSource,
        regulatoryCompliance: args.regulatoryCompliance
      },
      instructions: [
        'Conduct stakeholder interviews and gather all requirements upfront',
        'Document functional requirements: what the system must do',
        'Document non-functional requirements: performance, security, usability, scalability',
        'Create detailed use cases for each major function',
        'Define system scope and boundaries clearly',
        'Identify constraints and assumptions',
        'Document acceptance criteria for each requirement',
        'Create requirements traceability matrix',
        'Include regulatory/compliance requirements if applicable',
        'Write formal Software Requirements Specification (SRS)',
        'Get stakeholder sign-off on all requirements',
        'Requirements must be complete, unambiguous, verifiable, and frozen'
      ],
      outputFormat: 'JSON with comprehensive requirements, use cases, SRS content, and sign-offs'
    },
    outputSchema: {
      type: 'object',
      required: ['functionalRequirements', 'nonFunctionalRequirements', 'useCases', 'srsDocument'],
      properties: {
        functionalRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string', enum: ['must-have', 'should-have', 'nice-to-have'] },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } },
              source: { type: 'string' }
            }
          }
        },
        nonFunctionalRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              category: { type: 'string', enum: ['performance', 'security', 'usability', 'reliability', 'scalability', 'maintainability'] },
              requirement: { type: 'string' },
              metric: { type: 'string' },
              acceptanceCriteria: { type: 'string' }
            }
          }
        },
        useCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              actors: { type: 'array', items: { type: 'string' } },
              preconditions: { type: 'array', items: { type: 'string' } },
              mainFlow: { type: 'array', items: { type: 'string' } },
              alternateFlows: { type: 'array', items: { type: 'string' } },
              postconditions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        constraints: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        scopeDefinition: {
          type: 'object',
          properties: {
            inScope: { type: 'array', items: { type: 'string' } },
            outOfScope: { type: 'array', items: { type: 'string' } }
          }
        },
        srsDocument: {
          type: 'object',
          properties: {
            markdown: { type: 'string' },
            version: { type: 'string' },
            totalPages: { type: 'number' },
            sections: { type: 'array', items: { type: 'string' } }
          }
        },
        traceabilityMatrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              stakeholder: { type: 'string' },
              testCases: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        stakeholderSignoffs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              role: { type: 'string' },
              signedOff: { type: 'boolean' },
              comments: { type: 'string' }
            }
          }
        },
        totalPages: { type: 'number' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/waterfall/phase-1-requirements/srs.md', format: 'markdown' },
      { path: 'artifacts/waterfall/phase-1-requirements/requirements.json', format: 'json' },
      { path: 'artifacts/waterfall/phase-1-requirements/use-cases.md', format: 'markdown' },
      { path: 'artifacts/waterfall/phase-1-requirements/traceability-matrix.md', format: 'markdown' },
      { path: 'artifacts/waterfall/phase-1-requirements/stakeholder-signoffs.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'waterfall', 'requirements', 'phase-1']
}));

/**
 * Phase 2: System and Software Design
 * High-level architecture and detailed design specifications
 */
export const systemDesignTask = defineTask('system-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `System Design: ${args.projectName}`,
  description: 'Create high-level architecture and detailed software design',

  agent: {
    name: 'software-architect',
    prompt: {
      role: 'experienced software architect and system designer',
      task: 'Design complete system architecture and create Software Design Document (SDD)',
      context: {
        projectName: args.projectName,
        requirements: args.requirements,
        testingStrategy: args.testingStrategy,
        includeVModel: args.includeVModel
      },
      instructions: [
        'Design high-level system architecture based on requirements',
        'Define all system components and their responsibilities',
        'Design component interactions and interfaces (APIs)',
        'Create detailed database schema with all tables, relationships, indexes',
        'Design user interface layouts and navigation flows',
        'Define data flow diagrams and sequence diagrams',
        'Specify technology stack and frameworks',
        'Design security architecture and authentication/authorization',
        'Plan for scalability and performance requirements',
        'Create detailed Software Design Document (SDD)',
        'If V-Model: map design levels to corresponding test levels',
        'Get design reviews and sign-offs from technical leads'
      ],
      outputFormat: 'JSON with architecture, components, database design, interfaces, and SDD'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'components', 'databaseSchema', 'interfaces', 'sddDocument'],
      properties: {
        architecture: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['monolithic', 'microservices', 'layered', 'event-driven', 'serverless'] },
            description: { type: 'string' },
            diagram: { type: 'string' },
            layers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  responsibility: { type: 'string' },
                  technologies: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } },
              interfaces: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } },
              requirements: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        databaseSchema: {
          type: 'object',
          properties: {
            databaseType: { type: 'string' },
            tables: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  columns: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        type: { type: 'string' },
                        constraints: { type: 'array', items: { type: 'string' } }
                      }
                    }
                  },
                  indexes: { type: 'array', items: { type: 'string' } },
                  relationships: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        databaseTables: { type: 'array', items: { type: 'string' } },
        interfaces: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string', enum: ['REST-API', 'GraphQL', 'RPC', 'UI', 'CLI', 'message-queue'] },
              endpoints: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    path: { type: 'string' },
                    method: { type: 'string' },
                    description: { type: 'string' },
                    request: { type: 'object' },
                    response: { type: 'object' }
                  }
                }
              }
            }
          }
        },
        securityDesign: {
          type: 'object',
          properties: {
            authentication: { type: 'string' },
            authorization: { type: 'string' },
            dataEncryption: { type: 'string' },
            securityControls: { type: 'array', items: { type: 'string' } }
          }
        },
        dataFlowDiagrams: { type: 'array', items: { type: 'string' } },
        sequenceDiagrams: { type: 'array', items: { type: 'string' } },
        technologyStack: {
          type: 'object',
          properties: {
            frontend: { type: 'array', items: { type: 'string' } },
            backend: { type: 'array', items: { type: 'string' } },
            database: { type: 'array', items: { type: 'string' } },
            infrastructure: { type: 'array', items: { type: 'string' } }
          }
        },
        sddDocument: {
          type: 'object',
          properties: {
            markdown: { type: 'string' },
            version: { type: 'string' },
            sections: { type: 'array', items: { type: 'string' } }
          }
        },
        vModelMapping: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            mappings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  designLevel: { type: 'string' },
                  testLevel: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/waterfall/phase-2-design/sdd.md', format: 'markdown' },
      { path: 'artifacts/waterfall/phase-2-design/architecture-diagram.md', format: 'markdown' },
      { path: 'artifacts/waterfall/phase-2-design/database-schema.md', format: 'markdown' },
      { path: 'artifacts/waterfall/phase-2-design/component-diagram.md', format: 'markdown' },
      { path: 'artifacts/waterfall/phase-2-design/interface-specifications.json', format: 'json' },
      { path: 'artifacts/waterfall/phase-2-design/data-flow-diagrams.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'waterfall', 'design', 'architecture', 'phase-2']
}));

/**
 * Phase 3: Implementation (Coding)
 * Sequential module-by-module implementation with code reviews and unit testing
 */
export const implementationTask = defineTask('implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implementation: ${args.projectName}`,
  description: 'Implement all modules according to design specifications with code reviews',

  agent: {
    name: 'development-team',
    prompt: {
      role: 'experienced development team implementing code to specifications',
      task: 'Implement all system modules according to design specifications',
      context: {
        projectName: args.projectName,
        requirements: args.requirements,
        design: args.design,
        includeVModel: args.includeVModel
      },
      instructions: [
        'Implement all components and modules per design specifications',
        'Follow coding standards and best practices',
        'Implement database schema and migrations',
        'Implement all API endpoints and interfaces',
        'Write code module-by-module, component-by-component',
        'Conduct code reviews for each module',
        'Write unit tests for each module (if V-Model: corresponding to detailed design)',
        'Ensure code coverage meets standards (minimum 80%)',
        'Document code with comments and inline documentation',
        'Track implementation progress against design',
        'Fix issues found during code review',
        'Ensure all functional requirements are implemented'
      ],
      outputFormat: 'JSON with modules implemented, code metrics, unit test results, code reviews'
    },
    outputSchema: {
      type: 'object',
      required: ['modules', 'totalLinesOfCode', 'unitTests', 'codeReviews'],
      properties: {
        modules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              componentId: { type: 'string' },
              linesOfCode: { type: 'number' },
              complexity: { type: 'string', enum: ['low', 'medium', 'high'] },
              codeReviewed: { type: 'boolean' },
              unitTestsPassing: { type: 'boolean' },
              requirementsCovered: { type: 'array', items: { type: 'string' } },
              completionStatus: { type: 'string', enum: ['complete', 'in-progress', 'not-started'] }
            }
          }
        },
        totalLinesOfCode: { type: 'number' },
        codeMetrics: {
          type: 'object',
          properties: {
            totalFiles: { type: 'number' },
            totalFunctions: { type: 'number' },
            avgComplexity: { type: 'number' },
            codeDuplication: { type: 'number' },
            codingStandardsCompliance: { type: 'number' }
          }
        },
        unitTests: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            passed: { type: 'number' },
            failed: { type: 'number' },
            coverage: { type: 'number' },
            testsByModule: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  moduleId: { type: 'string' },
                  tests: { type: 'number' },
                  passed: { type: 'number' }
                }
              }
            }
          }
        },
        codeReviews: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              moduleId: { type: 'string' },
              reviewer: { type: 'string' },
              status: { type: 'string', enum: ['approved', 'needs-changes', 'in-review'] },
              findings: { type: 'array', items: { type: 'string' } },
              resolved: { type: 'boolean' }
            }
          }
        },
        implementationReport: {
          type: 'object',
          properties: {
            completionRate: { type: 'number' },
            requirementsCovered: { type: 'number' },
            totalRequirements: { type: 'number' },
            issues: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  severity: { type: 'string' },
                  description: { type: 'string' },
                  resolution: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/waterfall/phase-3-implementation/implementation-report.md', format: 'markdown' },
      { path: 'artifacts/waterfall/phase-3-implementation/modules.json', format: 'json' },
      { path: 'artifacts/waterfall/phase-3-implementation/code-review-summary.md', format: 'markdown' },
      { path: 'artifacts/waterfall/phase-3-implementation/unit-test-report.md', format: 'markdown' },
      { path: 'artifacts/waterfall/phase-3-implementation/code-metrics.json', format: 'json' }
    ]
  },

  labels: ['agent', 'waterfall', 'implementation', 'coding', 'phase-3']
}));

/**
 * Phase 4: Testing Phase (Integration, System, UAT)
 * Comprehensive testing at all levels following V-Model if applicable
 */
export const testingPhaseTask = defineTask('testing-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: `Testing Phase: ${args.projectName}`,
  description: 'Execute comprehensive testing: integration, system, and user acceptance testing',

  agent: {
    name: 'qa-team',
    prompt: {
      role: 'experienced QA team executing comprehensive testing',
      task: 'Execute all testing levels and validate system against requirements',
      context: {
        projectName: args.projectName,
        requirements: args.requirements,
        design: args.design,
        implementation: args.implementation,
        testingStrategy: args.testingStrategy,
        includeVModel: args.includeVModel
      },
      instructions: [
        'Create Master Test Plan covering all test levels',
        'Execute Integration Testing: test component interactions',
        'Execute System Testing: test complete system against requirements',
        'Execute Performance Testing: validate non-functional requirements',
        'Execute Security Testing: validate security controls',
        'Execute User Acceptance Testing (UAT): validate with end users',
        'If V-Model: map tests back to corresponding design/requirements levels',
        'Log all defects with severity, priority, and status',
        'Verify all must-have requirements are met',
        'Ensure all critical and high-priority defects are resolved',
        'Create comprehensive test reports for each level',
        'Get UAT sign-off from stakeholders'
      ],
      outputFormat: 'JSON with test results for all levels, defect logs, and UAT sign-off'
    },
    outputSchema: {
      type: 'object',
      required: ['integrationTests', 'systemTests', 'uat', 'defects', 'totalTestsExecuted'],
      properties: {
        masterTestPlan: {
          type: 'object',
          properties: {
            testLevels: { type: 'array', items: { type: 'string' } },
            testApproach: { type: 'string' },
            testSchedule: { type: 'string' },
            resources: { type: 'array', items: { type: 'string' } }
          }
        },
        integrationTests: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            passed: { type: 'number' },
            failed: { type: 'number' },
            blocked: { type: 'number' },
            testCases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  description: { type: 'string' },
                  components: { type: 'array', items: { type: 'string' } },
                  status: { type: 'string', enum: ['passed', 'failed', 'blocked'] },
                  defects: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        systemTests: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            passed: { type: 'number' },
            failed: { type: 'number' },
            testCases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  requirementId: { type: 'string' },
                  description: { type: 'string' },
                  status: { type: 'string', enum: ['passed', 'failed'] },
                  defects: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        performanceTests: {
          type: 'object',
          properties: {
            responseTime: { type: 'object', properties: { target: { type: 'number' }, actual: { type: 'number' }, passed: { type: 'boolean' } } },
            throughput: { type: 'object', properties: { target: { type: 'number' }, actual: { type: 'number' }, passed: { type: 'boolean' } } },
            concurrency: { type: 'object', properties: { target: { type: 'number' }, actual: { type: 'number' }, passed: { type: 'boolean' } } }
          }
        },
        securityTests: {
          type: 'object',
          properties: {
            vulnerabilities: { type: 'number' },
            securityTestsPassed: { type: 'number' },
            securityTestsFailed: { type: 'number' },
            findings: { type: 'array', items: { type: 'string' } }
          }
        },
        uat: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['passed', 'passed-with-issues', 'failed'] },
            testScenarios: { type: 'number' },
            scenariosPassed: { type: 'number' },
            stakeholderFeedback: { type: 'array', items: { type: 'string' } },
            signoffs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  stakeholder: { type: 'string' },
                  approved: { type: 'boolean' },
                  comments: { type: 'string' }
                }
              }
            }
          }
        },
        defects: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' },
            defectLog: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                  description: { type: 'string' },
                  status: { type: 'string', enum: ['open', 'in-progress', 'fixed', 'closed', 'deferred'] },
                  foundInPhase: { type: 'string' },
                  requirementId: { type: 'string' }
                }
              }
            }
          }
        },
        requirementsCoverage: {
          type: 'object',
          properties: {
            totalRequirements: { type: 'number' },
            requirementsTested: { type: 'number' },
            requirementsPassed: { type: 'number' },
            coveragePercentage: { type: 'number' }
          }
        },
        vModelTraceability: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            traceability: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  requirementId: { type: 'string' },
                  designElement: { type: 'string' },
                  testCase: { type: 'string' },
                  status: { type: 'string' }
                }
              }
            }
          }
        },
        totalTestsExecuted: { type: 'number' },
        totalTestsPassed: { type: 'number' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/waterfall/phase-4-testing/test-plan.md', format: 'markdown' },
      { path: 'artifacts/waterfall/phase-4-testing/integration-test-report.md', format: 'markdown' },
      { path: 'artifacts/waterfall/phase-4-testing/system-test-report.md', format: 'markdown' },
      { path: 'artifacts/waterfall/phase-4-testing/performance-test-report.md', format: 'markdown' },
      { path: 'artifacts/waterfall/phase-4-testing/security-test-report.md', format: 'markdown' },
      { path: 'artifacts/waterfall/phase-4-testing/uat-report.md', format: 'markdown' },
      { path: 'artifacts/waterfall/phase-4-testing/defect-log.json', format: 'json' },
      { path: 'artifacts/waterfall/phase-4-testing/requirements-coverage.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'waterfall', 'testing', 'qa', 'phase-4']
}));

/**
 * Phase 5: Deployment
 * Production deployment with verification and rollback planning
 */
export const deploymentTask = defineTask('deployment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deployment: ${args.projectName}`,
  description: 'Deploy system to production with verification and rollback plan',

  agent: {
    name: 'deployment-team',
    prompt: {
      role: 'experienced deployment and DevOps team',
      task: 'Execute production deployment with verification and rollback capability',
      context: {
        projectName: args.projectName,
        requirements: args.requirements,
        design: args.design,
        testing: args.testing,
        deploymentTarget: args.deploymentTarget,
        regulatoryCompliance: args.regulatoryCompliance
      },
      instructions: [
        'Create detailed deployment plan with steps and timeline',
        'Prepare production environment (servers, databases, networking)',
        'Configure production environment per design specifications',
        'Execute database migration and data migration if needed',
        'Deploy application code to production',
        'Configure monitoring and alerting',
        'Execute post-deployment verification tests (smoke tests)',
        'Verify all critical functionality is operational',
        'Create rollback plan in case of issues',
        'Document deployment process and configuration',
        'Create release notes for users and support team',
        'If regulatory: ensure compliance documentation is complete'
      ],
      outputFormat: 'JSON with deployment plan, execution results, verification tests, and rollback plan'
    },
    outputSchema: {
      type: 'object',
      required: ['deploymentPlan', 'deploymentType', 'status', 'verificationTests', 'rollbackPlan'],
      properties: {
        deploymentPlan: {
          type: 'object',
          properties: {
            steps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  stepNumber: { type: 'number' },
                  description: { type: 'string' },
                  owner: { type: 'string' },
                  duration: { type: 'string' },
                  status: { type: 'string', enum: ['completed', 'in-progress', 'not-started', 'failed'] }
                }
              }
            },
            timeline: { type: 'string' },
            resources: { type: 'array', items: { type: 'string' } }
          }
        },
        deploymentType: { type: 'string', enum: ['big-bang', 'phased', 'parallel', 'pilot'] },
        environmentSetup: {
          type: 'object',
          properties: {
            servers: { type: 'array', items: { type: 'string' } },
            databases: { type: 'array', items: { type: 'string' } },
            infrastructure: { type: 'array', items: { type: 'string' } },
            configurations: { type: 'array', items: { type: 'string' } }
          }
        },
        dataMigration: {
          type: 'object',
          properties: {
            required: { type: 'boolean' },
            recordsMigrated: { type: 'number' },
            migrationStatus: { type: 'string' },
            validationPassed: { type: 'boolean' }
          }
        },
        deploymentExecution: {
          type: 'object',
          properties: {
            startTime: { type: 'string' },
            endTime: { type: 'string' },
            duration: { type: 'string' },
            componentsDeployed: { type: 'array', items: { type: 'string' } },
            issues: { type: 'array', items: { type: 'string' } }
          }
        },
        verificationTests: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            passed: { type: 'number' },
            failed: { type: 'number' },
            smokeTests: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  test: { type: 'string' },
                  status: { type: 'string', enum: ['passed', 'failed'] },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        monitoring: {
          type: 'object',
          properties: {
            metricsConfigured: { type: 'array', items: { type: 'string' } },
            alertsConfigured: { type: 'array', items: { type: 'string' } },
            dashboardUrl: { type: 'string' }
          }
        },
        rollbackPlan: {
          type: 'object',
          properties: {
            available: { type: 'boolean' },
            steps: { type: 'array', items: { type: 'string' } },
            estimatedTime: { type: 'string' },
            triggers: { type: 'array', items: { type: 'string' } }
          }
        },
        releaseNotes: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            features: { type: 'array', items: { type: 'string' } },
            bugFixes: { type: 'array', items: { type: 'string' } },
            knownIssues: { type: 'array', items: { type: 'string' } },
            upgradeInstructions: { type: 'array', items: { type: 'string' } }
          }
        },
        status: { type: 'string', enum: ['deployed', 'partially-deployed', 'failed', 'rolled-back'] },
        productionUrl: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/waterfall/phase-5-deployment/deployment-plan.md', format: 'markdown' },
      { path: 'artifacts/waterfall/phase-5-deployment/deployment-report.md', format: 'markdown' },
      { path: 'artifacts/waterfall/phase-5-deployment/verification-results.md', format: 'markdown' },
      { path: 'artifacts/waterfall/phase-5-deployment/rollback-plan.md', format: 'markdown' },
      { path: 'artifacts/waterfall/phase-5-deployment/release-notes.md', format: 'markdown' },
      { path: 'artifacts/waterfall/phase-5-deployment/environment-configuration.json', format: 'json' }
    ]
  },

  labels: ['agent', 'waterfall', 'deployment', 'devops', 'phase-5']
}));

/**
 * Phase 6: Maintenance Planning
 * Support procedures, bug tracking, updates, and end-of-life planning
 */
export const maintenancePlanningTask = defineTask('maintenance-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Maintenance Planning: ${args.projectName}`,
  description: 'Plan ongoing maintenance, support procedures, and end-of-life',

  agent: {
    name: 'maintenance-planner',
    prompt: {
      role: 'experienced maintenance manager and support coordinator',
      task: 'Create comprehensive maintenance plan and support procedures',
      context: {
        projectName: args.projectName,
        requirements: args.requirements,
        design: args.design,
        deployment: args.deployment,
        regulatoryCompliance: args.regulatoryCompliance
      },
      instructions: [
        'Define support procedures and escalation paths',
        'Create Service Level Agreement (SLA) with response times',
        'Establish bug tracking and issue management process',
        'Define update and patch management procedures',
        'Create system monitoring and health check procedures',
        'Document backup and recovery procedures',
        'Create training materials for support team and users',
        'Define change management process for updates',
        'Plan for future enhancements and upgrades',
        'Create end-of-life (EOL) plan and sunset strategy',
        'If regulatory: define compliance maintenance procedures',
        'Document handoff to support/maintenance team'
      ],
      outputFormat: 'JSON with maintenance plan, support procedures, SLA, training materials, EOL plan'
    },
    outputSchema: {
      type: 'object',
      required: ['maintenancePlan', 'supportProcedures', 'sla', 'bugTrackingProcess', 'trainingDocuments'],
      properties: {
        maintenancePlan: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            maintenanceTypes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['corrective', 'adaptive', 'perfective', 'preventive'] },
                  description: { type: 'string' },
                  procedures: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            schedule: { type: 'string' },
            resources: { type: 'array', items: { type: 'string' } }
          }
        },
        supportProcedures: {
          type: 'object',
          properties: {
            supportTiers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  tier: { type: 'string' },
                  responsibilities: { type: 'array', items: { type: 'string' } },
                  escalationCriteria: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            contactMethods: { type: 'array', items: { type: 'string' } },
            businessHours: { type: 'string' },
            escalationPath: { type: 'array', items: { type: 'string' } }
          }
        },
        sla: {
          type: 'object',
          properties: {
            availability: { type: 'string' },
            responseTime: { type: 'object', properties: {
              critical: { type: 'string' },
              high: { type: 'string' },
              medium: { type: 'string' },
              low: { type: 'string' }
            }},
            resolutionTime: { type: 'object', properties: {
              critical: { type: 'string' },
              high: { type: 'string' },
              medium: { type: 'string' },
              low: { type: 'string' }
            }},
            penalties: { type: 'array', items: { type: 'string' } }
          }
        },
        bugTrackingProcess: {
          type: 'object',
          properties: {
            tool: { type: 'string' },
            workflow: { type: 'array', items: { type: 'string' } },
            prioritization: { type: 'string' },
            reportingTemplate: { type: 'string' }
          }
        },
        updateManagement: {
          type: 'object',
          properties: {
            patchSchedule: { type: 'string' },
            updateTypes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['hotfix', 'patch', 'minor', 'major'] },
                  approvalProcess: { type: 'string' },
                  deploymentProcess: { type: 'string' }
                }
              }
            },
            testingRequirements: { type: 'array', items: { type: 'string' } }
          }
        },
        monitoringProcedures: {
          type: 'object',
          properties: {
            healthChecks: { type: 'array', items: { type: 'string' } },
            alerting: { type: 'array', items: { type: 'string' } },
            reportingFrequency: { type: 'string' },
            metrics: { type: 'array', items: { type: 'string' } }
          }
        },
        backupRecovery: {
          type: 'object',
          properties: {
            backupSchedule: { type: 'string' },
            retentionPolicy: { type: 'string' },
            recoveryProcedure: { type: 'array', items: { type: 'string' } },
            rto: { type: 'string' },
            rpo: { type: 'string' }
          }
        },
        trainingDocuments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              audience: { type: 'string', enum: ['end-users', 'support-team', 'administrators', 'developers'] },
              format: { type: 'string' },
              topics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        changeManagement: {
          type: 'object',
          properties: {
            process: { type: 'array', items: { type: 'string' } },
            approvalBoard: { type: 'array', items: { type: 'string' } },
            documentation: { type: 'array', items: { type: 'string' } }
          }
        },
        endOfLifePlan: {
          type: 'object',
          properties: {
            estimatedEOL: { type: 'string' },
            sunsetStrategy: { type: 'array', items: { type: 'string' } },
            migrationPath: { type: 'string' },
            dataRetention: { type: 'string' },
            communicationPlan: { type: 'array', items: { type: 'string' } }
          }
        },
        complianceMaintenance: {
          type: 'object',
          properties: {
            audits: { type: 'array', items: { type: 'string' } },
            certifications: { type: 'array', items: { type: 'string' } },
            complianceReviews: { type: 'string' }
          }
        },
        planApproved: { type: 'boolean' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/waterfall/phase-6-maintenance/maintenance-plan.md', format: 'markdown' },
      { path: 'artifacts/waterfall/phase-6-maintenance/support-procedures.md', format: 'markdown' },
      { path: 'artifacts/waterfall/phase-6-maintenance/sla.md', format: 'markdown' },
      { path: 'artifacts/waterfall/phase-6-maintenance/bug-tracking-workflow.md', format: 'markdown' },
      { path: 'artifacts/waterfall/phase-6-maintenance/training-materials.md', format: 'markdown' },
      { path: 'artifacts/waterfall/phase-6-maintenance/backup-recovery-procedures.md', format: 'markdown' },
      { path: 'artifacts/waterfall/phase-6-maintenance/eol-plan.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'waterfall', 'maintenance', 'support', 'phase-6']
}));

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate comprehensive project metrics across all phases
 */
function calculateProjectMetrics(requirements, design, implementation, testing, deployment, maintenance) {
  const totalRequirements = requirements.functionalRequirements.length + requirements.nonFunctionalRequirements.length;
  const requirementsCovered = testing.requirementsCoverage?.requirementsPassed || 0;
  const completionRate = (requirementsCovered / totalRequirements) * 100;

  return {
    phases: {
      requirements: {
        totalRequirements,
        functionalRequirements: requirements.functionalRequirements.length,
        nonFunctionalRequirements: requirements.nonFunctionalRequirements.length,
        useCases: requirements.useCases.length,
        stakeholdersSignedOff: requirements.stakeholderSignoffs.filter(s => s.signedOff).length
      },
      design: {
        components: design.components.length,
        databaseTables: design.databaseTables.length,
        interfaces: design.interfaces.length,
        architectureType: design.architecture.type
      },
      implementation: {
        modules: implementation.modules.length,
        linesOfCode: implementation.totalLinesOfCode,
        unitTests: implementation.unitTests.total,
        codeReviewsApproved: implementation.codeReviews.filter(r => r.status === 'approved').length,
        codeCoverage: implementation.unitTests.coverage
      },
      testing: {
        totalTestsExecuted: testing.totalTestsExecuted,
        totalTestsPassed: testing.totalTestsPassed,
        testPassRate: ((testing.totalTestsPassed / testing.totalTestsExecuted) * 100).toFixed(1) + '%',
        defectsCritical: testing.defects.critical,
        defectsTotal: testing.defects.critical + testing.defects.high + testing.defects.medium + testing.defects.low,
        uatStatus: testing.uat.status
      },
      deployment: {
        status: deployment.status,
        deploymentType: deployment.deploymentType,
        verificationTestsPassed: deployment.verificationTests.passed,
        rollbackAvailable: deployment.rollbackPlan.available
      },
      maintenance: {
        planApproved: maintenance.planApproved,
        slaResponseTime: maintenance.sla.responseTime.critical,
        trainingDocumentsCreated: maintenance.trainingDocuments.length,
        eolPlanned: !!maintenance.endOfLifePlan.estimatedEOL
      }
    },
    overall: {
      completionRate: completionRate.toFixed(1) + '%',
      requirementsCovered,
      totalRequirements,
      qualityGatesPassed: 6, // All 6 phase gates
      projectStatus: deployment.status === 'deployed' ? 'Complete' : 'In Progress',
      readyForProduction: deployment.status === 'deployed' && maintenance.planApproved
    }
  };
}
