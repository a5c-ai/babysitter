/**
 * @process methodologies/hypothesis-driven-development
 * @description Hypothesis-Driven Development - Treat every feature as an experiment with measurable outcomes
 * @inputs { projectName: string, featureIdea?: string, targetAudience?: string, experimentDuration?: number }
 * @outputs { success: boolean, hypothesis: object, experiment: object, measurement: object, analysis: object, decision: string, learnings: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Hypothesis-Driven Development Process
 *
 * Methodology: Lean Startup / Microsoft Experimentation Platform approach
 * Treats every feature as an experiment to validate assumptions through measurement.
 *
 * Process Flow:
 * 1. Hypothesis Formulation - Define testable hypothesis with success criteria
 * 2. Experiment Design - Design A/B test with control and treatment groups
 * 3. MVP Specification - Specify minimum testable version
 * 4. Measurement Plan - Define metrics and instrumentation
 * 5. Build & Deploy - Implement MVP with instrumentation
 * 6. Run Experiment - Collect data over experiment duration
 * 7. Analysis - Statistical analysis and qualitative feedback
 * 8. Decision - Persevere, Pivot, or Stop
 * 9. Learning Capture - Document learnings and next hypothesis
 *
 * Format: "We believe [building this feature] for [these people] will achieve
 * [this outcome]. We'll know we're right when [measurable signal]."
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project/feature experiment
 * @param {string} inputs.featureIdea - High-level feature or change idea
 * @param {string} inputs.targetAudience - Target user segment
 * @param {number} inputs.experimentDuration - Duration in days (default: 14)
 * @param {number} inputs.significanceLevel - Statistical significance threshold (default: 0.05)
 * @param {boolean} inputs.skipImplementation - Skip build phase (default: false)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with hypothesis, experiment, and learnings
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    featureIdea = '',
    targetAudience = 'all users',
    experimentDuration = 14,
    significanceLevel = 0.05,
    skipImplementation = false
  } = inputs;

  // ============================================================================
  // STEP 1: HYPOTHESIS FORMULATION
  // ============================================================================

  const hypothesisResult = await ctx.task(formulateHypothesisTask, {
    projectName,
    featureIdea,
    targetAudience,
    context: inputs.context || null
  });

  // Breakpoint: Review hypothesis
  await ctx.breakpoint({
    question: `Review the hypothesis for "${projectName}". Is the hypothesis testable with clear success metrics? Approve to proceed with experiment design?`,
    title: 'Hypothesis Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/hypothesis/HYPOTHESIS.md', format: 'markdown', label: 'Hypothesis Statement' }
      ]
    }
  });

  // ============================================================================
  // STEP 2: EXPERIMENT DESIGN
  // ============================================================================

  const experimentDesignResult = await ctx.task(designExperimentTask, {
    projectName,
    hypothesis: hypothesisResult,
    experimentDuration,
    significanceLevel,
    targetAudience
  });

  // Breakpoint: Review experiment design
  await ctx.breakpoint({
    question: `Review the A/B test design for "${projectName}". Control and treatment groups defined, sample size calculated. Approve to proceed with MVP specification?`,
    title: 'Experiment Design Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/hypothesis/EXPERIMENT_DESIGN.md', format: 'markdown', label: 'Experiment Design' }
      ]
    }
  });

  // ============================================================================
  // STEP 3: MVP SPECIFICATION
  // ============================================================================

  const mvpResult = await ctx.task(specifyMVPTask, {
    projectName,
    hypothesis: hypothesisResult,
    experimentDesign: experimentDesignResult
  });

  // Breakpoint: Review MVP spec
  await ctx.breakpoint({
    question: `Review the minimum viable product specification for "${projectName}". Scope is minimal but sufficient to test the hypothesis. Approve to proceed with measurement planning?`,
    title: 'MVP Specification Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/hypothesis/MVP_SPEC.md', format: 'markdown', label: 'MVP Specification' }
      ]
    }
  });

  // ============================================================================
  // STEP 4: MEASUREMENT PLAN
  // ============================================================================

  const measurementPlanResult = await ctx.task(createMeasurementPlanTask, {
    projectName,
    hypothesis: hypothesisResult,
    experimentDesign: experimentDesignResult,
    mvp: mvpResult,
    significanceLevel
  });

  // Breakpoint: Review measurement plan
  await ctx.breakpoint({
    question: `Review the measurement and instrumentation plan for "${projectName}". Primary, secondary, and counter metrics defined. Approve to proceed with implementation?`,
    title: 'Measurement Plan Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/hypothesis/MEASUREMENT_PLAN.md', format: 'markdown', label: 'Measurement Plan' },
        { path: 'artifacts/hypothesis/instrumentation.json', format: 'code', language: 'json', label: 'Instrumentation Spec' }
      ]
    }
  });

  let implementationResult = null;
  let experimentExecutionResult = null;

  if (!skipImplementation) {
    // ==========================================================================
    // STEP 5: BUILD & DEPLOY MVP
    // ==========================================================================

    implementationResult = await ctx.task(implementMVPTask, {
      projectName,
      mvp: mvpResult,
      measurementPlan: measurementPlanResult,
      experimentDesign: experimentDesignResult
    });

    // Validate instrumentation
    const instrumentationValidation = await ctx.task(validateInstrumentationTask, {
      projectName,
      implementation: implementationResult,
      measurementPlan: measurementPlanResult
    });

    if (!instrumentationValidation.allEventsTracked) {
      await ctx.breakpoint({
        question: `Instrumentation validation found missing events. Review and fix before deploying experiment?`,
        title: 'Instrumentation Validation Failed',
        context: {
          runId: ctx.runId,
          files: [
            { path: 'artifacts/hypothesis/instrumentation-validation.md', format: 'markdown', label: 'Validation Report' }
          ]
        }
      });
    }

    // Breakpoint: Review implementation
    await ctx.breakpoint({
      question: `Review the MVP implementation for "${projectName}". Instrumentation validated. Ready to deploy and start experiment?`,
      title: 'Implementation Review',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/hypothesis/IMPLEMENTATION.md', format: 'markdown', label: 'Implementation Summary' }
        ]
      }
    });

    // ==========================================================================
    // STEP 6: RUN EXPERIMENT
    // ==========================================================================

    experimentExecutionResult = await ctx.task(runExperimentTask, {
      projectName,
      experimentDesign: experimentDesignResult,
      measurementPlan: measurementPlanResult,
      implementation: implementationResult,
      duration: experimentDuration
    });

    // Breakpoint: Experiment running
    await ctx.breakpoint({
      question: `Experiment "${projectName}" is collecting data. Duration: ${experimentDuration} days. Monitor metrics and approve when ready to analyze results?`,
      title: 'Experiment Running',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/hypothesis/EXPERIMENT_STATUS.md', format: 'markdown', label: 'Experiment Status' }
        ]
      }
    });
  }

  // ============================================================================
  // STEP 7: ANALYZE RESULTS
  // ============================================================================

  const analysisResult = await ctx.task(analyzeResultsTask, {
    projectName,
    hypothesis: hypothesisResult,
    experimentDesign: experimentDesignResult,
    measurementPlan: measurementPlanResult,
    experimentExecution: experimentExecutionResult,
    significanceLevel,
    skipImplementation
  });

  // Breakpoint: Review analysis
  await ctx.breakpoint({
    question: `Review statistical analysis for "${projectName}". Hypothesis ${analysisResult.hypothesisValidated ? 'VALIDATED' : 'INVALIDATED'}. Statistical significance: ${analysisResult.statisticallySignificant}. Approve to proceed with decision?`,
    title: 'Analysis Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/hypothesis/ANALYSIS.md', format: 'markdown', label: 'Statistical Analysis' },
        { path: 'artifacts/hypothesis/metrics.json', format: 'code', language: 'json', label: 'Metrics Data' }
      ]
    }
  });

  // ============================================================================
  // STEP 8: MAKE DECISION
  // ============================================================================

  const decisionResult = await ctx.task(makeDecisionTask, {
    projectName,
    hypothesis: hypothesisResult,
    analysis: analysisResult,
    experimentDesign: experimentDesignResult
  });

  // Breakpoint: Review decision
  await ctx.breakpoint({
    question: `Review the decision for "${projectName}": ${decisionResult.decision} (${decisionResult.reasoning}). Approve to proceed with learning capture?`,
    title: 'Decision Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/hypothesis/DECISION.md', format: 'markdown', label: 'Decision Document' }
      ]
    }
  });

  // ============================================================================
  // STEP 9: CAPTURE LEARNINGS
  // ============================================================================

  const learningsResult = await ctx.task(captureLearningsTask, {
    projectName,
    hypothesis: hypothesisResult,
    analysis: analysisResult,
    decision: decisionResult,
    experimentDesign: experimentDesignResult,
    measurementPlan: measurementPlanResult
  });

  // Final breakpoint
  await ctx.breakpoint({
    question: `Hypothesis-Driven Development cycle complete for "${projectName}". Decision: ${decisionResult.decision}. Review learnings and next hypothesis?`,
    title: 'Cycle Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/hypothesis/HYPOTHESIS.md', format: 'markdown', label: 'Original Hypothesis' },
        { path: 'artifacts/hypothesis/ANALYSIS.md', format: 'markdown', label: 'Analysis' },
        { path: 'artifacts/hypothesis/DECISION.md', format: 'markdown', label: 'Decision' },
        { path: 'artifacts/hypothesis/LEARNINGS.md', format: 'markdown', label: 'Learnings' },
        { path: 'artifacts/hypothesis/NEXT_HYPOTHESIS.md', format: 'markdown', label: 'Next Hypothesis' }
      ]
    }
  });

  return {
    success: true,
    projectName,
    hypothesis: hypothesisResult,
    experimentDesign: experimentDesignResult,
    mvp: mvpResult,
    measurementPlan: measurementPlanResult,
    implementation: implementationResult,
    experimentExecution: experimentExecutionResult,
    analysis: analysisResult,
    decision: decisionResult.decision,
    decisionReasoning: decisionResult.reasoning,
    learnings: learningsResult,
    nextHypothesis: learningsResult.nextHypothesis,
    artifacts: {
      hypothesis: 'artifacts/hypothesis/HYPOTHESIS.md',
      experimentDesign: 'artifacts/hypothesis/EXPERIMENT_DESIGN.md',
      mvpSpec: 'artifacts/hypothesis/MVP_SPEC.md',
      measurementPlan: 'artifacts/hypothesis/MEASUREMENT_PLAN.md',
      implementation: implementationResult ? 'artifacts/hypothesis/IMPLEMENTATION.md' : null,
      analysis: 'artifacts/hypothesis/ANALYSIS.md',
      decision: 'artifacts/hypothesis/DECISION.md',
      learnings: 'artifacts/hypothesis/LEARNINGS.md',
      nextHypothesis: 'artifacts/hypothesis/NEXT_HYPOTHESIS.md'
    },
    metadata: {
      processId: 'methodologies/hypothesis-driven-development',
      experimentDuration,
      significanceLevel,
      hypothesisValidated: analysisResult.hypothesisValidated,
      statisticallySignificant: analysisResult.statisticallySignificant,
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Task: Formulate Hypothesis
 * Formulate a testable hypothesis using the standard format:
 * "We believe [building this feature] for [these people] will achieve
 * [this outcome]. We'll know we're right when [measurable signal]."
 */
