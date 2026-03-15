/**
 * @process specializations/domains/science/automotive-engineering/systems-integration-verification
 * @description Systems Integration and Verification - Plan and execute integration of mechanical, electrical,
 * and software subsystems into a cohesive vehicle system. Verify system-level functionality and performance
 * against requirements.
 * @inputs { projectName: string, subsystems: string[], integrationLevel?: string, requirements?: object }
 * @outputs { success: boolean, integrationPlan: object, verificationReports: object, issueResolutionRecords: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/automotive-engineering/systems-integration-verification', {
 *   projectName: 'EV-Platform-Integration',
 *   subsystems: ['Powertrain', 'Chassis', 'Body', 'ADAS', 'Infotainment'],
 *   integrationLevel: 'vehicle',
 *   requirements: { performanceTargets: {}, safetyRequirements: {} }
 * });
 *
 * @references
 * - ISO 26262 Part 4: Product Development at System Level
 * - INCOSE Systems Engineering Handbook
 * - VDA Automotive SPICE
 * - SAE J3061 Cybersecurity Integration
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    subsystems = [],
    integrationLevel = 'vehicle',
    requirements = {}
  } = inputs;

  // Phase 1: Integration Strategy Development
  const integrationStrategy = await ctx.task(integrationStrategyTask, {
    projectName,
    subsystems,
    integrationLevel,
    requirements
  });

  // Quality Gate: Integration strategy must be defined
  if (!integrationStrategy.strategy) {
    return {
      success: false,
      error: 'Integration strategy not defined',
      phase: 'integration-strategy',
      integrationPlan: null
    };
  }

  // Breakpoint: Review integration strategy
  await ctx.breakpoint({
    question: `Review integration strategy for ${projectName}. Approach: ${integrationStrategy.approach}. Approve strategy?`,
    title: 'Integration Strategy Review',
    context: {
      runId: ctx.runId,
      projectName,
      integrationStrategy,
      files: [{
        path: `artifacts/integration-strategy.json`,
        format: 'json',
        content: integrationStrategy
      }]
    }
  });

  // Phase 2: Integration Sequence Planning
  const integrationSequence = await ctx.task(integrationSequenceTask, {
    projectName,
    subsystems,
    integrationStrategy: integrationStrategy.strategy
  });

  // Phase 3: Integration Test Planning
  const testPlanning = await ctx.task(integrationTestPlanningTask, {
    projectName,
    integrationSequence: integrationSequence.sequence,
    requirements
  });

  // Phase 4: Component Integration Execution
  const componentIntegration = await ctx.task(componentIntegrationTask, {
    projectName,
    subsystems,
    integrationSequence: integrationSequence.sequence,
    testPlan: testPlanning.plan
  });

  // Phase 5: System-Level Verification
  const systemVerification = await ctx.task(systemVerificationTask, {
    projectName,
    componentIntegration,
    requirements,
    testPlan: testPlanning.plan
  });

  // Quality Gate: Verification results check
  if (systemVerification.failedTests && systemVerification.failedTests.length > 0) {
    await ctx.breakpoint({
      question: `System verification identified ${systemVerification.failedTests.length} failed tests. Review and define resolution path?`,
      title: 'Verification Failures Review',
      context: {
        runId: ctx.runId,
        failedTests: systemVerification.failedTests,
        recommendation: 'Investigate root cause and implement corrections'
      }
    });
  }

  // Phase 6: Issue Management and Resolution
  const issueResolution = await ctx.task(issueResolutionTask, {
    projectName,
    componentIntegration,
    systemVerification,
    subsystems
  });

  // Phase 7: Verification Evidence Documentation
  const verificationEvidence = await ctx.task(verificationEvidenceTask, {
    projectName,
    systemVerification,
    issueResolution,
    requirements
  });

  // Final Breakpoint: Integration verification approval
  await ctx.breakpoint({
    question: `Systems Integration and Verification complete for ${projectName}. Pass rate: ${systemVerification.passRate}%. Approve verification results?`,
    title: 'Integration Verification Approval',
    context: {
      runId: ctx.runId,
      projectName,
      verificationSummary: verificationEvidence.summary,
      files: [
        { path: `artifacts/verification-report.json`, format: 'json', content: verificationEvidence },
        { path: `artifacts/integration-report.md`, format: 'markdown', content: verificationEvidence.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    integrationPlan: {
      strategy: integrationStrategy.strategy,
      sequence: integrationSequence.sequence,
      testPlan: testPlanning.plan
    },
    verificationReports: {
      systemVerification: systemVerification.results,
      passRate: systemVerification.passRate,
      evidence: verificationEvidence.evidence
    },
    issueResolutionRecords: issueResolution.records,
    nextSteps: verificationEvidence.nextSteps,
    metadata: {
      processId: 'specializations/domains/science/automotive-engineering/systems-integration-verification',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const integrationStrategyTask = defineTask('integration-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Integration Strategy Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Systems Integration Engineer with automotive expertise',
      task: 'Develop comprehensive integration strategy for vehicle subsystems',
      context: {
        projectName: args.projectName,
        subsystems: args.subsystems,
        integrationLevel: args.integrationLevel,
        requirements: args.requirements
      },
      instructions: [
        '1. Define integration approach (big-bang, incremental, top-down, bottom-up)',
        '2. Identify integration dependencies between subsystems',
        '3. Define integration environments (bench, vehicle, simulation)',
        '4. Establish integration milestones and gates',
        '5. Define roles and responsibilities',
        '6. Identify critical path integrations',
        '7. Plan for risk mitigation during integration',
        '8. Define integration success criteria',
        '9. Establish communication protocols',
        '10. Document resource requirements'
      ],
      outputFormat: 'JSON object with integration strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'approach', 'dependencies'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            environments: { type: 'array', items: { type: 'string' } },
            milestones: { type: 'array', items: { type: 'object' } },
            successCriteria: { type: 'array', items: { type: 'string' } }
          }
        },
        approach: { type: 'string' },
        dependencies: { type: 'array', items: { type: 'object' } },
        criticalPath: { type: 'array', items: { type: 'string' } },
        riskMitigation: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'integration', 'strategy', 'planning']
}));

export const integrationSequenceTask = defineTask('integration-sequence', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Integration Sequence Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Integration Planning Engineer',
      task: 'Define detailed integration sequence for subsystems',
      context: {
        projectName: args.projectName,
        subsystems: args.subsystems,
        integrationStrategy: args.integrationStrategy
      },
      instructions: [
        '1. Define integration build sequence',
        '2. Identify integration dependencies and prerequisites',
        '3. Plan hardware integration sequence',
        '4. Plan software integration sequence',
        '5. Define interface verification points',
        '6. Plan calibration sequence',
        '7. Define regression testing triggers',
        '8. Establish rollback procedures',
        '9. Define parallel integration paths',
        '10. Create integration schedule'
      ],
      outputFormat: 'JSON object with integration sequence'
    },
    outputSchema: {
      type: 'object',
      required: ['sequence', 'schedule', 'verificationPoints'],
      properties: {
        sequence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              subsystem: { type: 'string' },
              integrationActivity: { type: 'string' },
              prerequisites: { type: 'array', items: { type: 'string' } },
              verificationCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        schedule: { type: 'array', items: { type: 'object' } },
        verificationPoints: { type: 'array', items: { type: 'object' } },
        rollbackProcedures: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'integration', 'sequence', 'planning']
}));

export const integrationTestPlanningTask = defineTask('integration-test-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Integration Test Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Planning Engineer with integration testing expertise',
      task: 'Develop integration test plan for system verification',
      context: {
        projectName: args.projectName,
        integrationSequence: args.integrationSequence,
        requirements: args.requirements
      },
      instructions: [
        '1. Define test strategy for each integration step',
        '2. Create test cases for interface verification',
        '3. Define system-level test cases',
        '4. Plan functional integration tests',
        '5. Plan performance integration tests',
        '6. Define safety-critical test cases',
        '7. Plan regression test suite',
        '8. Define test environment requirements',
        '9. Establish test data requirements',
        '10. Define acceptance criteria for each test'
      ],
      outputFormat: 'JSON object with integration test plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'testCases', 'testEnvironments'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            scope: { type: 'array', items: { type: 'string' } },
            schedule: { type: 'array', items: { type: 'object' } }
          }
        },
        testCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testId: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string' },
              requirementId: { type: 'string' },
              procedure: { type: 'string' },
              acceptanceCriteria: { type: 'string' }
            }
          }
        },
        testEnvironments: { type: 'array', items: { type: 'object' } },
        regressionSuite: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'integration', 'test-planning', 'verification']
}));

export const componentIntegrationTask = defineTask('component-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Component Integration Execution - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Integration Execution Engineer',
      task: 'Execute component and subsystem integration',
      context: {
        projectName: args.projectName,
        subsystems: args.subsystems,
        integrationSequence: args.integrationSequence,
        testPlan: args.testPlan
      },
      instructions: [
        '1. Execute integration steps per sequence',
        '2. Verify interface connections',
        '3. Execute functional checks at each step',
        '4. Document integration observations',
        '5. Manage integration issues',
        '6. Execute interface tests',
        '7. Verify signal integrity',
        '8. Check power distribution',
        '9. Verify communication networks',
        '10. Document integration status'
      ],
      outputFormat: 'JSON object with integration execution results'
    },
    outputSchema: {
      type: 'object',
      required: ['integrationResults', 'issues', 'status'],
      properties: {
        integrationResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              subsystem: { type: 'string' },
              status: { type: 'string', enum: ['complete', 'partial', 'blocked', 'pending'] },
              observations: { type: 'array', items: { type: 'string' } },
              issues: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        issues: { type: 'array', items: { type: 'object' } },
        status: {
          type: 'object',
          properties: {
            completedSteps: { type: 'number' },
            totalSteps: { type: 'number' },
            blockedSteps: { type: 'number' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'integration', 'execution', 'verification']
}));

export const systemVerificationTask = defineTask('system-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: System-Level Verification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'System Verification Engineer',
      task: 'Execute system-level verification testing',
      context: {
        projectName: args.projectName,
        componentIntegration: args.componentIntegration,
        requirements: args.requirements,
        testPlan: args.testPlan
      },
      instructions: [
        '1. Execute system functional tests',
        '2. Execute performance verification tests',
        '3. Verify safety requirements',
        '4. Execute environmental tests',
        '5. Verify EMC requirements',
        '6. Execute durability verification',
        '7. Verify system interfaces',
        '8. Document test results',
        '9. Analyze test failures',
        '10. Calculate verification metrics'
      ],
      outputFormat: 'JSON object with system verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'passRate', 'failedTests'],
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testId: { type: 'string' },
              requirementId: { type: 'string' },
              status: { type: 'string', enum: ['pass', 'fail', 'blocked', 'not-run'] },
              actualResult: { type: 'string' },
              deviations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        passRate: { type: 'number' },
        failedTests: { type: 'array', items: { type: 'object' } },
        blockedTests: { type: 'array', items: { type: 'object' } },
        metrics: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'verification', 'system-test', 'validation']
}));

export const issueResolutionTask = defineTask('issue-resolution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Issue Management and Resolution - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Issue Resolution Engineer',
      task: 'Manage and resolve integration and verification issues',
      context: {
        projectName: args.projectName,
        componentIntegration: args.componentIntegration,
        systemVerification: args.systemVerification,
        subsystems: args.subsystems
      },
      instructions: [
        '1. Categorize and prioritize issues',
        '2. Perform root cause analysis',
        '3. Define corrective actions',
        '4. Assign resolution owners',
        '5. Track resolution progress',
        '6. Verify issue resolution',
        '7. Perform regression testing',
        '8. Document lessons learned',
        '9. Update issue database',
        '10. Generate issue resolution report'
      ],
      outputFormat: 'JSON object with issue resolution records'
    },
    outputSchema: {
      type: 'object',
      required: ['records', 'openIssues', 'resolvedIssues'],
      properties: {
        records: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issueId: { type: 'string' },
              description: { type: 'string' },
              rootCause: { type: 'string' },
              correctiveAction: { type: 'string' },
              owner: { type: 'string' },
              status: { type: 'string', enum: ['open', 'in-progress', 'resolved', 'verified'] },
              resolutionDate: { type: 'string' }
            }
          }
        },
        openIssues: { type: 'number' },
        resolvedIssues: { type: 'number' },
        lessonsLearned: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'integration', 'issue-resolution', 'quality']
}));

export const verificationEvidenceTask = defineTask('verification-evidence', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Verification Evidence Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Verification Documentation Engineer',
      task: 'Document verification evidence and generate reports',
      context: {
        projectName: args.projectName,
        systemVerification: args.systemVerification,
        issueResolution: args.issueResolution,
        requirements: args.requirements
      },
      instructions: [
        '1. Compile verification test results',
        '2. Map results to requirements',
        '3. Document verification evidence',
        '4. Generate verification matrix',
        '5. Create verification summary report',
        '6. Document open issues and risks',
        '7. Prepare approval documentation',
        '8. Archive test artifacts',
        '9. Generate compliance evidence',
        '10. Define next steps and recommendations'
      ],
      outputFormat: 'JSON object with verification evidence documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['evidence', 'summary', 'markdown'],
      properties: {
        evidence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              verificationMethod: { type: 'string' },
              testId: { type: 'string' },
              result: { type: 'string' },
              evidenceLocation: { type: 'string' }
            }
          }
        },
        summary: {
          type: 'object',
          properties: {
            totalRequirements: { type: 'number' },
            verifiedRequirements: { type: 'number' },
            passRate: { type: 'number' },
            openIssues: { type: 'number' }
          }
        },
        markdown: { type: 'string' },
        nextSteps: { type: 'array', items: { type: 'object' } },
        risks: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'verification', 'documentation', 'evidence']
}));
