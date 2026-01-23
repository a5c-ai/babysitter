/**
 * @process qa-testing-automation/mutation-testing
 * @description Implement mutation testing to validate quality and effectiveness of unit tests by introducing code mutations and verifying test detection
 * @category Mutation Testing
 * @priority Low
 * @complexity Medium
 * @inputs { projectPath: string, testSuitePath: string, mutationTool: string, scopePatterns: array, qualityThresholds: object }
 * @outputs { success: boolean, mutationScore: number, survivedMutants: array, testImprovements: array, dashboardUrl: string }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectPath,
    testSuitePath = 'src/**/*.test.js',
    mutationTool = 'stryker',
    scopePatterns = ['src/**/*.js'],
    qualityThresholds = {
      overallMutationScore: 80,
      criticalCodeMutationScore: 90,
      maxSurvivedMutants: 20
    },
    outputDir = 'mutation-testing-output',
    integrateCICD = true,
    generateDashboard = true
  } = inputs;

  const results = {
    success: false,
    mutationScore: 0,
    survivedMutants: [],
    testImprovements: [],
    artifacts: [],
    timestamp: ctx.now()
  };

  ctx.log('info', `Starting Mutation Testing Integration for ${projectPath}`);

  // ============================================================================
  // PHASE 1: MUTATION TESTING TOOL SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up mutation testing tool');
  const toolSetup = await ctx.task(mutationToolSetupTask, {
    projectPath,
    mutationTool,
    testSuitePath,
    scopePatterns,
    outputDir
  });

  results.artifacts.push(...toolSetup.artifacts);

  await ctx.checkpoint({
    title: 'Phase 1: Mutation Testing Tool Setup Complete',
    message: `${toolSetup.tool} configured successfully. Configuration file: ${toolSetup.configFile}`,
    context: {
      toolSetup,
      configFile: toolSetup.configFile
    }
  });

  // ============================================================================
  // PHASE 2: SCOPE DEFINITION AND CODE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining mutation testing scope and analyzing code');
  const scopeAnalysis = await ctx.task(scopeAnalysisTask, {
    projectPath,
    scopePatterns,
    testSuitePath,
    qualityThresholds,
    outputDir
  });

  results.artifacts.push(...scopeAnalysis.artifacts);

  await ctx.checkpoint({
    title: 'Phase 2: Scope Analysis Complete',
    message: `Identified ${scopeAnalysis.filesInScope} files for mutation testing. Critical code paths: ${scopeAnalysis.criticalCodePaths.length}`,
    context: {
      scopeAnalysis,
      filesInScope: scopeAnalysis.filesInScope,
      criticalCodePaths: scopeAnalysis.criticalCodePaths
    }
  });

  // ============================================================================
  // PHASE 3: BASELINE MUTATION TESTING EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Running baseline mutation testing');
  const baselineExecution = await ctx.task(baselineMutationExecutionTask, {
    projectPath,
    mutationTool,
    scopeAnalysis,
    outputDir
  });

  results.mutationScore = baselineExecution.mutationScore;
  results.survivedMutants = baselineExecution.survivedMutants;
  results.artifacts.push(...baselineExecution.artifacts);

  await ctx.checkpoint({
    title: 'Phase 3: Baseline Mutation Testing Complete',
    message: `Baseline mutation score: ${baselineExecution.mutationScore}%. Survived mutants: ${baselineExecution.survivedMutants.length}`,
    context: {
      baselineExecution,
      mutationScore: baselineExecution.mutationScore,
      totalMutants: baselineExecution.totalMutants,
      killedMutants: baselineExecution.killedMutants,
      survivedMutants: baselineExecution.survivedMutants.length,
      timedOutMutants: baselineExecution.timedOutMutants
    }
  });

  // ============================================================================
  // PHASE 4: MUTATION ANALYSIS AND CATEGORIZATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing survived mutants and categorizing');
  const mutationAnalysis = await ctx.task(mutationAnalysisTask, {
    projectPath,
    baselineExecution,
    scopeAnalysis,
    qualityThresholds,
    outputDir
  });

  results.artifacts.push(...mutationAnalysis.artifacts);

  await ctx.checkpoint({
    title: 'Phase 4: Mutation Analysis Complete',
    message: `Analyzed ${mutationAnalysis.totalSurvivedMutants} survived mutants. Equivalent mutants: ${mutationAnalysis.equivalentMutants.length}, Actionable: ${mutationAnalysis.actionableMutants.length}`,
    context: {
      mutationAnalysis,
      equivalentMutants: mutationAnalysis.equivalentMutants.length,
      actionableMutants: mutationAnalysis.actionableMutants.length,
      highPriorityMutants: mutationAnalysis.highPriorityMutants.length
    }
  });

  // ============================================================================
  // PHASE 5: TEST IMPROVEMENT RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 5: Generating test improvement recommendations');
  const testImprovements = await ctx.task(testImprovementRecommendationsTask, {
    projectPath,
    mutationAnalysis,
    scopeAnalysis,
    baselineExecution,
    qualityThresholds,
    outputDir
  });

  results.testImprovements = testImprovements.recommendations;
  results.artifacts.push(...testImprovements.artifacts);

  await ctx.checkpoint({
    title: 'Phase 5: Test Improvement Recommendations Generated',
    message: `Generated ${testImprovements.recommendations.length} test improvement recommendations. High priority: ${testImprovements.highPriorityCount}`,
    context: {
      testImprovements,
      totalRecommendations: testImprovements.recommendations.length,
      highPriorityCount: testImprovements.highPriorityCount,
      estimatedEffort: testImprovements.estimatedEffort
    }
  });

  // ============================================================================
  // PHASE 6: ITERATIVE TEST IMPROVEMENT (OPTIONAL)
  // ============================================================================

  let improvedMutationScore = baselineExecution.mutationScore;
  let iterationResults = [];

  if (testImprovements.autoFixRecommendations && testImprovements.autoFixRecommendations.length > 0) {
    ctx.log('info', 'Phase 6: Implementing test improvements iteratively');

    const improvementExecution = await ctx.task(testImprovementExecutionTask, {
      projectPath,
      testImprovements,
      mutationTool,
      scopeAnalysis,
      qualityThresholds,
      outputDir
    });

    improvedMutationScore = improvementExecution.newMutationScore;
    iterationResults = improvementExecution.iterations;
    results.artifacts.push(...improvementExecution.artifacts);

    await ctx.checkpoint({
      title: 'Phase 6: Test Improvements Applied',
      message: `Mutation score improved from ${baselineExecution.mutationScore}% to ${improvedMutationScore}%. Iterations: ${iterationResults.length}`,
      context: {
        improvementExecution,
        baselineScore: baselineExecution.mutationScore,
        improvedScore: improvedMutationScore,
        improvement: improvedMutationScore - baselineExecution.mutationScore,
        iterations: iterationResults.length
      }
    });

    results.mutationScore = improvedMutationScore;
  } else {
    ctx.log('info', 'Phase 6: Skipped (no auto-fix recommendations)');
  }

  // ============================================================================
  // PHASE 7: MUTATION SCORE THRESHOLD CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Configuring mutation score thresholds');
  const thresholdConfiguration = await ctx.task(thresholdConfigurationTask, {
    projectPath,
    mutationTool,
    qualityThresholds,
    currentMutationScore: improvedMutationScore,
    scopeAnalysis,
    outputDir
  });

  results.artifacts.push(...thresholdConfiguration.artifacts);

  await ctx.checkpoint({
    title: 'Phase 7: Mutation Score Thresholds Configured',
    message: `Overall threshold: ${thresholdConfiguration.overallThreshold}%, Critical code threshold: ${thresholdConfiguration.criticalThreshold}%`,
    context: {
      thresholdConfiguration,
      overallThreshold: thresholdConfiguration.overallThreshold,
      criticalThreshold: thresholdConfiguration.criticalThreshold,
      perFileThresholds: thresholdConfiguration.perFileThresholds
    }
  });

  // ============================================================================
  // PHASE 8: CI/CD INTEGRATION (OPTIONAL)
  // ============================================================================

  let cicdIntegration = null;
  if (integrateCICD) {
    ctx.log('info', 'Phase 8: Integrating mutation testing into CI/CD pipeline');
    cicdIntegration = await ctx.task(cicdIntegrationTask, {
      projectPath,
      mutationTool,
      thresholdConfiguration,
      scopeAnalysis,
      outputDir
    });

    results.artifacts.push(...cicdIntegration.artifacts);

    await ctx.checkpoint({
      title: 'Phase 8: CI/CD Integration Complete',
      message: `Mutation testing integrated into ${cicdIntegration.cicdPlatform}. Quality gate configured.`,
      context: {
        cicdIntegration,
        cicdPlatform: cicdIntegration.cicdPlatform,
        qualityGateEnabled: cicdIntegration.qualityGateEnabled,
        triggerStrategy: cicdIntegration.triggerStrategy
      }
    });
  } else {
    ctx.log('info', 'Phase 8: CI/CD Integration skipped (integrateCICD=false)');
  }

  // ============================================================================
  // PHASE 9: MUTATION SCORE DASHBOARD CREATION (OPTIONAL)
  // ============================================================================

  let dashboard = null;
  if (generateDashboard) {
    ctx.log('info', 'Phase 9: Creating mutation score dashboard');
    dashboard = await ctx.task(dashboardCreationTask, {
      projectPath,
      baselineExecution,
      mutationAnalysis,
      testImprovements,
      thresholdConfiguration,
      iterationResults,
      outputDir
    });

    results.dashboardUrl = dashboard.dashboardUrl;
    results.artifacts.push(...dashboard.artifacts);

    await ctx.checkpoint({
      title: 'Phase 9: Mutation Score Dashboard Created',
      message: `Dashboard available at: ${dashboard.dashboardUrl}`,
      context: {
        dashboard,
        dashboardUrl: dashboard.dashboardUrl,
        metricsTracked: dashboard.metricsTracked
      }
    });
  } else {
    ctx.log('info', 'Phase 9: Dashboard creation skipped (generateDashboard=false)');
  }

  // ============================================================================
  // PHASE 10: FINAL VALIDATION AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Validating implementation and generating documentation');
  const finalValidation = await ctx.task(finalValidationTask, {
    projectPath,
    baselineExecution,
    improvedMutationScore,
    mutationAnalysis,
    testImprovements,
    thresholdConfiguration,
    cicdIntegration,
    dashboard,
    qualityThresholds,
    iterationResults,
    outputDir
  });

  results.success = finalValidation.success;
  results.artifacts.push(...finalValidation.artifacts);

  await ctx.checkpoint({
    title: 'Phase 10: Mutation Testing Integration Complete',
    message: `Success: ${finalValidation.success}. Final mutation score: ${improvedMutationScore}%. ${finalValidation.meetsThreshold ? 'Meets quality threshold!' : 'Below quality threshold.'}`,
    context: {
      finalValidation,
      success: finalValidation.success,
      finalMutationScore: improvedMutationScore,
      meetsThreshold: finalValidation.meetsThreshold,
      artifacts: results.artifacts
    }
  });

  return {
    ...results,
    processId: 'qa-testing-automation/mutation-testing',
    baselineMutationScore: baselineExecution.mutationScore,
    finalMutationScore: improvedMutationScore,
    improvement: improvedMutationScore - baselineExecution.mutationScore,
    totalMutants: baselineExecution.totalMutants,
    killedMutants: baselineExecution.killedMutants,
    survivedMutantsCount: baselineExecution.survivedMutants.length,
    equivalentMutants: mutationAnalysis.equivalentMutants.length,
    actionableMutants: mutationAnalysis.actionableMutants.length,
    testImprovementsCount: testImprovements.recommendations.length,
    cicdIntegrated: integrateCICD && cicdIntegration !== null,
    dashboardCreated: generateDashboard && dashboard !== null,
    meetsThreshold: finalValidation.meetsThreshold,
    metadata: {
      processId: 'qa-testing-automation/mutation-testing',
      timestamp: ctx.now(),
      projectPath,
      mutationTool,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Mutation Testing Tool Setup
export const mutationToolSetupTask = defineTask('mutation-tool-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up mutation testing tool',
  agent: {
    name: 'mutation-testing-engineer',
    prompt: {
      role: 'Senior Test Automation Engineer specializing in mutation testing',
      task: 'Install and configure mutation testing tool with optimal settings for the project',
      context: args,
      instructions: [
        'Identify project tech stack (JavaScript/TypeScript, Java, Python, etc.)',
        `Install mutation testing tool: ${args.mutationTool} (Stryker, PIT, mutmut, Infection)`,
        'Create mutation testing configuration file',
        'Configure mutators: arithmetic, conditional, logical, assignment, method call',
        'Configure test runner integration',
        'Set up file patterns for code to mutate and tests to run',
        'Configure reporting formats (HTML, JSON, console)',
        'Configure performance settings (concurrency, timeout)',
        'Exclude third-party libraries and generated code',
        'Verify tool installation and configuration',
        'Document tool setup and usage instructions'
      ],
      outputFormat: 'JSON with tool (string), version (string), configFile (string), mutators (array), testRunner (string), reportFormats (array), performanceSettings (object), filesConfigured (number), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['tool', 'version', 'configFile', 'mutators', 'testRunner', 'artifacts'],
      properties: {
        tool: { type: 'string' },
        version: { type: 'string' },
        configFile: { type: 'string' },
        mutators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              enabled: { type: 'boolean' }
            }
          }
        },
        testRunner: { type: 'string' },
        reportFormats: { type: 'array', items: { type: 'string' } },
        performanceSettings: {
          type: 'object',
          properties: {
            concurrency: { type: 'number' },
            timeout: { type: 'number' },
            maxTestRunnerReuse: { type: 'number' }
          }
        },
        filesConfigured: { type: 'number' },
        excludePatterns: { type: 'array', items: { type: 'string' } },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              format: { type: 'string' },
              label: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mutation-testing', 'tool-setup']
}));