export const formulateHypothesisTask = defineTask('formulate-hypothesis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Formulate hypothesis: ${args.projectName}`,
  agent: {
    name: 'hypothesis-formulator',
    prompt: {
      system: `You are a hypothesis formulation expert following the Lean Startup methodology.

Your task is to formulate a testable hypothesis for a feature or change using this format:
"We believe [building this feature] for [these people] will achieve [this outcome]. We'll know we're right when [measurable signal]."

Key requirements:
1. Feature description must be specific and concrete
2. Target audience must be clearly defined
3. Outcome must be a business or user value metric
4. Success metric must be measurable and quantifiable
5. Hypothesis must be falsifiable

Generate:
- Hypothesis statement
- Assumptions being tested
- Risks if hypothesis is wrong
- Expected outcome range (optimistic/realistic/pessimistic)

Output as JSON matching the schema.`,
      messages: [
        {
          role: 'user',
          content: `Formulate a hypothesis for:

Project: ${args.projectName}
Feature Idea: ${args.featureIdea || 'Not specified - please derive from project name'}
Target Audience: ${args.targetAudience}
${args.context ? `Additional Context: ${JSON.stringify(args.context, null, 2)}` : ''}

Return a complete hypothesis with all required fields.`
        }
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        hypothesisStatement: { type: 'string', description: 'Complete hypothesis statement' },
        feature: { type: 'string', description: 'What we are building' },
        targetAudience: { type: 'string', description: 'Who we are building for' },
        expectedOutcome: { type: 'string', description: 'What outcome we expect' },
        successMetric: { type: 'string', description: 'How we will measure success' },
        assumptions: { type: 'array', items: { type: 'string' }, description: 'Key assumptions being tested' },
        risks: { type: 'array', items: { type: 'string' }, description: 'Risks if hypothesis is wrong' },
        outcomeRange: {
          type: 'object',
          properties: {
            optimistic: { type: 'string' },
            realistic: { type: 'string' },
            pessimistic: { type: 'string' }
          }
        }
      },
      required: ['hypothesisStatement', 'feature', 'targetAudience', 'expectedOutcome', 'successMetric', 'assumptions', 'risks']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hypothesis-driven', 'formulation']
}));

