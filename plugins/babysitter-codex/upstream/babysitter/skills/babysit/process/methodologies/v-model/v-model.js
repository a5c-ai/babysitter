/**
 * @process methodologies/v-model
 * @description V-Model SDLC - Verification and Validation model with parallel test design
 * @inputs { projectRequirements: string, safetyLevel: string, traceabilityRequired: boolean, testingRigor: string }
 * @outputs { success: boolean, requirements: object, systemDesign: object, architecture: object, moduleDesign: object, implementation: object, testResults: object, traceabilityMatrix: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * V-Model Process
 *
 * Creator: Evolved from waterfall in the 1980s
 * Methodology: Verification and Validation model where each development phase
 * has a corresponding testing phase. The V-shape represents decomposition on
 * the left side and integration/validation on the right side.
 *
 * Process Flow:
 * LEFT SIDE (Decomposition):
 * 1. Requirements Analysis → Design Acceptance Tests
 * 2. System Design → Design System Tests
 * 3. Architectural Design → Design Integration Tests
 * 4. Module Design → Design Unit Tests
 *
 * BOTTOM: Implementation (Coding)
 *
 * RIGHT SIDE (Integration/Validation):
 * 5. Unit Testing (validates Module Design)
 * 6. Integration Testing (validates Architecture)
 * 7. System Testing (validates System Design)
 * 8. Acceptance Testing (validates Requirements)
 *
 * 9. Traceability Matrix Generation
 *
 * Success Criteria:
 * - All requirements traced to tests
 * - All tests designed before implementation
 * - Tests pass at each level
 * - Complete coverage verified
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectRequirements - Project requirements document or description
 * @param {string} inputs.safetyLevel - Safety criticality: 'standard'|'high'|'critical' (default: 'standard')
 * @param {boolean} inputs.traceabilityRequired - Generate full traceability matrix (default: true)
 * @param {string} inputs.testingRigor - Testing thoroughness: 'basic'|'thorough'|'exhaustive' (default: 'thorough')
 * @param {Object} inputs.existingArtifacts - Existing design/code to integrate
 * @param {Array<string>} inputs.complianceStandards - Standards to comply with (e.g., ISO 26262, DO-178C)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Complete V-Model results with all artifacts
 */
