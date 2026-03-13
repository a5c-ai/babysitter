/**
 * @process specializations/performance-optimization/algorithm-optimization
 * @description Algorithm Optimization - Optimize algorithms for better time complexity including analysis of
 * current complexity, identification of inefficient data structures, and implementation of improved algorithms.
 * @inputs { projectName: string, targetFunctions: array, currentComplexity?: object }
 * @outputs { success: boolean, optimizedAlgorithms: array, complexityImprovement: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/algorithm-optimization', {
 *   projectName: 'Search Service',
 *   targetFunctions: ['findMatches', 'sortResults', 'deduplicateList'],
 *   currentComplexity: { findMatches: 'O(n^2)', sortResults: 'O(n^2)', deduplicateList: 'O(n^2)' }
 * });
 *
 * @references
 * - Big O Notation: https://en.wikipedia.org/wiki/Big_O_notation
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetFunctions = [],
    currentComplexity = {},
    outputDir = 'algorithm-optimization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Algorithm Optimization for ${projectName}`);

  // Phase 1: Analyze Current Algorithm Complexity
  const complexityAnalysis = await ctx.task(analyzeCurrentComplexityTask, {
    projectName, targetFunctions, currentComplexity, outputDir
  });
  artifacts.push(...complexityAnalysis.artifacts);

  // Phase 2: Identify Inefficient Data Structures
  const dataStructureAnalysis = await ctx.task(identifyInefficientDataStructuresTask, {
    projectName, targetFunctions, complexityAnalysis, outputDir
  });
  artifacts.push(...dataStructureAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Found ${dataStructureAnalysis.inefficiencies.length} inefficient data structures. Review alternatives?`,
    title: 'Data Structure Analysis',
    context: { runId: ctx.runId, inefficiencies: dataStructureAnalysis.inefficiencies }
  });

  // Phase 3: Research Alternative Algorithms
  const alternatives = await ctx.task(researchAlternativeAlgorithmsTask, {
    projectName, complexityAnalysis, dataStructureAnalysis, outputDir
  });
  artifacts.push(...alternatives.artifacts);

  // Phase 4: Design Optimized Solution
  const design = await ctx.task(designOptimizedSolutionTask, {
    projectName, alternatives, outputDir
  });
  artifacts.push(...design.artifacts);

  // Phase 5: Implement Improved Algorithm
  const implementation = await ctx.task(implementImprovedAlgorithmTask, {
    projectName, design, outputDir
  });
  artifacts.push(...implementation.artifacts);

  // Phase 6: Add Comprehensive Tests
  const tests = await ctx.task(addComprehensiveTestsTask, {
    projectName, implementation, outputDir
  });
  artifacts.push(...tests.artifacts);

  // Phase 7: Benchmark Improvements
  const benchmarks = await ctx.task(benchmarkAlgorithmImprovementsTask, {
    projectName, implementation, complexityAnalysis, outputDir
  });
  artifacts.push(...benchmarks.artifacts);

  // Phase 8: Document Complexity Analysis
  const documentation = await ctx.task(documentComplexityAnalysisTask, {
    projectName, complexityAnalysis, implementation, benchmarks, outputDir
  });
  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Algorithm optimization complete. ${implementation.optimizedAlgorithms.length} algorithms improved. Accept changes?`,
    title: 'Algorithm Optimization Review',
    context: { runId: ctx.runId, benchmarks: benchmarks.results }
  });

  return {
    success: true,
    projectName,
    optimizedAlgorithms: implementation.optimizedAlgorithms,
    complexityImprovement: benchmarks.complexityImprovement,
    benchmarkResults: benchmarks.results,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/performance-optimization/algorithm-optimization',
      timestamp: startTime,
      outputDir
    }
  };
}

export const analyzeCurrentComplexityTask = defineTask('analyze-current-complexity', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Current Complexity - ${args.projectName}`,
  agent: {
    name: 'benchmarking-expert',
    prompt: {
      role: 'Performance Engineer',
      task: 'Analyze current algorithm complexity',
      context: args,
      instructions: [
        '1. Analyze time complexity of each function',
        '2. Analyze space complexity',
        '3. Identify worst-case scenarios',
        '4. Document complexity analysis',
        '5. Identify improvement opportunities'
      ],
      outputFormat: 'JSON with complexity analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: { analysis: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'algorithm', 'complexity']
}));

export const identifyInefficientDataStructuresTask = defineTask('identify-inefficient-data-structures', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify Inefficient Data Structures - ${args.projectName}`,
  agent: {
    name: 'benchmarking-expert',
    prompt: {
      role: 'Performance Engineer',
      task: 'Identify inefficient data structures',
      context: args,
      instructions: [
        '1. Review data structure usage',
        '2. Identify suboptimal choices',
        '3. Analyze access patterns',
        '4. Suggest better alternatives',
        '5. Document findings'
      ],
      outputFormat: 'JSON with data structure analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['inefficiencies', 'artifacts'],
      properties: { inefficiencies: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'algorithm', 'data-structures']
}));

export const researchAlternativeAlgorithmsTask = defineTask('research-alternative-algorithms', (args, taskCtx) => ({
  kind: 'agent',
  title: `Research Alternative Algorithms - ${args.projectName}`,
  agent: {
    name: 'benchmarking-expert',
    prompt: {
      role: 'Performance Engineer',
      task: 'Research alternative algorithms',
      context: args,
      instructions: [
        '1. Research standard algorithms',
        '2. Evaluate complexity tradeoffs',
        '3. Consider space vs time',
        '4. Identify best alternatives',
        '5. Document research findings'
      ],
      outputFormat: 'JSON with algorithm alternatives'
    },
    outputSchema: {
      type: 'object',
      required: ['alternatives', 'artifacts'],
      properties: { alternatives: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'algorithm', 'research']
}));

export const designOptimizedSolutionTask = defineTask('design-optimized-solution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Optimized Solution - ${args.projectName}`,
  agent: {
    name: 'benchmarking-expert',
    prompt: {
      role: 'Performance Engineer',
      task: 'Design optimized algorithm solution',
      context: args,
      instructions: [
        '1. Design improved algorithm',
        '2. Choose optimal data structures',
        '3. Plan implementation approach',
        '4. Consider edge cases',
        '5. Document design decisions'
      ],
      outputFormat: 'JSON with design details'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'artifacts'],
      properties: { design: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'algorithm', 'design']
}));

export const implementImprovedAlgorithmTask = defineTask('implement-improved-algorithm', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Improved Algorithm - ${args.projectName}`,
  agent: {
    name: 'benchmarking-expert',
    prompt: {
      role: 'Performance Engineer',
      task: 'Implement improved algorithm',
      context: args,
      instructions: [
        '1. Implement optimized algorithm',
        '2. Use efficient data structures',
        '3. Handle edge cases',
        '4. Ensure correctness',
        '5. Document implementation'
      ],
      outputFormat: 'JSON with implementation details'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedAlgorithms', 'artifacts'],
      properties: { optimizedAlgorithms: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'algorithm', 'implementation']
}));

export const addComprehensiveTestsTask = defineTask('add-comprehensive-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Add Comprehensive Tests - ${args.projectName}`,
  agent: {
    name: 'benchmarking-expert',
    prompt: {
      role: 'Performance Engineer',
      task: 'Add comprehensive algorithm tests',
      context: args,
      instructions: [
        '1. Add unit tests',
        '2. Add edge case tests',
        '3. Add performance tests',
        '4. Verify correctness',
        '5. Document test coverage'
      ],
      outputFormat: 'JSON with test details'
    },
    outputSchema: {
      type: 'object',
      required: ['tests', 'artifacts'],
      properties: { tests: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'algorithm', 'testing']
}));

export const benchmarkAlgorithmImprovementsTask = defineTask('benchmark-algorithm-improvements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Benchmark Algorithm Improvements - ${args.projectName}`,
  agent: {
    name: 'benchmarking-expert',
    prompt: {
      role: 'Performance Engineer',
      task: 'Benchmark algorithm improvements',
      context: args,
      instructions: [
        '1. Benchmark original vs optimized',
        '2. Test with various input sizes',
        '3. Measure time complexity empirically',
        '4. Compare against theoretical',
        '5. Document benchmark results'
      ],
      outputFormat: 'JSON with benchmark results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'complexityImprovement', 'artifacts'],
      properties: { results: { type: 'object' }, complexityImprovement: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'algorithm', 'benchmarking']
}));

export const documentComplexityAnalysisTask = defineTask('document-complexity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document Complexity Analysis - ${args.projectName}`,
  agent: {
    name: 'benchmarking-expert',
    prompt: {
      role: 'Performance Engineer',
      task: 'Document complexity analysis and improvements',
      context: args,
      instructions: [
        '1. Document original complexity',
        '2. Document improved complexity',
        '3. Explain optimization rationale',
        '4. Include benchmark data',
        '5. Generate analysis report'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'artifacts'],
      properties: { documentation: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'algorithm', 'documentation']
}));
