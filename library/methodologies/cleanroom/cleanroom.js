/**
 * @process methodologies/cleanroom
 * @description Cleanroom Software Engineering - Formal methods with statistical usage testing for certifiable reliability
 * @inputs { projectName: string, systemDescription: string, reliabilityTarget?: number, criticalComponents?: array, usageProfile?: string }
 * @outputs { success: boolean, specifications: object, implementation: object, verification: object, statisticalTests: object, certification: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Cleanroom Software Engineering Process
 *
 * Methodology: Harlan Mills and colleagues at IBM (1980s)
 *
 * Core Principles:
 * 1. Defect prevention over defect removal
 * 2. Formal mathematical specifications (Box Structures)
 * 3. Correctness verification through inspection (no unit testing by developers)
 * 4. Statistical usage testing based on operational profile
 * 5. Incremental development with statistical quality control
 * 6. Certifiable reliability (MTTF calculations)
 *
 * Box Structure Methodology:
 * - Black Box: External behavior (stimulus → response)
 * - State Box: State machine with transitions
 * - Clear Box: Procedural implementation
 *
 * Process Flow:
 * 1. Formal Specification - Mathematical specification using box structures
 * 2. Incremental Planning - Divide into small verifiable increments
 * 3. Design with Verification - Design + correctness verification via inspection
 * 4. Implementation - Code without unit testing (verification by inspection)
 * 5. Statistical Test Planning - Build operational usage model
 * 6. Statistical Testing - Test cases from usage probability distribution
 * 7. Certification - Calculate reliability metrics (MTTF, defect density)
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Project or system name
 * @param {string} inputs.systemDescription - Detailed description of the system to build
 * @param {number} inputs.reliabilityTarget - Target MTTF (Mean Time To Failure) in hours (default: 10000)
 * @param {Array<string>} inputs.criticalComponents - List of safety-critical components requiring formal verification
 * @param {string} inputs.usageProfile - Type of usage profile: 'typical-user' | 'worst-case' | 'mixed' (default: 'typical-user')
 * @param {number} inputs.incrementCount - Number of development increments (default: 5)
 * @param {boolean} inputs.includeProofOfCorrectness - Generate formal correctness proofs (default: true)
 * @param {number} inputs.statisticalConfidence - Confidence level for reliability (0-1, default: 0.95)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with formal specifications, verified implementation, and reliability certification
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    systemDescription,
    reliabilityTarget = 10000, // MTTF in hours
    criticalComponents = [],
    usageProfile = 'typical-user',
    incrementCount = 5,
    includeProofOfCorrectness = true,
    statisticalConfidence = 0.95
  } = inputs;

  // Validate inputs
  if (!projectName || !systemDescription) {
    throw new Error('projectName and systemDescription are required');
  }

  // ============================================================================
  // PHASE 1: FORMAL SPECIFICATION (Box Structure Methodology)
  // ============================================================================

  const specificationResult = await ctx.task(createFormalSpecificationTask, {
    projectName,
    systemDescription,
    criticalComponents,
    includeProofOfCorrectness
  });

  // Breakpoint: Review formal specifications
  await ctx.breakpoint({
    question: `Formal specifications complete for "${projectName}". Created ${specificationResult.blackBoxSpecs.length} black box specifications, ${specificationResult.stateBoxSpecs.length} state machines, and ${specificationResult.clearBoxSpecs.length} procedural specifications. Review mathematical specifications?`,
    title: 'Formal Specification Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/cleanroom/specifications/black-box-specs.md', format: 'markdown', label: 'Black Box Specifications' },
        { path: 'artifacts/cleanroom/specifications/state-box-specs.md', format: 'markdown', label: 'State Box Specifications' },
        { path: 'artifacts/cleanroom/specifications/clear-box-specs.md', format: 'markdown', label: 'Clear Box Specifications' },
        { path: 'artifacts/cleanroom/specifications/formal-notation.json', format: 'json', label: 'Formal Notation Details' }
      ]
    }
  });

  // ============================================================================
  // PHASE 2: INCREMENTAL DEVELOPMENT PLANNING
  // ============================================================================

  const incrementPlanResult = await ctx.task(planIncrementsTask, {
    projectName,
    specifications: specificationResult,
    incrementCount,
    criticalComponents
  });

  // Breakpoint: Review increment plan
  await ctx.breakpoint({
    question: `Incremental development plan created with ${incrementPlanResult.increments.length} increments. Each increment adds verifiable functionality. Critical components: ${criticalComponents.length > 0 ? criticalComponents.join(', ') : 'none specified'}. Approve increment strategy?`,
    title: 'Increment Plan Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/cleanroom/planning/increment-plan.md', format: 'markdown', label: 'Increment Plan' },
        { path: 'artifacts/cleanroom/planning/increments.json', format: 'json', label: 'Increment Details' }
      ]
    }
  });

  // ============================================================================
  // PHASE 3: INCREMENTAL DEVELOPMENT CYCLES
  // ============================================================================

  const developmentResults = [];
  let cumulativeCode = [];

  for (let i = 0; i < incrementPlanResult.increments.length; i++) {
    const increment = incrementPlanResult.increments[i];
    const incrementNumber = i + 1;

    // -------------------------------------------------------------------------
    // Step 3a: Design with Correctness Verification
    // -------------------------------------------------------------------------

    const designResult = await ctx.task(designWithVerificationTask, {
      projectName,
      increment,
      incrementNumber,
      specifications: specificationResult,
      previousIncrements: developmentResults,
      includeProofOfCorrectness
    });

    // Correctness verification review (critical step in Cleanroom)
    await ctx.breakpoint({
      question: `Increment ${incrementNumber} design complete. Correctness verification ${designResult.verificationPassed ? 'PASSED' : 'FAILED'}. ${designResult.verificationIssues.length} issues found. ${designResult.proofsGenerated} formal proofs generated. Review design and verification?`,
      title: `Increment ${incrementNumber} - Design Verification`,
      context: {
        runId: ctx.runId,
        files: [
          { path: `artifacts/cleanroom/increment-${incrementNumber}/design.md`, format: 'markdown', label: 'Design Document' },
          { path: `artifacts/cleanroom/increment-${incrementNumber}/verification-report.md`, format: 'markdown', label: 'Verification Report' },
          { path: `artifacts/cleanroom/increment-${incrementNumber}/correctness-proofs.md`, format: 'markdown', label: 'Correctness Proofs' }
        ]
      }
    });

    // If verification failed, must fix before proceeding
    if (!designResult.verificationPassed) {
      const fixedDesignResult = await ctx.task(fixDesignTask, {
        projectName,
        increment,
        incrementNumber,
        designResult,
        verificationIssues: designResult.verificationIssues
      });

      designResult.design = fixedDesignResult.design;
      designResult.verificationPassed = fixedDesignResult.verificationPassed;
    }

    // -------------------------------------------------------------------------
    // Step 3b: Implementation (NO UNIT TESTING BY DEVELOPERS)
    // -------------------------------------------------------------------------

    const implementationResult = await ctx.task(implementIncrementTask, {
      projectName,
      increment,
      incrementNumber,
      design: designResult,
      specifications: specificationResult,
      cumulativeCode
    });

    // -------------------------------------------------------------------------
    // Step 3c: Code Inspection (Replaces Unit Testing)
    // -------------------------------------------------------------------------

    const inspectionResult = await ctx.task(codeInspectionTask, {
      projectName,
      increment,
      incrementNumber,
      implementation: implementationResult,
      design: designResult,
      specifications: specificationResult
    });

    // Code inspection review
    await ctx.breakpoint({
      question: `Increment ${incrementNumber} code inspection complete. ${inspectionResult.defectsFound} defects found during inspection. Inspection score: ${inspectionResult.inspectionScore}/100. Critical defects: ${inspectionResult.criticalDefects}. Review inspection findings?`,
      title: `Increment ${incrementNumber} - Code Inspection`,
      context: {
        runId: ctx.runId,
        files: [
          { path: `artifacts/cleanroom/increment-${incrementNumber}/implementation.md`, format: 'markdown', label: 'Implementation' },
          { path: `artifacts/cleanroom/increment-${incrementNumber}/inspection-report.md`, format: 'markdown', label: 'Inspection Report' },
          { path: `artifacts/cleanroom/increment-${incrementNumber}/defect-log.json`, format: 'json', label: 'Defect Log' }
        ]
      }
    });

    // Fix critical defects found in inspection
    if (inspectionResult.criticalDefects > 0) {
      const fixedImplementation = await ctx.task(fixImplementationTask, {
        projectName,
        increment,
        incrementNumber,
        implementation: implementationResult,
        defects: inspectionResult.defects.filter(d => d.severity === 'critical')
      });

      implementationResult.code = fixedImplementation.code;
    }

    // Update cumulative code
    cumulativeCode.push(...implementationResult.modules);

    // Store increment result
    developmentResults.push({
      incrementNumber,
      increment,
      design: designResult,
      implementation: implementationResult,
      inspection: inspectionResult
    });

    // Progress checkpoint
    await ctx.breakpoint({
      question: `Increment ${incrementNumber}/${incrementPlanResult.increments.length} complete. ${implementationResult.linesOfCode} lines of code added. Cumulative: ${cumulativeCode.reduce((sum, m) => sum + m.linesOfCode, 0)} LOC. Continue to next increment?`,
      title: `Increment ${incrementNumber} Complete`,
      context: {
        runId: ctx.runId,
        files: [
          { path: `artifacts/cleanroom/increment-${incrementNumber}/summary.md`, format: 'markdown', label: 'Increment Summary' },
          { path: 'artifacts/cleanroom/progress/cumulative-progress.json', format: 'json', label: 'Cumulative Progress' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 4: STATISTICAL TEST PLANNING (Usage Modeling)
  // ============================================================================

  const usageModelResult = await ctx.task(createUsageModelTask, {
    projectName,
    systemDescription,
    specifications: specificationResult,
    usageProfile,
    developmentResults
  });

  // Breakpoint: Review usage model
  await ctx.breakpoint({
    question: `Usage model complete. Identified ${usageModelResult.usageScenarios.length} usage scenarios with probability distribution. Most common scenario: "${usageModelResult.mostCommonScenario.name}" (${(usageModelResult.mostCommonScenario.probability * 100).toFixed(1)}% probability). Review operational profile?`,
    title: 'Usage Model Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/cleanroom/testing/usage-model.md', format: 'markdown', label: 'Usage Model' },
        { path: 'artifacts/cleanroom/testing/usage-scenarios.json', format: 'json', label: 'Usage Scenarios' },
        { path: 'artifacts/cleanroom/testing/probability-distribution.md', format: 'markdown', label: 'Probability Distribution' }
      ]
    }
  });

  // ============================================================================
  // PHASE 5: STATISTICAL TEST CASE GENERATION
  // ============================================================================

  const testGenerationResult = await ctx.task(generateStatisticalTestsTask, {
    projectName,
    usageModel: usageModelResult,
    reliabilityTarget,
    statisticalConfidence,
    specifications: specificationResult
  });

  // Breakpoint: Review test plan
  await ctx.breakpoint({
    question: `Statistical test plan generated. ${testGenerationResult.testCases.length} test cases generated from usage model. Tests distributed according to operational profile. Confidence level: ${(statisticalConfidence * 100)}%. Approve test plan?`,
    title: 'Statistical Test Plan Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/cleanroom/testing/test-plan.md', format: 'markdown', label: 'Statistical Test Plan' },
        { path: 'artifacts/cleanroom/testing/test-cases.json', format: 'json', label: 'Test Cases' },
        { path: 'artifacts/cleanroom/testing/test-distribution.md', format: 'markdown', label: 'Test Distribution' }
      ]
    }
  });

  // ============================================================================
  // PHASE 6: STATISTICAL TESTING EXECUTION
  // ============================================================================

  const testExecutionResult = await ctx.task(executeStatisticalTestsTask, {
    projectName,
    testCases: testGenerationResult.testCases,
    implementation: cumulativeCode,
    usageModel: usageModelResult,
    statisticalConfidence
  });

  // Analyze test results for reliability metrics
  const reliabilityAnalysisResult = await ctx.task(analyzeReliabilityTask, {
    projectName,
    testExecution: testExecutionResult,
    usageModel: usageModelResult,
    reliabilityTarget,
    statisticalConfidence
  });

  // Breakpoint: Review test results
  await ctx.breakpoint({
    question: `Statistical testing complete. ${testExecutionResult.testsPassed}/${testExecutionResult.totalTests} tests passed. ${testExecutionResult.defectsFound} defects discovered. Estimated MTTF: ${reliabilityAnalysisResult.estimatedMTTF.toFixed(0)} hours (target: ${reliabilityTarget} hours). ${reliabilityAnalysisResult.targetMet ? 'TARGET MET ✓' : 'TARGET NOT MET ✗'}. Review results?`,
    title: 'Statistical Testing Results',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/cleanroom/testing/execution-report.md', format: 'markdown', label: 'Test Execution Report' },
        { path: 'artifacts/cleanroom/testing/defect-analysis.json', format: 'json', label: 'Defect Analysis' },
        { path: 'artifacts/cleanroom/testing/reliability-metrics.md', format: 'markdown', label: 'Reliability Metrics' }
      ]
    }
  });

  // If reliability target not met, offer to run more tests or fix defects
  if (!reliabilityAnalysisResult.targetMet) {
    await ctx.breakpoint({
      question: `Reliability target not met (${reliabilityAnalysisResult.estimatedMTTF.toFixed(0)} hours vs ${reliabilityTarget} hours target). Options: (1) Fix discovered defects and retest, (2) Run additional test cases, (3) Accept current reliability, or (4) Re-engineer problematic components. What action should be taken?`,
      title: 'Reliability Target Not Met',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/cleanroom/testing/defect-analysis.json', format: 'json', label: 'Defect Analysis' },
          { path: 'artifacts/cleanroom/testing/reliability-gap-analysis.md', format: 'markdown', label: 'Gap Analysis' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 7: CERTIFICATION (Reliability Documentation)
  // ============================================================================

  const certificationResult = await ctx.task(generateCertificationTask, {
    projectName,
    specifications: specificationResult,
    developmentResults,
    usageModel: usageModelResult,
    testExecution: testExecutionResult,
    reliabilityAnalysis: reliabilityAnalysisResult,
    reliabilityTarget,
    statisticalConfidence
  });

  // Final certification breakpoint
  await ctx.breakpoint({
    question: `Cleanroom Software Engineering process complete for "${projectName}". Reliability certification ${reliabilityAnalysisResult.targetMet ? 'PASSED' : 'CONDITIONAL'}. Estimated MTTF: ${reliabilityAnalysisResult.estimatedMTTF.toFixed(0)} hours. Defect density: ${certificationResult.defectDensity.toFixed(3)} defects/KLOC. Certification confidence: ${(statisticalConfidence * 100)}%. Review final certification?`,
    title: 'Cleanroom Certification Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/cleanroom/certification/certification-report.md', format: 'markdown', label: 'Certification Report' },
        { path: 'artifacts/cleanroom/certification/reliability-certificate.md', format: 'markdown', label: 'Reliability Certificate' },
        { path: 'artifacts/cleanroom/certification/quality-metrics.json', format: 'json', label: 'Quality Metrics' },
        { path: 'artifacts/cleanroom/SUMMARY.md', format: 'markdown', label: 'Process Summary' }
      ]
    }
  });

  // ============================================================================
  // RETURN FINAL RESULTS
  // ============================================================================

  return {
    success: reliabilityAnalysisResult.targetMet,
    projectName,
    reliabilityTarget,
    specifications: {
      blackBoxSpecs: specificationResult.blackBoxSpecs,
      stateBoxSpecs: specificationResult.stateBoxSpecs,
      clearBoxSpecs: specificationResult.clearBoxSpecs,
      totalSpecifications: specificationResult.blackBoxSpecs.length +
                          specificationResult.stateBoxSpecs.length +
                          specificationResult.clearBoxSpecs.length
    },
    incrementalDevelopment: {
      totalIncrements: incrementPlanResult.increments.length,
      increments: developmentResults.map(r => ({
        incrementNumber: r.incrementNumber,
        linesOfCode: r.implementation.linesOfCode,
        verificationPassed: r.design.verificationPassed,
        defectsFound: r.inspection.defectsFound,
        inspectionScore: r.inspection.inspectionScore
      })),
      totalLinesOfCode: cumulativeCode.reduce((sum, m) => sum + m.linesOfCode, 0),
      totalDefectsFound: developmentResults.reduce((sum, r) => sum + r.inspection.defectsFound, 0)
    },
    verification: {
      designVerificationPassed: developmentResults.every(r => r.design.verificationPassed),
      totalProofsGenerated: developmentResults.reduce((sum, r) => sum + r.design.proofsGenerated, 0),
      totalInspections: developmentResults.length,
      averageInspectionScore: developmentResults.reduce((sum, r) => sum + r.inspection.inspectionScore, 0) / developmentResults.length
    },
    statisticalTesting: {
      usageScenarios: usageModelResult.usageScenarios.length,
      testCasesGenerated: testGenerationResult.testCases.length,
      testCasesExecuted: testExecutionResult.totalTests,
      testsPassed: testExecutionResult.testsPassed,
      testsFailed: testExecutionResult.testsFailed,
      defectsFound: testExecutionResult.defectsFound
    },
    certification: {
      certified: reliabilityAnalysisResult.targetMet,
      estimatedMTTF: reliabilityAnalysisResult.estimatedMTTF,
      reliabilityTarget,
      confidenceLevel: statisticalConfidence,
      defectDensity: certificationResult.defectDensity,
      qualityScore: certificationResult.qualityScore
    },
    artifacts: {
      specifications: 'artifacts/cleanroom/specifications/',
      incrementPlanning: 'artifacts/cleanroom/planning/',
      increments: developmentResults.map((_, i) => `artifacts/cleanroom/increment-${i + 1}/`),
      testing: 'artifacts/cleanroom/testing/',
      certification: 'artifacts/cleanroom/certification/',
      summary: 'artifacts/cleanroom/SUMMARY.md'
    },
    metadata: {
      processId: 'methodologies/cleanroom',
      methodology: 'Cleanroom Software Engineering',
      timestamp: ctx.now(),
      noUnitTestingByDevelopers: true,
      formalMethods: true,
      statisticalTesting: true
    }
  };
}

// ============================================================================
// TASK DEFINITIONS (ALL INLINE - NO SEPARATE TASKS/ DIRECTORY)
// ============================================================================

/**
 * Task: Create Formal Specification
 *
 * Generate mathematical specifications using Box Structure methodology:
 * - Black Box: External behavior (stimulus → response)
 * - State Box: State machine with state transitions
 * - Clear Box: Procedural implementation details
 */