export async function process(inputs, ctx) {
  const {
    projectRequirements,
    safetyLevel = 'standard',
    traceabilityRequired = true,
    testingRigor = 'thorough',
    existingArtifacts = null,
    complianceStandards = []
  } = inputs;

  if (!projectRequirements || projectRequirements.trim().length === 0) {
    throw new Error('Project requirements are required for V-Model process');
  }

  const processStartTime = ctx.now();

  // ============================================================================
  // LEFT SIDE OF V: DECOMPOSITION & TEST DESIGN
  // ============================================================================

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS + ACCEPTANCE TEST DESIGN
  // ============================================================================

  const requirementsPhase = await ctx.task(requirementsWithAcceptanceTask, {
    projectRequirements,
    safetyLevel,
    complianceStandards,
    existingArtifacts
  });

  const requirements = requirementsPhase.requirements;
  const acceptanceTestDesign = requirementsPhase.acceptanceTestDesign;

  // Breakpoint: Review requirements and acceptance test plan
  await ctx.breakpoint({
    question: `Requirements Analysis Complete: ${requirements.functionalRequirements.length} functional requirements, ${requirements.nonFunctionalRequirements.length} non-functional requirements identified. ${acceptanceTestDesign.testCases.length} acceptance test cases designed. Review requirements and acceptance test plan?`,
    title: 'Requirements & Acceptance Test Design Review',
    context: {
      runId: ctx.runId,
      files: [
        {
          path: 'artifacts/v-model/requirements-specification.md',
          format: 'markdown',
          label: 'Requirements Specification'
        },
        {
          path: 'artifacts/v-model/acceptance-test-plan.md',
          format: 'markdown',
          label: 'Acceptance Test Plan'
        },
        {
          path: 'artifacts/v-model/requirements-traceability-seed.json',
          format: 'code',
          language: 'json',
          label: 'Traceability Seed'
        }
      ]
    }
  });

  // ============================================================================
  // PHASE 2: SYSTEM DESIGN + SYSTEM TEST DESIGN
  // ============================================================================

  const systemDesignPhase = await ctx.task(systemDesignWithSystemTestTask, {
    requirements,
    acceptanceTestDesign,
    safetyLevel,
    testingRigor,
    complianceStandards
  });

  const systemDesign = systemDesignPhase.systemDesign;
  const systemTestDesign = systemDesignPhase.systemTestDesign;

  // Breakpoint: Review system design and system test plan
  await ctx.breakpoint({
    question: `System Design Complete: ${systemDesign.components.length} major components, ${systemDesign.interfaces.length} interfaces defined. ${systemTestDesign.testCases.length} system test cases designed. Review system design and test plan?`,
    title: 'System Design & Test Review',
    context: {
      runId: ctx.runId,
      files: [
        {
          path: 'artifacts/v-model/system-design.md',
          format: 'markdown',
          label: 'System Design Document'
        },
        {
          path: 'artifacts/v-model/system-test-plan.md',
          format: 'markdown',
          label: 'System Test Plan'
        },
        {
          path: 'artifacts/v-model/system-architecture-diagram.md',
          format: 'markdown',
          label: 'Architecture Diagram'
        }
      ]
    }
  });

  // ============================================================================
  // PHASE 3: ARCHITECTURAL DESIGN + INTEGRATION TEST DESIGN
  // ============================================================================

  const architecturePhase = await ctx.task(architectureWithIntegrationTestTask, {
    systemDesign,
    systemTestDesign,
    requirements,
    safetyLevel,
    testingRigor
  });

  const architecture = architecturePhase.architecture;
  const integrationTestDesign = architecturePhase.integrationTestDesign;

  // Breakpoint: Review architectural design and integration test plan
  await ctx.breakpoint({
    question: `Architectural Design Complete: ${architecture.modules.length} modules, ${architecture.interfaces.length} interfaces, ${architecture.dataFlows.length} data flows defined. ${integrationTestDesign.testCases.length} integration test cases designed. Review architecture and integration test plan?`,
    title: 'Architecture & Integration Test Review',
    context: {
      runId: ctx.runId,
      files: [
        {
          path: 'artifacts/v-model/architectural-design.md',
          format: 'markdown',
          label: 'Architectural Design'
        },
        {
          path: 'artifacts/v-model/integration-test-plan.md',
          format: 'markdown',
          label: 'Integration Test Plan'
        },
        {
          path: 'artifacts/v-model/module-interface-specs.md',
          format: 'markdown',
          label: 'Module Interface Specifications'
        }
      ]
    }
  });

  // ============================================================================
  // PHASE 4: MODULE DESIGN + UNIT TEST DESIGN
  // ============================================================================

  // Design modules in parallel
  const moduleDesignResults = await ctx.parallel.all(
    architecture.modules.map(module => async () => {
      const result = await ctx.task(moduleDesignWithUnitTestTask, {
        module,
        architecture,
        requirements,
        safetyLevel,
        testingRigor
      });
      return result;
    })
  );

  const moduleDesigns = moduleDesignResults.map(r => r.moduleDesign);
  const unitTestDesigns = moduleDesignResults.map(r => r.unitTestDesign);

  // Consolidate all unit tests
  const allUnitTests = unitTestDesigns.flatMap(utd => utd.testCases);

  // Breakpoint: Review module designs and unit test plans
  await ctx.breakpoint({
    question: `Module Design Complete: ${moduleDesigns.length} modules detailed with ${allUnitTests.length} total unit test cases designed. Review module designs and unit test plans?`,
    title: 'Module Design & Unit Test Review',
    context: {
      runId: ctx.runId,
      files: [
        {
          path: 'artifacts/v-model/module-designs.md',
          format: 'markdown',
          label: 'Module Design Specifications'
        },
        {
          path: 'artifacts/v-model/unit-test-plans.md',
          format: 'markdown',
          label: 'Unit Test Plans'
        },
        {
          path: 'artifacts/v-model/module-specifications.json',
          format: 'code',
          language: 'json',
          label: 'Module Specifications (JSON)'
        }
      ]
    }
  });

  // ============================================================================
  // BOTTOM OF V: IMPLEMENTATION
  // ============================================================================

  const implementationPhase = await ctx.task(implementationTask, {
    moduleDesigns,
    architecture,
    systemDesign,
    requirements,
    unitTestDesigns,
    safetyLevel,
    existingArtifacts
  });

  const implementation = implementationPhase.implementation;

  // Breakpoint: Review implementation
  await ctx.breakpoint({
    question: `Implementation Complete: ${implementation.modules.length} modules implemented, ${implementation.filesCreated.length} files created. Code reviews: ${implementation.codeReviewsPassed ? 'PASSED' : 'PENDING'}. Static analysis: ${implementation.staticAnalysisPassed ? 'PASSED' : 'ISSUES FOUND'}. Proceed to testing phase?`,
    title: 'Implementation Review',
    context: {
      runId: ctx.runId,
      files: [
        {
          path: 'artifacts/v-model/implementation-report.md',
          format: 'markdown',
          label: 'Implementation Report'
        },
        {
          path: 'artifacts/v-model/code-review-results.md',
          format: 'markdown',
          label: 'Code Review Results'
        },
        {
          path: 'artifacts/v-model/static-analysis-report.md',
          format: 'markdown',
          label: 'Static Analysis Report'
        }
      ]
    }
  });

  // ============================================================================
  // RIGHT SIDE OF V: INTEGRATION & VALIDATION
  // ============================================================================

  const executeTestsPhase = await ctx.task(executeTestsTask, {
    implementation,
    unitTestDesigns,
    integrationTestDesign,
    systemTestDesign,
    acceptanceTestDesign,
    requirements,
    testingRigor,
    safetyLevel
  });

  const testResults = executeTestsPhase.testResults;

  // Check if all tests passed
  const allTestsPassed =
    testResults.unitTests.passed &&
    testResults.integrationTests.passed &&
    testResults.systemTests.passed &&
    testResults.acceptanceTests.passed;

  // Breakpoint: Review test results
  await ctx.breakpoint({
    question: `Testing Complete:
- Unit Tests: ${testResults.unitTests.passedCount}/${testResults.unitTests.totalCount} passed (${testResults.unitTests.passed ? 'PASS' : 'FAIL'})
- Integration Tests: ${testResults.integrationTests.passedCount}/${testResults.integrationTests.totalCount} passed (${testResults.integrationTests.passed ? 'PASS' : 'FAIL'})
- System Tests: ${testResults.systemTests.passedCount}/${testResults.systemTests.totalCount} passed (${testResults.systemTests.passed ? 'PASS' : 'FAIL'})
- Acceptance Tests: ${testResults.acceptanceTests.passedCount}/${testResults.acceptanceTests.totalCount} passed (${testResults.acceptanceTests.passed ? 'PASS' : 'FAIL'})

Overall: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ TESTS FAILED'}

Review test results and ${allTestsPassed ? 'proceed to traceability' : 'address failures'}?`,
    title: 'Test Results Review',
    context: {
      runId: ctx.runId,
      files: [
        {
          path: 'artifacts/v-model/test-results-summary.md',
          format: 'markdown',
          label: 'Test Results Summary'
        },
        {
          path: 'artifacts/v-model/unit-test-results.json',
          format: 'code',
          language: 'json',
          label: 'Unit Test Results'
        },
        {
          path: 'artifacts/v-model/integration-test-results.json',
          format: 'code',
          language: 'json',
          label: 'Integration Test Results'
        },
        {
          path: 'artifacts/v-model/system-test-results.json',
          format: 'code',
          language: 'json',
          label: 'System Test Results'
        },
        {
          path: 'artifacts/v-model/acceptance-test-results.json',
          format: 'code',
          language: 'json',
          label: 'Acceptance Test Results'
        }
      ]
    }
  });

  // ============================================================================
  // PHASE 9: TRACEABILITY MATRIX GENERATION
  // ============================================================================

  let traceabilityMatrix = null;

  if (traceabilityRequired) {
    const traceabilityPhase = await ctx.task(traceabilityMatrixTask, {
      requirements,
      systemDesign,
      architecture,
      moduleDesigns,
      implementation,
      unitTestDesigns,
      integrationTestDesign,
      systemTestDesign,
      acceptanceTestDesign,
      testResults,
      complianceStandards
    });

    traceabilityMatrix = traceabilityPhase.traceabilityMatrix;

    // Breakpoint: Review traceability matrix
    await ctx.breakpoint({
      question: `Traceability Matrix Complete:
- Requirements Coverage: ${traceabilityMatrix.requirementsCoverage}%
- Design Coverage: ${traceabilityMatrix.designCoverage}%
- Test Coverage: ${traceabilityMatrix.testCoverage}%
- Implementation Coverage: ${traceabilityMatrix.implementationCoverage}%
- Gaps Identified: ${traceabilityMatrix.gaps.length}
- Compliance: ${traceabilityMatrix.complianceStatus}

Review traceability matrix and ${traceabilityMatrix.gaps.length === 0 ? 'finalize V-Model' : 'address gaps'}?`,
      title: 'Traceability Matrix Review',
      context: {
        runId: ctx.runId,
        files: [
          {
            path: 'artifacts/v-model/traceability-matrix.md',
            format: 'markdown',
            label: 'Traceability Matrix'
          },
          {
            path: 'artifacts/v-model/coverage-report.md',
            format: 'markdown',
            label: 'Coverage Report'
          },
          {
            path: 'artifacts/v-model/gaps-analysis.md',
            format: 'markdown',
            label: 'Gaps Analysis'
          },
          {
            path: 'artifacts/v-model/compliance-report.md',
            format: 'markdown',
            label: 'Compliance Report'
          }
        ]
      }
    });
  }

  // ============================================================================
  // RETURN RESULTS
  // ============================================================================

  const processEndTime = ctx.now();
  const durationMinutes = (processEndTime - processStartTime) / (1000 * 60);

  return {
    success: allTestsPassed,
    durationMinutes,
    safetyLevel,
    testingRigor,
    requirements: {
      total: requirements.functionalRequirements.length + requirements.nonFunctionalRequirements.length,
      functional: requirements.functionalRequirements.length,
      nonFunctional: requirements.nonFunctionalRequirements.length,
      details: requirements
    },
    systemDesign: {
      componentCount: systemDesign.components.length,
      interfaceCount: systemDesign.interfaces.length,
      details: systemDesign
    },
    architecture: {
      moduleCount: architecture.modules.length,
      interfaceCount: architecture.interfaces.length,
      dataFlowCount: architecture.dataFlows.length,
      details: architecture
    },
    moduleDesign: {
      moduleCount: moduleDesigns.length,
      details: moduleDesigns
    },
    implementation: {
      modulesImplemented: implementation.modules.length,
      filesCreated: implementation.filesCreated.length,
      codeReviewsPassed: implementation.codeReviewsPassed,
      staticAnalysisPassed: implementation.staticAnalysisPassed,
      details: implementation
    },
    testResults: {
      unitTests: testResults.unitTests,
      integrationTests: testResults.integrationTests,
      systemTests: testResults.systemTests,
      acceptanceTests: testResults.acceptanceTests,
      allPassed: allTestsPassed,
      summary: testResults.summary
    },
    traceabilityMatrix: traceabilityRequired ? traceabilityMatrix : null,
    artifacts: {
      requirements: 'artifacts/v-model/requirements-specification.md',
      acceptanceTestPlan: 'artifacts/v-model/acceptance-test-plan.md',
      systemDesign: 'artifacts/v-model/system-design.md',
      systemTestPlan: 'artifacts/v-model/system-test-plan.md',
      architecturalDesign: 'artifacts/v-model/architectural-design.md',
      integrationTestPlan: 'artifacts/v-model/integration-test-plan.md',
      moduleDesigns: 'artifacts/v-model/module-designs.md',
      unitTestPlans: 'artifacts/v-model/unit-test-plans.md',
      implementationReport: 'artifacts/v-model/implementation-report.md',
      testResults: 'artifacts/v-model/test-results-summary.md',
      traceabilityMatrix: traceabilityRequired ? 'artifacts/v-model/traceability-matrix.md' : null,
      coverageReport: traceabilityRequired ? 'artifacts/v-model/coverage-report.md' : null
    },
    metadata: {
      processId: 'methodologies/v-model',
      safetyLevel,
      testingRigor,
      traceabilityRequired,
      complianceStandards,
      timestamp: ctx.now(),
      vModelPhases: [
        'Requirements + Acceptance Test Design',
        'System Design + System Test Design',
        'Architectural Design + Integration Test Design',
        'Module Design + Unit Test Design',
        'Implementation',
        'Unit Testing',
        'Integration Testing',
        'System Testing',
        'Acceptance Testing',
        'Traceability Matrix'
      ]
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Task: Requirements Analysis + Acceptance Test Design
 * LEFT SIDE - TOP: Gather requirements and design acceptance tests
 */
export const requirementsWithAcceptanceTask = defineTask('requirements-with-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Requirements Analysis + Acceptance Test Design',
  agent: {
    name: 'requirements-analyst',
    prompt: {
      role: 'system',
      content: `You are an expert requirements engineer and test architect conducting V-Model requirements analysis.

Your task is to analyze project requirements and simultaneously design acceptance test cases.

Requirements Analysis:
1. **Functional Requirements**: What the system must do
2. **Non-Functional Requirements**: Performance, security, usability, reliability
3. **Constraints**: Technical, business, regulatory constraints
4. **Assumptions**: Document all assumptions
5. **Success Criteria**: How to measure success

Acceptance Test Design (Parallel):
- Design test cases that validate requirements
- Define validation criteria for each requirement
- Specify test data and expected results
- Plan user acceptance scenarios
- Define entry/exit criteria

V-Model Traceability:
- Each requirement MUST have corresponding acceptance test(s)
- Create initial traceability mapping
- Requirements ID → Acceptance Test IDs

Context:
- Project Requirements: {{projectRequirements}}
- Safety Level: {{safetyLevel}}
- Compliance Standards: {{complianceStandards}}
- Existing Artifacts: {{existingArtifacts}}

Output structured requirements and acceptance test design.`
    },
    outputSchema: {
      type: 'object',
      properties: {
        requirements: {
          type: 'object',
          properties: {
            functionalRequirements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  description: { type: 'string' },
                  priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                  category: { type: 'string' },
                  acceptanceCriteria: { type: 'array', items: { type: 'string' } },
                  constraints: { type: 'array', items: { type: 'string' } }
                },
                required: ['id', 'description', 'priority']
              }
            },
            nonFunctionalRequirements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  category: { type: 'string', enum: ['performance', 'security', 'usability', 'reliability', 'maintainability', 'scalability'] },
                  description: { type: 'string' },
                  metric: { type: 'string' },
                  target: { type: 'string' },
                  priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
                },
                required: ['id', 'category', 'description', 'priority']
              }
            },
            constraints: { type: 'array', items: { type: 'string' } },
            assumptions: { type: 'array', items: { type: 'string' } },
            successCriteria: { type: 'array', items: { type: 'string' } }
          },
          required: ['functionalRequirements', 'nonFunctionalRequirements']
        },
        acceptanceTestDesign: {
          type: 'object',
          properties: {
            testCases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  requirementIds: { type: 'array', items: { type: 'string' } },
                  description: { type: 'string' },
                  preconditions: { type: 'array', items: { type: 'string' } },
                  testSteps: { type: 'array', items: { type: 'string' } },
                  expectedResults: { type: 'array', items: { type: 'string' } },
                  testData: { type: 'object' },
                  priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
                },
                required: ['id', 'name', 'requirementIds', 'testSteps', 'expectedResults']
              }
            },
            entryCriteria: { type: 'array', items: { type: 'string' } },
            exitCriteria: { type: 'array', items: { type: 'string' } }
          },
          required: ['testCases']
        },
        traceability: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              acceptanceTestIds: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      },
      required: ['requirements', 'acceptanceTestDesign', 'traceability']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['agent', 'v-model', 'requirements', 'acceptance-test']
}));