/**
 * Task: Design Experiment
 * Design an A/B test with control and treatment groups, sample size, duration
 */
export const designExperimentTask = defineTask('design-experiment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design experiment: ${args.projectName}`,
  agent: {
    name: 'experiment-designer',
    prompt: {
      system: `You are an experimentation platform expert specializing in A/B test design.

Design a rigorous experiment to test the hypothesis with:
1. Control group definition (baseline/existing experience)
2. Treatment group definition (new feature/change)
3. Sample size calculation (statistical power analysis)
4. Duration estimate (time to reach significance)
5. Randomization strategy (how to assign users)
6. Guardrail metrics (what to monitor for negative effects)

Use industry standards:
- 80% statistical power
- 95% confidence level (p < 0.05)
- Minimum detectable effect (MDE) based on hypothesis
- Account for novelty effects and learning curves

Output as JSON matching the schema.`,
      messages: [
        {
          role: 'user',
          content: `Design an experiment for:

Project: ${args.projectName}
Hypothesis: ${JSON.stringify(args.hypothesis, null, 2)}
Duration: ${args.experimentDuration} days
Significance Level: ${args.significanceLevel}
Target Audience: ${args.targetAudience}

Provide complete experimental design with sample sizes and power analysis.`
        }
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        controlGroup: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            experience: { type: 'string' },
            percentage: { type: 'number' }
          }
        },
        treatmentGroup: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            experience: { type: 'string' },
            percentage: { type: 'number' }
          }
        },
        sampleSize: {
          type: 'object',
          properties: {
            perGroup: { type: 'number' },
            total: { type: 'number' },
            calculationMethod: { type: 'string' }
          }
        },
        duration: { type: 'number', description: 'Days to run experiment' },
        randomizationStrategy: { type: 'string' },
        minimumDetectableEffect: { type: 'string' },
        guardrailMetrics: { type: 'array', items: { type: 'string' } },
        powerAnalysis: {
          type: 'object',
          properties: {
            statisticalPower: { type: 'number' },
            confidenceLevel: { type: 'number' },
            effectSize: { type: 'string' }
          }
        }
      },
      required: ['controlGroup', 'treatmentGroup', 'sampleSize', 'duration', 'randomizationStrategy']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hypothesis-driven', 'experiment-design']
}));