export const createFormalSpecificationTask = defineTask('create-formal-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create formal specifications: ${args.projectName}`,
  description: 'Generate mathematical specifications using Box Structure methodology',

  agent: {
    name: 'formal-specification-engineer',
    prompt: {
      role: 'Cleanroom software engineer specializing in formal methods',
      task: 'Create formal mathematical specifications using Box Structure methodology (Black Box, State Box, Clear Box)',
      context: {
        projectName: args.projectName,
        systemDescription: args.systemDescription,
        criticalComponents: args.criticalComponents,
        includeProofOfCorrectness: args.includeProofOfCorrectness
      },
      instructions: [
        'Analyze system description and identify major components/functions',
        'For each component, create Box Structure specifications:',
        '  1. BLACK BOX: External behavior - define stimulus-response mapping',
        '     - Inputs (stimuli) with preconditions',
        '     - Outputs (responses) with postconditions',
        '     - Invariants that must always hold',
        '     - Use mathematical notation (set theory, logic, functions)',
        '  2. STATE BOX: State machine specification',
        '     - Define state variables and their domains',
        '     - State transition function',
        '     - Initial state',
        '     - State invariants',
        '  3. CLEAR BOX: Procedural refinement',
        '     - Algorithm specification',
        '     - Data structures',
        '     - Control flow (sequence, selection, iteration)',
        '     - Refinement of black box into implementable procedures',
        'Use formal notation: set notation, predicate logic, function notation',
        'Define preconditions and postconditions for all operations',
        'Specify invariants that must hold throughout execution',
        'For critical components, include formal proof obligations',
        'Ensure specifications are unambiguous and complete',
        'Trace each clear box back to its state box and black box'
      ],
      outputFormat: 'JSON with black box, state box, and clear box specifications using formal notation'
    },
    outputSchema: {
      type: 'object',
      required: ['blackBoxSpecs', 'stateBoxSpecs', 'clearBoxSpecs'],
      properties: {
        blackBoxSpecs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              componentName: { type: 'string' },
              stimuli: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string' },
                    precondition: { type: 'string' }
                  }
                }
              },
              responses: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string' },
                    postcondition: { type: 'string' }
                  }
                }
              },
              invariants: { type: 'array', items: { type: 'string' } },
              formalNotation: { type: 'string' }
            }
          }
        },
        stateBoxSpecs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              componentName: { type: 'string' },
              stateVariables: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    domain: { type: 'string' },
                    initialValue: { type: 'string' }
                  }
                }
              },
              transitions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    fromState: { type: 'string' },
                    stimulus: { type: 'string' },
                    toState: { type: 'string' },
                    guard: { type: 'string' },
                    action: { type: 'string' }
                  }
                }
              },
              stateInvariants: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        clearBoxSpecs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              componentName: { type: 'string' },
              algorithm: { type: 'string' },
              dataStructures: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    structure: { type: 'string' }
                  }
                }
              },
              procedures: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    precondition: { type: 'string' },
                    postcondition: { type: 'string' },
                    steps: { type: 'array', items: { type: 'string' } }
                  }
                }
              },
              refinementTrace: { type: 'string' }
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

  labels: ['agent', 'cleanroom', 'formal-specification', 'box-structures']
}));