/**
 * Task: System Design + System Test Design
 * LEFT SIDE - LEVEL 2: High-level system design and system test planning
 */
export const systemDesignWithSystemTestTask = defineTask('system-design-with-system-test', (args, taskCtx) => ({
  kind: 'agent',
  title: 'System Design + System Test Design',
  agent: {
    name: 'system-architect',
    prompt: {
      role: 'system',
      content: `You are an expert system architect and test designer conducting V-Model system design.

Your task is to create high-level system design and design corresponding system test cases.

System Design:
1. **System Components**: Major subsystems and components
2. **Interfaces**: External and internal interfaces
3. **Data Flow**: How data moves through the system
4. **Technology Stack**: Platforms, frameworks, tools
5. **Deployment Architecture**: How system is deployed
6. **Integration Strategy**: How components integrate

System Test Design (Parallel):
- Design tests that validate system-level behavior
- Test system integration and interactions
- Verify system meets requirements
- Test end-to-end scenarios
- Define system test environment

V-Model Traceability:
- System Design Element → System Test Cases
- Requirements → System Design → System Tests

Context:
- Requirements: {{requirements}}
- Acceptance Test Design: {{acceptanceTestDesign}}
- Safety Level: {{safetyLevel}}
- Testing Rigor: {{testingRigor}}
- Compliance Standards: {{complianceStandards}}

Output structured system design and system test plan.`
    },
    outputSchema: {
      type: 'object',
      properties: {
        systemDesign: {
          type: 'object',
          properties: {
            components: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  responsibilities: { type: 'array', items: { type: 'string' } },
                  requirementIds: { type: 'array', items: { type: 'string' } }
                },
                required: ['id', 'name', 'description']
              }
            },
            interfaces: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  type: { type: 'string', enum: ['external', 'internal', 'api', 'ui', 'data'] },
                  description: { type: 'string' },
                  connectedComponents: { type: 'array', items: { type: 'string' } }
                },
                required: ['id', 'name', 'type']
              }
            },
            dataFlows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  source: { type: 'string' },
                  destination: { type: 'string' },
                  dataType: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            },
            technologyStack: {
              type: 'object',
              properties: {
                frontend: { type: 'array', items: { type: 'string' } },
                backend: { type: 'array', items: { type: 'string' } },
                database: { type: 'array', items: { type: 'string' } },
                infrastructure: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          required: ['components', 'interfaces']
        },
        systemTestDesign: {
          type: 'object',
          properties: {
            testCases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  componentIds: { type: 'array', items: { type: 'string' } },
                  requirementIds: { type: 'array', items: { type: 'string' } },
                  type: { type: 'string', enum: ['functional', 'integration', 'end-to-end', 'performance', 'security'] },
                  description: { type: 'string' },
                  testSteps: { type: 'array', items: { type: 'string' } },
                  expectedResults: { type: 'array', items: { type: 'string' } },
                  priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
                },
                required: ['id', 'name', 'type', 'testSteps', 'expectedResults']
              }
            },
            testEnvironment: { type: 'string' },
            entryCriteria: { type: 'array', items: { type: 'string' } },
            exitCriteria: { type: 'array', items: { type: 'string' } }
          },
          required: ['testCases']
        },
        traceability: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              componentId: { type: 'string' },
              systemTestIds: { type: 'array', items: { type: 'string' } },
              requirementIds: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      },
      required: ['systemDesign', 'systemTestDesign', 'traceability']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['agent', 'v-model', 'system-design', 'system-test']
}));

