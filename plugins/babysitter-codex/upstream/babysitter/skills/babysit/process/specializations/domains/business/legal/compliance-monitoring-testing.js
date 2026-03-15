/**
 * @process specializations/domains/business/legal/compliance-monitoring-testing
 * @description Compliance Monitoring and Testing - Implement ongoing compliance monitoring, periodic testing,
 * and control validation procedures.
 * @inputs { scope: array, testingPeriod?: string, controls?: array, outputDir?: string }
 * @outputs { success: boolean, monitoringResults: object, testingResults: array, findings: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/compliance-monitoring-testing', {
 *   scope: ['anti-corruption', 'third-party', 'data-privacy'],
 *   testingPeriod: 'quarterly',
 *   controls: ['TPC-001', 'TPC-002', 'DPC-001'],
 *   outputDir: 'compliance-testing'
 * });
 *
 * @references
 * - DOJ Evaluation Criteria: https://www.justice.gov/criminal-fraud/page/file/937501/download
 * - IIA Standards: https://www.theiia.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    scope,
    testingPeriod = 'quarterly',
    controls = [],
    outputDir = 'compliance-testing-output',
    includeContinuousMonitoring = true,
    includePeriodicTesting = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Compliance Monitoring and Testing`);

  // Phase 1: Testing Plan Development
  const testingPlan = await ctx.task(testingPlanTask, {
    scope,
    testingPeriod,
    controls,
    outputDir
  });
  artifacts.push(...testingPlan.artifacts);

  // Phase 2: Continuous Monitoring
  let monitoringResults = null;
  if (includeContinuousMonitoring) {
    monitoringResults = await ctx.task(continuousMonitoringTask, {
      scope,
      controls,
      outputDir
    });
    artifacts.push(...monitoringResults.artifacts);
  }

  // Phase 3: Control Testing
  let testingResults = null;
  if (includePeriodicTesting) {
    testingResults = await ctx.task(controlTestingTask, {
      testingPlan: testingPlan.plan,
      controls,
      outputDir
    });
    artifacts.push(...testingResults.artifacts);

    // Quality Gate for failed tests
    const failedTests = testingResults.results.filter(r => r.result === 'failed');
    if (failedTests.length > 0) {
      await ctx.breakpoint({
        question: `${failedTests.length} control tests failed. Review findings before proceeding?`,
        title: 'Control Testing Failures',
        context: {
          runId: ctx.runId,
          failedTests: failedTests.map(t => ({ control: t.controlId, reason: t.failureReason })),
          files: testingResults.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
        }
      });
    }
  }

  // Phase 4: Issue Management
  const issueManagement = await ctx.task(issueManagementTask, {
    monitoringResults: monitoringResults?.results,
    testingResults: testingResults?.results,
    outputDir
  });
  artifacts.push(...issueManagement.artifacts);

  // Phase 5: Reporting
  const report = await ctx.task(complianceTestingReportTask, {
    testingPlan: testingPlan.plan,
    monitoringResults: monitoringResults?.results,
    testingResults: testingResults?.results,
    issues: issueManagement.issues,
    outputDir
  });
  artifacts.push(...report.artifacts);

  await ctx.breakpoint({
    question: `Compliance testing complete. ${testingResults?.results.length || 0} controls tested, ${issueManagement.issues.length} issues identified. Approve report?`,
    title: 'Compliance Testing Review',
    context: {
      runId: ctx.runId,
      controlsTested: testingResults?.results.length || 0,
      issuesFound: issueManagement.issues.length,
      files: [{ path: report.reportPath, format: 'markdown', label: 'Testing Report' }]
    }
  });

  return {
    success: true,
    scope,
    testingPeriod,
    monitoringResults: monitoringResults?.results,
    testingResults: testingResults?.results,
    findings: issueManagement.issues,
    reportPath: report.reportPath,
    artifacts,
    metadata: { processId: 'specializations/domains/business/legal/compliance-monitoring-testing', timestamp: startTime }
  };
}

export const testingPlanTask = defineTask('testing-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop testing plan',
  agent: {
    name: 'compliance-specialist',
    prompt: {
      role: 'Testing Plan Developer',
      task: 'Develop compliance testing plan',
      context: args,
      instructions: ['Define testing scope', 'Identify controls to test', 'Set testing frequency', 'Define testing methodology', 'Create test procedures'],
      outputFormat: 'JSON with plan object, artifacts'
    },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'compliance-testing']
}));

export const continuousMonitoringTask = defineTask('continuous-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct continuous monitoring',
  agent: {
    name: 'compliance-specialist',
    prompt: {
      role: 'Compliance Monitor',
      task: 'Conduct continuous compliance monitoring',
      context: args,
      instructions: ['Monitor key risk indicators', 'Track compliance metrics', 'Identify anomalies', 'Document monitoring results'],
      outputFormat: 'JSON with results object, artifacts'
    },
    outputSchema: { type: 'object', required: ['results', 'artifacts'], properties: { results: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'compliance-testing']
}));

export const controlTestingTask = defineTask('control-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct control testing',
  agent: {
    name: 'compliance-specialist',
    prompt: {
      role: 'Control Tester',
      task: 'Test compliance controls per testing plan',
      context: args,
      instructions: ['Execute test procedures', 'Document test evidence', 'Evaluate control effectiveness', 'Record test results (pass/fail)'],
      outputFormat: 'JSON with results array, artifacts'
    },
    outputSchema: { type: 'object', required: ['results', 'artifacts'], properties: { results: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'compliance-testing']
}));

export const issueManagementTask = defineTask('issue-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Manage compliance issues',
  agent: {
    name: 'compliance-specialist',
    prompt: {
      role: 'Issue Manager',
      task: 'Document and manage compliance issues',
      context: args,
      instructions: ['Document findings', 'Classify issue severity', 'Assign remediation owners', 'Set remediation deadlines'],
      outputFormat: 'JSON with issues array, artifacts'
    },
    outputSchema: { type: 'object', required: ['issues', 'artifacts'], properties: { issues: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'compliance-testing']
}));

export const complianceTestingReportTask = defineTask('compliance-testing-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate testing report',
  agent: {
    name: 'compliance-specialist',
    prompt: {
      role: 'Report Generator',
      task: 'Generate compliance testing report',
      context: args,
      instructions: ['Summarize testing activities', 'Present results', 'Document findings', 'Provide recommendations'],
      outputFormat: 'JSON with reportPath, artifacts'
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'compliance-testing']
}));