// Task 2: Scope Analysis
export const scopeAnalysisTask = defineTask('scope-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze code scope for mutation testing',
  agent: {
    name: 'code-analyzer',
    prompt: {
      role: 'Senior Software Quality Analyst',
      task: 'Analyze codebase to define optimal scope for mutation testing and identify critical code paths',
      context: args,
      instructions: [
        'Analyze codebase structure and identify all source files matching scope patterns',
        'Identify critical code paths: business logic, security, data validation, algorithms',
        'Assess test coverage for identified files',
        'Identify high-complexity code areas (cyclomatic complexity > 10)',
        'Identify frequently changed files (high churn)',
        'Prioritize files for mutation testing: critical + high-complexity + high-churn',
        'Exclude trivial code: getters/setters, simple DTOs, configuration',
        'Estimate mutation testing execution time based on test count',
        'Create phased approach if scope is too large',
        'Generate scope definition report with prioritization matrix'
      ],
      outputFormat: 'JSON with filesInScope (number), totalLinesOfCode (number), criticalCodePaths (array), highComplexityFiles (array), highChurnFiles (array), prioritizedFiles (array), excludedFiles (array), estimatedExecutionTime (string), phasedApproach (object), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesInScope', 'totalLinesOfCode', 'criticalCodePaths', 'prioritizedFiles', 'artifacts'],
      properties: {
        filesInScope: { type: 'number' },
        totalLinesOfCode: { type: 'number' },
        criticalCodePaths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              category: { type: 'string' },
              reason: { type: 'string' },
              testCoverage: { type: 'number' }
            }
          }
        },
        highComplexityFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              complexity: { type: 'number' },
              functions: { type: 'number' }
            }
          }
        },
        highChurnFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              changeFrequency: { type: 'number' },
              lastChanged: { type: 'string' }
            }
          }
        },
        prioritizedFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              score: { type: 'number' },
              rationale: { type: 'string' }
            }
          }
        },
        excludedFiles: { type: 'array', items: { type: 'string' } },
        estimatedExecutionTime: { type: 'string' },
        phasedApproach: {
          type: 'object',
          properties: {
            required: { type: 'boolean' },
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'number' },
                  files: { type: 'array', items: { type: 'string' } },
                  priority: { type: 'string' },
                  estimatedTime: { type: 'string' }
                }
              }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mutation-testing', 'scope-analysis']
}));