/**
 * Task: Architectural Design + Integration Test Design
 * LEFT SIDE - LEVEL 3: Detailed architecture and integration test planning
 */
export const architectureWithIntegrationTestTask = defineTask('architecture-with-integration-test', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Architectural Design + Integration Test Design',
  agent: {
    name: 'software-architect',
    prompt: {
      role: 'system',
      content: `You are an expert software architect and integration test designer conducting V-Model architectural design.

Your task is to create detailed architectural design and design integration test cases.

Architectural Design:
1. **Modules**: Break components into modules
2. **Module Interfaces**: Define clear interfaces between modules
3. **Data Structures**: Define key data structures
4. **Communication Protocols**: How modules communicate
5. **Error Handling**: Module-level error handling strategy
6. **Module Dependencies**: Dependency graph

Integration Test Design (Parallel):
- Design tests that validate module integration
- Test interface contracts
- Verify data flow between modules
- Test error handling across boundaries
- Define integration test sequences

V-Model Traceability:
- Module → Integration Test Cases
- System Design → Architecture → Integration Tests

Context:
- System Design: {{systemDesign}}
- System Test Design: {{systemTestDesign}}
- Requirements: {{requirements}}
- Safety Level: {{safetyLevel}}
- Testing Rigor: {{testingRigor}}

Output structured architectural design and integration test plan.`
    },
    outputSchema: {
      type: 'object',
      properties: {
        architecture: {
          type: 'object',
          properties: {
            modules: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  componentId: { type: 'string' },
                  description: { type: 'string' },
                  responsibilities: { type: 'array', items: { type: 'string' } },
                  dependencies: { type: 'array', items: { type: 'string' } },
                  interfaces: { type: 'array', items: { type: 'string' } }
                },
                required: ['id', 'name', 'componentId', 'description']
              }
            },
            interfaces: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  sourceModule: { type: 'string' },
                  targetModule: { type: 'string' },
                  methods: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        parameters: { type: 'array', items: { type: 'string' } },
                        returnType: { type: 'string' },
                        description: { type: 'string' }
                      }
                    }
                  }
                },
                required: ['id', 'name', 'sourceModule', 'targetModule']
              }
            },
            dataFlows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  sourceModule: { type: 'string' },
                  targetModule: { type: 'string' },
                  dataType: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            }
          },
          required: ['modules', 'interfaces']
        },
        integrationTestDesign: {
          type: 'object',
          properties: {
            testCases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  moduleIds: { type: 'array', items: { type: 'string' } },
                  interfaceIds: { type: 'array', items: { type: 'string' } },
                  type: { type: 'string', enum: ['interface', 'data-flow', 'dependency', 'error-handling'] },
                  description: { type: 'string' },
                  testSteps: { type: 'array', items: { type: 'string' } },
                  expectedResults: { type: 'array', items: { type: 'string' } },
                  priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
                },
                required: ['id', 'name', 'moduleIds', 'type', 'testSteps', 'expectedResults']
              }
            },
            testSequences: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  testCaseIds: { type: 'array', items: { type: 'string' } },
                  description: { type: 'string' }
                }
              }
            },
            entryCriteria: { type: 'array', items: { type: 'string' } },
            exitCriteria: { type: 'array', items: { type: 'string' } }
          },
          required: ['testCases']
        },
        traceability: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              moduleId: { type: 'string' },
              integrationTestIds: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      },
      required: ['architecture', 'integrationTestDesign', 'traceability']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['agent', 'v-model', 'architecture', 'integration-test']
}));