/**
 * Task: Plan Incremental Development
 *
 * Divide system into small, verifiable increments
 */
export const planIncrementsTask = defineTask('plan-increments', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plan incremental development: ${args.projectName}`,
  description: 'Divide system into small verifiable increments',

  agent: {
    name: 'increment-planner',
    prompt: {
      role: 'Cleanroom development planner',
      task: 'Divide system into small, independently verifiable increments',
      context: {
        projectName: args.projectName,
        specifications: args.specifications,
        incrementCount: args.incrementCount,
        criticalComponents: args.criticalComponents
      },
      instructions: [
        'Analyze formal specifications to understand system structure',
        `Plan ${args.incrementCount} development increments`,
        'Each increment should:',
        '  - Be small and verifiable (aim for < 500 LOC per increment)',
        '  - Add one cohesive piece of functionality',
        '  - Build on previous increments',
        '  - Be independently testable',
        '  - Have clear verification criteria',
        'Prioritize critical components early',
        'Order increments by dependency (foundational → higher-level)',
        'Define verification criteria for each increment',
        'Estimate size (LOC) for each increment',
        'Identify which specifications each increment implements'
      ],
      outputFormat: 'JSON with increment plan and verification criteria'
    },
    outputSchema: {
      type: 'object',
      required: ['increments'],
      properties: {
        increments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              incrementNumber: { type: 'number' },
              name: { type: 'string' },
              description: { type: 'string' },
              specifications: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'number' } },
              estimatedLOC: { type: 'number' },
              verificationCriteria: { type: 'array', items: { type: 'string' } },
              criticalComponent: { type: 'boolean' }
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

  labels: ['agent', 'cleanroom', 'increment-planning']
}));

/**
 * Task: Design with Correctness Verification
 *
 * Design increment and verify correctness through formal inspection
 */
export const designWithVerificationTask = defineTask('design-with-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design increment ${args.incrementNumber} with verification`,
  description: 'Design and formally verify correctness',

  agent: {
    name: 'design-verifier',
    prompt: {
      role: 'Cleanroom design engineer with formal verification expertise',
      task: 'Design increment and verify correctness through mathematical reasoning',
      context: {
        projectName: args.projectName,
        increment: args.increment,
        incrementNumber: args.incrementNumber,
        specifications: args.specifications,
        previousIncrements: args.previousIncrements,
        includeProofOfCorrectness: args.includeProofOfCorrectness
      },
      instructions: [
        'Design the increment based on formal specifications',
        'Create detailed design showing:',
        '  - Module structure and interfaces',
        '  - Data structures',
        '  - Algorithms and control flow',
        '  - Integration with previous increments',
        'Perform correctness verification through inspection:',
        '  - Verify design satisfies specifications',
        '  - Check preconditions and postconditions',
        '  - Verify invariants are maintained',
        '  - Trace design back to specifications',
        args.includeProofOfCorrectness ? '  - Generate formal correctness proofs (constructive proofs)' : '',
        '  - Identify any gaps or inconsistencies',
        'Use structured inspection methodology',
        'Document verification reasoning',
        'Report verification status: passed/failed',
        'List any issues found during verification',
        'CRITICAL: No implementation yet - design verification only'
      ],
      outputFormat: 'JSON with design and verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'verificationPassed', 'verificationIssues', 'proofsGenerated'],
      properties: {
        design: {
          type: 'object',
          properties: {
            modules: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  purpose: { type: 'string' },
                  interfaces: { type: 'array', items: { type: 'string' } },
                  dataStructures: { type: 'array', items: { type: 'string' } },
                  algorithms: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            controlFlow: { type: 'string' },
            integrationPoints: { type: 'array', items: { type: 'string' } }
          }
        },
        verificationPassed: { type: 'boolean' },
        verificationIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              description: { type: 'string' },
              location: { type: 'string' }
            }
          }
        },
        proofsGenerated: { type: 'number' },
        correctnessProofs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              theorem: { type: 'string' },
              proof: { type: 'string' },
              verified: { type: 'boolean' }
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

  labels: ['agent', 'cleanroom', 'design', 'verification', `increment-${args.incrementNumber}`]
}));