// Task 3: Baseline Mutation Execution
export const baselineMutationExecutionTask = defineTask('baseline-mutation-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute baseline mutation testing',
  agent: {
    name: 'mutation-executor',
    prompt: {
      role: 'Test Automation Engineer',
      task: 'Run mutation testing tool and collect comprehensive results',
      context: args,
      instructions: [
        `Execute mutation testing using ${args.mutationTool}`,
        'Generate mutants for all configured mutators',
        'Run test suite against each mutant',
        'Collect mutation results: killed, survived, timeout, no-coverage',
        'Calculate mutation score: (killed / (killed + survived)) * 100',
        'Generate HTML and JSON reports',
        'Identify survived mutants with file location and mutation details',
        'Analyze timeout mutants and adjust timeout settings if needed',
        'Track execution performance metrics',
        'Save mutation testing artifacts',
        'Generate executive summary of baseline results'
      ],
      outputFormat: 'JSON with mutationScore (number), totalMutants (number), killedMutants (number), survivedMutants (array with file, location, mutator, original, mutated), timedOutMutants (number), noCoverageMutants (number), executionTime (string), performanceMetrics (object), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['mutationScore', 'totalMutants', 'killedMutants', 'survivedMutants', 'artifacts'],
      properties: {
        mutationScore: { type: 'number', minimum: 0, maximum: 100 },
        totalMutants: { type: 'number' },
        killedMutants: { type: 'number' },
        survivedMutants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              file: { type: 'string' },
              location: {
                type: 'object',
                properties: {
                  line: { type: 'number' },
                  column: { type: 'number' }
                }
              },
              mutator: { type: 'string' },
              original: { type: 'string' },
              mutated: { type: 'string' },
              status: { type: 'string' },
              killedBy: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        timedOutMutants: { type: 'number' },
        noCoverageMutants: { type: 'number' },
        executionTime: { type: 'string' },
        performanceMetrics: {
          type: 'object',
          properties: {
            averageTestTime: { type: 'number' },
            totalTestTime: { type: 'number' },
            mutantsPerMinute: { type: 'number' }
          }
        },
        reportPaths: {
          type: 'object',
          properties: {
            html: { type: 'string' },
            json: { type: 'string' },
            console: { type: 'string' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mutation-testing', 'execution']
}));

// Task 4: Mutation Analysis
export const mutationAnalysisTask = defineTask('mutation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze survived mutants',
  agent: {
    name: 'mutation-analyst',
    prompt: {
      role: 'Senior QA Analyst specializing in mutation testing',
      task: 'Analyze survived mutants to categorize them and identify root causes',
      context: args,
      instructions: [
        'Review all survived mutants from baseline execution',
        'Categorize survived mutants: equivalent mutants vs actionable mutants',
        'Equivalent mutants: mutations that do not change program behavior',
        'Actionable mutants: mutations indicating missing or weak test cases',
        'Identify root causes: missing test cases, weak assertions, untested edge cases',
        'Prioritize actionable mutants: critical > high > medium > low',
        'Critical: survived mutants in critical code paths (security, business logic)',
        'Group mutants by file and mutator type',
        'Analyze patterns in survived mutants',
        'Calculate adjusted mutation score excluding equivalent mutants',
        'Generate comprehensive mutation analysis report'
      ],
      outputFormat: 'JSON with totalSurvivedMutants (number), equivalentMutants (array), actionableMutants (array), highPriorityMutants (array), mutantsByFile (object), mutantsByMutator (object), rootCauses (array), adjustedMutationScore (number), patterns (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['totalSurvivedMutants', 'equivalentMutants', 'actionableMutants', 'highPriorityMutants', 'artifacts'],
      properties: {
        totalSurvivedMutants: { type: 'number' },
        equivalentMutants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              file: { type: 'string' },
              mutator: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        actionableMutants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              file: { type: 'string' },
              location: { type: 'object' },
              mutator: { type: 'string' },
              original: { type: 'string' },
              mutated: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              rootCause: { type: 'string' },
              suggestedFix: { type: 'string' }
            }
          }
        },
        highPriorityMutants: { type: 'array' },
        mutantsByFile: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              survived: { type: 'number' },
              actionable: { type: 'number' },
              equivalent: { type: 'number' }
            }
          }
        },
        mutantsByMutator: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        rootCauses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cause: { type: 'string' },
              count: { type: 'number' },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        adjustedMutationScore: { type: 'number' },
        patterns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mutation-testing', 'analysis']
}));