/**
 * Task: Module Design + Unit Test Design
 * LEFT SIDE - LEVEL 4 (BOTTOM): Detailed module design and unit test planning
 */
export const moduleDesignWithUnitTestTask = defineTask('module-design-with-unit-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Module Design + Unit Test: ${args.module.name}`,
  agent: {
    name: 'module-designer',
    prompt: {
      role: 'system',
      content: `You are an expert software designer and unit test designer conducting V-Model module design.

Your task is to create detailed module design and design unit test cases.

Module Design:
1. **Classes/Functions**: Detailed class and function definitions
2. **Data Structures**: Internal data structures
3. **Algorithms**: Key algorithms and logic
4. **Error Handling**: Module-level error handling
5. **Code-Level Specifications**: Pseudo-code or detailed specs
6. **Dependencies**: External dependencies

Unit Test Design (Parallel):
- Design tests for each function/method
- Test boundary conditions
- Test error paths
- Test edge cases
- Define test fixtures and mocks
- Aim for high code coverage

V-Model Traceability:
- Function/Class → Unit Test Cases
- Module → Functions → Unit Tests

Context:
- Module: {{module}}
- Architecture: {{architecture}}
- Requirements: {{requirements}}
- Safety Level: {{safetyLevel}}
- Testing Rigor: {{testingRigor}}

Output structured module design and unit test plan.`
    },
    outputSchema: {
      type: 'object',
      properties: {
        moduleDesign: {
          type: 'object',
          properties: {
            moduleId: { type: 'string' },
            moduleName: { type: 'string' },
            classes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  methods: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        parameters: { type: 'array', items: { type: 'string' } },
                        returnType: { type: 'string' },
                        description: { type: 'string' },
                        algorithm: { type: 'string' },
                        errorHandling: { type: 'array', items: { type: 'string' } }
                      },
                      required: ['id', 'name', 'description']
                    }
                  },
                  attributes: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        type: { type: 'string' },
                        description: { type: 'string' }
                      }
                    }
                  }
                },
                required: ['id', 'name', 'description']
              }
            },
            functions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  parameters: { type: 'array', items: { type: 'string' } },
                  returnType: { type: 'string' },
                  description: { type: 'string' },
                  algorithm: { type: 'string' }
                },
                required: ['id', 'name', 'description']
              }
            },
            dataStructures: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            }
          },
          required: ['moduleId', 'moduleName']
        },
        unitTestDesign: {
          type: 'object',
          properties: {
            testCases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  targetId: { type: 'string', description: 'Class or function ID' },
                  targetType: { type: 'string', enum: ['class', 'function', 'method'] },
                  type: { type: 'string', enum: ['happy-path', 'boundary', 'error', 'edge-case'] },
                  description: { type: 'string' },
                  setup: { type: 'array', items: { type: 'string' } },
                  inputs: { type: 'object' },
                  expectedOutput: { type: 'string' },
                  assertions: { type: 'array', items: { type: 'string' } },
                  priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
                },
                required: ['id', 'name', 'targetId', 'type', 'assertions']
              }
            },
            fixtures: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  data: { type: 'object' }
                }
              }
            },
            mocks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  interface: { type: 'string' }
                }
              }
            },
            coverageTarget: { type: 'number', description: 'Target code coverage percentage' }
          },
          required: ['testCases']
        },
        traceability: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              elementId: { type: 'string', description: 'Class or function ID' },
              unitTestIds: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      },
      required: ['moduleDesign', 'unitTestDesign', 'traceability']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['agent', 'v-model', 'module-design', 'unit-test', args.module.id]
}));