/**
 * Task: Fix Design Issues
 *
 * Correct design issues found during verification
 */
export const fixDesignTask = defineTask('fix-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix design issues in increment ${args.incrementNumber}`,
  description: 'Correct verification issues in design',

  agent: {
    name: 'design-fixer',
    prompt: {
      role: 'Cleanroom design engineer',
      task: 'Fix design issues identified during correctness verification',
      context: {
        projectName: args.projectName,
        increment: args.increment,
        incrementNumber: args.incrementNumber,
        designResult: args.designResult,
        verificationIssues: args.verificationIssues
      },
      instructions: [
        'Review each verification issue',
        'Correct design to address issues:',
        '  - Fix specification mismatches',
        '  - Correct invariant violations',
        '  - Resolve precondition/postcondition issues',
        '  - Address any logical errors',
        'Re-verify corrected design',
        'Ensure fixes maintain correctness',
        'Document corrections made'
      ],
      outputFormat: 'JSON with corrected design and verification status'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'verificationPassed'],
      properties: {
        design: { type: 'object' },
        verificationPassed: { type: 'boolean' },
        correctionsMade: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'cleanroom', 'design-fix', `increment-${args.incrementNumber}`]
}));

/**
 * Task: Implement Increment
 *
 * Code implementation without unit testing (Cleanroom principle)
 */