// Task 5: Test Improvement Recommendations
export const testImprovementRecommendationsTask = defineTask('test-improvement-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate test improvement recommendations',
  agent: {
    name: 'test-improvement-specialist',
    prompt: {
      role: 'Senior Test Engineer and Code Quality Expert',
      task: 'Generate specific, actionable test improvement recommendations to kill survived mutants',
      context: args,
      instructions: [
        'Review actionable survived mutants from mutation analysis',
        'For each high-priority mutant, generate specific test recommendation',
        'Identify missing test cases: boundary values, edge cases, error conditions',
        'Identify weak assertions: assertions that do not verify mutated behavior',
        'Suggest specific test scenarios to add',
        'Provide example test code snippets for recommended tests',
        'Estimate effort for each recommendation (low/medium/high)',
        'Prioritize recommendations by impact (mutation score improvement)',
        'Group recommendations by file and test suite',
        'Identify auto-fixable recommendations (can be generated automatically)',
        'Calculate estimated mutation score improvement',
        'Generate comprehensive test improvement plan'
      ],
      outputFormat: 'JSON with recommendations (array with file, testFile, priority, effort, description, suggestedTest, estimatedImprovement), highPriorityCount (number), autoFixRecommendations (array), estimatedEffort (string), estimatedScoreImprovement (number), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'highPriorityCount', 'estimatedEffort', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              file: { type: 'string' },
              testFile: { type: 'string' },
              mutantIds: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] },
              category: { type: 'string' },
              description: { type: 'string' },
              suggestedTest: { type: 'string' },
              testScenario: { type: 'string' },
              exampleCode: { type: 'string' },
              estimatedImprovement: { type: 'number' }
            }
          }
        },
        highPriorityCount: { type: 'number' },
        autoFixRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              testFile: { type: 'string' },
              testCode: { type: 'string' },
              autoGenerated: { type: 'boolean' }
            }
          }
        },
        groupedByFile: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              recommendations: { type: 'number' },
              estimatedEffort: { type: 'string' },
              estimatedImprovement: { type: 'number' }
            }
          }
        },
        estimatedEffort: { type: 'string' },
        estimatedScoreImprovement: { type: 'number' },
        quickWins: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mutation-testing', 'test-improvement']
}));