/**
 * Task: Implementation
 * BOTTOM OF V: Code implementation with reviews and static analysis
 */
export const implementationTask = defineTask('implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implementation (Coding Phase)',
  agent: {
    name: 'developer',
    prompt: {
      role: 'system',
      content: `You are an expert software developer implementing V-Model design specifications.

Your task is to implement the modules according to detailed design specifications.

Implementation Activities:
1. **Code Implementation**: Write production code per module designs
2. **Code Reviews**: Conduct peer reviews
3. **Static Analysis**: Run static analysis tools
4. **Coding Standards**: Ensure compliance with coding standards
5. **Documentation**: Code comments and documentation
6. **Version Control**: Track all changes

Guidelines:
- Follow module design specifications exactly
- Implement all classes, functions, and algorithms as specified
- Include comprehensive error handling
- Add inline documentation
- Follow coding standards and best practices
- Prepare code for unit testing

Context:
- Module Designs: {{moduleDesigns}}
- Architecture: {{architecture}}
- System Design: {{systemDesign}}
- Requirements: {{requirements}}
- Unit Test Designs: {{unitTestDesigns}}
- Safety Level: {{safetyLevel}}
- Existing Artifacts: {{existingArtifacts}}

Output implementation report with code quality metrics.`
    },
    outputSchema: {
      type: 'object',
      properties: {
        implementation: {
          type: 'object',
          properties: {
            modules: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  moduleId: { type: 'string' },
                  moduleName: { type: 'string' },
                  filesCreated: { type: 'array', items: { type: 'string' } },
                  linesOfCode: { type: 'number' },
                  codeReviewStatus: { type: 'string', enum: ['passed', 'pending', 'failed'] },
                  staticAnalysisIssues: { type: 'number' }
                },
                required: ['moduleId', 'moduleName', 'filesCreated']
              }
            },
            filesCreated: { type: 'array', items: { type: 'string' } },
            totalLinesOfCode: { type: 'number' },
            codeReviewsPassed: { type: 'boolean' },
            codeReviewDetails: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  moduleId: { type: 'string' },
                  reviewer: { type: 'string' },
                  status: { type: 'string', enum: ['approved', 'changes-requested', 'rejected'] },
                  comments: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            staticAnalysisPassed: { type: 'boolean' },
            staticAnalysisResults: {
              type: 'object',
              properties: {
                totalIssues: { type: 'number' },
                critical: { type: 'number' },
                high: { type: 'number' },
                medium: { type: 'number' },
                low: { type: 'number' },
                details: { type: 'array', items: { type: 'string' } }
              }
            },
            codingStandardsCompliance: { type: 'boolean' },
            documentationComplete: { type: 'boolean' }
          },
          required: ['modules', 'filesCreated', 'codeReviewsPassed', 'staticAnalysisPassed']
        }
      },
      required: ['implementation']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['agent', 'v-model', 'implementation', 'coding']
}));

