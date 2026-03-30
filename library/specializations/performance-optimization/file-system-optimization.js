/**
 * @process specializations/performance-optimization/file-system-optimization
 * @description File System Optimization - Optimize file system access patterns and configuration including
 * memory-mapped I/O, file caching, and directory structure optimization.
 * @inputs { projectName: string, targetApplication: string, fileSystemType?: string }
 * @outputs { success: boolean, optimizations: array, improvementMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/file-system-optimization', {
 *   projectName: 'Document Storage Service',
 *   targetApplication: 'storage-service',
 *   fileSystemType: 'ext4'
 * });
 *
 * @references
 * - Linux Performance: https://www.brendangregg.com/linuxperf.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetApplication,
    fileSystemType = 'ext4',
    outputDir = 'fs-optimization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting File System Optimization for ${projectName}`);

  // Phase 1: Analyze File Access Patterns
  const accessAnalysis = await ctx.task(analyzeFileAccessPatternsTask, { projectName, targetApplication, outputDir });
  artifacts.push(...accessAnalysis.artifacts);

  // Phase 2: Evaluate File System Choice
  const fsEvaluation = await ctx.task(evaluateFileSystemChoiceTask, { projectName, fileSystemType, accessAnalysis, outputDir });
  artifacts.push(...fsEvaluation.artifacts);

  // Phase 3: Optimize Directory Structures
  const dirOpt = await ctx.task(optimizeDirectoryStructuresTask, { projectName, accessAnalysis, outputDir });
  artifacts.push(...dirOpt.artifacts);

  await ctx.breakpoint({
    question: `File access patterns analyzed. Found ${accessAnalysis.issues.length} optimization opportunities. Proceed?`,
    title: 'File System Analysis',
    context: { runId: ctx.runId, accessAnalysis }
  });

  // Phase 4: Configure File System Mount Options
  const mountOptions = await ctx.task(configureFilesystemMountOptionsTask, { projectName, fileSystemType, outputDir });
  artifacts.push(...mountOptions.artifacts);

  // Phase 5: Implement Memory-Mapped I/O
  const mmapOpt = await ctx.task(implementMemoryMappedIOTask, { projectName, accessAnalysis, outputDir });
  artifacts.push(...mmapOpt.artifacts);

  // Phase 6: Optimize File Caching
  const cachingOpt = await ctx.task(optimizeFileCachingTask, { projectName, outputDir });
  artifacts.push(...cachingOpt.artifacts);

  // Phase 7: Benchmark Improvements
  const benchmarks = await ctx.task(benchmarkFileSystemImprovementsTask, { projectName, dirOpt, mmapOpt, cachingOpt, outputDir });
  artifacts.push(...benchmarks.artifacts);

  // Phase 8: Document Best Practices
  const documentation = await ctx.task(documentFileSystemBestPracticesTask, { projectName, benchmarks, outputDir });
  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `File system optimization complete. Improvement: ${benchmarks.improvementPercent}%. Accept changes?`,
    title: 'File System Optimization Results',
    context: { runId: ctx.runId, benchmarks }
  });

  return {
    success: true,
    projectName,
    optimizations: [...dirOpt.optimizations, ...mountOptions.optimizations, ...mmapOpt.optimizations, ...cachingOpt.optimizations],
    improvementMetrics: benchmarks.metrics,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/performance-optimization/file-system-optimization', timestamp: startTime, outputDir }
  };
}

export const analyzeFileAccessPatternsTask = defineTask('analyze-file-access-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze File Access Patterns - ${args.projectName}`,
  agent: {
    name: 'io-performance-expert',
    prompt: { role: 'Performance Engineer', task: 'Analyze file access patterns', context: args,
      instructions: ['1. Trace file operations', '2. Analyze read/write patterns', '3. Identify hot files', '4. Find access issues', '5. Document patterns'],
      outputFormat: 'JSON with access analysis' },
    outputSchema: { type: 'object', required: ['patterns', 'issues', 'artifacts'], properties: { patterns: { type: 'array' }, issues: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'file-system', 'analysis']
}));

export const evaluateFileSystemChoiceTask = defineTask('evaluate-file-system-choice', (args, taskCtx) => ({
  kind: 'agent',
  title: `Evaluate File System Choice - ${args.projectName}`,
  agent: {
    name: 'io-performance-expert',
    prompt: { role: 'Performance Engineer', task: 'Evaluate file system choice', context: args,
      instructions: ['1. Analyze workload type', '2. Compare file systems', '3. Evaluate performance', '4. Recommend changes', '5. Document evaluation'],
      outputFormat: 'JSON with evaluation' },
    outputSchema: { type: 'object', required: ['evaluation', 'artifacts'], properties: { evaluation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'file-system', 'evaluation']
}));

export const optimizeDirectoryStructuresTask = defineTask('optimize-directory-structures', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize Directory Structures - ${args.projectName}`,
  agent: {
    name: 'io-performance-expert',
    prompt: { role: 'Performance Engineer', task: 'Optimize directory structures', context: args,
      instructions: ['1. Analyze directory layout', '2. Flatten deep directories', '3. Distribute files', '4. Optimize naming', '5. Document changes'],
      outputFormat: 'JSON with directory optimizations' },
    outputSchema: { type: 'object', required: ['optimizations', 'artifacts'], properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'file-system', 'directories']
}));

export const configureFilesystemMountOptionsTask = defineTask('configure-filesystem-mount-options', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Mount Options - ${args.projectName}`,
  agent: {
    name: 'io-performance-expert',
    prompt: { role: 'Performance Engineer', task: 'Configure file system mount options', context: args,
      instructions: ['1. Review mount options', '2. Enable noatime', '3. Configure barriers', '4. Tune read-ahead', '5. Document configuration'],
      outputFormat: 'JSON with mount options' },
    outputSchema: { type: 'object', required: ['optimizations', 'artifacts'], properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'file-system', 'mount-options']
}));

export const implementMemoryMappedIOTask = defineTask('implement-memory-mapped-io', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Memory-Mapped I/O - ${args.projectName}`,
  agent: {
    name: 'io-performance-expert',
    prompt: { role: 'Performance Engineer', task: 'Implement memory-mapped I/O', context: args,
      instructions: ['1. Identify mmap candidates', '2. Implement mmap', '3. Handle page faults', '4. Manage mappings', '5. Document implementation'],
      outputFormat: 'JSON with mmap implementation' },
    outputSchema: { type: 'object', required: ['optimizations', 'artifacts'], properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'file-system', 'mmap']
}));

export const optimizeFileCachingTask = defineTask('optimize-file-caching', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize File Caching - ${args.projectName}`,
  agent: {
    name: 'io-performance-expert',
    prompt: { role: 'Performance Engineer', task: 'Optimize file caching', context: args,
      instructions: ['1. Configure page cache', '2. Tune dirty pages', '3. Configure read-ahead', '4. Optimize VFS cache', '5. Document settings'],
      outputFormat: 'JSON with caching optimizations' },
    outputSchema: { type: 'object', required: ['optimizations', 'artifacts'], properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'file-system', 'caching']
}));

export const benchmarkFileSystemImprovementsTask = defineTask('benchmark-file-system-improvements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Benchmark File System Improvements - ${args.projectName}`,
  agent: {
    name: 'io-performance-expert',
    prompt: { role: 'Performance Engineer', task: 'Benchmark file system improvements', context: args,
      instructions: ['1. Run baseline benchmarks', '2. Run optimized benchmarks', '3. Compare metrics', '4. Calculate improvement', '5. Document results'],
      outputFormat: 'JSON with benchmark results' },
    outputSchema: { type: 'object', required: ['improvementPercent', 'metrics', 'artifacts'], properties: { improvementPercent: { type: 'number' }, metrics: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'file-system', 'benchmarking']
}));

export const documentFileSystemBestPracticesTask = defineTask('document-file-system-best-practices', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document Best Practices - ${args.projectName}`,
  agent: {
    name: 'io-performance-expert',
    prompt: { role: 'Performance Engineer', task: 'Document file system best practices', context: args,
      instructions: ['1. Document optimizations', '2. Create guidelines', '3. Include benchmarks', '4. Add recommendations', '5. Generate report'],
      outputFormat: 'JSON with documentation' },
    outputSchema: { type: 'object', required: ['documentation', 'artifacts'], properties: { documentation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'file-system', 'documentation']
}));