// Task 6: Test Improvement Execution
export const testImprovementExecutionTask = defineTask('test-improvement-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute test improvements iteratively',
  agent: {
    name: 'test-developer',
    prompt: {
      role: 'Test Automation Engineer',
      task: 'Implement test improvements iteratively and verify mutation score improvement',
      context: args,
      instructions: [
        'Implement auto-fix test recommendations first (quick wins)',
        'Generate missing test cases based on recommendations',
        'Enhance existing tests with stronger assertions',
        'Add edge case and boundary value tests',
        'Run unit tests to verify new tests pass',
        'Run mutation testing to verify mutants are killed',
        'Calculate new mutation score after improvements',
        'Iterate: identify remaining survived mutants and improve tests',
        'Maximum 3 iterations or until mutation score threshold met',
        'Track mutation score improvement per iteration',
        'Document all test improvements made',
        'Generate iteration summary report'
      ],
      outputFormat: 'JSON with newMutationScore (number), iterations (array with iteration, testsAdded, testsEnhanced, mutantsKilled, mutationScore), totalTestsAdded (number), totalTestsEnhanced (number), totalMutantsKilled (number), improvement (number), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['newMutationScore', 'iterations', 'totalTestsAdded', 'improvement', 'artifacts'],
      properties: {
        newMutationScore: { type: 'number', minimum: 0, maximum: 100 },
        iterations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              iteration: { type: 'number' },
              testsAdded: { type: 'number' },
              testsEnhanced: { type: 'number' },
              testFiles: { type: 'array', items: { type: 'string' } },
              mutantsKilled: { type: 'number' },
              mutationScore: { type: 'number' },
              executionTime: { type: 'string' }
            }
          }
        },
        totalTestsAdded: { type: 'number' },
        totalTestsEnhanced: { type: 'number' },
        totalMutantsKilled: { type: 'number' },
        improvement: { type: 'number' },
        remainingSurvivedMutants: { type: 'number' },
        convergenceAchieved: { type: 'boolean' },
        filesModified: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mutation-testing', 'test-development']
}));

