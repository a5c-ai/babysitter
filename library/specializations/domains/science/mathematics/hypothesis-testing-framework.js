/**
 * @process specializations/domains/science/mathematics/hypothesis-testing-framework
 * @description Conduct rigorous hypothesis testing with proper multiple comparison corrections,
 * effect size estimation, and confidence interval construction.
 * @inputs { hypotheses: array, data?: object, alpha?: number, testType?: string, multipleComparisons?: boolean }
 * @outputs { success: boolean, testResults: array, effectSizes: object, confidenceIntervals: object, overallConclusion: string }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mathematics/hypothesis-testing-framework', {
 *   hypotheses: [
 *     { null: 'Mean difference = 0', alternative: 'Mean difference != 0', type: 'two-tailed' }
 *   ],
 *   data: { groups: ['treatment', 'control'], n: [50, 50], means: [15.2, 12.8], sds: [3.1, 2.9] },
 *   alpha: 0.05,
 *   testType: 't-test',
 *   multipleComparisons: false
 * });
 *
 * @references
 * - Lehmann & Romano, Testing Statistical Hypotheses
 * - Cohen, Statistical Power Analysis
 * - Cumming, Understanding The New Statistics
 * - Wasserstein & Lazar, ASA Statement on P-Values
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    hypotheses,
    data = {},
    alpha = 0.05,
    testType = 'automatic',
    multipleComparisons = false
  } = inputs;

  // Phase 1: Formalize Null and Alternative Hypotheses
  const hypothesisFormalization = await ctx.task(hypothesisFormalizationTask, {
    hypotheses,
    data
  });

  // Quality Gate: Hypotheses must be formalizable
  if (!hypothesisFormalization.formalizedHypotheses || hypothesisFormalization.formalizedHypotheses.length === 0) {
    return {
      success: false,
      error: 'Unable to formalize hypotheses',
      phase: 'formalization',
      testResults: null
    };
  }

  // Breakpoint: Review formalized hypotheses
  await ctx.breakpoint({
    question: `Review ${hypothesisFormalization.formalizedHypotheses.length} formalized hypothesis/hypotheses. Correct formulation?`,
    title: 'Hypothesis Formalization Review',
    context: {
      runId: ctx.runId,
      hypotheses: hypothesisFormalization.formalizedHypotheses,
      files: [{
        path: `artifacts/phase1-hypotheses.json`,
        format: 'json',
        content: hypothesisFormalization
      }]
    }
  });

  // Phase 2: Select Appropriate Test Statistic
  const testSelection = await ctx.task(testSelectionTask, {
    hypothesisFormalization,
    data,
    testType,
    alpha
  });

  // Phase 3: Apply Multiple Comparison Corrections
  const multipleComparisonCorrection = await ctx.task(multipleComparisonCorrectionTask, {
    hypothesisFormalization,
    testSelection,
    multipleComparisons,
    alpha
  });

  // Phase 4: Compute Effect Sizes
  const effectSizeComputation = await ctx.task(effectSizeComputationTask, {
    hypothesisFormalization,
    testSelection,
    data
  });

  // Phase 5: Report Results with Uncertainty
  const resultsReporting = await ctx.task(resultsReportingTask, {
    hypothesisFormalization,
    testSelection,
    multipleComparisonCorrection,
    effectSizeComputation,
    alpha,
    data
  });

  // Final Breakpoint: Testing Complete
  await ctx.breakpoint({
    question: `Hypothesis testing complete. ${resultsReporting.significantResults} of ${hypothesisFormalization.formalizedHypotheses.length} tests significant at alpha = ${alpha}. Review results?`,
    title: 'Hypothesis Testing Complete',
    context: {
      runId: ctx.runId,
      significantResults: resultsReporting.significantResults,
      totalTests: hypothesisFormalization.formalizedHypotheses.length,
      conclusion: resultsReporting.overallConclusion,
      files: [
        { path: `artifacts/test-results.json`, format: 'json', content: resultsReporting }
      ]
    }
  });

  return {
    success: true,
    hypotheses: hypothesisFormalization.formalizedHypotheses,
    testResults: testSelection.testResults,
    correctedResults: multipleComparisonCorrection.correctedResults,
    effectSizes: effectSizeComputation.effectSizes,
    confidenceIntervals: resultsReporting.confidenceIntervals,
    overallConclusion: resultsReporting.overallConclusion,
    reportingSummary: resultsReporting.summary,
    metadata: {
      processId: 'specializations/domains/science/mathematics/hypothesis-testing-framework',
      alpha,
      multipleComparisons,
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const hypothesisFormalizationTask = defineTask('hypothesis-formalization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Formalize Null and Alternative Hypotheses`,
  agent: {
    name: 'statistician',
    skills: ['r-statistical-computing', 'stata-statistical-analysis', 'sympy-computer-algebra'],
    prompt: {
      role: 'Statistical Hypothesis Testing Expert',
      task: 'Formalize null and alternative hypotheses for statistical testing',
      context: {
        hypotheses: args.hypotheses,
        data: args.data
      },
      instructions: [
        '1. Parse each hypothesis statement',
        '2. Formulate precise null hypothesis (H0)',
        '3. Formulate precise alternative hypothesis (H1/Ha)',
        '4. Determine if one-tailed or two-tailed',
        '5. Identify the parameter of interest',
        '6. Specify the null value',
        '7. Ensure hypotheses are mutually exclusive and exhaustive',
        '8. Check that hypotheses are testable with available data',
        '9. Document any assumptions required',
        '10. Assign hypothesis identifiers'
      ],
      outputFormat: 'JSON object with formalized hypotheses'
    },
    outputSchema: {
      type: 'object',
      required: ['formalizedHypotheses'],
      properties: {
        formalizedHypotheses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              nullHypothesis: { type: 'string' },
              alternativeHypothesis: { type: 'string' },
              parameter: { type: 'string' },
              nullValue: { type: 'number' },
              testDirection: { type: 'string', enum: ['two-tailed', 'left-tailed', 'right-tailed'] },
              testable: { type: 'boolean' },
              assumptions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        primaryHypothesis: { type: 'string' },
        secondaryHypotheses: { type: 'array', items: { type: 'string' } },
        hypothesisFamily: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'hypothesis-testing', 'formalization']
}));

export const testSelectionTask = defineTask('test-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Select Appropriate Test Statistic`,
  agent: {
    name: 'statistician',
    skills: ['r-statistical-computing', 'stata-statistical-analysis', 'monte-carlo-simulation'],
    prompt: {
      role: 'Statistical Test Selection Expert',
      task: 'Select and compute appropriate test statistics',
      context: {
        hypothesisFormalization: args.hypothesisFormalization,
        data: args.data,
        testType: args.testType,
        alpha: args.alpha
      },
      instructions: [
        '1. Assess data characteristics (normality, variance homogeneity)',
        '2. Select appropriate test statistic for each hypothesis',
        '3. Verify test assumptions are met',
        '4. Compute test statistic value',
        '5. Determine degrees of freedom',
        '6. Calculate p-value',
        '7. Compare to critical value',
        '8. Make initial reject/fail-to-reject decision',
        '9. Consider non-parametric alternatives if needed',
        '10. Document test selection rationale'
      ],
      outputFormat: 'JSON object with test selection and results'
    },
    outputSchema: {
      type: 'object',
      required: ['testResults', 'testSelection'],
      properties: {
        testSelection: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesisId: { type: 'string' },
              selectedTest: { type: 'string' },
              rationale: { type: 'string' },
              assumptions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    assumption: { type: 'string' },
                    met: { type: 'boolean' },
                    evidence: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        testResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesisId: { type: 'string' },
              testStatistic: { type: 'number' },
              degreesOfFreedom: { type: 'number' },
              pValue: { type: 'number' },
              criticalValue: { type: 'number' },
              decision: { type: 'string', enum: ['reject', 'fail-to-reject'] }
            }
          }
        },
        alternativeTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesisId: { type: 'string' },
              alternativeTest: { type: 'string' },
              reason: { type: 'string' }
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
  labels: ['mathematics', 'hypothesis-testing', 'test-selection']
}));

export const multipleComparisonCorrectionTask = defineTask('multiple-comparison-correction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Apply Multiple Comparison Corrections`,
  agent: {
    name: 'statistician',
    skills: ['r-statistical-computing', 'stata-statistical-analysis', 'monte-carlo-simulation'],
    prompt: {
      role: 'Multiple Testing Correction Specialist',
      task: 'Apply appropriate corrections for multiple comparisons',
      context: {
        hypothesisFormalization: args.hypothesisFormalization,
        testSelection: args.testSelection,
        multipleComparisons: args.multipleComparisons,
        alpha: args.alpha
      },
      instructions: [
        '1. Determine if multiple comparison correction is needed',
        '2. Calculate family-wise error rate (FWER)',
        '3. Calculate false discovery rate (FDR)',
        '4. Apply Bonferroni correction if appropriate',
        '5. Apply Holm-Bonferroni step-down procedure',
        '6. Apply Benjamini-Hochberg FDR control',
        '7. Consider Tukey HSD for pairwise comparisons',
        '8. Compute adjusted p-values',
        '9. Update decisions based on corrected alpha',
        '10. Document correction method and rationale'
      ],
      outputFormat: 'JSON object with corrected results'
    },
    outputSchema: {
      type: 'object',
      required: ['correctionApplied', 'correctedResults'],
      properties: {
        correctionApplied: { type: 'boolean' },
        correctionMethod: { type: 'string' },
        correctionRationale: { type: 'string' },
        familyWiseAlpha: { type: 'number' },
        correctedResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesisId: { type: 'string' },
              originalPValue: { type: 'number' },
              adjustedPValue: { type: 'number' },
              originalDecision: { type: 'string' },
              correctedDecision: { type: 'string' }
            }
          }
        },
        fwerControl: { type: 'number' },
        fdrControl: { type: 'number' },
        alternativeMethods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              adjustedAlpha: { type: 'number' },
              changesDecisions: { type: 'boolean' }
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
  labels: ['mathematics', 'hypothesis-testing', 'multiple-comparisons']
}));

export const effectSizeComputationTask = defineTask('effect-size-computation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Compute Effect Sizes`,
  agent: {
    name: 'statistician',
    skills: ['r-statistical-computing', 'stata-statistical-analysis', 'monte-carlo-simulation'],
    prompt: {
      role: 'Effect Size Computation Expert',
      task: 'Compute effect sizes for all hypothesis tests',
      context: {
        hypothesisFormalization: args.hypothesisFormalization,
        testSelection: args.testSelection,
        data: args.data
      },
      instructions: [
        '1. Select appropriate effect size measure for each test',
        '2. Compute Cohens d for mean differences',
        '3. Compute correlation coefficient r where applicable',
        '4. Compute odds ratio for categorical outcomes',
        '5. Compute eta-squared or partial eta-squared for ANOVA',
        '6. Compute confidence intervals for effect sizes',
        '7. Interpret effect size magnitude (small/medium/large)',
        '8. Compare to established benchmarks',
        '9. Calculate standardized vs unstandardized effects',
        '10. Document effect size interpretation'
      ],
      outputFormat: 'JSON object with effect sizes'
    },
    outputSchema: {
      type: 'object',
      required: ['effectSizes'],
      properties: {
        effectSizes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesisId: { type: 'string' },
              effectSizeMeasure: { type: 'string' },
              value: { type: 'number' },
              confidenceInterval: {
                type: 'object',
                properties: {
                  lower: { type: 'number' },
                  upper: { type: 'number' },
                  level: { type: 'number' }
                }
              },
              magnitude: { type: 'string', enum: ['negligible', 'small', 'medium', 'large', 'very-large'] },
              interpretation: { type: 'string' }
            }
          }
        },
        benchmarks: {
          type: 'object',
          properties: {
            small: { type: 'number' },
            medium: { type: 'number' },
            large: { type: 'number' }
          }
        },
        practicalSignificance: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'hypothesis-testing', 'effect-size']
}));

export const resultsReportingTask = defineTask('results-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Report Results with Uncertainty`,
  agent: {
    name: 'statistician',
    skills: ['r-statistical-computing', 'latex-math-formatter', 'stata-statistical-analysis'],
    prompt: {
      role: 'Statistical Results Reporting Specialist',
      task: 'Generate comprehensive results report with uncertainty quantification',
      context: {
        hypothesisFormalization: args.hypothesisFormalization,
        testSelection: args.testSelection,
        multipleComparisonCorrection: args.multipleComparisonCorrection,
        effectSizeComputation: args.effectSizeComputation,
        alpha: args.alpha,
        data: args.data
      },
      instructions: [
        '1. Construct confidence intervals for all parameters',
        '2. Report test statistics, df, and p-values',
        '3. Report effect sizes with confidence intervals',
        '4. Summarize decisions for each hypothesis',
        '5. Provide overall conclusion',
        '6. Discuss statistical vs practical significance',
        '7. Note any limitations or caveats',
        '8. Follow APA or discipline-specific reporting guidelines',
        '9. Generate summary table',
        '10. Provide plain-language interpretation'
      ],
      outputFormat: 'JSON object with comprehensive results report'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'confidenceIntervals', 'overallConclusion', 'significantResults'],
      properties: {
        significantResults: { type: 'number' },
        summary: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesisId: { type: 'string' },
              test: { type: 'string' },
              statistic: { type: 'string' },
              pValue: { type: 'string' },
              effectSize: { type: 'string' },
              decision: { type: 'string' },
              interpretation: { type: 'string' }
            }
          }
        },
        confidenceIntervals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              estimate: { type: 'number' },
              lower: { type: 'number' },
              upper: { type: 'number' },
              level: { type: 'number' }
            }
          }
        },
        overallConclusion: { type: 'string' },
        statisticalVsPractical: { type: 'string' },
        limitations: { type: 'array', items: { type: 'string' } },
        apaReporting: { type: 'string' },
        plainLanguageInterpretation: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'hypothesis-testing', 'reporting']
}));