export const implementIncrementTask = defineTask('implement-increment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement increment ${args.incrementNumber}`,
  description: 'Implement code based on verified design (no unit testing)',

  agent: {
    name: 'cleanroom-implementer',
    prompt: {
      role: 'Cleanroom software developer',
      task: 'Implement code from verified design WITHOUT writing or running unit tests',
      context: {
        projectName: args.projectName,
        increment: args.increment,
        incrementNumber: args.incrementNumber,
        design: args.design,
        specifications: args.specifications,
        cumulativeCode: args.cumulativeCode
      },
      instructions: [
        'CRITICAL: DO NOT write or run unit tests - this violates Cleanroom methodology',
        'Implement code directly from verified design',
        'Write clean, readable code that matches design exactly',
        'Follow specifications precisely',
        'Include precondition/postcondition assertions in code comments',
        'Document invariants',
        'Use defensive programming (assert preconditions)',
        'Keep modules small and focused',
        'Integrate with previous increments',
        'Self-review code mentally against specifications',
        'Code should be obvious and simple',
        'Avoid clever tricks - prefer clarity',
        'Trust the design verification - implement faithfully',
        'Document any implementation decisions'
      ],
      outputFormat: 'JSON with implementation code and metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['modules', 'linesOfCode'],
      properties: {
        modules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              filePath: { type: 'string' },
              code: { type: 'string' },
              linesOfCode: { type: 'number' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        linesOfCode: { type: 'number' },
        implementationNotes: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'cleanroom', 'implementation', `increment-${args.incrementNumber}`]
}));

/**
 * Task: Code Inspection
 *
 * Formal code inspection replacing unit testing
 */
export const codeInspectionTask = defineTask('code-inspection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Code inspection for increment ${args.incrementNumber}`,
  description: 'Formal inspection to verify implementation correctness',

  agent: {
    name: 'code-inspector',
    prompt: {
      role: 'Cleanroom code inspector',
      task: 'Perform formal code inspection to verify implementation matches design and specifications',
      context: {
        projectName: args.projectName,
        increment: args.increment,
        incrementNumber: args.incrementNumber,
        implementation: args.implementation,
        design: args.design,
        specifications: args.specifications
      },
      instructions: [
        'Conduct formal code inspection (NOT unit testing)',
        'Verify implementation against design:',
        '  - Check all design elements are implemented',
        '  - Verify algorithms match design',
        '  - Check data structures are correct',
        '  - Verify control flow matches design',
        'Verify implementation against specifications:',
        '  - Check preconditions are enforced',
        '  - Verify postconditions are achieved',
        '  - Check invariants are maintained',
        '  - Trace code back to specifications',
        'Look for common defects:',
        '  - Off-by-one errors',
        '  - Null pointer issues',
        '  - Resource leaks',
        '  - Logic errors',
        '  - Boundary condition errors',
        'Check code quality:',
        '  - Readability and clarity',
        '  - Proper error handling',
        '  - Adequate documentation',
        'Classify defects by severity: critical/major/minor',
        'Generate inspection score (0-100)',
        'List all defects found with locations'
      ],
      outputFormat: 'JSON with inspection results and defects'
    },
    outputSchema: {
      type: 'object',
      required: ['defectsFound', 'criticalDefects', 'inspectionScore'],
      properties: {
        defectsFound: { type: 'number' },
        criticalDefects: { type: 'number' },
        majorDefects: { type: 'number' },
        minorDefects: { type: 'number' },
        inspectionScore: { type: 'number' },
        defects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              type: { type: 'string' },
              description: { type: 'string' },
              location: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        designConformance: { type: 'boolean' },
        specificationConformance: { type: 'boolean' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'cleanroom', 'inspection', `increment-${args.incrementNumber}`]
}));

/**
 * Task: Fix Implementation
 *
 * Fix critical defects found during inspection
 */
export const fixImplementationTask = defineTask('fix-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix critical defects in increment ${args.incrementNumber}`,
  description: 'Correct critical defects found during code inspection',

  agent: {
    name: 'implementation-fixer',
    prompt: {
      role: 'Cleanroom developer',
      task: 'Fix critical defects identified during code inspection',
      context: {
        projectName: args.projectName,
        increment: args.increment,
        incrementNumber: args.incrementNumber,
        implementation: args.implementation,
        defects: args.defects
      },
      instructions: [
        'Review each critical defect',
        'Fix defects carefully:',
        '  - Understand root cause',
        '  - Implement minimal fix',
        '  - Verify fix maintains correctness',
        '  - Ensure no new defects introduced',
        'Still NO unit testing - fix based on reasoning',
        'Document fixes made',
        'Re-inspect fixed code mentally'
      ],
      outputFormat: 'JSON with fixed code'
    },
    outputSchema: {
      type: 'object',
      required: ['code'],
      properties: {
        code: { type: 'string' },
        fixesApplied: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'cleanroom', 'fix', `increment-${args.incrementNumber}`]
}));

/**
 * Task: Create Usage Model
 *
 * Build operational profile showing how users will use the system
 */
export const createUsageModelTask = defineTask('create-usage-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create usage model: ${args.projectName}`,
  description: 'Build operational profile with probability distribution',

  agent: {
    name: 'usage-modeler',
    prompt: {
      role: 'Cleanroom statistical testing analyst',
      task: 'Create operational usage model showing how users will interact with system',
      context: {
        projectName: args.projectName,
        systemDescription: args.systemDescription,
        specifications: args.specifications,
        usageProfile: args.usageProfile,
        developmentResults: args.developmentResults
      },
      instructions: [
        'Identify all user interactions and usage scenarios',
        'Define operational profile:',
        '  - List all possible usage scenarios',
        '  - Assign probability to each scenario (based on expected usage)',
        '  - Consider typical user behavior',
        args.usageProfile === 'worst-case' ? '  - Focus on error cases and edge conditions' : '',
        args.usageProfile === 'mixed' ? '  - Balance typical and worst-case scenarios' : '',
        'Create usage probability distribution',
        'Most common operations should have highest probability',
        'Include error scenarios and edge cases (with appropriate probability)',
        'Define state transitions in usage',
        'Specify input domains for each scenario',
        'Ensure probabilities sum to 1.0',
        'Model realistic operational usage patterns',
        'Consider different user types if applicable'
      ],
      outputFormat: 'JSON with usage scenarios and probability distribution'
    },
    outputSchema: {
      type: 'object',
      required: ['usageScenarios', 'mostCommonScenario'],
      properties: {
        usageScenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              probability: { type: 'number' },
              inputs: { type: 'array', items: { type: 'string' } },
              expectedOutcome: { type: 'string' },
              scenarioType: { type: 'string', enum: ['normal', 'error', 'edge'] }
            }
          }
        },
        mostCommonScenario: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            probability: { type: 'number' }
          }
        },
        totalProbability: { type: 'number' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'cleanroom', 'usage-model', 'statistical-testing']
}));