// Task 7: Threshold Configuration
export const thresholdConfigurationTask = defineTask('threshold-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure mutation score thresholds',
  agent: {
    name: 'quality-gate-engineer',
    prompt: {
      role: 'Quality Engineering Lead',
      task: 'Configure mutation score thresholds for quality gates and enforcement',
      context: args,
      instructions: [
        'Set overall mutation score threshold based on current score and targets',
        'Set critical code path mutation score threshold (higher than overall)',
        'Configure per-file mutation score thresholds for high-priority files',
        'Define threshold enforcement: break build vs warning vs informational',
        'Configure threshold for new code: 90%+ mutation score',
        'Configure threshold for existing code: gradual improvement over time',
        'Set acceptable threshold deviation range',
        'Configure mutant survival threshold for critical files',
        'Define equivalent mutant handling policy',
        'Update mutation testing configuration with thresholds',
        'Document threshold rationale and enforcement policy'
      ],
      outputFormat: 'JSON with overallThreshold (number), criticalThreshold (number), newCodeThreshold (number), perFileThresholds (object), enforcement (string), deviationRange (number), policy (object), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['overallThreshold', 'criticalThreshold', 'newCodeThreshold', 'enforcement', 'artifacts'],
      properties: {
        overallThreshold: { type: 'number', minimum: 0, maximum: 100 },
        criticalThreshold: { type: 'number', minimum: 0, maximum: 100 },
        newCodeThreshold: { type: 'number', minimum: 0, maximum: 100 },
        perFileThresholds: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        enforcement: { type: 'string', enum: ['break-build', 'warning', 'informational'] },
        deviationRange: { type: 'number' },
        policy: {
          type: 'object',
          properties: {
            breakOnThresholdViolation: { type: 'boolean' },
            allowEquivalentMutants: { type: 'boolean' },
            requireApprovalForLowScore: { type: 'boolean' },
            incrementalImprovement: { type: 'boolean' }
          }
        },
        configurationUpdated: { type: 'boolean' },
        configFile: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mutation-testing', 'threshold-configuration']
}));

// Task 8: CI/CD Integration
export const cicdIntegrationTask = defineTask('cicd-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate mutation testing into CI/CD',
  agent: {
    name: 'devops-engineer',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Integrate mutation testing into CI/CD pipeline with quality gates',
      context: args,
      instructions: [
        'Identify CI/CD platform (GitHub Actions, GitLab CI, Jenkins, CircleCI)',
        'Create mutation testing pipeline job/step',
        'Configure trigger strategy: on-demand, nightly, weekly, or on PR',
        'Optimize for performance: incremental mutation testing for PRs',
        'Full mutation testing on main branch nightly',
        'Configure quality gate: fail build if mutation score below threshold',
        'Set up artifact publishing: HTML reports, JSON results',
        'Configure notifications: Slack, email on failures',
        'Add mutation score badge to README',
        'Configure caching to speed up mutation testing',
        'Test pipeline integration and verify quality gate',
        'Document CI/CD integration and usage'
      ],
      outputFormat: 'JSON with cicdPlatform (string), pipelineFile (string), triggerStrategy (string), qualityGateEnabled (boolean), incrementalMutationEnabled (boolean), artifactPublishing (object), notifications (array), badgeUrl (string), cachingEnabled (boolean), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['cicdPlatform', 'pipelineFile', 'triggerStrategy', 'qualityGateEnabled', 'artifacts'],
      properties: {
        cicdPlatform: { type: 'string' },
        pipelineFile: { type: 'string' },
        triggerStrategy: { type: 'string' },
        qualityGateEnabled: { type: 'boolean' },
        incrementalMutationEnabled: { type: 'boolean' },
        fullMutationSchedule: { type: 'string' },
        artifactPublishing: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            reportFormats: { type: 'array', items: { type: 'string' } },
            retentionDays: { type: 'number' }
          }
        },
        notifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              events: { type: 'array', items: { type: 'string' } },
              configured: { type: 'boolean' }
            }
          }
        },
        badgeUrl: { type: 'string' },
        cachingEnabled: { type: 'boolean' },
        estimatedExecutionTime: { type: 'string' },
        pipelineTested: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mutation-testing', 'cicd-integration']
}));