/**
 * Task: Specify MVP
 * Specify minimum viable product that tests the hypothesis
 */
export const specifyMVPTask = defineTask('specify-mvp', (args, taskCtx) => ({
  kind: 'agent',
  title: `Specify MVP: ${args.projectName}`,
  agent: {
    name: 'mvp-specifier',
    prompt: {
      system: `You are an MVP specification expert following Lean Startup principles.

Define the absolute minimum implementation needed to test the hypothesis:
1. Core functionality (what's essential to test the hypothesis)
2. Cut scope (what can be removed/simplified)
3. Instrumentation requirements (what must be tracked)
4. Quality bar (minimum acceptable quality)
5. Success criteria (hypothesis test)

Philosophy: Build the minimum to learn, not to launch.
Cut everything that doesn't directly test the hypothesis.

Output as JSON matching the schema.`,
      messages: [
        {
          role: 'user',
          content: `Specify minimum viable product for:

Project: ${args.projectName}
Hypothesis: ${JSON.stringify(args.hypothesis, null, 2)}
Experiment Design: ${JSON.stringify(args.experimentDesign, null, 2)}

Define the smallest implementation that can test the hypothesis.`
        }
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        coreFunctionality: { type: 'array', items: { type: 'string' } },
        scopeCuts: { type: 'array', items: { type: 'string' } },
        instrumentationRequirements: { type: 'array', items: { type: 'string' } },
        qualityBar: { type: 'string' },
        successCriteria: { type: 'array', items: { type: 'string' } },
        technicalApproach: { type: 'string' },
        estimatedEffort: { type: 'string' },
        risks: { type: 'array', items: { type: 'string' } }
      },
      required: ['coreFunctionality', 'scopeCuts', 'instrumentationRequirements', 'successCriteria']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hypothesis-driven', 'mvp']
}));

/**
 * Task: Create Measurement Plan
 * Define metrics, instrumentation, and statistical analysis approach
 */
export const createMeasurementPlanTask = defineTask('create-measurement-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create measurement plan: ${args.projectName}`,
  agent: {
    name: 'measurement-planner',
    prompt: {
      system: `You are a metrics and instrumentation expert for A/B testing.

Define comprehensive measurement plan:
1. Primary metrics (success metric from hypothesis)
2. Secondary metrics (supporting indicators)
3. Counter metrics (watch for negative side effects)
4. Instrumentation events (what to track and when)
5. Statistical tests (which tests to run)
6. Significance criteria (when to declare success/failure)

Follow best practices:
- CUPED/variance reduction techniques
- Multiple testing corrections (Bonferroni)
- Sequential testing considerations
- Data quality checks

Output as JSON matching the schema.`,
      messages: [
        {
          role: 'user',
          content: `Create measurement plan for:

Project: ${args.projectName}
Hypothesis: ${JSON.stringify(args.hypothesis, null, 2)}
Experiment Design: ${JSON.stringify(args.experimentDesign, null, 2)}
MVP Spec: ${JSON.stringify(args.mvp, null, 2)}
Significance Level: ${args.significanceLevel}

Provide complete instrumentation and analysis plan.`
        }
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        primaryMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              calculation: { type: 'string' },
              targetImprovement: { type: 'string' }
            }
          }
        },
        secondaryMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              calculation: { type: 'string' }
            }
          }
        },
        counterMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              threshold: { type: 'string' }
            }
          }
        },
        instrumentationEvents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              eventName: { type: 'string' },
              trigger: { type: 'string' },
              properties: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        statisticalTests: { type: 'array', items: { type: 'string' } },
        significanceCriteria: {
          type: 'object',
          properties: {
            pValue: { type: 'number' },
            minimumEffect: { type: 'string' },
            minimumSampleSize: { type: 'number' }
          }
        }
      },
      required: ['primaryMetrics', 'secondaryMetrics', 'counterMetrics', 'instrumentationEvents', 'statisticalTests']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hypothesis-driven', 'measurement']
}));