/**
 * Task: Execute Tests
 * RIGHT SIDE OF V: Execute all test levels (Unit → Integration → System → Acceptance)
 */
export const executeTestsTask = defineTask('execute-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute All Tests (Right Side of V)',
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'system',
      content: `You are an expert test engineer executing V-Model test phases.

Your task is to execute all test levels in sequence: Unit → Integration → System → Acceptance.

Testing Sequence (Bottom-Up on Right Side):
1. **Unit Tests**: Test individual functions/classes (validates Module Design)
2. **Integration Tests**: Test module interactions (validates Architecture)
3. **System Tests**: Test system as a whole (validates System Design)
4. **Acceptance Tests**: Validate requirements met (validates Requirements)

For Each Test Level:
- Execute all test cases
- Record results (passed/failed)
- Document defects
- Provide detailed test reports
- Calculate coverage metrics

Pass/Fail Criteria:
- Unit Tests: All critical and high priority tests must pass
- Integration Tests: All interface tests must pass
- System Tests: All functional and critical non-functional tests must pass
- Acceptance Tests: All acceptance criteria must be met

Context:
- Implementation: {{implementation}}
- Unit Test Designs: {{unitTestDesigns}}
- Integration Test Design: {{integrationTestDesign}}
- System Test Design: {{systemTestDesign}}
- Acceptance Test Design: {{acceptanceTestDesign}}
- Requirements: {{requirements}}
- Testing Rigor: {{testingRigor}}
- Safety Level: {{safetyLevel}}

Output comprehensive test results for all levels.`
    },
    outputSchema: {
      type: 'object',
      properties: {
        testResults: {
          type: 'object',
          properties: {
            unitTests: {
              type: 'object',
              properties: {
                totalCount: { type: 'number' },
                passedCount: { type: 'number' },
                failedCount: { type: 'number' },
                skippedCount: { type: 'number' },
                passed: { type: 'boolean' },
                coverage: { type: 'number', description: 'Code coverage percentage' },
                results: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      testId: { type: 'string' },
                      status: { type: 'string', enum: ['passed', 'failed', 'skipped'] },
                      duration: { type: 'number', description: 'Milliseconds' },
                      error: { type: 'string' }
                    }
                  }
                }
              },
              required: ['totalCount', 'passedCount', 'failedCount', 'passed']
            },
            integrationTests: {
              type: 'object',
              properties: {
                totalCount: { type: 'number' },
                passedCount: { type: 'number' },
                failedCount: { type: 'number' },
                skippedCount: { type: 'number' },
                passed: { type: 'boolean' },
                results: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      testId: { type: 'string' },
                      status: { type: 'string', enum: ['passed', 'failed', 'skipped'] },
                      duration: { type: 'number' },
                      error: { type: 'string' }
                    }
                  }
                }
              },
              required: ['totalCount', 'passedCount', 'failedCount', 'passed']
            },
            systemTests: {
              type: 'object',
              properties: {
                totalCount: { type: 'number' },
                passedCount: { type: 'number' },
                failedCount: { type: 'number' },
                skippedCount: { type: 'number' },
                passed: { type: 'boolean' },
                results: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      testId: { type: 'string' },
                      status: { type: 'string', enum: ['passed', 'failed', 'skipped'] },
                      duration: { type: 'number' },
                      error: { type: 'string' }
                    }
                  }
                }
              },
              required: ['totalCount', 'passedCount', 'failedCount', 'passed']
            },
            acceptanceTests: {
              type: 'object',
              properties: {
                totalCount: { type: 'number' },
                passedCount: { type: 'number' },
                failedCount: { type: 'number' },
                skippedCount: { type: 'number' },
                passed: { type: 'boolean' },
                results: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      testId: { type: 'string' },
                      status: { type: 'string', enum: ['passed', 'failed', 'skipped'] },
                      duration: { type: 'number' },
                      error: { type: 'string' }
                    }
                  }
                }
              },
              required: ['totalCount', 'passedCount', 'failedCount', 'passed']
            },
            summary: {
              type: 'object',
              properties: {
                totalTests: { type: 'number' },
                totalPassed: { type: 'number' },
                totalFailed: { type: 'number' },
                allTestsPassed: { type: 'boolean' },
                criticalDefects: { type: 'number' },
                testDuration: { type: 'number', description: 'Total test duration in milliseconds' }
              }
            }
          },
          required: ['unitTests', 'integrationTests', 'systemTests', 'acceptanceTests', 'summary']
        }
      },
      required: ['testResults']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['agent', 'v-model', 'testing', 'verification', 'validation']
}));

