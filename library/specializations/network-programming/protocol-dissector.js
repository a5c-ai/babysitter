/**
 * @process specializations/network-programming/protocol-dissector
 * @description Protocol Dissector Development - Build a Wireshark-style protocol dissector that decodes network
 * protocols with field extraction, validation, and hierarchical display.
 * @inputs { projectName: string, language: string, protocol: object }
 * @outputs { success: boolean, dissectorConfig: object, implementation: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/protocol-dissector', {
 *   projectName: 'Custom IoT Protocol Dissector',
 *   language: 'C',
 *   protocol: { name: 'IoT-Proto', layers: ['ethernet', 'ip', 'udp', 'custom'] }
 * });
 *
 * @references
 * - Wireshark Dissector Development: https://www.wireshark.org/docs/wsdg_html/ChDissectAdd.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, language = 'C', protocol = { name: 'Custom', layers: [] }, outputDir = 'protocol-dissector' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Protocol Dissector: ${projectName}`);

  const phases = [
    { name: 'protocol-spec', task: protocolSpecTask },
    { name: 'field-definitions', task: fieldDefinitionsTask },
    { name: 'parser-implementation', task: parserImplementationTask },
    { name: 'field-extraction', task: fieldExtractionTask },
    { name: 'validation', task: fieldValidationTask },
    { name: 'hierarchical-display', task: displayTask },
    { name: 'wireshark-integration', task: wiresharkTask },
    { name: 'testing', task: testSuiteTask }
  ];

  const results = {};
  for (const phase of phases) {
    const result = await ctx.task(phase.task, { projectName, language, protocol, outputDir });
    results[phase.name] = result;
    artifacts.push(...result.artifacts);
  }

  const validation = await ctx.task(validationFinalTask, { projectName, protocol, results, outputDir });
  artifacts.push(...validation.artifacts);

  return {
    success: validation.overallScore >= 80, projectName,
    dissectorConfig: { protocol, language },
    implementation: results,
    testResults: { totalTests: results.testing.totalTests, passedTests: results.testing.passedTests },
    artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/network-programming/protocol-dissector', timestamp: startTime }
  };
}

export const protocolSpecTask = defineTask('protocol-spec', (args, taskCtx) => ({
  kind: 'agent', title: `Protocol Spec - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: { name: 'network-analysis-expert', prompt: { role: 'Protocol Analyst', task: 'Analyze protocol specification', context: args, instructions: ['1. Document protocol structure', '2. Identify fields', '3. Map field types', '4. Document dependencies'] }, outputSchema: { type: 'object', required: ['specification', 'artifacts'], properties: { specification: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'dissector', 'spec']
}));

export const fieldDefinitionsTask = defineTask('field-definitions', (args, taskCtx) => ({
  kind: 'agent', title: `Field Definitions - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: { name: 'network-analysis-expert', prompt: { role: 'Field Definition Engineer', task: 'Define protocol fields', context: args, instructions: ['1. Define field types', '2. Set field sizes', '3. Define enumerations', '4. Document field meanings'] }, outputSchema: { type: 'object', required: ['fields', 'artifacts'], properties: { fields: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'dissector', 'fields']
}));

export const parserImplementationTask = defineTask('parser-implementation', (args, taskCtx) => ({
  kind: 'agent', title: `Parser Implementation - ${args.projectName}`,
  skill: { name: 'packet-capture' },
  agent: { name: 'network-analysis-expert', prompt: { role: 'Parser Engineer', task: 'Implement protocol parser', context: args, instructions: ['1. Parse packet header', '2. Handle variable fields', '3. Support nested structures', '4. Handle errors'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'dissector', 'parser']
}));

export const fieldExtractionTask = defineTask('field-extraction', (args, taskCtx) => ({
  kind: 'agent', title: `Field Extraction - ${args.projectName}`,
  skill: { name: 'packet-capture' },
  agent: { name: 'network-analysis-expert', prompt: { role: 'Extraction Engineer', task: 'Extract field values', context: args, instructions: ['1. Extract primitive types', '2. Handle endianness', '3. Extract strings', '4. Handle arrays'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'dissector', 'extraction']
}));

export const fieldValidationTask = defineTask('field-validation', (args, taskCtx) => ({
  kind: 'agent', title: `Field Validation - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: { name: 'network-analysis-expert', prompt: { role: 'Validation Engineer', task: 'Validate field values', context: args, instructions: ['1. Range validation', '2. Checksum validation', '3. Consistency checks', '4. Report violations'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'dissector', 'validation']
}));

export const displayTask = defineTask('display', (args, taskCtx) => ({
  kind: 'agent', title: `Hierarchical Display - ${args.projectName}`,
  skill: { name: 'packet-capture' },
  agent: { name: 'network-analysis-expert', prompt: { role: 'Display Engineer', task: 'Implement display formatting', context: args, instructions: ['1. Tree structure', '2. Field formatting', '3. Enum display', '4. Hex dump'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'dissector', 'display']
}));

export const wiresharkTask = defineTask('wireshark', (args, taskCtx) => ({
  kind: 'agent', title: `Wireshark Integration - ${args.projectName}`,
  skill: { name: 'packet-capture' },
  agent: { name: 'network-analysis-expert', prompt: { role: 'Wireshark Engineer', task: 'Integrate with Wireshark', context: args, instructions: ['1. Plugin structure', '2. Registration', '3. Preference handling', '4. Build system'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'dissector', 'wireshark']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent', title: `Test Suite - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Test Engineer', task: 'Create dissector tests', context: args, instructions: ['1. Parser tests', '2. Validation tests', '3. Display tests', '4. Fuzz tests'] }, outputSchema: { type: 'object', required: ['totalTests', 'passedTests', 'artifacts'], properties: { totalTests: { type: 'number' }, passedTests: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'dissector', 'testing']
}));

export const validationFinalTask = defineTask('validation-final', (args, taskCtx) => ({
  kind: 'agent', title: `Validation - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'QA Engineer', task: 'Validate dissector', context: args, instructions: ['1. Verify parsing', '2. Check display', '3. Validate tests', '4. Calculate score'] }, outputSchema: { type: 'object', required: ['overallScore', 'passedChecks', 'artifacts'], properties: { overallScore: { type: 'number' }, passedChecks: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'dissector', 'validation']
}));