/**
 * Task: Implement MVP
 * Build minimum viable product with instrumentation
 */
export const implementMVPTask = defineTask('implement-mvp', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement MVP: ${args.projectName}`,
  agent: {
    name: 'mvp-implementer',
    prompt: {
      system: `You are a software engineer implementing an MVP for hypothesis testing.

Implement the minimum viable product with:
1. Core functionality from MVP spec
2. Complete instrumentation per measurement plan
3. A/B test assignment logic
4. Feature flags/rollout controls
5. Error handling and monitoring

CRITICAL: Instrumentation is non-negotiable. Every event must be tracked correctly.

Output implementation plan and code structure.`,
      messages: [
        {
          role: 'user',
          content: `Implement MVP for:

Project: ${args.projectName}
MVP Spec: ${JSON.stringify(args.mvp, null, 2)}
Measurement Plan: ${JSON.stringify(args.measurementPlan, null, 2)}
Experiment Design: ${JSON.stringify(args.experimentDesign, null, 2)}

Provide implementation plan with instrumentation.`
        }
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        implementationPlan: { type: 'string' },
        codeStructure: { type: 'array', items: { type: 'string' } },
        instrumentationCode: { type: 'string' },
        testPlan: { type: 'string' },
        deploymentStrategy: { type: 'string' },
        rollbackPlan: { type: 'string' }
      },
      required: ['implementationPlan', 'instrumentationCode', 'deploymentStrategy']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hypothesis-driven', 'implementation']
}));

/**
 * Task: Validate Instrumentation
 * Verify all events are being tracked correctly
 */
export const validateInstrumentationTask = defineTask('validate-instrumentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate instrumentation: ${args.projectName}`,
  agent: {
    name: 'instrumentation-validator',
    prompt: {
      system: `You are a QA engineer validating experiment instrumentation.

Verify that:
1. All events from measurement plan are implemented
2. Event properties are correct
3. User assignment tracking works
4. Data is flowing to analytics
5. No duplicate or missing events

This is critical - bad instrumentation = invalid experiment.

Output validation results.`,
      messages: [
        {
          role: 'user',
          content: `Validate instrumentation for:

Project: ${args.projectName}
Implementation: ${JSON.stringify(args.implementation, null, 2)}
Measurement Plan: ${JSON.stringify(args.measurementPlan, null, 2)}

Check if all required events are instrumented correctly.`
        }
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        allEventsTracked: { type: 'boolean' },
        missingEvents: { type: 'array', items: { type: 'string' } },
        validationTests: { type: 'array', items: { type: 'string' } },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      },
      required: ['allEventsTracked', 'missingEvents', 'issues']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hypothesis-driven', 'validation']
}));

