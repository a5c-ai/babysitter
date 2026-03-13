/**
 * @process specializations/ai-agents-conversational/regression-testing-agent
 * @description Regression Testing for Agent Behavior - Process for implementing regression testing to ensure agent behavior
 * remains consistent across updates including test case management and automated validation.
 * @inputs { agentName?: string, testCasesPath?: string, cicdIntegration?: boolean, outputDir?: string }
 * @outputs { success: boolean, testSuites: array, regressionTests: array, cicdIntegration: object, testReports: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/regression-testing-agent', {
 *   agentName: 'production-agent',
 *   testCasesPath: './test-cases',
 *   cicdIntegration: true
 * });
 *
 * @references
 * - pytest: https://docs.pytest.org/
 * - LangSmith Testing: https://docs.smith.langchain.com/concepts/evaluation/testing
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    agentName = 'regression-test-agent',
    testCasesPath = './test-cases',
    cicdIntegration = true,
    outputDir = 'regression-testing-output',
    enableSnapshots = true,
    enableGoldenTests = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Regression Testing Setup for ${agentName}`);

  // ============================================================================
  // PHASE 1: TEST CASE MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up test case management');

  const testCaseManagement = await ctx.task(testCaseManagementTask, {
    agentName,
    testCasesPath,
    outputDir
  });

  artifacts.push(...testCaseManagement.artifacts);

  // ============================================================================
  // PHASE 2: GOLDEN TEST CREATION
  // ============================================================================

  let goldenTests = null;
  if (enableGoldenTests) {
    ctx.log('info', 'Phase 2: Creating golden tests');

    goldenTests = await ctx.task(goldenTestCreationTask, {
      agentName,
      testCases: testCaseManagement.testCases,
      outputDir
    });

    artifacts.push(...goldenTests.artifacts);
  }

  // ============================================================================
  // PHASE 3: SNAPSHOT TESTING
  // ============================================================================

  let snapshotTests = null;
  if (enableSnapshots) {
    ctx.log('info', 'Phase 3: Setting up snapshot testing');

    snapshotTests = await ctx.task(snapshotTestingTask, {
      agentName,
      outputDir
    });

    artifacts.push(...snapshotTests.artifacts);
  }

  // ============================================================================
  // PHASE 4: AUTOMATED VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing automated validation');

  const automatedValidation = await ctx.task(automatedValidationTask, {
    agentName,
    testCases: testCaseManagement.testCases,
    goldenTests: goldenTests ? goldenTests.tests : null,
    outputDir
  });

  artifacts.push(...automatedValidation.artifacts);

  // ============================================================================
  // PHASE 5: CI/CD INTEGRATION
  // ============================================================================

  let cicd = null;
  if (cicdIntegration) {
    ctx.log('info', 'Phase 5: Setting up CI/CD integration');

    cicd = await ctx.task(cicdIntegrationTask, {
      agentName,
      testSuites: automatedValidation.testSuites,
      outputDir
    });

    artifacts.push(...cicd.artifacts);
  }

  // ============================================================================
  // PHASE 6: REPORTING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting up test reporting');

  const testReporting = await ctx.task(testReportingTask, {
    agentName,
    testSuites: automatedValidation.testSuites,
    outputDir
  });

  artifacts.push(...testReporting.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Regression testing for ${agentName} complete. ${testCaseManagement.testCases.length} test cases, CI/CD: ${cicdIntegration}. Review setup?`,
    title: 'Regression Testing Review',
    context: {
      runId: ctx.runId,
      summary: {
        agentName,
        testCaseCount: testCaseManagement.testCases.length,
        enableGoldenTests,
        enableSnapshots,
        cicdIntegration
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    agentName,
    testSuites: automatedValidation.testSuites,
    regressionTests: goldenTests ? goldenTests.tests : [],
    cicdIntegration: cicd ? cicd.integration : null,
    testReports: testReporting.reports,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/regression-testing-agent',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const testCaseManagementTask = defineTask('test-case-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Test Case Management - ${args.agentName}`,
  agent: {
    name: 'agent-evaluator',  // AG-SAF-004: Designs evaluation frameworks and benchmarks
    prompt: {
      role: 'Test Case Manager',
      task: 'Setup test case management system',
      context: args,
      instructions: [
        '1. Define test case schema',
        '2. Create test case repository',
        '3. Import existing test cases',
        '4. Organize by category',
        '5. Add versioning',
        '6. Create test case templates',
        '7. Document test cases',
        '8. Save test case management'
      ],
      outputFormat: 'JSON with test case management'
    },
    outputSchema: {
      type: 'object',
      required: ['testCases', 'artifacts'],
      properties: {
        testCases: { type: 'array' },
        schema: { type: 'object' },
        repositoryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'regression', 'test-cases']
}));

export const goldenTestCreationTask = defineTask('golden-test-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Golden Tests - ${args.agentName}`,
  agent: {
    name: 'golden-test-creator',
    prompt: {
      role: 'Golden Test Creator',
      task: 'Create golden test baselines',
      context: args,
      instructions: [
        '1. Select representative test cases',
        '2. Run agent on test cases',
        '3. Capture expected outputs',
        '4. Create golden baselines',
        '5. Add tolerance thresholds',
        '6. Version golden tests',
        '7. Document update process',
        '8. Save golden tests'
      ],
      outputFormat: 'JSON with golden tests'
    },
    outputSchema: {
      type: 'object',
      required: ['tests', 'artifacts'],
      properties: {
        tests: { type: 'array' },
        baselinesPath: { type: 'string' },
        tolerances: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'regression', 'golden']
}));

export const snapshotTestingTask = defineTask('snapshot-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Snapshot Testing - ${args.agentName}`,
  agent: {
    name: 'snapshot-developer',
    prompt: {
      role: 'Snapshot Testing Developer',
      task: 'Setup snapshot testing infrastructure',
      context: args,
      instructions: [
        '1. Configure snapshot storage',
        '2. Implement snapshot capture',
        '3. Implement snapshot comparison',
        '4. Handle snapshot updates',
        '5. Add diff visualization',
        '6. Configure tolerance levels',
        '7. Add snapshot review workflow',
        '8. Save snapshot config'
      ],
      outputFormat: 'JSON with snapshot testing'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        snapshotCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'regression', 'snapshots']
}));

export const automatedValidationTask = defineTask('automated-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Automated Validation - ${args.agentName}`,
  agent: {
    name: 'validation-developer',
    prompt: {
      role: 'Automated Validation Developer',
      task: 'Implement automated test validation',
      context: args,
      instructions: [
        '1. Create test runner',
        '2. Implement assertions',
        '3. Add output validators',
        '4. Implement fuzzy matching',
        '5. Add semantic comparison',
        '6. Handle test failures',
        '7. Generate test reports',
        '8. Save validation system'
      ],
      outputFormat: 'JSON with validation system'
    },
    outputSchema: {
      type: 'object',
      required: ['testSuites', 'artifacts'],
      properties: {
        testSuites: { type: 'array' },
        validationCodePath: { type: 'string' },
        validators: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'regression', 'validation']
}));

export const cicdIntegrationTask = defineTask('cicd-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup CI/CD Integration - ${args.agentName}`,
  agent: {
    name: 'cicd-developer',
    prompt: {
      role: 'CI/CD Developer',
      task: 'Setup CI/CD pipeline integration',
      context: args,
      instructions: [
        '1. Create GitHub Actions workflow',
        '2. Configure test triggers',
        '3. Add parallel test execution',
        '4. Configure test matrix',
        '5. Add status checks',
        '6. Setup notifications',
        '7. Add test artifacts',
        '8. Save CI/CD config'
      ],
      outputFormat: 'JSON with CI/CD integration'
    },
    outputSchema: {
      type: 'object',
      required: ['integration', 'artifacts'],
      properties: {
        integration: { type: 'object' },
        workflowPath: { type: 'string' },
        triggers: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'regression', 'cicd']
}));

export const testReportingTask = defineTask('test-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Test Reporting - ${args.agentName}`,
  agent: {
    name: 'reporting-developer',
    prompt: {
      role: 'Test Reporting Developer',
      task: 'Setup test reporting infrastructure',
      context: args,
      instructions: [
        '1. Configure report formats',
        '2. Create summary reports',
        '3. Add trend tracking',
        '4. Create failure analysis',
        '5. Add coverage reports',
        '6. Configure dashboards',
        '7. Setup alerting',
        '8. Save reporting config'
      ],
      outputFormat: 'JSON with reporting config'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'artifacts'],
      properties: {
        reports: { type: 'array' },
        reportingCodePath: { type: 'string' },
        dashboardConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'regression', 'reporting']
}));