/**
 * Task: Generate Traceability Matrix
 * FINAL PHASE: Generate comprehensive traceability matrix for compliance
 */
export const traceabilityMatrixTask = defineTask('traceability-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Traceability Matrix',
  agent: {
    name: 'traceability-analyst',
    prompt: {
      role: 'system',
      content: `You are an expert in requirements traceability and compliance documentation.

Your task is to generate a comprehensive traceability matrix that maps:
- Requirements → Design Elements → Implementation → Tests

Traceability Matrix Components:
1. **Forward Traceability**: Requirements → Design → Code → Tests
2. **Backward Traceability**: Tests → Code → Design → Requirements
3. **Coverage Analysis**: Identify gaps in coverage
4. **Compliance Mapping**: Map to compliance standards

For Each Requirement:
- System design elements addressing it
- Architectural modules implementing it
- Code files implementing it
- Unit tests verifying it
- Integration tests validating it
- System tests checking it
- Acceptance tests confirming it

Gap Analysis:
- Requirements not covered by design
- Design elements not implemented
- Code not tested
- Tests not linked to requirements

Context:
- Requirements: {{requirements}}
- System Design: {{systemDesign}}
- Architecture: {{architecture}}
- Module Designs: {{moduleDesigns}}
- Implementation: {{implementation}}
- Unit Test Designs: {{unitTestDesigns}}
- Integration Test Design: {{integrationTestDesign}}
- System Test Design: {{systemTestDesign}}
- Acceptance Test Design: {{acceptanceTestDesign}}
- Test Results: {{testResults}}
- Compliance Standards: {{complianceStandards}}

Output comprehensive traceability matrix with coverage metrics.`
    },
    outputSchema: {
      type: 'object',
      properties: {
        traceabilityMatrix: {
          type: 'object',
          properties: {
            requirementTraces: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  requirementId: { type: 'string' },
                  requirementDescription: { type: 'string' },
                  systemDesignElements: { type: 'array', items: { type: 'string' } },
                  architecturalModules: { type: 'array', items: { type: 'string' } },
                  implementationFiles: { type: 'array', items: { type: 'string' } },
                  unitTests: { type: 'array', items: { type: 'string' } },
                  integrationTests: { type: 'array', items: { type: 'string' } },
                  systemTests: { type: 'array', items: { type: 'string' } },
                  acceptanceTests: { type: 'array', items: { type: 'string' } },
                  coverageStatus: { type: 'string', enum: ['complete', 'partial', 'missing'] }
                },
                required: ['requirementId', 'requirementDescription', 'coverageStatus']
              }
            },
            requirementsCoverage: { type: 'number', description: 'Percentage of requirements covered' },
            designCoverage: { type: 'number', description: 'Percentage of design elements implemented' },
            testCoverage: { type: 'number', description: 'Percentage of code tested' },
            implementationCoverage: { type: 'number', description: 'Percentage of design implemented' },
            gaps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['requirement', 'design', 'implementation', 'test'] },
                  description: { type: 'string' },
                  severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                  recommendation: { type: 'string' }
                },
                required: ['type', 'description', 'severity']
              }
            },
            complianceStatus: { type: 'string', enum: ['compliant', 'partial', 'non-compliant'] },
            complianceDetails: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  standard: { type: 'string' },
                  requirement: { type: 'string' },
                  status: { type: 'string', enum: ['met', 'partial', 'not-met'] },
                  evidence: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          },
          required: ['requirementTraces', 'requirementsCoverage', 'designCoverage', 'testCoverage', 'gaps', 'complianceStatus']
        }
      },
      required: ['traceabilityMatrix']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['agent', 'v-model', 'traceability', 'compliance']
}));