/**
 * Task: Run Experiment
 * Execute experiment and monitor data collection
 */
export const runExperimentTask = defineTask('run-experiment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run experiment: ${args.projectName}`,
  agent: {
    name: 'experiment-runner',
    prompt: {
      system: `You are an experiment operations specialist.

Plan experiment execution:
1. Deployment and rollout
2. Monitoring dashboards
3. Data quality checks
4. Early stopping criteria (if needed)
5. Incident response plan

Monitor for:
- Instrumentation errors
- Unexpected behavior
- Guardrail metric violations
- Sample ratio mismatch (SRM)

Output execution plan and monitoring setup.`,
      messages: [
        {
          role: 'user',
          content: `Plan experiment execution for:

Project: ${args.projectName}
Experiment Design: ${JSON.stringify(args.experimentDesign, null, 2)}
Measurement Plan: ${JSON.stringify(args.measurementPlan, null, 2)}
Implementation: ${JSON.stringify(args.implementation, null, 2)}
Duration: ${args.duration} days

Provide execution and monitoring plan.`
        }
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        deploymentPlan: { type: 'string' },
        monitoringDashboard: { type: 'array', items: { type: 'string' } },
        dataQualityChecks: { type: 'array', items: { type: 'string' } },
        earlyStoppingCriteria: { type: 'string' },
        incidentResponse: { type: 'string' },
        checkpoints: { type: 'array', items: { type: 'string' } }
      },
      required: ['deploymentPlan', 'monitoringDashboard', 'dataQualityChecks']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hypothesis-driven', 'execution']
}));

/**
 * Task: Analyze Results
 * Perform statistical analysis and qualitative assessment
 */
