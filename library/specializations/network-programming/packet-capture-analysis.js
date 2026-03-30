/**
 * @process specializations/network-programming/packet-capture-analysis
 * @description Packet Capture and Analysis Tool - Build a network packet capture tool using libpcap/npcap with
 * filtering, protocol decoding, statistics collection, and export capabilities.
 * @inputs { projectName: string, language: string, protocols?: array, features?: object }
 * @outputs { success: boolean, toolConfig: object, implementation: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/packet-capture-analysis', {
 *   projectName: 'Network Traffic Analyzer',
 *   language: 'C',
 *   protocols: ['TCP', 'UDP', 'HTTP', 'DNS'],
 *   features: { bpfFilters: true, pcapExport: true, liveCapture: true }
 * });
 *
 * @references
 * - libpcap: https://www.tcpdump.org/
 * - Wireshark Developer Guide: https://www.wireshark.org/docs/wsdg_html/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, language = 'C', protocols = ['TCP', 'UDP', 'ICMP'], features = { bpfFilters: true, pcapExport: true, liveCapture: true }, outputDir = 'packet-capture-analysis' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Packet Capture Tool: ${projectName}`);

  const phases = [
    { name: 'pcap-interface', task: pcapInterfaceTask },
    { name: 'packet-capture', task: packetCaptureTask },
    { name: 'bpf-filters', task: bpfFiltersTask },
    { name: 'protocol-decoding', task: protocolDecodingTask },
    { name: 'statistics', task: statisticsTask },
    { name: 'export', task: exportTask },
    { name: 'live-analysis', task: liveAnalysisTask },
    { name: 'testing', task: testSuiteTask }
  ];

  const results = {};
  for (const phase of phases) {
    const result = await ctx.task(phase.task, { projectName, language, protocols, features, outputDir });
    results[phase.name] = result;
    artifacts.push(...result.artifacts);
  }

  const validation = await ctx.task(validationTask, { projectName, protocols, results, outputDir });
  artifacts.push(...validation.artifacts);

  return {
    success: validation.overallScore >= 80, projectName,
    toolConfig: { protocols, features },
    implementation: results,
    testResults: { totalTests: results.testing.totalTests, passedTests: results.testing.passedTests },
    artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/network-programming/packet-capture-analysis', timestamp: startTime }
  };
}

export const pcapInterfaceTask = defineTask('pcap-interface', (args, taskCtx) => ({
  kind: 'agent', title: `Pcap Interface - ${args.projectName}`,
  skill: { name: 'packet-capture' },
  agent: { name: 'network-analysis-expert', prompt: { role: 'Pcap Engineer', task: 'Interface with libpcap', context: args, instructions: ['1. Initialize pcap', '2. List interfaces', '3. Open capture', '4. Handle permissions'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'packet-capture', 'pcap']
}));

export const packetCaptureTask = defineTask('packet-capture', (args, taskCtx) => ({
  kind: 'agent', title: `Packet Capture - ${args.projectName}`,
  skill: { name: 'packet-capture' },
  agent: { name: 'network-analysis-expert', prompt: { role: 'Capture Engineer', task: 'Implement packet capture', context: args, instructions: ['1. Capture packets', '2. Handle timeouts', '3. Buffer management', '4. Error handling'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'packet-capture', 'capture']
}));

export const bpfFiltersTask = defineTask('bpf-filters', (args, taskCtx) => ({
  kind: 'agent', title: `BPF Filters - ${args.projectName}`,
  skill: { name: 'packet-capture' },
  agent: { name: 'network-analysis-expert', prompt: { role: 'BPF Filter Engineer', task: 'Implement BPF filtering', context: args, instructions: ['1. Compile BPF filters', '2. Apply filters', '3. Filter validation', '4. Predefined filters'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'packet-capture', 'bpf']
}));

export const protocolDecodingTask = defineTask('protocol-decoding', (args, taskCtx) => ({
  kind: 'agent', title: `Protocol Decoding - ${args.projectName}`,
  skill: { name: 'packet-capture' },
  agent: { name: 'network-analysis-expert', prompt: { role: 'Protocol Decoder Engineer', task: 'Implement protocol decoding', context: args, instructions: ['1. Decode Ethernet', '2. Decode IP/IPv6', '3. Decode TCP/UDP', '4. Decode application protocols'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'packet-capture', 'decoder']
}));

export const statisticsTask = defineTask('statistics', (args, taskCtx) => ({
  kind: 'agent', title: `Statistics - ${args.projectName}`,
  skill: { name: 'packet-capture' },
  agent: { name: 'network-analysis-expert', prompt: { role: 'Statistics Engineer', task: 'Collect traffic statistics', context: args, instructions: ['1. Packet counts', '2. Byte counts', '3. Protocol distribution', '4. Flow tracking'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'packet-capture', 'statistics']
}));

export const exportTask = defineTask('export', (args, taskCtx) => ({
  kind: 'agent', title: `Export - ${args.projectName}`,
  skill: { name: 'packet-capture' },
  agent: { name: 'network-analysis-expert', prompt: { role: 'Export Engineer', task: 'Implement export formats', context: args, instructions: ['1. PCAP export', '2. PCAPNG export', '3. JSON export', '4. CSV export'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'packet-capture', 'export']
}));

export const liveAnalysisTask = defineTask('live-analysis', (args, taskCtx) => ({
  kind: 'agent', title: `Live Analysis - ${args.projectName}`,
  skill: { name: 'packet-capture' },
  agent: { name: 'network-analysis-expert', prompt: { role: 'Analysis Engineer', task: 'Implement live analysis', context: args, instructions: ['1. Real-time display', '2. Alert triggers', '3. Pattern matching', '4. Performance optimization'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'packet-capture', 'analysis']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent', title: `Test Suite - ${args.projectName}`,
  skill: { name: 'packet-capture' },
  agent: { name: 'network-analysis-expert', prompt: { role: 'Test Engineer', task: 'Create capture tests', context: args, instructions: ['1. Filter tests', '2. Decoder tests', '3. Export tests', '4. Performance tests'] }, outputSchema: { type: 'object', required: ['totalTests', 'passedTests', 'artifacts'], properties: { totalTests: { type: 'number' }, passedTests: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'packet-capture', 'testing']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent', title: `Validation - ${args.projectName}`,
  skill: { name: 'packet-capture' },
  agent: { name: 'network-analysis-expert', prompt: { role: 'QA Engineer', task: 'Validate tool', context: args, instructions: ['1. Verify features', '2. Check protocols', '3. Validate tests', '4. Calculate score'] }, outputSchema: { type: 'object', required: ['overallScore', 'passedChecks', 'artifacts'], properties: { overallScore: { type: 'number' }, passedChecks: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'packet-capture', 'validation']
}));
