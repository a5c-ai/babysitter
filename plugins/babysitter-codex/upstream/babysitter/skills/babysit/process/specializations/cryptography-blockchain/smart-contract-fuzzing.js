/**
 * @process specializations/cryptography-blockchain/smart-contract-fuzzing
 * @description Smart Contract Fuzzing - Fuzzing smart contracts using tools like Echidna and Foundry for property-based
 * testing and vulnerability discovery.
 * @inputs { projectName: string, contracts: array, fuzzingTool?: string, duration?: number }
 * @outputs { success: boolean, fuzzingResults: object, vulnerabilities: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/smart-contract-fuzzing', {
 *   projectName: 'DeFi Protocol Fuzzing',
 *   contracts: ['Token.sol', 'Vault.sol', 'Strategy.sol'],
 *   fuzzingTool: 'echidna',
 *   duration: 86400
 * });
 *
 * @references
 * - Echidna: https://github.com/crytic/echidna
 * - Foundry Fuzzing: https://book.getfoundry.sh/forge/fuzz-testing
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    contracts,
    fuzzingTool = 'echidna',
    duration = 3600,
    testMode = 'property',
    corpusSeed = [],
    outputDir = 'fuzzing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Smart Contract Fuzzing: ${projectName}`);

  const propertyDefinition = await ctx.task(propertyDefinitionTask, { projectName, contracts, outputDir });
  artifacts.push(...propertyDefinition.artifacts);

  const fuzzHarnessSetup = await ctx.task(fuzzHarnessSetupTask, { projectName, contracts, fuzzingTool, outputDir });
  artifacts.push(...fuzzHarnessSetup.artifacts);

  const corpusGeneration = await ctx.task(corpusGenerationTask, { projectName, corpusSeed, outputDir });
  artifacts.push(...corpusGeneration.artifacts);

  const fuzzingExecution = await ctx.task(fuzzingExecutionTask, { projectName, fuzzingTool, duration, testMode, outputDir });
  artifacts.push(...fuzzingExecution.artifacts);

  const coverageAnalysis = await ctx.task(coverageAnalysisTask, { projectName, outputDir });
  artifacts.push(...coverageAnalysis.artifacts);

  const vulnerabilityTriaging = await ctx.task(vulnerabilityTriagingTask, { projectName, outputDir });
  artifacts.push(...vulnerabilityTriaging.artifacts);

  const reproduceIssues = await ctx.task(reproduceIssuesTask, { projectName, outputDir });
  artifacts.push(...reproduceIssues.artifacts);

  const reportGeneration = await ctx.task(reportGenerationTask, { projectName, outputDir });
  artifacts.push(...reportGeneration.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    fuzzingResults: { tool: fuzzingTool, duration, testMode, coverage: coverageAnalysis.coverage },
    vulnerabilities: vulnerabilityTriaging.vulnerabilities,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/cryptography-blockchain/smart-contract-fuzzing', timestamp: startTime }
  };
}

export const propertyDefinitionTask = defineTask('property-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Property Definition - ${args.projectName}`,
  agent: {
    name: 'property-engineer',
    prompt: {
      role: 'Property Testing Engineer',
      task: 'Define fuzzing properties',
      context: args,
      instructions: ['1. Identify invariants', '2. Define state properties', '3. Write Boolean properties', '4. Define assertion properties', '5. Add custom properties', '6. Define revert properties', '7. Categorize by severity', '8. Plan property coverage', '9. Document properties', '10. Create property matrix'],
      outputFormat: 'JSON with property definitions'
    },
    outputSchema: { type: 'object', required: ['properties', 'invariants', 'artifacts'], properties: { properties: { type: 'array' }, invariants: { type: 'array' }, assertions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fuzzing', 'properties']
}));

export const fuzzHarnessSetupTask = defineTask('fuzz-harness-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fuzz Harness Setup - ${args.projectName}`,
  agent: {
    name: 'harness-engineer',
    prompt: {
      role: 'Fuzz Harness Engineer',
      task: 'Setup fuzzing harness',
      context: args,
      instructions: ['1. Create test contract', '2. Setup state initialization', '3. Implement helper functions', '4. Add actor modeling', '5. Configure fuzzing parameters', '6. Setup value bounds', '7. Add time manipulation', '8. Configure block parameters', '9. Test harness', '10. Document setup'],
      outputFormat: 'JSON with fuzz harness setup'
    },
    outputSchema: { type: 'object', required: ['harness', 'configuration', 'artifacts'], properties: { harness: { type: 'object' }, configuration: { type: 'object' }, helpers: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fuzzing', 'harness']
}));

export const corpusGenerationTask = defineTask('corpus-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Corpus Generation - ${args.projectName}`,
  agent: {
    name: 'corpus-engineer',
    prompt: {
      role: 'Corpus Generation Engineer',
      task: 'Generate fuzzing corpus',
      context: args,
      instructions: ['1. Generate seed inputs', '2. Add edge case values', '3. Include boundary values', '4. Add known attack patterns', '5. Generate sequence corpus', '6. Add valid state corpus', '7. Include error states', '8. Optimize corpus size', '9. Validate corpus', '10. Document corpus'],
      outputFormat: 'JSON with corpus generation'
    },
    outputSchema: { type: 'object', required: ['corpus', 'seedCount', 'artifacts'], properties: { corpus: { type: 'object' }, seedCount: { type: 'number' }, patterns: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fuzzing', 'corpus']
}));

export const fuzzingExecutionTask = defineTask('fuzzing-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fuzzing Execution - ${args.projectName}`,
  agent: {
    name: 'fuzzer-operator',
    prompt: {
      role: 'Fuzzing Execution Operator',
      task: 'Execute fuzzing campaign',
      context: args,
      instructions: ['1. Start fuzzing campaign', '2. Monitor progress', '3. Track coverage', '4. Log property failures', '5. Save interesting inputs', '6. Handle timeouts', '7. Restart on crashes', '8. Track corpus growth', '9. Save campaign state', '10. Generate statistics'],
      outputFormat: 'JSON with fuzzing execution'
    },
    outputSchema: { type: 'object', required: ['executionStats', 'failures', 'artifacts'], properties: { executionStats: { type: 'object' }, failures: { type: 'array' }, corpusSize: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fuzzing', 'execution']
}));

export const coverageAnalysisTask = defineTask('coverage-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Coverage Analysis - ${args.projectName}`,
  agent: {
    name: 'coverage-analyst',
    prompt: {
      role: 'Coverage Analysis Engineer',
      task: 'Analyze fuzzing coverage',
      context: args,
      instructions: ['1. Collect coverage data', '2. Calculate line coverage', '3. Calculate branch coverage', '4. Identify uncovered code', '5. Analyze coverage gaps', '6. Correlate with findings', '7. Plan coverage improvement', '8. Generate coverage report', '9. Compare baselines', '10. Document coverage'],
      outputFormat: 'JSON with coverage analysis'
    },
    outputSchema: { type: 'object', required: ['coverage', 'uncoveredPaths', 'artifacts'], properties: { coverage: { type: 'number' }, uncoveredPaths: { type: 'array' }, coverageReport: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fuzzing', 'coverage']
}));

export const vulnerabilityTriagingTask = defineTask('vulnerability-triaging', (args, taskCtx) => ({
  kind: 'agent',
  title: `Vulnerability Triaging - ${args.projectName}`,
  agent: {
    name: 'vuln-analyst',
    prompt: {
      role: 'Vulnerability Analyst',
      task: 'Triage discovered vulnerabilities',
      context: args,
      instructions: ['1. Classify findings', '2. Assess severity', '3. Determine exploitability', '4. Identify root cause', '5. Check for duplicates', '6. Assess impact', '7. Prioritize issues', '8. Document findings', '9. Create PoCs', '10. Recommend fixes'],
      outputFormat: 'JSON with vulnerability triaging'
    },
    outputSchema: { type: 'object', required: ['vulnerabilities', 'severityBreakdown', 'artifacts'], properties: { vulnerabilities: { type: 'array' }, severityBreakdown: { type: 'object' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fuzzing', 'vulnerabilities']
}));

export const reproduceIssuesTask = defineTask('reproduce-issues', (args, taskCtx) => ({
  kind: 'agent',
  title: `Reproduce Issues - ${args.projectName}`,
  agent: {
    name: 'repro-engineer',
    prompt: {
      role: 'Issue Reproduction Engineer',
      task: 'Reproduce discovered issues',
      context: args,
      instructions: ['1. Extract failing inputs', '2. Minimize test cases', '3. Create reproduction tests', '4. Verify reproducibility', '5. Identify preconditions', '6. Document reproduction steps', '7. Create minimal PoC', '8. Add to test suite', '9. Verify fix effectiveness', '10. Document lessons'],
      outputFormat: 'JSON with issue reproduction'
    },
    outputSchema: { type: 'object', required: ['reproductions', 'minimizedCases', 'artifacts'], properties: { reproductions: { type: 'array' }, minimizedCases: { type: 'array' }, testCases: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fuzzing', 'reproduction']
}));

export const reportGenerationTask = defineTask('report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Report Generation - ${args.projectName}`,
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'Fuzzing Report Generator',
      task: 'Generate fuzzing report',
      context: args,
      instructions: ['1. Summarize campaign', '2. List findings', '3. Include coverage data', '4. Add reproduction steps', '5. Include recommendations', '6. Add severity breakdown', '7. Include statistics', '8. Add charts/graphs', '9. Create executive summary', '10. Export report'],
      outputFormat: 'JSON with report generation'
    },
    outputSchema: { type: 'object', required: ['report', 'summary', 'artifacts'], properties: { report: { type: 'object' }, summary: { type: 'string' }, statistics: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fuzzing', 'reporting']
}));