export const analyzeResultsTask = defineTask('analyze-results', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze results: ${args.projectName}`,
  agent: {
    name: 'results-analyzer',
    prompt: {
      system: `You are a data scientist specializing in A/B test analysis.

Perform rigorous statistical analysis:
1. Primary metric analysis (t-test, z-test, etc.)
2. Secondary metrics analysis
3. Counter metrics check
4. Statistical significance calculation
5. Confidence intervals
6. Effect size estimation
7. Segment analysis
8. Qualitative feedback synthesis

Check for:
- Sample ratio mismatch
- Novelty effects
- Simpson's paradox
- Multiple testing issues

Determine: Is hypothesis validated? Is result statistically significant?

Output comprehensive analysis.`,
      messages: [
        {
          role: 'user',
          content: `Analyze experiment results for:

Project: ${args.projectName}
Hypothesis: ${JSON.stringify(args.hypothesis, null, 2)}
Experiment Design: ${JSON.stringify(args.experimentDesign, null, 2)}
Measurement Plan: ${JSON.stringify(args.measurementPlan, null, 2)}
${args.experimentExecution ? `Experiment Data: ${JSON.stringify(args.experimentExecution, null, 2)}` : ''}
Significance Level: ${args.significanceLevel}
${args.skipImplementation ? 'NOTE: This is a planning/simulation analysis' : ''}

Provide complete statistical analysis and hypothesis validation.`
        }
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        hypothesisValidated: { type: 'boolean' },
        statisticallySignificant: { type: 'boolean' },
        primaryMetricResults: {
          type: 'object',
          properties: {
            controlMean: { type: 'number' },
            treatmentMean: { type: 'number' },
            relativeChange: { type: 'number' },
            pValue: { type: 'number' },
            confidenceInterval: { type: 'string' }
          }
        },
        secondaryMetricResults: { type: 'array', items: { type: 'object' } },
        counterMetricResults: { type: 'array', items: { type: 'object' } },
        segmentAnalysis: { type: 'array', items: { type: 'object' } },
        qualitativeFeedback: { type: 'string' },
        caveats: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      },
      required: ['hypothesisValidated', 'statisticallySignificant', 'primaryMetricResults']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hypothesis-driven', 'analysis']
}));

/**
 * Task: Make Decision
 * Decide: Persevere, Pivot, or Stop
 */
export const makeDecisionTask = defineTask('make-decision', (args, taskCtx) => ({
  kind: 'agent',
  title: `Make decision: ${args.projectName}`,
  agent: {
    name: 'decision-maker',
    prompt: {
      system: `You are a product decision-making expert following Lean Startup methodology.

Based on experiment results, recommend one of three decisions:

1. PERSEVERE - Hypothesis validated, continue building/scaling
2. PIVOT - Hypothesis partially validated or invalidated, change direction
3. STOP - Hypothesis invalidated, abandon this approach

Consider:
- Statistical significance
- Effect size (practical significance)
- Counter metrics
- Qualitative insights
- Resource constraints
- Strategic fit

Provide clear reasoning for the decision.`,
      messages: [
        {
          role: 'user',
          content: `Make decision for:

Project: ${args.projectName}
Hypothesis: ${JSON.stringify(args.hypothesis, null, 2)}
Analysis: ${JSON.stringify(args.analysis, null, 2)}
Experiment Design: ${JSON.stringify(args.experimentDesign, null, 2)}

Recommend: Persevere, Pivot, or Stop. Explain reasoning.`
        }
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        decision: { type: 'string', enum: ['PERSEVERE', 'PIVOT', 'STOP'] },
        reasoning: { type: 'string' },
        confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        nextSteps: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        alternativeOptions: { type: 'array', items: { type: 'string' } }
      },
      required: ['decision', 'reasoning', 'confidence', 'nextSteps']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hypothesis-driven', 'decision']
}));

/**
 * Task: Capture Learnings
 * Document learnings and formulate next hypothesis
 */
export const captureLearningsTask = defineTask('capture-learnings', (args, taskCtx) => ({
  kind: 'agent',
  title: `Capture learnings: ${args.projectName}`,
  agent: {
    name: 'learning-capturer',
    prompt: {
      system: `You are a knowledge management expert capturing experimental learnings.

Document:
1. What we learned about users/market
2. What assumptions were validated/invalidated
3. Unexpected discoveries
4. Updated mental models
5. Implications for product strategy
6. Next hypothesis to test

This is the learning loop - each experiment informs the next.

Also generate the next hypothesis based on learnings.`,
      messages: [
        {
          role: 'user',
          content: `Capture learnings from:

Project: ${args.projectName}
Original Hypothesis: ${JSON.stringify(args.hypothesis, null, 2)}
Analysis: ${JSON.stringify(args.analysis, null, 2)}
Decision: ${JSON.stringify(args.decision, null, 2)}
Experiment Design: ${JSON.stringify(args.experimentDesign, null, 2)}
Measurement Plan: ${JSON.stringify(args.measurementPlan, null, 2)}

Document learnings and propose next hypothesis.`
        }
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        keyLearnings: { type: 'array', items: { type: 'string' } },
        validatedAssumptions: { type: 'array', items: { type: 'string' } },
        invalidatedAssumptions: { type: 'array', items: { type: 'string' } },
        unexpectedDiscoveries: { type: 'array', items: { type: 'string' } },
        updatedBeliefs: { type: 'string' },
        strategicImplications: { type: 'array', items: { type: 'string' } },
        nextHypothesis: {
          type: 'object',
          properties: {
            statement: { type: 'string' },
            rationale: { type: 'string' },
            buildingOn: { type: 'string' }
          }
        }
      },
      required: ['keyLearnings', 'validatedAssumptions', 'invalidatedAssumptions', 'nextHypothesis']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hypothesis-driven', 'learning']
}));