// Task 9: Dashboard Creation
export const dashboardCreationTask = defineTask('dashboard-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create mutation score dashboard',
  agent: {
    name: 'dashboard-developer',
    prompt: {
      role: 'Data Visualization Engineer',
      task: 'Create comprehensive mutation score tracking dashboard',
      context: args,
      instructions: [
        'Design dashboard layout: overview, trends, drill-down',
        'Overview section: current mutation score, trend, threshold status',
        'Display key metrics: mutation score, killed/survived/timeout mutants',
        'Show mutation score by file with heatmap visualization',
        'Show mutation score by mutator type (bar chart)',
        'Show mutation score trend over time (line chart)',
        'Show survived mutants breakdown by category',
        'Show test improvement impact visualization',
        'Add filtering: by file, by mutator, by date range',
        'Add drill-down: click file to see survived mutants',
        'Choose dashboard technology: HTML/JS, Grafana, or custom',
        'Generate static HTML dashboard or configure Grafana',
        'Integrate with CI/CD to auto-update dashboard',
        'Deploy dashboard and provide access URL'
      ],
      outputFormat: 'JSON with dashboardUrl (string), dashboardType (string), metricsTracked (array), visualizations (array), interactivity (object), autoUpdate (boolean), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboardUrl', 'dashboardType', 'metricsTracked', 'visualizations', 'artifacts'],
      properties: {
        dashboardUrl: { type: 'string' },
        dashboardType: { type: 'string' },
        metricsTracked: { type: 'array', items: { type: 'string' } },
        visualizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        interactivity: {
          type: 'object',
          properties: {
            filtering: { type: 'boolean' },
            drillDown: { type: 'boolean' },
            dateRange: { type: 'boolean' }
          }
        },
        autoUpdate: { type: 'boolean' },
        updateFrequency: { type: 'string' },
        accessControl: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mutation-testing', 'dashboard']
}));

