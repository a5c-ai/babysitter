/**
 * @process specializations/algorithms-optimization/leetcode-problem-solving
 * @description LeetCode Problem-Solving Session - Structured process for solving LeetCode problems with time constraints,
 * including problem analysis, complexity analysis, implementation, testing, and optimization iterations.
 * @inputs { problemId?: string, problemUrl?: string, difficulty?: string, timeLimit?: number, language?: string }
 * @outputs { success: boolean, solutionCode: string, complexity: object, testsPassed: boolean, optimizationNotes: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/algorithms-optimization/leetcode-problem-solving', {
 *   problemId: '1',
 *   problemUrl: 'https://leetcode.com/problems/two-sum/',
 *   difficulty: 'easy',
 *   timeLimit: 30,
 *   language: 'python'
 * });
 *
 * @references
 * - LeetCode Patterns: https://seanprashad.com/leetcode-patterns/
 * - Problem-Solving Strategies: https://www.geeksforgeeks.org/fundamentals-of-algorithms/
 * - Big-O Cheat Sheet: https://www.bigocheatsheet.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problemId = 'unknown',
    problemUrl = '',
    difficulty = 'medium',
    timeLimit = 45, // minutes
    language = 'python',
    targetComplexity = null,
    outputDir = 'leetcode-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting LeetCode Problem-Solving Session for Problem ${problemId}`);
  ctx.log('info', `Difficulty: ${difficulty}, Time Limit: ${timeLimit} minutes, Language: ${language}`);

  // ============================================================================
  // PHASE 1: PROBLEM ANALYSIS AND UNDERSTANDING
  // ============================================================================

  ctx.log('info', 'Phase 1: Problem Analysis and Understanding');

  const problemAnalysis = await ctx.task(problemAnalysisTask, {
    problemId,
    problemUrl,
    difficulty,
    language,
    outputDir
  });

  artifacts.push(...problemAnalysis.artifacts);

  ctx.log('info', `Problem analyzed - Category: ${problemAnalysis.category}, Patterns: ${problemAnalysis.patterns.join(', ')}`);

  // ============================================================================
  // PHASE 2: SOLUTION DESIGN AND APPROACH SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Solution Design and Approach Selection');

  const solutionDesign = await ctx.task(solutionDesignTask, {
    problemId,
    problemAnalysis,
    targetComplexity,
    language,
    outputDir
  });

  artifacts.push(...solutionDesign.artifacts);

  // Quality Gate: Approach review
  await ctx.breakpoint({
    question: `Solution approach designed for Problem ${problemId}. Approach: ${solutionDesign.approach}. Expected complexity: O(${solutionDesign.expectedTimeComplexity}). Proceed with implementation?`,
    title: 'Solution Approach Review',
    context: {
      runId: ctx.runId,
      approach: solutionDesign.approach,
      algorithm: solutionDesign.algorithm,
      dataStructures: solutionDesign.dataStructures,
      expectedTimeComplexity: solutionDesign.expectedTimeComplexity,
      expectedSpaceComplexity: solutionDesign.expectedSpaceComplexity,
      files: solutionDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 3: BRUTE FORCE IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Brute Force Implementation');

  const bruteForceImpl = await ctx.task(bruteForceImplementationTask, {
    problemId,
    problemAnalysis,
    solutionDesign,
    language,
    outputDir
  });

  artifacts.push(...bruteForceImpl.artifacts);

  ctx.log('info', `Brute force implemented - Complexity: O(${bruteForceImpl.timeComplexity})`);

  // ============================================================================
  // PHASE 4: OPTIMIZED SOLUTION IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Optimized Solution Implementation');

  const optimizedImpl = await ctx.task(optimizedImplementationTask, {
    problemId,
    problemAnalysis,
    solutionDesign,
    bruteForceImpl,
    language,
    outputDir
  });

  artifacts.push(...optimizedImpl.artifacts);

  ctx.log('info', `Optimized solution implemented - Complexity: O(${optimizedImpl.timeComplexity})`);

  // ============================================================================
  // PHASE 5: TESTING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Testing and Validation');

  const testingResult = await ctx.task(testingValidationTask, {
    problemId,
    problemAnalysis,
    optimizedImpl,
    language,
    outputDir
  });

  artifacts.push(...testingResult.artifacts);

  // Quality Gate: Test validation
  if (!testingResult.allTestsPassed) {
    await ctx.breakpoint({
      question: `Some tests failed for Problem ${problemId}. Passed: ${testingResult.passedCount}/${testingResult.totalCount}. Review and fix issues?`,
      title: 'Test Validation Review',
      context: {
        runId: ctx.runId,
        passedCount: testingResult.passedCount,
        totalCount: testingResult.totalCount,
        failedTests: testingResult.failedTests,
        recommendation: 'Review failing test cases and fix implementation',
        files: testingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 6: COMPLEXITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Complexity Analysis');

  const complexityAnalysis = await ctx.task(complexityAnalysisTask, {
    problemId,
    bruteForceImpl,
    optimizedImpl,
    targetComplexity,
    outputDir
  });

  artifacts.push(...complexityAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: PATTERN RECOGNITION AND NOTES
  // ============================================================================

  ctx.log('info', 'Phase 7: Pattern Recognition and Learning Notes');

  const patternNotes = await ctx.task(patternNotesTask, {
    problemId,
    problemAnalysis,
    solutionDesign,
    optimizedImpl,
    complexityAnalysis,
    outputDir
  });

  artifacts.push(...patternNotes.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `LeetCode session complete for Problem ${problemId}. Tests passed: ${testingResult.allTestsPassed}. Final complexity: O(${optimizedImpl.timeComplexity}). Review solution?`,
    title: 'LeetCode Session Complete',
    context: {
      runId: ctx.runId,
      summary: {
        problemId,
        difficulty,
        category: problemAnalysis.category,
        patterns: problemAnalysis.patterns,
        approach: solutionDesign.approach,
        finalTimeComplexity: optimizedImpl.timeComplexity,
        finalSpaceComplexity: optimizedImpl.spaceComplexity,
        testsPassed: testingResult.allTestsPassed
      },
      files: [
        { path: optimizedImpl.solutionPath, format: language, label: 'Optimized Solution' },
        { path: complexityAnalysis.analysisPath, format: 'markdown', label: 'Complexity Analysis' },
        { path: patternNotes.notesPath, format: 'markdown', label: 'Pattern Notes' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    problemId,
    problemUrl,
    difficulty,
    category: problemAnalysis.category,
    patterns: problemAnalysis.patterns,
    approach: solutionDesign.approach,
    solutionCode: optimizedImpl.code,
    complexity: {
      time: optimizedImpl.timeComplexity,
      space: optimizedImpl.spaceComplexity,
      bruteForceTime: bruteForceImpl.timeComplexity,
      improvement: complexityAnalysis.improvement
    },
    testsPassed: testingResult.allTestsPassed,
    testResults: {
      passed: testingResult.passedCount,
      total: testingResult.totalCount
    },
    optimizationNotes: patternNotes.keyInsights,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/algorithms-optimization/leetcode-problem-solving',
      timestamp: startTime,
      language,
      timeLimit,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const problemAnalysisTask = defineTask('problem-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Problem Analysis - ${args.problemId}`,
  skills: ['leetcode-problem-fetcher', 'dp-pattern-library'],
  agent: {
    name: 'competitive-programmer',
    prompt: {
      role: 'Competitive Programmer and Algorithm Expert',
      task: 'Analyze the LeetCode problem to understand requirements and identify patterns',
      context: {
        problemId: args.problemId,
        problemUrl: args.problemUrl,
        difficulty: args.difficulty,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Read and understand the problem statement carefully',
        '2. Identify input format, constraints, and edge cases',
        '3. Analyze the expected output format',
        '4. Categorize the problem (Array, String, Tree, Graph, DP, etc.)',
        '5. Identify applicable algorithmic patterns (Two Pointers, Sliding Window, BFS, DFS, etc.)',
        '6. List key constraints that affect algorithm choice',
        '7. Identify edge cases (empty input, single element, large input)',
        '8. Note any special conditions or tricky requirements',
        '9. Estimate expected time complexity based on constraints',
        '10. Document problem analysis'
      ],
      outputFormat: 'JSON object with problem analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['category', 'patterns', 'constraints', 'artifacts'],
      properties: {
        category: { type: 'string', description: 'Problem category (Array, String, Tree, etc.)' },
        patterns: { type: 'array', items: { type: 'string' }, description: 'Applicable patterns' },
        constraints: {
          type: 'object',
          properties: {
            inputSize: { type: 'string' },
            timeLimit: { type: 'string' },
            spaceLimit: { type: 'string' }
          }
        },
        edgeCases: { type: 'array', items: { type: 'string' } },
        expectedComplexity: { type: 'string' },
        problemSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'leetcode', 'problem-analysis']
}));

export const solutionDesignTask = defineTask('solution-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Solution Design - ${args.problemId}`,
  skills: ['complexity-analyzer', 'dp-pattern-library'],
  agent: {
    name: 'competitive-programmer',
    prompt: {
      role: 'Algorithm Designer',
      task: 'Design solution approach and select optimal algorithm',
      context: {
        problemId: args.problemId,
        problemAnalysis: args.problemAnalysis,
        targetComplexity: args.targetComplexity,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Consider multiple solution approaches',
        '2. Evaluate brute force approach as baseline',
        '3. Identify optimization opportunities',
        '4. Select optimal algorithm based on constraints',
        '5. Choose appropriate data structures',
        '6. Define step-by-step solution logic',
        '7. Estimate time and space complexity',
        '8. Consider trade-offs between time and space',
        '9. Plan for edge case handling',
        '10. Document solution design'
      ],
      outputFormat: 'JSON object with solution design'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'algorithm', 'dataStructures', 'expectedTimeComplexity', 'artifacts'],
      properties: {
        approach: { type: 'string', description: 'High-level solution approach' },
        algorithm: { type: 'string', description: 'Specific algorithm to use' },
        dataStructures: { type: 'array', items: { type: 'string' } },
        expectedTimeComplexity: { type: 'string' },
        expectedSpaceComplexity: { type: 'string' },
        steps: { type: 'array', items: { type: 'string' } },
        alternativeApproaches: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'leetcode', 'solution-design']
}));

export const bruteForceImplementationTask = defineTask('brute-force-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Brute Force Implementation - ${args.problemId}`,
  skills: ['test-case-generator'],
  agent: {
    name: 'competitive-programmer',
    prompt: {
      role: 'Software Engineer',
      task: 'Implement brute force solution as baseline',
      context: {
        problemId: args.problemId,
        problemAnalysis: args.problemAnalysis,
        solutionDesign: args.solutionDesign,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement straightforward brute force solution',
        '2. Focus on correctness over efficiency',
        '3. Handle all edge cases',
        '4. Use clear variable names and comments',
        '5. Test with sample inputs',
        '6. Document time and space complexity',
        '7. Identify bottlenecks for optimization',
        '8. Save solution code to file'
      ],
      outputFormat: 'JSON object with brute force implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['code', 'timeComplexity', 'spaceComplexity', 'artifacts'],
      properties: {
        code: { type: 'string', description: 'Brute force solution code' },
        timeComplexity: { type: 'string' },
        spaceComplexity: { type: 'string' },
        bottlenecks: { type: 'array', items: { type: 'string' } },
        solutionPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'leetcode', 'brute-force']
}));

export const optimizedImplementationTask = defineTask('optimized-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Optimized Implementation - ${args.problemId}`,
  skills: ['complexity-analyzer'],
  agent: {
    name: 'competitive-programmer',
    prompt: {
      role: 'Algorithm Optimization Expert',
      task: 'Implement optimized solution using best approach',
      context: {
        problemId: args.problemId,
        problemAnalysis: args.problemAnalysis,
        solutionDesign: args.solutionDesign,
        bruteForceImpl: args.bruteForceImpl,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement optimized solution using designed approach',
        '2. Apply appropriate data structures for efficiency',
        '3. Eliminate unnecessary operations',
        '4. Optimize memory usage where possible',
        '5. Handle all edge cases correctly',
        '6. Write clean, production-quality code',
        '7. Add comments explaining key optimizations',
        '8. Verify correctness with test cases',
        '9. Document final time and space complexity',
        '10. Save optimized solution to file'
      ],
      outputFormat: 'JSON object with optimized implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['code', 'timeComplexity', 'spaceComplexity', 'solutionPath', 'artifacts'],
      properties: {
        code: { type: 'string', description: 'Optimized solution code' },
        timeComplexity: { type: 'string' },
        spaceComplexity: { type: 'string' },
        optimizations: { type: 'array', items: { type: 'string' } },
        solutionPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'leetcode', 'optimized']
}));

export const testingValidationTask = defineTask('testing-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Testing and Validation - ${args.problemId}`,
  skills: ['test-case-generator'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'QA Engineer',
      task: 'Test solution with comprehensive test cases',
      context: {
        problemId: args.problemId,
        problemAnalysis: args.problemAnalysis,
        optimizedImpl: args.optimizedImpl,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test with provided sample cases',
        '2. Create additional test cases for edge cases',
        '3. Test with boundary conditions',
        '4. Test with large inputs for performance',
        '5. Verify output format matches expected',
        '6. Document test results',
        '7. Identify any failing cases',
        '8. Create test report'
      ],
      outputFormat: 'JSON object with test results'
    },
    outputSchema: {
      type: 'object',
      required: ['allTestsPassed', 'passedCount', 'totalCount', 'artifacts'],
      properties: {
        allTestsPassed: { type: 'boolean' },
        passedCount: { type: 'number' },
        totalCount: { type: 'number' },
        failedTests: { type: 'array', items: { type: 'object' } },
        testCases: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'leetcode', 'testing']
}));

export const complexityAnalysisTask = defineTask('complexity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Complexity Analysis - ${args.problemId}`,
  skills: ['complexity-analyzer'],
  agent: {
    name: 'complexity-analyst',
    prompt: {
      role: 'Algorithm Analyst',
      task: 'Perform detailed complexity analysis',
      context: {
        problemId: args.problemId,
        bruteForceImpl: args.bruteForceImpl,
        optimizedImpl: args.optimizedImpl,
        targetComplexity: args.targetComplexity,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze time complexity step by step',
        '2. Analyze space complexity including auxiliary space',
        '3. Compare brute force vs optimized complexity',
        '4. Calculate improvement factor',
        '5. Verify complexity matches expected bounds',
        '6. Document complexity derivation',
        '7. Create complexity analysis report'
      ],
      outputFormat: 'JSON object with complexity analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['timeComplexity', 'spaceComplexity', 'improvement', 'analysisPath', 'artifacts'],
      properties: {
        timeComplexity: { type: 'string' },
        spaceComplexity: { type: 'string' },
        improvement: { type: 'string' },
        derivation: { type: 'string' },
        analysisPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'leetcode', 'complexity-analysis']
}));

export const patternNotesTask = defineTask('pattern-notes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Pattern Recognition Notes - ${args.problemId}`,
  skills: ['dp-pattern-library'],
  agent: {
    name: 'competitive-programmer',
    prompt: {
      role: 'Competitive Programming Coach',
      task: 'Document patterns and key learnings for future reference',
      context: {
        problemId: args.problemId,
        problemAnalysis: args.problemAnalysis,
        solutionDesign: args.solutionDesign,
        optimizedImpl: args.optimizedImpl,
        complexityAnalysis: args.complexityAnalysis,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify patterns used in the solution',
        '2. Document key insights and tricks',
        '3. Note similar problems that use same patterns',
        '4. Create template code for reuse',
        '5. Document common pitfalls to avoid',
        '6. Summarize key learnings',
        '7. Save pattern notes for future reference'
      ],
      outputFormat: 'JSON object with pattern notes'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'keyInsights', 'notesPath', 'artifacts'],
      properties: {
        patterns: { type: 'array', items: { type: 'string' } },
        keyInsights: { type: 'array', items: { type: 'string' } },
        similarProblems: { type: 'array', items: { type: 'string' } },
        templateCode: { type: 'string' },
        pitfalls: { type: 'array', items: { type: 'string' } },
        notesPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'leetcode', 'pattern-notes']
}));