/**
 * Task: Generate Statistical Test Cases
 *
 * Generate test cases from usage model probability distribution
 */
export const generateStatisticalTestsTask = defineTask('generate-statistical-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate statistical test cases: ${args.projectName}`,
  description: 'Generate test cases based on usage probability distribution',

  agent: {
    name: 'statistical-test-generator',
    prompt: {
      role: 'Cleanroom statistical test designer',
      task: 'Generate test cases from operational profile using probability distribution',
      context: {
        projectName: args.projectName,
        usageModel: args.usageModel,
        reliabilityTarget: args.reliabilityTarget,
        statisticalConfidence: args.statisticalConfidence,
        specifications: args.specifications
      },
      instructions: [
        'Generate test cases from usage model',
        'Test case distribution must match usage probability:',
        '  - More test cases for high-probability scenarios',
        '  - Fewer test cases for low-probability scenarios',
        '  - Proportion of tests matches operational profile',
        'Generate enough test cases for statistical validity',
        `  - Target confidence level: ${args.statisticalConfidence}`,
        `  - Reliability target: ${args.reliabilityTarget} hours MTTF`,
        'For each test case:',
        '  - Select scenario from usage model (weighted by probability)',
        '  - Generate specific input values',
        '  - Define expected outcome',
        '  - Specify pass/fail criteria',
        'Use random sampling from probability distribution',
        'Ensure input space coverage within each scenario',
        'Include boundary values where appropriate',
        'Generate execution sequences (state transitions)',
        'Calculate minimum test cases needed for confidence level'
      ],
      outputFormat: 'JSON with test cases and distribution metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['testCases', 'distributionMetrics'],
      properties: {
        testCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              scenarioId: { type: 'string' },
              scenarioName: { type: 'string' },
              inputs: { type: 'object' },
              expectedOutcome: { type: 'string' },
              passCriteria: { type: 'string' },
              executionSequence: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        distributionMetrics: {
          type: 'object',
          properties: {
            totalTestCases: { type: 'number' },
            scenarioDistribution: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  scenarioName: { type: 'string' },
                  probability: { type: 'number' },
                  testCaseCount: { type: 'number' }
                }
              }
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

  labels: ['agent', 'cleanroom', 'test-generation', 'statistical-testing']
}));

/**
 * Task: Execute Statistical Tests
 *
 * Run statistical test cases and collect failure data
 */
export const executeStatisticalTestsTask = defineTask('execute-statistical-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute statistical tests: ${args.projectName}`,
  description: 'Run statistical test suite and record results',

  agent: {
    name: 'statistical-test-executor',
    prompt: {
      role: 'Cleanroom test execution engineer',
      task: 'Execute statistical test cases and collect detailed results',
      context: {
        projectName: args.projectName,
        testCases: args.testCases,
        implementation: args.implementation,
        usageModel: args.usageModel,
        statisticalConfidence: args.statisticalConfidence
      },
      instructions: [
        'Execute all test cases in order',
        'Record detailed results for each test:',
        '  - Pass or fail',
        '  - Actual outcome vs expected',
        '  - Execution time',
        '  - Failure mode (if failed)',
        '  - Scenario type',
        'For failures:',
        '  - Classify defect type',
        '  - Record failure scenario',
        '  - Note failure probability (from usage model)',
        '  - Capture detailed failure information',
        'Track statistics:',
        '  - Total tests executed',
        '  - Tests passed',
        '  - Tests failed',
        '  - Failure rate',
        '  - Failures by scenario',
        'Maintain test independence',
        'Execute in random order to avoid bias',
        'Record all results for statistical analysis'
      ],
      outputFormat: 'JSON with test execution results and failure data'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTests', 'testsPassed', 'testsFailed', 'defectsFound'],
      properties: {
        totalTests: { type: 'number' },
        testsPassed: { type: 'number' },
        testsFailed: { type: 'number' },
        defectsFound: { type: 'number' },
        failures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testId: { type: 'string' },
              scenarioName: { type: 'string' },
              scenarioProbability: { type: 'number' },
              failureMode: { type: 'string' },
              defectType: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        failureRate: { type: 'number' },
        scenarioResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenarioName: { type: 'string' },
              testsRun: { type: 'number' },
              testsPassed: { type: 'number' },
              testsFailed: { type: 'number' }
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

  labels: ['agent', 'cleanroom', 'test-execution', 'statistical-testing']
}));

/**
 * Task: Analyze Reliability
 *
 * Calculate reliability metrics from statistical test results
 */
export const analyzeReliabilityTask = defineTask('analyze-reliability', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze reliability: ${args.projectName}`,
  description: 'Calculate MTTF and reliability metrics from test data',

  agent: {
    name: 'reliability-analyst',
    prompt: {
      role: 'Cleanroom reliability engineer and statistician',
      task: 'Calculate reliability metrics (MTTF, confidence intervals) from statistical test results',
      context: {
        projectName: args.projectName,
        testExecution: args.testExecution,
        usageModel: args.usageModel,
        reliabilityTarget: args.reliabilityTarget,
        statisticalConfidence: args.statisticalConfidence
      },
      instructions: [
        'Analyze test execution results statistically',
        'Calculate Mean Time To Failure (MTTF):',
        '  - Use failure rate and usage probabilities',
        '  - Weight failures by scenario probability',
        '  - Calculate based on operational profile',
        '  - Formula: MTTF = 1 / (weighted failure rate)',
        `Calculate confidence interval at ${args.statisticalConfidence} confidence level`,
        'Determine if reliability target is met:',
        `  - Target MTTF: ${args.reliabilityTarget} hours`,
        '  - Compare estimated MTTF to target',
        'Calculate additional metrics:',
        '  - Reliability function R(t)',
        '  - Failure intensity',
        '  - Defect density per KLOC',
        'Identify high-risk scenarios (high probability + failures)',
        'Analyze failure patterns',
        'Recommend actions if target not met'
      ],
      outputFormat: 'JSON with reliability metrics and analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['estimatedMTTF', 'targetMet', 'confidenceInterval'],
      properties: {
        estimatedMTTF: { type: 'number' },
        targetMet: { type: 'boolean' },
        confidenceInterval: {
          type: 'object',
          properties: {
            lower: { type: 'number' },
            upper: { type: 'number' },
            confidenceLevel: { type: 'number' }
          }
        },
        failureIntensity: { type: 'number' },
        reliabilityFunction: { type: 'string' },
        highRiskScenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenarioName: { type: 'string' },
              probability: { type: 'number' },
              failureRate: { type: 'number' },
              risk: { type: 'number' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'cleanroom', 'reliability-analysis', 'statistical-analysis']
}));

/**
 * Task: Generate Certification
 *
 * Create reliability certification documentation
 */
export const generateCertificationTask = defineTask('generate-certification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate certification: ${args.projectName}`,
  description: 'Create reliability certification and quality documentation',

  agent: {
    name: 'certification-documenter',
    prompt: {
      role: 'Cleanroom certification specialist',
      task: 'Generate comprehensive certification documentation with reliability guarantees',
      context: {
        projectName: args.projectName,
        specifications: args.specifications,
        developmentResults: args.developmentResults,
        usageModel: args.usageModel,
        testExecution: args.testExecution,
        reliabilityAnalysis: args.reliabilityAnalysis,
        reliabilityTarget: args.reliabilityTarget,
        statisticalConfidence: args.statisticalConfidence
      },
      instructions: [
        'Generate comprehensive certification report',
        'Include:',
        '  - Executive summary',
        '  - Formal specifications summary',
        '  - Incremental development summary',
        '  - Design verification results',
        '  - Code inspection results',
        '  - Statistical testing methodology',
        '  - Usage model description',
        '  - Test execution results',
        '  - Reliability metrics (MTTF, confidence intervals)',
        '  - Certification statement',
        'Calculate quality metrics:',
        '  - Defect density (defects per KLOC)',
        '  - Inspection effectiveness',
        '  - Verification coverage',
        '  - Overall quality score',
        'Provide certification statement:',
        `  - "This software has been developed using Cleanroom Software Engineering"`,
        `  - "Estimated MTTF: X hours at ${args.statisticalConfidence} confidence"`,
        '  - List any caveats or limitations',
        'Document all artifacts and deliverables',
        'Create traceability from specifications to certification'
      ],
      outputFormat: 'JSON with certification data and quality metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['certified', 'defectDensity', 'qualityScore'],
      properties: {
        certified: { type: 'boolean' },
        certificationStatement: { type: 'string' },
        defectDensity: { type: 'number' },
        qualityScore: { type: 'number' },
        metrics: {
          type: 'object',
          properties: {
            totalLOC: { type: 'number' },
            totalDefects: { type: 'number' },
            inspectionDefects: { type: 'number' },
            testingDefects: { type: 'number' },
            averageInspectionScore: { type: 'number' },
            verificationCoverage: { type: 'number' }
          }
        },
        limitations: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'cleanroom', 'certification', 'documentation']
}));