// Task 10: Final Validation
export const finalValidationTask = defineTask('final-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate mutation testing implementation',
  agent: {
    name: 'qa-validator',
    prompt: {
      role: 'Principal QA Engineer',
      task: 'Validate mutation testing implementation success and generate comprehensive documentation',
      context: args,
      instructions: [
        'Validate mutation testing tool is properly configured',
        'Verify baseline mutation testing executed successfully',
        'Check mutation score meets or approaches quality threshold',
        'Validate survived mutants have been analyzed and categorized',
        'Verify test improvement recommendations are actionable',
        'Check iterative test improvements have been applied (if applicable)',
        'Validate mutation score thresholds are configured',
        'Verify CI/CD integration is functional (if enabled)',
        'Check dashboard is accessible and updating (if enabled)',
        'Calculate overall success criteria: mutation score, coverage, integration',
        'Generate executive summary of implementation',
        'Document lessons learned and best practices',
        'Create mutation testing usage guide for team',
        'Provide recommendations for ongoing monitoring'
      ],
      outputFormat: 'JSON with success (boolean), meetsThreshold (boolean), validationChecks (object), overallScore (number 0-100), executiveSummary (string), lessonsLearned (array), usageGuide (string), ongoingRecommendations (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'meetsThreshold', 'validationChecks', 'overallScore', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        meetsThreshold: { type: 'boolean' },
        validationChecks: {
          type: 'object',
          properties: {
            toolConfigured: { type: 'boolean' },
            baselineExecuted: { type: 'boolean' },
            mutantsAnalyzed: { type: 'boolean' },
            recommendationsGenerated: { type: 'boolean' },
            thresholdsConfigured: { type: 'boolean' },
            cicdIntegrated: { type: 'boolean' },
            dashboardCreated: { type: 'boolean' }
          }
        },
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        executiveSummary: { type: 'string' },
        keyAchievements: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        lessonsLearned: { type: 'array', items: { type: 'string' } },
        usageGuide: { type: 'string' },
        ongoingRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              frequency: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        nextSteps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mutation-testing', 'validation']
}));

// Quality gates for the overall process
export const qualityGates = {
  mutationScoreThreshold: {
    description: 'Mutation score meets or exceeds target threshold',
    threshold: 80,
    metric: 'mutationScore'
  },
  criticalCodeMutationScore: {
    description: 'Critical code paths have high mutation score',
    threshold: 90,
    metric: 'criticalCodeMutationScore'
  },
  survivedMutantsAnalyzed: {
    description: 'All survived mutants have been analyzed and categorized',
    threshold: 100,
    metric: 'analysisCompleteness'
  },
  testImprovementsActionable: {
    description: 'Test improvement recommendations are specific and actionable',
    threshold: 100,
    metric: 'recommendationQuality'
  },
  cicdIntegrated: {
    description: 'Mutation testing integrated into CI/CD pipeline',
    threshold: 100,
    metric: 'cicdIntegrationStatus'
  }
};

// Estimated duration
export const estimatedDuration = {
  setup: '2-3 days',
  execution: '1-2 days',
  improvement: '1-3 days',
  total: '5-7 days'
};
